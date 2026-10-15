import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Star } from 'lucide-react';

export default function CompanyCandidateDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const myCompany = user?.company || 'Infosys';
  const student = state.students.find(s => s.id === id);
  const studentCerts = state.certificates.filter(c => c.studentId === id && c.status === 'Valid');

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
      { text: noteText.trim(), date: new Date().toLocaleDateString(), author: user.name || 'HR Recruiter' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: '#111827' }}>
              {student.name}
            </h1>
            <div style={{ fontSize: 13, color: '#4B5563' }}>
              {student.degree} in {student.branch} • Reg: {student.regNo} • CGPA: <strong>{student.cgpa}</strong>
            </div>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
              Email: {student.email} • Phone: {student.phone}
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
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid #F3F4F6', paddingBottom: 6 }}>
                    <div>
                      <strong>{c.title}</strong> — {c.issuer}
                    </div>
                    <span style={{ color: '#6B7280' }}>Issued: {c.issueDate}</span>
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
                  <strong>Prior Experience:</strong> {student.experience[0].role} at {student.experience[0].company}
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
