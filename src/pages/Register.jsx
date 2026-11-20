import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import ChipInput from '../ChipInput.jsx';
import Brand from '../Brand.jsx';

export const strength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Za-z]/.test(p) && /\d/.test(p)) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p) || p.length >= 14) s++;
  return p ? Math.max(1, s) : 0;
};
export const LEVELS = ['Weak', 'Fair', 'Good', 'Strong'];

export function StrengthMeter({ password }) {
  const s = strength(password);
  return (
    <div className="flex flex-col gap-1.5 mt-1">
      <div className="grid grid-cols-4 gap-1.5 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 rounded-full ${i <= s ? 'bg-primary-container' : 'bg-surface-container-highest'}`}></div>
        ))}
      </div>
      <div className="flex justify-between font-label-sm text-label-sm text-outline px-0.5">
        {LEVELS.map((l, i) => (
          <span key={l} className={s === i + 1 ? 'text-primary font-medium' : ''}>{l}</span>
        ))}
      </div>
    </div>
  );
}

export function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-error mt-0.5">
      <span className="material-symbols-outlined text-[15px]">error</span>
      <span className="font-body-sm text-body-sm">{message}</span>
    </div>
  );
}

const inputBase = 'w-full h-9 px-space-md rounded-lg font-body-md text-body-md focus:outline-none transition-colors';
export const inputCls = (err) => `${inputBase} ${err ? 'bg-error-container/30 text-error' : 'bg-surface-container-lowest text-on-surface placeholder:text-outline focus:bg-surface-container-low'}`;

export default function Register() {
  const { user, signIn } = useAuth();
  const [form, setForm] = useState({ name: '', password: '', confirm: '', interests: [] });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [banner, setBanner] = useState('');
  const navigate = useNavigate();
  const [open, setOpen] = useState(null);
  useEffect(() => {
    api('/auth/config').then((c) => setOpen(Boolean(c.registration))).catch(() => setOpen(false));
  }, []);
  if (user) return <Navigate to="/home" replace />;
  if (open === false) return <Navigate to="/login" replace />;

  const nick = form.name.trim().toLowerCase();
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!/^[a-z0-9._-]{3,30}$/.test(nick)) errs.name = 'Nickname must be 3–30 characters: letters, numbers, . _ -';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) errs.password = 'At least 8 characters with a letter and a number';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    setBanner('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const r = await api('/auth/register', { method: 'POST', body: { name: nick, password: form.password, interests: form.interests } });
      signIn(r.token, r.user);
      navigate('/home', { replace: true });
    } catch (err) {
      setErrors(err.fields || {});
      if (!Object.keys(err.fields || {}).length) setBanner(err.message);
    } finally {
      setBusy(false);
    }
  };

  const level = strength(form.password);

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center p-gutter">
      <main className="w-full max-w-md mx-auto">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-[480px] mx-auto bg-surface-container-lowest rounded-xl shadow-sm p-space-xl flex flex-col">
            <div className="flex flex-col items-center text-center">
              <div className="flex items-center gap-space-sm mb-space-sm">
                <Brand text="text-[22px]" />
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Create your account</h1>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">Start taking private, collaborative notes in seconds</p>
            </div>
            {banner && (
              <div className="mt-space-lg p-space-md rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-error">error</span>
                <span className="font-body-sm text-body-sm">{banner}</span>
              </div>
            )}
            <form className="flex flex-col gap-space-lg mt-space-xl" onSubmit={submit} noValidate>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="fullName">Nickname</label>
                <div className="relative flex items-center">
                  <input value={form.name} onChange={set('name')} autoComplete="username" className={inputCls(errors.name)} id="fullName" placeholder="e.g. karim" type="text" />
                </div>
                <FieldError message={errors.name} />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email</label>
                <div className="relative flex items-center">
                  <input readOnly value={nick ? `${nick}@ruhan.lol` : ''} className={`${inputCls()} text-on-surface-variant`} id="email" type="text" />
                </div>
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                  {level > 0 && <span className="font-code-sm text-code-sm text-primary font-medium">strength: {LEVELS[level - 1]}</span>}
                </div>
                <div className="relative flex items-center">
                  <input value={form.password} onChange={set('password')} autoComplete="new-password" className={`${inputCls(errors.password)} pr-10`} id="password" type={show ? 'text' : 'password'} />
                  <button onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility" className="absolute right-2.5 p-1 rounded hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors" type="button">
                    <span className="material-symbols-outlined text-[18px]">{show ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
                <StrengthMeter password={form.password} />
                <FieldError message={errors.password} />
              </div>
              <div className="flex flex-col gap-space-xs">
                <label className="font-label-md text-label-md text-on-surface" htmlFor="confirmPassword">Confirm password</label>
                <div className="relative flex items-center">
                  <input value={form.confirm} onChange={set('confirm')} autoComplete="new-password" className={inputCls(errors.confirm)} id="confirmPassword" type="password" />
                </div>
                <FieldError message={errors.confirm} />
              </div>
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <label className="font-label-md text-label-md text-on-surface">
                    Interests <span className="text-on-surface-variant font-normal">(optional)</span>
                  </label>
                  <span className="font-label-sm text-label-sm text-outline">max 10 chips</span>
                </div>
                <ChipInput value={form.interests} onChange={(interests) => setForm((f) => ({ ...f, interests }))} />
                <FieldError message={errors.interests} />
              </div>
              <button disabled={busy} className="w-full h-10 mt-space-sm bg-primary-container hover:bg-primary active:bg-on-primary-fixed-variant text-on-primary font-headline-sm text-headline-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-70" type="submit">
                <span>{busy ? 'Creating…' : 'Create account'}</span>
                <span className={`material-symbols-outlined text-[18px] ${busy ? 'animate-spin' : ''}`}>{busy ? 'progress_activity' : 'arrow_forward'}</span>
              </button>
            </form>
            <div className="flex items-center justify-center gap-1.5 mt-space-xl pt-space-md text-center">
              <span className="font-body-md text-body-md text-on-surface-variant">Already have an account?</span>
              <Link className="font-headline-sm text-body-md text-primary hover:underline transition-all" to="/login">Sign in</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
