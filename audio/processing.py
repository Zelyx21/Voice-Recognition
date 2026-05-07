"""
Python file that take a wav file and :
    - resample it
    - denoise it
    - cut the gaps
"""

import librosa
import soundfile as sf
import noisereduce as nr
from silero_vad import load_silero_vad, read_audio, get_speech_timestamps
import numpy as np
import torch

# ------------------------Fetch the file------------------------------------------------
# Will modify for fastAPI
name_file = "test.wav"
input_path = "audio\\audio_output_conversion\\" + str(name_file)
output_path = "audio\\audio_output_processing\\" + str(name_file)

# ------------------------Resample the file---------------------------------------------

audio, sr = librosa.load(input_path, sr=16000)

# ------------------------Get an audio extract to adapt the denoise---------------------

model_vad = load_silero_vad()
wav_raw = torch.FloatTensor(audio)

timestamps_raw = get_speech_timestamps(wav_raw, model_vad, return_seconds=True)

# get the times when the audio has no voice
silence_mask = np.ones(len(audio), dtype=bool)
for segment in timestamps_raw:
    start = int(segment["start"] * sr)
    end = int(segment["end"] * sr)
    silence_mask[start:end] = False

silence_audio = audio[silence_mask]

# default if not enough "silence" (no voice)
if len(silence_audio) < sr * 0.3:  # if there is less than 3ms of silence
    silence_audio = audio[: int(sr * 0.3)]

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

# ------------------------Cut the gaps------------------------------------------------

wav = torch.FloatTensor(  # converts the audio to a tensor PyTorch needed for get_speech_timestamps
    audio_denoised
)
# get the timestamps
timestamps = get_speech_timestamps(wav, model_vad, return_seconds=True)

# cut silences and concatenate
clean_audio = []
for segment in timestamps:
    start = int(
        segment["start"] * sr
    )  # we multiply by sr to get the index (timestamps are in seconds and sr is the number of audio sample per sec)
    end = int(segment["end"] * sr)
    clean_audio.append(wav[start:end].numpy())

final_audio = np.concatenate(clean_audio)

# ------------------------Export the file (modify with fastAPI later)-------------------

sf.write(output_path, final_audio, 16000)
print("Finished !")
