"""
Python file which takes an audio wav and returns a vector
"""

from speechbrain.inference.classifiers import EncoderClassifier as sb
import soundfile as sf
import torch
import numpy

# ------------------charge the model-----------------------

device = "cuda" if torch.cuda.is_available() else "cpu"
speechbrain_model = sb.from_hparams(
    source="ai\\model\\spkrec-ecapa-voxceleb", run_opts={"device": device}
)

# ------------------charge the audio-----------------------
# modify for FastAPI
file = "test.wav"
input_file = "audio\\audio_output_processing\\" + str(file)
output_file = "ai\\vector\\"+str(file).rsplit(".", 1)[0]

# change the type of the audio to be compatible with speechbrain
audio, sr = sf.read(input_file)
audio = torch.tensor(audio).float()  # need float32 and not 64 for speechbrain/torch
if audio.ndim == 1:
    audio = audio.unsqueeze(
        0
    )  # add a dimension for speechbrain (piepline ECAPA-TDNN) (1, samples)

# ------------------get the vector-----------------------

with torch.no_grad():  # deactivate gradients to save memory and accelerate
    embedding = speechbrain_model.encode_batch(audio)

# ------------------clean the vector-----------------------

embedding = embedding.squeeze().cpu().numpy()
# squeeze comes back to dimension 1
# cpu deactivate the usage of gpu if it was used
# numpy converts it to a numpy to give it to Qdrant

# ------------------send the vector-----------------------

# send to FastAPI
numpy.save(output_file, embedding)

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
