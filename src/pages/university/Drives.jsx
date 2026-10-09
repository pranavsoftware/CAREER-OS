import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';

const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function UniversityDrives() {
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const { drives, jobs } = state;

  const [showFloatModal, setShowFloatModal] = useState(false);
  const [inlineMsg, setInlineMsg] = useState(null);

  const [newDrive, setNewDrive] = useState({
    company: '',
    role: '',
    ctc: '',
    eligibleBranches: ['CSE', 'IT'],
    minCgpa: '7.5',
    maxBacklogs: '0',
    deadline: '2026-03-31',
    description: '',
  });

  // Pending approval jobs from companies
  const pendingJobs = jobs.filter(j => j.status === 'Pending approval');

  function handleBranchToggle(br) {
    const branches = newDrive.eligibleBranches.includes(br)
      ? newDrive.eligibleBranches.filter(b => b !== br)
      : [...newDrive.eligibleBranches, br];
    setNewDrive({ ...newDrive, eligibleBranches: branches });
  }

  function handleFloatSubmit(e) {
    e.preventDefault();
    if (!newDrive.company || !newDrive.role) return;

    const driveObj = {
      id: `drive_${Date.now()}`,
      company: newDrive.company,
      companyId: `c_${Date.now()}`,
      role: newDrive.role,
      ctc: Number(newDrive.ctc) || 8.0,
      date: new Date().toISOString().split('T')[0],
      deadline: newDrive.deadline,
      eligibleBranches: newDrive.eligibleBranches,
      minCgpa: Number(newDrive.minCgpa) || 7.0,
      maxBacklogs: Number(newDrive.maxBacklogs) || 0,
      description: newDrive.description,
      status: 'Open',
      applicantsCount: 0,
      approvedByUniversity: true,
    };

    dispatch({ type: 'ADD_DRIVE', payload: driveObj });
    setShowFloatModal(false);
    setInlineMsg({ type: 'success', text: `Campus drive for "${driveObj.company} - ${driveObj.role}" floated successfully. Eligible students will now see this drive.` });
    setNewDrive({
      company: '',
      role: '',
      ctc: '',
      eligibleBranches: ['CSE', 'IT'],
      minCgpa: '7.5',
      maxBacklogs: '0',
      deadline: '2026-03-31',
      description: '',
    });
  }

  function handleApproveJob(job) {
    // 1. Update job status to Active
    dispatch({
      type: 'UPDATE_JOB',
      payload: { id: job.id, status: 'Active' },
    });

    // 2. Add as an active drive
    const driveObj = {
      id: `drive_from_${job.id}`,
      company: job.company,
      companyId: job.companyId || 'c1',
      role: job.title,
      ctc: job.ctc,
      date: new Date().toISOString().split('T')[0],
      deadline: job.deadline,
      eligibleBranches: job.eligibleBranches || ['CSE', 'IT'],
      minCgpa: job.minCgpa || 7.0,
      maxBacklogs: 0,
      description: job.description,
      status: 'Open',
      applicantsCount: 0,
      jobId: job.id,
      approvedByUniversity: true,
    };
    dispatch({ type: 'ADD_DRIVE', payload: driveObj });

    setInlineMsg({ type: 'success', text: `Approved job posting from ${job.company}. Drive is now active.` });
  }

  const columns = [
    {
      key: 'company',
      header: 'Company & Role',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
          <div style={{ fontSize: 12, color: '#4B5563' }}>{r.role}</div>
        </div>
      ),
    },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    {
      key: 'eligibleBranches',
      header: 'Eligible Branches',
      render: list => (
        <span style={{ fontSize: 12, color: '#374151' }}>
          {(list || []).join(', ')}
        </span>
      ),
    },
    {
      key: 'minCgpa',
      header: 'Eligibility Criteria',
      render: (v, r) => (
        <span style={{ fontSize: 12, color: '#4B5563' }}>
          CGPA &ge; {v} • Max {r.maxBacklogs} Backlogs
        </span>
      ),
    },
    { key: 'deadline', header: 'Deadline' },
    {
      key: 'status',
      header: 'Status',
      render: v => (
        <Badge variant={v === 'Open' ? 'success' : v === 'Upcoming' ? 'info' : 'gray'}>
          {v}
        </Badge>
      ),
    },
    { key: 'applicantsCount', header: 'Applicants' },
  ];

  return (
    <Layout title="Placement Drives Management">
      {inlineMsg && (
        <div
          style={{
            padding: '8px 16px',
            marginBottom: 16,
            borderRadius: 6,
            background: inlineMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${inlineMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`,
            color: inlineMsg.type === 'success' ? '#15803D' : '#B91C1C',
            fontSize: 13,
          }}
        >
          {inlineMsg.text}
        </div>
      )}

      {/* Top action row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Total {drives.length} drives registered on the portal. Click a drive row to view applicants.
        </div>
        <button
          onClick={() => setShowFloatModal(true)}
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
          Float new drive
        </button>
      </div>

      {/* Pending Company Job Postings (Cross-role flow #3) */}
      {pendingJobs.length > 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: 16, marginBottom: 20 }}>
          <h2 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: '#92400E' }}>
            Job Postings Pending University Approval ({pendingJobs.length})
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#B45309' }}>
            Companies have submitted new hiring requisitions. Approve them to float active placement drives on campus.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {pendingJobs.map(job => (
              <div
                key={job.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: '#fff',
                  border: '1px solid #E5E7EB',
                  borderRadius: 6,
                  padding: '10px 14px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                    {job.company} — {job.title} ({job.ctc} LPA)
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                    Openings: {job.openings} • Min CGPA: {job.minCgpa} • Branches: {(job.eligibleBranches || []).join(', ')} • Deadline: {job.deadline}
                  </div>
                </div>
                <button
                  onClick={() => handleApproveJob(job)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#16A34A',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Approve drive
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Drives Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={drives}
          onRowClick={row => navigate(`/university/drives/${row.id}`)}
          emptyMessage="No placement drives found."
        />
      </div>

      {/* Float Drive Modal */}
      {showFloatModal && (
        <Modal title="Float New Campus Placement Drive" onClose={() => setShowFloatModal(false)}>
          <form onSubmit={handleFloatSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Company Name" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cisco Systems"
                  value={newDrive.company}
                  onChange={e => setNewDrive({ ...newDrive, company: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Role / Profile" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer"
                  value={newDrive.role}
                  onChange={e => setNewDrive({ ...newDrive, role: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="CTC (LPA)" required>
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="e.g. 14.5"
                  value={newDrive.ctc}
                  onChange={e => setNewDrive({ ...newDrive, ctc: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Registration Deadline" required>
                <input
                  type="date"
                  required
                  value={newDrive.deadline}
                  onChange={e => setNewDrive({ ...newDrive, deadline: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Minimum CGPA" required>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newDrive.minCgpa}
                  onChange={e => setNewDrive({ ...newDrive, minCgpa: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Maximum Allowed Backlogs" required>
                <input
                  type="number"
                  required
                  value={newDrive.maxBacklogs}
                  onChange={e => setNewDrive({ ...newDrive, maxBacklogs: e.target.value })}
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
                  const isChecked = newDrive.eligibleBranches.includes(br);
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
                value={newDrive.description}
                onChange={e => setNewDrive({ ...newDrive, description: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowFloatModal(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Float drive
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
