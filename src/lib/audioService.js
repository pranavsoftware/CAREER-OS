/**
 * Career-OS Audio & Neural TTS Playback Engine
 * Uses Web Audio API (AudioContext + AnalyserNode) to provide:
 * 1. Zero-latency static prompt playback via /audio/questions/
 * 2. Real-time audio frequency analysis for realistic avatar lip-sync
 * 3. Fallback to self-hosted dynamic /api/tts endpoint
 * 4. Clean interruption and auto-mic transition
 */

let globalAudioCtx = null;
let globalAnalyser = null;
let currentAudioSource = null;
let currentAudioElement = null;
let animFrameId = null;

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
  if (!globalAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      globalAudioCtx = new AudioContextClass();
      globalAnalyser = globalAudioCtx.createAnalyser();
      globalAnalyser.fftSize = 256;
      globalAnalyser.smoothingTimeConstant = 0.75;
    }
  }
  if (globalAudioCtx && globalAudioCtx.state === 'suspended') {
    globalAudioCtx.resume().catch(() => {});
  }
  return { audioCtx: globalAudioCtx, analyser: globalAnalyser };
}

export function stopCurrentAudio() {
  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }
  if (currentAudioElement) {
    currentAudioElement.pause();
    currentAudioElement.currentTime = 0;
    currentAudioElement = null;
  }
  if (currentAudioSource) {
    try {
      currentAudioSource.disconnect();
    } catch (_) {}
    currentAudioSource = null;
  }
}

/**
 * Plays speech audio for an interview prompt or text.
 * @param {Object} options
 * @param {string} [options.promptId] - e.g. 'fe_q1', 'sys_welcome', 'sys_hands_up'
 * @param {string} [options.text] - Raw text to speak if promptId is not pre-rendered
 * @param {Function} [options.onAudioLevel] - Callback receiving normalized RMS audio level [0.0 - 1.0]
 * @param {Function} [options.onEnd] - Callback when playback finishes
 */
export async function playTtsAudio({ promptId, text, onAudioLevel, onEnd }) {
  stopCurrentAudio();

  const { audioCtx, analyser } = getAudioContext() || {};

  let audioUrl = null;

  // 1. Check if static audio file exists for this promptId
  if (promptId) {
    try {
      const res = await fetch(`/api/tts?id=${encodeURIComponent(promptId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.audioUrl) {
          audioUrl = data.audioUrl;
        }
      }
    } catch (e) {
      console.warn('Failed to resolve static prompt audio:', e);
    }
  }

  // 2. Fallback to dynamic TTS endpoint with text
  if (!audioUrl && text) {
    audioUrl = `/api/tts?text=${encodeURIComponent(text)}`;
  }

  if (!audioUrl) {
    console.warn('No audio URL found for TTS playback');
    if (onEnd) onEnd();
    return;
  }

  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  audio.src = audioUrl;
  currentAudioElement = audio;

  // Connect to AnalyserNode for real frequency / lip-sync analysis
  if (audioCtx && analyser) {
    try {
      // Connect element to analyser and destination
      const source = audioCtx.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(audioCtx.destination);
      currentAudioSource = source;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let lastAudioReport = 0;
      let lastReportedVal = -1;

      const updateVolume = () => {
        if (!currentAudioElement || currentAudioElement.paused) {
          if (onAudioLevel && lastReportedVal !== 0) {
            lastReportedVal = 0;
            onAudioLevel(0);
          }
          return;
        }

        analyser.getByteFrequencyData(dataArray);

        // Compute average across vocal frequencies (approx 100Hz - 3000Hz)
        let sum = 0;
        const binLimit = Math.min(dataArray.length, 64);
        for (let i = 0; i < binLimit; i++) {
          sum += dataArray[i];
        }
        const avg = sum / binLimit;
        const normalized = Math.min(1, Math.max(0, (avg - 15) / 140));

        const now = performance.now();
        if (now - lastAudioReport >= 90 && Math.abs(normalized - lastReportedVal) >= 0.08) {
          lastAudioReport = now;
          lastReportedVal = normalized;
          if (onAudioLevel) {
            onAudioLevel(normalized);
          }
        }

        animFrameId = requestAnimationFrame(updateVolume);
      };

      audio.onplay = () => {
        animFrameId = requestAnimationFrame(updateVolume);
      };
    } catch (nodeErr) {
      console.warn('Could not connect Audio element to Web Audio Analyser:', nodeErr);
    }
  }

  audio.onended = () => {
    stopCurrentAudio();
    if (onAudioLevel) onAudioLevel(0);
    if (onEnd) onEnd();
  };

  audio.onerror = (err) => {
    console.warn('Audio playback error:', err);
    stopCurrentAudio();
    if (onAudioLevel) onAudioLevel(0);
    if (onEnd) onEnd();
  };

  try {
    await audio.play();
  } catch (playErr) {
    console.warn('Audio auto-play prevented or error:', playErr);
    stopCurrentAudio();
    if (onEnd) onEnd();
  }
}

/**
 * Returns current normalized vocal frequency level [0.0 - 1.0].
 * Read directly inside requestAnimationFrame without triggering React state re-renders.
 */
export function getSharedAudioLevel() {
  if (!globalAnalyser || !currentAudioElement || currentAudioElement.paused) return 0;
  const dataArray = new Uint8Array(globalAnalyser.frequencyBinCount);
  globalAnalyser.getByteFrequencyData(dataArray);
  let sum = 0;
  const binLimit = Math.min(dataArray.length, 64);
  for (let i = 0; i < binLimit; i++) {
    sum += dataArray[i];
  }
  const avg = sum / binLimit;
  return Math.min(1, Math.max(0, (avg - 15) / 140));
}

