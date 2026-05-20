"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from api.actions.voice_similarity import voice_similarity
from api.actions.register_database import register_database
from api.actions.clonage_voice import clonage_voice_voxCPM

from api.actions.login import login, clean_embedding
from api.actions.auth import verify_token
from api.schemas import RegisterSchema, LoginSchema
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

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
    try:
        RegisterSchema(name=name, email=email, password=password)
    except Exception as e:
        messages = [err["msg"].replace("Value error, ", "") for err in e.errors()]
        raise HTTPException(status_code=422, detail=", ".join(messages))
    
    if not file or not file.filename:
        raise HTTPException(status_code=422, detail="Please provide an audio file")
    
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail = "Audio file is empty")
    
    register_database(audio_bytes,email,name,password)
    return {"status":"success"}

@app.post("/clonage")
async def clonage(file: UploadFile = File(...), model_name: str = Form(...), 
                  cloneText: str = Form(...), cloneNationality: str = Form(...), 
                  textLanguage: str = Form(...), textSpeed: float = Form(...)
                  ):
    audio_bytes = await file.read() 
    print(f"Received file: {file.filename}, model_name: {model_name}, cloneText: {cloneText}, cloneNationality: {cloneNationality}, textLanguage: {textLanguage}, textSpeed: {textSpeed}")
    if model_name == "OpenVoice":
        return voice_clonage(audio_bytes, language=textLanguage, speaker_key=cloneNationality, text=cloneText, speed=textSpeed)
    else:
        return voice_clonage(audio_bytes, language=textLanguage, speaker_key=cloneNationality, text=cloneText, speed=textSpeed)
    
    
@app.post("/login")
@limiter.limit("5/minute")
async def login_route(
    request: Request,
    email : str = Form(...),
    password: str = Form(None),
    file : UploadFile = File(None)
):
    try:
        LoginSchema(email=email)
    except Exception as e:
        messages = [err["msg"].replace("Value error, ", "") for err in e.errors()]
        raise HTTPException(status_code=422, detail=", ".join(messages))
    
    if not password and not file:
        raise HTTPException(status_code=422, detail="Please provide a password or a voice recording")
    
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
