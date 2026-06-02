
from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from ai.diari_speechbrain import diarizations


def diarization_audio(audio_bytes:bytes):

    """
    Takes raw audio bytes and returns a vector npy
    """

    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)

    result, issue = diarizations(audio)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"issue": issue[1], "audios":""}
    
    
    return {"issue":False, "audios": result}





