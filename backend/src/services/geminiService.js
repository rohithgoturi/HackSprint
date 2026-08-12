const { GoogleGenAI } = require('@google/genai');
const http = require('http');
const https = require('https');

const ALLOWED_CATEGORIES = [
  'road_infrastructure',
  'garbage_sanitation',
  'streetlight_electrical',
  'water_supply',
  'drainage',
  'fallen_tree',
  'public_infrastructure',
  'other'
];

const ALLOWED_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

const SYSTEM_PROMPT = `
You are analyzing civic infrastructure complaints for a government-support platform.
Analyze the provided complaint description (and optional image) and categorize the issue.

You MUST respond ONLY with a raw JSON object with NO markdown formatting, NO backticks (\`\`\`json), and NO extra text.

JSON Schema:
{
  "issue": "Short summary of the specific issue (e.g., pothole, broken streetlight, garbage dump)",
  "category": "Must be EXACTLY one of: road_infrastructure, garbage_sanitation, streetlight_electrical, water_supply, drainage, fallen_tree, public_infrastructure, other",
  "severity": "Must be EXACTLY one of: LOW, MEDIUM, HIGH, CRITICAL",
  "departmentRecommendation": "Recommended department name (e.g. roads, sanitation, electrical)",
  "reasoning": "A concise 1-2 sentence technical explanation for the classification"
}

Rules:
- Do not invent facts or hallucinate details.
- If uncertain about category, use "other".
- Do not include confidence scores or percentages.
`;

/**
 * Helper to fetch remote image and convert to base64 for Gemini
 */
const fetchImageBase64 = async (url) => {
  try {
    return await new Promise((resolve) => {
      const client = url.startsWith('https') ? https : http;
      client
        .get(url, (res) => {
          if (res.statusCode !== 200) return resolve(null);
          const chunks = [];
          res.on('data', (chunk) => chunks.push(chunk));
          res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            const mimeType = res.headers['content-type'] || 'image/jpeg';
            resolve({
              inlineData: {
                data: buffer.toString('base64'),
                mimeType
              }
            });
          });
        })
        .on('error', () => resolve(null));
    });
  } catch (error) {
    return null;
  }
};

/**
 * Fallback classification rule engine when AI is offline or rate-limited
 */
const getFallbackClassification = (description, errorMsg = '') => {
  const descLower = (description || '').toLowerCase();
  let category = 'other';
  let severity = 'MEDIUM';
  let issue = 'Civic Infrastructure Concern';

  if (descLower.includes('pothole') || descLower.includes('road') || descLower.includes('asphalt') || descLower.includes('street')) {
    category = 'road_infrastructure';
    issue = 'Road Damage / Pothole';
    severity = 'HIGH';
  } else if (descLower.includes('garbage') || descLower.includes('trash') || descLower.includes('waste') || descLower.includes('dump')) {
    category = 'garbage_sanitation';
    issue = 'Garbage Accumulation';
    severity = 'MEDIUM';
  } else if (descLower.includes('light') || descLower.includes('pole') || descLower.includes('wire') || descLower.includes('electrical')) {
    category = 'streetlight_electrical';
    issue = 'Streetlight / Electrical Failure';
    severity = 'HIGH';
  } else if (descLower.includes('water') || descLower.includes('pipe') || descLower.includes('leak')) {
    category = 'water_supply';
    issue = 'Water Leakage / Pipe Damage';
    severity = 'HIGH';
  } else if (descLower.includes('drain') || descLower.includes('sewer') || descLower.includes('overflow')) {
    category = 'drainage';
    issue = 'Drainage / Sewer Overflow';
    severity = 'CRITICAL';
  } else if (descLower.includes('tree') || descLower.includes('branch')) {
    category = 'fallen_tree';
    issue = 'Fallen Tree / Obstruction';
    severity = 'HIGH';
  }

  return {
    issue,
    category,
    severity,
    departmentRecommendation: category,
    reasoning: `Rule-based fallback classification (${errorMsg ? errorMsg.slice(0, 80) : 'Offline mode'})`,
    isFallback: true
  };
};

/**
 * Analyze a civic complaint using Google Gemini API
 * @param {Object} params
 * @param {string} params.description Complaint text description
 * @param {string} [params.imageUrl] Optional image URL
 * @returns {Promise<Object>} Structured AI analysis
 */
const analyzeComplaint = async ({ description, imageUrl }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return getFallbackClassification(description, 'GEMINI_API_KEY not configured');
  }

  if (!description || description.trim() === '') {
    const err = new Error('Complaint description is required for AI analysis');
    err.statusCode = 400;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const contents = [];

  // If imageUrl provided, try to fetch image part
  if (imageUrl && typeof imageUrl === 'string' && imageUrl.startsWith('http')) {
    const imagePart = await fetchImageBase64(imageUrl.trim());
    if (imagePart) {
      contents.push(imagePart);
    }
  }

  contents.push({ text: `Complaint description: "${description.trim()}"` });

  let textResponse = '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: 'application/json'
      }
    });

    textResponse = response.text || '';
  } catch (apiErr) {
    console.warn(`[Gemini API Warning] ${apiErr.message}. Utilizing rule-based fallback.`);
    return getFallbackClassification(description, apiErr.message);
  }

  // Clean raw response of any markdown backticks if returned
  let cleanedJsonStr = textResponse.trim();
  if (cleanedJsonStr.startsWith('```')) {
    cleanedJsonStr = cleanedJsonStr.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
  }

  let parsed = null;
  try {
    parsed = JSON.parse(cleanedJsonStr);
  } catch (parseErr) {
    console.warn('[Gemini Parse Warning] Invalid JSON from model. Utilizing fallback.');
    return getFallbackClassification(description, 'Malformed JSON response');
  }

  // Sanitize & Validate output
  const issue = parsed.issue ? String(parsed.issue).trim() : 'Unspecified Issue';
  
  let category = parsed.category ? String(parsed.category).toLowerCase().trim() : 'other';
  if (!ALLOWED_CATEGORIES.includes(category)) {
    category = 'other';
  }

  let severity = parsed.severity ? String(parsed.severity).toUpperCase().trim() : 'MEDIUM';
  if (!ALLOWED_SEVERITIES.includes(severity)) {
    severity = 'MEDIUM';
  }

  const departmentRecommendation = parsed.departmentRecommendation
    ? String(parsed.departmentRecommendation).trim()
    : 'General Services';

  const reasoning = parsed.reasoning
    ? String(parsed.reasoning).trim()
    : 'Automated classification based on citizen description';

  return {
    issue,
    category,
    severity,
    departmentRecommendation,
    reasoning,
    isFallback: false
  };
};

/**
 * Analyze short or vague citizen text and suggest improvements / enhanced description
 * @param {Object} params
 * @param {string} params.description Citizen draft description
 * @returns {Promise<Object>} Improvement suggestions and expanded text
 */
const enhanceDescription = async ({ description }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return {
      isSufficient: true,
      suggestions: ['AI suggestion service temporarily unavailable.'],
      enhancedText: description
    };
  }

  if (!description || description.trim() === '') {
    return {
      isSufficient: false,
      suggestions: ['Please provide a description of the civic issue.'],
      enhancedText: ''
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
  const prompt = `
You are helping citizens report civic complaints clearly.
Evaluate the following complaint text:
"${description.trim()}"

Provide a JSON object with:
- "isSufficient": boolean (true if description is clear and actionable, false if too short/vague)
- "suggestions": array of string suggestions (e.g. "Add landmark details", "Specify time of occurrence")
- "enhancedText": a polished, clear 2-3 sentence version of the complaint suitable for municipal records.

Return ONLY raw JSON matching this schema.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    let textResponse = (response.text || '').trim();
    if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(textResponse);
    return {
      isSufficient: Boolean(parsed.isSufficient),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
      enhancedText: parsed.enhancedText ? String(parsed.enhancedText).trim() : description
    };
  } catch (err) {
    console.warn(`[Gemini Enhance Warning] ${err.message}`);
    return {
      isSufficient: true,
      suggestions: ['Please include location landmarks, severity details, and photos if available.'],
      enhancedText: description
    };
  }
};

/**
 * Evaluate semantic similarity between a target complaint and candidate complaints
 * @param {Object} params
 * @param {Object} params.targetComplaint Object containing description and category
 * @param {Array<Object>} params.candidateComplaints Candidate complaints from MongoDB
 * @returns {Promise<Array<Object>>} List of candidate evaluations with match score and reasoning
 */
const checkSimilarity = async ({ targetComplaint, candidateComplaints }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || !candidateComplaints || candidateComplaints.length === 0) {
    // Basic text-matching fallback
    return candidateComplaints.map((c) => {
      const match = c.description && targetComplaint.description &&
        c.description.toLowerCase().includes('pothole') && targetComplaint.description.toLowerCase().includes('pothole');
      return {
        id: c._id ? c._id.toString() : c.id,
        similarityScore: match ? 80 : 35,
        isDuplicate: match,
        reasoning: match ? 'Rule-based text match on keyword' : 'Low text similarity'
      };
    });
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const candidateItems = candidateComplaints.map((c) => ({
    id: c._id ? c._id.toString() : c.id,
    description: c.description,
    issue: c.issue || '',
    category: c.category || ''
  }));

  const prompt = `
Compare the TARGET CIVIC COMPLAINT against the list of CANDIDATE COMPLAINTS to identify semantic duplicates or closely related reports.

TARGET COMPLAINT:
"${targetComplaint.description}"

CANDIDATE COMPLAINTS:
${JSON.stringify(candidateItems, null, 2)}

Return a raw JSON array of objects:
[
  {
    "id": "candidate_id_string",
    "similarityScore": number (0 to 100 percentage score),
    "isDuplicate": boolean (true if similarityScore >= 70),
    "reasoning": "1 sentence explanation of similarity"
  }
]

Return ONLY raw JSON array.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: prompt }],
      config: {
        responseMimeType: 'application/json'
      }
    });

    let textResponse = (response.text || '').trim();
    if (textResponse.startsWith('```')) {
      textResponse = textResponse.replace(/^```(json)?\n?/, '').replace(/```$/, '').trim();
    }
    const parsed = JSON.parse(textResponse);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[Gemini Similarity Warning] ${err.message}`);
    return candidateComplaints.map((c) => ({
      id: c._id ? c._id.toString() : c.id,
      similarityScore: 50,
      isDuplicate: false,
      reasoning: 'Fallback similarity evaluation'
    }));
  }
};

module.exports = {
  analyzeComplaint,
  enhanceDescription,
  checkSimilarity,
  ALLOWED_CATEGORIES,
  ALLOWED_SEVERITIES
};
