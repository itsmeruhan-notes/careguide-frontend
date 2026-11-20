import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { avatarColor, initials, useAsync, useDebounced } from '../util.js';
import { Empty, ErrorBanner, Skeleton, useToast } from '../ui.jsx';

function Group({ g, joined, busy, onToggle }) {
  const [open, setOpen] = useState(false);
  const first = g.members.slice(0, 4);
  const rest = g.count - first.length;
  const names = g.members.slice(0, 5).map((m) => m.name);
  return (
    <div className="bg-surface-container-lowest rounded-xl p-space-lg shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-space-md mb-space-md">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-headline-sm font-code-md shrink-0 ${joined ? 'bg-primary-fixed text-primary' : 'bg-surface-container-high text-on-surface'}`}>#</div>
            <div className="min-w-0">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight truncate">{g.interest}</h2>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{g.members.filter((m) => m.role === 'admin').length ? `${g.members.filter((m) => m.role === 'admin').length} admin · ` : ''}{g.count} {g.count === 1 ? 'member' : 'members'} share this</span>
            </div>
          </div>
          <div className={`flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-sm text-label-sm font-semibold shrink-0 ${joined ? 'bg-primary-fixed text-primary' : 'bg-surface-container-low text-on-surface-variant'}`}>
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span>{g.count} {g.count === 1 ? 'person' : 'people'}</span>
          </div>
        </div>
        <div className="flex items-center gap-space-sm mb-space-md pt-space-xs">
          <div className="flex items-center -space-x-2 overflow-hidden shrink-0">
            {first.map((m) => (
              <div key={m.id} className={`w-8 h-8 rounded-full ${avatarColor(m.name)} flex items-center justify-center font-label-sm text-label-sm font-semibold ring-2 ring-surface-container-lowest shadow-sm`}>{initials(m.name)}</div>
            ))}
            {rest > 0 && <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center font-label-sm text-label-sm text-on-surface-variant font-semibold ring-2 ring-surface-container-lowest">+{rest}</div>}
          </div>
          <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
            {names.join(', ')}
            {g.count > names.length ? `, and ${g.count - names.length} others` : ''}
          </span>
        </div>
        {open && (
          <div className="bg-surface-container-low rounded-lg p-space-md mb-space-md">
            <div className="flex items-center justify-between mb-space-sm">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Members</span>
              <span className="font-code-sm text-code-sm text-primary">Role breakdown</span>
            </div>
            <div className="flex flex-wrap gap-space-xs">
              {g.members.map((m) => (
                <Link key={m.id} to={`/users/${m.id}`} className="inline-flex items-center gap-space-xs bg-surface-container-lowest px-space-sm py-1 rounded-md shadow-xs hover:ring-1 hover:ring-primary-container/40">
                  <div className={`w-5 h-5 rounded-full ${avatarColor(m.name)} font-code-sm text-[10px] flex items-center justify-center font-semibold`}>{initials(m.name)}</div>
                  <span className="font-body-sm text-body-sm text-on-surface font-medium">{m.name}</span>
                  <span className={`px-1.5 py-0.5 rounded-full font-label-sm text-[10px] ${m.role === 'admin' ? 'bg-secondary-fixed text-on-secondary-fixed font-semibold' : 'bg-surface-container-high text-on-surface-variant'}`}>{m.role === 'admin' ? 'Admin' : 'User'}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between pt-space-xs mt-space-xs">
        <button onClick={() => setOpen((o) => !o)} className={`flex items-center gap-space-xs font-label-md text-label-md cursor-pointer transition-colors ${open ? 'text-primary hover:underline' : 'text-on-surface-variant hover:text-on-surface'}`} type="button">
          <span>{open ? 'Hide members' : 'View all ▾'}</span>
          {open && <span className="material-symbols-outlined text-[16px]">expand_less</span>}
        </button>
        <button
          onClick={onToggle}
          disabled={busy}
          className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md font-medium transition-colors flex items-center gap-space-xs disabled:opacity-60 ${joined ? 'bg-primary-container hover:bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low hover:bg-surface-container text-on-surface'}`}
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">{joined ? 'check' : 'add'}</span>
          <span>{joined ? 'Joined' : 'Join interest'}</span>
        </button>
      </div>
    </div>
  );
}

export default function Interests() {
  const { user, setUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 6;
  const sort = params.get('sort') === 'name' ? 'name' : 'count';
  const filters = (params.get('interest') || '').split(',').filter(Boolean);
  const minMembers = Number(params.get('min')) || 0;
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const [adding, setAdding] = useState(false);
  const [newFilter, setNewFilter] = useState('');
  const [busy, setBusy] = useState('');
  const toast = useToast();

  const res = useAsync(
    () => api('/users/grouped-by-interests', { query: { page, limit, sort, interest: filters.join(','), q, minMembers: minMembers || undefined } }),
    [page, limit, sort, filters.join(','), q, minMembers],
  );
  const set = (patch) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? n.delete(k) : n.set(k, String(v))));
    return n;
  });

  const toggle = async (interest) => {
    const mine = user.interests || [];
    const has = mine.includes(interest);
    if (!has && mine.length >= 10) return toast('You can have up to 10 interests', 'error');
    setBusy(interest);
    try {
      const r = await api('/users/me', { method: 'PATCH', body: { interests: has ? mine.filter((i) => i !== interest) : [...mine, interest] } });
      setUser(r.user);
      toast(has ? `Left #${interest}` : `Joined #${interest}`);
      res.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const addFilter = () => {
    const v = newFilter.trim().toLowerCase().replace(/^#/, '');
    if (v && !filters.includes(v)) set({ interest: [...filters, v].join(','), page: undefined });
    setNewFilter('');
    setAdding(false);
  };

  const data = res.data;
  const pages = data ? Array.from({ length: data.totalPages }, (_, i) => i + 1) : [];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md mb-space-xl">
          <div className="space-y-space-xs">
            <div className="flex items-center gap-space-xs text-primary-container">
              <span className="material-symbols-outlined text-[18px]">group_work</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-semibold text-primary">Community Directory</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">Interests</h1>
            <p className="font-body-md text-body-md text-on-surface-variant">People grouped by what they like</p>
          </div>
          <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-xs rounded-xl self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
            <span className="font-label-md text-label-md text-on-surface-variant">{data?.total ?? '–'} Active Interest Circles</span>
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-xl flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-sm">
            <span className="font-label-md text-label-md text-on-surface-variant font-medium mr-space-xs">Filter:</span>
            {filters.map((f) => (
              <span key={f} className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-primary-fixed text-primary font-label-md text-label-md shadow-sm transition-all duration-200">
                <span className="font-code-sm text-code-sm font-semibold"># {f}</span>
                <button onClick={() => set({ interest: filters.filter((x) => x !== f).join(','), page: undefined })} className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-container hover:text-on-primary transition-colors text-[14px]" type="button">✕</button>
              </span>
            ))}
            <button onClick={() => set({ min: minMembers ? undefined : 3, page: undefined })} className={`inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full font-label-md text-label-md transition-colors cursor-pointer ${minMembers ? 'bg-primary-fixed text-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`} type="button">
              <span className="font-code-sm text-code-sm">Min. 3 members</span>
              {minMembers > 0 && <span className="text-[14px]">✕</span>}
            </button>
            {adding ? (
              <input autoFocus value={newFilter} onChange={(e) => setNewFilter(e.target.value)} onBlur={addFilter} onKeyDown={(e) => e.key === 'Enter' && addFilter()} className="h-7 w-28 px-2 rounded-full bg-surface-container-low font-code-sm text-code-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary-container/20" placeholder="interest" />
            ) : (
              <button onClick={() => setAdding(true)} className="inline-flex items-center gap-space-xs px-space-sm py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px] text-primary">add</span>
                <span>Add filter</span>
              </button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md">
            <div className="relative min-w-[240px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input value={search} onChange={(e) => (setSearch(e.target.value), page > 1 && set({ page: undefined }))} className="w-full h-9 pl-9 pr-space-md rounded-lg bg-surface-container-low text-on-surface placeholder:text-on-surface-variant font-body-md text-body-md focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all" placeholder="Search interests..." type="text" />
            </div>
            <div className="flex items-center gap-space-xs bg-surface-container-low px-space-sm py-1 rounded-lg">
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Sort:</span>
              <select value={sort} onChange={(e) => set({ sort: e.target.value === 'name' ? 'name' : undefined, page: undefined })} className="bg-transparent text-on-surface font-label-md text-label-md focus:outline-none cursor-pointer pr-space-xs">
                <option value="count">Most people</option>
                <option value="name">A–Z</option>
              </select>
            </div>
          </div>
        </div>

        {res.error && <div className="mb-space-xl"><ErrorBanner error={res.error} onRetry={res.reload} /></div>}

        {res.loading && !data ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-xl">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-48" />)}
          </div>
        ) : data?.data.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-space-xl">
            {data.data.map((g) => <Group key={g.interest} g={g} joined={user?.interests?.includes(g.interest)} busy={busy === g.interest} onToggle={() => toggle(g.interest)} />)}
          </div>
        ) : data ? (
          <div className="mb-space-xl">
            <Empty icon="interests" title="No interests found" hint={filters.length || q || minMembers ? 'Try removing a filter or changing your search.' : 'Add some interests on your profile.'} action={<Link to="/profile" className="text-primary font-label-md text-label-md hover:underline">Go to profile</Link>} />
          </div>
        ) : null}

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm mb-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-md">
            <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">lightbulb</span>
            </div>
            <div>
              <p className="font-headline-sm text-headline-sm text-on-surface font-medium">Looking for a new topic?</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">Add custom interests to your profile to discover like-minded colleagues automatically.</p>
            </div>
          </div>
          <Link className="inline-flex items-center gap-space-xs px-space-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-primary font-label-md text-label-md font-semibold transition-colors whitespace-nowrap" to="/profile">
            <span>Profile settings</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {data?.total > 0 && (
          <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md">
            <div className="font-body-sm text-body-sm text-on-surface-variant">
              Showing groups <span className="font-semibold text-on-surface">{(data.page - 1) * data.limit + 1}–{Math.min(data.total, data.page * data.limit)}</span> of <span className="font-semibold text-on-surface">{data.total}</span>
            </div>
            <div className="flex items-center gap-space-xs">
              <button onClick={() => set({ page: page - 1 })} className="px-space-sm py-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md transition-colors disabled:opacity-40" disabled={page <= 1} type="button">‹ Prev</button>
              {pages.map((p) => (
                <button key={p} onClick={() => set({ page: p })} className={p === page ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-semibold flex items-center justify-center shadow-xs' : 'w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md flex items-center justify-center transition-colors'} type="button">{p}</button>
              ))}
              <button onClick={() => set({ page: page + 1 })} className="px-space-sm py-1 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md transition-colors disabled:opacity-40" disabled={page >= data.totalPages} type="button">Next ›</button>
            </div>
            <div className="flex items-center gap-space-xs">
              <span className="font-label-sm text-label-sm text-on-surface-variant whitespace-nowrap">Per page:</span>
              <select value={limit} onChange={(e) => set({ limit: e.target.value, page: undefined })} className="bg-surface-container-low text-on-surface font-label-md text-label-md px-space-sm py-1 rounded-lg focus:outline-none cursor-pointer">
                {[6, 12, 24].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
