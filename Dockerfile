FROM python:3.10-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    git \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8

COPY new_requirements.txt .

RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r new_requirements.txt

COPY . .

EXPOSE 8000