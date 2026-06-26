# ─────────────────────────────────────────────
# Base : CUDA 12.4 + Python 3.10 sur Ubuntu 22.04
# Correspond à la V100 du lab Dell
# ─────────────────────────────────────────────
FROM nvidia/cuda:12.4.1-cudnn-runtime-ubuntu22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV HF_HUB_OFFLINE=1

# ── Variables proxy Dell (à adapter ou supprimer hors lab) ──
# ARG HTTP_PROXY
# ARG HTTPS_PROXY
# ENV http_proxy=$HTTP_PROXY
# ENV https_proxy=$HTTPS_PROXY

WORKDIR /app

# ─────────────────────────────────────────────
# 1. Dépendances système
# ─────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.10 \
    python3.10-venv \
    python3.10-dev \
    python3-pip \
    ffmpeg \
    git \
    build-essential \
    libsndfile1 \
    mecab \
    libmecab-dev \
    mecab-ipadic-utf8 \
    && rm -rf /var/lib/apt/lists/*

# Alias python → python3.10
RUN ln -sf /usr/bin/python3.10 /usr/bin/python3 && \
    ln -sf /usr/bin/python3.10 /usr/bin/python

# ─────────────────────────────────────────────
# 2. Upgrade pip
# ─────────────────────────────────────────────
RUN python3 -m pip install --upgrade pip setuptools wheel

# ─────────────────────────────────────────────
# 3. PyTorch CUDA en premier (lourd, mis en cache Docker)
# ─────────────────────────────────────────────
RUN pip install --no-cache-dir \
    torch==2.4.1+cu124 \
    torchaudio==2.4.1+cu124 \
    --index-url https://download.pytorch.org/whl/cu124

# ─────────────────────────────────────────────
# 4. Requirements du projet
# ─────────────────────────────────────────────
COPY requirements_docker.txt .
RUN pip install --no-cache-dir -r requirements_docker.txt

# ─────────────────────────────────────────────
# 5. Code source (sans les modèles grâce au .dockerignore)
# ─────────────────────────────────────────────
COPY . .

# ─────────────────────────────────────────────
# 6. CosyVoice : install du package Python interne
# ─────────────────────────────────────────────
RUN if [ -f "CosyVoice/setup.py" ] || [ -f "CosyVoice/pyproject.toml" ]; then \
        pip install --no-cache-dir -e CosyVoice/; \
    fi

# ─────────────────────────────────────────────
# 7. Port exposé + commande de démarrage
# ─────────────────────────────────────────────
EXPOSE 8000

CMD ["uvicorn", "api.api:app", "--host", "0.0.0.0", "--port", "8000"]