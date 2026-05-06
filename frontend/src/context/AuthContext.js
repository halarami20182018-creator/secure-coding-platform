import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('session_token') || null);
  const [loading, setLoading] = useState(true);

  // On mount, verify existing token
  useEffect(() => {
    if (token) {
      getMe(token)
        .then(res => { if (res.data.user) setUser(res.data.user); })
        .catch(() => { localStorage.removeItem('session_token'); setToken(null); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);  // eslint-disable-line

  function signin(userData, sessionToken) {
    setUser(userData);
    setToken(sessionToken);
    localStorage.setItem('session_token', sessionToken);
  }

  function signout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem('session_token');
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, signin, signout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
