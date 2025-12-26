# EcoAction Experiment - 部署快速參考

## 📋 檔案清單

| 檔案 | 說明 |
|------|------|
| [data-collection-guide.md](./data-collection-guide.md) | 完整資料收集指南（給協作者） |
| [gas-test-guide.md](./gas-test-guide.md) | GAS 測試指南（正式實驗前必做） |
| [interaction-log-schema.md](./interaction-log-schema.md) | 互動日誌架構 |

---

## 🚀 部署步驟總覽

### 1️⃣ Google Sheets 設定（已完成 ✅）

- [x] 建立 Google Sheet
- [x] 建立三張 Sheet：「實驗資料」、「error_log」、「meta_log」
- [ ] 設定欄位標題（第1列）
- [ ] 設定公式（quizCorrect, commitmentMean, identityMean）

**參考**：[data-collection-guide.md 第 5.2 節](./data-collection-guide.md#52-google-sheets-設計)

---

### 2️⃣ Google Apps Script 部署（已完成 ✅）

- [x] 建立 GAS 專案
- [x] 複製完整程式碼
- [x] 部署為 Web App
- [x] 取得 URL：`https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec`

**參考**：[data-collection-guide.md 第 5.3-5.4 節](./data-collection-guide.md#53-google-apps-script正式版本)

---

### 3️⃣ 前端整合（已完成 ✅）

- [x] 在 `App.tsx` 加入 `GAS_WEB_APP_URL`
- [x] 實作 `sendDataToGoogleSheets` 函數
- [x] 在 STEP_13_END 自動發送資料
- [x] 使用 sessionStorage 防止重複發送

**檔案**：[App.tsx](../App.tsx)

---

### 4️⃣ 測試（待執行 ⚠️）

請依照 [gas-test-guide.md](./gas-test-guide.md) 完成以下測試：

- [ ] Sheet 結構檢查
- [ ] 公式設定與測試
- [ ] curl 測試（3個測試案例）
- [ ] 前端整合測試
- [ ] 防重複機制測試
- [ ] 清除所有測試資料

---

### 5️⃣ Firebase 部署

#### 環境變數設定
確認 `.env.local` 包含：
```env
VITE_TTS_API_BASE_URL=https://ecoaction-tts-with-models.onrender.com
```

#### 部署指令
```bash
npm run build
firebase deploy
```

#### 部署後檢查
- [ ] 前端正常載入
- [ ] TTS 語音正常播放
- [ ] 完成一次完整測試流程
- [ ] 確認資料成功寫入 Google Sheets

---

## 🔍 關鍵資訊速查

### Google Apps Script URL
```
https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec
```

### 外部問卷連結
```
https://forms.gle/C37hgKpWPdv4zStJ6
```

### TTS Backend URL
```
https://ecoaction-tts-with-models.onrender.com
```

---

## 📊 資料結構速查

### UserData 完整欄位
```typescript
{
  participantId: string        // 學號（必填）
  name: string                 // 姓名（選填）
  consent: boolean             // 同意（必填）
  quizAnswer: string           // A/B/C
  actionOpenAnswer: string     // 永續行動文字
  actionCategory: string       // REUSE/TRANSPORT/NONE
  behaviorPlan: string         // 額外行為計畫
  commitmentAnswers: {         // 12題量表（C1-C9, S1-S3）
    C1-C9: 1-5                // 承諾量表
    S1-S3: 1-5                // 自我認同量表
  }
  orgFeedback: string          // 組織回饋
  donationAmount: number       // 0-100
}
```

---

## ⚠️ 注意事項

### 實驗前必做
1. 執行完整測試流程（至少 3 次）
2. 清除所有測試資料
3. 確認 error_log 為空
4. 設定 Google Sheets 自動備份

### 實驗中監控
1. 定期檢查 error_log（每 10 人）
2. 確認資料寫入正常
3. 準備備用紙本問卷

### 資料品質
1. participantId 不可重複
2. 所有量表題目必須完整（1-5 分）
3. consent 必須為 true
4. 無 partial data（不完整資料）

---

## 🆘 緊急聯絡

### GAS 失敗處理
1. 記錄失敗的 participantId
2. 使用備用紙本問卷
3. 實驗後手動輸入資料

### 常見問題
- CORS 錯誤 → 檢查 GAS 部署設定
- 重複 ID → 正常，已被拒絕
- 資料未寫入 → 檢查 Sheet 名稱

---

## 📝 TODO Checklist

### 在正式實驗前

- [ ] 完成 Google Sheets 設定
- [ ] 完成所有測試（gas-test-guide.md）
- [ ] 清除測試資料
- [ ] Firebase 部署並測試
- [ ] 準備備用紙本問卷
- [ ] 設定 Google Sheets 自動備份
- [ ] 列印緊急聯絡資訊

### 實驗當天

- [ ] 開啟 Google Sheets（監控用）
- [ ] 確認網路連線穩定
- [ ] 準備備用設備
- [ ] 準備備用紙本問卷

---

**最後更新：2025-12-21**
