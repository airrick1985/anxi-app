// 驗屋授權書 LOGO 尺寸
// 後台「預約系統首頁 Logo 上傳」的 LOGO 顯示尺寸（logoSize）同時套用到授權書：
//   - BookingRuleManager 表單編輯區 / 預覽
//   - AuthSigningPage 受託人簽署後以 html2canvas 產出的實際圖檔
// 三處必須共用同一份對照，預覽才會與實際輸出一致。
// 高度定義需與 BookingPage.vue 的 .booking-page-logo--* 一致。

export const AUTH_LOGO_HEIGHT_PX = {
  small: 40,
  medium: 56,
  large: 80,
  xlarge: 110,
  xxlarge: 140,
};

export function getAuthLogoHeightPx(logoSize) {
  return AUTH_LOGO_HEIGHT_PX[logoSize] || AUTH_LOGO_HEIGHT_PX.medium;
}

/**
 * 將 LOGO 尺寸套用至授權書範本 HTML（請在替換 {logoUrl} 之前呼叫）
 *  - 新版範本：以 {logoHeight} 變數帶入 px 數值
 *  - 舊版範本：直接改寫 `src="{logoUrl}"` 那顆 <img> 的固定 `max-height: NNpx`，
 *    讓既有建案不需重新儲存範本也能同步尺寸
 */
export function applyAuthLogoSize(html, logoSize) {
  if (!html) return html;
  const px = getAuthLogoHeightPx(logoSize);
  return html
    .replace(/{logoHeight}/g, String(px))
    .replace(/(<img\b[^>]*src="\{logoUrl\}"[^>]*style="[^"]*?)max-height:\s*\d+px;?/g, `$1height: ${px}px; width: auto;`);
}
