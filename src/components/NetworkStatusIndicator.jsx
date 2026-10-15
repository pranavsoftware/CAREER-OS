'use client';

import React, { useState } from 'react';
import { Wifi, WifiOff, RefreshCw, Signal, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNetwork } from '../context/NetworkContext';

export function NetworkBadge() {
  const { isOnline, networkType, effectiveType, downlink, isSlowConnection } = useNetwork();

  if (!isOnline) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm"
        title="No internet connection. Using cached data."
      >
        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <WifiOff size={12} />
        <span>Offline</span>
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200"
        title={`Mobile / Slow Connection (${effectiveType.toUpperCase()}) - Low bandwidth mode active`}
      >
        <Signal size={12} className="text-amber-600" />
        <span>{effectiveType.toUpperCase()} Mobile</span>
      </div>
    );
  }

  // Fast connection (Wi-Fi or 4G/5G)
  const isWifi = networkType === 'wifi' || networkType === 'ethernet';
  return (
    <div
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200"
      title={`Connected via ${isWifi ? 'Wi-Fi / LAN' : '4G / 5G Cellular'} (~${downlink} Mbps)`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
      {isWifi ? <Wifi size={12} /> : <Signal size={12} />}
      <span>{isWifi ? 'Wi-Fi' : 'Fast Cellular'}</span>
    </div>
  );
}

export default function NetworkStatusIndicator() {
  const {
    isOnline,
    networkType,
    effectiveType,
    qualityTier,
    isSlowConnection,
    reconnected,
    pendingCount,
    flushPendingMutations,
  } = useNetwork();

  const [dismissedSlowAlert, setDismissedSlowAlert] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    setSyncing(true);
    await flushPendingMutations();
    setTimeout(() => setSyncing(false), 600);
  };

  // Reconnected Toast Banner
  if (reconnected) {
    return (
      <div className="w-full bg-emerald-600 text-white text-xs md:text-sm py-2 px-4 shadow-md flex items-center justify-between transition-all duration-300 z-50">
        <div className="flex items-center gap-2 max-w-5xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-100 flex-shrink-0" />
            <span>
              <strong>Network Restored:</strong> You are back online on{' '}
              {networkType === 'wifi' ? 'Wi-Fi' : `${effectiveType.toUpperCase()} mobile data`}. Synced all offline changes.
            </span>
          </div>
          {pendingCount > 0 && (
            <span className="bg-emerald-700 text-emerald-100 px-2 py-0.5 rounded text-xs">
              {pendingCount} synced
            </span>
          )}
        </div>
      </div>
    );
  }

  // Offline Notification Banner
  if (!isOnline) {
    return (
      <div className="w-full bg-rose-600 text-white text-xs md:text-sm py-2.5 px-4 shadow-lg flex items-center justify-between z-50">
        <div className="flex items-center gap-3 max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <WifiOff size={18} className="text-rose-200 flex-shrink-0 animate-pulse" />
            <div>
              <span className="font-bold">Offline Mode Active:</span>{' '}
              <span>
                Working seamlessly from local cache. Any updates or changes you make are safely queued and will auto-sync when you reconnect to Wi-Fi or mobile network.
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {pendingCount > 0 && (
              <span className="bg-rose-700/80 text-rose-100 px-2.5 py-1 rounded text-xs font-semibold">
                {pendingCount} action{pendingCount > 1 ? 's' : ''} queued
              </span>
            )}
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="bg-white text-rose-700 hover:bg-rose-50 px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 shadow-sm"
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Slow Mobile / 2G / 3G Low-Bandwidth Mode Notice
  if (isSlowConnection && !dismissedSlowAlert) {
    return (
      <div className="w-full bg-amber-500 text-amber-950 text-xs md:text-sm py-2 px-4 shadow-sm flex items-center justify-between z-40 border-b border-amber-600/20">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={15} className="text-amber-900 flex-shrink-0" />
            <span>
              <strong>Mobile / Low-Bandwidth Network ({effectiveType.toUpperCase()}):</strong> Career-OS has automatically enabled adaptive data compression and low-bitrate mode for video and AI interview.
            </span>
          </div>
          <button
            onClick={() => setDismissedSlowAlert(true)}
            className="text-amber-900 hover:text-black font-semibold text-xs ml-3 underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return null;
}
