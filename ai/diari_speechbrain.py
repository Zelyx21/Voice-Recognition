import os
import numpy as np
from collections import defaultdict
import torch
import io
import base64
import soundfile as sf
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score
from silero_vad import load_silero_vad, get_speech_timestamps
from scipy.signal import medfilt

# Import the existing embedding module
from ai.embedding import embedding as get_embedding


def normalize_audio(audio_array):
    audio_norm = np.linalg.norm(audio_array, axis=1, keepdims=True)
    audio_norm[audio_norm == 0] = 1e-10  # Avoid division by zero
    return audio_array / audio_norm




def diarizations(audio_array, sample_rate=16000):
    issue = [False, ""]

    # 1. AI-Based VAD — Detect speech regions

    model_vad = load_silero_vad()
    wav_tensor = torch.FloatTensor(audio_array)
    speech_timestamps = get_speech_timestamps(wav_tensor, 
                                              model_vad, 
                                              return_seconds=False,
                                              threshold=0.5, #lower threshold = more speech detected (fewer missed words) but also more background noise leaking 
                                              min_speech_duration_ms=300, # ignore bursts shorter than 300 ms
                                              min_silence_duration_ms=100 # merge segments separated by < 100 ms of silence
                                              )

    if not speech_timestamps:
        issue = [True, "No speech detected in the file."]
        return "", issue

    print(f"{len(speech_timestamps)} master speech segments detected via Silero VAD")

    # Check total speech duration 
    total_speech_samples = sum(s["end"] - s["start"] for s in speech_timestamps)
    MIN_TOTAL_SPEECH_SEC = 4.0
    if total_speech_samples < int(MIN_TOTAL_SPEECH_SEC * sample_rate):
        issue = [True, f"Not enough speech detected (need at least {MIN_TOTAL_SPEECH_SEC}s)."]
        return "", issue

    # 2. Extract embeddings using larger Sliding Windows
    # Increased window_duration to 3.0s so SpeechBrain gets enough context to be accurate
    
    window_samples = int(3.0 * sample_rate) # 3.0s -> 48 000 samples at 16kHz
    step_samples = int(1.0  * sample_rate)
    min_samples = int(1.5 * sample_rate) # Minimum context to accept a chunk, reject chunks shorter than 1.5s


    embeddings = []
    valid_segments = []

    for segment in speech_timestamps:
        start_idx = segment['start']
        end_idx = segment['end']
        
        for sub_start in range(start_idx, end_idx, step_samples):
            sub_end = min(sub_start + window_samples, end_idx)
            
            if (sub_end - sub_start) < min_samples:
                continue
                
            chunk = audio_array[sub_start:sub_end]
            emb = get_embedding(chunk)
            embeddings.append(emb)
            valid_segments.append((sub_start, sub_end))

    print(f"{len(embeddings)} embeddings extracted using sliding windows")

    if len(embeddings) < 3:
        print("Not enough valid speech chunks detected for clustering")
        issue = [True, "One speaker"]
        return "", issue

    # 3. Auto-detect number of speakers (Silhouette)

    X = np.array(embeddings)
    X = normalize_audio(X)  # Normalize embeddings for cosine similarity

    best_k, best_score = 2, -1

    max_k = min(8, len(embeddings) // 2)
    max_k = max(max_k, 2)

    best_label = None
    for k in range(2, max_k + 1):
        labels_test = AgglomerativeClustering(
            n_clusters=k,
            metric="cosine",
            linkage="average",
        ).fit_predict(X)

        score = silhouette_score(X, labels_test, metric="cosine")
        if score > best_score:
            best_score, best_k = score, k
            best_label = labels_test

    print(f"Estimated number of speakers: {best_k} (score={best_score:.3f})")

    min_score_multi_loc = 0.13
    if best_score < min_score_multi_loc:
        issue = [True, "One speaker"]
        print(f"{issue[1]}" + f" (score={best_score:.3f} < {min_score_multi_loc})")

        return "", issue

    # 4. Final clustering
    if best_label is None:
        labels = AgglomerativeClustering(
            n_clusters=best_k,
            metric="cosine",
            linkage="average",
        ).fit_predict(X)
    else:
        labels = best_label

    # 5. Sample-level Voting (Resolves overlaps & removes echo)
    # Create a voting matrix: [number_of_samples, number_of_speakers]
    voting_grid = np.zeros((len(audio_array), best_k))
    
    for (sub_start, sub_end), lbl in zip(valid_segments, labels):
        voting_grid[sub_start:sub_end, lbl] += 1

    # Find the winning speaker index for each sample
    sample_speaker_labels = np.argmax(voting_grid, axis=1)
    # Total votes per sample to identify where speech actually happened
    total_votes_per_sample = np.sum(voting_grid, axis=1)

    """    
    # Median filter: kernel must be odd. 0.5s @ 16kHz = 8000 samples.
    # Replace each value over a duration of less than 0.5 sec with the local majority.
    kernel_size = int(0.5 * sample_rate)
    if kernel_size % 2 == 0:
        kernel_size += 1   # medfilt requires an odd kernel
 
    # medfilt expects float input; cast back to int after filtering
    sample_speaker_labels = medfilt(
        sample_speaker_labels.astype(np.float32), kernel_size=kernel_size
    ).astype(np.int32)
    """

    # 6. Reconstruct and export clean audio files
    result = {}

    for lbl in range(best_k):
        # Target samples where this speaker won the vote AND speech was active
        speaker_mask = (sample_speaker_labels == lbl) & (total_votes_per_sample > 0)
        speaker_audio = audio_array[speaker_mask]
        
        # Ignore ghost/artifact clusters that are too short to be human speech (e.g. < 1s)
        if len(speaker_audio) < int(3.0 * sample_rate):
            print(f"Skipping artifact cluster SPEAKER_{lbl:02d} (too short)")
            continue
            
        buffer = io.BytesIO()
        sf.write(buffer, speaker_audio, samplerate=sample_rate, format="WAV", subtype="PCM_16")
        
        speaker_name = f"SPEAKER_{lbl:02d}"
                
        duration_sec = len(speaker_audio) / sample_rate

        result[speaker_name] = {
            "audio": base64.b64encode(buffer.getvalue()).decode(),
            "duration": duration_sec
            
        }

    if len(result)==0:
        print("All the speeches last less than 3 seconds")
        issue = [True, "Not enough speech by speakers detected (need at least 3s/speaker)."]

    elif len(result)==1:
        issue = [True, "One speaker"]


    return result, issue



  