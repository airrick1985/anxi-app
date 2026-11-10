/**
 * 交屋控管表（驗屋預約 › 戶別資料管理）— 純邏輯模組
 * 規格：docs/SPEC_HandoverControlBoard.md
 *
 * 輸入沿用 HouseholdGrid 的 rowData（households ＋ _bookingInfo），不另查資料。
 */

const HANDOVER_KEYWORD = '交屋';

// ───────────── 進度項目 ─────────────

/** 預約項目名稱的預設排序權重：初驗 → 其他驗 → 複驗 → 交屋 */
function stageRank(title) {
  if (title.includes('初驗')) return 0;
  if (title.includes('複驗')) return 2;
  if (title.includes(HANDOVER_KEYWORD)) return 3;
  return 1;
}

/** 建案目前可用的預約項目（未刪除、有名稱，依選單順序、去重） */
export function bookingMenuTitles(projectConfig) {
  const menu = Array.isArray(projectConfig?.bookingMenu) ? projectConfig.bookingMenu : [];
  const titles = [];
  for (const item of menu) {
    const title = item && !item.deleted ? String(item.title || '').trim() : '';
    if (title && !titles.includes(title)) titles.push(title);
  }
  // 舊建案只有 bookingTypes（字串陣列）、沒有 bookingMenu
  if (titles.length === 0 && Array.isArray(projectConfig?.bookingTypes)) {
    for (const t of projectConfig.bookingTypes) {
      const title = String(t || '').trim();
      if (title && !titles.includes(title)) titles.push(title);
    }
  }
  return titles;
}

/** 預設進度項目：名稱含「驗」或「交屋」，依權重排序；一個都沒有時列入全部 */
export function defaultStageTitles(menuTitles) {
  const matched = menuTitles
    .map((title, index) => ({ title, index }))
    .filter(({ title }) => title.includes('驗') || title.includes(HANDOVER_KEYWORD));
  if (matched.length === 0) return [...menuTitles];
  return matched
    .sort((a, b) => stageRank(a.title) - stageRank(b.title) || a.index - b.index)
    .map(item => item.title);
}

/**
 * 進度項目清單 [{ key, label, virtual }]
 * settings.stages 有值時照設定（只留仍存在的預約項目）；沒有交屋項目時補一個虛擬「交屋」對應交屋開關
 */
export function resolveStages(projectConfig, settings) {
  const menuTitles = bookingMenuTitles(projectConfig);
  const chosen = Array.isArray(settings?.stages)
    ? settings.stages.filter(title => menuTitles.includes(title))
    : defaultStageTitles(menuTitles);
  const stages = chosen.map(title => ({ key: title, label: title, virtual: false }));
  if (!stages.some(s => s.key.includes(HANDOVER_KEYWORD))) {
    stages.push({ key: HANDOVER_KEYWORD, label: HANDOVER_KEYWORD, virtual: true });
  }
  return stages;
}

/** 交屋開關對應的進度項目 key：名稱剛好是「交屋」優先，其次最後一個含「交屋」的項目 */
export function handoverStageKey(stages) {
  if (stages.some(s => s.key === HANDOVER_KEYWORD)) return HANDOVER_KEYWORD;
  const list = stages.filter(s => s.key.includes(HANDOVER_KEYWORD));
  return list.length > 0 ? list[list.length - 1].key : HANDOVER_KEYWORD;
}

// ───────────── 狀態與顏色 ─────────────

// macOS 系統色淡色系：[已約, 已完成]
const STAGE_PALETTES = {
  blue: ['#DCEBFF', '#9DC6FF'],
  purple: ['#EFE1FA', '#D2ACF0'],
  green: ['#D9F3DF', '#7FD992'],
  orange: ['#FFE6CC', '#FFBF80'],
  teal: ['#D6F0F5', '#8DD3E0'],
  indigo: ['#E2E1FA', '#ADA9F0'],
  pink: ['#FFDDE4', '#FF9FB3'],
  yellow: ['#FFF4C2', '#FFDD57'],
};
const STAGE_PALETTE_ORDER = ['blue', 'purple', 'orange', 'teal', 'indigo', 'pink', 'yellow'];

export const BASE_STATUS_COLORS = {
  unsold: '#E5E5EA',
  pending: '#FFF1D2',
};

/** 狀態清單（圖例順序）[{ key, label, kind, stageKey }] */
export function buildStatusList(stages) {
  const hasInspection = stages.some(s => !s.virtual && s.key.includes('驗'));
  const list = [
    { key: 'unsold', label: '未售', kind: 'unsold', stageKey: null },
    { key: 'pending', label: hasInspection ? '未驗' : '未開始', kind: 'pending', stageKey: null },
  ];
  for (const s of stages) {
    if (!s.virtual) list.push({ key: `booked:${s.key}`, label: `已約${s.label}`, kind: 'booked', stageKey: s.key });
    list.push({ key: `done:${s.key}`, label: `已${s.label}`, kind: 'done', stageKey: s.key });
  }
  return list;
}

/** 各狀態預設色（交屋固定綠色，其他項目依序取色盤） */
export function defaultStatusColors(stages) {
  const colors = { ...BASE_STATUS_COLORS };
  const handoverKey = handoverStageKey(stages);
  let paletteIndex = 0;
  for (const s of stages) {
    let palette;
    if (s.key === handoverKey) {
      palette = STAGE_PALETTES.green;
    } else {
      palette = STAGE_PALETTES[STAGE_PALETTE_ORDER[paletteIndex % STAGE_PALETTE_ORDER.length]];
      paletteIndex += 1;
    }
    colors[`booked:${s.key}`] = palette[0];
    colors[`done:${s.key}`] = palette[1];
  }
  return colors;
}

/** 調色盤（設定與就地改色共用） */
export const COLOR_PRESETS = [
  '#E5E5EA', '#C7C7CC', '#8E8E93', '#FFFFFF',
  '#FFF1D2', '#FFE6CC', '#FFBF80', '#FF9F0A',
  '#FFF4C2', '#FFDD57', '#FFCC00', '#FFDDE4',
  '#FF9FB3', '#FF6482', '#FFD6D3', '#FF8A80',
  '#D9F3DF', '#7FD992', '#34C759', '#D6F0F5',
  '#8DD3E0', '#30B0C7', '#DCEBFF', '#9DC6FF',
  '#0A84FF', '#E2E1FA', '#ADA9F0', '#5E5CE6',
  '#EFE1FA', '#D2ACF0', '#BF5AF2', '#1D1D1F',
];

const HEX_RE = /^#[0-9a-f]{6}$/i;

export function normalizeHex(value) {
  const v = String(value || '').trim();
  if (HEX_RE.test(v)) return v.toUpperCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`.toUpperCase();
  return null;
}

/** 合併使用者自訂色（只接受合法 hex） */
export function resolveStatusColors(stages, settings) {
  const colors = defaultStatusColors(stages);
  const custom = settings?.colors && typeof settings.colors === 'object' ? settings.colors : {};
  for (const key of Object.keys(colors)) {
    const hex = normalizeHex(custom[key]);
    if (hex) colors[key] = hex;
  }
  return colors;
}

/** 相對亮度（0 黑 ~ 1 白） */
export function luminance(hex) {
  const h = normalizeHex(hex);
  if (!h) return 1;
  const channel = (i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** 進度條用色：太淺的狀態色（如未驗淡琥珀）在白底看不見，依比例往黑色混合加深 */
export function barColor(hex) {
  const h = normalizeHex(hex) || '#8E8E93';
  const lum = luminance(h);
  if (lum < 0.6) return h;
  const k = lum > 0.85 ? 0.32 : 0.18;
  const mix = (i) => Math.round(parseInt(h.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0');
  return `#${mix(1)}${mix(3)}${mix(5)}`.toUpperCase();
}

/** 依底色亮度決定文字顏色（WCAG 相對亮度） */
export function textColorFor(hex) {
  if (!normalizeHex(hex)) return '#1D1D1F';
  const lum = luminance(hex);
  // 門檻略高於 WCAG 黑白對比交叉點（0.18），讓系統藍、紫等飽和色維持 macOS 慣用的白字
  return lum < 0.32 ? '#FFFFFF' : '#1D1D1F';
}

// ───────────── 每戶狀態 ─────────────

export function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val?.toDate === 'function') return val.toDate();
  if (typeof val?.seconds === 'number') return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** 某戶某項目的所有有效預約（相容舊資料沒有 all 陣列） */
function bookingsOf(household, type) {
  const info = household?._bookingInfo?.[type];
  if (!info) return [];
  if (Array.isArray(info.all) && info.all.length > 0) return info.all;
  return info.appointmentId || info.date ? [info] : [];
}

function hasAnyBooking(household) {
  const info = household?._bookingInfo;
  if (!info || typeof info !== 'object') return false;
  return Object.keys(info).some(type => bookingsOf(household, type).length > 0);
}

/** 交屋開關（舊匯入資料可能是字串 "TRUE"／"FALSE"） */
export function isHandoverOn(household) {
  const v = household?.['交屋'];
  return v === true || (typeof v === 'string' && v.trim().toUpperCase() === 'TRUE');
}

export function isSold(household) {
  if (String(household?.buyerName || '').trim()) return true;
  if (isHandoverOn(household)) return true;
  return hasAnyBooking(household);
}

/**
 * 某戶在各進度項目的進展
 * @returns {{ [stageKey]: { done: boolean, booked: boolean, nextDate: Date|null, lastDate: Date|null } }}
 */
export function stageProgress(household, stages, today = new Date()) {
  const todayStart = startOfDay(today).getTime();
  const out = {};
  for (const s of stages) {
    let done = false;
    let booked = false;
    let nextDate = null;
    let lastDate = null;
    // 虛擬「交屋」項目只對應交屋開關；交屋預約項目沒列入進度（或已刪除）時不讀它的預約
    const list = s.virtual ? [] : bookingsOf(household, s.key);
    for (const bk of list) {
      const d = toDate(bk.date);
      const isPast = d ? startOfDay(d).getTime() < todayStart : false;
      if (bk.status === '已完成' || (bk.status === '預約中' && isPast)) {
        done = true;
        if (d && (!lastDate || d > lastDate)) lastDate = d;
      } else if (bk.status === '預約中' || !bk.status) {
        booked = true;
        if (d && (!nextDate || d < nextDate)) nextDate = d;
      }
    }
    out[s.key] = { done, booked, nextDate, lastDate };
  }
  return out;
}

/** 某戶目前狀態 key（規格 §3） */
export function deriveStatus(household, stages, progress) {
  if (!isSold(household)) return 'unsold';
  if (isHandoverOn(household)) return `done:${handoverStageKey(stages)}`;
  for (let i = stages.length - 1; i >= 0; i -= 1) {
    const p = progress[stages[i].key];
    if (!p) continue;
    if (p.booked) return `booked:${stages[i].key}`;
    if (p.done) return `done:${stages[i].key}`;
  }
  return 'pending';
}

// ───────────── 戶號解析與矩陣 ─────────────

const SHOP_BUILDING_RE = /^S\d*$/i;

/** 棟線代號比對：忽略大小寫與數字前導 0（A01＝A1） */
const normalizeLine = (v) => String(v).trim().toUpperCase().replace(/(^|\D)0+(?=\d)/g, '$1');
const sameLine = (a, b) => normalizeLine(a) === normalizeLine(b);
const SHOP_UNIT_RE = /^S[-_\s]/i;

function parseFloorNumber(value) {
  const m = String(value ?? '').trim().match(/^(\d{1,3})\s*F?$/i);
  if (!m) return null;
  const n = Number(m[1]);
  return n > 0 ? n : null;
}

/**
 * 解析戶別在矩陣中的位置
 * @returns {{ type: 'grid', col: string, floor: number } | { type: 'special', group: 'shop'|'other' }}
 */
export function parseUnitPosition(household) {
  const unitId = String(household?.unitId || '').trim();
  const building = String(household?.building || '').trim();
  if (SHOP_BUILDING_RE.test(building) || SHOP_UNIT_RE.test(unitId)) return { type: 'special', group: 'shop' };

  let col = '';
  let floor = null;
  let m = unitId.match(/^(\d{1,3})F[-_\s]*(.+)$/i); // 2F-A3
  if (m) {
    floor = Number(m[1]);
    col = m[2];
  } else {
    m = unitId.match(/^(.+?)[-_\s]+(\d{1,3})F?$/i); // A1-03、A1-2F
    if (m) {
      col = m[1];
      floor = Number(m[2]);
    }
  }
  if (!floor) floor = parseFloorNumber(household?.['樓層'] ?? household?.floor);
  // 棟線以戶號拆出的為準（棟別可能只填棟名 A／B）；與棟別相同（A01＝A1）時用棟別顯示
  if (building && (!col || sameLine(col, building))) col = building;
  if (!col || !floor || floor <= 0) return { type: 'special', group: 'other' };
  return { type: 'grid', col, floor };
}

const naturalCompare = (a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true, sensitivity: 'base' });

/** 棟名（棟線代號開頭的英文字母，例 A1 → A、B10 → B） */
export function towerOf(col) {
  const m = String(col).match(/^[A-Za-z]+/);
  return m ? m[0].toUpperCase() : String(col);
}

/**
 * 建立控管表模型
 * @param {object[]} households HouseholdGrid rowData
 * @param {object} projectConfig 建案設定（bookingMenu、handoverBoard）
 * @param {Date} [today]
 */
export function buildHandoverBoard(households, projectConfig, today = new Date(), customFieldDefs = []) {
  const settings = projectConfig?.handoverBoard || {};
  const stages = resolveStages(projectConfig, settings);
  const statusList = buildStatusList(stages);
  const colors = resolveStatusColors(stages, settings);

  const units = [];
  for (const h of Array.isArray(households) ? households : []) {
    if (!h || !h.unitId) continue;
    const progress = stageProgress(h, stages, today);
    const status = deriveStatus(h, stages, progress);
    const kindStage = status.includes(':') ? status.slice(status.indexOf(':') + 1) : null;
    const nextDate = status.startsWith('booked:') ? progress[kindStage]?.nextDate || null : null;
    units.push({
      docId: h._docId || null,
      unitId: String(h.unitId),
      buyerName: String(h.buyerName || '').trim(),
      status,
      nextDate,
      progress,
      position: parseUnitPosition(h),
      household: h,
    });
  }

  // 矩陣欄（棟線）與列（樓層）
  const gridUnits = units.filter(u => u.position.type === 'grid');
  const cols = [...new Set(gridUnits.map(u => u.position.col))].sort(naturalCompare);
  const floors = [...new Set(gridUnits.map(u => u.position.floor))].sort((a, b) => b - a);
  const cellMap = {};
  for (const u of gridUnits) {
    const key = `${u.position.floor}|${u.position.col}`;
    // 同格重複（資料異常）時保留第一筆，其餘放到「其他」
    if (cellMap[key]) u.position = { type: 'special', group: 'other' };
    else cellMap[key] = u;
  }

  const towerMap = new Map();
  for (const col of cols) {
    const tower = towerOf(col);
    if (!towerMap.has(tower)) towerMap.set(tower, []);
    towerMap.get(tower).push(col);
  }
  const towers = [...towerMap.entries()].map(([name, list]) => ({ name, cols: list }));
  const showTowerHeader = towers.length > 1 && towers.some(t => t.cols.length > 1);

  const specialUnits = units
    .filter(u => u.position.type === 'special')
    .sort((a, b) => naturalCompare(a.unitId, b.unitId));
  const specialLabel = specialUnits.length > 0 && specialUnits.every(u => u.position.group === 'shop') ? '店面' : '其他';

  return {
    stages,
    statusList,
    colors,
    units,
    cols,
    floors,
    towers,
    showTowerHeader,
    cellMap,
    specialUnits,
    specialLabel,
    stats: computeStats(units, stages, statusList, settings, customFieldDefs),
  };
}

// ───────────── 統計 ─────────────

const pct = (n, d) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

function hasValue(v) {
  if (v === null || v === undefined || v === false) return false;
  // 自訂勾選欄位經 Excel 上傳可能存成字串 "FALSE"
  if (typeof v === 'string') return v.trim() !== '' && v.trim().toUpperCase() !== 'FALSE';
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

/** 自訂欄位的資料鍵：fieldKey（欄位可改名，資料仍在原 key 底下）；舊資料沒有 fieldKey 時＝fieldName */
export function customFieldDataKey(def) {
  return String(def?.fieldKey || def?.fieldName || '').trim();
}

/** 附加統計可選項目（撥款日＋自訂欄位）：key 為資料鍵、label 為目前顯示名稱 */
export function extraStatOptions(customFieldDefs) {
  const options = [{ key: 'appropriationDate', label: '已撥款' }];
  for (const def of Array.isArray(customFieldDefs) ? customFieldDefs : []) {
    const key = customFieldDataKey(def);
    if (!key || key === '交屋' || options.some(o => o.key === key)) continue;
    options.push({ key, label: String(def?.fieldName || key).trim() });
  }
  return options;
}

export function resolveExtraStats(settings) {
  return Array.isArray(settings?.extraStats) ? settings.extraStats.filter(k => typeof k === 'string' && k) : ['appropriationDate'];
}

export function computeStats(units, stages, statusList, settings = {}, customFieldDefs = []) {
  const total = units.length;
  const sold = units.filter(u => u.status !== 'unsold');
  const soldCount = sold.length;
  const statusCounts = Object.fromEntries(statusList.map(s => [s.key, 0]));
  for (const u of units) statusCounts[u.status] = (statusCounts[u.status] || 0) + 1;

  const handoverKey = handoverStageKey(stages);
  const inspectionStages = stages.filter(s => !s.virtual && s.key.includes('驗'));
  const inspected = sold.filter(u => inspectionStages.some(s => u.progress[s.key]?.done)).length;
  const handedOver = statusCounts[`done:${handoverKey}`] || 0;

  const stageStats = stages.map(s => {
    const done = sold.filter(u => (s.key === handoverKey && isHandoverOn(u.household)) || u.progress[s.key]?.done).length;
    const booked = sold.filter(u => u.progress[s.key]?.booked && !(s.key === handoverKey && isHandoverOn(u.household))).length;
    return { key: s.key, label: s.label, virtual: s.virtual, done, booked, donePct: pct(done, soldCount) };
  });

  const labelOf = Object.fromEntries(extraStatOptions(customFieldDefs).map(o => [o.key, o.label]));
  const extra = resolveExtraStats(settings).map(key => {
    const count = units.filter(u => hasValue(u.household?.[key])).length;
    return { key, label: labelOf[key] || key, count };
  });

  const pending = statusCounts.pending || 0;
  return {
    total,
    sold: soldCount,
    unsold: total - soldCount,
    soldPct: pct(soldCount, total),
    unsoldPct: pct(total - soldCount, total),
    pending,
    pendingPct: pct(pending, soldCount),
    inspected,
    inspectedPct: pct(inspected, soldCount),
    hasInspection: inspectionStages.length > 0,
    handedOver,
    handedOverPct: pct(handedOver, soldCount),
    statusCounts,
    stageStats,
    extra,
  };
}

/** M/D 簡短日期 */
export function shortDate(d) {
  const x = toDate(d);
  return x ? `${x.getMonth() + 1}/${x.getDate()}` : '';
}

/** 進度 KPI（畫面與圖片共用）：已售未驗、已驗戶、交屋戶數，占已售 % */
export function boardKpis(board) {
  const s = board.stats;
  const handoverKey = handoverStageKey(board.stages);
  const firstInspection = board.stages.find(st => !st.virtual && st.key.includes('驗'));
  const list = [
    { label: s.hasInspection ? '已售未驗' : '已售未開始', count: s.pending, pct: s.pendingPct, color: board.colors.pending },
  ];
  if (s.hasInspection && firstInspection) {
    list.push({ label: '已驗戶', count: s.inspected, pct: s.inspectedPct, color: board.colors[`done:${firstInspection.key}`] });
  }
  list.push({ label: '交屋戶數', count: s.handedOver, pct: s.handedOverPct, color: board.colors[`done:${handoverKey}`] });
  return list;
}
