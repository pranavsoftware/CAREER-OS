'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  student: '/student/dashboard',
  university: '/university/dashboard',
  company: '/company/dashboard',
};

/**
 * ProtectedRoute — works on iOS Safari & PWA.
 *
 * Uses next/navigation router directly (no react-router-dom shim)
 * to avoid hydration mismatch on mobile / iOS WebKit.
 *
 * Shows nothing during SSR hydration to prevent flash of wrong content.
 */
export default function ProtectedRoute({ children, allowedRole }) {
  const { isAuthenticated, user, isLoaded } = useAuth();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Wait for auth to fully hydrate from localStorage before deciding
    if (!isLoaded) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (allowedRole && user?.role !== allowedRole) {
      const dest = ROLE_DASHBOARDS[user?.role] || '/login';
      router.replace(dest);
      return;
    }

    setReady(true);
  }, [isLoaded, isAuthenticated, user, allowedRole, router]);

  // Prevent flash / hydration mismatch on iOS
  if (!ready) {
    return null;
  }

  return children;
}
