'use client';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { ShieldCheck, AlertTriangle, ToggleLeft, ToggleRight, Check, X, Award, GitBranch, FileText, Briefcase, FileBarChart, Mail, Globe, ExternalLink, CheckCircle2, Building } from 'lucide-react';

const SECTIONS = [
  { id: 'personalInfo', label: 'Personal Information' },
  { id: 'education', label: 'Academic & Education Records' },
  { id: 'skills', label: 'Technical Skills' },
  { id: 'projects', label: 'Projects & Publications' },
  { id: 'experience', label: 'Internship & Work Experience' },
];

export default function UniversityStudentDetail() {
  const { id } = useParams();
  const { state, dispatch } = useData();
  const { universityRecords = [], verificationSettings = {} } = state;

  const student = state.students.find(s => s.id === id);
  const studentCerts = state.certificates.filter(c => c.studentId === id);
  const uRec = universityRecords.find(r => r.regNo === student?.regNo);

  const [rejectingSection, setRejectingSection] = useState(null);
  const [rejectRemark, setRejectRemark] = useState('');
  const [inlineMsg, setInlineMsg] = useState(null);

  if (!student) {
    return (
      <Layout title="Student Detail">
        <p>Student not found.</p>
        <Link to="/university/students" style={{ color: '#2563EB' }}>Back to directory</Link>
      </Layout>
    );
  }

  function handleVerify(sectionKey) {
    dispatch({
      type: 'VERIFY_STUDENT_SECTION',
      payload: {
        studentId: student.id,
        section: sectionKey,
        status: 'Verified',
        remark: 'Approved manually by Placement Officer (Override)',
      },
    });
    setInlineMsg({ type: 'success', text: `Section "${sectionKey}" has been verified.` });
  }

  function handleRejectSubmit(e) {
    e.preventDefault();
    if (!rejectingSection) return;

    dispatch({
      type: 'VERIFY_STUDENT_SECTION',
      payload: {
        studentId: student.id,
        section: rejectingSection,
        status: 'Rejected',
        remark: rejectRemark.trim() || 'Incomplete documentation or discrepancy found.',
      },
    });

    setInlineMsg({ type: 'error', text: `Section "${rejectingSection}" was marked as rejected.` });
    setRejectingSection(null);
    setRejectRemark('');
  }

  function handleToggleAutomation(sectionKey) {
    const currentEnabled = verificationSettings[sectionKey] !== false;
    dispatch({
      type: 'UPDATE_VERIFICATION_SETTINGS',
      payload: { section: sectionKey, autoEnabled: !currentEnabled },
    });
    setInlineMsg({
      type: 'success',
      text: `Automated verification for "${sectionKey}" turned ${!currentEnabled ? 'ON' : 'OFF'}.`,
    });
  }

  // Calculate field discrepancies for Personal Info
  const personalDiffs = [];
  if (uRec) {
    if ((student.name || '').trim().toLowerCase() !== (uRec.name || '').trim().toLowerCase()) {
      personalDiffs.push({ field: 'Full Name', student: student.name, registrar: uRec.name });
    }
    if ((student.branch || '').trim().toUpperCase() !== (uRec.branch || '').trim().toUpperCase()) {
      personalDiffs.push({ field: 'Branch', student: student.branch, registrar: uRec.branch });
    }
    if (Number(student.batch) !== Number(uRec.batch)) {
      personalDiffs.push({ field: 'Batch', student: student.batch, registrar: uRec.batch });
    }
  }

  // Calculate field discrepancies for Education / Academic
  const academicDiffs = [];
  if (uRec) {
    const cgpaDiff = Math.abs((Number(student.cgpa) || 0) - (Number(uRec.cgpa) || 0));
    if (cgpaDiff > 0.01) {
      academicDiffs.push({ field: 'CGPA', student: Number(student.cgpa).toFixed(2), registrar: Number(uRec.cgpa).toFixed(2) });
    }
    if ((Number(student.backlogs) || 0) !== (Number(uRec.backlogs) || 0)) {
      academicDiffs.push({ field: 'Active Backlogs', student: student.backlogs ?? 0, registrar: uRec.backlogs ?? 0 });
    }
  }

  return (
    <Layout title={`Verification: ${student.name} (${student.regNo})`}>
      {/* Top breadcrumb & summary */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/university/students" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>
          ← Back to Students Directory
        </Link>
      </div>

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

      {/* Student Profile Overview Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Student Avatar */}
            <div style={{ position: 'relative', width: 68, height: 68, borderRadius: '50%', flexShrink: 0 }}>
              {student.avatar ? (
                <img
                  src={student.avatar}
                  alt={student.name}
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2.5px solid #10B981',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: '#EEF2FF',
                    color: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    fontWeight: 700,
                    border: '2px dashed #C7D2FE',
                  }}
                >
                  {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  {student.name}
                </h1>
                {student.profileStatus === 'Verified' && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                    <ShieldCheck size={13} />
                    100% University Verified
                  </span>
                )}
                {student.avatar && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>
                    <Check size={11} /> 75%+ Face Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>
                B.Tech in {student.branch} • Batch {student.batch} • Reg: <strong>{student.regNo}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Email: {student.email} • Phone: {student.phone || 'Not provided'}
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>Overall Status:</span>
              <Badge variant={student.profileStatus === 'Verified' ? 'success' : student.profileStatus === 'Partial' ? 'warning' : 'gray'}>
                {student.profileStatus}
              </Badge>
            </div>
            <div style={{ fontSize: 13, color: '#374151' }}>
              CGPA: <strong>{Number(student.cgpa).toFixed(2)}</strong> • Backlogs: <strong>{student.backlogs ?? 0}</strong>
            </div>
            {uRec ? (
              <div style={{ fontSize: 11, color: '#059669', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={12} color="#059669" /> Official Registrar match found
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <AlertTriangle size={12} color="#DC2626" /> No registrar baseline record found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Verification Sections List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {SECTIONS.map(sec => {
          const status = student.verificationStatus?.[sec.id] || 'Pending';
          const remark = student.verificationRemarks?.[sec.id];
          const isAutoEnabled = verificationSettings[sec.id] !== false;
          const isAutoVerified = status === 'Verified' && (remark?.toLowerCase().includes('auto') || remark?.toLowerCase().includes('registrar'));
          const isActionRequired = status === 'Action Required' || status === 'Rejected';

          return (
            <div
              key={sec.id}
              style={{
                background: '#fff',
                border: isActionRequired ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
                borderRadius: 8,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}>
                    {sec.label}
                  </h2>
                  <Badge variant={status === 'Verified' ? 'success' : isActionRequired ? 'danger' : 'warning'}>
                    {status}
                  </Badge>

                  {/* Auto-Verified Badge */}
                  {isAutoVerified && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                      <ShieldCheck size={12} />
                      Auto-verified
                    </span>
                  )}
                </div>

                {/* Right controls: Automation Toggle + Manual Overrides */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Automation Toggle per Section */}
                  <button
                    type="button"
                    onClick={() => handleToggleAutomation(sec.id)}
                    title="Toggle automated rule evaluation for this section"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '4px 8px',
                      borderRadius: 4,
                      border: '1px solid #D1D5DB',
                      background: isAutoEnabled ? '#F0FDF4' : '#F9FAFB',
                      color: isAutoEnabled ? '#15803D' : '#6B7280',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isAutoEnabled ? <ToggleRight size={16} color="#16A34A" /> : <ToggleLeft size={16} color="#9CA3AF" />}
                    <span>Auto: {isAutoEnabled ? 'ON' : 'OFF'}</span>
                  </button>

                  {/* Officer Manual Override Controls */}
                  <button
                    disabled={status === 'Verified'}
                    onClick={() => handleVerify(sec.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: status === 'Verified' ? '#F3F4F6' : '#16A34A',
                      color: status === 'Verified' ? '#9CA3AF' : '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: status === 'Verified' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={13} />
                    {status === 'Verified' ? 'Verified' : 'Manual Approve'}
                  </button>
                  <button
                    disabled={status === 'Rejected'}
                    onClick={() => setRejectingSection(sec.id)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#B91C1C',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: status === 'Rejected' ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <X size={13} />
                    Reject / Flag
                  </button>
                </div>
              </div>

              {/* Remarks */}
              {remark && (
                <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 10, padding: '4px 8px', background: '#F8FAFC', borderRadius: 4, borderLeft: '3px solid #2563EB' }}>
                  <strong>Audit Remark:</strong> {remark}
                </div>
              )}

              {/* Field-Level Diff Box if Discrepancy Exists (Phase 1.3) */}
              {sec.id === 'personalInfo' && personalDiffs.length > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991B1B', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                    <AlertTriangle size={15} color="#DC2626" />
                    Field-Level Discrepancy against Official Registrar Record:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12 }}>
                    {personalDiffs.map((d, i) => (
                      <div key={i} style={{ background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #FCA5A5' }}>
                        <div style={{ fontWeight: 600, color: '#374151' }}>{d.field}</div>
                        <div style={{ color: '#DC2626', marginTop: 2 }}>Student: <strong>{d.student}</strong></div>
                        <div style={{ color: '#16A34A', marginTop: 1 }}>Registrar: <strong>{d.registrar}</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {sec.id === 'education' && academicDiffs.length > 0 && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: 12, marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#991B1B', fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
                    <AlertTriangle size={15} color="#DC2626" />
                    Academic Standing Discrepancy (Tolerance 0.01 Exceeded):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8, fontSize: 12 }}>
                    {academicDiffs.map((d, i) => (
                      <div key={i} style={{ background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #FCA5A5' }}>
                        <div style={{ fontWeight: 600, color: '#374151' }}>{d.field}</div>
                        <div style={{ color: '#DC2626', marginTop: 2 }}>Student Claimed: <strong>{d.student}</strong></div>
                        <div style={{ color: '#16A34A', marginTop: 1 }}>Registrar Verified: <strong>{d.registrar}</strong></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section Preview Data */}
              <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 4, padding: 12 }}>
                {sec.id === 'personalInfo' && (
                  <div>
                    <div><strong>Name:</strong> {student.name}</div>
                    <div><strong>Email:</strong> {student.email}</div>
                    <div><strong>Phone:</strong> {student.phone || '-'}</div>
                    <div><strong>Registration Number:</strong> {student.regNo}</div>
                    <div><strong>Date of Birth:</strong> {student.dob || '-'}</div>
                  </div>
                )}

                {sec.id === 'education' && (
                  <div>
                    <div><strong>Degree:</strong> B.Tech in {student.branch} (Batch {student.batch})</div>
                    <div><strong>Cumulative CGPA:</strong> {Number(student.cgpa).toFixed(2)}</div>
                    <div><strong>Active Backlogs:</strong> {student.backlogs ?? 0}</div>
                  </div>
                )}

                {sec.id === 'skills' && (
                  <div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                      {(student.skills || []).map((s, idx) => (
                        <span key={`${s.name}-${idx}`} style={{ background: '#fff', border: '1px solid #D1D5DB', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                          {s.name} (Level {s.level || 3})
                        </span>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: '#6B7280' }}>
                      Skills backed by accredited certificates are eligible for instant auto-verification.
                    </div>
                  </div>
                )}

                {sec.id === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(student.projects || []).map((p, i) => (
                      <div key={i} style={{ background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>{p.title}</strong>
                          {p.isGithub && (
                            <span style={{ fontSize: 10, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Check size={11} color="#059669" /> GitHub Verified
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#4B5563', marginTop: 2 }}>{p.description}</div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                          Tech: {(Array.isArray(p.technologies) ? p.technologies : typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()) : []).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sec.id === 'experience' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {(student.experience || []).length === 0 ? (
                      <div style={{ padding: '20px 14px', background: '#F8FAFC', borderRadius: 6, border: '1px dashed #E2E8F0', color: '#9CA3AF', fontSize: 13, textAlign: 'center' }}>
                        No formal internship records added by student.
                      </div>
                    ) : (
                      student.experience.map((e, i) => {
                        const docs = e.documents || {};
                        const uploadedDocsCount = Object.values(docs).filter(Boolean).length;
                        const skills = Array.isArray(e.skills) && e.skills.length > 0
                          ? e.skills
                          : (e.skillsUsed ? e.skillsUsed.split(',').map(s => s.trim()).filter(Boolean) : []);

                        return (
                          <div key={i} style={{ background: '#fff', padding: 14, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: 15, color: '#0F172A' }}>{e.role}</strong>
                                  <span style={{ color: '#64748B' }}>at</span>
                                  <strong style={{ color: '#2563EB', fontSize: 15 }}>{e.company}</strong>
                                  {e.companyWebsite && (
                                    <a
                                      href={e.companyWebsite.startsWith('http') ? e.companyWebsite : `https://${e.companyWebsite}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{ color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 12, textDecoration: 'none' }}
                                    >
                                      <Globe size={13} /> {e.companyWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                                    </a>
                                  )}
                                </div>
                                <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                                  Tenure: <strong>{e.duration || `${e.startDate || ''} - ${e.endDate || 'Present'}`}</strong>
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                {e.type && (
                                  <span style={{ padding: '3px 8px', borderRadius: 9999, background: '#EFF6FF', color: '#1E40AF', fontSize: 11, fontWeight: 600, border: '1px solid #BFDBFE' }}>
                                    {e.type}
                                  </span>
                                )}
                                {e.stipend && (
                                  <span style={{ padding: '3px 8px', borderRadius: 9999, background: e.stipend === 'Unpaid' ? '#F1F5F9' : '#ECFDF5', color: e.stipend === 'Unpaid' ? '#475569' : '#065F46', fontSize: 11, fontWeight: 600, border: `1px solid ${e.stipend === 'Unpaid' ? '#E2E8F0' : '#A7F3D0'}` }}>
                                    {e.stipend}{e.stipendAmount ? ` (${e.stipendAmount})` : ''}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Point of Contact: Supervisor & HR */}
                            {(e.supervisorName || e.supervisorEmail || e.hrContact) && (
                              <div style={{ fontSize: 12, color: '#334155', background: '#F8FAFC', padding: '8px 12px', borderRadius: 6, margin: '8px 0', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
                                {e.supervisorName && (
                                  <div>
                                    <span style={{ color: '#64748B' }}>Supervisor: </span>
                                    <strong style={{ color: '#0F172A' }}>{e.supervisorName}</strong>
                                  </div>
                                )}
                                {e.supervisorEmail && (
                                  <div>
                                    <span style={{ color: '#64748B' }}>Supervisor Email: </span>
                                    <a href={`mailto:${e.supervisorEmail}`} style={{ color: '#2563EB', textDecoration: 'none' }}>{e.supervisorEmail}</a>
                                  </div>
                                )}
                                {e.hrContact && (
                                  <div>
                                    <span style={{ color: '#64748B' }}>HR Contact: </span>
                                    <span style={{ color: '#0F172A' }}>{e.hrContact}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Project details */}
                            {(e.projectDetails || e.description) && (
                              <div style={{ fontSize: 13, color: '#334155', margin: '8px 0', lineHeight: 1.5 }}>
                                <strong style={{ color: '#0F172A', display: 'block', fontSize: 12, marginBottom: 2 }}>Work & Project Scope:</strong>
                                {e.projectDetails || e.description}
                              </div>
                            )}

                            {/* Skills Used */}
                            {skills.length > 0 && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', margin: '8px 0' }}>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>Skills:</span>
                                {skills.map(sk => (
                                  <span key={sk} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0' }}>
                                    {sk}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Official Verification Documents */}
                            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #E2E8F0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  Verified Documents ({uploadedDocsCount}/5):
                                </span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {docs.offerLetter ? (
                                  <a href={docs.offerLetter.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                    <FileText size={13} color="#2563EB" /> Offer Letter
                                  </a>
                                ) : (
                                  <span style={{ padding: '5px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11 }}>
                                    Offer Letter: Missing
                                  </span>
                                )}

                                {docs.completionCert ? (
                                  <a href={docs.completionCert.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                    <Award size={13} color="#2563EB" /> Completion Certificate
                                  </a>
                                ) : (
                                  <span style={{ padding: '5px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11 }}>
                                    Completion Cert: Missing
                                  </span>
                                )}

                                {docs.experienceLetter ? (
                                  <a href={docs.experienceLetter.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                    <Briefcase size={13} color="#2563EB" /> Experience Letter
                                  </a>
                                ) : (
                                  <span style={{ padding: '5px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11 }}>
                                    Experience Letter: Missing
                                  </span>
                                )}

                                {docs.projectReport ? (
                                  <a href={docs.projectReport.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                    <FileBarChart size={13} color="#2563EB" /> Project Report
                                  </a>
                                ) : (
                                  <span style={{ padding: '5px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11 }}>
                                    Project Report: Missing
                                  </span>
                                )}

                                {docs.hrEmailProof ? (
                                  <a href={docs.hrEmailProof.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                    <Mail size={13} color="#2563EB" /> HR/Supervisor Email Proof
                                  </a>
                                ) : (
                                  <span style={{ padding: '5px 10px', borderRadius: 6, background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#94A3B8', fontSize: 11 }}>
                                    Email Proof: Missing
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Uploaded Certificates List */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
          Verified Credentials ({studentCerts.length})
        </h2>
        {studentCerts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>No certificates uploaded by student.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
            {studentCerts.map(c => (
              <div key={c.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 12, background: '#F9FAFB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{c.title}</div>
                  <Badge variant={c.status === 'Valid' ? 'success' : 'danger'}>{c.status}</Badge>
                </div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Issuer: {c.issuer}</div>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                  Issued: {c.issueDate} • Expires: {c.expiryDate || 'Lifetime'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingSection && (
        <Modal
          isOpen={Boolean(rejectingSection)}
          title={`Reject Section: ${SECTIONS.find(s => s.id === rejectingSection)?.label}`}
          onClose={() => setRejectingSection(null)}
        >
          <form onSubmit={handleRejectSubmit}>
            <FormField label="Reason for rejection / Exception note" required>
              <textarea
                rows={4}
                required
                value={rejectRemark}
                onChange={e => setRejectRemark(e.target.value)}
                placeholder="State the discrepancy or missing credential (e.g. CGPA does not match official grade card)..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button
                type="button"
                onClick={() => setRejectingSection(null)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 12, cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Rejection & Alert Student
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
