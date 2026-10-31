import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import FormField from '../../components/FormField';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { getCallTimeStatus } from '../../utils/callTimer';
import {
  Video,
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  Copy,
  Check,
  Star,
  Search,
  Filter,
  User,
  ExternalLink,
  FileText,
  SlidersHorizontal,
  Award,
  History,
  AlertCircle,
  Radio,
  Sparkles,
  ChevronRight,
  Share2,
  Trash2,
  RefreshCw,
  Code2,
  MessageSquare,
  X,
  Users,
  UserPlus,
  UserCheck
} from 'lucide-react';

export default function CompanyInterviews() {
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const myCompany = user?.company || 'Company Portal';
  const { students = [], jobs = [], interviews = [] } = state;

  // Filter interviews relevant to this company or recruiter
  const companyInterviews = useMemo(() => {
    return interviews.filter(
      i => i.company?.toLowerCase() === myCompany.toLowerCase() ||
           i.recruiterName === user?.name ||
           user?.role === 'company'
    );
  }, [interviews, myCompany, user]);

  // Tab State: 'schedule' (upcoming) | 'history' (completed) | 'book' (schedule form)
  const [activeTab, setActiveTab] = useState('schedule');
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');

  // Real-time tick for live call badges & countdowns
  const [currentTime, setCurrentTime] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // UI Interactive States
  const [copiedId, setCopiedId] = useState(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(null);
  const [inlineMsg, setInlineMsg] = useState(null);

  // Phase 2: Reschedule requests state & meeting provider
  const [rescheduleReqs, setRescheduleReqs] = useState([]);
  const [selectedRescheduleReq, setSelectedRescheduleReq] = useState(null);
  const [rescheduleActionData, setRescheduleActionData] = useState({
    recruiterNote: '',
    newDate: '',
    newTime: '11:00',
  });
  const [rescheduleActionLoading, setRescheduleActionLoading] = useState(false);

  const fetchRescheduleReqs = async () => {
    try {
      const res = await fetch('/api/interviews/reschedule');
      if (res.ok) {
        const data = await res.json();
        setRescheduleReqs(data.requests || []);
      }
    } catch (_) {}
  };

  useEffect(() => {
    fetchRescheduleReqs();
    const iv = setInterval(fetchRescheduleReqs, 4000);
    return () => clearInterval(iv);
  }, []);

  // New Interview Form State
  const [formData, setFormData] = useState(() => ({
    studentId: '',
    jobId: jobs[0]?.id || '',
    type: 'Technical & Coding Round',
    meetingProvider: 'careeros',
    meetingUrl: '',
    date: new Date().toISOString().split('T')[0],
    time: '15:30',
    duration: 45,
    notes: 'Please ensure working webcam and audio. Live coding and algorithm challenge will be conducted.',
  }));

  // Typeahead search & multi-candidate meeting state
  const [candidateQuery, setCandidateQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false);

  // Search candidates dynamically as user enters details
  const candidateSearchResults = useMemo(() => {
    const q = candidateQuery.trim().toLowerCase();
    if (!q) return [];
    return students.filter(s =>
      s.name?.toLowerCase().includes(q) ||
      s.branch?.toLowerCase().includes(q) ||
      s.regNo?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [students, candidateQuery]);

  function handleSelectStudent(student) {
    if (!selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(prev => [...prev, student]);
    }
    setCandidateQuery('');
    setCandidateDropdownOpen(false);
  }

  function handleRemoveStudent(studentId) {
    setSelectedStudents(prev => prev.filter(s => s.id !== studentId));
  }

  // Phase 2.2: Handle Recruiter Reschedule Review Actions (Approve, Decline, Propose)
  async function handleRescheduleAction(action) {
    if (!selectedRescheduleReq) return;
    setRescheduleActionLoading(true);
    try {
      const body = { action };
      if (action === 'approve') {
        body.newDate = selectedRescheduleReq.proposedDate || selectedRescheduleReq.proposed_date;
        body.newTime = selectedRescheduleReq.proposedTime || selectedRescheduleReq.proposed_time;
      } else if (action === 'decline') {
        body.recruiterNote = rescheduleActionData.recruiterNote || 'Declined due to scheduling constraints.';
      } else if (action === 'propose') {
        if (!rescheduleActionData.newDate || !rescheduleActionData.newTime) {
          alert('Please select both a date and a time to propose.');
          setRescheduleActionLoading(false);
          return;
        }
        body.newDate = rescheduleActionData.newDate;
        body.newTime = rescheduleActionData.newTime;
      }

      const res = await fetch(`/api/interviews/reschedule/${selectedRescheduleReq.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to update reschedule request');

      if (action === 'approve') {
        const intId = selectedRescheduleReq.interviewId || selectedRescheduleReq.interview_id;
        const targetInt = companyInterviews.find(i => i.id === intId || i.meetingId === intId);
        if (targetInt) {
          dispatch({
            type: 'UPDATE_INTERVIEW',
            payload: {
              id: targetInt.id,
              date: body.newDate,
              time: body.newTime,
              status: 'Scheduled',
            },
          });
        }
      }

      fetchRescheduleReqs();
      setSelectedRescheduleReq(null);
      setInlineMsg({
        type: 'success',
        text: `Reschedule request successfully ${action === 'approve' ? 'approved (interview updated)' : action === 'decline' ? 'declined' : 'counter-proposed'}! Candidate notified.`,
      });
    } catch (err) {
      alert(err.message);
    } finally {
      setRescheduleActionLoading(false);
    }
  }

  // Evaluation Form State for marking a call completed
  const [evalData, setEvalData] = useState({
    technicalScore: 4.5,
    problemSolvingScore: 4.5,
    communicationScore: 4.5,
    recommendation: 'Strong Hire',
    notes: '',
    transcriptSummary: '',
  });

  // Separate upcoming and completed
  const scheduledInterviews = useMemo(() => {
    return companyInterviews.filter(i => i.status === 'Scheduled');
  }, [companyInterviews]);

  const completedInterviews = useMemo(() => {
    return companyInterviews.filter(i => i.status === 'Completed');
  }, [companyInterviews]);

  // Filtered lists based on active tab and search/filter controls
  const filteredScheduled = useMemo(() => {
    return scheduledInterviews.filter(i => {
      const matchSearch =
        !searchQuery ||
        i.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.meetingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.studentBranch?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'all' || i.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [scheduledInterviews, searchQuery, typeFilter]);

  const filteredHistory = useMemo(() => {
    return completedInterviews.filter(i => {
      const matchSearch =
        !searchQuery ||
        i.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.meetingId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.studentBranch?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = typeFilter === 'all' || i.type === typeFilter;
      const matchRec =
        recommendationFilter === 'all' ||
        i.evaluation?.recommendation?.toLowerCase() === recommendationFilter.toLowerCase();

      return matchSearch && matchType && matchRec;
    });
  }, [completedInterviews, searchQuery, typeFilter, recommendationFilter]);

  // Stats calculation
  const liveCount = useMemo(() => {
    return scheduledInterviews.filter(i => {
      const status = getCallTimeStatus(i, currentTime, false);
      return status.isLive;
    }).length;
  }, [scheduledInterviews, currentTime]);

  const avgTechnicalScore = useMemo(() => {
    const evaluated = completedInterviews.filter(i => i.evaluation?.technicalScore);
    if (!evaluated.length) return 0;
    const total = evaluated.reduce((acc, curr) => acc + Number(curr.evaluation.technicalScore), 0);
    return (total / evaluated.length).toFixed(1);
  }, [completedInterviews]);

  const strongHireCount = useMemo(() => {
    return completedInterviews.filter(i => i.evaluation?.recommendation === 'Strong Hire').length;
  }, [completedInterviews]);

  // Copy Meeting Link helper
  function handleCopyLink(meetingId) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}/interview-room/${meetingId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2500);
  }

  // Quick Instant Room Generator
  function handleGenerateInstantRoom() {
    const instantId = `meet-instant-${Date.now().toString(36)}`;
    const newInterview = {
      id: `int_instant_${Date.now()}`,
      meetingId: instantId,
      jobId: jobs[0]?.id || 'j1',
      company: myCompany,
      role: 'Ad-hoc Technical Discussion',
      studentId: students[0]?.id || 's1',
      studentName: 'Ad-hoc Candidate',
      studentEmail: 'candidate@vitstudent.ac.in',
      studentBranch: 'CSE',
      studentCgpa: 8.5,
      date: new Date().toISOString().split('T')[0],
      time: `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`,
      duration: 45,
      type: 'Technical & Coding Round',
      status: 'Scheduled',
      notes: 'Instant recruiter session generated on server.',
      recruiterName: user?.name || 'Talent Acquisition Team',
      evaluation: null,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SCHEDULE_INTERVIEW', payload: newInterview });
    handleCopyLink(instantId);
    setInlineMsg({
      type: 'success',
      text: `Instant Meeting Room "${instantId}" generated and link copied to clipboard! You can share it directly.`,
    });
    setActiveTab('schedule');
  }

  // Handle Form Submission for Scheduling
  function handleScheduleSubmit(e) {
    e.preventDefault();

    if (selectedStudents.length === 0) {
      setInlineMsg({
        type: 'error',
        text: 'Please search and select at least one candidate for this interview meeting.',
      });
      return;
    }

    // Phase 2.3: Validate External Meeting URL if not built-in careeros
    const provider = formData.meetingProvider || 'careeros';
    const rawUrl = (formData.meetingUrl || '').trim();

    if (provider !== 'careeros') {
      if (!rawUrl) {
        setInlineMsg({ type: 'error', text: 'Please enter the meeting link for the selected provider.' });
        return;
      }
      if (provider === 'teams' && !rawUrl.includes('teams.microsoft.com')) {
        setInlineMsg({ type: 'error', text: 'Microsoft Teams link must contain "teams.microsoft.com"' });
        return;
      }
      if (provider === 'google_meet' && !rawUrl.includes('meet.google.com')) {
        setInlineMsg({ type: 'error', text: 'Google Meet link must contain "meet.google.com"' });
        return;
      }
      if (provider === 'zoom' && !rawUrl.includes('zoom.us')) {
        setInlineMsg({ type: 'error', text: 'Zoom link must contain "zoom.us"' });
        return;
      }
      if (provider === 'custom' && !rawUrl.startsWith('https://')) {
        setInlineMsg({ type: 'error', text: 'Custom meeting link must start with "https://"' });
        return;
      }
    }

    const targetJob = jobs.find(j => j.id === formData.jobId);
    const candidateNames = selectedStudents.map(c => c.name).join(', ');
    const candidateEmails = selectedStudents.map(c => c.email).join(', ');
    const candidateIds = selectedStudents.map(c => c.id).join(', ');
    const primaryStudent = selectedStudents[0];

    const slug = selectedStudents.length === 1
      ? (primaryStudent.name?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cand')
      : `group-${selectedStudents.length}`;
    const meetingId = `meet-${slug}-${Date.now().toString(36).slice(-4)}`;

    const newInterview = {
      id: `int_${Date.now()}`,
      meetingId,
      jobId: targetJob?.id || 'j1',
      company: myCompany,
      role: targetJob?.title || 'Software Development Engineer',
      studentId: candidateIds,
      studentName: candidateNames,
      studentEmail: candidateEmails,
      studentBranch: primaryStudent?.branch || 'CSE',
      studentCgpa: primaryStudent?.cgpa || 8.5,
      students: selectedStudents.map(s => ({
        id: s.id,
        name: s.name,
        email: s.email,
        branch: s.branch,
        cgpa: s.cgpa,
        regNo: s.regNo,
      })),
      date: formData.date,
      time: formData.time,
      duration: Number(formData.duration),
      type: formData.type,
      status: 'Scheduled',
      notes: formData.notes,
      recruiterName: user?.name || 'Talent Acquisition Team',
      evaluation: null,
      meetingProvider: provider,
      meetingUrl: provider === 'careeros' ? null : rawUrl,
      createdAt: new Date().toISOString(),
    };

    dispatch({ type: 'SCHEDULE_INTERVIEW', payload: newInterview });

    // Update student recruitment pipeline stage for all selected candidates
    if (targetJob) {
      selectedStudents.forEach(st => {
        dispatch({
          type: 'UPDATE_PIPELINE',
          payload: { jobId: targetJob.id, studentId: st.id, stage: 'Interview Scheduled' },
        });
      });
    }

    setInlineMsg({
      type: 'success',
      text: `Meeting successfully scheduled with ${candidateNames} (${selectedStudents.length} candidate${selectedStudents.length > 1 ? 's' : ''}) for ${formData.date} at ${formData.time}! Room ID: ${meetingId}`,
    });
    setSelectedStudents([]);
    setCandidateQuery('');
    setActiveTab('schedule');
  }

  // Open Evaluation Modal for completing a call
  function handleStartEvaluation(interview) {
    setEvaluatingInterview(interview);
    setEvalData({
      technicalScore: 4.5,
      problemSolvingScore: 4.5,
      communicationScore: 4.5,
      recommendation: 'Strong Hire',
      notes: interview.notes ? `Feedback based on round: ${interview.notes}` : 'Candidate solved algorithmic questions with clean code.',
      transcriptSummary: 'Covered data structures, time complexity analysis, and system edge cases.',
    });
  }

  // Submit Evaluation and mark interview completed
  function handleSaveEvaluation(e) {
    e.preventDefault();
    if (!evaluatingInterview) return;

    const updatedInterview = {
      ...evaluatingInterview,
      status: 'Completed',
      evaluation: {
        technicalScore: Number(evalData.technicalScore),
        problemSolvingScore: Number(evalData.problemSolvingScore),
        communicationScore: Number(evalData.communicationScore),
        recommendation: evalData.recommendation,
        notes: evalData.notes,
        transcriptSummary: evalData.transcriptSummary,
        durationMinutes: evaluatingInterview.duration || 45,
        interviewDate: evaluatingInterview.date,
      },
    };

    dispatch({ type: 'UPDATE_INTERVIEW', payload: updatedInterview });

    // Update pipeline status
    if (evalData.recommendation === 'Strong Hire' || evalData.recommendation === 'Hire') {
      dispatch({
        type: 'UPDATE_PIPELINE',
        payload: {
          jobId: evaluatingInterview.jobId,
          studentId: evaluatingInterview.studentId,
          stage: 'Selected / Offer Extended',
        },
      });
    }

    setEvaluatingInterview(null);
    setInlineMsg({
      type: 'success',
      text: `Evaluation saved for ${evaluatingInterview.studentName}. Interview moved to Call History!`,
    });
    setActiveTab('history');
  }

  // Cancel interview
  function handleCancelCall(id, studentName) {
    if (window.confirm(`Are you sure you want to cancel the scheduled video interview with ${studentName}?`)) {
      dispatch({ type: 'CANCEL_INTERVIEW', payload: id });
      setInlineMsg({
        type: 'danger',
        text: `Interview with ${studentName} has been cancelled.`,
      });
    }
  }

  // Template autofill helper
  function applyTemplate(type) {
    if (type === 'dsa') {
      setFormData(prev => ({
        ...prev,
        type: 'Data Structures & Algorithms',
        notes: 'Round focus: Advanced DSA, time & space complexity analysis, edge cases, and live code execution on coding scratchpad.',
      }));
    } else if (type === 'sys') {
      setFormData(prev => ({
        ...prev,
        type: 'System Design & Architecture',
        notes: 'Round focus: Microservices, API contract design, relational vs NoSQL databases, caching strategies, and scalability tradeoffs.',
      }));
    } else if (type === 'hr') {
      setFormData(prev => ({
        ...prev,
        type: 'HR & Cultural Alignment',
        notes: 'Round focus: Cultural fitment, communication clarity, problem resolution, team collaboration, and relocation readiness.',
      }));
    }
  }

  return (
    <Layout title="Call History & Video Scheduling Hub">
      <div style={{ maxWidth: 1140, margin: '0 auto', paddingBottom: 40 }}>

        {/* ─── TOP HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 9999, background: '#EEF2FF', color: '#4F46E5', fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
              <Video size={14} />
              <span>Google Meet Server Engine</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em' }}>
              Call History & Video Interview Scheduling
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#6B7280' }}>
              Manage online candidate video rounds, inspect historical call evaluations, and schedule new Google Meet sessions.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleGenerateInstantRoom}
              title="Generate a live room link instantly"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: 8,
                background: '#F3F4F6',
                color: '#374151',
                border: '1px solid #D1D5DB',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Radio size={14} color="#059669" />
              <span>Instant Quick Room</span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 18px',
                borderRadius: 8,
                background: '#2563EB',
                color: '#fff',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
              }}
            >
              <Plus size={16} /> Schedule New Interview
            </button>
          </div>
        </div>

        {/* ─── INLINE NOTIFICATION ─── */}
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
              animation: 'fadeIn 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {inlineMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ fontWeight: 500 }}>{inlineMsg.text}</span>
            </div>
            <button
              onClick={() => setInlineMsg(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontWeight: 700 }}
            >
              ×
            </button>
          </div>
        )}

        {/* ─── STATS SUMMARY BAR ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginBottom: 24 }}>
          
          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 10, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
              <Calendar size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Scheduled Calls</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 2 }}>{scheduledInterviews.length}</div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 10, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
              <History size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Call History Records</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#059669', marginTop: 2 }}>{completedInterviews.length}</div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 10, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: liveCount > 0 ? '#FEF2F2' : '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: liveCount > 0 ? '#DC2626' : '#6B7280' }}>
              <Radio size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Live Rooms Now</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: liveCount > 0 ? '#DC2626' : '#111827', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{liveCount}</span>
                {liveCount > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 6px', borderRadius: 9999, background: '#FEE2E2', color: '#DC2626' }}>
                    Active
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 10, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFFBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Star size={22} fill="#D97706" />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Avg Technical Score</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#111827', marginTop: 2 }}>
                {avgTechnicalScore > 0 ? `${avgTechnicalScore} / 5.0` : 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ background: '#fff', padding: '16px 18px', borderRadius: 10, border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7C3AED' }}>
              <Award size={22} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Strong Hire Pipeline</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#7C3AED', marginTop: 2 }}>{strongHireCount}</div>
            </div>
          </div>

        </div>

        {/* ─── NAVIGATION TABS ─── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            
            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'schedule' ? 700 : 500,
                color: activeTab === 'schedule' ? '#2563EB' : '#4B5563',
                borderBottom: activeTab === 'schedule' ? '2px solid #2563EB' : '2px solid transparent',
              }}
            >
              <Calendar size={16} />
              <span>Upcoming Schedule</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: activeTab === 'schedule' ? '#EFF6FF' : '#F3F4F6', color: activeTab === 'schedule' ? '#2563EB' : '#6B7280' }}>
                {scheduledInterviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'history' ? 700 : 500,
                color: activeTab === 'history' ? '#059669' : '#4B5563',
                borderBottom: activeTab === 'history' ? '2px solid #059669' : '2px solid transparent',
              }}
            >
              <History size={16} />
              <span>Call History & Evaluations</span>
              <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 9999, background: activeTab === 'history' ? '#ECFDF5' : '#F3F4F6', color: activeTab === 'history' ? '#059669' : '#6B7280' }}>
                {completedInterviews.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('book')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: activeTab === 'book' ? 700 : 500,
                color: activeTab === 'book' ? '#7C3AED' : '#4B5563',
                borderBottom: activeTab === 'book' ? '2px solid #7C3AED' : '2px solid transparent',
              }}
            >
              <Plus size={16} />
              <span>Schedule a Call</span>
            </button>

          </div>

          {/* Current Server Time indicator */}
          <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
            <Clock size={13} color="#4B5563" />
            <span>Server Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </div>

        {/* ─── SEARCH & FILTER CONTROLS (for Schedule & History tabs) ─── */}
        {activeTab !== 'book' && (
          <div style={{ background: '#fff', padding: '14px 16px', borderRadius: 10, border: '1px solid #E5E7EB', marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: 360 }}>
              <Search size={15} color="#9CA3AF" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidate name, branch, roll no, or room ID..."
                style={{
                  width: '100%',
                  padding: '8px 12px 8px 32px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              
              {/* Round Type Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Filter size={14} color="#6B7280" />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, color: '#374151', background: '#fff' }}
                >
                  <option value="all">All Round Types</option>
                  <option value="Technical & Coding Round">Technical & Coding</option>
                  <option value="System Design & Architecture">System Design</option>
                  <option value="Data Structures & Algorithms">DSA Problem Solving</option>
                  <option value="HR & Cultural Alignment">HR & Cultural</option>
                </select>
              </div>

              {/* Recommendation Filter (only on history tab) */}
              {activeTab === 'history' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Award size={14} color="#6B7280" />
                  <select
                    value={recommendationFilter}
                    onChange={e => setRecommendationFilter(e.target.value)}
                    style={{ padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 12, color: '#374151', background: '#fff' }}
                  >
                    <option value="all">All Recommendations</option>
                    <option value="Strong Hire">Strong Hire</option>
                    <option value="Hire">Hire</option>
                    <option value="Hold">Hold / Review</option>
                    <option value="Reject">Reject</option>
                  </select>
                </div>
              )}

              {/* Clear filters */}
              {(searchQuery || typeFilter !== 'all' || recommendationFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setTypeFilter('all');
                    setRecommendationFilter('all');
                  }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#F3F4F6', fontSize: 12, cursor: 'pointer', color: '#4B5563' }}
                >
                  Reset Filters
                </button>
              )}

            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 1: UPCOMING SCHEDULE
        ══════════════════════════════════════════════════ */}
        {activeTab === 'schedule' && (
          <div>
            {filteredScheduled.length === 0 ? (
              <div style={{ background: '#fff', padding: '50px 20px', borderRadius: 12, border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <Calendar size={44} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  No Upcoming Interviews Found
                </h3>
                <p style={{ margin: '0 auto 16px', fontSize: 13, color: '#6B7280', maxWidth: 420 }}>
                  {searchQuery || typeFilter !== 'all'
                    ? 'No scheduled video calls match your current filter query.'
                    : 'You currently have no upcoming technical rounds scheduled for your company.'}
                </p>
                <button
                  onClick={() => setActiveTab('book')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#2563EB',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={15} /> Schedule a Technical Call Now
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredScheduled.map(item => {
                  const timeStatus = getCallTimeStatus(item, currentTime, false);
                  const isLive = timeStatus.isLive;

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#fff',
                        borderRadius: 12,
                        border: isLive ? '2px solid #2563EB' : '1px solid #E5E7EB',
                        padding: '20px 22px',
                        boxShadow: isLive ? '0 4px 16px rgba(37,99,235,0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {/* Top Row: Candidate profile & Live Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                        
                        {/* Student Details */}
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: isLive ? '#2563EB' : '#EEF2FF',
                              color: isLive ? '#fff' : '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 17,
                              flexShrink: 0,
                              border: isLive ? '2px solid #93C5FD' : 'none',
                            }}
                          >
                            {item.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
                                {item.studentName}
                              </span>
                              <span style={{ fontSize: 12, color: '#4B5563', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                {item.studentBranch || 'CSE'}
                              </span>
                              <span style={{ fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                CGPA {item.studentCgpa || '8.4'}
                              </span>
                              {Array.isArray(item.students) && item.students.length > 1 && (
                                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={12} />
                                  <span>Group Call ({item.students.length} Candidates)</span>
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, marginTop: 4 }}>
                              {item.role} <span style={{ color: '#6B7280' }}>• {item.type}</span>
                            </div>

                            {Array.isArray(item.students) && item.students.length > 1 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                {item.students.map((st, sIdx) => (
                                  <span key={st.id || sIdx} style={{ fontSize: 11, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#2563EB', color: '#fff', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                      {st.name?.charAt(0) || 'S'}
                                    </span>
                                    <strong>{st.name}</strong> • {st.branch || 'CSE'} {st.cgpa ? `(CGPA ${st.cgpa})` : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 3 }}>
                                Candidate Email: <span style={{ color: '#111827' }}>{item.studentEmail}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Live Countdown & Lock Status Pill */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {isLive ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 9999, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', fontSize: 12, fontWeight: 700 }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563EB', display: 'inline-block', boxShadow: '0 0 0 2px #BFDBFE' }} />
                              {timeStatus.countdownText || 'Live Call in Progress'}
                            </span>
                          ) : (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 9999, background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#4B5563', fontSize: 12, fontWeight: 600 }}>
                              <Clock size={13} color="#6B7280" />
                              {timeStatus.countdownText || 'Scheduled'}
                            </span>
                          )}
                        </div>

                      </div>

                      {/* Middle Row: Schedule Info Box */}
                      <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                          <Calendar size={15} color="#4F46E5" />
                          <span><strong>Date:</strong> {item.date}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                          <Clock size={15} color="#4F46E5" />
                          <span><strong>Slot:</strong> {item.time} ({item.duration} mins)</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#374151' }}>
                          <User size={15} color="#4F46E5" />
                          <span><strong>Interviewer:</strong> {item.recruiterName || 'Campus Talent Lead'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', marginLeft: 'auto' }}>
                          <span><strong>Room ID:</strong></span>
                          <code style={{ background: '#E5E7EB', padding: '2px 8px', borderRadius: 4, color: '#111827', fontWeight: 600, fontSize: 12 }}>
                            {item.meetingId}
                          </code>
                        </div>
                      </div>

                      {/* Notes & Agenda */}
                      {item.notes && (
                        <div style={{ fontSize: 13, color: '#4B5563', background: '#F8FAFC', padding: '10px 14px', borderRadius: 6, borderLeft: '3px solid #2563EB', lineHeight: 1.5 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>
                            Preparation Notes & Agenda
                          </div>
                          "{item.notes}"
                        </div>
                      )}

                      {/* Reschedule Request Notice (Phase 2.2) */}
                      {(() => {
                        const req = rescheduleReqs.find(r => (r.interviewId === item.id || r.interview_id === item.id) && r.status === 'Pending');
                        if (!req) return null;
                        return (
                          <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#B45309', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <AlertCircle size={15} color="#D97706" />
                                <span>Candidate Requested Reschedule</span>
                              </div>
                              <div style={{ fontSize: 12, color: '#92400E', marginTop: 2 }}>
                                Proposed Slot: <strong>{req.proposedDate || req.proposed_date}</strong> at <strong>{req.proposedTime || req.proposed_time}</strong> • Reason: <em>{req.reasonCode || req.reason_code}</em>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRescheduleReq(req);
                                setRescheduleActionData({ recruiterNote: '', newDate: req.proposedDate || req.proposed_date, newTime: req.proposedTime || req.proposed_time });
                              }}
                              style={{ padding: '6px 14px', background: '#D97706', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Review Request →
                            </button>
                          </div>
                        );
                      })()}

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                        
                        {/* Copy Link Button */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleCopyLink(item.meetingId)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#F3F4F6',
                              border: '1px solid #D1D5DB',
                              borderRadius: 6,
                              padding: '7px 12px',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              color: '#374151',
                            }}
                          >
                            {copiedId === item.meetingId ? <Check size={14} color="#059669" /> : <Copy size={14} />}
                            <span>{copiedId === item.meetingId ? 'Invite Link Copied!' : 'Copy Candidate Invite'}</span>
                          </button>

                          <button
                            onClick={() => handleCancelCall(item.id, item.studentName)}
                            title="Cancel this interview"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              background: '#fff',
                              border: '1px solid #FECACA',
                              borderRadius: 6,
                              padding: '7px 10px',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              color: '#DC2626',
                            }}
                          >
                            <Trash2 size={13} />
                            <span>Cancel</span>
                          </button>
                        </div>

                        {/* Video Room Action & Grade Button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            onClick={() => handleStartEvaluation(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              borderRadius: 6,
                              border: '1px solid #D1D5DB',
                              background: '#fff',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#374151',
                              cursor: 'pointer',
                            }}
                          >
                            <CheckCircle2 size={14} color="#059669" />
                            <span>Complete & Grade Call</span>
                          </button>

                          {item.meetingProvider && item.meetingProvider !== 'careeros' && item.meetingUrl ? (
                            <a
                              href={item.meetingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 20px',
                                borderRadius: 6,
                                background: isLive ? '#2563EB' : item.meetingProvider === 'teams' ? '#4F46E5' : '#1E293B',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: isLive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                              }}
                            >
                              <Video size={15} />
                              <span>Launch {item.meetingProvider === 'teams' ? 'Teams' : item.meetingProvider === 'google_meet' ? 'Google Meet' : item.meetingProvider === 'zoom' ? 'Zoom' : 'Room'}</span>
                              <ExternalLink size={13} />
                            </a>
                          ) : (
                            <Link
                              to={`/interview-room/${item.meetingId || item.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '8px 20px',
                                borderRadius: 6,
                                background: isLive ? '#2563EB' : '#1E293B',
                                color: '#fff',
                                fontSize: 13,
                                fontWeight: 700,
                                textDecoration: 'none',
                                boxShadow: isLive ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
                              }}
                            >
                              <Video size={15} />
                              <span>Start / Enter Video Call</span>
                            </Link>
                          )}
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 2: CALL HISTORY & EVALUATIONS
        ══════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div>
            {filteredHistory.length === 0 ? (
              <div style={{ background: '#fff', padding: '50px 20px', borderRadius: 12, border: '1px solid #E5E7EB', textAlign: 'center' }}>
                <History size={44} color="#9CA3AF" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: '#111827' }}>
                  No Call History Records Found
                </h3>
                <p style={{ margin: '0 auto 16px', fontSize: 13, color: '#6B7280', maxWidth: 420 }}>
                  {searchQuery || recommendationFilter !== 'all'
                    ? 'No completed call history entries match your search/filter query.'
                    : 'Completed video interviews and evaluation dossiers will appear here once calls are conducted.'}
                </p>
                <button
                  onClick={() => setActiveTab('schedule')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <Calendar size={15} /> View Scheduled Rounds
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {filteredHistory.map(item => {
                  const evalObj = item.evaluation || {};
                  const isStrongHire = evalObj.recommendation === 'Strong Hire';
                  const isHire = evalObj.recommendation === 'Hire';
                  const isHold = evalObj.recommendation === 'Hold';

                  const badgeBg = isStrongHire ? '#ECFDF5' : isHire ? '#EFF6FF' : isHold ? '#FFFBEB' : '#FEF2F2';
                  const badgeColor = isStrongHire ? '#065F46' : isHire ? '#1E40AF' : isHold ? '#92400E' : '#991B1B';
                  const badgeBorder = isStrongHire ? '#A7F3D0' : isHire ? '#BFDBFE' : isHold ? '#FDE68A' : '#FECACA';

                  return (
                    <div
                      key={item.id}
                      style={{
                        background: '#fff',
                        borderRadius: 12,
                        border: '1px solid #E5E7EB',
                        padding: '20px 22px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                      }}
                    >
                      {/* Top Header: Candidate & Recommendation */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
                        
                        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                          <div
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              background: '#F3F4F6',
                              color: '#374151',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: 17,
                              flexShrink: 0,
                            }}
                          >
                            {item.studentName?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 17, fontWeight: 700, color: '#111827' }}>
                                {item.studentName}
                              </span>
                              <span style={{ fontSize: 12, color: '#4B5563', background: '#F3F4F6', padding: '2px 8px', borderRadius: 4, fontWeight: 500 }}>
                                {item.studentBranch || 'CSE'}
                              </span>
                              <span style={{ fontSize: 12, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                                CGPA {item.studentCgpa || '8.4'}
                              </span>
                              {Array.isArray(item.students) && item.students.length > 1 && (
                                <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #BFDBFE', padding: '2px 8px', borderRadius: 9999, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Users size={12} />
                                  <span>Group Call ({item.students.length} Candidates)</span>
                                </span>
                              )}
                            </div>

                            <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 4 }}>
                              {item.role} <span style={{ color: '#6B7280' }}>• {item.type}</span>
                            </div>

                            {Array.isArray(item.students) && item.students.length > 1 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                                {item.students.map((st, sIdx) => (
                                  <span key={st.id || sIdx} style={{ fontSize: 11, background: '#F3F4F6', border: '1px solid #E5E7EB', color: '#374151', padding: '2px 8px', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#7C3AED', color: '#fff', fontSize: 9, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                                      {st.name?.charAt(0) || 'S'}
                                    </span>
                                    <strong>{st.name}</strong> • {st.branch || 'CSE'} {st.cgpa ? `(CGPA ${st.cgpa})` : ''}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 3 }}>
                                • Email: {item.studentEmail}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Recommendation Badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '5px 12px',
                              borderRadius: 9999,
                              background: badgeBg,
                              color: badgeColor,
                              border: `1px solid ${badgeBorder}`,
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            <Award size={14} />
                            <span>{evalObj.recommendation || 'Evaluated'}</span>
                          </span>
                        </div>

                      </div>

                      {/* Middle Row: Call Details & Scorecard Chips */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                        
                        <div style={{ background: '#F9FAFB', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 600 }}>INTERVIEW CONDUCTED</div>
                          <div style={{ fontWeight: 700, color: '#111827', marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar size={13} color="#6B7280" />
                            <span>{item.date} ({item.duration || 45} mins)</span>
                          </div>
                        </div>

                        <div style={{ background: '#EEF2FF', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                          <div style={{ fontSize: 11, color: '#4F46E5', fontWeight: 700 }}>TECHNICAL PROFICIENCY</div>
                          <div style={{ fontWeight: 800, color: '#1E1B4B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{evalObj.technicalScore || '4.5'} / 5.0</span>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          </div>
                        </div>

                        <div style={{ background: '#ECFDF5', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                          <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>PROBLEM SOLVING</div>
                          <div style={{ fontWeight: 800, color: '#064E3B', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{evalObj.problemSolvingScore || '5.0'} / 5.0</span>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          </div>
                        </div>

                        <div style={{ background: '#F5F3FF', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                          <div style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>COMMUNICATION</div>
                          <div style={{ fontWeight: 800, color: '#4C1D95', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>{evalObj.communicationScore || '4.5'} / 5.0</span>
                            <Star size={13} fill="#F59E0B" color="#F59E0B" />
                          </div>
                        </div>

                      </div>

                      {/* Recruiter Feedback Note Snippet */}
                      {evalObj.notes && (
                        <div style={{ fontSize: 13, color: '#374151', background: '#F9FAFB', padding: '10px 14px', borderRadius: 6, borderLeft: '3px solid #059669', lineHeight: 1.5 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', marginBottom: 2 }}>
                            Recruiter Assessment Summary
                          </div>
                          "{evalObj.notes}"
                        </div>
                      )}

                      {/* Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                        
                        <div style={{ fontSize: 12, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Room Code:</span>
                          <code style={{ background: '#F3F4F6', padding: '2px 6px', borderRadius: 4, color: '#111827' }}>
                            {item.meetingId}
                          </code>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <button
                            onClick={() => setSelectedEvaluation(item)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 16px',
                              borderRadius: 6,
                              border: '1px solid #D1D5DB',
                              background: '#fff',
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#374151',
                              cursor: 'pointer',
                            }}
                          >
                            <FileText size={14} color="#4F46E5" />
                            <span>View Full Evaluation Scorecard</span>
                          </button>

                          <Link
                            to={`/interview-room/${item.meetingId}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '7px 16px',
                              borderRadius: 6,
                              background: '#374151',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            <Code2 size={14} />
                            <span>Reopen Room & Code Scratchpad</span>
                          </Link>
                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TAB 3: SCHEDULE A NEW CALL
        ══════════════════════════════════════════════════ */}
        {activeTab === 'book' && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '28px', maxWidth: 840, margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            
            <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 16, marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Calendar size={20} color="#2563EB" />
                <span>Schedule Online Video Meeting / Interview Round</span>
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
                Set up an online video meeting room for single or multiple candidates, pick competencies to evaluate, and generate instant join links.
              </p>
            </div>

            <form onSubmit={handleScheduleSubmit}>
              
              {/* Candidate Search & Multi-Selection Autocomplete (Search-as-you-type) */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 6 }}>
                  Meeting Candidates / Participants <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <p style={{ margin: '0 0 10px', fontSize: 12, color: '#6B7280' }}>
                  Search by entering candidate name, registration number, branch, or email. You can add one or multiple candidates to connect together in this meeting.
                </p>

                {/* Search Input Box with Real-time Autocomplete Dropdown */}
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <Search size={16} color="#9CA3AF" style={{ position: 'absolute', left: 12, pointerEvents: 'none' }} />
                    <input
                      type="text"
                      value={candidateQuery}
                      onChange={e => {
                        setCandidateQuery(e.target.value);
                        setCandidateDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (candidateQuery.trim()) setCandidateDropdownOpen(true);
                      }}
                      placeholder="Type candidate details (e.g. Aarav, 22BCE1101, CSE, or email)..."
                      style={{
                        width: '100%',
                        padding: '10px 36px 10px 38px',
                        borderRadius: 8,
                        border: '1px solid #D1D5DB',
                        fontSize: 13,
                        outline: 'none',
                        transition: 'border-color 0.15s ease',
                        boxShadow: candidateDropdownOpen && candidateQuery ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
                        borderColor: candidateDropdownOpen && candidateQuery ? '#2563EB' : '#D1D5DB',
                      }}
                    />
                    {candidateQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setCandidateQuery('');
                          setCandidateDropdownOpen(false);
                        }}
                        style={{
                          position: 'absolute',
                          right: 10,
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#9CA3AF',
                          padding: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {/* Dynamic Dropdown Results when user enters details */}
                  {candidateDropdownOpen && candidateQuery.trim().length > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 4px)',
                        left: 0,
                        right: 0,
                        background: '#fff',
                        borderRadius: 10,
                        border: '1px solid #E5E7EB',
                        boxShadow: '0 12px 28px -4px rgba(0,0,0,0.12), 0 4px 8px -2px rgba(0,0,0,0.06)',
                        zIndex: 60,
                        maxHeight: 280,
                        overflowY: 'auto',
                      }}
                    >
                      {candidateSearchResults.length === 0 ? (
                        <div style={{ padding: '16px', textAlign: 'center', color: '#6B7280', fontSize: 13 }}>
                          <AlertCircle size={18} color="#9CA3AF" style={{ margin: '0 auto 6px', display: 'block' }} />
                          No candidates found matching "{candidateQuery}". Try typing another name, branch, or registration roll number.
                        </div>
                      ) : (
                        <div>
                          <div style={{ padding: '8px 12px', fontSize: 11, fontWeight: 700, color: '#6B7280', background: '#F9FAFB', borderBottom: '1px solid #F3F4F6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Matching Students ({candidateSearchResults.length}) — Click to select
                          </div>
                          {candidateSearchResults.map(student => {
                            const isSelected = selectedStudents.some(s => s.id === student.id);
                            return (
                              <div
                                key={student.id}
                                onClick={() => handleSelectStudent(student)}
                                style={{
                                  padding: '10px 14px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  cursor: 'pointer',
                                  borderBottom: '1px solid #F3F4F6',
                                  background: isSelected ? '#EFF6FF' : '#fff',
                                  transition: 'background 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                  if (!isSelected) e.currentTarget.style.background = '#F9FAFB';
                                }}
                                onMouseLeave={e => {
                                  if (!isSelected) e.currentTarget.style.background = '#fff';
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div
                                    style={{
                                      width: 34,
                                      height: 34,
                                      borderRadius: '50%',
                                      background: isSelected ? '#2563EB' : '#EEF2FF',
                                      color: isSelected ? '#fff' : '#2563EB',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 800,
                                      fontSize: 13,
                                      flexShrink: 0,
                                    }}
                                  >
                                    {student.name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                                        {student.name}
                                      </span>
                                      <span style={{ fontSize: 11, background: '#F3F4F6', color: '#4B5563', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                                        {student.branch}
                                      </span>
                                      <span style={{ fontSize: 11, background: '#ECFDF5', color: '#059669', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                                        CGPA {student.cgpa}
                                      </span>
                                      {student.regNo && (
                                        <span style={{ fontSize: 11, color: '#6B7280' }}>
                                          • {student.regNo}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>
                                      {student.email}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  {isSelected ? (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: '#2563EB', background: '#DBEAFE', padding: '4px 10px', borderRadius: 9999 }}>
                                      <Check size={13} /> Added
                                    </span>
                                  ) : (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#4B5563', background: '#F3F4F6', padding: '4px 10px', borderRadius: 9999 }}>
                                      <Plus size={13} /> Add
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Selected Students Chips Area */}
                <div style={{ marginTop: 12 }}>
                  {selectedStudents.length === 0 ? (
                    <div style={{ padding: '12px 14px', borderRadius: 8, background: '#F9FAFB', border: '1px dashed #D1D5DB', display: 'flex', alignItems: 'center', gap: 10, color: '#6B7280', fontSize: 12 }}>
                      <Users size={16} color="#9CA3AF" />
                      <span>No candidates selected yet. Start typing above to search and add one or multiple candidates.</span>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Users size={14} color="#2563EB" />
                          <span>Selected Candidates ({selectedStudents.length})</span>
                          {selectedStudents.length > 1 && (
                            <span style={{ fontSize: 11, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 9999, fontWeight: 700 }}>
                              Multi-Candidate Meeting Room
                            </span>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedStudents([])}
                          style={{ background: 'none', border: 'none', fontSize: 11, color: '#DC2626', cursor: 'pointer', fontWeight: 600 }}
                        >
                          Clear All
                        </button>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {selectedStudents.map(student => (
                          <div
                            key={student.id}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              background: '#F0F9FF',
                              border: '1px solid #BAE6FD',
                              borderRadius: 8,
                              padding: '6px 10px',
                              fontSize: 12,
                            }}
                          >
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#0284C7', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>
                              {student.name?.charAt(0) || 'S'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0369A1' }}>
                                {student.name}
                              </div>
                              <div style={{ fontSize: 10, color: '#0284C7' }}>
                                {student.branch} • CGPA {student.cgpa} {student.regNo ? `• ${student.regNo}` : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveStudent(student.id)}
                              title="Remove candidate"
                              style={{
                                background: '#E0F2FE',
                                border: 'none',
                                borderRadius: '50%',
                                width: 20,
                                height: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: '#0369A1',
                                marginLeft: 4,
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = '#FEE2E2';
                                e.currentTarget.style.color = '#DC2626';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = '#E0F2FE';
                                e.currentTarget.style.color = '#0369A1';
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Job Posting & Round Type */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 16 }}>
                <FormField label="Associated Job Posting" required>
                  <select
                    required
                    value={formData.jobId}
                    onChange={e => setFormData({ ...formData, jobId: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  >
                    {jobs.map(j => (
                      <option key={j.id} value={j.id}>
                        {j.title} ({j.company})
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Interview Round Type" required>
                  <select
                    required
                    value={formData.type}
                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  >
                    <option value="Technical & Coding Round">Technical & Coding Round</option>
                    <option value="System Design & Architecture">System Design & Architecture</option>
                    <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                    <option value="HR & Cultural Alignment">HR & Cultural Alignment</option>
                    <option value="Executive Partner Round">Executive Partner Round</option>
                  </select>
                </FormField>
              </div>

              {/* Meeting Platform & Provider Selector (Phase 2.3) */}
              <div style={{ display: 'grid', gridTemplateColumns: formData.meetingProvider && formData.meetingProvider !== 'careeros' ? '1fr 2fr' : '1fr', gap: 14, marginBottom: 16 }}>
                <FormField label="Meeting Platform / Provider" required>
                  <select
                    value={formData.meetingProvider || 'careeros'}
                    onChange={e => setFormData({ ...formData, meetingProvider: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff' }}
                  >
                    <option value="careeros">CareerOS Built-in WebRTC (Recommended)</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom Video</option>
                    <option value="custom">Custom Meeting Provider</option>
                  </select>
                </FormField>

                {formData.meetingProvider && formData.meetingProvider !== 'careeros' && (
                  <FormField label={`External ${formData.meetingProvider === 'teams' ? 'Teams' : formData.meetingProvider === 'google_meet' ? 'Google Meet' : formData.meetingProvider === 'zoom' ? 'Zoom' : 'Custom'} Link *`} required>
                    <input
                      type="url"
                      required
                      placeholder={
                        formData.meetingProvider === 'teams' ? 'https://teams.microsoft.com/l/meetup-join/...' :
                        formData.meetingProvider === 'google_meet' ? 'https://meet.google.com/abc-defg-hij' :
                        formData.meetingProvider === 'zoom' ? 'https://zoom.us/j/1234567890' : 'https://...'
                      }
                      value={formData.meetingUrl || ''}
                      onChange={e => setFormData({ ...formData, meetingUrl: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                    />
                  </FormField>
                )}
              </div>

              {/* Date, Time, Duration */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                <FormField label="Interview Date" required>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </FormField>

                <FormField label="Start Time (24h)" required>
                  <input
                    type="time"
                    required
                    value={formData.time}
                    onChange={e => setFormData({ ...formData, time: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  />
                </FormField>

                <FormField label="Duration" required>
                  <select
                    value={formData.duration}
                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={45}>45 minutes</option>
                    <option value={60}>60 minutes</option>
                    <option value={90}>90 minutes</option>
                  </select>
                </FormField>
              </div>

              {/* Quick Template Fillers */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 6 }}>
                  Quick Agenda Presets:
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => applyTemplate('dsa')}
                    style={{ padding: '4px 10px', borderRadius: 4, background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1E40AF', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    DSA & Algorithm Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('sys')}
                    style={{ padding: '4px 10px', borderRadius: 4, background: '#F5F3FF', border: '1px solid #DDD6FE', color: '#6D28D9', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    System Architecture Focus
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate('hr')}
                    style={{ padding: '4px 10px', borderRadius: 4, background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    HR & Culture Fitment
                  </button>
                </div>
              </div>

              {/* Recruiter Notes */}
              <div style={{ marginBottom: 24 }}>
                <FormField label="Instructions & Preparation Notes for Student">
                  <textarea
                    rows={4}
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Provide candidate instructions, topics to review, or development prerequisites..."
                    style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, lineHeight: 1.5 }}
                  />
                </FormField>
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid #E5E7EB', paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setActiveTab('schedule')}
                  style={{
                    padding: '9px 18px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '9px 22px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#2563EB',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.25)',
                  }}
                >
                  <Calendar size={15} />
                  <span>Confirm & Generate Room Link</span>
                </button>
              </div>

            </form>

          </div>
        )}

        {/* ─── MODAL: FULL EVALUATION SCORECARD ─── */}
        {selectedEvaluation && (
          <Modal title={`Candidate Evaluation: ${selectedEvaluation.studentName}`} onClose={() => setSelectedEvaluation(null)}>
            <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              {/* Candidate & Role Banner */}
              <div style={{ background: '#F9FAFB', padding: '14px 16px', borderRadius: 8, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                <div><strong>Role:</strong> {selectedEvaluation.role}</div>
                <div><strong>Round:</strong> {selectedEvaluation.type}</div>
                <div><strong>Date Conducted:</strong> {selectedEvaluation.date}</div>
                <div><strong>Interviewer:</strong> {selectedEvaluation.recruiterName || 'Campus Lead'}</div>
              </div>

              {selectedEvaluation.evaluation ? (
                <div>
                  
                  {/* Scores Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                    <div style={{ background: '#EEF2FF', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 700 }}>TECHNICAL PROFICIENCY</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#1E1B4B', marginTop: 4 }}>
                        {selectedEvaluation.evaluation.technicalScore || 4.5} / 5.0
                      </div>
                    </div>

                    <div style={{ background: '#ECFDF5', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>PROBLEM SOLVING</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#064E3B', marginTop: 4 }}>
                        {selectedEvaluation.evaluation.problemSolvingScore || 5.0} / 5.0
                      </div>
                    </div>

                    <div style={{ background: '#F5F3FF', padding: '12px', borderRadius: 8, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>COMMUNICATION</span>
                      <div style={{ fontSize: 20, fontWeight: 800, color: '#4C1D95', marginTop: 4 }}>
                        {selectedEvaluation.evaluation.communicationScore || 4.5} / 5.0
                      </div>
                    </div>
                  </div>

                  {/* Hiring Recommendation */}
                  <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ color: '#111827' }}>Final Hiring Recommendation:</strong>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', fontWeight: 700 }}>
                      <Award size={14} />
                      <span>{selectedEvaluation.evaluation.recommendation || 'Strong Hire'}</span>
                    </div>
                  </div>

                  {/* Recruiter Feedback */}
                  <div style={{ marginBottom: 14 }}>
                    <strong style={{ color: '#111827' }}>Recruiter Observations & Strengths:</strong>
                    <p style={{ marginTop: 6, padding: '12px', background: '#F3F4F6', borderRadius: 6, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {selectedEvaluation.evaluation.notes}
                    </p>
                  </div>

                  {/* Transcript Summary */}
                  {selectedEvaluation.evaluation.transcriptSummary && (
                    <div>
                      <strong style={{ color: '#111827' }}>Topics Covered & Code Evaluation:</strong>
                      <p style={{ marginTop: 6, padding: '12px', background: '#F8FAFC', borderRadius: 6, border: '1px solid #E2E8F0', color: '#475569', lineHeight: 1.5 }}>
                        {selectedEvaluation.evaluation.transcriptSummary}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#6B7280' }}>
                  No evaluation scorecard has been logged yet for this interview.
                </div>
              )}

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
                <Link
                  to={`/interview-room/${selectedEvaluation.meetingId}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#2563EB',
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Inspect Meeting Scratchpad & Notes</span>
                </Link>

                <button
                  onClick={() => setSelectedEvaluation(null)}
                  style={{ padding: '7px 18px', borderRadius: 6, background: '#2563EB', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Close Dossier
                </button>
              </div>

            </div>
          </Modal>
        )}

        {/* ─── MODAL: COMPLETE & GRADE INTERVIEW ─── */}
        {evaluatingInterview && (
          <Modal title={`Log Interview Evaluation: ${evaluatingInterview.studentName}`} onClose={() => setEvaluatingInterview(null)}>
            <form onSubmit={handleSaveEvaluation} style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 14 }}>
              
              <div style={{ background: '#F9FAFB', padding: '10px 14px', borderRadius: 6 }}>
                <div><strong>Role:</strong> {evaluatingInterview.role}</div>
                <div><strong>Round:</strong> {evaluatingInterview.type}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <FormField label="Technical (1-5)" required>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={evalData.technicalScore}
                    onChange={e => setEvalData({ ...evalData, technicalScore: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>

                <FormField label="Problem Solving (1-5)" required>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={evalData.problemSolvingScore}
                    onChange={e => setEvalData({ ...evalData, problemSolvingScore: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>

                <FormField label="Communication (1-5)" required>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    required
                    value={evalData.communicationScore}
                    onChange={e => setEvalData({ ...evalData, communicationScore: e.target.value })}
                    style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                  />
                </FormField>
              </div>

              <FormField label="Hiring Recommendation" required>
                <select
                  value={evalData.recommendation}
                  onChange={e => setEvalData({ ...evalData, recommendation: e.target.value })}
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold / Re-evaluate</option>
                  <option value="Reject">Reject</option>
                </select>
              </FormField>

              <FormField label="Recruiter Observations & Assessment Feedback" required>
                <textarea
                  rows={3}
                  required
                  value={evalData.notes}
                  onChange={e => setEvalData({ ...evalData, notes: e.target.value })}
                  placeholder="Detail candidate problem solving abilities, algorithms used, and depth of technical discussion..."
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>

              <FormField label="Topics Covered & Transcript Highlights">
                <textarea
                  rows={2}
                  value={evalData.transcriptSummary}
                  onChange={e => setEvalData({ ...evalData, transcriptSummary: e.target.value })}
                  placeholder="e.g., Solved binary search algorithm, explained React state reconciler..."
                  style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid #D1D5DB' }}
                />
              </FormField>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setEvaluatingInterview(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 20px', borderRadius: 6, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Save & Move to Call History
                </button>
              </div>

            </form>
          </Modal>
        )}

        {/* Phase 2.2: Recruiter Reschedule Review Modal */}
        {selectedRescheduleReq && (
          <Modal
            isOpen={Boolean(selectedRescheduleReq)}
            title="Review Candidate Reschedule Request"
            onClose={() => !rescheduleActionLoading && setSelectedRescheduleReq(null)}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#64748B' }}>
                  Candidate ID: <strong>{selectedRescheduleReq.studentId || selectedRescheduleReq.student_id}</strong>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginTop: 4 }}>
                  Reason Category: <span style={{ textTransform: 'capitalize' }}>{(selectedRescheduleReq.reasonCode || selectedRescheduleReq.reason_code || '').replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 13, color: '#334155', marginTop: 6, fontStyle: 'italic', background: '#fff', padding: '8px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
                  "{selectedRescheduleReq.reasonDetails || selectedRescheduleReq.reason_details || 'No additional note provided'}"
                </div>
                <div style={{ fontSize: 13, color: '#0369A1', fontWeight: 600, marginTop: 8 }}>
                  Candidate Proposed Slot: {selectedRescheduleReq.proposedDate || selectedRescheduleReq.proposed_date} at {selectedRescheduleReq.proposedTime || selectedRescheduleReq.proposed_time}
                </div>
              </div>

              {/* Action 1: Counter-proposal slot inputs */}
              <div style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                  Option A: Counter-Propose Another Slot
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 3 }}>Alternate Date</label>
                    <input
                      type="date"
                      value={rescheduleActionData.newDate}
                      onChange={e => setRescheduleActionData({ ...rescheduleActionData, newDate: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, color: '#64748B', marginBottom: 3 }}>Alternate Time</label>
                    <input
                      type="time"
                      value={rescheduleActionData.newTime}
                      onChange={e => setRescheduleActionData({ ...rescheduleActionData, newTime: e.target.value })}
                      style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13 }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={rescheduleActionLoading}
                  onClick={() => handleRescheduleAction('propose')}
                  style={{ marginTop: 10, padding: '6px 14px', background: '#4F46E5', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Propose Alternate Slot
                </button>
              </div>

              {/* Action 2: Decline with note */}
              <div style={{ border: '1px solid #FEE2E2', background: '#FFF5F5', borderRadius: 8, padding: 14, marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 6 }}>
                  Option B: Decline Reschedule Request
                </div>
                <input
                  type="text"
                  placeholder="Reason note for candidate (e.g. Hiring drive concludes today)..."
                  value={rescheduleActionData.recruiterNote}
                  onChange={e => setRescheduleActionData({ ...rescheduleActionData, recruiterNote: e.target.value })}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: '1px solid #FECACA', fontSize: 13, marginBottom: 8 }}
                />
                <button
                  type="button"
                  disabled={rescheduleActionLoading}
                  onClick={() => handleRescheduleAction('decline')}
                  style={{ padding: '6px 14px', background: '#DC2626', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  Decline Request
                </button>
              </div>

              {/* Action 3: Accept Candidate Proposed Slot */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid #E5E7EB' }}>
                <button
                  type="button"
                  disabled={rescheduleActionLoading}
                  onClick={() => setSelectedRescheduleReq(null)}
                  style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', fontSize: 13, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  type="button"
                  disabled={rescheduleActionLoading}
                  onClick={() => handleRescheduleAction('approve')}
                  style={{
                    padding: '8px 22px',
                    borderRadius: 6,
                    border: 'none',
                    background: '#059669',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: rescheduleActionLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {rescheduleActionLoading ? 'Updating...' : `✓ Approve Candidate Slot (${selectedRescheduleReq.proposedDate || selectedRescheduleReq.proposed_date})`}
                </button>
              </div>
            </div>
          </Modal>
        )}

      </div>
    </Layout>
  );
}
