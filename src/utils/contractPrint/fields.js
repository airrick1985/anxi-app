// 合約套印：可帶入的欄位目錄，以及由戶別／車位／土地清冊／合約製作計算結果組出本戶欄位值。
// 欄位 key 與本機試做版範本相同，範本可以直接沿用。
import { toNumber } from './cnNumber.js';
import { getOwnedParkingSpots, parkingTransactionPrice } from '@/utils/unitDocContext';

/**
 * type：text 文字、choice 選項、number 數字、money 金額（元）
 * list：'land'＝土地標的清冊每一筆、'park'＝每一個車位（值為陣列，範本以「第幾筆」取用）
 * options：選項（自動偵測時依 □ 後面的文字猜顯示條件）
 * aliases：合約上可能的寫法（自動偵測金額列時用來猜欄位）
 * source：資料來源說明（顯示在欄位清單）
 * optional：本來就可能空白（例如門牌沒有段巷弄），沒有值時不提醒
 * floor：樓層文字（B2、3F），可輸出為數字或國字
 */
export const PRINT_FIELDS = [
  { key: 'unit', label: '戶別', type: 'text', group: '基本', source: '戶別' },
  { key: 'buyer', label: '買方', type: 'text', group: '基本', source: '買方姓名' },
  { key: 'building', label: '棟別', type: 'text', group: '基本', source: '棟別' },
  { key: 'floor', label: '樓層', type: 'text', floor: true, group: '基本', source: '樓層' },
  { key: 'doorplate', label: '門牌', type: 'text', group: '基本', source: '門牌' },

  { key: 'landCity', label: '土地縣市', type: 'text', group: '土地', list: 'land', source: '土地標的清冊' },
  { key: 'landDistrict', label: '土地鄉鎮市區', type: 'text', group: '土地', list: 'land', source: '土地標的清冊' },
  { key: 'landSection', label: '土地段', type: 'text', group: '土地', list: 'land', source: '土地標的清冊「段小段」' },
  { key: 'landSubsection', label: '土地小段', type: 'text', group: '土地', list: 'land', optional: true, source: '土地標的清冊「段小段」' },
  { key: 'landNo', label: '地號', type: 'text', group: '土地', list: 'land', source: '土地標的清冊' },
  { key: 'landArea', label: '土地面積', type: 'number', dp: 2, group: '土地', list: 'land', source: '土地標的清冊' },
  { key: 'landShare', label: '土地權利範圍', type: 'text', group: '土地', list: 'land', source: '土地標的清冊' },
  { key: 'landAreaTotal', label: '全部土地面積', type: 'number', dp: 2, group: '土地', source: '建案設定' },

  { key: 'buildNo', label: '建號', type: 'text', group: '建物', source: '戶別「建號」' },
  { key: 'addrCity', label: '門牌縣市', type: 'text', group: '建物', source: '門牌拆解' },
  { key: 'addrDistrict', label: '門牌鄉鎮市區', type: 'text', group: '建物', source: '門牌拆解' },
  { key: 'addrStreet', label: '門牌街路', type: 'text', group: '建物', source: '門牌拆解' },
  { key: 'addrLane', label: '門牌段巷弄', type: 'text', group: '建物', optional: true, source: '門牌拆解' },
  { key: 'addrNo', label: '門牌號樓', type: 'text', group: '建物', source: '門牌拆解' },
  { key: 'buildArea', label: '建物面積', type: 'number', dp: 2, group: '建物', source: '戶別「登記主建物面積」' },
  { key: 'attachArea', label: '附屬建物面積', type: 'number', dp: 2, group: '建物', source: '戶別「登記附屬建物面積」' },
  { key: 'commonArea', label: '共用部分面積', type: 'number', dp: 2, group: '建物', source: '建案設定（整棟）' },
  { key: 'commonBuildNo', label: '共用部分建號', type: 'text', group: '建物', source: '建案設定' },
  { key: 'commonShare', label: '共用部分持分', type: 'text', group: '建物', source: '戶別「共有部分持分」（建案設定可併入車位持分）' },
  { key: 'parkShare', label: '共用部分持分（車位）', type: 'text', group: '建物', optional: true, source: '建案設定（每個車位持分 × 車位數）' },

  { key: 'parkType', label: '車位種類', type: 'choice', group: '車位', list: 'park', source: '車位類型',
    options: ['法定停車位', '自行增設停車位', '獎勵增設停車位', '其他'] },
  { key: 'parkFloor', label: '車位樓層', type: 'text', floor: true, group: '車位', list: 'park', source: '車位樓層' },
  { key: 'parkStyle', label: '車位型式', type: 'choice', group: '車位', list: 'park', source: '車位形式',
    options: ['平面式', '機械式'] },
  { key: 'parkCount', label: '車位個數', type: 'number', group: '車位', source: '成交車位數' },
  { key: 'parkDeed', label: '車位權狀', type: 'choice', group: '車位', list: 'park', source: '車位權狀（空白用建案預設）',
    options: ['有獨立權狀', '無獨立權狀'] },
  { key: 'parkNo', label: '車位編號', type: 'text', group: '車位', list: 'park', source: '車位號碼' },
  { key: 'parkArea', label: '車位面積㎡', type: 'number', dp: 2, group: '車位', list: 'park', source: '車位面積' },
  { key: 'parkAreaPing', label: '車位面積坪', type: 'number', dp: 2, group: '車位', list: 'park', source: '車位面積（坪）' },
  { key: 'parkPriceEach', label: '單一車位價款', type: 'money', group: '車位', list: 'park', source: '車位成交價' },

  { key: 'landPrice', label: '土地價款', type: 'money', group: '價款', source: '合約製作價款' },
  { key: 'buildingPrice', label: '建物價款', type: 'money', group: '價款', aliases: ['房屋價款'], source: '合約製作價款' },
  { key: 'parkPrice', label: '車位價款', type: 'money', group: '價款', aliases: ['車位總價款', '車位總價'], source: '車位成交價合計' },
  { key: 'totalPrice', label: '總價款', type: 'money', group: '價款', aliases: ['總價'], source: '合約總價' },

  { key: 'deposit', label: '定金', type: 'money', group: '付款', aliases: ['訂金'], source: '期款' },
  { key: 'signPay', label: '簽約款', type: 'money', group: '付款', source: '期款' },
  { key: 'docPay', label: '備證款', type: 'money', group: '付款', aliases: ['用印款'], source: '期款' },
  { key: 'taxPay', label: '完稅款', type: 'money', group: '付款', source: '期款' },
  { key: 'loan', label: '銀行貸款', type: 'money', group: '付款', aliases: ['預定貸款', '貸款'], source: '期款' },
  { key: 'handoverPay', label: '交屋款', type: 'money', group: '付款', source: '期款' },
];

export const PRINT_GROUPS = ['基本', '土地', '建物', '車位', '價款', '付款', '自訂'];

/** 付款欄位對應的期款：建案設定未指定時依期別名稱自動比對 */
export const PAYMENT_FIELDS = [
  { key: 'deposit', label: '定金', match: /訂金|定金/ },
  { key: 'signPay', label: '簽約款', match: /訂金|定金|簽約/ },
  { key: 'docPay', label: '備證款', match: /備證|用印/ },
  { key: 'taxPay', label: '完稅款', match: /完稅/ },
  { key: 'loan', label: '銀行貸款', match: /貸款/ },
  { key: 'handoverPay', label: '交屋款', match: /交屋/ },
];

export const PARKING_DEED_OPTIONS = ['無獨立權狀', '有獨立權狀'];

/** 建案層級自訂欄位（值存在建案設定）→ 欄位定義 */
export function customFieldDefs(config) {
  return (config?.customFields || [])
    .filter((f) => f && f.key && f.label)
    .map((f) => ({ key: f.key, label: f.label, type: f.type || 'text', group: '自訂', custom: true, source: '建案設定' }));
}

export function allPrintFields(config) {
  return [...PRINT_FIELDS, ...customFieldDefs(config)];
}

export function groupFields(fields) {
  return PRINT_GROUPS.map((g) => ({ group: g, fields: fields.filter((f) => f.group === g) })).filter((g) => g.fields.length);
}

// ── 小工具 ──
const str = (v) => (v === null || v === undefined ? '' : String(v).trim());
const num = (v) => {
  const n = toNumber(v);
  return n == null ? '' : n;
};
/** 萬 → 元（合約金額） */
const yuan = (wan) => {
  const n = toNumber(wan);
  return n == null ? '' : Math.round(n * 10000);
};

// 直轄市與縣、省轄市（不含縣轄市，避免「竹北市」被當成縣市）
const CITY_RE = /^([臺台](?:北|中|南|東)[市縣]|新北市|桃園市|高雄市|基隆市|新竹[市縣]|嘉義[市縣]|苗栗縣|彰化縣|南投縣|雲林縣|屏東縣|宜蘭縣|花蓮縣|澎湖縣|金門縣|連江縣)/;

/** 門牌拆解：新竹縣竹北市勝利十二街一段8巷3弄68號3樓之1 → 縣市／鄉鎮市區／街路／段巷弄／號樓 */
export function parseDoorplate(raw) {
  let rest = str(raw).replace(/\s+/g, '');
  const out = { city: '', district: '', street: '', lane: '', no: '' };
  if (!rest) return out;
  const city = rest.match(CITY_RE);
  if (city) {
    out.city = city[1];
    rest = rest.slice(city[1].length);
  }
  const district = rest.match(/^(.{1,4}?[鄉鎮市區])/);
  if (district) {
    out.district = district[1];
    rest = rest.slice(district[1].length);
  }
  const street = rest.match(/^(.*?(?:大道|路|街))/);
  if (street) {
    out.street = street[1];
    rest = rest.slice(street[1].length);
  }
  // 號之前（段、巷、弄）＝段巷弄；從門牌號碼開始＝號樓
  const no = rest.match(/^(.*?)([0-9０-９]+(?:[-－之][0-9０-９]+)?號.*)$/);
  if (no) {
    out.lane = no[1];
    out.no = no[2];
  } else {
    out.no = rest;
  }
  return out;
}

/** 段小段拆解：中正段一小段 → { section: '中正段', sub: '一小段' } */
export function splitSection(raw) {
  const s = str(raw);
  const m = s.match(/^(.*?段)(.+小段)?$/);
  if (!m) return { section: s, sub: '' };
  return { section: m[1], sub: m[2] || '' };
}

/** 權利範圍文字：全部／100000分之1234 */
function landShareText(p) {
  if (!p) return '';
  if (str(p.rightsType) === '全部') return '全部';
  const n = toNumber(p.rightsNumerator);
  const d = toNumber(p.rightsDenominator);
  if (n != null && d != null) return `${d}分之${n}`;
  return '';
}

/** 持分拆成分子／分母：2461、2461/100000、100000分之2461；無法解析回 null */
export function parseShare(raw) {
  const s = str(raw).replace(/\s+/g, '');
  if (!s) return null;
  let m = s.match(/^([0-9.]+)[/／]([0-9.]+)$/);
  if (m) return { num: Number(m[1]), den: Number(m[2]) };
  m = s.match(/^([0-9.]+)分之([0-9.]+)$/);
  if (m) return { num: Number(m[2]), den: Number(m[1]) };
  if (/^[0-9.]+$/.test(s)) return { num: Number(s), den: null };
  return null;
}
const round4 = (n) => Math.round(n * 10000) / 10000;
const shareOut = (num, den) => (den ? `${den}分之${num}` : String(num));

/** 共有部分持分：1525/100000、100000分之1525、或只有分子（以建案設定的分母補上） */
export function shareText(raw, den) {
  const s = str(raw).replace(/\s+/g, '');
  if (!s) return '';
  const slash = s.match(/^([0-9.]+)[/／]([0-9.]+)$/);
  if (slash) return `${slash[2]}分之${slash[1]}`;
  if (/分之/.test(s)) return s;
  const d = toNumber(den);
  if (/^[0-9.]+$/.test(s) && d) return `${d}分之${s}`;
  return s;
}

const PARK_TYPE = (type) => {
  const t = str(type);
  if (!t) return '';
  if (t.includes('法定')) return '法定停車位';
  if (t.includes('獎勵')) return '獎勵增設停車位';
  if (t.includes('增設') || t.includes('自設')) return '自行增設停車位';
  return '其他';
};
const PARK_STYLE = (type2) => {
  const t = str(type2);
  if (!t) return '';
  return t.includes('機械') ? '機械式' : '平面式';
};

/**
 * 期款名稱清單（建案設定的期款對應選單用）
 * @param {object} splitModel 合約製作的期款拆分結果
 */
export function installmentNames(splitModel) {
  return [...new Set((splitModel?.rows || []).map((r) => str(r.name)).filter(Boolean))];
}

/** 付款欄位對應到哪些期別（設定值 → 否則依名稱比對） */
export function paymentRowsFor(field, splitModel, config) {
  const rows = splitModel?.rows || [];
  const picked = config?.installmentMap?.[field.key];
  if (Array.isArray(picked) && picked.length) return rows.filter((r) => picked.includes(str(r.name)));
  return rows.filter((r) => field.match.test(str(r.name)));
}

/**
 * 組出本戶所有欄位值（金額單位：元）。
 * @param {object} p
 *   unitData   salesHouseholds 戶別資料
 *   priceModel 合約製作 buildPriceModel 結果（fullContext 含 total／landPrice／housePrice／parking，單位萬）
 *   splitModel 合約製作 buildSplitModel 結果（rows：各期 name／amount，單位萬）
 *   allParkings 建案全部車位（salesParkings）
 *   config     合約套印建案設定 contractPrintConfigs/{projectId}
 */
export function buildPrintValues({ unitData, priceModel, splitModel, allParkings, config }) {
  const d = unitData || {};
  const cfg = config || {};
  const v = {};

  v.unit = str(d.unitId);
  v.buyer = str(d.buyerName);
  v.building = str(d.building);
  v.floor = str(d.floor);
  v.doorplate = str(d.doorplate);

  // 土地（土地標的清冊，每筆一列）
  const parcels = Array.isArray(d.landParcels) ? d.landParcels : [];
  const sections = parcels.map((p) => splitSection(p.section));
  v.landCity = parcels.map((p) => str(p.city));
  v.landDistrict = parcels.map((p) => str(p.district));
  v.landSection = sections.map((s) => s.section);
  v.landSubsection = sections.map((s) => s.sub);
  v.landNo = parcels.map((p) => str(p.parcelNumber));
  v.landArea = parcels.map((p) => num(p.landAreaSqm));
  v.landShare = parcels.map(landShareText);
  v.landAreaTotal = num(cfg.landAreaTotalSqm);

  // 建物（登記資料）
  const addr = parseDoorplate(d.doorplate);
  v.buildNo = str(d.build_no);
  v.addrCity = addr.city;
  v.addrDistrict = addr.district;
  v.addrStreet = addr.street;
  v.addrLane = addr.lane;
  v.addrNo = addr.no;
  v.buildArea = num(d.area_reg_main_sqm);
  v.attachArea = num(d.area_reg_ancillary_sqm);
  v.commonArea = num(cfg.commonAreaSqm);
  v.commonBuildNo = str(cfg.commonBuildNo);

  // 車位：與合約製作相同的成交車位；屬性以 salesParkings 最新資料為準（持有車位快照可能過時）
  const parkings = Array.isArray(allParkings) ? allParkings : [];
  const freshById = new Map(parkings.map((p) => [str(p.spotId ?? p['車位編號']), p]));
  const spots = getOwnedParkingSpots(d, parkings).map((snap) => {
    const id = str(snap.spotId ?? snap['車位編號']);
    return { ...snap, ...(freshById.get(id) || {}), spotId: id, _price: parkingTransactionPrice(snap) };
  });
  const deedDefault = str(cfg.parkingDeedDefault);
  v.parkCount = spots.length || '';
  v.parkType = spots.map((p) => PARK_TYPE(p.type ?? p['車位類型']));
  v.parkStyle = spots.map((p) => PARK_STYLE(p.type2 ?? p['車位形式']));
  v.parkFloor = spots.map((p) => str(p.floor) || str(p.spotId).split('-')[0]);
  v.parkNo = spots.map((p) => {
    const n = str(p.number);
    if (n) return n;
    const parts = str(p.spotId).split('-');
    return parts.length > 1 ? parts.slice(1).join('-') : str(p.spotId);
  });
  v.parkDeed = spots.map((p) => {
    const t = str(p.deed_type)
    if (t.includes('無')) return '無獨立權狀'
    if (t.includes('有')) return '有獨立權狀'
    return t || deedDefault
  });
  v.parkArea = spots.map((p) => num(p.area));
  v.parkAreaPing = spots.map((p) => {
    const ping = toNumber(p.area_ping);
    if (ping != null) return ping;
    const sqm = toNumber(p.area);
    return sqm == null ? '' : Math.round(sqm * 0.3025 * 100) / 100;
  });
  v.parkPriceEach = spots.map((p) => yuan(p._price));

  // 共有部分持分：建案設定可把車位持分（每個 × 車位數）併入戶別持分，例 2461＋1502×1＝3963
  const unitShare = parseShare(d.common_share);
  const shareDen = unitShare?.den || toNumber(cfg.commonShareDen);
  const perParkShare = toNumber(cfg.parkingShare);
  const parkShareTotal = perParkShare != null && spots.length ? round4(perParkShare * spots.length) : null;
  v.parkShare = parkShareTotal == null ? '' : shareOut(parkShareTotal, shareDen);
  const canMerge = cfg.mergeParkingShare && parkShareTotal != null && (unitShare || !str(d.common_share));
  v.commonShare = canMerge
    ? shareOut(round4((unitShare?.num || 0) + parkShareTotal), shareDen)
    : shareText(d.common_share, cfg.commonShareDen);

  // 價款（合約製作的價款計算，單位萬 → 元）
  const ctx = priceModel?.fullContext || {};
  v.totalPrice = yuan(ctx.total);
  v.landPrice = yuan(ctx.landPrice);
  v.buildingPrice = yuan(Number.isFinite(Number(ctx.houseAmount)) ? ctx.houseAmount : ctx.housePrice);
  v.parkPrice = yuan(ctx.parking);

  // 付款（合約製作的期款）
  for (const f of PAYMENT_FIELDS) {
    const rows = paymentRowsFor(f, splitModel, cfg);
    v[f.key] = rows.length ? yuan(rows.reduce((s, r) => s + (Number(r.amount) || 0), 0)) : '';
  }

  // 建案層級自訂欄位
  for (const f of cfg.customFields || []) {
    if (f?.key) v[f.key] = f.value ?? '';
  }
  return v;
}

/** 取欄位值；清單欄位取第 index 筆（1 起算） */
export function valueAt(values, field, index = 1) {
  const raw = values?.[field];
  if (Array.isArray(raw)) return raw[(Number(index) || 1) - 1] ?? '';
  return raw ?? '';
}
