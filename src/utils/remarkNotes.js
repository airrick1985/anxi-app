// 銷控備註（留言式）共用工具
// 資料模型：salesHouseholds / cancelledPurchases 文件上的 remarkNotes 陣列
// {
//   noteId: string,                 // 唯一 ID
//   type: 'user' | 'system' | 'legacy', // 一般留言 / 系統自動留言 / 舊字串備註轉入
//   category: string,               // 分類（見 NOTE_CATEGORIES；system/legacy 不分類）
//   content: string,
//   images: [{ url, path, name, size, type }],
//   authorName: string,
//   authorKey: string,
//   createdAt: Timestamp,
//   updatedAt: Timestamp | null,    // 有值表示編輯過
//   pinned: boolean,
// }
// 向下相容：每次留言異動後，以 buildRemarksSummary() 產生字串回填舊欄位
// remarks，讓表格欄、匯出、Sheet 同步、AI 助手、請佣系統照常運作。

export const NOTE_CATEGORIES = [
  { value: 'general', label: '一般', color: 'blue-grey' },
  { value: 'customer', label: '客況', color: 'blue' },
  { value: 'reminder', label: '提醒', color: 'orange' },
  { value: 'finance', label: '財務', color: 'green' },
  { value: 'contract', label: '合約', color: 'purple' },
];

export const LEGACY_NOTE_ID = 'legacy-remarks';

export function categoryMeta(value) {
  return NOTE_CATEGORIES.find(c => c.value === value) || NOTE_CATEGORIES[0];
}

/** 各種來源（client Timestamp / callable 序列化 / 字串）轉 Date，失敗回 null */
export function toDateSafe(v) {
  if (!v) return null;
  try {
    if (typeof v.toDate === 'function') return v.toDate();
    if (typeof v.seconds === 'number') return new Date(v.seconds * 1000);
    if (typeof v._seconds === 'number') return new Date(v._seconds * 1000);
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  } catch (e) {
    return null;
  }
}

/** 顯示用時間：台灣時區 MM/DD HH:mm（跨年度時帶年份） */
export function formatNoteTime(v) {
  const d = toDateSafe(v);
  if (!d) return '';
  const opts = { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false };
  const nowYear = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric' });
  const noteYear = d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric' });
  if (noteYear !== nowYear) opts.year = 'numeric';
  return d.toLocaleString('zh-TW', opts).replace(',', '');
}

function noteTimeMs(n) {
  const d = toDateSafe(n?.createdAt);
  return d ? d.getTime() : 0;
}

/** 顯示排序：置頂在前，其餘新到舊 */
export function sortNotesForDisplay(notes) {
  const list = (notes || []).filter(n => n && typeof n.content === 'string');
  return [...list].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
    return noteTimeMs(b) - noteTimeMs(a);
  });
}

/**
 * 取得顯示用留言：remarkNotes 為空但舊字串 remarks 有值時，
 * 以一則虛擬「舊備註」呈現（尚未寫入資料庫，首次異動時才實體化）。
 */
export function resolveDisplayNotes(remarkNotes, legacyRemarks) {
  const arr = Array.isArray(remarkNotes) ? remarkNotes : [];
  if (arr.length > 0) return sortNotesForDisplay(arr);
  const legacy = typeof legacyRemarks === 'string' ? legacyRemarks.trim() : '';
  if (!legacy) return [];
  return [makeLegacyNote(legacy)];
}

export function makeLegacyNote(content) {
  return {
    noteId: LEGACY_NOTE_ID,
    type: 'legacy',
    category: 'general',
    content,
    images: [],
    authorName: '',
    authorKey: '',
    createdAt: null,
    updatedAt: null,
    pinned: false,
  };
}

/**
 * 實體化基底：以現有 remarkNotes 為準；若為空且有舊字串備註，
 * 先把舊備註轉為第一則 legacy 留言，確保向下相容資料不遺失。
 */
export function materializeNotes(remarkNotes, legacyRemarks) {
  const arr = Array.isArray(remarkNotes) ? remarkNotes.slice() : [];
  if (arr.length > 0) return arr;
  const legacy = typeof legacyRemarks === 'string' ? legacyRemarks.trim() : '';
  return legacy ? [makeLegacyNote(legacy)] : [];
}

export function newNoteId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `note-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * 向下相容回填字串：置頂在前、新到舊，格式 [MM/DD 姓名·分類] 內容。
 * 供 remarks 欄位（表格、匯出、Sheet 同步、AI context、請佣）使用。
 */
export function buildRemarksSummary(notes) {
  const sorted = sortNotesForDisplay(notes);
  return sorted.map(n => {
    const d = toDateSafe(n.createdAt);
    const dateStr = d
      ? d.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit' })
      : '';
    let name = n.authorName || '';
    if (n.type === 'legacy') name = '舊備註';
    else if (n.type === 'system') name = `系統·${n.authorName || ''}`.replace(/·$/, '');
    const catLabel = (n.type === 'user' && n.category && n.category !== 'general')
      ? categoryMeta(n.category).label
      : '';
    const head = [dateStr, name, catLabel].filter(Boolean).join(' ');
    const pin = n.pinned ? '📌' : '';
    return head ? `${pin}[${head}] ${n.content}` : `${pin}${n.content}`;
  }).join('\n');
}
