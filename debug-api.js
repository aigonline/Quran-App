// Quick debug script to check API response structure
const apiUrl = 'http://localhost:3001/api/verses/chapter/1?translations=131&words=false&per_page=50';

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    console.log('=== FULL API RESPONSE ===');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.success && data.data) {
      console.log('\n=== VERSES ===');
      console.log('Count:', data.data.verses?.length || 0);
      if (data.data.verses?.[0]) {
        console.log('First verse:', JSON.stringify(data.data.verses[0], null, 2));
      }
      
      console.log('\n=== TRANSLATIONS ===');
      console.log('Count:', data.data.translations?.length || 0);
      if (data.data.translations?.[0]) {
        console.log('First translation:', JSON.stringify(data.data.translations[0], null, 2));
      }
    }
  })
  .catch(error => {
    console.error('Error:', error);
  });