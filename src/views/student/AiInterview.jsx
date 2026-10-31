import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  Camera,
  CameraOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Video,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Clock,
  Send,
  ArrowRight,
  History,
  Loader2,
  Scan,
  UserCheck,
  Eye,
  BookOpen,
  Keyboard,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import BaseLayout from '../../components/Layout';
import Modal from '../../components/Modal';
import LiveAiAgentStream from '../../components/LiveAiAgentStream';
import CameraVisionProctor from '../../components/CameraVisionProctor';
import LiveCodeEditor from '../../components/LiveCodeEditor';
import Notice from '../../components/Notice';
import InterviewRoom, { TileMessage } from '../../components/InterviewRoom';
import ThreeAvatarCanvas from '../../components/ThreeAvatarCanvas';
import useCameraStream from '../../hooks/useCameraStream';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { INTERVIEW_ROLES, computeFinalReport } from '../../lib/aiInterviewEngine';
import { playTtsAudio, stopCurrentAudio } from '../../lib/audioService';

/**
 * Unified Interviewer Profile Config.
 * Used consistently across greetings, headers, reports, setup screen, and avatar.
 */
export const INTERVIEWER = {
  name: 'Career-OS Expert AI',
  title: 'Lead Technical Interviewer & Talent Partner',
  avatarUrl: '/avatars/hr-female.glb',
  stillUrl: '/avatars/male_hr_still.jpg',
  speakingUrl: '/avatars/male_hr_speaking.jpg',
  warningUrl: '/avatars/male_hr_warning.jpg',
  voice: 'male-en-IN',
};

export default function StudentAiInterview() {
  const { user } = useAuth();
  const { state } = useData();
  const currentStudent = state.students?.find(s => s.id === user?.studentId) || state.students?.[0];

  // Navigation tab: 'studio' | 'history'
  const [activeTab, setActiveTab] = useState('studio');

  // Role & Session Setup
  const [selectedRole, setSelectedRole] = useState(INTERVIEW_ROLES[0]);
  const [experienceLevel, setExperienceLevel] = useState('Fresher / Entry Level (Campus Placements)');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [feedbackMode, setFeedbackMode] = useState('mock'); // 'mock' | 'practice'

  // Interview Execution States: 'setup' | 'interviewing' | 'evaluating_answer' | 'feedback_step' | 'report'
  const [sessionState, setSessionState] = useState('setup');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [studentAnswer, setStudentAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [speechSupported] = useState(() => typeof window !== 'undefined' && Boolean(navigator?.mediaDevices?.getUserMedia && window?.MediaRecorder));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verbalInputMode, setVerbalInputMode] = useState('voice'); // 'voice' | 'keyboard'
  const [liveGazeStatus, setLiveGazeStatus] = useState('centered'); // 'centered' | 'looking_down' | 'out_of_frame'

  // Animated HR Avatar States: 'listening' | 'speaking' | 'warning' | 'thinking'
  const [hrAvatarState, setHrAvatarState] = useState('listening');
  const [currentCaption, setCurrentCaption] = useState('');

  // Notices and Inline Alerts (replaces all window.alert calls)
  const [notice, setNotice] = useState(null);
  const [silenceNotice, setSilenceNotice] = useState(false);
  const silenceAudioCtxRef = useRef(null);
  const silenceAnimRef = useRef(null);
  const lastRecordedAudioBlobRef = useRef(null);
  const maxRecordingTimerRef = useRef(null);

  // Proctoring Audit Logger
  const logProctorEvent = useCallback((event) => {
    setProctoringAuditLog(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        ...event,
      },
    ]);
  }, []);

  // Camera & Webcam Stream via useCameraStream hook
  // Enabled for the whole time candidate is in the room: interviewing, evaluating_answer, feedback_step.
  // Moving between those states does NOT restart the camera or reset proctor's calibration.
  const inRoom = ['interviewing', 'evaluating_answer', 'feedback_step'].includes(sessionState);
  const { videoRef: webcamVideoRef, streamRef, status: camStatus } = useCameraStream({
    enabled: inRoom,
    onEvent: logProctorEvent,
  });

  const [cameraActive, setCameraActive] = useState(true);
  const [micActive, setMicActive] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  // Cheating / Malpractice Proctoring Engine
  const [malpracticeCount, setMalpracticeCount] = useState(0);
  const [proctoringAuditLog, setProctoringAuditLog] = useState([]);
  const [isHandsUpChallengeActive, setIsHandsUpChallengeActive] = useState(false);
  const [handsUpTimer, setHandsUpTimer] = useState(10);
  const [lastViolationReason, setLastViolationReason] = useState('');
  const [bothHandsVisible, setBothHandsVisible] = useState(false);
  const [handsDetectedCount, setHandsDetectedCount] = useState(0);
  const [isUnverifiedTimerFallback, setIsUnverifiedTimerFallback] = useState(false);
  const [handsUpReasonType, setHandsUpReasonType] = useState('generic');
  
  // Phase 1.4: Enhanced Proctoring Challenge Config & Accessibility
  const [challengeMode, setChallengeMode] = useState('both_hands'); // 'both_hands' | 'one_hand_gesture' | 'blink_and_turn'
  const [targetFingers, setTargetFingers] = useState(3);
  const [targetTurn, setTargetTurn] = useState('right');
  const [challengeHoldProgress, setChallengeHoldProgress] = useState(0);
  const [challengeFailures, setChallengeFailures] = useState(0);
  const [isAccessibilityReviewFlagged, setIsAccessibilityReviewFlagged] = useState(false);
  const shouldDiscardRecordingRef = useRef(false);
  const isRecordingRef = useRef(false);
  const verbalInputModeRef = useRef(verbalInputMode);
  useEffect(() => {
    verbalInputModeRef.current = verbalInputMode;
  }, [verbalInputMode]);

  // Synchronized state references for asynchronous speech recognition and proctoring
  const studentAnswerRef = useRef(studentAnswer);
  useEffect(() => {
    studentAnswerRef.current = studentAnswer;
  }, [studentAnswer]);

  const sessionStateRef = useRef(sessionState);
  useEffect(() => {
    sessionStateRef.current = sessionState;
  }, [sessionState]);

  const isSubmittingRef = useRef(isSubmitting);
  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  // Live continuous Web Speech streaming references
  const speechRecognitionRef = useRef(null);
  const liveFinalTranscriptRef = useRef('');

  // Silence inactivity follow-up nudge timer
  const inactivityTimerRef = useRef(null);
  const hasSpokenInactivityNudgeRef = useRef(false);

  function resetInactivityTimer() {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }

  function startInactivityTimer() {
    resetInactivityTimer();
    hasSpokenInactivityNudgeRef.current = false;
    inactivityTimerRef.current = setTimeout(() => {
      if (
        sessionStateRef.current === 'interviewing' &&
        !hasSpokenInactivityNudgeRef.current &&
        !studentAnswerRef.current?.trim() &&
        !isSubmittingRef.current
      ) {
        hasSpokenInactivityNudgeRef.current = true;
        const nudgeText = "Feel free to take your time to structure your thoughts, or start speaking whenever you're ready. I'm listening.";
        speakSentence(nudgeText, 'listening', () => {
          if (verbalInputModeRef.current === 'voice') {
            startListeningAuto();
          }
        });
      }
    }, 18000);
  }

  // Transcript and evaluations for current session
  const [sessionTranscript, setSessionTranscript] = useState([]);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [finalReport, setFinalReport] = useState(null);

  // Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef(null);

  // Historical sessions from PostgreSQL backend
  const [pastInterviews, setPastInterviews] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryInterview, setSelectedHistoryInterview] = useState(null);

  // Private Local STT MediaRecorder References (100% On-Device / Self-Hosted Whisper)
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const lastAudioReportRef = useRef(0);
  const lastAudioLevelRef = useRef(0);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const studentId = currentStudent?.id || 'stud_1';
      const res = await fetch(`/api/ai-interview?studentId=${studentId}`);
      if (res.ok) {
        const data = await res.json();
        setPastInterviews(data.interviews || []);
      }
    } catch (err) {
      console.warn('Failed to load past AI interviews:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentStudent?.id]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Timer interval control during live interview
  useEffect(() => {
    if (sessionState === 'interviewing' || sessionState === 'evaluating_answer' || sessionState === 'feedback_step') {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionState]);

  // Clean up all timers, media recorders, audio playback on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current);
      stopSilenceDetector();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (_) {}
      }
      stopCurrentAudio();
    };
  }, []);

  function toggleCameraTrack() {
    if (streamRef.current) {
      const tracks = streamRef.current.getVideoTracks();
      if (tracks.length > 0) {
        const nextState = !tracks[0].enabled;
        tracks[0].enabled = nextState;
        setCameraActive(nextState);
        logProctorEvent({
          type: nextState ? 'camera_on' : 'camera_off',
          reason: nextState ? 'Candidate re-enabled camera track.' : 'Candidate switched off camera track.',
          severity: nextState ? 'info' : 'high',
        });
        return;
      }
    }
    setCameraActive(prev => !prev);
  }

  function toggleMicTrack() {
    if (streamRef.current) {
      const tracks = streamRef.current.getAudioTracks();
      if (tracks.length > 0) {
        const nextState = !tracks[0].enabled;
        tracks[0].enabled = nextState;
        setMicActive(nextState);
        logProctorEvent({
          type: nextState ? 'mic_on' : 'mic_off',
          reason: nextState ? 'Candidate unmuted microphone.' : 'Candidate muted microphone.',
          severity: nextState ? 'info' : 'medium',
        });
        return;
      }
    }
    setMicActive(prev => !prev);
  }

  // Speak text or prompt using local Neural TTS engine
  // (Notice: avatar reads frequency directly via shared analyser, removing React state re-renders)
  function speakSentence(text, stateAfter = 'listening', onDone = null, promptId = null) {
    if (!voiceEnabled) {
      setHrAvatarState(stateAfter);
      setCurrentCaption(text);
      if (onDone) setTimeout(onDone, 600);
      return;
    }

    setHrAvatarState('speaking');
    setCurrentCaption(text);

    playTtsAudio({
      promptId,
      text,
      onEnd: () => {
        setHrAvatarState(stateAfter);
        if (onDone) onDone();
      },
    });
  }

  // Proctoring: Detect Tab Switch & Focus Loss with duration logging
  useEffect(() => {
    if (sessionState !== 'interviewing' && sessionState !== 'feedback_step') return;

    let blurTimer = null;
    let hiddenStart = null;

    function handleVisibilityChange() {
      if (document.hidden) {
        hiddenStart = Date.now();
      } else if (hiddenStart) {
        const awaySeconds = Math.max(1, Math.round((Date.now() - hiddenStart) / 1000));
        hiddenStart = null;
        setProctoringAuditLog(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            type: 'tab_switch',
            reason: `Candidate navigated away from active interview tab for ${awaySeconds}s.`,
            durationSeconds: awaySeconds,
            severity: awaySeconds > 6 ? 'high' : 'medium',
          },
        ]);
        if (awaySeconds > 8 && !isHandsUpChallengeActive) {
          triggerCheatingIntervention(`Left interview tab for ${awaySeconds} seconds.`, 'tab');
        }
      }
    }

    function handleWindowBlur() {
      if (isHandsUpChallengeActive || sessionState !== 'interviewing') return;
      // 1.5s grace period: ignore focus flickers or permission prompts
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          setProctoringAuditLog(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              timestamp: new Date().toISOString(),
              type: 'window_blur',
              reason: 'Interview window focus lost for >1.5 seconds.',
              severity: 'low',
            },
          ]);
        }
      }, 1500);
    }

    function handleWindowFocus() {
      if (blurTimer) clearTimeout(blurTimer);
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      if (blurTimer) clearTimeout(blurTimer);
    };
  }, [sessionState, isHandsUpChallengeActive]);

  // Contextual warning lines based on violation reason
  const WARNING_LINES = {
    gaze: 'I noticed you have been looking away from the screen. Please hold both hands up in front of the camera for ten seconds so we can check your workspace.',
    tab: 'It looks like you left the interview window. Please hold both hands up in front of the camera for ten seconds, then we will continue.',
    absent: 'I could not see you for a moment. Please sit in front of the camera and hold both hands up for ten seconds.',
    generic: 'Let us do a quick workspace check. Please hold both hands up in front of the camera for ten seconds.',
  };

  // Hands-Up Workspace Verification Countdown (StrictMode Safe)
  useEffect(() => {
    if (!isHandsUpChallengeActive) return undefined;
    if (handsUpTimer <= 0) {
      completeHandsUpVerification();
      return undefined;
    }
    // Only count down if both hands are verified in frame OR in timer-only fallback mode
    if (bothHandsVisible || isUnverifiedTimerFallback) {
      const id = setTimeout(() => setHandsUpTimer(t => Math.max(0, t - 1)), 1000);
      return () => clearTimeout(id);
    }
  }, [isHandsUpChallengeActive, handsUpTimer, bothHandsVisible, isUnverifiedTimerFallback]);

  function discardRecording() {
    shouldDiscardRecordingRef.current = true;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (_) {}
    }
    audioChunksRef.current = [];
    isRecordingRef.current = false;
    setIsRecording(false);
  }

  // Trigger Workspace Verification Challenge
  function triggerCheatingIntervention(reason = 'Workspace check required', reasonType = 'generic') {
    if (isHandsUpChallengeActive) return;

    // Immediately stop microphone and DISCARD audio (do NOT send to STT)
    discardRecording();

    setMalpracticeCount(prev => prev + 1);
    setLastViolationReason(reason);
    setHandsUpReasonType(reasonType);

    // Accessibility fallback: After 2 failed attempts, flag for manual review instead of auto-failing
    if (challengeFailures >= 2) {
      setIsAccessibilityReviewFlagged(true);
      setProctoringAuditLog(prev => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          type: 'accessibility_fallback_activated',
          reason: 'Proctoring flagged session for manual placement officer audit after repeated challenge attempts. Candidate score is protected.',
          severity: 'info',
        },
      ]);
      speakSentence('Your session is flagged for placement officer review. Resuming interview now without score deduction.', 'listening', () => {
        const activeQ = selectedRole.questions[currentQuestionIndex] || selectedRole.questions[0];
        if (activeQ.type === 'verbal' && verbalInputModeRef.current === 'voice') {
          startListeningAuto();
        }
      });
      return;
    }

    // Configure randomized challenge parameters
    const randomFingers = Math.floor(Math.random() * 4) + 1; // 1 to 4 fingers
    const randomTurn = Math.random() > 0.5 ? 'left' : 'right';
    setTargetFingers(randomFingers);
    setTargetTurn(randomTurn);
    setChallengeHoldProgress(0);

    setProctoringAuditLog(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: 'challenge_triggered',
        challengeMode,
        targetFingers: challengeMode === 'one_hand_gesture' ? randomFingers : undefined,
        targetTurn: challengeMode === 'blink_and_turn' ? randomTurn : undefined,
        reason,
        reasonType,
        severity: 'high',
      },
    ]);
    setIsHandsUpChallengeActive(true);
    setHandsUpTimer(10);
    setBothHandsVisible(false);
    setHrAvatarState('warning');

    const warningText = WARNING_LINES[reasonType] || WARNING_LINES.generic;
    speakSentence(warningText, 'warning', null, 'sys_hands_up');
  }

  // Complete hands-up verification challenge
  function completeHandsUpVerification() {
    setIsHandsUpChallengeActive(false);
    setHrAvatarState('speaking');

    if (!bothHandsVisible && !isUnverifiedTimerFallback) {
      setChallengeFailures(prev => {
        const next = prev + 1;
        if (next >= 2) {
          setIsAccessibilityReviewFlagged(true);
        }
        return next;
      });
    }

    setProctoringAuditLog(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: 'challenge_complete',
        challengeMode,
        reason: 'Workspace integrity verification step completed.',
        severity: 'info',
        unverified_timer_only: isUnverifiedTimerFallback,
        accessibility_flagged: challengeFailures >= 1,
      },
    ]);

    const resumeText = 'Thank you for verifying your workspace. Your integrity check has passed. Let us proceed with your interview.';
    speakSentence(resumeText, 'listening', () => {
      const activeQ = selectedRole.questions[currentQuestionIndex] || selectedRole.questions[0];
      if (activeQ.type === 'verbal' && verbalInputModeRef.current === 'voice') {
        startListeningAuto();
      }
    });
  }

  // Detect copy-pasted external text in answer box: Block and log, DO NOT start hands-up challenge
  function handlePasteAnswer(e) {
    e.preventDefault();
    setProctoringAuditLog(prev => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        timestamp: new Date().toISOString(),
        type: 'paste_blocked',
        reason: 'Paste attempt in candidate response box was blocked.',
        severity: 'medium',
      },
    ]);
  }

  // Client-Side Silence Detector
  function startSilenceDetector(stream) {
    setSilenceNotice(false);
    try {
      const AudioContextClass = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      silenceAudioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let spokenOnce = false;
      let silenceStart = null;

      const checkSilence = () => {
        if (!isRecordingRef.current) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < 32; i++) sum += dataArray[i];
        const level = sum / 32;

        if (level > 18) {
          spokenOnce = true;
          silenceStart = null;
          setSilenceNotice(false);
        } else if (spokenOnce) {
          if (!silenceStart) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > 4000) {
            setSilenceNotice(true);
          }
        }

        silenceAnimRef.current = requestAnimationFrame(checkSilence);
      };

      silenceAnimRef.current = requestAnimationFrame(checkSilence);
    } catch (e) {
      console.warn('Silence detector init notice:', e);
    }
  }

  function stopSilenceDetector() {
    if (silenceAnimRef.current) {
      cancelAnimationFrame(silenceAnimRef.current);
      silenceAnimRef.current = null;
    }
    if (silenceAudioCtxRef.current) {
      try {
        silenceAudioCtxRef.current.close();
      } catch (_) {}
      silenceAudioCtxRef.current = null;
    }
    setSilenceNotice(false);
  }

  // Transcribe recorded audio blob via local Whisper AI with retry support
  async function transcribeAudioBlob(audioBlob) {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      const ext = (audioBlob.type && audioBlob.type.includes('mp4'))
        ? 'mp4'
        : (audioBlob.type && audioBlob.type.includes('aac'))
        ? 'aac'
        : 'webm';
      formData.append('file', audioBlob, `candidate_speech.${ext}`);
      const activeQ = selectedRole.questions[currentQuestionIndex] || selectedRole.questions[0];
      if (activeQ?.requiredKeywords) {
        formData.append('initial_prompt', activeQ.requiredKeywords.join(', '));
      }

      const res = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`STT request returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.transcript) {
        setStudentAnswer(prev => {
          const trimmed = prev.trim();
          return trimmed ? `${trimmed} ${data.transcript}` : data.transcript;
        });
      }
      setNotice(null);
    } catch (err) {
      console.warn('Error transcribing audio with local Whisper service:', err);
      setNotice({
        tone: 'error',
        text: 'Voice transcription failed. You can try transcribing again or switch to typing.',
        action: {
          label: 'Retry Transcription',
          onClick: () => {
            if (lastRecordedAudioBlobRef.current) {
              transcribeAudioBlob(lastRecordedAudioBlobRef.current);
            }
          },
        },
        secondaryAction: {
          label: 'Type instead',
          onClick: () => {
            setVerbalInputMode('keyboard');
            setNotice(null);
          },
        },
      });
    } finally {
      setIsTranscribing(false);
    }
  }

  // Start Private Local MediaRecorder (reusing camera stream's audio track without a second getUserMedia call)
  async function startRecording() {
    if (isRecordingRef.current) return;
    setNotice(null);
    setSilenceNotice(false);

    if (!speechSupported) {
      setNotice({
        tone: 'warn',
        text: 'Microphone recording is not supported in this browser. Please type your response directly.',
      });
      setVerbalInputMode('keyboard');
      return;
    }

    const audioTracks = streamRef.current?.getAudioTracks();
    if (!audioTracks || audioTracks.length === 0) {
      setNotice({
        tone: 'error',
        text: 'Microphone track not found in room stream. Please ensure microphone access was granted.',
        action: {
          label: 'Type instead',
          onClick: () => {
            setVerbalInputMode('keyboard');
            setNotice(null);
          },
        },
      });
      return;
    }

    try {
      liveFinalTranscriptRef.current = studentAnswerRef.current || '';

      // 1. Live Continuous Streaming Speech Recognition (instant word-by-word display)
      const SpeechRec = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
      if (SpeechRec) {
        try {
          const rec = new SpeechRec();
          rec.continuous = true;
          rec.interimResults = true;
          rec.lang = 'en-US';

          rec.onresult = (evt) => {
            let interim = '';
            for (let i = evt.resultIndex; i < evt.results.length; ++i) {
              const res = evt.results[i];
              if (res.isFinal) {
                const phrase = res[0].transcript.trim();
                if (phrase) {
                  liveFinalTranscriptRef.current = liveFinalTranscriptRef.current
                    ? `${liveFinalTranscriptRef.current} ${phrase}`
                    : phrase;
                }
              } else {
                interim += res[0].transcript;
              }
            }
            const fullText = (liveFinalTranscriptRef.current + ' ' + interim).trim();
            if (fullText) {
              setStudentAnswer(fullText);
              resetInactivityTimer();
            }
          };

          rec.onerror = (e) => {
            console.debug('Streaming speech recognition event:', e.error);
          };

          rec.onend = () => {
            if (isRecordingRef.current) {
              try { rec.start(); } catch (_) {}
            }
          };

          rec.start();
          speechRecognitionRef.current = rec;
        } catch (err) {
          console.debug('Web Speech streaming init note:', err);
        }
      }

      // 2. High-fidelity audio recording with cross-browser iOS / Android / Desktop compatibility
      audioChunksRef.current = [];
      const micStream = new MediaStream([audioTracks[0]]);

      let mimeType = '';
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          mimeType = 'audio/webm;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          // Native container for iOS Mobile Safari
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/aac')) {
          mimeType = 'audio/aac';
        }
      }

      let recorder;
      try {
        recorder = mimeType ? new MediaRecorder(micStream, { mimeType }) : new MediaRecorder(micStream);
      } catch (recErr) {
        console.warn('Initial MediaRecorder instantiation failed, trying without explicit mimeType:', recErr);
        recorder = new MediaRecorder(micStream);
      }

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Do NOT stop audioTracks here because they belong to the room stream!
        if (maxRecordingTimerRef.current) {
          clearTimeout(maxRecordingTimerRef.current);
          maxRecordingTimerRef.current = null;
        }
        stopSilenceDetector();

        // Discard recording if an intervention was triggered
        if (shouldDiscardRecordingRef.current) {
          shouldDiscardRecordingRef.current = false;
          audioChunksRef.current = [];
          return;
        }

        const actualMime = recorder.mimeType || mimeType || (audioChunksRef.current[0]?.type) || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        if (audioBlob.size > 800) {
          lastRecordedAudioBlobRef.current = audioBlob;
          await transcribeAudioBlob(audioBlob);
        }
      };

      recorder.start(500); // 500ms time slice
      mediaRecorderRef.current = recorder;
      isRecordingRef.current = true;
      setIsRecording(true);

      // 3-minute max recording limit
      if (maxRecordingTimerRef.current) clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = setTimeout(() => {
        if (isRecordingRef.current) {
          stopRecording();
          setNotice({
            tone: 'info',
            text: 'Maximum recording time (3 minutes) reached. Transcribing your response.',
          });
        }
      }, 180000);

      // Start client-side silence detector
      startSilenceDetector(micStream);
    } catch (err) {
      console.error('Failed to start microphone recording:', err);
      isRecordingRef.current = false;
      setIsRecording(false);
      setNotice({
        tone: 'error',
        text: 'Unable to access microphone. Please ensure microphone permissions are granted.',
        action: {
          label: 'Type instead',
          onClick: () => {
            setVerbalInputMode('keyboard');
            setNotice(null);
          },
        },
      });
    }
  }

  // Stop Private Local MediaRecorder
  function stopRecording() {
    if (maxRecordingTimerRef.current) {
      clearTimeout(maxRecordingTimerRef.current);
      maxRecordingTimerRef.current = null;
    }
    stopSilenceDetector();

    // Stop real-time streaming recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.stop();
      } catch (_) {}
      speechRecognitionRef.current = null;
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        // Ignored
      }
    }
    isRecordingRef.current = false;
    setIsRecording(false);
  }

  // Toggle Voice Input (Mic)
  function toggleSpeechRecording() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  // Helper to automatically activate speech recording after interviewer finishes speaking
  function startListeningAuto() {
    startInactivityTimer();
    if (isRecordingRef.current || isRecording) return;
    if (verbalInputModeRef.current !== 'voice') return;
    startRecording();
  }

  // Start new interview session
  function handleStartInterview() {
    setSessionTranscript([]);
    setCurrentQuestionIndex(0);
    setStudentAnswer('');
    setElapsedSeconds(0);
    setCurrentEvaluation(null);
    setFinalReport(null);
    setMalpracticeCount(0);
    setProctoringAuditLog([]);
    setIsHandsUpChallengeActive(false);
    setNotice(null);
    setSessionState('interviewing');

    const firstQ = selectedRole.questions[0];
    const welcomeGreeting =
      `Hello! Welcome to your placement interview. I'm ${INTERVIEWER.name}, your ${INTERVIEWER.title}. Feel relaxed, speak naturally like a colleague, and let's have a great conversation. Let's get started with our first question.`;

    setTimeout(() => {
      // Step 1: Warm human introduction
      speakSentence(
        welcomeGreeting,
        'speaking',
        () => {
          // Step 2: Ask the first question
          setTimeout(() => {
            speakSentence(
              firstQ.question,
              'listening',
              () => {
                if (firstQ.type === 'verbal' && verbalInputModeRef.current === 'voice') {
                  startListeningAuto();
                }
              },
              firstQ.id
            );
          }, 400);
        },
        'sys_welcome'
      );
    }, 600);
  }

  // Submit candidate answer to AI Model for evaluation
  async function handleSubmitAnswer(customAnswer) {
    resetInactivityTimer();
    if (isSubmitting) return; // Prevent double submit
    const rawAnswer = typeof customAnswer === 'string' ? customAnswer : studentAnswer;
    const finalAnswer = (rawAnswer || '').trim();
    const activeQ = selectedRole.questions[currentQuestionIndex] || selectedRole.questions[0];

    if (!finalAnswer) {
      setNotice({
        tone: 'warn',
        text: activeQ?.type === 'coding'
          ? 'Please write your code solution before submitting.'
          : 'Please speak or enter your response before submitting.',
      });
      return;
    }

    if (isRecording) {
      stopRecording();
    }

    setNotice(null);
    setIsSubmitting(true);
    setHrAvatarState('thinking');

    try {
      const res = await fetch('/api/ai-interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: selectedRole.id,
          questionId: activeQ.id,
          studentAnswer: finalAnswer,
        }),
      });

      if (!res.ok) {
        throw new Error(`Evaluation failed with status ${res.status}`);
      }

      const data = await res.json();
      const evaluation = data.evaluation;
      if (!evaluation) {
        throw new Error('Empty evaluation returned from evaluation service');
      }

      const stepRecord = {
        questionId: activeQ.id,
        stage: activeQ.stage,
        question: activeQ.question,
        studentAnswer: finalAnswer,
        evaluation,
      };

      const updatedTranscript = [...sessionTranscript, stepRecord];
      setSessionTranscript(updatedTranscript);
      setCurrentEvaluation(evaluation);
      setSessionState('feedback_step');

      // Mock mode: short acknowledgment only, detailed feedback waits for the report.
      // Practice mode: speak the feedback aloud.
      const ACKNOWLEDGMENTS = [
        'Thank you, that is clear.',
        'Good, let us move on.',
        'Understood. Next question.',
        'Got it, thank you for explaining.',
      ];
      const ack = ACKNOWLEDGMENTS[currentQuestionIndex % ACKNOWLEDGMENTS.length];
      speakSentence(feedbackMode === 'practice' ? evaluation.feedback : ack, 'listening');
    } catch (err) {
      console.error('Error evaluating answer:', err);
      setHrAvatarState('listening');
      setNotice({
        tone: 'error',
        text: 'We could not score that answer. Your answer is still saved. Please try submitting again.',
        action: {
          label: 'Retry Submit',
          onClick: () => handleSubmitAnswer(finalAnswer),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Advance to next question or complete session
  function handleAdvanceQuestion() {
    resetInactivityTimer();
    const nextIdx = currentQuestionIndex + 1;

    if (nextIdx < selectedRole.questions.length) {
      setCurrentQuestionIndex(nextIdx);
      setStudentAnswer('');
      setCurrentEvaluation(null);
      setSessionState('interviewing');

      const nextQ = selectedRole.questions[nextIdx];
      setTimeout(() => {
        speakSentence(nextQ.question, 'listening', () => {
          if (nextQ.type === 'verbal' && verbalInputMode === 'voice') {
            startListeningAuto();
          }
        }, nextQ.id);
      }, 400);
    } else {
      handleCompleteInterview();
    }
  }

  // Compute final report & save to PostgreSQL
  async function handleCompleteInterview() {
    resetInactivityTimer();
    stopCurrentAudio();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const isCompleted = sessionTranscript.length >= selectedRole.questions.length;
    const durationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    const report = computeFinalReport({
      roleId: selectedRole.id,
      transcript: sessionTranscript,
      durationMinutes: durationMin,
    });

    setFinalReport(report);
    setSessionState('report');

    const wrapUpText = isCompleted
      ? 'Thank you so much for your thoughtful answers. That completes our interview session today. I am now generating your comprehensive technical evaluation and placement feedback scorecard.'
      : 'You have concluded the interview early. I have compiled your interim evaluation based on the questions completed so far.';
    speakSentence(wrapUpText, 'listening', null, 'sys_wrap_up');

    // Persist completed interview to database
    try {
      await fetch('/api/ai-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: currentStudent?.id || 'stud_1',
          roleTitle: selectedRole.title,
          experienceLevel,
          interviewMode: '1-on-1 AI Video Simulation with Proctoring',
          overallScore: report.overallScore,
          technicalScore: report.technicalScore,
          communicationScore: report.communicationScore,
          problemSolvingScore: report.problemSolvingScore,
          cultureFitScore: report.cultureFitScore,
          status: isCompleted ? 'completed' : 'incomplete',
          transcript: sessionTranscript,
          strengths: report.strengths,
          improvements: report.improvements,
          recommendedTopics: report.recommendedTopics,
          feedbackSummary: report.summary,
          durationMinutes: durationMin,
          proctoringLog: proctoringAuditLog,
          malpracticeCount,
        }),
      });

      fetchHistory();
    } catch (err) {
      console.error('Failed to save completed AI interview to database:', err);
    }
  }

  function formatTimer(totalSecs) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function insertStarTemplate() {
    const template = 'Situation: [Describe context and project setting]\nTask: [What was your explicit technical goal]\nAction: [What concrete steps, code, or architecture you implemented]\nResult: [What was the quantified impact, metrics, or outcome]';
    setStudentAnswer(prev => prev ? `${prev}\n\n${template}` : template);
  }

  const activeQuestion = selectedRole.questions[currentQuestionIndex] || selectedRole.questions[0];

  return (
    <BaseLayout title="1-on-1 AI Technical & Behavioral Interview">
      {/* Top Banner (Compact during active interview, expanded in setup) */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
          color: '#fff',
          borderRadius: 8,
          padding: sessionState === 'setup' ? '22px 26px' : '12px 20px',
          marginBottom: 14,
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            {sessionState === 'setup' && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.12)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, marginBottom: 8 }}>
                <ShieldCheck size={14} color="#10B981" />
                <span>AI Proctoring & Live Video Interview Room</span>
              </div>
            )}
            <h1 style={{ margin: 0, fontSize: sessionState === 'setup' ? 22 : 16, fontWeight: 800 }}>
              Live 1-on-1 Placement Interview with {INTERVIEWER.name} ({INTERVIEWER.title})
            </h1>
            {sessionState === 'setup' && (
              <p style={{ margin: '6px 0 0', fontSize: 13, opacity: 0.9, maxWidth: 720, lineHeight: 1.55 }}>
                Experience an authentic live video interview with an animated corporate HR interviewer. Active camera proctoring monitors tab focus and anti-malpractice compliance. If cheating or external AI usage is suspected, the agent initiates an on-screen hands-up verification check.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => {
                setActiveTab('studio');
                if (sessionState === 'report') setSessionState('setup');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'studio' ? '#fff' : 'rgba(255,255,255,0.15)',
                color: activeTab === 'studio' ? '#0F172A' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Video size={14} />
              <span>Interview Studio</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('history');
                fetchHistory();
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === 'history' ? '#fff' : 'rgba(255,255,255,0.15)',
                color: activeTab === 'history' ? '#0F172A' : '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <History size={14} />
              <span>Past Evaluations ({pastInterviews.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== TAB 1: INTERVIEW STUDIO ===================== */}
      {activeTab === 'studio' && (
        <div>
          {/* SETUP SCREEN */}
          {sessionState === 'setup' && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                  Select Target Position & Pre-Interview Check
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                  Choose your interview track. When you launch, your camera and microphone will activate to ensure a secure, malpractice-free environment.
                </p>
              </div>

              {/* Roles Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, marginBottom: 22 }}>
                {INTERVIEW_ROLES.map(role => {
                  const isSelected = selectedRole.id === role.id;
                  return (
                    <div
                      key={role.id}
                      onClick={() => setSelectedRole(role)}
                      style={{
                        background: '#fff',
                        borderRadius: 8,
                        border: isSelected ? '2px solid #4F46E5' : '1px solid #E5E7EB',
                        padding: 18,
                        cursor: 'pointer',
                        boxShadow: isSelected ? '0 4px 12px rgba(79,70,229,0.12)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                            {role.category}
                          </span>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>{role.level}</span>
                        </div>

                        <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 700, color: isSelected ? '#1E1B4B' : '#111827' }}>
                          {role.title}
                        </h3>

                        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#4B5563', lineHeight: 1.45 }}>
                          {role.description}
                        </p>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {role.coreSkills.map(skill => (
                            <span
                              key={skill}
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                background: isSelected ? '#E0E7FF' : '#F3F4F6',
                                color: isSelected ? '#3730A3' : '#4B5563',
                                padding: '2px 8px',
                                borderRadius: 4,
                              }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: 10 }}>
                        <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
                          {role.questions.length} Round Questions
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? '#4F46E5' : '#9CA3AF' }}>
                          {isSelected ? 'Selected' : 'Select Track'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Proctoring & Hardware Readiness Checklist */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 22, marginBottom: 20 }}>
                <div className="grid-split-responsive-2" style={{ gap: 24, alignItems: 'center' }}>
                  {/* Left: HR Preview Card */}
                  <div style={{ textAlign: 'center', borderRight: '1px solid #F1F5F9', paddingRight: 20 }}>
                    <div
                      style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: 210,
                        height: 130,
                        borderRadius: 10,
                        overflow: 'hidden',
                        border: '2px solid #6366F1',
                        boxShadow: '0 4px 14px rgba(99,102,241,0.22)',
                        marginBottom: 10,
                        background: '#0a0f1d',
                      }}
                    >
                      <ThreeAvatarCanvas
                        avatarUrl={INTERVIEWER.avatarUrl}
                        state="listening"
                        isSpeaking={false}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(4px)',
                          color: '#A5B4FC',
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 5,
                        }}
                      >
                        <Bot size={11} color="#60A5FA" />
                        <span>LIVE INTERVIEWER</span>
                      </span>
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 6,
                          right: 8,
                          background: '#10B981',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          zIndex: 5,
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: 3, background: '#fff' }} />
                        <span>Ready</span>
                      </span>
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111827' }}>{INTERVIEWER.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{INTERVIEWER.title}</div>
                    <div style={{ fontSize: 11, color: '#4F46E5', marginTop: 4, fontWeight: 600 }}>Interactive 60FPS Video Call Agent</div>
                  </div>

                  {/* Right: Security & Proctoring Protocol */}
                  <div>
                    <h3 style={{ margin: '0 0 10px', fontSize: 15, fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <ShieldAlert size={18} color="#D97706" />
                      <span>Live AI Proctoring & Anti-Malpractice Rules</span>
                    </h3>

                    <ul style={{ margin: '0 0 16px', paddingLeft: 20, fontSize: 13, color: '#4B5563', lineHeight: 1.6 }}>
                      <li><strong>Webcam Required:</strong> Your camera remains active to verify presence. Video is not recorded; signals are evaluated locally.</li>
                      <li><strong>Tab & Focus Tracking:</strong> Navigating away from the active window or tab changes are logged and recorded for human review (no immediate automatic score penalties).</li>
                      <li><strong>No Copy-Paste:</strong> External text paste attempts into the response box are blocked and recorded in the proctoring log.</li>
                      <li><strong>Workspace Verification Check:</strong> If sustained gaze deviation or tab loss is detected, you will be asked to hold both hands in front of the camera for 10 seconds to verify your workspace.</li>
                    </ul>

                    <div style={{ marginBottom: 14 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                        Seniority / Placement Stage:
                      </label>
                      <select
                        value={experienceLevel}
                        onChange={e => setExperienceLevel(e.target.value)}
                        style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #D1D5DB', fontSize: 13, background: '#fff', width: '100%', maxWidth: 360 }}
                      >
                        <option value="Fresher / Entry Level (Campus Placements)">Fresher / Entry Level (Campus Placements)</option>
                        <option value="Junior Engineer (1-2 Years Experience)">Junior Engineer (1-2 Years Experience)</option>
                        <option value="Mid-Level Engineer (3+ Years Experience)">Mid-Level Engineer (3+ Years Experience)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                        {/* Interview Mode: Mock vs Practice */}
                        <div style={{ display: 'inline-flex', background: '#F1F5F9', padding: 2, borderRadius: 6, border: '1px solid #E2E8F0' }}>
                          <button
                            type="button"
                            onClick={() => setFeedbackMode('mock')}
                            title="Realistic placement interview with end-of-session scorecard"
                            style={{
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: 5,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: feedbackMode === 'mock' ? '#fff' : 'transparent',
                              color: feedbackMode === 'mock' ? '#1E1B4B' : '#64748B',
                              boxShadow: feedbackMode === 'mock' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            Full Mock
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedbackMode('practice')}
                            title="Interactive coaching: Interviewer speaks detailed critiques after each answer"
                            style={{
                              border: 'none',
                              padding: '5px 12px',
                              borderRadius: 5,
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                              background: feedbackMode === 'practice' ? '#fff' : 'transparent',
                              color: feedbackMode === 'practice' ? '#1E1B4B' : '#64748B',
                              boxShadow: feedbackMode === 'practice' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            }}
                          >
                            Practice Mode
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setVoiceEnabled(prev => !prev)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '6px 12px',
                            borderRadius: 6,
                            border: '1px solid #D1D5DB',
                            background: voiceEnabled ? '#EEF2FF' : '#F9FAFB',
                            color: voiceEnabled ? '#4F46E5' : '#6B7280',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {voiceEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                          <span>{voiceEnabled ? 'HR Audio Active' : 'Muted'}</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartInterview}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '11px 26px',
                          borderRadius: 6,
                          border: 'none',
                          background: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 700,
                          cursor: 'pointer',
                          boxShadow: '0 2px 8px rgba(30, 27, 75, 0.3)',
                        }}
                      >
                        <Camera size={16} />
                        <span>Enter Live Video Interview Room</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE 1-ON-1 VIDEO CALL CONSOLE */}
          {(sessionState === 'interviewing' || sessionState === 'evaluating_answer' || sessionState === 'feedback_step') && (
            <InterviewRoom
              interviewer={INTERVIEWER}
              avatarNode={
                <LiveAiAgentStream
                  state={hrAvatarState}
                  isSpeaking={hrAvatarState === 'speaking'}
                  caption={currentCaption}
                  agentName={INTERVIEWER.name}
                  roleTitle={INTERVIEWER.title}
                  avatarUrl={INTERVIEWER.avatarUrl}
                  stillUrl={INTERVIEWER.stillUrl}
                  speakingUrl={INTERVIEWER.speakingUrl}
                  warningUrl={INTERVIEWER.warningUrl}
                  showChrome={false}
                />
              }
              selfNode={
                <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                  <video
                    ref={webcamVideoRef}
                    autoPlay
                    playsInline
                    muted
                    data-mirror="true"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: cameraActive && camStatus === 'live' ? 'block' : 'none',
                      transform: 'scaleX(-1)',
                    }}
                  />

                  {(!cameraActive || camStatus !== 'live') && (
                    <TileMessage icon={CameraOff}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FCA5A5' }}>
                        {camStatus === 'denied'
                          ? 'Camera Access Denied'
                          : camStatus === 'starting'
                          ? 'Starting Camera Feed...'
                          : 'Camera Feed Inactive'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, maxWidth: 220, lineHeight: 1.4 }}>
                        {camStatus === 'denied'
                          ? 'Allow camera in browser address bar, then reload.'
                          : camStatus === 'starting'
                          ? 'Initializing video stream...'
                          : cameraError || 'Proctoring is active and video interruptions are logged.'}
                      </div>
                    </TileMessage>
                  )}

                  {/* Real-time MediaPipe AI Proctoring Engine (ALWAYS ACTIVE & MOUNTED) */}
                  <CameraVisionProctor
                    videoRef={webcamVideoRef}
                    isActive={sessionState === 'interviewing' || sessionState === 'feedback_step'}
                    roundType={activeQuestion?.type || 'verbal'}
                    isHandsUpActive={isHandsUpChallengeActive}
                    challengeConfig={{
                      mode: challengeMode,
                      targetFingers,
                      targetTurn,
                    }}
                    onMalpracticeAlert={(reason, reasonType) => triggerCheatingIntervention(reason, reasonType)}
                    onAuditLog={entry => setProctoringAuditLog(prev => [...prev, { id: Date.now() + Math.random(), ...entry }])}
                    onGazeStateChange={status => setLiveGazeStatus(status)}
                    onHandsCheckTick={({ bothHandsVisible: bothVis, handCount, extendedFingers, holdProgress, isStable, unverifiedTimerOnly }) => {
                      setBothHandsVisible(bothVis);
                      setHandsDetectedCount(handCount);
                      setChallengeHoldProgress(holdProgress || 0);
                      setIsUnverifiedTimerFallback(unverifiedTimerOnly);
                    }}
                  />

                  {/* Focus Monitored Chip in Top Left */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      background: malpracticeCount > 0 ? 'rgba(239, 68, 68, 0.85)' : 'rgba(16, 185, 129, 0.85)',
                      padding: '2px 7px',
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      zIndex: 6,
                    }}
                  >
                    <Eye size={11} />
                    <span>{malpracticeCount > 0 ? `${malpracticeCount} Alerts` : 'Focus Monitored'}</span>
                    {isAccessibilityReviewFlagged && (
                      <span style={{ background: '#F59E0B', color: '#111827', padding: '1px 4px', borderRadius: 3, fontSize: 9 }}>
                        Review Flagged
                      </span>
                    )}
                  </div>

                  {/* Multi-Mode Challenge Verification Overlay */}
                  {isHandsUpChallengeActive && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(5px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 14,
                        textAlign: 'center',
                        color: '#fff',
                        zIndex: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          background: 'rgba(245, 158, 11, 0.2)',
                          border: '2px solid #F59E0B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <ShieldAlert size={22} color="#F59E0B" />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FCD34D', marginBottom: 2 }}>
                        WORKSPACE VERIFICATION CHALLENGE
                      </div>

                      {/* Mode-Specific Challenge Instruction */}
                      <div style={{ fontSize: 11, color: '#E2E8F0', maxWidth: 220, lineHeight: 1.35, marginBottom: 6 }}>
                        {challengeMode === 'both_hands' && 'Hold both hands steady in camera view for 1 second.'}
                        {challengeMode === 'one_hand_gesture' && `Show ${targetFingers} fingers with one hand and hold steady for 1 second.`}
                        {challengeMode === 'blink_and_turn' && `Turn head slightly to the ${targetTurn.toUpperCase()} and hold for 1 second.`}
                      </div>

                      <div style={{ fontSize: 22, fontWeight: 900, color: bothHandsVisible || isUnverifiedTimerFallback ? '#10B981' : '#F59E0B' }}>
                        {handsUpTimer}s
                      </div>

                      {/* Hold Stability Indicator */}
                      <div style={{ fontSize: 10, color: bothHandsVisible ? '#86EFAC' : '#FCA5A5', marginTop: 2, fontWeight: 600 }}>
                        {bothHandsVisible
                          ? '✓ Position verified! Counting down...'
                          : challengeHoldProgress > 0
                          ? `Holding steady: ${challengeHoldProgress}%`
                          : challengeMode === 'both_hands'
                          ? `Hold BOTH hands visible (${handsDetectedCount}/2 detected)`
                          : challengeMode === 'one_hand_gesture'
                          ? `Hold ${targetFingers} fingers in frame`
                          : `Turn head to ${targetTurn}`}
                      </div>

                      {/* 1s Hold Stability Mini-bar */}
                      <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${challengeHoldProgress}%`,
                            height: '100%',
                            background: '#38BDF8',
                            transition: 'width 0.2s ease',
                          }}
                        />
                      </div>

                      {/* Overall 10s Timer Progress Bar */}
                      <div style={{ width: 120, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: ((10 - handsUpTimer) / 10) * 100 + '%',
                            height: '100%',
                            background: bothHandsVisible || isUnverifiedTimerFallback ? '#10B981' : '#F59E0B',
                            transition: 'width 1s linear',
                          }}
                        />
                      </div>

                      {/* Accessibility Note */}
                      <div style={{ fontSize: 9, color: '#94A3B8', marginTop: 8, maxWidth: 200, lineHeight: 1.2 }}>
                        Accessibility Guarantee: Unverified sessions are flagged for manual officer audit and never penalize candidate scores.
                      </div>
                    </div>
                  )}

                  {/* Mic/Camera Track toggles */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      display: 'flex',
                      gap: 6,
                      zIndex: 7,
                    }}
                  >
                    <button
                      type="button"
                      onClick={toggleCameraTrack}
                      style={{
                        background: cameraActive ? 'rgba(15,23,42,0.8)' : '#DC2626',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 6px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={cameraActive ? 'Turn Off Camera Track' : 'Turn On Camera Track'}
                    >
                      {cameraActive ? <Camera size={13} /> : <CameraOff size={13} />}
                    </button>

                    <button
                      type="button"
                      onClick={toggleMicTrack}
                      style={{
                        background: micActive ? 'rgba(15,23,42,0.8)' : '#DC2626',
                        border: 'none',
                        color: '#fff',
                        padding: '4px 6px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title={micActive ? 'Mute Microphone Track' : 'Unmute Microphone Track'}
                    >
                      {micActive ? <Mic size={13} /> : <MicOff size={13} />}
                    </button>
                  </div>
                </div>
              }
              candidateName={currentStudent?.name || 'You'}
              avatarState={hrAvatarState}
              caption={currentCaption}
              questionIndex={currentQuestionIndex}
              total={selectedRole.questions.length}
              stage={activeQuestion.stage}
              elapsed={elapsedSeconds}
              isCoding={activeQuestion.type === 'coding'}
              proctorWarn={isHandsUpChallengeActive}
              onEnd={handleCompleteInterview}
              onTestCheck={
                process.env.NODE_ENV !== 'production'
                  ? () => triggerCheatingIntervention('Manual proctoring test triggered: verify hands in camera view.', 'generic')
                  : undefined
              }
            >
{/* CURRENT INTERVIEW QUESTION & CANDIDATE RESPONSE CONSOLE */}
              <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 18, marginBottom: 16 }}>
                {/* Question Details */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase' }}>
                      Question {currentQuestionIndex + 1}: {activeQuestion.stage}
                    </span>
                    <button
                      type="button"
                      onClick={() => speakSentence(activeQuestion.question, 'listening', null, activeQuestion.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#4F46E5',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Volume2 size={13} />
                      <span>Replay HR Voice</span>
                    </button>
                  </div>

                  <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', background: '#F8FAFC', padding: 14, borderRadius: 6, borderLeft: '4px solid #4F46E5', lineHeight: 1.5 }}>
                    {activeQuestion.question}
                  </div>
                </div>

                {/* INLINE NOTICE BANNER (replaces window.alert) */}
                <Notice notice={notice} onClose={() => setNotice(null)} />

                {/* CANDIDATE INTERACTIVE RESPONSE INTERFACE */}
                {activeQuestion.type === 'coding' ? (
                  /* ================= 1. LIVE TECHNICAL CODING ROUND ================= */
                  <LiveCodeEditor
                    question={activeQuestion}
                    initialCode={studentAnswer}
                    onSubmitCode={handleSubmitAnswer}
                    onMalpracticeAlert={reason => {
                      setProctoringAuditLog(prev => [
                        ...prev,
                        {
                          id: Date.now() + Math.random(),
                          timestamp: new Date().toISOString(),
                          type: 'paste_blocked',
                          reason: reason || 'Clipboard paste attempt in code editor was blocked.',
                          severity: 'medium',
                        },
                      ]);
                    }}
                    disabled={sessionState === 'feedback_step' || isHandsUpChallengeActive || isSubmitting}
                  />
                ) : (
                  /* ================= 2. NATURAL SPOKEN 1-ON-1 CONVERSATION ROUND ================= */
                  <div>
                    {/* Top Mode Toggle Bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', color: '#4338CA', padding: '3px 10px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                          <MessageSquare size={13} color="#4338CA" />
                          <span>Spoken 1-on-1 Round (Talk Directly With AI)</span>
                        </div>

                        {liveGazeStatus === 'looking_down' && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 8px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Smartphone size={12} />
                            <span>Gaze Alert: Looking Down</span>
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {verbalInputMode === 'voice' ? (
                          <button
                            type="button"
                            onClick={() => setVerbalInputMode('keyboard')}
                            style={{
                              background: 'transparent',
                              border: '1px solid #D1D5DB',
                              color: '#6B7280',
                              borderRadius: 4,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                            title="Switch to typing if microphone is unavailable"
                          >
                            <Keyboard size={12} />
                            <span>Switch to Keyboard Fallback</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setVerbalInputMode('voice')}
                            style={{
                              background: '#EEF2FF',
                              border: '1px solid #C7D2FE',
                              color: '#4338CA',
                              borderRadius: 4,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Mic size={12} />
                            <span>Switch to Spoken Voice Call</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {verbalInputMode === 'voice' ? (
                      /* PRIMARY VOICE CALL INTERFACE */
                      <div
                        style={{
                          background: hrAvatarState === 'speaking' ? '#F8FAFC' : isRecording ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : '#F8FAFC',
                          border: isRecording ? '1.5px solid #86EFAC' : '1px solid #E2E8F0',
                          borderRadius: 8,
                          padding: 16,
                          marginBottom: 10,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* Audio Waveform & Status Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {hrAvatarState === 'speaking' ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3B82F6', fontSize: 13, fontWeight: 700 }}>
                                <Volume2 size={16} />
                                <span>Interviewer {INTERVIEWER.name} is speaking... (Listen carefully)</span>
                              </div>
                            ) : isRecording ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#15803D', fontSize: 13, fontWeight: 700 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 16 }}>
                                  {[6, 14, 9, 16, 11, 8].map((h, i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: 3,
                                        height: h,
                                        background: '#16A34A',
                                        borderRadius: 1,
                                        animation: `pulse 0.8s ease-in-out infinite alternate ${i * 0.1}s`,
                                      }}
                                    />
                                  ))}
                                </div>
                                <span>Candidate Voice Live • Speak naturally into your microphone</span>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4B5563', fontSize: 13, fontWeight: 600 }}>
                                <Mic size={16} color="#6B7280" />
                                <span>Microphone Paused • Click 'Start Speaking' when ready to answer</span>
                              </div>
                            )}
                          </div>

                          <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                            Word count: <strong>{studentAnswer.split(/\s+/).filter(Boolean).length}</strong> words
                          </span>
                        </div>

                        {/* Live Spoken Speech Bubble */}
                        <div
                          style={{
                            background: '#fff',
                            border: '1px solid #CBD5E1',
                            borderRadius: 6,
                            padding: 14,
                            minHeight: 90,
                            fontSize: 14,
                            lineHeight: 1.6,
                            color: studentAnswer ? '#0F172A' : '#94A3B8',
                            fontStyle: studentAnswer ? 'normal' : 'italic',
                            marginBottom: 12,
                            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)',
                          }}
                        >
                          {isTranscribing ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4F46E5', fontWeight: 500 }}>
                              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                              <span>Finalizing response transcription...</span>
                            </div>
                          ) : (
                            studentAnswer || (
                              isRecording ? (
                                <span style={{ color: '#6366F1', display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
                                  Listening... Speak your answer naturally (words appear here live as you talk).
                                </span>
                              ) : (
                                'Speak your answer naturally. Your response will appear here in real time as you speak...'
                              )
                            )
                          )}
                        </div>

                        {/* Client-Side Silence Detection Prompt */}
                        {silenceNotice && isRecording && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              background: 'rgba(99, 102, 241, 0.1)',
                              border: '1px solid rgba(99, 102, 241, 0.28)',
                              borderRadius: 6,
                              marginBottom: 12,
                              fontSize: 12,
                              color: '#4338CA',
                              fontWeight: 500,
                            }}
                          >
                            <span>Looks like you finished speaking. Ready to submit?</span>
                            <button
                              type="button"
                              onClick={() => {
                                stopRecording();
                              }}
                              style={{
                                background: '#4F46E5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 10px',
                                fontSize: 11,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Finish Speaking
                            </button>
                          </div>
                        )}

                        {/* Voice Submission Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button
                              type="button"
                              onClick={toggleSpeechRecording}
                              disabled={sessionState === 'feedback_step' || isHandsUpChallengeActive || isTranscribing}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '6px 14px',
                                borderRadius: 6,
                                border: isRecording ? '1px solid #DC2626' : '1px solid #D1D5DB',
                                background: isRecording ? '#FEE2E2' : '#fff',
                                color: isRecording ? '#B91C1C' : '#374151',
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {isRecording ? <MicOff size={14} color="#DC2626" /> : <Mic size={14} color="#16A34A" />}
                              <span>{isRecording ? 'Stop & Transcribe' : 'Start Speaking'}</span>
                            </button>

                            {isTranscribing && (
                              <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Transcribing audio...
                              </span>
                            )}

                            {studentAnswer && sessionState !== 'feedback_step' && (
                              <button
                                type="button"
                                onClick={() => setStudentAnswer('')}
                                style={{
                                  background: 'transparent',
                                  border: '1px solid #E2E8F0',
                                  color: '#64748B',
                                  borderRadius: 4,
                                  padding: '4px 8px',
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                Clear Speech
                              </button>
                            )}
                          </div>

                          <div>
                            {sessionState !== 'feedback_step' ? (
                              <button
                                type="button"
                                onClick={() => handleSubmitAnswer()}
                                disabled={isSubmitting || !studentAnswer.trim() || isHandsUpChallengeActive}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '8px 22px',
                                  borderRadius: 6,
                                  border: 'none',
                                  background: isSubmitting || !studentAnswer.trim() ? '#E2E8F0' : '#16A34A',
                                  color: isSubmitting || !studentAnswer.trim() ? '#94A3B8' : '#fff',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  cursor: isSubmitting || !studentAnswer.trim() ? 'not-allowed' : 'pointer',
                                  boxShadow: isSubmitting || !studentAnswer.trim() ? 'none' : '0 1px 4px rgba(22,163,74,0.3)',
                                }}
                              >
                                {isSubmitting ? (
                                  <>
                                    <Loader2 size={15} className="animate-spin" />
                                    <span>HR Assessing Spoken Answer...</span>
                                  </>
                                ) : (
                                  <>
                                    <Send size={14} />
                                    <span>Finish Speaking • Submit to HR</span>
                                  </>
                                )}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* KEYBOARD TYPING FALLBACK INTERFACE */
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            Typing Mode Active: Manual keyboard input. Copy-paste of external text is monitored.
                          </span>
                          <button
                            type="button"
                            onClick={insertStarTemplate}
                            style={{
                              background: '#F3F4F6',
                              border: '1px solid #E5E7EB',
                              borderRadius: 4,
                              padding: '3px 8px',
                              fontSize: 11,
                              fontWeight: 600,
                              color: '#4B5563',
                              cursor: 'pointer',
                            }}
                          >
                            + Insert STAR Framework
                          </button>
                        </div>

                        <textarea
                          rows={6}
                          placeholder="Type your verbal response here. Explaining your reasoning, architecture, and tradeoffs..."
                          value={studentAnswer}
                          onChange={e => setStudentAnswer(e.target.value)}
                          onPaste={handlePasteAnswer}
                          disabled={sessionState === 'feedback_step' || isHandsUpChallengeActive}
                          style={{
                            width: '100%',
                            padding: 12,
                            borderRadius: 6,
                            border: '1px solid #CBD5E1',
                            fontSize: 14,
                            lineHeight: 1.55,
                            fontFamily: 'inherit',
                            boxSizing: 'border-box',
                            resize: 'vertical',
                            background: sessionState === 'feedback_step' ? '#F8FAFC' : '#fff',
                          }}
                        />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                          <span style={{ fontSize: 12, color: '#6B7280' }}>
                            Word count: <strong>{studentAnswer.split(/\s+/).filter(Boolean).length}</strong> words
                          </span>

                          {sessionState !== 'feedback_step' ? (
                            <button
                              type="button"
                              onClick={() => handleSubmitAnswer()}
                              disabled={isSubmitting || !studentAnswer.trim() || isHandsUpChallengeActive}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '8px 22px',
                                borderRadius: 6,
                                border: 'none',
                                background: isSubmitting || !studentAnswer.trim() ? '#E2E8F0' : '#4F46E5',
                                color: isSubmitting || !studentAnswer.trim() ? '#94A3B8' : '#fff',
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: isSubmitting || !studentAnswer.trim() ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 size={15} className="animate-spin" />
                                  <span>HR Assessing Response...</span>
                                </>
                              ) : (
                                <>
                                  <Send size={14} />
                                  <span>Submit Answer to HR</span>
                                </>
                              )}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ADVANCE TO NEXT QUESTION BUTTON (WHEN IN FEEDBACK STEP) */}
                {sessionState === 'feedback_step' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                    <button
                      type="button"
                      onClick={handleAdvanceQuestion}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '10px 24px',
                        borderRadius: 6,
                        border: 'none',
                        background: '#15803D',
                        color: '#fff',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(21, 128, 61, 0.3)',
                      }}
                    >
                      <span>
                        {currentQuestionIndex + 1 < selectedRole.questions.length ? 'Proceed to Next Question' : 'View Final Placement Report'}
                      </span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                )}
              </div>

              {/* IMMEDIATE FEEDBACK DRAWER */}
              {sessionState === 'feedback_step' && currentEvaluation && (
                <div
                  style={{
                    background: '#fff',
                    border: '1.5px solid #818CF8',
                    borderRadius: 8,
                    padding: 18,
                    marginBottom: 20,
                    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: currentEvaluation.score >= 70 ? '#DCFCE7' : '#FEF3C7',
                          color: currentEvaluation.score >= 70 ? '#15803D' : '#B45309',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: 13,
                        }}
                      >
                        {currentEvaluation.score}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1E1B4B' }}>
                          HR Evaluator Feedback for Question {currentQuestionIndex + 1}
                        </div>
                        <div style={{ fontSize: 12, color: '#64748B' }}>
                          Technical Accuracy: <strong>{currentEvaluation.technicalAccuracy}%</strong> • Communication: <strong>{currentEvaluation.communicationClarity}%</strong>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAdvanceQuestion}
                      style={{
                        padding: '6px 16px',
                        background: '#4F46E5',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span>
                        {currentQuestionIndex + 1 < selectedRole.questions.length ? 'Continue' : 'Finish Interview'}
                      </span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <p style={{ margin: '0 0 12px', fontSize: 13, color: '#334155', lineHeight: 1.5, background: '#F8FAFC', padding: 12, borderRadius: 6, borderLeft: '3px solid #6366F1' }}>
                    {currentEvaluation.feedback}
                  </p>

                  {currentEvaluation.isSuspectedAiGenerated && (
                    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', color: '#92400E', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <AlertTriangle size={15} color="#D97706" />
                      <span>AI Model Observation: Formulaic phrasing characteristic of external LLMs (ChatGPT) detected. Focus on explaining concepts in your own words.</span>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <CheckCircle2 size={14} />
                        <span>Noticed Strengths:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#15803D', lineHeight: 1.45 }}>
                        {currentEvaluation.strengths.map((str, i) => (
                          <li key={i}>{str}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: 12 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                        <AlertTriangle size={14} />
                        <span>Crucial Improvements Required:</span>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#B91C1C', lineHeight: 1.45 }}>
                        {currentEvaluation.improvements.map((imp, i) => (
                          <li key={i}>{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </InterviewRoom>
          )}

          {/* FINAL EVALUATION SCORECARD & REPORT */}
          {sessionState === 'report' && finalReport && (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16, marginBottom: 20, borderBottom: '1px solid #F1F5F9', paddingBottom: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, background: '#EEF2FF', color: '#4F46E5', padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase' }}>
                    Placement Assessment Scorecard
                  </span>
                  <h2 style={{ margin: '8px 0 4px', fontSize: 22, fontWeight: 800, color: '#111827' }}>
                    1-on-1 Interview Performance: {selectedRole.title}
                  </h2>
                  <div style={{ fontSize: 13, color: '#6B7280' }}>
                    Candidate: <strong>{currentStudent?.name || 'Student Candidate'}</strong> • Interviewer: {INTERVIEWER.name} • Proctoring Integrity: {malpracticeCount > 0 ? `${malpracticeCount} Hand Checks Logged` : '100% Clean'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSessionState('setup')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    borderRadius: 6,
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={14} />
                  <span>Start New Role</span>
                </button>
              </div>

              {/* Overall Score Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 14, marginBottom: 22 }}>
                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Overall Placement Score
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: finalReport.overallScore >= 75 ? '#15803D' : '#4F46E5' }}>
                    {finalReport.overallScore} / 100
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, fontWeight: 700, background: '#DCFCE7', color: '#15803D', padding: '2px 8px', borderRadius: 12 }}>
                    {finalReport.readinessLevel}
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Technical Competence
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#1E293B' }}>
                    {finalReport.technicalScore}%
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, color: '#64748B' }}>
                    Accuracy & Architecture
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Communication Clarity
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: '#1E293B' }}>
                    {finalReport.communicationScore}%
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, color: '#64748B' }}>
                    STAR Framework
                  </span>
                </div>

                <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 4 }}>
                    Proctoring Observation Log
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, color: proctoringAuditLog.length === 0 ? '#15803D' : '#D97706' }}>
                    {proctoringAuditLog.length === 0 ? '0 Flags' : `${proctoringAuditLog.length} Event${proctoringAuditLog.length === 1 ? '' : 's'}`}
                  </div>
                  <span style={{ display: 'inline-block', marginTop: 4, fontSize: 11, color: '#64748B' }}>
                    {proctoringAuditLog.length === 0 ? 'Session Clean' : 'Logged for Human Review'}
                  </span>
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: 16 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} />
                    <span>Key Candidate Strengths</span>
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#15803D', lineHeight: 1.6 }}>
                    {finalReport.strengths.map((str, i) => (
                      <li key={i}>{str}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: 16 }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} />
                    <span>Actionable Improvements Required</span>
                  </h3>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                    {finalReport.improvements.map((imp, i) => (
                      <li key={i}>{imp}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Recommended Study Modules */}
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <BookOpen size={16} />
                  <span>Recommended Study Materials for Next Round</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {finalReport.recommendedTopics.map(topic => (
                    <span
                      key={topic}
                      style={{
                        background: '#fff',
                        border: '1px solid #93C5FD',
                        color: '#1D4ED8',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      {topic} Module
                    </span>
                  ))}
                </div>
              </div>

              {/* Factual Proctoring Audit Log for Human Review */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={16} color="#6366F1" />
                    <span>Proctoring Audit Log (For Human Reviewer Verification)</span>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748B' }}>
                    Note: Client-side proctoring signals are logged factually for administrative review. No automatic score penalty is applied.
                  </span>
                </div>

                {proctoringAuditLog.length === 0 ? (
                  <div style={{ fontSize: 12, color: '#15803D', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: 6, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={14} color="#16A34A" />
                    <span>Zero proctoring incidents logged. Candidate maintain continuous focus on the interview screen.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {proctoringAuditLog.map((log, i) => (
                      <div
                        key={log.id || i}
                        style={{
                          background: '#fff',
                          border: '1px solid #E2E8F0',
                          borderRadius: 6,
                          padding: '8px 12px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: 12,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              background: log.severity === 'high' ? '#FEE2E2' : log.severity === 'medium' ? '#FEF3C7' : '#F1F5F9',
                              color: log.severity === 'high' ? '#B91C1C' : log.severity === 'medium' ? '#B45309' : '#475569',
                            }}
                          >
                            {log.type?.replace(/_/g, ' ')}
                          </span>
                          <span style={{ color: '#1E293B', fontWeight: 500 }}>{log.reason}</span>
                        </div>
                        <span style={{ color: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}>
                          {log.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Transcript Accordion */}
              <div>
                <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#111827' }}>
                  Interview Question Transcript & HR Critiques
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {sessionTranscript.map((item, idx) => (
                    <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: 8, padding: 14, background: '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4 }}>
                          Question {idx + 1}: {item.stage}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: item.evaluation?.score >= 70 ? '#15803D' : '#D97706' }}>
                          Score: {item.evaluation?.score || 0} / 100
                        </span>
                      </div>

                      <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>
                        {item.question}
                      </div>

                      <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 10, marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', marginBottom: 2 }}>
                          Your Answer:
                        </div>
                        <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
                          {item.studentAnswer}
                        </div>
                      </div>

                      <div style={{ fontSize: 12, color: '#4B5563', lineHeight: 1.45, marginBottom: 6 }}>
                        <strong>HR Evaluator Note:</strong> {item.evaluation?.feedback}
                      </div>

                      {item.evaluation?.modelAnswer && (
                        <div style={{ background: '#FAF5FF', border: '1px solid #E9D5FF', borderRadius: 6, padding: 8, fontSize: 12, color: '#581C87' }}>
                          <span style={{ fontWeight: 700 }}>Ideal Reference Answer: </span>
                          {item.evaluation.modelAnswer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: PAST EVALUATIONS & HISTORY ===================== */}
      {activeTab === 'history' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: '#111827' }}>
                Completed Placement Interview History
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: '#6B7280' }}>
                Review past evaluations, technical ratings, and proctoring integrity records.
              </p>
            </div>

            <button
              onClick={() => {
                setActiveTab('studio');
                setSessionState('setup');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: '#4F46E5',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Video size={14} />
              <span>New Interview</span>
            </button>
          </div>

          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>
              <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <div>Loading past evaluations from database...</div>
            </div>
          ) : pastInterviews.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, padding: 40, textAlign: 'center', color: '#6B7280' }}>
              <Bot size={36} color="#9CA3AF" style={{ marginBottom: 10 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>No interview attempts recorded</div>
              <div style={{ fontSize: 13, color: '#9CA3AF', marginTop: 4, marginBottom: 16 }}>
                Select a target position in the Interview Studio to begin your first 1-on-1 session with {INTERVIEWER.name}.
              </div>
              <button
                onClick={() => {
                  setActiveTab('studio');
                  setSessionState('setup');
                }}
                style={{
                  padding: '8px 18px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#4F46E5',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Go to Interview Studio
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 16 }}>
              {pastInterviews.map(intv => (
                <div
                  key={intv.id}
                  style={{
                    background: '#fff',
                    border: '1px solid #E5E7EB',
                    borderRadius: 8,
                    padding: 18,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4 }}>
                        {intv.roleTitle}
                      </span>
                      <span style={{ fontSize: 12, color: '#9CA3AF' }}>
                        {new Date(intv.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: intv.overallScore >= 75 ? '#15803D' : '#4F46E5' }}>
                        {intv.overallScore}
                      </span>
                      <span style={{ fontSize: 13, color: '#6B7280' }}>/ 100 Overall</span>
                    </div>

                    <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#4B5563', marginBottom: 12 }}>
                      <span>Tech: <strong>{intv.technicalScore}%</strong></span>
                      <span>Comm: <strong>{intv.communicationScore}%</strong></span>
                      <span>Duration: <strong>{intv.durationMinutes}m</strong></span>
                    </div>

                    {intv.feedbackSummary && (
                      <p style={{ margin: '0 0 14px', fontSize: 12, color: '#6B7280', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {intv.feedbackSummary}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedHistoryInterview(intv)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      color: '#4F46E5',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <span>View Full Scorecard</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Past Session Detail Modal */}
          {selectedHistoryInterview && (
            <Modal
              isOpen={Boolean(selectedHistoryInterview)}
              title={`Scorecard: ${selectedHistoryInterview.roleTitle}`}
              width={900}
              onClose={() => setSelectedHistoryInterview(null)}
            >
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 13, color: '#6B7280' }}>
                      Date: {new Date(selectedHistoryInterview.createdAt).toLocaleString()} • Duration: {selectedHistoryInterview.durationMinutes} mins
                    </div>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: selectedHistoryInterview.overallScore >= 75 ? '#15803D' : '#4F46E5' }}>
                    Score: {selectedHistoryInterview.overallScore} / 100
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Technical</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{selectedHistoryInterview.technicalScore}%</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Communication</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{selectedHistoryInterview.communicationScore}%</div>
                  </div>
                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 6, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: '#64748B', textTransform: 'uppercase' }}>Problem Solving</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B' }}>{selectedHistoryInterview.problemSolvingScore}%</div>
                  </div>
                </div>

                {selectedHistoryInterview.improvements && selectedHistoryInterview.improvements.length > 0 && (
                  <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, padding: 14, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={15} />
                      <span>Improvements Identified by HR:</span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#B91C1C', lineHeight: 1.5 }}>
                      {selectedHistoryInterview.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#111827' }}>
                    Interview Transcript ({selectedHistoryInterview.transcript?.length || 0} Questions)
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 360, overflowY: 'auto' }}>
                    {(selectedHistoryInterview.transcript || []).map((t, idx) => (
                      <div key={idx} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>
                          Q{idx + 1}: {t.question}
                        </div>
                        <div style={{ fontSize: 12, color: '#334155', marginBottom: 6, lineHeight: 1.45 }}>
                          <strong>Answer:</strong> {t.studentAnswer}
                        </div>
                        <div style={{ fontSize: 11, color: '#15803D' }}>
                          <strong>Feedback:</strong> {t.evaluation?.feedback}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Modal>
          )}
        </div>
      )}
    </BaseLayout>
  );
}
