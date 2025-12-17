# EcoAction Experiment — 互動紀錄整理（含分岔）

目的：整理本系統「題項（題幹/內容）→ 對應互動紀錄（可寫入 Google Sheet）」的對照，後續可直接用同一套欄位把每位受試者的互動輸出到 Google Sheet。

> 設計原則：
> - **題項在前、紀錄在後**（每一步驟一行）
> - **分岔要可回溯**（記錄分岔條件、分岔結果）
> - **可做成 Google Sheet 表格**（欄位固定、每次互動追加一列）

---

## 一、建議的事件記錄格式（Google Sheet 友善）

建議採用「事件（event）為單位」：任何一次互動/答題/進入步驟，都寫一列。

**建議欄位（Sheet 欄位名）**
- `ts_iso`：時間（ISO 8601，例：2025-12-17T12:34:56.789Z）
- `participant_id`：學號/編號（對應 `userData.participantId`）
- `session_id`：同一次開啟實驗的識別（前端可用 UUID；若暫不做，留空也可）
- `event`：事件名稱（下方定義）
- `step_id`：目前步驟（例：`STEP_05_ACTION_OPEN`）
- `step_index`：步驟序（0-based 或 1-based 二選一；建議 1-based）
- `question_id`：題目/題項 id（例：`C1`、`S2`；沒有則留空）
- `question_text`：題幹文字（可存常數內容，或留空改用 step_id 對照）
- `answer_raw`：使用者輸入原文（文字/選項 id/分數）
- `answer_value`：正規化後值（例：數字 1–5、金額 0–100）
- `branch_key`：分岔依據欄位名（例：`actionCategory`、`quizAnswer`）
- `branch_value`：分岔依據值（例：`NONE`、`A`）
- `branch_result_step_id`：分岔後導向的 step（例：`STEP_06_ACTION_FEEDBACK`）
- `meta`：JSON 字串（可放 userAgent、版本號、其他補充）

**建議事件（event）枚舉**
- `step_view`：進入/顯示某一步（建議每 step 至少記一次）
- `answer_submit`：送出文字/數值型答案（輸入框/textarea/金額）
- `answer_select`：選擇題（影片小測驗選 A/B/C）
- `likert_set`：量表選擇（1–5）
- `branch_decision`：系統做出分岔決策（記錄依據與結果）
- `external_link_click`：點擊外部連結（本次為 Google 表單）

---

## 二、題項 → 對應互動紀錄（含分岔）

### STEP_00_INTRO（同意與編號）
**題項/內容**
- 研究說明與同意（固定文字）
- 輸入：學號或編號

**對應互動紀錄**
- `answer_submit`：
  - `answer_raw` = `participantId`
  - `branch_key`/`branch_value`：無

---

### STEP_01_GREETING（稱呼）
**題項/內容**
- 「嗨，你好，我是Allen，你怎麼稱呼呢?」

**對應互動紀錄**
- `answer_submit`：
  - `answer_raw` = `name`（可空字串，屬選填）

---

### STEP_02_VIDEO_INTRO（影片前導）
**題項/內容**
- 影片前導（含 `{{name}}` 置換）

**對應互動紀錄**
- `step_view`：
  - `meta` 可記 `video_url`

---

### STEP_03_VIDEO_QUIZ（影片小測驗：單選）
**題項/內容**
- 「你知道影片中主要是在討論哪一個議題的新聞嗎?」
- 選項：A 永續地球 / B 企業績效 / C 身心靈放鬆

**對應互動紀錄**
- `answer_select`：
  - `question_id` = `QUIZ`
  - `answer_raw` = `A|B|C`
  - `answer_value` = `A|B|C`

---

### STEP_04_SUSTAINABILITY_PRIME（回饋/引導；依測驗分岔顯示不同前綴）
**題項/內容**
- 若 `quizAnswer === 'A'`：原文「沒錯，地球其實已經變得越來越脆弱…」
- 若 `quizAnswer !== 'A'`：文字會把「沒錯，」替換成「其實影片主要是在談論永續議題喔…」

**對應互動紀錄（分岔）**
- `branch_decision`：
  - `branch_key` = `quizAnswer`
  - `branch_value` = `A|B|C|''`
  - `branch_result_step_id` = `STEP_04_SUSTAINABILITY_PRIME`（同一步，但顯示內容不同；可用 `meta.variant=correct|wrong`）

---

### STEP_05_ACTION_OPEN（開放題 + 系統分類分岔）
**題項/內容**
- 「如果是這些行動，你覺得你可能可以做得到哪些? …」

**對應互動紀錄**
- `answer_submit`：
  - `answer_raw` = `actionOpenAnswer`（textarea 原文）
- `branch_decision`（系統分類 `localClassifyUserAction`）：
  - `branch_key` = `actionCategory`
  - `branch_value` = `REUSE|TRANSPORT|NONE`
  - `branch_result_step_id`：
    - 若 `NONE` → 下一步走 `STEP_06_ACTION_FEEDBACK`
    - 否則 → **跳過** `STEP_06_ACTION_FEEDBACK`，直接到 `STEP_07_BEHAVIOR_PLAN`

---

### STEP_06_ACTION_FEEDBACK（NONE 路徑專用；之後會跳過 STEP_07）
**題項/內容**
- 鼓勵文字（只會在 `actionCategory === 'NONE'` 時走到這一步）

**對應互動紀錄（分岔）**
- `step_view`（建議）
- `branch_decision`：
  - `branch_key` = `actionCategory`
  - `branch_value` = `NONE`
  - `branch_result_step_id`：點下一步後 **跳過** `STEP_07_BEHAVIOR_PLAN`，直接到 `STEP_08_COMMITMENT_SCALE`

---

### STEP_07_BEHAVIOR_PLAN（開放題）
**題項/內容**
- 「除了這些行動，你覺得你在生活中還有哪些地方可能也可以做到降低碳排?」

**對應互動紀錄**
- `answer_submit`：
  - `answer_raw` = `behaviorPlan`

---

### STEP_08_COMMITMENT_SCALE（永續承諾量表；顯示文字依前面分岔）
**題項/內容**
- 量表題（C1–C9），每題 1–5 分
- 並且此 step 的「開場文字」會依下列條件不同：
  - `actionCategory === 'NONE'`：短版
  - `actionCategory !== 'NONE'` 且 `behaviorPlan` 有填：稱讚版
  - `actionCategory !== 'NONE'` 且 `behaviorPlan` 空白：鼓勵版

**對應互動紀錄**
- `likert_set`（每一題一次或最後整包一次，依你 Sheet 設計）：
  - `question_id` = `C1`…`C9`
  - `answer_value` = `1..5`
- `branch_decision`（影響開場文字 variant）：
  - `branch_key` = `actionCategory|behaviorPlan_present`
  - `branch_value` = `NONE|YES_ANSWERED|YES_EMPTY`

---

### STEP_09_ORG_INTRO（組織介紹）
**題項/內容**
- 「綠行生活」介紹（長文）

**對應互動紀錄**
- `step_view`

---

### STEP_10_ORG_FEEDBACK（開放題）
**題項/內容**
- 「你對於他們組織的行動有什麼感想嗎? 或是能不能給他們一些鼓勵？」

**對應互動紀錄**
- `answer_submit`：
  - `answer_raw` = `orgFeedback`

---

### STEP_11_SELF_IDENTITY_SCALE（自我認同量表）
**題項/內容**
- 量表題（S1–S3），每題 1–5 分

**對應互動紀錄**
- `likert_set`：
  - `question_id` = `S1`…`S3`
  - `answer_value` = `1..5`

> 備註：目前程式把 S1–S3 也存進 `userData.commitmentAnswers` 這個 map（key 是 S1/S2/S3）。

---

### STEP_12_DONATION（捐款金額：0–100）
**題項/內容**
- 「如果你今天突然額外獲得100元…你願意捐多少？」
- UI 是 slider（每 10 元一格），送出時檢查 0–100

**對應互動紀錄**
- `answer_submit`：
  - `answer_value` = `donationAmount`（0–100）

---

### STEP_13_END（結尾 + 外部 Google 表單連結）
**題項/內容**
- 「結束之前，我們有個連結中有最後部分的題目想請你幫忙回答…」
- 顯示可點擊連結：`https://forms.gle/1odkttJ7fM6zyYZg7`

**對應互動紀錄**
- `external_link_click`：
  - `answer_raw` = `FINAL_FORM_URL`

---

## 三、（可直接貼到 Google Sheet 的欄位範本）

把這一行當作 header：

`ts_iso,participant_id,session_id,event,step_id,step_index,question_id,question_text,answer_raw,answer_value,branch_key,branch_value,branch_result_step_id,meta`
