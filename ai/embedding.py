"""
Python file which takes an audio wav and returns a vector
"""

from speechbrain.inference.classifiers import EncoderClassifier as sb
from speechbrain.utils.fetching import LocalStrategy
import torch
import numpy as np

# ------------------charge the model-----------------------

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
speechbrain_model = sb.from_hparams(
    source="ai/model/spkrec-ecapa-voxceleb",
    savedir="ai/model/spkrec-ecapa-voxceleb",
    local_strategy=LocalStrategy.COPY,
    run_opts={"device": "cuda:0" if torch.cuda.is_available() else "cpu"}
)

# ------------------single embedding-----------------------

def embedding(audio: np.ndarray) -> np.ndarray:
    """
    Takes a single audio array and returns a numpy embedding.
    """
    tensor = torch.tensor(audio).float().to(device)

    if tensor.ndim == 1:
        tensor = tensor.unsqueeze(0)  # (1, samples)

    with torch.no_grad():
        emb = speechbrain_model.encode_batch(tensor)

    return emb.squeeze().cpu().numpy()


# ------------------batch embedding------------------------

def embedding_batch(audio_list: list[np.ndarray]) -> list[np.ndarray]:
    """
    Takes a list of audio arrays and returns a list of numpy embeddings.
    All audios are processed in a single GPU forward pass using padding.

    Args:
        audio_list: list of 1D np.ndarray (already preprocessed, 16kHz)

    Returns:
        list of 1D np.ndarray embeddings, same order as input
    """
    if len(audio_list) == 0:
        return []

    # --- pad to the same length so they can stack into a single tensor ---
    lengths = [len(a) for a in audio_list]
    max_len = max(lengths)

    padded = np.zeros((len(audio_list), max_len), dtype=np.float32)
    for i, audio in enumerate(audio_list):
        padded[i, :len(audio)] = audio

    # relative lengths needed by SpeechBrain for masked pooling
    rel_lengths = torch.tensor(
        [l / max_len for l in lengths], dtype=torch.float32
    ).to(device)

    tensor = torch.tensor(padded).to(device)  # (batch, samples)

    with torch.no_grad():
        embs = speechbrain_model.encode_batch(tensor, wav_lens=rel_lengths)
        # embs shape: (batch, 1, embedding_dim)

    return [embs[i].squeeze().cpu().numpy() for i in range(len(audio_list))]


# ------------------references-----------------------
"""
@inproceedings{DBLP:conf/interspeech/DesplanquesTD20,
  author    = {Brecht Desplanques and
               Jenthe Thienpondt and
               Kris Demuynck},
  editor    = {Helen Meng and
               Bo Xu and
               Thomas Fang Zheng},
  title     = {{ECAPA-TDNN:} Emphasized Channel Attention, Propagation and Aggregation
               in {TDNN} Based Speaker Verification},
  booktitle = {Interspeech 2020},
  pages     = {3830--3834},
  publisher = {{ISCA}},
  year      = {2020},
}

@misc{speechbrain,
  title={{SpeechBrain}: A General-Purpose Speech Toolkit},
  author={Mirco Ravanelli and Titouan Parcollet and Peter Plantinga and Aku Rouhe and Samuele Cornell and Loren Lugosch and Cem Subakan and Nauman Dawalatabad and Abdelwahab Heba and Jianyuan Zhong and Ju-Chieh Chou and Sung-Lin Yeh and Szu-Wei Fu and Chien-Feng Liao and Elena Rastorgueva and François Grondin and William Aris and Hwidong Na and Yan Gao and Renato De Mori and Yoshua Bengio},
  year={2021},
  eprint={2106.04624},
  archivePrefix={arXiv},
  primaryClass={eess.AS},
  note={arXiv:2106.04624}
}
"""