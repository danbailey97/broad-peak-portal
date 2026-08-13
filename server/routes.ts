import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import { fetch as directFetch, Agent as DirectAgent } from 'undici';
import db from './db.js';
import { getCustomerByDomain, getAllCustomers, upsertCustomerCache, getCacheStats } from './salesforce.js';
import { PRODUCTS, ALL_CATEGORIES, ALL_VENDORS, VENDOR_INFO, findRelevantProducts, getVendorsByCategory } from './vendors.js';

const router = express.Router();
const agent = new DirectAgent({ connect: { rejectUnauthorized: false } });
const fetchOpts = () => ({ dispatcher: agent } as any);

// ── File storage ─────────────────────────────────────────────
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// ── Auth constants ────────────────────────────────────────────
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Setup187!!';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'BPAdmin2024!';

// ── Customer login ────────────────────────────────────────────
router.post('/api/login', async (req, res) => {
  const { domain, password } = req.body;
  if (!domain || !password) return res.status(400).json({ error: 'Missing domain or password' });
  if (password !== CUSTOMER_PASSWORD) return res.status(401).json({ error: 'Invalid credentials' });

  // Strip any @ prefix
  const cleanDomain = domain.replace(/^@/, '').toLowerCase().trim();

  try {
    const customer = await getCustomerByDomain(cleanDomain);
    if (!customer) return res.status(401).json({ error: 'No account found for this domain. Please contact your Broad Peak account manager.' });

    const token = `cust_${uuid()}`;
    res.json({
      token,
      domain: customer.domain,
      accountName: customer.accountName,
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication error' });
  }
});

// ── Admin login ───────────────────────────────────────────────
router.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'Invalid admin password' });
  const token = `admin_${uuid()}`;
  db.prepare('INSERT INTO admin_sessions (token, created_at) VALUES (?, ?)').run(token, new Date().toISOString());
  res.json({ token });
});

function requireAdmin(req: any, res: any, next: any) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token.startsWith('admin_')) return res.status(401).json({ error: 'Unauthorised' });
  const row = db.prepare('SELECT token FROM admin_sessions WHERE token = ?').get(token);
  if (!row) return res.status(401).json({ error: 'Unauthorised' });
  next();
}

// ── Admin: seed Salesforce cache ──────────────────────────────
const SEED_SECRET = process.env.SEED_SECRET || 'bpseed2026';

router.post('/api/admin/seed-sf', async (req, res) => {
  const auth = req.headers['x-seed-secret'] || '';
  if (auth !== SEED_SECRET) return res.status(401).json({ error: 'Unauthorised' });
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) return res.status(400).json({ error: 'No records provided' });
    upsertCustomerCache(records);
    const stats = getCacheStats();
    res.json({ ok: true, inserted: records.length, total: stats.count, lastUpdated: stats.lastUpdated });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/admin/cache-stats', (req, res) => {
  try { res.json(getCacheStats()); } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ── Account Manager management ────────────────────────────────
const photoStorage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (_, file, cb) => cb(null, `am-${Date.now()}-${file.originalname}`),
});
const photoUpload = multer({ storage: photoStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/api/admin/account-managers', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM account_managers ORDER BY name ASC').all();
  res.json(rows);
});

router.post('/api/admin/account-managers', requireAdmin, photoUpload.single('photo'), (req, res) => {
  const { email, name, display_name, phone, calendly } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'email and name required' });
  const photo_path = (req as any).file?.path || null;
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO account_managers (email, name, display_name, phone, photo_path, calendly, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(email) DO UPDATE SET name=excluded.name, display_name=excluded.display_name,
    phone=excluded.phone, ${photo_path ? 'photo_path=excluded.photo_path,' : ''} calendly=excluded.calendly, updated_at=excluded.updated_at`
  ).run(email, name, display_name || name, phone || null, photo_path, calendly || null, now);
  res.json({ ok: true });
});

router.delete('/api/admin/account-managers/:email', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM account_managers WHERE email = ?').run(decodeURIComponent(req.params.email));
  res.json({ ok: true });
});

// ── Research Docs ─────────────────────────────────────────────
router.get('/api/research-docs/:category', (req, res) => {
  const docs = db.prepare('SELECT * FROM research_docs WHERE category = ? ORDER BY uploaded_at DESC').all(decodeURIComponent(req.params.category)) as any[];
  res.json(docs.map(d => ({ id: d.id, title: d.title, category: d.category, filename: d.filename, url: `/uploads/${path.basename(d.filepath)}`, uploadedAt: d.uploaded_at })));
});

router.post('/api/admin/research-docs', requireAdmin, upload.single('file'), (req, res) => {
  const { category, title } = req.body;
  if (!category || !title || !(req as any).file) return res.status(400).json({ error: 'category, title and file required' });
  const id = uuid();
  db.prepare('INSERT INTO research_docs (id, category, title, filename, filepath, uploaded_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, category, title, (req as any).file.originalname, (req as any).file.path, new Date().toISOString());
  res.json({ ok: true, id });
});

router.delete('/api/admin/research-docs/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM research_docs WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Vendor info ───────────────────────────────────────────────
router.get('/api/vendors', (req, res) => res.json(VENDOR_INFO));
router.get('/api/vendor-categories', (req, res) => {
  const map: Record<string,string[]> = {};
  for (const cat of ALL_CATEGORIES) map[cat] = getVendorsByCategory(cat);
  res.json(map);
});

// ── Customer data ─────────────────────────────────────────────
router.get('/api/customer/:domain', async (req, res) => {
  const { domain } = req.params;
  try {
    const customer = await getCustomerByDomain(domain);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    // Enrich account owner with live profile from DB
    let accountOwner = customer.accountOwner;
    if (accountOwner?.email) {
      const amRow = db.prepare('SELECT * FROM account_managers WHERE email = ?').get(accountOwner.email) as any;
      if (amRow) {
        accountOwner = {
          name: amRow.display_name || amRow.name,
          email: amRow.email,
          phone: amRow.phone || '',
          photo: amRow.photo_path ? `/uploads/${path.basename(amRow.photo_path)}` : '',
          calendly: amRow.calendly || '',
        };
      }
    }

    res.json({
      accountName: customer.accountName,
      domain: customer.domain,
      grid: customer.grid,
      accountOwner,
    });
  } catch (err: any) {
    console.error('Customer data error:', err);
    res.status(500).json({ error: 'Failed to load customer data' });
  }
});

// ── Chatbot ───────────────────────────────────────────────────
router.post('/api/chat', async (req, res) => {
  const { question, domain } = req.body;
  if (!question) return res.status(400).json({ error: 'Missing question' });

  // Find relevant products from catalogue
  const relevant = findRelevantProducts(question);

  // Load customer's owned products for context
  let customerContext = '';
  if (domain) {
    try {
      const customer = await getCustomerByDomain(domain);
      if (customer) {
        const activeProducts = customer.grid
          .filter(g => g.status === 'active')
          .flatMap(g => g.products.map(p => p.name));
        customerContext = activeProducts.length
          ? `The customer currently has active subscriptions to: ${activeProducts.join(', ')}.`
          : 'The customer has no active Broad Peak products yet.';
      }
    } catch {}
  }

  // Build system prompt
  const productContext = PRODUCTS.map(p =>
    `Product: ${p.name} (${p.vendor}) — Categories: ${p.categories.join(', ')}\nDescription: ${p.description}\nKey features: ${p.features.slice(0, 5).join(', ')}`
  ).join('\n\n');

  const systemPrompt = `You are the Broad Peak Cyber customer portal assistant. Broad Peak is a UK-based MSP specialising in cybersecurity.

Your job is to help customers understand where in the Broad Peak portfolio solutions exist for their challenges.

${customerContext}

Here is the full Broad Peak product portfolio:
${productContext}

When answering:
1. Identify which products/areas are most relevant to the customer's question
2. Be specific about product names and features
3. Suggest which category areas may be relevant
4. Keep responses concise and practical
5. If the customer already owns a relevant product, acknowledge this and suggest they speak to the technical team for help using it

Always be helpful and professional. Focus on genuine relevance, not sales pressure.`;

  const GROQ_KEY = process.env.GROQ_API_KEY || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const groqRes = await directFetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GROQ_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        stream: true,
        max_tokens: 1000,
      }),
      ...fetchOpts(),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      res.write(`data: ${JSON.stringify({ error: `Groq error: ${err}` })}\n\n`);
      res.end();
      return;
    }

    // Send relevant products first
    res.write(`data: ${JSON.stringify({ relevantProducts: relevant.map(p => ({ id: p.id, name: p.name, vendor: p.vendor, categories: p.categories, datasheetUrl: p.datasheetUrl })) })}\n\n`);

    const body = groqRes.body as any;
    const decoder = new TextDecoder();
    for await (const chunk of body) {
      const text = decoder.decode(chunk);
      const lines = text.split('\n').filter(l => l.startsWith('data: '));
      for (const line of lines) {
        const data = line.slice(6);
        if (data === '[DONE]') { res.write('data: [DONE]\n\n'); break; }
        try {
          const json = JSON.parse(data);
          const content = json.choices?.[0]?.delta?.content;
          if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
        } catch {}
      }
    }
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

// ── Enquiry email ─────────────────────────────────────────────
router.post('/api/enquiry', async (req, res) => {
  const { customerDomain, accountName, productName, enquiryType, message } = req.body;
  const RESEND_KEY = process.env.RESEND_API_KEY || '';

  const subject = `[Broad Peak Portal] ${enquiryType} enquiry — ${productName} — ${accountName}`;
  const html = `
    <h2>Customer Portal Enquiry</h2>
    <table>
      <tr><td><strong>Account:</strong></td><td>${accountName}</td></tr>
      <tr><td><strong>Domain:</strong></td><td>${customerDomain}</td></tr>
      <tr><td><strong>Product:</strong></td><td>${productName}</td></tr>
      <tr><td><strong>Enquiry type:</strong></td><td>${enquiryType}</td></tr>
    </table>
    <h3>Message</h3>
    <p>${message || 'No additional message provided.'}</p>
  `;

  if (!RESEND_KEY) {
    console.log('ENQUIRY (no Resend key):', { subject, accountName, productName, enquiryType });
    return res.json({ ok: true, warning: 'Email not sent — Resend key not configured' });
  }

  try {
    const emailRes = await directFetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'portal@broadpeakcyber.com',
        to: ['daniel.bailey@broadpeakcyber.com', 'liam.ormsby@broadpeakcyber.com'],
        subject,
        html,
      }),
      ...fetchOpts(),
    });
    if (!emailRes.ok) throw new Error(await emailRes.text());
    res.json({ ok: true });
  } catch (err: any) {
    console.error('Email error:', err);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// ── Vendor news ───────────────────────────────────────────────
router.get('/api/news/vendor', async (req, res) => {
  // Aggregate news from vendor blogs/RSS — return curated static list + dynamic where possible
  const newsItems = [
    { vendor: 'Barracuda', title: 'Barracuda Research: Email Threat Report', url: 'https://www.barracuda.com/reports', date: '2024-01-01', type: 'report' },
    { vendor: 'Keepit', title: 'Keepit Resources & Whitepapers', url: 'https://www.keepit.com/resources/', date: '2024-01-01', type: 'whitepaper' },
    { vendor: 'Arctic Wolf', title: 'Arctic Wolf Security Awareness Resources', url: 'https://arcticwolf.com/resources/', date: '2024-01-01', type: 'resource' },
    { vendor: 'Druva', title: 'Druva Resource Library', url: 'https://www.druva.com/resources/', date: '2024-01-01', type: 'resource' },
    { vendor: 'WatchGuard', title: 'WatchGuard Security Resources', url: 'https://www.watchguard.com/wgrd-resource-center', date: '2024-01-01', type: 'resource' },
  ];
  res.json(newsItems);
});

// ── Newsletters ───────────────────────────────────────────────
router.get('/api/newsletters', (_, res) => {
  const rows = db.prepare('SELECT id, title, filename, uploaded_at FROM newsletters WHERE published = 1 ORDER BY uploaded_at DESC').all();
  res.json(rows);
});

router.get('/api/newsletters/:id/download', (req, res) => {
  const row: any = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.download(row.filepath, row.filename);
});

// ── Admin: newsletters ────────────────────────────────────────
router.get('/api/admin/newsletters', requireAdmin, (_, res) => {
  const rows = db.prepare('SELECT * FROM newsletters ORDER BY uploaded_at DESC').all();
  res.json(rows);
});

router.post('/api/admin/newsletters', requireAdmin, upload.single('file'), (req, res) => {
  const file = (req as any).file;
  const { title } = req.body;
  if (!file || !title) return res.status(400).json({ error: 'Missing file or title' });
  const id = uuid();
  db.prepare('INSERT INTO newsletters (id, title, filename, filepath, uploaded_at) VALUES (?, ?, ?, ?, ?)').run(
    id, title, file.originalname, file.path, new Date().toISOString()
  );
  res.json({ ok: true, id });
});

router.delete('/api/admin/newsletters/:id', requireAdmin, (req, res) => {
  const row: any = db.prepare('SELECT * FROM newsletters WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  try { fs.unlinkSync(row.filepath); } catch {}
  db.prepare('DELETE FROM newsletters WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Datasheets upload/download ────────────────────────────────
router.get('/api/datasheets', (req, res) => {
  const { vendor, category } = req.query;
  let query = 'SELECT id, vendor, product, category, filename, uploaded_at FROM datasheets WHERE 1=1';
  const params: any[] = [];
  if (vendor) { query += ' AND vendor = ?'; params.push(vendor); }
  if (category) { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY vendor, product';
  res.json(db.prepare(query).all(...params));
});

router.get('/api/datasheets/:id/download', (req, res) => {
  const row: any = db.prepare('SELECT * FROM datasheets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.download(row.filepath, row.filename);
});

router.post('/api/admin/datasheets', requireAdmin, upload.single('file'), (req, res) => {
  const file = (req as any).file;
  const { vendor, product, category } = req.body;
  if (!file || !vendor || !product || !category) return res.status(400).json({ error: 'Missing fields' });
  const id = uuid();
  db.prepare('INSERT INTO datasheets (id, vendor, product, category, filename, filepath, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id, vendor, product, category, file.originalname, file.path, new Date().toISOString()
  );
  res.json({ ok: true, id });
});

router.delete('/api/admin/datasheets/:id', requireAdmin, (req, res) => {
  const row: any = db.prepare('SELECT * FROM datasheets WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  try { fs.unlinkSync(row.filepath); } catch {}
  db.prepare('DELETE FROM datasheets WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Vendor catalogue (for chatbot) ───────────────────────────
router.get('/api/vendors', (_, res) => {
  res.json(PRODUCTS.map(p => ({
    id: p.id,
    vendor: p.vendor,
    name: p.name,
    categories: p.categories,
    description: p.description,
    features: p.features,
    datasheetUrl: p.datasheetUrl,
    vendorUrl: p.vendorUrl,
  })));
});

router.get('/api/categories', (_, res) => res.json(ALL_CATEGORIES));

export default router;
