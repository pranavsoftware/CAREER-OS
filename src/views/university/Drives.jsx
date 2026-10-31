import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Tabs from '../../components/Tabs';
import { useData } from '../../context/DataContext';
import { Sparkles, Send, Check, X, ArrowUp, ArrowDown, Info, ShieldCheck, UserCheck } from 'lucide-react';

const ALL_BRANCHES = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function UniversityDrives() {
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const { drives, jobs, jobShortlists = [], students = [] } = state;

  const [activeTab, setActiveTab] = useState('drives'); // 'drives' | 'shortlists'
  const [selectedJobId, setSelectedJobId] = useState(jobs[0]?.id || 'j1');
  const [selectedCandidateBreakdown, setSelectedCandidateBreakdown] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [showFloatModal, setShowFloatModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState(null);
  const [inlineMsg, setInlineMsg] = useState(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Candidates shortlisted for the selected job
  const jobCandidates = (jobShortlists || [])
    .filter(s => s.jobId === selectedJobId && s.status !== 'Removed')
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));

  async function handleGenerateShortlist() {
    if (!selectedJob) return;
    setIsGenerating(true);
    setInlineMsg(null);
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/shortlist/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
      });
      const data = await res.json();
      if (res.ok && data.shortlist) {
        dispatch({
          type: 'SET_JOB_SHORTLIST',
          payload: { jobId: selectedJob.id, shortlist: data.shortlist },
        });
        setInlineMsg({
          type: 'success',
          text: `CDC Smart Shortlist generated: ${data.totalEligible} verified candidates ranked based on JD skill overlap (40%), certificates (20%), verified projects (20%), and CGPA (20%).`,
        });
      } else {
        setInlineMsg({ type: 'error', text: data.error || 'Failed to generate shortlist.' });
      }
    } catch (err) {
      setInlineMsg({ type: 'error', text: 'Network error generating shortlist.' });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleStatusChange(studentId, newStatus) {
    dispatch({
      type: 'UPDATE_SHORTLIST_CANDIDATE',
      payload: { jobId: selectedJobId, studentId, status: newStatus },
    });
    setInlineMsg({
      type: 'success',
      text: `Candidate status updated to "${newStatus}".`,
    });
  }

  function handleReorder(studentId, direction) {
    const idx = jobCandidates.findIndex(c => c.studentId === studentId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= jobCandidates.length) return;

    const currentCandidate = jobCandidates[idx];
    const targetCandidate = jobCandidates[targetIdx];

    const currentRank = currentCandidate.rank || idx + 1;
    const targetRank = targetCandidate.rank || targetIdx + 1;

    dispatch({
      type: 'UPDATE_SHORTLIST_CANDIDATE',
      payload: { jobId: selectedJobId, studentId: currentCandidate.studentId, rank: targetRank },
    });
    dispatch({
      type: 'UPDATE_SHORTLIST_CANDIDATE',
      payload: { jobId: selectedJobId, studentId: targetCandidate.studentId, rank: currentRank },
    });
  }

  async function handleSendToCompany() {
    if (!selectedJob) return;
    setIsSending(true);
    setInlineMsg(null);

    const approvedIds = jobCandidates
      .filter(c => c.status === 'CDC Approved' || c.status === 'Suggested')
      .map(c => c.studentId);

    if (approvedIds.length === 0) {
      setInlineMsg({ type: 'error', text: 'No candidates available to send. Please approve candidates first.' });
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}/shortlist/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-role': 'university' },
        body: JSON.stringify({ studentIds: approvedIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        dispatch({
          type: 'SEND_SHORTLIST_TO_COMPANY',
          payload: { jobId: selectedJob.id, studentIds: approvedIds },
        });
        setInlineMsg({
          type: 'success',
          text: `Success! ${data.sentCount} approved candidates have been sent to ${selectedJob.company}, added to the Recruiter Pipeline in 'Shortlisted' stage, and notified via email/app alerts.`,
        });
      } else {
        setInlineMsg({ type: 'error', text: data.error || 'Failed to dispatch shortlist.' });
      }
    } catch (err) {
      setInlineMsg({ type: 'error', text: 'Network error dispatching candidates.' });
    } finally {
      setIsSending(false);
    }
  }

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

  function handleOpenEdit(e, drive) {
    e.stopPropagation();
    setEditingDrive({
      ...drive,
      ctc: String(drive.ctc || ''),
      minCgpa: String(drive.minCgpa || ''),
      maxBacklogs: String(drive.maxBacklogs ?? 0),
      eligibleBranches: drive.eligibleBranches || ['CSE', 'IT'],
    });
    setShowEditModal(true);
  }

  function handleEditBranchToggle(br) {
    if (!editingDrive) return;
    const branches = (editingDrive.eligibleBranches || []).includes(br)
      ? editingDrive.eligibleBranches.filter(b => b !== br)
      : [...(editingDrive.eligibleBranches || []), br];
    setEditingDrive({ ...editingDrive, eligibleBranches: branches });
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    if (!editingDrive || !editingDrive.company || !editingDrive.role) return;

    const payload = {
      ...editingDrive,
      ctc: Number(editingDrive.ctc) || 8.0,
      minCgpa: Number(editingDrive.minCgpa) || 7.0,
      maxBacklogs: Number(editingDrive.maxBacklogs) || 0,
    };

    dispatch({ type: 'UPDATE_DRIVE', payload });
    setShowEditModal(false);
    setInlineMsg({
      type: 'success',
      text: `Placement drive "${payload.company} - ${payload.role}" updated successfully.`,
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
    {
      key: 'actions',
      header: 'Actions',
      render: (_, r) => (
        <button
          onClick={e => handleOpenEdit(e, r)}
          style={{
            padding: '4px 10px',
            borderRadius: 6,
            border: '1px solid #D1D5DB',
            background: '#F9FAFB',
            color: '#1F2937',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Edit
        </button>
      ),
    },
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

      {/* Tab Selector */}
      <Tabs
        tabs={[
          { id: 'drives', label: `Active Campus Drives (${drives.length})` },
          { id: 'shortlists', label: `CDC Smart Shortlisting & Requisitions (${jobCandidates.length})` },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'drives' ? (
        <>
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
        </>
      ) : (
        /* CDC Shortlisting Tab (Phase 1.1) */
        <div>
          {/* Requisition Picker & Header */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 6 }}>
                  Select Hiring Requisition:
                </label>
                <select
                  value={selectedJobId}
                  onChange={e => setSelectedJobId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#111827',
                    background: '#F9FAFB',
                  }}
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.company} — {j.title} ({j.ctc} LPA) • {j.openings} Openings
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, alignSelf: 'flex-end' }}>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateShortlist}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: isGenerating ? '#93C5FD' : '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Sparkles size={16} />
                  {isGenerating ? 'Ranking Verified Students...' : 'Generate Smart Shortlist'}
                </button>

                <button
                  type="button"
                  disabled={isSending || jobCandidates.length === 0}
                  onClick={handleSendToCompany}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: isSending || jobCandidates.length === 0 ? '#CBD5E1' : '#16A34A',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: isSending || jobCandidates.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Send size={15} />
                  {isSending ? 'Dispatching...' : 'Send to Company & Notify Students'}
                </button>
              </div>
            </div>

            {/* Requisition Meta Details */}
            {selectedJob && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #F3F4F6', display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 12, color: '#4B5563' }}>
                <div><strong style={{ color: '#111827' }}>Minimum CGPA:</strong> {selectedJob.minCgpa}</div>
                <div><strong style={{ color: '#111827' }}>Branches:</strong> {(selectedJob.branches || selectedJob.eligibleBranches || ['CSE', 'IT']).join(', ')}</div>
                <div><strong style={{ color: '#111827' }}>Vacancies:</strong> {selectedJob.openings} candidates</div>
                <div><strong style={{ color: '#111827' }}>Required Skills:</strong></div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {(selectedJob.requiredSkills || []).map((sk, idx) => (
                    <span key={idx} style={{ padding: '2px 8px', background: '#EFF6FF', color: '#1D4ED8', borderRadius: 9999, fontSize: 11, fontWeight: 600 }}>
                      {typeof sk === 'string' ? sk : sk.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Ranked Shortlist Table */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                  CDC Verified Candidate Shortlist ({jobCandidates.length})
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#6B7280' }}>
                  Sequenced deterministic ranking: Skill overlap (40%), Certificates (20%), Verified Projects (20%), CGPA (20%). Ties broken by CGPA then application date.
                </p>
              </div>
              <span style={{ fontSize: 11, color: '#059669', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '3px 8px', borderRadius: 6, fontWeight: 600 }}>
                100% University Verified Only
              </span>
            </div>

            {jobCandidates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#6B7280' }}>
                <UserCheck size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>No candidates shortlisted yet</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, maxWidth: 380, margin: '4px auto 14px' }}>
                  Run the deterministic rule engine to discover and rank all verified students meeting this requisition's criteria.
                </div>
                <button
                  type="button"
                  onClick={handleGenerateShortlist}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Generate Candidate Shortlist
                </button>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                  <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <tr>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600, width: 80 }}>Rank</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>Candidate</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>Branch & CGPA</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>Match Score</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>Score Breakdown</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600 }}>Status</th>
                      <th style={{ padding: '10px 12px', color: '#374151', fontWeight: 600, textAlign: 'right' }}>CDC Decision</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobCandidates.map((c, idx) => {
                      const studentObj = students.find(s => s.id === c.studentId) || {};
                      const breakdown = c.scoreBreakdown || {};
                      const isSent = c.status === 'Sent to Company';
                      const isApproved = c.status === 'CDC Approved';

                      return (
                        <tr key={c.id || idx} style={{ borderBottom: '1px solid #F3F4F6', background: idx % 2 === 0 ? '#fff' : '#F9FAFB' }}>
                          {/* Rank with Reorder Buttons */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 800, fontSize: 13, color: idx < 3 ? '#2563EB' : '#4B5563' }}>
                                #{c.rank || idx + 1}
                              </span>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <button
                                  type="button"
                                  disabled={idx === 0 || isSent}
                                  onClick={() => handleReorder(c.studentId, 'up')}
                                  style={{ border: 'none', background: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: 0, opacity: idx === 0 ? 0.3 : 1 }}
                                >
                                  <ArrowUp size={12} color="#4B5563" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === jobCandidates.length - 1 || isSent}
                                  onClick={() => handleReorder(c.studentId, 'down')}
                                  style={{ border: 'none', background: 'none', cursor: idx === jobCandidates.length - 1 ? 'default' : 'pointer', padding: 0, opacity: idx === jobCandidates.length - 1 ? 0.3 : 1 }}
                                >
                                  <ArrowDown size={12} color="#4B5563" />
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Candidate Name & Reg No */}
                          <td style={{ padding: '10px 12px' }}>
                            <div style={{ fontWeight: 600, color: '#111827' }}>
                              {studentObj.name || c.studentName || 'Candidate'}
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>
                              {studentObj.regNo || c.regNo}
                            </div>
                          </td>

                          {/* Branch & CGPA */}
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 6px', background: '#E5E7EB', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                              {studentObj.branch || c.branch}
                            </span>
                            <span style={{ marginLeft: 6, fontWeight: 600, color: '#111827' }}>
                              CGPA {Number(studentObj.cgpa || c.cgpa || 0).toFixed(2)}
                            </span>
                          </td>

                          {/* Match Score */}
                          <td style={{ padding: '10px 12px' }}>
                            <Badge variant={c.matchScore >= 80 ? 'success' : c.matchScore >= 60 ? 'info' : 'warning'}>
                              {Number(c.matchScore).toFixed(1)}% Match
                            </Badge>
                          </td>

                          {/* Score Breakdown Pill */}
                          <td style={{ padding: '10px 12px' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedCandidateBreakdown({ candidate: c, student: studentObj })}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '4px 8px',
                                borderRadius: 4,
                                border: '1px solid #D1D5DB',
                                background: '#fff',
                                color: '#374151',
                                fontSize: 11,
                                fontWeight: 500,
                                cursor: 'pointer',
                              }}
                            >
                              <Info size={12} color="#2563EB" />
                              View Breakdown
                            </button>
                          </td>

                          {/* Shortlist Status */}
                          <td style={{ padding: '10px 12px' }}>
                            <Badge variant={isSent ? 'success' : isApproved ? 'info' : 'gray'}>
                              {c.status || 'Suggested'}
                            </Badge>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                            {isSent ? (
                              <span style={{ fontSize: 11, color: '#059669', fontWeight: 600 }}>Sent to Recruiter</span>
                            ) : (
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                {!isApproved && (
                                  <button
                                    type="button"
                                    onClick={() => handleStatusChange(c.studentId, 'CDC Approved')}
                                    style={{
                                      padding: '4px 8px',
                                      borderRadius: 4,
                                      border: 'none',
                                      background: '#16A34A',
                                      color: '#fff',
                                      fontSize: 11,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                  >
                                    <Check size={12} />
                                    Approve
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleStatusChange(c.studentId, 'Removed')}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 4,
                                    border: '1px solid #FCA5A5',
                                    background: '#FEF2F2',
                                    color: '#B91C1C',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 3,
                                  }}
                                >
                                  <X size={12} />
                                  Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score Breakdown Modal */}
      {selectedCandidateBreakdown && (
        <Modal
          isOpen={Boolean(selectedCandidateBreakdown)}
          title={`Score Breakdown: ${selectedCandidateBreakdown.student?.name || 'Candidate'}`}
          onClose={() => setSelectedCandidateBreakdown(null)}
        >
          <div style={{ fontSize: 13, color: '#374151' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: 6, marginBottom: 14 }}>
              <span style={{ fontWeight: 600, color: '#111827' }}>Total JD Alignment Score:</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: '#2563EB' }}>
                {Number(selectedCandidateBreakdown.candidate?.matchScore || 0).toFixed(1)} / 100 pts
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* 1. Skill Overlap */}
              <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                  <span>1. Required Skill Overlap (40% Weight)</span>
                  <span style={{ color: '#2563EB' }}>{selectedCandidateBreakdown.candidate?.scoreBreakdown?.skillOverlap ?? 0} / 40.0 pts</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Candidate matches {selectedCandidateBreakdown.candidate?.scoreBreakdown?.matchedSkills ?? 0} of {selectedCandidateBreakdown.candidate?.scoreBreakdown?.totalReqSkills ?? 0} skills specified in the job requirement.
                </div>
              </div>

              {/* 2. Certificate Relevance */}
              <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                  <span>2. Certificate Relevance (20% Weight)</span>
                  <span style={{ color: '#2563EB' }}>{selectedCandidateBreakdown.candidate?.scoreBreakdown?.certRelevance ?? 0} / 20.0 pts</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Verified by accredited non-expired credentials covering core stack requirements.
                </div>
              </div>

              {/* 3. Verified Projects */}
              <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                  <span>3. Verified Projects (20% Weight)</span>
                  <span style={{ color: '#2563EB' }}>{selectedCandidateBreakdown.candidate?.scoreBreakdown?.verifiedProjects ?? 0} / 20.0 pts</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Portfolio repositories validated with public GitHub commits and domain tech overlap.
                </div>
              </div>

              {/* 4. Academic Standing / CGPA */}
              <div style={{ padding: 12, border: '1px solid #E2E8F0', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, marginBottom: 4 }}>
                  <span>4. Academic CGPA Standing (20% Weight)</span>
                  <span style={{ color: '#2563EB' }}>{selectedCandidateBreakdown.candidate?.scoreBreakdown?.cgpaScore ?? 0} / 20.0 pts</span>
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  Calculated from official verified CGPA: {Number(selectedCandidateBreakdown.student?.cgpa || 0).toFixed(2)} / 10.0.
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setSelectedCandidateBreakdown(null)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#2563EB',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Float Drive Modal */}
      {showFloatModal && (
        <Modal isOpen={showFloatModal} title="Float New Campus Placement Drive" onClose={() => setShowFloatModal(false)}>
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

      {/* Edit Drive Modal */}
      {showEditModal && editingDrive && (
        <Modal isOpen={showEditModal} title={`Edit Placement Drive — ${editingDrive.company}`} onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEditSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Company Name" required>
                <input
                  type="text"
                  required
                  value={editingDrive.company}
                  onChange={e => setEditingDrive({ ...editingDrive, company: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Role / Profile" required>
                <input
                  type="text"
                  required
                  value={editingDrive.role}
                  onChange={e => setEditingDrive({ ...editingDrive, role: e.target.value })}
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
                  value={editingDrive.ctc}
                  onChange={e => setEditingDrive({ ...editingDrive, ctc: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Registration Deadline" required>
                <input
                  type="date"
                  required
                  value={editingDrive.deadline}
                  onChange={e => setEditingDrive({ ...editingDrive, deadline: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Status" required>
                <select
                  value={editingDrive.status || 'Open'}
                  onChange={e => setEditingDrive({ ...editingDrive, status: e.target.value })}
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
                  value={editingDrive.minCgpa}
                  onChange={e => setEditingDrive({ ...editingDrive, minCgpa: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Maximum Allowed Backlogs" required>
                <input
                  type="number"
                  required
                  value={editingDrive.maxBacklogs}
                  onChange={e => setEditingDrive({ ...editingDrive, maxBacklogs: e.target.value })}
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
                  const isChecked = (editingDrive.eligibleBranches || []).includes(br);
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
                        onChange={() => handleEditBranchToggle(br)}
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
                value={editingDrive.description || ''}
                onChange={e => setEditingDrive({ ...editingDrive, description: e.target.value })}
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
