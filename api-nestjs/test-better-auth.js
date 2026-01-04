const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testBetterAuth() {
  console.log('🧪 Testing Better Auth Integration...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing API health...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ API is healthy:', healthResponse.status);

    // Test 2: Test Better Auth signup
    console.log('\n2. Testing Better Auth signup...');
    const signupData = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      phone: '+1234567890',
      roles: ['BUYER']
    };

    try {
      const signupResponse = await axios.post(`${BASE_URL}/auth/v2/signup`, signupData);
      console.log('✅ Signup successful:', signupResponse.status);
      console.log('User created:', signupResponse.data);
    } catch (signupError) {
      if (signupError.response?.status === 409) {
        console.log('ℹ️ User already exists, trying signin...');
      } else {
        console.log('❌ Signup failed:', signupError.response?.data || signupError.message);
      }
    }

    // Test 3: Test Better Auth signin
    console.log('\n3. Testing Better Auth signin...');
    try {
      const signinResponse = await axios.post(`${BASE_URL}/auth/v2/signin`, {
        email: 'test@example.com',
        password: 'password123'
      });
      console.log('✅ Signin successful:', signinResponse.status);
      
      const token = signinResponse.data?.data?.session?.token;
      if (token) {
        console.log('🔑 Session token received');

        // Test 4: Test protected endpoint
        console.log('\n4. Testing protected endpoint...');
        const meResponse = await axios.get(`${BASE_URL}/auth/v2/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Protected endpoint accessible:', meResponse.status);
        console.log('User info:', meResponse.data);

        // Test 5: Test session endpoint
        console.log('\n5. Testing session endpoint...');
        const sessionResponse = await axios.get(`${BASE_URL}/auth/v2/session`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Session endpoint accessible:', sessionResponse.status);
        console.log('Session info:', sessionResponse.data);

        // Test 6: Test signout
        console.log('\n6. Testing signout...');
        const signoutResponse = await axios.post(`${BASE_URL}/auth/v2/signout`, {}, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('✅ Signout successful:', signoutResponse.status);
      }
    } catch (signinError) {
      console.log('❌ Signin failed:', signinError.response?.data || signinError.message);
    }

    console.log('\n🎉 Better Auth integration test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the API server is running on http://localhost:3001');
    }
  }
}

// Run the test
testBetterAuth();