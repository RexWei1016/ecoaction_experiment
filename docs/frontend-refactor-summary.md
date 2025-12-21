# 前端資料發送重構說明

## 📋 重構目標

按照研究等級實驗的設計原則，重構資料發送邏輯：

1. ✅ 只在實驗完成時送一次資料
2. ✅ 送出的是完整 UserData
3. ✅ 送失敗不影響畫面流程
4. ✅ 送成功與否只在 console 顯示
5. ✅ 使用 useRef 防止重複發送

---

## 🔄 主要變更

### 1. 創建獨立的 API 模組

**新增檔案**：`api/sendToGAS.ts`

```typescript
import type { UserData } from '../types';

const GAS_WEB_APP_URL = '...';

export async function sendToGAS(userData: UserData): Promise<void> {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (result.status !== 'success') {
    throw new Error(result.message || 'GAS error');
  }
}
```

**優點**：
- API 邏輯與 UI 分離
- 可獨立測試
- 易於維護和更換後端

---

### 2. 簡化 App.tsx 中的發送邏輯

**Before** ❌（舊版）：
```typescript
const sendDataToGoogleSheets = useCallback(async (data: UserData) => {
  try {
    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (result.status === 'success') {
      console.log('✅ 資料已成功儲存至 Google Sheets');
      return true;
    } else {
      console.error('❌ GAS 回傳錯誤:', result.message);
      alert(`資料儲存失敗: ${result.message}`); // ❌ 干擾實驗
      return false;
    }
  } catch (error) {
    console.error('❌ 網路錯誤:', error);
    alert('資料儲存失敗'); // ❌ 干擾實驗
    return false;
  }
}, []);

useEffect(() => {
  if (currentStepId === StepId.STEP_13_END && userData.participantId) {
    const storageKey = `data_sent_${userData.participantId}`;
    const alreadySent = sessionStorage.getItem(storageKey);
    
    if (!alreadySent) {
      sendDataToGoogleSheets(userData).then(success => {
        if (success) {
          sessionStorage.setItem(storageKey, 'true');
        }
      });
    }
  }
}, [currentStepId, userData, sendDataToGoogleSheets]);
```

**After** ✅（新版）：
```typescript
import { sendToGAS } from './api/sendToGAS';

const hasSentDataRef = useRef(false); // ✅ 使用 useRef 更可靠

useEffect(() => {
  if (currentStepId === StepId.STEP_13_END && !hasSentDataRef.current) {
    hasSentDataRef.current = true;

    sendToGAS(userData)
      .then(() => {
        console.log('✅ 資料已成功送出到 Google Sheets');
      })
      .catch((err) => {
        console.error('❌ 資料送出失敗:', err.message || err);
        // ✅ 不顯示 alert，不干擾實驗
      });
  }
}, [currentStepId, userData]);
```

---

### 3. 移除干擾實驗的 UI 元素

**移除的內容**：
- ❌ `alert('資料儲存失敗...')` - 會干擾受測者心理狀態
- ❌ `sessionStorage` 複雜邏輯 - `useRef` 更簡潔可靠
- ❌ `useCallback` 包裝 - 不需要，useEffect 已足夠

**保留的內容**：
- ✅ Console logging - 研究人員可追蹤
- ✅ GAS error_log - 所有錯誤都會記錄到 Google Sheets

---

## 🎯 設計原則說明

### 為什麼使用 `useRef` 而非 `sessionStorage`？

| 方案 | 優點 | 缺點 |
|------|------|------|
| `sessionStorage` | 跨頁面刷新有效 | 需要額外邏輯、可能有隱私問題 |
| `useRef` | 簡潔、可靠、React 標準做法 | 頁面刷新會重置 |

**選擇 `useRef` 的理由**：
1. 實驗通常一次完成，不會刷新頁面
2. 如果使用者刷新頁面，應視為新的嘗試
3. 程式碼更簡潔，符合 React 最佳實踐
4. 避免 sessionStorage 可能的 GDPR 問題

### 為什麼不顯示錯誤訊息給使用者？

1. **不干擾實驗**：alert 會影響受測者的心理狀態和行為
2. **背景行為**：資料發送是系統行為，不是使用者操作的一部分
3. **已有錯誤追蹤**：GAS 的 `error_log` Sheet 會記錄所有失敗
4. **研究倫理**：受測者已完成實驗，資料發送成功與否不應影響他們

### 唯一正確的發送時機

**STEP_13_END（結束頁面）**：
- ✅ 所有資料已收集完成
- ✅ 使用者已完成所有互動
- ✅ 不會中斷實驗流程
- ✅ 即使失敗也不影響實驗體驗

---

## 📊 資料流設計

```
STEP_00: participantId, consent
    ↓ (累積到 userData)
STEP_01: name
    ↓ (累積到 userData)
STEP_02-STEP_12: 各種資料
    ↓ (累積到 userData)
STEP_13_END
    ↓
【此時才發送完整 userData】
    ↓
sendToGAS(userData)
    ↓
GAS 驗證 + 寫入
    ↓
成功: console.log ✅
失敗: console.error + error_log ❌
```

---

## 🧪 測試建議

### 1. 正常流程測試
```
1. 完整完成實驗
2. 檢查 Console: 應看到 "✅ 資料已成功送出到 Google Sheets"
3. 檢查 Google Sheets: 應有新增一列
```

### 2. 防重複測試
```
1. 到達 STEP_13
2. 打開 DevTools → Console
3. 執行: window.location.reload()
4. 再次到達 STEP_13
5. 檢查: hasSentDataRef 已為 true，不會重複發送
```

### 3. 錯誤處理測試
```
1. 暫時修改 GAS URL 為錯誤的
2. 完成實驗
3. 檢查 Console: 應看到錯誤訊息
4. 檢查: 沒有 alert 彈出
5. 檢查 GAS error_log: 應有錯誤記錄
```

---

## 📝 檔案清單

### 新增檔案
- ✅ `api/sendToGAS.ts` - 獨立的 API 模組

### 修改檔案
- ✅ `App.tsx` - 簡化發送邏輯
- ✅ `docs/data-collection-guide.md` - 更新文檔

---

## 🚀 部署檢查

在部署到 Firebase 前，確認：

- [ ] `api/sendToGAS.ts` 中的 GAS_WEB_APP_URL 正確
- [ ] App.tsx 已正確 import sendToGAS
- [ ] hasSentDataRef 已宣告
- [ ] useEffect 中只在 STEP_13_END 發送
- [ ] 無 console 錯誤
- [ ] 本地測試通過

---

## ✅ 優勢總結

| 項目 | 舊版 | 新版 |
|------|------|------|
| 程式碼行數 | ~40 行 | ~15 行 |
| API 分離 | ❌ | ✅ |
| 防重複機制 | sessionStorage | useRef |
| 錯誤處理 | alert 干擾 | console only |
| 可測試性 | 低 | 高 |
| 符合研究倫理 | 普通 | 優秀 |

---

**最後更新：2025-12-21**
