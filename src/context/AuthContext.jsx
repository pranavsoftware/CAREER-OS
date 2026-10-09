import { createContext, useContext, useReducer, useEffect } from 'react';
import { users } from '../data/users';

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
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate the stored user still exists
      if (parsed.user && users.find(u => u.id === parsed.user.id)) {
        return parsed;
      }
    }
  } catch (e) {
    // ignore
  }
  return { user: null, isAuthenticated: false };
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, getInitialState());

  // Persist auth state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  function login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const user = users.find(
      u => (u.email.toLowerCase() === cleanEmail || u.id.toLowerCase() === cleanEmail) && u.password === password
    );
    if (user) {
      // Don't store password in state
      const { password: _pw, ...safeUser } = user;
      dispatch({ type: 'LOGIN', payload: safeUser });
      return { success: true, user: safeUser };
    }
    return { success: false, error: 'Invalid User ID or password.' };
  }

  function logout() {
    dispatch({ type: 'LOGOUT' });
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
