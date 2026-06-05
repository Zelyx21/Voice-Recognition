from database.Qdrant import get_email_password, search_similarity_attributes
from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from qdrant_client import QdrantClient
from api.actions.auth import create_token
import bcrypt

client = QdrantClient(host="localhost", port=6333)


def authenticate_user(email, password=None, vector=None):
    print("LOGIN FUNCTION CALLED")
    if password:
        result = get_email_password(client, email)
        if not result:
            return {"issue": "Invalid email or password"}

        stored_hash = result["password"]
        if bcrypt.checkpw(password.encode(), stored_hash.encode()):
            token = create_token(email, result["name"])
            return {
                "name": result["name"],
                "email": result["email"],
                "token": token,
                "issue": "",
            }
        else:
            return {"issue": "Invalid email or password"}

    if vector is not None:
        results = search_similarity_attributes(
            client, "voice_data_base", vector, top_k=1
        )

        if (results 
            and results[0]["email"] == email 
            and results[0]["score"] > 0.5
            ):
            token = create_token(results[0]["email"], results[0]["name"])
            return {
                "name": results[0]["name"],
                "email": results[0]["email"],
                "token": token,
                "score": results[0]["score"],
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
