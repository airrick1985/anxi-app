/**
 * 請佣獎金 匯出模型（docs/請佣獎金系統-spec.md §7）
 * 前端預覽（HTML）、Excel（xlsx-js-style）、後端 PDF（pdfkit）三端共用同一 model，
 * 確保呈現一致。格式重現舊 GAS writeCommissionSheet_ / writeBonusSheet_。
 */

import {
  toNum, money, toMinguo, toMinguoYM, fillPattern,
} from '@/utils/commissionCalculation';

// ================= 請佣總表 欄位登錄表 =================
// 欄位擴充點：在此新增一筆（含 get），所有版型即可勾用。
export const CLAIM_COLUMNS = [
  { key: 'no',         title: '編號',            width: 52,  align: 'center', get: (r, i) => i + 1 },
  { key: 'signDate',   title: '簽約日期',        width: 66,  align: 'center', get: r => toMinguo(r.snapshot?.contractDate) },
  { key: 'unit',       title: '戶別',            width: 64,  align: 'center', get: r => `${r.unitId}` },
  { key: 'parking',    title: '停車位',          width: 110, align: 'center', get: r => r.snapshot?.parkingSpots || '' },
  { key: 'buyerName',  title: '姓名',            width: 96,  align: 'center', get: r => r.snapshot?.buyerName || '' },
  { key: 'houseFloor', title: '房價', group: '底價(萬)',   width: 66, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.houseFloor) },
  { key: 'parkFloor',  title: '車價', group: '底價(萬)',   width: 58, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.parkFloor) },
  { key: 'houseDeal',  title: '房價', group: '成交價(萬)', width: 66, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.houseDeal) },
  { key: 'parkDeal',   title: '車價', group: '成交價(萬)', width: 58, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.parkDeal) },
  { key: 'totalFloor', title: '總底價(萬)',      width: 70, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.totalFloor) },
  { key: 'totalDeal',  title: '總成交價(萬)',    width: 70, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.dealTotal) },
  { key: 'spread',     title: '溢差價(萬)',      width: 60, numFmt: '#,##0', sum: true, get: r => toNum(r.snapshot?.spread) },
  { key: 'feeWan',     title: '介紹費(萬)',      width: 68, numFmt: '0.0',   sum: true, get: r => toNum(r.calc?.feeWan) },
  { key: 'realSpread', title: '實際溢差價(萬)',  width: 70, numFmt: '0.0',   sum: true, get: r => toNum(r.calc?.realSpread) },
  { key: 'commPct',    title: '佣金比例(%)',     width: 120, align: 'center', get: r => `${toNum(r.commPct).toFixed(1)}%` },
  { key: 'realClaim',  title: '實際請領金額(元)', width: 100, numFmt: '#,##0', sum: true, get: r => toNum(r.calc?.realClaim) },
  { key: 'keep',       title: '保留款',          width: 100, numFmt: '#,##0', sum: true, get: (r, i, ctx) => Math.round(toNum(r.calc?.realClaim) * ctx.keepPct / 100), headerSub: ctx => `${ctx.keepPct}%` },
  { key: 'thisClaim',  title: '本次請佣(元)',    width: 100, numFmt: '#,##0', sum: true, get: (r, i, ctx) => toNum(r.calc?.realClaim) - Math.round(toNum(r.calc?.realClaim) * ctx.keepPct / 100) },
  { key: 'baseWan',    title: '備註(萬)',        width: 66, numFmt: '#,##0', sum: true, get: r => toNum(r.calc?.baseWan) },
  { key: 'wanLabel',   title: '',                width: 56, align: 'center', get: () => '萬請款' },
  { key: 'youfuTag',   title: '',                width: 70, align: 'center', red: true, get: (r, i, ctx) => (r.snapshot?.isPreferredPayment ? ctx.youfuTag : '') },
];

/** 預設請佣總表版型 config */
export function defaultClaimConfig(settings) {
  return {
    columns: CLAIM_COLUMNS.map(c => ({ key: c.key, label: c.title, visible: true, width: c.width })),
    style: {
      fontFamily: 'DFKai-SB',
      titleFontSize: 22, headerFontSize: 14, dataFontSize: 14,
      headerBg: '#ffffff', totalRowBg: '#ffffff', summaryColor: '#DD0806', borders: true,
    },
    titlePattern: settings?.claimTitlePattern || '{建案名}－業務服務佣金第{期別中文}次請款',
    notes: [settings?.note1 || '', settings?.note2 || ''],
    keepPct: toNum(settings?.defaultKeepPct ?? 10),
    cashPct: toNum(settings?.defaultCashPct ?? 50),
    showSummaryBlock: true,
    fileNamePattern: settings?.claimFileNamePattern || '{簡稱}NO.{期別}請款-{民國年月}',
    youfuTag: '5%優付',
    paper: 'A4', orientation: 'landscape',
  };
}

/** 預設獎金表版型 config */
export function defaultBonusConfig(settings) {
  return {
    style: {
      fontFamily: 'DFKai-SB',
      titleFontSize: 20, headerFontSize: 12, dataFontSize: 12,
      headerBg: '#c4bd97', totalRowBg: '#ffff00', summaryColor: '#DD0806', borders: true,
    },
    kiloLabel: settings?.kiloLabel || '千4',
    youfuLabelPattern: settings?.youfuLabelPattern || '優付方案請款{pct}%',
    fileNamePattern: settings?.bonusFileNamePattern || '{簡稱}NO.{期別}獎金-{民國年月}',
    showSourceProjectTag: true,
    showSharePct: false,
    includeClaimSheet: true,     // 獎金總表 Excel 一併含請佣總表分頁
    paper: 'A3', orientation: 'landscape',
  };
}

// ================= 請佣總表 model =================
/**
 * @param {Array} records - 該期有效 commissionRecords
 * @param {object} opts - { settings, config, period, projectName }
 */
export function buildClaimModel(records, opts) {
  const { settings = {}, config = {}, period, projectName = '' } = opts;
  const cfg = { ...defaultClaimConfig(settings), ...config };
  const keepPct = toNum(cfg.keepPct);
  const ctx = { keepPct, youfuTag: cfg.youfuTag || '5%優付' };

  const regByKey = {};
  CLAIM_COLUMNS.forEach(c => { regByKey[c.key] = c; });

  // 解析版型欄位（順序＋顯示名＋寬度）
  const columns = (cfg.columns || [])
    .filter(c => c.visible !== false && regByKey[c.key])
    .map(c => {
      const reg = regByKey[c.key];
      return {
        key: c.key,
        label: c.label !== undefined && c.label !== '' ? c.label : reg.title,
        group: reg.group || '',
        width: toNum(c.width) || reg.width,
        numFmt: reg.numFmt || '',
        align: reg.align || 'right',
        sum: !!reg.sum,
        red: !!reg.red,
        headerSub: reg.headerSub ? reg.headerSub(ctx) : '',
      };
    });

  const sorted = records.slice().sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
  const rows = sorted.map((r, i) => {
    const cells = {};
    CLAIM_COLUMNS.forEach(col => { cells[col.key] = col.get(r, i, ctx); });
    return { cells, youfu: !!r.snapshot?.isPreferredPayment };
  });

  const totals = {};
  columns.filter(c => c.sum).forEach(c => {
    totals[c.key] = rows.reduce((s, r) => s + toNum(r.cells[c.key]), 0);
  });

  const baseSum = rows.reduce((s, r) => s + toNum(r.cells.baseWan), 0);
  const thisClaimSum = rows.reduce((s, r) => s + toNum(r.cells.thisClaim), 0);
  const cash = Math.round(thisClaimSum * toNum(cfg.cashPct) / 100);

  const minguoYM = firstMinguoYM(sorted);
  const title = fillPattern(cfg.titlePattern, {
    projectName, shortName: settings.projectShortName || '', period, minguoYM,
  });
  const fileName = fillPattern(cfg.fileNamePattern, {
    projectName, shortName: settings.projectShortName || '', period,
    minguoYM: minguoYM.replace('/', '.'),
  });

  return {
    docType: 'claim',
    title, fileName, period,
    style: cfg.style,
    keepPct, cashPct: toNum(cfg.cashPct),
    columns, rows, totals,
    notes: (cfg.notes || []).filter(n => String(n || '').trim() !== ''),
    showSummaryBlock: cfg.showSummaryBlock !== false,
    summary: { baseSum, thisClaimSum, cash, bill: thisClaimSum - cash },
    paper: cfg.paper || 'A4',
    orientation: cfg.orientation || 'landscape',
  };
}

// ================= 獎金表 model =================
function ratioKey(ratioPct) {
  return String(Math.round(toNum(ratioPct) * 10) / 10);
}

function firstMinguoYM(records) {
  for (const r of records) {
    const ym = toMinguoYM(r.requestDate);
    if (ym) return ym;
  }
  return '';
}

function isMgmtRole(role) {
  const s = String(role || '');
  if (s.includes('主委')) return '主委';
  if (s.includes('副總')) return '副總';
  if (s.includes('輔導')) return '輔導';
  return null;
}

/** 類別歸位：indiv（個獎欄）/ team（團獎欄）/ 其他右側列 / 管理左側 */
export function classifyCategories(settings) {
  const cats = (settings.bonusCategories || []).filter(c => c.enabled !== false);
  const mgmtRoles = ['主委', '副總', '輔導'];
  const indiv = [], team = [], mgmt = [], others = [];
  cats.forEach(c => {
    if (c.mode === 'individual') indiv.push(c);
    else if (c.mode === 'team' || String(c.label).includes('團獎')) team.push(c);
    else if ((c.rolePositions || []).some(r => mgmtRoles.some(m => String(r).includes(m)))) mgmt.push(c);
    else others.push(c);
  });
  return { indiv, team, mgmt, others };
}

/**
 * 獎金表 model：依請佣比例分組，每組一張。
 * 金額規則（同舊系統）：非 100% 組以 amountsFull（100% 重算）呈現，
 * 「優付方案請款」列與扣款列以實際金額（amounts / keep / tax / nhi / net）。
 * @param {object} opts - { records, bonusRecords, settings, config, period, projectName, personnelOrder }
 */
export function buildBonusModel(opts) {
  const {
    records = [], bonusRecords = [], settings = {}, config = {},
    period, projectName = '', projectId = '', personnelOrder = [],
  } = opts;
  const cfg = { ...defaultBonusConfig(settings), ...config };
  const cls = classifyCategories(settings);
  const indivKeys = cls.indiv.map(c => c.key);
  const teamKeys = cls.team.map(c => c.key);

  const orderIdx = {};
  personnelOrder.forEach((n, i) => { orderIdx[n] = i; });
  const ord = n => (orderIdx[n] !== undefined ? orderIdx[n] : 9999);

  const minguoYM = firstMinguoYM(records);
  const saleYM = minguoYM;

  // 分組
  const groups = {};
  records.forEach(r => {
    const key = ratioKey(r.ratioPct);
    if (!groups[key]) groups[key] = { records: [], bonusRows: [] };
    groups[key].records.push(r);
  });
  bonusRecords.forEach(b => {
    const rec = records.find(r => r.id === b.commissionRecordId);
    if (!rec) return;
    groups[ratioKey(rec.ratioPct)].bonusRows.push(b);
  });

  const sumCats = (obj, keys) => keys.reduce((s, k) => s + toNum(obj?.[k]), 0);
  const sumAll = obj => Object.values(obj || {}).reduce((s, v) => s + toNum(v), 0);

  const modelGroups = Object.keys(groups)
    .sort((a, b) => Number(b) - Number(a))
    .map(pctKey => {
      const g = groups[pctKey];
      const isYoufu = pctKey !== '100';
      const youfuLabel = fillPattern(cfg.youfuLabelPattern, { pct: pctKey });

      // ---- 每人彙總 ----
      const agg = {};
      g.bonusRows.forEach(b => {
        if (!agg[b.personKey]) {
          agg[b.personKey] = {
            personKey: b.personKey, name: b.name, role: b.role || '',
            sourceProjectId: b.sourceProjectId || '', sourceProjectName: b.sourceProjectName || '',
            indiv: 0, team: 0, byCat: {}, sub: 0,
            subDisc: 0, keepDisc: 0, taxDisc: 0, nhiDisc: 0,
            remark: b.remark || '',
          };
        }
        const a = agg[b.personKey];
        const full = b.amountsFull || b.amounts || {};
        a.indiv += sumCats(full, indivKeys);
        a.team += sumCats(full, teamKeys);
        Object.keys(full).forEach(k => { a.byCat[k] = (a.byCat[k] || 0) + toNum(full[k]); });
        a.sub += sumAll(full);
        a.subDisc += toNum(b.subtotal);
        a.keepDisc += toNum(b.keep);
        a.taxDisc += toNum(b.tax);
        a.nhiDisc += toNum(b.nhi);
        if (!a.remark) a.remark = b.remark || '';
      });
      // 100% 的保留/稅/健保：以實際有效比例回推
      Object.values(agg).forEach(a => {
        const kr = a.subDisc ? a.keepDisc / a.subDisc : 0;
        const tr = a.subDisc ? a.taxDisc / a.subDisc : 0;
        const nr = a.subDisc ? a.nhiDisc / a.subDisc : 0;
        a.keep = Math.round(a.sub * kr);
        a.tax = Math.round(a.sub * tr);
        a.nhi = Math.round(a.sub * nr);
        a.net = a.sub - a.keep - a.tax - a.nhi;
        a.netDisc = a.subDisc - a.keepDisc - a.taxDisc - a.nhiDisc;
      });

      const left = [], right = [];
      Object.values(agg).forEach(a => {
        const cat = isMgmtRole(a.role);
        if (cat) { a.mgmtCat = cat; left.push(a); }
        else if (a.sub !== 0) right.push(a);
      });
      const catOrder = { 主委: 0, 副總: 1, 輔導: 2 };
      left.sort((x, y) => (catOrder[x.mgmtCat] - catOrder[y.mgmtCat]) || (ord(x.name) - ord(y.name)));
      right.sort((x, y) => ord(x.name) - ord(y.name));
      const topPersons = right.map(a => ({ personKey: a.personKey, name: a.name, sourceProjectName: a.sourceProjectName, sourceProjectId: a.sourceProjectId }));

      // ---- 每戶列 + 每戶每人 個獎/團獎（100%） ----
      const perUnitPerson = {};   // unitId -> personKey -> {indiv, team}
      g.bonusRows.forEach(b => {
        const full = b.amountsFull || b.amounts || {};
        if (!perUnitPerson[b.unitId]) perUnitPerson[b.unitId] = {};
        if (!perUnitPerson[b.unitId][b.personKey]) perUnitPerson[b.unitId][b.personKey] = { indiv: 0, team: 0 };
        perUnitPerson[b.unitId][b.personKey].indiv += sumCats(full, indivKeys);
        perUnitPerson[b.unitId][b.personKey].team += sumCats(full, teamKeys);
      });

      const sortedRecords = g.records.slice().sort((a, b) => String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
      const unitRows = sortedRecords.map((r, i) => {
        const pp = {};
        topPersons.forEach(p => {
          const v = perUnitPerson[r.unitId]?.[p.personKey] || { indiv: 0, team: 0 };
          pp[p.personKey] = { indiv: Math.round(v.indiv), team: Math.round(v.team) };
        });
        // 團獎人數：team 類別分配人數
        let teamCount = 0;
        teamKeys.forEach(k => {
          const allocs = r.categories?.[k]?.allocations || [];
          teamCount = Math.max(teamCount, allocs.length);
        });
        return {
          no: i + 1,
          sodate: toMinguo(r.snapshot?.depositDate),
          sign: toMinguo(r.snapshot?.contractDate),
          unit: `${r.unitId}`,
          park: r.snapshot?.parkingSpots || '',
          name: r.snapshot?.buyerName || '',
          house: toNum(r.snapshot?.houseDeal),
          parkP: toNum(r.snapshot?.parkDeal),
          total: toNum(r.snapshot?.dealTotal),
          referral: toNum(r.partyAFee),
          disc: toNum(r.calc?.discount),
          after: toNum(r.calc?.dealAfter),
          sales: Array.isArray(r.snapshot?.salesperson) ? r.snapshot.salesperson.join('、') : String(r.snapshot?.salesperson || ''),
          team: teamCount,
          pp,
        };
      });

      const topTotal = { total: 0, after: 0, referral: 0, pp: {} };
      topPersons.forEach(p => { topTotal.pp[p.personKey] = { indiv: 0, team: 0 }; });
      unitRows.forEach(row => {
        topTotal.total += row.total; topTotal.after += row.after; topTotal.referral += row.referral;
        topPersons.forEach(p => {
          topTotal.pp[p.personKey].indiv += row.pp[p.personKey].indiv;
          topTotal.pp[p.personKey].team += row.pp[p.personKey].team;
        });
      });

      // ---- 右側列定義（個獎/團獎/其他類別/合計/優付/扣款） ----
      const rateOf = keys => keys.reduce((s, k) => {
        const cat = (settings.bonusCategories || []).find(c => c.key === k);
        return s + toNum(cat?.ratePct);
      }, 0);
      const rightRows = [];
      rightRows.push({ key: '_indiv', label: cls.indiv[0]?.label || '銷售個獎', ratePct: rateOf(indivKeys), get: a => Math.round(a.indiv) });
      rightRows.push({ key: '_team', label: '銷售團獎', ratePct: rateOf(teamKeys), get: a => Math.round(a.team) });
      cls.others.forEach(c => {
        rightRows.push({ key: c.key, label: c.label, ratePct: toNum(c.ratePct), get: a => Math.round(toNum(a.byCat[c.key])) });
      });

      // ---- 合計 ----
      let grandNet = 0, grandTax = 0, grandNhi = 0;
      left.concat(right).forEach(a => {
        grandNet += isYoufu ? a.netDisc : a.net;
        grandTax += isYoufu ? a.taxDisc : a.tax;
        grandNhi += isYoufu ? a.nhiDisc : a.nhi;
      });

      // 千4 標籤列：個獎/團獎比例 ×10000
      const indivX = Math.round(rateOf(indivKeys) / 100 * 10000 * 100) / 100;
      const teamX = Math.round(rateOf(teamKeys) / 100 * 10000 * 100) / 100;

      return {
        pctKey, isYoufu, youfuLabel,
        sheetName: `業務獎金-${pctKey}%`,
        title: `${projectName}－業務獎金　第 ${period} 期　請佣比例 ${pctKey}%`,
        kiloLabel: cfg.kiloLabel, indivX, teamX,
        saleYM,
        topPersons, unitRows, topTotal,
        left, right, rightRows,
        mgmtCats: cls.mgmt,
        grand: { net: grandNet, tax: grandTax, nhi: grandNhi, total: grandNet + grandTax + grandNhi },
      };
    });

  const fileName = fillPattern(cfg.fileNamePattern, {
    projectName, shortName: settings.projectShortName || '', period,
    minguoYM: minguoYM.replace('/', '.'),
  });

  return {
    docType: 'bonus',
    period, fileName, projectId,
    style: cfg.style,
    partyALabel: settings.partyALabel || '一研九鼎負擔介紹費',
    showSourceProjectTag: cfg.showSourceProjectTag !== false,
    includeClaimSheet: cfg.includeClaimSheet !== false,
    groups: modelGroups,
    paper: cfg.paper || 'A3',
    orientation: cfg.orientation || 'landscape',
  };
}

export { money };
