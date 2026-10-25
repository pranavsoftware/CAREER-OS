'use client';

import { createContext, useContext, useReducer, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const STORAGE_KEY = 'career_os_auth';

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false };
    default:
      return state;
  }
}

function getInitialState() {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.user) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, { user: null, isAuthenticated: false });
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore stored user from localStorage on mount
  useEffect(() => {
    let isMounted = true;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user) {
          dispatch({ type: 'LOGIN', payload: parsed.user });
        }
      }
    } catch (e) {
      // ignore
    }

    // Fetch demo users from database
    fetch('/api/auth/users')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (isMounted && data.users) {
          setAvailableUsers(data.users);
        }
      })
      .catch(err => {
        console.warn('Auth users load warning:', err.message || err);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Persist auth state to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, isLoaded]);

  async function login(email, password, role) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Invalid credentials' };
      }
      dispatch({ type: 'LOGIN', payload: data.user });
      return { success: true, user: data.user };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'Failed to connect to authentication server.' };
    }
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (_) {}
    }
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout, availableUsers, isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
