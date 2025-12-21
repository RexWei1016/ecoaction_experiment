# CORS 問題解決指南

## 問題說明

當您在**本地開發環境**（http://localhost:3000）測試時，看到以下錯誤：

```
Access to fetch at 'https://script.google.com/...' from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request doesn't pass access 
control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

這是**正常且預期的行為**！

---

## 為什麼會發生 CORS 錯誤？

1. **本地開發 vs 生產環境**
   - 本地：`http://localhost:3000`（不同源）
   - Firebase：`https://your-app.web.app`（GAS 允許的源）

2. **瀏覽器安全機制**
   - 瀏覽器阻止不同源（localhost → script.google.com）的請求
   - 這是瀏覽器的安全保護機制

3. **GAS 預設行為**
   - GAS 預設不支援 localhost 的 CORS 請求
   - 但支援 HTTPS 的生產域名

---

## 解決方案

### ✅ 方案 1：更新 GAS 腳本（推薦）

在您的 Google Apps Script 中，更新程式碼：

```javascript
// 新增：處理 CORS preflight 請求
function doGet(e) {
  return jsonResponse({ status: 'ok', message: 'GAS Web App is running' });
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const mainSheet = ss.getSheetByName('實驗資料');
  const errorSheet = ss.getSheetByName('error_log');
  const metaSheet = ss.getSheetByName('meta_log');

  try {
    const data = JSON.parse(e.postData.contents);

    /* ... 其他程式碼保持不變 ... */

    return jsonResponse({ status: 'success' });

  } catch (err) {
    errorSheet.appendRow([
      new Date(),
      err.message,
      e.postData?.contents || ''
    ]);
    return jsonResponse({
      status: 'error',
      message: err.message
    });
  }
}

// 修改：加入 CORS headers
function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**步驟**：
1. 打開您的 Google Apps Script
2. 新增 `doGet` 函數
3. 修改 `jsonResponse` 函數，加入 CORS headers
4. **重要**：「部署 → 管理部署 → 編輯 → 部署」（產生新版本）
5. 重新測試

---

### ✅ 方案 2：使用 Chrome 擴充功能（僅限測試）

安裝 [CORS Unblock](https://chrome.google.com/webstore/detail/cors-unblock/) 或類似擴充功能。

**警告**：
- ⚠️ 僅用於本地開發測試
- ⚠️ 測試完畢後請停用
- ⚠️ 不要在正式環境使用

---

### ✅ 方案 3：直接部署到 Firebase（最簡單）

```bash
npm run build
firebase deploy
```

部署後：
- ✅ 沒有 CORS 問題
- ✅ HTTPS 安全連線
- ✅ 生產環境測試

---

## 測試檢查清單

### 本地開發環境（localhost）

- [ ] 已更新 GAS 腳本並重新部署
- [ ] Console 顯示：`✅ 資料已成功送出到 Google Sheets`
- [ ] Google Sheets 有新增資料

如果仍有 CORS 錯誤：
- Console 會顯示：`⚠️ 這是 CORS 錯誤，在本地開發環境是正常的`
- 直接部署到 Firebase 測試

### Firebase 生產環境

- [ ] `firebase deploy` 成功
- [ ] 訪問 Firebase URL（https://...）
- [ ] 完成實驗流程
- [ ] Console 顯示：`✅ 資料已成功送出到 Google Sheets`
- [ ] Google Sheets 有新增資料

---

## 常見問題

### Q1: 為什麼本地開發有 CORS 問題？
A: 因為 `localhost` 和 `script.google.com` 是不同的域，瀏覽器的安全機制會阻擋跨域請求。

### Q2: 更新了 GAS 腳本還是有錯誤？
A: 確認：
1. 是否「重新部署」（不是只儲存）
2. 是否使用新的部署版本
3. 清除瀏覽器快取重試

### Q3: 部署到 Firebase 還有 CORS 錯誤？
A: 非常少見，可能原因：
1. GAS 部署設定錯誤（檢查「存取權限」是否為「任何人」）
2. 瀏覽器擴充功能干擾（停用所有擴充功能測試）

### Q4: 可以完全跳過本地測試嗎？
A: 可以！直接部署到 Firebase 測試是最簡單的方式。

---

## 推薦測試流程

### 開發階段
1. 本地開發 UI/UX（接受 CORS 錯誤）
2. 定期部署到 Firebase 測試資料發送
3. 透過 GAS error_log 追蹤問題

### 正式實驗前
1. 部署到 Firebase
2. 使用測試學號完整測試 3 次
3. 確認 Google Sheets 有正確資料
4. 清除測試資料

---

## 調試技巧

### 確認資料是否準備好發送

在 Console 中執行：
```javascript
// 查看當前 userData
console.log(userData);

// 手動測試發送（在到達 STEP_13 後）
fetch('YOUR_GAS_URL', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(userData)
}).then(r => r.json()).then(console.log);
```

### 使用 Postman 測試 GAS

不經過瀏覽器，直接測試 GAS：
```bash
POST https://script.google.com/macros/s/YOUR_ID/exec
Content-Type: application/json

{
  "participantId": "TEST001",
  "consent": true,
  "commitmentAnswers": {
    "C1": 4, "C2": 3, "C3": 5, "C4": 4, "C5": 3,
    "C6": 5, "C7": 4, "C8": 4, "C9": 5,
    "S1": 4, "S2": 3, "S3": 5
  },
  ...
}
```

---

## 總結

| 環境 | CORS 問題 | 解決方案 |
|------|----------|---------|
| localhost | ✅ 可能發生 | 更新 GAS 腳本或直接部署 |
| Firebase | ❌ 不會發生 | 無需處理 |

**最佳實踐**：直接部署到 Firebase 測試，省時省力！

---

**更新日期：2025-12-21**
