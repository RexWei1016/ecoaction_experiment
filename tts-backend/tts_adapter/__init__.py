from __future__ import annotations

import os
from pathlib import Path

from .base import BaseTTS
from .sherpa_matcha import SherpaMatchaPaths, SherpaMatchaTTS


def _pick_latest_model_steps(model_dir: Path) -> str | None:
    candidates = []
    for p in model_dir.glob("model-steps-*.onnx"):
        # model-steps-123.onnx -> 123
        stem = p.stem
        try:
            step_str = stem.split("model-steps-", 1)[1]
            step = int(step_str)
        except Exception:
            continue
        candidates.append((step, p))

    if not candidates:
        return None

    candidates.sort(key=lambda x: x[0])
    return str(candidates[-1][1])


def create_tts_engine() -> BaseTTS:
    """Create a TTS engine instance.

    For now we default to Sherpa-ONNX MatchaTTS (zh + en).
    Future backends (VITS / gTTS) can be added behind this factory.
    """

    # Model paths
    # Sherpa-ONNX Matcha requires:
    # - acoustic_model: model-steps-*.onnx
    # - tokens: tokens.txt
    # - vocoder: vocos-16khz-univ.onnx
    model_dir = Path(os.environ.get("SHERPA_MATCHA_DIR", "models/matcha-zh-en"))

    acoustic_model = os.environ.get("SHERPA_MATCHA_ACOUSTIC_MODEL")
    if not acoustic_model:
        # Backward-compat env var (older code used SHERPA_MATCHA_MODEL)
        acoustic_model = os.environ.get("SHERPA_MATCHA_MODEL")
    if not acoustic_model:
        acoustic_model = _pick_latest_model_steps(model_dir)
    if not acoustic_model:
        legacy = model_dir / "model.onnx"
        acoustic_model = str(legacy) if legacy.exists() else str(model_dir / "model-steps-3.onnx")

    vocoder = os.environ.get("SHERPA_MATCHA_VOCODER", str(model_dir / "vocos-16khz-univ.onnx"))
    tokens = os.environ.get("SHERPA_MATCHA_TOKENS", str(model_dir / "tokens.txt"))

    # Optional. If not present, pass empty string to sherpa_onnx.
    lexicon_env = os.environ.get("SHERPA_MATCHA_LEXICON")
    if lexicon_env is not None:
        lexicon = lexicon_env
    else:
        lexicon_path = model_dir / "lexicon.txt"
        lexicon = str(lexicon_path) if lexicon_path.exists() else ""

    data_dir = os.environ.get("SHERPA_MATCHA_DATA_DIR", "")
    if not data_dir:
        default_data_dir = model_dir / "espeak-ng-data"
        if default_data_dir.exists():
            data_dir = str(default_data_dir)

    dict_dir = os.environ.get("SHERPA_MATCHA_DICT_DIR", "")

    rule_fsts = os.environ.get("TTS_RULE_FSTS", "")
    if not rule_fsts:
        fsts = []
        for name in ("phone-zh.fst", "date-zh.fst", "number-zh.fst"):
            p = model_dir / name
            if p.exists():
                fsts.append(str(p))
        if fsts:
            rule_fsts = ",".join(fsts)

    # Performance tuning
    num_threads = int(os.environ.get("TTS_NUM_THREADS", "4"))

    return SherpaMatchaTTS(
        SherpaMatchaPaths(
            acoustic_model=acoustic_model,
            vocoder=vocoder,
            tokens=tokens,
            lexicon=lexicon,
            data_dir=data_dir,
            dict_dir=dict_dir,
            rule_fsts=rule_fsts,
        ),
        num_threads=num_threads,
    )
