const axios = require('axios');

async function testRootEndpoints() {
  const baseUrl = 'http://jajr.xandree.com/';
  
  console.log('Testing root domain API endpoints...\n');
  
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

  // Test API endpoints at root
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
      // Test POST with form data (like your app does)
      const formData = new FormData();
      formData.append('identifier', 'SA001');
      formData.append('password', 'password123');
      formData.append('branch_name', 'Main Branch');

      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 5000
      });
      
      console.log('✅ POST Success - Status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      
      if (response.headers['content-type']?.includes('application/json')) {
        console.log('Response:', JSON.stringify(response.data, null, 2));
      } else {
        console.log('Response is HTML, not JSON');
      }
      
    } catch (error) {
      if (error.response) {
        console.log('❌ POST Failed - Status:', error.response.status);
        console.log('Content-Type:', error.response.headers['content-type']);
        
        if (error.response.headers['content-type']?.includes('application/json')) {
          console.log('Error Response:', JSON.stringify(error.response.data, null, 2));
        } else {
          console.log('Error Response is HTML, not JSON');
        }
      } else {
        console.log('❌ Network error:', error.message);
      }
    }
  }
}

testRootEndpoints();
