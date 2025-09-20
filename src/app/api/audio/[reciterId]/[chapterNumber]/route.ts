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
  const includeSegments = searchParams.get('segments') === 'true'

  try {
    console.log(`🎵 Proxy: Getting audio for Reciter ${reciterId}, Chapter ${chapterNumber}`)
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
      console.log('🔄 Pre-production environment detected, audio endpoints not available')
      console.log('📻 Using public audio fallback for testing')
      
      // Generate public audio URL for testing
      const paddedChapterNumber = chapterNumber.toString().padStart(3, '0')
      const publicAudioUrl = `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedChapterNumber}.mp3`
      
      return NextResponse.json({
        success: true,
        source: 'public-fallback',
        message: 'Pre-production environment - using public audio',
        data: {
          audio_url: publicAudioUrl
        },
        audio_url: publicAudioUrl
      })
    }

    // Use the correct API endpoint for full chapter audio file
    const apiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/chapter_recitations/${reciterId}/${chapterNumber}${includeSegments ? '?segments=true' : ''}`

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
      console.log(`🎵 Got chapter audio file:`, data.audio_file?.audio_url || data.audio_url || 'No URL found')
      
      // Handle chapter audio response structure
      let audioUrl = null
      let audioData = null
      
      // Chapter recitations endpoint returns different structure
      if (data.audio_file) {
        audioData = data.audio_file
        audioUrl = data.audio_file.audio_url
      } else if (data.audio_url) {
        audioUrl = data.audio_url
        audioData = data
      } else if (data.url) {
        audioUrl = data.url
        audioData = data
      }
      
      // Convert relative URLs to absolute URLs
      if (audioUrl && !audioUrl.startsWith('http')) {
        // The Quran Foundation audio base URL for audio files
        const audioBaseUrl = 'https://audio.qurancdn.com'
        audioUrl = `${audioBaseUrl}/${audioUrl.replace(/^\/+/, '')}`
        console.log(`🔗 Converted relative URL to: ${audioUrl}`)
      }
      
      console.log(`🔊 Final chapter audio URL: ${audioUrl}`)
      
      // Return the chapter audio data
      return NextResponse.json({
        success: true,
        source: 'quran-foundation',
        data: {
          audio_file: audioData,
          chapter_id: parseInt(chapterNumber),
          reciter_id: parseInt(reciterId),
          verse_timings: data.verse_timings || null,
          segments: includeSegments ? data.verse_timings : null
        },
        // For backward compatibility and easy access
        audio_url: audioUrl
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
    console.log('🔄 Falling back to public audio due to API failure')
    
    // Generate public audio URL as fallback
    const paddedChapterNumber = chapterNumber.toString().padStart(3, '0')
    let fallbackAudioUrl: string
    
    // Map reciter IDs to known public audio sources
    const publicAudioSources: Record<string, string> = {
      '1': `https://download.quranicaudio.com/quran/abdul_basit_murattal/${paddedChapterNumber}.mp3`, // Abdul Basit Murattal
      '2': `https://download.quranicaudio.com/quran/abdul_basit_mujawwad/${paddedChapterNumber}.mp3`, // Abdul Basit Mujawwad
      '3': `https://download.quranicaudio.com/quran/abdurrahmaan_as-sudays/${paddedChapterNumber}.mp3`, // As-Sudais
      '4': `https://download.quranicaudio.com/quran/abu_bakr_ash-shaatree/${paddedChapterNumber}.mp3`, // Ash-Shaatri
      '5': `https://download.quranicaudio.com/quran/hani_ar_rifai/${paddedChapterNumber}.mp3`, // Hani Ar-Rifai
      '6': `https://download.quranicaudio.com/quran/khalil_al_husary/${paddedChapterNumber}.mp3`, // Al-Husary
      '7': `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedChapterNumber}.mp3`, // Alafasy
      '8': `https://download.quranicaudio.com/quran/sa3d_al-ghaamidi/${paddedChapterNumber}.mp3`, // Al-Ghamdi
      '9': `https://download.quranicaudio.com/quran/sa3ood_ash-shuraym/${paddedChapterNumber}.mp3`, // Ash-Shuraim
      '10': `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedChapterNumber}.mp3` // Alafasy alt
    }
    
    fallbackAudioUrl = publicAudioSources[reciterId] || publicAudioSources['7'] // Default to Alafasy
    
    console.log(`📻 Using public fallback audio: ${fallbackAudioUrl}`)
    
    return NextResponse.json({
      success: true,
      source: 'public-fallback',
      message: 'Using public audio fallback due to API error',
      data: {
        audio_url: fallbackAudioUrl
      },
      audio_url: fallbackAudioUrl
    })

  } catch (error) {
    console.error('❌ Proxy error:', error)
    
    // Generate public audio URL as fallback
    const paddedChapterNumber = chapterNumber.toString().padStart(3, '0')
    const fallbackAudioUrl = `https://download.quranicaudio.com/quran/mishaari_raashid_al_3afaasee/${paddedChapterNumber}.mp3`
    
    console.log(`📻 Using public fallback audio due to error: ${fallbackAudioUrl}`)
    
    return NextResponse.json({
      success: true,
      source: 'public-fallback',
      message: 'Using public audio fallback due to error',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: {
        audio_url: fallbackAudioUrl
      },
      audio_url: fallbackAudioUrl
    })
  }
}