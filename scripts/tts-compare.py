"""
Career-OS TTS Comparison Script
Synthesizes 3 standardized interview questions across candidate open-source models/voices
and calculates Real-Time Factor (RTF), output duration, and model licensing.
"""

import os
import sys
import time
import wave
from pathlib import Path

# Add project root and ai-service to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "ai-service"))

from text_normalizer import normalize_for_tts

# Standardized interview prompts
STANDARDIZED_PROMPTS = [
    {
        "id": "intro",
        "text": "Welcome to your interview. Let's start with a brief overview of your background."
    },
    {
        "id": "technical",
        "text": "Can you explain how a B-tree index optimizes SQL query performance?"
    },
    {
        "id": "scenario",
        "text": "That's an interesting approach. How would you handle race conditions in that scenario?"
    }
]

MODELS_DIR = ROOT_DIR / "ai-service" / "models"
SAMPLES_DIR = ROOT_DIR / "public" / "audio" / "samples"
SAMPLES_DIR.mkdir(parents=True, exist_ok=True)


def get_wav_info(filepath):
    with wave.open(str(filepath), "rb") as w:
        frames = w.getnframes()
        rate = w.getframerate()
        duration = frames / float(rate)
        return duration, rate


def run_piper_voice(voice_name, onnx_filename, json_filename):
    from piper.voice import PiperVoice

    onnx_path = MODELS_DIR / onnx_filename
    json_path = MODELS_DIR / json_filename

    if not onnx_path.exists() or not json_path.exists():
        print(f"[SKIP] Model files for {voice_name} not found.")
        return []

    print(f"\n--- Testing Piper: {voice_name} ---")
    voice = PiperVoice.load(str(onnx_path), config_path=str(json_path))

    results = []
    for idx, item in enumerate(STANDARDIZED_PROMPTS, 1):
        raw_text = item["text"]
        norm_text = normalize_for_tts(raw_text)
        out_file = SAMPLES_DIR / f"piper_{voice_name}_{item['id']}.wav"

        t0 = time.time()
        with wave.open(str(out_file), "wb") as wav_out:
            voice.synthesize_wav(norm_text, wav_out)
        synth_time = time.time() - t0

        duration, rate = get_wav_info(out_file)
        rtf = synth_time / duration if duration > 0 else 0

        rel_path = f"/audio/samples/{out_file.name}"
        results.append({
            "model": "Piper TTS",
            "voice": voice_name,
            "license": "MIT (Commercial Use Allowed)",
            "prompt_id": item["id"],
            "prompt_text": raw_text,
            "synth_time_s": round(synth_time, 2),
            "audio_duration_s": round(duration, 2),
            "rtf": round(rtf, 3),
            "sample_rate": rate,
            "file": rel_path
        })
        print(f"  [{idx}/3] {item['id']}: {duration:.2f}s audio in {synth_time:.2f}s (RTF: {rtf:.3f}) -> {rel_path}")

    return results


def main():
    print("=================================================================")
    print(" CAREER-OS OPEN-SOURCE TTS BENCHMARK & COMPARISON")
    print("=================================================================")

    all_results = []

    # 1. Piper: British English Female
    res_en_gb = run_piper_voice(
        "en_gb_female",
        "en_GB-southern_english_female-low.onnx",
        "en_GB-southern_english_female-low.onnx.json"
    )
    all_results.extend(res_en_gb)

    # 2. Piper: US English Female (Amy)
    res_en_us = run_piper_voice(
        "en_us_amy",
        "en_US-amy-medium.onnx",
        "en_US-amy-medium.onnx.json"
    )
    all_results.extend(res_en_us)

    # Save summary report to JSON
    import json
    report_path = SAMPLES_DIR / "comparison_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(all_results, f, indent=2)

    print("\n=================================================================")
    print(f" Saved benchmark report to {report_path}")
    print("=================================================================")


if __name__ == "__main__":
    main()
