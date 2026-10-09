import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { computeSkillMatch } from '../../utils/eligibility';

const SKILL_OPTIONS = ['React', 'JavaScript', 'Python', 'Java', 'SQL', 'Node.js', 'AWS', 'Docker'];
const BRANCH_OPTIONS = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function CompanyCandidates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useData();
  const { students, jobs, certificates } = state;

  const myCompany = user?.company || 'Infosys';
  const myJobs = jobs.filter(j => j.company === myCompany);

  // Selected job for match % calculation
  const [selectedJobId, setSelectedJobId] = useState(myJobs[0]?.id || '');
  const selectedJob = jobs.find(j => j.id === selectedJobId) || myJobs[0] || null;

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [selectedBranch, setSelectedBranch] = useState('All');
  const [onlyCertHolders, setOnlyCertHolders] = useState(false);

  // Only VERIFIED students (Cross-role flow #2!)
  const verifiedStudents = students.filter(s => s.profileStatus === 'Verified');

  function handleSkillToggle(sk) {
    if (selectedSkills.includes(sk)) {
      setSelectedSkills(selectedSkills.filter(s => s !== sk));
    } else {
      setSelectedSkills([...selectedSkills, sk]);
    }
  }

  // Filter candidates
  const filteredCandidates = verifiedStudents.filter(s => {
    // Search
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    // Branch
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

    // CGPA
    const matchCgpa = !minCgpa || s.cgpa >= Number(minCgpa);

    // Skill filter
    const studentSkillNames = (s.skills || []).map(sk => sk.name.toLowerCase());
    const matchSkills =
      selectedSkills.length === 0 ||
      selectedSkills.every(sk => studentSkillNames.includes(sk.toLowerCase()));

    // Certificate filter
    const hasCerts = certificates.some(c => c.studentId === s.id && c.status === 'Valid');
    const matchCert = !onlyCertHolders || hasCerts;

    return matchSearch && matchBranch && matchCgpa && matchSkills && matchCert;
  });

  const columns = [
    {
      key: 'name',
      header: 'Candidate Name',
      render: (v, r) => (
        <div>
          <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
          <div style={{ fontSize: 11, color: '#6B7280' }}>{r.regNo} • {r.branch}</div>
        </div>
      ),
    },
    { key: 'cgpa', header: 'CGPA', render: v => v.toFixed(2) },
    {
      key: 'matchScore',
      header: `Match vs ${selectedJob ? selectedJob.title : 'Job'}`,
      render: (_, r) => {
        const match = selectedJob ? computeSkillMatch(r, selectedJob) : 0;
        return (
          <Badge variant={match >= 75 ? 'success' : match >= 50 ? 'warning' : 'gray'}>
            {match}% Match
          </Badge>
        );
      },
    },
    {
      key: 'skills',
      header: 'Core Skills',
      render: list => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {(list || []).slice(0, 4).map(sk => (
            <span key={sk.name} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', padding: '1px 6px', borderRadius: 4 }}>
              {sk.name}
            </span>
          ))}
          {(list || []).length > 4 && (
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>+{(list || []).length - 4}</span>
          )}
        </div>
      ),
    },
    {
      key: 'certs',
      header: 'Certifications',
      render: (_, r) => {
        const certCount = certificates.filter(c => c.studentId === r.id && c.status === 'Valid').length;
        return certCount > 0 ? (
          <Badge variant="info">{certCount} Valid</Badge>
        ) : (
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>None</span>
        );
      },
    },
    {
      key: 'profileStatus',
      header: 'University Status',
      render: () => <Badge variant="success">Verified</Badge>,
    },
  ];

  return (
    <Layout title="Verified Candidate Sourcing & Matching">
      {/* Target Job Benchmark Bar */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Calculate match against requisition:</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
          >
            {myJobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.ctc} LPA)</option>
            ))}
          </select>
        </div>
        {selectedJob && (
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            Job required skills: <strong>{(selectedJob.requiredSkills || []).join(', ')}</strong>
          </div>
        )}
      </div>

      {/* Filter panel */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
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
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Branch:</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 4 }}>Min CGPA: {minCgpa}</label>
            <input
              type="range"
              min="6.0"
              max="9.5"
              step="0.1"
              value={minCgpa}
              onChange={e => setMinCgpa(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 6 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={onlyCertHolders}
                onChange={e => setOnlyCertHolders(e.target.checked)}
              />
              Certificate holders only
            </label>
          </div>
        </div>

        {/* Skill filter chips */}
        <div>
          <label style={{ fontSize: 12, color: '#6B7280', display: 'block', marginBottom: 6 }}>Filter by Required Skills (All selected must match):</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {SKILL_OPTIONS.map(sk => {
              const active = selectedSkills.includes(sk);
              return (
                <button
                  key={sk}
                  onClick={() => handleSkillToggle(sk)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: `1px solid ${active ? '#2563EB' : '#D1D5DB'}`,
                    background: active ? '#EFF6FF' : '#fff',
                    color: active ? '#2563EB' : '#374151',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                  }}
                >
                  {sk} {active && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#6B7280' }}>
          <span>Displaying {filteredCandidates.length} pre-verified student candidates</span>
          {(searchTerm || selectedBranch !== 'All' || selectedSkills.length > 0 || onlyCertHolders || minCgpa !== '7.0') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedBranch('All');
                setSelectedSkills([]);
                setMinCgpa('7.0');
                setOnlyCertHolders(false);
              }}
              style={{ background: 'none', border: 'none', color: '#2563EB', cursor: 'pointer', fontSize: 12 }}
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={filteredCandidates}
          onRowClick={row => navigate(`/company/candidates/${row.id}`)}
          emptyMessage="No verified candidates match the specified criteria."
        />
      </div>
    </Layout>
  );
}
