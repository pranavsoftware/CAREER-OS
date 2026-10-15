import os
import urllib.request
import sys

TARGET_DIR = os.path.join(os.path.dirname(__file__), '..', 'ai-service', 'models', 'all-MiniLM-L6-v2')
os.makedirs(TARGET_DIR, exist_ok=True)

FILES = {
    'model.onnx': 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx',
    'tokenizer.json': 'https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2/resolve/main/tokenizer.json',
}

def download_file(filename, url):
    dest_path = os.path.join(TARGET_DIR, filename)
    if os.path.exists(dest_path) and os.path.getsize(dest_path) > 1000:
        print(f"[SKIP] {filename} already exists ({os.path.getsize(dest_path)} bytes)")
        return dest_path
    
    print(f"[DOWNLOADING] {filename} from {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(dest_path, 'wb') as out_f:
        total = int(resp.headers.get('content-length', 0))
        downloaded = 0
        while True:
            chunk = resp.read(1024 * 64)
            if not chunk:
                break
            out_f.write(chunk)
            downloaded += len(chunk)
            if total > 0:
                percent = (downloaded / total) * 100
                sys.stdout.write(f"\r  {downloaded / 1024 / 1024:.1f}MB / {total / 1024 / 1024:.1f}MB ({percent:.1f}%)")
                sys.stdout.flush()
    print(f"\n[DONE] Saved {filename} to {dest_path}")
    return dest_path

if __name__ == '__main__':
    for name, url in FILES.items():
        download_file(name, url)
    print("\nAll MiniLM-L6-v2 assets successfully installed.")
