"""
Career-OS Self-Hosted AI Service.
Provides open-source, local-only TTS (Piper neural ONNX) and future STT / evaluation endpoints.
Zero external vendor API calls. 100% private, on-premise AI.
"""

import io
import os
import time
import wave
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

from text_normalizer import normalize_for_tts

app = FastAPI(
    title="Career-OS AI Service",
    description="Self-hosted speech synthesis and AI proctoring backend",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = Path(__file__).resolve().parent / "models"

# Available voice definitions
VOICE_REGISTRY = {
    "indian_male": {
        "onnx": "en_US-kusal-medium.onnx",
        "json": "en_US-kusal-medium.onnx.json",
        "description": "Indian English Male - Vikram Malhotra (Warm, professional HR Partner)",
        "license": "MIT (Commercial Use Allowed)"
    },
    "en_gb_female": {
        "onnx": "en_GB-southern_english_female-low.onnx",
        "json": "en_GB-southern_english_female-low.onnx.json",
        "description": "British English Female (Clear, professional cadence)",
        "license": "MIT (Commercial Use Allowed)"
    },
    "en_us_amy": {
        "onnx": "en_US-amy-medium.onnx",
        "json": "en_US-amy-medium.onnx.json",
        "description": "US English Female - Amy (Warm, conversational)",
        "license": "MIT (Commercial Use Allowed)"
    }
}

# Cache loaded voice objects in memory for zero-latency inference
LOADED_VOICES = {}


def get_or_load_voice(voice_id: str):
    if voice_id in LOADED_VOICES:
        return LOADED_VOICES[voice_id]

    if voice_id not in VOICE_REGISTRY:
        voice_id = "indian_male"

    cfg = VOICE_REGISTRY[voice_id]
    onnx_path = MODELS_DIR / cfg["onnx"]
    json_path = MODELS_DIR / cfg["json"]

    if not onnx_path.exists() or not json_path.exists():
        raise HTTPException(
            status_code=503,
            detail=f"Model files for '{voice_id}' not found in {MODELS_DIR}"
        )

    from piper.voice import PiperVoice
    voice = PiperVoice.load(str(onnx_path), config_path=str(json_path))
    LOADED_VOICES[voice_id] = voice
    return voice


class TtsRequest(BaseModel):
    text: str
    voice: Optional[str] = "indian_male"
    normalize: Optional[bool] = True


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "Career-OS Self-Hosted AI Engine",
        "available_voices": list(VOICE_REGISTRY.keys()),
        "models_dir": str(MODELS_DIR)
    }


@app.get("/voices")
def list_voices():
    return {
        "voices": [
            {
                "id": k,
                "description": v["description"],
                "license": v["license"],
                "loaded": k in LOADED_VOICES
            }
            for k, v in VOICE_REGISTRY.items()
        ]
    }


@app.post("/tts")
def synthesize_speech(req: TtsRequest):
    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    voice_id = req.voice or "en_gb_female"
    voice = get_or_load_voice(voice_id)

    # Normalize technical terms and pauses if enabled
    text_to_speak = normalize_for_tts(req.text) if req.normalize else req.text.strip()

    t0 = time.time()
    wav_io = io.BytesIO()
    with wave.open(wav_io, "wb") as wav_out:
        voice.synthesize_wav(text_to_speak, wav_out)

    synth_time = time.time() - t0
    wav_io.seek(0)
    audio_bytes = wav_io.read()

    return Response(
        content=audio_bytes,
        media_type="audio/wav",
        headers={
            "X-Synthesis-Time-Ms": str(int(synth_time * 1000)),
            "X-Normalized-Text": text_to_speak[:100],
            "Cache-Control": "public, max-age=86400"
        }
    )


# --- SPEECH-TO-TEXT (STT) VIA FASTER-WHISPER ---
WHISPER_MODEL = None
WHISPER_MODEL_DIR = MODELS_DIR / "whisper-base.en"


def get_whisper_model():
    global WHISPER_MODEL
    if WHISPER_MODEL is None:
        from faster_whisper import WhisperModel
        model_target = str(WHISPER_MODEL_DIR) if WHISPER_MODEL_DIR.exists() else "base.en"
        WHISPER_MODEL = WhisperModel(model_target, device="cpu", compute_type="int8")
    return WHISPER_MODEL


@app.post("/stt")
async def speech_to_text(
    file: UploadFile = File(...),
    initial_prompt: Optional[str] = Form(None)
):
    import shutil
    import tempfile

    model = get_whisper_model()

    suffix = Path(file.filename or "recording.webm").suffix or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        t0 = time.time()
        prompt = initial_prompt or (
            "React, Virtual DOM, B-tree, SQL, PostgreSQL, JavaScript, "
            "useCallback, useMemo, LCP, CLS, Redux, JWT, Docker, Kubernetes"
        )
        segments, info = model.transcribe(
            tmp_path,
            beam_size=5,
            initial_prompt=prompt,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=400)
        )
        transcript = " ".join([seg.text.strip() for seg in segments]).strip()
        transcribe_time = round(time.time() - t0, 3)

        return {
            "transcript": transcript,
            "language": info.language,
            "language_probability": round(info.language_probability, 2),
            "duration": round(info.duration, 2),
            "transcribe_time_s": transcribe_time,
            "model": "whisper-base.en (local int8)"
        }
    finally:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except Exception:
                pass


# --- SEMANTIC RUBRIC EVALUATION ENDPOINT ---
from evaluation_engine import evaluate_student_answer, evaluate_with_embeddings


class EvaluateRequest(BaseModel):
    question: str
    model_answer: str
    rubric_points: Optional[list] = None
    student_answer: str
    stage: Optional[str] = "Technical Round"
    is_coding: Optional[bool] = False
    prefer_embeddings: Optional[bool] = False


@app.post("/evaluate")
def evaluate_answer_endpoint(req: EvaluateRequest):
    if not req.student_answer or not req.student_answer.strip():
        return {
            "score": 0,
            "technicalAccuracy": 0,
            "communicationClarity": 0,
            "completeness": 0,
            "isPassing": False,
            "feedback": "No verbal response was captured. Please speak or type your answer clearly.",
            "strengths": [],
            "improvements": ["Provide an answer addressing the question prompt to receive credit."],
            "keyPointsCovered": [],
            "keyPointsMissed": req.rubric_points or [],
            "evaluator": "empty_input_guard",
            "latency_ms": 0
        }

    rubric = req.rubric_points or [
        "Core architectural fundamentals and concepts",
        "Implementation mechanics and runtime flow",
        "Performance considerations and system tradeoffs"
    ]

    if req.prefer_embeddings:
        return evaluate_with_embeddings(
            question=req.question,
            model_answer=req.model_answer,
            rubric_points=rubric,
            student_answer=req.student_answer,
            stage=req.stage or "Technical Round"
        )

    return evaluate_student_answer(
        question=req.question,
        model_answer=req.model_answer,
        rubric_points=rubric,
        student_answer=req.student_answer,
        stage=req.stage or "Technical Round",
        is_coding=req.is_coding or False
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

