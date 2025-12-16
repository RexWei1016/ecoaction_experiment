import io
import os
import time
import logging
import asyncio
import urllib.request
import tarfile
import zipfile
from typing import Optional

import soundfile as sf
import sherpa_onnx
from gtts import gTTS
# from google import genai # Removing SDK import as we use REST API
from fastapi import FastAPI, HTTPException, Response
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="EcoAction TTS Service", description="Local VITS TTS with gTTS Fallback")

# CORS - Allow frontend to access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TTSRequest(BaseModel):
    text: str
    speaker_id: int = 0
    speed: float = 1.0
    gender: str = "female" # "male" or "female"
    engine: str = "auto"   # "auto", "local", "gtts", "gemini"

# --- Gemini TTS Setup ---
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

async def generate_gemini_audio(text: str, speed: float = 1.0):
    """
    Generate audio using Google Gemini API (Flash 2.5).
    """
    if not GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY not set")

    # Using REST for certainty, client initialization removed.
    pass

# --- Local TTS Setup (Sherpa-ONNX) ---

MODEL_DIR = "./models"
# Using a high quality VITS model (Huayan - Chinese)
# It's a simplified chinese model but works well for general Mandarin.
MODEL_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-zh_CN-huayan-medium.tar.bz2"
MODEL_TAR_NAME = "vits-piper-zh_CN-huayan-medium.tar.bz2"
MODEL_DIR_NAME = "vits-piper-zh_CN-huayan-medium"

tts_engine = None

def preprocess_text(text: str) -> str:
    """
    Simple text preprocessing to improve VITS rhythm.
    1. Normalize punctuation.
    2. Add pauses for better phrasing.
    """
    # Replace half-width punctuation with full-width
    text = text.replace(",", "，").replace(".", "。").replace("?", "？").replace("!", "！")
    
    # Add space around English words to help tokenizer (sometimes helps)
    # import re
    # text = re.sub(r'([a-zA-Z0-9]+)', r' \1 ', text)
    
    # Ensure there is a pause at the end if missing
    if text and text[-1] not in "。？！":
        text += "。"
        
    return text

def download_and_extract_model():
    """Checks if model exists, if not, downloads and extracts it."""
    if not os.path.exists(MODEL_DIR):
        os.makedirs(MODEL_DIR)
    
    model_path = os.path.join(MODEL_DIR, MODEL_DIR_NAME)
    if os.path.exists(model_path) and os.path.exists(os.path.join(model_path, "zh_CN-huayan-medium.onnx")):
        logger.info("Local VITS model found.")
        return

    logger.info("Downloading Local VITS model... This may take a while.")
    tar_path = os.path.join(MODEL_DIR, MODEL_TAR_NAME)
    
    try:
        # Download
        if not os.path.exists(tar_path):
            urllib.request.urlretrieve(MODEL_URL, tar_path)
            logger.info("Download complete.")
        
        # Extract
        logger.info("Extracting model...")
        with tarfile.open(tar_path, "r:bz2") as tar:
            tar.extractall(path=MODEL_DIR)
        logger.info("Extraction complete.")
        
        # Cleanup tar
        # os.remove(tar_path) 
    except Exception as e:
        logger.error(f"Failed to download/extract model: {e}")
        # Don't crash, just won't have local TTS

def init_tts_engine():
    """Initializes the Sherpa-ONNX offline TTS engine."""
    global tts_engine
    
    model_base = os.path.join(MODEL_DIR, MODEL_DIR_NAME)
    onnx_file = os.path.join(model_base, "zh_CN-huayan-medium.onnx")
    tokens_file = os.path.join(model_base, "tokens.txt")
    data_dir = os.path.join(model_base, "espeak-ng-data")

    if not os.path.exists(onnx_file):
        logger.warning("Local TTS model not found. Running in gTTS-only mode.")
        return

    try:
        config = sherpa_onnx.OfflineTtsConfig(
            model=sherpa_onnx.OfflineTtsModelConfig(
                vits=sherpa_onnx.OfflineTtsVitsModelConfig(
                    model=onnx_file,
                    lexicon="",
                    tokens=tokens_file,
                    data_dir=data_dir,
                ),
                provider="cpu", # Force CPU for compatibility
                num_threads=1,
                debug=True,
            ),
            rule_fsts="",
            max_num_sentences=1,
        )
        
        if not config.validate():
            logger.error("TTS Config is invalid")
            return

        tts_engine = sherpa_onnx.OfflineTts(config)
        logger.info("Local Sherpa-ONNX TTS Engine Initialized Successfully.")
    except Exception as e:
        logger.error(f"Failed to initialize Sherpa-ONNX: {e}")

# Run startup tasks
@app.on_event("startup")
async def startup_event():
    # Run in thread to avoid blocking startup too long, though download might block
    # For simplicity in this demo, we run it directly. In prod, use a separate init script.
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, download_and_extract_model)
    await loop.run_in_executor(None, init_tts_engine)


@app.get("/health")
def health_check():
    engine_status = "local" if tts_engine else "gtts-only"
    return {"status": "ok", "engine": engine_status}

# --- gTTS Fallback ---

async def generate_gtts_audio(text: str, lang: str = 'zh-TW', slow: bool = False):
    """Fallback: Generate audio using Google TTS."""
    mp3_fp = io.BytesIO()
    def _run_gtts():
        tts = gTTS(text, lang=lang, slow=slow)
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        return mp3_fp
    
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, _run_gtts)

# --- Main Endpoint ---

@app.post("/tts")
async def generate_speech(req: TTSRequest):
    """
    Generate speech. Tries Local VITS first, falls back to gTTS.
    """
    start_time = time.time()
    logger.info(f"TTS Request: {req.text[:10]}... Speed: {req.speed} Engine: {req.engine}")

    # Determine execution strategy
    should_try_local = False
    should_try_gtts = False
    should_try_gemini = False

    if req.engine == "local":
        should_try_local = True
    elif req.engine == "gtts":
        should_try_gtts = True
    elif req.engine == "gemini":
        should_try_gemini = True
    else: # auto
        should_try_local = True
        # If local fails, we will fall back to gTTS implicitly if we are in auto mode
    
    # 0. Try Gemini TTS (If requested)
    if should_try_gemini:
        try:
            if not GEMINI_API_KEY:
                 raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured on server")

            # NOTE: Actual implementation of Gemini TTS call needs to be robust.
            # Since the SDK is new, we will implement a direct REST call or updated SDK usage here.
            # For this step, we will use a raw REST implementation to ensure compatibility 
            # without depending on potentially unstable SDK versions for this specific feature.
            
            # Using REST for certainty:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"
            
            import aiohttp
            import base64
            
            payload = {
                "contents": [{
                    "parts": [{"text": req.text}]
                }],
                "generationConfig": {
                    "responseModalities": ["AUDIO"],
                    "speechConfig": {
                        "voiceConfig": {
                            "prebuiltVoiceConfig": {
                                "voiceName": "Fenrir"
                            }
                        }
                    }
                }
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as resp:
                    if resp.status != 200:
                        err_text = await resp.text()
                        raise Exception(f"Gemini API Error: {resp.status} - {err_text}")
                    
                    data = await resp.json()
                    # Extract audio
                    # Response structure: candidates[0].content.parts[0].inlineData.data (Base64)
                    try:
                        b64_audio = data['candidates'][0]['content']['parts'][0]['inlineData']['data']
                        audio_bytes = base64.b64decode(b64_audio)
                        
                        process_time = time.time() - start_time
                        logger.info(f"Gemini TTS Inference finished in {process_time:.4f}s")
                        
                        return StreamingResponse(
                            io.BytesIO(audio_bytes), 
                            media_type="audio/wav", # Gemini usually returns WAV or PCM
                            headers={"Content-Disposition": "inline; filename=gemini_output.wav"}
                        )
                    except (KeyError, IndexError) as e:
                         raise Exception(f"Unexpected Gemini response format: {str(e)}")

        except Exception as e:
            logger.error(f"Gemini TTS failed: {e}")
            raise HTTPException(status_code=500, detail=f"Gemini TTS failed: {str(e)}")

    # 1. Try Local TTS (Sherpa-ONNX)
    if should_try_local and tts_engine:
        try:
            # Sherpa-ONNX generation
            # Note: speed mapping. Sherpa uses 1.0 as default.
            # We can use req.speed directly.
            # sid=0 is usually the single speaker in this model.
            
            loop = asyncio.get_running_loop()
            
            def _run_local():
                # Preprocess text for better rhythm
                clean_text = preprocess_text(req.text)
                
                return tts_engine.generate(
                    text=clean_text, 
                    sid=0, 
                    speed=req.speed
                )
            
            audio = await loop.run_in_executor(None, _run_local)
            
            if len(audio.samples) > 0:
                # Convert samples (float32 array) to WAV bytes
                wav_io = io.BytesIO()
                sf.write(wav_io, audio.samples, audio.sample_rate, format='WAV')
                wav_io.seek(0)
                
                process_time = time.time() - start_time
                logger.info(f"Local TTS Inference finished in {process_time:.4f}s")
                
                return StreamingResponse(
                    wav_io, 
                    media_type="audio/wav",
                    headers={"Content-Disposition": "inline; filename=output.wav"}
                )
        except Exception as e:
            logger.error(f"Local TTS failed: {e}")
            if req.engine == "local":
                 # If explicitly requested local, fail here
                 raise HTTPException(status_code=500, detail=f"Local TTS failed: {str(e)}")
            # Otherwise fallthrough to gTTS (if auto)

    # 2. Fallback to gTTS
    if should_try_gtts or req.engine == "auto":
        try:
            logger.info("Using gTTS Fallback...")
            is_slow = req.speed < 0.85
            # Gender ignored in gTTS
            
            audio_stream = await generate_gtts_audio(req.text, slow=is_slow)
            
            process_time = time.time() - start_time
            logger.info(f"gTTS Inference finished in {process_time:.4f}s")

            return StreamingResponse(
                audio_stream, 
                media_type="audio/mpeg",
                headers={"Content-Disposition": "inline; filename=output.mp3"}
            )

        except Exception as e:
            logger.error(f"All TTS Engines failed: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
    
    # If we get here (e.g. engine=local but failed and not auto), raise error
    raise HTTPException(status_code=400, detail="No TTS engine available for the requested configuration.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
