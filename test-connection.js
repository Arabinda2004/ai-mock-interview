#!/usr/bin/env node

/**
 * Connection Test Script
 * Tests connectivity between frontend and backend
 * 
 * Usage: node test-connection.js
 */

const http = require('http');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';
const TESTS = [
  { name: 'Health Check', path: '/health' },
  { name: 'API Status', path: '/api/status' },
];

console.log('🔍 Testing Backend Connection...\n');
console.log(`Target: ${BACKEND_URL}\n`);

function testEndpoint(endpoint) {
  return new Promise((resolve) => {
    const url = `${BACKEND_URL}${endpoint.path}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            success: true,
            status: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            success: false,
            status: res.statusCode,
            error: 'Invalid JSON response',
            data: data
          });
        }
      });
    }).on('error', (err) => {
      resolve({
        success: false,
        error: err.message
      });
    });
  });
}

async function runTests() {
  let allPassed = true;
  
  for (const test of TESTS) {
    process.stdout.write(`Testing ${test.name}... `);
    
    const result = await testEndpoint(test);
    
    if (result.success && result.status === 200) {
      console.log('✅ PASSED');
      console.log(`  Status: ${result.status}`);
      if (result.data) {
        console.log(`  Response:`, JSON.stringify(result.data, null, 2).split('\n').map(l => `    ${l}`).join('\n'));
      }
    } else {
      console.log('❌ FAILED');
      allPassed = false;
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      if (result.status) {
        console.log(`  Status: ${result.status}`);
      }
      if (result.data) {
        console.log(`  Response: ${result.data}`);
      }
    }
    console.log('');
  }
  
  console.log('\n' + '='.repeat(50));
  if (allPassed) {
    console.log('✅ All tests passed! Backend is accessible.');
    console.log('\nYour backend server is running correctly.');
    console.log('If you still see errors in the frontend:');
    console.log('  1. Clear browser cache and localStorage');
    console.log('  2. Check browser console for authentication errors');
    console.log('  3. Verify CORS settings in backend');
  } else {
    console.log('❌ Some tests failed. Backend might not be running.');
    console.log('\nTroubleshooting steps:');
    console.log('  1. Make sure backend server is running: cd backend && npm start');
    console.log('  2. Check if port 5001 is available');
    console.log('  3. Verify .env file has correct configuration');
    console.log(`  4. Try accessing ${BACKEND_URL}/health in your browser`);
  }
  console.log('='.repeat(50));
}

runTests().catch(console.error);
