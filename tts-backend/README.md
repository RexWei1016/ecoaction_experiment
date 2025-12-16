# EcoAction TTS Backend

這是一個專為 EcoAction 專案設計的繁體中文語音合成 (TTS) 後端服務。
它具備高可用性設計，優先使用微軟 Edge TTS 引擎，若連線失敗則自動切換至 Google TTS (gTTS) 作為備援。

## 功能特色

*   **雙引擎架構**：
    *   **主要引擎**：`edge-tts` (Microsoft Edge Online TTS) - 音質自然，接近真人。
    *   **備援引擎**：`gTTS` (Google TTS) - 穩定性高，確保服務不中斷。
*   **繁體中文優化**：預設針對 `zh-TW` 語系進行設定。
*   **參數控制**：支援語速 (`speed`) 與性別 (`gender`) 參數（註：gTTS 模式下性別參數無效，語速由前端控制）。
*   **Docker 支援**：提供完整的 Dockerfile，可一鍵部署。

## 安裝與執行 (本地開發)

### 1. 環境需求
*   Python 3.8+
*   網路連線 (需連接 Microsoft/Google 伺服器)

### 2. 安裝依賴套件
請在 `tts-backend` 目錄下執行：

```bash
pip install -r requirements.txt
```

### 3. 啟動服務
啟動伺服器並監聽所有網路介面 (0.0.0.0)，以便區網內的其他裝置存取：

```bash
uvicorn app:app --reload --host 0.0.0.0
```

服務啟動後，API 將位於：`http://localhost:8000` (或您的區網 IP)。

## Docker 部署 (推薦)

本專案已包含 Docker 設定，適合正式部署。

### 1. 建置映像檔 (Build Image)
```bash
docker build -t ecoaction-tts .
```

### 2. 執行容器 (Run Container)
```bash
docker run -d -p 8000:8000 --name ecoaction-tts-service ecoaction-tts
```

### 3. 檢查狀態
```bash
docker logs -f ecoaction-tts-service
```

## API 使用說明

### `POST /tts`
將文字轉換為語音 MP3 串流。

**Request Body (JSON):**
```json
{
  "text": "你好，這是一個測試。",
  "speed": 1.0,       // 語速 (0.5 ~ 2.0+)，預設 1.0
  "gender": "female"  // 性別 ("male" | "female")，預設 "female"
}
```

**Response:**
*   Content-Type: `audio/mpeg`
*   Body: 二進位 MP3 音訊資料

### `GET /health`
檢查服務健康狀態。
*   Response: `{"status": "ok", "engine": "..."}`

## 常見問題

**Q: 為什麼語速調整在 gTTS 模式下聽起來沒變？**
A: gTTS 引擎本身不支援細微的語速調整。本專案採用「前端加速」策略：後端產生標準速度音檔，由前端播放器 (`customTtsService.ts`) 根據 `speed` 參數調整播放速率 (`playbackRate`)。

**Q: 為什麼有時候會看到 "Edge TTS failed" 的警告？**
A: 這表示微軟的 TTS 服務暫時無法連線（可能是網路波動或 IP 限制）。系統會自動切換到 Google TTS，您無需擔心，服務仍會正常運作。
