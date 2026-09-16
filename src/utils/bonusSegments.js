// 銷售人員請佣獎金設定：多段「進退場設定」共用工具
// Why: 同一人可能離場後再次進場（例：2026/1/1–2026/12/31，之後 2027/6/1 起在案中），
//      兩段的保留款／稅金／二代健保／團獎分組可能不同。bonusConfig.segments 保存每一段，
//      頂層欄位鏡射「目前生效段」以相容尚未改版的讀取端；舊資料無 segments 時視為一段。

import { toDateValue } from './commissionCalculation';

const toNum = v => (Number.isFinite(Number(v)) ? Number(v) : 0);
const str = v => String(v ?? '').trim();

export function emptySegment(base = null) {
  return {
    inDate: '',
    outDate: '',
    keepPct: toNum(base?.keepPct),
    taxPct: toNum(base?.taxPct),
    nhiPct: toNum(base?.nhiPct),
    teamGroupKeys: Array.isArray(base?.teamGroupKeys) ? [...base.teamGroupKeys] : [],
    remark: str(base?.remark),
  };
}

export function normalizeSegment(s) {
  return {
    inDate: str(s?.inDate),
    outDate: str(s?.outDate),
    keepPct: toNum(s?.keepPct),
    taxPct: toNum(s?.taxPct),
    nhiPct: toNum(s?.nhiPct),
    teamGroupKeys: Array.isArray(s?.teamGroupKeys) ? s.teamGroupKeys.map(String).filter(Boolean) : [],
    remark: str(s?.remark),
  };
}

const dateNum = v => { const d = toDateValue(v); return d ? d.getTime() : null; };

/** 依進場日排序（無進場日者在最前） */
export function sortSegments(segments) {
  return [...segments].sort((a, b) => (dateNum(a.inDate) ?? -Infinity) - (dateNum(b.inDate) ?? -Infinity));
}

/** bonusConfig → 段落陣列；舊資料（無 segments）視為一段；無 bonusConfig → [] */
export function bonusSegments(bonusConfig) {
  if (!bonusConfig || typeof bonusConfig !== 'object') return [];
  const raw = Array.isArray(bonusConfig.segments) ? bonusConfig.segments : [bonusConfig];
  return sortSegments(raw.map(normalizeSegment));
}

/** 段落識別（同一人不同段的 profile 鍵）：以進場日區分 */
export function segmentId(seg) {
  return seg?.inDate ? seg.inDate : 'default';
}

/** 段落顯示標籤（僅在一人多段時使用） */
export function segmentLabel(seg) {
  if (!seg?.inDate) return '';
  return `${seg.inDate} 起`;
}

/** 目前生效段：在案中（無結案日）優先取進場最晚者，否則進場日最晚者 */
export function currentSegment(segments) {
  if (!segments.length) return null;
  const sorted = sortSegments(segments);
  const open = sorted.filter(s => !s.outDate);
  return open.length ? open[open.length - 1] : sorted[sorted.length - 1];
}

/**
 * 依日期（簽約日）找適用段落。
 * @returns {{ segment: object|null, matched: boolean }}
 *   matched=true：日期落在該段進退場區間內（或無日期／該段無限制）
 *   matched=false：不在任何段內，segment 為日期之前最近的一段（或第一段），供手動加入時取費率
 */
export function segmentForDate(segments, date) {
  if (!segments.length) return { segment: null, matched: true };
  const d = dateNum(date);
  const sorted = sortSegments(segments);
  if (d === null) return { segment: currentSegment(sorted), matched: true };
  const hit = sorted.find(s => {
    const inD = dateNum(s.inDate);
    const outD = dateNum(s.outDate);
    if (inD !== null && d < inD) return false;
    if (outD !== null && d > outD) return false;
    return true;
  });
  if (hit) return { segment: hit, matched: true };
  const before = sorted.filter(s => { const inD = dateNum(s.inDate); return inD === null || inD <= d; });
  return { segment: before.length ? before[before.length - 1] : sorted[0], matched: false };
}

/** 段落 → 寫入用 bonusConfig（頂層鏡射目前生效段） */
export function buildBonusConfig(segments) {
  const segs = sortSegments(segments.map(normalizeSegment));
  const cur = currentSegment(segs) || emptySegment();
  return { ...cur, segments: segs };
}

/** 驗證：後段須有進場日、前段須有結案日且不得重疊、單段進場不得晚於結案。回傳錯誤文字或 '' */
export function validateSegments(segments) {
  const segs = sortSegments(segments.map(normalizeSegment));
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i];
    const inD = dateNum(s.inDate);
    const outD = dateNum(s.outDate);
    if (s.inDate && inD === null) return `第 ${i + 1} 段進場時間格式錯誤`;
    if (s.outDate && outD === null) return `第 ${i + 1} 段結案時間格式錯誤`;
    if (inD !== null && outD !== null && inD > outD) return `第 ${i + 1} 段進場時間晚於結案時間`;
    if (i > 0) {
      const prev = segs[i - 1];
      const prevOut = dateNum(prev.outDate);
      if (inD === null) return `第 ${i + 1} 段須填進場時間`;
      if (prevOut === null) return `第 ${i} 段須填結案時間，才能新增後續段落`;
      if (prevOut >= inD) return `第 ${i} 段與第 ${i + 1} 段日期重疊`;
    }
  }
  return '';
}

/** 段落是否有任何設定值（用於判斷是否需要寫入 bonusConfig） */
export function segmentHasValue(s) {
  const n = normalizeSegment(s);
  return n.keepPct > 0 || n.taxPct > 0 || n.nhiPct > 0 || n.teamGroupKeys.length > 0 || !!n.inDate || !!n.outDate || !!n.remark;
}
