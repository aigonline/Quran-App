import { NextResponse } from 'next/server'

// Configuration
const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenEndpoint: process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth/token',
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
    console.log('❌ No credentials available for Quran Foundation API')
    return null
  }

  try {
    console.log('🔐 Attempting to get access token...')
    
    // Use Basic authentication (client_secret_basic) instead of POST body (client_secret_post)
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

export async function GET() {
  try {
    console.log('📖 Proxy: Getting chapters list')
    
    // Try authenticated request to Quran Foundation
    const token = await getAccessToken()
    console.log(`🔐 Token obtained: ${!!token}`)
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token && QURAN_FOUNDATION_CONFIG.clientId) {
      headers['x-auth-token'] = token
      headers['x-client-id'] = QURAN_FOUNDATION_CONFIG.clientId
      console.log('🔐 Using authenticated request')
    } else {
      console.log('❌ Missing token or client ID for authentication')
      return NextResponse.json({
        success: false,
        error: 'Missing authentication credentials',
        fallback_needed: true
      }, { status: 401 })
    }

    const apiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/chapters`
    console.log(`📡 Calling: ${apiUrl}`)
    
    const response = await fetch(apiUrl, { headers })

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Quran Foundation API succeeded')
      
      return NextResponse.json({
        success: true,
        source: 'quran-foundation',
        data: data
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