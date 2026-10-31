import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage camera & mic stream lifecycle safely for AI Interview.
 * - Adaptive network constraints: dynamically adjusts frameRate & resolution on mobile 3G/2G vs Wi-Fi/4G.
 * - WakeLock API: prevents mobile device screens from sleeping during the interview.
 * - Enabled for the entire duration in the interview room.
 * - Moving between interviewing -> evaluating_answer -> feedback_step does NOT restart camera or reset calibration.
 * - Race-safe cleanup prevents memory leaks if unmounted before getUserMedia resolves.
 * - Detects unexpected camera disconnection via onended and triggers proctoring audit log.
 */
export function useCameraStream({ enabled, onEvent }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const wakeLockRef = useRef(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'starting' | 'live' | 'denied' | 'error'

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    setStatus('starting');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setStatus('error');
      return undefined;
    }

    // Adaptive constraints based on mobile connection
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isMobileSlow = conn && (conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g' || conn.effectiveType === '3g' || conn.saveData);

    const videoConstraints = isMobileSlow
      ? {
          width: { ideal: 480, max: 640 },
          height: { ideal: 360, max: 480 },
          frameRate: { ideal: 15, max: 20 },
          facingMode: 'user',
        }
      : {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'user',
        };

    const audioConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    };

    async function startStream() {
      try {
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: videoConstraints,
            audio: audioConstraints,
          });
        } catch (initialErr) {
          // Fallback 1: user-facing camera with relaxed constraints
          console.warn('Initial adaptive camera constraints failed, trying facingMode user:', initialErr?.message);
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'user' },
              audio: true,
            });
          } catch (secondaryErr) {
            // Fallback 2: minimal boolean constraints for strict iOS Safari
            console.warn('FacingMode fallback failed, trying boolean constraints:', secondaryErr?.message);
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: true,
            });
          }
        }

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;

        const videoTracks = stream.getVideoTracks();
        if (videoTracks.length > 0) {
          videoTracks[0].onended = () => {
            onEvent?.({
              type: 'camera_off',
              severity: 'high',
              reason: 'Camera stream disconnected or ended during the interview.',
            });
          };
        }

        // Keep mobile screen awake during interview
        if ('wakeLock' in navigator && navigator.wakeLock.request) {
          try {
            wakeLockRef.current = await navigator.wakeLock.request('screen');
          } catch (_) {}
        }

        setStatus('live');
      } catch (err) {
        if (!cancelled) {
          console.warn('Camera access error:', err?.name, err?.message);
          setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
      }
    }

    startStream();

    return () => {
      cancelled = true;
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch (_) {}
        wakeLockRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach once both the stream and the <video> element exist.
  // Sets iOS WebKit required inline video attributes and triggers playback.
  useEffect(() => {
    if (status === 'live' && videoRef.current && streamRef.current) {
      const v = videoRef.current;
      v.srcObject = streamRef.current;
      v.setAttribute('playsinline', 'true');
      v.setAttribute('webkit-playsinline', 'true');
      v.muted = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          // Normal when autoplay policy requests user gesture
          console.debug('Camera video play caught:', err?.message || err);
        });
      }
    }
  }, [status]);

  return { videoRef, streamRef, status };
}

export default useCameraStream;
