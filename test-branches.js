const axios = require('axios');

async function testDifferentBranches() {
  const url = 'https://jajr.xandree.com/login_api.php';
  
  const testCases = [
    {
      name: 'Main Branch',
      data: {
        identifier: 'SA001',
        password: 'Dante051223@',
        branch_name: 'Main Branch'
      }
    },
    {
      name: 'Sto. Rosario',
      data: {
        identifier: 'SA001',
        password: 'Dante051223@',
        branch_name: 'Sto. Rosario'
      }
    },
    {
      name: 'Sto. Rosario (URL encoded)',
      data: {
        identifier: 'SA001',
        password: 'Dante051223@',
        branch_name: 'Sto. Rosario'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing: ${testCase.name} ---`);
    
    const formData = new FormData();
    Object.keys(testCase.data).forEach(key => {
      formData.append(key, testCase.data[key]);
    });

    try {
      const response = await axios.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ Success:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Failed:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('❌ Error:', error.message);
      }
    }
  }
}

testDifferentBranches();
