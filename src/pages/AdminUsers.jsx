import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { avatarColor, fullDate, initials, shortDate, useAsync, useDebounced } from '../util.js';
import { ConfirmDialog, ErrorBanner, Overlay, Skeleton, useToast } from '../ui.jsx';
import HistoryDrawer from '../History.jsx';
import { FieldError } from './Register.jsx';

const field = 'w-full h-10 px-3 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all';

function UserModal({ user, me, onClose, onSaved }) {
  const isNew = !user;
  const [form, setForm] = useState({ name: user?.name || '', role: user?.role || 'user', interests: user?.interests || [], status: user?.status || 'active', password: '' });
  const [chip, setChip] = useState('');
  const [adding, setAdding] = useState(false);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const self = user && user.id === me.id;
  const nick = form.name.trim().toLowerCase();

  const addChip = () => {
    const v = chip.trim().toLowerCase();
    if (v && !form.interests.includes(v) && form.interests.length < 10) setForm({ ...form, interests: [...form.interests, v] });
    setChip('');
    setAdding(false);
  };

  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      const body = isNew
        ? { name: nick, role: form.role, interests: form.interests, password: form.password }
        : { role: form.role, interests: form.interests, status: form.status, ...(form.password ? { password: form.password } : {}) };
      const r = await api(isNew ? '/admin/users' : `/admin/users/${user.id}`, { method: isNew ? 'POST' : 'PATCH', body });
      onSaved(r.user, isNew);
    } catch (e) {
      setErrors(Object.keys(e.fields).length ? e.fields : { _: e.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Overlay onClose={onClose}>
      <div className="bg-surface-container-lowest w-full max-w-[560px] rounded-t-2xl sm:rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden max-h-[92vh]">
        <div className="px-space-xl pt-space-lg pb-space-md border-b border-surface-container flex items-start justify-between bg-surface-container-lowest shrink-0">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface font-semibold tracking-tight">{isNew ? 'Add User' : `Edit User · ${user.name}`}</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{isNew ? 'Create an account and set its role' : 'Update role, security attributes, and account status'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors -mr-2" type="button">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="px-space-xl py-space-lg overflow-y-auto flex flex-col gap-space-lg text-on-surface font-body-md text-body-md">
          {errors._ && <ErrorBanner error={{ message: errors._ }} />}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="userNameInput">Nickname</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} readOnly={!isNew} className={`${field} ${isNew ? '' : 'bg-surface-container-high/60 text-on-surface-variant cursor-not-allowed'}`} id="userNameInput" type="text" placeholder="e.g. tanvir" />
            <FieldError message={errors.name} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="userEmailInput">Email Address</label>
              <span className="flex items-center gap-1 font-label-sm text-label-sm text-outline">
                <span className="material-symbols-outlined text-[13px]">lock</span>
                Immutable
              </span>
            </div>
            <div className="relative">
              <input className="w-full h-10 px-3 pl-9 rounded-lg bg-surface-container-high/60 font-body-md text-body-md text-on-surface-variant cursor-not-allowed select-all" disabled id="userEmailInput" readOnly type="text" value={isNew ? (nick ? `${nick}@ruhan.lol` : '') : user.email} />
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">lock</span>
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Email is generated from the nickname and cannot be changed.</span>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="userRoleSelect">System Role</label>
            <div className="relative">
              <select value={form.role} disabled={self || user?.isDemo === 'Y'} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full h-10 pl-3 pr-8 rounded-lg bg-surface-container-low font-body-md text-body-md text-on-surface appearance-none cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all disabled:cursor-not-allowed disabled:text-on-surface-variant" id="userRoleSelect">
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-outline pointer-events-none">expand_more</span>
            </div>
            {form.role === 'admin' && (
              <div className="p-2.5 rounded-lg bg-secondary-fixed/50 text-on-secondary-fixed font-body-sm text-body-sm flex items-start gap-2 mt-1">
                <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">verified_user</span>
                <span>Admins can manage users, view everyone's notes and open DB Insights.</span>
              </div>
            )}
            <FieldError message={errors.role} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Interests &amp; Topics</label>
              <span className="font-label-sm text-label-sm text-outline">{form.interests.length} / 10 chips</span>
            </div>
            <div className="p-2 rounded-lg bg-surface-container-low flex flex-wrap items-center gap-1.5 min-h-[46px]">
              {form.interests.map((i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-surface-container-lowest text-on-surface font-code-sm text-code-sm shadow-sm group">
                  <span>{i}</span>
                  <button onClick={() => setForm({ ...form, interests: form.interests.filter((x) => x !== i) })} className="text-outline hover:text-error transition-colors leading-none flex items-center justify-center" type="button">
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </span>
              ))}
              {form.interests.length < 10 &&
                (adding ? (
                  <input autoFocus value={chip} onChange={(e) => setChip(e.target.value)} onBlur={addChip} onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addChip())} className="h-7 w-24 px-1.5 rounded bg-surface-container-lowest font-code-sm text-code-sm focus:outline-none" />
                ) : (
                  <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-primary font-label-sm text-label-sm font-semibold hover:bg-surface-container-lowest transition-colors" type="button">
                    <span className="material-symbols-outlined text-[14px]">add</span>
                    <span>Add interest</span>
                  </button>
                ))}
            </div>
            <span className="font-label-sm text-label-sm text-on-surface-variant">Add topics this user is associated with (maximum 10).</span>
          </div>
          {!isNew && (
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-semibold">Account Status</label>
              <div className="grid grid-cols-2 gap-space-sm">
                {[
                  ['active', 'Active', 'Can login & write', 'bg-emerald-500', 'peer-checked:ring-emerald-500'],
                  ['deleted', 'Deleted', 'Access blocked', 'bg-error', 'peer-checked:ring-error'],
                ].map(([v, label, hint, dot, ring]) => (
                  <label key={v} className={self || user.isDemo === 'Y' ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}>
                    <input checked={form.status === v} disabled={self || user.isDemo === 'Y'} onChange={() => setForm({ ...form, status: v })} className="peer sr-only" name="status" type="radio" value={v} />
                    <div className={`p-2.5 rounded-lg bg-surface-container-low peer-checked:bg-surface-container-lowest peer-checked:ring-2 ${ring} peer-checked:shadow-sm flex items-center gap-2 transition-all`}>
                      <span className={`w-2.5 h-2.5 rounded-full ${dot} shrink-0`}></span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md font-semibold text-on-surface">{label}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{hint}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-label-md text-label-md text-on-surface font-semibold" htmlFor="passwordInput">{isNew ? 'Password' : 'Set New Password'}</label>
            <div className="relative">
              <input value={form.password} disabled={user?.isDemo === 'Y'} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="new-password" className={`${field} pr-10 disabled:cursor-not-allowed`} id="passwordInput" placeholder={isNew ? 'min. 8 chars, 1 letter, 1 number' : '••••••••'} type={show ? 'text' : 'password'} />
              <button onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility" className="material-symbols-outlined absolute right-3 top-2.5 text-[20px] text-outline hover:text-on-surface transition-colors" type="button">{show ? 'visibility_off' : 'visibility'}</button>
            </div>
            <FieldError message={errors.password} />
            {!isNew && <span className="font-label-sm text-label-sm text-on-surface-variant">{user.isDemo === 'Y' ? 'Demo account passwords are locked.' : 'Leave blank to keep existing password unchanged.'}</span>}
          </div>
          {!isNew && (
            <div className="pt-space-xs text-center sm:text-left font-label-sm text-label-sm text-outline border-t border-surface-container">
              Created {shortDate(user.createdAt)} by {user.createdByName || 'system'} · Updated {shortDate(user.updatedAt)} by {user.updatedByName || 'system'}
            </div>
          )}
        </div>
        <div className="px-space-xl py-space-md border-t border-surface-container bg-surface-container-lowest flex items-center justify-end gap-space-sm shrink-0">
          <button onClick={onClose} className="px-space-md py-2 rounded-lg font-label-md text-label-md font-medium text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">Cancel</button>
          <button onClick={save} disabled={busy} className="px-space-lg py-2 rounded-lg font-label-md text-label-md font-semibold bg-primary-container text-on-primary hover:bg-primary shadow-sm transition-all active:scale-[0.99] disabled:opacity-60" type="button">
            {busy ? 'Saving…' : isNew ? 'Create user' : 'Save changes'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

function RowMenu({ u, me, onEdit, onHistory, onProfile, onDelete, onRestore }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  const item = 'w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-on-surface hover:bg-surface-container-low font-body-sm text-body-sm transition-colors';
  const run = (fn) => () => (setOpen(false), fn(u));
  return (
    <div className="inline-block text-left relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} aria-label="Actions" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" type="button">
        <span className="material-symbols-outlined text-[20px]">more_horiz</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-44 rounded-xl bg-surface-container-lowest p-1 shadow-xl z-20 text-left">
          <button className={item} onClick={run(onEdit)} type="button"><span className="material-symbols-outlined text-[16px] text-outline">edit</span><span>Edit user</span></button>
          <button className={item} onClick={run(onHistory)} type="button"><span className="material-symbols-outlined text-[16px] text-outline">history</span><span>View history</span></button>
          {u.status === 'active' && <button className={item} onClick={run(onProfile)} type="button"><span className="material-symbols-outlined text-[16px] text-outline">account_circle</span><span>View profile</span></button>}
          <div className="h-px bg-surface-container my-1"></div>
          {u.id === me.id ? (
            <span className="block px-3 py-1.5 font-label-sm text-label-sm text-outline select-none italic">Cannot delete self</span>
          ) : u.isDemo === 'Y' ? (
            <span className="block px-3 py-1.5 font-label-sm text-label-sm text-outline select-none italic">Demo account locked</span>
          ) : u.status === 'deleted' ? (
            <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-primary hover:bg-surface-container-low font-body-sm text-body-sm transition-colors" onClick={run(onRestore)} type="button"><span className="material-symbols-outlined text-[16px]">restore</span><span>Restore user</span></button>
          ) : (
            <button className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-error hover:bg-error-container/40 font-body-sm text-body-sm transition-colors" onClick={run(onDelete)} type="button"><span className="material-symbols-outlined text-[16px]">delete</span><span>Delete user</span></button>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminUsers() {
  const { user: me } = useAuth();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page')) || 1;
  const limit = Number(params.get('limit')) || 10;
  const status = params.get('status') || '';
  const role = params.get('role') || '';
  const [search, setSearch] = useState('');
  const q = useDebounced(search.trim());
  const [modal, setModal] = useState(null);
  const [history, setHistory] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();
  const res = useAsync(() => api('/admin/users', { query: { page, limit, q, status, role } }), [page, limit, q, status, role]);
  const set = (patch) => setParams((p) => {
    const n = new URLSearchParams(p);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === '' ? n.delete(k) : n.set(k, String(v))));
    return n;
  });

  const remove = async () => {
    setBusy(true);
    try {
      await api(`/admin/users/${toDelete.id}`, { method: 'DELETE' });
      toast(`${toDelete.name} deleted`);
      setToDelete(null);
      res.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const restore = async (u) => {
    try {
      await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { status: 'active' } });
      toast(`${u.name} restored`);
      res.reload();
    } catch (e) {
      toast(e.message, 'error');
    }
  };

  const data = res.data;
  const sel = 'appearance-none h-9 pl-3 pr-8 rounded-lg bg-surface-container-low font-label-md text-label-md text-on-surface cursor-pointer focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all';

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[1120px] mx-auto px-margin md:px-margin-tablet lg:px-margin-desktop py-space-lg md:py-space-xl flex flex-col gap-space-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-md">
          <nav className="flex items-center gap-space-xs font-label-md text-label-md text-on-surface-variant">
            <span>Admin</span>
            <span className="material-symbols-outlined text-[16px] text-outline">chevron_right</span>
            <span className="text-on-surface font-semibold">Access Control</span>
          </nav>
          <div className="flex items-center bg-surface-container-high p-1 rounded-xl self-start sm:self-auto shadow-sm">
            <button onClick={() => setModal(null)} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${!modal ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[16px]">table_rows</span>
              <span>Table View</span>
            </button>
            <button onClick={() => setModal({ user: null })} className={`px-space-md py-1.5 rounded-lg font-label-md text-label-md transition-all flex items-center gap-1.5 ${modal ? 'font-semibold bg-surface-container-lowest text-primary shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface'}`} type="button">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Add / Edit</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md pb-space-xs">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-space-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Users</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                Admin
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">Manage everyone who can sign in and assign administrative permissions across the system.</p>
          </div>
          <button onClick={() => setModal({ user: null })} className="inline-flex items-center justify-center gap-1.5 px-space-md py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md font-semibold shadow-sm hover:bg-primary transition-all active:scale-[0.99] self-start md:self-auto" type="button">
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span>Add user</span>
          </button>
        </div>

        <div className="bg-surface-container-lowest rounded-xl p-space-md shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-space-md">
          <div className="flex flex-wrap items-center gap-space-sm flex-1">
            <div className="relative min-w-[240px] flex-1 sm:flex-initial sm:w-72">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">search</span>
              <input value={search} onChange={(e) => (setSearch(e.target.value), page > 1 && set({ page: undefined }))} className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-low font-body-sm text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary-container/20 transition-all" placeholder="Search by nickname..." type="text" />
            </div>
            <div className="relative">
              <select value={status} onChange={(e) => set({ status: e.target.value, page: undefined })} className={sel}>
                <option value="">Status: All</option>
                <option value="active">● Active</option>
                <option value="deleted">● Deleted</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-[18px] text-outline pointer-events-none">expand_more</span>
            </div>
            <div className="relative">
              <select value={role} onChange={(e) => set({ role: e.target.value, page: undefined })} className={sel}>
                <option value="">Role: All roles</option>
                <option value="admin">Admin</option>
                <option value="user">User</option>
              </select>
              <span className="material-symbols-outlined absolute right-2.5 top-2 text-[18px] text-outline pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="flex items-center justify-between lg:justify-end gap-space-md font-label-sm text-label-sm text-on-surface-variant">
            <span className="font-medium bg-surface-container-low px-2.5 py-1 rounded-md text-on-surface">{data?.total ?? '–'} {q || status || role ? 'Matching' : 'Total'} Users</span>
            <div className="flex items-center gap-1.5">
              <span>Per page:</span>
              <div className="relative">
                <select value={limit} onChange={(e) => set({ limit: e.target.value, page: undefined })} className="appearance-none pl-2.5 pr-6 py-1 rounded-md bg-surface-container-low font-label-sm text-label-sm text-on-surface cursor-pointer focus:outline-none">
                  {[10, 25, 50].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-1.5 top-1 text-[14px] text-outline pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>
        </div>

        {res.error && <ErrorBanner error={res.error} onRetry={res.reload} />}

        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider select-none">
                  <th className="py-3 px-space-lg font-semibold" scope="col">User</th>
                  <th className="py-3 px-space-md font-semibold" scope="col">Role</th>
                  <th className="py-3 px-space-md font-semibold hidden md:table-cell" scope="col">Interests</th>
                  <th className="py-3 px-space-md font-semibold" scope="col">Status</th>
                  <th className="py-3 px-space-md font-semibold hidden sm:table-cell" scope="col">Joined</th>
                  <th className="py-3 px-space-md font-semibold text-right w-16" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container font-body-sm text-body-sm">
                {res.loading && !data &&
                  Array.from({ length: 5 }, (_, i) => (
                    <tr key={i}><td colSpan={6} className="py-3 px-space-lg"><Skeleton className="h-9" /></td></tr>
                  ))}
                {data?.data.map((u) => {
                  const gone = u.status === 'deleted';
                  return (
                    <tr key={u.id} className={`hover:bg-surface-container-low/60 transition-colors group ${gone ? 'opacity-60' : ''}`}>
                      <td className="py-3 px-space-lg">
                        <div className="flex items-center gap-space-sm min-w-[200px]">
                          <div className={`w-9 h-9 rounded-full ${avatarColor(u.name)} flex items-center justify-center font-label-sm text-label-sm font-bold shadow-sm shrink-0`}>{initials(u.name)}</div>
                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`font-headline-sm text-body-md text-on-surface font-semibold truncate ${gone ? 'line-through decoration-outline' : ''}`}>{u.name}</span>
                              {u.id === me.id && <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-primary font-code-sm text-code-sm font-semibold">You</span>}
                              {u.isDemo === 'Y' && u.id !== me.id && <span className="px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-code-sm text-code-sm">Demo</span>}
                            </div>
                            <span className="text-on-surface-variant font-body-sm text-body-sm truncate">{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        {u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm font-medium">User</span>
                        )}
                      </td>
                      <td className="py-3 px-space-md hidden md:table-cell">
                        <div className="flex items-center gap-1.5 flex-wrap max-w-xs">
                          {u.interests.length ? u.interests.slice(0, 4).map((i) => <span key={i} className="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-code-sm text-code-sm">{i}</span>) : <span className="text-outline">—</span>}
                          {u.interests.length > 4 && <span className="text-outline font-code-sm text-code-sm">+{u.interests.length - 4}</span>}
                        </div>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-on-surface font-label-md text-label-md">
                          <span className={`w-2 h-2 rounded-full ${gone ? 'bg-error' : 'bg-emerald-500'} shadow-sm`}></span>
                          {gone ? 'Deleted' : 'Active'}
                        </span>
                      </td>
                      <td className="py-3 px-space-md whitespace-nowrap text-on-surface-variant font-body-sm text-body-sm hidden sm:table-cell" title={fullDate(u.createdAt)}>{shortDate(u.createdAt)}</td>
                      <td className="py-3 px-space-md text-right relative">
                        <RowMenu u={u} me={me} onEdit={(x) => setModal({ user: x })} onHistory={setHistory} onProfile={(x) => navigate(`/users/${x.id}`)} onDelete={setToDelete} onRestore={restore} />
                      </td>
                    </tr>
                  );
                })}
                {data && !data.data.length && (
                  <tr><td colSpan={6} className="py-12 text-center text-on-surface-variant">No users match these filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {data?.total > 0 && (
            <div className="p-space-md border-t border-surface-container bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-space-md font-body-sm text-body-sm text-on-surface-variant">
              <div>
                Showing <span className="font-medium text-on-surface">{(data.page - 1) * data.limit + 1}–{Math.min(data.total, data.page * data.limit)}</span> of <span className="font-medium text-on-surface">{data.total}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => set({ page: page - 1 })} disabled={page <= 1} className="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-40 transition-colors flex items-center" type="button">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  <span className="font-label-md text-label-md">Prev</span>
                </button>
                <div className="flex items-center gap-1 mx-1">
                  {Array.from({ length: data.totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => set({ page: p })} className={p === page ? 'w-8 h-8 rounded-lg bg-primary-container text-on-primary font-semibold text-center font-label-md text-label-md shadow-sm' : 'w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface text-center font-label-md text-label-md transition-colors'} type="button">{p}</button>
                  ))}
                </div>
                <button onClick={() => set({ page: page + 1 })} disabled={page >= data.totalPages} className="px-2.5 py-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface disabled:opacity-40 transition-colors flex items-center" type="button">
                  <span className="font-label-md text-label-md">Next</span>
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal.user}
          me={me}
          onClose={() => setModal(null)}
          onSaved={(u, isNew) => {
            setModal(null);
            toast(isNew ? `${u.name} created` : `${u.name} updated`);
            res.reload();
          }}
        />
      )}
      {history && <HistoryDrawer url={`/admin/users/${history.id}/history`} subtitle={`${history.name} · ${history.email}`} onClose={() => setHistory(null)} />}
      {toDelete && (
        <ConfirmDialog title="Delete user?" body={`${toDelete.name} will lose access. Their notes and posts will also be removed. The record stays in history and can be restored.`} busy={busy} onCancel={() => setToDelete(null)} onConfirm={remove} />
      )}
    </div>
  );
}
