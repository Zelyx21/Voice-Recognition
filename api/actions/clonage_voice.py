from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from qdrant_client import QdrantClient
from database.Qdrant import search_similarity_attributes
#from openvoice_clonage import openvoice_clonage
from VoxCPM_clonage import clonage_voxCPM

from fastapi.responses import StreamingResponse
import io
import soundfile as sf

from fastapi import FastAPI, UploadFile, File
from fastapi.responses import StreamingResponse
import io
import soundfile as sf

from VoxCPM_clonage import clonage_voxCPM

app = FastAPI()


client = QdrantClient(host="localhost", port = 6333)


@app.post("/clonage")
def clonage_voice_voxCPM(audio_bytes:bytes, language_text={"EN_NEWEST": "Did you ever hear a folk tale about a giant turtle?"}, speed=1.0):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    textes="En allant au marché je croise deux hommes accompagnés chacun de deux femmes accompagnées chacune de deux enfants. Combien de personnes vont au marché ?"
    print("API reception : OK")
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)

    print("Clonage send : OK")
    audio, sr, issue = clonage_voxCPM(audio, sr, textes, speed=speed)
    print("Clonage : OK")

    return {"clones": audio, "issue": issue}


async def clonage(file: UploadFile = File(...)):

    audio_bytes = await file.read()

    print("Clonage send : OK")
    audio, sr, issue = clonage_voxCPM(audio_bytes, )

    print("Clonage : OK")

    if issue[0]:
        return {"issue": issue[1]}

    buffer = io.BytesIO() 

    sf.write(buffer, audio, sr, format="WAV")

    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="audio/wav"
    )

