# scripts/download_models.py
from huggingface_hub import snapshot_download

models = {
    "FunAudioLLM/Fun-CosyVoice3-0.5B-2512":  "CosyVoice/pretrained_models/Fun-CosyVoice3-0.5B",
    "FunAudioLLM/CosyVoice2-0.5B":           "CosyVoice/pretrained_models/CosyVoice2-0.5B",
    "FunAudioLLM/CosyVoice-ttsfrd":          "CosyVoice/pretrained_models/CosyVoice-ttsfrd",
    "speechbrain/spkrec-ecapa-voxceleb":     "ai/model/spkrec-ecapa-voxceleb",
}

for repo_id, local_dir in models.items():
    print(f"Downloading {repo_id} → {local_dir}")
    snapshot_download(repo_id, local_dir=local_dir)

print("All models downloaded successfully.")