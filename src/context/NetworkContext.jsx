'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';

const NetworkContext = createContext(null);
const PENDING_MUTATIONS_KEY = 'career_os_pending_mutations';

function getNetworkInfo() {
  if (typeof window === 'undefined') {
    return {
      isOnline: true,
      networkType: 'unknown',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      qualityTier: 'high',
      isSlowConnection: false,
    };
  }

  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const isOnline = navigator.onLine;

  const effectiveType = conn?.effectiveType || '4g';
  const downlink = typeof conn?.downlink === 'number' ? conn.downlink : 10;
  const rtt = typeof conn?.rtt === 'number' ? conn.rtt : 50;
  const saveData = Boolean(conn?.saveData);
  const networkType = conn?.type || (conn?.effectiveType ? 'cellular' : 'wifi');

  // Determine network tier
  let qualityTier = 'high';
  if (!isOnline) {
    qualityTier = 'offline';
  } else if (effectiveType === 'slow-2g' || effectiveType === '2g' || (downlink > 0 && downlink < 0.8) || rtt > 500) {
    qualityTier = 'low';
  } else if (effectiveType === '3g' || (downlink > 0 && downlink < 2.5) || rtt > 250 || saveData) {
    qualityTier = 'medium';
  }

  const isSlowConnection = qualityTier === 'low' || (qualityTier === 'medium' && saveData);

  return {
    isOnline,
    networkType,
    effectiveType,
    downlink,
    rtt,
    saveData,
    qualityTier,
    isSlowConnection,
  };
}

export function NetworkProvider({ children }) {
  const [networkState, setNetworkState] = useState(getNetworkInfo);
  const [reconnected, setReconnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const reconnectedTimeoutRef = useRef(null);

  // Sync pending mutations count
  const updatePendingCount = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(PENDING_MUTATIONS_KEY);
      const queue = stored ? JSON.parse(stored) : [];
      setPendingCount(queue.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  // Flush queued mutations when back online
  const flushPendingMutations = useCallback(async () => {
    if (typeof window === 'undefined' || !navigator.onLine) return;
    try {
      const stored = localStorage.getItem(PENDING_MUTATIONS_KEY);
      if (!stored) return;
      const queue = JSON.parse(stored);
      if (!Array.isArray(queue) || queue.length === 0) return;

      console.log(`[NetworkSync] Syncing ${queue.length} pending mutations over ${networkState.networkType}...`);
      const remaining = [];

      for (const item of queue) {
        try {
          const res = await fetch(item.url, {
            method: item.method || 'POST',
            headers: item.headers || { 'Content-Type': 'application/json' },
            body: item.body,
          });
          if (!res.ok) {
            remaining.push(item);
          }
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(remaining));
      } else {
        localStorage.removeItem(PENDING_MUTATIONS_KEY);
      }
      setPendingCount(remaining.length);
    } catch (err) {
      console.warn('[NetworkSync] Error processing queue:', err);
    }
  }, [networkState.networkType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updatePendingCount();

    const handleOnline = () => {
      setNetworkState(getNetworkInfo());
      setReconnected(true);
      if (reconnectedTimeoutRef.current) clearTimeout(reconnectedTimeoutRef.current);
      reconnectedTimeoutRef.current = setTimeout(() => {
        setReconnected(false);
      }, 4000);

      // Attempt to flush offline actions
      flushPendingMutations();
    };

    const handleOffline = () => {
      setNetworkState(getNetworkInfo());
      setReconnected(false);
    };

    const handleConnectionChange = () => {
      setNetworkState(getNetworkInfo());
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn) {
      conn.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (conn) {
        conn.removeEventListener('change', handleConnectionChange);
      }
      if (reconnectedTimeoutRef.current) {
        clearTimeout(reconnectedTimeoutRef.current);
      }
    };
  }, [flushPendingMutations, updatePendingCount]);

  /**
   * Resilient fetch that adapts to network speed, retries on packet drops,
   * and queues mutations to localStorage when offline.
   */
  const robustFetch = useCallback(
    async (url, options = {}) => {
      const {
        method = 'GET',
        headers = {},
        body,
        retries = method === 'GET' ? 3 : 1,
        timeoutMs = networkState.isSlowConnection ? 20000 : 10000,
        queueIfOffline = method !== 'GET',
      } = options;

      // Handle offline mutation queue
      if (!navigator.onLine && queueIfOffline) {
        try {
          const stored = localStorage.getItem(PENDING_MUTATIONS_KEY);
          const queue = stored ? JSON.parse(stored) : [];
          queue.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url,
            method,
            headers,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            timestamp: Date.now(),
          });
          localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(queue));
          updatePendingCount();
          return { ok: true, queued: true, status: 202, json: async () => ({ queued: true }) };
        } catch (e) {
          console.warn('Failed to queue offline mutation:', e);
        }
      }

      let attempt = 0;
      let lastError = null;

      while (attempt <= retries) {
        attempt++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const res = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (res.ok || (res.status >= 400 && res.status < 500)) {
            // Client error or success - do not retry
            return res;
          }
          // Server error (5xx)
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
        } catch (err) {
          clearTimeout(timeoutId);
          lastError = err;
        }

        // Wait with exponential backoff + jitter before retrying
        if (attempt <= retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1) + Math.random() * 500, 6000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }

      // If mutation failed after all retries and can be queued
      if (queueIfOffline && method !== 'GET') {
        try {
          const stored = localStorage.getItem(PENDING_MUTATIONS_KEY);
          const queue = stored ? JSON.parse(stored) : [];
          queue.push({
            id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            url,
            method,
            headers,
            body: typeof body === 'string' ? body : JSON.stringify(body),
            timestamp: Date.now(),
          });
          localStorage.setItem(PENDING_MUTATIONS_KEY, JSON.stringify(queue));
          updatePendingCount();
          return { ok: true, queued: true, status: 202, json: async () => ({ queued: true }) };
        } catch (_) {}
      }

      throw lastError || new Error(`Network request to ${url} failed`);
    },
    [networkState.isSlowConnection, updatePendingCount]
  );

  return (
    <NetworkContext.Provider
      value={{
        ...networkState,
        reconnected,
        pendingCount,
        robustFetch,
        flushPendingMutations,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const ctx = useContext(NetworkContext);
  if (!ctx) {
    return {
      isOnline: true,
      networkType: 'unknown',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      qualityTier: 'high',
      isSlowConnection: false,
      reconnected: false,
      pendingCount: 0,
      robustFetch: fetch,
      flushPendingMutations: async () => {},
    };
  }
  return ctx;
}
