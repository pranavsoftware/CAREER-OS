import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare,
  MessageSquare, FileCode, Award, PhoneOff,
  CheckCircle2, Send, Maximize2, Volume2, X
} from 'lucide-react';

export default function InterviewRoom() {
  const { id: meetingId } = useParams();
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const isRecruiter = user?.role === 'company' || user?.role === 'university';
  const roleName = isRecruiter ? 'Interviewer (Company)' : 'Candidate (Student)';

  // Find corresponding interview metadata if available
  const currentInterview = (state.interviews || []).find(
    i => i.meetingId === meetingId || i.id === meetingId
  ) || {
    company: isRecruiter ? (user?.company || 'Demo Company') : 'Recruiting Company',
    role: 'Software Development Engineer - I',
    type: 'Technical & Coding Round',
    studentName: isRecruiter ? 'Aarav Sharma' : (user?.name || 'Aarav Sharma'),
    recruiterName: isRecruiter ? (user?.name || 'Campus Talent Lead') : 'Senior Technical Recruiter',
    duration: 45,
  };

  // Media streams & hardware state
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [activeSidebar, setActiveSidebar] = useState(isRecruiter ? 'scorecard' : 'code'); // 'chat' | 'code' | 'scorecard' | null
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'spotlight'
  const [showEndModal, setShowEndModal] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      sender: 'System Bot',
      role: 'system',
      text: `Meeting room initialized for ${currentInterview.company}. End-to-end encrypted session active.`,
      time: '14:30',
    },
    {
      id: 'm2',
      sender: currentInterview.recruiterName,
      role: 'interviewer',
      text: 'Hello! Welcome to the technical interview. Can you hear and see me clearly?',
      time: '14:31',
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Code editor scratchpad state
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState(`// Technical Interview Coding Workspace
// Problem: Given an array of integers 'nums' and an integer 'target',
// return indices of the two numbers such that they add up to target.

function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}

// Test case:
console.log(twoSum([2, 7, 11, 15], 9)); // Expected: [0, 1]
`);

  // Recruiter Evaluation Scorecard State
  const [evaluation, setEvaluation] = useState({
    technicalScore: 4.5,
    problemSolvingScore: 5.0,
    communicationScore: 4.0,
    codeQualityScore: 4.5,
    recommendation: 'Strong Hire',
    notes: 'Demonstrated solid algorithmic foundation. Easily identified optimal hash map O(n) approach. Clean and readable JavaScript code.',
  });
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const broadcastRef = useRef(null);

  // Cross-tab synchronization via BroadcastChannel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(`career_os_call_${meetingId}`);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data;
        if (type === 'CHAT_MSG') {
          setChatMessages(prev => [...prev, payload]);
        } else if (type === 'CODE_SYNC') {
          setCodeContent(payload);
        } else if (type === 'CALL_ENDED') {
          setShowEndModal(true);
        }
      };

      return () => {
        channel.close();
      };
    } catch {
      // Ignore broadcast errors in non-supporting contexts
    }
  }, [meetingId]);

  // Request local camera and microphone stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: true,
          });
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          localStreamRef.current = stream;
          setHasLocalStream(true);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Real camera not available or permission denied, using simulated stream:', err);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Timer loop
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format seconds to mm:ss
  function formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Toggle Mic
  function toggleMic() {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = micMuted; // toggle
      });
    }
    setMicMuted(!micMuted);
  }

  // Toggle Video
  function toggleVideo() {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => {
        t.enabled = videoOff; // toggle
      });
    }
    setVideoOff(!videoOff);
  }

  // Screen share
  async function toggleScreenShare() {
    if (screenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      setScreenSharing(false);
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = screenStream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          screenStream.getVideoTracks()[0].onended = () => {
            setScreenSharing(false);
            if (localVideoRef.current && localStreamRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
          };
          setScreenSharing(true);
        }
      } catch (err) {
        console.warn('Screen share cancelled or failed:', err);
      }
    }
  }

  // Send Chat message
  function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}`,
      sender: user?.name || (isRecruiter ? 'Interviewer' : 'Candidate'),
      role: isRecruiter ? 'interviewer' : 'candidate',
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');

    // Broadcast to other tab
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CHAT_MSG', payload: newMsg });
    }
  }

  // Code change
  function handleCodeChange(val) {
    setCodeContent(val);
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CODE_SYNC', payload: val });
    }
  }

  // Submit recruiter evaluation
  function handleEvaluationSubmit() {
    dispatch({
      type: 'UPDATE_INTERVIEW',
      payload: {
        id: currentInterview.id,
        meetingId,
        status: 'Completed',
        evaluation,
      },
    });
    setEvalSubmitted(true);
  }

  // End call
  function handleEndCall() {
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CALL_ENDED' });
    }
    setShowEndModal(true);
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#090D16', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'var(--font-sans)' }}>

      {/* ─── TOP BAR ─── */}
      <header style={{ height: 56, background: '#0F172A', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
        
        {/* Left: Meeting Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <VideoIcon size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{currentInterview.company} • {currentInterview.type}</span>
              <span style={{ fontSize: 11, background: 'rgba(34,197,94,0.18)', color: '#4ADE80', padding: '2px 8px', borderRadius: 9999, fontWeight: 600 }}>
                HD 1080p
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#94A3B8' }}>
              Room ID: <code style={{ color: '#E2E8F0' }}>{meetingId}</code> • Connected as <strong style={{ color: '#A5B4FC' }}>{roleName}</strong>
            </div>
          </div>
        </div>

        {/* Center: Live Call Timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1E293B', padding: '6px 14px', borderRadius: 9999 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block' }} className="animate-pulse-dot" />
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', color: '#F1F5F9' }}>
            {formatTime(callDuration)}
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>/ {currentInterview.duration || 45}:00</span>
        </div>

        {/* Right: Quick Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setViewMode(viewMode === 'split' ? 'spotlight' : 'split')}
            style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 6, color: '#CBD5E1', padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <Maximize2 size={13} /> {viewMode === 'split' ? 'Spotlight View' : 'Split View'}
          </button>
        </div>
      </header>

      {/* ─── MAIN BODY (VIDEOS + SIDEBAR) ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Video Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: 16, overflowY: 'auto' }}>
          
          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: viewMode === 'split' ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr',
              gap: 16,
              minHeight: 0,
            }}
          >
            {/* ── REMOTE PARTICIPANT (THE OTHER PARTY) ── */}
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                minHeight: 280,
              }}
            >
              {/* Simulated active video stream or remote peer */}
              <img
                src={isRecruiter ? '/focused_student.jpg' : '/images/hr_interviewer.jpg'}
                alt="Remote Participant"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.92,
                }}
              />

              {/* Participant Name Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  background: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} />
                <span>{isRecruiter ? `${currentInterview.studentName} (Candidate)` : `${currentInterview.recruiterName} (${currentInterview.company})`}</span>
              </div>

              {/* Audio Activity Indicator */}
              <div
                style={{
                  position: 'absolute',
                  top: 14,
                  right: 14,
                  background: 'rgba(15,23,42,0.85)',
                  padding: '6px 10px',
                  borderRadius: 9999,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#4ADE80',
                }}
              >
                <Volume2 size={13} />
                <span>Speaking</span>
              </div>
            </div>

            {/* ── LOCAL PARTICIPANT (YOU) ── */}
            <div
              style={{
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
                background: '#0F172A',
                border: '1px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                minHeight: 280,
              }}
            >
              {videoOff ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#94A3B8' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: '#F8FAFC' }}>
                    {user?.name?.charAt(0) || (isRecruiter ? 'I' : 'C')}
                  </div>
                  <div style={{ fontSize: 13 }}>Camera is Off</div>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: screenSharing ? 'none' : 'scaleX(-1)', // mirror selfie camera
                  }}
                />
              )}

              {/* Fallback if user webcam is disabled/unavailable */}
              {!hasLocalStream && !videoOff && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: '#94A3B8', gap: 8 }}>
                  <div style={{ width: 68, height: 68, borderRadius: '50%', background: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#818CF8' }}>
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9' }}>{user?.name || (isRecruiter ? 'Interviewer' : 'Aarav Sharma')} (You)</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Local video feed active</div>
                </div>
              )}

              {/* Local Name Badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 14,
                  left: 14,
                  background: 'rgba(15,23,42,0.85)',
                  backdropFilter: 'blur(8px)',
                  padding: '6px 14px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span>{user?.name || (isRecruiter ? 'Interviewer' : 'Candidate')} (You)</span>
                {micMuted && <MicOff size={13} color="#EF4444" />}
                {screenSharing && <span style={{ color: '#38BDF8', fontSize: 11 }}>• Sharing Screen</span>}
              </div>
            </div>

          </div>
        </div>

        {/* ─── SIDEBAR (CHAT / CODE / SCORECARD) ─── */}
        {activeSidebar && (
          <aside
            style={{
              width: 380,
              maxWidth: '38vw',
              background: '#0F172A',
              borderLeft: '1px solid #1E293B',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
            }}
          >
            {/* Sidebar Tab Header */}
            <div style={{ display: 'flex', borderBottom: '1px solid #1E293B', background: '#090D16' }}>
              <button
                onClick={() => setActiveSidebar('code')}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  background: 'none',
                  border: 'none',
                  color: activeSidebar === 'code' ? '#818CF8' : '#94A3B8',
                  borderBottom: activeSidebar === 'code' ? '2px solid #818CF8' : '2px solid transparent',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <FileCode size={14} /> Coding Pad
              </button>
              
              <button
                onClick={() => setActiveSidebar('chat')}
                style={{
                  flex: 1,
                  padding: '12px 10px',
                  background: 'none',
                  border: 'none',
                  color: activeSidebar === 'chat' ? '#818CF8' : '#94A3B8',
                  borderBottom: activeSidebar === 'chat' ? '2px solid #818CF8' : '2px solid transparent',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <MessageSquare size={14} /> Live Chat
              </button>

              {isRecruiter && (
                <button
                  onClick={() => setActiveSidebar('scorecard')}
                  style={{
                    flex: 1,
                    padding: '12px 10px',
                    background: 'none',
                    border: 'none',
                    color: activeSidebar === 'scorecard' ? '#818CF8' : '#94A3B8',
                    borderBottom: activeSidebar === 'scorecard' ? '2px solid #818CF8' : '2px solid transparent',
                    fontSize: 12,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    cursor: 'pointer',
                  }}
                >
                  <Award size={14} /> Scorecard
                </button>
              )}

              <button
                onClick={() => setActiveSidebar(null)}
                style={{ background: 'none', border: 'none', color: '#64748B', padding: '0 12px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Sidebar Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              
              {/* 1. CODE SCRATCHPAD */}
              {activeSidebar === 'code' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1' }}>Collaborative Live Pad</span>
                    <select
                      value={codeLanguage}
                      onChange={e => setCodeLanguage(e.target.value)}
                      style={{ background: '#1E293B', color: '#CBD5E1', border: '1px solid #334155', borderRadius: 4, padding: '3px 8px', fontSize: 11 }}
                    >
                      <option value="javascript">JavaScript (ES6)</option>
                      <option value="python">Python 3.11</option>
                      <option value="cpp">C++ 20</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>

                  <textarea
                    value={codeContent}
                    onChange={e => handleCodeChange(e.target.value)}
                    spellCheck="false"
                    style={{
                      flex: 1,
                      width: '100%',
                      background: '#090D16',
                      color: '#38BDF8',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                      padding: '12px',
                      borderRadius: 8,
                      border: '1px solid #1E293B',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    ✓ Edits synchronized live with the other participant.
                  </div>
                </div>
              )}

              {/* 2. LIVE CHAT */}
              {activeSidebar === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 12 }}>
                    {chatMessages.map(msg => (
                      <div
                        key={msg.id}
                        style={{
                          background: msg.role === 'system' ? '#1E293B' : msg.role === 'interviewer' ? '#1E1B4B' : '#0F172A',
                          border: '1px solid #334155',
                          borderRadius: 8,
                          padding: '8px 12px',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <span style={{ fontWeight: 700, color: msg.role === 'system' ? '#94A3B8' : msg.role === 'interviewer' ? '#A5B4FC' : '#38BDF8' }}>
                            {msg.sender}
                          </span>
                          <span style={{ fontSize: 10, color: '#64748B' }}>{msg.time}</span>
                        </div>
                        <div style={{ color: '#E2E8F0', lineHeight: 1.4 }}>{msg.text}</div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Type a message or share link..."
                      style={{
                        flex: 1,
                        background: '#1E293B',
                        border: '1px solid #334155',
                        borderRadius: 6,
                        padding: '8px 12px',
                        color: '#fff',
                        fontSize: 12,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{ background: '#4F46E5', border: 'none', borderRadius: 6, color: '#fff', padding: '0 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}

              {/* 3. RECRUITER SCORECARD */}
              {activeSidebar === 'scorecard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
                      Candidate Evaluation Dossier
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>
                      Candidate: {currentInterview.studentName}
                    </div>
                  </div>

                  {/* Rating Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { key: 'technicalScore', label: 'Technical Competence' },
                      { key: 'problemSolvingScore', label: 'Data Structures & Problem Solving' },
                      { key: 'codeQualityScore', label: 'Code Quality & Clean Architecture' },
                      { key: 'communicationScore', label: 'Communication & Articulation' },
                    ].map(metric => (
                      <div key={metric.key} style={{ background: '#1E293B', padding: '10px 12px', borderRadius: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                          <span style={{ color: '#CBD5E1' }}>{metric.label}</span>
                          <span style={{ fontWeight: 700, color: '#818CF8' }}>{evaluation[metric.key]} / 5.0</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={evaluation[metric.key]}
                          onChange={e => setEvaluation({ ...evaluation, [metric.key]: parseFloat(e.target.value) })}
                          style={{ width: '100%', accentColor: '#4F46E5' }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Hiring Recommendation */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1', display: 'block', marginBottom: 6 }}>
                      Hiring Recommendation
                    </label>
                    <select
                      value={evaluation.recommendation}
                      onChange={e => setEvaluation({ ...evaluation, recommendation: e.target.value })}
                      style={{ width: '100%', background: '#1E293B', color: '#fff', border: '1px solid #334155', borderRadius: 6, padding: '8px', fontSize: 12 }}
                    >
                      <option value="Strong Hire">Strong Hire (Top 5%)</option>
                      <option value="Hire">Hire (Meets All Standards)</option>
                      <option value="Hold / Further Round">Hold / Requires Second Technical Round</option>
                      <option value="Reject">Reject (Does Not Meet Bar)</option>
                    </select>
                  </div>

                  {/* Notes */}
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#CBD5E1', display: 'block', marginBottom: 6 }}>
                      Interview Notes & Feedback
                    </label>
                    <textarea
                      rows={4}
                      value={evaluation.notes}
                      onChange={e => setEvaluation({ ...evaluation, notes: e.target.value })}
                      placeholder="Candidate's strengths, areas of improvement, and specific answers..."
                      style={{ width: '100%', background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', fontSize: 12, resize: 'vertical' }}
                    />
                  </div>

                  <button
                    onClick={handleEvaluationSubmit}
                    disabled={evalSubmitted}
                    style={{
                      padding: '10px',
                      borderRadius: 6,
                      border: 'none',
                      background: evalSubmitted ? '#059669' : '#4F46E5',
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: evalSubmitted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {evalSubmitted ? <CheckCircle2 size={15} /> : <Award size={15} />}
                    {evalSubmitted ? 'Evaluation Saved to Candidate File' : 'Save Evaluation & Complete Round'}
                  </button>
                </div>
              )}

            </div>
          </aside>
        )}

      </div>

      {/* ─── BOTTOM CONTROLS BAR ─── */}
      <footer
        style={{
          height: 72,
          background: '#0F172A',
          borderTop: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          flexShrink: 0,
        }}
      >
        {/* Left: Meeting Info */}
        <div style={{ fontSize: 12, color: '#64748B' }}>
          <span>Career-OS Realtime WebRTC Call</span>
        </div>

        {/* Center: Controls Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mic */}
          <button
            onClick={toggleMic}
            title={micMuted ? 'Unmute Microphone' : 'Mute Microphone'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: micMuted ? '#EF4444' : '#1E293B',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Video */}
          <button
            onClick={toggleVideo}
            title={videoOff ? 'Turn Video On' : 'Turn Video Off'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: videoOff ? '#EF4444' : '#1E293B',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {videoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            title={screenSharing ? 'Stop Screen Share' : 'Share Screen'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: screenSharing ? '#0284C7' : '#1E293B',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ScreenShare size={20} />
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndCall}
            title="Leave / End Interview"
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 22,
              border: 'none',
              background: '#DC2626',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(220,38,38,0.4)',
            }}
          >
            <PhoneOff size={18} /> End Interview
          </button>
        </div>

        {/* Right: Sidebar Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setActiveSidebar(activeSidebar === 'code' ? null : 'code')}
            style={{
              background: activeSidebar === 'code' ? '#4F46E5' : '#1E293B',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#fff',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <FileCode size={15} /> Coding Pad
          </button>

          <button
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
            style={{
              background: activeSidebar === 'chat' ? '#4F46E5' : '#1E293B',
              border: '1px solid #334155',
              borderRadius: 6,
              color: '#fff',
              padding: '8px 12px',
              fontSize: 12,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <MessageSquare size={15} /> Chat
          </button>

          {isRecruiter && (
            <button
              onClick={() => setActiveSidebar(activeSidebar === 'scorecard' ? null : 'scorecard')}
              style={{
                background: activeSidebar === 'scorecard' ? '#4F46E5' : '#1E293B',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#fff',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <Award size={15} /> Scorecard
            </button>
          )}
        </div>
      </footer>

      {/* ─── CALL ENDED DIALOG ─── */}
      {showEndModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0F172A',
              border: '1px solid #334155',
              borderRadius: 20,
              padding: '32px 28px',
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              color: '#fff',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#1E293B', color: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle2 size={32} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
              Interview Session Concluded
            </h2>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 20px', lineHeight: 1.5 }}>
              Total call duration: <strong>{formatTime(callDuration)}</strong>.
              {isRecruiter
                ? ' Candidate evaluation feedback has been logged to the institutional database.'
                : ' Thank you for attending. The recruiter feedback and hiring decision will be updated on your portal.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to={isRecruiter ? '/company/interviews' : '/student/interviews'}
                style={{
                  display: 'block',
                  padding: '11px',
                  borderRadius: 8,
                  background: '#4F46E5',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Return to Interviews Hub
              </Link>
              <Link
                to={isRecruiter ? '/company/dashboard' : '/student/dashboard'}
                style={{
                  display: 'block',
                  padding: '11px',
                  borderRadius: 8,
                  background: '#1E293B',
                  color: '#CBD5E1',
                  fontWeight: 500,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Go to Main Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
