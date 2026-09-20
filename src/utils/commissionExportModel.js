/**
 * 請佣獎金 匯出模型（docs/請佣獎金系統-spec.md §7）
 * 前端預覽（HTML）、Excel（xlsx-js-style）、後端 PDF（pdfkit）三端共用同一 model，
 * 確保呈現一致。格式重現舊 GAS writeCommissionSheet_ / writeBonusSheet_。
 */

import {
  toNum, money, toMinguo, toMinguoYM, fillPattern, formatDateTW,
} from '@/utils/commissionCalculation';

// ================= 檔名：統一加上建案名 =================
/**
 * 下載檔名一律以建案名開頭（{建案名}_原檔名）；若檔名已含建案名則不重複加。
 * 同時移除檔名中不合法的字元（/ \ : * ? " < > |）。
 */
export function withProjectName(fileName, projectName) {
  const clean = v => String(v || '').replace(/[\/\\:*?"<>|]/g, ' ').replace(/\s+/g, ' ').trim();
  const name = clean(fileName);
  const pn = clean(projectName);
  if (!pn) return name;
  if (name.includes(pn)) return name;
  return name ? `${pn}_${name}` : pn;
}

/** 匯出／預覽用建案名：一般方案用建案名；其他方案加上方案名 */
export function exportProjectNameOf(projectName, plan) {
  return !plan || plan.id === 'general' ? String(projectName || '') : `${projectName}・${plan.name}`;
}

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
  // 退佣紀錄（type: 'refund'）：保留款／本次請佣以紀錄存值為準（保留款抵銷、退回金額依「含／不含保留款」決定），不依版型保留款％重算
  { key: 'keep',       title: '保留款',          width: 100, numFmt: '#,##0', sum: true, get: (r, i, ctx) => (isRefundRecord(r) ? toNum(r.calc?.claimKeep) : Math.round(toNum(r.calc?.realClaim) * ctx.keepPct / 100)), headerSub: ctx => `${ctx.keepPct}%` },
  { key: 'thisClaim',  title: '本次請佣(元)',    width: 100, numFmt: '#,##0', sum: true, get: (r, i, ctx) => (isRefundRecord(r) ? toNum(r.calc?.thisClaim) : toNum(r.calc?.realClaim) - Math.round(toNum(r.calc?.realClaim) * ctx.keepPct / 100)) },
  { key: 'baseWan',    title: '備註(萬)',        width: 66, numFmt: '#,##0', sum: true, get: r => toNum(r.calc?.baseWan) },
  { key: 'wanLabel',   title: '',                width: 56, align: 'center', get: () => '萬請款' },
  { key: 'youfuTag',   title: '',                width: 70, align: 'center', red: true, get: (r, i, ctx) => (isRefundRecord(r) ? '退佣' : (r.snapshot?.isPreferredPayment ? ctx.youfuTag : '')) },
  // 請佣備註：工作台／匯入填寫（非銷控備註）
  { key: 'note',       title: '備註',            width: 110, align: 'left', get: r => String(r.note || '') },
];

/** 既有版型缺少的登錄欄位補到最後（預設顯示），讓新欄位不需重建版型即可使用。 */
export function withRegistryColumns(columns) {
  const list = Array.isArray(columns) ? columns.slice() : [];
  const has = new Set(list.map(c => c?.key));
  CLAIM_COLUMNS.forEach(c => { if (!has.has(c.key)) list.push({ key: c.key, label: c.title, visible: true, width: c.width }); });
  return list;
}

/** 退佣紀錄（買方解約；金額為負值，匯出以負數列呈現、合計相減） */
export function isRefundRecord(r) {
  return !!r && r.type === 'refund';
}

/** 預設請佣總表版型 config */
export function defaultClaimConfig(settings) {
  return {
    columns: CLAIM_COLUMNS.map(c => ({
      key: c.key,
      label: settings?.priceBasis === 'package' ? ({ houseFloor: '配套底價', houseDeal: '配套價格', totalFloor: '配套底價(萬)', totalDeal: '配套價格(萬)' }[c.key] || c.title) : c.title,
      visible: settings?.priceBasis !== 'package' || !['parking', 'parkFloor', 'parkDeal'].includes(c.key),
      width: c.width,
    })),
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
  const columns = withRegistryColumns(cfg.columns)
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
    return { cells, youfu: !!r.snapshot?.isPreferredPayment, refund: isRefundRecord(r) };
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
  const fileName = withProjectName(fillPattern(cfg.fileNamePattern, {
    projectName, shortName: settings.projectShortName || '', period,
    minguoYM: minguoYM.replace('/', '.'),
  }), projectName);

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

/** 類別歸位：indiv（個獎欄）/ team（團獎欄）/ 其他右側列 / 管理左側 / handover（提撥類別，上段獨立欄、不計入任何人） */
export function classifyCategories(settings) {
  const cats = (settings.bonusCategories || []).filter(c => c.enabled !== false);
  const mgmtRoles = ['主委', '副總', '輔導'];
  const indiv = [], team = [], mgmt = [], others = [], handover = [];
  cats.forEach(c => {
    if (c.mode === 'handover') handover.push(c);
    else if (c.mode === 'individual') indiv.push(c);
    else if (c.mode === 'team' || String(c.label).includes('團獎')) team.push(c);
    else if ((c.rolePositions || []).some(r => mgmtRoles.some(m => String(r).includes(m)))) mgmt.push(c);
    else others.push(c);
  });
  return { indiv, team, mgmt, others, handover };
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

  // 交屋團獎（自個獎提撥、本期不發放）：設定有啟用提撥類別，或紀錄快照含金額時，上段多一欄
  const handoverRecordAmt = r => toNum(r.handover?.totalFull !== undefined ? r.handover.totalFull : r.handover?.total);
  const hasHandover = cls.handover.length > 0 || records.some(r => handoverRecordAmt(r) !== 0);
  const handoverLabel = cls.handover[0]?.label || '交屋團獎';
  const handoverRate = cls.handover.reduce((s, c) => s + toNum(c.ratePct), 0);
  const handoverX = handoverRate ? `${cls.indiv[0]?.label || '個獎'}×${handoverRate}%` : '';

  const orderIdx = {};
  personnelOrder.forEach((n, i) => { orderIdx[n] = i; });
  const ord = n => (orderIdx[n] !== undefined ? orderIdx[n] : 9999);

  const minguoYM = firstMinguoYM(records);
  const saleYM = minguoYM;

  // 分組（退佣紀錄 ratioPct 為負：依退回比例合計歸組，金額以實際負值呈現）
  const groups = {};
  records.forEach(r => {
    const key = ratioKey(Math.abs(toNum(r.ratioPct)));
    if (!groups[key]) groups[key] = { records: [], bonusRows: [] };
    groups[key].records.push(r);
  });
  bonusRecords.forEach(b => {
    const rec = records.find(r => r.id === b.commissionRecordId);
    if (!rec) return;
    groups[ratioKey(Math.abs(toNum(rec.ratioPct)))].bonusRows.push(b);
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
        const refund = isRefundRecord(r);
        return {
          no: i + 1,
          refund,
          sodate: toMinguo(r.snapshot?.depositDate),
          sign: toMinguo(r.snapshot?.contractDate),
          unit: `${r.unitId}`,
          park: r.snapshot?.parkingSpots || '',
          name: refund ? `${r.snapshot?.buyerName || ''}(退佣)` : (r.snapshot?.buyerName || ''),
          house: toNum(r.snapshot?.houseDeal),
          parkP: toNum(r.snapshot?.parkDeal),
          packageFloor: toNum(r.snapshot?.houseFloor),
          total: toNum(r.snapshot?.dealTotal),
          referral: toNum(r.partyAFee),
          disc: toNum(r.calc?.discount),
          after: toNum(r.calc?.dealAfter),
          sales: Array.isArray(r.snapshot?.salesperson) ? r.snapshot.salesperson.join('、') : String(r.snapshot?.salesperson || ''),
          team: teamCount,
          handover: Math.round(handoverRecordAmt(r)),   // 交屋團獎暫留（100% 重算，與個獎欄一致）
          pp,
        };
      });

      const topTotal = { total: 0, after: 0, referral: 0, handover: 0, pp: {} };
      topPersons.forEach(p => { topTotal.pp[p.personKey] = { indiv: 0, team: 0 }; });
      unitRows.forEach(row => {
        topTotal.total += row.total; topTotal.after += row.after; topTotal.referral += row.referral;
        topTotal.handover += row.handover;
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
        hasHandover, handoverLabel, handoverX,
        saleYM,
        topPersons, unitRows, topTotal,
        left, right, rightRows,
        mgmtCats: cls.mgmt,
        grand: { net: grandNet, tax: grandTax, nhi: grandNhi, total: grandNet + grandTax + grandNhi },
      };
    });

  const fileName = withProjectName(fillPattern(cfg.fileNamePattern, {
    projectName, shortName: settings.projectShortName || '', period,
    minguoYM: minguoYM.replace('/', '.'),
  }), projectName);

  return {
    docType: 'bonus',
    priceBasis: settings.priceBasis || 'house',
    period, fileName, projectId,
    style: cfg.style,
    partyALabel: settings.partyALabel || '一研九鼎負擔介紹費',
    showSourceProjectTag: cfg.showSourceProjectTag !== false,
    includeClaimSheet: cfg.includeClaimSheet !== false,
    hasHandover, handoverLabel,
    groups: modelGroups,
    paper: cfg.paper || 'A3',
    orientation: cfg.orientation || 'landscape',
  };
}

// ================= 個人獎金明細 model =================
/** 預設個人明細版型 config */
export function defaultPersonConfig(settings) {
  return {
    style: {
      fontFamily: 'DFKai-SB',
      titleFontSize: 18, headerFontSize: 11, dataFontSize: 11,
      headerBg: '#e7e6e6', totalRowBg: '#fff2cc', summaryColor: '#DD0806', borders: true,
    },
    showBuyerName: true,
    showDealTotal: true,
    fileNamePattern: settings?.personFileNamePattern || '{建案名}NO.{期別}獎金明細-{姓名}',
    paper: 'A4',
    orientation: 'landscape',
  };
}

/** 期別陣列 → 顯示文字（1、2、3）與檔名文字（1-3 或 1.3） */
export function periodsLabel(periods, forFile = false) {
  const list = [...new Set((periods || []).map(toNum))].sort((a, b) => a - b);
  if (!list.length) return '';
  if (list.length === 1) return String(list[0]);
  const consecutive = list.every((p, i) => i === 0 || p === list[i - 1] + 1);
  if (forFile) return consecutive ? `${list[0]}-${list[list.length - 1]}` : list.join('.');
  return list.join('、');
}

/** 該期別範圍內有獎金紀錄的人員清單（供選擇器） */
export function listPersonsInPeriods(bonusRecords, periods, personnelOrder = []) {
  const set = new Set((periods || []).map(toNum));
  const orderIdx = {};
  personnelOrder.forEach((n, i) => { orderIdx[n] = i; });
  const map = {};
  (bonusRecords || []).forEach(b => {
    if (b.status === 'voided' || !set.has(toNum(b.period))) return;
    const key = b.personKey || b.name;
    if (!map[key]) {
      map[key] = { personKey: key, name: b.name, role: b.role || '', sourceProjectId: b.sourceProjectId || '', sourceProjectName: b.sourceProjectName || '', count: 0, net: 0 };
    }
    map[key].count++;
    map[key].net += toNum(b.net);
    if (b.role && !map[key].role) map[key].role = b.role;
  });
  const ord = n => (orderIdx[n] !== undefined ? orderIdx[n] : 9999);
  return Object.values(map).sort((a, b) => (ord(a.name) - ord(b.name)) || String(a.name).localeCompare(String(b.name), 'zh-Hant'));
}

/**
 * 個人獎金明細 model：指定人員 × 指定期別（可多期），僅含該人自己的金額。
 * @param {object} opts - { records, bonusRecords, payouts, personnel, settings, config, periods, personKey, projectName, projectId }
 */
export function buildPersonModel(opts) {
  const {
    records = [], bonusRecords = [], payouts = [], personnel = [],
    settings = {}, config = {}, periods = [], personKey, projectName = '', projectId = '',
  } = opts;
  const cfg = { ...defaultPersonConfig(settings), ...config };
  const periodSet = new Set((periods || []).map(toNum));

  const recById = {};
  records.forEach(r => { recById[r.id] = r; });

  const personAll = bonusRecords.filter(b => b.status !== 'voided' && (b.personKey || b.name) === personKey);
  const personRows = personAll.filter(b => periodSet.has(toNum(b.period)));

  // 類別：依建案設定順序，另補歷史紀錄中存在但設定已停用/移除的 key；僅保留該人有金額的類別
  const catDefs = (settings.bonusCategories || []).slice().sort((a, b) => toNum(a.order) - toNum(b.order));
  const catMap = {};
  catDefs.forEach(c => { catMap[c.key] = { key: c.key, label: c.label || c.key, ratePct: toNum(c.ratePct), sum: 0 }; });
  personRows.forEach(b => {
    Object.keys(b.amounts || {}).forEach(k => {
      if (!catMap[k]) catMap[k] = { key: k, label: k, ratePct: 0, sum: 0 };
      catMap[k].sum += toNum(b.amounts[k]);
    });
  });
  const categories = Object.values(catMap).filter(c => c.sum !== 0);

  const sorted = personRows.slice().sort((a, b) =>
    (toNum(a.period) - toNum(b.period))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));

  const staffEarly = personnel.find(p => p.phone === personKey) || null;
  const personNames = new Set(
    [...personRows.map(b => b.name), staffEarly?.name].map(n => String(n || '').trim()).filter(Boolean)
  );
  const normSales = v => (Array.isArray(v) ? v : String(v || '').split(/[、,，/\s]+/)).map(x => String(x).trim()).filter(Boolean);

  const rows = sorted.map(b => {
    const rec = recById[b.commissionRecordId] || records.find(r => r.projectId === b.projectId && r.unitId === b.unitId && toNum(r.period) === toNum(b.period)) || {};
    const snap = rec.snapshot || {};
    const amounts = {};
    categories.forEach(c => { amounts[c.key] = Math.round(toNum(b.amounts?.[c.key])); });
    const isOwnSale = normSales(snap.salesperson).some(n => personNames.has(n));
    const refund = isRefundRecord(rec) || b.type === 'refund';
    return {
      isOwnSale,
      refund,
      period: toNum(b.period),
      requestDate: toMinguo(b.requestDate || rec.requestDate),
      unit: `${b.unitId || rec.unitId || ''}`,
      contractDate: toMinguo(snap.contractDate),
      buyerName: snap.buyerName || '',
      dealTotal: toNum(snap.dealTotal),
      ratioPct: toNum(rec.ratioPct),
      amounts,
      subtotal: toNum(b.subtotal),
      keepPct: toNum(b.keepPct), keep: toNum(b.keep),
      taxPct: toNum(b.taxPct), tax: toNum(b.tax),
      nhiPct: toNum(b.nhiPct), nhi: toNum(b.nhi),
      net: toNum(b.net),
      remark: refund ? ['退佣', b.remark || ''].filter(Boolean).join('：') : (b.remark || ''),
    };
  });

  const sumKeys = ['subtotal', 'keep', 'tax', 'nhi', 'net', 'dealTotal'];
  const sumRows = list => {
    const t = { amounts: {} };
    sumKeys.forEach(k => { t[k] = list.reduce((s, r) => s + toNum(r[k]), 0); });
    categories.forEach(c => { t.amounts[c.key] = list.reduce((s, r) => s + toNum(r.amounts[c.key]), 0); });
    return t;
  };
  const totals = sumRows(rows);

  // 每戶明細預設只列「本人為該戶銷售人員」的戶別；其餘（專案／主委／團獎等）彙整為一列，不揭露戶別資訊。
  // 建案設定 personDetailShowAllRoles：職務含關鍵字者改為顯示全部戶別。
  const latestRole = String((sorted[sorted.length - 1] || personAll[personAll.length - 1] || {}).role || staffEarly?.positions?.join('、') || '');
  const showAllUnits = (settings.personDetailShowAllRoles || [])
    .map(k => String(k || '').trim()).filter(Boolean)
    .some(k => latestRole.includes(k));
  const detailRows = showAllUnits ? rows : rows.filter(r => r.isOwnSale);
  const otherRows = showAllUnits ? [] : rows.filter(r => !r.isOwnSale);
  const otherAggregate = otherRows.length ? { count: otherRows.length, ...sumRows(otherRows) } : null;

  // 期別彙總
  const byPeriod = {};
  rows.forEach(r => {
    if (!byPeriod[r.period]) byPeriod[r.period] = { period: r.period, requestDate: r.requestDate, count: 0, subtotal: 0, keep: 0, tax: 0, nhi: 0, net: 0 };
    const p = byPeriod[r.period];
    p.count++;
    p.subtotal += r.subtotal; p.keep += r.keep; p.tax += r.tax; p.nhi += r.nhi; p.net += r.net;
    if (!p.requestDate) p.requestDate = r.requestDate;
  });
  const periodSummaries = Object.values(byPeriod).sort((a, b) => a.period - b.period);

  // 保留款累計（該人於本建案全部期別）
  const keepTotal = personAll.reduce((s, b) => s + toNum(b.keep), 0);
  const keepPaid = (payouts || [])
    .filter(p => p.type === 'person' && p.personKey === personKey)
    .reduce((s, p) => s + toNum(p.amount), 0);

  // 人員資訊：以最新一筆紀錄為準，email 取自人員名冊
  const latest = sorted[sorted.length - 1] || personAll[personAll.length - 1] || {};
  const staff = personnel.find(p => p.phone === personKey) || null;
  const person = {
    personKey,
    name: latest.name || staff?.name || '',
    role: latest.role || (staff?.positions || []).join('、') || '',
    sourceProjectId: latest.sourceProjectId || '',
    sourceProjectName: latest.sourceProjectId && latest.sourceProjectId !== projectId ? (latest.sourceProjectName || '') : '',
    email: staff?.email || '',
    isExternal: !!latest.isExternal,
  };

  const label = periodsLabel(periods);
  const fileLabel = periodsLabel(periods, true);
  const shortName = settings.projectShortName || '';
  const fileName = withProjectName(
    fillPattern(cfg.fileNamePattern, { projectName, shortName, period: fileLabel }).replace(/\{姓名\}/g, person.name),
    projectName,
  );

  return {
    docType: 'person',
    projectId, projectName,
    periods: [...periodSet].sort((a, b) => a - b),
    periodsLabel: label,
    title: `${projectName}－業務獎金個人明細`,
    subtitle: `第 ${label} 期`,
    fileName,
    generatedAt: formatDateTW(new Date()),
    style: cfg.style,
    showBuyerName: cfg.showBuyerName !== false,
    showDealTotal: cfg.showDealTotal !== false,
    person,
    categories,
    rows, totals,
    detailRows, otherAggregate,
    detailScope: showAllUnits ? 'all' : 'own',
    showDetail: detailRows.length > 0,
    periodSummaries,
    retention: { keepTotal, keepPaid, keepUnpaid: keepTotal - keepPaid },
    paper: cfg.paper || 'A4',
    orientation: cfg.orientation || 'landscape',
  };
}

export { money };
