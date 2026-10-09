import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';

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

  const student = state.students.find(s => s.id === id);
  const studentCerts = state.certificates.filter(c => c.studentId === id);

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
        remark: 'Approved by Placement Cell',
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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {student.name}
            </h1>
            <div style={{ fontSize: 13, color: '#4B5563' }}>
              {student.degree} in {student.branch} • Batch {student.batch} • Reg: {student.regNo}
            </div>
            <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
              Email: {student.email} • Phone: {student.phone}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: '#6B7280', marginRight: 8 }}>Overall Status:</span>
              <Badge variant={student.profileStatus === 'Verified' ? 'success' : student.profileStatus === 'Partial' ? 'warning' : 'gray'}>
                {student.profileStatus}
              </Badge>
            </div>
            <div style={{ fontSize: 13 }}>
              CGPA: <strong>{student.cgpa}</strong> • Backlogs: <strong>{student.backlogs}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Sections List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {SECTIONS.map(sec => {
          const status = student.verificationStatus?.[sec.id] || 'Pending';
          const remark = student.verificationRemarks?.[sec.id];

          return (
            <div
              key={sec.id}
              style={{
                background: '#fff',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                padding: 16,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#111827' }}>
                    {sec.label}
                  </h2>
                  <Badge variant={status === 'Verified' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'}>
                    {status}
                  </Badge>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    disabled={status === 'Verified'}
                    onClick={() => handleVerify(sec.id)}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 6,
                      border: 'none',
                      background: status === 'Verified' ? '#F3F4F6' : '#16A34A',
                      color: status === 'Verified' ? '#9CA3AF' : '#fff',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: status === 'Verified' ? 'default' : 'pointer',
                    }}
                  >
                    {status === 'Verified' ? 'Verified' : 'Verify Section'}
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
                      fontWeight: 500,
                      cursor: status === 'Rejected' ? 'default' : 'pointer',
                    }}
                  >
                    Reject with remark
                  </button>
                </div>
              </div>

              {remark && (
                <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', marginBottom: 10 }}>
                  Admin Remark: {remark}
                </div>
              )}

              {/* Section Preview Data */}
              <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', border: '1px solid #F3F4F6', borderRadius: 4, padding: 12 }}>
                {sec.id === 'personalInfo' && (
                  <div>
                    <div>Name: {student.name}</div>
                    <div>Email: {student.email}</div>
                    <div>Phone: {student.phone}</div>
                    <div>LinkedIn: {student.links?.linkedin || 'None'}</div>
                    <div>GitHub: {student.links?.github || 'None'}</div>
                  </div>
                )}

                {sec.id === 'education' && (
                  <div>
                    <div>Degree: {student.degree} in {student.branch} (CGPA: {student.cgpa})</div>
                    {student.education && (
                      <div style={{ marginTop: 4 }}>
                        <div>12th: {student.education.twelfthPercent}% ({student.education.twelfthSchool})</div>
                        <div>10th: {student.education.tenthPercent}%</div>
                      </div>
                    )}
                  </div>
                )}

                {sec.id === 'skills' && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(student.skills || []).map(s => (
                      <span key={s.name} style={{ background: '#fff', border: '1px solid #D1D5DB', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        {s.name} (Level {s.level || 3})
                      </span>
                    ))}
                  </div>
                )}

                {sec.id === 'projects' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(student.projects || []).map((p, i) => (
                      <div key={i}>
                        <strong>{p.title}</strong>: {p.description} (Tech: {(p.technologies || []).join(', ')})
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
                        <div key={i}>
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
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600, color: '#111827' }}>
          Uploaded Certificates ({studentCerts.length})
        </h2>
        {studentCerts.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: '#9CA3AF' }}>No certificates uploaded by student.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {studentCerts.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.title}</div>
                  <div style={{ fontSize: 11, color: '#6B7280' }}>{c.issuer} • Issued {c.issueDate} {c.expiryDate ? `• Expires ${c.expiryDate}` : ''}</div>
                </div>
                <Badge variant={c.status === 'Valid' ? 'success' : c.status === 'Expiring soon' ? 'warning' : 'danger'}>
                  {c.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingSection && (
        <Modal title={`Reject Section: ${rejectingSection}`} onClose={() => setRejectingSection(null)}>
          <form onSubmit={handleRejectSubmit}>
            <FormField label="Reason / Remark for Student" required>
              <textarea
                rows={3}
                required
                value={rejectRemark}
                onChange={e => setRejectRemark(e.target.value)}
                placeholder="Explain what needs to be corrected or verified..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setRejectingSection(null)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
