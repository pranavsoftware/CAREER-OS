import time
from faster_whisper import WhisperModel

print("Loading Whisper base.en from local directory ai-service/models/whisper-base.en...")
t0 = time.time()
model = WhisperModel("ai-service/models/whisper-base.en", device="cpu", compute_type="int8")
print(f"Model loaded in {time.time()-t0:.2f}s!")

sample_audio = "public/audio/samples/piper_en_gb_female_technical.wav"
t1 = time.time()
segments, info = model.transcribe(
    sample_audio,
    beam_size=5,
    initial_prompt="B-tree index, SQL query, PostgreSQL"
)
text = " ".join([s.text.strip() for s in segments]).strip()
transcribe_time = time.time() - t1

print("--- Transcription Result ---")
print(f"Text: \"{text}\"")
print(f"Language: {info.language} ({info.language_probability:.2f})")
print(f"Audio Duration: {info.duration:.2f}s")
print(f"Transcribe Time: {transcribe_time:.2f}s")
