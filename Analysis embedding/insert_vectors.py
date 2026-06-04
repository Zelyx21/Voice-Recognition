from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue
import pandas as pd
import numpy as np

client = QdrantClient(host="localhost", port=6333)
COLLECTION = "voice_data_base"

df = pd.read_csv("french_results.csv")

usernames = df["username"].dropna().unique()

embeddings = {}

for username in usernames:
    results, _ = client.scroll(
        collection_name=COLLECTION,
        scroll_filter=Filter(
            must=[FieldCondition(key="username", match=MatchValue(value=username))]
        ),
        with_vectors=True,
        limit=1000
    )
    
    if results:
        vectors = [p.vector for p in results if p.vector is not None]
        if vectors:
            # Moyenne des vecteurs du locuteur
            embeddings[username] = np.mean(vectors, axis=0)

# Ajouter les embeddings au CSV
embedding_df = pd.DataFrame.from_dict(embeddings, orient="index")
embedding_df.index.name = "username"
embedding_df.columns = [f"emb_{i}" for i in range(embedding_df.shape[1])]

df_enriched = df.merge(embedding_df, on="username", how="left")
df_enriched.to_csv("ton_fichier_avec_embeddings.csv", index=False)

print(f"Embeddings récupérés pour {len(embeddings)} locuteurs")
print(f"Lignes conservées : {len(df_enriched)}")