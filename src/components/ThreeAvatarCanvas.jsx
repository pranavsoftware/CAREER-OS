import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Loader2 } from 'lucide-react';
import { getSharedAudioLevel } from '../lib/audioService';

/**
 * Camera framing for avatar: centers on head bone with shoulders visible.
 */
export function frameHeadAndShoulders(camera, headBone, visibleHeight = 0.44) {
  if (!headBone || !camera) return;
  const head = new THREE.Vector3();
  headBone.getWorldPosition(head);
  camera.fov = 28;
  const dist = visibleHeight / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.set(head.x, head.y + 0.015, head.z + dist);
  camera.lookAt(head.x, head.y - 0.035, head.z); // Proper headroom above hair with shoulders framing the lower third
  camera.updateProjectionMatrix();
}

export default function ThreeAvatarCanvas({
  avatarUrl = '/avatars/hr-female.glb',
  state = 'listening', // 'listening' | 'speaking' | 'warning' | 'thinking'
  isSpeaking = false,
  audioLevel: propAudioLevel = 0,
  onFpsUpdate,
}) {
  const mountRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Keep references to dynamic state for 60fps render loop
  const animStateRef = useRef({ state, isSpeaking });
  useEffect(() => {
    animStateRef.current = { state, isSpeaking };
  }, [state, isSpeaking]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let isDisposed = false;
    let animFrameId = null;
    let mixer = null;
    let smoothedAudioLevel = 0;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827);

    // Realistic Executive Office Virtual Background
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/images/office_background.jpg',
      (texture) => {
        if (isDisposed) return;
        texture.colorSpace = THREE.SRGBColorSpace;
        scene.background = texture;
      },
      undefined,
      (err) => {
        console.warn('Office background texture load failed, using fallback:', err);
      }
    );

    const width = container.clientWidth || 400;
    const height = container.clientHeight || 280;

    // Camera will be calibrated by frameHeadAndShoulders once head bone loads
    const camera = new THREE.PerspectiveCamera(28, width / height, 0.1, 20);
    camera.position.set(0, 1.72, 0.65);
    camera.lookAt(0, 1.68, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Natural Executive Studio Lighting Rig for Office Environment
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.35);
    scene.add(ambientLight);

    // Key Light (Front Right window light)
    const keyLight = new THREE.DirectionalLight(0xfffaed, 2.2);
    keyLight.position.set(0.6, 2.2, 1.3);
    scene.add(keyLight);

    // Fill Light (Front Left soft fill)
    const fillLight = new THREE.DirectionalLight(0xe8eefa, 1.1);
    fillLight.position.set(-0.7, 1.9, 1.0);
    scene.add(fillLight);

    // Warm Hair/Shoulder Rim Light (Back overhead separation)
    const rimLight = new THREE.DirectionalLight(0xffeedd, 1.3);
    rimLight.position.set(0, 2.5, -0.8);
    scene.add(rimLight);

    // 3. Load 3D GLB Model
    const loader = new GLTFLoader();
    let bones = {
      head: null,
      neck: null,
      spine2: null,
      spine1: null,
      spine: null,
      leftArm: null,
      rightArm: null,
      leftForeArm: null,
      rightForeArm: null,
    };
    let baseRotations = {};
    let morphMeshes = [];
    let mouthMorphData = null;

    loader.load(
      avatarUrl || '/avatars/hr-female.glb',
      (gltf) => {
        if (isDisposed) return;
        const avatar = gltf.scene;
        avatar.position.set(0, 0, 0);

        // Find articulated bones, facial morph meshes, and extract mouth vertex deltas
        avatar.traverse((child) => {
          if (child.isMesh) {
            if (child.morphTargetDictionary && child.morphTargetInfluences) {
              morphMeshes.push(child);
            }

            // Extract high-precision procedural mouth articulation data for avaturn_body
            if (child.name === 'avaturn_body' && child.geometry?.attributes?.position) {
              try {
                const pos = child.geometry.attributes.position;
                const count = pos.count;
                const list = [];
                for (let i = 0; i < count; i++) {
                  const x = pos.getX(i);
                  const y = pos.getY(i);
                  const z = pos.getZ(i);
                  const dx = Math.abs(x);
                  if (dx < 0.045 && z > 0.065) {
                    if (y >= 1.575 && y <= 1.632) {
                      // Lower lip and jaw opening
                      const fx = Math.cos((dx / 0.045) * (Math.PI / 2));
                      const fy = Math.sin(((y - 1.575) / (1.632 - 1.575)) * Math.PI);
                      const w = fx * fy;
                      list.push({ index: i, origY: y, origZ: z, deltaY: -0.019 * w, deltaZ: 0.003 * w });
                    } else if (y > 1.632 && y <= 1.66) {
                      // Upper lip subtle lift
                      const fx = Math.cos((dx / 0.045) * (Math.PI / 2));
                      const fy = Math.sin(((y - 1.632) / (1.66 - 1.632)) * Math.PI);
                      const w = fx * fy;
                      list.push({ index: i, origY: y, origZ: z, deltaY: 0.005 * w, deltaZ: 0.0 });
                    }
                  }
                }
                mouthMorphData = { mesh: child, list };
              } catch (e) {
                console.warn('Mouth morph initialization error:', e);
              }
            }
          }
          if (child.isBone) {
            const nameLower = child.name.toLowerCase();
            if (nameLower === 'head') bones.head = child;
            else if (nameLower === 'neck') bones.neck = child;
            else if (nameLower === 'spine2') bones.spine2 = child;
            else if (nameLower === 'spine1') bones.spine1 = child;
            else if (nameLower === 'spine') bones.spine = child;
            else if (nameLower === 'leftarm') bones.leftArm = child;
            else if (nameLower === 'rightarm') bones.rightArm = child;
            else if (nameLower === 'leftforearm') bones.leftForeArm = child;
            else if (nameLower === 'rightforearm') bones.rightForeArm = child;
            else if (nameLower === 'lefthand') bones.leftHand = child;
            else if (nameLower === 'righthand') bones.rightHand = child;

            baseRotations[child.name] = child.rotation.clone();
          }
        });

        // Professional resting posture: arms naturally relaxed along the torso (no T-pose or reaching)
        if (bones.leftArm) bones.leftArm.rotation.set(1.32, 0, 0.08);
        if (bones.rightArm) bones.rightArm.rotation.set(1.32, 0, -0.08);
        if (bones.leftForeArm) bones.leftForeArm.rotation.set(0.20, 0, 0.06);
        if (bones.rightForeArm) bones.rightForeArm.rotation.set(0.20, 0, -0.06);
        if (bones.leftHand) bones.leftHand.rotation.set(0, 0, 0);
        if (bones.rightHand) bones.rightHand.rotation.set(0, 0, 0);

        // Calibrate camera framing centered on head bone with shoulders visible and headroom
        if (bones.head) {
          frameHeadAndShoulders(camera, bones.head, 0.44);
        }

        scene.add(avatar);
        setLoading(false);
      },
      undefined,
      (err) => {
        console.error('Failed to load 3D HR avatar model:', err);
        setLoadError('Could not load 3D avatar GLB file.');
        setLoading(false);
      }
    );

    // 4. Animation Loop
    const clock = new THREE.Clock();
    let lastFpsTime = performance.now();
    let frameCount = 0;

    const render = () => {
      if (isDisposed) return;

      const delta = clock.getDelta();
      const t = clock.getElapsedTime();
      const { state: curState, isSpeaking: speaking } = animStateRef.current;

      // Read audio frequency level directly from shared AnalyserNode with attack/release smoothing
      // (Removes React state re-renders and eliminates mouth jitter)
      const rawAudio = getSharedAudioLevel();
      const targetAudio = rawAudio > 0 ? rawAudio : (speaking ? (0.32 + Math.sin(t * 14) * 0.22) : 0);
      smoothedAudioLevel += (targetAudio - smoothedAudioLevel) * (targetAudio > smoothedAudioLevel ? 0.35 : 0.15);
      const level = smoothedAudioLevel;

      // Update animation mixer if present
      if (mixer) {
        mixer.update(delta);
      }

      // FPS tracking
      frameCount++;
      const now = performance.now();
      if (now - lastFpsTime >= 1000) {
        if (onFpsUpdate) {
          onFpsUpdate(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        }
        frameCount = 0;
        lastFpsTime = now;
      }

      // Procedural Human Rig Animation & Conversational Cadence
      if (bones.spine1 && baseRotations['Spine1']) {
        const base = baseRotations['Spine1'];
        // Natural chest breathing (2.4s cycle)
        const breath = Math.sin(t * 2.2) * 0.012;
        bones.spine1.rotation.x = base.x + breath;
      }

      if (bones.spine2 && baseRotations['Spine2']) {
        const base = baseRotations['Spine2'];
        const breath2 = Math.sin(t * 2.2 + 0.3) * 0.008;
        // Posture adjustment during security warning or confident speech
        const warningPosture = curState === 'warning' ? -0.04 : 0;
        bones.spine2.rotation.x = base.x + breath2 + warningPosture;
      }

      if (bones.neck && baseRotations['Neck']) {
        const base = baseRotations['Neck'];
        // Subtle natural idle drift
        const idleNeckPitch = Math.sin(t * 0.9) * 0.008;
        const idleNeckYaw = Math.cos(t * 0.7) * 0.012;
        bones.neck.rotation.x = base.x + idleNeckPitch;
        bones.neck.rotation.y = base.y + idleNeckYaw;
      }

      if (bones.head && baseRotations['Head']) {
        const base = baseRotations['Head'];
        // Natural life micro-movements
        const idlePitch = Math.sin(t * 1.1) * 0.012;
        const idleYaw = Math.cos(t * 0.8) * 0.015;
        const idleRoll = Math.sin(t * 0.6) * 0.006;

        let dynamicPitch = 0;
        let dynamicYaw = 0;
        let dynamicRoll = 0;

        // Attentive listening micro-nodding when candidate speaks
        if (curState === 'listening') {
          const nodCycle = Math.sin(t * 1.4);
          dynamicPitch = nodCycle > 0.65 ? Math.sin(t * 4.8) * 0.022 : 0;
        }

        // Live conversational talking gestures synchronized with speech & audio intensity
        if (speaking || level > 0.04) {
          const activeLevel = Math.max(0.2, level);
          // Conversational speech cadence nods & syllable pitch variations
          const speechNod = Math.sin(t * 12.5) * (0.035 * activeLevel) + Math.sin(t * 19.0) * (0.015 * activeLevel);
          // Natural conversational head gestures (talking side-to-side cadence)
          const speechYaw = Math.sin(t * 5.5) * 0.032;
          const speechTilt = Math.cos(t * 7.2) * 0.018;

          dynamicPitch += speechNod;
          dynamicYaw += speechYaw;
          dynamicRoll += speechTilt;
        }

        // Direct forward attention during proctor challenge
        if (curState === 'warning') {
          dynamicPitch += 0.028;
        }

        bones.head.rotation.x = base.x + idlePitch + dynamicPitch;
        bones.head.rotation.y = base.y + idleYaw + dynamicYaw;
        bones.head.rotation.z = base.z + idleRoll + dynamicRoll;
      }

      // Reinforce resting arm posture: naturally down along the torso (prevent T-pose or reaching)
      if (bones.leftArm) {
        bones.leftArm.rotation.set(1.32, 0, 0.08);
      }
      if (bones.rightArm) {
        bones.rightArm.rotation.set(1.32, 0, -0.08);
      }
      if (bones.leftForeArm) {
        bones.leftForeArm.rotation.set(0.20, 0, 0.06);
      }
      if (bones.rightForeArm) {
        bones.rightForeArm.rotation.set(0.20, 0, -0.06);
      }

      // Natural eye blinking every ~3.6s
      const blinkCycle = t % 3.6;
      let blinkVal = 0;
      if (blinkCycle < 0.16) {
        blinkVal = Math.sin((blinkCycle / 0.16) * Math.PI);
      }

      // Mouth opening synced to smoothed audio level and conversational speaking state
      const mouthVal = speaking || level > 0.03
        ? Math.min(1, Math.max(0, level * 2.8 + (speaking ? (0.45 + Math.sin(t * 14.0) * 0.35 + Math.sin(t * 7.5) * 0.15) : 0)))
        : 0;

      // Apply procedural mouth and jaw articulation directly on the avatar mesh
      if (mouthMorphData) {
        const { mesh, list } = mouthMorphData;
        const pos = mesh.geometry?.attributes?.position;
        if (pos) {
          for (let i = 0; i < list.length; i++) {
            const item = list[i];
            pos.setY(item.index, item.origY + item.deltaY * mouthVal);
            if (item.deltaZ) {
              pos.setZ(item.index, item.origZ + item.deltaZ * mouthVal);
            }
          }
          pos.needsUpdate = true;
        }
      }

      // Morph target influence fallback (if avatar mesh has native targets)
      for (let m = 0; m < morphMeshes.length; m++) {
        const mesh = morphMeshes[m];
        const dict = mesh.morphTargetDictionary;
        const inf = mesh.morphTargetInfluences;
        if (!dict || !inf) continue;

        // Eye blinks
        if (dict['eyeBlinkLeft'] !== undefined) inf[dict['eyeBlinkLeft']] = blinkVal;
        if (dict['eyeBlinkRight'] !== undefined) inf[dict['eyeBlinkRight']] = blinkVal;
        if (dict['eyesClosed'] !== undefined) inf[dict['eyesClosed']] = blinkVal;

        // Mouth / Visemes
        if (dict['jawOpen'] !== undefined) inf[dict['jawOpen']] = mouthVal;
        if (dict['mouthOpen'] !== undefined) inf[dict['mouthOpen']] = mouthVal;
        if (dict['viseme_aa'] !== undefined) inf[dict['viseme_aa']] = mouthVal * 0.85;
        if (dict['viseme_O'] !== undefined) inf[dict['viseme_O']] = mouthVal * 0.6;
      }

      renderer.render(scene, camera);
      animFrameId = requestAnimationFrame(render);
    };

    animFrameId = requestAnimationFrame(render);

    // 5. Handle Resize
    const handleResize = () => {
      if (!container || isDisposed) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      if (newWidth > 0 && newHeight > 0) {
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      isDisposed = true;
      if (animFrameId) cancelAnimationFrame(animFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
      scene.clear();
    };
  }, [onFpsUpdate]);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#0a0f1d',
      }}
    >
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            background: '#0a0f1d',
            color: '#94A3B8',
            fontSize: 13,
            fontWeight: 500,
            zIndex: 10,
          }}
        >
          <Loader2 size={24} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
          <span>Connecting to Career-OS Expert AI...</span>
        </div>
      )}

      {loadError && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0a0f1d',
            color: '#EF4444',
            fontSize: 12,
            padding: 16,
            textAlign: 'center',
            zIndex: 10,
          }}
        >
          {loadError}
        </div>
      )}
    </div>
  );
}
