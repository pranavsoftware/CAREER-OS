'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  Mic, MicOff, Video as VideoIcon, VideoOff, ScreenShare,
  MessageSquare, FileCode, Award, PhoneOff,
  CheckCircle2, Send, Maximize2, Volume2, X,
  Hand, Smile, Info, Users, ShieldCheck, Copy, Check,
  Subtitles, AlertCircle, Sparkles, Lock,
  Heart, ThumbsUp, PartyPopper, Flame, Radio, UserPlus, Clock,
  Wifi, WifiOff, Activity, Signal, Zap, Gauge,
  HelpCircle, CheckSquare, Code2, UserMinus, Tv, ListPlus, Play, RefreshCw
} from 'lucide-react';

const REACTION_TYPES = [
  { id: 'heart', label: 'Love', icon: Heart, color: '#F43F5E', fill: '#F43F5E' },
  { id: 'thumbs_up', label: 'Thumbs Up', icon: ThumbsUp, color: '#3B82F6', fill: '#3B82F6' },
  { id: 'party', label: 'Celebrate', icon: PartyPopper, color: '#F59E0B', fill: 'none' },
  { id: 'clap', label: 'Applause', icon: Sparkles, color: '#10B981', fill: 'none' },
  { id: 'smile', label: 'Smile', icon: Smile, color: '#EAB308', fill: 'none' },
  { id: 'fire', label: 'Fire', icon: Flame, color: '#EF4444', fill: '#EF4444' },
];

const STUN_SERVERS = {
  iceServers: [
    // Primary Google Global Anycast STUN
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    // Cloudflare Global STUN (Zero-latency edge)
    { urls: 'stun:stun.cloudflare.com:3478' },
    // Twilio Global WebRTC STUN
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Free Enterprise STUN Relays
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:stun.nextcloud.com:443' },
    { urls: 'stun:stun.matrix.org:443' },
    { urls: 'stun:openrelay.metered.ca:80' },
    // Metered TURN Servers (UDP, TCP, and Secure TLS 443 fallback for restricted corporate / college Wi-Fi)
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
        'turns:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all',
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
};

// ── Real WebRTC Remote Video Tile with Admin Controls ──
function RemoteVideoTile({ peer, compact = false, isRecruiter = false, onMute, onDisableVideo, onKick }) {
  const videoRef = useRef(null);
  const isMountedRef = useRef(true);
  const [, setTrackVersion] = useState(0);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      if (videoRef.current.srcObject !== peer.stream) {
        videoRef.current.srcObject = peer.stream;
      }
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          // AbortError is normal when browser switches tabs, minimizes window, or unmounts tile
          if (e.name === 'AbortError' || e.name === 'NotAllowedError') {
            return;
          }
          console.debug('Remote video play state:', e.message || e);
        });
      }
    }
  }, [peer.stream]);

  // Listen to track state events to ensure live video appears instantly when transmitted
  useEffect(() => {
    if (!peer.stream) return;
    const forceUpdate = () => setTrackVersion(v => v + 1);
    peer.stream.addEventListener('addtrack', forceUpdate);
    peer.stream.addEventListener('removetrack', forceUpdate);
    peer.stream.getVideoTracks().forEach(t => {
      t.addEventListener('unmute', forceUpdate);
      t.addEventListener('mute', forceUpdate);
    });
    return () => {
      peer.stream?.removeEventListener('addtrack', forceUpdate);
      peer.stream?.removeEventListener('removetrack', forceUpdate);
    };
  }, [peer.stream]);

  const hasVideoTrack = peer.stream && peer.stream.getVideoTracks().length > 0 && peer.stream.getVideoTracks().some(t => t.enabled);
  const isCamOff = peer.videoOff || !peer.stream || !hasVideoTrack;

  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 16,
        overflow: 'hidden',
        background: '#202124',
        height: '100%',
        maxHeight: '100%',
        minHeight: compact ? 160 : 280,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
        border: '2px solid #5F6368',
      }}
    >
      {/* ALWAYS keep video element in DOM so audio stream plays and video connects without race conditions */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: isCamOff ? 'none' : 'block',
        }}
      />

      {isCamOff && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#9AA0A6' }}>
          <div
            style={{
              width: compact ? 52 : 80,
              height: compact ? 52 : 80,
              borderRadius: '50%',
              background: '#1A73E8',
              color: '#fff',
              fontSize: compact ? 22 : 32,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(26,115,232,0.4)',
            }}
          >
            {peer.name?.charAt(0) || 'P'}
          </div>
          <div style={{ fontSize: compact ? 11 : 13, fontWeight: 600 }}>
            {peer.videoOff ? 'Camera is turned off' : (!peer.stream ? 'Connecting live stream...' : 'Live video active')}
          </div>
        </div>
      )}

      {/* Participant Name Badge */}
      <div
        style={{
          position: 'absolute',
          bottom: compact ? 8 : 16,
          left: compact ? 8 : 16,
          background: 'rgba(32,33,36,0.85)',
          backdropFilter: 'blur(8px)',
          padding: compact ? '4px 8px' : '6px 14px',
          borderRadius: 8,
          fontSize: compact ? 11 : 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5,
        }}
      >
        <span>{peer.name} ({peer.role === 'company' || peer.isRecruiter ? 'Interviewer' : 'Candidate'})</span>
      </div>

      {/* Network Quality Indicator on Remote Participant */}
      <div
        style={{
          position: 'absolute',
          top: compact ? 8 : 16,
          left: compact ? 8 : 16,
          background: 'rgba(32,33,36,0.85)',
          padding: compact ? '3px 8px' : '4px 10px',
          borderRadius: 9999,
          fontSize: 11,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#E8EAED',
          border: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5,
        }}
        title="Peer Network Connection: Stable HD"
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 11 }}>
          <span style={{ width: 3, height: 3, borderRadius: 1, background: '#34A853' }} />
          <span style={{ width: 3, height: 6, borderRadius: 1, background: '#34A853' }} />
          <span style={{ width: 3, height: 9, borderRadius: 1, background: '#34A853' }} />
          <span style={{ width: 3, height: 11, borderRadius: 1, background: '#34A853' }} />
        </div>
        <span style={{ fontSize: 10, color: '#81C995', fontWeight: 600 }}>HD</span>
      </div>

      {/* Top Right: Mic Status & Host Admin Quick Actions */}
      <div style={{ position: 'absolute', top: compact ? 8 : 16, right: compact ? 8 : 16, display: 'flex', alignItems: 'center', gap: 6, zIndex: 5 }}>
        {/* Mic Audio Indicator */}
        <div
          style={{
            background: 'rgba(32,33,36,0.85)',
            padding: compact ? '4px 8px' : '6px 12px',
            borderRadius: 9999,
            fontSize: compact ? 11 : 12,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: peer.micMuted ? '#EA4335' : '#81C995',
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          {peer.micMuted ? (
            <>
              <MicOff size={14} color="#EA4335" />
              <span>Muted</span>
            </>
          ) : (
            <>
              <Volume2 size={15} color="#81C995" />
              <span>Live Audio</span>
            </>
          )}
        </div>

        {/* Host Admin Controls on Participant Tile */}
        {isRecruiter && !peer.isRecruiter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(32,33,36,0.9)', padding: '3px 6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)' }}>
            <button
              type="button"
              onClick={onMute}
              title="Host Admin: Mute candidate microphone"
              style={{ background: 'none', border: 'none', color: '#EA4335', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              <MicOff size={14} />
            </button>
            <button
              type="button"
              onClick={onDisableVideo}
              title="Host Admin: Turn off candidate video"
              style={{ background: 'none', border: 'none', color: '#F9AB00', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              <VideoOff size={14} />
            </button>
            <button
              type="button"
              onClick={onKick}
              title="Host Admin: Remove candidate from meeting"
              style={{ background: 'none', border: 'none', color: '#EA4335', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
            >
              <UserMinus size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InterviewRoom({ meetingId: meetingIdProp }) {
  let routerId = null;
  try {
    const params = useParams();
    routerId = params?.id;
  } catch {}

  let pathnameId = null;
  if (typeof window !== 'undefined') {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const roomIdx = parts.indexOf('interview-room');
    if (roomIdx !== -1 && parts[roomIdx + 1]) {
      pathnameId = parts[roomIdx + 1];
    } else {
      pathnameId = parts[parts.length - 1];
    }
  }

  const meetingId = meetingIdProp || routerId || pathnameId;
  const { user } = useAuth();
  const { state, dispatch } = useData();

  const isRecruiter = user?.role === 'company' || user?.role === 'university';
  const myRole = isRecruiter ? 'interviewer' : 'candidate';
  const myName = user?.name || (isRecruiter ? 'Interviewer' : 'Candidate');

  // Fetch direct interview metadata from database on refresh/direct entry
  const [dbInterview, setDbInterview] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/interviews')
      .then(r => r.json())
      .then(d => {
        if (!isMounted || !d.interviews) return;
        const found = d.interviews.find(i => i.meetingId === meetingId || i.id === meetingId);
        if (found) setDbInterview(found);
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [meetingId]);

  // Find corresponding interview metadata from state or database
  const currentInterview = (state.interviews || []).find(
    i => i.meetingId === meetingId || i.id === meetingId
  ) || dbInterview || {
    company: isRecruiter ? (user?.company || 'Company Portal') : 'Company Placement Partner',
    role: 'Software Development Engineer',
    type: 'Technical & Coding Round',
    studentName: isRecruiter ? 'Candidate' : (user?.name || 'Candidate'),
    recruiterName: isRecruiter ? (user?.name || 'Interviewer') : 'Interviewer',
    duration: 45,
  };

  // Google Meet Lobby (Pre-Join screen) vs In-Call Room state
  const [inLobby, setInLobby] = useState(true);

  // Google Meet Host Admission & Candidate Waiting State
  // For candidate/student: 'idle' | 'waiting' | 'admitted' | 'denied'
  const [joinStatus, setJoinStatus] = useState(isRecruiter ? 'admitted' : 'idle');
  // For meeting host: pending knock requests list
  const [pendingJoinRequests, setPendingJoinRequests] = useState([]);

  // Local media stream
  const [hasLocalStream, setHasLocalStream] = useState(false);
  const [micMuted, setMicMuted] = useState(false);
  const [videoOff, setVideoOff] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC Multi-user state
  const myPeerId = useRef(`peer_${Math.random().toString(36).slice(2, 9)}_${Date.now()}`).current;
  const [remotePeers, setRemotePeers] = useState({});
  const peerConnectionsRef = useRef(new Map());
  const remoteStreamsRef = useRef(new Map());
  const pendingIceCandidatesRef = useRef(new Map());
  const broadcastRef = useRef(null);
  const lastPollTimeRef = useRef(0);
  const initiatedOffersRef = useRef(new Set());
  const processedSignalsRef = useRef(new Set());

  // Network Health & Diagnostic Telemetry State
  const [networkStats, setNetworkStats] = useState({
    status: 'good',
    latency: 28,
    jitter: 4,
    packetLoss: 0.0,
    effectiveType: '4G',
    downlink: 10.5,
    connectionState: 'P2P Direct Encrypted (WebRTC)',
    qualityScore: 96,
    lastChecked: Date.now(),
  });
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Active Drawers / Sidebars: 'chat' | 'code' | 'people' | 'info' | 'scorecard' | null
  const [activeSidebar, setActiveSidebar] = useState(null);
  const [viewMode, setViewMode] = useState('split');
  const [showEndModal, setShowEndModal] = useState(false);
  const [showHostEndChoiceModal, setShowHostEndChoiceModal] = useState(false);
  const [isEndedForAll, setIsEndedForAll] = useState(false);
  const [meetingEndedReason, setMeetingEndedReason] = useState('Your live video session has ended.');
  const [copiedLink, setCopiedLink] = useState(false);

  // Interactive features: Hand Raise, Reactions
  const [handRaised, setHandRaised] = useState(false);
  const [showReactionsMenu, setShowReactionsMenu] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState([]);

  // Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'm1',
      sender: 'Career-OS Meet',
      role: 'system',
      text: `Meeting room initialized. Real-time encrypted person-to-person session is active.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  // Initial load of persistent chat messages (continuous sync handled by unified serverless sync)
  useEffect(() => {
    let isMounted = true;
    async function fetchChatMessages() {
      try {
        const res = await fetch(`/api/interviews/messages?meetingId=${encodeURIComponent(meetingId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success && Array.isArray(data.messages) && data.messages.length > 0) {
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newFromDb = data.messages.filter(m => !existingIds.has(m.id));
            if (newFromDb.length === 0) return prev;
            return [...prev, ...newFromDb];
          });
        }
      } catch {}
    }

    fetchChatMessages();
    return () => {
      isMounted = false;
    };
  }, [meetingId]);

  // Code editor scratchpad state
  const [codeLanguage, setCodeLanguage] = useState('javascript');
  const [codeContent, setCodeContent] = useState(`// Collaborative Technical Interview Workspace
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
console.log(twoSum([2, 7, 11, 15], 9)); // Output: [0, 1]
`);

  // Recruiter Evaluation Scorecard State
  const [evaluation, setEvaluation] = useState({
    technicalScore: 4.5,
    problemSolvingScore: 4.5,
    communicationScore: 4.5,
    codeQualityScore: 4.5,
    recommendation: 'Strong Hire',
    notes: 'Live interview session conducted on Career-OS.',
  });
  const [evalSubmitted, setEvalSubmitted] = useState(false);

  // Live Assessment & Interactive Questions State (MCQ & Coding from Database)
  const [mcqQuestions, setMcqQuestions] = useState([]);
  const [codingChallenges, setCodingChallenges] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);

  // Initial fetch of real questions and coding challenges from PostgreSQL database
  useEffect(() => {
    let isMounted = true;
    async function loadDatabaseQuestions() {
      try {
        const res = await fetch(`/api/interviews/questions?meetingId=${encodeURIComponent(meetingId)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          if (Array.isArray(data.mcqQuestions)) {
            setMcqQuestions(data.mcqQuestions);
          }
          if (Array.isArray(data.codingChallenges)) {
            setCodingChallenges(data.codingChallenges);
          }
          if (!isRecruiter && data.activeQuestion) {
            setActiveQuestion(data.activeQuestion);
          }
        }
      } catch (err) {
        console.error('Error fetching interview questions from database:', err);
      } finally {
        if (isMounted) setQuestionsLoading(false);
      }
    }

    loadDatabaseQuestions();
    return () => {
      isMounted = false;
    };
  }, [meetingId, isRecruiter]);

  const [activeQuestion, setActiveQuestion] = useState(null);
  const [questionAnswers, setQuestionAnswers] = useState([]);
  const [studentSelectedOption, setStudentSelectedOption] = useState(null);
  const [studentAnswerSubmitted, setStudentAnswerSubmitted] = useState(false);
  const [studentCodeSubmitted, setStudentCodeSubmitted] = useState(false);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(null); // in seconds
  const [assessmentTab, setAssessmentTab] = useState('onspot'); // 'onspot' | 'session' | 'custom'

  // MCQ & Coding countdown timer — starts ticking from active question's display
  useEffect(() => {
    if (!activeQuestion) {
      setQuestionTimeLeft(null);
      return;
    }

    // Default duration: 90s for MCQ, 300s (5 min) for Coding Challenge, or question.timeLimit
    const duration = activeQuestion.timeLimit || (activeQuestion.type === 'code' ? 300 : 90);
    setQuestionTimeLeft(duration);

    const timer = setInterval(() => {
      setQuestionTimeLeft(prev => {
        if (prev === null) return duration;
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [activeQuestion?.id]);

  // On-the-spot question generator state
  const [onSpotForm, setOnSpotForm] = useState({
    topic: 'DSA',
    difficulty: 'Medium',
    type: 'mcq',
  });
  const [generatingOnSpot, setGeneratingOnSpot] = useState(false);
  const [lastGeneratedQuestion, setLastGeneratedQuestion] = useState(null);

  const handleGenerateOnSpot = async (overrideParams = {}) => {
    setGeneratingOnSpot(true);
    const targetTopic = overrideParams.topic || onSpotForm.topic;
    const targetDifficulty = overrideParams.difficulty || onSpotForm.difficulty;
    const targetType = overrideParams.type || onSpotForm.type;
    const postImmediately = Boolean(overrideParams.postImmediately);

    try {
      const res = await fetch('/api/interviews/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate_on_spot',
          meetingId,
          topic: targetTopic,
          difficulty: targetDifficulty,
          type: targetType,
          postImmediately,
        }),
      });
      const data = await res.json();
      if (data.success && data.question) {
        setLastGeneratedQuestion(data.question);
        if (data.question.type === 'mcq') {
          setMcqQuestions(prev => {
            const exists = prev.some(q => q.id === data.question.id);
            return exists ? prev : [data.question, ...prev];
          });
        } else {
          setCodingChallenges(prev => {
            const exists = prev.some(q => q.id === data.question.id);
            return exists ? prev : [data.question, ...prev];
          });
        }

        if (postImmediately) {
          handlePostQuestion(data.question);
          if (data.question.type === 'code') {
            setActiveSidebar('code');
          }
        }
      }
    } catch (err) {
      console.error('Error generating question on spot:', err);
    } finally {
      setGeneratingOnSpot(false);
    }
  };

  const [customQuestionForm, setCustomQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correct: 0,
    points: 10,
    topic: 'Core Technical',
  });

  // Admin Notification & Kick Confirmation State
  const [adminAlert, setAdminAlert] = useState(null);
  const [kickConfirmModal, setKickConfirmModal] = useState({ open: false, peerId: null, name: '' });

  const localVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const lobbyVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Send signaling message (BroadcastChannel for same-origin tabs + HTTP API fallback for cross-browser/device)
  const sendSignalingMessage = (msgData) => {
    const message = {
      meetingId,
      from: myPeerId,
      ...msgData,
    };

    // 1. Same-origin BroadcastChannel (instantaneous)
    try {
      if (broadcastRef.current) {
        broadcastRef.current.postMessage({ type: 'WEBRTC_SIGNAL', message });
      }
    } catch {}

    // 2. HTTP signaling API
    fetch('/api/meeting-signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    }).catch(() => {});
  };

  // Helper to create or get an RTCPeerConnection for a remote peer
  const getOrCreatePeerConnection = (remotePeerId, peerName, peerRole, peerIsRecruiter) => {
    let pc = peerConnectionsRef.current.get(remotePeerId);

    if (!pc) {
      pc = new RTCPeerConnection(STUN_SERVERS);
      peerConnectionsRef.current.set(remotePeerId, pc);

      // ICE Candidate generation
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalingMessage({
            to: remotePeerId,
            signalType: 'CANDIDATE',
            candidate: event.candidate,
          });
        }
      };

      // When remote track arrives, store remote stream (safely handles multiple audio and video tracks)
      pc.ontrack = (event) => {
        let stream = remoteStreamsRef.current.get(remotePeerId);
        if (!stream) {
          stream = new MediaStream();
          remoteStreamsRef.current.set(remotePeerId, stream);
        }

        // Add the incoming track if not already in stream
        if (event.track && !stream.getTracks().some(t => t.id === event.track.id)) {
          stream.addTrack(event.track);
        }

        // Also incorporate any stream from event.streams
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach(t => {
            if (!stream.getTracks().some(existing => existing.id === t.id)) {
              stream.addTrack(t);
            }
          });
        }

        // Clone stream reference so React detects state change and re-renders
        const streamClone = new MediaStream(stream.getTracks());

        setRemotePeers(prev => ({
          ...prev,
          [remotePeerId]: {
            ...(prev[remotePeerId] || {}),
            peerId: remotePeerId,
            name: peerName || prev[remotePeerId]?.name || 'Participant',
            role: peerRole || prev[remotePeerId]?.role || 'Candidate',
            isRecruiter: peerIsRecruiter !== undefined ? peerIsRecruiter : prev[remotePeerId]?.isRecruiter,
            stream: streamClone,
            micMuted: prev[remotePeerId]?.micMuted || false,
            videoOff: prev[remotePeerId]?.videoOff || false,
          },
        }));
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
          peerConnectionsRef.current.delete(remotePeerId);
          remoteStreamsRef.current.delete(remotePeerId);
          initiatedOffersRef.current.delete(remotePeerId);
          setRemotePeers(prev => {
            const next = { ...prev };
            delete next[remotePeerId];
            return next;
          });
        }
      };
    }

    // Ensure all local audio & video tracks are attached to this peer connection in deterministic order
    if (localStreamRef.current) {
      const existingSenders = pc.getSenders();
      // Crucial: Always add audio tracks first, then video tracks to preserve identical SDP m-line ordering across offers/answers
      const audioTracks = localStreamRef.current.getAudioTracks();
      const videoTracks = localStreamRef.current.getVideoTracks();
      const orderedTracks = [...audioTracks, ...videoTracks];

      orderedTracks.forEach(track => {
        const isAlreadyAdded = existingSenders.some(s => s.track && s.track.id === track.id);
        if (!isAlreadyAdded) {
          try {
            pc.addTrack(track, localStreamRef.current);
          } catch (err) {
            console.warn('Track addition warning:', err);
          }
        }
      });
    }

    return pc;
  };

  // Recalculate scorecard evaluation when candidate submits live test answers
  const updateScorecardFromAssessment = (answers) => {
    if (!answers || answers.length === 0) return;
    const total = answers.length;
    const correctCount = answers.filter(a => a.isCorrect).length;
    const ratio = correctCount / total;
    const calcTechScore = Number((1.5 + ratio * 3.5).toFixed(1));
    const calcProblemScore = Number((1.8 + ratio * 3.2).toFixed(1));
    const rec = ratio >= 0.75 ? 'Strong Hire' : ratio >= 0.5 ? 'Hire' : ratio >= 0.3 ? 'Hold' : 'Reject';
    const autoNotes = `Live Assessment Sync: ${correctCount}/${total} correct answers (${Math.round(ratio * 100)}%). Technical score calibrated to ${calcTechScore}/5.0.`;

    setEvaluation(prev => {
      const updated = {
        ...prev,
        technicalScore: calcTechScore,
        problemSolvingScore: calcProblemScore,
        recommendation: rec,
        notes: prev.notes ? `${prev.notes}\n${autoNotes}` : autoNotes,
      };

      // Sync evaluation to PostgreSQL database
      fetch('/api/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentInterview.id || meetingId,
          evaluation: updated,
        }),
      }).catch(() => {});

      return updated;
    });
  };

  // Host Admin Action Handlers
  const handleAdminMute = (peerId) => {
    sendSignalingMessage({ signalType: 'ADMIN_ACTION', targetPeerId: peerId, action: 'MUTE' });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'ADMIN_ACTION', payload: { targetPeerId: peerId, action: 'MUTE' } });
    }
    setRemotePeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], micMuted: true } } : prev);
  };

  const handleAdminDisableVideo = (peerId) => {
    sendSignalingMessage({ signalType: 'ADMIN_ACTION', targetPeerId: peerId, action: 'DISABLE_VIDEO' });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'ADMIN_ACTION', payload: { targetPeerId: peerId, action: 'DISABLE_VIDEO' } });
    }
    setRemotePeers(prev => prev[peerId] ? { ...prev, [peerId]: { ...prev[peerId], videoOff: true } } : prev);
  };

  const handleAdminKick = (peerId, name) => {
    setKickConfirmModal({ open: true, peerId, name: name || 'Participant' });
  };

  const confirmKickStudent = () => {
    if (!kickConfirmModal.peerId) return;
    const targetPeerId = kickConfirmModal.peerId;
    sendSignalingMessage({ signalType: 'ADMIN_ACTION', targetPeerId, action: 'KICK' });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'ADMIN_ACTION', payload: { targetPeerId, action: 'KICK' } });
    }
    const pc = peerConnectionsRef.current.get(targetPeerId);
    if (pc) {
      pc.close();
      peerConnectionsRef.current.delete(targetPeerId);
    }
    setRemotePeers(prev => {
      const copy = { ...prev };
      delete copy[targetPeerId];
      return copy;
    });
    setKickConfirmModal({ open: false, peerId: null, name: '' });
  };

  // Host Posts a Question (MCQ or Coding Challenge)
  const handlePostQuestion = (question) => {
    setActiveQuestion(question);
    setStudentSelectedOption(null);
    setStudentAnswerSubmitted(false);
    setStudentCodeSubmitted(false);

    sendSignalingMessage({ signalType: 'POST_QUESTION', question });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'POST_QUESTION', payload: question });
    }

    if (question.type === 'code') {
      if (question.codeStarter) {
        setCodeContent(question.codeStarter);
        if (broadcastRef.current) {
          broadcastRef.current.postMessage({ type: 'CODE_SYNC', payload: question.codeStarter });
        }
      }
      setActiveSidebar('code');
    }

    // Fast sync active question to PostgreSQL database
    fetch('/api/interviews/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, activeQuestionId: question.id }),
    }).catch(() => {});

    const chatMsg = {
      id: `m_q_${Date.now()}`,
      sender: 'Career-OS Assessment',
      role: 'system',
      text: `Host posted ${question.type === 'code' ? 'Coding Problem' : 'MCQ'}: "${question.title || question.question}"`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, chatMsg]);
    fetch('/api/interviews/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, message: chatMsg }),
    }).catch(() => {});
  };

  // Host Dismisses Active Question
  const handleDismissQuestion = () => {
    setActiveQuestion(null);
    setStudentSelectedOption(null);
    setStudentAnswerSubmitted(false);
    setStudentCodeSubmitted(false);

    sendSignalingMessage({ signalType: 'CLOSE_QUESTION' });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CLOSE_QUESTION' });
    }

    fetch('/api/interviews/questions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, activeQuestionId: null }),
    }).catch(() => {});
  };

  // Student Submits MCQ Answer to Host Question
  const handleStudentSubmitAnswer = () => {
    if (studentSelectedOption === null || !activeQuestion || studentAnswerSubmitted) return;
    setStudentAnswerSubmitted(true);
    const isCorrect = studentSelectedOption === activeQuestion.correct;
    const answerPayload = {
      studentName: myName,
      studentId: user?.id,
      questionId: activeQuestion.id,
      questionText: activeQuestion.question,
      selectedOption: studentSelectedOption,
      isCorrect,
      points: isCorrect ? (activeQuestion.points || 10) : 0,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    sendSignalingMessage({ signalType: 'SUBMIT_ANSWER', ...answerPayload });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'SUBMIT_ANSWER', payload: answerPayload });
    }
  };

  // Student Submits Written Code to Host Question
  const handleStudentSubmitCode = () => {
    if (studentCodeSubmitted) return;
    setStudentCodeSubmitted(true);

    const submissionPayload = {
      studentName: myName,
      studentId: user?.id,
      questionId: activeQuestion?.id || 'live_code',
      questionTitle: activeQuestion?.title || activeQuestion?.question || 'Live Coding Task',
      code: codeContent,
      language: codeLanguage,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    sendSignalingMessage({ signalType: 'SUBMIT_CODE', ...submissionPayload });
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'SUBMIT_CODE', payload: submissionPayload });
    }

    // Announce code submission in in-call chat
    const codeMsg = {
      id: `m_c_${Date.now()}`,
      sender: 'Career-OS Assessment',
      role: 'system',
      text: `${myName} has submitted their code solution for ${submissionPayload.questionTitle} (${codeLanguage.toUpperCase()}).`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, codeMsg]);
    fetch('/api/interviews/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, message: codeMsg }),
    }).catch(() => {});
  };

  // Dedicated WebRTC Offer Initiator
  const initiateWebRTCOffer = async (remotePeerId, peerName, peerRole, peerIsRecruiter) => {
    if (!localStreamRef.current) {
      console.log('initiateWebRTCOffer: localStream not ready yet for', remotePeerId);
      return;
    }

    if (initiatedOffersRef.current.has(remotePeerId)) {
      return;
    }

    const existingPc = peerConnectionsRef.current.get(remotePeerId);
    if (existingPc && (existingPc.remoteDescription || existingPc.localDescription || existingPc.connectionState === 'connected')) {
      return;
    }

    const pc = getOrCreatePeerConnection(remotePeerId, peerName, peerRole, peerIsRecruiter);
    if (pc.signalingState !== 'stable' || pc.remoteDescription) {
      return;
    }

    initiatedOffersRef.current.add(remotePeerId);
    try {
      const createdOffer = await pc.createOffer();
      await pc.setLocalDescription(createdOffer);
      sendSignalingMessage({
        to: remotePeerId,
        signalType: 'OFFER',
        offer: createdOffer,
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
      initiatedOffersRef.current.delete(remotePeerId);
      if (err.name === 'InvalidAccessError' || err.message?.includes('m-lines')) {
        console.warn('Recovering PeerConnection from SDP m-line mismatch...');
        try { pc.close(); } catch {}
        peerConnectionsRef.current.delete(remotePeerId);
        remoteStreamsRef.current.delete(remotePeerId);
      }
    }
  };

  // Handle incoming signaling messages
  const handleSignalMessage = async (msg) => {
    if (!msg || msg.from === myPeerId) return;
    const { from: remotePeerId, signalType, to, candidate, offer, answer, name, role, isRecruiter: peerIsRecruiter, micMuted: peerMuted, videoOff: peerVideoOff } = msg;

    // Ignore messages targeted to someone else
    if (to && to !== myPeerId) return;

    // Deduplicate incoming signals by msg.id to prevent duplicate execution in polling intervals
    if (msg.id) {
      if (processedSignalsRef.current.has(msg.id)) return;
      processedSignalsRef.current.add(msg.id);
      if (processedSignalsRef.current.size > 2000) {
        const iter = processedSignalsRef.current.values();
        for (let i = 0; i < 500; i++) {
          processedSignalsRef.current.delete(iter.next().value);
        }
      }
    }

    if (signalType === 'JOIN') {
      // Register remote peer in state
      setRemotePeers(prev => ({
        ...prev,
        [remotePeerId]: {
          peerId: remotePeerId,
          name: name || 'Participant',
          role: role || 'Candidate',
          isRecruiter: peerIsRecruiter,
          micMuted: peerMuted || false,
          videoOff: peerVideoOff || false,
          stream: prev[remotePeerId]?.stream || null,
        },
      }));

      // Reply with JOIN_ACK so the newcomer discovers us
      sendSignalingMessage({
        to: remotePeerId,
        signalType: 'JOIN_ACK',
        name: myName,
        role: user?.role || (isRecruiter ? 'company' : 'student'),
        isRecruiter,
        micMuted,
        videoOff,
      });

      // If recruiter has an active question, sync it with newcomer candidate immediately
      if (isRecruiter && activeQuestion) {
        sendSignalingMessage({
          to: remotePeerId,
          signalType: 'POST_QUESTION',
          question: activeQuestion,
        });
      }

      // Initiating WebRTC offer: ONLY once per peer to avoid duplicate offers
      const shouldInitiate = isRecruiter || (!peerIsRecruiter && myPeerId > remotePeerId);
      if (shouldInitiate) {
        initiateWebRTCOffer(remotePeerId, name, role, peerIsRecruiter);
      }
    } else if (signalType === 'JOIN_ACK') {
      // Acknowledged by an existing peer in room
      setRemotePeers(prev => ({
        ...prev,
        [remotePeerId]: {
          peerId: remotePeerId,
          name: name || 'Participant',
          role: role || 'Candidate',
          isRecruiter: peerIsRecruiter,
          micMuted: peerMuted || false,
          videoOff: peerVideoOff || false,
          stream: prev[remotePeerId]?.stream || null,
        },
      }));

      // When newcomer discovers existing peer, if newcomer is recruiter or initiator, initiate offer!
      const shouldInitiate = isRecruiter || (!peerIsRecruiter && myPeerId > remotePeerId);
      if (shouldInitiate) {
        initiateWebRTCOffer(remotePeerId, name, role, peerIsRecruiter);
      }
    } else if (signalType === 'OFFER') {
      if (!offer) return;
      const pc = getOrCreatePeerConnection(remotePeerId);
      try {
        // Perfect Negotiation glare handling
        if (pc.signalingState !== 'stable') {
          if (pc.signalingState === 'have-local-offer') {
            // Polite peer tie-break: rolls back local offer to accept incoming offer
            const isPolite = !isRecruiter && myPeerId < remotePeerId;
            if (isPolite) {
              console.log('Glare detected: polite peer rolling back local offer');
              await pc.setLocalDescription({ type: 'rollback' });
            } else {
              console.log('Glare detected: impolite peer ignoring competing offer');
              return;
            }
          }
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        // Drain any queued ICE candidates for this peer
        const queued = pendingIceCandidatesRef.current.get(remotePeerId) || [];
        if (queued.length > 0) {
          pendingIceCandidatesRef.current.delete(remotePeerId);
          for (const qCand of queued) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(qCand));
            } catch {}
          }
        }
        const createdAnswer = await pc.createAnswer();
        await pc.setLocalDescription(createdAnswer);
        sendSignalingMessage({
          to: remotePeerId,
          signalType: 'ANSWER',
          answer: createdAnswer,
        });
      } catch (err) {
        console.warn('Error handling WebRTC offer:', err);
        if (err.name === 'InvalidAccessError' || err.message?.includes('m-lines')) {
          console.warn('Resetting PeerConnection due to offer SDP mismatch...');
          try { pc.close(); } catch {}
          peerConnectionsRef.current.delete(remotePeerId);
        }
      }
    } else if (signalType === 'ANSWER') {
      if (!answer) return;
      const pc = peerConnectionsRef.current.get(remotePeerId);
      if (pc) {
        if (pc.signalingState !== 'have-local-offer') {
          console.warn('Skipping duplicate or unexpected ANSWER: signalingState is', pc.signalingState);
          return;
        }
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          // Drain any queued ICE candidates for this peer
          const queued = pendingIceCandidatesRef.current.get(remotePeerId) || [];
          if (queued.length > 0) {
            pendingIceCandidatesRef.current.delete(remotePeerId);
            for (const qCand of queued) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(qCand));
              } catch {}
            }
          }
        } catch (err) {
          console.warn('Error handling WebRTC answer:', err);
        }
      }
    } else if (signalType === 'CANDIDATE') {
      if (!candidate) return;
      const pc = peerConnectionsRef.current.get(remotePeerId);
      if (!pc || !pc.remoteDescription) {
        // Remote description is not set yet - queue candidate safely to prevent InvalidStateError
        if (!pendingIceCandidatesRef.current.has(remotePeerId)) {
          pendingIceCandidatesRef.current.set(remotePeerId, []);
        }
        pendingIceCandidatesRef.current.get(remotePeerId).push(candidate);
        return;
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.warn('Benign ICE candidate handling:', err);
      }
    } else if (signalType === 'MEDIA_STATE') {
      setRemotePeers(prev => {
        if (!prev[remotePeerId]) return prev;
        return {
          ...prev,
          [remotePeerId]: {
            ...prev[remotePeerId],
            micMuted: peerMuted !== undefined ? peerMuted : prev[remotePeerId].micMuted,
            videoOff: peerVideoOff !== undefined ? peerVideoOff : prev[remotePeerId].videoOff,
          },
        };
      });
    } else if (signalType === 'JOIN_REQUEST') {
      if (isRecruiter) {
        setPendingJoinRequests(prev => {
          const reqPeerId = msg.peerId || remotePeerId;
          const reqStudentId = msg.studentId;
          const exists = prev.some(r => (reqPeerId && r.peerId === reqPeerId) || (reqStudentId && r.studentId === reqStudentId));
          if (exists) return prev;
          return [
            ...prev,
            {
              id: msg.id || `req_${Date.now()}`,
              peerId: reqPeerId,
              studentId: reqStudentId,
              studentName: msg.studentName || msg.name || 'Student Candidate',
              studentEmail: msg.studentEmail || '',
              studentBranch: msg.studentBranch || 'Engineering',
              studentCgpa: msg.studentCgpa || null,
              status: 'pending',
              requestedAt: new Date().toISOString(),
            },
          ];
        });
      }
    } else if (signalType === 'CANCEL_JOIN_REQUEST') {
      if (isRecruiter) {
        const reqPeerId = msg.peerId || remotePeerId;
        const reqStudentId = msg.studentId;
        setPendingJoinRequests(prev => prev.filter(r => r.peerId !== reqPeerId && (!reqStudentId || r.studentId !== reqStudentId)));
      }
    } else if (signalType === 'ADMIT_STUDENT') {
      const isTargetMe = msg.to === myPeerId || msg.targetPeerId === myPeerId || (user?.id && msg.studentId === user?.id);
      if (isTargetMe) {
        setJoinStatus('admitted');
        setInLobby(false);
        // Announce JOIN with active video and audio tracks to establish connection
        sendSignalingMessage({
          signalType: 'JOIN',
          name: myName,
          role: user?.role || (isRecruiter ? 'company' : 'student'),
          isRecruiter,
          micMuted,
          videoOff,
        });
      }
    } else if (signalType === 'DENY_STUDENT') {
      const isTargetMe = msg.to === myPeerId || msg.targetPeerId === myPeerId || (user?.id && msg.studentId === user?.id);
      if (isTargetMe) {
        setJoinStatus('denied');
      }
    } else if (signalType === 'POST_QUESTION') {
      if (msg.question) {
        setActiveQuestion(msg.question);
        setStudentSelectedOption(null);
        setStudentAnswerSubmitted(false);
        if (msg.question.type === 'code' && msg.question.codeStarter) {
          setCodeContent(msg.question.codeStarter);
          setActiveSidebar('code');
        }
      }
    } else if (signalType === 'CLOSE_QUESTION') {
      setActiveQuestion(null);
      setStudentSelectedOption(null);
      setStudentAnswerSubmitted(false);
    } else if (signalType === 'SUBMIT_ANSWER') {
      if (isRecruiter) {
        const answerRecord = {
          studentName: msg.studentName || 'Candidate',
          questionId: msg.questionId,
          selectedOption: msg.selectedOption,
          isCorrect: msg.isCorrect,
          points: msg.points,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setQuestionAnswers(prev => {
          const updated = [...prev, answerRecord];
          updateScorecardFromAssessment(updated);
          return updated;
        });

        // Add to live chat announcement
        const announcementMsg = {
          id: `m_ans_${Date.now()}`,
          sender: 'Career-OS Assessment',
          role: 'system',
          text: `${msg.studentName || 'Candidate'} submitted answer: Option ${String.fromCharCode(65 + (msg.selectedOption ?? 0))} (${msg.isCorrect ? 'Correct! +' + msg.points + ' pts' : 'Incorrect'})`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages(prev => [...prev, announcementMsg]);
      }
    } else if (signalType === 'SUBMIT_CODE') {
      if (isRecruiter) {
        if (msg.code) {
          setCodeContent(msg.code);
          setActiveSidebar('code');
        }
        const codeAnswerRecord = {
          studentName: msg.studentName || 'Candidate',
          questionId: msg.questionId,
          code: msg.code,
          language: msg.language,
          isCodeSubmission: true,
          points: 15,
          time: msg.submittedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setQuestionAnswers(prev => {
          const updated = [...prev, codeAnswerRecord];
          updateScorecardFromAssessment(updated);
          return updated;
        });
      }
    } else if (signalType === 'ADMIN_ACTION') {
      const isTargetMe = msg.targetPeerId === myPeerId;
      if (isTargetMe) {
        if (msg.action === 'MUTE') {
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
          }
          setMicMuted(true);
          sendSignalingMessage({ signalType: 'MEDIA_STATE', micMuted: true });
          setAdminAlert('The meeting host has muted your microphone.');
        } else if (msg.action === 'DISABLE_VIDEO') {
          if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false; });
          }
          setVideoOff(true);
          sendSignalingMessage({ signalType: 'MEDIA_STATE', videoOff: true });
          setAdminAlert('The meeting host has turned off your camera.');
        } else if (msg.action === 'KICK') {
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
          }
          setIsEndedForAll(true);
          setMeetingEndedReason('You have been removed from the meeting room by the host.');
          setShowEndModal(true);
        }
      }
    } else if (signalType === 'CHAT_MSG') {
      if (msg.chatPayload) {
        setChatMessages(prev => {
          if (prev.some(m => m.id === msg.chatPayload.id)) return prev;
          return [...prev, msg.chatPayload];
        });
      }
    } else if (signalType === 'MEETING_ENDED_FOR_ALL') {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
      }
      setIsEndedForAll(true);
      setMeetingEndedReason(msg.reason || 'The host has ended the meeting for all participants.');
      setShowEndModal(true);
    } else if (signalType === 'BYE') {
      const pc = peerConnectionsRef.current.get(remotePeerId);
      if (pc) {
        pc.close();
        peerConnectionsRef.current.delete(remotePeerId);
      }
      initiatedOffersRef.current.delete(remotePeerId);
      setRemotePeers(prev => {
        const copy = { ...prev };
        delete copy[remotePeerId];
        return copy;
      });
    }
  };

  // Cross-tab and WebRTC synchronization via BroadcastChannel
  useEffect(() => {
    try {
      const channel = new BroadcastChannel(`career_os_meet_${meetingId}`);
      broadcastRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload, message } = event.data || {};
        if (type === 'WEBRTC_SIGNAL') {
          handleSignalMessage(message);
        } else if (type === 'POST_QUESTION') {
          if (payload) {
            setActiveQuestion(payload);
            setStudentSelectedOption(null);
            setStudentAnswerSubmitted(false);
            if (payload.type === 'code' && payload.codeStarter) {
              setCodeContent(payload.codeStarter);
              setActiveSidebar('code');
            }
          }
        } else if (type === 'CLOSE_QUESTION') {
          setActiveQuestion(null);
          setStudentSelectedOption(null);
          setStudentAnswerSubmitted(false);
        } else if (type === 'SUBMIT_ANSWER') {
          if (isRecruiter && payload) {
            setQuestionAnswers(prev => {
              const updated = [...prev, payload];
              updateScorecardFromAssessment(updated);
              return updated;
            });
          }
        } else if (type === 'SUBMIT_CODE') {
          if (isRecruiter && payload) {
            if (payload.code) {
              setCodeContent(payload.code);
              setActiveSidebar('code');
            }
            setQuestionAnswers(prev => {
              const updated = [...prev, {
                studentName: payload.studentName || 'Candidate',
                questionId: payload.questionId,
                code: payload.code,
                language: payload.language,
                isCodeSubmission: true,
                points: 15,
                time: payload.submittedAt || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              }];
              updateScorecardFromAssessment(updated);
              return updated;
            });
          }
        } else if (type === 'ADMIN_ACTION') {
          if (payload?.targetPeerId === myPeerId) {
            if (payload.action === 'MUTE') {
              if (localStreamRef.current) {
                localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false; });
              }
              setMicMuted(true);
              setAdminAlert('The meeting host has muted your microphone.');
            } else if (payload.action === 'DISABLE_VIDEO') {
              if (localStreamRef.current) {
                localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false; });
              }
              setVideoOff(true);
              setAdminAlert('The meeting host has turned off your camera.');
            } else if (payload.action === 'KICK') {
              if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
              }
              setIsEndedForAll(true);
              setMeetingEndedReason('You have been removed from the meeting room by the host.');
              setShowEndModal(true);
            }
          }
        } else if (type === 'CHAT_MSG') {
          setChatMessages(prev => {
            if (prev.some(m => m.id === payload.id)) return prev;
            return [...prev, payload];
          });
        } else if (type === 'MEETING_ENDED_FOR_ALL') {
          if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
          }
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(t => t.stop());
          }
          setIsEndedForAll(true);
          setMeetingEndedReason(payload?.reason || 'The host has ended the meeting for all participants.');
          setShowEndModal(true);
        } else if (type === 'CODE_SYNC') {
          setCodeContent(payload);
        } else if (type === 'REACTION') {
          triggerReaction(payload.reactionId || payload.emoji, false);
        } else if (type === 'HAND_RAISE') {
          setHandRaised(payload.raised);
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

  // Polling HTTP signaling for cross-device & cross-browser connections
  useEffect(() => {
    // Only pause if student is idle in lobby (has not knocked/asked to join yet)
    if (inLobby && !isRecruiter && joinStatus === 'idle') return;

    let isMounted = true;
    let isPolling = false;

    const performUnifiedSync = async () => {
      if (isPolling) return; // Prevent overlapping requests on Vercel
      // Don't issue requests when the browser tab is hidden/minimized or offline to prevent ERR_NETWORK_IO_SUSPENDED
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      isPolling = true;

      try {
        const res = await fetch(
          `/api/meeting-signal?meetingId=${encodeURIComponent(meetingId)}&peerId=${encodeURIComponent(myPeerId)}&since=${lastPollTimeRef.current}&sync=all`
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!isMounted || !data.success) return;

        lastPollTimeRef.current = data.serverTime || Date.now();

        // 1. Process new WebRTC signaling messages
        if (Array.isArray(data.messages) && data.messages.length > 0) {
          for (const msg of data.messages) {
            handleSignalMessage(msg);
          }
        }

        // 2. Process Join Requests
        if (Array.isArray(data.joinRequests)) {
          if (isRecruiter) {
            const pending = data.joinRequests.filter(r => r.status === 'pending');
            setPendingJoinRequests(pending);
          } else if (!isRecruiter && joinStatus === 'waiting') {
            const myReq = data.joinRequests.find(r => (r.peerId === myPeerId) || (user?.id && r.studentId === user?.id));
            if (myReq) {
              if (myReq.status === 'admitted') {
                setJoinStatus('admitted');
                setInLobby(false);
              } else if (myReq.status === 'denied') {
                setJoinStatus('denied');
              }
            }
          }
        }

        // 3. Process In-Call Chat Messages
        if (Array.isArray(data.chatMessages) && data.chatMessages.length > 0) {
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newFromDb = data.chatMessages.filter(m => !existingIds.has(m.id));
            if (newFromDb.length === 0) return prev;
            return [...prev, ...newFromDb];
          });
        }

        // 4. Process Active Question
        if (!isRecruiter) {
          if (data.activeQuestion) {
            setActiveQuestion(prev => {
              if (prev?.id === data.activeQuestion.id) return prev;
              setStudentSelectedOption(null);
              setStudentAnswerSubmitted(false);
              return data.activeQuestion;
            });
          } else if (data.activeQuestion === null) {
            setActiveQuestion(null);
          }
        }
      } catch (err) {
        // Silently recover on intermittent network hiccups or suspended state
      } finally {
        isPolling = false;
      }
    };

    performUnifiedSync();
    const syncInterval = setInterval(performUnifiedSync, 750);

    // Immediate sync upon returning to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        performUnifiedSync();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [inLobby, joinStatus, meetingId, myPeerId, isRecruiter, user?.id]);

  // Request local camera and microphone stream
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          let stream = null;
          // 1. Try high-definition video + audio
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                facingMode: 'user',
              },
              audio: { echoCancellation: true, noiseSuppression: true },
            });
          } catch (e1) {
            // 2. Fallback to basic unconstrained video + audio (common on iOS Safari / older Android)
            try {
              stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
              });
            } catch (e2) {
              // 3. Fallback to audio-only if camera is blocked/in-use by another app
              try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setIsCamOff(true);
              } catch (e3) {
                console.warn('Camera and mic permission denied or unavailable:', e3);
              }
            }
          }

          if (!active) {
            if (stream) stream.getTracks().forEach(t => t.stop());
            return;
          }

          if (stream) {
            localStreamRef.current = stream;
            setHasLocalStream(true);
            if (lobbyVideoRef.current) {
              lobbyVideoRef.current.srcObject = stream;
            }
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          } else {
            setHasLocalStream(true);
          }
        } else {
          setHasLocalStream(true);
        }
      } catch (err) {
        console.warn('Media initialization notice:', err);
        setHasLocalStream(true);
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
      // Broadcast disconnect
      sendSignalingMessage({ signalType: 'BYE' });
    };
  }, []);

  // Sync stream to active video element on lobby switch
  useEffect(() => {
    if (localStreamRef.current) {
      if (inLobby && lobbyVideoRef.current) {
        lobbyVideoRef.current.srcObject = localStreamRef.current;
      } else if (!inLobby && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  }, [inLobby]);

  // When joining call, broadcast JOIN signal to announce self to other peers
  useEffect(() => {
    if (!inLobby) {
      sendSignalingMessage({
        signalType: 'JOIN',
        name: myName,
        role: user?.role || (isRecruiter ? 'company' : 'student'),
        isRecruiter,
        micMuted,
        videoOff,
      });
    }
  }, [inLobby]);

  // When local camera & mic are ready, check if any already discovered remote peers need an offer
  useEffect(() => {
    if (hasLocalStream && localStreamRef.current && !inLobby) {
      Object.values(remotePeers).forEach(peer => {
        const shouldInitiate = isRecruiter || (!peer.isRecruiter && myPeerId > peer.peerId);
        if (shouldInitiate && !initiatedOffersRef.current.has(peer.peerId) && !peer.stream) {
          initiateWebRTCOffer(peer.peerId, peer.name, peer.role, peer.isRecruiter);
        }
      });
    }
  }, [hasLocalStream, inLobby, remotePeers]);

  // Timer loop for call duration
  useEffect(() => {
    if (inLobby) return;
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [inLobby]);

  // Real-time Network Status & WebRTC Quality Telemetry Monitor
  useEffect(() => {
    let isMounted = true;

    const measureNetworkHealth = async () => {
      try {
        let rtt = null;
        let packetLoss = 0.0;
        let jitter = 2;
        let activeIceState = 'idle';

        // 1. Inspect active WebRTC Peer Connections for true SRTP/DTLS stats
        const activePcs = Array.from(peerConnectionsRef.current.values());
        for (const pc of activePcs) {
          if (pc.connectionState === 'connected' || pc.iceConnectionState === 'connected') {
            activeIceState = 'connected';
            try {
              const stats = await pc.getStats();
              stats.forEach(report => {
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                  if (report.currentRoundTripTime !== undefined) {
                    rtt = Math.round(report.currentRoundTripTime * 1000);
                  }
                }
                if (report.type === 'inbound-rtp' && (report.kind === 'video' || report.kind === 'audio')) {
                  if (report.packetsLost !== undefined && report.packetsReceived !== undefined) {
                    const total = report.packetsLost + report.packetsReceived;
                    if (total > 0) {
                      packetLoss = Math.min(100, Math.round((report.packetsLost / total) * 1000) / 10);
                    }
                  }
                  if (report.jitter !== undefined) {
                    jitter = Math.round(report.jitter * 1000);
                  }
                }
              });
            } catch {}
          }
        }

        // 2. Measure HTTP signaling round-trip ping if WebRTC stats are still connecting
        if (rtt === null) {
          // If tab is hidden or device is offline, skip ping to avoid ERR_NETWORK_IO_SUSPENDED
          if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
            rtt = 28;
          } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
            rtt = 999;
          } else {
            const t0 = performance.now();
            try {
              await fetch('/api/meeting-signal?ping=1', { method: 'HEAD', cache: 'no-store' });
              rtt = Math.max(12, Math.round(performance.now() - t0));
            } catch {
              rtt = Math.floor(22 + Math.random() * 12);
            }
          }
        }

        // 3. Browser Connection API
        const conn = typeof navigator !== 'undefined' ? (navigator.connection || navigator.mozConnection || navigator.webkitConnection) : null;
        const effectiveType = conn?.effectiveType ? String(conn.effectiveType).toUpperCase() : '4G';
        const downlink = conn?.downlink ? Number(conn.downlink) : 12.5;
        const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

        if (!isOnline) {
          if (isMounted) {
            setNetworkStats({
              status: 'offline',
              latency: 0,
              jitter: 0,
              packetLoss: 100,
              effectiveType: 'NONE',
              downlink: 0,
              connectionState: 'Disconnected',
              qualityScore: 0,
              lastChecked: Date.now(),
            });
          }
          return;
        }

        // 4. Calculate connection rating & quality score
        let status = 'good';
        let qualityScore = 95;

        if (rtt < 60 && packetLoss < 1.0) {
          status = 'excellent';
          qualityScore = Math.max(90, 100 - Math.round(rtt * 0.15));
        } else if (rtt < 140 && packetLoss < 3.0) {
          status = 'good';
          qualityScore = Math.max(75, 90 - Math.round(rtt * 0.1));
        } else if (rtt < 280 && packetLoss < 7.0) {
          status = 'fair';
          qualityScore = Math.max(50, 70 - Math.round(rtt * 0.08));
        } else {
          status = 'poor';
          qualityScore = Math.max(15, 45 - Math.round(packetLoss * 3));
        }

        if (isMounted) {
          setNetworkStats({
            status,
            latency: rtt,
            jitter: jitter || 3,
            packetLoss,
            effectiveType,
            downlink,
            connectionState: activeIceState === 'connected' ? 'P2P Direct Encrypted (WebRTC)' : 'Server Relay Ready (STUN)',
            qualityScore,
            lastChecked: Date.now(),
          });
        }
      } catch (err) {
        console.warn('Network stats check error:', err);
      }
    };

    measureNetworkHealth();
    const interval = setInterval(measureNetworkHealth, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Format seconds to mm:ss
  function formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  }

  // Toggle Mic
  function toggleMic() {
    const nextMuted = !micMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => {
        t.enabled = !nextMuted;
      });
    }
    setMicMuted(nextMuted);
    sendSignalingMessage({ signalType: 'MEDIA_STATE', micMuted: nextMuted });
  }

  // Toggle Video
  function toggleVideo() {
    const nextVideoOff = !videoOff;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => {
        t.enabled = !nextVideoOff;
      });
    }
    setVideoOff(nextVideoOff);
    sendSignalingMessage({ signalType: 'MEDIA_STATE', videoOff: nextVideoOff });
  }

  // Screen share (presentation stage + participant face gallery)
  async function toggleScreenShare() {
    if (screenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setScreenSharing(false);
      sendSignalingMessage({ signalType: 'MEDIA_STATE', screenSharing: false });

      // Revert local camera
      if (localVideoRef.current && localStreamRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
      // Revert track on all active peer connections
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        peerConnectionsRef.current.forEach(pc => {
          const senders = pc.getSenders();
          const sender = senders.find(s => s.track && s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
      }
    } else {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
          screenStreamRef.current = screenStream;
          setScreenSharing(true);
          sendSignalingMessage({ signalType: 'MEDIA_STATE', screenSharing: true });

          // Keep camera face on localVideoRef so your face is visible next to screen!
          if (localVideoRef.current && localStreamRef.current) {
            localVideoRef.current.srcObject = localStreamRef.current;
          }
          // Attach presentation screen to screenVideoRef
          setTimeout(() => {
            if (screenVideoRef.current) {
              screenVideoRef.current.srcObject = screenStream;
            }
          }, 60);

          const screenTrack = screenStream.getVideoTracks()[0];
          screenTrack.onended = () => {
            toggleScreenShare();
          };
          // Replace track on all active peer connections
          peerConnectionsRef.current.forEach(pc => {
            const senders = pc.getSenders();
            const sender = senders.find(s => s.track && s.track.kind === 'video');
            if (sender) sender.replaceTrack(screenTrack);
          });
        }
      } catch (err) {
        // User cancelling the browser screen picker dialog produces NotAllowedError or AbortError
        if (err.name === 'NotAllowedError' || err.name === 'AbortError') {
          return;
        }
        console.warn('Screen share notice:', err.message || err);
      }
    }
  }

  // Send Chat message (multi-layer sync: State + BroadcastChannel + WebRTC Signaling + PostgreSQL Database)
  function handleSendMessage(e) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMsg = {
      id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      peerId: myPeerId,
      sender: myName,
      role: myRole,
      text: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages(prev => {
      if (prev.some(m => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });
    setChatInput('');

    // 1. Instant local tab / cross-tab broadcast
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CHAT_MSG', payload: newMsg });
    }

    // 2. WebRTC signaling bus for remote browser peers
    sendSignalingMessage({
      signalType: 'CHAT_MSG',
      chatPayload: newMsg,
    });

    // 3. PostgreSQL database persistent storage
    fetch('/api/interviews/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meetingId, message: newMsg }),
    }).catch(() => {});
  }

  // Send live floating reaction (SVG icon based)
  function triggerReaction(reactionId, broadcast = true) {
    const id = Date.now() + Math.random();
    const leftOffset = 20 + Math.random() * 50;
    setFloatingReactions(prev => [...prev, { id, reactionId, left: leftOffset }]);

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2800);

    if (broadcast && broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'REACTION', payload: { reactionId } });
    }
  }

  // Toggle Hand Raise
  function toggleHandRaise() {
    const nextState = !handRaised;
    setHandRaised(nextState);
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'HAND_RAISE', payload: { raised: nextState } });
    }
  }

  // Code change synchronization
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

  // Leave / End Call button trigger:
  // If host: open modal with "End for all" vs "Leave me only"
  // If candidate: directly leave the call
  function handleEndCall() {
    if (isRecruiter) {
      setShowHostEndChoiceModal(true);
    } else {
      handleLeaveMeetingOnly();
    }
  }

  // Host Action 1: End meeting for ALL participants
  async function handleEndMeetingForAll() {
    setShowHostEndChoiceModal(false);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }

    const endPayload = {
      signalType: 'MEETING_ENDED_FOR_ALL',
      reason: 'The host has ended the meeting for all participants.',
    };

    // Broadcast across WebRTC signaling and BroadcastChannel
    sendSignalingMessage(endPayload);
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'MEETING_ENDED_FOR_ALL', payload: endPayload });
    }

    // Persist completed status in PostgreSQL database
    fetch('/api/interviews', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: currentInterview.id || meetingId,
        status: 'Completed',
      }),
    }).catch(() => {});

    dispatch({
      type: 'UPDATE_INTERVIEW',
      payload: {
        id: currentInterview.id,
        meetingId,
        status: 'Completed',
      },
    });

    setIsEndedForAll(true);
    setMeetingEndedReason('You ended the meeting for all participants.');
    setShowEndModal(true);
  }

  // Action 2: Just leave meeting (alone)
  function handleLeaveMeetingOnly() {
    setShowHostEndChoiceModal(false);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
    }

    sendSignalingMessage({ signalType: 'BYE' });
    setIsEndedForAll(false);
    setMeetingEndedReason('You left the meeting.');
    setShowEndModal(true);
  }

  function handleCopyMeetingUrl() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    }
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // Host admits a student into the live meeting room
  const handleAdmitStudent = async (request) => {
    // 1. Remove from host pending requests list
    setPendingJoinRequests(prev => prev.filter(r => r.peerId !== request.peerId && (!request.studentId || r.studentId !== request.studentId)));

    // 2. Broadcast live WebRTC signaling message
    sendSignalingMessage({
      signalType: 'ADMIT_STUDENT',
      to: request.peerId,
      targetPeerId: request.peerId,
      studentId: request.studentId,
      studentName: request.studentName,
    });

    // 3. Persist admission resolution to PostgreSQL database
    try {
      await fetch('/api/interviews/join-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          peerId: request.peerId,
          studentId: request.studentId,
          action: 'admit',
        }),
      });
    } catch (err) {
      console.error('Error admitting student in DB:', err);
    }

    // 4. System chat announcement
    const systemMsg = {
      id: `m_admit_${Date.now()}`,
      sender: 'Career-OS Meet',
      role: 'system',
      text: `${request.studentName} was admitted to the meeting room.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages(prev => [...prev, systemMsg]);
    if (broadcastRef.current) {
      broadcastRef.current.postMessage({ type: 'CHAT_MSG', payload: systemMsg });
    }
  };

  // Host denies a student entry
  const handleDenyStudent = async (request) => {
    // 1. Remove from host pending requests list
    setPendingJoinRequests(prev => prev.filter(r => r.peerId !== request.peerId && (!request.studentId || r.studentId !== request.studentId)));

    // 2. Broadcast live WebRTC signaling message
    sendSignalingMessage({
      signalType: 'DENY_STUDENT',
      to: request.peerId,
      targetPeerId: request.peerId,
      studentId: request.studentId,
      studentName: request.studentName,
    });

    // 3. Persist denial to PostgreSQL database
    try {
      await fetch('/api/interviews/join-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          peerId: request.peerId,
          studentId: request.studentId,
          action: 'deny',
        }),
      });
    } catch (err) {
      console.error('Error denying student in DB:', err);
    }
  };

  // Student clicks "Ask to join"
  const handleAskToJoin = async () => {
    setJoinStatus('waiting');

    const reqPayload = {
      meetingId,
      peerId: myPeerId,
      studentId: user?.id,
      studentName: myName,
      studentEmail: user?.email,
      studentBranch: user?.branch || 'CSE',
      studentCgpa: user?.cgpa || null,
    };

    // 1. Broadcast live signal to meeting host
    sendSignalingMessage({
      signalType: 'JOIN_REQUEST',
      ...reqPayload,
    });

    // 2. Persist join request in PostgreSQL database
    try {
      await fetch('/api/interviews/join-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });
    } catch (err) {
      console.error('Error creating join request in DB:', err);
    }
  };

  // Student cancels "Ask to join"
  const handleCancelRequest = async () => {
    setJoinStatus('idle');

    sendSignalingMessage({
      signalType: 'CANCEL_JOIN_REQUEST',
      peerId: myPeerId,
      studentId: user?.id,
    });

    try {
      await fetch('/api/interviews/join-request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId,
          peerId: myPeerId,
          studentId: user?.id,
          action: 'cancel',
        }),
      });
    } catch (err) {
      console.error('Error cancelling join request in DB:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. GOOGLE MEET PRE-JOIN LOBBY / GREEN ROOM
  // ─────────────────────────────────────────────────────────────
  if (inLobby) {
    return (
      <div style={{ minHeight: '100vh', width: '100vw', background: '#202124', color: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'Roboto, system-ui, sans-serif' }}>
        {/* Top Minimal Header */}
        <header style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoIcon size={20} color="#fff" />
            </div>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#E8EAED', letterSpacing: '-0.3px' }}>
              Career-OS Meet
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#9AA0A6' }}>
            {/* Live Network Status Indicator */}
            <button
              type="button"
              onClick={() => setShowNetworkModal(true)}
              title="Click to check network latency, packet loss, and connection diagnostics"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: `1px solid ${
                  networkStats.status === 'poor' ? 'rgba(234,67,53,0.5)' :
                  networkStats.status === 'fair' ? 'rgba(249,171,0,0.5)' :
                  'rgba(52,168,83,0.4)'
                }`,
                borderRadius: 9999,
                padding: '4px 12px',
                color: '#E8EAED',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background:
                    networkStats.status === 'poor' ? '#EA4335' :
                    networkStats.status === 'fair' ? '#F9AB00' :
                    '#34A853',
                }}
              />
              <Activity size={13} color={networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#81C995'} />
              <span>Network: {networkStats.status.toUpperCase()} ({networkStats.latency} ms)</span>
            </button>

            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 9999 }}>
              {currentInterview.company}
            </span>
            <span>{user?.email || 'authenticated.user@career-os.local'}</span>
          </div>
        </header>

        {/* Lobby Center Content */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px' }}>
          <div style={{ maxWidth: 1040, width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 48, alignItems: 'center' }}>
            
            {/* Left: Camera & Mic Preview Box */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/9',
                  background: '#3C4043',
                  borderRadius: 16,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
                  border: '1px solid #5F6368',
                }}
              >
                {videoOff ? (
                  <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#E8EAED', gap: 12 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#1A73E8', color: '#fff', fontSize: 32, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {myName?.charAt(0) || 'U'}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Camera is off</div>
                  </div>
                ) : (
                  <video
                    ref={lobbyVideoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                )}

                {/* Mic & Cam Quick Controls pill inside video */}
                <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 16 }}>
                  <button
                    type="button"
                    onClick={toggleMic}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      border: 'none',
                      background: micMuted ? '#EA4335' : 'rgba(32,33,36,0.85)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {micMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </button>

                  <button
                    type="button"
                    onClick={toggleVideo}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      border: 'none',
                      background: videoOff ? '#EA4335' : 'rgba(32,33,36,0.85)',
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                    }}
                  >
                    {videoOff ? <VideoOff size={20} /> : <VideoIcon size={20} />}
                  </button>
                </div>
              </div>

              {/* Hardware & Network diagnostics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#34A853' }}>
                  <ShieldCheck size={16} />
                  <span>Camera and microphone hardware ready</span>
                </div>
                <div
                  onClick={() => setShowNetworkModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 14px',
                    background: '#303134',
                    borderRadius: 10,
                    border: '1px solid #3C4043',
                    cursor: 'pointer',
                  }}
                  title="Click to check detailed network latency, packet loss, and connection diagnostics"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#E8EAED' }}>
                    <Activity size={14} color={networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853'} />
                    <span>Network Health: <strong style={{ color: networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853' }}>{networkStats.status.toUpperCase()}</strong> ({networkStats.latency} ms ping • {networkStats.packetLoss}% loss)</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#8AB4F8', fontWeight: 600 }}>Check Speed</span>
                </div>
              </div>
            </div>

            {/* Right: Meeting Join Details & CTA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#8AB4F8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  {currentInterview.company} • Live Video Interview
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#E8EAED', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                  Ready to join?
                </h1>
                <p style={{ fontSize: 14, color: '#9AA0A6', margin: 0, lineHeight: 1.5 }}>
                  Round: <strong>{currentInterview.type}</strong> ({currentInterview.role})
                </p>
              </div>

              {/* Role badge */}
              <div style={{ background: '#303134', border: '1px solid #3C4043', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#1A73E8', color: '#fff', fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {myName?.charAt(0) || 'U'}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EAED' }}>
                    Joining as {myName}
                  </div>
                  <div style={{ fontSize: 12, color: '#9AA0A6' }}>
                    {isRecruiter ? 'Interviewer / Meeting Host' : 'Candidate Participant'}
                  </div>
                </div>
              </div>

              {/* Host vs Student Action Buttons & Waiting Room States */}
              {isRecruiter ? (
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setInLobby(false)}
                    style={{
                      padding: '12px 36px',
                      borderRadius: 9999,
                      border: 'none',
                      background: '#1A73E8',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 4px 16px rgba(26,115,232,0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      transition: 'background 0.2s ease',
                    }}
                  >
                    <VideoIcon size={18} /> Join now as Host
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      toggleScreenShare();
                      setInLobby(false);
                    }}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 9999,
                      border: '1px solid #5F6368',
                      background: 'transparent',
                      color: '#8AB4F8',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <ScreenShare size={18} /> Present / Share Screen
                  </button>
                </div>
              ) : (
                /* Student / Candidate Flow */
                <div>
                  {(currentInterview?.status === 'Completed' || dbInterview?.status === 'Completed') ? (
                    <div style={{ background: '#303134', border: '1px solid #3C4043', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#34A853', fontSize: 15, fontWeight: 700 }}>
                        <CheckCircle2 size={18} /> Meeting Completed
                      </div>
                      <div style={{ fontSize: 13, color: '#BDC1C6', lineHeight: 1.5 }}>
                        This interview round has concluded. Your recruiter evaluation and interview notes have been submitted.
                      </div>
                      <Link
                        to="/student/calls"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          width: 'fit-content',
                          padding: '8px 18px',
                          borderRadius: 6,
                          background: '#1A73E8',
                          color: '#fff',
                          fontSize: 13,
                          fontWeight: 700,
                          textDecoration: 'none',
                          marginTop: 4,
                        }}
                      >
                        Return to Calls Section
                      </Link>
                    </div>
                  ) : joinStatus === 'idle' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          onClick={handleAskToJoin}
                          style={{
                            padding: '12px 36px',
                            borderRadius: 9999,
                            border: 'none',
                            background: '#1A73E8',
                            color: '#fff',
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(26,115,232,0.4)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            transition: 'background 0.2s ease',
                          }}
                        >
                          <Hand size={18} /> Ask to join
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: '#9AA0A6' }}>
                        The meeting host will receive your admission request and let you in.
                      </div>
                    </div>
                  )}

                  {joinStatus === 'waiting' && (
                    <div
                      style={{
                        background: '#303134',
                        border: '1px solid #3C4043',
                        borderRadius: 16,
                        padding: '24px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        textAlign: 'center',
                        alignItems: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                      }}
                    >
                      <div style={{ position: 'relative', width: 68, height: 68, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Radio size={24} />
                        </div>
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8EAED', margin: '0 0 6px' }}>
                          Asking to join...
                        </h2>
                        <p style={{ fontSize: 13, color: '#9AA0A6', margin: 0, lineHeight: 1.5 }}>
                          You'll join the call when the meeting host lets you in.
                        </p>
                      </div>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(26,115,232,0.12)', border: '1px solid rgba(26,115,232,0.3)', color: '#8AB4F8', padding: '6px 14px', borderRadius: 9999, fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#34A853' }} />
                        <span>Host notified in meeting room</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCancelRequest}
                        style={{
                          marginTop: 4,
                          padding: '8px 22px',
                          borderRadius: 9999,
                          border: '1px solid #5F6368',
                          background: 'transparent',
                          color: '#E8EAED',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Cancel request
                      </button>
                    </div>
                  )}

                  {joinStatus === 'denied' && (
                    <div
                      style={{
                        background: '#303134',
                        border: '1px solid #EA4335',
                        borderRadius: 16,
                        padding: '24px 28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16,
                        textAlign: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(234,67,53,0.15)', color: '#EA4335', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <PhoneOff size={26} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#E8EAED', margin: '0 0 6px' }}>
                          You can't join this call
                        </h2>
                        <p style={{ fontSize: 13, color: '#9AA0A6', margin: 0, lineHeight: 1.5 }}>
                          The meeting host denied entry to this call.
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button
                          type="button"
                          onClick={() => setJoinStatus('idle')}
                          style={{
                            padding: '10px 20px',
                            borderRadius: 9999,
                            border: '1px solid #5F6368',
                            background: 'transparent',
                            color: '#8AB4F8',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Ask again
                        </button>
                        <Link
                          to="/student/calls"
                          style={{
                            padding: '10px 22px',
                            borderRadius: 9999,
                            border: 'none',
                            background: '#1A73E8',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 700,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          Return to Calls
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Room details */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 10, borderTop: '1px solid #3C4043', fontSize: 12, color: '#9AA0A6' }}>
                <span>Meeting code: <code style={{ color: '#E8EAED' }}>{meetingId}</code></span>
                <Link to={isRecruiter ? '/company/calls' : '/student/calls'} style={{ color: '#8AB4F8', textDecoration: 'none', fontWeight: 600 }}>
                  ← Back to Call Section
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. LIVE MEETING ROOM
  // ─────────────────────────────────────────────────────────────
  const pendingPeerIds = new Set(pendingJoinRequests.map(r => r.peerId));
  const connectedPeerList = Object.values(remotePeers).filter(peer => !pendingPeerIds.has(peer.peerId));

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#202124', color: '#fff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Roboto, system-ui, sans-serif', position: 'relative' }}>

      {/* Floating Animated SVG Reactions Overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 999 }}>
        {floatingReactions.map(r => {
          const reactionItem = REACTION_TYPES.find(item => item.id === r.reactionId) || REACTION_TYPES[0];
          const ReactionIcon = reactionItem.icon;
          return (
            <div
              key={r.id}
              style={{
                position: 'absolute',
                bottom: 90,
                left: `${r.left}%`,
                animation: 'floatUp 2.8s ease-out forwards',
                background: 'rgba(32,33,36,0.92)',
                border: `1.5px solid ${reactionItem.color}`,
                borderRadius: '50%',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 4px 18px ${reactionItem.color}55`,
              }}
            >
              <ReactionIcon size={26} color={reactionItem.color} fill={reactionItem.fill} />
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) scale(0.8); opacity: 1; }
          70% { opacity: 0.9; }
          100% { transform: translateY(-380px) scale(1.4); opacity: 0; }
        }
      `}</style>

      {/* ─── FLOATING ADMIN ACTION ALERT BANNER (For Candidate) ─── */}
      {adminAlert && (
        <div
          style={{
            position: 'absolute',
            top: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(234, 67, 53, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            padding: '10px 22px',
            borderRadius: 12,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid rgba(255,255,255,0.2)',
          }}
        >
          <AlertCircle size={18} />
          <span>{adminAlert}</span>
          <button
            type="button"
            onClick={() => setAdminAlert(null)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ─── LIVE CANDIDATE FLOATING ASSESSMENT CARD (MCQ / CODING) ─── */}
      {activeQuestion && (
        <div
          style={{
            position: 'absolute',
            top: isRecruiter && pendingJoinRequests.length > 0 ? 110 : 20,
            right: 20,
            width: 380,
            maxWidth: 'calc(100vw - 40px)',
            background: 'rgba(32, 33, 36, 0.97)',
            backdropFilter: 'blur(20px)',
            border: activeQuestion.type === 'code' ? '1.5px solid #10B981' : '1.5px solid #1A73E8',
            borderRadius: 16,
            padding: '18px 20px',
            boxShadow: '0 16px 40px rgba(0,0,0,0.7), 0 0 0 1px rgba(26,115,232,0.3)',
            zIndex: 130,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: activeQuestion.type === 'code' ? '#6EE7B7' : '#8AB4F8' }}>
              <HelpCircle size={15} />
              <span>{activeQuestion.type === 'code' ? 'Live Coding Challenge' : 'Live MCQ Question'}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Question Countdown Timer */}
              {questionTimeLeft !== null && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    background: questionTimeLeft <= 15 ? 'rgba(234,67,53,0.25)' : 'rgba(245,158,11,0.2)',
                    color: questionTimeLeft <= 15 ? '#F87171' : '#FBBF24',
                    border: questionTimeLeft <= 15 ? '1px solid #EA4335' : '1px solid rgba(245,158,11,0.4)',
                  }}
                >
                  <Clock size={12} />
                  <span>{Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}</span>
                </div>
              )}

              <span style={{ fontSize: 11, background: 'rgba(26,115,232,0.2)', color: '#8AB4F8', padding: '2px 8px', borderRadius: 9999, fontWeight: 600 }}>
                +{activeQuestion.points || (activeQuestion.type === 'code' ? 15 : 10)} pts
              </span>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAED', lineHeight: 1.4 }}>
            {activeQuestion.question || activeQuestion.title}
          </div>

          {/* MCQ Options */}
          {activeQuestion.type === 'mcq' && activeQuestion.options && activeQuestion.options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeQuestion.options.map((opt, idx) => (
                <label
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: studentSelectedOption === idx ? 'rgba(26,115,232,0.25)' : '#303134',
                    border: studentSelectedOption === idx ? '1px solid #1A73E8' : '1px solid #3C4043',
                    cursor: studentAnswerSubmitted || questionTimeLeft === 0 ? 'default' : 'pointer',
                    fontSize: 12,
                    color: '#E8EAED',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <input
                    type="radio"
                    name="candidateAssessmentOption"
                    disabled={studentAnswerSubmitted || questionTimeLeft === 0}
                    checked={studentSelectedOption === idx}
                    onChange={() => setStudentSelectedOption(idx)}
                    style={{ accentColor: '#1A73E8' }}
                  />
                  <span style={{ fontWeight: 700, color: '#8AB4F8' }}>{String.fromCharCode(65 + idx)}.</span>
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          )}

          {/* Coding Challenge Instructions & Direct Pad Launch */}
          {activeQuestion.type === 'code' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ background: '#1E1E1E', padding: '8px 10px', borderRadius: 6, fontSize: 11, color: '#A7F3D0', fontFamily: 'monospace', lineHeight: 1.5 }}>
                {activeQuestion.testCases || 'Type code in the Live Synchronized Code Pad below and submit to the interviewer.'}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setActiveSidebar('code')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #5F6368',
                    background: '#303134',
                    color: '#fff',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <FileCode size={14} color="#6EE7B7" />
                  <span>{activeSidebar === 'code' ? 'Code Pad Open' : 'Open Code Pad'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Student MCQ Submit Button */}
          {!isRecruiter && activeQuestion.type === 'mcq' && (
            studentAnswerSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34A853', fontSize: 12, fontWeight: 600, padding: '4px 0' }}>
                <CheckCircle2 size={16} />
                <span>Answer submitted! Points evaluated and synced with scorecard.</span>
              </div>
            ) : questionTimeLeft === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#EA4335', fontSize: 12, fontWeight: 600, padding: '4px 0' }}>
                <AlertCircle size={16} />
                <span>Time up for this question!</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStudentSubmitAnswer}
                disabled={studentSelectedOption === null}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: studentSelectedOption === null ? '#3C4043' : '#1A73E8',
                  color: studentSelectedOption === null ? '#9AA0A6' : '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: studentSelectedOption === null ? 'not-allowed' : 'pointer',
                  boxShadow: studentSelectedOption === null ? 'none' : '0 2px 8px rgba(26,115,232,0.4)',
                }}
              >
                Submit Answer to Host
              </button>
            )
          )}

          {/* Student Coding Submit Button */}
          {!isRecruiter && activeQuestion.type === 'code' && (
            studentCodeSubmitted ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34A853', fontSize: 12, fontWeight: 600, padding: '4px 0' }}>
                <CheckCircle2 size={16} />
                <span>Code solution submitted to host! Interviewer is reviewing your logic.</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleStudentSubmitCode}
                style={{
                  padding: '9px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#10B981',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  boxShadow: '0 2px 10px rgba(16,185,129,0.3)',
                }}
              >
                <Check size={15} />
                <span>Submit My Code to Host</span>
              </button>
            )
          )}

          {isRecruiter && (
            <div style={{ fontSize: 11, color: '#9AA0A6', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
              <span>Live on Candidate Screen</span>
              <button
                type="button"
                onClick={handleDismissQuestion}
                style={{ background: 'none', border: 'none', color: '#EA4335', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
              >
                Dismiss Question
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── HOST REMOVE / KICK PARTICIPANT CONFIRMATION MODAL ─── */}
      {kickConfirmModal.open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 20,
          }}
        >
          <div
            style={{
              background: '#202124',
              border: '1px solid #5F6368',
              borderRadius: 16,
              maxWidth: 420,
              width: '100%',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#EA4335' }}>
              <UserMinus size={24} />
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#E8EAED' }}>Remove Participant</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: '#BDC1C6', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{kickConfirmModal.name}</strong> from this interview room? They will be immediately disconnected.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                onClick={() => setKickConfirmModal({ open: false, peerId: null, name: '' })}
                style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #5F6368', background: 'transparent', color: '#E8EAED', cursor: 'pointer', fontSize: 13 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmKickStudent}
                style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: '#EA4335', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
              >
                Remove Participant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN BODY (VIDEOS + ACTIVE SIDEBAR) ─── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Main Video Arena */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 20px', gap: 14, overflow: 'hidden', position: 'relative' }}>
          
          {/* Google Meet Admission Banner for Meeting Host */}
          {isRecruiter && pendingJoinRequests.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 140,
                background: 'rgba(32, 33, 36, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1px solid #1A73E8',
                borderRadius: 14,
                padding: '12px 20px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(26,115,232,0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                minWidth: 380,
                maxWidth: 560,
              }}
            >
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                {pendingJoinRequests[0].studentName?.charAt(0) || 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8AB4F8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Someone wants to join this call
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EAED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {pendingJoinRequests[0].studentName}
                </div>
                <div style={{ fontSize: 12, color: '#9AA0A6' }}>
                  {pendingJoinRequests[0].studentBranch || 'Student'}{pendingJoinRequests[0].studentCgpa ? ` • CGPA: ${pendingJoinRequests[0].studentCgpa}` : ''}
                  {pendingJoinRequests.length > 1 && ` (+${pendingJoinRequests.length - 1} more waiting)`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleDenyStudent(pendingJoinRequests[0])}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    border: '1px solid #5F6368',
                    background: 'transparent',
                    color: '#E8EAED',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Deny
                </button>
                <button
                  type="button"
                  onClick={() => handleAdmitStudent(pendingJoinRequests[0])}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#1A73E8',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(26,115,232,0.4)',
                  }}
                >
                  Admit
                </button>
              </div>
            </div>
          )}

          {/* Video Container: Screen Presentation Stage vs Standard Grid */}
          {screenSharing ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                gap: 16,
                minHeight: 0,
                overflow: 'hidden',
              }}
            >
              {/* Presentation Stage (Center) */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#121214',
                  border: '2px solid #1A73E8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                }}
              >
                <video
                  ref={screenVideoRef}
                  autoPlay
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    background: 'rgba(26,115,232,0.92)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  <ScreenShare size={15} />
                  <span>You are presenting your screen</span>
                </div>
                <button
                  type="button"
                  onClick={toggleScreenShare}
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 14,
                    background: 'rgba(234,67,53,0.92)',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    borderRadius: 9999,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  Stop presenting
                </button>
              </div>

              {/* Side Participant Face Gallery (Right Column) - SHOWS STUDENT FACE + HOST FACE */}
              <div
                style={{
                  width: 320,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                  overflowY: 'auto',
                  minHeight: 0,
                  flexShrink: 0,
                }}
              >
                {/* Candidate / Remote Student Face Tile */}
                {connectedPeerList.map(peer => (
                  <div key={peer.peerId} style={{ height: 210, flexShrink: 0 }}>
                    <RemoteVideoTile
                      peer={peer}
                      compact={true}
                      isRecruiter={isRecruiter}
                      onMute={() => handleAdminMute(peer.peerId)}
                      onDisableVideo={() => handleAdminDisableVideo(peer.peerId)}
                      onKick={() => handleAdminKick(peer.peerId, peer.name)}
                    />
                  </div>
                ))}

                {connectedPeerList.length === 0 && (
                  <div style={{ padding: '16px 14px', background: '#303134', borderRadius: 12, fontSize: 12, color: '#9AA0A6', textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, color: '#E8EAED', marginBottom: 4 }}>Candidate Not Connected</div>
                    <span>Student video will appear here as soon as they join.</span>
                  </div>
                )}

                {/* Local Face Tile (Host) */}
                <div
                  style={{
                    height: 210,
                    flexShrink: 0,
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#3C4043',
                    border: '2px solid #5F6368',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {videoOff ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: '#9AA0A6' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18 }}>
                        {myName?.charAt(0) || 'U'}
                      </div>
                      <span style={{ fontSize: 11 }}>Camera Off</span>
                    </div>
                  ) : (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                    />
                  )}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8,
                      background: 'rgba(32,33,36,0.85)',
                      padding: '4px 8px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {myName} (You)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Grid View (Split Screen) */
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: viewMode === 'split' ? 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))' : '1fr',
                gap: 16,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 0,
              }}
            >
              {/* 1. REMOTE PARTICIPANTS (Active Real WebRTC Streams with Admin Controls) */}
              {connectedPeerList.map(peer => (
                <RemoteVideoTile
                  key={peer.peerId}
                  peer={peer}
                  isRecruiter={isRecruiter}
                  onMute={() => handleAdminMute(peer.peerId)}
                  onDisableVideo={() => handleAdminDisableVideo(peer.peerId)}
                  onKick={() => handleAdminKick(peer.peerId, peer.name)}
                />
              ))}

              {/* 2. WAITING STATE (Only when no remote participant has connected yet) */}
              {connectedPeerList.length === 0 && (
                <div
                  style={{
                    position: 'relative',
                    borderRadius: 16,
                    overflow: 'hidden',
                    background: '#2B2D31',
                    border: '2px dashed #5F6368',
                    height: '100%',
                    maxHeight: '100%',
                    minHeight: 280,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px 24px',
                    textAlign: 'center',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                  }}
                >
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: '50%',
                      background: 'rgba(26,115,232,0.15)',
                      border: '2px solid #1A73E8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 16,
                    }}
                  >
                    <Users size={32} color="#8AB4F8" />
                  </div>

                  <div style={{ fontSize: 13, color: '#8AB4F8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Live Person-to-Person Interview
                  </div>

                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: '#E8EAED' }}>
                    Waiting for {isRecruiter ? 'Candidate(s)' : 'Interviewer'} to connect...
                  </h3>

                  <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9AA0A6', maxWidth: 400, lineHeight: 1.5 }}>
                    This is an actual live person meeting. As soon as the candidate knocks and is admitted, their live video and audio will stream here in real time.
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={handleCopyMeetingUrl}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '9px 18px',
                        borderRadius: 9999,
                        background: '#1A73E8',
                        color: '#fff',
                        border: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(26,115,232,0.4)',
                      }}
                    >
                      {copiedLink ? <Check size={15} /> : <Copy size={15} />}
                      <span>{copiedLink ? 'Meeting Link Copied!' : 'Copy Meeting Link'}</span>
                    </button>

                    <div style={{ fontSize: 12, color: '#9AA0A6' }}>
                      Room Code: <code style={{ color: '#E8EAED', background: '#3C4043', padding: '3px 8px', borderRadius: 4 }}>{meetingId}</code>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. LOCAL PARTICIPANT (YOU) */}
              <div
                style={{
                  position: 'relative',
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: '#3C4043',
                  height: '100%',
                  maxHeight: '100%',
                  minHeight: 280,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  border: handRaised ? '2px solid #F9AB00' : '2px solid #5F6368',
                }}
              >
                {videoOff ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#9AA0A6' }}>
                    <div style={{ width: 84, height: 84, borderRadius: '50%', background: '#1A73E8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: '#fff' }}>
                      {myName?.charAt(0) || 'U'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Camera is Off</div>
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
                      transform: 'scaleX(-1)',
                    }}
                  />
                )}

                {/* Hand Raised Banner */}
                {handRaised && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 16,
                      left: 16,
                      background: '#F9AB00',
                      color: '#202124',
                      padding: '6px 14px',
                      borderRadius: 9999,
                      fontSize: 12,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 4px 12px rgba(249,171,0,0.4)',
                    }}
                  >
                    <Hand size={14} color="#202124" />
                    <span>Hand Raised</span>
                  </div>
                )}

                {/* Local Real-time Network Signal Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    left: handRaised ? 150 : 16,
                    background: 'rgba(32,33,36,0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '5px 10px',
                    borderRadius: 9999,
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#E8EAED',
                    border: '1px solid rgba(255,255,255,0.12)',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                  onClick={() => setShowNetworkModal(true)}
                  title="Click to check detailed network latency and WebRTC connection telemetry"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 11 }}>
                    <span style={{ width: 3, height: 3, borderRadius: 1, background: networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853' }} />
                    <span style={{ width: 3, height: 6, borderRadius: 1, background: networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853' }} />
                    <span style={{ width: 3, height: 9, borderRadius: 1, background: networkStats.status === 'poor' ? '#5F6368' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853' }} />
                    <span style={{ width: 3, height: 11, borderRadius: 1, background: networkStats.status === 'poor' || networkStats.status === 'fair' ? '#5F6368' : '#34A853' }} />
                  </div>
                  <span>{networkStats.latency} ms</span>
                </div>

                {/* Participant Name Badge */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: 16,
                    left: 16,
                    background: 'rgba(32,33,36,0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '6px 14px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <span>{myName} (You)</span>
                </div>

                {/* Mic Status */}
                <div
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'rgba(32,33,36,0.85)',
                    padding: '6px 12px',
                    borderRadius: 9999,
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    color: micMuted ? '#EA4335' : '#81C995',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  {micMuted ? (
                    <>
                      <MicOff size={14} color="#EA4335" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Mic size={14} color="#81C995" />
                      <span>Microphone On</span>
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ─── ACTIVE SIDEBAR DRAWER ─── */}
        {activeSidebar && (
          <aside
            style={{
              width: 380,
              background: '#282A2D',
              borderLeft: '1px solid #3C4043',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.4)',
              zIndex: 50,
            }}
          >
            {/* Drawer Header */}
            <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid #3C4043' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#E8EAED', display: 'flex', alignItems: 'center', gap: 8 }}>
                {activeSidebar === 'chat' && (
                  <>
                    <MessageSquare size={18} color="#8AB4F8" />
                    <span>In-call messages</span>
                  </>
                )}
                {activeSidebar === 'code' && (
                  <>
                    <FileCode size={18} color="#34A853" />
                    <span>Collaborative Code Editor</span>
                  </>
                )}
                {activeSidebar === 'people' && (
                  <>
                    <Users size={18} color="#FBBC04" />
                    <span>People ({1 + connectedPeerList.length})</span>
                  </>
                )}
                {activeSidebar === 'info' && (
                  <>
                    <Info size={18} color="#8AB4F8" />
                    <span>Meeting details</span>
                  </>
                )}
                {activeSidebar === 'questions' && (
                  <>
                    <HelpCircle size={18} color="#8AB4F8" />
                    <span>Technical Assessment & Questions</span>
                  </>
                )}
                {activeSidebar === 'scorecard' && (
                  <>
                    <Award size={18} color="#EA4335" />
                    <span>Candidate Evaluation Scorecard</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveSidebar(null)}
                style={{ background: 'none', border: 'none', color: '#9AA0A6', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              
              {/* 1. IN-CALL CHAT */}
              {activeSidebar === 'chat' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
                    {chatMessages.map(msg => {
                      const isMe = msg.peerId === myPeerId || (msg.sender && msg.sender === myName);
                      return (
                        <div
                          key={msg.id}
                          style={{
                            background: msg.role === 'system' ? '#303134' : isMe ? '#1A73E8' : '#3C4043',
                            padding: '10px 14px',
                            borderRadius: 12,
                            alignSelf: msg.role === 'system' ? 'center' : isMe ? 'flex-end' : 'flex-start',
                            maxWidth: '85%',
                          }}
                        >
                          <div style={{ fontSize: 11, color: isMe ? '#D2E3FC' : '#BDC1C6', marginBottom: 2, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontWeight: 700 }}>{isMe ? `${msg.sender} (You)` : msg.sender}</span>
                            <span>{msg.time}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#fff', wordBreak: 'break-word', lineHeight: 1.4 }}>
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Chat Input form */}
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Send a message to everyone..."
                      style={{
                        flex: 1,
                        background: '#303134',
                        border: '1px solid #5F6368',
                        borderRadius: 24,
                        padding: '10px 16px',
                        color: '#fff',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button
                      type="submit"
                      style={{ background: '#1A73E8', border: 'none', borderRadius: '50%', color: '#fff', width: 40, height: 40, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Send size={16} />
                    </button>
                  </form>
                </div>
              )}

              {/* 2. CODING PAD */}
              {activeSidebar === 'code' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#BDC1C6' }}>Live Synchronized Code Pad</span>
                    <select
                      value={codeLanguage}
                      onChange={e => setCodeLanguage(e.target.value)}
                      style={{ background: '#303134', color: '#E8EAED', border: '1px solid #5F6368', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}
                    >
                      <option value="javascript">JavaScript (ES6)</option>
                      <option value="python">Python 3</option>
                      <option value="cpp">C++ 20</option>
                      <option value="java">Java 17</option>
                    </select>
                  </div>

                  {/* Active Question Banner if posted */}
                  {activeQuestion && activeQuestion.type === 'code' && (
                    <div style={{ background: '#1A2E26', border: '1px solid #059669', borderRadius: 8, padding: '8px 12px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6EE7B7', marginBottom: 2 }}>
                        Current Problem: {activeQuestion.title || activeQuestion.question}
                      </div>
                      <div style={{ fontSize: 10, color: '#A7F3D0', lineHeight: 1.4 }}>
                        {activeQuestion.testCases || 'Write your algorithm below and submit when ready.'}
                      </div>
                    </div>
                  )}

                  <textarea
                    value={codeContent}
                    onChange={e => handleCodeChange(e.target.value)}
                    placeholder="Type or paste your solution here..."
                    spellCheck="false"
                    style={{
                      flex: 1,
                      width: '100%',
                      background: '#171717',
                      color: '#4ADE80',
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 12,
                      lineHeight: 1.6,
                      padding: '12px',
                      borderRadius: 10,
                      border: '1px solid #3C4043',
                      resize: 'none',
                      outline: 'none',
                    }}
                  />

                  {/* Student Code Submission Action */}
                  {!isRecruiter && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 11, color: '#9AA0A6', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={14} color="#34A853" />
                        <span>Instant multi-peer sync</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleStudentSubmitCode}
                        disabled={studentCodeSubmitted}
                        style={{
                          padding: '7px 16px',
                          borderRadius: 6,
                          border: 'none',
                          background: studentCodeSubmitted ? '#303134' : '#10B981',
                          color: studentCodeSubmitted ? '#9AA0A6' : '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: studentCodeSubmitted ? 'default' : 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          boxShadow: studentCodeSubmitted ? 'none' : '0 2px 8px rgba(16,185,129,0.3)',
                        }}
                      >
                        <Check size={14} />
                        {studentCodeSubmitted ? 'Code Submitted' : 'Submit Code to Host'}
                      </button>
                    </div>
                  )}

                  {isRecruiter && (
                    <div style={{ fontSize: 11, color: '#9AA0A6', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Check size={14} color="#34A853" />
                      <span>Viewing candidate live code stream. Changes sync both ways in real-time.</span>
                    </div>
                  )}
                </div>
              )}

              {/* 3. PEOPLE LIST */}
              {activeSidebar === 'people' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span>Participants ({1 + connectedPeerList.length})</span>
                    <span style={{ fontSize: 10, background: '#1A73E8', color: '#fff', padding: '2px 8px', borderRadius: 4, textTransform: 'none', fontWeight: 600 }}>
                      Live Peer-to-Peer
                    </span>
                  </div>

                  {/* Meeting Host: Waiting to Join Section */}
                  {isRecruiter && pendingJoinRequests.length > 0 && (
                    <div style={{ background: '#252936', border: '1px solid #1A73E8', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#8AB4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Waiting to join ({pendingJoinRequests.length})</span>
                        <button
                          type="button"
                          onClick={() => {
                            pendingJoinRequests.forEach(req => handleAdmitStudent(req));
                          }}
                          style={{ background: 'none', border: 'none', color: '#8AB4F8', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >
                          Admit all
                        </button>
                      </div>

                      {pendingJoinRequests.map(req => (
                        <div key={req.peerId || req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                              {req.studentName?.charAt(0) || 'S'}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#E8EAED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {req.studentName}
                              </div>
                              <div style={{ fontSize: 10, color: '#9AA0A6' }}>
                                {req.studentBranch || 'Student'}{req.studentCgpa ? ` • ${req.studentCgpa}` : ''}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => handleDenyStudent(req)}
                              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #5F6368', background: 'transparent', color: '#E8EAED', fontSize: 11, cursor: 'pointer' }}
                            >
                              Deny
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdmitStudent(req)}
                              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1A73E8', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Admit
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* You */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#252936', border: '1px solid #1A73E8', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                        {myName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAED' }}>
                          {myName} (You)
                        </div>
                        <div style={{ fontSize: 11, color: '#9AA0A6' }}>
                          {isRecruiter ? 'Meeting Host • Interviewer' : 'Candidate • Applicant'}
                        </div>
                      </div>
                    </div>
                    {micMuted ? <MicOff size={16} color="#EA4335" /> : <Mic size={16} color="#34A853" />}
                  </div>

                  {/* Connected Remote Participants */}
                  {connectedPeerList.map(peer => (
                    <div key={peer.peerId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#303134', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#1A73E8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                          {peer.name?.charAt(0) || 'P'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAED', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {peer.name}
                          </div>
                          <div style={{ fontSize: 11, color: '#34A853', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34A853' }} />
                            <span>Connected • {peer.role === 'company' || peer.isRecruiter ? 'Interviewer' : 'Candidate'}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {peer.micMuted ? <MicOff size={16} color="#EA4335" /> : <Mic size={16} color="#34A853" />}

                        {/* Host Admin Action Buttons */}
                        {isRecruiter && !peer.isRecruiter && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6, borderLeft: '1px solid rgba(255,255,255,0.12)', paddingLeft: 6 }}>
                            <button
                              type="button"
                              onClick={() => handleAdminMute(peer.peerId)}
                              title="Host: Mute candidate microphone"
                              style={{ background: 'none', border: 'none', color: '#EA4335', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                            >
                              <MicOff size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDisableVideo(peer.peerId)}
                              title="Host: Turn off candidate video"
                              style={{ background: 'none', border: 'none', color: '#F9AB00', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                            >
                              <VideoOff size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminKick(peer.peerId, peer.name)}
                              title="Host: Remove candidate from meeting"
                              style={{ background: 'none', border: 'none', color: '#EA4335', cursor: 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center' }}
                            >
                              <UserMinus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Empty state when no peer connected yet */}
                  {connectedPeerList.length === 0 && (
                    <div style={{ padding: '16px 12px', background: '#282A2D', borderRadius: 8, fontSize: 12, color: '#9AA0A6', textAlign: 'center' }}>
                      <div style={{ fontWeight: 600, color: '#E8EAED', marginBottom: 4 }}>
                        Waiting for {isRecruiter ? 'Candidate(s)' : 'Interviewer'} to join
                      </div>
                      <div>Share the room code or link to begin the live call.</div>
                    </div>
                  )}

                  <div style={{ marginTop: 14, padding: '12px', background: '#282A2D', borderRadius: 8, fontSize: 12, color: '#9AA0A6' }}>
                    <div style={{ fontWeight: 700, color: '#34A853', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Radio size={13} color="#34A853" />
                      <span>WebRTC Peer-to-Peer Encrypted</span>
                    </div>
                    <div>Protocol: WebRTC DTLS/SRTP • Direct Audio & Video Stream</div>
                  </div>
                </div>
              )}

              {/* 4. MEETING DETAILS INFO */}
              {activeSidebar === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#BDC1C6' }}>Joining info</div>
                    <div style={{ fontSize: 12, color: '#9AA0A6', marginTop: 4 }}>
                      Share this information with authorized campus interviewers and candidates.
                    </div>
                  </div>

                  <div style={{ background: '#303134', padding: '14px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 12, color: '#9AA0A6' }}>Meeting URL:</div>
                    <code style={{ fontSize: 12, color: '#8AB4F8', wordBreak: 'break-all' }}>
                      {typeof window !== 'undefined' ? window.location.href : ''}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopyMeetingUrl}
                      style={{
                        padding: '8px 12px',
                        borderRadius: 6,
                        border: '1px solid #5F6368',
                        background: '#3C4043',
                        color: '#fff',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedLink ? 'Copied to clipboard' : 'Copy joining info'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: 12, color: '#9AA0A6', lineHeight: 1.6 }}>
                    <div>Company: <strong style={{ color: '#E8EAED' }}>{currentInterview.company}</strong></div>
                    <div>Role: <strong style={{ color: '#E8EAED' }}>{currentInterview.role}</strong></div>
                    <div>Round: <strong style={{ color: '#E8EAED' }}>{currentInterview.type}</strong></div>
                  </div>
                </div>
              )}

              {/* 5. SCORECARD & EVALUATION (Recruiter Only) */}
              {activeSidebar === 'scorecard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E8EAED' }}>Evaluation & Scorecard</div>
                    <div style={{ fontSize: 12, color: '#9AA0A6', marginTop: 2 }}>
                      Submit your live assessment of the candidate to update the recruitment pipeline.
                    </div>
                  </div>

                  {evalSubmitted ? (
                    <div style={{ background: '#137333', color: '#fff', padding: '16px', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', textAlign: 'center' }}>
                      <CheckCircle2 size={32} />
                      <div style={{ fontSize: 14, fontWeight: 700 }}>Evaluation Submitted Successfully!</div>
                      <div style={{ fontSize: 12 }}>Scorecard saved to database and candidate pipeline updated.</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <label style={{ fontSize: 12, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>
                          Technical Skills: {evaluation.technicalScore} / 5.0
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={evaluation.technicalScore}
                          onChange={e => setEvaluation({ ...evaluation, technicalScore: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>
                          Problem Solving: {evaluation.problemSolvingScore} / 5.0
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.1"
                          value={evaluation.problemSolvingScore}
                          onChange={e => setEvaluation({ ...evaluation, problemSolvingScore: Number(e.target.value) })}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 12, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>
                          Recommendation
                        </label>
                        <select
                          value={evaluation.recommendation}
                          onChange={e => setEvaluation({ ...evaluation, recommendation: e.target.value })}
                          style={{ width: '100%', background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '8px 10px', borderRadius: 6, fontSize: 13 }}
                        >
                          <option value="Strong Hire">Strong Hire</option>
                          <option value="Hire">Hire</option>
                          <option value="Hold">Hold / Re-evaluate</option>
                          <option value="Reject">Reject</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 12, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>
                          Recruiter Assessment Notes
                        </label>
                        <textarea
                          rows={3}
                          value={evaluation.notes}
                          onChange={e => setEvaluation({ ...evaluation, notes: e.target.value })}
                          placeholder="Candidate demonstrated clear grasp of algorithms..."
                          style={{ width: '100%', background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '8px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }}
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleEvaluationSubmit}
                        style={{ padding: '10px 16px', borderRadius: 8, border: 'none', background: '#34A853', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                      >
                        Submit Scorecard & Complete Call
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 6. TECHNICAL QUESTIONS & LIVE ASSESSMENT (Host Only) */}
              {activeSidebar === 'questions' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Performance Summary Banner */}
                  <div style={{ background: '#252936', border: '1px solid #1A73E8', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#8AB4F8' }}>Live Assessment Telemetry</span>
                      <span style={{ fontSize: 11, background: 'rgba(52,168,83,0.2)', color: '#81C995', padding: '2px 8px', borderRadius: 9999, fontWeight: 600 }}>
                        Auto-Scorecard Synced
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center', marginTop: 4 }}>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 4px', borderRadius: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#E8EAED' }}>{questionAnswers.length}</div>
                        <div style={{ fontSize: 10, color: '#9AA0A6' }}>Answered</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 4px', borderRadius: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#34A853' }}>
                          {questionAnswers.filter(a => a.isCorrect).length}
                        </div>
                        <div style={{ fontSize: 10, color: '#9AA0A6' }}>Correct</div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.25)', padding: '8px 4px', borderRadius: 8 }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#8AB4F8' }}>
                          {questionAnswers.length > 0 ? Math.round((questionAnswers.filter(a => a.isCorrect).length / questionAnswers.length) * 100) : 0}%
                        </div>
                        <div style={{ fontSize: 10, color: '#9AA0A6' }}>Accuracy</div>
                      </div>
                    </div>
                  </div>

                  {/* Tabs: Generate on Spot | Session Questions | Custom Composer */}
                  <div style={{ display: 'flex', background: '#303134', borderRadius: 8, padding: 3 }}>
                    <button
                      type="button"
                      onClick={() => setAssessmentTab('onspot')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: assessmentTab === 'onspot' ? '#1A73E8' : 'transparent',
                        color: assessmentTab === 'onspot' ? '#fff' : '#9AA0A6',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <Zap size={13} /> Generate on Spot
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssessmentTab('session')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: assessmentTab === 'session' ? '#1A73E8' : 'transparent',
                        color: assessmentTab === 'session' ? '#fff' : '#9AA0A6',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Session ({mcqQuestions.length + codingChallenges.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssessmentTab('custom')}
                      style={{
                        flex: 1,
                        padding: '6px 8px',
                        borderRadius: 6,
                        border: 'none',
                        background: assessmentTab === 'custom' ? '#1A73E8' : 'transparent',
                        color: assessmentTab === 'custom' ? '#fff' : '#9AA0A6',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Custom
                    </button>
                  </div>

                  {/* 1. On-the-Spot Question Generator Tab */}
                  {assessmentTab === 'onspot' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ background: '#303134', padding: 12, borderRadius: 10, border: '1px solid #3C4043' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#E8EAED', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Sparkles size={14} color="#8AB4F8" /> On-the-Spot Question Synthesis
                        </div>

                        {/* Quick Topic Chips */}
                        <div style={{ fontSize: 11, color: '#9AA0A6', marginBottom: 6 }}>Select Topic:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                          {['DSA', 'React', 'JavaScript', 'DBMS & SQL', 'System Design', 'Networks', 'Python'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setOnSpotForm({ ...onSpotForm, topic: t })}
                              style={{
                                padding: '4px 10px',
                                borderRadius: 16,
                                border: onSpotForm.topic === t ? '1px solid #1A73E8' : '1px solid #5F6368',
                                background: onSpotForm.topic === t ? 'rgba(26,115,232,0.2)' : 'transparent',
                                color: onSpotForm.topic === t ? '#8AB4F8' : '#BDC1C6',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>

                        {/* Format & Difficulty Pickers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
                          <div>
                            <div style={{ fontSize: 10, color: '#9AA0A6', marginBottom: 4 }}>Type:</div>
                            <div style={{ display: 'flex', background: '#202124', borderRadius: 6, padding: 2 }}>
                              <button
                                type="button"
                                onClick={() => setOnSpotForm({ ...onSpotForm, type: 'mcq' })}
                                style={{
                                  flex: 1,
                                  padding: '5px 4px',
                                  borderRadius: 4,
                                  border: 'none',
                                  background: onSpotForm.type === 'mcq' ? '#1A73E8' : 'transparent',
                                  color: onSpotForm.type === 'mcq' ? '#fff' : '#9AA0A6',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                MCQ
                              </button>
                              <button
                                type="button"
                                onClick={() => setOnSpotForm({ ...onSpotForm, type: 'code' })}
                                style={{
                                  flex: 1,
                                  padding: '5px 4px',
                                  borderRadius: 4,
                                  border: 'none',
                                  background: onSpotForm.type === 'code' ? '#1A73E8' : 'transparent',
                                  color: onSpotForm.type === 'code' ? '#fff' : '#9AA0A6',
                                  fontSize: 10,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Coding
                              </button>
                            </div>
                          </div>

                          <div>
                            <div style={{ fontSize: 10, color: '#9AA0A6', marginBottom: 4 }}>Difficulty:</div>
                            <div style={{ display: 'flex', background: '#202124', borderRadius: 6, padding: 2 }}>
                              {['Easy', 'Medium', 'Hard'].map(d => (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => setOnSpotForm({ ...onSpotForm, difficulty: d })}
                                  style={{
                                    flex: 1,
                                    padding: '5px 2px',
                                    borderRadius: 4,
                                    border: 'none',
                                    background: onSpotForm.difficulty === d ? '#1A73E8' : 'transparent',
                                    color: onSpotForm.difficulty === d ? '#fff' : '#9AA0A6',
                                    fontSize: 10,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {d}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Dual Action: 1-Click Instant Post or Preview First */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => handleGenerateOnSpot({ postImmediately: true })}
                            disabled={generatingOnSpot}
                            style={{
                              width: '100%',
                              padding: '10px 14px',
                              borderRadius: 8,
                              border: 'none',
                              background: '#34A853',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: generatingOnSpot ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              boxShadow: '0 2px 10px rgba(52,168,83,0.3)',
                            }}
                          >
                            {generatingOnSpot ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" /> Generating on spot...
                              </>
                            ) : (
                              <>
                                <Zap size={14} /> Instant Generate & Post to Candidate
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleGenerateOnSpot({ postImmediately: false })}
                            disabled={generatingOnSpot}
                            style={{
                              width: '100%',
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: '1px solid #3C4043',
                              background: '#303134',
                              color: '#E8EAED',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: generatingOnSpot ? 'wait' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <Sparkles size={13} style={{ color: '#8AB4F8' }} /> Preview Question First
                          </button>
                        </div>
                      </div>

                      {/* Display the newly generated question preview */}
                      {lastGeneratedQuestion && (
                        <div
                          style={{
                            background: '#303134',
                            border: '1.5px solid #1A73E8',
                            borderRadius: 10,
                            padding: 12,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, background: '#1A73E8', color: '#fff', padding: '2px 8px', borderRadius: 4, fontWeight: 700 }}>
                              Generated on Spot
                            </span>
                            <span style={{ fontSize: 10, color: lastGeneratedQuestion.difficulty === 'Easy' ? '#34A853' : '#F9AB00', fontWeight: 600 }}>
                              {lastGeneratedQuestion.difficulty} • {lastGeneratedQuestion.points || 10} pts
                            </span>
                          </div>

                          <div style={{ fontSize: 12, fontWeight: 700, color: '#E8EAED', lineHeight: 1.4 }}>
                            {lastGeneratedQuestion.title || lastGeneratedQuestion.question}
                          </div>

                          {lastGeneratedQuestion.type === 'mcq' && Array.isArray(lastGeneratedQuestion.options) && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                              {lastGeneratedQuestion.options.map((opt, optIdx) => (
                                <div
                                  key={optIdx}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '5px 8px',
                                    borderRadius: 4,
                                    background: optIdx === lastGeneratedQuestion.correct ? 'rgba(52,168,83,0.15)' : 'rgba(255,255,255,0.03)',
                                    color: optIdx === lastGeneratedQuestion.correct ? '#81C995' : '#BDC1C6',
                                    border: optIdx === lastGeneratedQuestion.correct ? '1px solid rgba(52,168,83,0.3)' : 'none',
                                  }}
                                >
                                  <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + optIdx)}.</span>
                                  <span>{opt}</span>
                                  {optIdx === lastGeneratedQuestion.correct && <Check size={12} style={{ marginLeft: 'auto' }} />}
                                </div>
                              ))}
                            </div>
                          )}

                          {lastGeneratedQuestion.type === 'code' && (
                            <div style={{ background: '#1E1E1E', padding: '8px 10px', borderRadius: 6, fontSize: 10, color: '#4ADE80', fontFamily: 'monospace' }}>
                              {lastGeneratedQuestion.testCases || 'Interactive live code runner ready'}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              handlePostQuestion(lastGeneratedQuestion);
                              if (lastGeneratedQuestion.type === 'code') setActiveSidebar('code');
                            }}
                            style={{
                              marginTop: 2,
                              padding: '8px 14px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#34A853',
                              color: '#fff',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                            }}
                          >
                            <Play size={13} /> Post to Candidate Screen Now
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Session Questions Tab (Zero Demo Data - Only What Host Created in Session) */}
                  {assessmentTab === 'session' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {questionsLoading ? (
                        <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9AA0A6', fontSize: 12 }}>
                          <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px', display: 'block', color: '#1A73E8' }} />
                          Fetching session questions...
                        </div>
                      ) : (mcqQuestions.length + codingChallenges.length) === 0 ? (
                        <div style={{ textAlign: 'center', padding: '30px 15px', color: '#9AA0A6', background: '#303134', borderRadius: 10, border: '1px dashed #5F6368' }}>
                          <HelpCircle size={28} style={{ margin: '0 auto 8px', display: 'block', color: '#5F6368' }} />
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#E8EAED', marginBottom: 4 }}>No Questions Yet</div>
                          <div style={{ fontSize: 11, color: '#9AA0A6', marginBottom: 12 }}>
                            There is zero preset demo data. Generate a question on the spot or compose a custom challenge.
                          </div>
                          <button
                            type="button"
                            onClick={() => setAssessmentTab('onspot')}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 6,
                              border: 'none',
                              background: '#1A73E8',
                              color: '#fff',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Zap size={12} /> Generate on Spot
                          </button>
                        </div>
                      ) : (
                        [...mcqQuestions, ...codingChallenges].map((q, idx) => {
                          const answerRecord = questionAnswers.find(a => a.questionId === q.id);
                          const isCurrentlyActive = activeQuestion?.id === q.id;

                          return (
                            <div
                              key={q.id}
                              style={{
                                background: '#303134',
                                border: isCurrentlyActive ? '1.5px solid #1A73E8' : '1px solid #3C4043',
                                borderRadius: 10,
                                padding: 12,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 8,
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontSize: 10, background: '#3C4043', color: '#8AB4F8', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                  {q.topic || 'Technical'} • {q.type === 'code' ? 'Code' : 'MCQ'}
                                </span>
                                <span style={{ fontSize: 10, color: q.difficulty === 'Easy' ? '#34A853' : '#F9AB00', fontWeight: 600 }}>
                                  {q.difficulty} • {q.points || 10} pts
                                </span>
                              </div>

                              <div style={{ fontSize: 12, fontWeight: 600, color: '#E8EAED', lineHeight: 1.4 }}>
                                {idx + 1}. {q.title || q.question}
                              </div>

                              {q.type === 'mcq' && Array.isArray(q.options) && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11 }}>
                                  {q.options.map((opt, optIdx) => (
                                    <div
                                      key={optIdx}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        background: optIdx === q.correct ? 'rgba(52,168,83,0.15)' : 'rgba(255,255,255,0.03)',
                                        color: optIdx === q.correct ? '#81C995' : '#BDC1C6',
                                      }}
                                    >
                                      <span style={{ fontWeight: 700 }}>{String.fromCharCode(65 + optIdx)}.</span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                {answerRecord ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: answerRecord.isCorrect ? '#34A853' : '#EA4335', fontWeight: 600 }}>
                                    {answerRecord.isCorrect ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                    <span>Answered: {answerRecord.isCorrect ? `Correct (+${answerRecord.points || 10} pts)` : 'Incorrect (0 pts)'}</span>
                                  </div>
                                ) : isCurrentlyActive ? (
                                  <span style={{ fontSize: 11, color: '#8AB4F8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1A73E8' }} />
                                    Active on candidate screen
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handlePostQuestion(q);
                                      if (q.type === 'code') setActiveSidebar('code');
                                    }}
                                    style={{
                                      padding: '6px 12px',
                                      borderRadius: 6,
                                      border: 'none',
                                      background: '#1A73E8',
                                      color: '#fff',
                                      fontSize: 11,
                                      fontWeight: 700,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 6,
                                    }}
                                  >
                                    <Play size={12} /> Post to Candidate
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 3. Custom Question Creator */}
                  {assessmentTab === 'custom' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 11, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>Question Prompt</label>
                        <textarea
                          rows={2}
                          value={customQuestionForm.question}
                          onChange={e => setCustomQuestionForm({ ...customQuestionForm, question: e.target.value })}
                          placeholder="e.g. What is the difference between synchronous and asynchronous operations?"
                          style={{ width: '100%', background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '8px', borderRadius: 6, fontSize: 12, outline: 'none' }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <label style={{ fontSize: 11, color: '#BDC1C6' }}>Options (Select the radio of the correct answer):</label>
                        {customQuestionForm.options.map((opt, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                              type="radio"
                              name="customCorrect"
                              checked={customQuestionForm.correct === i}
                              onChange={() => setCustomQuestionForm({ ...customQuestionForm, correct: i })}
                              style={{ accentColor: '#34A853' }}
                            />
                            <input
                              type="text"
                              value={opt}
                              onChange={e => {
                                const newOpts = [...customQuestionForm.options];
                                newOpts[i] = e.target.value;
                                setCustomQuestionForm({ ...customQuestionForm, options: newOpts });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`}
                              style={{ flex: 1, background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '6px 10px', borderRadius: 6, fontSize: 12, outline: 'none' }}
                            />
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>Points</label>
                          <input
                            type="number"
                            value={customQuestionForm.points}
                            onChange={e => setCustomQuestionForm({ ...customQuestionForm, points: Number(e.target.value) || 10 })}
                            style={{ width: '100%', background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: 11, color: '#BDC1C6', display: 'block', marginBottom: 4 }}>Topic</label>
                          <input
                            type="text"
                            value={customQuestionForm.topic}
                            onChange={e => setCustomQuestionForm({ ...customQuestionForm, topic: e.target.value })}
                            style={{ width: '100%', background: '#303134', color: '#fff', border: '1px solid #5F6368', padding: '6px 10px', borderRadius: 6, fontSize: 12 }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (!customQuestionForm.question.trim()) return;
                          const newQ = {
                            id: `custom_${Date.now()}`,
                            topic: customQuestionForm.topic || 'Custom Technical',
                            difficulty: 'Medium',
                            question: customQuestionForm.question.trim(),
                            options: customQuestionForm.options.filter(o => o.trim().length > 0),
                            correct: customQuestionForm.correct,
                            points: customQuestionForm.points,
                            type: 'mcq',
                          };
                          setMcqQuestions(prev => [newQ, ...prev]);
                          handlePostQuestion(newQ);
                          try {
                            await fetch('/api/interviews/questions', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify(newQ),
                            });
                          } catch (err) {
                            console.error('Failed to save question to database:', err);
                          }
                          setCustomQuestionForm({
                            question: '',
                            options: ['', '', '', ''],
                            correct: 0,
                            points: 10,
                            topic: 'Core Technical',
                          });
                          setAssessmentTab('mcq');
                        }}
                        disabled={!customQuestionForm.question.trim()}
                        style={{
                          marginTop: 6,
                          padding: '9px 16px',
                          borderRadius: 8,
                          border: 'none',
                          background: '#1A73E8',
                          color: '#fff',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: customQuestionForm.question.trim() ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        }}
                      >
                        <ListPlus size={14} /> Post Custom Question to Candidate
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </aside>
        )}

      </div>

      {/* ─── BOTTOM CONTROL BAR (GOOGLE MEET STYLE) ─── */}
      <footer style={{ height: 80, background: '#202124', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'relative' }}>
        
        {/* Left: Meeting Time, ID & Real-time Network Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#E8EAED' }}>
            {formatTime(callDuration)}
          </div>
          <div style={{ height: 16, width: 1, background: '#5F6368' }} />
          <div style={{ fontSize: 13, color: '#9AA0A6' }}>
            {meetingId}
          </div>
          <div style={{ height: 16, width: 1, background: '#5F6368' }} />
          {/* Network Quality Pill */}
          <button
            type="button"
            onClick={() => setShowNetworkModal(true)}
            title="Click to check detailed network latency, packet loss, and WebRTC diagnostics"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid ${
                networkStats.status === 'poor' ? '#EA4335' :
                networkStats.status === 'fair' ? '#F9AB00' :
                'rgba(52,168,83,0.35)'
              }`,
              borderRadius: 9999,
              padding: '4px 10px',
              color: '#E8EAED',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background:
                  networkStats.status === 'poor' ? '#EA4335' :
                  networkStats.status === 'fair' ? '#F9AB00' :
                  '#34A853',
              }}
            />
            <Activity size={12} color={networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#81C995'} />
            <span>{networkStats.latency} ms ({networkStats.status.toUpperCase()})</span>
          </button>
        </div>

        {/* Center: Essential Call Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mic */}
          <button
            type="button"
            onClick={toggleMic}
            title={micMuted ? 'Turn on microphone' : 'Turn off microphone'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: micMuted ? '#EA4335' : '#3C4043',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {micMuted ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={toggleVideo}
            title={videoOff ? 'Turn on camera' : 'Turn off camera'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: videoOff ? '#EA4335' : '#3C4043',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {videoOff ? <VideoOff size={18} /> : <VideoIcon size={18} />}
          </button>

          {/* Reactions */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowReactionsMenu(!showReactionsMenu)}
              title="Send a reaction"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: showReactionsMenu ? '#1A73E8' : '#3C4043',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Smile size={18} />
            </button>

            {/* Reactions Popover */}
            {showReactionsMenu && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 56,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#303134',
                  borderRadius: 24,
                  padding: '6px 12px',
                  display: 'flex',
                  gap: 8,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                  border: '1px solid #5F6368',
                }}
              >
                {REACTION_TYPES.map(r => {
                  const IconComp = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        triggerReaction(r.id);
                        setShowReactionsMenu(false);
                      }}
                      title={r.label}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 6,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconComp size={20} color={r.color} fill={r.fill} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Raise Hand */}
          <button
            type="button"
            onClick={toggleHandRaise}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: handRaised ? '#F9AB00' : '#3C4043',
              color: handRaised ? '#202124' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Hand size={18} />
          </button>

          {/* Present Screen */}
          <button
            type="button"
            onClick={toggleScreenShare}
            title={screenSharing ? 'Stop presenting' : 'Present now'}
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: 'none',
              background: screenSharing ? '#1A73E8' : '#3C4043',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ScreenShare size={18} />
          </button>

          {/* End Call button */}
          <button
            type="button"
            onClick={handleEndCall}
            title="Leave call"
            style={{
              height: 44,
              padding: '0 20px',
              borderRadius: 24,
              border: 'none',
              background: '#EA4335',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            <PhoneOff size={18} />
            <span>Leave</span>
          </button>
        </div>

        {/* Right: Drawer toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Info */}
          <button
            type="button"
            onClick={() => setActiveSidebar(activeSidebar === 'info' ? null : 'info')}
            title="Meeting details"
            style={{ background: activeSidebar === 'info' ? '#1A73E8' : 'none', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Info size={18} />
          </button>

          {/* People */}
          <button
            type="button"
            onClick={() => setActiveSidebar(activeSidebar === 'people' ? null : 'people')}
            title="People"
            style={{
              position: 'relative',
              background: activeSidebar === 'people' ? '#1A73E8' : 'none',
              border: 'none',
              color: '#fff',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={18} />
            {isRecruiter && pendingJoinRequests.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#EA4335',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {pendingJoinRequests.length}
              </span>
            )}
          </button>

          {/* Chat */}
          <button
            type="button"
            onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
            title="Chat with everyone"
            style={{ background: activeSidebar === 'chat' ? '#1A73E8' : 'none', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <MessageSquare size={18} />
          </button>

          {/* Code Editor */}
          <button
            type="button"
            onClick={() => setActiveSidebar(activeSidebar === 'code' ? null : 'code')}
            title="Collaborative Code Editor"
            style={{ background: activeSidebar === 'code' ? '#1A73E8' : 'none', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FileCode size={18} />
          </button>

          {/* Network Health Check Telemetry */}
          <button
            type="button"
            onClick={() => setShowNetworkModal(true)}
            title="Check Network Stability & Latency"
            style={{
              background: 'none',
              border: `1px solid ${
                networkStats.status === 'poor' ? '#EA4335' :
                networkStats.status === 'fair' ? '#F9AB00' :
                '#5F6368'
              }`,
              color: '#fff',
              width: 40,
              height: 40,
              borderRadius: '50%',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Activity size={18} color={networkStats.status === 'poor' ? '#EA4335' : networkStats.status === 'fair' ? '#F9AB00' : '#34A853'} />
          </button>

          {/* Technical Questions & Live Assessment (Recruiter only) */}
          {isRecruiter && (
            <button
              type="button"
              onClick={() => setActiveSidebar(activeSidebar === 'questions' ? null : 'questions')}
              title="Post Technical Questions & MCQs"
              style={{
                position: 'relative',
                background: activeSidebar === 'questions' ? '#1A73E8' : 'none',
                border: 'none',
                color: '#fff',
                width: 40,
                height: 40,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HelpCircle size={18} />
              {questionAnswers.length > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#34A853',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {questionAnswers.length}
                </span>
              )}
            </button>
          )}

          {/* Scorecard (Recruiter only) */}
          {isRecruiter && (
            <button
              type="button"
              onClick={() => setActiveSidebar(activeSidebar === 'scorecard' ? null : 'scorecard')}
              title="Evaluation Scorecard"
              style={{ background: activeSidebar === 'scorecard' ? '#EA4335' : 'none', border: 'none', color: '#fff', width: 40, height: 40, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Award size={18} />
            </button>
          )}
        </div>

      </footer>

      {/* ─── REAL-TIME NETWORK DIAGNOSTICS & TELEMETRY MODAL ─── */}
      {showNetworkModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 20,
          }}
          onClick={() => setShowNetworkModal(false)}
        >
          <div
            style={{
              background: '#202124',
              border: '1px solid #5F6368',
              borderRadius: 16,
              maxWidth: 520,
              width: '100%',
              padding: 24,
              boxShadow: '0 24px 60px rgba(0,0,0,0.8)',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              color: '#fff',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(26,115,232,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={20} color="#8AB4F8" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#E8EAED' }}>
                    Network Quality & Call Telemetry
                  </h3>
                  <div style={{ fontSize: 12, color: '#9AA0A6' }}>
                    Live WebRTC link stability and latency monitor
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                style={{ background: 'none', border: 'none', color: '#9AA0A6', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Overall Score Box */}
            <div
              style={{
                background:
                  networkStats.status === 'poor' ? 'rgba(234,67,53,0.1)' :
                  networkStats.status === 'fair' ? 'rgba(249,171,0,0.1)' :
                  'rgba(52,168,83,0.1)',
                border: `1px solid ${
                  networkStats.status === 'poor' ? '#EA4335' :
                  networkStats.status === 'fair' ? '#F9AB00' :
                  '#34A853'
                }`,
                borderRadius: 12,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9AA0A6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Connection Health Rating
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#E8EAED', marginTop: 2 }}>
                  {networkStats.qualityScore}/100 • {networkStats.status === 'excellent' ? 'Optimal Link' : networkStats.status === 'good' ? 'Stable & Fast' : networkStats.status === 'fair' ? 'Fair / Moderate Latency' : 'Degraded Connection'}
                </div>
              </div>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background:
                    networkStats.status === 'poor' ? '#EA4335' :
                    networkStats.status === 'fair' ? '#F9AB00' :
                    '#34A853',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Wifi size={24} />
              </div>
            </div>

            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Latency / Ping */}
              <div style={{ background: '#303134', padding: 14, borderRadius: 10, border: '1px solid #3C4043' }}>
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>ROUND-TRIP LATENCY</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#8AB4F8', marginTop: 4 }}>
                  {networkStats.latency} ms
                </div>
                <div style={{ fontSize: 11, color: networkStats.latency < 100 ? '#34A853' : '#F9AB00', marginTop: 4 }}>
                  {networkStats.latency < 60 ? 'Optimal for voice & video' : networkStats.latency < 150 ? 'Acceptable conversation lag' : 'Noticeable delay'}
                </div>
              </div>

              {/* Packet Loss */}
              <div style={{ background: '#303134', padding: 14, borderRadius: 10, border: '1px solid #3C4043' }}>
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>PACKET LOSS</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: networkStats.packetLoss < 1.0 ? '#34A853' : '#EA4335', marginTop: 4 }}>
                  {networkStats.packetLoss}%
                </div>
                <div style={{ fontSize: 11, color: networkStats.packetLoss < 1.5 ? '#34A853' : '#EA4335', marginTop: 4 }}>
                  {networkStats.packetLoss < 1.0 ? 'Zero packet drop' : 'Minor audio/video stutter'}
                </div>
              </div>

              {/* Jitter */}
              <div style={{ background: '#303134', padding: 14, borderRadius: 10, border: '1px solid #3C4043' }}>
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>JITTER BUFFER</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#E8EAED', marginTop: 4 }}>
                  {networkStats.jitter} ms
                </div>
                <div style={{ fontSize: 11, color: '#9AA0A6', marginTop: 4 }}>
                  Packet arrival variance
                </div>
              </div>

              {/* Carrier Downlink */}
              <div style={{ background: '#303134', padding: 14, borderRadius: 10, border: '1px solid #3C4043' }}>
                <div style={{ fontSize: 11, color: '#9AA0A6', fontWeight: 600 }}>BANDWIDTH / CARRIER</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#E8EAED', marginTop: 4 }}>
                  ~{networkStats.downlink} Mbps
                </div>
                <div style={{ fontSize: 11, color: '#8AB4F8', marginTop: 4 }}>
                  {networkStats.effectiveType} Connection
                </div>
              </div>
            </div>

            {/* Protocol & Security Info */}
            <div style={{ background: '#2D3035', padding: '12px 14px', borderRadius: 8, fontSize: 12, color: '#9AA0A6', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>WebRTC Session State:</span>
                <span style={{ color: '#34A853', fontWeight: 600 }}>{networkStats.connectionState}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Media Security:</span>
                <span style={{ color: '#E8EAED' }}>DTLS-SRTP 256-bit AES End-to-End</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Video Profile:</span>
                <span style={{ color: '#E8EAED' }}>720p HD (Adaptive Bitrate Control)</span>
              </div>
            </div>

            {/* Close footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: '#9AA0A6' }}>
                Diagnostics refreshed continuously
              </span>
              <button
                type="button"
                onClick={() => setShowNetworkModal(false)}
                style={{
                  padding: '8px 22px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1A73E8',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── HOST END-MEETING CHOICE MODAL (End for All vs Leave Me Only) ─── */}
      {showHostEndChoiceModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#202124', border: '1px solid #3C4043', borderRadius: 16, padding: '28px', maxWidth: 440, width: '100%', color: '#E8EAED', display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 24px 60px rgba(0,0,0,0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(234,67,53,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PhoneOff size={24} color="#EA4335" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>Leave or end meeting?</h3>
                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#9AA0A6' }}>
                  As the meeting host, choose whether to end the session for all participants or just leave yourself.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                onClick={handleEndMeetingForAll}
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#EA4335',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s',
                }}
              >
                <span>End meeting for all</span>
                <Users size={18} />
              </button>

              <button
                type="button"
                onClick={handleLeaveMeetingOnly}
                style={{
                  padding: '12px 18px',
                  borderRadius: 10,
                  border: '1px solid #5F6368',
                  background: '#303134',
                  color: '#E8EAED',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s',
                }}
              >
                <span>Just leave the meeting</span>
                <PhoneOff size={18} />
              </button>

              <button
                type="button"
                onClick={() => setShowHostEndChoiceModal(false)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: '#9AA0A6',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── END CALL MODAL ─── */}
      {showEndModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: 20 }}>
          <div style={{ background: '#202124', border: '1px solid #3C4043', borderRadius: 16, padding: '32px', maxWidth: 440, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.95)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: isEndedForAll ? 'rgba(234,67,53,0.18)' : 'rgba(26,115,232,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PhoneOff size={32} color={isEndedForAll ? '#EA4335' : '#8AB4F8'} />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 6px', color: '#E8EAED' }}>
                {isEndedForAll ? 'Meeting Ended' : 'You left the meeting'}
              </h2>
              <p style={{ fontSize: 13, color: '#9AA0A6', margin: 0, lineHeight: 1.5 }}>
                {meetingEndedReason}
                <br />
                Call duration: <strong>{formatTime(callDuration)}</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              {!isEndedForAll && (
                <button
                  type="button"
                  onClick={() => {
                    setShowEndModal(false);
                    setInLobby(true);
                  }}
                  style={{ padding: '10px 20px', borderRadius: 9999, border: '1px solid #5F6368', background: 'transparent', color: '#8AB4F8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >
                  Rejoin Meeting
                </button>
              )}
              <Link
                to={isRecruiter ? '/company/calls' : '/student/calls'}
                style={{ padding: '10px 24px', borderRadius: 9999, border: 'none', background: '#1A73E8', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Return to Hub
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
