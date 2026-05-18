
from voxcpm import VoxCPM
import soundfile as sf
model = VoxCPM.from_pretrained("openbmb/VoxCPM2")


def clonage_voxCPM(wav_reference,
    transcription_reference, #must be the transcription of the wav_reference
    texte="This is an ultimate cloning demonstration using VoxCPM2.",
    output_path="clone.wav",
    langue="fr", #"en", "fr", "es", "zh", "jp", "kr"
    emotion="neutral", # neutral, happy, ..
    vitesse=1.0,
    temperature=0.7, # prosody, expressiveness
    wav_reference_similarity=None,
):
    
    style_prompt = f"""
    Speak in {langue}.
    Emotion: {emotion}.
    Speech speed: {vitesse}.
    """

    wav = model.generate(
    text=texte,
    prompt_wav_path=wav_reference,
    prompt_text=transcription_reference,
    reference_wav_path=wav_reference_similarity, # 2 audio files, optional, for better simliarity 
    system_prompt=style_prompt,
    temperature=temperature,
    )
    sf.write(output_path, wav, model.tts_model.sample_rate)



def voice_design():

    wav = model.generate(
        text="(A young woman, gentle and sweet voice)Hello, welcome to VoxCPM2!",
        cfg_value=2.0,
        inference_timesteps=10,
    )
    sf.write("voice_design.wav", wav, model.tts_model.sample_rate)

"""
clonage_voxCPM(
    wav_reference="Mavoix1.wav",
    transcription_reference="Ceci est un exemple de clonage vocal avec VoxCPM2, qui permet de contrôler la langue, l\'émotion, la vitesse et la similarité avec une voix de référence. Vous pouvez ajuster les paramètres pour obtenir le résultat souhaité.",
    texte="Voila un clonage de voix tout a fait surprenant avec VoxCPM2.",
    output_path="clone.wav",
    langue="fr", #"en", "fr", "es", "zh", "jp", "kr"
    emotion="neutral", # neutral, happy, ..
    vitesse=1.0,
    temperature=0.7, # prosody, expressiveness
    wav_reference_similarity="Mavoix2.wav",
)
"""



