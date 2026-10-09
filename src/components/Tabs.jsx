/**
 * Tabs: simple tab switcher.
 * tabs: [{ id, label }]
 * active: current active tab id
 * onChange: function(id)
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 16, gap: 0 }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: active === tab.id ? '2px solid #2563EB' : '2px solid transparent',
            background: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: active === tab.id ? 600 : 400,
            color: active === tab.id ? '#2563EB' : '#6B7280',
            marginBottom: -1,
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
