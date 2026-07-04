import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';
import mammoth from 'mammoth';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const COGNEE_URL = process.env.COGNEE_URL || 'http://127.0.0.1:8002';

// ─── Cognee Helper ────────────────────────────────────────────────────────────
async function fetchCognee(endpoint, body) {
  try {
    const res = await fetch(`${COGNEE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Cognee Error [${endpoint}]:`, err.message);
    return null;
  }
}

// ─── File Text Extraction ─────────────────────────────────────────────────────
async function extractText(file) {
  const { mimetype, buffer, originalname } = file;
  if (mimetype === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  if (mimetype?.includes('wordprocessingml') || originalname?.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (mimetype?.startsWith('image/') || mimetype?.startsWith('audio/') || mimetype?.startsWith('video/')) {
    return `[Media file submitted: ${originalname}]`;
  }
  return buffer.toString('utf8');
}

// ─── Generate unique case number ─────────────────────────────────────────────
function generateCaseNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `CASE-${year}-${rand}`;
}

// ─── Sanitize dataset ID for Cognee ──────────────────────────────────────────
function toCogneeDataset(caseId) {
  return `case-${caseId.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const { username, email } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    let user = await prisma.user.findUnique({ where: { username } });
    if (user) return res.status(409).json({ error: 'Username already taken' });
    user = await prisma.user.create({ data: { username, email: email || null } });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: 'Username required' });
  try {
    let user = await prisma.user.findUnique({ where: { username } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── CASES ────────────────────────────────────────────────────────────────────

// Get all cases for a user
app.get('/api/users/:userId/cases', async (req, res) => {
  const { userId } = req.params;
  const { status } = req.query;
  try {
    const where = { userId };
    if (status) where.status = status;
    const cases = await prisma.case.findMany({
      where,
      include: { evidence: { select: { id: true, type: true, label: true, createdAt: true } } },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(cases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cases' });
  }
});

// Get a single case with all evidence
app.get('/api/cases/:caseId', async (req, res) => {
  const { caseId } = req.params;
  try {
    const caseFile = await prisma.case.findUnique({
      where: { id: caseId },
      include: { evidence: true }
    });
    if (!caseFile) return res.status(404).json({ error: 'Case not found' });
    res.json(caseFile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Create a new case
app.post('/api/cases', async (req, res) => {
  const { userId, title, description, priority } = req.body;
  if (!userId || !title) return res.status(400).json({ error: 'userId and title required' });
  try {
    let caseNumber = generateCaseNumber();
    // ensure unique
    while (await prisma.case.findUnique({ where: { caseNumber } })) {
      caseNumber = generateCaseNumber();
    }
    const caseFile = await prisma.case.create({
      data: { userId, title, description: description || null, priority: priority || 'medium', caseNumber }
    });
    res.json(caseFile);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Update case status or metadata
app.patch('/api/cases/:caseId', async (req, res) => {
  const { caseId } = req.params;
  const { status, priority, title, description } = req.body;
  try {
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: {
        ...(status && { status }),
        ...(priority && { priority }),
        ...(title && { title }),
        ...(description !== undefined && { description })
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update case' });
  }
});

// Delete a case
app.delete('/api/cases/:caseId', async (req, res) => {
  const { caseId } = req.params;
  try {
    await prisma.evidence.deleteMany({ where: { caseId } });
    await prisma.case.delete({ where: { id: caseId } });
    fetchCognee('/forget', { dataset: toCogneeDataset(caseId) }).catch(e => console.error("Forget failed silently:", e));
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete case' });
  }
});

// ─── EVIDENCE ─────────────────────────────────────────────────────────────────

// Upload evidence to a case
app.post('/api/cases/:caseId/evidence', upload.array('files', 50), async (req, res) => {
  const { caseId } = req.params;
  const { url } = req.body;

  let allEvidenceText = '';
  const evidenceRecords = [];
  const dataset = toCogneeDataset(caseId);

  const processFile = async (fileObj) => {
    let text = '';
    let label = fileObj.originalname;
    try {
      text = await extractText(fileObj);
    } catch (err) {
      console.error('File parse error:', err);
      text = `[Could not parse: ${label}]`;
    }
    allEvidenceText += `\n--- File: ${label} ---\n${text.slice(0, 5000)}`;
    const ev = await prisma.evidence.create({
      data: { caseId, type: 'file', label, content: text.slice(0, 50000), fileName: label, mimeType: fileObj.mimetype }
    });
    evidenceRecords.push(ev);
    await fetchCognee('/remember', { text, dataset });
  };

  if (req.files && req.files.length > 0) {
    for (const f of req.files) await processFile(f);
  } else if (req.file) { // Fallback
    await processFile(req.file);
  }

  if (url) {
    try {
      const { default: axios } = await import('axios');
      const { load } = await import('cheerio');
      const response = await axios.get(url, { timeout: 10000 });
      const $ = load(response.data);
      $('script, style, nav, footer, header').remove();
      const pageText = $('body').text().replace(/\s+/g, ' ').trim();
      const text = `[URL: ${url}]\n${pageText.slice(0, 10000)}`;
      allEvidenceText += `\n--- URL: ${url} ---\n${pageText.slice(0, 5000)}`;
      const ev = await prisma.evidence.create({
        data: { caseId, type: 'url', label: new URL(url).hostname, content: text.slice(0, 50000), sourceUrl: url }
      });
      evidenceRecords.push(ev);
      await fetchCognee('/remember', { text, dataset });
    } catch (err) {
      console.error('URL scrape error:', err);
    }
  }

  if (evidenceRecords.length === 0) return res.status(400).json({ error: 'No evidence provided' });

  fetchCognee('/improve', {}).catch(e => console.error("Improve failed silently:", e));

  // Generate AI brief from the combined evidence
  const briefPrompt = `You are an AI Investigation Analyst. Analyze this combined evidence and return ONLY valid JSON with these keys:
- "summary": 2-3 sentence overview of what this evidence reveals
- "keyFacts": array of 4-8 specific, factual bullet strings
- "persons": array of person names mentioned
- "locations": array of locations mentioned  
- "timeline": array of "date: event" strings if any chronology is visible
- "leads": array of 2-4 recommended next investigative steps

Evidence:
${allEvidenceText.slice(0, 15000)}`;

  let brief = null;
  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: briefPrompt,
      config: { temperature: 0.2 }
    });
    let text = result.text.trim().replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim();
    brief = JSON.parse(text);

    // Save to case record
    await prisma.case.update({
      where: { id: caseId },
      data: {
        summary: brief.summary || null,
        keyFacts: JSON.stringify(brief.keyFacts || []),
        persons: JSON.stringify(brief.persons || []),
        locations: JSON.stringify(brief.locations || []),
        leads: JSON.stringify(brief.leads || [])
      }
    });
  } catch (err) {
    console.error('Brief gen error:', err.message);
  }

  res.json({ evidence: evidenceRecords, brief });
});

// ─── INVESTIGATION CHAT ───────────────────────────────────────────────────────

app.get('/api/cases/:caseId/messages', async (req, res) => {
  const { caseId } = req.params;
  const messages = await prisma.message.findMany({
    where: { caseId },
    orderBy: { createdAt: 'asc' }
  });
  res.json(messages);
});

app.post('/api/cases/:caseId/investigate', async (req, res) => {
  const { caseId } = req.params;
  const { query, history = [] } = req.body;
  if (!query) return res.status(400).json({ error: 'query required' });

  // Save user message
  await prisma.message.create({
    data: { caseId, role: 'user', text: query }
  });

  // Recall from Cognee
  const dataset = toCogneeDataset(caseId);
  let memoryContext = '';
  const recall = await fetchCognee('/recall', { query, dataset: dataset });
  if (recall?.results) {
    memoryContext = `\n\n[CASE MEMORY — from knowledge graph]:\n${JSON.stringify(recall.results)}\n\nUse this context to answer precisely.`;
  }

  // Fetch the case for context
  const caseFile = await prisma.case.findUnique({ where: { id: caseId } });

  const systemPrompt = `You are an AI Investigation Analyst for the case: "${caseFile?.title || 'Unknown'}".
You help lawyers and detectives analyze evidence. Be precise, cite specific facts, identify patterns and contradictions.
When referencing evidence, be direct. Answer only what you can support with facts from the case.`;

  const messages = [
    ...history,
    { role: 'user', parts: [{ text: query + memoryContext }] }
  ];

  try {
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: messages,
      config: { systemInstruction: systemPrompt, temperature: 0.3 }
    });
    const answer = result.text;

    // Save AI message
    const aiMessage = await prisma.message.create({
      data: { caseId, role: 'ai', text: answer }
    });

    res.json({ answer, query });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── SERVER ───────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 8001;
app.listen(PORT, () => console.log(`Akai Ito backend running on port ${PORT}`));
