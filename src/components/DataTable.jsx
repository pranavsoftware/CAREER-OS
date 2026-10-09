/**
 * DataTable: reusable table component.
 * columns: [{ key, header, render?, width? }]
 * rows: array of objects
 * onRowClick?: function
 */
export default function DataTable({ columns, rows, onRowClick, emptyMessage = 'No data available.' }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ padding: '24px 0', color: '#9CA3AF', fontSize: 14 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, background: '#fff' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
            {columns.map(col => (
              <th
                key={col.key}
                style={{
                  padding: '10px 16px',
                  textAlign: 'left',
                  fontWeight: 500,
                  color: '#374151',
                  whiteSpace: 'nowrap',
                  width: col.width,
                  fontSize: 13,
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id || i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                borderBottom: i < rows.length - 1 ? '1px solid #F3F4F6' : 'none',
                cursor: onRowClick ? 'pointer' : 'default',
                background: '#fff',
              }}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background = '#F9FAFB'; }}
              onMouseLeave={e => { if (onRowClick) e.currentTarget.style.background = '#fff'; }}
            >
              {columns.map(col => (
                <td key={col.key} style={{ padding: '10px 16px', color: '#374151', verticalAlign: 'middle' }}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
