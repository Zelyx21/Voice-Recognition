
from unittest import result

from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, HnswConfigDiff, PointVectors, VectorParams, PointStruct
import numpy as np
import uuid


#print(client.get_collections()) #Show the collections in the database

#client = QdrantClient(url="http://localhost:6333")
CLIENT = QdrantClient(host="localhost", port=6333)

BASE = "voice_data_base"

def generate_user_id(email: str, audio_name: str) -> str:
    # generates a unique ID based on the email
    return str(uuid.uuid5(uuid.NAMESPACE_DNS, email + audio_name))

def get_point_by_email(email, client=CLIENT, collection_name=BASE):
    result, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
            ]
        ),
        limit=5, # stop when he found 5 audios
        with_payload=True, # no need to charge data and vectors
        with_vectors=False, 
    )
    
    if len(result) != 0:    

        list_audios = []
        for point in result:
            list_audios.append(point.payload.get("audio_name"))

        info_email = {"id": result[0].id, "name":result[0].payload.get("name"), "email":result[0].payload.get("email"), "password": result[0].payload.get("password"), "audio_name": list_audios}
   
    else:
        info_email = None

    return info_email

def search_similarity(query_vector, client=CLIENT, collection_name=BASE, top_k=1, exact=True):
    search_result = client.query_points(
        collection_name=collection_name,
        query=query_vector,
        limit=top_k,
        search_params=models.SearchParams(
            hnsw_ef=500, # Number of neighbors to visit during search, Accuracy/speed, useless if exact = True
            exact=exact # Set to True for exact search, False for approximate search 
        )
    )
    print(type(search_result))
    print(search_result)
    return search_result.points

def search_similarity_attributes(query_vector, client=CLIENT, collection_name=BASE, top_k=1): # Get attribute of the search result
    response = search_similarity(query_vector, client, collection_name, top_k)
    list_clients = []
    for point in response:
        list_clients.append({"id":point.id, 
                             "score":point.score, 
                             "name":point.payload.get("name"), 
                             "email":point.payload.get("email"),
                             "audio_name":point.payload.get("audio_name"),
                             "issue":""
                             })
    return list_clients

def search_multi_similarity(query_vectors, client=CLIENT, collection_name=BASE):
    
    list_clients = []
    for query_vector in query_vectors:
        response = search_similarity(query_vector, client, collection_name)
        for point in response:
            list_clients.append({"id":point.id, 
                                "score":point.score, 
                                "name":point.payload.get("name"), 
                                "email":point.payload.get("email"),
                                "audio_name":point.payload.get("audio_name"),
                                "issue":""
                                })
    return list_clients

def delete_points(point_ids, client=CLIENT, collection_name=BASE): #delete points by their [IDs]
    client.delete(
        collection_name=collection_name,
        points_selector=models.PointIdsList(points=[point_ids])
    )

def delete_by_email(email, client=CLIENT, collection_name=BASE): #delete points by a filter, here we delete all the points with the email in the payload that match the email given in parameter
    client.delete(
        collection_name=collection_name,
        points_selector=models.FilterSelector(
            filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="email",
                        match=models.MatchValue(value=email),
                    ),
                ]
            )
        ),
    )

def insert_points(names, emails, vectors, passwords, audio_names, client=CLIENT, collection_name=BASE):
    for name, email, vector, password, audio_name in zip(names, emails, vectors, passwords, audio_names):
        client.upsert(
            collection_name=collection_name,
            wait=True,
            points=[
                PointStruct(id=generate_user_id(email, audio_name), #generates a unique ID based on the email and audio name
                            vector=vector,
                            payload={"name": name, 
                                     "email": email,
                                     "password":password,
                                     "audio_name": audio_name}
                                     ),
            ],
        )

def email_exists(email, client=CLIENT, collection_name=BASE):
    result, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
            ]
        ),
        limit=1, # stop when he found the first one
        with_payload=False, # no need to charge data and vectors
        with_vectors=False, 
    )
    return len(result) > 0

def email_max(email, client=CLIENT, collection_name=BASE):
    result, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
            ]
        ),
        limit=5, 
        with_payload=False, # no need to charge data and vectors
        with_vectors=False, 
    )
    return len(result) > 4

def nbr_email(email, client=CLIENT, collection_name = BASE):
    result, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
            ]
        ),
        limit=5, # stop when he found the first one
        with_payload=False, # no need to charge data and vectors
        with_vectors=False, 
    )
    return len(result)

def email_audio_name_exists(email, audio_name, client=CLIENT, collection_name=BASE):
    result, _ = client.scroll(
        collection_name=collection_name,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
                models.FieldCondition(
                    key="audio_name",
                    match=models.MatchValue(value=audio_name),
                ),
            ]
        ),
        limit=1, # stop when he found the first one
        with_payload=False, # no need to charge data and vectors
        with_vectors=False, 
    )
    return len(result) > 0

def insert_secure(name, email, vector, password, audio_name, client=CLIENT, collection_name=BASE): #insert points only if the audio_name doesn't exist in the email database  

    if not email_audio_name_exists(email, audio_name, client, collection_name) and not email_max(email, client, collection_name): # if the audio name doesn't exist for this email and if the email doesn't have already 5 audios
        client.upsert(
            collection_name=collection_name,
            wait=True,
            points=[
                PointStruct(id=generate_user_id(email, audio_name), #generates a unique ID based on the email and audio name
                            vector=vector,
                            payload={"name": name, 
                                     "email": email,
                                     "password":password,
                                     "audio_name": audio_name}
                                     ),
            ],
        )
        print(f"\nAudio {audio_name} inserted for email {email}\n")

def add_secure(email, vector, audio_name, client=CLIENT, collection_name=BASE):    
    result = get_email_password(email, client, collection_name)
    if result != None :
        name = result["name"]
        password = result["password"]
        insert_secure(name, email, vector, password, audio_name, client, collection_name)

def get_email_password(email, client=CLIENT, collection_name=BASE):
    result, _ = client.scroll(
        collection_name = collection_name,
        scroll_filter = models.Filter(
            must=[
                models.FieldCondition(
                    key="email",
                    match=models.MatchValue(value=email),
                ),
            ]
        ),
        limit=1,
        with_payload=True,
        with_vectors=False,
    )

    if len(result) == 0:
        return None
    
    return {"id": result[0].id, "name":result[0].payload.get("name"), "email":result[0].payload.get("email"), "password": result[0].payload.get("password")}

