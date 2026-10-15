import React from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

/**
 * Notice banner component replacing alert() popups.
 * Tones: 'info' | 'warn' | 'error'
 */
export default function Notice({ notice, onClose }) {
  if (!notice) return null;
  const { tone = 'info', text, action, secondaryAction } = notice;

  const toneStyles = {
    info: {
      bg: 'rgba(59, 130, 246, 0.12)',
      border: 'rgba(59, 130, 246, 0.35)',
      color: '#93C5FD',
      iconColor: '#60A5FA',
      Icon: Info,
    },
    warn: {
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      color: '#FCD34D',
      iconColor: '#F59E0B',
      Icon: AlertTriangle,
    },
    error: {
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      color: '#FCA5A5',
      iconColor: '#EF4444',
      Icon: AlertTriangle,
    },
  };

  const currentStyle = toneStyles[tone] || toneStyles.info;
  const ToneIcon = currentStyle.Icon;

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: currentStyle.bg,
        border: `1px solid ${currentStyle.border}`,
        color: currentStyle.color,
        fontSize: 13,
        lineHeight: 1.45,
        margin: '10px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 200 }}>
        <ToneIcon size={16} color={currentStyle.iconColor} style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 500 }}>{text}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            style={{
              background: tone === 'error' ? '#DC2626' : '#4F46E5',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
          >
            {action.label}
          </button>
        )}
        {secondaryAction && (
          <button
            type="button"
            onClick={secondaryAction.onClick}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#E2E8F0',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              padding: '5px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {secondaryAction.label}
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: currentStyle.color,
              padding: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0.8,
            }}
            aria-label="Dismiss notice"
          >
            <X size={15} />
          </button>
        )}
      </div>
    </div>
  );
}
