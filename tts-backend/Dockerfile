# Use an official Python runtime as a parent image
# For GPU support, use: FROM pytorch/pytorch:2.0.0-cuda11.7-cudnn8-runtime
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies (if needed for audio libraries like sndfile)
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Expose the port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]

