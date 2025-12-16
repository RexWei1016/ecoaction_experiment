# Use an official Python runtime as a parent image
# For GPU support, use: FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (if needed for audio libraries like sndfile)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    curl \
    bzip2 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Optional: download models during build so users don't need to fetch them manually.
# This makes the image much larger. Default is OFF.
ARG DOWNLOAD_MODELS=0
RUN if [ "$DOWNLOAD_MODELS" = "1" ]; then \
            mkdir -p /app/models/matcha-zh-en; \
            cd /app/models; \
            curl -L -o matcha-icefall-zh-en.tar.bz2 https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/matcha-icefall-zh-en.tar.bz2; \
            tar -xvf matcha-icefall-zh-en.tar.bz2; \
            cp -f matcha-icefall-zh-en/lexicon.txt matcha-zh-en/lexicon.txt; \
            cp -f matcha-icefall-zh-en/tokens.txt matcha-zh-en/tokens.txt; \
            cp -f matcha-icefall-zh-en/phone-zh.fst matcha-zh-en/phone-zh.fst; \
            cp -f matcha-icefall-zh-en/date-zh.fst matcha-zh-en/date-zh.fst; \
            cp -f matcha-icefall-zh-en/number-zh.fst matcha-zh-en/number-zh.fst; \
            cp -f matcha-icefall-zh-en/model-steps-3.onnx matcha-zh-en/model-steps-3.onnx; \
            cp -rf matcha-icefall-zh-en/espeak-ng-data matcha-zh-en/espeak-ng-data; \
            curl -L -o matcha-zh-en/vocos-16khz-univ.onnx https://github.com/k2-fsa/sherpa-onnx/releases/download/vocoder-models/vocos-16khz-univ.onnx; \
            rm -f matcha-icefall-zh-en.tar.bz2; \
            rm -rf matcha-icefall-zh-en; \
        fi

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]

