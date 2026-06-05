
from database.Qdrant import generate_user_id, delete_points, delete_by_email, get_point_by_email
from qdrant_client import QdrantClient

client = QdrantClient(host="localhost", port = 6333)


def delete_voice_database(email, audio_name):
    id = generate_user_id (email=email, audio_name=audio_name)
    delete_points(client=client, base="voice_data_base", id=id)

    return {"status": "success"}

def delete_compte(email):
    delete_by_email(client=client, base="voice_data_base", email=email)

    return {"status": "success"}

def get_voices(email):
    return get_point_by_email(client=client, base="voice_data_base", email=email)
