"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from api.actions.voice_similarity import voice_similarity
from api.actions.voice_similarity import insert_secure


#Command to run univcorn
# uvicorn api.api:app --reload
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status":"running"}

@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return voice_similarity(audio_bytes)