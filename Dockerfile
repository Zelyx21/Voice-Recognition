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
    libsndfile1 \
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
# 4. PyTorch (GPU cu124)
# =========================
RUN pip install torch==2.4.1+cu124 torchaudio==2.4.1+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# =========================
# 5. Core ML dependencies
# =========================
COPY requirements_docker.txt /app/requirements_docker.txt

RUN pip install --no-cache-dir -r requirements_docker.txt

# =========================
# 7. Copy project
# =========================
COPY . .

# =========================
# 8. Expose API
# =========================
EXPOSE 8000
CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]