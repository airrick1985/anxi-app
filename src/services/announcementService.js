/**
 * 銷控／報價系統公告
 *
 * 集合：announcements（頂層，依 projectId 篩選，與 salesImages 相同模式）
 * 文件欄位：
 *   projectId, title, content, contentFormat: 'html' | 'text', contentText, images: [{ url, path, name, size, type }],
 *   - content：新版為富文本 HTML（tiptap 產生，contentFormat = 'html'），舊資料為純文字（無 contentFormat）
 *   - contentText：由 HTML 抽出的純文字摘要（卡片預覽／搜尋用）
 *   targets: ['sales' | 'quote'], level: 'info' | 'important' | 'urgent',
 *   pinned: bool, popup: bool（進入頁面時強制以燈箱提醒）, active: bool,
 *   startAt: Timestamp|null, endAt: Timestamp|null,
 *   createdAt, updatedAt, authorName, authorKey
 *
 * 只用單一 where（projectId），排序在前端做，避免額外的複合索引。
 */
import DOMPurify from 'dompurify';
import { db, storage } from '@/firebase';
import {
  collection, doc, onSnapshot, query, where,
  setDoc, updateDoc, deleteDoc, serverTimestamp, Timestamp,
} from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

export const ANNOUNCEMENT_COLLECTION = 'announcements';

export const ANNOUNCEMENT_TARGETS = [
  { value: 'sales', label: '銷控系統', icon: 'mdi-home-city-outline' },
  { value: 'quote', label: '報價系統', icon: 'mdi-file-document-outline' },
];

export const ANNOUNCEMENT_LEVELS = [
  { value: 'info', label: '一般', color: '#0a84ff', icon: 'mdi-information-outline' },
  { value: 'important', label: '重要', color: '#ff9500', icon: 'mdi-alert-circle-outline' },
  { value: 'urgent', label: '緊急', color: '#ff3b30', icon: 'mdi-alert-octagon-outline' },
];

export const ANNOUNCEMENT_STATUS = {
  live: { label: '進行中', color: '#34c759' },
  scheduled: { label: '排程中', color: '#0a84ff' },
  expired: { label: '已過期', color: '#8e8e93' },
  inactive: { label: '停用', color: '#ff9500' },
};

export function levelMeta(level) {
  return ANNOUNCEMENT_LEVELS.find(l => l.value === level) || ANNOUNCEMENT_LEVELS[0];
}

export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === 'function') return v.toDate();
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string') { const d = new Date(v); return Number.isNaN(d.getTime()) ? null : d; }
  if (typeof v?.seconds === 'number') return new Date(v.seconds * 1000);
  return null;
}

/** 依時間範圍與啟用狀態判斷目前狀態 */
export function announcementStatus(a, now = new Date()) {
  if (a?.active === false) return 'inactive';
  const start = toDate(a?.startAt);
  const end = toDate(a?.endAt);
  if (start && now < start) return 'scheduled';
  if (end && now > end) return 'expired';
  return 'live';
}

/** 是否應顯示在指定模式（sales / quote）的頁面 */
export function isAnnouncementVisible(a, mode, now = new Date()) {
  if (!a) return false;
  const targets = Array.isArray(a.targets) && a.targets.length ? a.targets : ['sales', 'quote'];
  if (!targets.includes(mode)) return false;
  return announcementStatus(a, now) === 'live';
}

/** 顯示排序：置頂優先，其餘依建立時間新到舊 */
export function sortForDisplay(list) {
  return [...list].sort((x, y) => {
    if (!!x.pinned !== !!y.pinned) return x.pinned ? -1 : 1;
    const tx = toDate(x.createdAt)?.getTime() || 0;
    const ty = toDate(y.createdAt)?.getTime() || 0;
    return ty - tx;
  });
}

export function listenToProjectAnnouncements(projectId, onData, onError) {
  const q = query(collection(db, ANNOUNCEMENT_COLLECTION), where('projectId', '==', projectId));
  return onSnapshot(q, (snap) => {
    onData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, (err) => {
    console.error(`監聽公告失敗 (Project: ${projectId}):`, err);
    if (onError) onError(err);
  });
}

export function newAnnouncementId() {
  return doc(collection(db, ANNOUNCEMENT_COLLECTION)).id;
}

function normalizePayload(data) {
  const targets = Array.isArray(data.targets) ? data.targets.filter(t => t === 'sales' || t === 'quote') : [];
  const contentFormat = data.contentFormat === 'html' ? 'html' : 'text';
  let content = String(data.content || '').trim();
  if (contentFormat === 'html' && isRichHtmlEmpty(content)) content = '';
  return {
    title: String(data.title || '').trim(),
    content,
    contentFormat,
    contentText: contentFormat === 'html' ? htmlToPlainText(content) : content,
    images: Array.isArray(data.images) ? data.images : [],
    targets: targets.length ? targets : ['sales', 'quote'],
    level: ['info', 'important', 'urgent'].includes(data.level) ? data.level : 'info',
    pinned: !!data.pinned,
    popup: !!data.popup,
    active: data.active !== false,
    startAt: data.startAt ? Timestamp.fromDate(toDate(data.startAt)) : null,
    endAt: data.endAt ? Timestamp.fromDate(toDate(data.endAt)) : null,
  };
}

export async function createAnnouncement(id, projectId, data, author) {
  const payload = {
    ...normalizePayload(data),
    projectId,
    authorName: author?.name || '',
    authorKey: author?.key || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, ANNOUNCEMENT_COLLECTION, id), payload);
  return id;
}

export async function updateAnnouncement(id, data, author) {
  await updateDoc(doc(db, ANNOUNCEMENT_COLLECTION, id), {
    ...normalizePayload(data),
    updatedAt: serverTimestamp(),
    updatedByName: author?.name || '',
    updatedByKey: author?.key || '',
  });
}

/** 局部更新（置頂／啟用切換等） */
export async function patchAnnouncement(id, patch) {
  await updateDoc(doc(db, ANNOUNCEMENT_COLLECTION, id), { ...patch, updatedAt: serverTimestamp() });
}

export async function deleteAnnouncement(id, images = []) {
  await deleteDoc(doc(db, ANNOUNCEMENT_COLLECTION, id));
  await deleteAnnouncementImages(images);
}

export async function uploadAnnouncementImages(projectId, announcementId, files) {
  const uploaded = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.\-]/g, '_');
    const path = `announcements/${projectId}/${announcementId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeName}`;
    const snap = await uploadBytes(storageRef(storage, path), file);
    const url = await getDownloadURL(snap.ref);
    uploaded.push({ url, path, name: file.name, size: file.size, type: file.type });
  }
  return uploaded;
}

/** 容錯刪除：失敗只記錄，不阻斷流程 */
export async function deleteAnnouncementImages(images = []) {
  for (const img of images) {
    if (!img?.path) continue;
    try { await deleteObject(storageRef(storage, img.path)); } catch (e) { console.warn('刪除公告圖片失敗:', img.path, e); }
  }
}

// ---------- 顯示輔助 ----------
export function formatRelativeTime(v, now = new Date()) {
  const d = toDate(v);
  if (!d) return '';
  const diff = now.getTime() - d.getTime();
  const m = Math.round(diff / 60000);
  if (m < 1) return '剛剛';
  if (m < 60) return `${m} 分鐘前`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} 小時前`;
  const sameYear = d.getFullYear() === now.getFullYear();
  const day = Math.round(h / 24);
  if (day === 1) return '昨天';
  if (day < 7) return `${day} 天前`;
  return sameYear ? `${d.getMonth() + 1}/${d.getDate()}` : `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function formatDateTime(v) {
  const d = toDate(v);
  if (!d) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 剩餘有效時間描述（無結束時間回傳空字串） */
export function formatRemaining(endAt, now = new Date()) {
  const d = toDate(endAt);
  if (!d) return '';
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return '已結束';
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `剩 ${Math.max(1, Math.round(diff / 60000))} 分鐘`;
  if (h < 24) return `剩 ${h} 小時`;
  return `剩 ${Math.ceil(h / 24)} 天`;
}

/** 轉成 <input type="datetime-local"> 的值 */
export function toInputDateTime(v) {
  const d = toDate(v);
  if (!d) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 純文字 → 安全 HTML（跳脫 + 網址自動連結） */
export function contentToHtml(text) {
  const esc = String(text || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return esc.replace(/(https?:\/\/[^\s<]+)/g, (m) => `<a href="${m}" target="_blank" rel="noopener">${m}</a>`);
}

// ---------- 富文本內容 ----------
/** 富文本 HTML 是否為空（只剩空段落／空白／nbsp 視為空） */
export function isRichHtmlEmpty(html) {
  if (!html) return true;
  const text = String(html)
    .replace(/<br\s*\/?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim();
  return text.length === 0;
}

/** 字串是否看起來是區塊 HTML（舊資料無 contentFormat 時的備援判斷） */
export function looksLikeHtml(s) {
  return /^<(p|ul|ol|h[1-6]|blockquote|div)[\s>]/i.test(String(s || '').trim());
}

/** 公告內容是否為富文本 */
export function isRichContent(a) {
  if (!a) return false;
  if (a.contentFormat === 'html') return true;
  if (a.contentFormat === 'text') return false;
  return looksLikeHtml(a.content);
}

/** 純文字（含換行）→ 編輯器用 HTML：每行一段落、網址自動連結 */
export function plainTextToHtml(text) {
  const lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
  return lines.map(l => (l.trim() ? `<p>${contentToHtml(l)}</p>` : '<p></p>')).join('');
}

/** HTML → 純文字（卡片預覽／搜尋用；區塊結尾換行、清單項目加符號） */
export function htmlToPlainText(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

/** 公告內容的純文字摘要 */
export function announcementPlainText(a, maxLen = 0) {
  if (!a) return '';
  const text = isRichContent(a) ? htmlToPlainText(a.content) : String(a.content || '');
  return maxLen > 0 && text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

const RICH_SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'span', 'ol', 'ul', 'li', 'a', 'h1', 'h2', 'h3', 'h4', 'blockquote', 'hr', 'code', 'pre', 'mark'],
  ALLOWED_ATTR: ['style', 'href', 'target', 'rel', 'start', 'class'],
  ALLOW_DATA_ATTR: false,
};
const ALLOWED_STYLE_PROPS = new Set(['color', 'font-size', 'text-align', 'text-decoration', 'font-weight', 'font-style']);

/** 只保留允許的行內樣式（顏色、字級等），其餘一律移除 */
function restrictInlineStyles(html) {
  if (typeof document === 'undefined') return html;
  const tpl = document.createElement('template');
  tpl.innerHTML = html;
  tpl.content.querySelectorAll('[style]').forEach((el) => {
    const kept = [];
    for (let i = 0; i < el.style.length; i += 1) {
      const prop = el.style[i];
      if (ALLOWED_STYLE_PROPS.has(prop)) kept.push(`${prop}: ${el.style.getPropertyValue(prop)}`);
    }
    if (kept.length) el.setAttribute('style', kept.join('; '));
    else el.removeAttribute('style');
  });
  return tpl.innerHTML;
}

/** 顯示用 HTML：富文本經 DOMPurify 清理（連結另開新視窗）；舊純文字走跳脫＋自動連結 */
export function announcementContentHtml(a) {
  if (!a) return '';
  if (!isRichContent(a)) return contentToHtml(a.content);
  const clean = DOMPurify.sanitize(String(a.content || ''), RICH_SANITIZE_CONFIG);
  return restrictInlineStyles(clean).replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}
