// Test V4 API authentication
export async function testQuranFoundationAPI() {
  try {
    console.log('Testing Quran Foundation API v4...')
    
    // Skip OAuth testing in browser environments due to CORS
    if (typeof window !== 'undefined') {
      console.log('Browser environment detected, skipping OAuth test due to CORS restrictions')
      console.log('Testing public API fallback instead...')
      
      try {
        const fallbackResponse = await fetch('https://api.alquran.cloud/v1/surah')
        const fallbackData = await fallbackResponse.json()
        
        return {
          success: true,
          message: 'Public API fallback working correctly',
          data: fallbackData,
          chaptersCount: fallbackData.data?.length || 0
        }
      } catch (error) {
        return {
          success: false,
          error: 'Public API fallback failed: ' + (error instanceof Error ? error.message : 'Unknown error')
        }
      }
    }
    
    // Configuration using environment variables
    const clientId = process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || ''
    const clientSecret = process.env.QURAN_CLIENT_SECRET || ''
    const tokenEndpoint = process.env.NEXT_PUBLIC_QURAN_TOKEN_ENDPOINT || 'https://oauth2.quran.foundation/oauth/token'
    const apiBaseUrl = process.env.NEXT_PUBLIC_QURAN_API_BASE_URL || 'https://apis.quran.foundation/content/api/v4'
    
    console.log('Client ID:', clientId)
    console.log('Token Endpoint:', tokenEndpoint)
    console.log('API Base URL:', apiBaseUrl)
    
    // Step 1: Get OAuth2 token
    console.log('Step 1: Getting OAuth2 token...')
    const tokenResponse = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })
    
    console.log('Token response status:', tokenResponse.status)
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token request failed:', errorText)
      return { success: false, error: `Token request failed: ${tokenResponse.status} ${errorText}` }
    }
    
    const tokenData = await tokenResponse.json()
    console.log('Token data:', tokenData)
    
    const accessToken = tokenData.access_token
    if (!accessToken) {
      return { success: false, error: 'No access token received' }
    }
    
    // Step 2: Test API with token
    console.log('Step 2: Testing API with token...')
    const apiResponse = await fetch(`${apiBaseUrl}/chapters`, {
      headers: {
        'x-auth-token': accessToken,
        'x-client-id': clientId,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('API response status:', apiResponse.status)
    console.log('API response headers:', Object.fromEntries(apiResponse.headers.entries()))
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text()
      console.error('API request failed:', errorText)
      return { success: false, error: `API request failed: ${apiResponse.status} ${errorText}` }
    }
    
    const apiData = await apiResponse.json()
    console.log('API data:', apiData)
    
    return { 
      success: true, 
      token: accessToken,
      data: apiData,
      chaptersCount: apiData.chapters?.length || 0
    }
    
  } catch (error) {
    console.error('Test failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}