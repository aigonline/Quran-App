import { NextResponse } from 'next/server'

const ENDPOINTS_TO_TEST = [
  'https://oauth2.quran.foundation/oauth/token',
  'https://oauth2.quran.foundation/oauth2/token',
  'https://oauth2.quran.foundation/token',
  'https://oauth2.quran.foundation/v1/token',
  'https://oauth2.quran.foundation/api/token',
  'https://oauth2.quran.foundation/auth/token',
]

const CLIENT_ID = process.env.NEXT_PUBLIC_QURAN_CLIENT_ID || ''
const CLIENT_SECRET = process.env.QURAN_CLIENT_SECRET || ''

async function testEndpoint(endpoint: string) {
  try {
    console.log(`🔍 Testing endpoint: ${endpoint}`)
    
    // Use Basic authentication (client_secret_basic) instead of POST body (client_secret_post)
    const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    
    const response = await fetch(endpoint, {
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

    console.log(`📊 Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ SUCCESS! Endpoint works: ${endpoint}`)
      console.log(`🎫 Token received: ${data.access_token ? 'Yes' : 'No'}`)
      return { endpoint, success: true, data }
    } else {
      const errorText = await response.text()
      console.log(`❌ Failed: ${response.status} - ${errorText.substring(0, 100)}`)
      return { endpoint, success: false, status: response.status, error: errorText }
    }
  } catch (error) {
    console.log(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { endpoint, success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function GET() {
  console.log('🔎 Testing OAuth endpoints...')
  
  const results = []
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint)
    results.push(result)
    
    if (result.success) {
      console.log(`\\n🎉 FOUND WORKING ENDPOINT: ${result.endpoint}`)
      break // Stop testing once we find a working one
    }
    console.log('---')
  }
  
  return NextResponse.json({
    results,
    workingEndpoint: results.find(r => r.success)?.endpoint || null
  })
}