
import base64
import sys
import tempfile
sys.path.append("./OpenVoice")

import torch
from openvoice import se_extractor
from openvoice.api import BaseSpeakerTTS, ToneColorConverter
import os
from melo.api import TTS
import soundfile as sf
import io

import nltk


def openvoice_clonage(audio:bytes, language_text={"EN_NEWEST": "Did you ever hear a folk tale about a giant turtle?"}, speed=1.0):

    issue = [False, ""] # default no issue

    ckpt_converter = 'OpenVoice/checkpoints_v2/converter'
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    

    tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
    tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio)
        tmp_path = tmp.name

    try:
        target_se, audio_name = se_extractor.get_se(tmp_path, tone_color_converter, vad=True)
    finally:
        os.remove(tmp_path)  

    results = {}

    for language, text in language_text.items():
        model = TTS(language=language, device=device)
        speaker_ids = model.hps.data.spk2id
        
        for speaker_key in speaker_ids.keys():
            speaker_id = speaker_ids[speaker_key]
            speaker_key = speaker_key.lower().replace('_', '-')
            
            source_se = torch.load(f'OpenVoice/checkpoints_v2/base_speakers/ses/{speaker_key}.pth', map_location=device)
            if torch.backends.mps.is_available() and device == 'cpu':
                torch.backends.mps.is_available = lambda: False
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as src_tmp, \
                 tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as out_tmp:
                src_path = src_tmp.name
                out_path = out_tmp.name

            try:
                model.tts_to_file(text, speaker_id, src_path, speed=speed)

                encode_message = "@MyShell"
                tone_color_converter.convert(
                    audio_src_path=src_path,
                    src_se=source_se,
                    tgt_se=target_se,
                    output_path=out_path,
                    message=encode_message
                )

                audio_data, sample_rate = sf.read(out_path)

                out_buffer = io.BytesIO()
                sf.write(out_buffer, audio_data, sample_rate, format='WAV')
                out_buffer.seek(0)

                results[speaker_key] = {
                    "audio": audio_data,
                    "sample_rate": sample_rate,
                    "buffer": out_buffer
                }

            finally:
                os.remove(src_path)
                os.remove(out_path)
    
    clones = {}
    for speaker_key, data in results.items():
        data["buffer"].seek(0)
        clones[speaker_key] = {
            "audio_b64": base64.b64encode(data["buffer"].read()).decode("utf-8"),
            "sample_rate": data["sample_rate"]
        }

    return clones, issue

