
"""
cosyvoice_engine.py
===================
Pure business logic for CosyVoice TTS — no FastAPI, no HTTP layer.
Import this module from your FastAPI router and call functions directly.

Usage example:
    from cosyvoice_engine import load_model, synthesize_zero_shot, synthesize_emotion_preset

    model = load_model("pretrained_models/Fun-CosyVoice3-0.5B")
    audio_bytes, metrics = synthesize_zero_shot(
        model=model,
        text="Hello, how are you?",
        prompt_text="This is the reference transcript.",
        prompt_audio_path="reference.wav",
        emotion=Emotion.HAPPY,
        speaking_style=SpeakingStyle.WARM,
    )
"""

import sys
import os
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


# ══════════════════════════════════════════════════════════════════════════
# RETURN TYPE
# ══════════════════════════════════════════════════════════════════════════

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
    real_time_factor: float   # < 1.0 means faster than real-time
    sample_rate: int
    num_chunks: int
    model_used: str


# ══════════════════════════════════════════════════════════════════════════
# INSTRUCTION TEMPLATES
# ══════════════════════════════════════════════════════════════════════════

EMOTION_PROMPTS: dict = {
    Emotion.HAPPY:      "Speak with a joyful, light, and enthusiastic voice.",
    Emotion.SAD:        "Speak with a sad, slow, and melancholic voice.",
    Emotion.ANGRY:      "Speak with an energetic, firm, and angry voice.",
    Emotion.NEUTRAL:    "Speak with a neutral and natural voice.",
    Emotion.EXCITED:    "Speak with a very excited, fast, and enthusiastic voice.",
    Emotion.FEARFUL:    "Speak with a fearful, hesitant, and trembling voice.",
    Emotion.SURPRISED:  "Speak with an astonished and surprised voice.",
    Emotion.DISGUSTED:  "Speak with a disgusted and disapproving voice.",
    Emotion.CALM:       "Speak with a calm, soft, and composed voice.",
    Emotion.CONFUSED:   "Speak with a hesitant and puzzled voice.",
    Emotion.EMPATHETIC: "Speak with a gentle, caring, and empathetic voice.",
    Emotion.DEPRESSED:  "Speak with a very low, slow, and lifeless voice.",
}

STYLE_PROMPTS: dict = {
    SpeakingStyle.WHISPER:        "while whispering",
    SpeakingStyle.SHOUT:          "while speaking loudly",
    SpeakingStyle.STORYTELLING:   "like a storyteller",
    SpeakingStyle.NEWS:           "like a TV news anchor",
    SpeakingStyle.COMMERCIAL:     "like a radio advertisement",
    SpeakingStyle.CHILD:          "with a child's voice",
    SpeakingStyle.ELDER:          "with an elderly person's voice",
    SpeakingStyle.MYSTERIOUS:     "in a mysterious way",
    SpeakingStyle.GENTLE:         "in a soft and gentle way",
    SpeakingStyle.AUTHORITATIVE:  "with authority and confidence",
    SpeakingStyle.WARM:           "with warmth and kindness",
    SpeakingStyle.LIVELY:         "in a lively and animated way",
    SpeakingStyle.NORMAL:         "",
}

INTENSITY_QUALIFIERS = [
    (0.5, 0.8, "slightly"),
    (0.8, 1.2, ""),
    (1.2, 1.6, "very"),
    (1.6, 2.1, "extremely"),
]


# ══════════════════════════════════════════════════════════════════════════
# INTERNAL HELPERS  (private — not exported)
# ══════════════════════════════════════════════════════════════════════════

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


def _build_instruct2_prompt(instruction: str) -> str:
    """Wrap an instruction into the CosyVoice2 system-prompt format."""
    return f"You are a helpful assistant. {instruction}<|endofprompt|>"


# ══════════════════════════════════════════════════════════════════════════
# PUBLIC API
# ══════════════════════════════════════════════════════════════════════════

def load_model(model_dir: str = "pretrained_models/Fun-CosyVoice3-0.5B") -> AutoModel:
    """
    Load and return the CosyVoice AutoModel.

    WHY A SEPARATE FUNCTION?
    The model is large and takes several seconds to load.
    Load it ONCE at startup (FastAPI lifespan) and pass the instance to
    every synthesis function — never reload per request.

    Args:
        model_dir: Path to the pretrained model folder.
    Returns:
        Loaded AutoModel instance.
    """
    logger.info(f"Loading CosyVoice model from {model_dir} ...")
    model = AutoModel(model_dir=model_dir)
    logger.info("Model loaded.")
    return model


def list_emotions() -> dict:
    """Return all supported emotions mapped to their instruction description."""
    return {e.value: EMOTION_PROMPTS.get(e, "") for e in Emotion}


def list_styles() -> dict:
    """Return all supported speaking styles mapped to their description."""
    return {s.value: STYLE_PROMPTS.get(s, "") for s in SpeakingStyle}

def create_audio_path(audio_bytes:bytes):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp.close()
        return tmp.name

def prompt_text_adapt(text):
    text_adapt = re.sub(r"\s*,\s*", ". ", text)
    text_adapt = re.sub(r"\s+", " ", text)
    return text_adapt

    # -------------------------------------

# ── 1. Zero-Shot Voice Cloning ─────────────────────────────────────────────

def synthesize_zero_shot(
    model: AutoModel,
    text: str,
    prompt_text: str,
    prompt_audio_path: str,
    emotion: Emotion = Emotion.NEUTRAL,
    speaking_style: SpeakingStyle = SpeakingStyle.NORMAL,
    speed: float = 1.0,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Clone a voice from a reference audio sample and synthesize new speech.

    WHY THIS FUNCTION EXISTS (vs a generic TTS):
    Zero-shot cloning replicates the *timbre and identity* of a reference
    speaker without any fine-tuning. The model listens to a short WAV clip
    (5-30s) and reproduces that exact voice on new text.
    Use this when you have an actual audio sample of the target speaker.

    Emotion is injected as a hint appended to prompt_text. The model uses it
    as prosody guidance while preserving the cloned voice identity.

    Args:
        text:              Text to synthesize.
        prompt_text:       Exact transcript of the reference audio clip.
                           MUST match the audio or quality degrades badly.
        prompt_audio_path: Path to the reference WAV file (5-30s recommended).
        emotion:           Emotional tone to apply.
        speaking_style:    Delivery style (whisper, news anchor, etc.).
        speed:             Speech rate multiplier (0.5=slow, 1.0=normal, 2.0=fast).
        output_format:     WAV or MP3.
        seed:              Fixed seed for reproducible output.
    Returns:
        TTSResult with audio bytes and performance metrics.
    """
    _set_seed(seed)
    start = time.time()

    audio_path = create_audio_path(prompt_audio_path)
    prompt_text = prompt_text or "" 
    prompt_text = prompt_text_adapt(prompt_text)

    emotion_hint = EMOTION_PROMPTS.get(emotion, "")
    style_hint = STYLE_PROMPTS.get(speaking_style, "")
    extra = f"{emotion_hint} {style_hint}".strip()
    augmented_prompt = f"{prompt_text} [{extra}] <|endofprompt|>" if extra else f"{prompt_text} <|endofprompt|>"

    chunks = list(model.inference_zero_shot(
        text, augmented_prompt, audio_path, speed=speed, stream=False
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
    prompt_audio_path: str,
    language : str,
    dialect : str,
    output_format: OutputFormat = OutputFormat.WAV,
    speed: float = 1.0,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech guided by a free natural-language instruction.

    WHY THIS FUNCTION EXISTS:
    Emotion presets cover common cases, but sometimes you need precise,
    unconventional control: "Speak like you're reading a bedtime story to a
    3-year-old while slightly out of breath." No enum can cover that.
    This passes your instruction string directly to instruct2 — full freedom.

    Args:
        instruction: Any natural-language directive, e.g.
                     "Speak cheerfully but slow down on key words."
    Returns:
        TTSResult with audio bytes and performance metrics.
    """
    _set_seed(seed)
    start = time.time()

    lang_instr = f"Speak in {language.value}"
    if dialect:
        lang_instr += f" with a {dialect} accent. "

    prompt = lang_instr + instruction

    full_prompt = _build_instruct2_prompt(prompt)
    chunks = list(model.inference_instruct2(text, full_prompt, prompt_audio_path, spead=speed, stream=False))

    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)


# ── 3. Cross-Lingual with Paralinguistic Tags ──────────────────────────────

def synthesize_cross_lingual(
    model: AutoModel,
    text: str,
    prompt_audio_path: str,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech with inline paralinguistic tags: [breath], [laughter].

    Zero-shot and instruct work at the *sentence level* — you set an overall tone.
    Cross-lingual inference works at the *token level*: you insert [breath] or
    [laughter] at exact positions in the sentence, producing hyper-realistic,
    human-sounding speech with natural hesitations and reactions.

    Use this for podcasts, audiobooks, dialogue systems, or any output where
    naturalness matters more than emotion control.

    Text example:
        "Well [breath] I wasn't expecting that. [laughter] What a surprise!"

    Args:
        text: Text with optional [breath] and [laughter] tags inline.
    Returns:
        TTSResult with audio bytes and performance metrics.
    """
    _set_seed(seed)
    start = time.time()

    chunks = list(model.inference_cross_lingual(text, prompt_audio_path, stream=False))
    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)

# ── 4. Multilingual + Dialect ──────────────────────────────────────────────

def synthesize_multilingual(
    model: AutoModel,
    text: str,
    prompt_audio_path: str,
    language: Language,
    dialect: Optional[str] = None,
    emotion: Emotion = Emotion.NEUTRAL,
    speed: float = 1.0,
    output_format: OutputFormat = OutputFormat.WAV,
    seed: Optional[int] = None,
) -> TTSResult:
    """
    Synthesize speech in a specific language and optional regional dialect.

    WHY THIS FUNCTION EXISTS:
    CosyVoice2 supports Chinese, English, Japanese, Korean, and Cantonese —
    but defaults to Mandarin even for dialectal text unless explicitly told
    otherwise. This function handles the language/dialect instruction so you
    never have to think about it.

    It also enables cross-cloning: record a French speaker and make them
    speak Japanese with the same voice timbre.

    Args:
        language: Target output language (Language enum).
        dialect:  Optional dialect string, e.g. "Cantonese", "Sichuanese",
                  "Shanghainese". Only meaningful for Language.CHINESE.
    Returns:
        TTSResult with audio bytes and performance metrics.
    """
    _set_seed(seed)
    start = time.time()

    lang_instr = f"Speak in {language.value}"
    if dialect:
        lang_instr += f" with a {dialect} accent"
    emotion_instr = EMOTION_PROMPTS.get(emotion, "")

    full_prompt = _build_instruct2_prompt(f"{lang_instr}. {emotion_instr}".strip())

    chunks = list(model.inference_instruct2(text, full_prompt, prompt_audio_path, speed=speed, stream=False))
    audio_bytes = _audio_to_bytes(chunks, model.sample_rate, output_format)
    return _build_result(audio_bytes, model.sample_rate, len(chunks), model.model_dir, start)







