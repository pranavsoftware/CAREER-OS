'use client';

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import DataTable from '../../components/DataTable';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { computeSkillMatch } from '../../utils/eligibility';
import { Check, Award, ShieldCheck, Search, Filter } from 'lucide-react';

const SKILL_OPTIONS = ['React', 'JavaScript', 'Python', 'Java', 'SQL', 'Node.js', 'AWS', 'Docker'];
const BRANCH_OPTIONS = ['All', 'CSE', 'IT', 'ECE', 'EEE', 'Mechanical'];

export default function CompanyCandidates() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state } = useData();
  const { students, jobs, certificates = [] } = state;

  const myCompany = user?.company || 'Infosys';
  const myJobs = jobs.filter(j => j.company === myCompany);

  // Selected job for match % calculation
  const [selectedJobId, setSelectedJobId] = useState(myJobs[0]?.id || '');
  const selectedJob = jobs.find(j => j.id === selectedJobId) || myJobs[0] || null;

  // Base Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [minCgpa, setMinCgpa] = useState('7.0');
  const [selectedBranch, setSelectedBranch] = useState('All');

  // Certificate Specific Filters (Phase 1.2)
  const [certTitleSearch, setCertTitleSearch] = useState('');
  const [selectedIssuers, setSelectedIssuers] = useState([]);
  const [selectedCertSkills, setSelectedCertSkills] = useState([]);
  const [certValidOnly, setCertValidOnly] = useState(true);

  // Extract unique issuers and certified skills
  const availableIssuers = useMemo(() => {
    const set = new Set(certificates.map(c => c.issuer).filter(Boolean));
    return Array.from(set).sort();
  }, [certificates]);

  const availableCertSkills = useMemo(() => {
    const set = new Set();
    certificates.forEach(c => {
      (c.skills || []).forEach(s => set.add(s));
    });
    return Array.from(set).sort();
  }, [certificates]);

  // Only VERIFIED students (Cross-role flow #2)
  const verifiedStudents = students.filter(s => s.profileStatus === 'Verified');

  function handleSkillToggle(sk) {
    if (selectedSkills.includes(sk)) {
      setSelectedSkills(selectedSkills.filter(s => s !== sk));
    } else {
      setSelectedSkills([...selectedSkills, sk]);
    }
  }

  function handleIssuerToggle(issuer) {
    if (selectedIssuers.includes(issuer)) {
      setSelectedIssuers(selectedIssuers.filter(i => i !== issuer));
    } else {
      setSelectedIssuers([...selectedIssuers, issuer]);
    }
  }

  function handleCertSkillToggle(sk) {
    if (selectedCertSkills.includes(sk)) {
      setSelectedCertSkills(selectedCertSkills.filter(s => s !== sk));
    } else {
      setSelectedCertSkills([...selectedCertSkills, sk]);
    }
  }

  // Filter candidates
  const filteredCandidates = verifiedStudents.filter(s => {
    // 1. Text Search (name or regNo)
    const matchSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.regNo.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Branch Filter
    const matchBranch = selectedBranch === 'All' || s.branch === selectedBranch;

    // 3. CGPA Filter
    const matchCgpa = !minCgpa || s.cgpa >= Number(minCgpa);

    // 4. Candidate Profile Skills Filter
    const studentSkillNames = (s.skills || []).map(sk => sk.name.toLowerCase());
    const matchSkills =
      selectedSkills.length === 0 ||
      selectedSkills.every(sk => studentSkillNames.includes(sk.toLowerCase()));

    // 5. Certificate Filters (Only verified and non-expired count)
    const studentCerts = certificates.filter(c =>
      (c.studentId === s.id || c.student_id === s.id) &&
      c.verified !== false &&
      (!certValidOnly || c.status === 'Valid')
    );

    // Certificate title search
    const matchCertTitle =
      !certTitleSearch.trim() ||
      studentCerts.some(c => c.title.toLowerCase().includes(certTitleSearch.trim().toLowerCase()));

    // Issuer filter (multi-select)
    const matchIssuer =
      selectedIssuers.length === 0 ||
      studentCerts.some(c => selectedIssuers.includes(c.issuer));

    // Certified skills filter (multi-select from certificates.skills)
    const candidateCertSkills = new Set(studentCerts.flatMap(c => (c.skills || []).map(sk => sk.toLowerCase())));
    const matchCertSkills =
      selectedCertSkills.length === 0 ||
      selectedCertSkills.every(sk => candidateCertSkills.has(sk.toLowerCase()));

    return matchSearch && matchBranch && matchCgpa && matchSkills && matchCertTitle && matchIssuer && matchCertSkills;
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
    { key: 'cgpa', header: 'CGPA', render: v => Number(v).toFixed(2) },
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
      header: 'Verified Credentials',
      render: (_, r) => {
        const studentCerts = certificates.filter(c =>
          (c.studentId === r.id || c.student_id === r.id) &&
          c.verified !== false &&
          (!certValidOnly || c.status === 'Valid')
        );

        if (studentCerts.length === 0) {
          return <span style={{ fontSize: 12, color: '#9CA3AF' }}>None</span>;
        }

        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {studentCerts.slice(0, 2).map((c, i) => (
              <span
                key={c.id || i}
                title={`${c.title} issued by ${c.issuer} (${c.status})`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  fontSize: 10,
                  fontWeight: 600,
                  background: '#F0FDF4',
                  color: '#15803D',
                  border: '1px solid #BBF7D0',
                  padding: '2px 6px',
                  borderRadius: 4,
                }}
              >
                <Award size={10} color="#16A34A" />
                {c.title} • {c.issuer}
              </span>
            ))}
            {studentCerts.length > 2 && (
              <span style={{ fontSize: 10, color: '#6B7280', alignSelf: 'center' }}>
                +{studentCerts.length - 2} more
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'profileStatus',
      header: 'University Status',
      render: () => (
        <Badge variant="success">
          <ShieldCheck size={11} style={{ display: 'inline', marginRight: 3 }} />
          Verified
        </Badge>
      ),
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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 16, marginBottom: 16 }}>
        <div className="grid-filters-responsive" style={{ marginBottom: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 4 }}>Search Name/Reg No:</label>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 4 }}>Branch:</label>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
            >
              {BRANCH_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 4 }}>Min CGPA: {minCgpa}</label>
            <input
              type="range"
              min="6.0"
              max="9.5"
              step="0.1"
              value={minCgpa}
              onChange={e => setMinCgpa(e.target.value)}
              style={{ width: '100%', accentColor: '#2563EB' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: 4 }}>Certificate Validity:</label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#374151', marginTop: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={certValidOnly}
                onChange={e => setCertValidOnly(e.target.checked)}
                style={{ accentColor: '#2563EB' }}
              />
              Valid only (hide expired)
            </label>
          </div>
        </div>

        {/* Phase 1.2: Dedicated Certification Filters */}
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12, marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Award size={15} color="#2563EB" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
              Verified Certification Filters:
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Search Certificate Name / Keyword:
              </label>
              <input
                type="text"
                placeholder="e.g. AWS, Solutions Architect, React..."
                value={certTitleSearch}
                onChange={e => setCertTitleSearch(e.target.value)}
                style={{ width: '100%', padding: '6px 10px', borderRadius: 4, border: '1px solid #CBD5E1', fontSize: 12, background: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Issuer ({selectedIssuers.length > 0 ? `${selectedIssuers.length} selected` : 'All'}):
              </label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {availableIssuers.map(iss => {
                  const isSel = selectedIssuers.includes(iss);
                  return (
                    <button
                      key={iss}
                      type="button"
                      onClick={() => handleIssuerToggle(iss)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        border: isSel ? '1px solid #2563EB' : '1px solid #CBD5E1',
                        background: isSel ? '#EFF6FF' : '#fff',
                        color: isSel ? '#1D4ED8' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {isSel && '✓ '}
                      {iss}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {availableCertSkills.length > 0 && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #E2E8F0' }}>
              <label style={{ fontSize: 11, color: '#64748B', display: 'block', marginBottom: 4 }}>
                Certified Skill Tag (from verified credentials):
              </label>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {availableCertSkills.map(sk => {
                  const isSel = selectedCertSkills.includes(sk);
                  return (
                    <button
                      key={sk}
                      type="button"
                      onClick={() => handleCertSkillToggle(sk)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        border: isSel ? '1px solid #16A34A' : '1px solid #CBD5E1',
                        background: isSel ? '#F0FDF4' : '#fff',
                        color: isSel ? '#15803D' : '#475569',
                        cursor: 'pointer',
                      }}
                    >
                      {isSel && '✓ '}
                      {sk}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Candidate Profile Skills filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>Candidate Profile Skills:</span>
          {SKILL_OPTIONS.map(sk => {
            const isSel = selectedSkills.includes(sk);
            return (
              <button
                key={sk}
                type="button"
                onClick={() => handleSkillToggle(sk)}
                style={{
                  padding: '3px 10px',
                  borderRadius: 12,
                  fontSize: 12,
                  border: isSel ? '1px solid #2563EB' : '1px solid #D1D5DB',
                  background: isSel ? '#2563EB' : '#fff',
                  color: isSel ? '#fff' : '#374151',
                  cursor: 'pointer',
                }}
              >
                {sk}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results header & count */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, color: '#6B7280' }}>
        <span>Displaying {filteredCandidates.length} of {verifiedStudents.length} verified candidates</span>
        {(searchTerm || selectedBranch !== 'All' || selectedSkills.length > 0 || certTitleSearch || selectedIssuers.length > 0 || selectedCertSkills.length > 0) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setSelectedBranch('All');
              setSelectedSkills([]);
              setCertTitleSearch('');
              setSelectedIssuers([]);
              setSelectedCertSkills([]);
              setMinCgpa('7.0');
            }}
            style={{ border: 'none', background: 'none', color: '#2563EB', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Candidate Data Table */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <DataTable
          columns={columns}
          rows={filteredCandidates}
          onRowClick={row => navigate(`/company/candidates/${row.id}`)}
          emptyMessage="No verified candidates match the specified certificate and academic criteria."
        />
      </div>
    </Layout>
  );
}
