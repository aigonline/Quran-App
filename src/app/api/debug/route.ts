import { NextRequest, NextResponse } from 'next/server'

// Configuration
const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenEndpoint: process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth2/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4',
}

// Token cache for server-side requests
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string | null> {
  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token
  }

  if (!QURAN_FOUNDATION_CONFIG.clientId || !QURAN_FOUNDATION_CONFIG.clientSecret) {
    return null
  }

  try {
    const credentials = Buffer.from(`${QURAN_FOUNDATION_CONFIG.clientId}:${QURAN_FOUNDATION_CONFIG.clientSecret}`).toString('base64')
    
    const response = await fetch(QURAN_FOUNDATION_CONFIG.tokenEndpoint, {
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
  const chapterNumber = searchParams.get('chapter') || '1'
  const translations = searchParams.get('translations') || 'en.sahih'

  try {
    console.log(`🔍 Debug: Getting data for Chapter ${chapterNumber}`)
    
    const token = await getAccessToken()
    
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'No access token available'
      }, { status: 401 })
    }

    const headers = {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      'x-client-id': QURAN_FOUNDATION_CONFIG.clientId,
    }

    // Get chapters data
    const chaptersResponse = await fetch(`${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/chapters`, { headers })
    const chaptersData = await chaptersResponse.json()

    // Get verses data
    const versesResponse = await fetch(
      `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/verses/by_chapter/${chapterNumber}?translations=${translations}&words=false&per_page=50`, 
      { headers }
    )
    const versesData = await versesResponse.json()

    return NextResponse.json({
      success: true,
      debug: {
        chapterNumber: parseInt(chapterNumber),
        translationRequested: translations,
        chaptersResponse: {
          status: chaptersResponse.status,
          data: chaptersData
        },
        versesResponse: {
          status: versesResponse.status,
          data: versesData
        },
        sampleChapter: chaptersData?.chapters?.[0] || null,
        sampleVerse: versesData?.verses?.[0] || null,
        versesCount: versesData?.verses?.length || 0,
        hasTranslations: !!versesData?.verses?.[0]?.translations
      }
    })

  } catch (error) {
    console.error('❌ Debug error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}