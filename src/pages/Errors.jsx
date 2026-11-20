import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import Brand from '../Brand.jsx';

function Frame({ active, children, standalone }) {
  const tab = (on) => `flex items-center gap-space-xs px-space-md py-1.5 rounded-full font-label-md text-label-md transition-all duration-200 ${on ? 'bg-surface-container-lowest text-primary font-semibold shadow-sm' : 'text-on-surface-variant'}`;
  return (
    <div className={standalone ? 'bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen' : 'flex flex-col w-full'}>
      <div className={`relative w-full overflow-hidden py-space-xl px-gutter md:px-gutter-desktop ${standalone ? 'min-h-screen' : 'min-h-[calc(100vh-64px)]'} flex flex-col justify-between items-center`}>
        <div className="w-full max-w-[1120px] flex flex-col sm:flex-row items-center justify-between gap-space-md mb-space-lg">
          {standalone ? (
            <Brand />
          ) : (
            <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
              <span className="w-2 h-2 rounded-full bg-outline-variant"></span>
              <span className="font-code-sm text-code-sm uppercase tracking-wider text-outline">HTTP Exception Resolver</span>
            </div>
          )}
          <div className="p-1 bg-surface-container rounded-full flex items-center shadow-sm">
            <span className={tab(active === 403)}>
              <span className="material-symbols-outlined text-[16px] text-tertiary">lock</span>
              <span>403 Forbidden</span>
            </span>
            <span className={tab(active === 401)}>
              <span className="material-symbols-outlined text-[16px] text-primary-container">schedule</span>
              <span>401 Session Expired</span>
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-space-xs font-code-sm text-code-sm text-on-surface-variant bg-surface-container-low px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse"></span>
            <span>Gateway active</span>
          </div>
        </div>
        <div className="w-full max-w-[640px] my-auto flex flex-col items-center">{children}</div>
        <div />
      </div>
    </div>
  );
}

function Row({ k, v, cls = 'text-on-surface' }) {
  return (
    <div className="flex justify-between items-center gap-space-md font-code-sm text-code-sm">
      <span className="text-outline">{k}</span>
      <span className={`font-medium truncate ${cls}`}>{v}</span>
    </div>
  );
}

export function Forbidden({ message }) {
  const location = useLocation();
  const { user } = useAuth();
  return (
    <Frame active={403}>
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary"></div>
        <div className="flex items-center justify-between mb-space-lg">
          <div className="w-12 h-12 rounded-xl bg-tertiary-fixed flex items-center justify-center text-on-tertiary-fixed shadow-sm">
            <span className="material-symbols-outlined text-[24px]">lock</span>
          </div>
          <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-tertiary bg-tertiary-fixed/50 px-space-sm py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            <span>ERR_FORBIDDEN_403</span>
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mb-space-xs">Access Denied</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-lg leading-relaxed">{message || "You don't have permission to view this note or administration module."}</p>
        <div className="w-full bg-surface-container-low rounded-lg p-space-md mb-space-lg flex flex-col gap-space-sm">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-tertiary mt-0.5 shrink-0">admin_panel_settings</span>
            <div className="flex flex-col gap-1 min-w-0 w-full">
              <span className="font-label-md text-label-md text-on-surface font-semibold">Restricted Access Level</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">Editing a note needs owner or "Can edit" access. Admin pages need the Admin role.</p>
              <div className="mt-space-xs pt-space-xs bg-surface-container-lowest rounded p-space-sm flex flex-col gap-1 text-on-surface-variant">
                <Row k="TARGET_RESOURCE" v={location.pathname} />
                <Row k="REQUIRED_ROLE" v={location.pathname.startsWith('/admin') ? 'ADMIN' : 'OWNER / CAN_EDIT'} />
                <Row k="YOUR_ROLE" v={(user?.role || 'guest').toUpperCase()} />
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-space-sm pt-space-xs">
          <Link className="w-full sm:w-auto flex-1 flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all duration-150 shadow-sm" to="/home">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Go to My Notes</span>
          </Link>
          <Link className="w-full sm:w-auto flex-1 flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-surface-container-high text-on-surface font-label-md text-label-md hover:bg-surface-variant transition-all duration-150" to="/home?tab=shared">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">group</span>
            <span>Notes shared with me</span>
          </Link>
        </div>
      </div>
      <div className="mt-space-md flex items-center justify-center gap-space-md text-center flex-wrap">
        <span className="font-body-sm text-body-sm text-on-surface-variant">Think this is a mistake?</span>
        <span className="font-label-md text-label-md text-primary-container">Ask the note owner or an admin</span>
      </div>
    </Frame>
  );
}

export function SessionExpired() {
  const { user } = useAuth();
  return (
    <Frame active={401} standalone>
      <div className="w-full bg-surface-container-lowest rounded-xl p-space-lg sm:p-space-xl shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary-container"></div>
        <div className="flex items-center justify-between mb-space-lg">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed flex items-center justify-center text-primary-container shadow-sm">
            <span className="material-symbols-outlined text-[24px]">timer_off</span>
          </div>
          <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-primary-container bg-primary-fixed/50 px-space-sm py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span>STATUS: 401_UNAUTHORIZED</span>
          </div>
        </div>
        <h1 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight mb-space-xs">Your session has expired</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-space-lg leading-relaxed">For your security, your sign-in token expired or was revoked. Please sign in again.</p>
        <div className="w-full bg-surface-container-low rounded-lg p-space-md mb-space-lg flex flex-col gap-space-sm">
          <div className="flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-[20px] text-primary-container mt-0.5 shrink-0">verified_user</span>
            <div className="flex flex-col gap-1 min-w-0 w-full">
              <span className="font-label-md text-label-md text-on-surface font-semibold">JWT session hygiene in effect</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">Tokens last one day. Disabled or deleted accounts are signed out immediately on their next request.</p>
              <div className="mt-space-xs pt-space-xs bg-surface-container-lowest rounded p-space-sm flex flex-col gap-1">
                <Row k="TOKEN_STATUS" v="EXPIRED / REVOKED" cls="text-error" />
                <Row k="LOCAL_TOKEN" v={user ? 'PRESENT' : 'CLEARED'} />
              </div>
            </div>
          </div>
        </div>
        <Link className="w-full flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md hover:bg-primary transition-all duration-150 shadow-sm" to="/login">
          <span className="material-symbols-outlined text-[18px]">login</span>
          <span>Sign in again</span>
        </Link>
      </div>
    </Frame>
  );
}
