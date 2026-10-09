import { useState } from 'react';
import Layout from '../../components/Layout';
import KanbanBoard from '../../components/KanbanBoard';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const STAGES = ['Applied', 'Online Test', 'Interview', 'Offer', 'Rejected'];

const COLUMNS = STAGES.map(s => ({ id: s, title: s }));

export default function StudentApplications() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const student = state.students.find(s => s.id === user.studentId);
  const myApplications = state.applications.filter(a => a.studentId === student?.id);

  // Group applications by stage
  const cardsByStage = {};
  STAGES.forEach(s => {
    cardsByStage[s] = myApplications.filter(a => a.status === s);
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [newApp, setNewApp] = useState({
    company: '',
    role: '',
    ctc: '',
    appliedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  function handleMove(cardId, fromStage, toStage) {
    const app = myApplications.find(a => a.id === cardId);
    if (!app) return;
    const history = app.statusHistory || [];
    const updatedHistory = [
      ...history,
      { stage: toStage, date: new Date().toISOString().split('T')[0] },
    ];
    dispatch({
      type: 'UPDATE_APPLICATION',
      payload: {
        id: cardId,
        status: toStage,
        statusHistory: updatedHistory,
      },
    });
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!newApp.company || !newApp.role) return;

    const appObj = {
      id: `app_${Date.now()}`,
      studentId: student.id,
      company: newApp.company,
      role: newApp.role,
      ctc: Number(newApp.ctc) || 6,
      appliedDate: newApp.appliedDate || new Date().toISOString().split('T')[0],
      status: 'Applied',
      notes: newApp.notes || '',
      statusHistory: [
        { stage: 'Applied', date: newApp.appliedDate || new Date().toISOString().split('T')[0] },
      ],
    };

    dispatch({ type: 'ADD_APPLICATION', payload: appObj });
    setShowAddModal(false);
    setNewApp({
      company: '',
      role: '',
      ctc: '',
      appliedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  }

  function renderCard(app, currentStage) {
    return (
      <div
        onClick={() => setSelectedApp(app)}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '10px 12px',
          boxShadow: 'none',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontWeight: 600, color: '#111827', marginBottom: 2 }}>{app.company}</div>
        <div style={{ color: '#4B5563', fontSize: 12, marginBottom: 6 }}>{app.role}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#6B7280' }}>
          <span>{app.ctc} LPA</span>
          <span>{app.appliedDate}</span>
        </div>

        {/* Fallback stage selector */}
        <div style={{ marginTop: 8, borderTop: '1px solid #F3F4F6', paddingTop: 6 }} onClick={e => e.stopPropagation()}>
          <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 2 }}>Move to:</label>
          <select
            value={currentStage}
            onChange={e => handleMove(app.id, currentStage, e.target.value)}
            style={{
              width: '100%',
              fontSize: 11,
              padding: '2px 4px',
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              color: '#374151',
            }}
          >
            {STAGES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Applications">
      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 13, color: '#6B7280' }}>
            Total {myApplications.length} applications tracked across hiring stages.
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '7px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#2563EB',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Add application
        </button>
      </div>

      {/* Kanban Board */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, overflowX: 'auto' }}>
        <KanbanBoard
          columns={COLUMNS}
          cards={cardsByStage}
          renderCard={renderCard}
          onMove={handleMove}
        />
      </div>

      {/* Add Application Modal */}
      {showAddModal && (
        <Modal title="Add Application" onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAddSubmit}>
            <FormField label="Company Name" required>
              <input
                type="text"
                required
                value={newApp.company}
                onChange={e => setNewApp({ ...newApp, company: e.target.value })}
                placeholder="e.g. Google India"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>
            <FormField label="Role / Designation" required>
              <input
                type="text"
                required
                value={newApp.role}
                onChange={e => setNewApp({ ...newApp, role: e.target.value })}
                placeholder="e.g. Software Engineer"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Package (CTC in LPA)">
                <input
                  type="number"
                  step="0.5"
                  value={newApp.ctc}
                  onChange={e => setNewApp({ ...newApp, ctc: e.target.value })}
                  placeholder="e.g. 12"
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Applied Date">
                <input
                  type="date"
                  value={newApp.appliedDate}
                  onChange={e => setNewApp({ ...newApp, appliedDate: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>
            <FormField label="Notes">
              <textarea
                rows={3}
                value={newApp.notes}
                onChange={e => setNewApp({ ...newApp, notes: e.target.value })}
                placeholder="Referral details, round 1 prep, etc."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Details & Status History Modal */}
      {selectedApp && (
        <Modal title={`${selectedApp.company} - ${selectedApp.role}`} onClose={() => setSelectedApp(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
              <span style={{ color: '#6B7280' }}>Current Stage:</span>
              <Badge variant={selectedApp.status === 'Offer' ? 'success' : selectedApp.status === 'Rejected' ? 'danger' : 'info'}>
                {selectedApp.status}
              </Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Package (CTC):</span>
              <span style={{ fontWeight: 600 }}>{selectedApp.ctc} LPA</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6B7280' }}>Applied Date:</span>
              <span>{selectedApp.appliedDate}</span>
            </div>
            {selectedApp.notes && (
              <div>
                <span style={{ color: '#6B7280', display: 'block', marginBottom: 2 }}>Notes:</span>
                <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 4, padding: '6px 10px', color: '#374151' }}>
                  {selectedApp.notes}
                </div>
              </div>
            )}

            {/* Status History */}
            <div style={{ marginTop: 8 }}>
              <div style={{ fontWeight: 600, color: '#111827', marginBottom: 6 }}>Stage History</div>
              <div style={{ border: '1px solid #E5E7EB', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left', color: '#4B5563' }}>Stage</th>
                      <th style={{ padding: '6px 10px', textAlign: 'right', color: '#4B5563' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedApp.statusHistory || [{ stage: selectedApp.status, date: selectedApp.appliedDate }]).map((h, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                        <td style={{ padding: '6px 10px', fontWeight: 500 }}>{h.stage}</td>
                        <td style={{ padding: '6px 10px', textAlign: 'right', color: '#6B7280' }}>{h.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
              <button
                onClick={() => setSelectedApp(null)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
