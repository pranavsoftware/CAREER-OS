import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Star,
  Briefcase,
  Globe,
  ExternalLink,
  FileText,
  Award,
  FileBarChart,
  Mail,
  CheckCircle2,
  Building,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function CompanyCandidateDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const myCompany = user?.company || 'Infosys';
  const student = state.students.find(s => s.id === id);
  const studentCerts = (state.certificates || []).filter(c =>
    (c.studentId === id || c.student_id === id) &&
    (c.trust_level === 'Issuer Verified' || c.trust_level === 'Placement Cell Verified' || c.trustLevel === 'Issuer Verified' || c.trustLevel === 'Placement Cell Verified' || c.verified === true)
  );

  // Find job associated with this company
  const myJob = state.jobs.find(j => j.company === myCompany) || state.jobs[0];

  // Pipeline stage for this candidate
  const currentStage = (myJob && state.pipeline[myJob.id]?.[id]) || 'Shortlisted';

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [candidateNotes, setCandidateNotes] = useState([]);
  const [inlineMsg, setInlineMsg] = useState(null);

  if (!student) {
    return (
      <Layout title="Candidate Detail">
        <p>Candidate not found.</p>
        <Link to="/company/candidates" style={{ color: '#2563EB' }}>Back to candidates</Link>
      </Layout>
    );
  }

  function handleShortlist() {
    if (!myJob) return;
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { jobId: myJob.id, studentId: student.id, stage: 'Interview Scheduled' },
    });
    setInlineMsg({ type: 'success', text: `${student.name} moved to "Interview Scheduled".` });
  }

  function handleReject() {
    if (!myJob) return;
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { jobId: myJob.id, studentId: student.id, stage: 'Rejected' },
    });
    setInlineMsg({ type: 'error', text: `${student.name} moved to "Rejected".` });
  }

  function handleAddNote(e) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setCandidateNotes([
      ...candidateNotes,
      { text: noteText.trim(), date: new Date().toLocaleDateString(), author: user?.name || 'HR Recruiter' },
    ]);
    setNoteText('');
    setShowNoteModal(false);
    setInlineMsg({ type: 'success', text: 'Recruiter note added.' });
  }

  return (
    <Layout title={`Candidate Dossier: ${student.name}`}>
      {/* Back link */}
      <div style={{ marginBottom: 16 }}>
        <Link to="/company/candidates" style={{ fontSize: 13, color: '#2563EB', textDecoration: 'none' }}>
          ← Back to Candidates Directory
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

      {/* Header Profile Summary */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Candidate Photo */}
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
                  {student.name ? student.name.charAt(0).toUpperCase() : 'C'}
                </div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                  {student.name}
                </h1>
                {student.avatar && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F0FDF4', color: '#16A34A', border: '1px solid #BBF7D0', padding: '2px 8px', borderRadius: 9999, fontSize: 10, fontWeight: 700 }}>
                    <Check size={11} /> 75%+ Face Verified
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: '#4B5563', marginTop: 4 }}>
                {student.degree} in {student.branch} • Reg: {student.regNo} • CGPA: <strong>{student.cgpa}</strong>
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                Email: {student.email} • Phone: {student.phone}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <Badge variant="success">University Verified</Badge>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleShortlist}
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
                Advance to Interview
              </button>
              <Link
                to="/company/interviews"
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#4F46E5',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                Schedule Video Call
              </Link>
              <button
                onClick={handleReject}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #FCA5A5',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Reject
              </button>
              <button
                onClick={() => setShowNoteModal(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  background: '#fff',
                  color: '#374151',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Add note
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column details: Skills/Projects vs Notes/Resume */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Column: Technical Skills, Projects, Certs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Skills */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Technical Competencies
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(student.skills || []).map(sk => (
                <span
                  key={sk.name}
                  style={{
                    fontSize: 12,
                    padding: '3px 8px',
                    borderRadius: 4,
                    background: '#EFF6FF',
                    color: '#1E40AF',
                    border: '1px solid #BFDBFE',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span>{sk.name} (Lvl {sk.level || 3})</span>
                  {sk.source === 'certificate' && <Star size={11} fill="#F59E0B" color="#F59E0B" />}
                </span>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Academic & Capstone Projects
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(student.projects || []).map(p => (
                <div key={p.id} style={{ border: '1px solid #E5E7EB', borderRadius: 6, padding: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#111827', marginBottom: 2 }}>
                    {p.title}
                  </div>
                  <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 6 }}>
                    {p.description}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(Array.isArray(p.technologies) ? p.technologies : typeof p.technologies === 'string' ? p.technologies.split(',').map(s => s.trim()).filter(Boolean) : []).map((t, idx) => (
                      <span key={`${t}-${idx}`} style={{ fontSize: 11, background: '#F3F4F6', color: '#374151', padding: '1px 6px', borderRadius: 4 }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Verified Internships & Professional Experience */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Briefcase size={16} color="#2563EB" />
                Verified Internships & Work Experience ({(student.experience || []).length})
              </h2>
            </div>

            {(student.experience || []).length === 0 ? (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>No formal internship records uploaded by candidate.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {student.experience.map((e, idx) => {
                  const docs = e.documents || {};
                  const skills = Array.isArray(e.skills) && e.skills.length > 0
                    ? e.skills
                    : (e.skillsUsed ? e.skillsUsed.split(',').map(s => s.trim()).filter(Boolean) : []);
                  const uploadedDocsCount = Object.values(docs).filter(Boolean).length;

                  return (
                    <div
                      key={e.id || idx}
                      style={{
                        background: '#FAFCFF',
                        border: '1px solid #E2E8F0',
                        borderRadius: 6,
                        padding: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 14, color: '#0F172A' }}>{e.role}</strong>
                            <span style={{ color: '#64748B' }}>at</span>
                            <strong style={{ color: '#2563EB', fontSize: 14 }}>{e.company}</strong>
                            {e.companyWebsite && (
                              <a
                                href={e.companyWebsite.startsWith('http') ? e.companyWebsite : `https://${e.companyWebsite}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: '#64748B', display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, textDecoration: 'none' }}
                              >
                                <Globe size={11} /> {e.companyWebsite.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                              </a>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                            Tenure: <strong>{e.duration || `${e.startDate || ''} - ${e.endDate || 'Present'}`}</strong>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                          {e.type && (
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#1E40AF', fontSize: 10, fontWeight: 600, border: '1px solid #BFDBFE' }}>
                              {e.type}
                            </span>
                          )}
                          {e.stipend && (
                            <span style={{ padding: '2px 6px', borderRadius: 4, background: e.stipend === 'Unpaid' ? '#F1F5F9' : '#ECFDF5', color: e.stipend === 'Unpaid' ? '#475569' : '#065F46', fontSize: 10, fontWeight: 600, border: `1px solid ${e.stipend === 'Unpaid' ? '#E2E8F0' : '#A7F3D0'}` }}>
                              {e.stipend}{e.stipendAmount ? ` (${e.stipendAmount})` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Supervisor reference */}
                      {(e.supervisorName || e.supervisorEmail || e.hrContact) && (
                        <div style={{ background: '#FFFFFF', padding: '6px 10px', borderRadius: 4, border: '1px solid #E2E8F0', fontSize: 11, color: '#475569', margin: '6px 0', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {e.supervisorName && <span>Supervisor: <strong style={{ color: '#0F172A' }}>{e.supervisorName}</strong></span>}
                          {e.supervisorEmail && <span>Email: <a href={`mailto:${e.supervisorEmail}`} style={{ color: '#2563EB' }}>{e.supervisorEmail}</a></span>}
                          {e.hrContact && <span>HR: <strong>{e.hrContact}</strong></span>}
                        </div>
                      )}

                      {/* Work Details */}
                      {(e.projectDetails || e.description) && (
                        <div style={{ fontSize: 12, color: '#334155', margin: '6px 0', lineHeight: 1.4 }}>
                          <strong style={{ color: '#0F172A', display: 'block', fontSize: 11, marginBottom: 1 }}>Project & Deliverables:</strong>
                          {e.projectDetails || e.description}
                        </div>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', margin: '6px 0' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>Skills:</span>
                          {skills.map(sk => (
                            <span key={sk} style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0' }}>
                              {sk}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Official Documents */}
                      {uploadedDocsCount > 0 && (
                        <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #CBD5E1' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>
                            Verified Documentation ({uploadedDocsCount}/5):
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {docs.offerLetter && (
                              <a href={docs.offerLetter.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                <FileText size={12} color="#2563EB" /> Offer Letter
                              </a>
                            )}
                            {docs.completionCert && (
                              <a href={docs.completionCert.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                <Award size={12} color="#2563EB" /> Completion Cert
                              </a>
                            )}
                            {docs.experienceLetter && (
                              <a href={docs.experienceLetter.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                <Briefcase size={12} color="#2563EB" /> Experience Letter
                              </a>
                            )}
                            {docs.projectReport && (
                              <a href={docs.projectReport.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                <FileBarChart size={12} color="#2563EB" /> Project Report
                              </a>
                            )}
                            {docs.hrEmailProof && (
                              <a href={docs.hrEmailProof.url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 11, fontWeight: 600, textDecoration: 'none' }}>
                                <Mail size={12} color="#2563EB" /> HR Email Proof
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Certifications */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Verified Certifications ({studentCerts.length})
            </h2>
            {studentCerts.length === 0 ? (
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>No certificates registered.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {studentCerts.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                    <div>
                      <strong>{c.title}</strong> - {c.issuer}
                      <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 4, background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', fontSize: 10, fontWeight: 600 }}>
                        {c.trust_level || 'Verified'}
                      </span>
                    </div>
                    <span style={{ color: '#6B7280' }}>Issued: {c.issue_date || c.issueDate}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recruiter Notes & Resume Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Notes */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
                Recruiter Evaluation Notes
              </h2>
              <button
                onClick={() => setShowNoteModal(true)}
                style={{ fontSize: 12, color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                + Add
              </button>
            </div>

            {candidateNotes.length === 0 ? (
              <div style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>
                No evaluation notes yet. Click "+ Add" to log recruiter feedback.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidateNotes.map((n, i) => (
                  <div key={i} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 6, padding: 10, fontSize: 12 }}>
                    <div style={{ color: '#374151', marginBottom: 4 }}>{n.text}</div>
                    <div style={{ fontSize: 10, color: '#9CA3AF' }}>{n.author} • {n.date}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Resume Snapshot */}
          <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16 }}>
            <h2 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
              Resume Summary Snapshot
            </h2>
            <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.6 }}>
              <div><strong>Education:</strong> {student.degree} in {student.branch}, VIT (Batch {student.batch})</div>
              <div><strong>CGPA:</strong> {student.cgpa} / 10.0 (Backlogs: {student.backlogs})</div>
              {student.experience && student.experience.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <strong>Prior Experience:</strong> {student.experience[0].role} at {student.experience[0].company} ({student.experience[0].type || 'Internship'})
                  {Object.values(student.experience[0].documents || {}).some(Boolean) && (
                    <span style={{ marginLeft: 6, fontSize: 10, padding: '1px 6px', background: '#ECFDF5', color: '#065F46', borderRadius: 4, border: '1px solid #A7F3D0', fontWeight: 600 }}>
                      Verified Documents Attached
                    </span>
                  )}
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                {student.links?.github && <div>GitHub: <a href={student.links.github} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{student.links.github}</a></div>}
                {student.links?.linkedin && <div>LinkedIn: <a href={student.links.linkedin} target="_blank" rel="noreferrer" style={{ color: '#2563EB' }}>{student.links.linkedin}</a></div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <Modal title={`Add Recruiter Note: ${student.name}`} onClose={() => setShowNoteModal(false)}>
          <form onSubmit={handleAddNote}>
            <FormField label="Evaluation Feedback" required>
              <textarea
                rows={4}
                required
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Log interview performance, coding round score, or candidate suitability..."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowNoteModal(false)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Save note
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
