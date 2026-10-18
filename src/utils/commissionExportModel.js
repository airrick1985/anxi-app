import { periodPersonNotes, personNoteHistory, summarizePeriodBonus } from './commissionPeriodBonus';
/**
 * 請佣獎金 匯出模型（docs/請佣獎金系統-spec.md §7）
 * 前端預覽（HTML）、Excel（xlsx-js-style）、後端 PDF（pdfkit）三端共用同一 model，
 * 確保呈現一致。格式重現舊 GAS writeCommissionSheet_ / writeBonusSheet_。
 */

import {
  toNum, money, toMinguo, toMinguoYM, fillPattern, formatDateTW, pctText,
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

/** 匯出／預覽用建案名：未改名的一般方案沿用舊檔名；自訂顯示名稱一併呈現。 */
export function exportProjectNameOf(projectName, plan) {
  return !plan || (plan.id === 'general' && (!plan.name || plan.name === '一般請佣'))
    ? String(projectName || '') : `${projectName}・${plan.name}`;
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
  { key: 'commPct',    title: '佣金比例(%)',     width: 120, align: 'center', get: r => `${pctText(r.commPct)}%` },
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
/** 戶別列排序：已儲存的戶別順序（unitOrder）優先，其餘依戶別編號自然排序接在後面 */
export function sortRecordsByUnitOrder(records, unitOrder = []) {
  const idx = {};
  (unitOrder || []).forEach((u, i) => { if (idx[u] === undefined) idx[u] = i; });
  const rank = r => (idx[String(r.unitId)] !== undefined ? idx[String(r.unitId)] : Number.MAX_SAFE_INTEGER);
  return records.slice().sort((a, b) => (rank(a) - rank(b))
    || String(a.unitId).localeCompare(String(b.unitId), 'zh-Hant', { numeric: true }));
}

export function buildClaimModel(records, opts) {
  const { settings = {}, config = {}, period, projectName = '', unitOrder = [] } = opts;
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

  const sorted = sortRecordsByUnitOrder(records, unitOrder);
  const rows = sorted.map((r, i) => {
    const cells = {};
    CLAIM_COLUMNS.forEach(col => { cells[col.key] = col.get(r, i, ctx); });   // 編號依排序後位置連續編號
    return { cells, unitId: String(r.unitId), recordId: r.id, youfu: !!r.snapshot?.isPreferredPayment, refund: isRefundRecord(r) };
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
  }) + (String(cfg.titlePattern).includes('{民國年月}') ? '' : titleMonthSuffix(minguoYM));
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
    noteSlots: [String(cfg.notes?.[0] ?? ''), String(cfg.notes?.[1] ?? '')],   // 條文 1／2 固定位置（預覽可就地編輯）
    showSummaryBlock: cfg.showSummaryBlock !== false,
    summary: { baseSum, thisClaimSum, cash, bill: thisClaimSum - cash },
    paper: cfg.paper || 'A4',
    orientation: cfg.orientation || 'landscape',
  };
}

// ================= 獎金表 model =================
export const SINGLE_PAGE_KEY = 'all';   // 統整一頁：所有請佣比例合為同一組

function ratioKey(ratioPct) {
  return pctText(ratioPct);   // 依來源精度（不四捨五入到一位）
}

function firstMinguoYM(records) {
  for (const r of records) {
    const ym = toMinguoYM(r.requestDate);
    if (ym) return ym;
  }
  return '';
}

/** 標題結尾月份：'115/10' → '（115 年 10 月）' */
function titleMonthSuffix(minguoYM) {
  const [y, m] = String(minguoYM || '').split('/');
  return y && m ? `（${y} 年 ${Number(m)} 月）` : '';
}

function isMgmtRole(role) {
  const s = String(role || '');
  if (s.includes('主委')) return '主委';
  if (s.includes('副總')) return '副總';
  if (s.includes('輔導')) return '輔導';
  return null;
}
/** 管理類別歸屬（主委／副總／輔導）：看類別名稱與對應職務 */
function mgmtCatOf(cat) {
  const s = `${cat?.label || ''} ${(cat?.rolePositions || []).join(' ')}`;
  return isMgmtRole(s) || '主委';
}

/** 類別歸位：indiv（個獎欄）/ team（團獎欄）/ 其他右側列 / 管理左側 / handover（提撥類別，上段獨立欄、不計入任何人） */
export function classifyCategories(settings) {
  const cats = (settings.bonusCategories || []).filter(c => c.enabled !== false);
  const mgmtRoles = ['主委', '副總', '輔導'];
  const indiv = [], team = [], mgmt = [], others = [], handover = [];
  cats.forEach(c => {
    if (c.mode === 'handover') handover.push(c);
    else if (c.mode === 'individual') indiv.push(c);
    else if (c.mode === 'team' || String(c.label).trim() === '銷售團獎') team.push(c);   // 名稱只認「銷售團獎」；其他含「團獎」的類別（如專案團獎）獨立列示
    else if ((c.rolePositions || []).some(r => mgmtRoles.some(m => String(r).includes(m)))) mgmt.push(c);
    else others.push(c);
  });
  return { indiv, team, mgmt, others, handover };
}

const sumCats = (obj, keys) => keys.reduce((s, k) => s + toNum(obj?.[k]), 0);

/** 交屋保留款費率標示：如「銷售個獎 5%」（來源類別名稱以該戶紀錄為準） */
function handoverRateText(r, h, settings, indivKeys) {
  const key = h?.sourceCatKey || indivKeys[0];
  const label = r.categories?.[key]?.label
    || (settings.bonusCategories || []).find(c => c.key === key)?.label || '個獎';
  return `${label} ${pctText(h?.ratePct)}%`;
}

/**
 * 交屋保留款（含於保留款、不參與計算）攤給該戶銷售人員：依來源類別（預設銷售個獎）金額比例，
 * 本次實際金額（已乘請佣比例），整數、末位吸收尾差；沒領來源類別者沒有。
 * @returns {{ row, srcKey, amount, h }[]}
 */
function handoverShares(record, rows, indivKeys) {
  const out = [];
  Object.values(record?.handover?.byCat || {}).forEach(h => {
    const keys = h?.sourceCatKey ? [h.sourceCatKey] : indivKeys;
    const live = rows.filter(b => sumCats(b.amounts, keys));
    const total = live.reduce((s, b) => s + sumCats(b.amounts, keys), 0);
    const amount = toNum(h?.amount);
    if (!amount || !total) return;
    let given = 0;
    live.forEach((b, i) => {
      const v = i === live.length - 1 ? amount - given : Math.round(amount * sumCats(b.amounts, keys) / total);
      given += v;
      out.push({ row: b, srcKey: keys.find(x => toNum(b.amounts?.[x])) || keys[0], amount: v, h });
    });
  });
  return out;
}

/**
 * 獎金表 model：依請佣比例分組，每組一張；singlePage 時全部比例合為一張（SINGLE_PAGE_KEY）。
 * 金額規則（同舊系統）：非 100% 組以 amountsFull（100% 重算）呈現，
 * 「優付方案請款」列與扣款列以實際金額（amounts / keep / tax / nhi / net）。
 * 統整一頁：上表、類別列、累計與扣款全部以實際金額呈現，不列優付列。
 * @param {object} opts - { records, bonusRecords, settings, config, period, projectName, personnelOrder, singlePage }
 */
/**
 * 人員排序比較函式：
 * 1. 建案層級「獎金表人員欄排序」（personOrder，personKey 清單，即時預覽拖曳儲存）優先；
 * 2. 未排過序者接在後面，依建案人員名單順序（personnelOrder，姓名）；
 * 3. 其餘依姓名排序。
 */
export function makePersonRank(personOrder = [], personnelOrder = []) {
  const keyIdx = {};
  (personOrder || []).forEach((k, i) => { if (keyIdx[k] === undefined) keyIdx[k] = i; });
  const nameIdx = {};
  (personnelOrder || []).forEach((n, i) => { if (nameIdx[n] === undefined) nameIdx[n] = i; });
  const base = (personOrder || []).length;
  return p => {
    if (p?.personKey !== undefined && keyIdx[p.personKey] !== undefined) return keyIdx[p.personKey];
    if (nameIdx[p?.name] !== undefined) return base + nameIdx[p.name];
    return Number.MAX_SAFE_INTEGER;
  };
}
export function makePersonSorter(personOrder = [], personnelOrder = []) {
  const rank = makePersonRank(personOrder, personnelOrder);
  return (a, b) => (rank(a) - rank(b)) || String(a?.name || '').localeCompare(String(b?.name || ''), 'zh-Hant');
}

export function buildBonusModel(opts) {
  const {
    records = [], bonusRecords = [], settings = {}, config = {},
    period, projectName = '', projectId = '', personnelOrder = [], personOrder = [], unitOrder = [], singlePage = false,
  } = opts;
  const cfg = { ...defaultBonusConfig(settings), ...config };
  const cls = classifyCategories(settings);
  const indivKeys = cls.indiv.map(c => c.key);
  const teamKeys = cls.team.map(c => c.key);

  const personSorter = makePersonSorter(personOrder, personnelOrder);
  const personRank = makePersonRank(personOrder, personnelOrder);
  const mgmtKeys = cls.mgmt.map(c => c.key);

  const minguoYM = firstMinguoYM(records);

  // 分組（退佣紀錄 ratioPct 為負：依退回比例合計歸組，金額以實際負值呈現）
  const groupKeyOf = r => (singlePage ? SINGLE_PAGE_KEY : ratioKey(Math.abs(toNum(r.ratioPct))));
  const groups = {};
  records.forEach(r => {
    const key = groupKeyOf(r);
    if (!groups[key]) groups[key] = { records: [], bonusRows: [] };
    groups[key].records.push(r);
  });
  bonusRecords.forEach(b => {
    const rec = records.find(r => r.id === b.commissionRecordId);
    if (!rec) return;
    groups[groupKeyOf(rec)].bonusRows.push(b);
  });

  const sumAll =obj => Object.values(obj || {}).reduce((s, v) => s + toNum(v), 0);

  const modelGroups = Object.keys(groups)
    .sort((a, b) => Number(b) - Number(a))
    .map(pctKey => {
      const g = groups[pctKey];
      const actual = pctKey === SINGLE_PAGE_KEY;   // 統整一頁：一律實際金額
      const isYoufu = !actual && pctKey !== '100';
      const youfuLabel = fillPattern(cfg.youfuLabelPattern, { pct: pctKey });
      const amountsOf = b => (actual ? b.amounts : (b.amountsFull || b.amounts)) || {};

      // ---- 每人彙總 ----
      const agg = {};
      g.bonusRows.forEach(b => {
        if (!agg[b.personKey]) {
          agg[b.personKey] = {
            personKey: b.personKey, name: b.name, role: b.role || '',
            sourceProjectId: b.sourceProjectId || '', sourceProjectName: b.sourceProjectName || '',
            indiv: 0, team: 0, byCat: {}, sub: 0,
            subDisc: 0, keepDisc: 0, taxDisc: 0, nhiDisc: 0, handoverBySrc: {},
            remark: b.remark || '', legacyNotes: [],
          };
        }
        const a = agg[b.personKey];
        const full = amountsOf(b);
        a.indiv += sumCats(full, indivKeys);
        a.team += sumCats(full, teamKeys);
        Object.keys(full).forEach(k => { a.byCat[k] = (a.byCat[k] || 0) + toNum(full[k]); });
        a.sub += sumAll(full);
        a.subDisc += toNum(b.subtotal);
        a.keepDisc += toNum(b.keep);
        a.taxDisc += toNum(b.tax);
        a.nhiDisc += toNum(b.nhi);
        if (!a.remark) a.remark = b.remark || '';
        if (b.remark && !a.legacyNotes.includes(b.remark)) a.legacyNotes.push(b.remark);
      });
      // 交屋保留款（參考，含於保留款、不參與計算）：各戶交屋團獎攤給該戶銷售人員
      g.records.forEach(r => {
        const rows = g.bonusRows.filter(b => b.commissionRecordId === r.id);
        handoverShares(r, rows, indivKeys).forEach(({ row, srcKey, amount }) => {
          const a = agg[row.personKey];
          a.handoverBySrc[srcKey] = (a.handoverBySrc[srcKey] || 0) + amount;
        });
      });
      // 100% 的保留/稅/健保：以實際有效比例回推
      // 每人歷期備註：呼叫端可傳入以全建案獎金明細算好的 noteHistory（送出前預覽只帶本次草稿時仍能帶入最近一期備註）
      const noteHistory = opts.noteHistory || personNoteHistory(bonusRecords);
      Object.values(agg).forEach(a => {
        a.remarkNotes = periodPersonNotes(opts.periodNotes, period, a.personKey, a.legacyNotes, noteHistory[a.personKey] || []);
        if (actual) {
          a.sub = a.subDisc; a.keep = a.keepDisc; a.tax = a.taxDisc; a.nhi = a.nhiDisc;
        } else {
          const kr = a.subDisc ? a.keepDisc / a.subDisc : 0;
          const tr = a.subDisc ? a.taxDisc / a.subDisc : 0;
          const nr = a.subDisc ? a.nhiDisc / a.subDisc : 0;
          a.keep = Math.round(a.sub * kr);
          a.tax = Math.round(a.sub * tr);
          a.nhi = Math.round(a.sub * nr);
        }
        a.net = a.sub - a.keep - a.tax - a.nhi;
        a.netDisc = a.subDisc - a.keepDisc - a.taxDisc - a.nhiDisc;
        a.handoverKeep = sumAll(a.handoverBySrc);
      });

      // 獎金合計人員欄（一人一欄）：有管理類別獎金，或職務為主委／副總／輔導者列前段（管理職），其餘有獎金者列後段
      const left = [], right = [];
      Object.values(agg).forEach(a => {
        const firstCat = cls.mgmt.find(c => Math.round(toNum(a.byCat[c.key])) !== 0);
        const roleCat = isMgmtRole(a.role);
        if (firstCat || (roleCat && a.sub !== 0)) {
          a.mgmtCat = firstCat ? mgmtCatOf(firstCat) : roleCat;
          left.push(a);
        } else if (a.sub !== 0) right.push(a);
      });
      // 排序：已儲存的人員欄順序優先（可拖曳）；未排序者管理職依主委→副總→輔導，再依人員名單
      const catOrder = { 主委: 0, 副總: 1, 輔導: 2 };
      left.sort((x, y) => (personRank(x) - personRank(y))
        || ((catOrder[x.mgmtCat] ?? 9) - (catOrder[y.mgmtCat] ?? 9))
        || String(x.name).localeCompare(String(y.name), 'zh-Hant'));
      right.sort(personSorter);

      // ---- 每戶列 + 每戶每人 個獎/團獎（100%；統整一頁為實際金額） ----
      const perUnitPerson = {};   // commissionRecordId -> personKey -> {indiv, team}
      g.bonusRows.forEach(b => {
        const full = amountsOf(b);
        if (!perUnitPerson[b.commissionRecordId]) perUnitPerson[b.commissionRecordId] = {};
        if (!perUnitPerson[b.commissionRecordId][b.personKey]) perUnitPerson[b.commissionRecordId][b.personKey] = { indiv: 0, team: 0 };
        perUnitPerson[b.commissionRecordId][b.personKey].indiv += sumCats(full, indivKeys);
        perUnitPerson[b.commissionRecordId][b.personKey].team += sumCats(full, teamKeys);
      });
      // 上段人員欄：只列在任一戶有個獎或團獎金額的人員（只領其他類別者不出現）
      const topPersons = left.concat(right)
        .filter(a => Object.values(perUnitPerson).some(m => {
          const v = m[a.personKey];
          return v && (Math.round(v.indiv) !== 0 || Math.round(v.team) !== 0);
        }))
        .sort(personSorter)
        .map(a => ({ personKey: a.personKey, name: a.name, sourceProjectName: a.sourceProjectName, sourceProjectId: a.sourceProjectId }));

      const rateOf = keys => keys.reduce((s, k) => {
        const cat = (settings.bonusCategories || []).find(c => c.key === k);
        return s + toNum(cat?.ratePct);
      }, 0);
      // 每戶個獎／團獎費率：以該戶紀錄的類別比例為準；紀錄未存類別（如退佣）但有金額時沿用建案設定
      const unitRateOf = (r, keys, hasAmount) => {
        const own = keys.filter(k => r.categories?.[k]);
        if (own.length) return own.reduce((s, k) => s + toNum(r.categories[k].ratePct), 0);
        return hasAmount ? rateOf(keys) : 0;
      };
      // 每戶交屋保留款：費率標示基準類別（如「銷售個獎 5%」）；金額同個獎欄以 100%（統整一頁為實際金額）呈現
      const handoverOf = r => {
        const list = Object.values(r.handover?.byCat || {});
        return {
          hkRate: list.filter(h => toNum(h?.ratePct))
            .map(h => handoverRateText(r, h, settings, indivKeys)).join('、'),
          hkAmt: Math.round(list.reduce((s, h) => s + toNum(actual ? h?.amount : (h?.amountFull ?? h?.amount)), 0)),
        };
      };

      const sortedRecords = opts.preserveRecordOrder ? g.records : sortRecordsByUnitOrder(g.records, unitOrder);
      const unitRows = sortedRecords.map((r, i) => {
        const pp = {};
        topPersons.forEach(p => {
          const v = perUnitPerson[r.id]?.[p.personKey] || { indiv: 0, team: 0 };
          pp[p.personKey] = { indiv: Math.round(v.indiv), team: Math.round(v.team) };
        });
        // 團獎人數：team 類別分配人數
        let teamCount = 0;
        teamKeys.forEach(k => {
          const allocs = r.categories?.[k]?.allocations || [];
          teamCount = Math.max(teamCount, allocs.length);
        });
        const refund = isRefundRecord(r);
        const amts = Object.values(perUnitPerson[r.id] || {});
        return {
          no: i + 1,
          unitId: String(r.unitId), recordId: r.id,
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
          ratioPct: toNum(r.ratioPct),   // 獎金比例（退佣為負）
          indivRate: unitRateOf(r, indivKeys, amts.some(v => Math.round(v.indiv) !== 0)),
          teamRate: unitRateOf(r, teamKeys, amts.some(v => Math.round(v.team) !== 0)),
          ...handoverOf(r),
          pp,
        };
      });

      const topTotal = { total: 0, after: 0, referral: 0, hk: 0, pp: {} };
      topPersons.forEach(p => { topTotal.pp[p.personKey] = { indiv: 0, team: 0 }; });
      unitRows.forEach(row => {
        topTotal.total += row.total; topTotal.after += row.after; topTotal.referral += row.referral; topTotal.hk += row.hkAmt;
        topPersons.forEach(p => {
          topTotal.pp[p.personKey].indiv += row.pp[p.personKey].indiv;
          topTotal.pp[p.personKey].team += row.pp[p.personKey].team;
        });
      });

      // ---- 獎金合計類別列：個獎、團獎，其餘職務類別（管理／其他）依設定順序各一列 ----
      const roleCats = (settings.bonusCategories || []).filter(c => cls.mgmt.includes(c) || cls.others.includes(c));
      const catRows = [];
      catRows.push({ key: '_indiv', label: cls.indiv[0]?.label || '銷售個獎', ratePct: rateOf(indivKeys), get: a => Math.round(a.indiv) });
      catRows.push({ key: '_team', label: '銷售團獎', ratePct: rateOf(teamKeys), get: a => Math.round(a.team) });
      roleCats.forEach(c => {
        catRows.push({ key: c.key, label: c.label, ratePct: toNum(c.ratePct), get: a => Math.round(toNum(a.byCat[c.key])) });
      });

      // ---- 合計 ----
      let grandNet = 0, grandTax = 0, grandNhi = 0;
      left.concat(right).forEach(a => {
        grandNet += isYoufu ? a.netDisc : a.net;
        grandTax += isYoufu ? a.taxDisc : a.tax;
        grandNhi += isYoufu ? a.nhiDisc : a.nhi;
      });

      return {
        pctKey, isYoufu, youfuLabel,
        sheetName: actual ? '業務獎金' : `業務獎金-${pctKey}%`,
        title: `${projectName}－業務獎金　第 ${period} 期${actual ? '' : `　獎金發放比例 ${pctKey}%`}${titleMonthSuffix(minguoYM)}`,
        topPersons, unitRows, topTotal,
        hasHandover: unitRows.some(row => row.hkRate || row.hkAmt),
        left, right, catRows,
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
    period, fileName, projectId, minguoYM,
    style: cfg.style,
    partyALabel: settings.partyALabel || '一研九鼎負擔介紹費',
    showSourceProjectTag: cfg.showSourceProjectTag !== false,
    includeClaimSheet: cfg.includeClaimSheet !== false,
    groups: modelGroups,
    paper: cfg.paper || 'A3',
    orientation: cfg.orientation || 'landscape',
  };
}

/** Merge plan rows before layout, keeping category keys scoped to their source plan. */
export function buildMergedBonusModel({ sources = [], ...opts }) {
  const records = [], bonusRecords = [], bonusCategories = [];
  const sourceByRecord = new Map();
  sources.forEach(({ plan, records: planRecords, bonusRecords: planBonuses, settings, unitOrder }) => {
    const keyOf = key => `${plan.id}:${key}`;
    const remap = values => Object.fromEntries(Object.entries(values || {}).map(([key, value]) => [keyOf(key), value]));
    (settings.bonusCategories || []).forEach(cat => bonusCategories.push({
      ...cat, key: keyOf(cat.key), label: `${plan.name}・${cat.label}`,
    }));
    sortRecordsByUnitOrder(planRecords, unitOrder).forEach(record => {
      const id = keyOf(record.id);
      const handover = record.handover && {
        ...record.handover,
        byCat: Object.fromEntries(Object.entries(record.handover.byCat || {}).map(([key, h]) => [
          keyOf(key), { ...h, sourceCatKey: h?.sourceCatKey ? keyOf(h.sourceCatKey) : '' },
        ])),
      };
      records.push({ ...record, id, categories: remap(record.categories), ...(handover ? { handover } : {}) });
      sourceByRecord.set(id, plan);
    });
    planBonuses.forEach(b => bonusRecords.push({
      ...b, commissionRecordId: keyOf(b.commissionRecordId),
      amounts: remap(b.amounts),
      ...(b.amountsFull ? { amountsFull: remap(b.amountsFull) } : {}),
    }));
  });
  const model = buildBonusModel({ ...opts, records, bonusRecords, preserveRecordOrder: true,
    settings: { ...opts.settings, bonusCategories },
  });
  model.mergedRows = true;
  model.includeClaimSheet = false;
  model.groups.forEach(group => {
    const single = group.pctKey === SINGLE_PAGE_KEY;
    group.title = `${opts.projectName || ''}－合併獎金表　第 ${opts.period} 期${single ? '' : `　獎金發放比例 ${group.pctKey}%`}${titleMonthSuffix(model.minguoYM)}`;
    group.sheetName = single ? '合併獎金' : `合併獎金-${group.pctKey}%`;
    group.catRows.filter(row => ['_indiv', '_team'].includes(row.key)).forEach(row => {
      row.label = row.key === '_indiv' ? '銷售個獎' : '銷售團獎';
      row.rateText = '依方案';
    });
    group.unitRows.forEach(row => {
      const plan = sourceByRecord.get(row.recordId);
      row.planName = plan.name;
      row.priceBasis = plan.priceBasis;
    });
  });
  return model;
}

// ================= 每人當期獎金結果 model =================
/**
 * 與工作台「每人當期獎金結果」同一份資料：該期所有方案已送出獎金（排除作廢）＋本次草稿（拉回修改的原筆不重複）。
 * 獎金項目每類別一欄（只列有金額者，依類別順序）；扣款比例各筆一致時顯示該比例，不一致為 null（依戶別）。
 * @param {object} opts - { period, saved, drafts, replacingIds, categoryLabels: {key: label}, categoryOrder: [key],
 *   sorter, periodNotes, noteHistory, projectName, style, paper, orientation }
 */
export function buildPeriodResultModel(opts) {
  const {
    period, saved = [], drafts = [], replacingIds = [], categoryLabels = {}, categoryOrder = [], sorter = null,
    periodNotes = [], noteHistory = {}, projectName = '', style = {}, paper = 'A3', orientation = 'landscape',
  } = opts;
  const summary = summarizePeriodBonus({ period, saved, drafts, replacingIds, sorter, categoryOrder });
  const replacing = new Set(replacingIds.filter(Boolean));
  const rows = [...saved.filter(b => b.status !== 'voided' && !replacing.has(b.commissionRecordId)), ...drafts]
    .filter(b => toNum(b.period) === toNum(period));
  const pctOf = (key, field) => {
    const set = new Set(rows.filter(b => (b.personKey || b.name) === key && toNum(b.subtotal) !== 0).map(b => toNum(b[field])));
    return set.size === 1 ? [...set][0] : (set.size ? null : 0);
  };

  const byCatTotal = {};
  summary.people.forEach(p => Object.entries(p.byCat || {}).forEach(([k, v]) => { byCatTotal[k] = (byCatTotal[k] || 0) + toNum(v); }));
  const usedKeys = Object.keys(byCatTotal).filter(k => summary.people.some(p => Math.round(toNum(p.byCat?.[k])) !== 0));
  const idx = k => { const i = categoryOrder.indexOf(k); return i < 0 ? Number.MAX_SAFE_INTEGER : i; };
  const categories = usedKeys.sort((a, b) => idx(a) - idx(b)).map(k => ({ key: k, label: categoryLabels[k] || k }));

  const people = summary.people.map(p => ({
    personKey: p.personKey, name: p.name,
    byCat: Object.fromEntries(categories.map(c => [c.key, Math.round(toNum(p.byCat?.[c.key]))])),
    keepPct: pctOf(p.personKey, 'keepPct'), taxPct: pctOf(p.personKey, 'taxPct'), nhiPct: pctOf(p.personKey, 'nhiPct'),
    subtotal: p.subtotal, keep: p.keep, tax: p.tax, nhi: p.nhi, net: p.net,
    notes: periodPersonNotes(periodNotes, period, p.personKey, p.legacyNotes || [], noteHistory[p.personKey] || [])
      .map(n => String(n || '').trim()).filter(Boolean),
  }));
  const minguoYM = firstMinguoYM(rows);
  return {
    docType: 'periodResult', period, projectName,
    title: `${projectName}－每人當期獎金結果　第 ${period} 期${titleMonthSuffix(minguoYM)}`,
    sheetName: '每人當期獎金結果',
    categories, people,
    totals: { ...summary.totals, byCat: Object.fromEntries(categories.map(c => [c.key, Math.round(byCatTotal[c.key])])) },
    style, paper, orientation,
  };
}

// ================= 個人獎金明細 model =================
/** 個人明細樣式：A4 直式、大字、清爽配色（不受已存版型影響） */
const PERSON_STYLE = {
  fontFamily: 'Microsoft JhengHei',
  titleFontSize: 20, headerFontSize: 12, dataFontSize: 12,
  headerBg: '#e8f0f8', totalRowBg: '#e8f0f8', summaryColor: '#127347', accentColor: '#1f5f99', borders: false,
};

/** 預設個人明細版型 config */
export function defaultPersonConfig(settings) {
  return {
    style: { ...PERSON_STYLE },
    showBuyerName: true,
    showDealTotal: true,
    fileNamePattern: settings?.personFileNamePattern || '{建案名}NO.{期別}獎金明細-{姓名}',
    paper: 'A4',
    orientation: 'portrait',
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
export function listPersonsInPeriods(bonusRecords, periods, personnelOrder = [], personOrder = []) {
  const set = new Set((periods || []).map(toNum));
  const personSorter = makePersonSorter(personOrder, personnelOrder);
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
  return Object.values(map).sort(personSorter);
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
  const recOf = b => recById[b.commissionRecordId] || records.find(r => r.projectId === b.projectId && r.unitId === b.unitId && toNum(r.period) === toNum(b.period)) || {};

  // 交屋保留款：本人為該戶銷售人員（領來源類別）才有，金額為本人分攤額（同獎金表）
  const indivKeys = classifyCategories(settings).indiv.map(c => c.key);
  const rowsByRecord = {};
  bonusRecords.forEach(b => {
    if (b.status === 'voided' || !b.commissionRecordId) return;
    if (!rowsByRecord[b.commissionRecordId]) rowsByRecord[b.commissionRecordId] = [];
    rowsByRecord[b.commissionRecordId].push(b);
  });
  const handoverOfRow = b => {
    const rec = recOf(b);
    const mine = handoverShares(rec, b.commissionRecordId ? rowsByRecord[b.commissionRecordId] || [] : [b], indivKeys)
      .filter(s => s.row === b);
    return {
      hk: mine.reduce((s, x) => s + x.amount, 0),
      hkRate: mine.filter(x => toNum(x.h?.ratePct)).map(x => handoverRateText(rec, x.h, settings, indivKeys)).join('、'),
    };
  };

  // 獎金分配比例：每戶每類別的分配人員與比例（比例＝分到該類別費率的比例，單獨模式每人各得全額）
  // 有分配名單者依設定比例；含鎖定金額者依實際金額換算；無分配名單（Excel 匯入）者依各人金額換算
  const unitKeyOf = b => b.commissionRecordId || `${b.unitId}|${toNum(b.period)}`;
  const rowsByUnit = {};
  bonusRecords.forEach(b => {
    if (b.status === 'voided') return;
    const k = unitKeyOf(b);
    if (!rowsByUnit[k]) rowsByUnit[k] = [];
    rowsByUnit[k].push(b);
  });
  const sharePct = v => Math.round(v * 100) / 100;
  const shareListOf = (b, rec, catKey) => {
    const live = (rowsByUnit[unitKeyOf(b)] || []).filter(x => toNum(x.amounts?.[catKey]) !== 0);
    const amountOf = pk => live.filter(x => (x.personKey || x.name) === pk).reduce((s, x) => s + toNum(x.amounts[catKey]), 0);
    const total = live.reduce((s, x) => s + toNum(x.amounts[catKey]), 0);
    const cat = rec.categories?.[catKey] || {};
    const allocs = Array.isArray(cat.allocations) ? cat.allocations : [];
    if (allocs.length) {
      const mult = cat.allocMode === 'each' ? allocs.length : 1;
      const anyLocked = allocs.some(a => a.mode === 'locked');
      return allocs.map(a => ({
        personKey: a.personKey,
        name: a.name || live.find(x => x.personKey === a.personKey)?.name || a.personKey,
        locked: a.mode === 'locked',
        pct: sharePct(anyLocked ? (total ? amountOf(a.personKey) / total * 100 * mult : 0) : toNum(a.sharePct) * mult),
      }));
    }
    if (!total) return [];
    return [...new Set(live.map(x => x.personKey || x.name))].map(pk => ({
      personKey: pk, name: live.find(x => (x.personKey || x.name) === pk).name || pk, locked: false,
      pct: sharePct(amountOf(pk) / total * 100),
    }));
  };
  const allocGroups = new Map();   // 同類別＋同分配名單與比例 → 一組，列出戶別

  const rows = sorted.map(b => {
    const rec = recOf(b);
    const snap = rec.snapshot || {};
    const amounts = {};
    categories.forEach(c => { amounts[c.key] = Math.round(toNum(b.amounts?.[c.key])); });
    const isOwnSale = normSales(snap.salesperson).some(n => personNames.has(n));
    const refund = isRefundRecord(rec) || b.type === 'refund';
    const unit = `${b.unitId || rec.unitId || ''}`;
    const shares = {};
    categories.forEach(c => {
      if (!amounts[c.key]) return;
      const list = shareListOf(b, rec, c.key);
      const own = list.find(x => x.personKey === personKey);
      if (!own) return;
      shares[c.key] = { pct: own.pct, locked: own.locked };
      if (list.length < 2) return;
      const sig = `${c.key}|${list.map(x => `${x.personKey}:${x.pct}:${x.locked ? 1 : 0}`).join(',')}`;
      if (!allocGroups.has(sig)) {
        allocGroups.set(sig, {
          catKey: c.key, label: c.label, own: shares[c.key], units: [],
          persons: list.map(x => ({ name: x.name, pct: x.pct, locked: x.locked, self: x.personKey === personKey })),
        });
      }
      const units = allocGroups.get(sig).units;
      const unitLabel = refund ? `${unit}(退佣)` : unit;
      if (!units.includes(unitLabel)) units.push(unitLabel);
    });
    return {
      isOwnSale,
      refund,
      period: toNum(b.period),
      requestDate: toMinguo(b.requestDate || rec.requestDate),
      unit,
      shares,
      contractDate: toMinguo(snap.contractDate),
      buyerName: snap.buyerName || '',
      dealTotal: toNum(snap.dealTotal),
      ratioPct: toNum(rec.ratioPct),
      amounts,
      subtotal: toNum(b.subtotal),
      keepPct: toNum(b.keepPct), keep: toNum(b.keep),
      ...handoverOfRow(b),
      taxPct: toNum(b.taxPct), tax: toNum(b.tax),
      nhiPct: toNum(b.nhiPct), nhi: toNum(b.nhi),
      net: toNum(b.net),
      remark: refund ? ['退佣', b.remark || ''].filter(Boolean).join('：') : (b.remark || ''),
    };
  });

  const sumKeys = ['subtotal', 'keep', 'hk', 'tax', 'nhi', 'net', 'dealTotal'];
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
    if (!byPeriod[r.period]) byPeriod[r.period] = { period: r.period, requestDate: r.requestDate, count: 0, subtotal: 0, keep: 0, hk: 0, tax: 0, nhi: 0, net: 0 };
    const p = byPeriod[r.period];
    p.count++;
    p.subtotal += r.subtotal; p.keep += r.keep; p.hk += r.hk; p.tax += r.tax; p.nhi += r.nhi; p.net += r.net;
    if (!p.requestDate) p.requestDate = r.requestDate;
  });
  const periodSummaries = Object.values(byPeriod).sort((a, b) => a.period - b.period);

  // 分配區塊：依類別順序，同類別內依首次出現（期別、戶別）
  const catIndex = Object.fromEntries(categories.map((c, i) => [c.key, i]));
  const allocations = [...allocGroups.values()]
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (catIndex[a.g.catKey] - catIndex[b.g.catKey]) || (a.i - b.i))
    .map(({ g }) => ({ ...g, count: g.units.length }));

  // 保留款累計（該人於本建案全部期別）
  const keepTotal = personAll.reduce((s, b) => s + toNum(b.keep), 0);
  const hkTotal = personAll.reduce((s, b) => s + handoverOfRow(b).hk, 0);
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
    periodRemarks: [...periodSet].sort((a, b) => a - b).flatMap(period => periodPersonNotes(opts.periodNotes, period, personKey, [...new Set(personRows.filter(b => toNum(b.period) === period).map(b => b.remark).filter(Boolean))]).map(text => ({ period, text }))),
    projectId, projectName,
    periods: [...periodSet].sort((a, b) => a - b),
    periodsLabel: label,
    title: `${projectName}－業務獎金個人明細`,
    subtitle: `第 ${label} 期`,
    fileName,
    generatedAt: formatDateTW(new Date()),
    style: { ...PERSON_STYLE },
    showBuyerName: cfg.showBuyerName !== false,
    showDealTotal: cfg.showDealTotal !== false,
    person,
    categories,
    rows, totals,
    detailRows, otherAggregate,
    detailScope: showAllUnits ? 'all' : 'own',
    showDetail: detailRows.length > 0,
    allocations,
    periodSummaries,
    retention: { keepTotal, hkTotal, keepPaid, keepUnpaid: keepTotal - keepPaid },
    paper: 'A4',
    orientation: 'portrait',
  };
}

export { money };
