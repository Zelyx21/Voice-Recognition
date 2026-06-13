from audio.conversion import conversion
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import search_similarity_attributes, search_multi_similarity
import base64

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

    results = search_similarity_attributes(query_vector=emb.tolist(), top_k=1)
    print("results: \n" + str(results))


    #return a dictionnary
    return results[0]

def multi_similarity(audios:list):
    """
    Takes an list of raw audio bytes and returns a list of dictionnary wich contains the most similars speakers
    """
    list_vectors=[]
    for audio_bytes in audios:
        audio_unique = audio_bytes["audio"]
        audio_unique = base64.b64decode(audio_unique)
        
        raw = conversion(audio_unique)
        audio, sr = resample(raw)
        audio = denoise(audio,sr)
        audio, issue = vad(audio,sr)

        if issue[0]: # if there is an issue with the audio file (no voice detected)
            return {"name": None, "score": 0, "issue": issue[1]}
        
        emb = embedding(audio)
        list_vectors.append(emb.tolist())

    results = search_multi_similarity(query_vectors=list_vectors)
    for result in results:
        print("result: \n" + str(result))

    return results  
