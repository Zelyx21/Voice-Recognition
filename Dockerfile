FROM nvidia/cuda:13.0.0-cudnn-runtime-ubuntu24.04

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    ffmpeg \
    git \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3 /usr/bin/python

COPY . .

RUN python -m pip install --upgrade pip

RUN python -m pip install --no-cache-dir -r new_requirements.txt

RUN python -m pip install --no-deps git+https://github.com/myshell-ai/MeloTTS.git

EXPOSE 8000