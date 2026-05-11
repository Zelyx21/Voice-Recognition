
from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, HnswConfigDiff, VectorParams, PointStruct
import numpy as np
import uuid

client = QdrantClient(url="http://localhost:6333")

#print(client.get_collections()) #Show the collections in the database


def insert_points(client, base, names, emails, vectors):
    for name, email, vector in zip(names, emails, vectors):
        operation_info = client.upsert(
            collection_name=base,
            wait=True,
            points=[
                PointStruct(str(uuid.uuid4()), #generates a random unique ID 
                            vector=vector,
                            payload={"name": name, 
                                     "email": email}),
            ],
        )
        i += 1

    print(operation_info)

#insert_points(client, "voice_db", ["Alice", "Boba"], ["alice@example.com", "bob@example.com"], [[0.9, 0.9, 0.9, 0.8], [0.1, 0.2, 0.7, 0.3]])

clem_vec = np.load('database/clem.npy', allow_pickle=True)
sid_vec = np.load('database/sidney.npy', allow_pickle=True)

#insert_points(client, "voice_data_base", ["clem", "sid"], ["clem@example.com", "sid@example.com"], [clem_vec, sid_vec])


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
    points = search_similarity(client, base, query_vector, top_k)
    list_clients = []
    for point in points:
        list_clients.append([point.id, point.score, point.payload.get("name"), point.payload.get("email")])
    return list_clients

def delete_points(client, base, point_ids): #delete points by their IDs
    client.delete(
        collection_name=base,
        points_selector=models.PointsSelector(points=point_ids)
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


