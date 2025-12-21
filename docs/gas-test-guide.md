# Google Apps Script 測試指南

## 快速測試檢查表

在正式實驗前，請依序完成以下測試：

### ✅ 1. Google Sheets 結構檢查

#### 檢查項目：
- [ ] 已建立名為「實驗資料」的 Sheet
- [ ] 已建立名為「error_log」的 Sheet
- [ ] 已建立名為「meta_log」的 Sheet

#### 「實驗資料」第一列欄位（順序不可錯）：
```
timestamp | participantId | name | consent | quizAnswer | quizCorrect | actionOpenAnswer | actionCategory | behaviorPlan | orgFeedback | donationAmount | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 | C9 | S1 | S2 | S3 | commitmentMean | identityMean
```

#### 「error_log」第一列欄位：
```
timestamp | error_message | raw_data
```

#### 「meta_log」第一列欄位：
```
timestamp | participantId | userAgent | status
```

---

### ✅ 2. Sheet 公式設定

在「實驗資料」Sheet 第 2 列（資料開始列）設定：

#### E 欄 (quizCorrect)
```excel
=IF(E2="A", TRUE, FALSE)
```

#### W 欄 (commitmentMean) - 假設 C1-C9 在 L-T 欄
```excel
=AVERAGE(L2:T2)
```

#### X 欄 (identityMean) - 假設 S1-S3 在 U-W 欄
```excel
=AVERAGE(U2:W2)
```

> 向下拖曳這些公式到至少 100 列

---

### ✅ 3. 使用 curl 測試 GAS (Windows PowerShell)

#### 測試 1: 完整正確的資料
```powershell
$body = @{
    participantId = "TEST001"
    name = "測試者"
    consent = $true
    quizAnswer = "A"
    actionOpenAnswer = "我會使用環保杯和環保袋"
    actionCategory = "REUSE"
    behaviorPlan = "減少外食次數"
    orgFeedback = "很棒的組織"
    donationAmount = 50
    commitmentAnswers = @{
        C1 = 4; C2 = 3; C3 = 5; C4 = 4; C5 = 3
        C6 = 5; C7 = 4; C8 = 4; C9 = 5
        S1 = 4; S2 = 3; S3 = 5
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**預期結果**：
- 回傳：`{"status":"success"}`
- 「實驗資料」新增一列，participantId = "TEST001"
- 「meta_log」記錄成功
- quizCorrect 欄自動顯示 TRUE

---

#### 測試 2: 缺少必填欄位（應失敗）
```powershell
$body = @{
    participantId = "TEST002"
    name = "測試者2"
    consent = $true
    # 故意不提供 commitmentAnswers
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**預期結果**：
- 回傳：`{"status":"error","message":"Invalid value for C1"}`
- 「error_log」新增一列記錄錯誤
- 「實驗資料」**不應**新增資料

---

#### 測試 3: 重複的 participantId（應失敗）
```powershell
# 再次發送 TEST001 (已存在)
$body = @{
    participantId = "TEST001"
    name = "重複測試"
    consent = $true
    quizAnswer = "A"
    actionOpenAnswer = "測試"
    actionCategory = "NONE"
    behaviorPlan = ""
    orgFeedback = ""
    donationAmount = 0
    commitmentAnswers = @{
        C1 = 4; C2 = 3; C3 = 5; C4 = 4; C5 = 3
        C6 = 5; C7 = 4; C8 = 4; C9 = 5
        S1 = 4; S2 = 3; S3 = 5
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec" `
    -Method POST `
    -Body $body `
    -ContentType "application/json"
```

**預期結果**：
- 回傳：`{"status":"error","message":"Duplicate participantId"}`
- 「error_log」記錄重複錯誤
- 「實驗資料」只有一筆 TEST001

---

### ✅ 4. 清除測試資料

測試完成後，刪除以下測試資料：
- 「實驗資料」中的 TEST001, TEST002 等測試列
- 「error_log」中的測試錯誤記錄
- 「meta_log」中的測試記錄

---

### ✅ 5. 前端整合測試

#### 5.1 確認 App.tsx 設定
檢查 [App.tsx](../App.tsx) 中的 URL：
```typescript
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec';
```

#### 5.2 本地測試流程
1. 啟動開發伺服器：
   ```bash
   npm run dev
   ```

2. 使用測試學號（例如：TEST_LOCAL_001）完成整個實驗流程

3. 到達 STEP_13 時，檢查：
   - [ ] 瀏覽器 Console 顯示「📤 正在傳送資料到 Google Sheets...」
   - [ ] Console 顯示「✅ 資料已成功儲存至 Google Sheets」
   - [ ] Google Sheets「實驗資料」新增一列
   - [ ] sessionStorage 中有 `data_sent_TEST_LOCAL_001` 標記

4. 重新整理頁面，再次到達 STEP_13：
   - [ ] Console 顯示「ℹ️ 此受測者資料已傳送過，跳過重複發送」
   - [ ] Google Sheets 沒有新增重複資料

---

### ✅ 6. 常見問題排查

#### 問題 1: 回傳 CORS 錯誤
**原因**：GAS 部署設定錯誤
**解決**：
1. 在 GAS 中「部署 → 管理部署」
2. 確認「存取權限」設為「任何人」
3. 重新部署

#### 問題 2: 回傳 "Missing participantId"
**原因**：前端資料結構不完整
**檢查**：
1. 確認 STEP_00 有收集 participantId
2. 檢查 userData 物件是否正確傳遞

#### 問題 3: Sheet 沒有新增資料，但沒有錯誤
**原因**：Sheet 名稱錯誤
**檢查**：
1. Sheet 名稱必須完全一致（包括大小寫、空格）
2. GAS 中的 `getSheetByName('實驗資料')` 必須與實際 Sheet 名稱相同

#### 問題 4: commitmentMean 顯示錯誤
**原因**：公式欄位位置錯誤
**檢查**：
1. 確認 C1-C9 在 L-T 欄（第 12-20 欄）
2. 確認 S1-S3 在 U-W 欄（第 21-23 欄）
3. 調整 AVERAGE 公式範圍

---

### ✅ 7. 最終檢查清單（正式實驗前）

- [ ] 所有測試資料已清除
- [ ] 「實驗資料」只有欄位標題列
- [ ] 「error_log」為空
- [ ] 「meta_log」為空
- [ ] 前端 GAS_WEB_APP_URL 正確
- [ ] 完整測試流程至少執行 3 次
- [ ] 所有測試參與者資料已刪除
- [ ] 公式已設定並測試正確
- [ ] sessionStorage 防重複機制測試成功
- [ ] 已設定 Google Sheets 自動備份（每日匯出 CSV）

---

## 緊急聯絡與備份方案

### 如果 GAS 在實驗中失敗：

1. **立即通知**：記錄失敗的 participantId
2. **備用方案**：請受測者填寫備用紙本問卷
3. **資料補救**：實驗後手動輸入資料到 Sheets

### 備份機制：

建議設定 Google Sheets 每日自動備份：
1. 「檔案 → 版本記錄 → 管理版本記錄」
2. 或使用 GAS 定時觸發器匯出 CSV

---

## 測試紀錄範本

| 測試日期 | 測試項目 | 結果 | 備註 |
|---------|---------|------|------|
| 2025-12-21 | Sheet 結構 | ✅ | |
| 2025-12-21 | 公式設定 | ✅ | |
| 2025-12-21 | curl 測試 1 | ✅ | |
| 2025-12-21 | curl 測試 2 | ✅ | |
| 2025-12-21 | curl 測試 3 | ✅ | |
| 2025-12-21 | 前端整合 | ✅ | |
| 2025-12-21 | 防重複機制 | ✅ | |

---

**測試人員簽名：__________**  
**日期：__________**
