const axios = require('axios');

// Test the login API directly
async function testLoginAPI() {
  const apiUrl = 'http://jajr.xandree.com/attendance_web/login_api';
  
  // Test data - try with different field names
  const testData = {
    identifier: 'SA001',
    password: 'password123', // Replace with actual password
    branch_name: 'Main Branch'
  };

  console.log('Testing login API...');
  console.log('URL:', apiUrl);
  console.log('Data:', testData);
  
  try {
    // Test as form data (like the app does)
    const formData = new FormData();
    formData.append('identifier', testData.identifier);
    formData.append('password', testData.password);
    formData.append('branch_name', testData.branch_name);

    const response = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('✅ Success Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error Response:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('Network Error:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

// Also test with different field names
async function testAlternativeFields() {
  const apiUrl = 'http://jajr.xandree.com/attendance_web/login_api';
  
  // Try alternative field names
  const alternatives = [
    { employee_id: 'SA001', password: 'password123', branch_name: 'Main Branch' },
    { username: 'SA001', password: 'password123', branch_name: 'Main Branch' },
    { employee_code: 'SA001', password: 'password123', branch_name: 'Main Branch' }
  ];

  for (const data of alternatives) {
    console.log('\n--- Testing with fields:', Object.keys(data).join(', '), '---');
    
    try {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        formData.append(key, data[key]);
      });

      const response = await axios.post(apiUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Success with', Object.keys(data).join(', '));
      console.log('Data:', JSON.stringify(response.data, null, 2));
      break; // Stop if we find a working combination
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Failed with', Object.keys(data).join(', '));
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

// Run tests
testLoginAPI().then(() => {
  return testAlternativeFields();
});
