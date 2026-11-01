import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { Info, Download, FileSpreadsheet, UserPlus, Trash2, Lock, AlertTriangle } from 'lucide-react';

const BRANCH_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Biotechnology'];

export default function UniversityStudents() {
  const navigate = useNavigate();
  const { state, dispatch } = useData();
  const { students } = state;

  // Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('manual'); // 'manual' | 'csv'
  const [inlineMsg, setInlineMsg] = useState(null);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    regNo: '',
    email: '',
    branch: 'CSE',
    batch: '2026',
    cgpa: '8.0',
    backlogs: '0',
    phone: '',
  });

  // CSV Upload State
  const [csvFile, setCsvFile] = useState(null);
  const [csvParsedRows, setCsvParsedRows] = useState([]);
  const [csvError, setCsvError] = useState(null);
  const fileInputRef = useRef(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [minCgpa, setMinCgpa] = useState('');
  const [backlogFilter, setBacklogFilter] = useState('All'); // 'All' | '0' | '>0'
  const [verificationFilter, setVerificationFilter] = useState('All');

  const filteredStudents = students.filter(s => {
    // Search
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    // Branch
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

    // Min CGPA
    const matchCgpa = !minCgpa || s.cgpa >= Number(minCgpa);

    // Backlog
    const matchBacklog =
      backlogFilter === 'All'
        ? true
        : backlogFilter === '0'
        ? s.backlogs === 0
        : s.backlogs > 0;

    // Verification
    const matchVerif =
      verificationFilter === 'All' || s.profileStatus === verificationFilter;

    return matchSearch && matchBranch && matchCgpa && matchBacklog && matchVerif;
  });

  // Student Deletion State
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDeleteStudent(student) {
    if (student.profileStatus === 'Verified') {
      setInlineMsg({
        type: 'danger',
        text: `Cannot delete verified profile of "${student.name}". Official placement records are locked.`,
      });
      return;
    }
    setDeleteCandidate(student);
  }

  async function confirmDeleteStudent() {
    if (!deleteCandidate) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/students?id=${encodeURIComponent(deleteCandidate.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        setInlineMsg({
          type: 'danger',
          text: data.error || 'Failed to delete student.',
        });
        setDeleteLoading(false);
        setDeleteCandidate(null);
        return;
      }
      dispatch({ type: 'DELETE_STUDENT', payload: deleteCandidate.id });
      setInlineMsg({
        type: 'success',
        text: `Student "${deleteCandidate.name}" (${deleteCandidate.regNo}) has been deleted successfully from directory.`,
      });
    } catch (err) {
      console.error('Delete student error:', err);
      setInlineMsg({
        type: 'danger',
        text: 'Network or server error while deleting student.',
      });
    } finally {
      setDeleteLoading(false);
      setDeleteCandidate(null);
    }
  }

  // Manual Form Submission
  async function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualForm.name || !manualForm.regNo || !manualForm.email) {
      setInlineMsg({
        type: 'danger',
        text: 'Please fill in Name, Registration Number, and Email.',
      });
      return;
    }

    const regNoClean = manualForm.regNo.trim().toUpperCase();
    const emailClean = manualForm.email.trim().toLowerCase();

    // Check if an existing student is already verified
    const existing = students.find(
      s => (s.email && s.email.toLowerCase() === emailClean) || (s.regNo && s.regNo.toUpperCase() === regNoClean)
    );

    if (existing && existing.profileStatus === 'Verified') {
      setInlineMsg({
        type: 'danger',
        text: `Cannot add or modify student "${existing.name}" (${existing.regNo}). This profile is already officially Verified and locked.`,
      });
      return;
    }

    setIsSubmitting(true);
    const newStudent = {
      id: existing ? existing.id : `s_${Date.now()}`,
      name: manualForm.name.trim(),
      regNo: regNoClean,
      email: emailClean,
      branch: manualForm.branch,
      batch: Number(manualForm.batch) || 2026,
      cgpa: Number(manualForm.cgpa) || 0,
      backlogs: Number(manualForm.backlogs) || 0,
      phone: manualForm.phone.trim() || null,
      profileStatus: existing ? existing.profileStatus : 'Pending',
      placementStatus: existing ? existing.placementStatus : 'In process',
      profileCompletion: existing ? existing.profileCompletion : 25,
      skills: existing?.skills || [],
      projects: existing?.projects || [],
      experience: existing?.experience || [],
      verificationStatus: existing?.verificationStatus || {
        personal: 'Pending',
        academics: 'Pending',
        skills: 'Pending',
        projects: 'Pending',
      },
    };

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent),
      });
      const data = await res.json();
      if (!res.ok) {
        setInlineMsg({
          type: 'danger',
          text: data.error || 'Failed to register student.',
        });
        setIsSubmitting(false);
        return;
      }

      dispatch({ type: 'ADD_STUDENT', payload: { ...newStudent, skipApi: true } });
      setShowAddModal(false);
      setInlineMsg({
        type: 'success',
        text: `Student "${newStudent.name}" (${newStudent.regNo}) saved successfully and onboarding credentials sent directly to ${newStudent.email}.`,
      });
      setManualForm({
        name: '',
        regNo: '',
        email: '',
        branch: 'CSE',
        batch: '2026',
        cgpa: '8.0',
        backlogs: '0',
        phone: '',
      });
    } catch (err) {
      console.error('Error submitting student:', err);
      setInlineMsg({
        type: 'danger',
        text: 'Error connecting to server.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Download Sample CSV
  function handleDownloadTemplate() {
    const csvContent =
      'Name,RegNo,Email,Branch,Batch,CGPA,Backlogs,Phone\n' +
      'Aarav Patel,22BCE1101,aarav.patel@campus.edu,CSE,2026,8.85,0,+91 9876543211\n' +
      'Ananya Sen,22BIT1102,ananya.sen@campus.edu,IT,2026,9.15,0,+91 9876543212\n' +
      'Rahul Verma,22ECE1103,rahul.verma@campus.edu,ECE,2026,7.90,1,+91 9876543213\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'students_mass_registration_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Parse CSV File
  function handleCsvFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const text = evt.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setCsvError('CSV file is empty or missing data rows.');
          setCsvParsedRows([]);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const expectedHeaders = ['name', 'regno', 'email', 'branch', 'batch', 'cgpa', 'backlogs', 'phone'];

        // Map column indices
        const nameIdx = headers.findIndex(h => h.includes('name'));
        const regIdx = headers.findIndex(h => h.includes('reg'));
        const emailIdx = headers.findIndex(h => h.includes('email') || h.includes('mail'));
        const branchIdx = headers.findIndex(h => h.includes('branch'));
        const batchIdx = headers.findIndex(h => h.includes('batch'));
        const cgpaIdx = headers.findIndex(h => h.includes('cgpa'));
        const backlogsIdx = headers.findIndex(h => h.includes('backlog'));
        const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));

        if (nameIdx === -1 || regIdx === -1 || emailIdx === -1) {
          setCsvError('CSV must at least contain columns: Name, RegNo, Email.');
          setCsvParsedRows([]);
          return;
        }

        const parsed = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (!cols[nameIdx] && !cols[emailIdx]) continue;

          parsed.push({
            name: cols[nameIdx] || 'Student',
            regNo: (cols[regIdx] || `REG${Date.now() + i}`).toUpperCase(),
            email: cols[emailIdx] || `student${i}@campus.edu`,
            branch: cols[branchIdx] || 'CSE',
            batch: Number(cols[batchIdx]) || 2026,
            cgpa: Number(cols[cgpaIdx]) || 7.0,
            backlogs: Number(cols[backlogsIdx]) || 0,
            phone: cols[phoneIdx] || null,
          });
        }

        if (parsed.length === 0) {
          setCsvError('No valid student rows found in the CSV file.');
        } else {
          setCsvParsedRows(parsed);
        }
      } catch (err) {
        setCsvError('Error reading CSV: ' + err.message);
        setCsvParsedRows([]);
      }
    };
    reader.readAsText(file);
  }

  // Mass Import CSV
  function handleImportCsv() {
    if (csvParsedRows.length === 0) {
      setInlineMsg({
        type: 'danger',
        text: 'No parsed student records to import.',
      });
      return;
    }

    const studentsToInsert = csvParsedRows.map((row, idx) => ({
      id: `s_${Date.now()}_${idx}`,
      name: row.name,
      regNo: row.regNo,
      email: row.email,
      branch: row.branch,
      batch: row.batch,
      cgpa: row.cgpa,
      backlogs: row.backlogs,
      phone: row.phone,
      profileStatus: 'Pending',
      placementStatus: 'In process',
      profileCompletion: 25,
      skills: [],
      projects: [],
      experience: [],
      verificationStatus: {
        personal: 'Pending',
        academics: 'Pending',
        skills: 'Pending',
        projects: 'Pending',
      },
    }));

    dispatch({ type: 'ADD_STUDENTS', payload: studentsToInsert });
    setShowAddModal(false);
    setInlineMsg({
      type: 'success',
      text: `Successfully imported and registered ${studentsToInsert.length} students via CSV mass upload.`,
    });
    setCsvFile(null);
    setCsvParsedRows([]);
  }

  const columns = [
    {
      key: 'name',
      header: 'Student Name',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{r.email}</div>
        </div>
      ),
    },
    { key: 'regNo', header: 'Reg No' },
    { key: 'branch', header: 'Branch' },
    { key: 'cgpa', header: 'CGPA', render: v => v.toFixed(2) },
    {
      key: 'backlogs',
      header: 'Backlogs',
      render: v => (
        <span style={{ color: v > 0 ? '#DC2626' : '#15803D', fontWeight: v > 0 ? 600 : 400 }}>
          {v}
        </span>
      ),
    },
    {
      key: 'profileStatus',
      header: 'Profile Status',
      render: v => (
        <Badge variant={v === 'Verified' ? 'success' : v === 'Partial' ? 'warning' : 'gray'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'placementStatus',
      header: 'Placement Status',
      render: v => (
        <Badge variant={v === 'Placed' ? 'success' : v === 'In process' ? 'info' : 'gray'}>
          {v}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '110px',
      render: (_, r) => {
        const isVerified = r.profileStatus === 'Verified';
        return (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={e => e.stopPropagation()}
          >
            {isVerified ? (
              <span
                title="Verified student profiles are locked for university placement audit compliance and cannot be deleted."
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 600,
                  color: '#64748B',
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  cursor: 'not-allowed',
                }}
              >
                <Lock size={12} color="#94A3B8" />
                Locked
              </span>
            ) : (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteStudent(r);
                }}
                title={`Delete unverified student ${r.name}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 9px',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 500,
                  color: '#DC2626',
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#FEE2E2';
                  e.currentTarget.style.borderColor = '#FCA5A5';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FEF2F2';
                  e.currentTarget.style.borderColor = '#FECACA';
                }}
              >
                <Trash2 size={13} color="#DC2626" />
                Delete
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <Layout title="Student Directory & Profile Verification">
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

      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: '#6B7280' }}>
          Total {students.length} students enrolled in the university placement pool. Click a student row to inspect verification sections.
        </div>
        <button
          onClick={() => { setShowAddModal(true); setActiveTab('manual'); }}
          style={{
            padding: '7px 16px',
            borderRadius: 6,
            border: 'none',
            background: '#2563EB',
            color: '#fff',
            fontSize: 13,
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          + Add Students (Manual / CSV)
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div className="grid-filters-responsive">
          {/* Search */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Search Name/Reg No:</label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          {/* Branch */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Branch:</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Branches</option>
              <option value="CSE">CSE</option>
              <option value="IT">IT</option>
              <option value="ECE">ECE</option>
              <option value="EEE">EEE</option>
              <option value="Mechanical">Mechanical</option>
            </select>
          </div>

          {/* Min CGPA */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Min CGPA:</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="10"
              placeholder="e.g. 8.0"
              value={minCgpa}
              onChange={e => setMinCgpa(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>

          {/* Backlogs */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Backlogs:</label>
            <select
              value={backlogFilter}
              onChange={e => setBacklogFilter(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All</option>
              <option value="0">No Backlogs (0)</option>
              <option value=">0">Has Backlogs (&gt;0)</option>
            </select>
          </div>

          {/* Verification */}
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Profile Status:</label>
            <select
              value={verificationFilter}
              onChange={e => setVerificationFilter(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              <option value="All">All Statuses</option>
              <option value="Verified">Verified</option>
              <option value="Partial">Partial</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6B7280' }}>
          <span>Showing {filteredStudents.length} of {students.length} students</span>
          {(searchTerm || selectedBranch !== 'All' || minCgpa || backlogFilter !== 'All' || verificationFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('All');
                setMinCgpa('');
                setBacklogFilter('All');
                setVerificationFilter('All');
              }}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 12 }}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={filteredStudents}
          onRowClick={row => navigate(`/university/students/${row.id}`)}
          emptyMessage="No students match the selected filter criteria."
        />
      </div>

      {/* Add Students Modal (Manual Entry + CSV Mass Upload) */}
      {showAddModal && (
        <Modal
          isOpen={showAddModal}
          title="Add Students to Placement Directory"
          onClose={() => setShowAddModal(false)}
        >
          {/* Tab Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: 16 }}>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'manual' ? 600 : 400,
                color: activeTab === 'manual' ? '#2563EB' : '#6B7280',
                borderBottom: activeTab === 'manual' ? '2px solid #2563EB' : '2px solid transparent',
                fontSize: 14,
              }}
            >
              Manual Single Entry
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('csv')}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'csv' ? 600 : 400,
                color: activeTab === 'csv' ? '#2563EB' : '#6B7280',
                borderBottom: activeTab === 'csv' ? '2px solid #2563EB' : '2px solid transparent',
                fontSize: 14,
              }}
            >
              Mass Registration via CSV File
            </button>
          </div>

          {/* Tab 1: Manual Entry */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Full Name" required>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={manualForm.name}
                    onChange={e => setManualForm({ ...manualForm, name: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
                <FormField label="Registration Number" required>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22BCE1050"
                    value={manualForm.regNo}
                    onChange={e => setManualForm({ ...manualForm, regNo: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <FormField label="Email Address" required>
                  <input
                    type="email"
                    required
                    placeholder="e.g. john.doe@campus.edu"
                    value={manualForm.email}
                    onChange={e => setManualForm({ ...manualForm, email: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
                <FormField label="Phone Number">
                  <input
                    type="text"
                    placeholder="e.g. +91 9876543210"
                    value={manualForm.phone}
                    onChange={e => setManualForm({ ...manualForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <FormField label="Branch" required>
                  <select
                    value={manualForm.branch}
                    onChange={e => setManualForm({ ...manualForm, branch: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  >
                    {BRANCH_OPTIONS.map(br => (
                      <option key={br} value={br}>{br}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Batch Year" required>
                  <input
                    type="number"
                    required
                    value={manualForm.batch}
                    onChange={e => setManualForm({ ...manualForm, batch: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
                <FormField label="CGPA" required>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={manualForm.cgpa}
                    onChange={e => setManualForm({ ...manualForm, cgpa: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
                <FormField label="Backlogs" required>
                  <input
                    type="number"
                    min="0"
                    required
                    value={manualForm.backlogs}
                    onChange={e => setManualForm({ ...manualForm, backlogs: e.target.value })}
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
              </div>

              <div style={{ padding: '10px 14px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 6, fontSize: 12, color: '#0369A1', marginTop: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Info size={16} style={{ flexShrink: 0, marginTop: 2, color: '#0284C7' }} />
                <span>Upon registration, an automated welcome email with a <strong>temporary password</strong> and login link is dispatched to the student. On first login, they must reset their password and complete their profile section before other placement features unlock.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Registering & Sending Email...' : 'Register Student'}
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: CSV Upload */}
          {activeTab === 'csv' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ fontSize: 13, color: '#4B5563' }}>
                  Upload a standard CSV file with headers: <code>Name, RegNo, Email, Branch, Batch, CGPA, Backlogs, Phone</code>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    border: '1px solid #2563EB',
                    background: '#EFF6FF',
                    color: '#2563EB',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Download size={13} />
                  <span>Download CSV Template</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: 8,
                  padding: '24px 16px',
                  textAlign: 'center',
                  background: '#F9FAFB',
                  marginBottom: 16,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  style={{ display: 'none' }}
                />
                <FileSpreadsheet size={32} color="#4B5563" style={{ marginBottom: 6 }} />
                <div style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
                  {csvFile ? csvFile.name : 'Click to select CSV file from computer'}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                  Supports up to 500 students per batch
                </div>
              </div>

              {csvError && (
                <div style={{ padding: '8px 12px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626', fontSize: 12, marginBottom: 12 }}>
                  {csvError}
                </div>
              )}

              {/* Parsed Preview Table */}
              {csvParsedRows.length > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', marginBottom: 6 }}>
                    Parsed Preview ({csvParsedRows.length} valid students):
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #E5E7EB', borderRadius: 6, marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                      <thead style={{ background: '#F3F4F6', position: 'sticky', top: 0 }}>
                        <tr>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>Name</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>Reg No</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>Email</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>Branch</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>CGPA</th>
                          <th style={{ padding: '6px 10px', borderBottom: '1px solid #E5E7EB' }}>Backlogs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvParsedRows.map((r, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 500 }}>{r.name}</td>
                            <td style={{ padding: '6px 10px' }}>{r.regNo}</td>
                            <td style={{ padding: '6px 10px' }}>{r.email}</td>
                            <td style={{ padding: '6px 10px' }}>{r.branch}</td>
                            <td style={{ padding: '6px 10px' }}>{r.cgpa}</td>
                            <td style={{ padding: '6px 10px' }}>{r.backlogs}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={csvParsedRows.length === 0}
                  onClick={handleImportCsv}
                  style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: 'none',
                    background: csvParsedRows.length === 0 ? '#9CA3AF' : '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: csvParsedRows.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Import & Register {csvParsedRows.length} Students
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <Modal
          isOpen={true}
          title="Confirm Student Deletion"
          onClose={() => !deleteLoading && setDeleteCandidate(null)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: 14,
              }}
            >
              <AlertTriangle size={22} color="#DC2626" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
                Are you sure you want to delete student <strong>"{deleteCandidate.name}"</strong> (Reg No:{' '}
                <strong>{deleteCandidate.regNo}</strong>)?
                <div style={{ marginTop: 6, fontSize: 12, color: '#B91C1C' }}>
                  This will remove their directory profile, portal login account (<code>{deleteCandidate.email}</code>), and any associated placement test records. This action is permanent and cannot be undone.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteCandidate(null)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDeleteStudent}
                style={{
                  padding: '7px 18px',
                  borderRadius: 6,
                  border: '1px solid #DC2626',
                  background: '#DC2626',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Trash2 size={14} color="#fff" />
                {deleteLoading ? 'Deleting...' : 'Delete Student'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </Layout>
  );
}
