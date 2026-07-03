"""
A python file in which is built our API fastAPI
"""

from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import Optional

from api.actions.clonage_voice import clonage_voice_CosyVoice
from api.actions.voice_similarity import voice_similarity, multi_similarity
from api.actions.register_database import register_database, add_voice_database
from api.actions.account_management import delete_voice_database, delete_compte
from api.actions.login import authenticate_user, clean_embedding
from api.actions.auth import verify_token
from api.actions.AudioToSpeech import AudioToSpeech
from api.actions.diarization import diarization_audio
from audio.conversion import conversion
from audio.processing import resample

from api.schemas import AddVoiceSchema, RegisterSchema, LoginSchema
from slowapi import Limiter
from slowapi.util import get_remote_address
import base64

#Command to run univcorn
# uvicorn api.api:app --host 0.0.0.0 --port 8000 --reload
# uvicorn api.api:app --host 127.0.0.1 --port 8000 --reload

#use this command to run univcorn with the reload option, it doesn't reload pretrained models.
# uvicorn api.api:app --reload-dir api --reload-exclude "pretrained_models/*"

#use this command to run univcorn without reload option
#uvicorn api.api:app --host 0.0.0.0 --port 8000


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000","http://localhost:5173"],
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
    
    diarization = diarization_audio(audio_bytes)

    if not diarization["success"]:
        raise HTTPException(status_code=422, detail=diarization["error"])

    if diarization["speaker_count"] == 1:
        print("One speaker detected - processing normally")
        try:
            speaker_data = diarization["result"]["SPEAKER_00"]
            audio_base64 = speaker_data["audio"]
            audio_bytes_decoded = base64.b64decode(audio_base64)
            
            audio_conv = conversion(audio_bytes_decoded)
            audio, sr = resample(audio_conv)
            
            voice_score = voice_similarity(audio, fromDiari=True)
            return JSONResponse(content={"status": "success", "data": voice_score})
        except Exception as e:
            print(f"Error in voice_similarity: {e}")
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=422, detail=str(e))

    if diarization["speaker_count"] > 1:
        print(f"🎙️ Multiple speakers detected ({diarization['speaker_count']})")
        audio_list = list(diarization["result"].values())
        voices_score, audios, oneSpeak = multi_similarity(audio_list)

        if oneSpeak:
            return JSONResponse(content={"status": "success", "data": voices_score[0]})

        return JSONResponse(content={
            "status": "multiple_speakers",
            "speaker_count": diarization["speaker_count"],
            "diarization": audios,
            "data": voices_score
        })


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
    
    resultat = add_voice_database(audio_bytes,email, audio_name)
    if resultat["issue"] != None:
        raise HTTPException(status_code=422, detail = resultat["issue"])

    
    return {"status":"success"}

@app.post("/delete_voice_db")
async def delete_voice_db(email:str=Form(...), audio_name:str=Form(...)):
    result = delete_voice_database(email, audio_name)
    if result.get("issue"):
        raise HTTPException(status_code=422, detail=result["issue"])
    return {"status": "success"}

@app.post("/delete_compte")
async def delete_compte_route(email:str=Form(...)):

    delete_compte(email)
    
    return {"status":"success"}

@app.post("/login")
@limiter.limit("5/minute")
async def login_route(
    request: Request,
    email : str = Form(...),
    password: Optional[str] = Form(None),
    file: Optional [UploadFile] = File(None)
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
    print(...)
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    print("Using CosyVoice for voice cloning")
    
    
    result = clonage_voice_CosyVoice(
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

    audio_clonage = result.audio_bytes
    compare_database = voice_similarity(audio_clonage)

    if not compare_database:
        score_clone = "N/A"
        score_name  = "N/A"
        score_audio = "N/A"
    else:
        score_clone = str(compare_database["score"])
        score_name  = str(compare_database["name"])
        score_audio = str(compare_database["audio_name"])

    audio_base64 = base64.b64encode(audio_clonage).decode('utf-8')

    return JSONResponse(content={
        "status": "success",
        "data": {
            "clone": {
                "audio": audio_base64,
                "duration": result.audio_duration_s
            },
            "metadata": {
                "generation_time_ms": result.generation_time_ms,
                "real_time_factor": result.real_time_factor,
                "score_clone": score_clone,
                "score_name": score_name,
                "score_audio_name": score_audio
            }
        }
    })


@app.post("/identify_live")
async def identify_live(file: UploadFile = File(...)):

    audio_bytes = await file.read()

    if len(audio_bytes) == 0:
        raise HTTPException(status_code=422, detail="Audio file is empty")

    if not file.filename.lower().endswith(ALLOWED_EXTENSIONS):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    try:
        # Même pipeline que /identify : conversion + resample, SANS denoise
        # (le denoise dégrade trop les chunks courts/faible SNR du live)
        audio_conv = conversion(audio_bytes)
        audio, sr = resample(audio_conv)

        # Chunk trop court = embedding pas fiable, on ignore plutôt que de mal scorer
        MIN_DURATION_SEC = 1.5
        if len(audio) / sr < MIN_DURATION_SEC:
            return JSONResponse(content={"status": "not_speaking"})

        voice_score = voice_similarity(audio, fromDiari=True, exact=False)

        if voice_score.get("issue"):
            if "No voice detected" in voice_score["issue"]:
                return JSONResponse(content={"status": "not_speaking"})
            return JSONResponse(content={"status": "error", "message": voice_score["issue"]})

        if voice_score["name"] == "unknown":
            return JSONResponse(
            content={
            "status": "success",
            "data": {
                "name": "unknown",
                "score": voice_score["score"]
            }
        }
    )


        return JSONResponse(content={"status": "success", "data": voice_score})

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=str(e))
