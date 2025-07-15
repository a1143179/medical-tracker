import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (res.status === 401) {
          // Not logged in, handle gracefully
          return null;
        }
        if (!res.ok) {
          throw new Error('Network error');
        }
        return res.json();
      })
      .then(data => {
        setUser(data || null);
        setLoading(false);
      })
      .catch(err => {
        // Only log unexpected errors
        if (err.message !== 'Network error') {
          console.error(err);
        }
        setLoading(false);
      });
  }, []);

  const loginWithGoogle = async (e, rememberMe = false) => {
    const loginUrl = `/api/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}&rememberMe=${rememberMe}`;
    try {
      const response = await fetch(loginUrl, {
        method: 'GET',
        credentials: 'include',
        redirect: 'manual', // So we can handle the redirect ourselves
      });
      if (response.status === 302 || response.status === 301) {
        const location = response.headers.get('Location');
        if (location) {
          window.location.href = location;
        } else {
          // fallback: reload
          window.location.reload();
        }
      } else if (response.url && response.url !== window.location.href) {
        // Some browsers may follow the redirect automatically
        window.location.href = response.url;
      } else {
        // fallback: reload
        window.location.reload();
      }
    } catch (err) {
      window.location.href = loginUrl; // fallback to old behavior
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 