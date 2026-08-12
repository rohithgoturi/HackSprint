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
 * Analyze a civic complaint using Google Gemini API
 * @param {Object} params
 * @param {string} params.description Complaint text description
 * @param {string} [params.imageUrl] Optional image URL
 * @returns {Promise<Object>} Structured AI analysis
 */
const analyzeComplaint = async ({ description, imageUrl }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    const err = new Error('GEMINI_API_KEY environment variable is not defined.');
    err.statusCode = 500;
    throw err;
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
    console.error(`[Gemini API Error] ${apiErr.message}`);
    const err = new Error('Failed to analyze complaint using Gemini AI: ' + apiErr.message);
    err.statusCode = 502;
    throw err;
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
    console.error('[Gemini Parse Error] Invalid JSON from model:', cleanedJsonStr);
    const err = new Error('Gemini AI returned malformed output format');
    err.statusCode = 502;
    throw err;
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
    reasoning
  };
};

module.exports = {
  analyzeComplaint,
  ALLOWED_CATEGORIES,
  ALLOWED_SEVERITIES
};
