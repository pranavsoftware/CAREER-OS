import urllib.request
import json

boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW"
with open("public/audio/samples/piper_en_gb_female_technical.wav", "rb") as f:
    file_bytes = f.read()

parts = [
    f"--{boundary}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"test.wav\"\r\nContent-Type: audio/wav\r\n\r\n".encode(),
    file_bytes,
    f"\r\n--{boundary}\r\nContent-Disposition: form-data; name=\"initial_prompt\"\r\n\r\nB-tree index, SQL query, PostgreSQL\r\n--{boundary}--\r\n".encode()
]
body = b"".join(parts)

req = urllib.request.Request(
    "http://localhost:3000/api/stt",
    data=body,
    headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
)

with urllib.request.urlopen(req, timeout=15) as r:
    print("Next.js /api/stt HTTP status:", r.status)
    resp = json.loads(r.read().decode())
    print("Response JSON:")
    print(json.dumps(resp, indent=2))
