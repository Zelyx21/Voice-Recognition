from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import search_similarity_attributes
from ai.diari_speechbrain import diarizations


def voice_similarity(audio_bytes:bytes):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    raw = conversion(audio_bytes)
    audio, sr = resample(raw)
    audio = denoise(audio,sr)
    audio, issue = vad(audio,sr)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}
    
    emb = embedding(audio)

    #change later to have more similar speakers ? 
    results = search_similarity_attributes(query_vector=emb.tolist(), top_k=1)
    print("results: \n" + str(results))


    #change later when it'll be a dictionnary
    return results[0]
