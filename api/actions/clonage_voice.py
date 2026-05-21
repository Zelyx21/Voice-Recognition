from audio.conversion import conversion
from audio.conversion import ndarray_to_wav_bytes

from audio.processing import resample, denoise, vad
from qdrant_client import QdrantClient
from openvoice_clonage import openvoice_clonage

from fastapi.responses import StreamingResponse
import io
import soundfile as sf

from fastapi import FastAPI, UploadFile, File

#from CosyVoiceFunction import synthesize_zero_shot


app = FastAPI()
from fastapi.responses import JSONResponse, Response


client = QdrantClient(host="localhost", port = 6333)

def clonage_voice_CosyVoice(audio_bytes:bytes, model_clonage, text="You are testing a student project on voice recognition and voice cloning.", speed=1.0, prompt_text="", emotion=None, speaking_style=None, seed=None):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio_rs, sr = resample(raw)
    audio_dn = denoise(audio_rs,sr)
    audio_by = ndarray_to_wav_bytes(audio_dn, sr)


    if model_clonage == "zero_shot":
        return
        """return synthesize_zero_shot(prompt_audio_path=audio_by,
                                    text=text, prompt_text=prompt_text,
                                    emotion=emotion, speaking_style=speaking_style,
                                    speed=speed, seed=seed
                                    )"""
    
    elif model_clonage == "zero_shot2":
        return
    else:
        return
        JSONResponse(
            status_code=400,
            content={"issue": "Voice Cloning unknown"}
        )    


def voice_clonage_OpenVoice(audio_bytes:bytes, language="EN",speaker_key="EN_Newest", text="You are testing a student project on voice recognition and voice cloning.", speed=1.0):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    print("API reception : OK")
    raw = conversion(audio_bytes)
    audio_rs, sr = resample(raw)
    audio_dn = denoise(audio_rs,sr)
    audio_by = ndarray_to_wav_bytes(audio_dn, sr)
    audio, sr, issue = openvoice_clonage(audio_by, language, speaker_key, text, speed)

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

