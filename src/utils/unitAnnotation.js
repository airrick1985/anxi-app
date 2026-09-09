/**
 * 戶別「加註說明」共用工具
 *
 * 資料結構（salesHouseholds.unitAnnotation）：
 *   { html: '<p>…</p>', updatedAt: '2026-09-09T08:00:00.000Z', updatedBy: '王小明' }   或 null（無加註）
 * - 內容為富文本 HTML（RichTextEditor / TipTap 產生），顯示前一律經 DOMPurify 清理
 * - 銷控系統可新增／編輯／刪除；報價系統唯讀
 * - 由戶別資訊檢視模式即時寫入 Firestore，修改銷控／快速儲存流程不送此欄位，避免舊快照覆蓋
 */
import DOMPurify from 'dompurify';

/** 富文本是否為空（只剩空段落／空白／nbsp 視為空） */
export function isAnnotationHtmlEmpty(html) {
  if (!html) return true;
  const text = String(html)
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0;
}

/** 正規化：缺 html 或內容為空回傳 null */
export function normalizeUnitAnnotation(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const html = typeof raw.html === 'string' ? raw.html : '';
  if (isAnnotationHtmlEmpty(html)) return null;
  let updatedAt = raw.updatedAt || null;
  if (updatedAt && typeof updatedAt === 'object' && typeof updatedAt.toDate === 'function') {
    updatedAt = updatedAt.toDate().toISOString();
  }
  return {
    html,
    updatedAt: typeof updatedAt === 'string' ? updatedAt : null,
    updatedBy: typeof raw.updatedBy === 'string' ? raw.updatedBy : '',
  };
}

/** 顯示用 HTML 清理（保留 style 以呈現文字顏色；連結另開新視窗） */
export function sanitizeAnnotationHtml(html) {
  const clean = DOMPurify.sanitize(String(html || ''), {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    ADD_ATTR: ['target', 'rel'],
  });
  return clean.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

/** 加註純文字摘要（AI 上下文／複製摘要用） */
export function unitAnnotationPlainText(raw, maxLen = 200) {
  const a = normalizeUnitAnnotation(raw);
  if (!a) return '';
  const text = a.html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

/** 更新時間顯示（yyyy/MM/dd HH:mm） */
export function formatAnnotationTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
