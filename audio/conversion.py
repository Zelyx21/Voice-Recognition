"""
Python file which contains a function that converts an audio file to a wav
"""

import subprocess

def conversion(audio:bytes):
    """
    Takes raw audio bytes and returns wav bytes
    """
    commande = ["ffmpeg","-i","pipe:0","-f","wav","pipe:1"]

    result = subprocess.run(commande, input=audio, capture_output=True)

    if result.returncode != 0:
        raise ValueError(f"ffmpeg error : {result.stderr.decode()}")
    
    return result.stdout