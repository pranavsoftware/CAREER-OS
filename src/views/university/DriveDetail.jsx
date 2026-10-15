import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { downloadCSV } from '../../utils/csv';

const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function UniversityDriveDetail() {
  const { id } = useParams();
  const { state, dispatch } = useData();

  const drive = state.drives.find(d => d.id === id);
  const applicants = state.driveApplications.filter(a => a.driveId === id);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!drive) {
    return (
      <Layout title="Drive Detail">
        <p>Drive not found.</p>
        <Link to="/university/drives" style={{ color: '#2563EB' }}>Back to drives</Link>
      </Layout>
    );
  }

  function handleOpenEdit() {
    setEditingForm({
      ...drive,
      ctc: String(drive.ctc || ''),
      minCgpa: String(drive.minCgpa || ''),
      maxBacklogs: String(drive.maxBacklogs ?? 0),
      eligibleBranches: drive.eligibleBranches || ['CSE', 'IT'],
    });
    setShowEditModal(true);
  }

  function handleBranchToggle(br) {
    if (!editingForm) return;
    const branches = (editingForm.eligibleBranches || []).includes(br)
      ? editingForm.eligibleBranches.filter(b => b !== br)
      : [...(editingForm.eligibleBranches || []), br];
    setEditingForm({ ...editingForm, eligibleBranches: branches });
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingForm) return;

    const payload = {
      ...editingForm,
      ctc: Number(editingForm.ctc) || 8.0,
      minCgpa: Number(editingForm.minCgpa) || 7.0,
      maxBacklogs: Number(editingForm.maxBacklogs) || 0,
    };

    dispatch({ type: 'UPDATE_DRIVE', payload });
    setShowEditModal(false);
    setSuccessMsg('Drive details updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  function handleShortlist(appId) {
    dispatch({
      type: 'UPDATE_DRIVE_APPLICATION',
      payload: { id: appId, shortlisted: true, rejected: false, status: 'Shortlisted' },
    });
  }

  function handleReject(appId) {
    dispatch({
      type: 'UPDATE_DRIVE_APPLICATION',
      payload: { id: appId, shortlisted: false, rejected: true, status: 'Rejected' },
    });
  }

  function handleExportCsv() {
    const exportData = applicants.map(a => ({
      'Student Name': a.studentName,
      'Registration No': a.regNo,
      'Branch': a.branch,
      'CGPA': a.cgpa,
      'Status': a.shortlisted ? 'Shortlisted' : a.rejected ? 'Rejected' : a.status || 'Applied',
    }));
    downloadCSV(exportData, `${drive.company}_${drive.role}_applicants.csv`);
  }

  const columns = [
    { key: 'studentName', header: 'Student Name' },
    { key: 'regNo', header: 'Registration No' },
    { key: 'branch', header: 'Branch' },
    { key: 'cgpa', header: 'CGPA', render: v => v.toFixed(2) },
    {
      key: 'status',
      header: 'Review Status',
      render: (_, r) => {
        if (r.shortlisted) return <Badge variant="success">Shortlisted</Badge>;
        if (r.rejected) return <Badge variant="danger">Rejected</Badge>;
        return <Badge variant="info">Under Review</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, r) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            disabled={r.shortlisted}
            onClick={() => handleShortlist(r.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: 'none',
              background: r.shortlisted ? '#F3F4F6' : '#16A34A',
              color: r.shortlisted ? '#9CA3AF' : '#fff',
              fontSize: 12,
              fontWeight: 500,
              cursor: r.shortlisted ? 'default' : 'pointer',
            }}
          >
            {r.shortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          <button
            disabled={r.rejected}
            onClick={() => handleReject(r.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              border: '1px solid #FCA5A5',
              background: r.rejected ? '#F3F4F6' : '#FEF2F2',
              color: r.rejected ? '#9CA3AF' : '#DC2626',
              fontSize: 12,
              fontWeight: 500,
              cursor: r.rejected ? 'default' : 'pointer',
            }}
          >
            {r.rejected ? 'Rejected' : 'Reject'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <Layout title={`Drive Details: ${drive.company} — ${drive.role}`}>
      {/* Back button and status message */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Link to="/university/drives" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>
          ← Back to Drives List
        </Link>
        {successMsg && (
          <span style={{ fontSize: 13, color: '#15803D', background: '#F0FDF4', padding: '4px 12px', borderRadius: 4, border: '1px solid #BBF7D0' }}>
            {successMsg}
          </span>
        )}
      </div>

      {/* Drive Overview Header Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {drive.company} — {drive.role}
            </h1>
            <div style={{ fontSize: 13, color: '#4B5563', marginBottom: 8 }}>
              Package: <strong>{drive.ctc} LPA</strong> • Registration Deadline: <strong>{drive.deadline}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>
              Eligibility: Branches ({(drive.eligibleBranches || []).join(', ')}) • Min CGPA: {drive.minCgpa} • Max Backlogs: {drive.maxBacklogs}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Badge variant={drive.status === 'Open' ? 'success' : drive.status === 'Upcoming' ? 'info' : 'gray'}>
              {drive.status}
            </Badge>
            <button
              onClick={handleOpenEdit}
              style={{
                padding: '6px 14px',
                borderRadius: 6,
                border: '1px solid #2563EB',
                background: '#EFF6FF',
                color: '#2563EB',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              Edit Drive Details
            </button>
          </div>
        </div>

        {drive.description && (
          <p style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #F3F4F6', fontSize: 13, color: '#374151', lineHeight: 1.5 }}>
            {drive.description}
          </p>
        )}
      </div>

      {/* Applicants Section */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
              Registered Applicants ({applicants.length})
            </h2>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Shortlisted: {applicants.filter(a => a.shortlisted).length} • Rejected: {applicants.filter(a => a.rejected).length}
            </div>
          </div>
          <button
            disabled={applicants.length === 0}
            onClick={handleExportCsv}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: '1px solid #D1D5DB',
              background: applicants.length === 0 ? '#F9FAFB' : '#fff',
              color: applicants.length === 0 ? '#9CA3AF' : '#374151',
              fontSize: 13,
              fontWeight: 500,
              cursor: applicants.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            Export CSV
          </button>
        </div>

        <DataTable
          columns={columns}
          rows={applicants}
          emptyMessage="No applicants registered for this drive yet."
        />
      </div>

      {/* Edit Drive Modal */}
      {showEditModal && editingForm && (
        <Modal isOpen={showEditModal} title={`Edit Placement Drive — ${editingForm.company}`} onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Company Name" required>
                <input
                  type="text"
                  required
                  value={editingForm.company}
                  onChange={e => setEditingForm({ ...editingForm, company: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Role / Profile" required>
                <input
                  type="text"
                  required
                  value={editingForm.role}
                  onChange={e => setEditingForm({ ...editingForm, role: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <FormField label="CTC (LPA)" required>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={editingForm.ctc}
                  onChange={e => setEditingForm({ ...editingForm, ctc: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Registration Deadline" required>
                <input
                  type="date"
                  required
                  value={editingForm.deadline}
                  onChange={e => setEditingForm({ ...editingForm, deadline: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Status" required>
                <select
                  value={editingForm.status || 'Open'}
                  onChange={e => setEditingForm({ ...editingForm, status: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                >
                  <option value="Open">Open</option>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Closed">Closed</option>
                </select>
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Minimum CGPA" required>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={editingForm.minCgpa}
                  onChange={e => setEditingForm({ ...editingForm, minCgpa: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Maximum Allowed Backlogs" required>
                <input
                  type="number"
                  required
                  value={editingForm.maxBacklogs}
                  onChange={e => setEditingForm({ ...editingForm, maxBacklogs: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            {/* Eligible Branches multi-select */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 6 }}>
                Eligible Branches:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_BRANCHES.map(br => {
                  const isChecked = (editingForm.eligibleBranches || []).includes(br);
                  return (
                    <label
                      key={br}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 13,
                        padding: '4px 8px',
                        borderRadius: 4,
                        border: `1px solid ${isChecked ? '#2563EB' : '#D1D5DB'}`,
                        background: isChecked ? '#EFF6FF' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleBranchToggle(br)}
                      />
                      {br}
                    </label>
                  );
                })}
              </div>
            </div>

            <FormField label="Job Description">
              <textarea
                rows={3}
                placeholder="Overview of hiring criteria, rounds, and specifications..."
                value={editingForm.description || ''}
                onChange={e => setEditingForm({ ...editingForm, description: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Save Changes
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
