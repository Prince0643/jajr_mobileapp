const axios = require('axios');

async function testEmployees() {
  const baseUrl = process.env.TEST_ATTENDANCE_BASE_URL || 'https://jajr.xandree.com/main/';
  const branch = process.env.TEST_BRANCH || 'Sto. Rosario';

  const url = `${baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`}get_available_employees_api.php?branch_name=${encodeURIComponent(branch)}`;

  console.log('--- Employees API Test ---');
  console.log('URL:', url);

  try {
    const res = await axios.get(url, {
      headers: { Accept: 'application/json' },
      timeout: 15000,
      validateStatus: () => true,
    });

    console.log('Status:', res.status);
    console.log('Content-Type:', res.headers['content-type']);

    const contentType = res.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
      console.log('JSON:', JSON.stringify(res.data, null, 2));
    } else {
      const body = typeof res.data === 'string' ? res.data : JSON.stringify(res.data);
      console.log('Body (first 300 chars):', body.slice(0, 300));
    }

    // Basic shape checks
    if (Array.isArray(res.data)) {
      console.log('✅ Received array of employees. Count:', res.data.length);
    } else if (res.data && Array.isArray(res.data.available_employees)) {
      console.log('✅ Received available_employees array. Count:', res.data.available_employees.length);
    } else {
      console.log('⚠️ Unexpected response shape');
    }
  } catch (e) {
    console.log('❌ Request failed');
    console.log('Message:', e.message);
    console.log('Code:', e.code);
    process.exitCode = 1;
  }
}

testEmployees();
