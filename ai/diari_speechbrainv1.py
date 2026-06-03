# speakerDia_speechbrain.py
import os
import numpy as np
from collections import defaultdict
from pydub import AudioSegment
from pydub.silence import detect_nonsilent
from sklearn.cluster import AgglomerativeClustering
from sklearn.metrics import silhouette_score

import soundfile as sf
import io
import base64

# Import the existing embedding module — avoids duplicating model loading
from ai.embedding import embedding as get_embedding

AUDIO_PATH = "ai/3_locuteurs_fixed.wav"


def diarizations(audio_input):

    issue = [False, ""]

    # ─────────────────────────────────────────
    # 1. VAD — Detect speech regions
    # ─────────────────────────────────────────

    #buffer = io.BytesIO(audio_input)
    #audio = AudioSegment.from_file(buffer)

    
    buffer = io.BytesIO()
    sf.write(buffer, audio_input, samplerate=16000, format="WAV")
    buffer.seek(0)
    audio = AudioSegment.from_file(buffer)
    
    
    #audio = AudioSegment.from_wav(audio_input)

    raw_segments = detect_nonsilent(
        audio,
        min_silence_len=300,
        silence_thresh=audio.dBFS - 16,
        seek_step=100,
    )

    # Keep only segments longer than 1 second to avoid noise bursts
    segments = [(s, e) for s, e in raw_segments if e - s >= 1000]

    if not segments:
        issue = [True, "No speech detected in the file."]
        raise RuntimeError("No speech detected in the file.")
    elif len(segments)<3:
        issue = [True, "Less than 3 segments detected"]
        return "", issue


    print(f"{len(segments)} speech segments detected")

    # ─────────────────────────────────────────
    # 2. Extract embeddings per segment
    # ─────────────────────────────────────────

    embeddings = []
    valid_segments = []

    for i, (start_ms, end_ms) in enumerate(segments):
        # Slice the segment and export to an in-memory buffer — no temp file needed
        segment_audio = audio[start_ms:end_ms]
        buffer = io.BytesIO()
        segment_audio.export(buffer, format="wav")
        buffer.seek(0)

        # Read raw samples from the buffer as float64, then pass to embedding()
        # soundfile returns (samples: np.ndarray, sample_rate: int)
        samples, _ = sf.read(buffer, dtype="float64")

        # get_embedding() handles float32 casting and unsqueeze internally
        emb = get_embedding(samples)

        embeddings.append(emb)
        valid_segments.append((start_ms, end_ms))

    print(f"{len(embeddings)} embeddings extracted")

    # ─────────────────────────────────────────
    # 3. Auto-detect number of speakers
    #    using silhouette score over k in [2, 7]
    # ─────────────────────────────────────────
    X = np.array(embeddings)
    best_k, best_score = 2, -1

    # Need at least 2*k samples to compute a meaningful silhouette score
    max_k = min(8, len(embeddings) // 2)
    max_k = max(max_k, 2)  # always test at least k=2

    for k in range(2, max_k + 1):
        labels_test = AgglomerativeClustering(
            n_clusters=k,
            metric="cosine",
            linkage="average",
        ).fit_predict(X)

        # Silhouette score: close to 1 = well-separated clusters
        # drops when k is too high (one speaker split) or too low (speakers merged)
        score = silhouette_score(X, labels_test, metric="cosine")
        print(f"  k={k}  silhouette={score:.3f}")

        if score > best_score:
            best_score, best_k = score, k

    print(f"\nEstimated number of speakers: {best_k}  (score={best_score:.3f})")

    min_score_multi_loc = 0.10
    if (best_score < min_score_multi_loc):
        issue = [True, "There is only one speaker"]
        return "", issue


    # ─────────────────────────────────────────
    # 4. Final clustering with the best k
    # ─────────────────────────────────────────
    labels = AgglomerativeClustering(
        n_clusters=best_k,
        metric="cosine",
        linkage="average",
    ).fit_predict(X)

    # ─────────────────────────────────────────
    # 5. Print results
    # ─────────────────────────────────────────
    print("\n─── Diarization results ───")
    for (start_ms, end_ms), label in zip(valid_segments, labels):
        print(
            f"start={start_ms / 1000:.1f}s  "
            f"stop={end_ms / 1000:.1f}s  "
            f"speaker=SPEAKER_{label:02d}"
        )

    # ─────────────────────────────────────────
    # 6. Merge adjacent segments and export WAVs
    # ─────────────────────────────────────────
    os.makedirs("output_speakers11", exist_ok=True)

    # Group all segments by speaker label
    groups = defaultdict(list)
    for (s, e), lbl in zip(valid_segments, labels):
        groups[lbl].append((s, e))

    result = {}

    for lbl, segs in groups.items():
        segs.sort()

        speaker_audio = AudioSegment.empty()

        for s, e in segs:
            speaker_audio += audio[s:e]


        buffer = io.BytesIO()
        speaker_audio.export(buffer, format="wav")

        speaker_name = f"SPEAKER_{lbl:02d}"
        
        out_path = f"output_speakers11/{speaker_name}.wav"
        speaker_audio.export(out_path, format="wav")
        print(f"Saved: {out_path} ({len(speaker_audio)/1000:.1f}s — {len(segs)} segments)")

        result[speaker_name] = {
        "audio": base64.b64encode(buffer.getvalue()).decode(),
        "duration": len(speaker_audio) / 1000
    }

    return result, issue
        
#diarizations(AUDIO_PATH)



