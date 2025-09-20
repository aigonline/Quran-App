import { NextRequest, NextResponse } from 'next/server'

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

export async function GET(
  request: NextRequest,
  { params }: { params: { chapterNumber: string } }
) {
  const { chapterNumber } = params
  const { searchParams } = new URL(request.url)
  const translations = searchParams.get('translations') || '131'
  const words = searchParams.get('words') || 'false'
  const perPage = searchParams.get('per_page') || '50'

  try {
    // Try authenticated request to Quran Foundation
    const token = await getAccessToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (token && QURAN_FOUNDATION_CONFIG.clientId) {
      headers['x-auth-token'] = token
      headers['x-client-id'] = QURAN_FOUNDATION_CONFIG.clientId
    } else {
      console.log('❌ Missing token or client ID for authentication')
      return NextResponse.json({
        success: false,
        error: 'Missing authentication credentials',
        fallback_needed: true
      }, { status: 401 })
    }

    // Get Arabic verses first
    let versesApiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/verses/by_chapter/${chapterNumber}?words=false&per_page=${perPage}&fields=verse_number,verse_key,page_number,juz_number,hizb_number,sajdah_type,text_uthmani,text_indopak,text_imlaei`
    
    let versesResponse = await fetch(versesApiUrl, { headers })
    
    // If verses endpoint fails, try Uthmani script endpoint
    if (!versesResponse.ok) {
      versesApiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/quran/verses/uthmani?chapter_number=${chapterNumber}`
      versesResponse = await fetch(versesApiUrl, { headers })
    }

    let combinedData = { verses: [], translations: [] }

    if (versesResponse.ok) {
      const versesData = await versesResponse.json()
      combinedData.verses = versesData.verses || []
      
      // Get translations separately if requested
      if (translations && translations !== 'false') {
        // Try common working translation IDs if 131 doesn't work
        const translationIds = [translations, '20', '85', '84', '19']
        let translationsData = null
        
        for (const translationId of translationIds) {
          try {
            const translationsApiUrl = `${QURAN_FOUNDATION_CONFIG.apiBaseUrl}/translations/${translationId}/by_chapter/${chapterNumber}?per_page=${perPage}`
            
            const translationsResponse = await fetch(translationsApiUrl, { headers })
            
            if (translationsResponse.ok) {
              translationsData = await translationsResponse.json()
              
              // If we found translations, use them and break
              if (translationsData.translations && translationsData.translations.length > 0) {
                
                // Clean up translation text by removing footnote tags
                const cleanedTranslations = translationsData.translations.map((translation: any) => ({
                  ...translation,
                  text: translation.text
                    ?.replace(/<sup foot_note=\d+>\d+<\/sup>/g, '') // Remove footnote superscript tags
                    ?.replace(/<[^>]*>/g, '') // Remove any other HTML tags
                    ?.trim() // Remove extra whitespace
                }))
                
                combinedData.translations = cleanedTranslations
                console.log(`🧹 Cleaned ${cleanedTranslations.length} translations, sample:`, cleanedTranslations[0]?.text?.substring(0, 50))
                break
              }
            }
          } catch (error) {
            // Continue to next translation ID
          }
        }
        
        if (!combinedData.translations || combinedData.translations.length === 0) {
          // No translations found, continue without them
        }
      }
      
      return NextResponse.json({
        success: true,
        source: 'quran-foundation',
        data: {
          verses: combinedData.verses,
          translations: combinedData.translations
        }
      })
    }

    console.log(`❌ Quran Foundation API failed: ${versesResponse.status}`)
    
    // Log the actual error response for debugging
    try {
      const errorData = await versesResponse.text()
      console.log('Error response body:', errorData)
    } catch (e) {
      console.log('Could not read error response body')
    }
    
    return NextResponse.json({
      success: false,
      source: 'quran-foundation',
      error: `API returned ${versesResponse.status}: ${versesResponse.statusText}`,
      fallback_needed: true
    }, { status: versesResponse.status })

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