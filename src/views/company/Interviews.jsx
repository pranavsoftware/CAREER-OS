import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Video, Calendar, Clock, Plus, CheckCircle2,
  Copy, Check
} from 'lucide-react';

export default function CompanyInterviews() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const myCompany = user?.company || 'Demo Company';
  const { students, jobs, interviews = [] } = state;

  // Filter interviews relevant to this company or recruiter
  const companyInterviews = interviews.filter(
    i => i.company?.toLowerCase() === myCompany.toLowerCase() || i.recruiterName === user?.name || user?.role === 'company'
  );

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'scheduled' | 'completed'
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [inlineMsg, setInlineMsg] = useState(null);

  // New Interview Form State
  const [formData, setFormData] = useState(() => ({
    studentId: students[0]?.id || '',
    jobId: jobs[0]?.id || '',
    type: 'Technical & Coding Round',
    date: new Date().toISOString().split('T')[0],
    time: '14:30',
    duration: 45,
    notes: 'Please be ready with your development environment. Focus on data structures, algorithmic problem solving, and project walkthrough.',
  }));

  const filteredInterviews = companyInterviews.filter(i => {
    if (activeTab === 'scheduled') return i.status === 'Scheduled';
    if (activeTab === 'completed') return i.status === 'Completed';
    return true;
  });

  const scheduledCount = companyInterviews.filter(i => i.status === 'Scheduled').length;
  const completedCount = companyInterviews.filter(i => i.status === 'Completed').length;

  function handleCopyLink(meetingId) {
    const fullUrl = `${window.location.origin}/interview-room/${meetingId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleScheduleSubmit(e) {
    e.preventDefault();
    const targetStudent = students.find(s => s.id === formData.studentId);
    const targetJob = jobs.find(j => j.id === formData.jobId);

    const meetingId = `room-${Date.now().toString(36)}`;
    const newInterview = {
      id: `int_${Date.now()}`,
      meetingId,
      jobId: targetJob?.id || 'j1',
      company: myCompany,
      role: targetJob?.title || 'Software Development Engineer',
      studentId: targetStudent?.id,
      studentName: targetStudent?.name,
      studentEmail: targetStudent?.email,
      studentBranch: targetStudent?.branch,
      studentCgpa: targetStudent?.cgpa,
      date: formData.date,
      time: formData.time,
      duration: Number(formData.duration),
      type: formData.type,
      status: 'Scheduled',
      notes: formData.notes,
      recruiterName: user?.name || 'Talent Acquisition Team',
      evaluation: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SCHEDULE_INTERVIEW', payload: newInterview });

    // Also update pipeline stage for this student to 'Interview Scheduled'
    if (targetJob) {
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: { jobId: targetJob.id, studentId: targetStudent?.id, stage: 'Interview Scheduled' },
      });
    }

    setShowScheduleModal(false);
    setInlineMsg({
      type: 'success',
      text: `Online interview scheduled with ${targetStudent?.name} for ${formData.date} at ${formData.time}! Meeting link generated.`,
    });
  }

  return (
    <Layout title="Online Video Interviews & Assessments">
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* Top Header & Scheduling Action */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Online Video Interview Management
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
              Schedule live 1-on-1 video interviews, evaluate technical competencies, and share join links with candidates.
            </p>
          </div>

          <button
            onClick={() => setShowScheduleModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: 8,
              background: '#4F46E5',
              color: '#fff',
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(79,70,229,0.25)',
            }}
          >
            <Plus size={16} /> Schedule Video Interview
          </button>
        </div>

        {/* Inline Feedback Alert */}
        {inlineMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 8,
              background: inlineMsg.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              border: `1px solid ${inlineMsg.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
              color: inlineMsg.type === 'success' ? '#065F46' : '#991B1B',
              fontSize: 13,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} />
              <span>{inlineMsg.text}</span>
            </div>
            <button
              onClick={() => setInlineMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          <div style={{ background: '#fff', padding: '16px', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Total Interviews</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', marginTop: 4 }}>{companyInterviews.length}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>Scheduled / Upcoming</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#4F46E5', marginTop: 4 }}>{scheduledCount}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>Completed Rounds</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#059669', marginTop: 4 }}>{completedCount}</div>
          </div>
          <div style={{ background: '#fff', padding: '16px', borderRadius: 10, border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Active Recruiter Mode</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginTop: 8 }}>WebRTC HD Live Call</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid #E5E7EB', marginBottom: 20 }}>
          {[
            { id: 'all', label: `All Calls (${companyInterviews.length})` },
            { id: 'scheduled', label: `Scheduled (${scheduledCount})` },
            { id: 'completed', label: `Completed (${completedCount})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.id ? 700 : 500,
                color: activeTab === tab.id ? '#4F46E5' : '#6B7280',
                borderBottom: activeTab === tab.id ? '2px solid #4F46E5' : '2px solid transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Interviews List */}
        {filteredInterviews.length === 0 ? (
          <div style={{ background: '#fff', padding: '48px 24px', borderRadius: 12, border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Video size={40} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>No interviews found</div>
            <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 400, margin: '6px auto 18px' }}>
              No video calls match the selected filter. Click below to schedule a new technical round with a student.
            </p>
            <button
              onClick={() => setShowScheduleModal(true)}
              style={{
                padding: '8px 18px',
                borderRadius: 6,
                background: '#4F46E5',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Schedule Interview
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filteredInterviews.map((item) => {
              const isCompleted = item.status === 'Completed';
              const isScheduled = item.status === 'Scheduled';

              return (
                <div
                  key={item.id}
                  style={{
                    background: '#fff',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    
                    {/* Left: Student & Role Info */}
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 16,
                          flexShrink: 0,
                        }}
                      >
                        {item.studentName?.charAt(0) || 'S'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{item.studentName}</span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>• {item.studentBranch || 'CSE'} (CGPA {item.studentCgpa || '8.4'})</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 2 }}>
                          {item.role} • <span style={{ color: '#374151' }}>{item.type}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
                          Candidate Email: <span style={{ color: '#111827' }}>{item.studentEmail}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Status badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {isScheduled && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 9999, background: '#EFF6FF', color: '#2563EB', fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563EB', display: 'inline-block' }} />
                          Scheduled
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 9999, background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700 }}>
                          <CheckCircle2 size={13} /> Completed
                        </span>
                      )}
                      {item.status === 'Cancelled' && (
                        <Badge variant="danger">Cancelled</Badge>
                      )}
                    </div>
                  </div>

                  {/* Date, Time, Duration & Instructions */}
                  <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                      <Calendar size={15} color="#6B7280" />
                      <strong>Date:</strong> {item.date}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                      <Clock size={15} color="#6B7280" />
                      <strong>Time:</strong> {item.time} ({item.duration} mins)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                      <strong>Room ID:</strong> <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4, color: '#111827' }}>{item.meetingId}</code>
                    </div>
                  </div>

                  {item.notes && (
                    <div style={{ fontSize: 12, color: '#6B7280', fontStyle: 'italic', borderLeft: '3px solid #E5E7EB', paddingLeft: 10 }}>
                      "{item.notes}"
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                    
                    {/* Copy Link Button */}
                    <button
                      onClick={() => handleCopyLink(item.meetingId)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: '#F3F4F6',
                        border: '1px solid #E5E7EB',
                        borderRadius: 6,
                        padding: '6px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        cursor: 'pointer',
                        color: '#374151',
                      }}
                    >
                      {copiedId === item.meetingId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                      {copiedId === item.meetingId ? 'Invite Link Copied!' : 'Copy Candidate Invite Link'}
                    </button>

                    {/* Primary Video Call Action */}
                    <div style={{ display: 'flex', gap: 10 }}>
                      {isCompleted && item.evaluation && (
                        <button
                          onClick={() => setSelectedEvaluation(item)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 6,
                            border: '1px solid #D1D5DB',
                            background: '#fff',
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#374151',
                            cursor: 'pointer',
                          }}
                        >
                          View Scorecard ({item.evaluation.technicalScore || '4.5'}★)
                        </button>
                      )}

                      <Link
                        to={`/interview-room/${item.meetingId}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '7px 18px',
                          borderRadius: 6,
                          background: isCompleted ? '#374151' : '#4F46E5',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 600,
                          textDecoration: 'none',
                          boxShadow: isCompleted ? 'none' : '0 2px 8px rgba(79,70,229,0.3)',
                        }}
                      >
                        <Video size={15} />
                        {isCompleted ? 'Reopen Meeting Room' : 'Start Video Call Now'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── SCHEDULE INTERVIEW MODAL ─── */}
        {showScheduleModal && (
          <Modal title="Schedule 1-on-1 Online Video Interview" onClose={() => setShowScheduleModal(false)}>
            <form onSubmit={handleScheduleSubmit}>
              
              {/* Candidate Picker */}
              <FormField label="Select Candidate" required>
                <select
                  required
                  value={formData.studentId}
                  onChange={e => setFormData({ ...formData, studentId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.branch} • CGPA: {s.cgpa} • Reg: {s.regNo})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Job / Role Picker */}
              <FormField label="Associated Job Posting" required>
                <select
                  required
                  value={formData.jobId}
                  onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                >
                  {jobs.map(j => (
                    <option key={j.id} value={j.id}>
                      {j.title} ({j.company})
                    </option>
                  ))}
                </select>
              </FormField>

              {/* Interview Round Type */}
              <FormField label="Interview Round Type" required>
                <select
                  required
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                >
                  <option value="Technical & Coding Round">Technical & Coding Round</option>
                  <option value="System Design & Architecture">System Design & Architecture</option>
                  <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                  <option value="HR & Cultural Alignment">HR & Cultural Alignment</option>
                  <option value="Final Partner Round">Final Partner Round</option>
                </select>
              </FormField>

              {/* Date, Time & Duration Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <FormField label="Date" required>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </FormField>

                <FormField label="Time" required>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </FormField>

                <FormField label="Duration" required>
                  <select
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  >
                    <option value={15}>15 mins</option>
                    <option value={30}>30 mins</option>
                    <option value={45}>45 mins</option>
                    <option value={60}>60 mins</option>
                  </select>
                </FormField>
              </div>

              {/* Recruiter Notes / Instructions */}
              <FormField label="Instructions & Preparation Notes for Student">
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Specify topics, coding environments, or project topics to prepare..."
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                />
              </FormField>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#4F46E5',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Confirm & Schedule Call
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* ─── EVALUATION SCORECARD MODAL ─── */}
        {selectedEvaluation && (
          <Modal title={`Interview Evaluation: ${selectedEvaluation.studentName}`} onClose={() => setSelectedEvaluation(null)}>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#F9FAFB', padding: '12px', borderRadius: 8 }}>
                <div><strong>Role:</strong> {selectedEvaluation.role}</div>
                <div><strong>Round:</strong> {selectedEvaluation.type}</div>
                <div><strong>Date Conducted:</strong> {selectedEvaluation.date}</div>
              </div>

              {selectedEvaluation.evaluation && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                    <div style={{ background: '#EEF2FF', padding: '10px', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 700 }}>TECHNICAL PROFICIENCY</span>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#1E1B4B', marginTop: 2 }}>
                        {selectedEvaluation.evaluation.technicalScore || 4.5} / 5.0
                      </div>
                    </div>
                    <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: 8 }}>
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>PROBLEM SOLVING</span>
                      <div style={{ fontSize: 18, fontWeight: 800, color: '#064E3B', marginTop: 2 }}>
                        {selectedEvaluation.evaluation.problemSolvingScore || 5.0} / 5.0
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <strong>Final Hiring Recommendation:</strong>
                    <div style={{ display: 'inline-block', marginLeft: 8, padding: '3px 10px', borderRadius: 9999, background: '#ECFDF5', color: '#059669', fontWeight: 700 }}>
                      {selectedEvaluation.evaluation.recommendation || 'Strong Hire'}
                    </div>
                  </div>

                  <div>
                    <strong>Recruiter Feedback & Transcript Notes:</strong>
                    <p style={{ marginTop: 4, padding: '10px', background: '#F3F4F6', borderRadius: 6, color: '#374151', lineHeight: 1.5 }}>
                      {selectedEvaluation.evaluation.notes}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  onClick={() => setSelectedEvaluation(null)}
                  style={{ padding: '6px 14px', borderRadius: 6, background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </Layout>
  );
}
