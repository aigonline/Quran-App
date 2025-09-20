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
    console.log(`Client ID: ${QURAN_FOUNDATION_CONFIG.clientId ? 'Present' : 'Missing'}`)
    console.log(`Client Secret: ${QURAN_FOUNDATION_CONFIG.clientSecret ? 'Present' : 'Missing'}`)
    console.log('')
    console.log('📋 To fix this:')
    console.log('1. Copy .env.example to .env')
    console.log('2. Get credentials from https://quran.foundation')
    console.log('3. Replace placeholder values in .env with your actual credentials')
    console.log('4. Restart the development server')
    return null
  }

  try {
    console.log('🔐 Attempting to get access token...')
    
    // Use Basic authentication (client_secret_basic) instead of POST body (client_secret_post)
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

    console.log(`🔐 Token endpoint response status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ Token acquired successfully')
      const expiresAt = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 minute early
      
      cachedToken = {
        token: data.access_token,
        expiresAt
      }
      
      return data.access_token
    } else {
      const errorText = await response.text()
      console.log(`❌ Token acquisition failed: ${response.status} - ${errorText}`)
    }
  } catch (error) {
    console.error('❌ Failed to get access token:', error)
  }

  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { reciterId: string; chapterNumber: string } }
) {
  const { reciterId, chapterNumber } = params
  const { searchParams } = new URL(request.url)
  const page = searchParams.get('page') || '1'
  const perPage = searchParams.get('per_page') || '50'

  try {
    console.log(`🎵 Proxy: Getting verse audio for Reciter ${reciterId}, Chapter ${chapterNumber}`)
    console.log(`🔑 Client ID available: ${!!QURAN_FOUNDATION_CONFIG.clientId}`)
    console.log(`🔑 Client Secret available: ${!!QURAN_FOUNDATION_CONFIG.clientSecret}`)
    
    // Try authenticated request to Quran Foundation
    const token = await getAccessToken()
    console.log(`🔐 Token obtained: ${!!token}`)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token && QURAN_FOUNDATION_CONFIG.clientId) {
      headers['x-auth-token'] = token
      headers['x-client-id'] = QURAN_FOUNDATION_CONFIG.clientId
      console.log('🔐 Using authenticated request with both headers')
      console.log(`🆔 Client ID: ${QURAN_FOUNDATION_CONFIG.clientId.substring(0, 8)}...`)
      console.log(`🎫 Token length: ${token.length}`)
    } else {
      console.log('❌ Missing token or client ID for authentication')
      console.log('')
      console.log('🔧 Setup required:')
      console.log('1. Create .env file from .env.example')
      console.log('2. Add your Quran Foundation API credentials')
      console.log('3. Restart the development server')
      console.log('')
      console.log('Get credentials at: https://quran.foundation')
      
      return NextResponse.json({
        success: false,
        error: 'Missing authentication credentials for Quran Foundation API',
        setup_required: true,
        instructions: {
          step1: 'Copy .env.example to .env',
          step2: 'Get credentials from https://quran.foundation',
          step3: 'Replace NEXT_PUBLIC_QURAN_CLIENT_ID and QURAN_CLIENT_SECRET in .env',
          step4: 'Restart development server'
        },
        debug: {
          hasToken: !!token,
          hasClientId: !!QURAN_FOUNDATION_CONFIG.clientId,
          hasClientSecret: !!QURAN_FOUNDATION_CONFIG.clientSecret
        }
      }, { status: 401 })
    }

    // Check if we're in pre-production environment where audio endpoints don't exist
    const isPreProduction = QURAN_FOUNDATION_CONFIG.apiBaseUrl.includes('prelive')
    
    if (isPreProduction) {
      console.log('🔄 Pre-production environment detected, verse audio endpoints not available')
      console.log('📻 Using fallback verse audio generation')
      
      // Generate mock verse audio URLs for testing
      const mockAudioFiles = []
      const chapterNum = parseInt(chapterNumber)
      
      // Get the number of verses in this chapter (simplified mapping)
      const verseCounts: Record<number, number> = {
        1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109
        // Add more as needed
      }
      const verseCount = verseCounts[chapterNum] || 10
      
      for (let verse = 1; verse <= Math.min(verseCount, 50); verse++) {
        const paddedChapter = chapterNumber.toString().padStart(3, '0')
        const paddedVerse = verse.toString().padStart(3, '0')
        mockAudioFiles.push({
          verse_key: `${chapterNum}:${verse}`,
          url: `https://everyayah.com/data/Alafasy_64kbps/${paddedChapter}${paddedVerse}.mp3`
        })
      }
      
      return NextResponse.json({
        success: true,
        source: 'public-fallback',
        message: 'Pre-production environment - using public verse audio',
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

    // Use the correct API endpoint for verse-by-verse audio files
    const apiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/recitations/${reciterId}/by_chapter/${chapterNumber}?page=${page}&per_page=${perPage}`

    console.log(`📡 Calling: ${apiUrl}`)
    console.log(`📋 Headers:`, {
      'Content-Type': headers['Content-Type'],
      'x-auth-token': headers['x-auth-token'] ? 'Present' : 'Missing',
      'x-client-id': headers['x-client-id'] ? 'Present' : 'Missing'
    })
    
    const response = await fetch(apiUrl, { headers })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Quran Foundation API succeeded')
      console.log(`🎵 Got ${data.audio_files?.length || 0} verse audio files`)
      
      // Process the audio files to ensure absolute URLs
      const processedAudioFiles = data.audio_files?.map((audioFile: any) => {
        let audioUrl = audioFile.url
        
        // Convert relative URLs to absolute URLs
        if (!audioUrl.startsWith('http')) {
          // The audio URLs from Quran Foundation are relative, make them absolute
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
    
    // Log the actual error response for debugging
    try {
      const errorData = await response.text()
      console.log('Error response body:', errorData)
    } catch (e) {
      console.log('Could not read error response body')
    }
    
    // Return error but indicate we tried Quran Foundation
    return NextResponse.json({
      success: false,
      source: 'quran-foundation',
      error: `API returned ${response.status}: ${response.statusText}`,
      fallback_needed: true
    }, { status: response.status })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    
    return NextResponse.json({
      success: false,
      source: 'quran-foundation',
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback_needed: true
    }, { status: 500 })
  }
}