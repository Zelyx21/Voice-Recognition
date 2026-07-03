# 🎙️ Voice Recognition

> Speaker identification and voice cloning pipeline built with FastAPI, React, Qdrant, SpeechBrain, and CosyVoice3.

---

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the project](#running-the-project)
- [Troubleshooting](#troubleshooting)

---

## Overview

End-to-end voice recognition system combining speaker identification and voice cloning.

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | FastAPI, Python 3.10 |
| Speech recognition | Whisper |
| Speaker ID | SpeechBrain (ECAPA-TDNN) |
| Vector DB | Qdrant |
| Voice cloning | CosyVoice3 |
| ML framework | PyTorch (CUDA) |
| Containerization | Docker |

```
Voice-Recognition/
├── ai/model/spkrec-ecapa-voxceleb/      # SpeechBrain weights
├── api/api.py                            # FastAPI backend
├── CosyVoice/pretrained_models/         # CosyVoice3 weights
├── database/qdrant_storage/             # Qdrant persistent volume
├── website/voice-recognition/           # React + Vite frontend
└── scripts/download_models.py           # One-shot model downloader
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.10 | Backend & AI pipeline |
| Node.js | ≥ 18 (v24 recommended) | React frontend |
| Docker | Any recent version | Qdrant vector database |
| NVIDIA GPU + CUDA | CUDA 12.x recommended | GPU inference |
| FFmpeg | Latest stable | Audio conversion to WAV |

> **Windows only:** FFmpeg must be on your `PATH`.
> Download from [gyan.dev](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.7z), extract to `C:\ffmpeg`, and add `C:\ffmpeg\bin` to your system `PATH`.
> Verify with: `ffmpeg -version`

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/Zelyx21/Voice-Recognition.git
cd Voice-Recognition
```

### 2. Python environment

Create a virtual environment using Python 3.10:

```bash
python3.10 -m venv .venv
```

Activate it:

```bash
# Linux / macOS
source .venv/bin/activate

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 3. Install CosyVoice3

From the project root:

```bash
git clone --recursive https://github.com/FunAudioLLM/CosyVoice.git
cd CosyVoice
git submodule update --init --recursive
cd ..
```

### 4. Download pretrained models

A ready-to-run download script is included at `scripts/download_models.py`.
It handles all three required model snapshots in one command:

```bash
pip install huggingface_hub
python scripts/download_models.py
```

<details>
<summary>What does this script do?</summary>

```python
# scripts/download_models.py
from huggingface_hub import snapshot_download

models = {
    "FunAudioLLM/Fun-CosyVoice3-0.5B-2512": "CosyVoice/pretrained_models/Fun-CosyVoice3-0.5B",
    "FunAudioLLM/CosyVoice2-0.5B":           "CosyVoice/pretrained_models/CosyVoice2-0.5B",
    "FunAudioLLM/CosyVoice-ttsfrd":           "CosyVoice/pretrained_models/CosyVoice-ttsfrd",
}

for repo_id, local_dir in models.items():
    print(f"Downloading {repo_id} → {local_dir}")
    snapshot_download(repo_id, local_dir=local_dir)

print("All models downloaded successfully.")
```

</details>

> **Air-gapped / proxy environments:** If you are behind a corporate proxy or working offline, set `HF_HUB_OFFLINE=1` after the models have been downloaded once. See the [HuggingFace Hub docs](https://huggingface.co/docs/huggingface_hub/package_reference/environment_variables) for proxy configuration.

### 5. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 6. Install PyTorch with CUDA support

First, check your CUDA version:

```bash
nvidia-smi
```

Then install the matching PyTorch build. Replace `cu124` with your version (e.g. `cu121`, `cu118`):

```bash
python -m pip install torch==2.4.1+cu124 torchaudio==2.4.1+cu124 \
    --index-url https://download.pytorch.org/whl/cu124
```

> Visit [pytorch.org/get-started](https://pytorch.org/get-started/locally/) to find the right command for your CUDA version.


### 7. Frontend dependencies

```bash
cd website/voice-recognition
npm install
cd ../..
```

---

## Running the project

Start all three services in the following order:

**Step 1 — Start Qdrant** (from the `database/` directory):

```bash
cd database

# Linux / macOS
docker run -p 6333:6333 -p 6334:6334 \
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" \
    qdrant/qdrant

# Windows (PowerShell)
docker run -p 6333:6333 -p 6334:6334 `
    -v "$(pwd)/qdrant_storage:/qdrant/storage:z" `
    qdrant/qdrant
```

Once running, Qdrant exposes two interfaces:

| Interface | URL |
|-----------|-----|
| Dashboard (UI) | [http://localhost:6333/dashboard](http://localhost:6333/dashboard) |
| Collections API | [http://localhost:6333/collections](http://localhost:6333/collections) |

> Initialize the collection before starting the API — run `python database/create_collection.py` or use the dashboard.

**Step 2 — Start the FastAPI backend** (from the project root):

```bash
uvicorn api.api:app --host 0.0.0.0 --port 8000
```

**Step 3 — Start the React frontend** (from `website/voice-recognition/`):

```bash
npm run dev
```

The application is now running at: **[http://localhost:5173](http://localhost:5173)**

---

## Troubleshooting

**Frontend won't start after a failed `npm install`:**

```bash
Remove-Item -Recurse -Force node_modules   # Windows
rm -rf node_modules                         # Linux / macOS
rm package-lock.json
npm install
npm run dev
```

**CUDA not detected:**
Make sure `nvidia-smi` reports a valid GPU and that the CUDA version in your PyTorch install command matches exactly.

**Models download slowly or fail behind a proxy:**
Set `HTTPS_PROXY` and `HTTP_PROXY` environment variables before running `scripts/download_models.py`, or use the `huggingface-cli` with `--token` for authenticated downloads.

### Windows: WinError 1314 when downloading the SpeechBrain model

If you encounter:

```text
OSError: [WinError 1314] A required privilege is not held by the client
```

SpeechBrain is trying to create a symbolic link from the Hugging Face cache to the local model directory. Windows blocks symbolic links unless the required privileges are available.

You can fix this by using one of the following methods:

1. Enable **Developer Mode**
- Settings → Privacy & Security → For Developers
- Enable **Developer Mode**
- Restart your terminal.

2. Run your terminal (PowerShell, Windows Terminal or VS Code) as **Administrator**. 

3. Restart the API : uvicorn api.api:app --host 0.0.0.0 --port 8000
