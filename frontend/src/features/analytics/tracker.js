import { API_BASE_URL } from '@/config/env';

// First-party, anonymous usage tracking. Sends batched events to our own backend (/api/t).
// - No login: a random visitor id lives in localStorage, a session id in sessionStorage.
// - Respects Do Not Track, and never runs on /admin or for browsers flagged by the admin login.
const ENDPOINT = `${API_BASE_URL}/api/t`;
const SESSION_GAP_MS = 30 * 60 * 1000;
const FLUSH_AT = 8;
const FLUSH_DELAY_MS = 4000;

let queue = [];
let timer = null;
let started = false;
let visibleSince = Date.now();
let visibleMs = 0;
let maxScroll = 0;
let errorCount = 0;

const store = (area, key, value) => {
  try {
    if (value === undefined) return window[area].getItem(key);
    window[area].setItem(key, value);
  } catch { /* storage blocked: tracking just becomes less precise */ }
  return null;
};

export function isTrackingEnabled() {
  if (typeof window === 'undefined') return false;
  if (store('localStorage', 'jc_notrack')) return false;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return false;
  return !window.location.pathname.startsWith('/admin');
}

const randomId = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

function getVisitor() {
  let vid = store('localStorage', 'jc_vid');
  let created = false;
  if (!vid) {
    vid = randomId();
    store('localStorage', 'jc_vid', vid);
    created = true;
  }
  return { vid, created };
}

function getSession() {
  const now = Date.now();
  let session = null;
  try { session = JSON.parse(store('sessionStorage', 'jc_sess')); } catch { /* ignore */ }
  if (!session || now - session.last > SESSION_GAP_MS) {
    const { vid, created } = getVisitor();
    const params = new URLSearchParams(window.location.search);
    let ref = '';
    try {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) ref = host.replace(/^www\./, '');
    } catch { /* no referrer */ }
    session = {
      id: randomId(), vid, last: now, nv: created, ref,
      utm: { s: params.get('utm_source') || '', m: params.get('utm_medium') || '', c: params.get('utm_campaign') || '' },
    };
  }
  session.last = now;
  store('sessionStorage', 'jc_sess', JSON.stringify(session));
  return session;
}

function context(session) {
  return {
    vid: session.vid,
    sid: session.id,
    isNew: session.nv,
    ref: session.ref,
    utm: session.utm,
    lang: navigator.language,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    scr: `${window.screen.width}x${window.screen.height}`,
    theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    conn: navigator.connection?.effectiveType || '',
  };
}

function flush(useBeacon = false) {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const now = Date.now();
  const batch = queue.splice(0, queue.length).map(({ at, ...e }) => ({ ...e, ago: now - at }));
  const body = JSON.stringify({ ctx: context(getSession()), events: batch });
  try {
    if (useBeacon && navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* never let tracking break the page */ }
}

export function track(type, data) {
  if (!isTrackingEnabled()) return;
  const d = new Date();
  queue.push({ type, at: d.getTime(), path: window.location.pathname, hour: d.getHours(), dow: d.getDay(), data });
  if (queue.length >= FLUSH_AT) flush();
  else if (!timer) timer = setTimeout(flush, FLUSH_DELAY_MS);
}

// Compact description of a job for event payloads.
export function jobProps(job) {
  return {
    jobId: job._id,
    title: job.jobTitle,
    company: job.company,
    categories: (job.categories || []).slice(0, 3),
    city: job.cities?.[0] || '',
  };
}

export function trackApi(endpoint, status, ms) {
  if (status >= 400 || status === 0) track('api_error', { endpoint, status, ms: Math.round(ms) });
  else if (ms > 3000) track('api_slow', { endpoint, status, ms: Math.round(ms) });
}

function onVisibility() {
  if (document.visibilityState === 'hidden') {
    visibleMs += Date.now() - visibleSince;
    track('page_leave', { dur: Math.round(visibleMs / 1000), scroll: maxScroll });
    visibleMs = 0;
    flush(true);
  } else {
    visibleSince = Date.now();
  }
}

function trackError(msg, src) {
  if (errorCount++ >= 5) return;
  track('js_error', { msg: String(msg || 'error').slice(0, 180), src: String(src || '').slice(0, 120) });
}

export function startTracking() {
  if (started || !isTrackingEnabled()) return;
  started = true;

  track('pageview');

  window.addEventListener('load', () => {
    setTimeout(() => {
      const nav = performance.getEntriesByType?.('navigation')?.[0];
      if (nav && nav.loadEventEnd > 0) track('perf', { load: Math.round(nav.loadEventEnd), ttfb: Math.round(nav.responseStart) });
    }, 0);
  });

  window.addEventListener('scroll', () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.min(100, Math.round(((window.scrollY) / total) * 100)) : 100;
    if (pct > maxScroll) maxScroll = pct;
  }, { passive: true });

  window.addEventListener('error', e => trackError(e.message, e.filename ? `${e.filename.split('/').pop()}:${e.lineno}` : ''));
  window.addEventListener('unhandledrejection', e => trackError(e.reason?.message || e.reason, 'promise'));
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('pagehide', () => flush(true));
}
