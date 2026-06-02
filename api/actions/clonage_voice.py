
import os
import sys

from audio.conversion import conversion
from audio.conversion import ndarray_to_wav_bytes

from audio.processing import resample, denoise, vad
from qdrant_client import QdrantClient
from openvoice_clonage import openvoice_clonage

from fastapi.responses import StreamingResponse
import io
import soundfile as sf

from fastapi import FastAPI, UploadFile, File


BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)

COSYVOICE_DIR = os.path.join(BASE_DIR, "CosyVoice")

sys.path.insert(0, COSYVOICE_DIR)
sys.path.insert(
    0,
    os.path.join(COSYVOICE_DIR, "third_party", "Matcha-TTS")
)

from CosyVoiceFunction import synthesize_zero_shot, Emotion, SpeakingStyle, synthesize_multilingual, synthesize_instruct
from cosyvoice.cli.cosyvoice import AutoModel

# Modèle
MODEL_DIR = os.path.join(
    COSYVOICE_DIR,
    "pretrained_models",
    "Fun-CosyVoice3-0.5B"
)

cosyvoice_model = AutoModel(model_dir=MODEL_DIR)

app = FastAPI()
from fastapi.responses import JSONResponse, Response


client = QdrantClient(host="localhost", port = 6333)
#En allant au marché je croise deux hommes, accompagnés chacun de deux femmes, accompagnées chacune de deux enfants. Combien de personnes vont aux marché ?

def clonage_voice_CosyVoice(audio_bytes:bytes, model_clonage, text="You are testing a student project on voice recognition and voice cloning.", speed=1.0, prompt_text="", emotion=None, speaking_style=None, language=None, dialect=None, seed=None):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio_rs, sr = resample(raw)
    audio_dn = denoise(audio_rs,sr)
    audio_by = ndarray_to_wav_bytes(audio_dn, sr)


    if model_clonage == "zero_shot":
        result = synthesize_zero_shot(model=cosyvoice_model,
                                    prompt_audio_path=audio_by,
                                    text=text, prompt_text=prompt_text or "",
                                    emotion=emotion, speaking_style=speaking_style,
                                    speed=speed, seed=seed
                                    )
        return Response(
        content=result.audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=clone.wav",
            "X-Issue": "false",
            "X-Generation-Time-Ms": str(result.generation_time_ms),
            "X-Audio-Duration-S": str(result.audio_duration_s),
            "X-RTF": str(result.real_time_factor),
        }
    )
    
    elif model_clonage == "multi-language":
        result = synthesize_multilingual(model=cosyvoice_model,
                                    prompt_audio_path=audio_by,
                                    text=text,seed=seed
                                    )

        return Response(
        content=result.audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=clone.wav",
            "X-Issue": "false",
            "X-Generation-Time-Ms": str(result.generation_time_ms),
            "X-Audio-Duration-S": str(result.audio_duration_s),
            "X-RTF": str(result.real_time_factor),
        }
    )   
    elif model_clonage == "synthesize_instruct":
        result = synthesize_instruct(model=cosyvoice_model,
                            prompt_audio_path=audio_by, language=language,
                            dialect=dialect,
                            text=text, instruction=prompt_text,
                            speed=speed, seed=seed
                            )

        return Response(
        content=result.audio_bytes,
        media_type="audio/wav",
        headers={
            "Content-Disposition": "inline; filename=clone.wav",
            "X-Issue": "false",
            "X-Generation-Time-Ms": str(result.generation_time_ms),
            "X-Audio-Duration-S": str(result.audio_duration_s),
            "X-RTF": str(result.real_time_factor),
        }
    )
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

