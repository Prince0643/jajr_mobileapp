const axios = require('axios');

async function testEndpoints() {
  const baseUrl = 'http://jajr.xandree.com/attendance_web/';
  
  console.log('Testing base URL and possible endpoints...\n');
  
  // Test base URL
  try {
    const baseResponse = await axios.get(baseUrl);
    console.log('✅ Base URL accessible');
    console.log('Content-Type:', baseResponse.headers['content-type']);
    console.log('Status:', baseResponse.status);
  } catch (error) {
    console.log('❌ Base URL not accessible:', error.message);
    return;
  }

  // Test common API endpoint patterns
  const endpoints = [
    'login_api',
    'api/login',
    'login.php',
    'auth/login',
    'user/login',
    'api/auth/login'
  ];

  for (const endpoint of endpoints) {
    const url = baseUrl + endpoint;
    console.log(`\n--- Testing: ${url} ---`);
    
    try {
      // Test GET first
      const getResponse = await axios.get(url, { 
        headers: { 'Accept': 'application/json' },
        timeout: 5000
      });
      console.log('✅ GET Success - Status:', getResponse.status);
      console.log('Content-Type:', getResponse.headers['content-type']);
      if (getResponse.headers['content-type']?.includes('application/json')) {
        console.log('Response:', JSON.stringify(getResponse.data, null, 2));
      }
    } catch (error) {
      if (error.response) {
        console.log('❌ GET Failed - Status:', error.response.status);
        
        // Try POST if GET fails
        try {
          const postResponse = await axios.post(url, {}, {
            headers: { 
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            timeout: 5000
          });
          console.log('✅ POST Success - Status:', postResponse.status);
          console.log('Response:', JSON.stringify(postResponse.data, null, 2));
        } catch (postError) {
          console.log('❌ POST also failed');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
  }
}

testEndpoints();
