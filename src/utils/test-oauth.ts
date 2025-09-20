// Test script to find correct OAuth endpoint
const ENDPOINTS_TO_TEST = [
  'https://prelive-oauth2.quran.foundation/oauth/token',
  'https://prelive-oauth2.quran.foundation/oauth2/token',
  'https://prelive-oauth2.quran.foundation/token',
  'https://apis-prelive.quran.foundation/oauth/token',
  'https://apis-prelive.quran.foundation/oauth2/token',
  'https://apis-prelive.quran.foundation/token',
]

const CLIENT_ID = 'e1bbbe76-6a39-498d-85f3-57135fe73e03'
const CLIENT_SECRET = 'BtSHxc_9-pu9yxw0RUn8rn5sN3'

async function testEndpoint(endpoint: string) {
  try {
    console.log(`🔍 Testing endpoint: ${endpoint}`)
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })

    console.log(`📊 Status: ${response.status}`)
    
    if (response.ok) {
      const data = await response.json()
      console.log(`✅ SUCCESS! Endpoint works: ${endpoint}`)
      console.log(`🎫 Token received: ${data.access_token ? 'Yes' : 'No'}`)
      return endpoint
    } else {
      const errorText = await response.text()
      console.log(`❌ Failed: ${response.status} - ${errorText.substring(0, 100)}`)
    }
  } catch (error) {
    console.log(`💥 Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  return null
}

async function findCorrectEndpoint() {
  console.log('🔎 Testing OAuth endpoints...')
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    const result = await testEndpoint(endpoint)
    if (result) {
      console.log(`\n🎉 FOUND WORKING ENDPOINT: ${result}`)
      return result
    }
    console.log('---')
  }
  
  console.log('\n😞 No working endpoint found')
  return null
}

// Export for use in API route
export { findCorrectEndpoint, testEndpoint, ENDPOINTS_TO_TEST }