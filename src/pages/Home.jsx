import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { accessLabel, timeAgo, useAsync, useDebounced } from '../util.js';
import { Avatar, ConfirmDialog, Empty, ErrorBanner, Icon, Pagination, Skeleton, useToast } from '../ui.jsx';

const tagStyle = {
  owner: ['bg-primary-container', 'text-primary'],
  write: ['bg-secondary', 'text-secondary'],
  read: ['bg-tertiary', 'text-tertiary'],
  admin: ['bg-secondary', 'text-secondary'],
};

function NoteMenu({ note, onDelete }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const item = 'px-space-md py-1.5 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low flex items-center gap-space-xs w-full text-left';
  const owner = note.access === 'owner';
  const canEdit = owner || note.access === 'write';
  return (
    <div className="relative" ref={ref}>
      <button aria-label="Note options" onClick={() => setOpen((o) => !o)} className="w-7 h-7 rounded-md flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors" type="button">
        <span className="material-symbols-outlined text-[18px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-40 bg-surface-container-lowest rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.08)] py-1.5 flex flex-col">
          <button className={item} onClick={() => navigate(`/notes/${note.id}`)} type="button">
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">open_in_new</span>
            <span>Open</span>
          </button>
          {canEdit && (
            <button className={item} onClick={() => navigate(`/notes/${note.id}/edit`)} type="button">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">edit</span>
              <span>Edit</span>
            </button>
          )}
          {owner && (
            <>
              <button className={item} onClick={() => navigate(`/notes/${note.id}?share=1`)} type="button">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">share</span>
                <span>Share</span>
              </button>
              <button className={item} onClick={() => navigate(`/notes/${note.id}?history=1`)} type="button">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">history</span>
                <span>History</span>
              </button>
              <div className="my-1 h-px bg-surface-container-high"></div>
              <button className="px-space-md py-1.5 font-body-sm text-body-sm text-error hover:bg-error-container/40 flex items-center gap-space-xs w-full text-left" onClick={() => (setOpen(false), onDelete(note))} type="button">
                <span className="material-symbols-outlined text-[16px]">delete</span>
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function NoteCard({ note, onDelete, list }) {
  const navigate = useNavigate();
  const [dot, text] = tagStyle[note.access] || tagStyle.owner;
  const shared = note.access !== 'owner';
  return (
    <article className={`group relative flex ${list ? 'flex-col sm:flex-row sm:items-center gap-space-md' : 'flex-col'} justify-between bg-surface-container-lowest rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200`}>
      <div className={list ? 'flex-1 min-w-0' : ''}>
        <div className="flex items-start justify-between gap-space-sm mb-space-sm">
          <div className="flex items-center gap-space-xs">
            <span className={`w-2 h-2 rounded-full ${dot}`}></span>
            <span className={`font-code-sm text-code-sm ${text} uppercase font-medium`}>{shared ? `${accessLabel[note.access]} · by ${note.owner.name}` : 'Personal'}</span>
          </div>
          <NoteMenu note={note} onDelete={onDelete} />
        </div>
        <h3 onClick={() => navigate(`/notes/${note.id}`)} className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary-container transition-colors mb-space-xs cursor-pointer">
          {note.title}
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-3 leading-relaxed whitespace-pre-line">{note.preview || 'No content yet.'}</p>
      </div>
      <div className={`${list ? 'sm:w-64 sm:mt-0 sm:pt-0 sm:border-t-0' : ''} mt-space-lg pt-space-md border-t border-surface-container flex items-center justify-between gap-space-sm`}>
        {shared ? (
          <div className="flex items-center gap-space-xs">
            <Avatar name={note.owner.name} />
            <span className="font-label-sm text-label-sm text-on-surface-variant">{note.owner.name}</span>
          </div>
        ) : note.sharedCount ? (
          <div className="flex items-center gap-space-xs">
            <div className="flex -space-x-1.5 overflow-hidden">
              {note.sharedWith.slice(0, 3).map((s) => (
                <Avatar key={s.userId} name={s.name} />
              ))}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Shared with {note.sharedCount}</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
            <span className="material-symbols-outlined text-[13px]">lock</span>
            <span>Private</span>
          </span>
        )}
        <span className="font-code-sm text-code-sm text-outline">Edited {timeAgo(note.updatedAt)}</span>
      </div>
    </article>
  );
}

export default function Home() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'shared' ? 'shared' : 'mine';
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 9;
  const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
  const [search, setSearch] = useState(params.get('q') || '');
  const q = useDebounced(search.trim());
  const [list, setList] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const [delError, setDelError] = useState(null);
  const navigate = useNavigate();
  const toast = useToast();

  const notes = useAsync(() => api('/notes', { query: { scope: tab, page, limit, sort, q } }), [tab, page, limit, sort, q]);
  const counts = useAsync(() => api('/users/me/stats'), []);
  const set = (patch) => setParams((p) => {
    const next = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v === undefined ? next.delete(k) : next.set(k, String(v))));
    return next;
  });

  const shown = notes.data?.data || [];

  const doDelete = async () => {
    setBusy(true);
    setDelError(null);
    try {
      await api(`/notes/${toDelete.id}`, { method: 'DELETE' });
      setToDelete(null);
      toast('Note deleted');
      notes.reload();
      counts.reload();
    } catch (e) {
      setDelError(e);
    } finally {
      setBusy(false);
    }
  };

  const tabBtn = (key, label, count) => (
    <button
      onClick={() => set({ tab: key === 'mine' ? undefined : key, page: undefined })}
      className={`group relative inline-flex items-center gap-space-xs pb-3 font-label-md text-label-md transition-colors ${tab === key ? 'font-semibold text-primary-container' : 'font-medium text-on-surface-variant hover:text-on-surface'}`}
      type="button"
    >
      <span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full font-code-sm text-code-sm ${tab === key ? 'bg-surface-container-high text-primary font-semibold' : 'bg-surface-container-low text-on-surface-variant'}`}>{count ?? '–'}</span>
      {tab === key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-container rounded-full"></span>}
    </button>
  );

  return (
    <div className="max-w-[1120px] mx-auto px-gutter md:px-gutter-desktop py-space-lg">
      <div className="flex flex-col w-full">
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-space-lg pb-space-lg border-b border-outline-variant/30">
          <div>
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="font-code-sm text-code-sm text-primary uppercase tracking-widest font-semibold">Workspace</span>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">Personal Notebook</span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">My Notes</h1>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1">Everything you wrote and everything shared with you</p>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button onClick={() => setList((l) => !l)} className="inline-flex items-center justify-center gap-space-xs px-space-md h-9 rounded-lg bg-surface-container-lowest text-on-surface font-label-md text-label-md shadow-sm hover:bg-surface-container-low transition-colors duration-150" type="button">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{list ? 'grid_view' : 'view_agenda'}</span>
              <span>Layout</span>
            </button>
            <button onClick={() => navigate('/notes/new')} className="inline-flex items-center justify-center gap-space-xs px-space-md h-9 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary transition-all duration-150" type="button">
              <span className="material-symbols-outlined text-[18px]">add</span>
              <span>New note</span>
            </button>
          </div>
        </section>

        <section className="flex flex-col md:flex-row md:items-center justify-between gap-space-md pt-space-lg pb-space-md">
          <div className="flex items-center gap-8 border-b border-outline-variant/30 w-full md:w-auto">
            {tabBtn('mine', 'My notes', counts.data?.notes)}
            {tabBtn('shared', 'Shared with me', counts.data?.sharedWithMe)}
          </div>
          <div className="flex items-center gap-space-sm w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-on-surface-variant pointer-events-none">search</span>
              <input value={search} onChange={(e) => (setSearch(e.target.value), page > 1 && set({ page: undefined }))} className="w-full h-9 pl-9 pr-8 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg shadow-sm placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary-container/20 transition-all" placeholder="Search notes..." type="text" />
              {q ? (
                <button onClick={() => setSearch('')} className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline hover:text-on-surface" type="button">close</button>
              ) : (
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[16px] text-outline">tune</span>
              )}
            </div>
            <div className="relative shrink-0">
              <button onClick={() => set({ sort: sort === 'newest' ? 'oldest' : undefined, page: undefined })} className="h-9 px-space-md bg-surface-container-lowest rounded-lg shadow-sm font-label-md text-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-space-xs transition-colors" type="button">
                <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                <span>{sort === 'newest' ? 'Newest first' : 'Oldest first'}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </button>
            </div>
          </div>
        </section>

        {notes.error && <ErrorBanner error={notes.error} onRetry={notes.reload} />}

        {notes.loading && !notes.data ? (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md mt-space-md">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-52" />)}
          </section>
        ) : shown.length ? (
          <section className={`grid gap-space-md mt-space-md ${list ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
            {shown.map((n) => <NoteCard key={n.id} note={n} list={list} onDelete={setToDelete} />)}
          </section>
        ) : notes.data ? (
          <div className="mt-space-md">
            {search ? (
              <Empty icon="search_off" title="No matching notes" hint={`No notes match "${q}".`} />
            ) : tab === 'mine' ? (
              <Empty
                icon="edit_note"
                title="No notes yet"
                hint="Create your first note. Only you can see it until you share it."
                action={
                  <Link to="/notes/new" className="inline-flex items-center justify-center gap-space-xs px-space-md h-9 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-sm hover:bg-primary">
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>New note</span>
                  </Link>
                }
              />
            ) : (
              <Empty icon="group" title="Nothing shared with you yet" hint="When someone shares a note with you, it shows up here." />
            )}
          </div>
        ) : null}

        {notes.data?.total > 0 && (
          <Pagination data={notes.data} noun="notes" limits={[6, 9, 12, 24]} onPage={(p) => set({ page: p })} onLimit={(l) => set({ limit: l, page: undefined })} />
        )}
      </div>

      {toDelete && (
        <ConfirmDialog
          title="Delete note?"
          body={`'${toDelete.title}' will be removed for you${toDelete.sharedCount ? ` and the ${toDelete.sharedCount} ${toDelete.sharedCount === 1 ? 'person' : 'people'} it's shared with` : ''}.`}
          busy={busy}
          error={delError}
          onCancel={() => (setToDelete(null), setDelError(null))}
          onConfirm={doDelete}
        />
      )}
    </div>
  );
}
