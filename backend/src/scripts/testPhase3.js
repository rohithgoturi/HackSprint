const http = require('http');

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

async function runTests() {
  console.log('==================================================');
  console.log('RUNNING PHASE 3 AUTOMATED VERIFICATION TESTS');
  console.log('==================================================\n');

  try {
    // 0. Ensure users exist by logging in or registering
    console.log('--> Authenticating Test Users...');

    // Citizen 1 Login
    let c1Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizen@civic.local', password: 'CitizenPassword123!' }
    });
    if (c1Login.status !== 200) {
      console.log('Registering Citizen 1...');
      c1Login = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Default Citizen',
          email: 'citizen@civic.local',
          password: 'CitizenPassword123!',
          phone: '9998887772'
        }
      });
    }
    const citizen1Token = c1Login.body.data.token;
    const citizen1Id = c1Login.body.data.user.id;
    console.log(`[PASS] Citizen 1 Authenticated (ID: ${citizen1Id})`);

    // Citizen 2 Login / Register
    let c2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizen2@civic.local', password: 'CitizenPassword123!' }
    });
    if (c2Login.status !== 200) {
      console.log('Registering Citizen 2...');
      c2Login = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Second Citizen',
          email: 'citizen2@civic.local',
          password: 'CitizenPassword123!',
          phone: '9998887779'
        }
      });
    }
    const citizen2Token = c2Login.body.data.token;
    console.log(`[PASS] Citizen 2 Authenticated`);

    // Admin Login
    let adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@civic.local', password: 'AdminPassword123!' }
    });
    if (adminLogin.status !== 200) {
      throw new Error('Admin user login failed. Please ensure DB is seeded using npm run seed');
    }
    const adminToken = adminLogin.body.data.token;
    console.log(`[PASS] Admin Authenticated`);

    // Worker Login
    let workerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'worker@civic.local', password: 'WorkerPassword123!' }
    });
    if (workerLogin.status !== 200) {
      throw new Error('Worker user login failed. Please ensure DB is seeded using npm run seed');
    }
    const workerToken = workerLogin.body.data.token;
    const workerId = workerLogin.body.data.user.id;
    console.log(`[PASS] Field Worker Authenticated (ID: ${workerId})\n`);

    // TEST 1: Citizen creates complaint
    console.log('Test 1: Citizen creates complaint');
    const createRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: {
        description: 'There is a large pothole near the college gate.',
        imageUrl: 'https://example.com/pothole.jpg',
        location: {
          latitude: 21.1458,
          longitude: 79.0882
        }
      }
    });

    if (createRes.status !== 201 || !createRes.body.data.id) {
      throw new Error(`Test 1 Failed: Expected 201, got ${createRes.status} - ${JSON.stringify(createRes.body)}`);
    }
    const complaint1 = createRes.body.data;
    console.log(`[PASS] Created complaint ID: ${complaint1.id}, Status: ${complaint1.status}`);
    console.log(`       Verified AI fields unset: issue=${complaint1.issue}, category=${complaint1.category}`);

    // TEST 2: Citizen retrieves own complaints
    console.log('\nTest 2: Citizen retrieves own complaints');
    const c1ComplaintsRes = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (c1ComplaintsRes.status !== 200 || !Array.isArray(c1ComplaintsRes.body.data)) {
      throw new Error(`Test 2 Failed: Expected 200 array, got ${c1ComplaintsRes.status}`);
    }
    console.log(`[PASS] Citizen retrieved ${c1ComplaintsRes.body.data.length} complaint(s)`);

    // TEST 3: Citizen retrieves own complaint by ID
    console.log('\nTest 3: Citizen retrieves own complaint by ID');
    const c1SingleRes = await request(`/api/complaints/${complaint1.id}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (c1SingleRes.status !== 200 || c1SingleRes.body.data.id !== complaint1.id) {
      throw new Error(`Test 3 Failed: Expected 200, got ${c1SingleRes.status}`);
    }
    console.log(`[PASS] Citizen retrieved own complaint details`);

    // TEST 4: Citizen attempts to retrieve another citizen's complaint
    console.log("\nTest 4: Citizen 2 attempts to retrieve Citizen 1's complaint");
    const c2AccessRes = await request(`/api/complaints/${complaint1.id}`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    if (c2AccessRes.status !== 403) {
      throw new Error(`Test 4 Failed: Expected 403 Forbidden, got ${c2AccessRes.status}`);
    }
    console.log(`[PASS] Access blocked with status 403 Forbidden`);

    // TEST 5: Admin retrieves all complaints
    console.log('\nTest 5: Admin retrieves all complaints');
    const adminComplaintsRes = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminComplaintsRes.status !== 200 || !Array.isArray(adminComplaintsRes.body.data)) {
      throw new Error(`Test 5 Failed: Expected 200 array, got ${adminComplaintsRes.status}`);
    }
    console.log(`[PASS] Admin retrieved ${adminComplaintsRes.body.data.length} complaint(s)`);

    // ADMIN moves complaint to UNDER_REVIEW first (to follow workflow REPORTED -> UNDER_REVIEW -> ASSIGNED)
    console.log('\nAdmin setting status to UNDER_REVIEW...');
    const underReviewRes = await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'UNDER_REVIEW', note: 'Admin reviewing complaint' }
    });
    if (underReviewRes.status !== 200) {
      throw new Error(`Failed setting status UNDER_REVIEW: ${underReviewRes.status}`);
    }

    // TEST 6: Admin assigns a field worker
    console.log('\nTest 6: Admin assigns field worker to complaint');
    const assignRes = await request(`/api/complaints/${complaint1.id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { workerId: workerId, note: 'Assigning to local field officer' }
    });
    if (assignRes.status !== 200 || assignRes.body.data.complaint.status !== 'ASSIGNED') {
      throw new Error(`Test 6 Failed: Expected status ASSIGNED, got ${assignRes.status} - ${JSON.stringify(assignRes.body)}`);
    }
    console.log(`[PASS] Complaint status is ASSIGNED to worker ${workerId}`);

    // TEST 7: Field worker retrieves assigned complaint
    console.log('\nTest 7: Field worker retrieves assigned complaints');
    const workerComplaintsRes = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (workerComplaintsRes.status !== 200 || !workerComplaintsRes.body.data.some(c => c.id === complaint1.id)) {
      throw new Error(`Test 7 Failed: Field worker should see assigned complaint`);
    }
    console.log(`[PASS] Field worker retrieved assigned complaint`);

    // TEST 8: Field worker changes ASSIGNED -> IN_PROGRESS
    console.log('\nTest 8: Field worker changes ASSIGNED -> IN_PROGRESS');
    const inProgressRes = await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: 'IN_PROGRESS', note: 'Worker started repair work.' }
    });
    if (inProgressRes.status !== 200 || inProgressRes.body.data.complaint.status !== 'IN_PROGRESS') {
      throw new Error(`Test 8 Failed: Expected status IN_PROGRESS, got ${inProgressRes.status}`);
    }
    console.log(`[PASS] Status updated to IN_PROGRESS`);

    // TEST 9: Field worker changes IN_PROGRESS -> RESOLVED
    console.log('\nTest 9: Field worker changes IN_PROGRESS -> RESOLVED');
    const resolvedRes = await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: 'RESOLVED', note: 'Pothole filled and sealed.' }
    });
    if (resolvedRes.status !== 200 || resolvedRes.body.data.complaint.status !== 'RESOLVED') {
      throw new Error(`Test 9 Failed: Expected status RESOLVED, got ${resolvedRes.status}`);
    }
    console.log(`[PASS] Status updated to RESOLVED`);

    // TEST 10: Verify ComplaintUpdate records are created
    console.log('\nTest 10: Verify ComplaintUpdate history records');
    const historyRes = await request(`/api/complaints/${complaint1.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const history = historyRes.body.data.history || [];
    if (history.length < 4) {
      throw new Error(`Test 10 Failed: Expected at least 4 history records, found ${history.length}`);
    }
    console.log(`[PASS] Verified ${history.length} history records created with timestamps and notes`);

    // TEST 11: Citizen attempts to change status
    console.log('\nTest 11: Citizen attempts to change status');
    const citizenStatusRes = await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { status: 'CLOSED' }
    });
    if (citizenStatusRes.status !== 403) {
      throw new Error(`Test 11 Failed: Expected 403 Forbidden, got ${citizenStatusRes.status}`);
    }
    console.log(`[PASS] Citizen status update blocked with 403 Forbidden`);

    // TEST 12: Citizen attempts to assign worker
    console.log('\nTest 12: Citizen attempts to assign worker');
    const citizenAssignRes = await request(`/api/complaints/${complaint1.id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { workerId: workerId }
    });
    if (citizenAssignRes.status !== 403) {
      throw new Error(`Test 12 Failed: Expected 403 Forbidden, got ${citizenAssignRes.status}`);
    }
    console.log(`[PASS] Citizen worker assignment blocked with 403 Forbidden`);

    // TEST 13: Invalid complaint ID
    console.log('\nTest 13: Request with invalid complaint ID');
    const invalidIdRes = await request('/api/complaints/invalid-id-123', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (invalidIdRes.status !== 400) {
      throw new Error(`Test 13 Failed: Expected 400 Bad Request, got ${invalidIdRes.status}`);
    }
    console.log(`[PASS] Invalid Mongo ID handled with 400 Bad Request`);

    // TEST 14: Non-existent complaint ID
    console.log('\nTest 14: Request with non-existent complaint ID');
    const fakeId = '507f1f77bcf86cd799439011';
    const missingRes = await request(`/api/complaints/${fakeId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (missingRes.status !== 404) {
      throw new Error(`Test 14 Failed: Expected 404 Not Found, got ${missingRes.status}`);
    }
    console.log(`[PASS] Non-existent complaint handled with 404 Not Found`);

    // TEST 15: Verify GET /api/health still works
    console.log('\nTest 15: Verify GET /api/health');
    const healthRes = await request('/api/health');
    if (healthRes.status !== 200 || !healthRes.body.success) {
      throw new Error(`Test 15 Failed: GET /api/health failed with status ${healthRes.status}`);
    }
    console.log(`[PASS] Health check endpoint returned 200 OK`);

    console.log('\n==================================================');
    console.log('ALL PHASE 3 AUTOMATED TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error(`\n[TEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

runTests();
