import { NextResponse } from 'next/server'

// Configuration check
const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || '',
  clientSecret: process.env.QURAN_CLIENT_SECRET || '',
  tokenEndpoint: process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth/token',
  apiBaseUrl: process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4',
}

async function checkQuranFoundationAPI() {
  try {
    // Try to get a token to test authentication
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

    if (response.ok) {
      const data = await response.json()
      return {
        authenticated: true,
        source: 'quran-foundation' as const,
        tokenType: data.token_type,
        expiresIn: data.expires_in
      }
    }
  } catch (error) {
    console.warn('Quran Foundation API check failed:', error)
  }
  
  return {
    authenticated: false,
    source: 'fallback' as const
  }
}

export async function GET() {
  try {
    const apiStatus = await checkQuranFoundationAPI()
    
    return NextResponse.json({
      authenticated: apiStatus.authenticated,
      source: apiStatus.source,
      timestamp: new Date().toISOString(),
      message: apiStatus.authenticated 
        ? 'Using authenticated Quran Foundation API v4'
        : 'Using public API fallback',
      hasCredentials: !!(QURAN_FOUNDATION_CONFIG.clientId && QURAN_FOUNDATION_CONFIG.clientSecret),
      ...(apiStatus.authenticated && {
        tokenType: apiStatus.tokenType,
        expiresIn: apiStatus.expiresIn
      })
    })
  } catch (error) {
    return NextResponse.json(
      { 
        authenticated: false, 
        source: 'fallback',
        error: 'API status check failed',
        timestamp: new Date().toISOString(),
        hasCredentials: !!(QURAN_FOUNDATION_CONFIG.clientId && QURAN_FOUNDATION_CONFIG.clientSecret)
      },
      { status: 500 }
    )
  }
}