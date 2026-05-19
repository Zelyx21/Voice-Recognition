"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.actions.voice_similarity import voice_similarity
from api.actions.register_database import register_database
from api.actions.login import login, clean_embedding
from api.actions.auth import verify_token

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

@app.post("/registerdb")
async def registerdb(file: UploadFile = File(...), name:str=Form(...), email:str=Form(...), password:str=Form(...)):
    audio_bytes = await file.read()
    register_database(audio_bytes,email,name,password)
    return {"status":"success"}

@app.post("/login")
async def login_route(
    email : str = Form(...),
    password: str = Form(None),
    file : UploadFile = File(None)
):
    if password:
        result = login(email, password=password)
    elif file:
        audio_bytes = await file.read()
        vector = clean_embedding(audio_bytes)
        if isinstance(vector, dict):
            return vector
        result = login(email, vector=vector)
    else:
        return {"issue": "Please provide a password or a voice recording"}
    return result
