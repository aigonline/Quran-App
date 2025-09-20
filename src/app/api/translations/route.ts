import { NextResponse } from 'next/server'

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

export async function GET() {
  try {
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

    // Try to get available translations
    const response = await fetch(`${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/resources/translations`, { headers })
    
    if (response.ok) {
      const data = await response.json()
      return NextResponse.json({
        success: true,
        data: data,
        message: 'Available translations from production API'
      })
    } else {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        error: `API returned ${response.status}: ${errorText}`
      }, { status: response.status })
    }

  } catch (error) {
    console.error('❌ Error fetching translations:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}