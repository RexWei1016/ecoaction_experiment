# EcoAction Offline TTS Backend (Sherpa-ONNX / MatchaTTS)

目標：完全離線、支援繁中＋英文、可部署成 API 服務、並保留未來擴充多 TTS 後端（VITS / gTTS）的介面。

## 架構

Client → FastAPI TTS Server → TTS Adapter（統一介面）→ Sherpa-ONNX (MatchaTTS) → WAV

- FastAPI 入口：`server.py`
- 相容入口：`app.py`（保留給 `uvicorn app:app`）
- Adapter：`tts_adapter/`

## Step 1：環境準備

需求：Python 3.9–3.11，CPU 即可。

```bash
python -m venv venv
venv\Scripts\activate

pip install --upgrade pip
pip install -r requirements.txt
```

## Step 2：下載模型（必做）

此 repo 不包含模型，請自行下載 MatchaTTS zh+en 的必要檔案並放入（缺任何一個都會跑不起來）：

- 聲學模型（acoustic model）：`model-steps-*.onnx`
- tokens：`tokens.txt`
- 聲碼器（vocoder）：`vocos-16khz-univ.onnx`（官方註明必須用這個）

另外，實務上 zh-en 模型通常也需要：

- `lexicon.txt`
- `espeak-ng-data/`（資料夾）
- `phone-zh.fst` / `date-zh.fst` / `number-zh.fst`（中文正規化規則）

```
models/
└── matcha-zh-en/
  ├── model-steps-3.onnx         # 或 model-steps-*.onnx
  ├── tokens.txt
  ├── lexicon.txt
  └── vocos-16khz-univ.onnx
    
  # 推薦一起放（zh-en 常用得到）
  ├── espeak-ng-data/
  ├── phone-zh.fst
  ├── date-zh.fst
  └── number-zh.fst
```

### 推薦（最穩、最不會漏檔）：先下載 sherpa-onnx 官方 zh-en 資產包

這包會提供：`lexicon.txt`、`tokens.txt`、`espeak-ng-data/`、以及 `phone/date/number-zh.fst`。

Windows PowerShell：

```powershell
Set-Location -Path .\models
Invoke-WebRequest -Uri "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/matcha-icefall-zh-en.tar.bz2" -OutFile "matcha-icefall-zh-en.tar.bz2"
tar -xvf "matcha-icefall-zh-en.tar.bz2"
```

接著把裡面的必要檔案複製到 `models/matcha-zh-en/`（團隊統一放置路徑）：

```powershell
Copy-Item -Force .\matcha-icefall-zh-en\lexicon.txt .\matcha-zh-en\lexicon.txt
Copy-Item -Force .\matcha-icefall-zh-en\tokens.txt .\matcha-zh-en\tokens.txt
Copy-Item -Force .\matcha-icefall-zh-en\phone-zh.fst .\matcha-zh-en\phone-zh.fst
Copy-Item -Force .\matcha-icefall-zh-en\date-zh.fst .\matcha-zh-en\date-zh.fst
Copy-Item -Force .\matcha-icefall-zh-en\number-zh.fst .\matcha-zh-en\number-zh.fst
Copy-Item -Recurse -Force .\matcha-icefall-zh-en\espeak-ng-data .\matcha-zh-en\espeak-ng-data
```

### 推薦下載方式（最不容易漏檔）：ModelScope CLI

安裝：

```bash
pip install modelscope
```

下載完整模型庫（通常包含 model-steps-*.onnx / tokens.txt / lexicon.txt 等）：

```bash
modelscope download --model dengcunqin/matcha_tts_zh_en_20251010
```

> 注意：上述 ModelScope 模型實際下載下來的 tokens 檔名可能叫 `vocab_tts.txt`。
> 本專案預設使用 `tokens.txt`，你可用以下方式對齊：

```powershell
Copy-Item -Force .\models\matcha-zh-en\vocab_tts.txt .\models\matcha-zh-en\tokens.txt
```

### 下載 vocos（建議用 GitHub Releases）

到 sherpa-onnx 的 GitHub Releases 下載 `vocos-16khz-univ.onnx`，並放到 `models/matcha-zh-en/`。

預設路徑可用環境變數覆蓋：

- `SHERPA_MATCHA_DIR`（預設 `models/matcha-zh-en`）
- `SHERPA_MATCHA_ACOUSTIC_MODEL`（預設會在 `SHERPA_MATCHA_DIR` 下自動挑最新的 `model-steps-*.onnx`）
- `SHERPA_MATCHA_VOCODER`（預設 `models/matcha-zh-en/vocos-16khz-univ.onnx`）
- `SHERPA_MATCHA_TOKENS`（預設 `models/matcha-zh-en/tokens.txt`）
- `SHERPA_MATCHA_LEXICON`（預設若存在則用 `models/matcha-zh-en/lexicon.txt`，否則不使用）
- `SHERPA_MATCHA_DATA_DIR`（選用；對應 sherpa-onnx 的 Matcha data_dir，用於 phonemizer/字典資料）
- `SHERPA_MATCHA_DICT_DIR`（選用；對應 sherpa-onnx 的 Matcha dict_dir）
- `TTS_NUM_THREADS`（預設 `4`）

相容舊環境變數：`SHERPA_MATCHA_MODEL` 仍會被視為 acoustic model。

## Step 3：最小可跑離線驗證

```bash
python test_tts.py
```

成功條件：產生 `output.wav` 且可播放。

## Step 5：FastAPI 服務

啟動：

```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```

測試：

```bash
curl -X POST "http://localhost:8000/tts?text=你好世界" --output out.wav
```

## （建議）用官方 CLI 先驗證模型最省事

> 注意：在 Windows + 目前這版 pip wheel，可能不會出現 `sherpa-onnx-offline-tts` 這個 console script。
> 你仍然可以用本專案提供的 [offline_tts_cli.py](offline_tts_cli.py) 做同樣的驗證。

help：

```bash
python offline_tts_cli.py --help
```

最小可跑範例（路徑請依你放置調整）：

```bash
python offline_tts_cli.py \
  --matcha-acoustic-model=./models/matcha-zh-en/model-steps-3.onnx \
  --matcha-vocoder=./models/matcha-zh-en/vocos-16khz-univ.onnx \
  --matcha-tokens=./models/matcha-zh-en/tokens.txt \
  --matcha-lexicon=./models/matcha-zh-en/lexicon.txt \
  --matcha-data-dir=./models/matcha-zh-en/espeak-ng-data \
  --tts-rule-fsts=./models/matcha-zh-en/phone-zh.fst,./models/matcha-zh-en/date-zh.fst,./models/matcha-zh-en/number-zh.fst \
  --output-wav=./generated.wav \
  "中英文合成測試。It supports both English 和中文。"
```

## API

### `POST /tts`

- Query 參數：
  - `text`（必填）
  - `sid`（預設 `0`）
  - `speed`（預設 `1.0`）
- 回傳：`audio/wav`

### `GET /health`

回傳：`{"status":"ok","engine":"sherpa-onnx(matcha)","ready":true}`

## Step 6：Docker（CPU）

建置：

```bash
docker build -t ecoaction-tts-offline .
```

執行（方式 A：建議用 volume 掛載模型；image 較小，但每台機器需要有模型檔）：

```bash
docker run -p 8000:8000 -v "${PWD}/models:/app/models" ecoaction-tts-offline
```

執行（方式 B：不想手動下載模型 → build 時自動下載；image 會變大）：

```bash
docker build --build-arg DOWNLOAD_MODELS=1 -t ecoaction-tts-offline:with-models .
docker run -p 8000:8000 ecoaction-tts-offline:with-models
```
