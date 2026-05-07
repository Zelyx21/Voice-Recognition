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



# ------------------------Denoise the file----------------------------------------------

audio_denoised = nr.reduce_noise(y=audio, sr=sr, stationary=True,prop_decrease=0.75)
audio_denoised = nr.reduce_noise(y=audio_denoised, sr=sr, stationary=False,prop_decrease=0.65)

# ------------------------Cut the gaps------------------------------------------------

model_vad = load_silero_vad()

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