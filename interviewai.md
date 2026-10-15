# Career-OS: 1-on-1 AI Placement Interview Agent Documentation

## 1. Executive Summary

The **AI Interview Agent** in Career-OS simulates an authentic, enterprise-grade 1-on-1 campus placement technical and behavioral interview. Rather than static text forms or robotic synthesizers, the system pairs each student with a photorealistic, articulated 3D corporate HR interviewer (**Ananya Sharma**, Lead Technical HR & Talent Partner) who conducts the session through natural neural speech, visual cues, live audio reception, and proctored coding challenges.

### HARD ARCHITECTURAL PRINCIPLE: ZERO THIRD-PARTY AI SERVICES
All artificial intelligence in Career-OS runs either **locally in the candidate's browser** (via WebAssembly / WebGL) or on our **self-hosted on-premise AI microservice** (`ai-service` on port 8000).
- ❌ No Google Cloud Speech-to-Text or Chrome `webkitSpeechRecognition` cloud endpoints.
- ❌ No OpenAI, Anthropic, Gemini, ElevenLabs, Azure, HeyGen, or D-ID APIs.
- ❌ Zero external vendor API keys or per-minute billing.
- 100% open-source models and libraries with commercial-friendly licenses (MIT / Apache-2.0).

---

## 2. Open-Source AI Model & Library Registry

| Component | Technology / Model | Location | License | Commercial Use | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Proctoring Vision** | MediaPipe Face Landmarker (468 3D points) | Browser WASM (`face_landmarker.task`) | Apache-2.0 | Allowed | Real-time 3D pitch/yaw gaze tracking, baseline calibration, phone detection |
| **Neural Speech (TTS)** | Piper Neural TTS (`en_GB-southern_english_female`) | Local ONNX (`ai-service`) | MIT | Allowed | Expressive, low-latency British female voice; pre-rendered 28 WAV questions |
| **Speech-to-Text (STT)** | `faster-whisper` (`whisper-base.en`, int8) | Local CTranslate2 (`ai-service`) | MIT / Apache-2.0 | Allowed | Private HTML5 MediaRecorder audio transcription on CPU (1.4s transcribe time) |
| **3D Avatar Engine** | Three.js WebGL (`hr-female.glb`) | Browser WebGL (`ThreeAvatarCanvas.jsx`) | MIT / CC-BY | Allowed | 3D corporate female HR interviewer with skeletal breathing, nodding & lip sync |
| **Semantic Evaluator** | `all-MiniLM-L6-v2` ONNX + local Ollama | Local ONNX / Ollama (`ai-service`) | Apache-2.0 | Allowed | Dense cosine similarity rubric grading, paraphrasing support, clarity & filler word analysis |

---

## 3. System Architecture

```
career-os/
├── src/
│   ├── views/student/
│   │   └── AiInterview.jsx            # State machine & voice-to-voice interview studio
│   ├── components/
│   │   ├── ThreeAvatarCanvas.jsx      # WebGL 3D articulated HR interviewer avatar
│   │   ├── LiveAiAgentStream.jsx      # Audio-reactive stream wrapper with HUD telemetry
│   │   ├── CameraVisionProctor.jsx    # MediaPipe 468-mesh gaze calibration & challenge proctor
│   │   └── LiveCodeEditor.jsx         # Anti-cheat coding challenge editor
│   ├── lib/
│   │   ├── audioService.js            # Web Audio API AnalyserNode & pre-rendered audio cache
│   │   └── aiInterviewEngine.js       # 25-question bank across 5 technical career tracks
│   └── app/api/
│       ├── tts/route.js               # Piper TTS synthesis & static audio fallback proxy
│       ├── stt/route.js               # faster-whisper private audio transcription proxy
│       └── ai-interview/evaluate/     # Semantic rubric grading proxy with fallback
├── ai-service/
│   ├── main.py                        # FastAPI self-hosted engine (ports: 8000)
│   ├── text_normalizer.py             # Technical acronym expansion & punctuation cadence
│   ├── evaluation_engine.py           # all-MiniLM-L6-v2 ONNX cosine rubric evaluator
│   ├── Dockerfile & docker-compose    # Containerized production deployment
│   └── models/                        # Preloaded Piper ONNX, Whisper int8 & MiniLM ONNX weights
└── public/
    ├── avatars/hr-female.glb          # 3.99 MB articulated 3D female HR model
    ├── audio/questions/*.wav          # 28 pre-rendered Piper studio question tracks
    └── audio/manifest.json            # Fast-lookup audio manifest
```

---

## 4. Phase-by-Phase Technical Capabilities

### 4.1 Phase 1: Zero-False-Positive MediaPipe Proctoring (`CameraVisionProctor.jsx`)
- **Problem Solved**: Previous skin-centroid heuristics falsely flagged candidates as "cheating" simply when looking at questions on their own monitor screen.
- **Implementation**:
  - Replaced ad-hoc skin counters with Google MediaPipe Face Landmarker (468 3D facial landmarks) running in local browser WebAssembly.
  - **3-Second Personalized Baseline Calibration**: Upon opening the camera, candidates look naturally at their screen while the system computes their personalized resting pitch/yaw center ($\mu \pm 2\sigma$).
  - **Dynamic Gaze Vector**: Accurately differentiates looking at the computer screen ($|\Delta\text{Pitch}| < 0.14$) vs. looking down at a mobile phone in the lap ($\Delta\text{Pitch} > 0.22$) or turning to a secondary monitor ($|\Delta\text{Yaw}| > 0.35$).
  - **3-Strike Progressive Challenge**:
    - *Strike 1 (3s)*: Amber warning banner on candidate video feed.
    - *Strike 2 (6s)*: Audible chime and interviewer verbal reminder.
    - *Strike 3 (9s)*: Formally initiates the 10-second on-screen hands-up verification challenge.

---

### 4.2 Phase 2: Neural Open-Source Piper TTS (`audioService.js` & `api/tts`)
- **Problem Solved**: Built-in `window.speechSynthesis` voices sounded robotic, inconsistent across operating systems, and mispronounced technical terminology like "SQL" and "useCallback".
- **Implementation**:
  - Benchmarked Piper TTS (`en_GB-southern_english_female-low.onnx`, MIT) executing in 0.08 Real-Time Factor (RTF) on standard CPU (~310ms latency).
  - Built `text_normalizer.py` expanding technical keywords into natural speech:
    - `"SQL"` $\to$ `"sequel"`
    - `"useCallback"` $\to$ `"use callback"`
    - `"useMemo"` $\to$ `"use memo"`
    - `"PostgreSQL"` $\to$ `"postgres Q L"`
    - `"LCP"` $\to$ `"largest contentful paint"`
  - **Pre-Generated Audio Cache**: Pre-rendered all 25 role questions + 3 standard security prompts into 22,050Hz 16-bit PCM `.wav` files at `public/audio/questions/`. Pre-generated questions load in **0 milliseconds** with zero runtime compute.
  - Implemented Web Audio API `AnalyserNode` in `audioService.js` driving the live equalizer bars and 3D avatar cadence.

---

### 4.3 Phase 3: Private Speech-to-Text via faster-whisper (`api/stt`)
- **Problem Solved**: Chrome's default `webkitSpeechRecognition` sends audio chunks to Google servers, violating privacy policies and failing on offline deployments.
- **Implementation**:
  - Replaced third-party speech recognition with standard HTML5 `MediaRecorder` streaming audio in `audio/webm;codecs=opus`.
  - Self-hosted `faster-whisper` (`base.en` with int8 quantization) in `ai-service/main.py`.
  - Transcribes voice answers in **1.4 seconds** with technical vocabulary conditioning (`initial_prompt` containing "React, Virtual DOM, B-tree, SQL, PostgreSQL, useCallback, LCP, CLS, Redux").
  - Automated mic handover: candidate's microphone activates automatically 300ms after Ananya finishes speaking.

---

### 4.4 Phase 4: Photorealistic 3D Female HR Interviewer (`ThreeAvatarCanvas.jsx`)
- **Problem Solved**: Replaced flat 2D canvas drawings with an articulated 3D female Indian HR interviewer (`hr-female.glb`).
- **Implementation**:
  - Rendered using Three.js WebGL with ACES Filmic tone mapping and a 3-point studio lighting rig (warm key light front-right, cool fill light front-left, cyan rim light overhead).
  - Positioned camera at $(0, 1.63, 0.76)$ targeting $(0, 1.63, 0)$ framing a natural corporate video call portrait.
  - **Articulated Skeletal Rig**:
    - `Spine1` & `Spine2`: Procedural 2.3-second breathing cycle.
    - `Neck` & `Head`: Natural micro-yaw and pitch life drift.
    - `Head`: Attentive listening nods when candidate speaks; speech-cadence gestures driven by real audio RMS levels.
    - `Warning State`: Firm forward posture and eye-contact when proctor challenges trigger.
  - **Performance Optimization**: Dedicated mode switcher allowing instantaneous toggle between **3D Realistic HR** (WebGL) and **2D Hologram** (Canvas).

---

### 4.5 Phase 5: Semantic Rubric-Based Answer Evaluation (`evaluation_engine.py`)
- **Problem Solved**: Fragile exact-keyword substring checking penalized candidates who explained concepts using alternative words or natural engineering analogies.
- **Implementation**:
  - **Two-Tiered Architecture**:
    1. *Primary (Local LLM)*: Queries local Ollama (`qwen3:8b`) with strict JSON schema if active and responsive (<3.5s).
    2. *Self-Hosted Semantic Embeddings Engine (`all-MiniLM-L6-v2` ONNX, Apache-2.0)*:
       - Runs in **~20 milliseconds** on CPU without GPU requirements.
       - Generates dense 384-dimensional sentence embeddings via mean pooling and L2 normalization.
       - Computes document-level cosine similarity against the reference model answer.
       - Decomposes candidate answer into individual sentences to measure cross-similarity against 3–5 explicit rubric key points.
       - **Communication Clarity Analysis**: Measures response length (optimal 45–220 words), penalizes conversational filler words (`um`, `uh`, `like`, `you know`), and rewards structured discourse markers (`first`, `second`, `specifically`, `because`, `for example`).
       - **Constructive Personalized Feedback**: Outputs concrete strengths, identified missing points, and actionable guidance for placement improvement.

---

## 5. Verification & Testing Guide

### 1. Test Self-Hosted AI Service Health
```bash
python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:8000/health').read().decode())"
```
*Expected Output*: `{"status":"ok","service":"Career-OS Self-Hosted AI Engine", ...}`

### 2. Test Semantic Paraphrased Evaluation
```bash
python scripts/test-evaluation.py
```
*Expected Output*: Test 1 (paraphrased Virtual DOM explanation) evaluates with Score > 80, covering all 4 rubric points with detailed praise.

### 3. Test Private Voice-to-Text Transcription
```bash
python scripts/test-api-stt.py
```
*Expected Output*: `HTTP 200 OK`, returning transcribed text in ~1.4 seconds with `model: whisper-base.en (local int8)`.

### 4. Run the Full Next.js Web App
Navigate to `http://localhost:3000/student/ai-interview`:
- Select any role (e.g. **Frontend / React Developer**).
- Click **Launch Placement Interview**.
- Watch **Ananya Sharma** speak the first question in crisp Piper neural voice with realistic 3D WebGL breathing, head-nodding, and audio equalizer.
- Speak your answer into the microphone; notice faster-whisper transcribe your speech privately.
- Click **Submit Answer** to see immediate, rubric-based semantic grading and feedback!
