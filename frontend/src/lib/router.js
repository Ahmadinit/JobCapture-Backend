import { createElement, useEffect, useState } from 'react';
import { track } from '@/features/analytics';

// Minimal History-API router (the app only has a handful of routes, so no dependency needed).
const NAV_EVENT = 'jc:navigate';

export function navigate(to, { replace = false } = {}) {
  if (to === window.location.pathname + window.location.search) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', to);
  window.dispatchEvent(new Event(NAV_EVENT));
  track('pageview');
}

window.addEventListener('popstate', () => track('pageview'));

export function usePath() {
  const [path, setPath] = useState(window.location.pathname);
  useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    window.addEventListener(NAV_EVENT, sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener(NAV_EVENT, sync);
    };
  }, []);
  return path;
}

// A real <a href> (so open-in-new-tab works) that navigates without a page reload on a plain click.
export function Link({ to, onClick, children, ...rest }) {
  const handle = e => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigate(to);
  };
  return createElement('a', { href: to, onClick: handle, ...rest }, children);
}
