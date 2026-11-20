import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { avatarColor, fullDate, initials, timeAgo, useAsync, useDebounced } from '../util.js';
import { ErrorBanner, Skeleton } from '../ui.jsx';

const sel = 'appearance-none h-9 pl-space-md pr-8 rounded-lg bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md cursor-pointer focus:outline-none shadow-xs';

export default function AdminNotes() {
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 10;
  const status = params.get('status') || '';
  const sharing = params.get('sharing') || '';
  const sort = params.get('sort') || '';
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const navigate = useNavigate();
  const res = useAsync(() => api('/admin/notes', { query: { page, limit, q, status, sharing, sort } }), [page, limit, q, status, sharing, sort]);
  const set = (patch) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? n.delete(k) : n.set(k, String(v))));
    return n;
  });
  const data = res.data;
  const pages = data ? Array.from({ length: data.totalPages }, (_, i) => i + 1).filter((p) => p === 1 || p === data.totalPages || Math.abs(p - page) <= 1) : [];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-xl flex flex-col gap-space-lg">
        <div className="w-full bg-secondary-fixed/50 rounded-xl p-space-md flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm shadow-sm">
          <div className="flex items-center gap-space-sm">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-secondary text-on-secondary shrink-0">
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
            </span>
            <div className="flex flex-wrap items-center gap-x-space-sm gap-y-1">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Read-only mode active:</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">Note contents and history can be inspected via Admin View.</span>
            </div>
          </div>
          <div className="flex items-center gap-space-xs self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 px-space-sm py-1 rounded-full bg-surface-container-lowest text-secondary font-code-sm text-code-sm font-medium shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
              {data?.counts?.all ?? '–'} Total Notes System-wide
            </span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-space-xs">
            <nav aria-label="Breadcrumbs" className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="text-secondary font-medium">Admin</span>
              <span className="material-symbols-outlined text-[14px] text-outline">chevron_right</span>
              <span className="text-on-surface font-medium">System Notes</span>
            </nav>
            <div className="flex items-center gap-space-md">
              <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">All Notes</h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold tracking-wide">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Admin
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">Every note in the system (read-only audit scope)</p>
          </div>
          <div className="flex items-center gap-space-sm">
            {[
              ['Active', data?.counts?.active, 'bg-[#16A34A]'],
              ['Deleted', data?.counts?.deleted, 'bg-error'],
            ].map(([label, n, dot]) => (
              <div key={label} className="bg-surface-container-lowest px-space-md py-space-xs rounded-lg shadow-sm flex items-center gap-space-sm">
                <span className={`w-2 h-2 rounded-full ${dot}`}></span>
                <div className="flex flex-col">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">{label}</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none">{n ?? '–'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-space-md">
          <div className="relative flex-1 min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-outline">search</span>
            <input value={search} onChange={(e) => (setSearch(e.target.value), page > 1 && set({ page: undefined }))} className="w-full h-9 pl-9 pr-space-md rounded-lg bg-surface text-on-surface placeholder:text-outline text-body-md font-body-md focus:outline-none focus:bg-surface-container-lowest shadow-xs" placeholder="Search notes by title, owner name, or keywords..." type="text" />
          </div>
          <div className="flex flex-wrap items-center gap-space-sm">
            <div className="relative">
              <select value={status} onChange={(e) => set({ status: e.target.value, page: undefined })} className={sel}>
                <option value="">Status: All</option>
                <option value="active">Status: Active</option>
                <option value="deleted">Status: Deleted</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={sharing} onChange={(e) => set({ sharing: e.target.value, page: undefined })} className={sel}>
                <option value="">Sharing: All</option>
                <option value="shared">Shared notes</option>
                <option value="private">Private notes</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={sort} onChange={(e) => set({ sort: e.target.value, page: undefined })} className={sel}>
                <option value="">Sort: Newest first</option>
                <option value="oldest">Sort: Oldest first</option>
                <option value="title">Sort: Title (A–Z)</option>
                <option value="owner">Sort: Owner name</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline pointer-events-none">swap_vert</span>
            </div>
            <button onClick={() => (setSearch(''), setParams({}))} className="h-9 px-space-sm rounded-lg bg-surface hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors flex items-center justify-center" title="Reset Filters" type="button">
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {res.error && <ErrorBanner error={res.error} onRetry={res.reload} />}

        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left min-w-[920px]">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-md px-space-lg font-semibold" scope="col">Title &amp; Context</th>
                  <th className="py-space-md px-space-md font-semibold" scope="col">Owner</th>
                  <th className="py-space-md px-space-md font-semibold" scope="col">Sharing</th>
                  <th className="py-space-md px-space-md font-semibold" scope="col">Status</th>
                  <th className="py-space-md px-space-md font-semibold" scope="col">Updated</th>
                  <th className="py-space-md px-space-lg text-right font-semibold" scope="col">Inspection</th>
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {res.loading && !data && Array.from({ length: 5 }, (_, i) => <tr key={i}><td colSpan={6} className="py-space-md px-space-lg"><Skeleton className="h-10" /></td></tr>)}
                {data?.data.map((n) => {
                  const gone = n.status === 'deleted';
                  const open = () => !gone && navigate(`/notes/${n.id}`);
                  return (
                    <tr key={n.id} onClick={open} className={gone ? 'group opacity-60 hover:opacity-100 bg-surface-container-lowest hover:bg-error-container/20 transition-all' : 'group hover:bg-surface-container-low/60 transition-colors cursor-pointer'}>
                      <td className="py-space-md px-space-lg">
                        <div className="flex items-start gap-space-sm">
                          <span className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${gone ? 'text-error' : n.sharedCount ? 'text-primary-container' : 'text-outline'}`}>{gone ? 'delete_forever' : n.sharedCount ? 'group' : 'lock'}</span>
                          <div className="flex flex-col min-w-0">
                            <span className={`font-headline-sm text-headline-sm font-semibold text-on-surface group-hover:text-primary transition-colors ${gone ? 'line-through decoration-error/50' : ''}`}>{n.title}</span>
                            <span className="font-body-sm text-body-sm text-on-surface-variant truncate max-w-sm">{n.preview || 'No content'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        <div className="flex items-center gap-space-sm">
                          <div className={`w-7 h-7 rounded-full ${avatarColor(n.owner.name)} flex items-center justify-center font-label-sm text-label-sm font-semibold shadow-xs`}>{initials(n.owner.name)}</div>
                          <span className="font-label-md text-label-md text-on-surface font-medium">{n.owner.name}</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">{n.sharedCount ? `${n.sharedCount} ${n.sharedCount === 1 ? 'person' : 'people'}` : 'Private'}</span>
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap">
                        {gone ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container text-error font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                            Deleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#DCFCE7] text-[#16A34A] font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-space-md px-space-md whitespace-nowrap text-on-surface-variant font-body-sm text-body-sm" title={fullDate(n.updatedAt)}>{timeAgo(n.updatedAt)}</td>
                      <td className="py-space-md px-space-lg text-right whitespace-nowrap">
                        {gone ? (
                          <span className="font-label-sm text-label-sm text-outline italic">Soft-deleted</span>
                        ) : (
                          <button onClick={(e) => (e.stopPropagation(), open())} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface hover:bg-secondary-fixed text-secondary font-label-md text-label-md font-semibold transition-colors" type="button">
                            <span>Inspect</span>
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data && !data.data.length && <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">No notes match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          {data?.total > 0 && (
            <div className="p-space-md bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md">
              <span className="font-body-sm text-body-sm text-on-surface-variant">
                Showing <span className="font-semibold text-on-surface">{(data.page - 1) * data.limit + 1}–{Math.min(data.total, data.page * data.limit)}</span> of <span className="font-semibold text-on-surface">{data.total}</span> notes
              </span>
              <div className="flex items-center gap-1 font-label-md text-label-md">
                <button onClick={() => set({ page: page - 1 })} disabled={page <= 1} className={`px-2 py-1 rounded-lg flex items-center ${page <= 1 ? 'text-outline cursor-not-allowed' : 'text-on-surface hover:bg-surface-container transition-colors'}`} type="button">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  <span className="hidden sm:inline">Prev</span>
                </button>
                {pages.map((p, i) => (
                  <span key={p} className="flex items-center gap-1">
                    {i > 0 && p - pages[i - 1] > 1 && <span className="w-8 h-8 flex items-center justify-center text-outline">…</span>}
                    <button onClick={() => set({ page: p })} className={p === page ? 'w-8 h-8 rounded-lg bg-secondary text-on-secondary font-semibold flex items-center justify-center shadow-xs' : 'w-8 h-8 rounded-lg text-on-surface hover:bg-surface-container flex items-center justify-center transition-colors'} type="button">{p}</button>
                  </span>
                ))}
                <button onClick={() => set({ page: page + 1 })} disabled={page >= data.totalPages} className={`px-2 py-1 rounded-lg flex items-center ${page >= data.totalPages ? 'text-outline cursor-not-allowed' : 'text-on-surface hover:bg-surface-container transition-colors'}`} type="button">
                  <span className="hidden sm:inline">Next</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
              <div className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <span>Per page:</span>
                <div className="relative">
                  <select value={limit} onChange={(e) => set({ limit: e.target.value, page: undefined })} className="appearance-none h-8 pl-space-sm pr-6 rounded-lg bg-surface hover:bg-surface-container text-on-surface font-label-sm text-label-sm cursor-pointer focus:outline-none">
                    {[10, 25, 50].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] text-outline pointer-events-none">expand_more</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-full bg-surface-container-low rounded-xl p-space-md flex items-start gap-space-sm">
          <span className="material-symbols-outlined text-[20px] text-secondary mt-0.5 shrink-0">info</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            <strong className="font-semibold text-on-surface">System Audit Scope:</strong> Admins can read every note and its history. Changing or deleting a note still needs ownership or edit access, so admins cannot alter other people's notes from here.
          </p>
        </div>
      </div>
    </div>
  );
}
