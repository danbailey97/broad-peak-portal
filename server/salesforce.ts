/**
 * salesforce.ts - Cache-first Salesforce data layer
 * 
 * Data is pre-loaded from Salesforce by an external process (Perplexity agent)
 * and stored in the sf_cache SQLite table. The server reads from cache.
 * 
 * Cache schema: { domain: string, data: JSON string of CustomerData, updated_at: string }
 */
import db from './db.js';

export interface ProductEntry {
  name: string;
  vendor: string;
  startedAt?: string | null;  // CloseDate of the opportunity
  expiresAt?: string | null;  // Calculated from CloseDate + duration
}

export interface CategoryEntry {
  category: string;
  status: 'active' | 'expired' | 'not_owned';
  products: ProductEntry[];
  expiresAt: string | null;   // Latest expiry across all products in category
  startedAt?: string | null;  // Earliest start date across all products in category
}

export interface AccountOwner {
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  calendly?: string;
}

export interface CustomerData {
  accountName: string;
  domain: string;
  grid: CategoryEntry[];
  hasProducts: boolean;
  opportunityCount: number;
  accountOwner?: AccountOwner;
}

/**
 * Look up a customer by their email domain.
 * Returns null if no match found.
 */
export async function getCustomerByDomain(emailDomain: string): Promise<CustomerData | null> {
  // Normalise: strip www., lowercase, handle full email addresses
  const domain = normaliseDomain(emailDomain);

  // Try exact match first
  const row = db.prepare('SELECT data FROM sf_cache WHERE domain = ?').get(domain) as any;
  if (row) {
    try { return JSON.parse(row.data); } catch { return null; }
  }

  // Try partial match (e.g. user enters 'gigglingsquid' and domain is 'gigglingsquid.com')
  const rows = db.prepare("SELECT domain, data FROM sf_cache WHERE domain LIKE ?").all(`%${domain}%`) as any[];
  if (rows.length === 1) {
    try { return JSON.parse(rows[0].data); } catch { return null; }
  }

  return null;
}

export async function getAllCustomers(): Promise<CustomerData[]> {
  const rows = db.prepare('SELECT data FROM sf_cache').all() as any[];
  return rows.map(r => { try { return JSON.parse(r.data); } catch { return null; } }).filter(Boolean);
}

/**
 * Upsert a batch of customer data records into the cache.
 * Called by the seed/refresh endpoint.
 */
export function upsertCustomerCache(records: CustomerData[]): void {
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
}

export function getCacheStats() {
  const row = db.prepare("SELECT COUNT(*) AS c, MAX(updated_at) AS last FROM sf_cache").get() as any;
  return { count: row.c, lastUpdated: row.last };
}

function normaliseDomain(input: string): string {
  let s = input.trim().toLowerCase();
  // If it looks like a full email, take the part after @
  if (s.includes('@')) s = s.split('@')[1];
  // Strip protocol
  s = s.replace(/^https?:\/\//i, '');
  // Strip www.
  s = s.replace(/^www\./, '');
  // Strip path
  s = s.split('/')[0].split('?')[0];
  return s;
}
