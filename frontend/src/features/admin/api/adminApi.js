import { API_BASE_URL } from '@/config/env';

const TOKEN_KEY = 'jc_admin_token';

export const getToken = () => { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } };
const setToken = t => { try { localStorage.setItem(TOKEN_KEY, t); } catch { /* ignore */ } };
export const clearToken = () => { try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };

// Keep the admin's own browsing out of the public statistics.
function excludeFromTracking() {
  try { localStorage.setItem('jc_notrack', '1'); } catch { /* ignore */ }
}

export class UnauthorizedError extends Error {}

export async function login(email, password) {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || 'Login failed.');
  setToken(body.token);
  excludeFromTracking();
  return body.token;
}

export async function fetchAnalytics(params, signal) {
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== '' && v != null));
  const response = await fetch(`${API_BASE_URL}/api/admin/analytics?${new URLSearchParams(clean)}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
    signal,
  });
  if (response.status === 401) throw new UnauthorizedError('Session expired.');
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Request failed (${response.status})`);
  return body;
}

export async function adminRequest(path, { method = 'GET', body, params } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const response = await fetch(`${API_BASE_URL}${path}${query}`, {
    method,
    headers: { Authorization: `Bearer ${getToken()}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (response.status === 401) throw new UnauthorizedError('Session expired.');
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}

export async function triggerJobSync() {
  return adminRequest('/api/admin/sync/trigger', { method: 'POST' });
}

export async function fetchSyncStatus() {
  return adminRequest('/api/admin/sync/status', { method: 'GET' });
}

export async function quickIngestJob(rawText) {
  return adminRequest('/api/jobs/ingest', { method: 'POST', body: { rawText } });
}
