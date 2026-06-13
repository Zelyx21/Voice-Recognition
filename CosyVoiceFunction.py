
import os
import sys
import io
import tempfile
import time
import logging
from enum import Enum
from typing import Optional
from dataclasses import dataclass

import torch
import torchaudio
import numpy as np

import re

_BASE = os.path.dirname(os.path.abspath(__file__))  # Voice-Recognition/
sys.path.insert(0, os.path.join(_BASE, 'CosyVoice'))
sys.path.insert(0, os.path.join(_BASE, 'CosyVoice', 'third_party', 'Matcha-TTS'))

#sys.path.append("CosyVoice/third_party/Matcha-TTS")

from cosyvoice.cli.cosyvoice import AutoModel


logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger(__name__)


# ══════════════════════════════════════════════════════════════════════════
# ENUMERATIONS
# ══════════════════════════════════════════════════════════════════════════

class Emotion(str, Enum):
    """
    Emotions natively supported by CosyVoice2 (tokenizer.py#EMOTION).
    HAPPY / SAD / ANGRY / NEUTRAL are hard-coded tokens in the model.
    The rest are passed as natural-language instructions to instruct2,
    which the LLM interprets contextually — slightly less precise but still effective.
    """
    HAPPY      = "happy"
    SAD        = "sad"
    ANGRY      = "angry"
    NEUTRAL    = "neutral"
    EXCITED    = "excited"
    FEARFUL    = "fearful"
    SURPRISED  = "surprised"
    DISGUSTED  = "disgusted"
    CALM       = "calm"
    CONFUSED   = "confused"
    EMPATHETIC = "empathetic"
    DEPRESSED  = "depressed"


class SpeakingStyle(str, Enum):
    """
    Vocal delivery styles passed as natural-language instructions.
    These modify *how* the voice sounds, independently of emotion.
    Example: ANGRY + WHISPER = furious but whispered (e.g. a tense argument).
    """
    NORMAL        = "normal"
    WHISPER       = "whisper"
    SHOUT         = "shout"
    STORYTELLING  = "storytelling"
    NEWS          = "news"
    COMMERCIAL    = "commercial"
    CHILD         = "child"
    ELDER         = "elder"
    MYSTERIOUS    = "mysterious"
    GENTLE        = "gentle"
    AUTHORITATIVE = "authoritative"
    WARM          = "warm"
    LIVELY        = "lively"

class Language(str, Enum):
    """Target output language for multilingual synthesis."""
    CHINESE   = "zh"
    ENGLISH   = "en"
    JAPANESE  = "ja"
    KOREAN    = "ko"
    CANTONESE = "yue"


class OutputFormat(str, Enum):
    WAV = "wav"
    MP3 = "mp3"


@dataclass
class TTSResult:
    """
    Returned by every synthesis function.
    audio_bytes : raw WAV or MP3 bytes — write directly to disk or stream via FastAPI.
    metrics     : performance metadata for logging / response headers.
    """
    audio_bytes: bytes
    generation_time_ms: float
    audio_duration_s: float
    real_time_factor: float   
    sample_rate: int
    num_chunks: int
    model_used: str


EMOTION_PROMPTS: dict = {
    Emotion.HAPPY:      "Speak with a joyful, light, and enthusiastic voice",
    Emotion.SAD:        "Speak with a sad, slow, and melancholic voice",
    Emotion.ANGRY:      "Speak with an energetic, firm, and angry voice",
    Emotion.NEUTRAL:    "Speak with a neutral and natural voice",
    Emotion.EXCITED:    "Speak with a very excited, fast, and enthusiastic voice",
    Emotion.FEARFUL:    "Speak with a fearful, hesitant, and trembling voice",
    Emotion.SURPRISED:  "Speak with an astonished and surprised voice",
    Emotion.DISGUSTED:  "Speak with a disgusted and disapproving voice",
    Emotion.CALM:       "Speak with a calm, soft, and composed voice",
    Emotion.CONFUSED:   "Speak with a hesitant and puzzled voice",
    Emotion.EMPATHETIC: "Speak with a gentle, caring, and empathetic voice",
    Emotion.DEPRESSED:  "Speak with a very low, slow, and lifeless voice",
}

STYLE_PROMPTS: dict = {
    SpeakingStyle.WHISPER:        "while whispering.",
    SpeakingStyle.SHOUT:          "while speaking loudly.",
    SpeakingStyle.STORYTELLING:   "like a storyteller.",
    SpeakingStyle.NEWS:           "like a TV news anchor.",
    SpeakingStyle.COMMERCIAL:     "like a radio advertisement.",
    SpeakingStyle.CHILD:          "with a child's voice.",
    SpeakingStyle.ELDER:          "with an elderly person's voice.",
    SpeakingStyle.MYSTERIOUS:     "in a mysterious way.",
    SpeakingStyle.GENTLE:         "in a soft and gentle way.",
    SpeakingStyle.AUTHORITATIVE:  "with authority and confidence.",
    SpeakingStyle.WARM:           "with warmth and kindness.",
    SpeakingStyle.LIVELY:         "in a lively and animated way.",
    SpeakingStyle.NORMAL:         ".",
}



def _set_seed(seed: Optional[int]) -> None:
    if seed is not None:
        torch.manual_seed(seed)
        np.random.seed(seed)


def _audio_to_bytes(chunks: list, sample_rate: int, fmt: OutputFormat) -> bytes:
    """Concatenate raw model output chunks and encode to WAV or MP3."""
    combined = torch.cat([c["tts_speech"] for c in chunks], dim=-1)
    buf = io.BytesIO()
    try:
        torchaudio.save(buf, combined, sample_rate, format=fmt.value)
    except Exception:
        torchaudio.save(buf, combined, sample_rate, format="wav")
    return buf.getvalue()


def _build_result(audio_bytes, sample_rate, n_chunks, model_dir, start_time) -> TTSResult:
    gen_ms = (time.time() - start_time) * 1000
    n_samples = max(1, (len(audio_bytes) - 44) / 2)
    duration = n_samples / sample_rate
    rtf = (gen_ms / 1000) / max(duration, 0.001)
    return TTSResult(
        audio_bytes=audio_bytes,
        generation_time_ms=round(gen_ms, 1),
        audio_duration_s=round(duration, 2),
        real_time_factor=round(rtf, 3),
        sample_rate=sample_rate,
        num_chunks=n_chunks,
        model_used=model_dir,
    )



def create_audio_path(audio_bytes:bytes):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp.close()
        return tmp.name

def prompt_text_adapt(text):
    text_adapt = re.sub(r"\s*,\s*", ". ", text)
    text_adapt = re.sub(r"\s+", " ", text)
    return text_adapt

initial_instruction = "You are a helpful assistant."


# ── 1. Zero-Shot Voice Cloning ─────────────────────────────────────────────

def synthesize_zero_shot(
    model: AutoModel,
    text: str,
    prompt_text: str,
    audio_bytes_reference: bytes,
    speed: float = 1.0,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Clone a voice from a reference audio sample and synthesize new speech.

    Args:
        text:              Text to synthesize.
        prompt_text:       Exact transcript of the reference audio clip.
                           MUST match the audio or quality degrades badly.
        audio_bytes:       Raw audio bytes of the reference clip.
        speed:             Speech rate multiplier (0.5=slow, 1.0=normal, 2.0=fast).
        output_format:     WAV or MP3.
        seed:              Fixed seed for reproducible output.
    Returns:
        TTSResult with audio bytes and performance metrics.
    """

    _set_seed(seed)
    start = time.time()

    audio_path = create_audio_path(audio_bytes_reference)

    prompt_text = prompt_text or "" 
    prompt_text = prompt_text.strip()
    prompt_text = prompt_text_adapt(prompt_text)
    
    clean_text = text.strip()

    augmented_prompt = f"{initial_instruction}<|endofprompt|>{prompt_text}"     

    chunks = list(model.inference_zero_shot(
        clean_text, augmented_prompt, audio_path, speed=speed, stream=False
    ))
    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)

    if audio_path and os.path.exists(audio_path):
        os.remove(audio_path)

    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)


# ── 2. Free-Form Instruction ───────────────────────────────────────────────

def synthesize_instruct(
    model: AutoModel,
    text: str,
    instruction: str,
    audio_bytes_reference: bytes,
    language : str,
    dialect : str,
    output_format: OutputFormat = OutputFormat.WAV,
    speed: float = 1.0,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech guided by a free natural-language instruction.

    Args:
        instruction: Any natural-language directive, e.g.
                     "Speak cheerfully but slow down on key words."
    Returns:
        TTSResult with audio bytes and performance metrics.
    """

    _set_seed(seed)
    start = time.time()
    audio_path = create_audio_path(audio_bytes_reference)
    init_instruction = initial_instruction

    if language is not None and language != "None":
        lang_instr = f"Speak in {language}. "
        if dialect:
            lang_instr = lang_instr.replace(". ",f" with a {dialect} accent. ") 
        init_instruction += lang_instr 

    instruction = initial_instruction + instruction + "<|endofprompt|>"
    chunks = list(model.inference_instruct2(text, instruction, audio_path, speed=speed, stream=False))

    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)


# ── 3. Cross-Lingual with Paralinguistic Tags ──────────────────────────────

def synthesize_cross_lingual(
    model: AutoModel,
    prompt_text: str,
    audio_bytes_reference: bytes,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech with inline paralinguistic tags: [breath], [laughter].
    Args:
        text: Text with optional [breath] and [laughter] tags inline.
    Returns:
        TTSResult with audio bytes and performance metrics.
    """

    _set_seed(seed)
    start = time.time()
    audio_path = create_audio_path(audio_bytes_reference)


    prompt_text = prompt_text or "" 
    prompt_text = prompt_text.strip()
    #prompt_text = prompt_text_adapt(prompt_text)
    
    instruction = "You are a helpful assistant."
    
    augmented_prompt = f"{instruction}<|endofprompt|>{prompt_text}"     

    print(f"augmented_prompt = {augmented_prompt}")
    chunks = list(model.inference_cross_lingual(augmented_prompt, audio_path, stream=False))
    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)

# ── 4. Multilingual + Dialect ──────────────────────────────────────────────

def preset_instruct(
    model: AutoModel,
    text: str,
    audio_bytes_reference: bytes,
    language: Language,
    dialect: Optional[str] = None,
    emotion: Emotion = Emotion.NEUTRAL,
    speaker_style: SpeakingStyle = SpeakingStyle.NORMAL,
    speed: float = 1.0,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech in a specific language and optional regional dialect.

    Args:
        language: Target output language (Language enum).
        dialect:  Optional dialect string, e.g. "Cantonese", "Sichuanese",
                  "Shanghainese". Only meaningful for Language.CHINESE.
        emotion:           Emotional tone to apply.
        speaking_style:    Delivery style (whisper, news anchor, etc.).

    Returns:
        TTSResult with audio bytes and performance metrics.
    """
    _set_seed(seed)
    start = time.time()
    audio_path = create_audio_path(audio_bytes_reference)

    instruction = initial_instruction
    
    if language is not None and language != "None": 
        lang_instr = f"Speak in {language}. "
        if dialect:
            lang_instr = lang_instr.replace(". ",f" with a {dialect} accent. ") 
        instruction += lang_instr 

    emotion_instr = EMOTION_PROMPTS.get(emotion, "")
    speaker_instr = STYLE_PROMPTS.get(speaker_style, "")

    instruction_final = f"{instruction} {emotion_instr} {speaker_instr}".strip() + "<|endofprompt|>"


    chunks = list(model.inference_instruct2(text, instruction_final, audio_path, speed=speed, stream=False))
    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)







