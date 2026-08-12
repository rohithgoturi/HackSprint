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
  console.log('RUNNING GEMINI AI INTEGRATION VERIFICATION TESTS');
  console.log('==================================================\n');

  try {
    // 0. Authenticate Citizen & Admin
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
    const citizenToken = c1Login.body.data.token;

    let adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: { email: 'admin@civic.local', password: 'AdminPassword123!' }
    });
    const adminToken = adminLogin.body.data.token;
    console.log('[PASS] Citizen and Admin authenticated\n');

    // TEST 1: Citizen Description Enhancement API
    console.log('TEST 1: Citizen uses Description Enhancement API (POST /api/complaints/enhance-description)');
    const enhanceRes = await request('/api/complaints/enhance-description', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { description: 'road bad near college' }
    });
    if (enhanceRes.status !== 200 || !enhanceRes.body.data.enhancedText) {
      throw new Error(`TEST 1 Failed: ${enhanceRes.status}`);
    }
    console.log(`[PASS] AI Enhanced Description: "${enhanceRes.body.data.enhancedText}"`);
    console.log(`       Suggestions: ${JSON.stringify(enhanceRes.body.data.suggestions)}`);

    // TEST 2: Citizen files original complaint
    console.log('\nTEST 2: Citizen files complaint for AI analysis');
    const createRes = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { description: 'Dangerous deep pothole on college main gate road causing motorcycle accidents.' }
    });
    if (createRes.status !== 201) throw new Error(`TEST 2 Failed: ${createRes.status}`);
    const complaint1Id = createRes.body.data.id;
    console.log(`[PASS] Complaint 1 filed (ID: ${complaint1Id})`);

    // TEST 3: Trigger Gemini AI Analysis
    console.log('\nTEST 3: Trigger Gemini AI Analysis (POST /api/complaints/:id/analyze)');
    const analyzeRes = await request(`/api/complaints/${complaint1Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    if (analyzeRes.status !== 200 || !analyzeRes.body.data.complaint.aiAnalysis) {
      throw new Error(`TEST 3 Failed: ${analyzeRes.status} - ${JSON.stringify(analyzeRes.body)}`);
    }
    const c1Data = analyzeRes.body.data.complaint;
    console.log(`[PASS] AI Analysis complete:`);
    console.log(`       Category: ${c1Data.category}`);
    console.log(`       Severity: ${c1Data.severity}`);
    console.log(`       Priority: ${c1Data.priority}`);
    console.log(`       Department: ${c1Data.department ? c1Data.department.name : 'Unassigned'}`);
    console.log(`       Issue Summary: "${c1Data.issue}"`);

    // TEST 4: File second similar complaint
    console.log('\nTEST 4: File second similar complaint to test duplicate detection');
    const create2Res = await request('/api/complaints', {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` },
      body: { description: 'Huge pothole right outside college entrance gate, bikes slipping.' }
    });
    const complaint2Id = create2Res.body.data.id;
    await request(`/api/complaints/${complaint2Id}/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    console.log(`[PASS] Complaint 2 filed and analyzed (ID: ${complaint2Id})`);

    // TEST 5: Semantic Duplicate & Similarity Detection
    console.log('\nTEST 5: Trigger Semantic Similarity Check (GET /api/complaints/:id/similar)');
    const similarRes = await request(`/api/complaints/${complaint2Id}/similar`, {
      headers: { Authorization: `Bearer ${citizenToken}` }
    });
    if (similarRes.status !== 200) throw new Error(`TEST 5 Failed: ${similarRes.status}`);
    console.log(`[PASS] Similarity evaluation complete. Similar items found: ${similarRes.body.data.similarComplaints.length}`);
    if (similarRes.body.data.similarComplaints.length > 0) {
      const topMatch = similarRes.body.data.similarComplaints[0];
      console.log(`       Top Match Score: ${topMatch.similarityScore}% (Duplicate Flag: ${topMatch.isDuplicate})`);
      console.log(`       Reasoning: "${topMatch.reasoning}"`);
    }

    // TEST 6: Security Verification - API Key secrecy check
    console.log('\nTEST 6: Verify GEMINI_API_KEY is not exposed in responses');
    const responseStr = JSON.stringify(analyzeRes.body);
    if (process.env.GEMINI_API_KEY && responseStr.includes(process.env.GEMINI_API_KEY)) {
      throw new Error('SECURITY VIOLATION: GEMINI_API_KEY leaked in API response!');
    }
    console.log(`[PASS] Security verified: API key is not present in response payload`);

    console.log('\n==================================================');
    console.log('ALL GEMINI INTEGRATION TESTS PASSED SUCCESSFULLY!');
    console.log('==================================================');
  } catch (err) {
    console.error(`\n[TEST ERROR] ${err.message}`);
    process.exit(1);
  }
}

runTests();
