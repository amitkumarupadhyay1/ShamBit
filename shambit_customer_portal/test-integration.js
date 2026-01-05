const axios = require('axios');

const CUSTOMER_PORTAL_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3001/api/v1';

async function testIntegration() {
  console.log('🧪 Testing Customer Portal Integration...\n');

  try {
    // Test 1: Check if customer portal is running
    console.log('1. Testing Customer Portal availability...');
    try {
      const portalResponse = await axios.get(CUSTOMER_PORTAL_URL, { timeout: 5000 });
      console.log('✅ Customer Portal is running:', portalResponse.status);
    } catch (error) {
      console.log('❌ Customer Portal not accessible. Make sure it\'s running on http://localhost:3000');
      console.log('   Run: npm run dev');
      return;
    }

    // Test 2: Check if NestJS API is running
    console.log('\n2. Testing NestJS API availability...');
    try {
      const apiResponse = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      console.log('✅ NestJS API is running:', apiResponse.status);
    } catch (error) {
      console.log('❌ NestJS API not accessible. Make sure it\'s running on http://localhost:3001');
      console.log('   Check your api-nestjs setup');
      return;
    }

    // Test 3: Test Better Auth endpoints
    console.log('\n3. Testing Better Auth endpoints...');
    
    // Test signup endpoint
    try {
      const testUser = {
        email: `test-${Date.now()}@example.com`,
        password: 'password123',
        name: 'Test User',
        roles: ['BUYER']
      };

      const signupResponse = await axios.post(`${API_URL}/auth/v2/signup`, testUser);
      console.log('✅ Signup endpoint working:', signupResponse.status);
      
      const token = signupResponse.data?.data?.session?.token;
      if (token) {
        console.log('✅ JWT token received');

        // Test protected endpoint
        const meResponse = await axios.get(`${API_URL}/auth/v2/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Protected endpoint accessible:', meResponse.status);

        // Test signout
        await axios.post(`${API_URL}/auth/v2/signout`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Signout endpoint working');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists (expected for repeated tests)');
      } else {
        console.log('❌ Better Auth endpoints error:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Integration test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Try creating a new account');
    console.log('3. Sign in and access the dashboard');
    console.log('4. Test the user menu and sign out functionality');

  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Run the test
testIntegration();