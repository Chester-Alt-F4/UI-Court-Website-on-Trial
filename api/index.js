import express from 'express';
import cors from 'cors';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'MOCK_KEY');

// Helper to determine text density
function getTextDensity(html, text) {
  const htmlSize = html.length;
  const textSize = text.length;
  const ratio = (textSize / htmlSize) * 100;
  if (ratio < 5) return 'low';
  if (ratio < 15) return 'medium';
  return 'high';
}

// URL Normalization helper
function normalizeUrl(url) {
  if (!url.startsWith('http')) {
    return `https://${url}`;
  }
  return url;
}

// Step 1: Fetch
async function fetchWebsite(url) {
  const targetUrl = normalizeUrl(url);
  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    return {
      html: response.data,
      timestamp: new Date().toISOString(),
      source: 'Direct Fetch (Axios)'
    };
  } catch (error) {
    throw new Error(`Failed to fetch website: ${error.message}`);
  }
}

// Step 2: Parse
function parseToStructure(url, html) {
  const $ = cheerio.load(html);
  
  const title = $('title').text() || 'No Title Found';
  const h1Count = $('h1').length;
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const h4Count = $('h4').length;
  const h5Count = $('h5').length;
  const h6Count = $('h6').length;
  const headings = h1Count + h2Count + h3Count + h4Count + h5Count + h6Count;
  
  const images = $('img').length;
  const buttons = $('button, input[type="button"], input[type="submit"], .btn, .button').length;
  const links = $('a').length;
  
  // Extract potential colors from styles (limited search)
  const colors = [];
  const styleTags = $('style').text();
  const hexRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/g;
  let match;
  while ((match = hexRegex.exec(styleTags)) !== null && colors.length < 5) {
    if (!colors.includes(match[0].toUpperCase())) {
      colors.push(match[0].toUpperCase());
    }
  }
  
  // Basic heuristics for layout elements
  const hasNavbar = $('nav, [id*="nav"], [class*="nav"], header').length > 0;
  const hasFooter = $('footer, [id*="footer"], [class*="footer"]').length > 0;
  const hasCTA = buttons > 0 || $('a[class*="cta"], a[id*="cta"]').length > 0;
  
  const textContent = $('body').text();
  const textDensity = getTextDensity(html, textContent);
  const metaViewport = $('meta[name="viewport"]').length > 0;

  return {
    url,
    title,
    headings,
    images: images || 0,
    buttons: buttons || 0,
    links: links || 0,
    colors: colors.length > 0 ? colors : ['#FFFFFF', '#000000', '#CCCCCC'],
    hasNavbar,
    hasFooter,
    hasCTA,
    textDensity,
    metaViewport
  };
}

// Step 3: Analyze
function ruleBasedAnalysis(data) {
  const issues = [];
  const defense = [];

  if (!data.metaViewport) {
    issues.push({ id: 'NO_VIEWPORT', charge: 'Missing viewport meta tag', detail: 'Site is not mobile-optimized.' });
  } else {
    defense.push('Responsive meta tag present.');
  }

  if (data.colors.length > 5) {
    issues.push({ id: 'TOO_MANY_COLORS', charge: 'Chromatic Chaos', detail: `Detected ${data.colors.length} distinct colors. Exceeds limit of 5.` });
  }

  if (data.textDensity === 'high') {
    issues.push({ id: 'TEXT_DENSITY', charge: 'High Text Density', detail: 'The page is cluttered with text, making it hard to scan.' });
  }

  if (!data.hasCTA) {
    issues.push({ id: 'MISSING_CTA', charge: 'Missing Call to Action', detail: 'No clear primary intent found for the user.' });
  } else {
    defense.push('Clear Call to Action detected.');
  }

  if (data.headings === 0) {
    issues.push({ id: 'NO_HEADINGS', charge: 'Headingless Design', detail: 'No semantic structure (H1-H6) found.' });
  } else {
    defense.push('Good heading hierarchy.');
  }

  return { issues, defense };
}

// Step 4 & 5: AI Judge and Act
async function aiAudit(websiteData, analysis) {
  // If no valid key, return a high-quality mock response for demo purposes
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_API_KEY_HERE' || process.env.GEMINI_API_KEY === 'MOCK_KEY') {
    return getMockAiResponse(websiteData, analysis);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      You are the Pixel Judge of UI Court. Evaluate this website's UI metadata:
      ${JSON.stringify(websiteData, null, 2)}
      
      Identified Issues:
      ${JSON.stringify(analysis.issues, null, 2)}
      
      Identified Defense:
      ${JSON.stringify(analysis.defense, null, 2)}

      Tasks:
      1. Assign a score (0-100).
      2. Provide a short verdict (Guilty or Not Guilty).
      3. Generate a structured redesign prompt for a UI/UX designer.
      4. Provide 3 specific sentencing orders (fix suggestions).
      5. Determine site purpose from title: "${websiteData.title}".

      Output ONLY in JSON format:
      {
        "score": number,
        "verdict": "GUILTY" | "NOT GUILTY",
        "verdictText": "string explaining why",
        "sentence": ["string", "string", "string"],
        "redesignPrompt": "string",
        "sitePurpose": "string",
        "mockMode": false
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(text);
    return { ...parsed, mockMode: false };
  } catch (error) {
    console.error("AI Audit failed, falling back to Mock Mode:", error.message);
    return getMockAiResponse(websiteData, analysis);
  }
}

function getMockAiResponse(websiteData, analysis) {
  const hasBigIssues = analysis.issues.length > 2 || !websiteData.metaViewport;
  const score = hasBigIssues ? 45 : 82;
  const verdict = hasBigIssues ? 'GUILTY' : 'NOT GUILTY';
  
  return {
    score,
    verdict,
    verdictText: hasBigIssues 
      ? `The evidence is overwhelming. With ${analysis.issues.length} major UI violations, this site is a hazard to user experience.`
      : `The site shows promise, but still requires minor rehabilitation to meet pixel-perfect standards.`,
    sentence: [
      `Implement an 8px grid system to fix spacing inconsistencies.`,
      `Improve color contrast ratio to at least 4.5:1 for accessibility.`,
      `Optimize CTA visibility with contrasting background colors.`
    ],
    sitePurpose: websiteData.title,
    redesignPrompt: `Create a modern, clean, and responsive web UI for ${websiteData.title}.\n\nIssues to fix:\n${analysis.issues.map(i => `- ${i.charge}`).join('\n')}\n\nRequirements:\n- Clear visual hierarchy\n- Consistent spacing\n- Legible typography\n- Mobile-first design`,
    mockMode: true
  };
}

app.post('/audit', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  const agentSteps = [];
  const logs = [];

  try {
    // Step 1: Fetch
    logs.push("Step 1 starting: Fetching real website data...");
    const rawData = await fetchWebsite(url);
    agentSteps.push({ step: 'FETCH', status: 'success', data: 'Raw HTML data received' });
    logs.push(`Step 1 complete: Fetched ${url}. Received ${Math.round(rawData.html.length / 1024)}KB.`);

    // Step 2: Parse
    logs.push("Step 2: Parsing HTML into structured websiteData...");
    const websiteData = parseToStructure(url, rawData.html);
    agentSteps.push({ step: 'PARSE', status: 'success', data: websiteData });
    logs.push(`Step 2 complete: Parsed ${websiteData.headings} headings, ${websiteData.images} images, ${websiteData.buttons} buttons.`);

    // Step 3: Analyze
    logs.push("Step 3: Applying heuristic rules for UI audit...");
    const analysis = ruleBasedAnalysis(websiteData);
    agentSteps.push({ step: 'ANALYZE', status: 'success', data: analysis });
    logs.push(`Step 3 complete: ${analysis.issues.length} issues flagged.`);

    // Step 4 & 5: AI Judge & Act
    logs.push("Step 4 & 5: Calling Gemini AI for judgment and redesign order...");
    const aiResponse = await aiAudit(websiteData, analysis);
    agentSteps.push({ step: 'JUDGE', status: 'success' });
    agentSteps.push({ step: 'ACT', status: 'success' });
    logs.push(`AI judgment complete. Score: ${aiResponse.score}. Verdict: ${aiResponse.verdict}. Proceeding to finalize report.`);

    // Vibe UI Logic
    const isVibe = analysis.issues.length === 0 && websiteData.colors.length <= 5 && websiteData.metaViewport;

    res.json({
      success: true,
      agentSteps,
      logs,
      websiteData,
      analysis,
      aiResponse,
      vibeStatus: isVibe ? 'VIBE UI READY' : '⚠️ NOT VIBE READY',
      timestamp: rawData.timestamp,
      source: rawData.source
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message, logs });
  }
});

const PORT = 3001;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
