import { useState } from 'react';
import { api } from '../api.js';
import { timeAgo, useAsync } from '../util.js';
import { ErrorBanner, Skeleton } from '../ui.jsx';
import SampleQueries from './SampleQueries.jsx';

const kb = (b) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${(b / 1024).toFixed(1)} KB`);

const shellCommand = (c) => {
  const j = (o) => JSON.stringify(o, (k, v) => (v && typeof v === 'object' && v.$oid ? `ObjectId("${v.$oid}")` : v)).replace(/"ObjectId\(\\"([0-9a-f]+)\\"\)"/g, 'ObjectId("$1")');
  if (c.find) return `db.${c.find}.find(${j(c.filter)})${c.sort ? `.sort(${j(c.sort)})` : ''}${c.limit ? `.limit(${c.limit})` : ''}`;
  if (c.count) return `db.${c.count}.countDocuments(${j(c.query)})`;
  if (c.aggregate) return `db.${c.aggregate}.aggregate([${c.pipeline.map((s) => Object.keys(s)[0]).join(', ')}])`;
  return JSON.stringify(c);
};

function Plan({ q, i }) {
  const [open, setOpen] = useState(i === 0);
  const ok = q.usesIndex && !q.collscan;
  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all">
      <div className="p-space-lg flex flex-col gap-space-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-sm">
            <span className="w-7 h-7 rounded-lg bg-surface-container-low flex items-center justify-center font-code-sm text-code-sm font-bold text-on-surface shrink-0">{String(i + 1).padStart(2, '0')}</span>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{q.name}</h3>
              <span className="font-body-sm text-body-sm text-on-surface-variant">{q.purpose}</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-label-sm font-bold ${ok ? 'bg-surface-container-highest text-primary' : 'bg-error-container text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">{ok ? 'done_all' : 'warning'}</span>
              {ok ? 'IXSCAN' : 'COLLSCAN'}
            </span>
            <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded break-all">
              Index: <span className="font-bold text-on-surface">{q.indexes.join(' + ') || '—'}</span>
            </span>
          </div>
        </div>
        <div className="bg-surface-container-low p-space-md rounded-lg font-code-sm text-code-sm text-on-surface overflow-x-auto whitespace-nowrap">{shellCommand(q.command)}</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-space-sm p-space-sm bg-surface-container-low/50 rounded-lg">
          {[
            ['Keys Examined', q.keysExamined],
            ['Docs Examined', q.docsExamined],
            ['Returned', q.returned],
            ['Execution Time', `${q.ms}ms`, 'text-primary'],
          ].map(([l, v, c]) => (
            <div key={l} className="flex flex-col">
              <span className="text-on-surface-variant font-label-sm text-label-sm">{l}</span>
              <span className={`font-code-md text-code-md font-bold ${c || 'text-on-surface'}`}>{v}</span>
            </div>
          ))}
          <div className="flex flex-col col-span-2 sm:col-span-1 justify-center">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${ok ? 'text-primary' : 'text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">{ok ? 'check_circle' : 'error'}</span>
              {ok ? 'Zero COLLSCAN' : 'Collection scan'}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-space-xs">
          <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors self-start" type="button">
            <span className={`material-symbols-outlined text-[16px] transition-transform ${open ? 'rotate-90' : ''}`}>chevron_right</span>
            <span>Explain JSON output</span>
          </button>
          {open && (
            <div className="mt-space-xs bg-surface-container-low rounded-lg p-space-md font-code-sm text-code-sm overflow-x-auto text-on-surface max-h-96 overflow-y-auto">
              <pre className="m-0 leading-relaxed">{JSON.stringify({ stages: q.stages, indexes: q.indexes, totalKeysExamined: q.keysExamined, totalDocsExamined: q.docsExamined, executionTimeMillis: q.ms, winningPlan: q.plan }, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DbInsights() {
  const idx = useAsync(() => api('/admin/db/indexes'), []);
  const ex = useAsync(() => api('/admin/db/explain'), []);
  const [ranAt, setRanAt] = useState(() => new Date());
  const loading = idx.loading || ex.loading;
  const rerun = () => {
    idx.reload();
    ex.reload();
    setRanAt(new Date());
  };
  const plans = ex.data?.data || [];
  const ok = plans.filter((p) => p.usesIndex && !p.collscan).length;
  const pct = plans.length ? Math.round((ok / plans.length) * 100) : 0;
  const maxMs = plans.reduce((m, p) => Math.max(m, p.ms), 0);

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-xl flex flex-col gap-space-xl">
        <div className="flex flex-col gap-space-md">
          <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-md text-label-md">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-on-surface font-semibold">Database Performance &amp; Query Plans</span>
          </nav>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
            <div className="flex flex-col gap-space-xs">
              <div className="flex items-center gap-space-sm flex-wrap">
                <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">DB Insights</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold tracking-wide">Admin</span>
                {idx.data?.server && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface font-code-sm text-code-sm font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    {idx.data.server.topology} · MongoDB {idx.data.server.version}
                  </span>
                )}
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Indexes and query execution plans running on the live database. Every number below comes from explain() right now.</p>
            </div>
            <div className="flex items-center gap-space-sm self-start lg:self-center">
              <button onClick={rerun} disabled={loading} className="inline-flex items-center gap-space-xs px-space-md py-1.5 rounded-lg bg-surface-container-lowest text-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-surface-container-low transition-all active:scale-[0.98] disabled:opacity-60" type="button">
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>sync</span>
                <span>Re-run all query plans</span>
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-space-sm pt-space-xs">
            {[
              ['folder_data', idx.data?.collections ?? '–', 'Collections'],
              ['account_tree', idx.data?.indexes ?? '–', 'Active Indexes'],
              ['bolt', `${maxMs}ms`, 'Max Exec Time', true],
            ].map(([icon, v, l, code]) => (
              <div key={l} className="inline-flex items-center gap-space-xs px-space-md py-1 rounded-full bg-surface-container-lowest shadow-sm font-label-md text-label-md text-on-surface">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">{icon}</span>
                <span className={`font-semibold ${code ? 'font-code-sm text-code-sm' : ''}`}>{v}</span>
                <span className="text-on-surface-variant font-normal">{l}</span>
              </div>
            ))}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-label-md text-label-md font-semibold shadow-sm ${pct === 100 ? 'bg-surface-container-highest text-primary' : 'bg-error-container text-error'}`}>
              <span className="material-symbols-outlined text-[16px]">{pct === 100 ? 'verified' : 'warning'}</span>
              <span>{pct}% Main Queries use IXSCAN {pct === 100 ? '✓' : ''}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-lowest text-on-surface-variant font-code-sm text-code-sm sm:ml-auto">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <span>Target: Live database</span>
            </div>
          </div>
        </div>

        {(idx.error || ex.error) && <ErrorBanner error={idx.error || ex.error} onRetry={rerun} />}

        {idx.data?.collectionStats && (
          <div className="flex flex-col gap-space-md">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">Collections</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live document counts and storage for the three collections.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
              {idx.data.collectionStats.map((c) => (
                <div key={c.name} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-sm text-code-sm font-semibold">{c.name}</span>
                    <span className="font-code-sm text-code-sm text-on-surface-variant">{c.indexes} indexes</span>
                  </div>
                  <span className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none">{c.documents.toLocaleString()}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">documents</span>
                  <div className="grid grid-cols-3 gap-space-xs pt-space-xs font-code-sm text-code-sm">
                    <div className="flex flex-col"><span className="text-outline">data</span><span className="text-on-surface">{kb(c.dataSize)}</span></div>
                    <div className="flex flex-col"><span className="text-outline">avg doc</span><span className="text-on-surface">{c.avgDocSize} B</span></div>
                    <div className="flex flex-col"><span className="text-outline">indexes</span><span className="text-on-surface">{kb(c.indexSize)}</span></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-space-md">
          <div className="flex items-end justify-between gap-space-md">
            <div>
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">Active Indexes</h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Only the indexes the queries need. Compound keys follow Equality → Sort order.</p>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-2 py-1 rounded-lg whitespace-nowrap">Engine: WiredTiger B-Tree</span>
          </div>
          <div className="w-full bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-surface-container-low/70 text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase">
                    <th className="py-space-md px-space-lg font-semibold">Collection</th>
                    <th className="py-space-md px-space-md font-semibold">Index Name</th>
                    <th className="py-space-md px-space-md font-semibold">Type / Properties</th>
                    <th className="py-space-md px-space-lg font-semibold">Used By / Purpose</th>
                    <th className="py-space-md px-space-lg font-semibold text-right">Size / Usage</th>
                  </tr>
                </thead>
                <tbody className="font-body-md text-body-md divide-y divide-surface-container-high">
                  {idx.loading && !idx.data && <tr><td colSpan={5} className="p-space-lg"><Skeleton className="h-40" /></td></tr>}
                  {idx.data?.data.map((r) => (
                    <tr key={`${r.collection}.${r.name}`} className="hover:bg-surface-container-low/40 transition-colors">
                      <td className="py-space-md px-space-lg whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container text-primary font-code-sm text-code-sm font-semibold">{r.collection}</span>
                      </td>
                      <td className="py-space-md px-space-md font-code-sm text-code-sm font-bold text-on-surface">{r.name}</td>
                      <td className="py-space-md px-space-md">
                        <span className="inline-flex items-center gap-1 text-on-surface-variant text-body-sm font-body-sm">
                          <span className="material-symbols-outlined text-[15px] text-primary">{r.unique ? 'key' : r.multikey ? 'data_array' : r.compound ? 'stacks' : 'sort'}</span>
                          {[r.unique ? 'Unique' : null, r.compound ? 'Compound' : 'Single field', r.multikey ? 'Multikey' : null].filter(Boolean).join(', ')}
                        </span>
                        <div className="font-code-sm text-code-sm text-outline mt-0.5">{JSON.stringify(r.key)}</div>
                      </td>
                      <td className="py-space-md px-space-lg text-body-sm text-on-surface-variant">{r.usedBy}</td>
                      <td className="py-space-md px-space-lg text-right font-code-sm text-code-sm text-on-surface">
                        <div className="font-medium">{kb(r.sizeBytes)}</div>
                        <div className="text-on-surface-variant text-[11px]">{r.ops.toLocaleString()} ops{r.since ? ` since ${timeAgo(r.since)}` : ''}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-space-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
            <div>
              <div className="flex items-center gap-space-sm">
                <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">Query Plans</h2>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">Live Execution Audit</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Live explain("executionStats") for every main API query, including both aggregation scenarios.</p>
            </div>
            <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-on-surface-variant self-start sm:self-center">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span>Last run: {timeAgo(ranAt)}</span>
            </div>
          </div>
          <div className="flex flex-col gap-space-md">
            {ex.loading && !ex.data && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-48" />)}
            {plans.map((q, i) => <Plan key={q.name} q={q} i={i} />)}
          </div>
        </div>

        <SampleQueries />

        {plans.length > 0 && (
          <div className="w-full p-space-lg rounded-xl bg-surface-container-lowest shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-space-md">
            <div className="flex items-start gap-space-md">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary flex-shrink-0">
                <span className="material-symbols-outlined text-[24px]">{pct === 100 ? 'verified_user' : 'warning'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Performance Grade: {pct === 100 ? 'A+' : pct >= 80 ? 'B' : 'C'}</h4>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
                  {ok} of {plans.length} core queries avoid collection scans (<code className="font-code-sm text-code-sm text-error font-semibold">COLLSCAN</code>). Slowest one finished in {maxMs}ms.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-sm md:pl-0">
              <span className="font-code-sm text-code-sm text-on-surface-variant">Last verified: {timeAgo(ranAt)}</span>
              <div className="w-2 h-2 rounded-full bg-primary animate-ping"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
