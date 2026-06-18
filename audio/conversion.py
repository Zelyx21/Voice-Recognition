"""
Python file which contains a function that converts an audio file to a wav
"""

import subprocess
import numpy as np
import soundfile as sf
import io
import base64

def conversion(audio:bytes):
    """
    Takes raw audio bytes and returns wav bytes
    """
    if is_wav(audio):
        return audio
    
    commande = ["ffmpeg","-i","pipe:0","-f","wav","pipe:1"]
    result = subprocess.run(commande, input=audio, capture_output=True)

    if result.returncode != 0:
        raise ValueError(f"ffmpeg error : {result.stderr.decode()}")
    
    return result.stdout

def is_wav(audio_bytes: bytes):
    if not isinstance(audio_bytes, (bytes, bytearray)):
        raise TypeError(f"is_wav watting bytes, recived : {type(audio_bytes)}")

    return (
        len(audio_bytes) > 12 and
        audio_bytes[:4] == b'RIFF' and
        audio_bytes[8:12] == b'WAVE'
    )

def ndarray_to_wav_bytes(audio: np.ndarray, sr: int = 16000) -> bytes:
    """
    Converts a numpy audio array (output of processing.py) to WAV bytes
    compatible with OpenVoice's se_extractor.
    """

    buffer = io.BytesIO()

    sf.write(buffer, audio, sr, format="WAV", subtype="PCM_16")
    buffer.seek(0)
    return buffer.read()


def ndarray_to_bytes(audio: np.ndarray, sr: int = 16000):
    buffer = io.BytesIO()

    sf.write(buffer, audio, samplerate=sr, format="WAV", subtype="PCM_16")
    
            
    return base64.b64encode(buffer.getvalue()).decode(),
