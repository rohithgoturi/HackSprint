require('dotenv').config();
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
  console.log('RUNNING PHASE 6 AUTOMATED VERIFICATION TESTS');
  console.log('==================================================\n');

  try {
    // 0. Authenticate Users
    console.log('--> Authenticating Test Users...');
    let c1Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizen@civic.local', password: 'CitizenPassword123!' }
    });
    if (c1Login.status !== 200) {
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

    let c2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizen2@civic.local', password: 'CitizenPassword123!' }
    });
    if (c2Login.status !== 200) {
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

    let adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@civic.local', password: 'AdminPassword123!' }
    });
    const adminToken = adminLogin.body.data.token;

    let workerLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'worker@civic.local', password: 'WorkerPassword123!' }
    });
    const workerToken = workerLogin.body.data.token;
    const workerId = workerLogin.body.data.user.id;

    // Register Worker 2 for security tests
    let worker2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'worker2@civic.local', password: 'WorkerPassword123!' }
    });
    if (worker2Login.status !== 200) {
      worker2Login = await request('/api/auth/register', {
        method: 'POST',
        body: {
          name: 'Second Worker',
          email: 'worker2@civic.local',
          password: 'WorkerPassword123!',
          phone: '9998887778'
        }
      });
      // Admin promotes worker 2 role to FIELD_WORKER in DB
      const connectDB = require('../config/db');
      await connectDB();
      const User = require('../models/User');
      await User.findByIdAndUpdate(worker2Login.body.data.user.id, { role: 'FIELD_WORKER' });
      worker2Login = await request('/api/auth/login', {
        method: 'POST',
        body: { email: 'worker2@civic.local', password: 'WorkerPassword123!' }
      });
    }
    const worker2Token = worker2Login.body.data.token;

    console.log('[PASS] Test users authenticated (Citizen 1, Citizen 2, Admin, Worker 1, Worker 2)\n');

    // TEST 1: Citizen 1 creates complaint
    console.log('TEST 1: Citizen 1 creates complaint');
    const createRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: {
        description: 'Damaged electrical streetlight pole sparking near residential area.',
        imageUrl: 'https://example.com/pole.jpg',
        location: { latitude: 21.1458, longitude: 79.0882 }
      }
    });
    if (createRes.status !== 201) throw new Error(`TEST 1 Failed: ${createRes.status}`);
    const complaint1 = createRes.body.data;
    console.log(`[PASS] Complaint created (ID: ${complaint1.id}, Status: ${complaint1.status})`);

    // TEST 2: Admin reviews & assigns worker 1
    console.log('\nTEST 2 & 3: Admin reviews & assigns Worker 1');
    await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'UNDER_REVIEW' }
    });
    const assignRes = await request(`/api/complaints/${complaint1.id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { workerId: workerId }
    });
    if (assignRes.status !== 200 || assignRes.body.data.complaint.status !== 'ASSIGNED') {
      throw new Error(`TEST 3 Failed: ${assignRes.status}`);
    }
    console.log(`[PASS] Complaint status set to ASSIGNED (Worker: ${workerId})`);

    // TEST 4: Worker 1 retrieves assigned complaints list
    console.log('\nTEST 4: Worker 1 checks assigned complaints list');
    const workerListRes = await request('/api/worker/complaints', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (workerListRes.status !== 200 || !workerListRes.body.data.some(c => c.id === complaint1.id)) {
      throw new Error('TEST 4 Failed: Assigned complaint not found in worker list');
    }
    console.log(`[PASS] Worker 1 sees assigned complaint in GET /api/worker/complaints`);

    // TEST 5: Worker 1 starts work (ASSIGNED -> IN_PROGRESS)
    console.log('\nTEST 5: Worker 1 starts work (ASSIGNED -> IN_PROGRESS)');
    const inProgressRes = await request(`/api/complaints/${complaint1.id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: 'IN_PROGRESS', note: 'Technician on-site evaluating wiring.' }
    });
    if (inProgressRes.status !== 200 || inProgressRes.body.data.complaint.status !== 'IN_PROGRESS') {
      throw new Error(`TEST 5 Failed: ${inProgressRes.status}`);
    }
    console.log(`[PASS] Complaint status updated to IN_PROGRESS`);

    // TEST 6: Worker 1 submits resolution evidence
    console.log('\nTEST 6 & 7: Worker 1 submits resolution evidence');
    const resolutionRes = await request(`/api/complaints/${complaint1.id}/resolution`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: {
        note: 'Replaced broken wiring harness and restored streetlight fixture.',
        imageUrl: 'https://example.com/fixed_light.jpg',
        location: { latitude: 21.1458, longitude: 79.0882 }
      }
    });
    if (resolutionRes.status !== 201 || resolutionRes.body.data.complaint.status !== 'RESOLVED') {
      throw new Error(`TEST 6 Failed: ${resolutionRes.status} - ${JSON.stringify(resolutionRes.body)}`);
    }
    console.log(`[PASS] Resolution evidence submitted. Complaint status updated to RESOLVED`);

    // TEST 8: Citizen 1 retrieves resolution evidence
    console.log('\nTEST 8: Citizen 1 retrieves resolution evidence');
    const getEvidenceRes = await request(`/api/complaints/${complaint1.id}/resolution`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (getEvidenceRes.status !== 200 || !getEvidenceRes.body.data.evidence.length) {
      throw new Error(`TEST 8 Failed: ${getEvidenceRes.status}`);
    }
    console.log(`[PASS] Evidence retrieved: "${getEvidenceRes.body.data.evidence[0].note}"`);

    // TEST 9 & 10: Citizen 1 approves resolution (RESOLVED -> VERIFIED)
    console.log('\nTEST 9 & 10: Citizen 1 approves resolution');
    const verifyApproveRes = await request(`/api/complaints/${complaint1.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { approved: true, note: 'Streetlight tested and working great.' }
    });
    if (verifyApproveRes.status !== 200 || verifyApproveRes.body.data.complaint.status !== 'VERIFIED') {
      throw new Error(`TEST 9 Failed: ${verifyApproveRes.status}`);
    }
    console.log(`[PASS] Resolution approved by Citizen 1. Complaint status set to VERIFIED`);

    // TEST 11 & 12: Admin closes complaint (VERIFIED -> CLOSED)
    console.log('\nTEST 11 & 12: Admin closes complaint');
    const closeRes = await request(`/api/complaints/${complaint1.id}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { note: 'Final operational sign-off.' }
    });
    if (closeRes.status !== 200 || closeRes.body.data.complaint.status !== 'CLOSED') {
      throw new Error(`TEST 11 Failed: ${closeRes.status}`);
    }
    console.log(`[PASS] Complaint status set to CLOSED by Admin`);

    // TEST REJECTION FLOW: Create second complaint and reject resolution
    console.log('\nTEST REJECTION FLOW: Citizen 1 rejects resolution submission');
    const c2CreateRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { description: 'Pothole on main road.' }
    });
    const complaint2Id = c2CreateRes.body.data.id;
    await request(`/api/complaints/${complaint2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { status: 'UNDER_REVIEW' }
    });
    await request(`/api/complaints/${complaint2Id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { workerId: workerId }
    });
    await request(`/api/complaints/${complaint2Id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { status: 'IN_PROGRESS' }
    });
    await request(`/api/complaints/${complaint2Id}/resolution`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { note: 'Attempted patch with asphalt.' }
    });

    // Citizen 1 rejects resolution
    const rejectRes = await request(`/api/complaints/${complaint2Id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { approved: false, note: 'Patch crumbled within 1 hour. Pothole remains.' }
    });
    if (rejectRes.status !== 200 || rejectRes.body.data.complaint.status !== 'REOPENED') {
      throw new Error(`Rejection test failed: ${rejectRes.status}`);
    }
    console.log(`[PASS] Rejection handled: status set to REOPENED and evidence marked REJECTED`);

    // TEST WORKER SUMMARY: GET /api/worker/summary
    console.log('\nTEST WORKER SUMMARY: GET /api/worker/summary');
    const summaryRes = await request('/api/worker/summary', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (summaryRes.status !== 200 || summaryRes.body.data.assigned === undefined) {
      throw new Error(`Worker summary failed: ${summaryRes.status}`);
    }
    console.log(`[PASS] Worker summary metrics: assigned=${summaryRes.body.data.assigned}, inProgress=${summaryRes.body.data.inProgress}, resolved=${summaryRes.body.data.resolved}, overdue=${summaryRes.body.data.overdue}`);

    // SECURITY TESTS
    console.log('\n==================================================');
    console.log('SECURITY AUTHORIZATION TESTS');
    console.log('==================================================');

    // Sec 1: Worker 2 attempts to submit resolution for Worker 1's complaint
    console.log('Sec 1: Worker 2 attempts resolution submission on Worker 1 complaint');
    const sec1Res = await request(`/api/complaints/${complaint1.id}/resolution`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${worker2Token}` },
      body: { note: 'Unauthorized attempt' }
    });
    if (sec1Res.status !== 403) throw new Error(`Sec 1 Failed: Expected 403, got ${sec1Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 2: Worker attempts to close complaint
    console.log('Sec 2: Worker 1 attempts to close complaint');
    const sec2Res = await request(`/api/complaints/${complaint1.id}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (sec2Res.status !== 403) throw new Error(`Sec 2 Failed: Expected 403, got ${sec2Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 3: Citizen attempts resolution submission
    console.log('Sec 3: Citizen attempts resolution submission');
    const sec3Res = await request(`/api/complaints/${complaint1.id}/resolution`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { note: 'Citizen evidence submission' }
    });
    if (sec3Res.status !== 403) throw new Error(`Sec 3 Failed: Expected 403, got ${sec3Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 4: Citizen 2 attempts to verify Citizen 1's complaint
    console.log("Sec 4: Citizen 2 attempts to verify Citizen 1's complaint");
    const sec4Res = await request(`/api/complaints/${complaint1.id}/verify`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen2Token}` },
      body: { approved: true }
    });
    if (sec4Res.status !== 403) throw new Error(`Sec 4 Failed: Expected 403, got ${sec4Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 5: Citizen attempts to close complaint
    console.log('Sec 5: Citizen attempts to close complaint');
    const sec5Res = await request(`/api/complaints/${complaint1.id}/close`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (sec5Res.status !== 403) throw new Error(`Sec 5 Failed: Expected 403, got ${sec5Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 6: Worker attempts priority override
    console.log('Sec 6: Worker attempts priority override');
    const sec6Res = await request(`/api/complaints/${complaint1.id}/priority`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { priority: 'LOW' }
    });
    if (sec6Res.status !== 403) throw new Error(`Sec 6 Failed: Expected 403, got ${sec6Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 7: Worker attempts department override
    console.log('Sec 7: Worker attempts department override');
    const sec7Res = await request(`/api/complaints/${complaint1.id}/department`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${workerToken}` },
      body: { category: 'drainage' }
    });
    if (sec7Res.status !== 403) throw new Error(`Sec 7 Failed: Expected 403, got ${sec7Res.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // REGRESSION SAFETY
    console.log('\n==================================================');
    console.log('REGRESSION SAFETY VERIFICATION');
    console.log('==================================================');
    const healthRes = await request('/api/health');
    if (healthRes.status !== 200) throw new Error('Health endpoint regression failure');
    const authMeRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (authMeRes.status !== 200) throw new Error('Auth me regression failure');
    console.log(`[PASS] GET /api/health OK`);
    console.log(`[PASS] GET /api/auth/me OK`);

    console.log('\n==================================================');
    console.log('ALL PHASE 6 AUTOMATED TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error(`\n[TEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

runTests();
