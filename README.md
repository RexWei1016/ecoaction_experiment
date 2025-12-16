# EcoAction Experiment

這是一個關於永續生活行為介入的互動實驗平台，結合了互動式網頁前端與客製化的語音合成後端。

## 專案架構

本專案分為兩個主要部分：

1.  **Frontend (React)**: 提供使用者互動介面、問卷調查、影片播放與即時語音回饋。
2.  **TTS Backend (Python)**: 提供高品質的繁體中文語音合成服務，具備雙引擎架構。

## 功能特色

*   **互動式對話**: 透過 Typewriter 打字機效果呈現引導語。
*   **多媒體整合**: 嵌入 YouTube 影片與即時語音播放。
*   **離線 TTS 後端**:
  *   **Sherpa-ONNX (MatchaTTS zh + en)**：完全離線、支援繁中＋英文、CPU 即可部署。
*   **參數化控制**: 支援調整語速 (Speed) 與 speaker id（sid）。

---

## 快速開始

### 1. 前端 (Frontend)

確保您已安裝 Node.js。

```bash
# 安裝依賴
npm install

# 設定環境變數 (如果有需要)
# cp .env.example .env

# 啟動開發伺服器
npm run dev
```

前端服務預設運行於: `http://localhost:5173`

### 2. TTS 後端 (Backend)

確保您已安裝 Python 3.8+。

```bash
cd tts-backend

# 建議建立虛擬環境
# python -m venv venv
# source venv/bin/activate  # Windows: venv\Scripts\activate

# 安裝依賴
pip install -r requirements.txt

# 啟動服務
uvicorn server:app --host 0.0.0.0 --port 8000
```

後端服務預設運行於: `http://localhost:8000`

前端可用 Vite 環境變數指定 TTS 端點（預設 `http://localhost:8000/tts`）：

* `VITE_TTS_API_URL=http://localhost:8000/tts`

---

## TTS API 說明

後端提供了一個統一的 API 介面供前端呼叫。

### `POST /tts`

將文字轉換為語音音訊串流。

此後端以 query 參數為主：

`POST /tts?text=...&speed=1.0&sid=0`

---


更多後端細節（模型下載、Docker 掛載模型等）請看：`tts-backend/README.md`。
