import { useEffect, useRef, useState } from 'react';
import { track } from '@/features/analytics';
import { fetchJobs } from '../api/jobsApi';
import { EMPTY_FILTERS, PAGE_SIZE } from '../constants';
import { readFiltersFromUrl, writeFiltersToUrl } from '../utils/filtersUrl';

const FILTER_KEYS = ['countries', 'cities', 'remoteType', 'remoteScope', 'categories', 'skills', 'experience'];

// Records what people searched/filtered for (and how many results it gave) — once per change.
function trackFilterChanges(prev, next, total) {
  if (!prev) return;
  const q = next.search.trim();
  if (q.length >= 2 && q !== prev.search.trim()) track('search', { q: q.slice(0, 100), results: total });
  if (next.track !== prev.track) track('track_switch', { track: next.track || 'all' });
  for (const key of FILTER_KEYS) {
    if (JSON.stringify(next[key]) !== JSON.stringify(prev[key]) && next[key].length) {
      track('filter', { key, values: next[key], results: total });
    }
  }
  if (next.page !== prev.page) track('page_change', { page: next.page });
}

// Owns the filter state (synced to the URL) and the fetched job list.
export function useJobs() {
  const [filters, setFilters] = useState(readFiltersFromUrl);
  const [status, setStatus] = useState('loading'); // loading | error | results
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [reloadToken, setReloadToken] = useState(0);
  const reported = useRef(null); // filters whose results were last reported to analytics

  useEffect(() => {
    writeFiltersToUrl(filters);
    const controller = new AbortController();
    setStatus('loading');
    fetchJobs({ ...filters, limit: PAGE_SIZE }, controller.signal)
      .then(data => {
        setResult(data);
        setStatus('results');
        trackFilterChanges(reported.current, filters, data.total);
        reported.current = filters;
      })
      .catch(err => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Something went wrong.');
        setStatus('error');
      });
    return () => controller.abort();
  }, [filters, reloadToken]);

  return {
    filters,
    status,
    result,
    error,
    // Change several filter fields at once; always returns to page 1.
    patchFilters: patch => setFilters(f => ({ ...f, ...patch, page: 1 })),
    updateFilter: (key, value) => setFilters(f => ({ ...f, [key]: value, page: 1 })),
    // Add/remove one value of a multi-select filter.
    toggleValue: (key, value) =>
      setFilters(f => ({
        ...f,
        [key]: f[key].includes(value) ? f[key].filter(v => v !== value) : [...f[key], value],
        page: 1,
      })),
    removeValue: (key, value) =>
      setFilters(f => ({ ...f, [key]: Array.isArray(f[key]) ? f[key].filter(v => v !== value) : '', page: 1 })),
    clearFilters: () => setFilters({ ...EMPTY_FILTERS, page: 1 }),
    goToPage: page => setFilters(f => ({ ...f, page })),
    retry: () => setReloadToken(t => t + 1),
  };
}
