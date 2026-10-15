import { useEffect, useRef, useState } from 'react';

/**
 * Hook to manage camera & mic stream lifecycle safely for AI Interview.
 * - Enabled for the entire duration in the interview room.
 * - Moving between interviewing -> evaluating_answer -> feedback_step does NOT restart camera or reset calibration.
 * - Race-safe cleanup prevents memory leaks if unmounted before getUserMedia resolves.
 * - Detects unexpected camera disconnection via onended and triggers proctoring audit log.
 */
export function useCameraStream({ enabled, onEvent }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
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

    navigator.mediaDevices
      .getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
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

        setStatus('live');
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('Camera access error:', err?.name, err?.message);
          setStatus(err?.name === 'NotAllowedError' ? 'denied' : 'error');
        }
      });

    return () => {
      cancelled = true;
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
  useEffect(() => {
    if (status === 'live' && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [status]);

  return { videoRef, streamRef, status };
}

export default useCameraStream;
