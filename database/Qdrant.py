
from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, HnswConfigDiff, VectorParams, PointStruct
import numpy as np

client = QdrantClient(url="http://localhost:6333")

#print(client.get_collections()) #Show the collections in the database


if "voice_data_base" not in [collection.name for collection in client.get_collections().collections]:

    client.create_collection(
        collection_name="voice_data_base",
        vectors_config=VectorParams(size=192,     #Change the size parameter to match the dimensionality, here 192
                                    distance=Distance.COSINE, 
                                    on_disk=False, #False, on memory storage, switch to True for disk storage
                                    datatype="float32"
                                    ),
        quantization_config =None, #Vector compression: None for no compression and faster search, switch to ScalarQuantizationConfig for compression and smaller RAM usage
        hnsw_config=HnswConfigDiff(
            m=16,           # linked number of vectors, recall/RAM
            ef_construct=200, # Exploration queue size, Accuracy/speed
            on_disk=False, #False, on memory storage, switch to True for disk storage
            inline_storage=False #Turn True if on_disk is True and quantization_config is not None.
        ),
        optimizers_config=models.OptimizersConfigDiff(default_segment_number=2, max_segment_size=5000000), #number of cores use for a single request, speed/RAM and segment size, speed/RAM

    )


def insert_points(client, base, names, emails, vectors):
    i=1
    for name, email, vector in zip(names, emails, vectors):
        operation_info = client.upsert(
            collection_name=base,
            wait=True,
            points=[
                PointStruct(id=i,
                            vector=vector,
                            payload={"name": name, 
                                     "email": email}),
            ],
        )
        i += 1

    print(operation_info)

#insert_points(client, "voice_db", ["Alice", "Boba"], ["alice@example.com", "bob@example.com"], [[0.9, 0.9, 0.9, 0.8], [0.1, 0.2, 0.7, 0.3]])

clem_vec = np.load('Voice-Recognition/database/clem.npy', allow_pickle=True)
sid_vec = np.load('Voice-Recognition/database/sidney.npy', allow_pickle=True)

insert_points(client, "voice_data_base", ["clem", "sid"], ["clem@example.com", "sid@example.com"], [clem_vec, sid_vec])


def search_points(client, base, query_vector, top_k=1):
    search_result = client.query_points(
        collection_name=base,
        query_vector=query_vector,
        limit=top_k,
        search_params=models.SearchParams(
            hnsw_ef=200, # Number of neighbors to visit during search, Accuracy/speed
            exact=False # Set to True for exact search, False for approximate search 
        )
    )
    return search_result





