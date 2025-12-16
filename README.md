# EcoAction Experiment

這是一個關於永續生活行為介入的互動實驗平台，結合了互動式網頁前端與客製化的語音合成後端。

## 專案架構

本專案分為兩個主要部分：

1.  **Frontend (React)**: 提供使用者互動介面、問卷調查、影片播放與即時語音回饋。
2.  **TTS Backend (Python)**: 提供高品質的繁體中文語音合成服務，具備雙引擎架構。

## 功能特色

*   **互動式對話**: 透過 Typewriter 打字機效果呈現引導語。
*   **多媒體整合**: 嵌入 YouTube 影片與即時語音播放。
*   **雙引擎 TTS 後端**:
    *   **Local (Sherpa-ONNX)**: 使用 VITS 模型 (Huayan) 進行本地離線語音合成，速度快且無須聯網。
    *   **Cloud Fallback (gTTS)**: 當本地模型失敗或未下載時，自動切換至 Google TTS 服務。
*   **參數化控制**: 支援調整語速 (Speed)、性別 (Gender) 與引擎選擇 (Engine)。

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
python app.py
```

後端服務預設運行於: `http://localhost:8000`

---

## TTS API 說明

後端提供了一個統一的 API 介面供前端呼叫。

### `POST /tts`

將文字轉換為語音音訊串流。

**Request Body (JSON):**

```json
{
  "text": "你好，歡迎參加實驗。",
  "speed": 1.0,           // 語速 (預設 1.0)
  "gender": "male",       // 性別 (目前主要影響前端顯示或特定模型選擇)
  "engine": "auto"        // 引擎選擇: "auto" | "local" | "gtts"
}
```

*   **engine**:
    *   `auto` (推薦): 優先嘗試本地模型，若失敗自動切換至 gTTS。
    *   `local`: 強制使用本地 Sherpa-ONNX 模型。
    *   `gtts`: 強制使用 Google TTS。

---

## 關於 gTTS (Google Text-to-Speech)

本專案使用 `gTTS` 作為備援方案。

*   **性質**: 這是一個非官方的 Python 庫，透過介接 Google Translate 的 TTS API 來生成語音。
*   **費用**: **免費**。該庫本身開源且免費，Google Translate 的公開 API 目前也是免費存取。
*   **限制**: 雖然免費，但**並非無限用量**。Google 會對來自同一 IP 的大量請求進行頻率限制 (Rate Limiting)，若請求過於頻繁可能會暫時被封鎖 (HTTP 429)。
*   **建議**: 僅建議作為開發測試或流量較低時的備援使用。正式高負載環境建議優先使用本地模型 (Sherpa-ONNX) 或付費商業 API。
