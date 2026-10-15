import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const destDir = path.join(rootDir, 'public', 'mediapipe');
const destWasmDir = path.join(destDir, 'wasm');

// Ensure destination directories exist
fs.mkdirSync(destWasmDir, { recursive: true });

// 1. Copy WASM and JS files from node_modules/@mediapipe/tasks-vision/wasm
const srcWasmDir = path.join(rootDir, 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
if (fs.existsSync(srcWasmDir)) {
  const files = fs.readdirSync(srcWasmDir);
  for (const file of files) {
    fs.copyFileSync(path.join(srcWasmDir, file), path.join(destWasmDir, file));
    console.log(`Copied ${file} -> public/mediapipe/wasm/`);
  }
} else {
  console.warn(`Source WASM dir not found at ${srcWasmDir}`);
}

// 2. Download face_landmarker.task if not already cached
const modelDest = path.join(destDir, 'face_landmarker.task');
if (!fs.existsSync(modelDest)) {
  console.log('Downloading face_landmarker.task for self-hosted MediaPipe...');
  const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';
  try {
    const res = await fetch(modelUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(modelDest, Buffer.from(buffer));
    console.log(`Saved face_landmarker.task (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB) to public/mediapipe/`);
  } catch (err) {
    console.error('Failed to download face_landmarker.task:', err.message);
  }
} else {
  console.log('face_landmarker.task already exists in public/mediapipe/');
}

// 3. Download hand_landmarker.task for workspace hands-up check if not cached
const handModelDest = path.join(destDir, 'hand_landmarker.task');
if (!fs.existsSync(handModelDest)) {
  console.log('Downloading hand_landmarker.task for self-hosted MediaPipe...');
  const handModelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
  try {
    const res = await fetch(handModelUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const buffer = await res.arrayBuffer();
    fs.writeFileSync(handModelDest, Buffer.from(buffer));
    console.log(`Saved hand_landmarker.task (${(buffer.byteLength / 1024 / 1024).toFixed(2)} MB) to public/mediapipe/`);
  } catch (err) {
    console.error('Failed to download hand_landmarker.task:', err.message);
  }
} else {
  console.log('hand_landmarker.task already exists in public/mediapipe/');
}

console.log('MediaPipe assets setup complete! All assets self-hosted in /public/mediapipe/');
