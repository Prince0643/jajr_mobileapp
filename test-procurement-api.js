// Quick test to verify procurement API connectivity
const PROCUREMENT_API_URL = process.env.EXPO_PUBLIC_PROCUREMENT_API_URL || 'https://procurement-api.xandree.com';

async function testProcurementAPI() {
  const token = 'YOUR_JWT_TOKEN_HERE'; // Get this from AsyncStorage after login
  
  console.log('Testing Procurement API...');
  console.log('Base URL:', PROCUREMENT_API_URL);
  
  // Test items endpoint
  try {
    const itemsRes = await fetch(`${PROCUREMENT_API_URL}/api/items`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Items endpoint status:', itemsRes.status);
    if (itemsRes.ok) {
      const itemsData = await itemsRes.json();
      console.log('Items response:', JSON.stringify(itemsData, null, 2));
    } else {
      const errorText = await itemsRes.text();
      console.log('Items error:', errorText);
    }
  } catch (e) {
    console.log('Items fetch error:', e);
  }
  
  // Test categories endpoint
  try {
    const catsRes = await fetch(`${PROCUREMENT_API_URL}/api/categories`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Categories endpoint status:', catsRes.status);
    if (catsRes.ok) {
      const catsData = await catsRes.json();
      console.log('Categories response:', JSON.stringify(catsData, null, 2));
    }
  } catch (e) {
    console.log('Categories fetch error:', e);
  }
  
  // Test PR endpoints
  const prEndpoints = [
    '/api/purchase-requests/engineer',
    '/api/purchase-requests/my-requests',
    '/api/purchase-requests'
  ];
  
  for (const endpoint of prEndpoints) {
    try {
      const prRes = await fetch(`${PROCUREMENT_API_URL}${endpoint}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log(`PR endpoint ${endpoint} status:`, prRes.status);
      if (prRes.ok) {
        const prData = await prRes.json();
        console.log(`PR response from ${endpoint}:`, JSON.stringify(prData, null, 2));
      }
    } catch (e) {
      console.log(`PR endpoint ${endpoint} error:`, e);
    }
  }
}

testProcurementAPI();
