from audio.conversion import conversion, ndarray_to_wav_bytes, ndarray_to_bytes
from audio.processing import resample, denoise, vad
from ai.embedding import embedding
from database.Qdrant import search_similarity_attributes, search_multi_similarity
import base64
import io
import numpy as np
import soundfile as sf



def voice_similarity(audio_bytes:bytes, fromDiari=False):
    """
    Takes raw audio bytes and returns the most similar speaker
    """
    if not fromDiari:
        raw = conversion(audio_bytes)
        audio, sr = resample(raw)
        audio_bytes = denoise(audio,sr)

    audio, issue = vad(audio_bytes)

    if issue[0]: # if there is an issue with the audio file (no voice detected)
        return {"name": None, "score": 0, "issue": issue[1]}
    
    emb = embedding(audio)

    results = search_similarity_attributes(query_vector=emb.tolist(), top_k=1)
    print("results: \n" + str(results))


    #return a dictionnary
    return results[0]



def match_audio(audio_dict_1: dict, audio_dict_2: dict, sr: int = 16000) -> np.ndarray:
    """
    Merges two audio dicts {'audio': base64_str} into a single numpy array
    ready to be passed to vad().
    """
    segments = []
    for audio_dict in (audio_dict_1, audio_dict_2):
        raw = base64.b64decode(audio_dict["audio"])
        audio_array, _ = sf.read(io.BytesIO(raw), dtype="float32")
        segments.append(audio_array)

    silence = np.zeros(int(0.3 * sr), dtype=np.float32)  # 300ms between audios
    return np.concatenate([segments[0], silence, segments[1]])


def multi_similarity(audios:list, sample_rate=16000):

    Score_similarity_match = 0.6
    OneSpeak=False

    """
    Takes an list of raw audio bytes and returns a list of dictionnary wich contains the most similars speakers
    """

    list_vectors=[]
    for audio_bytes in audios:
        audio_unique = audio_bytes["audio"]
        audio_unique = base64.b64decode(audio_unique)
        
        audio_conv = conversion(audio_unique)
        audio, sr = resample(audio_conv)
        #audio_unique = denoise(audio,sr) # already done in diarization
        audio, issue = vad(audio)

        if issue[0]: # if there is an issue with the audio file (no voice detected)
            return {"name": None, "score": 0, "issue": issue[1]}
        
        emb = embedding(audio)
        list_vectors.append(emb.tolist())

    results = search_multi_similarity(query_vectors=list_vectors)

    email_matches: dict = {}

    for idx, result in enumerate(results):

        print(f"multi_similarity, result [{idx}]: \n{result}")

        if result["score"] > Score_similarity_match :
            current_email = result["email"]
            if current_email not in email_matches : 
                email_matches[current_email] = {
                "idx_speakers": idx,
            }
            else:
                new_audio = match_audio(audios[email_matches[current_email]["idx_speakers"]], audios[idx])
                results.append(
                    voice_similarity(new_audio, fromDiari=True)
                )
                for i_rm in sorted([idx, email_matches[current_email]["idx_speakers"]], reverse=True):
                    results.pop(i_rm)
                    audios.pop(i_rm)

                duration_sec = len(new_audio) / sample_rate
                new_audio_bytes = ndarray_to_bytes(new_audio)


                print(type(audios), "audio ----- autre:", type(new_audio_bytes))
                audios.append({
                    "audio": new_audio_bytes,
                    "duration": duration_sec
                    })

        if len(results)==1:
            OneSpeak=True

    return results, audios, OneSpeak










