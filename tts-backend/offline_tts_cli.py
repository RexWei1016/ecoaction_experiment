from __future__ import annotations

import argparse
import io
import os
from pathlib import Path

import sherpa_onnx
import soundfile as sf


def _require_path(p: str, label: str) -> None:
    if not os.path.exists(p):
        raise FileNotFoundError(f"{label} does not exist: {p}")


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Minimal offline TTS CLI wrapper for sherpa-onnx MatchaTTS (zh + en)."
    )

    parser.add_argument(
        "--matcha-acoustic-model",
        required=True,
        help="Path to acoustic model, e.g. model-steps-3.onnx",
    )
    parser.add_argument(
        "--matcha-vocoder",
        required=True,
        help="Path to vocoder model, e.g. vocos-16khz-univ.onnx",
    )
    parser.add_argument(
        "--matcha-tokens",
        required=True,
        help="Path to tokens.txt",
    )
    parser.add_argument(
        "--matcha-lexicon",
        default="",
        help="Path to lexicon.txt (recommended for zh-en).",
    )
    parser.add_argument(
        "--matcha-data-dir",
        default="",
        help="Path to Matcha data dir (e.g. espeak-ng-data).",
    )
    parser.add_argument(
        "--matcha-dict-dir",
        default="",
        help="Optional dict dir.",
    )
    parser.add_argument(
        "--tts-rule-fsts",
        default="",
        help="Comma-separated list of rule fst files (e.g. phone-zh.fst,date-zh.fst,number-zh.fst).",
    )
    parser.add_argument(
        "--output-wav",
        required=True,
        help="Output wav path.",
    )
    parser.add_argument("--sid", type=int, default=0)
    parser.add_argument("--speed", type=float, default=1.0)
    parser.add_argument("--num-threads", type=int, default=4)

    parser.add_argument("text", help="Text to synthesize")

    return parser.parse_args()


def main() -> None:
    args = _parse_args()

    _require_path(args.matcha_acoustic_model, "--matcha-acoustic-model")
    _require_path(args.matcha_vocoder, "--matcha-vocoder")
    _require_path(args.matcha_tokens, "--matcha-tokens")
    if args.matcha_lexicon:
        _require_path(args.matcha_lexicon, "--matcha-lexicon")
    if args.matcha_data_dir:
        _require_path(args.matcha_data_dir, "--matcha-data-dir")

    model_config = sherpa_onnx.OfflineTtsModelConfig(
        matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
            acoustic_model=args.matcha_acoustic_model,
            vocoder=args.matcha_vocoder,
            tokens=args.matcha_tokens,
            lexicon=args.matcha_lexicon,
            data_dir=args.matcha_data_dir,
            dict_dir=args.matcha_dict_dir,
        ),
        provider="cpu",
        num_threads=args.num_threads,
        debug=False,
    )

    config = sherpa_onnx.OfflineTtsConfig(
        model=model_config,
        rule_fsts=args.tts_rule_fsts,
        max_num_sentences=1,
    )

    if hasattr(config, "validate") and not config.validate():
        raise RuntimeError("Invalid sherpa-onnx TTS config")

    tts = sherpa_onnx.OfflineTts(config)

    text = (args.text or "").strip()
    if not text:
        raise ValueError("text is empty")

    audio = tts.generate(text=text, sid=args.sid, speed=args.speed)

    out_path = Path(args.output_wav)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    # Write WAV
    buf = io.BytesIO()
    sf.write(buf, audio.samples, audio.sample_rate, format="WAV")
    out_path.write_bytes(buf.getvalue())

    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
