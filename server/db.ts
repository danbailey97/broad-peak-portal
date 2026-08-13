import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DB at project root so publish_website persistence snapshots it automatically
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data.db');

// Keep uploads in data/ subdirectory
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS newsletters (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    uploaded_at TEXT NOT NULL,
    published INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS datasheets (
    id TEXT PRIMARY KEY,
    vendor TEXT NOT NULL,
    product TEXT NOT NULL,
    category TEXT NOT NULL,
    filename TEXT NOT NULL,
    filepath TEXT NOT NULL,
    uploaded_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    token TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );

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

export default db;
