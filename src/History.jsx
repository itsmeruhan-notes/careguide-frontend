import { useEffect, useState } from 'react';
import { api } from './api.js';
import { accessLabel, fullDate, timeAgo } from './util.js';
import { ErrorBanner, Overlay } from './ui.jsx';

const DOT = {
  created: 'bg-emerald-600 ring-emerald-100',
  updated: 'bg-primary-container ring-primary-fixed',
  shared: 'bg-secondary ring-secondary-fixed',
  access_changed: 'bg-secondary ring-secondary-fixed',
  unshared: 'bg-secondary ring-secondary-fixed',
  deleted: 'bg-error ring-error-container',
  password_changed: 'bg-tertiary ring-tertiary-fixed',
};

const VERB = { created: 'Created', updated: 'Edited', shared: 'Shared', access_changed: 'Access changed', unshared: 'Access removed', deleted: 'Deleted', password_changed: 'Password changed' };

const show = (v) => (Array.isArray(v) ? v.join(', ') || '—' : v === '' || v === undefined || v === null ? '—' : String(v));

const lineDiff = (a = '', b = '') => {
  const A = String(a).split('\n');
  const B = String(b).split('\n');
  const setA = new Set(A);
  const setB = new Set(B);
  return [...A.filter((l) => !setB.has(l) && l.trim()).map((l) => ['-', l]), ...B.filter((l) => !setA.has(l) && l.trim()).map((l) => ['+', l])].slice(0, 40);
};

function Change({ field, before, after }) {
  if (field === 'content') {
    const diff = lineDiff(before, after);
    return (
      <details className="pt-1 group">
        <summary className="cursor-pointer text-primary font-label-sm text-label-sm list-none flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px] transition-transform group-open:rotate-90">chevron_right</span>
          <span>Show previous content diff</span>
        </summary>
        <div className="mt-2 p-2 rounded bg-surface-container-lowest font-code-sm text-code-sm space-y-1 leading-relaxed break-words">
          {diff.length ? (
            diff.map(([s, l], i) =>
              s === '-' ? (
                <div key={i} className="text-error bg-error-container/30 px-1 py-0.5 rounded line-through">- {l}</div>
              ) : (
                <div key={i} className="text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">+ {l}</div>
              ),
            )
          ) : (
            <div className="text-on-surface-variant">Whitespace-only change</div>
          )}
        </div>
      </details>
    );
  }
  if (field === 'sharedWith') return null;
  const label = { title: 'Title', status: 'Status', role: 'Role', bio: 'Bio', interests: 'Interests', passwordHash: 'Password', name: 'Nickname' }[field] || field;
  return (
    <div className="space-y-1">
      <div className="font-label-sm text-label-sm text-on-surface-variant font-medium">{label} changed:</div>
      <div className="flex items-center gap-1.5 flex-wrap font-code-sm text-code-sm">
        <span className="px-1.5 py-0.5 rounded bg-error-container text-error line-through break-all">{show(before)}</span>
        <span className="material-symbols-outlined text-[14px] text-outline">arrow_forward</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold break-all">{show(after)}</span>
      </div>
    </div>
  );
}

function Event({ e, last }) {
  const fields = Object.keys(e.after || {}).filter((f) => f !== 'sharedWith');
  const summary =
    e.action === 'shared' || e.action === 'access_changed'
      ? `${e.target?.name} → ${accessLabel[e.target?.access] || e.target?.access}`
      : e.action === 'unshared'
        ? `Removed access for ${e.target?.name}`
        : e.action === 'created'
          ? 'First version saved'
          : fields.length
            ? `Updated ${fields.map((f) => (f === 'passwordHash' ? 'password' : f)).join(', ')}`
            : '';
  return (
    <div className={`relative pl-6 ${last ? '' : 'pb-6'}`}>
      <span className={`absolute left-0 top-1.5 w-3 h-3 rounded-full ring-4 ${DOT[e.action] || DOT.updated}`}></span>
      {!last && <div className="absolute left-1.5 top-5 bottom-0 w-0.5 bg-surface-container-high"></div>}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-label-md text-label-md text-on-surface font-semibold">{VERB[e.action] || e.action} by {e.byName}</span>
          <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap" title={fullDate(e.at)}>{timeAgo(e.at)}</span>
        </div>
        {summary && <p className="font-body-sm text-body-sm text-on-surface-variant">{summary}</p>}
        {fields.length > 0 && e.action !== 'created' && (
          <div className="mt-2.5 p-3 rounded-lg bg-surface-container-low text-body-sm font-body-sm space-y-2">
            {fields.map((f) => <Change key={f} field={f} before={e.before?.[f]} after={e.after?.[f]} />)}
          </div>
        )}
        {(e.action === 'shared' || e.action === 'access_changed') && (
          <div className="mt-2 p-2.5 rounded-lg bg-surface-container-low text-body-sm font-body-sm">
            <div className="flex items-center gap-2 text-on-surface font-label-sm text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>
                {e.target?.name} → <span className={`${e.target?.access === 'write' ? 'text-emerald-700' : 'text-amber-700'} font-medium`}>{accessLabel[e.target?.access]}</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryDrawer({ url, subtitle, onClose }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api(url, { query: { page, limit: 10 } })
      .then((r) => {
        setItems((l) => (page === 1 ? r.data : [...l, ...r.data]));
        setMeta(r);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, page]);

  return (
    <Overlay onClose={onClose} align="right">
      <div className="w-full max-w-[420px] h-full bg-surface-container-lowest shadow-2xl flex flex-col">
        <div className="p-5 flex items-center justify-between bg-surface-container-low/40">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">history</span>
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface leading-tight">History</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-[280px]">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {error && <ErrorBanner error={error} />}
          {!loading && !items.length && !error && <p className="font-body-sm text-body-sm text-on-surface-variant">No changes yet</p>}
          {items.map((e, i) => <Event key={`${e.at}-${i}`} e={e} last={i === items.length - 1} />)}
          {loading && <div className="h-16 animate-pulse rounded-lg bg-surface-container-low mt-4" />}
        </div>
        {meta && meta.page < meta.totalPages && (
          <div className="p-4 bg-surface-container-low/40 flex items-center justify-between">
            <button onClick={() => setPage((p) => p + 1)} disabled={loading} className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors" type="button">
              <span className="material-symbols-outlined text-[18px]">update</span>
              <span>Load older revisions</span>
            </button>
          </div>
        )}
      </div>
    </Overlay>
  );
}
