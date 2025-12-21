# EcoAction Experiment 資料收集指南

## 概述
本文件說明實驗中所有需要被記錄的資料欄位，供後續設計 Google Apps Script (GAS) 連結 Google Sheets 使用。

---

## 1. 環境變數設定

### TTS API 設定
在 `.env.local` 檔案中設定以下環境變數：

```env
VITE_TTS_API_BASE_URL=https://ecoaction-tts-with-models.onrender.com
```

**說明**：
- 此設定會在 Firebase 部署時生效
- TTS API 端點用於即時語音生成（雖然大部分使用預錄語音）
- 預設為 `http://localhost:8000`（開發環境）

---

## 2. 資料結構定義

### 2.1 UserData 介面 (types.ts)

```typescript
export interface UserData {
  participantId: string;      // 受測者編號/學號
  name: string;               // 受測者姓名/稱呼
  quizAnswer: string;         // 影片測驗答案 (A/B/C)
  actionOpenAnswer: string;   // 永續行動開放式回答
  actionCategory: 'REUSE' | 'TRANSPORT' | 'NONE';  // 行動分類
  behaviorPlan: string;       // 行為計畫（額外永續行動）
  commitmentAnswers: Record<string, number>;  // 承諾量表答案
  orgFeedback: string;        // 組織回饋
  donationAmount: number;     // 捐款金額 (0-100)
  consent: boolean;           // 同意參與
}
```

---

## 3. 資料收集點 (各步驟)

### STEP_00: 同意書與編號收集
**欄位**: `participantId`, `consent`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| participantId | string | 受測者學號或編號 | "D124020001" |
| consent | boolean | 是否同意參與實驗 | true |

**驗證規則**:
- participantId 必填
- 點擊「我同意開始」後 consent 設為 true

---

### STEP_01: 姓名收集
**欄位**: `name`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| name | string | 受測者稱呼（選填） | "小明" |

**驗證規則**:
- 選填，若未填寫則預設為「同學」
- 無最小長度限制

---

### STEP_03: 影片測驗
**欄位**: `quizAnswer`

| 欄位名稱 | 類型 | 說明 | 可能值 |
|---------|------|------|--------|
| quizAnswer | string | 影片議題選擇 | "A", "B", "C" |

**選項定義**:
- A: 永續地球 ✓ (正確答案)
- B: 企業績效
- C: 身心靈放鬆

**驗證規則**:
- 必選（點擊後自動進入下一步）
- 正確答案為 'A'

---

### STEP_05: 永續行動開放式問答
**欄位**: `actionOpenAnswer`, `actionCategory`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| actionOpenAnswer | string | 受測者的永續行動文字回答 | "我會使用環保杯和環保袋" |
| actionCategory | enum | 系統自動分類的行動類別 | "REUSE" |

**actionCategory 分類邏輯**:
- **REUSE**: 關鍵字包含「杯、瓶、袋、餐具、塑膠、重複」
- **TRANSPORT**: 關鍵字包含「走、路、車、捷運、公車、大眾、騎」
- **NONE**: 回答「無」或不符合上述類別

**驗證規則**:
- 選填（可為空字串）
- 分類在前端自動執行 (App.tsx `localClassifyUserAction`)

**流程分支**:
- 若 actionCategory = 'NONE' → 進入 STEP_06 (鼓勵訊息)
- 若 actionCategory ≠ 'NONE' → 跳過 STEP_06，直接進入 STEP_07

---

### STEP_07: 行為計畫（額外永續行動）
**欄位**: `behaviorPlan`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| behaviorPlan | string | 除了前述行動外的其他永續計畫 | "我會嘗試減少外食次數" |

**驗證規則**:
- 選填（可為空字串）
- 此步驟只在 actionCategory ≠ 'NONE' 時出現

**注意事項**:
- 若使用者在 STEP_05 回答「無」，則不會進入此步驟
- behaviorPlan 為空字串表示使用者跳過此問題

---

### STEP_08: 永續承諾量表
**欄位**: `commitmentAnswers` (物件)

**量表題目** (9題):

| 題目ID | 題目內容 | 量尺 |
|--------|---------|------|
| C1 | 我有信心能夠經常做到永續行動（如：以自備環保帶進行消費、使用環保杯、環保餐具、做好回收分類等等） | 1-5 |
| C2 | 我會隨時攜帶環保用具在身上以應對臨時的消費需求（如：自備提環保袋、環保杯、環保餐具等等） | 1-5 |
| C3 | 我經常能夠記得自備環保用具出門（如：環保提袋、環保杯、環保餐具等等） | 1-5 |
| C4 | 我有能力判斷具有永續價值的品牌或產品 | 1-5 |
| C5 | 我能夠購買符合永續理念的產品 | 1-5 |
| C6 | 我相信我能養成符合永續的消費習慣 | 1-5 |
| C7 | 我能夠克服永續消費過程可能遇到的阻礙 | 1-5 |
| C8 | 我能夠長期從事永續消費的行動 | 1-5 |
| C9 | 我對自己能夠持之以恆進行永續行動抱持信心 | 1-5 |

**量尺定義**:
- 1 = 非常不同意
- 2 = 不同意
- 3 = 普通
- 4 = 同意
- 5 = 非常同意

**資料格式**:
```javascript
commitmentAnswers: {
  "C1": 4,
  "C2": 3,
  "C3": 5,
  "C4": 4,
  "C5": 3,
  "C6": 5,
  "C7": 4,
  "C8": 4,
  "C9": 5
}
```

**驗證規則**:
- 所有 9 題必須全部作答（1-5 分）
- 未完成前無法進入下一步
- 每題必須為 1-5 的整數

---

### STEP_10: 組織回饋
**欄位**: `orgFeedback`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| orgFeedback | string | 對「綠行生活協會」的感想或鼓勵 | "很棒的組織，希望能繼續推廣！" |

**驗證規則**:
- 選填（可為空字串）
- 無字數限制

---

### STEP_11: 自我認同量表
**欄位**: `commitmentAnswers` (與 STEP_08 共用同一物件)

**量表題目** (3題):

| 題目ID | 題目內容 | 量尺 |
|--------|---------|------|
| S1 | 我認為自己是一個環保的消費者 | 1-5 |
| S2 | 我認為自己是具備環境知識的人 | 1-5 |
| S3 | 我認為自己是關心永續議題的人 | 1-5 |

**量尺定義**:
- 1 = 非常不同意
- 2 = 不同意
- 3 = 普通
- 4 = 同意
- 5 = 非常同意

**資料格式**:
```javascript
commitmentAnswers: {
  "C1": 4, ... "C9": 5,  // 來自 STEP_08
  "S1": 4,                 // 來自 STEP_11
  "S2": 3,
  "S3": 5
}
```

**驗證規則**:
- 所有 3 題必須全部作答（1-5 分）
- 未完成前無法進入下一步
- 每題必須為 1-5 的整數

---

### STEP_12: 捐款意願
**欄位**: `donationAmount`

| 欄位名稱 | 類型 | 說明 | 範例 |
|---------|------|------|------|
| donationAmount | number | 願意捐獻給組織的金額（0-100元） | 50 |

**驗證規則**:
- 必填
- 範圍: 0 ~ 100
- 整數，間隔 10（使用滑桿選擇）
- 預設值: 0

---

## 4. Google Sheets 欄位設計建議

### 4.1 主要資料表 (Main Data)

建議欄位順序：

| 欄位名稱 (英文) | 欄位名稱 (中文) | 資料類型 | 範例 | 備註 |
|----------------|----------------|---------|------|------|
| timestamp | 提交時間 | DateTime | 2025-12-21 14:30:25 | 自動產生 |
| participantId | 受測者編號 | String | D124020001 | 主鍵 |
| name | 姓名 | String | 小明 | 選填 |
| consent | 同意參與 | Boolean | TRUE | 必為 TRUE |
| quizAnswer | 影片測驗答案 | String | A | A/B/C |
| quizCorrect | 測驗是否正確 | Boolean | TRUE | A=TRUE |
| actionOpenAnswer | 永續行動回答 | String | 使用環保杯... | 長文字 |
| actionCategory | 行動分類 | String | REUSE | REUSE/TRANSPORT/NONE |
| behaviorPlan | 行為計畫 | String | 減少外食... | 長文字 |
| orgFeedback | 組織回饋 | String | 很棒的組織... | 長文字 |
| donationAmount | 捐款金額 | Number | 50 | 0-100 |
| C1 | 承諾量表1 | Number | 4 | 1-5 |
| C2 | 承諾量表2 | Number | 3 | 1-5 |
| C3 | 承諾量表3 | Number | 5 | 1-5 |
| C4 | 承諾量表4 | Number | 4 | 1-5 |
| C5 | 承諾量表5 | Number | 3 | 1-5 |
| C6 | 承諾量表6 | Number | 5 | 1-5 |
| C7 | 承諾量表7 | Number | 4 | 1-5 |
| C8 | 承諾量表8 | Number | 4 | 1-5 |
| C9 | 承諾量表9 | Number | 5 | 1-5 |
| S1 | 自我認同1 | Number | 4 | 1-5 |
| S2 | 自我認同2 | Number | 3 | 1-5 |
| S3 | 自我認同3 | Number | 5 | 1-5 |
| commitmentMean | 承諾量表平均 | Number | 4.11 | 計算欄位 |
| identityMean | 認同量表平均 | Number | 4.00 | 計算欄位 |

---

### 4.2 計算欄位公式

#### 測驗是否正確
```excel
=IF(D2="A", TRUE, FALSE)
```

#### 承諾量表平均
```excel
=AVERAGE(L2:T2)
```

#### 認同量表平均
```excel
=AVERAGE(U2:W2)
```

---

## 5. Google Apps Script 完整實作（研究等級）

### 5.1 系統架構總覽

| 元件 | 職責 |
|------|------|
| 前端（React / Firebase） | 完整蒐集所有 STEP_00–STEP_12 資料 |
| GAS Web App | 資料接收、驗證、防重複、寫入 |
| Google Sheets | 長期儲存、計算、匯出分析 |
| 研究者 | 只接觸 Sheets，不接觸程式 |

### 5.2 Google Sheets 設計

#### 建立三張 Sheet（強烈建議）

| Sheet 名稱 | 用途 |
|-----------|------|
| `實驗資料` | 主資料表（每人一列） |
| `error_log` | 所有失敗請求 |
| `meta_log` | 成功請求的時間與裝置資訊 |

#### 「實驗資料」Sheet 欄位順序

第 1 列為欄位名稱（**不可空白**）：

```
timestamp
participantId
name
consent
quizAnswer
quizCorrect
actionOpenAnswer
actionCategory
behaviorPlan
orgFeedback
donationAmount
C1 C2 C3 C4 C5 C6 C7 C8 C9
S1 S2 S3
commitmentMean
identityMean
```

> ⚠️ **重要**：`commitmentMean`、`identityMean` 不要由 GAS 寫入，僅用 Sheet 公式計算

#### Sheet 公式設定（第2列開始）

**quizCorrect (E列)**
```excel
=IF(E2="A", TRUE, FALSE)
```

**commitmentMean (W列)**
```excel
=AVERAGE(L2:T2)
```

**identityMean (X列)**
```excel
=AVERAGE(U2:W2)
```

### 5.3 Google Apps Script（正式版本）

#### 建立 GAS 專案
1. 在 Google Sheet：「擴充功能 → Apps Script」
2. 專案命名：`EcoAction_Data_Collector`

#### 完整程式碼（請直接使用）

> ℹ️ **重要說明**：
> - `doPost(e)` 是 GAS 的內建函數，當 Web App 收到 HTTP POST 請求時自動觸發
> - `doGet(e)` 處理 CORS preflight 請求（OPTIONS），支援本地開發
> - 參數 `e` 包含請求的所有資訊（headers, body, parameters 等）
> - 必須回傳 `ContentService` 物件才能正確返回 JSON 響應

```javascript
// 處理 CORS preflight 請求（支援本地開發）
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

    /* ========= 1. 基本驗證 ========= */
    if (!data.participantId) throw new Error('Missing participantId');
    if (data.consent !== true) throw new Error('Consent must be true');

    /* ========= 2. 量表完整性 ========= */
    const requiredKeys = [
      'C1','C2','C3','C4','C5','C6','C7','C8','C9',
      'S1','S2','S3'
    ];
    const ca = data.commitmentAnswers || {};

    for (const key of requiredKeys) {
      const v = ca[key];
      if (!Number.isInteger(v) || v < 1 || v > 5) {
        throw new Error(`Invalid value for ${key}`);
      }
    }

    /* ========= 3. participantId 去重 ========= */
    const existingIds = mainSheet
      .getRange(2, 2, Math.max(mainSheet.getLastRow()-1, 1), 1)
      .getValues()
      .flat();

    if (existingIds.includes(data.participantId)) {
      throw new Error('Duplicate participantId');
    }

    /* ========= 4. 寫入主資料 ========= */
    const row = [
      new Date(),
      data.participantId,
      data.name || '同學',
      true,
      data.quizAnswer || '',
      data.quizAnswer === 'A',
      data.actionOpenAnswer || '',
      data.actionCategory || '',
      data.behaviorPlan || '',
      data.orgFeedback || '',
      data.donationAmount ?? 0,
      ca.C1, ca.C2, ca.C3, ca.C4, ca.C5,
      ca.C6, ca.C7, ca.C8, ca.C9,
      ca.S1, ca.S2, ca.S3
    ];
    mainSheet.appendRow(row);

    /* ========= 5. Meta log ========= */
    metaSheet.appendRow([
      new Date(),
      data.participantId,
      e.parameter?.userAgent || '',
      'success'
    ]);

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

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type');
}
```

**程式碼說明**：

1. **doPost(e) 函數**：
   - GAS 的標準 POST 請求處理器
   - `e.postData.contents` 包含請求的 JSON body
   - 必須以此名稱定義，GAS 才會自動路由

2. **四層驗證機制**：
   - ✅ 基本驗證：participantId 和 consent
   - ✅ 量表完整性：12 題必須全部填寫且為 1-5
   - ✅ 去重檢查：防止同一 participantId 重複提交
   - ✅ 錯誤記錄：所有失敗請求都記錄到 error_log

3. **資料寫入順序**：
   - 主資料表：23 個欄位（含時間戳）
   - Meta log：記錄成功的請求（追蹤用）
   - Error log：記錄失敗的請求（除錯用）

4. **回傳格式**：
   - 成功：`{"status":"success"}`
   - 失敗：`{"status":"error","message":"錯誤訊息"}`

---

### 5.4 部署為 Web App（關鍵步驟）

1. 右上角 →「部署 → 新增部署」
2. 類型：**Web App**
3. 設定：
   * **執行身分**：我
   * **存取權限**：任何人
4. 部署完成後，**複製 URL**

> ⚠️ **重要**：每次修改 GAS 後，一定要「重新部署」

### 5.5 前端實作（App.tsx）

#### 建立獨立的 API 模組

創建 `api/sendToGAS.ts`：

```typescript
import type { UserData } from '../types';

const GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec';

/**
 * 將實驗資料發送到 Google Apps Script Web App
 * @param userData 完整的使用者資料
 * @returns Promise<void>
 * @throws Error 當發送失敗時
 */
export async function sendToGAS(userData: UserData): Promise<void> {
  const response = await fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const result = await response.json();

  if (result.status !== 'success') {
    throw new Error(result.message || 'GAS error');
  }
}
```

#### 在 App.tsx 中使用

```typescript
import { sendToGAS } from './api/sendToGAS';

const App: React.FC = () => {
  const hasSentDataRef = useRef(false);
  
  // Submit data to GAS when reaching STEP_13_END (only once)
  useEffect(() => {
    if (currentStepId === StepId.STEP_13_END && !hasSentDataRef.current) {
      hasSentDataRef.current = true;

      sendToGAS(userData)
        .then(() => {
          console.log('✅ 資料已成功送出到 Google Sheets');
        })
        .catch((err) => {
          console.error('❌ 資料送出失敗:', err.message || err);
          // 不顯示 alert，僅記錄到 console
          // 研究人員可透過 GAS error_log 追蹤
        });
    }
  }, [currentStepId, userData]);
};
```

**重要設計原則**：

1. **使用 `useRef` 防止重複發送**
   - `hasSentDataRef` 確保即使發生 React re-render、StrictMode 或使用者誤操作，資料也只會發送一次
   - 比 `sessionStorage` 更簡潔可靠

2. **只在 STEP_13_END 發送**
   - 確保所有資料都已收集完成
   - 使用者體驗流暢，不會感知到資料傳輸

3. **不顯示 UI 錯誤訊息**
   - 錯誤僅記錄到 console
   - 避免干擾受測者的實驗體驗
   - 研究人員可透過 GAS 的 `error_log` Sheet 追蹤問題

4. **API 與 UI 分離**
   - `sendToGAS` 可獨立測試
   - 未來更換後端不需修改 UI 邏輯

---

## 6. 實驗前必做檢查清單

### 6.1 技術面檢查

- [ ] GAS 手動 POST 測試成功
- [ ] 重複 participantId 被正確拒絕
- [ ] 少一題量表 → 被正確拒絕
- [ ] Sheet 公式正確計算 (commitmentMean, identityMean)
- [ ] error_log 和 meta_log Sheet 已建立
- [ ] 前端正確取得 GAS Web App URL
- [ ] sessionStorage 防止重複發送測試成功

### 6.2 研究面檢查

- [ ] participantId 與 consent 正確綁定
- [ ] 無 partial data（不完整資料）
- [ ] error_log 為空（正式實驗前）
- [ ] 測試資料已清除
- [ ] 備份機制已設定（定期匯出 CSV）

### 6.3 手動測試腳本（使用 Postman 或 curl）

```bash
curl -X POST "YOUR_GAS_WEB_APP_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "TEST001",
    "name": "測試者",
    "consent": true,
    "quizAnswer": "A",
    "actionOpenAnswer": "測試回答",
    "actionCategory": "REUSE",
    "behaviorPlan": "測試計畫",
    "commitmentAnswers": {
      "C1": 4, "C2": 3, "C3": 5, "C4": 4, "C5": 3,
      "C6": 5, "C7": 4, "C8": 4, "C9": 5,
      "S1": 4, "S2": 3, "S3": 5
    },
    "orgFeedback": "測試回饋",
    "donationAmount": 50
  }'
```

預期結果：
- ✅ 回傳 `{"status":"success"}`
- ✅ 「實驗資料」Sheet 新增一列
- ✅ 「meta_log」Sheet 記錄成功

---

## 7. 資料品質檢查清單（分析階段）

### 6.1 必填欄位檢查
- [ ] participantId 不為空
- [ ] consent 為 true
- [ ] quizAnswer 為 A/B/C 之一
- [ ] C1-C9 全部為 1-5
- [ ] S1-S3 全部為 1-5
- [ ] donationAmount 介於 0-100

### 6.2 邏輯檢查
- [ ] 若 actionCategory = 'NONE'，behaviorPlan 應為空字串
- [ ] 若 actionCategory ≠ 'NONE'，behaviorPlan 可能有值（但非必填）
- [ ] commitmentAnswers 應包含 12 個鍵值 (C1-C9, S1-S3)

### 6.3 資料完整性
- [ ] 所有受測者都有完整的承諾量表答案 (9題)
- [ ] 所有受測者都有完整的自我認同量表答案 (3題)
- [ ] timestamp 格式正確
- [ ] 無重複的 participantId

---

## 8. 已部署的 GAS Web App URL

```
https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec
```

> ⚠️ 此 URL 已在前端 App.tsx 中配置完成

---

## 9. 實驗流程圖

```
STEP_00: 同意書 (participantId, consent)
    ↓
STEP_01: 姓名收集 (name)
    ↓
STEP_02: 影片播放 (VIDEO_URL)
    ↓
STEP_03: 影片測驗 (quizAnswer)
    ↓
STEP_04: 永續啟發 (根據 quizAnswer 分支)
    ↓
STEP_05: 永續行動問答 (actionOpenAnswer, actionCategory)
    ↓
    ├─→ [NONE] → STEP_06: 鼓勵訊息 → STEP_08
    └─→ [REUSE/TRANSPORT] → STEP_07: 行為計畫 (behaviorPlan) → STEP_08
    ↓
STEP_08: 承諾量表 (C1-C9)
    ↓
STEP_09: 組織介紹
    ↓
STEP_10: 組織回饋 (orgFeedback)
    ↓
STEP_11: 自我認同量表 (S1-S3)
    ↓
STEP_12: 捐款意願 (donationAmount)
    ↓
STEP_13: 結束 (導向外部問卷)
    ↓
[資料傳送至 Google Sheets]
```

---

## 10. 常見問題 (FAQ)

### Q1: 為什麼 commitmentAnswers 是一個物件？
A: 因為包含兩組量表（承諾量表 C1-C9 和自我認同量表 S1-S3），共 12 個題目，使用物件格式方便擴充和管理。

### Q2: behaviorPlan 什麼時候會是空字串？
A: 有兩種情況：
1. 使用者在 STEP_05 回答「無」（actionCategory = 'NONE'），直接跳過 STEP_07
2. 使用者進入 STEP_07 但選擇不填寫

### Q3: 如何區分兩種 behaviorPlan 空字串的情況？
A: 透過 `actionCategory` 欄位判斷：
- actionCategory = 'NONE' → 未進入 STEP_07
- actionCategory ≠ 'NONE' 且 behaviorPlan = '' → 進入 STEP_07 但未填寫

### Q4: 資料何時傳送到 Google Sheets？
A: 建議在 STEP_13 (結束頁面) 顯示時自動傳送，確保所有資料都已收集完畢。

### Q5: 如果使用者中途離開怎麼辦？
A: 目前設計為一次性傳送，若使用者未完成實驗，資料不會被記錄。使用 sessionStorage 防止重複發送。

### Q6: GAS 部署後修改程式碼要注意什麼？
A: 每次修改後必須「重新部署」，並使用新的部署 ID。建議使用「管理部署」功能更新現有部署。

### Q7: 如何測試 GAS 是否正常運作？
A: 使用 curl 或 Postman 發送測試資料（見第6.3節），檢查 error_log 和 meta_log。

---

## 11. 聯絡資訊

如有任何問題，請聯絡：
- 專案負責人: [您的名字]
- Email: [您的Email]
- 文件最後更新: 2025-12-21

---

## 附錄: 完整資料範例

```json
{
  "participantId": "D124020001",
  "name": "小明",
  "quizAnswer": "A",
  "actionOpenAnswer": "我會使用環保杯和環保袋，減少一次性塑膠使用",
  "actionCategory": "REUSE",
  "behaviorPlan": "我會嘗試減少外食次數，自己帶便當",
  "commitmentAnswers": {
    "C1": 4,
    "C2": 3,
    "C3": 5,
    "C4": 4,
    "C5": 3,
    "C6": 5,
    "C7": 4,
    "C8": 4,
    "C9": 5,
    "S1": 4,
    "S2": 3,
    "S3": 5
  },
  "orgFeedback": "很棒的組織，希望能繼續推廣永續理念！",
  "donationAmount": 50,
  "consent": true
}
```
