import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// DB at project root so publish_website persistence snapshots it automatically
const DB_PATH = process.env.DB_PATH || path.join(process.env.NODE_ENV === 'production' ? '/data' : process.cwd(), 'data.db');

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
    welcome_video_path TEXT,
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

  CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    type TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    answers TEXT NOT NULL,
    score INTEGER,
    label TEXT
  );

  CREATE TABLE IF NOT EXISTS customer_auth (
    domain TEXT PRIMARY KEY,
    password_hash TEXT,           -- bcrypt hash; NULL = use universal CUSTOMER_PASSWORD
    totp_secret TEXT,             -- base32 TOTP secret; NULL = not set up
    totp_enabled INTEGER DEFAULT 0, -- 1 = 2FA required on login
    reset_token TEXT,             -- short-lived reset token (UUID)
    reset_expires TEXT,           -- ISO timestamp
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Safe migrations for columns added after initial deployment
try { db.exec('ALTER TABLE account_managers ADD COLUMN welcome_video_path TEXT'); } catch { /* already exists */ }

export default db;
