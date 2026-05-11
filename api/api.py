"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile
from api.actions.voice_similarity import voice_similarity

app = FastAPI()

@app.get("/")
def root():
    return {"status":"running"}

@app.post("/identify")
async def identify(file: UploadFile):
    audio_bytes = await file.read()
    return voice_similarity(audio_bytes)