"""Compatibility shim.

The TTS backend has been migrated to an offline-first FastAPI server in `server.py`
with an adapter layer under `tts_adapter/`.

Keep this file so existing commands like `uvicorn app:app` keep working.
"""

from server import app  # noqa: F401

