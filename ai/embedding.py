"""
Python file which takes an audio wav and returns a vector
"""
import os
os.environ["SB_DISABLE_SYMLINKS"] = "1"


#from speechbrain.inference.classifiers import EncoderClassifier as sb
from speechbrain.pretrained import EncoderClassifier as sb
import soundfile as sf
import torch
import numpy as np

# ------------------charge the model-----------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
speechbrain_model = sb.from_hparams(
    source="ai\\model\\spkrec-ecapa-voxceleb", run_opts={"device": device}
)

def embedding(audio: np.ndarray):
    """
    Takes an audio bytes and returns a numpy embedding
    """
    # ------------------charge the audio-----------------------

    # change the type of the audio to be compatible with speechbrain
    audio = torch.tensor(audio).float()  # need float32 and not 64 for speechbrain/torch
    if audio.ndim == 1:
        audio = audio.unsqueeze(
            0
        )  # add a dimension for speechbrain (piepline ECAPA-TDNN) (1, samples)

    # ------------------get the vector-----------------------

    with torch.no_grad():  # deactivate gradients to save memory and accelerate because we don't train the model
        embedding = speechbrain_model.encode_batch(audio)

    # ------------------clean the vector-----------------------

    return embedding.squeeze().cpu().numpy()
    # squeeze comes back to dimension 1
    # cpu deactivate the usage of gpu if it was used
    # numpy converts it to a numpy to give it to Qdrant

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

@misc{spkrec-ecapa-voxceleb,
  title={SpeechBrain ECAPA-TDNN Speaker Recognition Model},
  author={SpeechBrain Team},
  year={2021},
  howpublished={HuggingFace Model Hub},
  note={https://huggingface.co/speechbrain/spkrec-ecapa-voxceleb}
}
"""
