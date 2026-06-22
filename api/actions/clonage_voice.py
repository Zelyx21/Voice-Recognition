
import os
import sys

from audio.conversion import ndarray_to_wav_bytes, conversion
from audio.processing import resample, denoise

from fastapi import FastAPI

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
app = FastAPI()
from fastapi.responses import JSONResponse

#Ceci est un projet de reconnaissance vocale qui permet également le clonage de voix. Ce projet est mené dans le cadre d'un stage dans l'entreprise Dell Technologie. 
#En allant au marché je croise deux hommes, accompagnés chacun de deux femmes, accompagnées chacune de deux enfants. Combien de personnes vont aux marché ?

def clonage_voice_CosyVoice(audio_bytes:bytes, model_clonage, text="You are testing a student project on voice recognition and voice cloning.", speed=1.0, transcriptAudio="", instruction="", emotion=None, speaking_style=None, language=None, dialect=None, seed=None):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    print("model", model_clonage)

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
    
    elif model_clonage == "multilingual":
        result = synthesize_cross_lingual(model=cosyvoice_model,
                                    audio_bytes_reference=audio_by,
                                    prompt_text=text,seed=seed
                                    )

    elif model_clonage == "synthesize_instruct":
        result = synthesize_instruct(model=cosyvoice_model,
                            audio_bytes_reference=audio_by, language=language,
                            dialect=dialect,
                            text=text, instruction=instruction,
                            speed=speed, seed=seed
                            )

    elif model_clonage == "preset_instruct":
        result = preset_instruct(model=cosyvoice_model,
                            audio_bytes_reference=audio_by, language=language,
                            dialect=dialect, emotion=emotion, speaker_style=speaking_style,
                            text=text,
                            speed=speed, seed=seed
                            )

    else:
        JSONResponse(
            status_code=400,
            content={"issue": "Voice Cloning unknown"}
        )    
    
    return result




