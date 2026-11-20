import { useEffect, useState } from 'react';
import { api } from '../api.js';

const field = 'h-9 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-sm text-body-sm focus:outline-none focus:ring-2 focus:ring-primary-container/20';

export default function SampleQueries() {
  const [samples, setSamples] = useState([]);
  const [users, setUsers] = useState([]);
  const [interests, setInterests] = useState([]);
  const [key, setKey] = useState('');
  const [params, setParams] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/admin/db/samples').then((r) => {
      setSamples(r.data);
      setKey(r.data[0]?.key || '');
    });
    api('/admin/users', { query: { status: 'active', limit: 50 } }).then((r) => setUsers(r.data));
    api('/users/grouped-by-interests', { query: { limit: 50, sort: 'name' } }).then((r) => setInterests(r.data.map((g) => g.interest)));
  }, []);

  useEffect(() => {
    if (!users.length) return;
    setParams((p) => ({ user: p.user || users.find((u) => u.role === 'user')?.id || users[0].id, email: p.email || users[0].email, interest: p.interest || interests[0] || '' }));
  }, [users, interests]);

  const sample = samples.find((s) => s.key === key);

  const run = async () => {
    if (!sample) return;
    setBusy(true);
    setError('');
    try {
      const query = Object.fromEntries(sample.params.map((p) => [p, params[p]]));
      setResult(await api(`/admin/db/samples/${sample.key}`, { query }));
    } catch (e) {
      setError(e.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const ok = result && result.usesIndex && !result.collscan;

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm">
        <div>
          <div className="flex items-center gap-space-sm">
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">Sample Queries</h2>
            <span className="px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm font-semibold">Live Data</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Run a predefined query against the live database and see the real result next to its explain() plan. Password hashes and history are never returned.</p>
        </div>
      </div>
      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-md">
        <div className="flex flex-col lg:flex-row lg:items-end gap-space-sm">
          <label className="flex flex-col gap-1 flex-1 min-w-0">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Query</span>
            <select value={key} onChange={(e) => (setKey(e.target.value), setResult(null))} className={`${field} w-full`}>
              {samples.map((s) => <option key={s.key} value={s.key}>{s.title}</option>)}
            </select>
          </label>
          {sample?.params.includes('user') && (
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">User</span>
              <select value={params.user || ''} onChange={(e) => setParams({ ...params, user: e.target.value })} className={field}>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>
          )}
          {sample?.params.includes('email') && (
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Email</span>
              <select value={params.email || ''} onChange={(e) => setParams({ ...params, email: e.target.value })} className={field}>
                {users.map((u) => <option key={u.id} value={u.email}>{u.email}</option>)}
              </select>
            </label>
          )}
          {sample?.params.includes('interest') && (
            <label className="flex flex-col gap-1">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Interest</span>
              <select value={params.interest || ''} onChange={(e) => setParams({ ...params, interest: e.target.value })} className={field}>
                {interests.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </label>
          )}
          <button onClick={run} disabled={busy || !sample} className="h-9 inline-flex items-center justify-center gap-space-xs px-space-md rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold shadow-sm hover:bg-primary disabled:opacity-60" type="button">
            <span className={`material-symbols-outlined text-[18px] ${busy ? 'animate-spin' : ''}`}>{busy ? 'progress_activity' : 'play_arrow'}</span>
            <span>Run query</span>
          </button>
        </div>
        {sample && <p className="font-body-sm text-body-sm text-on-surface-variant">{sample.description}</p>}
        {error && <p className="font-body-sm text-body-sm text-error">{error}</p>}
        {result && (
          <>
            <div className="bg-surface-container-low p-space-md rounded-lg font-code-sm text-code-sm text-on-surface overflow-x-auto">
              <pre className="m-0 whitespace-pre">{result.shell}</pre>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-space-sm p-space-sm bg-surface-container-low/50 rounded-lg">
              {[
                ['Plan', ok ? 'IXSCAN' : 'COLLSCAN', ok ? 'text-primary' : 'text-error'],
                ['Index', result.indexes.join(' + ') || '—'],
                ['Keys Examined', result.keysExamined],
                ['Docs Examined', result.docsExamined],
                ['Results', result.resultCount],
                ['Round trip', `${result.wallMs}ms`, 'text-primary'],
              ].map(([l, v, c]) => (
                <div key={l} className="flex flex-col min-w-0">
                  <span className="text-on-surface-variant font-label-sm text-label-sm">{l}</span>
                  <span className={`font-code-md text-code-md font-bold truncate ${c || 'text-on-surface'}`} title={String(v)}>{v}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-md">
              <div className="flex flex-col gap-space-xs min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Result (live)</span>
                <pre className="m-0 bg-surface-container-low rounded-lg p-space-md font-code-sm text-code-sm text-on-surface overflow-auto max-h-96">{JSON.stringify(result.results, null, 2)}</pre>
              </div>
              <div className="flex flex-col gap-space-xs min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Winning plan</span>
                <pre className="m-0 bg-surface-container-low rounded-lg p-space-md font-code-sm text-code-sm text-on-surface overflow-auto max-h-96">{JSON.stringify({ stages: result.stages, plan: result.plan }, null, 2)}</pre>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
