import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { initials, timeAgo, useAsync } from '../util.js';
import { useToast } from '../ui.jsx';
import { FieldError, LEVELS, strength } from './Register.jsx';

const input = 'w-full h-10 px-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-lowest transition-colors';

function PasswordField({ id, label, value, onChange, error, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor={id}>{label}</label>
      <div className="relative flex items-center">
        <input value={value} onChange={onChange} autoComplete={autoComplete} className={`${input} pr-10 ${error ? 'bg-error-container/30' : ''}`} id={id} type={show ? 'text' : 'password'} />
        <button onClick={() => setShow((s) => !s)} aria-label={`Toggle ${label} visibility`} className="absolute right-2.5 text-on-surface-variant hover:text-on-surface transition-colors" type="button">
          <span className="material-symbols-outlined text-[18px]">{show ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      <FieldError message={error} />
    </div>
  );
}

export default function Profile() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const stats = useAsync(() => api('/users/me/stats'), []);
  const [bio, setBio] = useState(user.bio || '');
  const [interests, setInterests] = useState(user.interests || []);
  const [chip, setChip] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileErr, setProfileErr] = useState({});
  const [pwd, setPwd] = useState({ current: '', next: '', confirm: '' });
  const [pwdErr, setPwdErr] = useState({});
  const [pwdBusy, setPwdBusy] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setProfileErr({});
    try {
      const r = await api('/users/me', { method: 'PATCH', body: { bio, interests } });
      setUser(r.user);
      toast('Profile changes saved successfully.');
    } catch (err) {
      setProfileErr(Object.keys(err.fields).length ? err.fields : { _: err.message });
    } finally {
      setSaving(false);
    }
  };

  const addChip = () => {
    const v = chip.trim().toLowerCase().replace(/^#/, '');
    if (v && !interests.includes(v) && interests.length < 10) setInterests([...interests, v]);
    setChip('');
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwd.current) errs.currentPassword = 'Current password is required';
    if (pwd.next.length < 8 || !/[A-Za-z]/.test(pwd.next) || !/\d/.test(pwd.next)) errs.newPassword = 'At least 8 characters with a letter and a number';
    if (pwd.next !== pwd.confirm) errs.confirm = 'Passwords do not match';
    setPwdErr(errs);
    if (Object.keys(errs).length) return;
    setPwdBusy(true);
    try {
      await api('/users/me/password', { method: 'PATCH', body: { currentPassword: pwd.current, newPassword: pwd.next } });
      setPwd({ current: '', next: '', confirm: '' });
      toast('Password updated');
    } catch (err) {
      setPwdErr(Object.keys(err.fields).length ? err.fields : { _: err.message });
    } finally {
      setPwdBusy(false);
    }
  };

  const level = strength(pwd.next);
  const s = stats.data;
  const isAdmin = user.role === 'admin';
  const cards = [
    ['edit_note', 'text-primary-container', 'Live', s?.notes, 'Notes created'],
    ['outgoing_mail', 'text-secondary', 'Shared', s?.sharedByMe, 'Shared by me'],
    ['group_add', 'text-primary', 'Inbox', s?.sharedWithMe, 'Shared with me'],
    ['article', 'text-tertiary', 'Public', s?.posts, 'Public posts'],
  ];

  return (
    <div className="flex flex-col w-full">
      <div className="w-full max-w-[720px] mx-auto px-gutter py-space-xl md:py-8">
        <header className="mb-space-xl">
          <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider mb-space-xs">
            <span>Settings</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary-container font-semibold">Account &amp; Security</span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">My Profile</h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Manage your personal account details, security credentials, and public presence.</p>
        </header>
        <div className="flex flex-col gap-5">
          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary to-primary-container flex items-center justify-center font-headline-md text-headline-md text-on-primary font-bold shadow-sm select-none">{initials(user.name)}</div>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-semibold truncate">{user.name}</span>
                    <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold flex items-center gap-1 ${isAdmin ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-secondary' : 'bg-outline'}`}></span>
                      {isAdmin ? 'Admin' : 'User'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{user.email}</span>
                    {user.isDemo === 'Y' && (
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary-container bg-surface-container-low px-2 py-0.5 rounded-full font-medium">
                        <span className="material-symbols-outlined text-[12px] text-primary-container">verified</span>
                        Demo account
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="self-start sm:self-center">
                <span className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-md">ID: {user.id.slice(-8)}</span>
              </div>
            </div>
            <form className="flex flex-col gap-5" onSubmit={saveProfile}>
              {profileErr._ && <FieldError message={profileErr._} />}
              <div className="flex flex-col gap-1.5">
                <label className="font-label-md text-label-md text-on-surface font-medium flex items-center justify-between" htmlFor="full-name">Nickname</label>
                <input readOnly value={user.name} className={`${input} text-on-surface-variant cursor-not-allowed`} id="full-name" type="text" />
                <p className="font-body-sm text-body-sm text-on-surface-variant">Your nickname is your login and is shown on shared notes and posts. It can't be changed.</p>
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface font-medium" htmlFor="bio-text">Bio</label>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">{bio.length} / 200</span>
                </div>
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full p-3 rounded-lg bg-surface-container-low text-on-surface font-body-md text-body-md outline-none focus:bg-surface-container-lowest transition-colors resize-none leading-relaxed" id="bio-text" maxLength="200" rows="3"></textarea>
                <FieldError message={profileErr.bio} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface font-medium">
                    Interests <span className="text-on-surface-variant font-normal">(topics you follow or write about)</span>
                  </label>
                  <span className="font-code-sm text-code-sm text-on-surface-variant">{interests.length} / 10</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 p-2 bg-surface-container-low rounded-lg min-h-[44px]">
                  {interests.map((i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container-lowest text-on-surface rounded-lg font-label-md text-label-md shadow-sm transition-all hover:bg-surface-container">
                      <span className="text-primary-container font-semibold">#</span>{i}
                      <button onClick={() => setInterests(interests.filter((x) => x !== i))} aria-label={`Remove ${i}`} className="text-on-surface-variant hover:text-error transition-colors flex items-center" type="button">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </span>
                  ))}
                  {interests.length < 10 && (
                    <div className="relative flex items-center">
                      <input value={chip} onChange={(e) => setChip(e.target.value)} onBlur={addChip} onKeyDown={(e) => (e.key === 'Enter' || e.key === ',') && (e.preventDefault(), addChip())} className="h-7 px-2 bg-transparent text-on-surface font-body-sm text-body-sm outline-none placeholder:text-on-surface-variant w-28 focus:w-36 transition-all" id="interest-input" placeholder="+ Add interest" type="text" />
                    </div>
                  )}
                </div>
                <FieldError message={profileErr.interests || Object.entries(profileErr).find(([k]) => k.startsWith('interests.'))?.[1]} />
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 mt-2">
                <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Last updated {timeAgo(user.updatedAt)}</span>
                </div>
                <button disabled={saving} className="w-full sm:w-auto px-5 h-9 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md font-medium hover:bg-primary transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60" type="submit">
                  <span className={`material-symbols-outlined text-[18px] ${saving ? 'animate-spin' : ''}`}>{saving ? 'progress_activity' : 'check'}</span>
                  <span>Save changes</span>
                </button>
              </div>
            </form>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Change Password</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Ensure your account is using a long, random password to stay secure.</p>
            </div>
            <form className="flex flex-col gap-4" onSubmit={savePassword}>
              {pwdErr._ && <FieldError message={pwdErr._} />}
              <PasswordField id="current-pwd" label="Current password" autoComplete="current-password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })} error={pwdErr.currentPassword} />
              <div className="flex flex-col gap-1.5">
                <PasswordField id="new-pwd" label="New password" autoComplete="new-password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })} error={pwdErr.newPassword} />
                <div className="mt-1 flex flex-col gap-1.5">
                  <div className="grid grid-cols-4 gap-1.5 w-full h-1.5">
                    {[1, 2, 3, 4].map((i) => <div key={i} className={`${i <= level ? 'bg-primary-container' : 'bg-surface-container-highest'} rounded-full h-full`}></div>)}
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                    <span className="text-primary-container font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">shield</span>
                      Strength: {level ? LEVELS[level - 1] : '—'}
                    </span>
                    <span>min. 8 chars, 1 letter, 1 number</span>
                  </div>
                </div>
              </div>
              <PasswordField id="confirm-pwd" label="Confirm new password" autoComplete="new-password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} error={pwdErr.confirm} />
              <div className="flex items-center justify-end pt-3">
                <button disabled={pwdBusy} className="w-full sm:w-auto px-5 h-9 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md font-semibold hover:bg-surface-container-high transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95 disabled:opacity-60" type="submit">
                  <span className={`material-symbols-outlined text-[18px] ${pwdBusy ? 'animate-spin' : ''}`}>{pwdBusy ? 'progress_activity' : 'lock_reset'}</span>
                  <span>Update password</span>
                </button>
              </div>
            </form>
          </section>

          <section className="bg-surface-container-lowest rounded-xl p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="font-headline-md text-headline-md text-on-surface font-semibold">Workspace Activity</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">Overview of your personal and collaborative footprint in Ruhan's Notes.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cards.map(([icon, color, tag, value, label]) => (
                <div key={label} className="bg-surface-container-low rounded-lg p-4 flex flex-col justify-between transition-transform hover:-translate-y-0.5">
                  <div className="flex items-center justify-between text-on-surface-variant mb-2">
                    <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
                    <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-lowest text-on-surface-variant font-mono">{tag}</span>
                  </div>
                  <div>
                    <p className="font-headline-xl text-headline-xl font-bold text-on-surface leading-none tracking-tight">{value ?? '–'}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant mt-1.5 font-medium">{label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-surface-container-low rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[18px]">query_stats</span>
                </div>
                <div>
                  <p className="font-label-md text-label-md text-on-surface font-medium">Contribution Total</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{s ? `${s.notes + s.posts} notes and posts written, ${s.sharedByMe} shared` : 'Loading…'}</p>
                </div>
              </div>
              <div className="w-24 h-6 hidden sm:block">
                <svg className="w-full h-full text-primary-container" fill="none" stroke="currentColor" viewBox="0 0 100 24">
                  <path d="M0 20 L20 16 L40 18 L60 8 L80 12 L100 3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" />
                </svg>
              </div>
            </div>
            <div className="h-px bg-surface-container my-5"></div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="font-body-md text-body-md text-on-surface-variant">Looking for how colleagues see your profile?</p>
              <Link className="inline-flex items-center gap-1.5 text-primary-container font-label-md text-label-md font-semibold hover:text-primary transition-colors group" to={`/users/${user.id}`}>
                <span>View my public profile</span>
                <span className="material-symbols-outlined text-[16px] transition-transform group-hover:translate-x-0.5">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
