from database.Qdrant import search_similarity_attributes, get_point_by_email
from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from api.actions.auth import create_token
import bcrypt


def authenticate_user(email, password=None, vector=None):
    print("LOGIN FUNCTION CALLED")
    if password:

        result = get_point_by_email(email)

        if not result:
            return {"issue": "Invalid email or password"}
        
        stored_hash = result["password"]
        audios_names = result["audio_name"]
        nbr_voices_result = len(audios_names)

        if bcrypt.checkpw(password.encode(), stored_hash.encode()):
            token = create_token(email, result["name"])
            return {
                "name": result["name"],
                "email": result["email"],
                "token": token,
                "nbr_voices": nbr_voices_result,
                "audios_names": audios_names,
                "issue": "",
            }
        else:
            return {"issue": "Invalid email or password"}

    if vector is not None:
        results = search_similarity_attributes(
            vector, top_k=1
        )

        if (results 
            and results[0]["email"] == email 
            and results[0]["score"] > 0.6
            ):
            token = create_token(results[0]["email"], results[0]["name"])

            result = get_point_by_email(email)

            return {
                "name": results[0]["name"],
                "email": results[0]["email"],
                "token": token,
                "score": results[0]["score"],
                "nbr_voices": len(result["audio_name"]),
                "audios_names": result["audio_name"],
                "issue": "",
            }
        else:
            return {"issue": "Voice not recognized"}


def clean_embedding(audio_bytes: bytes):
    """
    Takes raw audio bytes and returns an embedding
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio, sr)
    audio, issue = vad(audio, sr)

    if issue[0]:  # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}

    emb = embedding(audio)

    return emb
