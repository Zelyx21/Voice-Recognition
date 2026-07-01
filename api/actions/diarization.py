from audio.conversion import conversion
from audio.processing import resample, denoise
from ai.diari_speechbrain import diarizations
import io
import soundfile as sf
import base64

def diarization_audio(audio_bytes: bytes):
    """
    Takes raw audio bytes and returns speaker segments
    
    Returns:
    {
        "success": bool,
        "error": str | None,        # Erreur réelle si elle existe
        "speaker_count": int,       # Nombre de speakers détectés
        "result": dict             # Les résultats (SPEAKER_00, SPEAKER_01, etc)
    }
    """

    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio, sr)

    result, issue = diarizations(audio)

    if issue[0]:
        return {
            "success": False,
            "error": issue[1],
            "speaker_count": 0,
            "result": {}
        }
    
    if issue[1] == "One speaker":
        # Limiter la durée max
        MAX_DURATION_SEC = 30.0
        max_samples = int(MAX_DURATION_SEC * sr)
        if len(audio) > max_samples:
            print(f"Truncating single speaker to {MAX_DURATION_SEC}s")
            audio = audio[:max_samples]
        
        # Encoder en base64
        buffer = io.BytesIO()
        sf.write(buffer, audio, samplerate=sr, format="WAV", subtype="PCM_16")
        
        return {
            "success": True,
            "error": None,
            "speaker_count": 1,
            "result": {
                "SPEAKER_00": {
                    "audio": base64.b64encode(buffer.getvalue()).decode(),
                    "duration": len(audio) / sr
                }
            }
        }

    return {
        "success": True,
        "error": None,
        "speaker_count": len(result),  # ou count des SPEAKER_XX
        "result": result
    }