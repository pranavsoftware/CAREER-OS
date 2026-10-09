/**
 * StatCard: displays a label + value metric card.
 */
export default function StatCard({ label, value, sub }) {
  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #E5E7EB',
        borderRadius: 6,
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: '#111827', lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}
