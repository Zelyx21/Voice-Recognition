import whisper

model = whisper.load_model("turbo")
result = model.transcribe("ai/marche.wav")
print(result["text"])