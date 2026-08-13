const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join('/home/user/workspace/bp-portal', 'data.db');
console.log('DB path:', dbPath);

const db = new Database(dbPath);

const data = JSON.parse(fs.readFileSync('/home/user/workspace/sf-cache-v2-seed.json', 'utf8'));
const records = data.records;

console.log('Records to seed:', records.length);

db.exec(`
  CREATE TABLE IF NOT EXISTS sf_cache (
    domain TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS account_managers (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    phone TEXT,
    photo_path TEXT,
    calendly TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS research_docs (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  );
`);

const stmt = db.prepare(`
  INSERT INTO sf_cache (domain, data, updated_at)
  VALUES (?, ?, ?)
  ON CONFLICT(domain) DO UPDATE SET
    data = excluded.data,
    updated_at = excluded.updated_at
`);

const now = new Date().toISOString();
for (const r of records) {
  stmt.run(r.domain, JSON.stringify(r), now);
}

const count = db.prepare('SELECT COUNT(*) as c FROM sf_cache').get();
const sample = db.prepare('SELECT domain, data FROM sf_cache WHERE domain = ?').get('gigglingsquid.com');
const sampleData = JSON.parse(sample.data);
console.log('Total records:', count.c);
console.log('Sample grid:', sampleData.grid.map(g => g.category + ': ' + g.status).join(', '));
console.log('Account owner:', sampleData.accountOwner ? sampleData.accountOwner.name : 'none');
