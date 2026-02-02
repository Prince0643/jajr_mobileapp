const axios = require('axios');

async function testLoginSimple() {
  const url = 'https://jajr.xandree.com/login_api_simple.php';

  const payload = {
    Key: process.env.TEST_LOGIN_KEY || 'SA001',
    identifier: process.env.TEST_LOGIN_IDENTIFIER || 'SA001',
    password: process.env.TEST_LOGIN_PASSWORD || 'Dante051223@',
    branch_name: process.env.TEST_LOGIN_BRANCH || 'Sto. Rosario',
  };

  console.log('--- Login Simple API Test ---');
  console.log('URL:', url);
  console.log('Payload:', JSON.stringify(payload, null, 2));

  try {
    const formData = new FormData();
    Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));

    console.log('FormData fields:');
    Object.entries(payload).forEach(([k, v]) => console.log(`  ${k}: "${String(v)}"`));

    const response = await axios.post(url, formData, {
      headers: {
        Accept: 'application/json',
      },
      timeout: 15000,
    });

    console.log('✅ Success');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Failed');

    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Error:', error.message);
    }

    process.exitCode = 1;
  }
}

testLoginSimple();
