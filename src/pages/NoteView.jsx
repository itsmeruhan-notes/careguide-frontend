import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { accessLabel, avatarColor, fullDate, initials, shortDate, timeAgo, useAsync } from '../util.js';
import { ConfirmDialog, ErrorBanner, Overlay, Skeleton, useToast } from '../ui.jsx';
import Markdown, { wordCount } from '../Markdown.jsx';
import HistoryDrawer from '../History.jsx';
import NotFound from './NotFound.jsx';

const pill = {
  write: 'px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-label-sm text-label-sm font-medium whitespace-nowrap shrink-0',
  read: 'px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-label-sm text-label-sm font-medium whitespace-nowrap shrink-0',
};
const topBadge = {
  owner: 'bg-surface-container-high text-on-surface-variant',
  write: 'bg-emerald-100 text-emerald-800',
  read: 'bg-amber-100 text-amber-800',
  admin: 'bg-secondary-fixed text-on-secondary-fixed',
};

function UserDot({ name, size = 'w-7 h-7' }) {
  return <div className={`${size} rounded-full ${avatarColor(name)} flex items-center justify-center font-label-sm text-label-sm font-semibold shrink-0`}>{initials(name)}</div>;
}

function ShareModal({ note, me, onClose, onChange }) {
  const [email, setEmail] = useState('');
  const [access, setAccess] = useState('write');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const call = async (fn, msg) => {
    setBusy(true);
    setError('');
    try {
      const r = await fn();
      onChange(r.note);
      if (msg) toast(msg);
      return true;
    } catch (e) {
      setError(e.fields?.email || e.message);
      return false;
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!email.trim()) return setError('Enter a nickname');
    const exists = note.sharedWith.some((s) => s.email === (email.includes('@') ? email.trim().toLowerCase() : `${email.trim().toLowerCase()}@ruhan.lol`));
    if (await call(() => api(`/notes/${note.id}/shares`, { method: 'PUT', body: { email: email.trim(), access } }), exists ? 'Access updated' : 'Note shared')) setEmail('');
  };

  return (
    <Overlay onClose={onClose}>
      <div className="w-full max-w-[480px] bg-surface-container-lowest rounded-t-xl sm:rounded-xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4">
          <div className="min-w-0">
            <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">Share "{note.title}"</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Invite collaborators or adjust access rights.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="space-y-2 mb-4">
          <label className="block font-label-md text-label-md text-on-surface font-medium">Add collaborator</label>
          <form className="flex gap-2" onSubmit={(e) => (e.preventDefault(), share())}>
            <div className="relative flex-1">
              <span className="absolute left-3 top-2.5 text-on-surface-variant material-symbols-outlined text-[18px]">mail</span>
              <input value={email} onChange={(e) => (setEmail(e.target.value), setError(''))} className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface text-on-surface font-body-md text-body-md focus:outline-none focus:ring-2 focus:ring-primary-container" placeholder="Enter nickname..." type="text" />
            </div>
            <div className="relative">
              <select value={access} onChange={(e) => setAccess(e.target.value)} className="h-9 px-3 rounded-lg bg-surface text-on-surface font-label-md text-label-md pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-primary-container cursor-pointer">
                <option value="write">Can edit</option>
                <option value="read">Read only</option>
              </select>
              <span className="material-symbols-outlined absolute right-2 top-2.5 text-[16px] text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
            <button disabled={busy} className="h-9 px-4 rounded-lg bg-primary-container hover:bg-primary text-on-primary font-label-md text-label-md transition-colors flex items-center justify-center shrink-0 disabled:opacity-60" type="submit">
              Share
            </button>
          </form>
          {error && (
            <div className="flex items-center gap-1.5 text-error font-body-sm text-body-sm pt-1">
              <span className="material-symbols-outlined text-[16px]">error</span>
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="p-3 rounded-lg bg-surface-container-low mb-5 flex items-start gap-2.5">
          <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">info</span>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-tight">
            <span className="font-semibold text-on-surface">Can edit</span> can view and change title &amp; content. <span className="font-semibold text-on-surface">Read only</span> users can only view. Only you can delete or share.
          </p>
        </div>
        <div className="space-y-3 mb-6">
          <span className="font-label-md text-label-md text-on-surface font-semibold block">People with access</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <UserDot name={me.name} />
              <div>
                <p className="font-body-sm text-body-sm font-medium text-on-surface">
                  {me.name} <span className="text-on-surface-variant text-label-sm font-normal">(you)</span>
                </p>
                <p className="font-label-sm text-label-sm text-on-surface-variant">{me.email}</p>
              </div>
            </div>
            <span className="text-label-sm font-label-sm text-on-surface-variant font-medium px-2 py-1">Owner</span>
          </div>
          {note.sharedWith.map((s) => (
            <div key={s.userId} className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <UserDot name={s.name} />
                <div className="min-w-0">
                  <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{s.name}</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{s.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <select
                    value={s.access}
                    disabled={busy}
                    onChange={(e) => call(() => api(`/notes/${note.id}/shares`, { method: 'PUT', body: { email: s.email, access: e.target.value } }), 'Access updated')}
                    className="h-8 px-2 rounded-md bg-surface text-on-surface font-label-sm text-label-sm pr-6 appearance-none focus:outline-none focus:ring-1 focus:ring-primary-container cursor-pointer"
                  >
                    <option value="write">Can edit</option>
                    <option value="read">Read only</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-1 top-2 text-[14px] text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
                <button disabled={busy} onClick={() => call(() => api(`/notes/${note.id}/shares/${s.userId}`, { method: 'DELETE' }), `Removed ${s.name}`)} className="w-7 h-7 rounded flex items-center justify-center text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors" title="Remove access" type="button">
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={onClose} className="w-full sm:w-auto px-5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors" type="button">
            Done
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export default function NoteView() {
  const { id } = useParams();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const res = useAsync(() => api(`/notes/${id}`), [id]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [delError, setDelError] = useState(null);

  const view = params.get('share') ? 'share' : params.get('history') ? 'history' : 'note';
  const setView = (v) => setParams(v === 'share' ? { share: '1' } : v === 'history' ? { history: '1' } : {}, { replace: true });

  if (res.error) return res.error.status === 404 ? <NotFound inShell message="This note doesn't exist or you don't have access." /> : <div className="max-w-[1120px] mx-auto px-4 py-6"><ErrorBanner error={res.error} onRetry={res.reload} /></div>;

  const note = res.data?.note;
  const access = note?.access;
  const isOwner = access === 'owner';
  const canEdit = isOwner || access === 'write';
  const canHistory = isOwner || user?.role === 'admin';
  const words = wordCount(note?.content);

  const doDelete = async () => {
    setBusy(true);
    try {
      await api(`/notes/${id}`, { method: 'DELETE' });
      toast('Note deleted');
      navigate('/home', { replace: true });
    } catch (e) {
      setDelError(e);
      setBusy(false);
    }
  };

  const seg = (on) => (on ? 'px-2.5 py-1 rounded bg-surface-container-lowest text-primary font-semibold shadow-sm transition-all flex items-center gap-1' : 'px-2.5 py-1 rounded text-on-surface-variant hover:text-on-surface transition-all flex items-center gap-1');

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Link className="inline-flex items-center gap-1.5 text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md group" to={access === 'admin' ? '/admin/notes' : access && !isOwner ? '/home?tab=shared' : '/home'}>
            <span className="material-symbols-outlined text-[18px] transition-transform group-hover:-translate-x-0.5">arrow_back</span>
            <span>Back to notes</span>
          </Link>
          {note && (isOwner || canHistory) && (
            <div className="inline-flex items-center p-1 rounded-lg bg-surface-container-high/60 gap-1 text-label-sm font-label-sm">
              <span className="text-on-surface-variant px-2 hidden sm:inline">Inspect:</span>
              <button onClick={() => setView('note')} className={seg(view === 'note')} type="button">Note Only</button>
              {isOwner && (
                <button onClick={() => setView('share')} className={seg(view === 'share')} type="button">
                  <span className="material-symbols-outlined text-[15px]">person_add</span>
                  Share
                </button>
              )}
              <button onClick={() => setView('history')} className={seg(view === 'history')} type="button">
                <span className="material-symbols-outlined text-[15px]">history</span>
                History
              </button>
            </div>
          )}
        </div>

        {!note ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Skeleton className="lg:col-span-8 h-[520px]" />
            <Skeleton className="lg:col-span-4 h-80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <article className="lg:col-span-8 bg-surface-container-lowest rounded-xl shadow-sm p-6 sm:p-8 relative">
              <div className="flex flex-col gap-3 pb-6">
                <div className="flex flex-wrap items-center gap-2 font-label-sm text-label-sm">
                  <span className={`px-2.5 py-0.5 rounded-full font-medium ${topBadge[access]}`}>{accessLabel[access]}</span>
                  {!isOwner && (
                    <>
                      <span className="text-outline-variant font-bold">·</span>
                      <span className="text-on-surface-variant">by {note.owner.name}</span>
                    </>
                  )}
                  <span className="text-outline-variant font-bold">·</span>
                  <span className="text-on-surface-variant">Created {shortDate(note.createdAt)}</span>
                  <span className="text-outline-variant font-bold">·</span>
                  <span className="inline-flex items-center gap-1 text-primary-container font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
                    Edited {timeAgo(note.updatedAt)} by {note.updatedByName}
                  </span>
                </div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight break-words">{note.title}</h1>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
                    <span className="material-symbols-outlined text-[14px]">terminal</span> note-{note.id.slice(-6)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
                    <span className="material-symbols-outlined text-[14px]">{note.sharedWith.length ? 'lock_open' : 'lock'}</span> {note.sharedWith.length ? `shared-${note.sharedWith.length}` : 'private'}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-surface-container text-on-surface-variant font-code-sm text-code-sm">
                    <span className="material-symbols-outlined text-[14px]">flag</span> rev-{note.revision}
                  </span>
                </div>
              </div>
              <div className="w-full h-px bg-surface-container-high mb-8"></div>
              <Markdown source={note.content} />
              {access === 'read' && (
                <div className="mt-8 p-3.5 rounded-lg bg-amber-50 flex items-center gap-3">
                  <span className="material-symbols-outlined text-amber-700 text-[20px]">visibility</span>
                  <p className="font-body-sm text-body-sm text-amber-800">You have read-only access to this note.</p>
                </div>
              )}
              <div className="mt-10 pt-4 flex flex-wrap items-center justify-between gap-2 text-label-sm font-label-sm text-on-surface-variant bg-surface-container-low/50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">info</span>
                  <span>Document ID: <span className="font-code-sm text-code-sm">{note.id}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span>Words: {words}</span>
                  <span>Reading time: ~{Math.max(1, Math.round(words / 200))} min{words > 300 ? 's' : ''}</span>
                </div>
              </div>
            </article>

            <aside className="lg:col-span-4 bg-surface-container-lowest rounded-xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>Details</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-on-surface-variant font-body-sm text-body-sm">Owner</span>
                    <Link to={`/users/${note.owner.id}`} className="flex items-center gap-2">
                      <UserDot name={note.owner.name} size="w-6 h-6" />
                      <span className="font-body-sm text-body-sm font-medium text-on-surface">{note.owner.name}</span>
                    </Link>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-on-surface-variant font-label-sm text-label-sm">Created</span>
                    <span className="text-on-surface font-body-sm text-body-sm">{fullDate(note.createdAt)} by {note.createdByName}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-on-surface-variant font-label-sm text-label-sm">Last updated</span>
                    <span className="text-on-surface font-body-sm text-body-sm font-medium">{fullDate(note.updatedAt)} by {note.updatedByName}</span>
                  </div>
                </div>
              </div>

              {(isOwner || access === 'admin') && (
                <>
                  <div className="w-full h-px bg-surface-container-high"></div>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider">Shared with ({note.sharedWith.length})</h3>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">{note.sharedWith.length ? 'Active' : 'Private'}</span>
                    </div>
                    <div className="space-y-3 mb-4">
                      {note.sharedWith.map((s) => (
                        <div key={s.userId} className="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserDot name={s.name} />
                            <div className="truncate">
                              <p className="font-body-sm text-body-sm font-medium text-on-surface truncate">{s.name}</p>
                              <p className="font-label-sm text-label-sm text-on-surface-variant truncate">{s.email}</p>
                            </div>
                          </div>
                          <span className={pill[s.access]}>{accessLabel[s.access]}</span>
                        </div>
                      ))}
                      {!note.sharedWith.length && <p className="font-body-sm text-body-sm text-on-surface-variant">Only {isOwner ? 'you' : 'the owner'} can see this note.</p>}
                    </div>
                    {isOwner && (
                      <button onClick={() => setView('share')} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors" type="button">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        <span>Manage sharing</span>
                      </button>
                    )}
                  </div>
                </>
              )}

              {(canEdit || canHistory) && (
                <>
                  <div className="w-full h-px bg-surface-container-high"></div>
                  <div>
                    <h3 className="font-label-md text-label-md font-semibold text-on-surface uppercase tracking-wider mb-3">Actions</h3>
                    <div className="space-y-2">
                      {canEdit && (
                        <button onClick={() => navigate(`/notes/${id}/edit`)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors" type="button">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                          <span>Edit note</span>
                        </button>
                      )}
                      {canHistory && (
                        <button onClick={() => setView('history')} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors" type="button">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          <span>Change history</span>
                        </button>
                      )}
                      {isOwner && (
                        <button onClick={() => setConfirm(true)} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-error hover:bg-error-container/40 font-label-md text-label-md transition-colors pt-2" type="button">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          <span>Delete note</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
              {access === 'read' && (
                <>
                  <div className="w-full h-px bg-surface-container-high"></div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-700">visibility</span>
                    You have read-only access
                  </p>
                </>
              )}
            </aside>
          </div>
        )}
      </div>

      {note && view === 'share' && isOwner && <ShareModal note={note} me={user} onClose={() => setView('note')} onChange={(n) => res.setData({ note: n })} />}
      {note && view === 'history' && canHistory && <HistoryDrawer url={`/notes/${id}/history`} subtitle={note.title} onClose={() => setView('note')} />}
      {confirm && (
        <ConfirmDialog
          title="Delete note?"
          body={`'${note.title}' will be removed for you${note.sharedWith.length ? ` and the ${note.sharedWith.length} ${note.sharedWith.length === 1 ? 'person' : 'people'} it's shared with` : ''}.`}
          busy={busy}
          error={delError}
          onCancel={() => (setConfirm(false), setDelError(null))}
          onConfirm={doDelete}
        />
      )}
    </div>
  );
}
