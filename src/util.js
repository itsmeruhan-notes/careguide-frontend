import { useCallback, useEffect, useState } from 'react';

export const initials = (name = '') => {
  const clean = String(name).replace(/[^a-zA-Z0-9]/g, '');
  return (clean.slice(0, 2) || '?').toUpperCase();
};

const AVATAR = [
  'bg-primary text-on-primary',
  'bg-secondary text-on-secondary',
  'bg-tertiary-container text-on-tertiary',
  'bg-primary-fixed-dim text-on-primary-fixed',
  'bg-secondary-container text-on-secondary-container',
];

export const avatarColor = (name = '') => {
  let h = 0;
  for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR[h % AVATAR.length];
};

export const timeAgo = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 172800) return 'yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) });
};

export const fullDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '';

export const shortDate = (date) => (date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

export const monthYear = (date) => (date ? new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '');

export const accessLabel = { owner: 'Owner', write: 'Can edit', read: 'Read only', admin: 'Admin view' };

export function useAsync(fn, deps) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [tick, setTick] = useState(0);
  const key = JSON.stringify(deps);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ loading: false, error: null, data }))
      .catch((error) => alive && setState({ loading: false, error, data: null }));
    return () => {
      alive = false;
    };
  }, [key, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback((data) => setState((s) => ({ ...s, data })), []);
  return { ...state, reload, setData };
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
