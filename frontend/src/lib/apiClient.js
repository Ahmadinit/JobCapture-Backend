import { API_BASE_URL } from '@/config/env';
import { trackApi } from '@/features/analytics';

// Thin fetch wrapper shared by every feature's API module.
export async function apiGet(path, { params, signal } = {}) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : '';
  const startedAt = performance.now();
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}${query}`, { signal });
  } catch (err) {
    if (err.name !== 'AbortError') trackApi(path, 0, performance.now() - startedAt);
    throw err;
  }
  trackApi(path, response.status, performance.now() - startedAt);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}
