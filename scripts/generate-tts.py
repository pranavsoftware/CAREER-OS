"""
Career-OS TTS Pre-generator
Pre-synthesizes all 25 interview questions and system announcements into public/audio/
using the selected Piper neural voice (en_gb_female).
Produces public/audio/manifest.json for instant static delivery with zero server latency.
"""

import json
import os
import re
import sys
import time
import wave
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "ai-service"))

from text_normalizer import normalize_for_tts

MODELS_DIR = ROOT_DIR / "ai-service" / "models"
AUDIO_DIR = ROOT_DIR / "public" / "audio"
QUESTIONS_DIR = AUDIO_DIR / "questions"
QUESTIONS_DIR.mkdir(parents=True, exist_ok=True)

ONNX_MODEL = MODELS_DIR / "en_US-kusal-medium.onnx"
CONFIG_FILE = MODELS_DIR / "en_US-kusal-medium.onnx.json"

SYSTEM_PROMPTS = [
    {
        "id": "sys_welcome",
        "filename": "welcome.wav",
        "text": "Hello! Welcome to your placement interview. I'm Vikram Malhotra, your technical HR partner. Feel relaxed, speak naturally like a colleague, and let's have a great conversation. Let's get started with our first question."
    },
    {
        "id": "sys_hands_up",
        "filename": "hands_up.wav",
        "text": "Excuse me, I noticed a change in your camera focus or tab. Please raise both hands clearly in front of the camera for a moment so we can verify your workspace and continue."
    },
    {
        "id": "sys_wrap_up",
        "filename": "wrap_up.wav",
        "text": "Thank you so much for your thoughtful answers. That completes our interview session today. I am now generating your comprehensive technical evaluation and placement feedback scorecard."
    }
]


def extract_questions_from_js():
    """Extracts questions directly from aiInterviewEngine.js using regex or node output."""
    js_path = ROOT_DIR / "src" / "lib" / "aiInterviewEngine.js"
    content = js_path.read_text(encoding="utf-8")

    # Match role blocks and question blocks
    questions = []
    # Pattern to find id and question fields
    pattern = re.compile(r"id:\s*'([a-z]{2}_q\d)',[\s\S]*?question:\s*'([^']+)'", re.MULTILINE)
    for match in pattern.finditer(content):
        q_id = match.group(1)
        q_text = match.group(2)
        questions.append({
            "id": q_id,
            "filename": f"{q_id}.wav",
            "text": q_text
        })
    return questions


def get_wav_duration(filepath):
    with wave.open(str(filepath), "rb") as w:
        frames = w.getnframes()
        rate = w.getframerate()
        return round(frames / float(rate), 2)


def main():
    if not ONNX_MODEL.exists() or not CONFIG_FILE.exists():
        print(f"Error: Model files not found in {MODELS_DIR}")
        sys.exit(1)

    print("=================================================================")
    print(" CAREER-OS TTS STATIC AUDIO PRE-GENERATOR")
    print(f" Model: en_GB-southern_english_female-low (Piper MIT)")
    print("=================================================================")

    from piper.voice import PiperVoice
    voice = PiperVoice.load(str(ONNX_MODEL), config_path=str(CONFIG_FILE))

    questions = extract_questions_from_js()
    all_items = SYSTEM_PROMPTS + questions
    print(f"Total items to synthesize: {len(all_items)} ({len(SYSTEM_PROMPTS)} system prompts, {len(questions)} questions)")

    manifest = {
        "voice": "en_gb_female",
        "model": "en_GB-southern_english_female-low",
        "license": "MIT (Commercial Use Allowed)",
        "sample_rate": 16000,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "prompts": {}
    }

    t_start = time.time()
    for idx, item in enumerate(all_items, 1):
        item_id = item["id"]
        raw_text = item["text"]
        norm_text = normalize_for_tts(raw_text)
        out_path = QUESTIONS_DIR / item["filename"]

        t0 = time.time()
        with wave.open(str(out_path), "wb") as wav_out:
            voice.synthesize_wav(norm_text, wav_out)
        gen_time = time.time() - t0

        duration = get_wav_duration(out_path)
        manifest["prompts"][item_id] = {
            "path": f"/audio/questions/{item['filename']}",
            "duration": duration,
            "raw_text": raw_text,
            "normalized_text": norm_text,
            "generation_time_s": round(gen_time, 2)
        }
        print(f"[{idx}/{len(all_items)}] {item_id}: {duration}s audio in {gen_time:.2f}s -> {item['filename']}")

    manifest_path = AUDIO_DIR / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    total_time = time.time() - t_start
    print("=================================================================")
    print(f" Completed {len(all_items)} audio files in {total_time:.2f}s!")
    print(f" Manifest saved to: {manifest_path}")
    print("=================================================================")


if __name__ == "__main__":
    main()
