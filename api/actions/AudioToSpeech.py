
import os
import tempfile
import whisper

#change to "tiny" for faster result 
whisper_model = whisper.load_model("turbo") 

#Ceci est un projet de reconnaissance vocale qui permet également le clonage de voix.
#En allant au marché je croise deux hommes, accompagnés chacun de deux femmes, accompagnées chacune de deux enfants. Combien de personne vont au marché ? 

def AudioToSpeech(audio_bytes:bytes):

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name
    result = whisper_model.transcribe(tmp_path)
    os.unlink(tmp_path)

    return result["text"].strip()













