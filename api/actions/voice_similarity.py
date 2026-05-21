from audio.conversion import conversion
from audio.processing import resample, process_audio
from ai.embedding import embedding
from database.Qdrant import search_similarity_attributes
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port=6333)

def voice_similarity(audio_bytes: bytes):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio, issue = process_audio(audio, sr)

    if issue[0]:
        return {"name": None, "score": 0, "issue": issue[1]}

    emb = embedding(audio)

    results = search_similarity_attributes(client=client, base="voice_data_base", query_vector=emb.tolist(), top_k=1)
    return results[0]