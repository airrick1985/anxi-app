/**
 * 銷售人員 Excel 匯出／匯入（銷控設定 → 銷售人員管理）
 *
 * - buildPersonnelWorkbook()：現有人員 → 工作簿（「銷售人員」＋「填寫說明」）
 * - parsePersonnelSheet()：工作表 → 列物件（標頭自動偵測）
 * - diffPersonnelRows()：列物件 × 現有人員 → 匯入計畫（新增／更新／無變更／錯誤）
 *
 * 比對鍵：人員ID（匯出檔內含）＞ 電話。檔案中沒有的人員不會被刪除。
 * 多段進退場：一人多列、每段一列（姓名／電話／Email／職位以第一列為準）；段落以進場時間比對更新或新增，檔案沒列到的段落保留。
 */

import * as XLSX from 'xlsx-js-style';
import { bonusSegments, buildBonusConfig, validateSegments, segmentHasValue } from './bonusSegments';

export const PERSONNEL_HEADERS = [
  '排序', '姓名', '電話', 'Email', '職位',
  '保留款%', '稅金%', '二代健保%', '團獎分組', '進場時間', '結案時間', '預設備註',
  '人員ID(系統用勿改)',
];

const SEP = /[、,，/;；|]+/;

function splitList(v) {
  return String(v ?? '').split(SEP).map(s => s.trim()).filter(Boolean);
}

/** 電話正規化（去除所有空白），供比對「電話是否已存在」使用 */
export function normPhone(v) {
  return String(v ?? '').replace(/\s+/g, '').trim();
}

/** Excel 日期序號／Date／字串 → yyyy/mm/dd（西元），無法解析回傳原字串 */
export function normDate(v) {
  if (v === '' || v === null || v === undefined) return '';
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return `${v.getFullYear()}/${String(v.getMonth() + 1).padStart(2, '0')}/${String(v.getDate()).padStart(2, '0')}`;
  }
  if (typeof v === 'number' && Number.isFinite(v)) {
    const d = XLSX.SSF.parse_date_code(v);
    if (d) return `${d.y}/${String(d.m).padStart(2, '0')}/${String(d.d).padStart(2, '0')}`;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{2,4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})$/);
  if (m) {
    let y = Number(m[1]);
    if (y < 1911) y += 1911;   // 民國年
    return `${y}/${String(m[2]).padStart(2, '0')}/${String(m[3]).padStart(2, '0')}`;
  }
  return s;
}

const isValidDate = s => {
  if (s === '') return true;
  const m = String(s).match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3]);
};

function pctNum(v) {
  if (v === '' || v === null || v === undefined) return '';
  const n = Number(String(v).replace('%', '').trim());
  return Number.isFinite(n) ? n : NaN;
}

// ================= 匯出 =================
export function personnelToRows(personnel, teamGroups = []) {
  const labelOf = key => (teamGroups.find(g => g.key === key)?.label) || key;
  return personnel.flatMap(p => {
    const segs = bonusSegments(p.bonusConfig);
    const rowsOf = seg => [
      p.order ?? '',
      p.name || '',
      p.phone || '',
      p.email || '',
      (p.positions || []).join('、'),
      seg ? seg.keepPct : '',
      seg ? seg.taxPct : '',
      seg ? seg.nhiPct : '',
      seg ? seg.teamGroupKeys.map(labelOf).join('、') : '',
      seg ? seg.inDate : '',
      seg ? seg.outDate : '',
      seg ? seg.remark : '',
      p.id || '',
    ];
    return segs.length ? segs.map(rowsOf) : [rowsOf(null)];
  });
}

export function buildPersonnelWorkbook(personnel, teamGroups = [], projectName = '') {
  const wb = XLSX.utils.book_new();
  const rows = personnelToRows(personnel, teamGroups);
  const ws = XLSX.utils.aoa_to_sheet([PERSONNEL_HEADERS, ...rows]);
  ws['!cols'] = [6, 12, 14, 26, 22, 9, 9, 10, 18, 12, 12, 24, 40].map(w => ({ wch: w }));
  PERSONNEL_HEADERS.forEach((_, c) => {
    const cell = ws[XLSX.utils.encode_cell({ r: 0, c })];
    if (cell) cell.s = { font: { bold: true }, fill: { fgColor: { rgb: 'E7E6E6' }, patternType: 'solid' }, alignment: { horizontal: 'center' } };
  });
  XLSX.utils.book_append_sheet(wb, ws, '銷售人員');

  const help = [
    ['欄位', '說明'],
    ['排序', '數字，越小越前面；留空＝新增者排最後、既有者不變。'],
    ['姓名 / 電話', '必填。電話為跨案識別鍵（personKey），請勿隨意更改。'],
    ['職位', '可多個，以「、」分隔。例：銷售、專案。'],
    ['保留款% / 稅金% / 二代健保%', '請佣獎金扣款比例，填數字（20 代表 20%）。'],
    ['團獎分組', `以分組名稱填寫，可多個以「、」分隔。本案分組：${(teamGroups.map(g => g.label).join('、')) || '（尚未建立）'}`],
    ['進場時間 / 結案時間', '西元 yyyy/mm/dd；結案時間留空＝在案中。'],
    ['多段進退場', '同一人離場後再進場，請在下一列重複姓名與電話，各列填各段的進場／結案／費率／分組（每列都要有進場時間）。'],
    ['人員ID(系統用勿改)', '匯出時自動帶入，用於比對更新；新增人員請留空。無 ID 時以「電話」比對。'],
    ['', ''],
    ['匯入規則', '1. 有人員ID或電話相符 → 更新該人員；否則 → 新增。'],
    ['', '2. Excel 內沒有的人員不會被刪除；段落以進場時間比對，檔案沒列到的段落也保留。'],
    ['', '3. 匯入前會先顯示新增／更新／無變更／錯誤的預覽，確認後才寫入。'],
  ];
  const hws = XLSX.utils.aoa_to_sheet(help);
  hws['!cols'] = [{ wch: 28 }, { wch: 90 }];
  XLSX.utils.book_append_sheet(wb, hws, '填寫說明');
  return wb;
}

export function exportPersonnelExcel(personnel, teamGroups = [], projectName = '') {
  const wb = buildPersonnelWorkbook(personnel, teamGroups, projectName);
  XLSX.writeFile(wb, `${projectName || '建案'}_銷售人員.xlsx`);
}

// ================= 匯入：解析 =================
/** 工作表 → 列物件陣列（欄位鍵同 PERSONNEL_HEADERS）；標頭列自動偵測（前 5 列含「姓名」與「電話」） */
export function parsePersonnelSheet(ws) {
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  let headerIdx = -1;
  for (let i = 0; i < Math.min(5, aoa.length); i++) {
    const cells = aoa[i].map(c => String(c).trim());
    if (cells.includes('姓名') && cells.includes('電話')) { headerIdx = i; break; }
  }
  if (headerIdx < 0) throw new Error('找不到標頭列（需含「姓名」與「電話」欄）。請使用「匯出 Excel」產生的格式。');
  const headers = aoa[headerIdx].map(c => String(c).trim());
  const colOf = name => headers.findIndex(h => h === name || h.startsWith(name));
  const idx = {};
  PERSONNEL_HEADERS.forEach(h => { idx[h] = colOf(h.replace(/\(.*\)$/, '')); });

  const rows = [];
  for (let r = headerIdx + 1; r < aoa.length; r++) {
    const line = aoa[r];
    const get = h => (idx[h] >= 0 ? line[idx[h]] : '');
    const name = String(get('姓名') ?? '').trim();
    const phone = normPhone(get('電話'));
    if (!name && !phone && !String(get('人員ID(系統用勿改)') ?? '').trim()) continue;   // 空列
    rows.push({
      line: r + 1,
      order: get('排序'),
      name, phone,
      email: String(get('Email') ?? '').trim(),
      positions: splitList(get('職位')),
      keepPct: get('保留款%'), taxPct: get('稅金%'), nhiPct: get('二代健保%'),
      teamGroupLabels: splitList(get('團獎分組')),
      inDate: normDate(get('進場時間')), outDate: normDate(get('結案時間')),
      remark: String(get('預設備註') ?? '').trim(),
      id: String(get('人員ID(系統用勿改)') ?? '').trim(),
    });
  }
  return rows;
}

// ================= 匯入：比對 =================
const sameArr = (a, b) => JSON.stringify([...(a || [])].sort()) === JSON.stringify([...(b || [])].sort());

/**
 * @returns {{ items: Array<{ status:'new'|'update'|'same'|'error', row, existing, payload, docId, changes:string[], errors:string[] }>, summary }}
 */
export function diffPersonnelRows(rows, existing, teamGroups = [], projectId = '') {
  const byId = {}; const byPhone = {};
  existing.forEach(p => { byId[p.id] = p; if (p.phone) byPhone[normPhone(p.phone)] = p; });
  const groupKeyOf = label => {
    const g = teamGroups.find(x => x.label === label || x.key === label);
    return g ? g.key : null;
  };
  const groupLabels = keys => (keys || []).map(k => teamGroups.find(g => g.key === k)?.label || k).join('、') || '（空）';
  const segName = seg => (seg.inDate ? `${seg.inDate} 起` : '（無進場日）');
  let maxOrder = existing.reduce((m, p) => Math.max(m, Number(p.order) || 0), 0);

  // 一人多列：以人員ID＞電話分組，第一列為基本資料，每列一段進退場
  const groups = [];
  const groupIndex = {};
  rows.forEach(row => {
    const key = row.id ? `id:${row.id}` : (row.phone ? `ph:${row.phone}` : `ln:${row.line}`);
    if (groupIndex[key] === undefined) { groupIndex[key] = groups.length; groups.push({ base: row, rows: [] }); }
    groups[groupIndex[key]].rows.push(row);
  });

  const items = groups.map(({ base: row, rows: lines }) => {
    const errors = [];
    if (!row.name) errors.push('缺姓名');
    if (!row.phone) errors.push('缺電話');
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) errors.push('Email 格式不正確');
    const orderNum = row.order === '' || row.order === null || row.order === undefined ? null : Number(row.order);
    if (orderNum !== null && !Number.isFinite(orderNum)) errors.push('排序非數字');

    // 每列 → 一段（該列無任何獎金設定值則不產生段落）
    const fileSegments = [];
    lines.forEach(ln => {
      const tag = lines.length > 1 ? `第 ${ln.line} 列：` : '';
      if (!isValidDate(ln.inDate)) errors.push(`${tag}進場時間格式須為 yyyy/mm/dd`);
      if (!isValidDate(ln.outDate)) errors.push(`${tag}結案時間格式須為 yyyy/mm/dd`);
      const pcts = { keepPct: pctNum(ln.keepPct), taxPct: pctNum(ln.taxPct), nhiPct: pctNum(ln.nhiPct) };
      Object.entries(pcts).forEach(([k, v]) => { if (Number.isNaN(v)) errors.push(`${tag}${k === 'keepPct' ? '保留款' : k === 'taxPct' ? '稅金' : '二代健保'}% 非數字`); });
      const teamGroupKeys = [];
      ln.teamGroupLabels.forEach(l => { const k = groupKeyOf(l); if (k) teamGroupKeys.push(k); else errors.push(`${tag}團獎分組「${l}」不存在`); });
      const seg = {
        keepPct: pcts.keepPct === '' ? 0 : pcts.keepPct,
        taxPct: pcts.taxPct === '' ? 0 : pcts.taxPct,
        nhiPct: pcts.nhiPct === '' ? 0 : pcts.nhiPct,
        teamGroupKeys, inDate: ln.inDate, outDate: ln.outDate, remark: ln.remark,
      };
      if (segmentHasValue(seg) || lines.length > 1) fileSegments.push(seg);
      if (lines.length > 1 && !ln.inDate) errors.push(`${tag}多段進退場時每列須填進場時間`);
    });

    const existingP = (row.id && byId[row.id]) || byPhone[row.phone] || null;
    if (row.id && !byId[row.id] && !byPhone[row.phone]) errors.push('人員ID 不存在於本案（將視為新增，請清空 ID 後重試）');

    // 段落合併：單列對單段 → 直接取代；否則以進場時間比對更新或新增，檔案沒列到的段落保留
    const existingSegs = bonusSegments(existingP?.bonusConfig);
    let merged;
    if (fileSegments.length <= 1 && existingSegs.length <= 1) {
      merged = fileSegments.length ? fileSegments : existingSegs;
    } else {
      merged = existingSegs.map(s => ({ ...s }));
      fileSegments.forEach(fs => {
        const idx = merged.findIndex(s => s.inDate === fs.inDate);
        if (idx >= 0) merged[idx] = fs; else merged.push(fs);
      });
    }
    if (!errors.length) { const segErr = validateSegments(merged); if (segErr) errors.push(`進退場段落：${segErr}`); }
    if (errors.length) return { status: 'error', row, existing: existingP, errors, changes: [], payload: null, docId: null };

    const positions = row.positions.length ? row.positions : (existingP?.positions || ['銷售']);
    const hasBonus = !!existingP?.bonusConfig || merged.some(segmentHasValue);
    const bonusConfig = hasBonus ? buildBonusConfig(merged) : null;

    const payload = { projectId, name: row.name, phone: row.phone, email: row.email, positions };
    if (bonusConfig) payload.bonusConfig = bonusConfig;

    if (!existingP) {
      maxOrder += 10;
      payload.order = orderNum !== null ? orderNum : maxOrder;
      return { status: 'new', row, existing: null, errors: [], changes: [], payload, docId: `${projectId}_${row.name}_${row.phone}` };
    }

    const changes = [];
    if (existingP.name !== row.name) changes.push(`姓名：${existingP.name}→${row.name}`);
    if (normPhone(existingP.phone) !== row.phone) changes.push(`電話：${existingP.phone}→${row.phone}`);
    if ((existingP.email || '') !== row.email) changes.push(`Email：${existingP.email || '（空）'}→${row.email || '（空）'}`);
    if (!sameArr(existingP.positions, positions)) changes.push(`職位：${(existingP.positions || []).join('、')}→${positions.join('、')}`);
    if (orderNum !== null && Number(existingP.order) !== orderNum) { payload.order = orderNum; changes.push(`排序：${existingP.order ?? '（空）'}→${orderNum}`); }
    if (bonusConfig) {
      const cmp = [['keepPct', '保留款%'], ['taxPct', '稅金%'], ['nhiPct', '二代健保%'], ['inDate', '進場時間'], ['outDate', '結案時間'], ['remark', '預設備註']];
      const multi = bonusConfig.segments.length > 1 || existingSegs.length > 1;
      bonusConfig.segments.forEach(seg => {
        const prefix = multi ? `${segName(seg)}：` : '';
        const old = existingSegs.find(s => (multi ? s.inDate === seg.inDate : true));
        if (!old) { changes.push(`新增段落 ${segName(seg)}（保留款 ${seg.keepPct}%／稅金 ${seg.taxPct}%／二代健保 ${seg.nhiPct}%）`); return; }
        cmp.forEach(([k, lab]) => {
          if (String(old[k]) !== String(seg[k])) changes.push(`${prefix}${lab}：${old[k] === '' ? '（空）' : old[k]}→${seg[k] === '' ? '（空）' : seg[k]}`);
        });
        if (!sameArr(old.teamGroupKeys, seg.teamGroupKeys)) changes.push(`${prefix}團獎分組：${groupLabels(old.teamGroupKeys)}→${groupLabels(seg.teamGroupKeys)}`);
      });
      if (!existingP.bonusConfig && !changes.some(c => c.startsWith('新增段落'))) changes.push('新增請佣獎金設定');
    }
    return {
      status: changes.length ? 'update' : 'same',
      row, existing: existingP, errors: [], changes, payload, docId: existingP.id,
    };
  });

  const summary = { new: 0, update: 0, same: 0, error: 0 };
  items.forEach(i => { summary[i.status]++; });
  return { items, summary };
}
