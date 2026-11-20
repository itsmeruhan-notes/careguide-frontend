import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import { initials } from './util.js';
import Brand from './Brand.jsx';

const active = 'transition-colors text-primary-container border-b-2 border-primary-container font-semibold pb-space-sm -mb-[2px] font-label-md text-label-md';
const idle = 'text-on-surface-variant hover:text-on-surface font-label-md text-label-md transition-colors';

export const toggleTheme = () => {
  const dark = document.documentElement.classList.toggle('dark');
  try {
    localStorage.setItem('rn-theme', dark ? 'dark' : 'light');
  } catch {
    return;
  }
};

export function Logo({ to = '/home' }) {
  return (
    <Link className="flex items-center gap-space-sm group" to={to}>
      <Brand />
    </Link>
  );
}

export default function Shell({ children }) {
  const { user, isAdmin, signOut } = useAuth();
  const [menu, setMenu] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const nav = ({ isActive }) => (isActive ? active : idle);
  const flip = () => {
    toggleTheme();
    setDark(document.documentElement.classList.contains('dark'));
  };

  return (
    <div className="bg-surface font-body-md text-body-md text-on-surface antialiased min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest border-b border-outline-variant/40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-[1120px] mx-auto px-gutter-desktop flex items-center justify-between">
          <div className="flex items-center gap-space-xl">
            <Logo />
            <nav className="hidden md:flex items-center gap-space-lg">
              <NavLink className={nav} to="/home">My Notes</NavLink>
              <NavLink className={nav} to="/posts">Posts</NavLink>
              <NavLink className={nav} to="/interests">Interests</NavLink>
              {isAdmin && (
                <div className="relative group">
                  <button className="flex items-center gap-space-xs text-secondary font-label-md text-label-md transition-colors hover:text-secondary-container" type="button">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    <span>Admin</span>
                    <span className="material-symbols-outlined text-[16px]">expand_more</span>
                  </button>
                  <div className="absolute left-0 pt-space-xs w-48 hidden group-hover:block group-focus-within:block">
                    <div className="py-space-xs bg-surface-container-lowest rounded-lg border border-outline-variant/50 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                      <Link className="block px-space-md py-space-xs font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" to="/admin/users">Users</Link>
                      <Link className="block px-space-md py-space-xs font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" to="/admin/notes">All Notes</Link>
                      <Link className="block px-space-md py-space-xs font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" to="/admin/db">DB Insights</Link>
                    </div>
                  </div>
                </div>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-space-md">
            <button aria-label="Toggle theme" onClick={flip} className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" type="button">
              <span className="material-symbols-outlined text-[20px]">{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button aria-label="Menu" onClick={() => setMenu((m) => !m)} className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low" type="button">
              <span className="material-symbols-outlined text-[20px]">{menu ? 'close' : 'menu'}</span>
            </button>
            <div className="relative group">
              <button className="flex items-center gap-space-xs p-1 rounded-full hover:bg-surface-container-low transition-colors" type="button">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-label-sm text-label-sm text-on-primary font-semibold">{initials(user?.name)}</div>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
              </button>
              <div className="absolute right-0 pt-space-xs w-60 hidden group-hover:block group-focus-within:block">
                <div className="py-space-xs bg-surface-container-lowest rounded-xl border border-outline-variant/50 shadow-[0_8px_24px_rgba(0,0,0,0.08)]">
                  <div className="px-space-md py-space-sm border-b border-outline-variant/30">
                    <div className="flex items-center justify-between mb-space-xs">
                      <p className="font-headline-sm text-headline-sm text-on-surface font-semibold">{user?.name}</p>
                      <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ${isAdmin ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-on-surface-variant'}`}>{isAdmin ? 'Admin' : 'User'}</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">{user?.email}</p>
                  </div>
                  <div className="py-space-xs">
                    <Link className="flex items-center gap-space-sm px-space-md py-space-xs font-body-md text-body-md text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface" to="/profile">
                      <span className="material-symbols-outlined text-[18px]">person</span>
                      <span>My Profile</span>
                    </Link>
                  </div>
                  <div className="border-t border-outline-variant/30 pt-space-xs">
                    <button onClick={signOut} className="w-full flex items-center gap-space-sm px-space-md py-space-xs font-body-md text-body-md text-error hover:bg-error-container/40" type="button">
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      <span>Log out</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {menu && (
          <nav onClick={() => setMenu(false)} className="md:hidden border-t border-outline-variant/30 bg-surface-container-lowest px-gutter py-space-sm flex flex-col gap-space-xs">
            <NavLink className={({ isActive }) => `px-space-sm py-space-sm rounded-lg font-label-md text-label-md ${isActive ? 'bg-surface-container-low text-primary-container' : 'text-on-surface-variant'}`} to="/home">My Notes</NavLink>
            <NavLink className={({ isActive }) => `px-space-sm py-space-sm rounded-lg font-label-md text-label-md ${isActive ? 'bg-surface-container-low text-primary-container' : 'text-on-surface-variant'}`} to="/posts">Posts</NavLink>
            <NavLink className={({ isActive }) => `px-space-sm py-space-sm rounded-lg font-label-md text-label-md ${isActive ? 'bg-surface-container-low text-primary-container' : 'text-on-surface-variant'}`} to="/interests">Interests</NavLink>
            {isAdmin && (
              <>
                <span className="px-space-sm pt-space-sm font-label-sm text-label-sm uppercase tracking-wider text-secondary">Admin</span>
                <NavLink className="px-space-sm py-space-sm rounded-lg font-label-md text-label-md text-on-surface-variant" to="/admin/users">Users</NavLink>
                <NavLink className="px-space-sm py-space-sm rounded-lg font-label-md text-label-md text-on-surface-variant" to="/admin/notes">All Notes</NavLink>
                <NavLink className="px-space-sm py-space-sm rounded-lg font-label-md text-label-md text-on-surface-variant" to="/admin/db">DB Insights</NavLink>
              </>
            )}
          </nav>
        )}
      </header>
      <main className="w-full pt-16 bg-surface min-h-[calc(100vh-64px)]">
        {children || <Outlet />}
      </main>
    </div>
  );
}
