'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { DataProvider } from '@/context/DataContext';
import { NetworkProvider } from '@/context/NetworkContext';

export function Providers({ children }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        reg.update();
      }).catch((err) => {
        console.debug('ServiceWorker registration skipped:', err);
      });
    }
  }, []);

  return (
    <NetworkProvider>
      <AuthProvider>
        <DataProvider>
          {children}
        </DataProvider>
      </AuthProvider>
    </NetworkProvider>
  );
}
