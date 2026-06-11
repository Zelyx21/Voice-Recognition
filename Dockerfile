FROM nvidia/cuda:13.0.0-cudnn-runtime-ubuntu24.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    git \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --upgrade pip

RUN pip install --no-cache-dir -r new_requirements.txt

RUN pip install --no-deps git+https://github.com/myshell-ai/MeloTTS.git

EXPOSE 8000