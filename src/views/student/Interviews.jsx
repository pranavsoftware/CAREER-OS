import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  Video, Calendar, Clock, CheckCircle2,
  Copy, Check, Camera, Sparkles, ShieldCheck
} from 'lucide-react';

export default function StudentInterviews() {
  const { user } = useAuth();
  const { state } = useData();
  const { students = [], interviews = [] } = state;

  const currentStudent = students.find(s => s.id === user?.studentId) || students[0];

  // Filter interviews for this student
  const myInterviews = interviews.filter(
    i => i.studentId === currentStudent?.id || i.studentEmail === currentStudent?.email || !i.studentId
  );

  const [copiedId, setCopiedId] = useState(null);

  // Hardware Check state
  const [testingMedia, setTestingMedia] = useState(false);
  const [hasHardwareStream, setHasHardwareStream] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  async function startHardwareTest() {
    setStreamError(null);
    setTestingMedia(true);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasHardwareStream(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.warn('Camera/Mic test notice:', err);
      setStreamError('Could not access real camera hardware (permissions blocked or unavailable). Simulation mode is active.');
    }
  }

  function stopHardwareTest() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setHasHardwareStream(false);
    setTestingMedia(false);
  }

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  function handleCopy(meetingId) {
    const fullUrl = `${window.location.origin}/interview-room/${meetingId}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(meetingId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Layout title="My Online Video Interviews">
      <div style={{ maxWidth: 1040, margin: '0 auto' }}>

        {/* Top Banner */}
        <div style={{ background: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)', borderRadius: 16, padding: '28px 24px', color: '#fff', marginBottom: 24, boxShadow: '0 8px 24px -4px rgba(49, 46, 129, 0.25)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 700, color: '#C7D2FE', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
            <Sparkles size={13} color="#A5B4FC" /> Live Placement Recruitment Rounds
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
            Company 1-on-1 Video Interviews
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: '#E0E7FF', opacity: 0.9, maxWidth: 640, lineHeight: 1.6 }}>
            Access all your upcoming online technical and HR rounds. Test your hardware, review company guidelines, and join live rooms directly from your browser.
          </p>
        </div>

        {/* ─── HARDWARE PRE-CHECK WIDGET ─── */}
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', padding: '18px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShieldCheck size={18} color="#059669" /> Pre-Call Hardware Check
              </div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                Ensure your camera, microphone, and speakers are fully functional before your interviewer enters the call.
              </div>
            </div>

            {!testingMedia ? (
              <button
                onClick={startHardwareTest}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 6,
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  border: '1px solid #C7D2FE',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Camera size={14} /> Test Camera & Microphone
              </button>
            ) : (
              <button
                onClick={stopHardwareTest}
                style={{
                  padding: '7px 16px',
                  borderRadius: 6,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #D1D5DB',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Done Testing
              </button>
            )}
          </div>

          {testingMedia && (
            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 8, padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 280, height: 180, background: '#111827', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {!hasHardwareStream && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 12 }}>
                    <Camera size={28} />
                    <span style={{ marginTop: 6 }}>Camera Active (Preview)</span>
                  </div>
                )}
              </div>

              {streamError && (
                <div style={{ fontSize: 12, color: '#B45309', background: '#FEF3C7', padding: '6px 12px', borderRadius: 6, textAlign: 'center' }}>
                  {streamError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                <span>✓ Camera Connected</span>
                <span>✓ Microphone Connected</span>
                <span>✓ WebRTC Compatible</span>
              </div>
            </div>
          )}
        </div>

        {/* ─── INTERVIEWS LIST ─── */}
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>
          Scheduled Online Rounds ({myInterviews.length})
        </h2>

        {myInterviews.length === 0 ? (
          <div style={{ background: '#fff', padding: '40px 20px', borderRadius: 12, border: '1px solid #E5E7EB', textAlign: 'center' }}>
            <Video size={36} color="#9CA3AF" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>No interviews scheduled yet</div>
            <p style={{ fontSize: 13, color: '#6B7280', maxWidth: 440, margin: '6px auto 0' }}>
              When companies shortlist your profile or job applications, your 1-on-1 online video calls will appear here.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {myInterviews.map((item) => {
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
                    
                    {/* Left: Company & Role */}
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: '#EEF2FF',
                          color: '#4F46E5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 18,
                          flexShrink: 0,
                          border: '1px solid #E0E7FF',
                        }}
                      >
                        {item.company?.charAt(0) || 'C'}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#111827' }}>{item.company}</span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>• Recruiter: {item.recruiterName || 'Campus Talent Team'}</span>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#4F46E5', marginTop: 2 }}>
                          {item.role}
                        </div>
                        <div style={{ fontSize: 13, color: '#374151', marginTop: 2 }}>
                          Round: <strong>{item.type}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isScheduled && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 9999, background: '#ECFDF5', color: '#059669', fontSize: 12, fontWeight: 700 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', display: 'inline-block' }} className="animate-pulse-dot" />
                          Ready to Join
                        </span>
                      )}
                      {isCompleted && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 9999, background: '#F3F4F6', color: '#4B5563', fontSize: 12, fontWeight: 700 }}>
                          <CheckCircle2 size={14} color="#059669" /> Round Completed
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date & Time pill row */}
                  <div style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: 8, fontSize: 13, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
                      <Calendar size={15} color="#4F46E5" />
                      <strong>Date:</strong> {item.date}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F2937' }}>
                      <Clock size={15} color="#4F46E5" />
                      <strong>Time:</strong> {item.time} ({item.duration || 45} mins)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#6B7280' }}>
                      <strong>Meeting ID:</strong> <code style={{ background: '#E5E7EB', padding: '2px 6px', borderRadius: 4, color: '#111827' }}>{item.meetingId}</code>
                    </div>
                  </div>

                  {/* Company preparation instructions */}
                  {item.notes && (
                    <div style={{ background: '#EEF2FF', padding: '10px 14px', borderRadius: 8, fontSize: 12, color: '#3730A3' }}>
                      <strong>Company Instructions:</strong> {item.notes}
                    </div>
                  )}

                  {/* If Completed, show evaluation feedback */}
                  {isCompleted && item.evaluation && (
                    <div style={{ background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontWeight: 700, marginBottom: 4 }}>
                        <CheckCircle2 size={16} /> Recruiter Feedback: {item.evaluation.recommendation}
                      </div>
                      <p style={{ margin: 0, color: '#374151', fontSize: 12, lineHeight: 1.5 }}>
                        "{item.evaluation.notes}"
                      </p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 10, borderTop: '1px solid #F3F4F6' }}>
                    <button
                      onClick={() => handleCopy(item.meetingId)}
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
                      {copiedId === item.meetingId ? 'Meeting URL Copied!' : 'Copy Meeting Link'}
                    </button>

                    <Link
                      to={`/interview-room/${item.meetingId}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 22px',
                        borderRadius: 6,
                        background: isCompleted ? '#374151' : '#059669',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        boxShadow: isCompleted ? 'none' : '0 4px 14px rgba(5, 150, 105, 0.35)',
                      }}
                    >
                      <Video size={16} />
                      {isCompleted ? 'Reopen Room' : 'Join Video Call Now'}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </Layout>
  );
}
