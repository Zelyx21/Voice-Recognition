from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import search_similarity_attributes
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port = 6333)

def voice_similarity(audio_bytes:bytes):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)
    audio = vad(audio,sr)
    emb = embedding(audio)

    #change later to have more similar speakers ? 
    results = search_similarity_attributes(client=client, base="speakers", query_vector=emb.tolist(), top_k=1)

    #change later when it'll be a dictionnary
    return {"speaker_id":results[0][0], "score":results[0][1], "name":results[0][2], "email":results[0][3]}