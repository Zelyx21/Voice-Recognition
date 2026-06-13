FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/venv/bin:$PATH"

# =========================
# 1. System dependencies
# =========================
RUN apt-get update && apt-get install -y \
    software-properties-common \
    git \
    ffmpeg \
    build-essential \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# =========================
# 2. Python 3.10
# =========================
RUN add-apt-repository ppa:deadsnakes/ppa && \
    apt-get update && apt-get install -y \
    python3.10 \
    python3.10-dev \
    python3.10-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

RUN ln -sf /usr/bin/python3.10 /usr/bin/python

# =========================
# 3. Virtual environment
# =========================
RUN python -m venv /venv
RUN pip install --upgrade pip setuptools wheel

# =========================
# 4. PyTorch (GPU)
# =========================
RUN pip install torch torchaudio \
    --index-url https://download.pytorch.org/whl/cu124

# =========================
# 5. Install dependencies
# =========================

COPY new_requirements.txt /app/new_requirements.txt

RUN pip install --no-cache-dir -r new_requirements.txt

# =========================
# 6. Copy project LAST
# =========================
COPY . .

# =========================
# 7. Expose API
# =========================
EXPOSE 8000