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

MODEL_VAD = load_silero_vad()

# ------------------------Resample the file--------------------------------------------

def resample(audio_bytes:bytes):
    """
    Takes raw audio bytes and resamples it at 16kHz
    """
    audio, sr = sf.read(io.BytesIO(audio_bytes))

    if audio.ndim==2:
        audio = audio.mean(axis=1)
        
    if sr!=16000:
        samples = int(len(audio)*16000/sr)
        audio = signal.resample(audio,samples)
    return audio, 16000

# ------------------------Get an audio extract to adapt the denoise---------------------

def denoise(audio:np.ndarray, sr=16000):
    """
    Takes a numpy audio array at sample rate 16kHz and returns a denoised numpy array
    """

    wav_raw = torch.FloatTensor(audio)

    timestamps_raw = get_speech_timestamps(wav_raw, MODEL_VAD, return_seconds=True)

    # get the times where the audio has no voice
    silence_mask = np.ones(len(audio), dtype=bool)
    for segment in timestamps_raw:
        start = int(segment["start"] * sr)
        end = int(segment["end"] * sr)
        silence_mask[start:end] = False

    silence_audio = audio[silence_mask]

    # default if not enough "silence" (no voice)
    if len(silence_audio) < sr * 0.3:  # if there is less than 300ms of silence
        start_sample = audio[:int(sr * 0.15)]
        end_sample = audio[-int(sr * 0.15):]
        silence_audio = np.concatenate([start_sample, end_sample])

    # levels of denoise based on the silence audios
    noise_level = np.sqrt(
        np.mean(silence_audio**2)
    )  # Root mean square of the audio without the voices to measure the average power of the audio signal

    if noise_level < 0.01:  # like in a studio
        stat, nonstat = 0.5, 0.4
    elif noise_level < 0.05:  # like in an office
        stat, nonstat = 0.75, 0.6
    else:  # open space, outside, ...
        stat, nonstat = 0.9, 0.75


    # ------------------------Denoise the file----------------------------------------------

    audio_denoised = nr.reduce_noise(y=audio, sr=sr, stationary=True, prop_decrease=stat)
    audio_denoised = nr.reduce_noise(y=audio_denoised, sr=sr, stationary=False, prop_decrease=nonstat)

    return audio_denoised


def vad(audio_denoised:np.ndarray, sr=16000):
    """
    Takes a numpy audio array and returns it without the gaps
    """
        
    # ------------------------Cut the gaps------------------------------------------------
    wav = torch.FloatTensor(  # converts the audio to a tensor PyTorch needed for get_speech_timestamps
        audio_denoised
    )
    # get the timestamps
    timestamps = get_speech_timestamps(wav, MODEL_VAD, return_seconds=True)

    issue = [False, ""]
    if len(timestamps) == 0: # if there is no voice detected, we raise an issue
        issue = [True, "No voice detected in the audio file. Please provide a clearer audio file."]
        return audio_denoised, issue
    
    # cut silences and concatenate
    clean_audio = []
    for segment in timestamps:
        start = int(
            segment["start"] * sr
        )  # we multiply by sr to get the index (timestamps are in seconds and sr is the number of audio sample per sec)
        end = int(segment["end"] * sr)
        clean_audio.append(wav[start:end].numpy())

    return np.concatenate(clean_audio), issue