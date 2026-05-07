"""
Python file that converts an audio file to a .wav file
"""

import subprocess

# Will modify later so it works with FastAPI
# catch "name_file"
name_file = "test.m4a"
input_path = "audio\\audio_input\\" + str(name_file)
output_path = "audio\\audio_output_conversion\\" + name_file.rsplit(".", 1)[0] + ".wav"

subprocess.run(["ffmpeg", "-i", input_path, output_path])