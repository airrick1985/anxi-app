// src/services/trialLeadsService.js
// 試用留資管理（docs/SPEC_LandingTrialLeadsOnboarding.md §3.4 / §5 / §6 / §9）
// 直接以 Firestore SDK 操作；所有排序／篩選在前端進行（勿 where+orderBy）。

import { db } from '@/firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from 'firebase/firestore';

// ---------------------------------------------------------------
// 常數
// ---------------------------------------------------------------

/** 預設標籤（§5.3） */
export const DEFAULT_TRIAL_LEAD_TAGS = [
  { id: 'uncontacted', name: '未聯絡', color: 'grey' },
  { id: 'contacted', name: '已聯絡', color: 'blue' },
  { id: 'interested', name: '有興趣', color: 'green' },
  { id: 'considering', name: '考慮中', color: 'orange' },
  { id: 'do-not-contact', name: '不聯絡', color: 'red' },
  { id: 'subscribed', name: '已訂閱', color: 'purple' },
];

/** 主狀態選項 */
export const TRIAL_LEAD_STATUS_OPTIONS = [
  { value: 'new', title: '新留資', color: 'primary' },
  { value: 'contacted', title: '已聯絡', color: 'blue' },
  { value: 'subscribed', title: '已訂閱', color: 'purple' },
  { value: 'archived', title: '已封存', color: 'grey' },
];

/** 使用型態 */
export const TRIAL_USE_TYPE_OPTIONS = [
  { value: 'personal', title: '個人使用' },
  { value: 'company', title: '公司使用' },
];

/** 活動事件 type → 中文 */
export const TRIAL_EVENT_LABELS = {
  submitted: '提交表單',
  auto_login: '自動登入',
  tour_started: '開始導覽',
  tour_completed: '完成導覽',
  tour_skipped: '略過導覽',
  enter_system: '進入系統',
  email_sent: '收到 Email',
  landing_cta_click: '點擊 CTA',
};

/** 沙盒預設集合清單（§4.2） */
export const DEFAULT_SANDBOX_COLLECTIONS = [
  'households', 'appointments', 'leads', 'vipGuests', 'contactLogs', 'calendarNotes',
  'salesHouseholds', 'salesParkings', 'salesParameters', 'salesSVGs', 'salesImages',
  'parkingFloorPlans', 'parkingSpotLayouts', 'inspectionRecords', 'inspectionOptions',
  'cancelledPurchases', 'bookingBatches', 'batchRuleLinks', 'dateRules', 'timeSlotRules',
  'activityMessages', 'customFormTemplates', 'customerFieldSettings', 'projectSettings',
  'retentionPayouts', 'bonusRecords', 'commissionRecords', 'commissionUnitLedgers',
];

// ---------------------------------------------------------------
// 工具
// ---------------------------------------------------------------

/** Firestore Timestamp / Date / 數字 / 字串 → Date（容忍 undefined） */
export function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  if (typeof value === 'number') return new Date(value);
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function genId() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------
// trialLeads
// ---------------------------------------------------------------

/** 全量讀取 trialLeads（排序在前端） */
export async function fetchTrialLeads() {
  const snap = await getDocs(collection(db, 'trialLeads'));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** 讀取單筆 */
export async function fetchTrialLead(id) {
  const snap = await getDoc(doc(db, 'trialLeads', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** 更新單筆（自動補 updatedAt） */
export async function updateTrialLead(id, data) {
  await updateDoc(doc(db, 'trialLeads', id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/** 新增留言式備註（讀改寫 notes 陣列），回傳新的 note */
export async function addTrialLeadNote(id, { text, author, authorKey }) {
  const ref = doc(db, 'trialLeads', id);
  const snap = await getDoc(ref);
  const notes = Array.isArray(snap.data()?.notes) ? [...snap.data().notes] : [];
  const note = {
    id: genId(),
    text: String(text || '').trim(),
    author: author || '',
    authorKey: authorKey || '',
    createdAt: new Date(),
  };
  notes.push(note);
  await updateDoc(ref, { notes, updatedAt: serverTimestamp() });
  return note;
}

/** 刪除備註 */
export async function deleteTrialLeadNote(id, noteId) {
  const ref = doc(db, 'trialLeads', id);
  const snap = await getDoc(ref);
  const notes = Array.isArray(snap.data()?.notes) ? snap.data().notes : [];
  await updateDoc(ref, {
    notes: notes.filter((n) => n.id !== noteId),
    updatedAt: serverTimestamp(),
  });
}

/**
 * 批次更新：fn(lead) 回傳要更新的欄位物件（或 null 略過）。
 * leads 為目前記憶體中的資料（避免逐筆再讀）。
 */
export async function bulkUpdateTrialLeads(ids, fn, leadsById = {}) {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    let count = 0;
    ids.slice(i, i + CHUNK).forEach((id) => {
      const patch = fn(leadsById[id] || { id });
      if (!patch) return;
      batch.update(doc(db, 'trialLeads', id), { ...patch, updatedAt: serverTimestamp() });
      count += 1;
    });
    if (count > 0) await batch.commit();
  }
}

/** 批次加標籤 */
export async function bulkAddTag(ids, tagName) {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    ids.slice(i, i + CHUNK).forEach((id) => {
      batch.update(doc(db, 'trialLeads', id), { tags: arrayUnion(tagName), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

/** 批次移除標籤 */
export async function bulkRemoveTag(ids, tagName) {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    ids.slice(i, i + CHUNK).forEach((id) => {
      batch.update(doc(db, 'trialLeads', id), { tags: arrayRemove(tagName), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

// ---------------------------------------------------------------
// systemSettings/trialLeadTags
// ---------------------------------------------------------------

/** 讀取標籤設定；不存在時寫入預設並回傳預設 */
export async function fetchTrialLeadTags() {
  const ref = doc(db, 'systemSettings', 'trialLeadTags');
  const snap = await getDoc(ref);
  if (snap.exists() && Array.isArray(snap.data().tags)) {
    return snap.data().tags;
  }
  await setDoc(ref, { tags: DEFAULT_TRIAL_LEAD_TAGS, updatedAt: serverTimestamp() });
  return [...DEFAULT_TRIAL_LEAD_TAGS];
}

export async function saveTrialLeadTags(tags) {
  await setDoc(
    doc(db, 'systemSettings', 'trialLeadTags'),
    { tags, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

/** 標籤改名：同步所有 lead 的 tags 陣列 */
export async function renameTagOnAllLeads(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return 0;
  const leads = await fetchTrialLeads();
  const affected = leads.filter((l) => Array.isArray(l.tags) && l.tags.includes(oldName));
  const CHUNK = 400;
  for (let i = 0; i < affected.length; i += CHUNK) {
    const batch = writeBatch(db);
    affected.slice(i, i + CHUNK).forEach((l) => {
      const tags = Array.from(new Set(l.tags.map((t) => (t === oldName ? newName : t))));
      batch.update(doc(db, 'trialLeads', l.id), { tags, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
  return affected.length;
}

/** 刪除標籤：從所有 lead 移除 */
export async function removeTagFromAllLeads(tagName) {
  const leads = await fetchTrialLeads();
  const affected = leads.filter((l) => Array.isArray(l.tags) && l.tags.includes(tagName));
  await bulkRemoveTag(affected.map((l) => l.id), tagName);
  return affected.length;
}

// ---------------------------------------------------------------
// emailTemplates
// ---------------------------------------------------------------

/**
 * 讀取範本；scope 篩選（docs/SPEC_CustomerProspecting.md §2.3）：
 * - 'trial'：scope 為 trial / all / 未設定（舊資料）
 * - 'prospect'：scope 為 prospect / all
 * - 不傳：全部
 */
export async function fetchEmailTemplates(scope = null) {
  const snap = await getDocs(collection(db, 'emailTemplates'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => {
      if (!scope) return true;
      const s = t.scope || 'all';
      if (s === 'all') return true;
      return s === scope;
    })
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant'));
}

/** 儲存範本：有 id 則更新，否則新增；回傳 id */
export async function saveEmailTemplate(template, updatedBy = '') {
  const payload = {
    name: template.name || '',
    subject: template.subject || '',
    html: template.html || '',
    attachments: Array.isArray(template.attachments) ? template.attachments : [],
    updatedAt: serverTimestamp(),
    updatedBy,
  };
  if (template.scope) payload.scope = template.scope;
  if (template.id) {
    await setDoc(doc(db, 'emailTemplates', template.id), payload, { merge: true });
    return template.id;
  }
  const ref = await addDoc(collection(db, 'emailTemplates'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function deleteEmailTemplate(id) {
  await deleteDoc(doc(db, 'emailTemplates', id));
}

// ---------------------------------------------------------------
// emailCampaigns
// ---------------------------------------------------------------

export async function fetchEmailCampaigns() {
  const snap = await getDocs(collection(db, 'emailCampaigns'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

/**
 * 訂閱某操作者建立的所有 campaigns（單一 where、無 orderBy）。
 * 用於送出後尚未取得 campaignId 前即時抓到剛建立的 campaign。
 */
export function subscribeCampaignsByCreator(operatorKey, cb) {
  const q = query(collection(db, 'emailCampaigns'), where('createdBy', '==', operatorKey));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
}

/** 訂閱單一 campaign 進度；回傳 unsubscribe */
export function subscribeCampaign(id, cb) {
  return onSnapshot(doc(db, 'emailCampaigns', id), (snap) => {
    cb(snap.exists() ? { id: snap.id, ...snap.data() } : null);
  });
}

// ---------------------------------------------------------------
// systemSettings/trial
// ---------------------------------------------------------------

export const DEFAULT_TRIAL_SETTINGS = {
  enabled: true,
  accountKey: 'TESTA',
  password: 'TESTA',
  projectIds: [],
  projectNames: ['TESTA'],
  blockOutbound: true,
  resetEnabled: true,
  resetHour: 4,
  sandboxCollections: [...DEFAULT_SANDBOX_COLLECTIONS],
  lastSnapshotAt: null,
  lastResetAt: null,
};

export async function fetchTrialSettings() {
  const snap = await getDoc(doc(db, 'systemSettings', 'trial'));
  if (!snap.exists()) return { ...DEFAULT_TRIAL_SETTINGS, _exists: false };
  return { ...DEFAULT_TRIAL_SETTINGS, ...snap.data(), _exists: true };
}

export async function saveTrialSettings(settings, updatedBy = '') {
  const {
    _exists, lastSnapshotAt, lastResetAt, ...rest
  } = settings; // eslint-disable-line no-unused-vars
  await setDoc(
    doc(db, 'systemSettings', 'trial'),
    { ...rest, updatedAt: serverTimestamp(), updatedBy },
    { merge: true },
  );
}

/** 最近 N 次沙盒重置紀錄（前端排序） */
export async function fetchSandboxResets(limitCount = 7) {
  const snap = await getDocs(collection(db, 'trialSandboxResets'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.startedAt)?.getTime() || 0) - (toDate(a.startedAt)?.getTime() || 0))
    .slice(0, limitCount);
}
