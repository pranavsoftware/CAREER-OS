import { useState } from 'react';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function CompanyJobs() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const myCompany = user?.company || 'Infosys';
  const myJobs = state.jobs.filter(j => j.company === myCompany);

  const [showPostModal, setShowPostModal] = useState(false);
  const [inlineMsg, setInlineMsg] = useState(null);

  const [newJob, setNewJob] = useState({
    title: '',
    description: '',
    requiredSkills: ['Java', 'SQL'],
    minCgpa: '7.0',
    branches: ['CSE', 'IT'],
    openings: '25',
    ctc: '6.0',
    location: 'Bangalore / Remote',
    deadline: '2026-04-15',
  });

  const [skillInput, setSkillInput] = useState('');

  function handleAddSkill() {
    const s = skillInput.trim();
    if (!s) return;
    if (!newJob.requiredSkills.includes(s)) {
      setNewJob({ ...newJob, requiredSkills: [...newJob.requiredSkills, s] });
    }
    setSkillInput('');
  }

  function handleRemoveSkill(sk) {
    setNewJob({ ...newJob, requiredSkills: newJob.requiredSkills.filter(s => s !== sk) });
  }

  function handleBranchToggle(br) {
    const branches = newJob.branches.includes(br)
      ? newJob.branches.filter(b => b !== br)
      : [...newJob.branches, br];
    setNewJob({ ...newJob, branches });
  }

  function handlePostSubmit(e) {
    e.preventDefault();
    if (!newJob.title) return;

    const jobObj = {
      id: `job_${Date.now()}`,
      companyId: user.companyId || 'c1',
      company: myCompany,
      title: newJob.title,
      description: newJob.description,
      requiredSkills: newJob.requiredSkills,
      minCgpa: Number(newJob.minCgpa) || 7.0,
      branches: newJob.branches,
      openings: Number(newJob.openings) || 10,
      ctc: Number(newJob.ctc) || 6.0,
      deadline: newJob.deadline,
      location: newJob.location,
      status: 'Pending approval', // Pending approval by University Admin
      applicantsCount: 0,
      approvedByUniversity: false,
    };

    dispatch({ type: 'ADD_JOB', payload: jobObj });
    setShowPostModal(false);
    setInlineMsg({
      type: 'success',
      text: `Job posting "${jobObj.title}" submitted. It is now awaiting approval from VIT Placement Cell.`,
    });

    setNewJob({
      title: '',
      description: '',
      requiredSkills: ['Java', 'SQL'],
      minCgpa: '7.0',
      branches: ['CSE', 'IT'],
      openings: '25',
      ctc: '6.0',
      location: 'Bangalore / Remote',
      deadline: '2026-04-15',
    });
  }

  const columns = [
    {
      key: 'title',
      header: 'Job Title',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
          <div style={{ fontSize: 11, color: '#6B7280' }}>Location: {r.location}</div>
        </div>
      ),
    },
    { key: 'ctc', header: 'CTC', render: v => `${v} LPA` },
    { key: 'openings', header: 'Openings' },
    {
      key: 'requiredSkills',
      header: 'Required Skills',
      render: list => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(list || []).map(sk => (
            <span key={sk} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', padding: '1px 6px', borderRadius: 4, border: '1px solid #E5E7EB' }}>
              {sk}
            </span>
          ))}
        </div>
      ),
    },
    { key: 'deadline', header: 'Deadline' },
    { key: 'applicantsCount', header: 'Applicants' },
    {
      key: 'status',
      header: 'Status',
      render: v => (
        <Badge variant={v === 'Active' || v === 'Open' ? 'success' : v === 'Pending approval' ? 'warning' : 'gray'}>
          {v}
        </Badge>
      ),
    },
  ];

  return (
    <Layout title={`Job Requisitions & Postings (${myCompany})`}>
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
          Manage campus job requisitions. New posts are sent to VIT Placement Cell for drive authorization.
        </div>
        <button
          onClick={() => setShowPostModal(true)}
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
          Post job
        </button>
      </div>

      {/* Jobs Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={myJobs}
          emptyMessage="No job postings created yet."
        />
      </div>

      {/* Post Job Modal */}
      {showPostModal && (
        <Modal title="Create Campus Job Requisition" onClose={() => setShowPostModal(false)}>
          <form onSubmit={handlePostSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Job Title" required>
                <input
                  type="text"
                  required
                  placeholder="e.g. Associate Software Engineer"
                  value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Location" required>
                <input
                  type="text"
                  required
                  value={newJob.location}
                  onChange={e => setNewJob({ ...newJob, location: e.target.value })}
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
                  value={newJob.ctc}
                  onChange={e => setNewJob({ ...newJob, ctc: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Openings" required>
                <input
                  type="number"
                  required
                  value={newJob.openings}
                  onChange={e => setNewJob({ ...newJob, openings: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Min CGPA" required>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newJob.minCgpa}
                  onChange={e => setNewJob({ ...newJob, minCgpa: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            <FormField label="Deadline" required>
              <input
                type="date"
                required
                value={newJob.deadline}
                onChange={e => setNewJob({ ...newJob, deadline: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            {/* Branches */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                Eligible Branches:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ALL_BRANCHES.map(br => {
                  const isChecked = newJob.branches.includes(br);
                  return (
                    <label
                      key={br}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        padding: '3px 8px',
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

            {/* Required Skills chips */}
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: '#374151', display: 'block', marginBottom: 4 }}>
                Required Skills:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                {newJob.requiredSkills.map(sk => (
                  <span
                    key={sk}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 12,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                    }}
                  >
                    {sk}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(sk)}
                      style={{ background: 'none', border: 'none', color: '#1E40AF', cursor: 'pointer', padding: 0 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, maxWidth: 300 }}>
                <input
                  type="text"
                  placeholder="Add skill tag"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  style={{ flex: 1, padding: '4px 8px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12 }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F9FAFB', fontSize: 12, cursor: 'pointer' }}
                >
                  Add
                </button>
              </div>
            </div>

            <FormField label="Job Description">
              <textarea
                rows={3}
                placeholder="Role responsibilities, required qualifications, and interview stages..."
                value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Submit for approval
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
