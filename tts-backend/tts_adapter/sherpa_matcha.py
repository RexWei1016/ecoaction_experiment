from __future__ import annotations

import io
import os
from dataclasses import dataclass

import sherpa_onnx
import soundfile as sf

from .base import BaseTTS


@dataclass(frozen=True)
class SherpaMatchaPaths:
    acoustic_model: str
    vocoder: str
    tokens: str
    lexicon: str = ""
    data_dir: str = ""
    dict_dir: str = ""
    rule_fsts: str = ""


class SherpaMatchaTTS(BaseTTS):
    def __init__(
        self,
        paths: SherpaMatchaPaths,
        *,
        num_threads: int = 4,
    ) -> None:
        if not os.path.exists(paths.acoustic_model):
            raise FileNotFoundError(
                "Matcha acoustic model not found: "
                f"{paths.acoustic_model}. Expected a file like model-steps-*.onnx"
            )
        if not os.path.exists(paths.vocoder):
            raise FileNotFoundError(
                "Matcha vocoder not found: "
                f"{paths.vocoder}. Expected vocos-16khz-univ.onnx"
            )
        if not os.path.exists(paths.tokens):
            raise FileNotFoundError(f"Tokens file not found: {paths.tokens}")
        if paths.lexicon and not os.path.exists(paths.lexicon):
            raise FileNotFoundError(f"Lexicon file not found: {paths.lexicon}")

        model_config = sherpa_onnx.OfflineTtsModelConfig(
            matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
                acoustic_model=paths.acoustic_model,
                vocoder=paths.vocoder,
                tokens=paths.tokens,
                lexicon=paths.lexicon,
                data_dir=paths.data_dir,
                dict_dir=paths.dict_dir,
            ),
            provider="cpu",
            num_threads=num_threads,
            debug=False,
        )

        config = sherpa_onnx.OfflineTtsConfig(
            model=model_config,
            rule_fsts=paths.rule_fsts,
            max_num_sentences=1,
        )

        if hasattr(config, "validate") and not config.validate():
            raise RuntimeError("Invalid sherpa-onnx TTS config")

        self._tts = sherpa_onnx.OfflineTts(config)

    def synthesize(self, text: str, *, sid: int = 0, speed: float = 1.0) -> bytes:
        text = (text or "").strip()
        if not text:
            raise ValueError("text is empty")

        audio = self._tts.generate(text=text, sid=sid, speed=speed)

        buf = io.BytesIO()
        sf.write(buf, audio.samples, audio.sample_rate, format="WAV")
        buf.seek(0)
        return buf.read()
