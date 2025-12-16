from __future__ import annotations

import io
import logging

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from tts_adapter import create_tts_engine

logger = logging.getLogger(__name__)

app = FastAPI(title="EcoAction Offline TTS", description="Offline TTS via Sherpa-ONNX MatchaTTS")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TTSBody(BaseModel):
    text: str
    sid: int = 0
    speed: float = 1.0


_tts_engine = None
_startup_error: str | None = None


@app.on_event("startup")
def _startup() -> None:
    global _tts_engine, _startup_error
    try:
        _tts_engine = create_tts_engine()
        _startup_error = None
        logger.info("TTS engine initialized")
    except Exception as e:
        _tts_engine = None
        _startup_error = str(e)
        logger.exception("TTS engine init failed")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "engine": "sherpa-onnx(matcha)",
        "ready": _tts_engine is not None,
        "error": _startup_error,
    }


@app.post("/tts")
def tts_api(
    text: str | None = Query(default=None),
    sid: int = Query(default=0),
    speed: float = Query(default=1.0),
    body: TTSBody | None = None,
):
    if _tts_engine is None:
        raise HTTPException(status_code=503, detail=_startup_error or "TTS engine not ready")

    effective_text = (text if text is not None else (body.text if body else None))
    effective_sid = sid if text is not None else ((body.sid if body else sid))
    effective_speed = speed if text is not None else ((body.speed if body else speed))

    if effective_text is None:
        raise HTTPException(status_code=422, detail="Missing text")

    try:
        audio_bytes = _tts_engine.synthesize(effective_text, sid=effective_sid, speed=effective_speed)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        logger.exception("TTS synthesis failed")
        raise HTTPException(status_code=500, detail=f"TTS synthesis failed: {e}")

    return StreamingResponse(io.BytesIO(audio_bytes), media_type="audio/wav")
