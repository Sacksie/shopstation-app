#!/usr/bin/env node

/**
 * Backend Connectivity Test Script
 * 
 * This script helps debug connectivity issues between frontend and backend
 * Run it to test if your backend is accessible and responding correctly
 */

const https = require('https');
const http = require('http');

const BACKEND_URL = 'https://backend-production-2cbb.up.railway.app';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint, BACKEND_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Backend-Test-Script/1.0',
        'Origin': 'https://grocery-compare-app-frontend.vercel.app'
      }
    };

    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }

    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (body) {
      req.write(body);
    }

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing Backend Connectivity');
  console.log('================================');
  console.log(`🌐 Backend URL: ${BACKEND_URL}`);
  console.log('');

  try {
    // Test 1: Basic ping
    console.log('1️⃣ Testing /api/ping...');
    const pingResult = await testEndpoint('/api/ping');
    console.log(`   Status: ${pingResult.status}`);
    console.log(`   Response: ${JSON.stringify(pingResult.data)}`);
    console.log('');

    // Test 2: Health check
    console.log('2️⃣ Testing /api/health...');
    const healthResult = await testEndpoint('/api/health');
    console.log(`   Status: ${healthResult.status}`);
    console.log(`   CORS Info: ${JSON.stringify(healthResult.data.cors)}`);
    console.log('');

    // Test 3: Test endpoint
    console.log('3️⃣ Testing /api/test...');
    const testResult = await testEndpoint('/api/test');
    console.log(`   Status: ${testResult.status}`);
    console.log(`   Response: ${JSON.stringify(testResult.data)}`);
    console.log('');

    // Test 4: Compare endpoint (POST)
    console.log('4️⃣ Testing /api/compare-groceries...');
    const compareBody = JSON.stringify({
      groceryList: ['milk', 'bread']
    });
    const compareResult = await testEndpoint('/api/compare-groceries', 'POST', compareBody);
    console.log(`   Status: ${compareResult.status}`);
    console.log(`   Response: ${JSON.stringify(compareResult.data)}`);
    console.log('');

    console.log('✅ All tests completed!');
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('================');
    console.log(`Ping: ${pingResult.status === 200 ? '✅' : '❌'}`);
    console.log(`Health: ${healthResult.status === 200 ? '✅' : '❌'}`);
    console.log(`Test: ${testResult.status === 200 ? '✅' : '❌'}`);
    console.log(`Compare: ${compareResult.status === 200 ? '✅' : '❌'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the tests
runTests();
