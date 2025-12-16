import sherpa_onnx
import soundfile as sf
from pathlib import Path
import os

# Minimal offline verification for MatchaTTS (zh + en)

model_dir = Path("models/matcha-zh-en")

# Pick a reasonable default; you can override by editing the paths below.
acoustic_candidates = sorted(model_dir.glob("model-steps-*.onnx"))
acoustic_model = str(acoustic_candidates[-1]) if acoustic_candidates else str(model_dir / "model-steps-3.onnx")
vocoder = str(model_dir / "vocos-16khz-univ.onnx")
tokens = str(model_dir / "tokens.txt")
lexicon_path = model_dir / "lexicon.txt"
lexicon = str(lexicon_path) if lexicon_path.exists() else ""

data_dir_path = model_dir / "espeak-ng-data"
data_dir = str(data_dir_path) if data_dir_path.exists() else ""

fsts = []
for name in ("phone-zh.fst", "date-zh.fst", "number-zh.fst"):
    p = model_dir / name
    if p.exists():
        fsts.append(str(p))
rule_fsts = ",".join(fsts) if fsts else ""

missing = []
if not os.path.exists(acoustic_model):
    missing.append(f"acoustic_model: {acoustic_model} (model-steps-*.onnx)")
if not os.path.exists(vocoder):
    missing.append(f"vocoder: {vocoder} (vocos-16khz-univ.onnx)")
if not os.path.exists(tokens):
    missing.append(f"tokens: {tokens} (tokens.txt)")
if not lexicon:
    missing.append(f"lexicon: {model_dir / 'lexicon.txt'} (lexicon.txt)")
if not data_dir:
    missing.append(f"data_dir: {data_dir_path} (espeak-ng-data directory)")
if missing:
    raise FileNotFoundError(
        "Missing required MatchaTTS files under models/matcha-zh-en:\n- "
        + "\n- ".join(missing)
    )

model_config = sherpa_onnx.OfflineTtsModelConfig(
    matcha=sherpa_onnx.OfflineTtsMatchaModelConfig(
        acoustic_model=acoustic_model,
        vocoder=vocoder,
        tokens=tokens,
        lexicon=lexicon,
        data_dir=data_dir,
    ),
    provider="cpu",
    num_threads=4,
    debug=False,
)

config = sherpa_onnx.OfflineTtsConfig(
    model=model_config,
    rule_fsts=rule_fsts,
    max_num_sentences=1,
)

if hasattr(config, "validate") and not config.validate():
    raise RuntimeError("Invalid sherpa-onnx TTS config")

tts = sherpa_onnx.OfflineTts(config)

audio = tts.generate(
    text="你好，這是 Sherpa ONNX 的繁體中文與 English 測試。",
    sid=0,
    speed=1.0,
)

sf.write("output.wav", audio.samples, audio.sample_rate)
print("Wrote output.wav")
