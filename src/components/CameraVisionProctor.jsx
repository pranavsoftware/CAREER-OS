import { useEffect, useRef, useState } from 'react';
import { Eye, ShieldAlert, Scan, Smartphone, AlertTriangle, CheckCircle2, RefreshCw, Hand } from 'lucide-react';

// Suppress benign MediaPipe/TFLite informational startup log from triggering Next.js Turbopack error overlay
if (typeof window !== 'undefined' && !window.__tfLiteInfoFiltered) {
  window.__tfLiteInfoFiltered = true;
  const originalError = console.error;
  const originalWarn = console.warn;
  const isBenignTfMsg = (msg) => {
    if (typeof msg !== 'string') return false;
    return (
      msg.includes('Created TensorFlow Lite') ||
      msg.includes('XNNPACK delegate') ||
      msg.includes('INFO: Created TensorFlow')
    );
  };

  console.error = function (...args) {
    if (isBenignTfMsg(args[0])) {
      console.debug(...args);
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = function (...args) {
    if (isBenignTfMsg(args[0])) {
      console.debug(...args);
      return;
    }
    originalWarn.apply(console, args);
  };
}

/**
 * Configurable Proctoring Parameters
 * All thresholds represent deviations from candidate's calibrated baseline.
 */
/**
 * CHALLENGE_MODE Tradeoff Analysis:
 *
 * 1. 'both_hands' (Default):
 *    - Pros: Familiar, clears keyboard/phone physically off desk, unambiguous dual-arm verification.
 *    - Cons: Narrow camera FOV cutoffs, physically awkward on laptop stands, excludes candidates with arm injury or upper-limb motor differences.
 *
 * 2. 'one_hand_gesture' (Dynamic finger count 1-5 within 10s):
 *    - Pros: High anti-spoofing security (random finger count prevents replay/photo bypass), fits comfortably in standard camera frame, accessible for single-limb mobility.
 *    - Cons: Requires clean lighting for finger segmentation; slightly higher cognitive load under interview pressure.
 *
 * 3. 'blink_and_turn' (Random head-turn Left/Right with centered gaze):
 *    - Pros: Maximum accessibility (zero hand/arm requirement), utilizes robust 468-point facial mesh without extra hand landmarker overhead.
 *    - Cons: Does not verify whether candidate's hands remain on a beneath-desk phone or device.
 */

export const PROCTORING_CONFIG = {
  DETECTION_INTERVAL_MS: 300,
  CALIBRATION_DURATION_MS: 3000,
  SUSTAINED_GAZE_DURATION_MS: 6000, // Look-down must persist continuously > 6s
  STRIKE_DECAY_WINDOW_MS: 60000,    // 60s of clean behavior decays strike
  MAX_STRIKES_BEFORE_CHALLENGE: 3,
  FACE_ABSENCE_THRESHOLD_MS: 5000,  // > 5 seconds absence
  OCCLUSION_THRESHOLD_MS: 3000,     // > 3 seconds camera darkness
  OCCLUSION_LUMINANCE_THRESHOLD: 12,

  // Strike 3 Challenge Config
  CHALLENGE_MODE: 'both_hands', // 'both_hands' | 'one_hand_gesture' | 'blink_and_turn'
  STABILITY_HOLD_DURATION_MS: 1000, // Hand/gesture landmarks must remain stable for >= 1s
  MAX_CHALLENGE_ATTEMPTS: 2, // Accessibility fallback threshold (flags for manual review, never auto-fails)

  // Thresholds during verbal conversational rounds
  VERBAL: {
    EYE_LOOK_DOWN_DELTA: 0.35,  // Eye blendshape downward shift
    PITCH_DOWN_DELTA: 0.32,     // Head pitch downward tilt
    YAW_DELTA: 0.42,            // Head yaw turn away
  },
  // Looser thresholds during live coding rounds (candidates look at keyboard/screen editor)
  CODING: {
    EYE_LOOK_DOWN_DELTA: 0.58,
    PITCH_DOWN_DELTA: 0.55,
    YAW_DELTA: 0.55,
  },
};

/**
 * Helper to count extended fingers from 21 MediaPipe hand landmarks.
 */
function countExtendedFingers(landmarks) {
  if (!landmarks || landmarks.length < 21) return 0;
  let count = 0;

  // Thumb: tip (4) vs IP joint (3) X-distance from wrist (0)
  const isRightHand = landmarks[17].x < landmarks[5].x;
  if (isRightHand) {
    if (landmarks[4].x < landmarks[3].x) count += 1;
  } else {
    if (landmarks[4].x > landmarks[3].x) count += 1;
  }

  // Fingers: Tip Y must be above PIP joint Y (smaller Y in screen space)
  if (landmarks[8].y < landmarks[6].y) count += 1;   // Index
  if (landmarks[12].y < landmarks[10].y) count += 1; // Middle
  if (landmarks[16].y < landmarks[14].y) count += 1; // Ring
  if (landmarks[20].y < landmarks[18].y) count += 1; // Pinky

  return count;
}

/**
 * CameraVisionProctor
 * Enterprise MediaPipe FaceLandmarker proctoring component.
 * - Calibrates against candidate baseline (looking at screen is NEVER flagged).
 * - Tracks eyeLookDown blendshapes and head rotation matrix.
 * - Graded response: Strike 1 silent log, Strike 2 soft banner, Strike 3 hands-up challenge.
 * - Automatic 60s strike decay for clean behavior.
 * - Pure logging to audit log; no automated score deduction.
 */
export default function CameraVisionProctor({
  videoRef,
  isActive = true,
  roundType = 'verbal', // 'verbal' | 'coding'
  isHandsUpActive = false,
  challengeConfig = {},
  onMalpracticeAlert,
  onAuditLog,
  onGazeStateChange,
  onHandsCheckTick,
}) {
  const canvasRef = useRef(null);
  const landmarkerRef = useRef(null);
  const handLandmarkerRef = useRef(null);

  // States
  const [isLandmarkerReady, setIsLandmarkerReady] = useState(false);
  const [isHandLandmarkerReady, setIsHandLandmarkerReady] = useState(false);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [hasHandLoadError, setHasHandLoadError] = useState(false);
  const [calibrationState, setCalibrationState] = useState('uncalibrated'); // 'uncalibrated' | 'calibrating' | 'calibrated'
  const [calibrationProgress, setCalibrationProgress] = useState(0); // 0 to 100
  const [gazeStatus, setGazeStatus] = useState('centered'); // 'centered' | 'looking_down' | 'looking_away' | 'out_of_frame' | 'tampered'
  const [showSoftWarning, setShowSoftWarning] = useState(false);
  const [currentStrikes, setCurrentStrikes] = useState(0);
  const [faceBbox, setFaceBbox] = useState({ x: 30, y: 16, w: 40, h: 56 });
  const [handsDetectedCount, setHandsDetectedCount] = useState(2);

  // Challenge hold stability tracker (1.0s continuous hold to prevent false positives)
  const gestureHoldStartRef = useRef(0);

  // Calibration baseline
  const baselineRef = useRef({
    eyeDown: 0.1,
    pitch: 0.0,
    yaw: 0.0,
  });
  const calibrationSamplesRef = useRef([]);
  const calibrationStartRef = useRef(null);

  // Timers and durations
  const sustainedGazeDurationRef = useRef(0);
  const lastCleanBehaviorTimeRef = useRef(Date.now());
  const strikeCountRef = useRef(0);
  const absenceDurationRef = useRef(0);
  const occlusionDurationRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  // 1. Initialize MediaPipe FaceLandmarker and HandLandmarker
  useEffect(() => {
    let isMounted = true;

    async function initMediaPipe() {
      try {
        const { FilesetResolver, FaceLandmarker, HandLandmarker } = await import('@mediapipe/tasks-vision');
        // Self-hosted local WASM files in /public/mediapipe/wasm (zero external CDN calls)
        const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm');

        if (!isMounted) return;

        // Load FaceLandmarker
        let faceLandmarkerInstance = null;
        const localFaceModelPath = '/mediapipe/face_landmarker.task';

        try {
          faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: localFaceModelPath,
              delegate: 'GPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        } catch (gpuErr) {
          faceLandmarkerInstance = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: localFaceModelPath,
              delegate: 'CPU',
            },
            outputFaceBlendshapes: true,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
          });
        }

        if (isMounted) {
          landmarkerRef.current = faceLandmarkerInstance;
          setIsLandmarkerReady(true);
        } else {
          try { faceLandmarkerInstance?.close?.(); } catch (e) {}
        }

        // Load HandLandmarker for real workspace hands-up verification
        try {
          let handInstance = null;
          const localHandModelPath = '/mediapipe/hand_landmarker.task';
          try {
            handInstance = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: localHandModelPath,
                delegate: 'GPU',
              },
              runningMode: 'VIDEO',
              numHands: 2,
            });
          } catch (gpuHandErr) {
            handInstance = await HandLandmarker.createFromOptions(vision, {
              baseOptions: {
                modelAssetPath: localHandModelPath,
                delegate: 'CPU',
              },
              runningMode: 'VIDEO',
              numHands: 2,
            });
          }

          if (isMounted) {
            handLandmarkerRef.current = handInstance;
            setIsHandLandmarkerReady(true);
          } else {
            try { handInstance?.close?.(); } catch (e) {}
          }
        } catch (handErr) {
          console.warn('MediaPipe HandLandmarker init error, fallback to timer countdown:', handErr);
          if (isMounted) {
            setHasHandLoadError(true);
          }
        }
      } catch (err) {
        console.warn('MediaPipe load error, running fallback:', err);
        if (isMounted) {
          setHasLoadError(true);
          setHasHandLoadError(true);
        }
      }
    }

    initMediaPipe();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) {
        try {
          landmarkerRef.current?.close?.();
        } catch (e) {}
        landmarkerRef.current = null;
      }
      if (handLandmarkerRef.current) {
        try {
          handLandmarkerRef.current?.close?.();
        } catch (e) {}
        handLandmarkerRef.current = null;
      }
    };
  }, []);

  // 2. Continuous Detection & Calibration Loop
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;
      const canvas = canvasRef.current;
      const now = Date.now();

      if (!video || video.readyState < 2) return;

      // Check luminance for camera occlusion
      let isCameraOccluded = false;
      if (canvas) {
        try {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = 64;
            canvas.height = 48;
            ctx.drawImage(video, 0, 0, 64, 48);
            const imgData = ctx.getImageData(0, 0, 64, 48).data;
            let sumLum = 0;
            for (let i = 0; i < imgData.length; i += 4) {
              sumLum += 0.299 * imgData[i] + 0.587 * imgData[i + 1] + 0.114 * imgData[i + 2];
            }
            const avgLum = sumLum / (64 * 48);
            if (avgLum < PROCTORING_CONFIG.OCCLUSION_LUMINANCE_THRESHOLD) {
              isCameraOccluded = true;
            }
          }
        } catch (e) {}
      }

      // Handle Camera Occlusion
      if (isCameraOccluded) {
        occlusionDurationRef.current += PROCTORING_CONFIG.DETECTION_INTERVAL_MS;
        if (occlusionDurationRef.current >= PROCTORING_CONFIG.OCCLUSION_THRESHOLD_MS) {
          setGazeStatus('tampered');
          onAuditLog?.({
            timestamp: new Date().toISOString(),
            type: 'camera_occluded',
            reason: 'Camera covered or pitch-black frame detected for >3 seconds.',
            severity: 'medium',
          });
          occlusionDurationRef.current = 0;
        }
        return;
      } else {
        occlusionDurationRef.current = 0;
      }

      // If MediaPipe is not ready or failed, remain in fallback
      if (!landmarker) {
        return;
      }

      // Run MediaPipe detection if frame is new
      let result = null;
      try {
        if (video.currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = video.currentTime;
          result = landmarker.detectForVideo(video, now);
        }
      } catch (e) {
        return;
      }

      // Check face landmark presence
      const hasFace = result && result.faceLandmarks && result.faceLandmarks.length > 0;

      // Handle Face Absence (> 5 seconds)
      if (!hasFace) {
        absenceDurationRef.current += PROCTORING_CONFIG.DETECTION_INTERVAL_MS;
        sustainedGazeDurationRef.current = 0;

        if (absenceDurationRef.current >= PROCTORING_CONFIG.FACE_ABSENCE_THRESHOLD_MS) {
          setGazeStatus('out_of_frame');
          onGazeStateChange?.('out_of_frame');

          if (!isHandsUpActive) {
            onAuditLog?.({
              timestamp: new Date().toISOString(),
              type: 'face_absence',
              reason: 'Candidate face absent from camera frame for >5 seconds.',
              severity: 'medium',
            });
            onMalpracticeAlert?.('Candidate moved out of camera frame (>5 seconds). Face not detected.', 'absent');
          }
          absenceDurationRef.current = 0;
        }
        return;
      } else {
        absenceDurationRef.current = 0;
      }

      // Extract Head Pitch and Yaw
      let currentPitch = 0.0;
      let currentYaw = 0.0;
      if (result.facialTransformationMatrixes && result.facialTransformationMatrixes.length > 0) {
        const m = result.facialTransformationMatrixes[0].data;
        // Column-major 4x4 matrix
        currentPitch = Math.atan2(m[6], m[10]);
        currentYaw = Math.atan2(m[8], Math.sqrt(m[9] * m[9] + m[10] * m[10]));
      } else {
        // Fallback from geometry: nose (idx 1), forehead (idx 10), chin (idx 152)
        const nose = landmarks[1];
        const forehead = landmarks[10];
        const chin = landmarks[152];
        const vertRatio = (nose.y - forehead.y) / Math.max(0.001, chin.y - forehead.y);
        currentPitch = vertRatio - 0.5;
        currentYaw = (nose.x - forehead.x);
      }

      // =========================================================================
      // 2b. Strike 3 Verification Challenge Evaluation (Multi-Mode + 1s Hold)
      // =========================================================================
      if (isHandsUpActive) {
        const mode = challengeConfig.mode || PROCTORING_CONFIG.CHALLENGE_MODE;
        let isConditionMet = false;
        let extendedFingers = 0;
        let handCount = 0;

        if (mode === 'blink_and_turn') {
          const targetTurn = challengeConfig.targetTurn || 'right';
          const dyaw = currentYaw - (baselineRef.current.yaw || 0);
          if (targetTurn === 'left') {
            isConditionMet = dyaw < -0.28;
          } else {
            isConditionMet = dyaw > 0.28;
          }
        } else {
          // Hand-based verification: 'both_hands' or 'one_hand_gesture'
          const handLandmarker = handLandmarkerRef.current;
          if (handLandmarker && video && video.readyState >= 2) {
            try {
              const handResult = handLandmarker.detectForVideo(video, now);
              handCount = handResult?.landmarks?.length || 0;
              setHandsDetectedCount(handCount);

              if (mode === 'both_hands') {
                isConditionMet = handCount >= 2;
              } else if (mode === 'one_hand_gesture') {
                const targetFingers = challengeConfig.targetFingers || 3;
                if (handCount >= 1) {
                  extendedFingers = countExtendedFingers(handResult.landmarks[0]);
                  isConditionMet = extendedFingers === targetFingers;
                }
              }
            } catch (_) {
              isConditionMet = false;
            }
          }
        }

        // Reduce false positives: Require landmark detection to hold steadily for >= 1.0 second
        if (isConditionMet) {
          if (!gestureHoldStartRef.current) {
            gestureHoldStartRef.current = now;
          }
          const holdMs = now - gestureHoldStartRef.current;
          const isStable = holdMs >= PROCTORING_CONFIG.STABILITY_HOLD_DURATION_MS;

          onHandsCheckTick?.({
            challengeMet: isStable,
            bothHandsVisible: isStable, // backwards compatibility
            isStable,
            holdProgress: Math.min(100, Math.round((holdMs / PROCTORING_CONFIG.STABILITY_HOLD_DURATION_MS) * 100)),
            handCount,
            extendedFingers,
            targetFingers: challengeConfig.targetFingers || 3,
            mode,
            unverifiedTimerOnly: false,
          });
        } else {
          gestureHoldStartRef.current = 0;
          onHandsCheckTick?.({
            challengeMet: false,
            bothHandsVisible: false,
            isStable: false,
            holdProgress: 0,
            handCount,
            extendedFingers,
            targetFingers: challengeConfig.targetFingers || 3,
            mode,
            unverifiedTimerOnly: false,
          });
        }
      } else if (roundType === 'verbal') {
        // Normal monitoring of hand count during verbal questions
        const handLandmarker = handLandmarkerRef.current;
        if (handLandmarker && video && video.readyState >= 2) {
          try {
            const handResult = handLandmarker.detectForVideo(video, now);
            setHandsDetectedCount(handResult?.landmarks?.length || 0);
          } catch (_) {}
        }
      }

      // ==========================================
      // 3. CALIBRATION PHASE (First 3 Seconds)
      // ==========================================
      if (calibrationState === 'uncalibrated') {
        setCalibrationState('calibrating');
        calibrationStartRef.current = now;
        calibrationSamplesRef.current = [];
        return;
      }

      if (calibrationState === 'calibrating') {
        const elapsed = now - (calibrationStartRef.current || now);
        const progress = Math.min(100, Math.round((elapsed / PROCTORING_CONFIG.CALIBRATION_DURATION_MS) * 100));
        setCalibrationProgress(progress);

        calibrationSamplesRef.current.push({
          eyeDown: currentEyeDown,
          pitch: currentPitch,
          yaw: currentYaw,
        });

        if (elapsed >= PROCTORING_CONFIG.CALIBRATION_DURATION_MS) {
          const samples = calibrationSamplesRef.current;
          if (samples.length > 0) {
            const avgEyeDown = samples.reduce((acc, s) => acc + s.eyeDown, 0) / samples.length;
            const avgPitch = samples.reduce((acc, s) => acc + s.pitch, 0) / samples.length;
            const avgYaw = samples.reduce((acc, s) => acc + s.yaw, 0) / samples.length;

            baselineRef.current = {
              eyeDown: avgEyeDown,
              pitch: avgPitch,
              yaw: avgYaw,
            };
          }

          setCalibrationState('calibrated');
          onAuditLog?.({
            timestamp: new Date().toISOString(),
            type: 'calibration_complete',
            reason: `Calibrated baseline: eyeDown=${baselineRef.current.eyeDown.toFixed(2)}, pitch=${baselineRef.current.pitch.toFixed(2)}`,
            severity: 'info',
          });
        }
        return;
      }

      // ==========================================
      // 4. DEVIATION EVALUATION (Post-Calibration)
      // ==========================================
      const baseline = baselineRef.current;
      const cfg = roundType === 'coding' ? PROCTORING_CONFIG.CODING : PROCTORING_CONFIG.VERBAL;

      const deltaEyeDown = currentEyeDown - baseline.eyeDown;
      const deltaPitch = currentPitch - baseline.pitch;
      const deltaYaw = Math.abs(currentYaw - baseline.yaw);

      // Candidate is looking down at a phone/desk if eye gaze OR head pitch deviates beyond threshold
      const isLookingDown = deltaEyeDown > cfg.EYE_LOOK_DOWN_DELTA || deltaPitch > cfg.PITCH_DOWN_DELTA;
      const isLookingAway = deltaYaw > cfg.YAW_DELTA;

      if (isLookingDown || isLookingAway) {
        sustainedGazeDurationRef.current += PROCTORING_CONFIG.DETECTION_INTERVAL_MS;
        setGazeStatus(isLookingDown ? 'looking_down' : 'looking_away');
        onGazeStateChange?.(isLookingDown ? 'looking_down' : 'looking_away');

        // Glances under 6s are ignored. Only sustained deviation (>6s) triggers strike
        if (sustainedGazeDurationRef.current >= PROCTORING_CONFIG.SUSTAINED_GAZE_DURATION_MS) {
          strikeCountRef.current += 1;
          const newStrikes = strikeCountRef.current;
          setCurrentStrikes(newStrikes);
          sustainedGazeDurationRef.current = 0; // reset for next sustained interval

          if (newStrikes === 1) {
            // Strike 1: Log silently
            onAuditLog?.({
              timestamp: new Date().toISOString(),
              type: 'gaze_deviation_silent',
              reason: 'Sustained downward gaze (>6s) recorded silently. No warning shown.',
              severity: 'low',
            });
          } else if (newStrikes === 2) {
            // Strike 2: Show soft non-blocking banner
            setShowSoftWarning(true);
            onAuditLog?.({
              timestamp: new Date().toISOString(),
              type: 'gaze_deviation_soft_warn',
              reason: 'Sustained downward gaze (>6s) 2nd occurrence. Soft guidance banner displayed.',
              severity: 'medium',
            });
          } else if (newStrikes >= PROCTORING_CONFIG.MAX_STRIKES_BEFORE_CHALLENGE) {
            // Strike 3: Trigger hands-up verification challenge
            setShowSoftWarning(false);
            if (!isHandsUpActive) {
              onAuditLog?.({
                timestamp: new Date().toISOString(),
                type: 'gaze_malpractice_challenge',
                reason: 'Hands-Up Challenge triggered after 3 sustained downward gaze events (>6s each).',
                severity: 'high',
              });
              onMalpracticeAlert?.(
                'Persistent downward gaze detected across 3 sustained intervals (>6s each). Suspected secondary device/phone usage.',
                'gaze'
              );
            }
          }
        }
      } else {
        // Clean behavior - candidate is looking at screen
        sustainedGazeDurationRef.current = 0;
        setGazeStatus('centered');
        onGazeStateChange?.('centered');

        // Strike Decay: 60 seconds of clean behavior decays strikes
        if (now - lastCleanBehaviorTimeRef.current >= PROCTORING_CONFIG.STRIKE_DECAY_WINDOW_MS) {
          if (strikeCountRef.current > 0) {
            strikeCountRef.current = Math.max(0, strikeCountRef.current - 1);
            setCurrentStrikes(strikeCountRef.current);
            if (strikeCountRef.current < 2) {
              setShowSoftWarning(false);
            }
          }
          lastCleanBehaviorTimeRef.current = now;
        }
      }
    }, PROCTORING_CONFIG.DETECTION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [
    isActive,
    roundType,
    isHandsUpActive,
    calibrationState,
    onMalpracticeAlert,
    onAuditLog,
    onGazeStateChange,
    videoRef,
  ]);

  // Recalibrate trigger
  function handleRecalibrate() {
    setCalibrationState('calibrating');
    setCalibrationProgress(0);
    calibrationStartRef.current = Date.now();
    calibrationSamplesRef.current = [];
  }

  // Visual Bounding Box styling
  let borderColor = 'rgba(16, 185, 129, 0.75)'; // Centered green
  let statusText = 'FACE: CENTERED • EYE CONTACT';
  let badgeColor = '#10B981';

  if (calibrationState === 'calibrating') {
    borderColor = '#3B82F6';
    statusText = `CALIBRATING (${calibrationProgress}%)`;
    badgeColor = '#3B82F6';
  } else if (isHandsUpActive) {
    borderColor = '#F59E0B';
    statusText = 'SCANNING HANDS IN VIEW';
    badgeColor = '#F59E0B';
  } else if (gazeStatus === 'looking_down') {
    borderColor = currentStrikes >= 2 ? '#EF4444' : '#F59E0B';
    statusText = currentStrikes >= 2 ? 'ALERT: LOOKING DOWN' : 'GAZE: DOWNWARD';
    badgeColor = currentStrikes >= 2 ? '#EF4444' : '#F59E0B';
  } else if (gazeStatus === 'out_of_frame') {
    borderColor = '#EF4444';
    statusText = 'WARNING: FACE NOT DETECTED';
    badgeColor = '#EF4444';
  } else if (gazeStatus === 'tampered') {
    borderColor = '#EF4444';
    statusText = 'CAMERA OCCLUDED';
    badgeColor = '#EF4444';
  }

  return (
    <>
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} style={{ display: 'none' }} width={64} height={48} />

      {/* Dynamic Face Bounding Box Scanner */}
      <div
        style={{
          position: 'absolute',
          top: `${faceBbox.y}%`,
          left: `${faceBbox.x}%`,
          width: `${faceBbox.w}%`,
          height: `${faceBbox.h}%`,
          border: `2px ${isHandsUpActive ? 'dashed' : 'solid'} ${borderColor}`,
          borderRadius: 10,
          pointerEvents: 'none',
          transition: 'all 0.25s ease',
          boxShadow: gazeStatus === 'looking_down' ? '0 0 16px rgba(245, 158, 11, 0.35)' : 'none',
        }}
      >
        {/* Status Tag */}
        <div
          style={{
            position: 'absolute',
            top: -20,
            left: 0,
            fontSize: 9,
            fontWeight: 800,
            color: '#fff',
            background: badgeColor,
            padding: '2px 6px',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            letterSpacing: '0.4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          {calibrationState === 'calibrating' && <RefreshCw size={10} className="animate-spin" />}
          {gazeStatus === 'looking_down' && <Smartphone size={10} />}
          {gazeStatus === 'centered' && <CheckCircle2 size={10} />}
          {gazeStatus === 'out_of_frame' && <AlertTriangle size={10} />}
          <span>{statusText}</span>
        </div>

        {/* Corner Accents */}
        <div style={{ position: 'absolute', top: -2, left: -2, width: 8, height: 8, borderTop: `3px solid ${badgeColor}`, borderLeft: `3px solid ${badgeColor}` }} />
        <div style={{ position: 'absolute', top: -2, right: -2, width: 8, height: 8, borderTop: `3px solid ${badgeColor}`, borderRight: `3px solid ${badgeColor}` }} />
        <div style={{ position: 'absolute', bottom: -2, left: -2, width: 8, height: 8, borderBottom: `3px solid ${badgeColor}`, borderLeft: `3px solid ${badgeColor}` }} />
        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 8, height: 8, borderBottom: `3px solid ${badgeColor}`, borderRight: `3px solid ${badgeColor}` }} />
      </div>

      {/* Hand Status Overlay for Candidate */}
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {roundType === 'verbal' ? (
          <div
            style={{
              background: handsDetectedCount >= 2 ? 'rgba(16, 185, 129, 0.90)' : 'rgba(245, 158, 11, 0.92)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
              letterSpacing: '0.4px',
            }}
          >
            <Hand size={13} color="#fff" />
            <span>{handsDetectedCount >= 2 ? 'BOTH HANDS VISIBLE' : 'KEEP BOTH HANDS IN VIEW'}</span>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(51, 65, 85, 0.85)',
              backdropFilter: 'blur(4px)',
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 10,
              fontWeight: 700,
              color: '#E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span>⌨</span>
            <span>CODING MODE</span>
          </div>
        )}
      </div>

      {/* 3-SECOND CALIBRATION BANNER */}
      {calibrationState === 'calibrating' && (
        <div
          style={{
            position: 'absolute',
            top: 48,
            left: 12,
            right: 12,
            background: 'rgba(30, 58, 138, 0.94)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Eye size={14} color="#93C5FD" />
              <span>Calibrating workspace: Please look at the interviewer</span>
            </div>
            <span>{calibrationProgress}%</span>
          </div>
          <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${calibrationProgress}%`,
                height: '100%',
                background: '#60A5FA',
                transition: 'width 0.2s linear',
              }}
            />
          </div>
        </div>
      )}

      {/* SOFT NON-BLOCKING BANNER (EVENT 2) */}
      {showSoftWarning && !isHandsUpActive && (
        <div
          style={{
            position: 'absolute',
            bottom: 42,
            left: 12,
            right: 12,
            background: 'rgba(245, 158, 11, 0.92)',
            backdropFilter: 'blur(4px)',
            color: '#fff',
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Smartphone size={14} />
            <span>Notice: Please keep your primary focus on the interviewer and screen.</span>
          </div>
          <span style={{ fontSize: 10, opacity: 0.9 }}>Observation active</span>
        </div>
      )}

      {/* REAL-TIME PROCTORING TELEMETRY PILL */}
      <div
        style={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(4px)',
          padding: '3px 8px',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: '#CBD5E1',
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            background: hasLoadError ? '#F59E0B' : badgeColor,
            boxShadow: `0 0 6px ${hasLoadError ? '#F59E0B' : badgeColor}`,
          }}
        />
        <span>
          {hasLoadError
            ? 'Integrity Proctor: Active'
            : calibrationState === 'calibrating'
            ? 'Calibrating Camera...'
            : roundType === 'coding'
            ? 'Coding Mode • Hands on Keyboard'
            : handsDetectedCount >= 2
            ? 'Voice Mode • Both Hands in View'
            : 'Voice Mode • Keep Both Hands in View'}
        </span>

        {calibrationState === 'calibrated' && (
          <button
            type="button"
            onClick={handleRecalibrate}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: 0,
              marginLeft: 4,
            }}
            title="Recalibrate camera baseline"
          >
            <RefreshCw size={10} />
          </button>
        )}
      </div>
    </>
  );
}
