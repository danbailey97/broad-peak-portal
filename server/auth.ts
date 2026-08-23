/**
 * Customer authentication helpers — per-domain passwords + optional TOTP 2FA
 */
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuid } from 'uuid';
import db from './db.js';

const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Setup187!!';
const RESET_EXPIRY_MINUTES = 30;

// ── Types ─────────────────────────────────────────────────────────────────────
interface CustomerAuthRow {
  domain: string;
  password_hash: string | null;
  totp_secret: string | null;
  totp_enabled: number;
  reset_token: string | null;
  reset_expires: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAuthRow(domain: string): CustomerAuthRow | null {
  return db.prepare('SELECT * FROM customer_auth WHERE domain = ?').get(domain) as CustomerAuthRow | null;
}

function ensureAuthRow(domain: string): CustomerAuthRow {
  let row = getAuthRow(domain);
  if (!row) {
    db.prepare(
      `INSERT OR IGNORE INTO customer_auth (domain, password_hash, totp_secret, totp_enabled, reset_token, reset_expires, updated_at)
       VALUES (?, NULL, NULL, 0, NULL, NULL, datetime('now'))`
    ).run(domain);
    row = getAuthRow(domain)!;
  }
  return row;
}

// ── Password verification ─────────────────────────────────────────────────────
export async function verifyPassword(domain: string, password: string): Promise<boolean> {
  const row = getAuthRow(domain);
  if (!row || !row.password_hash) {
    // Fall back to universal password
    return password === CUSTOMER_PASSWORD;
  }
  return bcrypt.compare(password, row.password_hash);
}

// ── Password change ───────────────────────────────────────────────────────────
export async function setPassword(domain: string, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare(
    `INSERT INTO customer_auth (domain, password_hash, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(domain) DO UPDATE SET password_hash = excluded.password_hash, updated_at = excluded.updated_at`
  ).run(domain, hash);
}

// ── Password reset token ──────────────────────────────────────────────────────
export function generateResetToken(domain: string): string {
  const token = uuid();
  const expires = new Date(Date.now() + RESET_EXPIRY_MINUTES * 60 * 1000).toISOString();
  db.prepare(
    `INSERT INTO customer_auth (domain, reset_token, reset_expires, updated_at)
     VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(domain) DO UPDATE SET reset_token = excluded.reset_token, reset_expires = excluded.reset_expires, updated_at = excluded.updated_at`
  ).run(domain, token, expires);
  return token;
}

export function verifyResetToken(token: string): string | null {
  const row = db.prepare(
    `SELECT domain, reset_expires FROM customer_auth WHERE reset_token = ?`
  ).get(token) as { domain: string; reset_expires: string } | null;
  if (!row) return null;
  if (new Date(row.reset_expires) < new Date()) return null;
  return row.domain;
}

export async function consumeResetToken(token: string, newPassword: string): Promise<boolean> {
  const domain = verifyResetToken(token);
  if (!domain) return false;
  await setPassword(domain, newPassword);
  db.prepare(
    `UPDATE customer_auth SET reset_token = NULL, reset_expires = NULL, updated_at = datetime('now') WHERE domain = ?`
  ).run(domain);
  return true;
}

// ── TOTP 2FA ─────────────────────────────────────────────────────────────────
export function generateTotpSecret(domain: string): { secret: string; otpauth: string } {
  const generated = speakeasy.generateSecret({ name: `Broad Peak Portal (${domain})`, issuer: 'Broad Peak Portal', length: 20 });
  const secret = generated.base32;
  const otpauth = generated.otpauth_url!;
  // Store secret but not yet enabled — user must verify first
  db.prepare(
    `INSERT INTO customer_auth (domain, totp_secret, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(domain) DO UPDATE SET totp_secret = excluded.totp_secret, updated_at = excluded.updated_at`
  ).run(domain, secret);
  return { secret, otpauth };
}

export async function getTotpQR(domain: string): Promise<{ secret: string; qrDataUrl: string; otpauth: string }> {
  const row = ensureAuthRow(domain);
  let secret = row.totp_secret;
  let otpauth: string;
  if (!secret) {
    const generated = generateTotpSecret(domain);
    secret = generated.secret;
    otpauth = generated.otpauth;
  } else {
    otpauth = speakeasy.otpauthURL({ secret, label: `Broad Peak Portal (${domain})`, issuer: 'Broad Peak Portal', encoding: 'base32' });
  }
  const qrDataUrl = await QRCode.toDataURL(otpauth);
  return { secret, qrDataUrl, otpauth };
}

export function verifyTotp(domain: string, code: string): boolean {
  const row = getAuthRow(domain);
  if (!row?.totp_secret) return false;
  return speakeasy.totp.verify({ token: code, secret: row.totp_secret, encoding: 'base32', window: 1 });
}

export function enableTotp(domain: string, code: string): boolean {
  if (!verifyTotp(domain, code)) return false;
  db.prepare(
    `UPDATE customer_auth SET totp_enabled = 1, updated_at = datetime('now') WHERE domain = ?`
  ).run(domain);
  return true;
}

export function disableTotp(domain: string): void {
  db.prepare(
    `UPDATE customer_auth SET totp_enabled = 0, totp_secret = NULL, updated_at = datetime('now') WHERE domain = ?`
  ).run(domain);
}

export function isTotpEnabled(domain: string): boolean {
  const row = getAuthRow(domain);
  return row?.totp_enabled === 1;
}

export function getTotpStatus(domain: string): { enabled: boolean; configured: boolean } {
  const row = getAuthRow(domain);
  return {
    enabled: row?.totp_enabled === 1,
    configured: !!row?.totp_secret,
  };
}
