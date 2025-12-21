import type { UserData } from '../types';

const GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/AKfycbzYGVl3i3QBJcIu6-sz7Xh9XBgWRfbGylELNR70UsUU9DGVCzXmwGsp2jOp603eJcI-/exec';

/**
 * 將實驗資料發送到 Google Apps Script Web App
 * 
 * 使用 no-cors 模式以避免 CORS preflight 問題
 * 注意：無法取得響應狀態，資料驗證依賴 GAS 端的 error_log
 * 
 * @param userData 完整的使用者資料
 */
export function sendToGAS(userData: UserData): void {
  fetch(GAS_WEB_APP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
}
