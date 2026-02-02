const axios = require('axios');

async function testPostLogin() {
  const url = 'https://jajr.xandree.com/login_api.php';
  
  // Test with POST form data (like your mobile app)
  const formData = new FormData();
  formData.append('identifier', 'SA001');
  formData.append('password', 'Dante051223@');
  formData.append('branch_name', 'Sto. Rosario');

  try {
    const response = await axios.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json'
      }
    });
    
    console.log('✅ POST Login Test:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ POST Login Failed:');
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

testPostLogin();
