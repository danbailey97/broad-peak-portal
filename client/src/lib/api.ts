export const API_BASE = import.meta.env.VITE_API_BASE || '';

// In-memory auth store (works in all environments including sandboxed iframes)
let _token = '';
let _adminToken = '';

export function setToken(t: string) { _token = t; }
export function getToken() { return _token; }
export function setAdminToken(t: string) { _adminToken = t; }
export function getAdminToken() { return _adminToken; }
export function clearTokens() { _token = ''; _adminToken = ''; }

export async function apiFetch(path: string, opts: RequestInit = {}) {
  const token = getToken() || getAdminToken();
  const headers: any = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
  return res;
}

export async function login(domain: string, password: string, totpCode?: string) {
  const res = await fetch(`${API_BASE}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domain, password, ...(totpCode ? { totpCode } : {}) }),
  });
  if (res.status === 202) throw new Error('requires2FA');
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function adminLogin(password: string) {
  const res = await fetch(`${API_BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}
