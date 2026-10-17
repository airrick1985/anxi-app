// src/utils/activityPage.js
// 活動訊息「自建頁面」共用工具：判斷、文字方塊 HTML 清理、網址正規化
import DOMPurify from 'dompurify';
import ACTIVITY_PAGE_CSS from '@/styles/activityPageContent.css?raw';

export { ACTIVITY_PAGE_CSS };

export function isActivityPage(item) {
  return item?.type === 'page';
}

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 's', 'span', 'ul', 'ol', 'li', 'hr', 'a'],
  ALLOWED_ATTR: ['href', 'style'],
  ALLOW_DATA_ATTR: false,
};
const ALLOWED_STYLE_PROPS = new Set(['color', 'text-align', 'font-size']);

/** 文字方塊 HTML：DOMPurify 清理後只留顏色／對齊／字級樣式，連結一律另開新分頁 */
export function sanitizeActivityPageHtml(html) {
  const clean = DOMPurify.sanitize(String(html || ''), SANITIZE_CONFIG);
  if (typeof document === 'undefined') return clean;
  const tpl = document.createElement('template');
  tpl.innerHTML = clean;
  tpl.content.querySelectorAll('[style]').forEach((el) => {
    const kept = [];
    for (let i = 0; i < el.style.length; i += 1) {
      const prop = el.style[i];
      if (ALLOWED_STYLE_PROPS.has(prop)) kept.push(`${prop}: ${el.style.getPropertyValue(prop)}`);
    }
    if (kept.length) el.setAttribute('style', kept.join('; '));
    else el.removeAttribute('style');
  });
  tpl.content.querySelectorAll('a').forEach((a) => {
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener noreferrer');
  });
  return tpl.innerHTML;
}

/** 使用者輸入的網址補上協定：Email → mailto:、電話 → tel:、其餘預設 https:// */
export function normalizeActivityLink(raw) {
  const text = String(raw || '').trim();
  if (!text) return '';
  if (/^(https?:|mailto:|tel:)/i.test(text)) return text;
  if (/^[\w.+-]+@[\w-]+(\.[\w-]+)+$/.test(text)) return `mailto:${text}`;
  if (/^\+?[\d\s()-]{6,}$/.test(text)) return `tel:${text.replace(/[\s()-]/g, '')}`;
  return `https://${text.replace(/^\/+/, '')}`;
}
