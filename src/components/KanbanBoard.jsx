import { useState } from 'react';

/**
 * KanbanBoard: reusable kanban with HTML5 drag and drop.
 * columns: [{ id, title }]
 * cards: { columnId: [{ id, ...data }] }
 * renderCard: (card, columnId) => ReactNode
 * onMove: (cardId, fromColumnId, toColumnId) => void
 */
export default function KanbanBoard({ columns, cards, renderCard, onMove }) {
  const [dragging, setDragging] = useState(null); // { cardId, fromColumnId }
  const [dragOver, setDragOver] = useState(null); // columnId

  function handleDragStart(e, cardId, fromColumnId) {
    setDragging({ cardId, fromColumnId });
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, columnId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(columnId);
  }

  function handleDrop(e, toColumnId) {
    e.preventDefault();
    if (dragging && dragging.fromColumnId !== toColumnId) {
      onMove(dragging.cardId, dragging.fromColumnId, toColumnId);
    }
    setDragging(null);
    setDragOver(null);
  }

  function handleDragEnd() {
    setDragging(null);
    setDragOver(null);
  }

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', alignItems: 'flex-start', paddingBottom: 8 }}>
      {columns.map(col => {
        const colCards = cards[col.id] || [];
        const isOver = dragOver === col.id;

        return (
          <div
            key={col.id}
            onDragOver={e => handleDragOver(e, col.id)}
            onDrop={e => handleDrop(e, col.id)}
            onDragLeave={() => setDragOver(null)}
            style={{
              flex: '0 0 220px',
              background: isOver ? '#EFF6FF' : '#F9FAFB',
              border: `1px solid ${isOver ? '#2563EB' : '#E5E7EB'}`,
              borderRadius: 6,
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Column header */}
            <div
              style={{
                padding: '10px 12px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{col.title}</span>
              <span
                style={{
                  background: '#E5E7EB',
                  color: '#6B7280',
                  borderRadius: 10,
                  padding: '1px 8px',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                {colCards.length}
              </span>
            </div>

            {/* Cards */}
            <div style={{ padding: 8, flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {colCards.map(card => (
                <div
                  key={card.id}
                  draggable
                  onDragStart={e => handleDragStart(e, card.id, col.id)}
                  onDragEnd={handleDragEnd}
                  style={{
                    opacity: dragging?.cardId === card.id ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  {renderCard(card, col.id)}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
