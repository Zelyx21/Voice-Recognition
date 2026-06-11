
import os
import sys

import numpy as np
import soundfile as sf
import tempfile

from OpenVoice.openvoice import se_extractor
from audio.conversion import conversion
from audio.conversion import ndarray_to_wav_bytes

from audio.processing import resample, denoise, vad
from OpenVoice.openvoice_clonage import openvoice_clonage

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

from CosyVoiceFunction import preset_instruct, synthesize_cross_lingual, synthesize_zero_shot, Emotion, SpeakingStyle, synthesize_instruct
from cosyvoice.cli.cosyvoice import AutoModel

# Modèle
MODEL_DIR = os.path.join(
    COSYVOICE_DIR,
    "pretrained_models",
    "Fun-CosyVoice3-0.5B"
)

cosyvoice_model = AutoModel(model_dir=MODEL_DIR)

from OpenVoice.openvoice_clonage import openvoice_clonage, load_openvoice_models

# Loaded once at server startup, alongside cosyvoice_model
_ov_converter, _ov_device = load_openvoice_models(device="cpu")

# Warm up the OpenVoice model to avoid long loading times on the first request
_warmup_fd, _warmup_path = tempfile.mkstemp(suffix=".wav")
os.close(_warmup_fd)
sf.write(_warmup_path, np.zeros(16000, dtype=np.float32), 16000)
try:
    se_extractor.get_se(_warmup_path, _ov_converter, vad=False)
except Exception:
    pass
finally:
    os.remove(_warmup_path)


app = FastAPI()
from fastapi.responses import JSONResponse, Response


#En allant au marché je croise deux hommes, accompagnés chacun de deux femmes, accompagnées chacune de deux enfants. Combien de personnes vont aux marché ?

def clonage_voice_CosyVoice(audio_bytes:bytes, model_clonage, text="You are testing a student project on voice recognition and voice cloning.", speed=1.0, transcriptAudio="", instruction="", emotion=None, speaking_style=None, language=None, dialect=None, seed=None):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio_rs, sr = resample(raw)
    audio_dn = denoise(audio_rs,sr)
    audio_by = ndarray_to_wav_bytes(audio_dn, sr)


    if model_clonage == "zero_shot":
        result = synthesize_zero_shot(model=cosyvoice_model,
                                    audio_bytes_reference=audio_by,
                                    text=text, prompt_text=transcriptAudio or "",
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
    
    elif model_clonage == "multilingual":
        result = synthesize_cross_lingual(model=cosyvoice_model,
                                    audio_bytes_reference=audio_by,
                                    prompt_text=text,seed=seed
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
                            audio_bytes_reference=audio_by, language=language,
                            dialect=dialect,
                            text=text, instruction=instruction,
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
    elif model_clonage == "preset_instruct":
        result = preset_instruct(model=cosyvoice_model,
                            audio_bytes_reference=audio_by, language=language,
                            dialect=dialect, emotion=emotion, speaker_style=speaking_style,
                            text=text,
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
    audio, sr, issue = openvoice_clonage(audio_by, language, speaker_key, text, speed, tone_color_converter=_ov_converter, device=_ov_device)

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

