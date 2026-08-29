// src/services/prospectService.js
// 客戶開發（docs/SPEC_CustomerProspecting.md §2 / §5）
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
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  query,
  where,
} from 'firebase/firestore';
import { toDate } from '@/services/trialLeadsService';

export { toDate };

// ---------------------------------------------------------------
// 常數
// ---------------------------------------------------------------

export const PROSPECT_CATEGORY_OPTIONS = [
  { value: 'project', title: '建案', color: 'primary', icon: 'mdi-office-building' },
  { value: 'builder', title: '建商', color: 'teal', icon: 'mdi-domain' },
  { value: 'agency', title: '代銷', color: 'orange', icon: 'mdi-bullhorn' },
  { value: 'resource', title: '公會平台', color: 'grey', icon: 'mdi-web' },
];

/** 業務漏斗狀態（§0） */
export const PROSPECT_STATUS_OPTIONS = [
  { value: 'new', title: '未聯絡', color: 'grey', order: 0 },
  { value: 'emailed', title: '已寄信', color: 'blue', order: 1 },
  { value: 'replied', title: '已回覆', color: 'cyan', order: 2 },
  { value: 'negotiating', title: '洽談中', color: 'orange', order: 3 },
  { value: 'won', title: '已成交', color: 'green', order: 4 },
  { value: 'paused', title: '暫緩', color: 'brown', order: 5 },
  { value: 'do_not_contact', title: '不聯絡', color: 'red', order: 6 },
];

/** 群發時自動排除的狀態 */
export const EXCLUDED_STATUSES = ['do_not_contact'];

export const PROSPECT_PRIORITY_OPTIONS = [
  { value: 0, title: '一般' },
  { value: 1, title: '高' },
  { value: 2, title: '最高' },
];

/** 活動事件 type → 中文／圖示 */
export const PROSPECT_EVENT_LABELS = {
  imported: { label: '匯入 Excel', icon: 'mdi-file-excel', color: 'grey' },
  created: { label: '手動建立', icon: 'mdi-plus', color: 'grey' },
  email_sent: { label: '寄出 Email', icon: 'mdi-email-send', color: 'blue' },
  email_failed: { label: 'Email 寄送失敗', icon: 'mdi-email-alert', color: 'error' },
  email_opened: { label: '已開信', icon: 'mdi-email-open', color: 'cyan' },
  call: { label: '電話聯絡', icon: 'mdi-phone', color: 'teal' },
  line: { label: 'LINE 聯絡', icon: 'mdi-chat', color: 'green' },
  meeting: { label: '會面', icon: 'mdi-handshake', color: 'purple' },
  reply: { label: '對方回覆', icon: 'mdi-reply', color: 'cyan' },
  note: { label: '備註', icon: 'mdi-note-text', color: 'grey' },
  status_changed: { label: '狀態變更', icon: 'mdi-flag', color: 'orange' },
  followup_set: { label: '設定追蹤日', icon: 'mdi-calendar-clock', color: 'indigo' },
};

/** 詳情面板可手動新增的事件 */
export const MANUAL_EVENT_TYPES = ['call', 'line', 'meeting', 'note', 'reply'];

export const DEFAULT_PROSPECT_TAGS = [
  { id: 'high', name: '高優先', color: 'red' },
  { id: 'has-email', name: '有 Email', color: 'green' },
  { id: 'has-fb', name: '有 FB', color: 'blue' },
  { id: 'met', name: '已見面', color: 'purple' },
  { id: 'incomplete', name: '名單不完整', color: 'grey' },
];

export const DEFAULT_PROSPECT_SETTINGS = {
  followUpDaysAfterEmail: 7,
  defaultReplyTo: '',
  trackingEnabled: true,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ---------------------------------------------------------------
// 工具
// ---------------------------------------------------------------

export function genId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/** 全形 → 半形 */
function toHalfWidth(s) {
  return String(s || '').replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/　/g, ' ');
}

/** 名稱比對鍵：去空白、全形→半形、小寫、統一括號 */
export function nameKey(name) {
  return toHalfWidth(name)
    .replace(/[（(]/g, '(')
    .replace(/[）)]/g, ')')
    .replace(/[\s·．・•]/g, '')
    .toLowerCase();
}

/** 去掉括號內容（含括號） */
export function stripParens(name) {
  return String(name || '').replace(/[（(][^）)]*[）)]/g, '').trim();
}

/** 括號內內容 */
export function parenContent(name) {
  const m = String(name || '').match(/[（(]([^）)]*)[）)]/);
  return m ? m[1].trim() : '';
}

export function isValidEmail(email) {
  return EMAIL_RE.test(String(email || '').trim());
}

export function statusMeta(value) {
  return PROSPECT_STATUS_OPTIONS.find((o) => o.value === value) || PROSPECT_STATUS_OPTIONS[0];
}
export function categoryMeta(value) {
  return PROSPECT_CATEGORY_OPTIONS.find((o) => o.value === value) || { value, title: value || '—', color: 'grey', icon: 'mdi-help' };
}

/** 主要聯絡人（isPrimary 優先，其次第一個有 email 的） */
export function primaryContact(p) {
  const contacts = Array.isArray(p?.contacts) ? p.contacts : [];
  return contacts.find((c) => c.isPrimary && c.email) || contacts.find((c) => c.email) || contacts[0] || null;
}

/** 所有有效 Email 聯絡人 */
export function emailContacts(p) {
  const contacts = Array.isArray(p?.contacts) ? p.contacts : [];
  return contacts.filter((c) => isValidEmail(c.email));
}

/** 是否到期待追蹤（followUpAt <= 今日 23:59:59 台灣時間，且狀態非 won / do_not_contact） */
export function isDueForFollowUp(p, now = new Date()) {
  const d = toDate(p?.followUpAt);
  if (!d) return false;
  if (['won', 'do_not_contact'].includes(p?.status)) return false;
  return d.getTime() <= endOfTodayTaipei(now).getTime();
}

/** 台灣時間今日 23:59:59.999 */
export function endOfTodayTaipei(now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  return new Date(`${ymd}T23:59:59.999+08:00`);
}

/** 台灣時間 N 天後 09:00 */
export function daysFromNowTaipei(days, now = new Date()) {
  const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  const base = new Date(`${ymd}T09:00:00+08:00`);
  base.setDate(base.getDate() + Number(days || 0));
  return base;
}

/** 建立事件物件 */
export function makeEvent(type, { by = '', byName = '', text = '', meta = {}, at = new Date() } = {}) {
  return { id: genId('ev_'), type, at, by, byName, text, meta };
}

// ---------------------------------------------------------------
// prospects
// ---------------------------------------------------------------

const COL = 'prospects';

export async function fetchProspects() {
  const snap = await getDocs(collection(db, COL));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchProspect(id) {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** 空白建案／公司骨架 */
export function emptyProspect(category = 'project') {
  return {
    category,
    name: '',
    nameKey: '',
    companyId: null,
    companyName: '',
    region: '',
    builder: '',
    agency: '',
    saleStatus: '',
    phone: '',
    phoneHousetube: '',
    phone591: '',
    receptionAddress: '',
    siteAddress: '',
    facebook: '',
    line: '',
    website: '',
    instagram: '',
    resourceType: '',
    projectsText: '',
    note: '',
    contacts: [],
    status: 'new',
    tags: [],
    owner: null,
    ownerName: '',
    priority: 0,
    followUpAt: null,
    memo: '',
    lastEmailAt: null,
    lastEmailStatus: null,
    lastOpenedAt: null,
    repliedAt: null,
    emailCount: 0,
    openCount: 0,
    emailLogs: [],
    events: [],
    source: 'manual',
    importBatchId: null,
  };
}

/** 新增；回傳 id */
export async function createProspect(data, operator = {}) {
  const payload = {
    ...emptyProspect(data.category),
    ...data,
    nameKey: nameKey(data.name),
    source: data.source || 'manual',
    events: [makeEvent('created', { by: operator.key || '', byName: operator.name || '' })],
    createdAt: serverTimestamp(),
    createdBy: operator.key || '',
    updatedAt: serverTimestamp(),
    updatedBy: operator.key || '',
  };
  const ref = await addDoc(collection(db, COL), payload);
  return ref.id;
}

/** 更新（自動補 updatedAt／nameKey） */
export async function updateProspect(id, patch, operatorKey = '') {
  const data = { ...patch, updatedAt: serverTimestamp(), updatedBy: operatorKey };
  if (typeof patch.name === 'string') data.nameKey = nameKey(patch.name);
  await updateDoc(doc(db, COL, id), data);
}

/** 追加事件（arrayUnion） */
export async function appendProspectEvent(id, event, extraPatch = {}, operatorKey = '') {
  await updateDoc(doc(db, COL, id), {
    events: arrayUnion(event),
    ...extraPatch,
    updatedAt: serverTimestamp(),
    updatedBy: operatorKey,
  });
}

export async function deleteProspect(id) {
  await deleteDoc(doc(db, COL, id));
}

export async function bulkDeleteProspects(ids) {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    ids.slice(i, i + CHUNK).forEach((id) => batch.delete(doc(db, COL, id)));
    await batch.commit();
  }
}

/** 批次更新：fn(prospect) 回傳 patch（或 null 略過） */
export async function bulkUpdateProspects(ids, fn, byId = {}, operatorKey = '') {
  const CHUNK = 400;
  for (let i = 0; i < ids.length; i += CHUNK) {
    const batch = writeBatch(db);
    let count = 0;
    ids.slice(i, i + CHUNK).forEach((id) => {
      const patch = fn(byId[id] || { id });
      if (!patch) return;
      batch.update(doc(db, COL, id), { ...patch, updatedAt: serverTimestamp(), updatedBy: operatorKey });
      count += 1;
    });
    if (count > 0) await batch.commit();
  }
}

export async function bulkAddProspectTag(ids, tagName) {
  await bulkUpdateProspects(ids, () => ({ tags: arrayUnion(tagName) }));
}
export async function bulkRemoveProspectTag(ids, tagName) {
  await bulkUpdateProspects(ids, () => ({ tags: arrayRemove(tagName) }));
}

// ---------------------------------------------------------------
// 標籤（systemSettings/prospectTags）
// ---------------------------------------------------------------

export async function fetchProspectTags() {
  const ref = doc(db, 'systemSettings', 'prospectTags');
  const snap = await getDoc(ref);
  if (snap.exists() && Array.isArray(snap.data().tags)) return snap.data().tags;
  await setDoc(ref, { tags: DEFAULT_PROSPECT_TAGS, updatedAt: serverTimestamp() });
  return [...DEFAULT_PROSPECT_TAGS];
}

export async function saveProspectTags(tags) {
  await setDoc(doc(db, 'systemSettings', 'prospectTags'), { tags, updatedAt: serverTimestamp() }, { merge: true });
}

export async function renameTagOnAllProspects(oldName, newName) {
  if (!oldName || !newName || oldName === newName) return 0;
  const list = await fetchProspects();
  const affected = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(oldName));
  const byId = Object.fromEntries(affected.map((p) => [p.id, p]));
  await bulkUpdateProspects(affected.map((p) => p.id), (p) => ({
    tags: Array.from(new Set(p.tags.map((t) => (t === oldName ? newName : t)))),
  }), byId);
  return affected.length;
}

export async function removeTagFromAllProspects(tagName) {
  const list = await fetchProspects();
  const affected = list.filter((p) => Array.isArray(p.tags) && p.tags.includes(tagName));
  await bulkRemoveProspectTag(affected.map((p) => p.id), tagName);
  return affected.length;
}

/** 給 TrialLeadTagManager 用的 adapter */
export const prospectTagAdapter = {
  save: saveProspectTags,
  renameOnAll: renameTagOnAllProspects,
  removeFromAll: removeTagFromAllProspects,
  entityLabel: '開發對象',
};

// ---------------------------------------------------------------
// 設定（systemSettings/prospecting）
// ---------------------------------------------------------------

export async function fetchProspectSettings() {
  const snap = await getDoc(doc(db, 'systemSettings', 'prospecting'));
  if (!snap.exists()) return { ...DEFAULT_PROSPECT_SETTINGS };
  return { ...DEFAULT_PROSPECT_SETTINGS, ...snap.data() };
}

export async function saveProspectSettings(settings, updatedBy = '') {
  await setDoc(doc(db, 'systemSettings', 'prospecting'), {
    followUpDaysAfterEmail: Math.min(60, Math.max(1, Number(settings.followUpDaysAfterEmail) || 7)),
    defaultReplyTo: String(settings.defaultReplyTo || '').trim(),
    trackingEnabled: settings.trackingEnabled !== false,
    updatedAt: serverTimestamp(),
    updatedBy,
  }, { merge: true });
}

// ---------------------------------------------------------------
// 負責人（超級管理員清單）
// ---------------------------------------------------------------

export async function fetchSuperAdmins() {
  const q = query(collection(db, 'users'), where('roles', 'array-contains', '超級管理員'));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ key: d.id, name: d.data().name || d.id, email: d.data().email || '' }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

// ---------------------------------------------------------------
// 寄信紀錄（只取 target === 'prospects'）
// ---------------------------------------------------------------

export async function fetchEmailCampaign(id) {
  const snap = await getDoc(doc(db, 'emailCampaigns', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function fetchProspectCampaigns() {
  const snap = await getDocs(collection(db, 'emailCampaigns'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.target === 'prospects')
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
}

/**
 * 寄信後自動排追蹤日（§6.3）：對成功寄出的 prospect，followUpAt 為空或早於今天 → 設為 N 天後
 * @returns {number} 更新筆數
 */
export async function scheduleFollowUpAfterEmail(campaign, byId, days, operator = {}) {
  const recipients = Array.isArray(campaign?.recipients) ? campaign.recipients : [];
  const ids = Array.from(new Set(recipients.filter((r) => r.status === 'sent' && r.leadId).map((r) => r.leadId)));
  const today = endOfTodayTaipei();
  const target = daysFromNowTaipei(days);
  const affected = ids.filter((id) => {
    const p = byId[id];
    if (!p) return false;
    const cur = toDate(p.followUpAt);
    return !cur || cur.getTime() <= today.getTime();
  });
  if (!affected.length) return 0;
  await bulkUpdateProspects(affected, () => ({
    followUpAt: target,
    events: arrayUnion(makeEvent('followup_set', {
      by: operator.key || '', byName: operator.name || '',
      text: `寄信後自動排程 ${days} 天後追蹤`,
      meta: { auto: true, campaignId: campaign.id, followUpAt: target.toISOString() },
    })),
  }), byId, operator.key || '');
  return affected.length;
}

// ---------------------------------------------------------------
// 匯入紀錄
// ---------------------------------------------------------------

export async function saveProspectImport(record) {
  const ref = await addDoc(collection(db, 'prospectImports'), { ...record, createdAt: serverTimestamp() });
  return ref.id;
}

export async function fetchProspectImports(limitCount = 10) {
  const snap = await getDocs(collection(db, 'prospectImports'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0))
    .slice(0, limitCount);
}

// ---------------------------------------------------------------
// Excel 匯入（§5.1）
// ---------------------------------------------------------------

/** 工作表名稱 → category（模糊比對） */
export function detectSheetCategory(sheetName) {
  const n = String(sheetName || '');
  if (/建案/.test(n)) return 'project';
  if (/建商|建設/.test(n)) return 'builder';
  if (/代銷/.test(n)) return 'agency';
  if (/公會|平台|社群/.test(n)) return 'resource';
  if (/說明/.test(n)) return null;
  return null;
}

/** 欄位對應表：category → { 欄名(可多個別名) : 目標欄位 } */
const SHEET_COLUMN_MAP = {
  project: [
    ['建案名稱', 'name'], ['區域', 'region'], ['建設公司', 'builder'], ['代銷/企劃銷售', 'agency'], ['代銷', 'agency'],
    ['狀態_銷售', 'saleStatus'], ['銷售狀態', 'saleStatus'], ['狀態', 'saleStatus'], ['建案直撥電話', 'phone'], ['電話', 'phone'], ['房地王轉接', 'phoneHousetube'], ['591轉接', 'phone591'],
    ['接待中心地址', 'receptionAddress'], ['基地地址', 'siteAddress'], ['FB 粉專', 'facebook'], ['FB粉專', 'facebook'], ['FB', 'facebook'],
    ['LINE', 'line'], ['Email', '_email'], ['官網/來源', 'website'], ['官網', 'website'], ['備註', 'note'],
  ],
  builder: [
    ['建設公司', 'name'], ['公司名稱', 'name'], ['名稱', 'name'], ['電話', 'phone'], ['地址', 'siteAddress'], ['Email', '_email'],
    ['FB 粉專', 'facebook'], ['FB粉專', 'facebook'], ['FB', 'facebook'], ['LINE', 'line'], ['IG / 其他', 'instagram'], ['IG', 'instagram'],
    ['官網', 'website'], ['在售新竹建案', 'projectsText'], ['在售建案', 'projectsText'], ['備註', 'note'],
  ],
  agency: [
    ['代銷/企劃銷售公司', 'name'], ['代銷公司', 'name'], ['公司名稱', 'name'], ['名稱', 'name'], ['電話', 'phone'],
    ['LINE / 官網', '_lineOrWeb'], ['LINE', 'line'], ['官網', 'website'], ['Email', '_email'],
    ['負責新竹建案', 'projectsText'], ['負責建案', 'projectsText'], ['備註', 'note'],
  ],
  resource: [
    ['名稱', 'name'], ['類型', 'resourceType'], ['電話', 'phone'], ['Email', '_email'], ['地址', 'siteAddress'],
    ['連結', 'website'], ['官網', 'website'], ['說明', 'note'], ['備註', 'note'], ['FB', 'facebook'], ['LINE', 'line'],
  ],
};

/** 不覆蓋的欄位（更新時） */
const IMPORT_PROTECTED_FIELDS = new Set(['status', 'tags', 'contacts', 'memo', 'events', 'emailLogs', 'owner', 'ownerName', 'priority', 'followUpAt']);

/**
 * 把工作表 rows（json_to_sheet 反向：header→值）轉為 prospect 部分物件
 * @returns {{ rows: object[], errors: {row:number,message:string}[] }}
 */
export function mapSheetRows(category, rows) {
  const map = SHEET_COLUMN_MAP[category] || [];
  const out = [];
  const errors = [];
  rows.forEach((raw, idx) => {
    const rec = {};
    let email = '';
    let lineOrWeb = '';
    for (const [header, field] of map) {
      const key = Object.keys(raw).find((k) => nameKey(k) === nameKey(header));
      if (key == null) continue;
      const val = String(raw[key] ?? '').trim();
      if (!val) continue;
      if (field === '_email') email = val;
      else if (field === '_lineOrWeb') lineOrWeb = val;
      else if (rec[field] == null) rec[field] = val;
    }
    if (lineOrWeb) {
      const parts = lineOrWeb.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
      parts.forEach((p) => {
        if (/^https?:\/\//i.test(p) || /\.(tw|com|net|org)/i.test(p)) { if (!rec.website) rec.website = p; } else if (!rec.line) rec.line = p;
      });
    }
    if (!rec.name) {
      errors.push({ row: idx + 2, message: '缺少名稱，已略過' });
      return;
    }
    rec.category = category;
    rec._email = email;
    out.push(rec);
  });
  return { rows: out, errors };
}

/**
 * 解析 builder 字串 → 建商 prospect id
 * 順序：整串 → 去括號 → 括號內
 */
export function resolveCompanyId(builderText, buildersByKey) {
  if (!builderText) return null;
  const candidates = [builderText, stripParens(builderText), parenContent(builderText)]
    .map((s) => nameKey(s)).filter(Boolean);
  for (const k of candidates) {
    if (buildersByKey[k]) return buildersByKey[k];
  }
  // 再試：建商名稱包含在字串中（例：「大君建設(春福機構)」→ 春福建設 / 大君建設）
  for (const [k, id] of Object.entries(buildersByKey)) {
    if (k.length >= 3 && candidates.some((c) => c.includes(k) || k.includes(c))) return id;
  }
  return null;
}

/** 自動標籤 */
export function autoTags(p) {
  const tags = new Set(Array.isArray(p.tags) ? p.tags : []);
  const hasEmail = emailContacts(p).length > 0;
  const hasFb = !!p.facebook;
  if (hasEmail) tags.add('有 Email'); else tags.delete('有 Email');
  if (hasFb) tags.add('有 FB'); else tags.delete('有 FB');
  if (!p.phone && !hasEmail && !hasFb) tags.add('名單不完整'); else tags.delete('名單不完整');
  return Array.from(tags);
}

/**
 * 執行匯入
 * @param {{category:string, rows:object[]}[]} sheets  已 mapSheetRows 的資料
 * @param {object[]} existing  目前所有 prospects
 * @param {{overwrite:boolean, batchId:string, operator:{key,name}}} opts
 * @returns {{ summary: object, errors: object[] }}
 */
export async function runProspectImport(sheets, existing, { overwrite = false, batchId, operator = {} }) {
  const byKey = {}; // `${category}|${nameKey}` → prospect
  existing.forEach((p) => { byKey[`${p.category}|${p.nameKey || nameKey(p.name)}`] = p; });
  const buildersByKey = {};
  existing.filter((p) => p.category === 'builder').forEach((p) => { buildersByKey[p.nameKey || nameKey(p.name)] = p.id; });

  const order = ['builder', 'agency', 'resource', 'project'];
  const sorted = [...sheets].sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
  const summary = {};
  const errors = [];
  const now = new Date();

  for (const sheet of sorted) {
    const cat = sheet.category;
    summary[cat] = { created: 0, updated: 0, skipped: 0 };
    let batch = writeBatch(db);
    let count = 0;
    const flush = async () => { if (count > 0) { await batch.commit(); batch = writeBatch(db); count = 0; } };

    for (const row of sheet.rows) {
      const key = `${cat}|${nameKey(row.name)}`;
      const { _email, ...fields } = row;
      const existingP = byKey[key];

      // 建案 → 建商
      if (cat === 'project') {
        const cid = resolveCompanyId(fields.builder, buildersByKey);
        if (cid) fields.companyId = cid;
      }

      if (existingP) {
        const patch = {};
        Object.entries(fields).forEach(([k, v]) => {
          if (IMPORT_PROTECTED_FIELDS.has(k)) return;
          if (overwrite || !existingP[k]) patch[k] = v;
        });
        // Email → 聯絡人（不存在同 email 才加）
        const contacts = Array.isArray(existingP.contacts) ? [...existingP.contacts] : [];
        if (_email && isValidEmail(_email) && !contacts.some((c) => String(c.email || '').toLowerCase() === _email.toLowerCase())) {
          contacts.push({ id: genId('c_'), name: '', title: '', email: _email, phone: '', line: '', note: '', isPrimary: contacts.length === 0 });
          patch.contacts = contacts;
        }
        if (fields.companyId && !existingP.companyId) patch.companyId = fields.companyId;
        if (patch.companyId) patch.companyName = fields.builder || existingP.builder || '';
        const merged = { ...existingP, ...patch, contacts: patch.contacts || contacts };
        patch.tags = autoTags(merged);
        patch.nameKey = nameKey(existingP.name);
        patch.updatedAt = serverTimestamp();
        patch.updatedBy = operator.key || '';
        patch.importBatchId = batchId;
        batch.update(doc(db, COL, existingP.id), patch);
        summary[cat].updated += 1;
        Object.assign(existingP, merged);
      } else {
        const contacts = _email && isValidEmail(_email)
          ? [{ id: genId('c_'), name: '', title: '', email: _email, phone: '', line: '', note: '', isPrimary: true }]
          : [];
        const data = {
          ...emptyProspect(cat),
          ...fields,
          nameKey: nameKey(row.name),
          companyName: cat === 'project' ? (fields.builder || '') : '',
          contacts,
          source: 'excel',
          importBatchId: batchId,
          events: [makeEvent('imported', { by: operator.key || '', byName: operator.name || '', meta: { batchId }, at: now })],
          createdAt: serverTimestamp(),
          createdBy: operator.key || '',
          updatedAt: serverTimestamp(),
          updatedBy: operator.key || '',
        };
        data.tags = autoTags(data);
        const ref = doc(collection(db, COL));
        batch.set(ref, data);
        summary[cat].created += 1;
        const local = { id: ref.id, ...data };
        byKey[key] = local;
        if (cat === 'builder') buildersByKey[data.nameKey] = ref.id;
      }
      count += 1;
      if (count >= 400) await flush();
    }
    await flush();
    (sheet.errors || []).forEach((e) => errors.push({ sheet: cat, ...e }));
    summary[cat].skipped = (sheet.errors || []).length;
  }

  return { summary, errors };
}

// ---------------------------------------------------------------
// Excel 匯出（§5.2）
// ---------------------------------------------------------------

/** 匯出用：category → 列物件 */
export function prospectToExportRow(p, { fmt, statusLabel, ownerName }) {
  const contacts = (Array.isArray(p.contacts) ? p.contacts : [])
    .map((c) => `${c.name || ''}<${c.email || ''}>${c.phone ? ` ${c.phone}` : ''}`.trim()).join('; ');
  const common = {
    狀態: statusLabel(p.status),
    標籤: (Array.isArray(p.tags) ? p.tags : []).join(','),
    負責人: ownerName(p.owner) || p.ownerName || '',
    優先度: PROSPECT_PRIORITY_OPTIONS.find((o) => o.value === (p.priority || 0))?.title || '一般',
    下次追蹤: fmt(p.followUpAt, 'yyyy/MM/dd'),
    最後寄信: fmt(p.lastEmailAt),
    寄信次數: p.emailCount || 0,
    開信次數: p.openCount || 0,
    回覆日: fmt(p.repliedAt),
    開發備註: p.memo || '',
    聯絡人: contacts,
  };
  const email = primaryContact(p)?.email || '';
  switch (p.category) {
    case 'project':
      return {
        建案名稱: p.name, 區域: p.region || '', 建設公司: p.builder || '', '代銷/企劃銷售': p.agency || '', 狀態_銷售: p.saleStatus || '',
        建案直撥電話: p.phone || '', 房地王轉接: p.phoneHousetube || '', '591轉接': p.phone591 || '',
        接待中心地址: p.receptionAddress || '', 基地地址: p.siteAddress || '', 'FB 粉專': p.facebook || '', LINE: p.line || '',
        Email: email, '官網/來源': p.website || '', 備註: p.note || '', ...common,
      };
    case 'builder':
      return {
        建設公司: p.name, 電話: p.phone || '', 地址: p.siteAddress || '', Email: email, 'FB 粉專': p.facebook || '', LINE: p.line || '',
        'IG / 其他': p.instagram || '', 官網: p.website || '', 在售新竹建案: p.projectsText || '', 備註: p.note || '', ...common,
      };
    case 'agency':
      return {
        '代銷/企劃銷售公司': p.name, 電話: p.phone || '', LINE: p.line || '', 官網: p.website || '', Email: email,
        負責新竹建案: p.projectsText || '', 備註: p.note || '', ...common,
      };
    default:
      return {
        名稱: p.name, 類型: p.resourceType || '', 電話: p.phone || '', Email: email, 地址: p.siteAddress || '',
        連結: p.website || '', 說明: p.note || '', ...common,
      };
  }
}

export const EXPORT_SHEET_NAMES = { project: '建案清單', builder: '建商清單', agency: '代銷公司', resource: '公會_平台_社群' };
