
import numpy as np
import torch

def norm2L(audio_np):

    norm = np.linalg.norm(audio_np)

    if norm > 0 :
        audio_norm = audio_np / norm
    
    return audio_norm


def normPeak(audio_np):
    max_val = torch.max(torch.abs(audio_np))

    if max_val > 0 :
        audio_norm = audio_np / max_val
    
    return audio_norm

