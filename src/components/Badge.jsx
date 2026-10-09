/**
 * Badge: status indicator with color coding.
 * Variant: success | warning | danger | neutral | info
 */

const STYLES = {
  success: { background: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' },
  warning: { background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A' },
  danger: { background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FECACA' },
  neutral: { background: '#F9FAFB', color: '#374151', border: '1px solid #E5E7EB' },
  info: { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE' },
};

export function getBadgeVariant(status) {
  const s = (status || '').toLowerCase();
  if (['verified', 'valid', 'placed', 'open', 'approved', 'selected', 'offer', 'offer sent'].includes(s)) return 'success';
  if (['pending', 'partial', 'expiring soon', 'in process', 'upcoming', 'interview scheduled', 'online test', 'applied', 'shortlisted'].includes(s)) return 'warning';
  if (['rejected', 'expired', 'closed', 'failed'].includes(s)) return 'danger';
  if (['unplaced', 'missing'].includes(s)) return 'neutral';
  return 'info';
}

export default function Badge({ children, variant }) {
  const style = STYLES[variant] || STYLES.neutral;
  return (
    <span
      style={{
        ...style,
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}
