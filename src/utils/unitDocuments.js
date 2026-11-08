// 戶別「上傳文件」共用常數與工具（SPEC_UnitDocumentUpload.md）
// 後端 functions/index.js 另有同名常數，修改種類清單時前後端要一起改。

// tone：macOS 標籤色（src/styles/unitDocuments.css 的 .udt--{tone}）
export const UNIT_DOCUMENT_TYPES = [
  { key: 'contract', label: '合約書', icon: 'mdi-file-sign', color: 'deep-purple', tone: 'purple' },
  { key: 'idCard', label: '身分證', icon: 'mdi-card-account-details-outline', color: 'indigo', tone: 'blue' },
  { key: 'customerCard', label: '客戶資料卡', icon: 'mdi-account-box-outline', color: 'teal', tone: 'teal' },
  { key: 'order', label: '訂單', icon: 'mdi-receipt-text-outline', color: 'orange-darken-2', tone: 'orange' },
  { key: 'other', label: '其他', icon: 'mdi-file-outline', color: 'grey-darken-1', tone: 'gray', custom: true },
];

export const UNIT_DOCUMENT_MAX_SIZE = 100 * 1024 * 1024; // 單檔 100MB
export const UNIT_DOCUMENT_MAX_BATCH = 20; // 單批 20 檔
export const UNIT_DOCUMENT_CUSTOM_LABEL_MAX = 20;
export const UNIT_DOCUMENT_BLOCKED_EXTS = ['exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'ps1', 'vbs', 'jar'];

export function getDocTypeMeta(key) {
  return UNIT_DOCUMENT_TYPES.find(t => t.key === key) || UNIT_DOCUMENT_TYPES[UNIT_DOCUMENT_TYPES.length - 1];
}

/** 移除檔名不合法字元與控制字元，去頭尾空白／句點，截斷長度 */
export function sanitizeFileNameSegment(str, maxLen = 80) {
  return String(str || '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '')
    .trim()
    .replace(/^\.+|\.+$/g, '')
    .slice(0, maxLen);
}

/** 取副檔名（小寫、不含點、最長 10 字元）；無副檔名回傳 '' */
export function getFileExtension(name) {
  const s = String(name || '');
  const idx = s.lastIndexOf('.');
  if (idx <= 0 || idx === s.length - 1) return '';
  const ext = s.slice(idx + 1).toLowerCase();
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : '';
}

export function isBlockedExtension(ext) {
  return UNIT_DOCUMENT_BLOCKED_EXTS.includes(String(ext || '').toLowerCase());
}

/** 台北時區今天 → YYYYMMDD；傳入 'YYYYMMDD'／'YYYY-MM-DD' 字串時直接正規化 */
export function taipeiDateStamp(date = new Date()) {
  if (typeof date === 'string') {
    const digits = date.replace(/\D/g, '');
    if (/^\d{8}$/.test(digits)) return digits;
    date = new Date();
  }
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = type => (parts.find(p => p.type === type) || {}).value || '';
  return `${get('year')}${get('month')}${get('day')}`;
}

/** 台北時區今天 → YYYY-MM-DD（<input type="date"> 用） */
export function taipeiDateInputValue(date = new Date()) {
  const s = taipeiDateStamp(date);
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

/** 預設文件名稱（不含副檔名）：{YYYYMMDD}-{戶別}-{種類文字}；date 可為 Date 或 'YYYYMMDD'／'YYYY-MM-DD' */
export function buildUnitDocumentBaseName(unitId, typeLabel, date = new Date()) {
  const label = sanitizeFileNameSegment(typeLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX);
  return [taipeiDateStamp(date), sanitizeFileNameSegment(unitId, 30), label].filter(Boolean).join('-');
}

/** 去掉副檔名（只認 getFileExtension 判定為副檔名的部分） */
export function stripFileExtension(name) {
  const s = String(name || '');
  const ext = getFileExtension(s);
  return ext ? s.slice(0, -(ext.length + 1)) : s;
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 自動命名編號（名稱皆不含副檔名）。
 * entries：依清單順序 [{ key, base, touched, name }]；base 為 {日期}-{戶別}-{種類}，touched 表示使用者改過名稱（name 不動）。
 * existingNames：此戶已上傳的檔名（可含副檔名）。
 * 規則：同 base 本批只有一檔且此戶沒有同名 → 不加編號；否則 -1、-2…，此戶已有同名就接續最大編號往下編。
 * 回傳 Map(key → 名稱)，只含未改過名稱的項目。
 */
export function computeAutoNames(entries, existingNames = []) {
  const list = Array.isArray(entries) ? entries : [];
  const touchedNames = list.filter(e => e.touched).map(e => String(e.name || ''));
  const known = [...(existingNames || []).map(stripFileExtension), ...touchedNames].filter(Boolean);
  const taken = new Set(known);
  const groups = new Map();
  for (const e of list) {
    if (e.touched) continue;
    if (!groups.has(e.base)) groups.set(e.base, []);
    groups.get(e.base).push(e);
  }
  const result = new Map();
  for (const [base, group] of groups) {
    const pattern = new RegExp(`^${escapeRegExp(base)}-(\\d+)$`);
    let maxSeq = 0;
    for (const n of known) {
      if (n === base) maxSeq = Math.max(maxSeq, 1);
      else {
        const m = n.match(pattern);
        if (m) maxSeq = Math.max(maxSeq, Number(m[1]));
      }
    }
    if (group.length === 1 && maxSeq === 0) {
      result.set(group[0].key, base);
      taken.add(base);
      continue;
    }
    let seq = maxSeq > 0 ? maxSeq + 1 : 1;
    for (const e of group) {
      while (taken.has(`${base}-${seq}`)) seq += 1;
      const name = `${base}-${seq}`;
      result.set(e.key, name);
      taken.add(name);
      seq += 1;
    }
  }
  return result;
}

/** 解析種類：other 用自訂文字作為顯示標籤 */
export function resolveDocTypeLabel(docType, customLabel) {
  const meta = getDocTypeMeta(docType);
  if (meta.custom) return sanitizeFileNameSegment(customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX);
  return meta.label;
}

export function formatFileSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileIconForDocument(mimeType, fileName) {
  const mime = String(mimeType || '').toLowerCase();
  const ext = getFileExtension(fileName);
  if (mime === 'application/pdf' || ext === 'pdf') return { icon: 'mdi-file-pdf-box', color: 'red-darken-1' };
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'bmp'].includes(ext)) return { icon: 'mdi-file-image', color: 'teal' };
  if (mime.includes('word') || ['doc', 'docx'].includes(ext)) return { icon: 'mdi-file-word', color: 'blue-darken-2' };
  if (mime.includes('sheet') || mime.includes('excel') || ['xls', 'xlsx', 'csv'].includes(ext)) return { icon: 'mdi-file-excel', color: 'green-darken-2' };
  if (mime.includes('presentation') || mime.includes('powerpoint') || ['ppt', 'pptx'].includes(ext)) return { icon: 'mdi-file-powerpoint', color: 'orange-darken-3' };
  if (mime.includes('zip') || mime.includes('compressed') || ['zip', 'rar', '7z'].includes(ext)) return { icon: 'mdi-folder-zip-outline', color: 'brown' };
  return { icon: 'mdi-file-outline', color: 'grey-darken-1' };
}

/** ISO 字串 → 台北時間 MM/DD HH:mm */
export function formatTaipeiDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(d);
  const get = type => (parts.find(p => p.type === type) || {}).value || '';
  return `${get('month')}/${get('day')} ${get('hour')}:${get('minute')}`;
}

/** 依 uploadedAt 新→舊排序（前端排序，不用 Firestore orderBy） */
export function sortUnitDocuments(list) {
  return (Array.isArray(list) ? list.slice() : []).sort((a, b) =>
    String(b?.uploadedAt || '').localeCompare(String(a?.uploadedAt || ''))
  );
}
