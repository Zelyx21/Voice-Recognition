from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from qdrant_client import QdrantClient
from database.Qdrant import search_similarity_attributes
from openvoice_clonage import openvoice_clonage
from fastapi.responses import JSONResponse, Response


client = QdrantClient(host="localhost", port = 6333)

def voice_clonage(audio_bytes:bytes, language="EN",speaker_key="EN_Newest", text="You are testing a student project on voice recognition and voice cloning.", speed=1.0):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    audio, sr, issue = openvoice_clonage(audio_bytes, language, speaker_key, text, speed)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        print("Clonage error:", issue[1])
        return JSONResponse(
            status_code=400,
            content={"issue": issue[1]}
        )    
    print("Clonage successful, returning audio.")
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Content-Disposition": "inline; filename=clone.wav", "X-Issue": "false"}
    )


