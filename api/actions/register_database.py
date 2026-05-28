from audio.conversion import conversion
from audio.processing import resample, process_audio
from ai.embedding import embedding
from database.Qdrant import insert_secure
from qdrant_client import QdrantClient
import bcrypt

client = QdrantClient(host="localhost", port=6333)

def register_database(audio_bytes: bytes, email, name, password):
    """
    Takes raw audio bytes and registers a speaker in the database
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio, issue = process_audio(audio, sr)

    if issue[0]:
        return {"name": None, "score": 0, "issue": issue[1]}

    emb = embedding(audio)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    insert_secure(client=client, base="voice_data_base", names=[name], emails=[email], vectors=[emb.tolist()], passwords=[hashed])
    return {"status": "success"}