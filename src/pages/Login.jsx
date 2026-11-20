import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import Brand from '../Brand.jsx';

export default function Login() {
  const { user, signIn } = useAuth();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [health, setHealth] = useState(null);
  const [registration, setRegistration] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    api('/health').then(setHealth).catch(() => setHealth({ status: 'down' }));
    api('/auth/config').then((c) => setRegistration(Boolean(c.registration))).catch(() => setRegistration(false));
  }, []);

  if (user) return <Navigate to={location.state?.from || '/home'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) return setError('Email is required');
    if (!nickname.includes('@')) return setError('Enter your full email address');
    if (!password) return setError('Password is required');
    setBusy(true);
    try {
      const r = await api('/auth/login', { method: 'POST', body: { email: nickname.trim(), password } });
      signIn(r.token, r.user);
      navigate(location.state?.from || '/home', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };


  const up = health?.status === 'ok';

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex items-center justify-center p-gutter">
      <main className="w-full max-w-4xl mx-auto">
        <div className="flex flex-col w-full">
          <div className="w-full max-w-4xl mx-auto my-auto bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden flex flex-col md:flex-row">
            <div className="w-full md:w-5/12 bg-surface-container-low p-space-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-primary/5 blur-2xl pointer-events-none"></div>
              <div className="relative z-10 flex flex-col gap-space-lg">
                <div className="flex items-center gap-space-sm">
                  <Brand size="w-10 h-10" text="text-[22px]" />
                </div>
                <div className="flex flex-col gap-space-xs mt-space-sm">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-primary font-semibold">Workspace Security</span>
                  <p className="font-headline-sm text-headline-sm text-on-surface leading-snug">Your notes, private by default. Shared when you choose.</p>
                </div>
                <div className="flex flex-col gap-space-md mt-space-md">
                  {[
                    ['verified_user', 'Secure JWT authentication'],
                    ['share', 'Share read / edit access'],
                    ['history', 'Full change history'],
                  ].map(([icon, text]) => (
                    <div key={icon} className="flex items-center gap-space-sm bg-surface-container-lowest/80 p-space-sm rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      <span className="font-label-md text-label-md text-on-surface">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative z-10 mt-space-xl pt-space-md flex items-center justify-between">
                <span className="font-code-sm text-code-sm text-outline">v1.0.0-stable</span>
                <span className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-2 py-0.5 rounded-full ${up || !health ? 'text-primary bg-primary-fixed/60' : 'text-error bg-error-container'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${up || !health ? 'bg-primary' : 'bg-error'} animate-pulse`}></span> {health && !up ? 'API Offline' : 'Systems Active'}
                </span>
              </div>
            </div>
            <div className="w-full md:w-7/12 p-space-xl md:p-12 flex flex-col justify-center bg-surface-container-lowest">
              <div className="flex flex-col gap-space-xs mb-space-lg">
                <h1 className="font-headline-lg text-headline-lg text-on-surface">Welcome back</h1>
                <p className="font-body-md text-body-md text-on-surface-variant">Sign in to access your notes and collaboration workspace.</p>
              </div>
              {error && (
                <div className="mb-space-md p-space-md rounded-lg bg-error-container text-on-error-container flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-error">error</span>
                  <span className="font-body-sm text-body-sm">{error}</span>
                  <button onClick={() => setError('')} className="ml-auto text-on-error-container hover:opacity-75" type="button">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              )}
              <form className="flex flex-col gap-space-md" onSubmit={submit} noValidate>
                <div className="flex flex-col gap-1.5">
                  <label className="font-label-md text-label-md text-on-surface" htmlFor="email">Email address</label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">mail</span>
                    <input value={nickname} onChange={(e) => setNickname(e.target.value)} autoComplete="username" className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary shadow-sm" id="email" name="email" type="email" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="font-label-md text-label-md text-on-surface" htmlFor="password">Password</label>
                    <button onClick={() => setHint('Ask an admin to set a new password for you.')} className="font-label-sm text-label-sm text-primary hover:underline" type="button">Forgot password?</button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-outline text-[18px]">lock</span>
                    <input value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="w-full h-9 pl-9 pr-10 rounded-lg bg-surface-container-lowest text-on-surface font-body-md text-body-md outline-none focus:ring-2 focus:ring-primary shadow-sm" id="password" name="password" placeholder="••••••••" type={show ? 'text' : 'password'} />
                    <button onClick={() => setShow((s) => !s)} aria-label="Toggle password visibility" className="absolute right-3 flex items-center justify-center text-outline hover:text-on-surface transition-colors" type="button">
                      <span className="material-symbols-outlined text-[20px]">{show ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                  {hint && <span className="font-body-sm text-body-sm text-on-surface-variant">{hint}</span>}
                </div>
                <button disabled={busy} className="w-full h-9 mt-space-xs rounded-lg bg-primary-container text-on-primary font-label-md text-label-md flex items-center justify-center gap-space-xs hover:bg-primary transition-all duration-150 shadow-sm disabled:opacity-70" type="submit">
                  <span>{busy ? 'Signing in…' : 'Sign in'}</span>
                  <span className={`material-symbols-outlined text-[16px] ${busy ? 'animate-spin' : ''}`}>{busy ? 'progress_activity' : 'arrow_forward'}</span>
                </button>
              </form>
              {registration && (
              <div className="mt-space-md text-center">
                <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" to="/register">
                  Don't have an account? <span className="font-semibold text-primary">Register</span>
                </Link>
              </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
