import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth.jsx';
import Shell from './Shell.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import NoteEditor from './pages/NoteEditor.jsx';
import NoteView from './pages/NoteView.jsx';
import Posts from './pages/Posts.jsx';
import UserProfile from './pages/UserProfile.jsx';
import Interests from './pages/Interests.jsx';
import Profile from './pages/Profile.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminNotes from './pages/AdminNotes.jsx';
import DbInsights from './pages/DbInsights.jsx';
import NotFound from './pages/NotFound.jsx';
import { Forbidden, SessionExpired } from './pages/Errors.jsx';

function Private({ admin, children }) {
  const { user, ready, isAdmin } = useAuth();
  const location = useLocation();
  if (!ready) return <div className="min-h-screen bg-surface" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (admin && !isAdmin) return <Forbidden />;
  return children;
}

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const on = (e) => {
      const id = Math.random().toString(36).slice(2);
      setItems((l) => [...l, { id, ...e.detail }]);
      setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 4000);
    };
    window.addEventListener('rn:toast', on);
    return () => window.removeEventListener('rn:toast', on);
  }, []);
  return (
    <div className="fixed z-[70] bottom-4 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-4 flex flex-col gap-space-sm w-[calc(100%-2rem)] sm:w-auto">
      {items.map((t) => (
        <div key={t.id} className="flex items-center gap-space-sm px-space-md py-space-sm rounded-lg bg-inverse-surface text-inverse-on-surface shadow-[0_8px_24px_rgba(0,0,0,0.12)] font-body-sm text-body-sm">
          <span className={`material-symbols-outlined text-[18px] ${t.type === 'error' ? 'text-error' : 'text-primary-fixed-dim'}`}>{t.type === 'error' ? 'error' : 'check_circle'}</span>
          <span>{t.message}</span>
          <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="ml-auto opacity-70 hover:opacity-100" type="button">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route element={<Private><Shell /></Private>}>
          <Route path="/home" element={<Home />} />
          <Route path="/notes/new" element={<NoteEditor />} />
          <Route path="/notes/:id" element={<NoteView />} />
          <Route path="/notes/:id/edit" element={<NoteEditor />} />
          <Route path="/posts" element={<Posts />} />
          <Route path="/users/:id" element={<UserProfile />} />
          <Route path="/interests" element={<Interests />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/users" element={<Private admin><AdminUsers /></Private>} />
          <Route path="/admin/notes" element={<Private admin><AdminNotes /></Private>} />
          <Route path="/admin/db" element={<Private admin><DbInsights /></Private>} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toasts />
    </AuthProvider>
  );
}
