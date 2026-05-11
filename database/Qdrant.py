
from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, HnswConfigDiff, VectorParams, PointStruct
import numpy as np
import uuid

client = QdrantClient(url="http://localhost:6333")

#print(client.get_collections()) #Show the collections in the database

def insert_points(client, base, names, emails, vectors):
    for name, email, vector in zip(names, emails, vectors):
        client.upsert(
            collection_name=base,
            wait=True,
            points=[
                PointStruct(id=str(uuid.uuid4()), #generates a random unique ID 
                            vector=vector,
                            payload={"name": name, 
                                     "email": email}),
            ],
        )


def search_similarity(client, base, query_vector, top_k=1):
    search_result = client.query_points(
        collection_name=base,
        query=query_vector,
        limit=top_k,
        search_params=models.SearchParams(
            hnsw_ef=200, # Number of neighbors to visit during search, Accuracy/speed
            exact=False # Set to True for exact search, False for approximate search 
        )
    )
    print(type(search_result))
    print(search_result)
    return search_result.points

def search_similarity_attributes(client, base, query_vector, top_k=1): # Get attribute of the search result
    response = search_similarity(client, base, query_vector, top_k)
    list_clients = []
    for point in response:
        list_clients.append({"id":point.id, 
                             "score":point.score, 
                             "name":point.payload.get("name"), 
                             "email":point.payload.get("email")
                             })
    return list_clients

def delete_points(client, base, point_ids): #delete points by their [IDs]
    client.delete(
        collection_name=base,
        points_selector=models.PointIdsList(points=point_ids)
    )

def delete_by_filter(client, base, email): #delete points by a filter, here we delete all the points with the email in the payload that match the email given in parameter
    client.delete(
        collection_name=base,
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

def email_exists(client, collection_name, email):
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

def insert_secure(client, base, names, emails, vectors): #insert points only if the email doesn't exist in the database
    names_secures=[]
    emails_secures=[]
    vectors_secures=[]
    for name, email, vector in zip(names, emails, vectors):
        if not email_exists(client,base,email):
            names_secures.append(name)
            emails_secures.append(email)
            vectors_secures.append(vector)

    insert_points(client, base, names_secures, emails_secures, vectors_secures)
    print(f"Valid insertion : {len(emails_secures)}, invalid insertion : {len(emails)-len(emails_secures)}")

def replace_point(client, base, point_id, name, email, vector): #replace a point by its ID
    client.upsert(
        collection_name=base,
        wait=True,
        points=[
            PointStruct(id=point_id, 
                        vector=vector,
                        payload={"name": name, 
                                 "email": email}),
        ],
    )

clem_vec = np.load('database/clem.npy', allow_pickle=True)
sid_vec = np.load('database/sidney.npy', allow_pickle=True)
sid_vec2 = np.load('database/sid..2.npy', allow_pickle=True)


#Here you can see how use the functions.
#insert_secure(client, "voice_data_base", ["clem", "sid", "sidney2"], ["clem@example.com", "sid@example.com", "sidney2@example.com"], [clem_vec, sid_vec, sid_vec2])

"""
test = search_similarity_attributes(client, "voice_data_base", sid_vec2, top_k=3)
for all_test in test:
    print(all_test)
id_del = test[0]["id"] #get the ID of the first result of the search and delete it
delete_points(client, "voice_data_base", [id_del]) 
"""

#delete_by_filter(client, "voice_data_base", "sidney2@example.com") # delete all the points with the email 








