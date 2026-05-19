from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from qdrant_client import QdrantClient
from database.Qdrant import search_similarity_attributes
from openvoice_clonage import openvoice_clonage
from fastapi.responses import Response


client = QdrantClient(host="localhost", port = 6333)

def voice_clonage(audio_bytes:bytes, language={"EN_NEWEST": "Did you ever hear a folk tale about a giant turtle?"}, speed=1.0):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    audio, sr, issue = openvoice_clonage(audio_bytes)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}
    
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=clone.wav"}
    )


