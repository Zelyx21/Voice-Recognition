"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from torch import Optional

from api.actions.clonage_voice import clonage_voice_CosyVoice, voice_clonage_OpenVoice
from api.actions.voice_similarity import voice_similarity
from api.actions.register_database import register_database, add_voice_database
from api.actions.gestion_database import delete_voice_database, delete_compte
from api.actions.login import authenticate_user, clean_embedding
from api.actions.auth import verify_token
from api.actions.AudioToSpeech import AudioToSpeech
from api.actions.diarization import diarization_audio

from api.schemas import AddVoiceSchema, RegisterSchema, LoginSchema
from slowapi import Limiter
from slowapi.util import get_remote_address


#Command to run univcorn
# uvicorn api.api:app --reload

#use this command to run univcorn with the reload option, it doesn't reload pretrained models.
# uvicorn api.api:app --reload-dir api --reload-exclude "pretrained_models/*"



#uvicorn api.api:app --host 0.0.0.0 --port 8000

#uvicorn api.api:app --reload --reload-dir api --reload-exclude "pretrained_models/*"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_EXTENSIONS = (
    ".opus",
    ".oga",
    ".mka",
    ".flac",
    ".webm",
    ".weba",
    ".wav",
    ".ogg",
    ".m4a",
    ".mid",
    ".mp3",
    ".aiff",
    ".wma",
    ".au"
)

limiter = Limiter(key_func=get_remote_address)

@app.get("/")
def root():
    return {"status":"running"}

@app.post("/identify")
async def identify(file: UploadFile = File(...)):
    audio_bytes = await file.read()

    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Unsupported audio format")
    return voice_similarity(audio_bytes)

@app.post("/registerdb")
async def registerdb(file: UploadFile = File(...), name:str=Form(...), email:str=Form(...), password:str=Form(...), audio_name:str=Form(...)):
    try:
        RegisterSchema(name=name, email=email, password=password, audio_name=audio_name)
    except Exception as e:
        messages = [err["msg"].replace("Value error, ", "") for err in e.errors()]
        raise HTTPException(status_code=422, detail=", ".join(messages))
    
    if not file or not file.filename:
        raise HTTPException(status_code=422, detail="Please provide an audio file")
    
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail = "Audio file is empty")
    
    register_database(audio_bytes,email, name, password, audio_name)
    return {"status":"success"}

@app.post("/add_voice_db")
async def add_voice_db(file: UploadFile = File(...), email:str=Form(...), audio_name:str=Form(...)):
    try:
        AddVoiceSchema(audio_name=audio_name, email=email)
    except Exception as e:
        messages = [err["msg"].replace("Value error, ", "") for err in e.errors()]
        raise HTTPException(status_code=422, detail=", ".join(messages))
    
    if not file or not file.filename:
        raise HTTPException(status_code=422, detail="Please provide an audio file")
    
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail = "Audio file is empty")
    
    add_voice_database(audio_bytes,email, audio_name)

    
    return {"status":"success"}

@app.post("/delete_voice_db")
async def delete_voice_db(email:str=Form(...), audio_name:str=Form(...)):

    delete_voice_database(email, audio_name)
    
    return {"status":"success"}

@app.post("/delete_compte")
async def delete_compte_route(email:str=Form(...)):

    delete_compte(email)
    
    return {"status":"success"}

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
        result = authenticate_user(email, password=password)
    elif file:
        audio_bytes = await file.read()
        vector = clean_embedding(audio_bytes)
        if isinstance(vector, dict):
            return vector
        result = authenticate_user(email, vector=vector)
    else:
        return {"issue": "Please provide a password or a voice recording"}
    return result



@app.post("/ASR")
async def ASR(file: UploadFile = File(...)):
    print(
        f"Received file: {file.filename}"
    )
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    transcript = AudioToSpeech(audio_bytes)

    return {"transcript": transcript}

@app.post("/diarization")
async def diarization(file: UploadFile = File(...)):
    print(
        f"Received file: {file.filename}"
    )
    audio_bytes = await file.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    diarization = diarization_audio(audio_bytes)

    return diarization


@app.post("/clonage")
async def clonage(
    file: UploadFile = File(...),
    model_name: str = Form(...),
    cloneText: str = Form(...),
    
    textSpeed: Optional[float] = Form(1.0),
    language: Optional[str] = Form(None),
    dialect: Optional[str] = Form(None),

    cloneMethod: Optional[str] = Form(None),
    transcriptAudio: Optional[str] = Form(None),    
    instruction: Optional[str] = Form(None),    
    emotion: Optional[str] = Form(None),          
    speakingStyle: Optional[str] = Form(None),    
):
    audio_bytes = await file.read()
    print(
        f"Received file: {file.filename}, model_name: {model_name}, "
        f"cloneText: {cloneText}, textSpeed: {textSpeed}, "
        f"cloneNationality: {language}, textLanguage: {dialect}, "
        f"promptText: {dialect}, emotion: {emotion}, speakingStyle: {speakingStyle}"
    )
 
    if model_name == "OpenVoice":
        return voice_clonage_OpenVoice(
            audio_bytes=audio_bytes,
            language=language,
            speaker_key=dialect,
            text=cloneText,
            speed=textSpeed
        )
 
    elif (model_name == "CosyVoice"):
        print("Using CosyVoice for voice cloning")
        return clonage_voice_CosyVoice(
            audio_bytes=audio_bytes,
            model_clonage=cloneMethod,
            text=cloneText,
            speed=textSpeed,
            language=language,
            dialect=dialect,

            transcriptAudio=transcriptAudio,
            instruction=instruction,
            emotion=emotion,
            speaking_style=speakingStyle,
        )
    else:
        raise HTTPException(status_code=422, detail="model name for cloning doesn't exist !")

    
    
