
import os

import sys
import tempfile

from types import ModuleType

# SpeechBrain 1.x lazy imports crash if optional deps (k2, nlp, etc.) aren't installed.
# Stub them out so the import chain doesn't fail.
_SPEECHBRAIN_STUBS = [
    "speechbrain.integrations.k2_fsa",
    "speechbrain.integrations.nlp",
    "speechbrain.integrations.huggingface",
    "speechbrain.integrations.huggingface.wordemb",
    "speechbrain.k2_integration",
    "speechbrain.wordemb",
    "speechbrain.lobes.models.huggingface_transformers",
]
for _mod in _SPEECHBRAIN_STUBS:
    if _mod not in sys.modules:
        sys.modules[_mod] = ModuleType(_mod)


sys.path.append("./OpenVoice")


from fastapi.responses import JSONResponse
import torch
from openvoice import se_extractor
from openvoice.api import BaseSpeakerTTS, ToneColorConverter
import os
from melo.api import TTS
import soundfile as sf
import io

import nltk


def openvoice_clonage(audio: bytes,
    language: str = "FR",
    speaker_key: str = "FR",  #see checkpoints_v2/base_speakers/ses for the available speakers
    text: str = "Vous testez un projet étudiant sur la reconnaissance vocale et la clonage de voix.",
    speed: float = 1.0,
):
    """
    Clones the voice from the input audio using OpenVoice 
    Language : British English (EN_NEWEST), American English (EN), Spanish (ES), French (FR), Chinese (ZH), Japanese (JP), Korean (KR)
    speaker_key : see checkpoints_v2/base_speakers/ses for the available speakers, ex: EN-Newest, Australian English (EN_AU), 
    """

    issue = [False, ""] # default no issue

    ckpt_converter = 'OpenVoice/checkpoints_v2/converter'
    device = "cuda:0" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    # Load the tone color converter model (accent, etc.)
    tone_color_converter = ToneColorConverter(f'{ckpt_converter}/config.json', device=device)
    tone_color_converter.load_ckpt(f'{ckpt_converter}/checkpoint.pth')

    #Write the audio bytes to a temporary file to process it (mandatory for the se_extractor to work)
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio)
        tmp_path = tmp.name

    target_se = None
    try:
        # Extract the speaker embedding from the input audio (voice stamp, etc..)
        target_se, audio_name = se_extractor.get_se(tmp_path, tone_color_converter, vad=False)
    except Exception as e:
        print(f"Error occurred while extracting speaker embedding: {str(e)}")
        issue = [True, str(e)]
    finally:
        os.remove(tmp_path)
    if target_se is None:
        return None, None, issue

    try:
        # Load the TTS model for the specified language 
        model = TTS(language=language, device=device)  
        speaker_id = model.hps.data.spk2id[speaker_key]  
        speaker_key = speaker_key.lower().replace('_', '-')

        source_se = torch.load(f'OpenVoice/checkpoints_v2/base_speakers/ses/{speaker_key}.pth', map_location=device)
    except Exception as e:
        print(f"Error occurred while loading TTS model or source speaker embedding: {str(e)}\nError on speaker_key: {speaker_key}, language: {language}")
        issue = [True, str(e)]
        return None, None, issue
 
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as src_tmp, \
            tempfile.NamedTemporaryFile(suffix=".wav", delete=True) as out_tmp:
        src_path = src_tmp.name
        out_path = out_tmp.name

    audio_data = None
    sample_rate = None
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

    except Exception as e:
        print(f"Error occurred while converting tone color: {e}")
        issue = [True, str(e)]

    finally:
        if os.path.exists(src_path):
            os.remove(src_path)
        if os.path.exists(out_path):
            os.remove(out_path)


    if audio_data is None:
        return None, None, issue
    
    #create a bytes buffer to return the audio data as bytes (wav format, we can see it as a false file in RAM)
    buffer = io.BytesIO()
    sf.write(buffer, audio_data, sample_rate, format="WAV")
    buffer.seek(0)

    return buffer.read(), sample_rate, issue



