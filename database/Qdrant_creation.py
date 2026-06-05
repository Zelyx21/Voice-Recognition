
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
            m=32,           # linked number of vectors, recall/RAM
            ef_construct=512, # Exploration queue size, Accuracy/speed
            on_disk=False, #False, on memory storage, switch to True for disk storage
            inline_storage=False #Turn True if on_disk is True and quantization_config is not None.
        ),
        optimizers_config=models.OptimizersConfigDiff(default_segment_number=2, max_segment_size=5000000), #number of cores use for a single request, speed/RAM and segment size, speed/RAM
    
    )
