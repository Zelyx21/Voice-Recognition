from pathlib import Path
import uuid

from qdrant_client import QdrantClient, models
from qdrant_client.models import PointStruct

from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding

# =====================================
# CONFIG
# =====================================

VOXFORGE_PATH = r"D:\Projet\Voice-Recognition\voxforge-es"
COLLECTION_NAME = "spanish_voice"

client = QdrantClient(host="localhost", port=6333)

# =====================================
# AUDIO PIPELINE
# =====================================

def clean_embedding(audio_bytes: bytes):

    raw = conversion(audio_bytes)

    audio, sr = resample(raw)

    audio = denoise(audio, sr)

    audio, issue = vad(audio, sr)

    if issue[0]:
        return None

    return embedding(audio)

# =====================================
# README PARSING
# =====================================

def parse_readme(readme_path):

    metadata = {
        "username": None,
        "gender": None,
        "age": None,
        "dialect": None,
    }

    if not readme_path.exists():
        return metadata

    with open(readme_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    for line in content.splitlines():

        if line.startswith("User Name:"):
            metadata["username"] = (
                line.replace("User Name:", "").strip()
            )

        elif line.startswith("Gender:"):
            metadata["gender"] = (
                line.replace("Gender:", "").strip()
            )

        elif line.startswith("Age Range:"):
            metadata["age"] = (
                line.replace("Age Range:", "").strip()
            )

        elif line.startswith("Pronunciation dialect:"):
            metadata["dialect"] = (
                line.replace(
                    "Pronunciation dialect:",
                    ""
                ).strip()
            )

    return metadata

# =====================================
# BUILD SPEAKER DATABASE
# =====================================

speakers = {}

for folder in Path(VOXFORGE_PATH).iterdir():

    if not folder.is_dir():
        continue

    parts = folder.name.split("-")
    if len(parts) < 2:
        continue

    username = parts[0]
    speaker_id = parts[1]

    wav_dir = folder / "wav"
    readme = folder / "etc" / "README"

    if not wav_dir.exists():
        continue

    metadata = parse_readme(readme)

    wavs = sorted(list(wav_dir.glob("*.wav")))

    if len(wavs) == 0:
        continue

    if username not in speakers:
        speakers[username] = {
            "speaker_id": speaker_id,
            "wavs": [],
            "gender": metadata["gender"],
            "age": metadata["age"],
            "dialect": metadata["dialect"],
        }

    speakers[username]["wavs"].extend(wavs)

# =====================================
# FILTER VALID SPEAKERS
# =====================================

valid_speakers = {}

for username, data in speakers.items():

    unique_wavs = list(set(data["wavs"]))

    if len(unique_wavs) < 2:
        continue

    data["wavs"] = sorted(unique_wavs)

    valid_speakers[username] = data

print()
print("VALID SPEAKERS:", len(valid_speakers))

# =====================================
# CREATE COLLECTION
# =====================================

try:
    client.delete_collection(COLLECTION_NAME)
except:
    pass

client.create_collection(
    collection_name=COLLECTION_NAME,
    vectors_config=models.VectorParams(
        size=192,
        distance=models.Distance.COSINE,
    ),
)

# =====================================
# ENROLLMENT
# =====================================

for username, data in valid_speakers.items():

    reference_wav = data["wavs"][0]

    print("INSERT:", username)

    try:

        with open(reference_wav, "rb") as f:
            audio_bytes = f.read()

        emb = clean_embedding(audio_bytes)

        if emb is None:
            print("SKIPPED")
            continue

        client.upsert(
        collection_name=COLLECTION_NAME,
        wait=True,
        points=[
            PointStruct(
                id=str(uuid.uuid4()),
                vector=emb,
                payload={
                    "username": username,
                    "speaker_id": data["speaker_id"],
                    "gender": data["gender"],
                    "age": data["age"],
                    "dialect": data["dialect"],
                    "reference_audio": reference_wav.name,
                },
            )
        ],
    )

    except Exception as e:
        print("ERROR:", e)

print()
print("DONE")