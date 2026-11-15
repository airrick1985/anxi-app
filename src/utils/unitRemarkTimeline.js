// 戶別備註時間軸（請佣／獎金工作台「備註」視窗）：把一戶的各種備註攤平成一則一段
// 來源：銷控備註（remarkNotes／舊字串 remarks）、退戶紀錄（前買方的退戶原因與備註）、
//       請佣／獎金紀錄（備註、退佣原因、每人獎金備註；作廢紀錄不列）、介紹費／贈品明細
// 排序：目前銷控備註的置頂在最前，其餘依日期新到舊，沒有日期的排最後
import { resolveDisplayNotes, categoryMeta, toDateSafe } from './remarkNotes.js';
import { listFeeGiftEntries, FEE_GIFT_KINDS } from './unitFeeGifts.js';

export const REMARK_SOURCES = [
  { key: 'sales', label: '銷控', color: 'blue' },
  { key: 'cancelled', label: '退戶', color: 'red' },
  { key: 'record', label: '請佣獎金', color: 'teal' },
  { key: 'feeGift', label: '介紹費贈品', color: 'deep-orange' },
];
const SOURCE_ORDER = Object.fromEntries(REMARK_SOURCES.map((s, i) => [s.key, i]));

const str = v => (v === null || v === undefined ? '' : String(v).trim());

function tw(d, withTime) {
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit',
    ...(withTime ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}),
  }).formatToParts(d);
  const get = t => (parts.find(p => p.type === t) || {}).value || '';
  const date = `${get('year')}/${get('month')}/${get('day')}`;
  return withTime ? { date, time: `${get('hour') === '24' ? '00' : get('hour')}:${get('minute')}` } : { date, time: '' };
}

/** 日期欄位 → { ts, date, time }；withTime=false 只顯示日期（請佣日期、退戶日等只有日期的欄位） */
function stamp(value, withTime = true) {
  const d = toDateSafe(value);
  if (!d) return { ts: 0, date: '', time: '' };
  return { ts: d.getTime(), ...tw(d, withTime) };
}

function authorOf(note) {
  if (note.type === 'legacy') return '舊備註';
  if (note.type === 'system') return note.authorName ? `系統·${note.authorName}` : '系統';
  return str(note.authorName);
}

function noteTags(note) {
  const tags = [];
  if (note.type === 'user' && note.category && note.category !== 'general') {
    const c = categoryMeta(note.category);
    tags.push({ text: c.label, color: c.color });
  }
  if (note.updatedAt) tags.push({ text: '已編輯' });
  return tags;
}

function noteImages(note) {
  return (Array.isArray(note.images) ? note.images : [])
    .filter(img => img && img.url)
    .map(img => ({ url: img.url, name: img.name || '' }));
}

const toNum = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pct = v => `${Math.round(toNum(v) * 100) / 100}%`;

function salesItems(unit) {
  return resolveDisplayNotes(unit?.remarkNotes, unit?.remarks)
    .filter(n => str(n.content) || noteImages(n).length)
    .map(n => ({
      key: `sales:${n.noteId}`,
      source: 'sales',
      pinned: !!n.pinned,
      ...stamp(n.createdAt),
      title: '',
      by: authorOf(n),
      tags: noteTags(n),
      content: str(n.content),
      lines: [],
      images: noteImages(n),
    }));
}

function cancelledItems(list, unitId) {
  const out = [];
  (list || []).filter(c => c && c.unitId === unitId && !c.isDeleted).forEach(c => {
    const cancelAt = stamp(c.cancellationDate, false);
    const title = `前買方 ${str(c.buyerName) || '—'}`;
    const restoredTags = c.isRestored ? [{ text: '已復原', color: 'grey' }] : [];
    const baseTags = [...(cancelAt.date ? [{ text: `${cancelAt.date} 退戶` }] : []), ...restoredTags];
    const reasons = (Array.isArray(c.cancelReasons) ? c.cancelReasons : []).map(str).filter(Boolean);
    if (reasons.length) {
      out.push({
        key: `cancelled:${c.docId}:reason`, source: 'cancelled', pinned: false, ...cancelAt,
        title, by: str(c.operatorName), tags: restoredTags,   // 日期即退戶日，不再重複標示
        content: '', lines: [{ label: '退戶原因', text: reasons.join('、') }], images: [],
      });
    }
    resolveDisplayNotes(c.remarkNotes, c.remarks)
      .filter(n => str(n.content) || noteImages(n).length)
      .forEach(n => {
        const at = n.createdAt ? stamp(n.createdAt) : cancelAt;   // 舊字串備註沒有時間：以退戶日排序
        out.push({
          key: `cancelled:${c.docId}:${n.noteId}`, source: 'cancelled', pinned: false, ...at,
          title, by: authorOf(n),
          tags: [...(n.pinned ? [{ text: '📌 置頂' }] : []), ...noteTags(n), ...baseTags],
          content: str(n.content), lines: [], images: noteImages(n),
        });
      });
  });
  return out;
}

function recordKind(r) {
  const bonus = r.submissionType === 'bonus';
  if (r.type === 'refund') return bonus ? '退獎金' : '退佣';
  return bonus ? '獎金' : '請佣';
}

function recordItems(records, bonusRows, unitId) {
  const seen = new Set();
  const list = (records || []).filter(r => {
    if (!r || r.unitId !== unitId || r.status === 'voided' || seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  const multiPlan = new Set(list.map(r => str(r.planName))).size > 1;
  return list.map(r => {
    const lines = [];
    if (r.type === 'refund' && str(r.reason)) lines.push({ label: '原因', text: str(r.reason) });
    const people = [];
    (bonusRows || [])
      .filter(b => b.commissionRecordId === r.id && b.status !== 'voided' && str(b.remark))
      .forEach(b => {
        const text = `${str(b.name) || '—'}：${str(b.remark)}`;
        if (!people.includes(text)) people.push(text);
      });
    if (people.length) lines.push({ label: '人員備註', text: people.join('\n') });
    const content = str(r.note);
    if (!content && !lines.length) return null;
    const at = str(r.requestDate) ? stamp(r.requestDate, false) : stamp(r.createdAt, false);
    const tags = [
      { text: r.type === 'refund' ? `退回 ${pct(r.refundRatioPct ?? -toNum(r.ratioPct))}` : `比例 ${pct(r.ratioPct)}` },
      ...(multiPlan && str(r.planName) ? [{ text: str(r.planName) }] : []),
      ...(r.source === 'import' ? [{ text: '匯入' }] : []),
      ...(r.refundedBy ? [{ text: '已退佣', color: 'orange-darken-3' }] : []),
      ...(r.bonusRefundedBy ? [{ text: '已退獎金', color: 'orange-darken-3' }] : []),
    ];
    return {
      key: `record:${r.id}`, source: 'record', pinned: false, ...at,
      title: `${recordKind(r)} 第 ${toNum(r.period)} 期`,
      by: str(r.createdBy), tags, content, lines, images: [],
    };
  }).filter(Boolean);
}

function feeGiftItems(unit) {
  return listFeeGiftEntries(unit).map(g => {
    const kind = FEE_GIFT_KINDS[g.kind];
    const lines = [];
    if (g.kind === 'referral' && str(g.phone)) lines.push({ label: '電話', text: str(g.phone) });
    return {
      key: `feeGift:${g.id}`, source: 'feeGift', pinned: false, ...stamp(g.createdAt),
      title: `${kind.label}・${g.title}`,
      by: str(g.createdBy?.name ?? g.createdBy),
      tags: [
        { text: `${Math.round(g.amount).toLocaleString('en-US')} 元`, color: kind.color },
        ...(g.inNetPremium ? [{ text: '併入淨溢差價' }] : []),
      ],
      content: str(g.remark), lines, images: [],
    };
  });
}

/**
 * 一戶的備註時間軸（一則一段）
 * @param {object} p
 * @param {string} p.unitId
 * @param {object|null} p.unit - salesHouseholds 戶別資料
 * @param {Array} p.cancelled - getCancelledPurchases 的退戶紀錄（全建案，函式內依戶別篩選）
 * @param {Array} p.records - 請佣／獎金紀錄（全建案，可重複，依 id 去重）
 * @param {Array} p.bonusRows - 獎金明細（帶出每人備註）
 */
export function buildUnitRemarkTimeline({ unitId, unit = null, cancelled = [], records = [], bonusRows = [] }) {
  const items = [
    ...salesItems(unit),
    ...cancelledItems(cancelled, unitId),
    ...recordItems(records, bonusRows, unitId),
    ...feeGiftItems(unit),
  ];
  return items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (!a.ts !== !b.ts) return a.ts ? -1 : 1;   // 沒有日期的排最後
    return (b.ts - a.ts) || (SOURCE_ORDER[a.source] - SOURCE_ORDER[b.source]);
  });
}
