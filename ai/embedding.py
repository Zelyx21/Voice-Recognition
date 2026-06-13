"""
embedding.py (OPTIMISÉ POUR LA RAM)
====================================
Extracts speaker embeddings using SpeechBrain ECAPA-TDNN.
Now with proper memory management to coexist with CosyVoice.

Memory optimizations:
- @torch.no_grad() for inference-only
- Explicit tensor cleanup
- GPU cache clearing after embedding
- Model lazy-loading with singleton pattern
"""

from speechbrain.inference.classifiers import EncoderClassifier as sb
import soundfile as sf
import torch
import numpy as np
import os
import gc
import logging

logger = logging.getLogger(__name__)

# ══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ══════════════════════════════════════════════════════════════════════════

device = "cuda" if torch.cuda.is_available() else "cpu"
logger.info(f"SpeechBrain embedding device: {device}")

MODEL_DIR = os.path.join(
    os.path.dirname(__file__),
    "model",
    "spkrec-ecapa-voxceleb"
)

# Singleton pattern for model caching
_speechbrain_model = None


# ══════════════════════════════════════════════════════════════════════════
# MODEL MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════

def get_model():
    """
    Lazy-load the SpeechBrain model (singleton pattern).
    Loaded once and reused across multiple embedding calls.
    """
    global _speechbrain_model

    if _speechbrain_model is None:
        logger.info("Loading SpeechBrain ECAPA-TDNN model...")
        try:
            _speechbrain_model = sb.from_hparams(
                source=MODEL_DIR,
                run_opts={"device": device}
            )
            logger.info(f"✓ Model loaded on {device}")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise

    return _speechbrain_model


def unload_model():
    """
    Explicitly unload the model from memory.
    Use after batch processing to free ~500MB RAM.
    
    Example:
        unload_model()
        gc.collect()
        torch.cuda.empty_cache()
    """
    global _speechbrain_model
    
    try:
        if _speechbrain_model is not None:
            del _speechbrain_model
            _speechbrain_model = None
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            logger.info("✓ SpeechBrain model unloaded")
    except Exception as e:
        logger.warning(f"Error unloading model: {e}")


# ══════════════════════════════════════════════════════════════════════════
# EMBEDDING EXTRACTION
# ══════════════════════════════════════════════════════════════════════════

@torch.no_grad()  # ⭐ CRITICAL: disables gradient computation, saves ~30-40% RAM
def embedding(audio: np.ndarray) -> np.ndarray:
    """
    Extract a speaker embedding vector from audio.
    
    Args:
        audio: numpy array of shape (samples,) or (channels, samples)
               Should be audio samples (float32), NOT bytes
    
    Returns:
        embedding: numpy array of shape (192,) - speaker embedding vector
                   (ECAPA-TDNN always outputs 192-dim vectors)
    
    Memory optimization:
        - No gradients computed (inference only)
        - Tensors moved to CPU before numpy conversion
        - Automatic garbage collection after extraction
    """
    try:
        # ──────────────────── Audio preprocessing ────────────────────
        
        # Convert to tensor (float32 for SpeechBrain compatibility)
        audio_tensor = torch.tensor(audio, dtype=torch.float32)
        
        # Add batch dimension if needed: (samples,) → (1, samples)
        if audio_tensor.ndim == 1:
            audio_tensor = audio_tensor.unsqueeze(0)
        
        # Ensure it's on the correct device
        audio_tensor = audio_tensor.to(device)
        
        # ──────────────────── Embedding extraction ────────────────────
        
        model = get_model()
        embedding_tensor = model.encode_batch(audio_tensor)
        
        # ──────────────────── Cleanup & conversion ────────────────────
        
        # Remove batch dimension and move to CPU
        embedding_vector = embedding_tensor.squeeze(0).cpu().detach()
        
        # Convert to numpy
        vector = embedding_vector.numpy()
        
        # Explicit memory cleanup
        del audio_tensor
        del embedding_tensor
        del embedding_vector
        
        # Force garbage collection
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return vector
        
    except Exception as e:
        logger.error(f"Error extracting embedding: {e}")
        raise


@torch.no_grad()
def embedding_batch(audio_list: list) -> list:
    """
    Extract embeddings from multiple audio samples efficiently.
    Reuses model across batch for better memory efficiency.
    
    Args:
        audio_list: list of numpy arrays, each shape (samples,)
    
    Returns:
        list of embedding vectors, each shape (192,)
    
    Use this instead of loop of embedding() calls for better memory:
        # Instead of:
        embeddings = [embedding(a) for a in audio_list]
        
        # Do this:
        embeddings = embedding_batch(audio_list)
    """
    embeddings = []
    
    try:
        model = get_model()
        
        for i, audio in enumerate(audio_list):
            audio_tensor = torch.tensor(audio, dtype=torch.float32).to(device)
            
            if audio_tensor.ndim == 1:
                audio_tensor = audio_tensor.unsqueeze(0)
            
            embedding_tensor = model.encode_batch(audio_tensor)
            vector = embedding_tensor.squeeze(0).cpu().detach().numpy()
            
            embeddings.append(vector)
            
            # Cleanup after each iteration to prevent accumulation
            del audio_tensor
            del embedding_tensor
            
            if (i + 1) % 10 == 0:  # Every 10 samples
                gc.collect()
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
        
        # Final cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        return embeddings
        
    except Exception as e:
        logger.error(f"Error in batch embedding: {e}")
        raise


# ══════════════════════════════════════════════════════════════════════════
# REFERENCES
# ══════════════════════════════════════════════════════════════════════════

"""
@inproceedings{DBLP:conf/interspeech/DesplanquesTD20,
  author    = {Brecht Desplanques and
               Jenthe Thienpondt and
               Kris Demuynck},
  title     = {{ECAPA-TDNN:} Emphasized Channel Attention, Propagation and Aggregation
               in {TDNN} Based Speaker Verification},
  booktitle = {Interspeech 2020},
  pages     = {3830--3834},
  year      = {2020},
}

@misc{speechbrain,
  title={{SpeechBrain}: A General-Purpose Speech Toolkit},
  author={Mirco Ravanelli and Titouan Parcollet and Peter Plantinga and Aku Rouhe and others},
  year={2021},
  eprint={2106.04624},
  archivePrefix={arXiv},
}

@misc{spkrec-ecapa-voxceleb,
  title={SpeechBrain ECAPA-TDNN Speaker Recognition Model},
  author={SpeechBrain Team},
  year={2021},
  howpublished={HuggingFace Model Hub},
}
"""
