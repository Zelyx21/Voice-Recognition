"""
Python file with functions to clean an audio file
"""

import soundfile as sf
from scipy import signal
import noisereduce as nr
from silero_vad import load_silero_vad, get_speech_timestamps
import numpy as np
import torch
import io
import threading

# ------------------------Resample the file---------------------------------------------

def resample(audio_bytes: bytes):
    """
    Takes raw audio bytes and resamples it at 16kHz
    """
    audio, sr = sf.read(io.BytesIO(audio_bytes))

    if audio.ndim == 2:
        audio = audio.mean(axis=1)

    if sr != 16000:
        samples = int(len(audio) * 16000 / sr)
        audio = signal.resample(audio, samples)

    return audio, 16000


# ------------------------VAD model — one instance per thread-----------------------
# Silero VAD keeps an internal state (_state) that is NOT thread-safe.
# Putting it on CUDA also breaks some STFT ops (NYI on GPU).
# Solution: CPU-only, one model instance per thread via threading.local().

_thread_local = threading.local()

def _get_vad_model():
    """Returns a thread-local VAD model instance (CPU)."""
    if not hasattr(_thread_local, "vad_model"):
        _thread_local.vad_model = load_silero_vad()
    return _thread_local.vad_model


def _get_timestamps(audio: np.ndarray, sr: int = 16000):
    """
    Internal helper: runs VAD once and returns speech timestamps.
    Uses a thread-local model instance to avoid state corruption.
    """
    model = _get_vad_model()
    wav = torch.FloatTensor(audio)  # CPU only — Silero STFT ops not supported on CUDA
    return get_speech_timestamps(wav, model, return_seconds=True)


# ------------------------Denoise + VAD in a single pass----------------------------

def process_audio(audio: np.ndarray, sr: int = 16000):
    """
    Replaces the separate denoise() + vad() calls.
    Runs VAD only once, then denoises, then cuts silences.

    Returns:
        clean_audio (np.ndarray): denoised audio with silences removed
        issue (list): [bool, str] — True if no speech detected
    """
    issue = [False, ""]

    # ---------- Single VAD pass ----------
    timestamps = _get_timestamps(audio, sr)

    if len(timestamps) == 0:
        issue = [True, "No voice detected in the audio file. Please provide a clearer audio file."]
        return audio, issue

    # ---------- Build silence mask from VAD timestamps ----------
    silence_mask = np.ones(len(audio), dtype=bool)
    for segment in timestamps:
        start = int(segment["start"] * sr)
        end = int(segment["end"] * sr)
        silence_mask[start:end] = False

    silence_audio = audio[silence_mask]

    # Fallback if not enough silence samples
    if len(silence_audio) < sr * 0.3:
        start_sample = audio[:int(sr * 0.15)]
        end_sample = audio[-int(sr * 0.15):]
        silence_audio = np.concatenate([start_sample, end_sample])

    # ---------- Adaptive denoise levels ----------
    noise_level = np.sqrt(np.mean(silence_audio ** 2))

    if noise_level < 0.01:    # studio
        stat, nonstat = 0.5, 0.4
    elif noise_level < 0.05:  # office
        stat, nonstat = 0.75, 0.6
    else:                     # open space / outside
        stat, nonstat = 0.9, 0.75

    audio_denoised = nr.reduce_noise(y=audio, sr=sr, stationary=True, prop_decrease=stat)
    audio_denoised = nr.reduce_noise(y=audio_denoised, sr=sr, stationary=False, prop_decrease=nonstat)

    # ---------- Cut silences using already-computed timestamps ----------
    clean_audio = []
    for segment in timestamps:
        start = int(segment["start"] * sr)
        end = int(segment["end"] * sr)
        clean_audio.append(audio_denoised[start:end])

    return np.concatenate(clean_audio), issue


# ------------------------Legacy functions (kept for compatibility)------------------

def denoise(audio: np.ndarray, sr: int = 16000):
    """Legacy wrapper — prefer process_audio() for new code."""
    clean, _ = process_audio(audio, sr)
    return clean


def vad(audio_denoised: np.ndarray, sr: int = 16000):
    """
    Legacy wrapper — prefer process_audio() for new code.
    Note: receives already-denoised audio, so it only cuts silences.
    """
    timestamps = _get_timestamps(audio_denoised, sr)
    issue = [False, ""]

    if len(timestamps) == 0:
        issue = [True, "No voice detected in the audio file. Please provide a clearer audio file."]
        return audio_denoised, issue

    clean_audio = []
    for segment in timestamps:
        start = int(segment["start"] * sr)
        end = int(segment["end"] * sr)
        clean_audio.append(audio_denoised[start:end])

    return np.concatenate(clean_audio), issue