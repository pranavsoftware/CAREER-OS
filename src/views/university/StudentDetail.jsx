'use client';

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { ShieldCheck, AlertTriangle, ToggleLeft, ToggleRight, Check, X, Award, GitBranch } from 'lucide-react';

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                {student.name}
              </h1>
              {student.profileStatus === 'Verified' && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '2px 8px', borderRadius: 9999, fontSize: 11, fontWeight: 700 }}>
                  <ShieldCheck size={13} />
                  100% University Verified
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
              <div style={{ fontSize: 11, color: '#059669', marginTop: 4 }}>
                ✓ Official Registrar match found
              </div>
            ) : (
              <div style={{ fontSize: 11, color: '#DC2626', marginTop: 4 }}>
                ⚠ No registrar baseline record found
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
                    <div><strong>Phone:</strong> {student.phone || '—'}</div>
                    <div><strong>Registration Number:</strong> {student.regNo}</div>
                    <div><strong>Date of Birth:</strong> {student.dob || '—'}</div>
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
                            <span style={{ fontSize: 10, color: '#059669', background: '#ECFDF5', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                              ✓ GitHub Verified
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(student.experience || []).length === 0 ? (
                      <span style={{ color: '#9CA3AF' }}>No formal internship records added.</span>
                    ) : (
                      student.experience.map((e, i) => (
                        <div key={i} style={{ background: '#fff', padding: 8, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                          <strong>{e.role}</strong> at {e.company} ({e.duration}): {e.description}
                        </div>
                      ))
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
