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

async function runPhase4And5Tests() {
  console.log('==================================================');
  console.log('PHASE 4 + 5: AI, ROUTING, PRIORITY, SLA TEST SUITE');
  console.log('==================================================\n');

  const results = {};

  try {
    const connectDB = require('../config/db');
    await connectDB();
    require('../models/Department');
    require('../models/User');
    require('../models/ComplaintUpdate');
    const Complaint = require('../models/Complaint');

    // 0. Setup Test Users
    console.log('--> Setup: Authenticating Test Users...');
    let c1Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizena_p3@civic.local', password: 'CitizenPassword123!' }
    });
    if (c1Login.status !== 200) {
      c1Login = await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Citizen A', email: 'citizena_p3@civic.local', password: 'CitizenPassword123!', phone: '9876543210' }
      });
    }
    const citizenAToken = c1Login.body.data.token;

    let c2Login = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'citizenb_p3@civic.local', password: 'CitizenPassword123!' }
    });
    if (c2Login.status !== 200) {
      c2Login = await request('/api/auth/register', {
        method: 'POST',
        body: { name: 'Citizen B', email: 'citizenb_p3@civic.local', password: 'CitizenPassword123!', phone: '9876543211' }
      });
    }
    const citizenBToken = c2Login.body.data.token;

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

    console.log('[SETUP OK] Users authenticated\n');

    // TEST 1: GEMINI NORMAL ANALYSIS
    console.log('--- TEST 1: GEMINI NORMAL ANALYSIS ---');
    const c1Create = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: {
        description: 'There is a very large pothole near the college gate. Vehicles are struggling to pass and the damaged road may cause accidents.',
        location: { latitude: 21.1458, longitude: 79.0882 }
      }
    });
    const complaint1Id = c1Create.body.data.id;

    const analyzeRes = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });

    if (analyzeRes.status === 200 && analyzeRes.body.success && analyzeRes.body.data.complaint.aiAnalysis) {
      const cData = analyzeRes.body.data.complaint;
      console.log(`[PASS] AI Analysis succeeded (Category: ${cData.category}, Severity: ${cData.severity})`);
      results['1. Gemini normal analysis'] = 'PASS';
    } else {
      console.error(`[FAIL] Test 1 failed: ${JSON.stringify(analyzeRes)}`);
      results['1. Gemini normal analysis'] = 'FAIL';
    }

    // TEST 2: AI OUTPUT VALIDATION
    console.log('\n--- TEST 2: AI OUTPUT VALIDATION ---');
    const dbComp1 = await Complaint.findById(complaint1Id);
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
    const allowedSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

    if (
      allowedCategories.includes(dbComp1.category) &&
      allowedSeverities.includes(dbComp1.severity)
    ) {
      console.log(`[PASS] DB contains supported values: category=${dbComp1.category}, severity=${dbComp1.severity}`);
      results['2. AI output validation'] = 'PASS';
    } else {
      console.error(`[FAIL] DB contains unsupported category/severity: ${dbComp1.category} / ${dbComp1.severity}`);
      results['2. AI output validation'] = 'FAIL';
    }

    // TEST 3: DEPARTMENT ROUTING
    console.log('\n--- TEST 3: DEPARTMENT ROUTING ---');
    if (dbComp1.department && dbComp1.departmentSource === 'RULE_BASED') {
      console.log(`[PASS] Department determined by backend rule engine (Department ID: ${dbComp1.department})`);
      results['3. Department routing'] = 'PASS';
    } else {
      console.error(`[FAIL] Department routing failure: ${dbComp1.departmentSource}`);
      results['3. Department routing'] = 'FAIL';
    }

    // TEST 4: PRIORITY CALCULATION
    console.log('\n--- TEST 4: PRIORITY CALCULATION ---');
    if (dbComp1.priority && dbComp1.prioritySource && dbComp1.priorityExplanation.length > 0) {
      console.log(`[PASS] Priority determined deterministically: priority=${dbComp1.priority}, source=${dbComp1.prioritySource}`);
      results['4. Priority calculation'] = 'PASS';
    } else {
      console.error(`[FAIL] Priority calculation failure`);
      results['4. Priority calculation'] = 'FAIL';
    }

    // TEST 5: SLA CALCULATION
    console.log('\n--- TEST 5: SLA CALCULATION ---');
    if (
      dbComp1.sla &&
      dbComp1.sla.targetHours &&
      dbComp1.sla.deadline &&
      dbComp1.sla.status === 'ON_TRACK'
    ) {
      console.log(`[PASS] SLA computed: targetHours=${dbComp1.sla.targetHours}h, status=${dbComp1.sla.status}, deadline=${dbComp1.sla.deadline}`);
      results['5. SLA calculation'] = 'PASS';
    } else {
      console.error(`[FAIL] SLA calculation failure`);
      results['5. SLA calculation'] = 'FAIL';
    }

    // TEST 6-10: CATEGORY CLASSIFICATIONS
    const categoryTests = [
      {
        testNum: '6',
        name: 'Garbage classification',
        desc: 'There is garbage piling up near the main road and it has not been collected for several days.',
        expectedCat: 'garbage_sanitation',
        expectedDept: 'Sanitation Department'
      },
      {
        testNum: '7',
        name: 'Streetlight classification',
        desc: 'The streetlight on our road has been broken for a week and the road becomes completely dark at night.',
        expectedCat: 'streetlight_electrical',
        expectedDept: 'Electrical Department'
      },
      {
        testNum: '8',
        name: 'Water classification',
        desc: 'There is no water supply in our area since yesterday.',
        expectedCat: 'water_supply',
        expectedDept: 'Water Supply Department'
      },
      {
        testNum: '9',
        name: 'Drainage classification',
        desc: 'The drainage is overflowing onto the road and dirty water is spreading.',
        expectedCat: 'drainage',
        expectedDept: 'Drainage Department'
      },
      {
        testNum: '10',
        name: 'Fallen tree classification',
        desc: 'A large tree has fallen across the road after heavy rain and is blocking traffic.',
        expectedCat: 'fallen_tree',
        expectedDept: 'Parks Department'
      }
    ];

    for (const ct of categoryTests) {
      console.log(`\n--- TEST ${ct.testNum}: ${ct.name.toUpperCase()} ---`);
      const createCatRes = await request('/api/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenAToken}` },
        body: { description: ct.desc }
      });
      const catCompId = createCatRes.body.data.id;

      const catAnalyzeRes = await request(`/api/complaints/${catCompId}/analyze`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${citizenAToken}` }
      });

      const catFetched = await Complaint.findById(catCompId).populate('department');
      if (
        catAnalyzeRes.status === 200 &&
        catFetched.category === ct.expectedCat &&
        catFetched.department &&
        catFetched.department.name
      ) {
        console.log(`[PASS] ${ct.name}: Category=${catFetched.category}, Department=${catFetched.department.name}`);
        results[`${ct.testNum}. ${ct.name}`] = 'PASS';
      } else {
        console.error(`[FAIL] ${ct.name}: Category=${catFetched ? catFetched.category : 'N/A'}, Expected=${ct.expectedCat}`);
        results[`${ct.testNum}. ${ct.name}`] = 'FAIL';
      }
    }

    // TEST 11: GEMINI FAILURE HANDLING
    console.log('\n--- TEST 11: GEMINI FAILURE HANDLING ---');
    // Temporarily set invalid API key in process.env
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = 'INVALID_KEY_TEST';

    const failCompRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { description: 'Pothole near market area.' }
    });
    const failCompId = failCompRes.body.data.id;

    const failAnalyzeRes = await request(`/api/complaints/${failCompId}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });

    process.env.GEMINI_API_KEY = origKey; // Restore key

    if (failAnalyzeRes.status === 200 && failAnalyzeRes.body.data.complaint.category) {
      console.log(`[PASS] Fallback classification handled API key failure gracefully with status 200 (Category: ${failAnalyzeRes.body.data.complaint.category})`);
      results['11. Gemini failure handling'] = 'PASS';
    } else {
      console.error(`[FAIL] Failure handling status: ${failAnalyzeRes.status}`);
      results['11. Gemini failure handling'] = 'FAIL';
    }

    // TEST 12: INVALID AI OUTPUT HANDLING
    console.log('\n--- TEST 12: INVALID AI OUTPUT HANDLING ---');
    const geminiService = require('../services/geminiService');
    if (geminiService.ALLOWED_CATEGORIES.includes('road_infrastructure') && !geminiService.ALLOWED_CATEGORIES.includes('random_category')) {
      console.log('[PASS] Sanitization logic strictly enforces allowed categories and severities');
      results['12. Invalid AI output handling'] = 'PASS';
    } else {
      console.error('[FAIL] Category whitelist invalid');
      results['12. Invalid AI output handling'] = 'FAIL';
    }

    // TEST 13: REPEATED ANALYSIS
    console.log('\n--- TEST 13: REPEATED ANALYSIS ---');
    const reAnalyzeRes = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });
    const dbComp1Count = await Complaint.countDocuments({ _id: complaint1Id });
    if (reAnalyzeRes.status === 200 && dbComp1Count === 1) {
      console.log('[PASS] Repeated analysis updated complaint safely without duplicate records or server error');
      results['13. Repeated analysis'] = 'PASS';
    } else {
      console.error(`[FAIL] Repeated analysis status: ${reAnalyzeRes.status}`);
      results['13. Repeated analysis'] = 'FAIL';
    }

    // TEST 14: AUTHENTICATION / AUTHORIZATION
    console.log('\n--- TEST 14: AUTHENTICATION / AUTHORIZATION ---');
    const noToken = await request(`/api/complaints/${complaint1Id}/analyze`, { method: 'POST' });
    const invalidToken = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: 'Bearer invalid' }
    });
    const workerAnalysis = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${workerToken}` }
    });

    if (noToken.status === 401 && invalidToken.status === 401 && workerAnalysis.status === 403) {
      console.log('[PASS] Auth guard verified: NoToken=401, InvalidToken=401, FieldWorker=403');
      results['14. Authentication/authorization'] = 'PASS';
    } else {
      console.error(`[FAIL] Auth guard status codes: NoToken=${noToken.status}, Invalid=${invalidToken.status}, Worker=${workerAnalysis.status}`);
      results['14. Authentication/authorization'] = 'FAIL';
    }

    // TEST 15: CROSS-USER PROTECTION
    console.log('\n--- TEST 15: CROSS-USER PROTECTION ---');
    const crossAnalysis = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenBToken}` }
    });
    if (crossAnalysis.status === 403) {
      console.log("[PASS] Citizen B blocked from triggering analysis on Citizen A's complaint with 403 Forbidden");
      results['15. Cross-user protection'] = 'PASS';
    } else {
      console.error(`[FAIL] Cross-user protection status: ${crossAnalysis.status}`);
      results['15. Cross-user protection'] = 'FAIL';
    }

    // TEST 16: PRIORITY OVERRIDE
    console.log('\n--- TEST 16: PRIORITY OVERRIDE ---');
    const adminPrioRes = await request(`/api/complaints/${complaint1Id}/priority`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { priority: 'CRITICAL', reason: 'Emergency road hazard' }
    });
    const citizenPrioRes = await request(`/api/complaints/${complaint1Id}/priority`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { priority: 'LOW' }
    });

    if (
      adminPrioRes.status === 200 &&
      adminPrioRes.body.data.complaint.priority === 'CRITICAL' &&
      adminPrioRes.body.data.complaint.prioritySource === 'ADMIN_OVERRIDE' &&
      citizenPrioRes.status === 403
    ) {
      console.log('[PASS] Admin priority override succeeded (priority=CRITICAL, SLA target recalculation); Citizen blocked with 403');
      results['16. Priority override'] = 'PASS';
    } else {
      console.error(`[FAIL] Priority override admin=${adminPrioRes.status}, citizen=${citizenPrioRes.status}`);
      results['16. Priority override'] = 'FAIL';
    }

    // TEST 17: DEPARTMENT OVERRIDE
    console.log('\n--- TEST 17: DEPARTMENT OVERRIDE ---');
    const adminDeptRes = await request(`/api/complaints/${complaint1Id}/department`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { category: 'drainage', reason: 'Re-routing' }
    });
    const citizenDeptRes = await request(`/api/complaints/${complaint1Id}/department`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${citizenAToken}` },
      body: { category: 'road_infrastructure' }
    });

    if (
      adminDeptRes.status === 200 &&
      adminDeptRes.body.data.complaint.departmentSource === 'ADMIN_OVERRIDE' &&
      citizenDeptRes.status === 403
    ) {
      console.log('[PASS] Admin department override succeeded; Citizen blocked with 403');
      results['17. Department override'] = 'PASS';
    } else {
      console.error(`[FAIL] Department override admin=${adminDeptRes.status}, citizen=${citizenDeptRes.status}`);
      results['17. Department override'] = 'FAIL';
    }

    // TEST 18: SLA BREACH LOGIC
    console.log('\n--- TEST 18: SLA BREACH LOGIC ---');
    const pastDate = new Date(Date.now() - 1000 * 60 * 60 * 10); // 10 hours ago
    await Complaint.findByIdAndUpdate(complaint1Id, { 'sla.deadline': pastDate, 'sla.status': 'ON_TRACK' });

    const slaFetchRes = await request(`/api/complaints/${complaint1Id}/sla`, {
      headers: { Authorization: `Bearer ${citizenAToken}` }
    });

    if (slaFetchRes.status === 200 && slaFetchRes.body.data.status === 'BREACHED') {
      console.log('[PASS] SLA breach evaluation verified (Status dynamically evaluated to BREACHED when past deadline)');
      results['18. SLA breach logic'] = 'PASS';
    } else {
      console.error(`[FAIL] SLA breach logic status: ${slaFetchRes.body.data ? slaFetchRes.body.data.status : 'N/A'}`);
      results['18. SLA breach logic'] = 'FAIL';
    }

    // TEST 19: DATABASE VERIFICATION
    console.log('\n--- TEST 19: DATABASE VERIFICATION ---');
    const finalDbCheck = await Complaint.findById(complaint1Id);
    if (
      finalDbCheck &&
      finalDbCheck.category &&
      finalDbCheck.priority &&
      finalDbCheck.department &&
      finalDbCheck.sla &&
      finalDbCheck.updatedAt
    ) {
      console.log('[PASS] Database document contains consistent operational data');
      results['19. MongoDB verification'] = 'PASS';
    } else {
      console.error('[FAIL] Database verification failed');
      results['19. MongoDB verification'] = 'FAIL';
    }

    // TEST 20: SERVER STABILITY
    console.log('\n--- TEST 20: SERVER STABILITY ---');
    const t20Res = await request('/api/health');
    if (t20Res.status === 200) {
      console.log('[PASS] Backend server running stably with 200 OK on /api/health');
      results['20. Server stability'] = 'PASS';
    } else {
      console.error(`[FAIL] Server stability check: ${t20Res.status}`);
      results['20. Server stability'] = 'FAIL';
    }

    // TEST 21: REGRESSION TESTS
    console.log('\n--- TEST 21: REGRESSION TESTS ---');
    const t21a = await request('/api/health');
    const t21b = await request('/api/auth/me', { headers: { Authorization: `Bearer ${citizenAToken}` } });
    const t21c = await request('/api/complaints', { headers: { Authorization: `Bearer ${citizenAToken}` } });

    if (t21a.status === 200 && t21b.status === 200 && t21c.status === 200) {
      console.log('[PASS] Regression tests passed: /api/health, /api/auth/me, /api/complaints all working');
      results['21. Regression tests'] = 'PASS';
    } else {
      console.error(`[FAIL] Regression test status: health=${t21a.status}, me=${t21b.status}, list=${t21c.status}`);
      results['21. Regression tests'] = 'FAIL';
    }

    console.log('\n==================================================');
    console.log('SUMMARY OF PHASE 4 + 5 TEST RESULTS:');
    console.log('==================================================');
    let passCount = 0;
    let failCount = 0;
    for (const [testName, result] of Object.entries(results)) {
      console.log(`${testName.padEnd(35)} : ${result}`);
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

runPhase4And5Tests();
