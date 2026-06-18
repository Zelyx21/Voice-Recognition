from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import insert_secure, add_secure, search_similarity_attributes
import bcrypt



def register_database(audio_bytes:bytes, email, name, password, audio_name):
    """
    Takes raw audio bytes and returns a vector npy
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)
    audio, issue = vad(audio,sr)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}

    emb = embedding(audio)

    print("\n"+audio_name)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    insert_secure(name=name, email=email, vector=emb.tolist(), password=hashed, audio_name=audio_name)
    return {"status": "success"}


def add_voice_database(audio_bytes:bytes, email, audio_name):
    """
    Takes raw audio bytes and returns a vector npy
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)
    audio, issue = vad(audio,sr)
    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}
    
    emb = embedding(audio)

    if emb is not None:
        results = search_similarity_attributes(
            emb, top_k=1
        )

        if (results 
            and results[0]["email"] == email 
            and results[0]["score"] > 0.6
            ):

            add_secure(email=email, vector=emb.tolist(), audio_name=audio_name)

        return {"name": results[0]["name"], "score": results[0]["score"], "issue": "Unrecognized voice, the audio must come from the same first recording"}

    
    return {"status": "success"}
