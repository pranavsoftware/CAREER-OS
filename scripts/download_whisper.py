import os
import urllib.request
from pathlib import Path

BASE_URL = "https://huggingface.co/Systran/faster-whisper-base.en/resolve/main/"
DEST_DIR = Path("ai-service/models/whisper-base.en")
DEST_DIR.mkdir(parents=True, exist_ok=True)

FILES = ["config.json", "tokenizer.json", "vocabulary.txt", "model.bin"]

for f in FILES:
    dest_path = DEST_DIR / f
    if dest_path.exists() and dest_path.stat().st_size > 0:
        print(f"{f} already exists ({dest_path.stat().st_size} bytes).")
        continue

    url = BASE_URL + f
    print(f"Downloading {f} from {url}...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req) as resp, open(dest_path, "wb") as out:
        total = int(resp.headers.get("Content-Length", 0))
        downloaded = 0
        chunk_size = 1024 * 512
        while True:
            chunk = resp.read(chunk_size)
            if not chunk:
                break
            out.write(chunk)
            downloaded += len(chunk)
            if total > 0 and downloaded % (1024 * 1024 * 10) < chunk_size:
                print(f"  {f}: {downloaded / (1024*1024):.1f} / {total / (1024*1024):.1f} MB")
    print(f"Downloaded {f} ({dest_path.stat().st_size} bytes).")

print("All Whisper files downloaded successfully to", DEST_DIR)
