import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(!tokenStore.get());
  const navigate = useNavigate();

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then((r) => setUser(r.user))
      .catch(() => tokenStore.set(''))
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    const onExpired = () => {
      tokenStore.set('');
      setUser(null);
      navigate('/session-expired');
    };
    window.addEventListener('rn:session-expired', onExpired);
    return () => window.removeEventListener('rn:session-expired', onExpired);
  }, [navigate]);

  const signIn = useCallback((token, u) => {
    tokenStore.set(token);
    setUser(u);
  }, []);

  const signOut = useCallback(() => {
    tokenStore.set('');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(() => ({ user, setUser, ready, signIn, signOut, isAdmin: user?.role === 'admin' }), [user, ready, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
