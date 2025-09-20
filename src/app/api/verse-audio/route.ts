import { NextRequest, NextResponse } from 'next/server'

// Configuration
const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenUrl: process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4'
}

// Token cache for server-side requests
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  if (!QURAN_FOUNDATION_CONFIG.clientId || !QURAN_FOUNDATION_CONFIG.clientSecret) {
    console.log('❌ No credentials available for Quran Foundation API')
    return null
  }

  try {
    console.log('🔐 Attempting to get access token...')
    
    const credentials = Buffer.from(`${QURAN_FOUNDATION_CONFIG.clientId}:${QURAN_FOUNDATION_CONFIG.clientSecret}`).toString('base64')
    
    const response = await fetch(QURAN_FOUNDATION_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${credentials}`,
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'content',
      }),
    })
    
    if (response.ok) {
      const data = await response.json()
      const expiresAt = Date.now() + (data.expires_in * 1000) - 60000
      
      cachedToken = {
        token: data.access_token,
        expiresAt
      }
      
      return data.access_token
    }
  } catch (error) {
    console.error('❌ Failed to get access token:', error)
  }

  return null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const reciterId = searchParams.get('reciter')
  const chapterNumber = searchParams.get('chapter')
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '50'

  if (!reciterId || !chapterNumber) {
    return NextResponse.json({
      success: false,
      error: 'Missing required parameters: reciter and chapter'
    }, { status: 400 })
  }

  try {
    console.log(`🎵 Verse Audio: Getting audio for Reciter ${reciterId}, Chapter ${chapterNumber}`)
    
    // Try authenticated request to Quran Foundation
    const token = await getAccessToken()
    
    if (!token) {
      // Return public fallback for verse audio
      const mockAudioFiles = []
      const chapterNum = parseInt(chapterNumber)
      
      // Get the number of verses in this chapter (simplified mapping)
      const verseCounts: Record<number, number> = {
        1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
        11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135
      }
      const verseCount = verseCounts[chapterNum] || 20
      
      for (let verse = 1; verse <= Math.min(verseCount, 50); verse++) {
        const paddedChapter = chapterNumber.toString().padStart(3, '0')
        const paddedVerse = verse.toString().padStart(3, '0')
        
        // Map reciter IDs to EveryAyah.com folders
        const reciterMap: Record<string, string> = {
          '1': 'Abdul_Basit_Mujawwad_128kbps',
          '2': 'Abdul_Basit_Murattal_192kbps', 
          '3': 'Abdurrahmaan_As-Sudais_192kbps',
          '4': 'Abu_Bakr_Ash-Shaatri_128kbps',
          '5': 'Hani_Rifai_192kbps',
          '6': 'Khalil_Al-Husary_128kbps',
          '7': 'Alafasy_128kbps',
          '8': 'Siddiq_al-Minshawi_mujawwad_128kbps',
          '9': 'Mohamed_Siddiq_al-Minshawi_Murattal_128kbps',
          '10': 'Saud_ash-Shuraym_128kbps'
        }
        
        const reciterFolder = reciterMap[reciterId] || 'Alafasy_128kbps'
        
        mockAudioFiles.push({
          verse_key: `${chapterNum}:${verse}`,
          url: `https://everyayah.com/data/${reciterFolder}/${paddedChapter}${paddedVerse}.mp3`
        })
      }
      
      return NextResponse.json({
        success: true,
        source: 'public-fallback',
        message: 'Using public verse audio from EveryAyah.com',
        data: {
          audio_files: mockAudioFiles,
          pagination: {
            per_page: parseInt(perPage),
            current_page: parseInt(page),
            next_page: null,
            total_pages: 1,
            total_records: mockAudioFiles.length
          }
        }
      })
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      'x-client-id': QURAN_FOUNDATION_CONFIG.clientId
    }

    // Use the Quran Foundation API for verse-by-verse audio
    const apiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/recitations/${reciterId}/by_chapter/${chapterNumber}?page=${page}&per_page=${perPage}`
    
    const response = await fetch(apiUrl, { headers })

    if (response.ok) {
      const data = await response.json()
      
      // Process the audio files to ensure absolute URLs with fallback to reliable sources
      const processedAudioFiles = data.audio_files?.map((audioFile: any) => {
        let audioUrl = audioFile.url
        
        // Convert relative URLs to absolute URLs using the correct base URL
        if (!audioUrl.startsWith('http')) {
          if (audioUrl.startsWith('/')) {
            audioUrl = `https://download.quranicaudio.com${audioUrl}`
          } else {
            audioUrl = `https://download.quranicaudio.com/${audioUrl}`
          }
        }
        
        return {
          ...audioFile,
          url: audioUrl
        }
      }) || []
      
      return NextResponse.json({
        success: true,
        source: 'quran-foundation',
        data: {
          audio_files: processedAudioFiles,
          pagination: data.pagination
        }
      })
    }

    console.log(`❌ Quran Foundation API failed: ${response.status}`)
    
    // Fallback: Generate verse audio URLs using known working patterns
    const chapterNum = parseInt(chapterNumber)
    const fallbackAudioFiles = []
    
    // Get the number of verses in this chapter (simplified mapping for first 10 chapters)
    const verseCounts: Record<number, number> = {
      1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
      11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135
    }
    const verseCount = verseCounts[chapterNum] || 50 // Default to 50 if not in mapping
    
    for (let verse = 1; verse <= Math.min(verseCount, 100); verse++) {
      const paddedChapter = chapterNumber.toString().padStart(3, '0')
      const paddedVerse = verse.toString().padStart(3, '0')
      fallbackAudioFiles.push({
        verse_key: `${chapterNum}:${verse}`,
        url: `https://everyayah.com/data/Alafasy_64kbps/${paddedChapter}${paddedVerse}.mp3`
      })
    }
    
    return NextResponse.json({
      success: true,
      source: 'fallback-generation',
      message: 'Using generated verse audio URLs',
      data: {
        audio_files: fallbackAudioFiles,
        pagination: {
          per_page: 50,
          current_page: 1,
          next_page: null,
          total_pages: 1,
          total_records: fallbackAudioFiles.length
        }
      }
    })

  } catch (error) {
    console.error('❌ Verse audio error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}