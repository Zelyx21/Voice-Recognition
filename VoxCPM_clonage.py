
import tempfile

from voxcpm import VoxCPM
import soundfile as sf

model = VoxCPM.from_pretrained(
    "openbmb/VoxCPM2",
    load_denoiser=False,
    device="auto",
)

def clonage_voxCPM(audio_reference,
    sample_rate,
    transcription_reference, #must be the transcription of the wav_reference
    
    texte="Ceci est un exemple de clonage vocal avec VoxCPM2, qui permet de contrôler la langue, émotion, la vitesse et la similarité avec une voix de référence. Vous pouvez ajuster les paramètres pour obtenir le résultat souhaité.",
    
    language="fr", #"en", "fr", "es", "zh", "jp", "kr"
    emotion="neutral", # neutral, happy, ..
    speed=1.0,
    wav_reference_similarity=None,
):
    print("Clonage reception : OK")
    issue = [False, ""] # default no issue
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:

        temp_wav_path = tmp.name

        # Save the reference audio to a temporary file
        sf.write(temp_wav_path, audio_reference, sample_rate)

    temp_wav_sim_path = None
    if wav_reference_similarity is not None:
         with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_sim:

            temp_wav_sim_path = tmp_sim.name

            # Save the similarity reference audio to a temporary file
            sf.write(temp_wav_sim_path, wav_reference_similarity, sample_rate)
    

    style_prompt = f"""
    Speak in {language}.
    Emotion: {emotion}.
    Speech speed: {speed}.
    """

    wav = model.generate(
    text=f"({style_prompt}) \n{texte}",
    prompt_wav_path=temp_wav_path,
    prompt_text=transcription_reference,
    reference_wav_path=temp_wav_sim_path, # 2 audio files, optional, for better simliarity 
    cfg_value=2.0, #Higher values follow the conditioning more strictly; lower values allow more variation
    inference_timesteps=10, #More steps improve detail and naturalness at the cost of speed
    normalize=False, #Useful for raw text input

    )
    #sf.write(output_path, wav, model.tts_model.sample_rate)
    return wav, model.tts_model.sample_rate, issue




def voice_design(audio_reference,
    sample_rate,
    transcription_reference, #must be the transcription of the wav_reference
    
    texte="This is an ultimate cloning demonstration using VoxCPM2.",
    
    language="fr", #"en", "fr", "es", "zh", "jp", "kr"
    emotion="neutral", # neutral, happy, ..
    speed=1.0,
    #temperature=0.7, # prosody, expressiveness
    wav_reference_similarity=None,
):

    style_prompt = f"""
    Speak in {language}.
    Emotion: {emotion}.
    Speech speed: {speed}.
    """

    wav = model.generate(
        text=f"({style_prompt}) \n{texte}",
        cfg_value=2.0, #Higher values follow the conditioning more strictly; lower values allow more variation
        inference_timesteps=10, #More steps improve detail and naturalness at the cost of speed
        normalize=False, #Useful for raw text input
    )

    return wav, model.tts_model.sample_rate


"""
clonage_voxCPM(
    wav_reference="Mavoix1.wav",
    transcription_reference="Ceci est un exemple de clonage vocal avec VoxCPM2, qui permet de contrôler la langue, l\'émotion, la vitesse et la similarité avec une voix de référence. Vous pouvez ajuster les paramètres pour obtenir le résultat souhaité.",
    texte="Voila un clonage de voix tout a fait surprenant avec VoxCPM2.",
    language="fr", #"en", "fr", "es", "zh", "jp", "kr"
    emotion="neutral", # neutral, happy, ..
    speed=1.0,
    wav_reference_similarity="Mavoix2.wav",
)

"""



