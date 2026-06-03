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

# Import the existing embedding module
from ai.embedding import embedding as get_embedding

def diarizations(audio_array, sample_rate=16000):
    issue = [False, ""]

    # ─────────────────────────────────────────
    # 1. AI-Based VAD — Detect speech regions
    # ─────────────────────────────────────────
    model_vad = load_silero_vad()
    wav_tensor = torch.FloatTensor(audio_array)
    speech_timestamps = get_speech_timestamps(wav_tensor, model_vad, return_seconds=False)

    if not speech_timestamps:
        issue = [True, "No speech detected in the file."]
        return "", issue

    print(f"{len(speech_timestamps)} master speech segments detected via Silero VAD")

    # ─────────────────────────────────────────
    # 2. Extract embeddings using larger Sliding Windows
    # ─────────────────────────────────────────
    # Increased window_duration to 3.0s so SpeechBrain gets enough context to be accurate
    window_duration = 3.0 
    step_duration = 1.0   
    
    window_samples = int(window_duration * sample_rate)
    step_samples = int(step_duration * sample_rate)
    min_samples = int(1.5 * sample_rate) # Minimum context to accept a chunk

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
        issue = [True, "Not enough valid speech chunks detected for clustering"]
        return "", issue

    # ─────────────────────────────────────────
    # 3. Auto-detect number of speakers (Silhouette)
    # ─────────────────────────────────────────
    X = np.array(embeddings)
    best_k, best_score = 2, -1

    max_k = min(8, len(embeddings) // 2)
    max_k = max(max_k, 2)

    for k in range(2, max_k + 1):
        labels_test = AgglomerativeClustering(
            n_clusters=k,
            metric="cosine",
            linkage="average",
        ).fit_predict(X)

        score = silhouette_score(X, labels_test, metric="cosine")
        if score > best_score:
            best_score, best_k = score, k

    print(f"Estimated number of speakers: {best_k} (score={best_score:.3f})")

    min_score_multi_loc = 0.10
    if best_score < min_score_multi_loc:
        issue = [True, "There is likely only one speaker"]
        return "", issue

    # ─────────────────────────────────────────
    # 4. Final clustering
    # ─────────────────────────────────────────
    labels = AgglomerativeClustering(
        n_clusters=best_k,
        metric="cosine",
        linkage="average",
    ).fit_predict(X)

    # ─────────────────────────────────────────
    # 5. Sample-level Voting (Resolves overlaps & removes echo)
    # ─────────────────────────────────────────
    # Create a voting matrix: [number_of_samples, number_of_speakers]
    voting_grid = np.zeros((len(audio_array), best_k))
    
    for (sub_start, sub_end), lbl in zip(valid_segments, labels):
        voting_grid[sub_start:sub_end, lbl] += 1

    # Find the winning speaker index for each sample
    sample_speaker_labels = np.argmax(voting_grid, axis=1)
    # Total votes per sample to identify where speech actually happened
    total_votes_per_sample = np.sum(voting_grid, axis=1)

    # ─────────────────────────────────────────
    # 6. Reconstruct and export clean audio files
    # ─────────────────────────────────────────
    os.makedirs("output_speakers11", exist_ok=True)
    result = {}

    for lbl in range(best_k):
        # Target samples where this speaker won the vote AND speech was active
        speaker_mask = (sample_speaker_labels == lbl) & (total_votes_per_sample > 0)
        speaker_audio = audio_array[speaker_mask]
        
        # Ignore ghost/artifact clusters that are too short to be human speech (e.g. < 1s)
        if len(speaker_audio) < int(1.0 * sample_rate):
            print(f"Skipping artifact cluster SPEAKER_{lbl:02d} (too short)")
            continue
            
        buffer = io.BytesIO()
        sf.write(buffer, speaker_audio, samplerate=sample_rate, format="WAV", subtype="PCM_16")
        
        speaker_name = f"SPEAKER_{lbl:02d}"
        out_path = f"output_speakers11/{speaker_name}.wav"
        
        sf.write(out_path, speaker_audio, samplerate=sample_rate)
        
        duration_sec = len(speaker_audio) / sample_rate
        print(f"Saved: {out_path} ({duration_sec:.1f}s — reconstructed cleanly)")

        result[speaker_name] = {
            "audio": base64.b64encode(buffer.getvalue()).decode(),
            "duration": duration_sec
        }

    return result, issue