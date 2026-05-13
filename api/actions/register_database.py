from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import insert_secure
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port = 6333)

def register_database(audio_bytes:bytes, email, name):
    """
    Takes raw audio bytes and returns a vector npy
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)
    audio, issue = vad(audio,sr)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}
    
    emb = embedding(audio)
    insert_secure(client=client, base="voice_data_base", names=[name], emails=[email], vectors=[emb.tolist()])
    return {"status": "success"}