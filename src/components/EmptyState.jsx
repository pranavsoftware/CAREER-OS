/**
 * EmptyState: single line gray empty state message.
 */
export default function EmptyState({ message }) {
  return (
    <div style={{ padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>
      {message}
    </div>
  );
}
