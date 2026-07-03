from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import (
    insert_secure, 
    add_secure, 
    search_similarity_attributes,
    get_point_by_email,
    search_similarity  # Besoin du vecteur pour comparer
)
import bcrypt

VOICE_SIMILARITY_THRESHOLD = 0.6  # À ajuster selon tes tests (0.4 était trop bas)
CROSS_ACCOUNT_PROTECTION_THRESHOLD = 0.95  # Rejette si TROP similaire (anti-fraude)


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

def add_voice_database(audio_bytes: bytes, email, audio_name):
    """
    Takes raw audio bytes and adds it to the database.
    Verifies the audio belongs to the same person by comparing with existing voices.
    """
    # Process audio
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio, sr)
    audio, issue = vad(audio, sr)

    if issue[0]:
        return {
            "name": None,
            "score": 0,
            "issue": issue[1]
        }

    emb = embedding(audio)

    if emb is None:
        return {
            "name": None,
            "score": 0,
            "issue": "Unable to compute voice embedding"
        }

    # Get user's existing voices
    user_data = get_point_by_email(email)
    
    if user_data is None:
        # First voice for this account - no verification needed
        add_secure(
            email=email,
            vector=emb.tolist(),
            audio_name=audio_name
        )
        return {"status": "success", "issue": None}

    # Search top matches in entire database
    results = search_similarity_attributes(emb, top_k=5)  # Increased from 1 to 5

    best_same_email = None
    for result in results:
        if result["email"] == email:
            best_same_email = result
            break

    best_other_email = None
    for result in results:
        if result["email"] != email:
            best_other_email = result
            break

    if (
        best_other_email
        and best_other_email["score"] > CROSS_ACCOUNT_PROTECTION_THRESHOLD
    ):
        return {
            "name": best_other_email["name"],
            "score": best_other_email["score"],
            "issue": f"Voice too similar to {best_other_email['name']}'s account. Please use a different voice sample."
        }

    if (
        best_same_email
        and best_same_email["score"] >= VOICE_SIMILARITY_THRESHOLD
    ):
        add_secure(
            email=email,
            vector=emb.tolist(),
            audio_name=audio_name
        )
        return {"status": "success", "issue": None}

    return {
        "name": best_same_email["name"] if best_same_email else "Unknown",
        "score": best_same_email["score"] if best_same_email else 0,
        "issue": "Unrecognized voice. The audio must come from the same person as your registered voices."
    }