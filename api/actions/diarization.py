"diarization.py"
from audio.conversion import conversion
from audio.processing import resample, denoise
from ai.diari_speechbrain import diarizations

def diarization_audio(audio_bytes: bytes):
    """
    Takes raw audio bytes and returns speaker segments
    """

    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio, sr)

    result, issue = diarizations(audio)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"issue": issue[0], "issue_info": issue[1], "result": {}}
            
    if issue[1] == "One speaker":
        # ← AJOUTE: Couper à 30s max et encoder en base64
        MAX_DURATION_SEC = 30.0
        max_samples = int(MAX_DURATION_SEC * sr)
        if len(audio) > max_samples:
            print(f"Truncating single speaker to {MAX_DURATION_SEC}s")
            audio = audio[:max_samples]
        
        # Encoder en base64 comme pour plusieurs speakers
        import io
        import soundfile as sf
        import base64
        
        buffer = io.BytesIO()
        sf.write(buffer, audio, samplerate=sr, format="WAV", subtype="PCM_16")
        
        result = {
            "SPEAKER_00": {
                "audio": base64.b64encode(buffer.getvalue()).decode(),
                "duration": len(audio) / sr
            }
        }
        return {"issue": False, "issue_info": "One speaker", "result": result}

    return {"issue": False, "issue_info": "several speakers", "result": result}


