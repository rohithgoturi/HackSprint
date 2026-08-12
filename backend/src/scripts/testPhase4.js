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
  console.log('RUNNING PHASE 4 AUTOMATED VERIFICATION TESTS');
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

    console.log('[PASS] Test users authenticated\n');

    // 1. Create a citizen complaint with description
    console.log('Test 1: Create complaint for AI analysis');
    const createRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: {
        description: 'There is a large pothole near the college gate. Vehicles are struggling to pass.',
        location: { latitude: 21.1458, longitude: 79.0882 }
      }
    });
    if (createRes.status !== 201) {
      throw new Error(`Failed creating complaint: ${createRes.status}`);
    }
    const complaint1 = createRes.body.data;
    console.log(`[PASS] Complaint created (ID: ${complaint1.id})`);

    // 2. Call POST /api/complaints/:id/analyze
    console.log('\nTest 2-9: Trigger AI analysis POST /api/complaints/:id/analyze');
    const analyzeRes = await request(`/api/complaints/${complaint1.id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });

    const hasApiKey = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '';

    if (!hasApiKey) {
      console.log(`[INFO] GEMINI_API_KEY is not defined in environment.`);
      if (analyzeRes.status !== 500 && analyzeRes.status !== 502) {
        throw new Error(`Expected clean error when GEMINI_API_KEY missing, got status ${analyzeRes.status}`);
      }
      console.log(`[PASS] Missing API key handled cleanly with status ${analyzeRes.status} and message: "${analyzeRes.body.message}"`);
    } else {
      if (analyzeRes.status !== 200) {
        throw new Error(`AI Analysis failed with status ${analyzeRes.status}: ${JSON.stringify(analyzeRes.body)}`);
      }
      const updated = analyzeRes.body.data.complaint;
      console.log(`[PASS] AI Analysis succeeded!`);
      console.log(`       - Issue: "${updated.issue}"`);
      console.log(`       - Category: "${updated.category}"`);
      console.log(`       - Severity: "${updated.severity}"`);
      console.log(`       - Priority: "${updated.priority}"`);
      console.log(`       - Department: "${updated.department ? updated.department.name : 'N/A'}"`);
      console.log(`       - Reasoning: "${updated.aiAnalysis.reasoning}"`);

      // Verify category in allowed list
      const allowedCategories = [
        'road_infrastructure',
        'garbage_sanitation',
        'streetlight_electrical',
        'water_supply',
        'drainage',
        'fallen_tree',
        'public_infrastructure',
        'other'
      ];
      if (!allowedCategories.includes(updated.category)) {
        throw new Error(`Category "${updated.category}" not in allowed list`);
      }

      // Verify severity in allowed list
      const allowedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!allowedSeverities.includes(updated.severity)) {
        throw new Error(`Severity "${updated.severity}" not in allowed list`);
      }

      // Verify priority calculated
      if (!updated.priority) {
        throw new Error('Priority was not calculated');
      }

      // Verify aiAnalysis stored
      if (!updated.aiAnalysis || !updated.aiAnalysis.analyzedAt) {
        throw new Error('aiAnalysis subdocument was not saved properly');
      }
    }

    // 10. Test complaint with imageUrl
    console.log('\nTest 10: Create complaint with image URL');
    const imageRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen1Token}` },
      body: {
        description: 'Water leak from main pipeline on 5th avenue.',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7'
      }
    });
    if (imageRes.status !== 201) {
      throw new Error(`Failed creating complaint with image: ${imageRes.status}`);
    }
    const complaintWithImage = imageRes.body.data;
    console.log(`[PASS] Complaint with imageUrl created (ID: ${complaintWithImage.id})`);

    if (hasApiKey) {
      console.log('Analyzing complaint with image...');
      const imageAnalyzeRes = await request(`/api/complaints/${complaintWithImage.id}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${citizen1Token}` }
      });
      if (imageAnalyzeRes.status === 200) {
        console.log(`[PASS] Image complaint analyzed: category=${imageAnalyzeRes.body.data.complaint.category}`);
      }
    }

    // 11. Test invalid complaint ID
    console.log('\nTest 11: Invalid complaint ID for analysis');
    const invalidRes = await request('/api/complaints/invalid-id-999/analyze', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (invalidRes.status !== 400) {
      throw new Error(`Expected 400 Bad Request, got ${invalidRes.status}`);
    }
    console.log(`[PASS] Invalid Mongo ID handled with 400 Bad Request`);

    // 12. Test unauthorized complaint analysis
    console.log("\nTest 12: Citizen 2 attempts to analyze Citizen 1's complaint");
    const unauthorizedRes = await request(`/api/complaints/${complaint1.id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizen2Token}` }
    });
    if (unauthorizedRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden, got ${unauthorizedRes.status}`);
    }
    console.log(`[PASS] Unauthorized analysis blocked with 403 Forbidden`);

    console.log('\nTest 13: Field worker attempts to trigger complaint analysis');
    const workerAuthRes = await request(`/api/complaints/${complaint1.id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerToken}` }
    });
    if (workerAuthRes.status !== 403) {
      throw new Error(`Expected 403 Forbidden for Field Worker, got ${workerAuthRes.status}`);
    }
    console.log(`[PASS] Field worker analysis attempt blocked with 403 Forbidden`);

    // 14. Verify GET /api/health
    console.log('\nTest 14: Verify /api/health endpoint');
    const healthRes = await request('/api/health');
    if (healthRes.status !== 200) {
      throw new Error(`Health check failed: ${healthRes.status}`);
    }
    console.log(`[PASS] Health check passed`);

    // 15. Verify Phase 1-3 API regressions
    console.log('\nTest 15: Verify auth & complaints list regression safety');
    const meRes = await request('/api/auth/me', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (meRes.status !== 200) {
      throw new Error(`Auth me endpoint regression failure: ${meRes.status}`);
    }
    console.log(`[PASS] Auth profile endpoint working`);

    const listRes = await request('/api/complaints', {
      headers: { Authorization: `Bearer ${citizen1Token}` }
    });
    if (listRes.status !== 200) {
      throw new Error(`Complaint list regression failure: ${listRes.status}`);
    }
    console.log(`[PASS] Complaint list endpoint working`);

    console.log('\n==================================================');
    console.log('ALL PHASE 4 AUTOMATED TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error(`\n[TEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

runTests();
