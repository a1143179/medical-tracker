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

  const loginWithGoogle = (e, rememberMe = false) => {
    const loginUrl = `/api/auth/login?returnUrl=${encodeURIComponent(window.location.pathname)}&rememberMe=${rememberMe}`;
    console.log('Redirecting to login URL:', loginUrl);
    window.location.href = loginUrl;
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    window.location.href = '/';
  };

  const updatePreferredValueType = async (valueTypeId) => {
    try {
      const response = await fetch('/api/auth/preferred-value-type', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ preferredValueTypeId: valueTypeId })
      });

      if (response.ok) {
        // Update the user state with the new preferred value type
        setUser(prevUser => ({
          ...prevUser,
          preferredValueTypeId: valueTypeId
        }));
        return true;
      } else {
        console.error('Failed to update preferred value type');
        return false;
      }
    } catch (error) {
      console.error('Error updating preferred value type:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updatePreferredValueType }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
} 