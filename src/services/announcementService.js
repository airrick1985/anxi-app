/**
 * 銷控／報價系統公告
 *
 * 集合：announcements（頂層，依 projectId 篩選，與 salesImages 相同模式）
 * 文件欄位：
 *   projectId, title, content, images: [{ url, path, name, size, type }],
 *   targets: ['sales' | 'quote'], level: 'info' | 'important' | 'urgent',
 *   pinned: bool, popup: bool（進入頁面時強制以燈箱提醒）, active: bool,
 *   startAt: Timestamp|null, endAt: Timestamp|null,
 *   createdAt, updatedAt, authorName, authorKey
 *
 * 只用單一 where（projectId），排序在前端做，避免額外的複合索引。
 */
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
  return {
    title: String(data.title || '').trim(),
    content: String(data.content || '').trim(),
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
