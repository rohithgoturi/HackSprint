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
  console.log('RUNNING PHASE 7 AUTOMATED VERIFICATION TESTS');
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

    console.log('[PASS] Authenticated Citizen 1, Citizen 2, Admin, Worker 1\n');

    // Create a new complaint to trigger notifications
    console.log('--> Creating complaint to test notification triggers...');
    const createRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: { description: 'Water main leakage flooding main street corner.' }
    });
    if (createRes.status !== 201) throw new Error(`Complaint creation failed: ${createRes.status}`);
    const complaintId = createRes.body.data.id;
    console.log(`[PASS] Complaint created (ID: ${complaintId})`);

    // TEST 1: Citizen Dashboard
    console.log('\nTEST 1: GET /api/dashboard/citizen');
    const citizenDashRes = await request('/api/dashboard/citizen', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (citizenDashRes.status !== 200 || citizenDashRes.body.data.summary.total === undefined) {
      throw new Error(`TEST 1 Failed: ${citizenDashRes.status}`);
    }
    console.log(`[PASS] Citizen Dashboard metrics: total=${citizenDashRes.body.data.summary.total}, recentComplaints=${citizenDashRes.body.data.recentComplaints.length}`);

    // TEST 2: Worker Dashboard
    console.log('\nTEST 2: GET /api/dashboard/worker');
    const workerDashRes = await request('/api/dashboard/worker', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (workerDashRes.status !== 200 || workerDashRes.body.data.summary.assigned === undefined) {
      throw new Error(`TEST 2 Failed: ${workerDashRes.status}`);
    }
    console.log(`[PASS] Worker Dashboard metrics: assigned=${workerDashRes.body.data.summary.assigned}`);

    // TEST 3: Admin Dashboard
    console.log('\nTEST 3: GET /api/dashboard/admin');
    const adminDashRes = await request('/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminDashRes.status !== 200 || adminDashRes.body.data.summary.totalComplaints === undefined) {
      throw new Error(`TEST 3 Failed: ${adminDashRes.status}`);
    }
    console.log(`[PASS] Admin Dashboard metrics: totalComplaints=${adminDashRes.body.data.summary.totalComplaints}, byCategory=${adminDashRes.body.data.byCategory.length}`);

    // TEST 4: Admin Complaints List with Pagination
    console.log('\nTEST 4: GET /api/admin/complaints?page=1&limit=5');
    const adminListRes = await request('/api/admin/complaints?page=1&limit=5', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (adminListRes.status !== 200 || !adminListRes.body.data.pagination) {
      throw new Error(`TEST 4 Failed: ${adminListRes.status}`);
    }
    console.log(`[PASS] Admin complaints list retrieved. Pagination: total=${adminListRes.body.data.pagination.total}, page=${adminListRes.body.data.pagination.page}`);

    // TEST 5 & 9: Citizen Notifications & Unread Count
    console.log('\nTEST 5 & 9: Citizen Notifications & Unread Count');
    const citizenNotifRes = await request('/api/notifications', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    const unreadRes = await request('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (citizenNotifRes.status !== 200 || unreadRes.status !== 200) {
      throw new Error('TEST 5/9 Failed');
    }
    console.log(`[PASS] Notifications retrieved: total=${citizenNotifRes.body.data.pagination.total}, unreadCount=${unreadRes.body.data.count}`);

    // TEST 7: Mark single notification as read
    if (citizenNotifRes.body.data.notifications.length > 0) {
      const targetNotifId = citizenNotifRes.body.data.notifications[0].id;
      console.log(`\nTEST 7: Mark notification ${targetNotifId} as read`);
      const readRes = await request(`/api/notifications/${targetNotifId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${citizen1Token}` }
      });
      if (readRes.status !== 200 || !readRes.body.data.isRead) {
        throw new Error(`TEST 7 Failed: ${readRes.status}`);
      }
      console.log(`[PASS] Notification marked as read`);
    }

    // TEST 8: Mark all notifications as read
    console.log('\nTEST 8: Mark all notifications as read');
    const readAllRes = await request('/api/notifications/read-all', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (readAllRes.status !== 200) throw new Error(`TEST 8 Failed: ${readAllRes.status}`);
    const postReadAllUnread = await request('/api/notifications/unread-count', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (postReadAllUnread.body.data.count !== 0) throw new Error('TEST 8 Failed: count not 0');
    console.log(`[PASS] All notifications marked read. Unread count: ${postReadAllUnread.body.data.count}`);

    // TEST 10: Complaint Timeline
    console.log(`\nTEST 10: GET /api/complaints/${complaintId}/timeline`);
    const timelineRes = await request(`/api/complaints/${complaintId}/timeline`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (timelineRes.status !== 200 || !timelineRes.body.data.timeline.length) {
      throw new Error(`TEST 10 Failed: ${timelineRes.status}`);
    }
    console.log(`[PASS] Timeline retrieved. First event: "${timelineRes.body.data.timeline[0].message}"`);

    // TEST 11: Complaint Detail
    console.log(`\nTEST 11: GET /api/complaints/${complaintId}`);
    const detailRes = await request(`/api/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (detailRes.status !== 200 || detailRes.body.data.id !== complaintId) {
      throw new Error(`TEST 11 Failed: ${detailRes.status}`);
    }
    console.log(`[PASS] Complaint detail retrieved successfully`);

    // SECURITY TESTS
    console.log('\n==================================================');
    console.log('SECURITY AUTHORIZATION TESTS');
    console.log('==================================================');

    // Sec 12: Citizen attempts admin dashboard
    console.log('Sec 12: Citizen attempts admin dashboard');
    const s12 = await request('/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (s12.status !== 403) throw new Error(`Sec 12 Failed: Expected 403, got ${s12.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 13: Citizen attempts worker dashboard
    console.log('Sec 13: Citizen attempts worker dashboard');
    const s13 = await request('/api/dashboard/worker', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (s13.status !== 403) throw new Error(`Sec 13 Failed: Expected 403, got ${s13.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 14: Worker attempts admin dashboard
    console.log('Sec 14: Worker attempts admin dashboard');
    const s14 = await request('/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (s14.status !== 403) throw new Error(`Sec 14 Failed: Expected 403, got ${s14.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // Sec 16: Citizen 2 attempts viewing Citizen 1 complaint
    console.log("Sec 16: Citizen 2 attempts viewing Citizen 1's complaint");
    const s16 = await request(`/api/complaints/${complaintId}`, {
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    if (s16.status !== 403) throw new Error(`Sec 16 Failed: Expected 403, got ${s16.status}`);
    console.log(`[PASS] Blocked with 403 Forbidden`);

    // REGRESSION SAFETY
    console.log('\n==================================================');
    console.log('REGRESSION SAFETY VERIFICATION');
    console.log('==================================================');
    const healthRes = await request('/api/health');
    if (healthRes.status !== 200) throw new Error('Health endpoint failure');
    console.log(`[PASS] GET /api/health OK`);

    console.log('\n==================================================');
    console.log('ALL PHASE 7 AUTOMATED TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error(`\n[TEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

runTests();
