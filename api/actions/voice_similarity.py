from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding

def voice_similarity(audio_bytes:bytes):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    raw, sr = resample(raw)
    raw = denoise(raw)
    raw = vad(raw)
    