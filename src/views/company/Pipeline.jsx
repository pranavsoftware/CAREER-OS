import { useState } from 'react';
import Layout from '../../components/Layout';
import KanbanBoard from '../../components/KanbanBoard';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import Badge from '../../components/Badge';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const PIPELINE_STAGES = [
  'Shortlisted',
  'Interview Scheduled',
  'Selected',
  'Offer Sent',
  'Rejected',
];

const COLUMNS = PIPELINE_STAGES.map(s => ({ id: s, title: s }));

export default function CompanyPipeline() {
  const { user } = useAuth();
  const { state, dispatch } = useData();
  const { students, jobs, applications, pipeline, jobShortlists = [] } = state;

  const myCompany = user?.company || 'Infosys';
  const myJobs = jobs.filter(j => j.company === myCompany);

  const [selectedJobId, setSelectedJobId] = useState(myJobs[0]?.id || '');
  const selectedJob = jobs.find(j => j.id === selectedJobId) || myJobs[0] || null;

  // Interview schedule modal
  const [schedulingCard, setSchedulingCard] = useState(null);
  const [interviewDetails, setInterviewDetails] = useState({
    date: '2026-03-25',
    time: '14:30',
    mode: 'Google Meet',
    notes: 'Technical coding round 1',
  });

  // Track interview notes per student & job
  const [scheduledInterviews, setScheduledInterviews] = useState({});
  const [inlineMsg, setInlineMsg] = useState(null);

  if (!selectedJob) {
    return (
      <Layout title="Recruitment Pipeline">
        <p>No job postings available for {myCompany}.</p>
      </Layout>
    );
  }

  // Get job pipeline map: studentId -> stage
  const jobPipeline = pipeline[selectedJob.id] || {};

  // CDC Shortlisted candidates sent to this job
  const cdcShortlistedIds = (jobShortlists || [])
    .filter(s => s.jobId === selectedJob.id && s.status === 'Sent to Company')
    .map(s => s.studentId);

  // Build candidate cards for this job
  // 1. Applications for this company / job
  const jobApps = applications.filter(a => a.company === myCompany);

  // Group candidate items
  const candidateIds = new Set([
    ...jobApps.map(a => a.studentId),
    ...Object.keys(jobPipeline),
    ...cdcShortlistedIds,
    ...students.map(s => s.id),
  ]);

  const cardsByStage = {};
  PIPELINE_STAGES.forEach(st => {
    cardsByStage[st] = [];
  });

  candidateIds.forEach(stId => {
    const student = students.find(s => s.id === stId);
    if (!student) return;

    // Determine current stage
    let stage = jobPipeline[stId];
    if (!stage) {
      if (cdcShortlistedIds.includes(stId)) {
        stage = 'Shortlisted';
      } else {
        // derive from application if exists
        const app = jobApps.find(a => a.studentId === stId);
        if (app) {
          if (app.status === 'Offer') stage = 'Offer Sent';
          else if (app.status === 'Interview') stage = 'Interview Scheduled';
          else if (app.status === 'Rejected') stage = 'Rejected';
          else stage = 'Shortlisted';
        } else {
          // default distribution for demo
          stage = stId === 's1' ? 'Shortlisted' : stId === 's2' ? 'Interview Scheduled' : stId === 's3' ? 'Selected' : 'Shortlisted';
        }
      }
    }

    if (cardsByStage[stage]) {
      cardsByStage[stage].push({
        id: stId,
        studentId: stId,
        name: student.name,
        regNo: student.regNo,
        branch: student.branch,
        cgpa: student.cgpa,
        skills: student.skills || [],
        isCdcShortlisted: cdcShortlistedIds.includes(stId),
      });
    }
  });

  function handleMove(cardId, fromStage, toStage) {
    dispatch({
      type: 'UPDATE_PIPELINE',
      payload: { jobId: selectedJob.id, studentId: cardId, stage: toStage },
    });

    const student = students.find(s => s.id === cardId);
    if (toStage === 'Offer Sent') {
      setInlineMsg({
        type: 'success',
        text: `Cross-Role Update: ${student?.name || 'Candidate'} moved to "Offer Sent". This updates the student's Applications tracker directly to "Offer".`,
      });
    } else {
      setInlineMsg({
        type: 'success',
        text: `${student?.name || 'Candidate'} moved to "${toStage}".`,
      });
    }
  }

  function handleScheduleSubmit(e) {
    e.preventDefault();
    if (!schedulingCard) return;

    const noteKey = `${selectedJob.id}_${schedulingCard.id}`;
    setScheduledInterviews({
      ...scheduledInterviews,
      [noteKey]: { ...interviewDetails },
    });

    // Move to Interview Scheduled if currently Shortlisted
    handleMove(schedulingCard.id, 'Shortlisted', 'Interview Scheduled');

    setSchedulingCard(null);
    setInlineMsg({
      type: 'success',
      text: `Interview scheduled for ${schedulingCard.name} on ${interviewDetails.date} at ${interviewDetails.time} (${interviewDetails.mode}).`,
    });
  }

  function renderCard(card, currentStage) {
    const noteKey = `${selectedJob.id}_${card.id}`;
    const scheduleInfo = scheduledInterviews[noteKey];

    return (
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 6,
          padding: '10px 12px',
          boxShadow: 'none',
          fontSize: 13,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
          <span style={{ fontWeight: 600, color: '#111827' }}>{card.name}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#2563EB' }}>{card.cgpa}</span>
        </div>
        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6 }}>
          {card.regNo} • {card.branch}
        </div>

        {/* Scheduled Interview Note if present */}
        {scheduleInfo && (
          <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 4, padding: '4px 8px', fontSize: 11, color: '#0369A1', marginBottom: 6 }}>
            <strong>Interview:</strong> {scheduleInfo.date} {scheduleInfo.time} ({scheduleInfo.mode})
          </div>
        )}

        {/* CDC Shortlist Badge */}
        {card.isCdcShortlisted && (
          <div style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', padding: '1px 6px', borderRadius: 4 }}>
              ✓ CDC Verified Shortlist
            </span>
          </div>
        )}

        {/* Skills pill */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
          {card.skills.slice(0, 3).map((sk, idx) => (
            <span key={`${sk.name}-${idx}`} style={{ fontSize: 10, background: '#F3F4F6', color: '#4B5563', padding: '1px 5px', borderRadius: 3 }}>
              {sk.name}
            </span>
          ))}
        </div>

        {/* Schedule Interview button */}
        {currentStage === 'Shortlisted' && !scheduleInfo && (
          <button
            onClick={e => { e.stopPropagation(); setSchedulingCard(card); }}
            style={{
              width: '100%',
              padding: '4px 8px',
              borderRadius: 4,
              border: '1px solid #2563EB',
              background: '#EFF6FF',
              color: '#2563EB',
              fontSize: 11,
              fontWeight: 500,
              cursor: 'pointer',
              marginBottom: 6,
            }}
          >
            Schedule Interview
          </button>
        )}

        {/* Fallback stage move selector */}
        <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 6 }}>
          <label style={{ fontSize: 10, color: '#9CA3AF', display: 'block', marginBottom: 2 }}>Move to:</label>
          <select
            value={currentStage}
            onChange={e => handleMove(card.id, currentStage, e.target.value)}
            style={{
              width: '100%',
              fontSize: 11,
              padding: '2px 4px',
              borderRadius: 4,
              border: '1px solid #E5E7EB',
              background: '#F9FAFB',
              color: '#374151',
            }}
          >
            {PIPELINE_STAGES.map(st => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  return (
    <Layout title={`Candidate Hiring Pipeline (${myCompany})`}>
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

      {/* Target Job Switcher */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: '12px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Select Active Job Pipeline:</label>
          <select
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff', fontWeight: 500 }}
          >
            {myJobs.map(j => (
              <option key={j.id} value={j.id}>{j.title} ({j.ctc} LPA) - {j.status}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 12, color: '#6B7280' }}>
          Drag candidates across columns. Moving to <strong>Offer Sent</strong> notifies the student.
        </div>
      </div>

      {/* Kanban Board */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 6, padding: 16, overflowX: 'auto' }}>
        <KanbanBoard
          columns={COLUMNS}
          cards={cardsByStage}
          renderCard={renderCard}
          onMove={handleMove}
        />
      </div>

      {/* Schedule Interview Modal */}
      {schedulingCard && (
        <Modal title={`Schedule Interview: ${schedulingCard.name}`} onClose={() => setSchedulingCard(null)}>
          <form onSubmit={handleScheduleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <FormField label="Interview Date" required>
                <input
                  type="date"
                  required
                  value={interviewDetails.date}
                  onChange={e => setInterviewDetails({ ...interviewDetails, date: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
              <FormField label="Interview Time" required>
                <input
                  type="time"
                  required
                  value={interviewDetails.time}
                  onChange={e => setInterviewDetails({ ...interviewDetails, time: e.target.value })}
                  style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>
            </div>

            <FormField label="Meeting Mode / Link" required>
              <input
                type="text"
                required
                value={interviewDetails.mode}
                onChange={e => setInterviewDetails({ ...interviewDetails, mode: e.target.value })}
                placeholder="e.g. Google Meet / MS Teams / Campus Hall 3"
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            <FormField label="Round Description / Instructions">
              <textarea
                rows={3}
                value={interviewDetails.notes}
                onChange={e => setInterviewDetails({ ...interviewDetails, notes: e.target.value })}
                placeholder="Topics covered, coding platform link, etc."
                style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB' }}
              />
            </FormField>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setSchedulingCard(null)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ padding: '6px 16px', borderRadius: 6, border: 'none', background: '#2563EB', color: '#fff', fontSize: 13, fontWeight: 500 }}
              >
                Confirm & Move to Interview
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Layout>
  );
}
