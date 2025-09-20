import { NextRequest, NextResponse } from 'next/server'

const QURAN_FOUNDATION_CONFIG = {
  clientId: process.env.QURAN_FOUNDATION_CLIENT_ID || '',
  clientSecret: process.env.QURAN_FOUNDATION_CLIENT_SECRET || '',
  tokenUrl: process.env.QURAN_FOUNDATION_TOKEN_URL || 'https://oauth2.quran.foundation/oauth2/token',
  apiBaseUrl: process.env.QURAN_FOUNDATION_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4'
}

// Simple token cache to avoid repeated requests
let tokenCache: { token: string; expires: number } | null = null

async function getAccessToken() {
  // Check if we have a valid cached token
  if (tokenCache && Date.now() < tokenCache.expires) {
    return tokenCache.token
  }

  console.log('🔐 Attempting to get access token...')
  
  if (!QURAN_FOUNDATION_CONFIG.clientId || !QURAN_FOUNDATION_CONFIG.clientSecret) {
    console.log('❌ Missing client credentials')
    return null
  }

  const credentials = Buffer.from(`${QURAN_FOUNDATION_CONFIG.clientId}:${QURAN_FOUNDATION_CONFIG.clientSecret}`).toString('base64')

  try {
    const response = await fetch(QURAN_FOUNDATION_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials&scope=content'
    })

    console.log(`🔐 Token endpoint response status: ${response.status}`)

    if (response.ok) {
      const data = await response.json()
      console.log('✅ Token acquired successfully')
      
      // Cache the token (expires in 1 hour, but we'll refresh after 50 minutes)
      tokenCache = {
        token: data.access_token,
        expires: Date.now() + (50 * 60 * 1000) // 50 minutes
      }
      
      return data.access_token
    } else {
      const errorText = await response.text()
      console.log(`❌ Token acquisition failed: ${response.status} - ${errorText}`)
      return null
    }
  } catch (error) {
    console.log('❌ Token request error:', error)
    return null
  }
}

export async function GET() {
  try {
    console.log('🔍 Debug: Checking available translation resources')
    
    const token = await getAccessToken()
    if (!token) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get access token'
      }, { status: 401 })
    }

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'x-client-id': QURAN_FOUNDATION_CONFIG.clientId,
      'x-auth-token': token
    }

    // Get available translation resources
    const resourcesUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/resources/translations`
    console.log(`📡 Calling: ${resourcesUrl}`)
    
    const resourcesResponse = await fetch(resourcesUrl, { headers })
    
    if (resourcesResponse.ok) {
      const resourcesData = await resourcesResponse.json()
      console.log('✅ Got translation resources')
      
      // Test translation ID 131 specifically
      const translationUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/translations/131/by_chapter/1?per_page=10`
      console.log(`📡 Testing translation 131: ${translationUrl}`)
      
      const translationResponse = await fetch(translationUrl, { headers })
      const translationData = await translationResponse.json()
      
      // Test a few other common IDs
      const testIds = [20, 85, 84, 131, 149]
      const testResults: Record<number, any> = {}
      
      for (const id of testIds) {
        const testUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/translations/${id}/by_chapter/1?per_page=3`
        try {
          const testResponse = await fetch(testUrl, { headers })
          const testData = await testResponse.json()
          testResults[id] = {
            status: testResponse.status,
            success: testResponse.ok,
            translationsCount: testData.translations?.length || 0,
            sample: testData.translations?.[0]?.text?.substring(0, 50) || 'No text'
          }
        } catch (error) {
          testResults[id] = { error: (error as Error).message }
        }
      }
      
      return NextResponse.json({
        success: true,
        data: {
          availableResources: resourcesData,
          translation131Test: {
            status: translationResponse.status,
            data: translationData
          },
          testResults
        }
      })
    } else {
      const errorText = await resourcesResponse.text()
      return NextResponse.json({
        success: false,
        error: `Resources API failed: ${resourcesResponse.status} - ${errorText}`
      }, { status: resourcesResponse.status })
    }
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 })
  }
}