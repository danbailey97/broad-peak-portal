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

// ─── VENDOR-SPECIFIC SUPPORT CHAT ────────────────────────────────────────────
// Per-vendor KB search configurations
const VENDOR_KB_CONFIG: Record<string, {
  searchUrl: (q: string) => string;
  contentUrl?: (id: string) => string;
  baseUrl: string;
  parseResults: (data: any) => { title: string; url: string; id: string }[];
  systemPrompt: string;
}> = {
  Barracuda: {
    baseUrl: 'https://documentation.campus.barracuda.com',
    searchUrl: (q) => `https://documentation.campus.barracuda.com/wiki/rest/api/content/search?cql=${encodeURIComponent(`text ~ "${q}" AND type = page`)}&limit=5&expand=space`,
    contentUrl: (id) => `https://documentation.campus.barracuda.com/wiki/rest/api/content/${id}?expand=body.view`,
    parseResults: (data) => (data.results || []).slice(0, 4).map((r: any) => ({
      title: r.title,
      url: `https://documentation.campus.barracuda.com/wiki${r._links?.webui || ''}`,
      id: r.id,
    })),
    systemPrompt: `You are a Barracuda Networks technical support specialist for Broad Peak Cyber customers.
You answer questions specifically about Barracuda products: Email Gateway Defense (EGD), Cloud-to-Cloud Backup (CCB), CloudGen Firewall, Barracuda XDR, Email Security Premium, Incident Response, and related products.
Rules:
1. Give clear, numbered step-by-step instructions based on the Barracuda Campus documentation provided
2. Be specific — reference the exact Barracuda product, menu paths, and settings
3. Always cite the Barracuda Campus documentation URL when available
4. Highlight important warnings or caveats
5. If doc content is provided, use it as your primary source — do not guess settings
6. Format with markdown: headers, numbered steps, code blocks for values
7. If the question is ambiguous, answer for the most likely Barracuda product first, then note other possibilities`,
  },
  Keepit: {
    baseUrl: 'https://help.keepit.com',
    searchUrl: (q) => `https://help.keepit.com/api/v2/search/articles?query=${encodeURIComponent(q)}&locale=en-us`,
    parseResults: (data) => (data.results || []).slice(0, 4).map((r: any) => ({
      title: r.title || r.name,
      url: r.html_url || r.url || `https://help.keepit.com`,
      id: String(r.id || ''),
    })),
    systemPrompt: `You are a Keepit technical support specialist for Broad Peak Cyber customers.
You answer questions specifically about Keepit cloud backup and recovery for Microsoft 365, Google Workspace, Salesforce, and other SaaS platforms.
Rules:
1. Give clear, numbered step-by-step instructions based on the Keepit Help Centre documentation provided
2. Be specific — reference exact Keepit menus, backup policies, and restore procedures
3. Always cite the Keepit Help Centre URL when available
4. Cover backup jobs, restore operations, retention policies, and licensing
5. Format with markdown: headers, numbered steps
6. If doc content is provided, use it as your primary source`,
  },
  Boxphish: {
    baseUrl: 'https://boxphishsupport.helpdocs.io',
    searchUrl: (q) => `https://boxphishsupport.helpdocs.io/api/articles?query=${encodeURIComponent(q)}`,
    parseResults: (data) => (data.articles || data.results || []).slice(0, 4).map((r: any) => ({
      title: r.title || r.name,
      url: r.url || r.html_url || 'https://boxphishsupport.helpdocs.io',
      id: String(r.id || ''),
    })),
    systemPrompt: `You are a Boxphish technical support specialist for Broad Peak Cyber customers.
You answer questions specifically about Boxphish phishing simulation and security awareness training.
Rules:
1. Give clear, numbered step-by-step instructions based on Boxphish HelpDocs documentation provided
2. Cover campaign creation, user enrolment, phishing templates, reporting, and training modules
3. Be specific — reference exact Boxphish menus and settings
4. Format with markdown: headers, numbered steps
5. If doc content is provided, use it as your primary source`,
  },
  Druva: {
    baseUrl: 'https://help.druva.com',
    searchUrl: (q) => `https://help.druva.com/api/v2/help_center/en-us/search?query=${encodeURIComponent(q)}&per_page=5`,
    parseResults: (data) => (data.results || []).slice(0, 4).map((r: any) => ({
      title: r.title || r.name,
      url: r.html_url || `https://help.druva.com`,
      id: String(r.id || ''),
    })),
    systemPrompt: `You are a Druva technical support specialist for Broad Peak Cyber customers.
You answer questions specifically about Druva inSync (endpoint backup), Druva Phoenix (data centre backup), and Druva for Microsoft 365.
Rules:
1. Give clear, numbered step-by-step instructions based on Druva Help Centre documentation provided
2. Be specific — reference exact Druva product names, menus, and policies
3. Cover backup configuration, restore procedures, compliance, and reporting
4. Format with markdown: headers, numbered steps
5. If doc content is provided, use it as your primary source`,
  },
  WatchGuard: {
    baseUrl: 'https://www.watchguard.com',
    searchUrl: (q) => `https://www.watchguard.com/wgrd-support/find-answers?query=${encodeURIComponent(q)}`,
    parseResults: (_data) => [],
    systemPrompt: `You are a WatchGuard technical support specialist for Broad Peak Cyber customers.
You answer questions specifically about WatchGuard Firebox (network security appliances), WatchGuard AuthPoint (MFA), WatchGuard EDR/EPDR (endpoint security), and WatchGuard MDR.
Rules:
1. Give clear, numbered step-by-step instructions based on WatchGuard documentation
2. Be specific — reference exact WatchGuard product names, Policy Manager / Fireware settings, and menu paths
3. Cover firewall rules, VPN configuration, AuthPoint policies, endpoint policies, and MDR
4. Always recommend referring to WatchGuard Support Center at https://www.watchguard.com/wgrd-support/find-answers for official docs
5. Format with markdown: headers, numbered steps, tables for settings`,
  },
};

async function fetchKBContent(url: string): Promise<string> {
  try {
    const res = await directFetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
      ...fetchOpts(),
    });
    if (!res.ok) return '';
    const data = await res.json() as any;
    // Zendesk / HelpDocs article content
    const html = data?.body?.view?.value || data?.body || data?.body_html || data?.article?.body || '';
    if (!html) return '';
    return String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ').trim().slice(0, 4000);
  } catch { return ''; }
}

async function searchVendorKB(vendor: string, question: string): Promise<{ title: string; url: string; content: string }[]> {
  const cfg = VENDOR_KB_CONFIG[vendor];
  if (!cfg) return [];
  try {
    const searchRes = await directFetch(cfg.searchUrl(question), {
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(8000),
      ...fetchOpts(),
    });
    if (!searchRes.ok) return [];
    const data = await searchRes.json() as any;
    const results = cfg.parseResults(data).slice(0, 3);

    // Fetch content for top 2 results
    const withContent = await Promise.all(results.slice(0, 2).map(async (r) => {
      let content = '';
      if (cfg.contentUrl && r.id) {
        content = await fetchKBContent(cfg.contentUrl(r.id));
      }
      return { title: r.title, url: r.url, content };
    }));
    return withContent;
  } catch { return []; }
}

async function* streamGroqSupport(
  messages: { role: string; content: string }[],
  apiKey: string
): AsyncGenerator<string> {
  const res = await directFetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'llama-3.3-70b-versatile', max_tokens: 1500, stream: true, messages }),
    signal: AbortSignal.timeout(30000),
    ...fetchOpts(),
  }) as any;
  if (!res.ok) { const err = await res.text(); throw new Error(`Groq error ${res.status}: ${err.slice(0, 200)}`); }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n'); buf = lines.pop() || '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const raw = line.slice(6).trim();
      if (raw === '[DONE]') return;
      try { const evt = JSON.parse(raw); const text = evt.choices?.[0]?.delta?.content; if (text) yield text; } catch {}
    }
  }
}

router.post('/api/support-chat', async (req, res) => {
  const { question, vendor, domain } = req.body;
  if (!question || !vendor) return res.status(400).json({ error: 'Missing question or vendor' });

  const cfg = VENDOR_KB_CONFIG[vendor];
  const GROQ_KEY = process.env.GROQ_API_KEY || '';

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const send = (d: object) => res.write(`data: ${JSON.stringify(d)}\n\n`);

  try {
    send({ type: 'status', text: `Searching ${vendor} knowledge base...` });
    const kbResults = cfg ? await searchVendorKB(vendor, question) : [];

    let docContext = '';
    if (kbResults.length > 0) {
      docContext = '\n\n## Knowledge Base Articles Found\n\n';
      kbResults.forEach((r) => {
        docContext += `### ${r.title}\nURL: ${r.url}\n\n`;
        if (r.content) docContext += `${r.content}\n\n---\n\n`;
      });
    }

    const systemPrompt = cfg?.systemPrompt || `You are a technical support specialist for ${vendor} products. Provide specific, accurate, step-by-step answers.`;
    const userMessage = docContext ? `Question: ${question}\n${docContext}` : question;

    send({ type: 'status', text: '' });

    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ];

    let fullResponse = '';
    for await (const chunk of streamGroqSupport(messages, GROQ_KEY)) {
      fullResponse += chunk;
      send({ type: 'delta', text: chunk });
    }

    const sources = kbResults.filter(r => r.url && r.url !== cfg?.baseUrl).map(r => ({ title: r.title, url: r.url }));
    send({ type: 'done', sources });
    res.end();
  } catch (err: any) {
    send({ type: 'error', message: err.message });
    res.end();
  }
});

// ─── ASSESSMENTS ─────────────────────────────────────────────────────────────
// Save a completed assessment
router.post('/api/assessments', async (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('cust_')) return res.status(401).json({ error: 'Unauthorised' });

  // Domain comes from the request body (sent by the frontend which knows its own domain)
  const domain: string | null = req.body.domain || null;
  if (!domain) return res.status(400).json({ error: 'Missing domain' });

  const { type, answers, score, label } = req.body;
  if (!type || !answers) return res.status(400).json({ error: 'Missing type or answers' });

  const id = uuid();
  const submitted_at = new Date().toISOString();
  db.prepare('INSERT INTO assessments (id, domain, type, submitted_at, answers, score, label) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(id, domain, type, submitted_at, JSON.stringify(answers), score ?? null, label ?? null);

  res.json({ id, submitted_at });
});

// List assessments for a domain + type
router.get('/api/assessments', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('cust_')) return res.status(401).json({ error: 'Unauthorised' });

  const { domain, type } = req.query as { domain: string; type: string };
  if (!domain || !type) return res.status(400).json({ error: 'Missing domain or type' });

  const rows = db.prepare('SELECT id, type, submitted_at, score, label FROM assessments WHERE domain = ? AND type = ? ORDER BY submitted_at DESC LIMIT 20').all(domain, type) as any[];
  res.json(rows);
});

// Get a specific assessment (answers included)
router.get('/api/assessments/:id', (req, res) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token.startsWith('cust_')) return res.status(401).json({ error: 'Unauthorised' });

  const row = db.prepare('SELECT * FROM assessments WHERE id = ?').get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, answers: JSON.parse(row.answers) });
});

// ─── FRESHDESK TICKET ────────────────────────────────────────────────────────
router.post('/api/support-ticket', async (req, res) => {
  const { subject, description, customerEmail, customerName, accountName, resolved } = req.body;
  const FRESHDESK_API_KEY = process.env.FRESHDESK_API_KEY || '';
  const FRESHDESK_DOMAIN = process.env.FRESHDESK_DOMAIN || '';

  if (!FRESHDESK_API_KEY || !FRESHDESK_DOMAIN) {
    // Log it server-side even without Freshdesk configured
    console.log(`[TICKET] ${resolved ? 'RESOLVED' : 'OPEN'} — ${accountName} — ${subject}`);
    return res.json({ ok: true, simulated: true, message: 'Ticket logged (Freshdesk not yet configured)' });
  }

  try {
    const ticketBody = {
      subject,
      description,
      email: customerEmail || `support@${req.body.domain || 'unknown'}.com`,
      name: customerName || accountName,
      priority: 2,
      status: resolved ? 4 : 2, // 4 = resolved, 2 = open
      tags: ['portal', 'ai-support', resolved ? 'self-resolved' : 'human-requested'],
      custom_fields: { account_name: accountName },
    };
    const fdRes = await directFetch(`https://${FRESHDESK_DOMAIN}.freshdesk.com/api/v2/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${FRESHDESK_API_KEY}:X`).toString('base64')}`,
      },
      body: JSON.stringify(ticketBody),
      ...fetchOpts(),
    }) as any;
    const data = await fdRes.json() as any;
    res.json({ ok: fdRes.ok, ticketId: data.id, status: data.status });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message });
  }
});
