import { useEffect, useRef, useState } from 'react';
import { Bot, ShieldAlert, Cpu, Sparkles, Volume2, UserCheck, Box, Wifi } from 'lucide-react';
import ThreeAvatarCanvas from './ThreeAvatarCanvas';
import { getSharedAudioLevel } from '../lib/audioService';

export default function LiveAiAgentStream({
  state = 'listening', // 'listening' | 'speaking' | 'warning' | 'thinking'
  isSpeaking = false,
  caption = '',
  agentName = 'Career-OS Expert AI',
  roleTitle = 'Lead Technical HR & Talent Partner',
  onTriggerCheck,
  avatarUrl = '/avatars/hr-female.glb',
  stillUrl = '/avatars/male_hr_still.jpg',
  speakingUrl = '/avatars/male_hr_speaking.jpg',
  warningUrl = '/avatars/male_hr_warning.jpg',
  showChrome = true,
  audioLevelRef,
}) {
  const canvasRef = useRef(null);
  // Default to 3D animated WebGL ReadyPlayerMe avatar
  const [streamMode, setStreamMode] = useState('3d');
  const [fps, setFps] = useState(60);

  // References for images
  const baseImgRef = useRef(null);
  const speakingImgRef = useRef(null);
  const warningImgRef = useRef(null);
  const imagesLoadedRef = useRef(false);

  // Animation frame state
  const animFrameIdRef = useRef(null);
  const timeRef = useRef(0);
  const blinkStateRef = useRef({ isBlinking: false, blinkProgress: 0, nextBlinkTime: 2.5 });
  const mouthStateRef = useRef({ openAmount: 0, targetOpen: 0 });
  const smoothedAudioRef = useRef(0);

  // Preload HR image assets for canvas rendering
  useEffect(() => {
    let loadedCount = 0;
    const total = 3;

    function handleLoad() {
      loadedCount++;
      if (loadedCount >= total) {
        imagesLoadedRef.current = true;
      }
    }

    const img1 = new Image();
    img1.src = stillUrl || '/avatars/male_hr_still.jpg';
    img1.onload = handleLoad;
    img1.onerror = () => { img1.src = '/images/hr_interviewer.jpg'; };
    baseImgRef.current = img1;

    const img2 = new Image();
    img2.src = speakingUrl || '/avatars/male_hr_speaking.jpg';
    img2.onload = handleLoad;
    img2.onerror = () => { img2.src = '/images/hr_interviewer_speaking.jpg'; };
    speakingImgRef.current = img2;

    const img3 = new Image();
    img3.src = warningUrl || '/avatars/male_hr_warning.jpg';
    img3.onload = handleLoad;
    img3.onerror = () => { img3.src = '/images/hr_interviewer_warning.jpg'; };
    warningImgRef.current = img3;

    return () => {
      imagesLoadedRef.current = false;
    };
  }, [stillUrl, speakingUrl, warningUrl]);

  // Main 60FPS Live Animation Loop for 2D Canvas Fallbacks
  useEffect(() => {
    if (streamMode === '3d') return; // ThreeAvatarCanvas manages its own WebGL 60FPS loop

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    function render(now) {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      timeRef.current += dt;
      const t = timeRef.current;

      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // 1. Natural Blinking Logic (every 3 to 4.5 seconds)
      const blink = blinkStateRef.current;
      if (!blink.isBlinking && t >= blink.nextBlinkTime) {
        blink.isBlinking = true;
        blink.blinkProgress = 0;
      }

      if (blink.isBlinking) {
        blink.blinkProgress += dt * 6.5; // Blink speed
        if (blink.blinkProgress >= 1) {
          blink.isBlinking = false;
          blink.blinkProgress = 0;
          blink.nextBlinkTime = t + 2.8 + Math.random() * 2.2;
        }
      }

      // 2. Continuous Natural Motion Calculations
      const breathOffsetY = Math.sin(t * 2.2) * 2.2;
      const headSwayX = Math.cos(t * 1.1) * 1.6;
      const headSwayY = Math.sin(t * 1.7) * 1.0;

      // Clear Canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (streamMode === 'photorealistic_2d') {
        renderPhotorealisticLiveStream(ctx, canvas, t, breathOffsetY, headSwayX, headSwayY, blink);
      } else {
        renderNeuralHologramAgent(ctx, canvas, t, headSwayX, headSwayY);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    }

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [streamMode, isSpeaking, state]);

  // Mode 1: Photorealistic Live Video Stream with Breathing, Blinking, and Mouth Sync
  function renderPhotorealisticLiveStream(ctx, canvas, t, breathY, swayX, swayY, blink) {
    const w = canvas.width;
    const h = canvas.height;

    // Pick active base source
    let sourceImg = baseImgRef.current;
    if (state === 'warning') {
      sourceImg = warningImgRef.current || baseImgRef.current;
    } else {
      const rawAudio = getSharedAudioLevel();
      const targetAudio = rawAudio > 0 ? rawAudio : (isSpeaking ? (0.35 + Math.sin(t * 12) * 0.25) : 0);
      smoothedAudioRef.current += (targetAudio - smoothedAudioRef.current) * (targetAudio > smoothedAudioRef.current ? 0.35 : 0.15);
      const level = smoothedAudioRef.current;

      if (level > 0.08 && speakingImgRef.current) {
        const mouthPhoneme = Math.sin(t * 13);
        sourceImg = (mouthPhoneme > -0.2 && level > 0.1) ? speakingImgRef.current : baseImgRef.current;
      }
    }

    if (sourceImg && sourceImg.complete && sourceImg.naturalWidth > 0) {
      ctx.save();

      // Apply subtle breathing warp + camera micro-float
      const zoom = 1.018 + Math.sin(t * 0.8) * 0.005;
      ctx.translate(w / 2 + swayX, h / 2 + breathY + swayY);
      ctx.scale(zoom, zoom);
      ctx.drawImage(sourceImg, -w / 2, -h / 2, w, h);

      ctx.restore();

      // Render Realistic Eye Blink overlay if currently blinking
      if (blink.isBlinking && state !== 'warning') {
        const eyeClose = Math.sin(blink.blinkProgress * Math.PI);
        if (eyeClose > 0.1) {
          ctx.save();
          ctx.translate(w / 2 + swayX, h / 2 + breathY + swayY);

          // Left and Right Eye coordinates centered for headshot
          const eyeY = -h * 0.18;
          const leftEyeX = -w * 0.045;
          const rightEyeX = w * 0.045;
          const eyeW = w * 0.038;
          const eyeH = (h * 0.016) * eyeClose;

          ctx.fillStyle = '#C29B7F'; // Natural skin tone shadow for eyelid
          ctx.beginPath();
          ctx.ellipse(leftEyeX, eyeY, eyeW, Math.max(1, eyeH), 0, 0, Math.PI * 2);
          ctx.ellipse(rightEyeX, eyeY, eyeW, Math.max(1, eyeH), 0, 0, Math.PI * 2);
          ctx.fill();

          // Eyelash crease line
          ctx.strokeStyle = '#382218';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(leftEyeX, eyeY + 1, eyeW * 0.9, 0, Math.PI);
          ctx.arc(rightEyeX, eyeY + 1, eyeW * 0.9, 0, Math.PI);
          ctx.stroke();

          ctx.restore();
        }
      }

      // Live Video Call Ambient Scanline & Color Tone
      if (state === 'warning') {
        // Red warning proctoring overlay
        const pulse = 0.15 + Math.sin(t * 8) * 0.1;
        ctx.fillStyle = `rgba(239, 68, 68, ${pulse})`;
        ctx.fillRect(0, 0, w, h);

        // Security scanning laser beam
        const laserY = (Math.sin(t * 3) * 0.5 + 0.5) * h;
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, laserY);
        ctx.lineTo(w, laserY);
        ctx.stroke();
      } else if (isSpeaking) {
        // Subtle warm studio vignette when actively speaking
        const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.0)');
        grad.addColorStop(1, 'rgba(30, 58, 138, 0.12)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      }
    } else {
      // Loading background fallback
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#64748B';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Initializing Live AI Video Stream...', w / 2, h / 2);
    }
  }

  // Mode 2: Cybernetic Neural 3D Hologram Agent
  function renderNeuralHologramAgent(ctx, canvas, t, swayX, swayY) {
    const w = canvas.width;
    const h = canvas.height;

    // Dark cybernetic grid background
    ctx.fillStyle = '#050814';
    ctx.fillRect(0, 0, w, h);

    // Glowing background radial gradient
    const bgGlow = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.55);
    bgGlow.addColorStop(0, state === 'warning' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(79, 70, 229, 0.3)');
    bgGlow.addColorStop(1, 'rgba(5, 8, 20, 0)');
    ctx.fillStyle = bgGlow;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2 + swayX * 1.5, h * 0.45 + swayY);

    // 1. Digital Torso & Shoulders
    ctx.strokeStyle = state === 'warning' ? '#F87171' : '#6366F1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-120, 180);
    ctx.lineTo(-70, 90);
    ctx.lineTo(70, 90);
    ctx.lineTo(120, 180);
    ctx.stroke();

    // 2. Holographic Head Silhouette (Geometric Neural Polygon Mesh)
    const headNodes = [
      { x: 0, y: -90 }, // Top
      { x: 45, y: -70 }, // Top Right
      { x: 65, y: -30 }, // Mid Right
      { x: 60, y: 30 }, // Jaw Right
      { x: 30, y: 75 }, // Chin Right
      { x: 0, y: 85 }, // Chin Tip
      { x: -30, y: 75 }, // Chin Left
      { x: -60, y: 30 }, // Jaw Left
      { x: -65, y: -30 }, // Mid Left
      { x: -45, y: -70 }, // Top Left
    ];

    ctx.fillStyle = state === 'warning' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(99, 102, 241, 0.1)';
    ctx.strokeStyle = state === 'warning' ? '#EF4444' : '#818CF8';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(headNodes[0].x, headNodes[0].y);
    for (let i = 1; i < headNodes.length; i++) {
      ctx.lineTo(headNodes[i].x, headNodes[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3. Connect Internal Wireframe Triangles
    ctx.strokeStyle = state === 'warning' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(129, 140, 248, 0.3)';
    ctx.lineWidth = 1;
    for (let i = 0; i < headNodes.length; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(headNodes[i].x, headNodes[i].y);
      ctx.stroke();
    }

    // 4. Glowing Cybernetic Eyes
    const eyeGlow = state === 'warning' ? '#FCA5A5' : '#38BDF8';
    ctx.fillStyle = eyeGlow;
    ctx.shadowColor = eyeGlow;
    ctx.shadowBlur = 10;

    // Left eye
    ctx.beginPath();
    ctx.arc(-26, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    // Right eye
    ctx.beginPath();
    ctx.arc(26, -15, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    // 5. Dynamic Audio-Reactive Mouth Aperture
    const mouthAperture = isSpeaking ? 6 + Math.sin(t * 16) * 5 + Math.sin(t * 24) * 3 : 2;
    ctx.strokeStyle = state === 'warning' ? '#F87171' : '#38BDF8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 40, 16, Math.max(1.5, mouthAperture), 0, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Neural Synapse Particles orbiting the agent head
    for (let i = 0; i < 6; i++) {
      const angle = t * 1.5 + (i * Math.PI) / 3;
      const radius = 105 + Math.sin(t * 3 + i) * 15;
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * (radius * 0.55);

      ctx.fillStyle = i % 2 === 0 ? '#60A5FA' : '#A78BFA';
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    // 7. Futuristic Telemetry Grid Lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;
    const gridStep = 40;
    for (let x = 0; x < w; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        background: '#020617',
        borderRadius: 8,
        overflow: 'hidden',
        aspectRatio: '16/9',
        border: state === 'warning' ? '2.5px solid #EF4444' : '1px solid #1E293B',
        boxShadow: state === 'warning' ? '0 0 20px rgba(239,68,68,0.35)' : '0 4px 14px rgba(0,0,0,0.3)',
      }}
    >
      {/* 3D Neural HR Avatar (Primary) or 2D Canvas Fallback */}
      {streamMode === '3d' ? (
        <ThreeAvatarCanvas
          avatarUrl={avatarUrl}
          state={state}
          isSpeaking={isSpeaking}
          onFpsUpdate={setFps}
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={640}
          height={360}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            objectFit: 'cover',
          }}
        />
      )}

      {/* TOP HUD: Live Agent Status & Telemetry (Only when showChrome is true) */}
      {showChrome && (
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            right: 10,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {/* Agent Name Tag */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(6px)',
              padding: '4px 10px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.1)',
              pointerEvents: 'auto',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                background: state === 'warning' ? '#EF4444' : isSpeaking ? '#10B981' : '#3B82F6',
                boxShadow: state === 'warning' ? '0 0 8px #EF4444' : isSpeaking ? '0 0 8px #10B981' : 'none',
              }}
            />
            <span>{agentName}</span>
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>({roleTitle})</span>

            {isSpeaking && (
              <span style={{ fontSize: 10, background: '#10B981', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Volume2 size={11} />
                <span>SPEAKING</span>
              </span>
            )}

            {state === 'warning' && (
              <span style={{ fontSize: 10, background: '#EF4444', color: '#fff', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                SECURITY CHALLENGE
              </span>
            )}
          </div>

          {/* Real Connection Status Indicator (No fake FPS badges) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, pointerEvents: 'auto' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                color: '#34D399',
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 4,
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: 3, background: '#10B981' }} />
              <span>Live Agent</span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM CAPTIONS / SUBTITLE OVERLAY */}
      {showChrome && caption && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            right: 10,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(6px)',
            padding: '8px 14px',
            borderRadius: 6,
            color: '#F8FAFC',
            fontSize: 12,
            lineHeight: 1.5,
            borderLeft: state === 'warning' ? '3px solid #EF4444' : '3px solid #3B82F6',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          <strong style={{ color: state === 'warning' ? '#F87171' : '#60A5FA' }}>
            {state === 'warning' ? 'HR Proctor Intervention: ' : `${agentName}: `}
          </strong>
          {caption}
        </div>
      )}
    </div>
  );
}
