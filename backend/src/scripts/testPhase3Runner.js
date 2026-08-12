require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const BASE_URL = 'http://localhost:5000';

async function request(path, options = {}) {
  const url = new URL(path, BASE_URL);
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const bodyData = options.body ? JSON.stringify(options.body) : null;

  return new Promise((resolve, reject) => {
    const req = http.request(
      url,
      {
        method: options.method || 'GET',
        headers
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => {
          rawData += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = rawData ? JSON.parse(rawData) : {};
            resolve({
              status: res.statusCode,
              body: parsed
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              body: rawData
            });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function runPhase3Tests() {
  console.log('==================================================');
  console.log('PHASE 3: CITIZEN COMPLAINT API EXHAUSTIVE TEST SUITE');
  console.log('==================================================\n');

  const results = {};

  try {
    // 0. Setup Users
    console.log('--> Setup: Authenticating Citizen A and Citizen B...');
    let cALogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizena_p3@civic.local', password: 'CitizenPassword123!' }
    });
    if (cALogin.status !== 200) {
      cALogin = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Citizen A',
          email: 'citizena_p3@civic.local',
          password: 'CitizenPassword123!',
          phone: '9876543210'
        }
      });
    }
    const citizenAToken = cALogin.body.data.token;
    const citizenAId = cALogin.body.data.user.id;

    let cBLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizenb_p3@civic.local', password: 'CitizenPassword123!' }
    });
    if (cBLogin.status !== 200) {
      cBLogin = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Citizen B',
          email: 'citizenb_p3@civic.local',
          password: 'CitizenPassword123!',
          phone: '9876543211'
        }
      });
    }
    const citizenBToken = cBLogin.body.data.token;
    const citizenBId = cBLogin.body.data.user.id;

    console.log(`[SETUP OK] Citizen A (ID: ${citizenAId}), Citizen B (ID: ${citizenBId})\n`);

    // TEST 1: CREATE COMPLAINT
    console.log('--- TEST 1: CREATE COMPLAINT ---');
    const t1Res = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: {
        description: 'There is a large pothole near the college gate. Vehicles are struggling to pass and it may cause accidents.',
        location: {
          latitude: 21.1458,
          longitude: 79.0882
        },
        imageUrl: 'https://example.com/pothole.jpg'
      }
    });

    if (
      t1Res.status === 201 &&
      t1Res.body.success === true &&
      t1Res.body.data.id &&
      t1Res.body.data.status === 'REPORTED' &&
      t1Res.body.data.description.includes('large pothole') &&
      t1Res.body.data.location.latitude === 21.1458 &&
      t1Res.body.data.createdAt
    ) {
      console.log(`[PASS] Complaint created successfully (ID: ${t1Res.body.data.id})`);
      results['1. Create Complaint'] = 'PASS';
    } else {
      console.error(`[FAIL] Test 1 unexpected response: ${JSON.stringify(t1Res)}`);
      results['1. Create Complaint'] = 'FAIL';
    }
    const complaintAId = t1Res.body.data.id;

    // TEST 2: GET MY COMPLAINTS
    console.log('\n--- TEST 2: GET MY COMPLAINTS ---');
    const t2Res = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });
    if (
      t2Res.status === 200 &&
      t2Res.body.success === true &&
      Array.isArray(t2Res.body.data) &&
      t2Res.body.data.some((c) => c.id === complaintAId)
    ) {
      console.log(`[PASS] Retreived ${t2Res.body.data.length} complaint(s) for Citizen A`);
      results['2. Get My Complaints'] = 'PASS';
    } else {
      console.error(`[FAIL] Test 2 unexpected response: ${JSON.stringify(t2Res)}`);
      results['2. Get My Complaints'] = 'FAIL';
    }

    // TEST 3: GET SINGLE COMPLAINT
    console.log('\n--- TEST 3: GET SINGLE COMPLAINT ---');
    const t3Res = await request(`/api/complaints/${complaintAId}`, {
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });
    if (
      t3Res.status === 200 &&
      t3Res.body.success === true &&
      t3Res.body.data.id === complaintAId &&
      t3Res.body.data.status === 'REPORTED' &&
      t3Res.body.data.location.latitude === 21.1458
    ) {
      console.log(`[PASS] Retreived single complaint details correctly`);
      results['3. Get Single Complaint'] = 'PASS';
    } else {
      console.error(`[FAIL] Test 3 unexpected response: ${JSON.stringify(t3Res)}`);
      results['3. Get Single Complaint'] = 'FAIL';
    }

    // TEST 4: UNAUTHENTICATED ACCESS
    console.log('\n--- TEST 4: UNAUTHENTICATED ACCESS ---');
    const t4a = await request('/api/complaints');
    const t4b = await request(`/api/complaints/${complaintAId}`);
    const t4c = await request('/api/complaints', { method: 'POST', body: { description: 'test' } });

    if (t4a.status === 401 && t4b.status === 401 && t4c.status === 401) {
      console.log('[PASS] Unauthenticated requests rejected with 401 Unauthorized');
      results['4. No Authentication'] = 'PASS';
    } else {
      console.error(`[FAIL] Unauthenticated status codes: GET list=${t4a.status}, GET single=${t4b.status}, POST=${t4c.status}`);
      results['4. No Authentication'] = 'FAIL';
    }

    // TEST 5: INVALID AUTHENTICATION
    console.log('\n--- TEST 5: INVALID AUTHENTICATION ---');
    const t5Res = await request('/api/complaints', {
      headers: { Authorization: 'Bearer invalid-token-string' }
    });
    if (t5Res.status === 401) {
      console.log('[PASS] Invalid token rejected with 401 Unauthorized');
      results['5. Invalid JWT'] = 'PASS';
    } else {
      console.error(`[FAIL] Invalid token response: ${JSON.stringify(t5Res)}`);
      results['5. Invalid JWT'] = 'FAIL';
    }

    // TEST 6: INVALID COMPLAINT ID
    console.log('\n--- TEST 6: INVALID COMPLAINT ID ---');
    const t6a = await request('/api/complaints/123', { headers: { Authorization: `Bearer ${citizenAToken}` } });
    const t6b = await request('/api/complaints/abc', { headers: { Authorization: `Bearer ${citizenAToken}` } });
    const t6c = await request('/api/complaints/invalid-id', { headers: { Authorization: `Bearer ${citizenAToken}` } });

    if (t6a.status === 400 && t6b.status === 400 && t6c.status === 400) {
      console.log('[PASS] Malformed Mongo IDs rejected with 400 Bad Request');
      results['6. Invalid Complaint ID'] = 'PASS';
    } else {
      console.error(`[FAIL] Invalid ID status codes: 123=${t6a.status}, abc=${t6b.status}, invalid-id=${t6c.status}`);
      results['6. Invalid Complaint ID'] = 'FAIL';
    }

    // TEST 7: NON-EXISTENT COMPLAINT
    console.log('\n--- TEST 7: NON-EXISTENT COMPLAINT ---');
    const t7Res = await request('/api/complaints/507f1f77bcf86cd799439011', {
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });
    if (t7Res.status === 404) {
      console.log('[PASS] Non-existent Mongo ID returned 404 Not Found');
      results['7. Non-existent ID'] = 'PASS';
    } else {
      console.error(`[FAIL] Non-existent ID status: ${t7Res.status}`);
      results['7. Non-existent ID'] = 'FAIL';
    }

    // TEST 8: CROSS-CITIZEN ACCESS
    console.log('\n--- TEST 8: CROSS-CITIZEN ACCESS ---');
    const t8Res = await request(`/api/complaints/${complaintAId}`, {
      headers: { Authorization: `Bearer ${citizenBToken}` }
    });
    if (t8Res.status === 403) {
      console.log("[PASS] Citizen B blocked from viewing Citizen A's complaint with 403 Forbidden");
      results['8. Cross-user Access'] = 'PASS';
    } else {
      console.error(`[FAIL] Cross-user access status: ${t8Res.status}`);
      results['8. Cross-user Access'] = 'FAIL';
    }

    // TEST 9: CROSS-CITIZEN LISTING & DATA ISOLATION
    console.log('\n--- TEST 9: CROSS-CITIZEN LISTING (DATA ISOLATION) ---');
    const t9CreateB = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenBToken}` },
      body: { description: 'Garbage dump near Citizen B area.' }
    });
    const complaintBId = t9CreateB.body.data.id;

    const t9ListA = await request('/api/complaints', { headers: { Authorization: `Bearer ${citizenAToken}` } });
    const t9ListB = await request('/api/complaints', { headers: { Authorization: `Bearer ${citizenBToken}` } });

    const aHasB = t9ListA.body.data.some((c) => c.id === complaintBId);
    const bHasA = t9ListB.body.data.some((c) => c.id === complaintAId);

    if (!aHasB && !bHasA) {
      console.log('[PASS] Data isolation verified: Citizen A and Citizen B lists are strictly isolated');
      results['9. Data Isolation'] = 'PASS';
    } else {
      console.error(`[FAIL] Data leak detected! A has B: ${aHasB}, B has A: ${bHasA}`);
      results['9. Data Isolation'] = 'FAIL';
    }

    // TEST 10: INPUT VALIDATION
    console.log('\n--- TEST 10: INPUT VALIDATION ---');
    const t10a = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: {}
    });
    const t10b = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { description: '   ' }
    });
    const t10c = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { description: 'Test', location: { latitude: 'invalid', longitude: 'invalid' } }
    });

    if (t10a.status === 400 && t10b.status === 400 && t10c.status === 400) {
      console.log('[PASS] Invalid descriptions and location coordinates rejected with 400 Bad Request');
      results['10. Input Validation'] = 'PASS';
    } else {
      console.error(`[FAIL] Input validation status codes: empty object=${t10a.status}, whitespace=${t10b.status}, invalid location=${t10c.status}`);
      results['10. Input Validation'] = 'FAIL';
    }

    // TEST 11: MASS / UNEXPECTED INPUT SANITY
    console.log('\n--- TEST 11: MASS / UNEXPECTED INPUT SANITY ---');
    const t11Res = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: {
        description: 'Test complaint with malicious override fields',
        role: 'ADMIN',
        citizenId: '507f1f77bcf86cd799439099',
        status: 'CLOSED',
        priority: 'CRITICAL'
      }
    });

    if (
      t11Res.status === 201 &&
      t11Res.body.data.status === 'REPORTED' &&
      (t11Res.body.data.citizen.id === citizenAId || t11Res.body.data.citizen === citizenAId)
    ) {
      console.log('[PASS] Mass assignment attempts ignored: status forced to REPORTED and citizen bound to JWT identity');
      results['11. Unexpected Fields'] = 'PASS';
    } else {
      console.error(`[FAIL] Mass assignment output: ${JSON.stringify(t11Res)}`);
      results['11. Unexpected Fields'] = 'FAIL';
    }

    // TEST 12: STATUS SECURITY
    console.log('\n--- TEST 12: STATUS SECURITY ---');
    const t12Res = await request(`/api/complaints/${complaintAId}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { status: 'CLOSED' }
    });
    if (t12Res.status === 403) {
      console.log('[PASS] Citizen blocked from updating complaint status with 403 Forbidden');
      results['12. Status Security'] = 'PASS';
    } else {
      console.error(`[FAIL] Status security response: ${JSON.stringify(t12Res)}`);
      results['12. Status Security'] = 'FAIL';
    }

    // TEST 13: MONGODB VERIFICATION
    console.log('\n--- TEST 13: MONGODB VERIFICATION ---');
    const connectDB = require('../config/db');
    await connectDB();
    const Complaint = require('../models/Complaint');
    const dbComplaint = await Complaint.findById(complaintAId);

    if (
      dbComplaint &&
      dbComplaint.citizen.toString() === citizenAId &&
      dbComplaint.status === 'REPORTED' &&
      dbComplaint.description.includes('large pothole') &&
      dbComplaint.createdAt &&
      dbComplaint.updatedAt
    ) {
      console.log('[PASS] Direct MongoDB query verified schema integrity');
      results['13. MongoDB Verification'] = 'PASS';
    } else {
      console.error(`[FAIL] MongoDB document verification failed: ${JSON.stringify(dbComplaint)}`);
      results['13. MongoDB Verification'] = 'FAIL';
    }

    // TEST 14: SERVER STABILITY
    console.log('\n--- TEST 14: SERVER STABILITY ---');
    const t14Res = await request('/api/health');
    if (t14Res.status === 200) {
      console.log('[PASS] Local backend server running smoothly with 200 OK on /api/health');
      results['14. Server Stability'] = 'PASS';
    } else {
      console.error(`[FAIL] Server health check status: ${t14Res.status}`);
      results['14. Server Stability'] = 'FAIL';
    }

    console.log('\n==================================================');
    console.log('SUMMARY OF PHASE 3 TEST RESULTS:');
    console.log('==================================================');
    let passCount = 0;
    let failCount = 0;
    for (const [testName, result] of Object.entries(results)) {
      console.log(`${testName.padEnd(30)} : ${result}`);
      if (result === 'PASS') passCount++;
      else failCount++;
    }
    console.log(`\nTOTAL: ${Object.keys(results).length} | PASSED: ${passCount} | FAILED: ${failCount}`);

  } catch (err) {
    console.error(`[FATAL SUITE ERROR] ${err.message}`);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase3Tests();
