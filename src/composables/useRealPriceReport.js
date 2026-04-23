// 實價登錄申報 composable：讀/寫 Firestore + JSON 產生
import { ref } from 'vue';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import {
  MAIN_DATA_SCHEMA,
  LAND_DATA_SCHEMA,
  BUILD_DATA_SCHEMA,
  CAR_DATA_SCHEMA,
  JSON_KEYS,
  buildEmptyMainData,
  buildEmptyBuildData,
} from '@/constants/realPriceReportSchema';
import { CITIES, getTownsByCity } from '@/constants/landOfficeCodeTable';
import { computeHouseLandPrices, isSpecialContractType } from './usePriceFormula';

// ========== Firestore 路徑 ==========
function projectDocRef(projectId) {
  return doc(db, 'projects', projectId);
}
function unitDocRef(projectId, building, unitId) {
  return doc(db, 'projects', projectId, 'buildings', building, 'unitId', unitId);
}

// ========== 讀取：建案層級預設 ==========
export async function loadProjectRealPriceReport(projectId) {
  if (!projectId) throw new Error('缺少 projectId');
  const snap = await getDoc(projectDocRef(projectId));
  const raw = snap.exists() ? (snap.data().realPriceReport || {}) : {};
  return normalizeProjectSettings(raw);
}

// ========== 寫入：建案層級預設 ==========
export async function saveProjectRealPriceReport(projectId, settings, userEmail = '') {
  if (!projectId) throw new Error('缺少 projectId');
  const payload = {
    ...normalizeProjectSettings(settings),
    updatedAt: serverTimestamp(),
    updatedBy: userEmail || '',
  };
  await updateDoc(projectDocRef(projectId), {
    realPriceReport: payload,
  });
  return payload;
}

// ========== 讀取：戶別覆寫 ==========
export async function loadUnitRealPriceReport(projectId, building, unitId) {
  if (!projectId || !building || !unitId) return null;
  const snap = await getDoc(unitDocRef(projectId, building, unitId));
  if (!snap.exists()) return null;
  return snap.data().realPriceReport || null;
}

// ========== 寫入：戶別覆寫 ==========
export async function saveUnitRealPriceReport(projectId, building, unitId, overrides, userEmail = '') {
  if (!projectId || !building || !unitId) throw new Error('缺少 projectId/building/unitId');
  const payload = {
    mainOverrides: overrides.mainOverrides || {},
    landOverrides: overrides.landOverrides || [],
    buildOverrides: overrides.buildOverrides || {},
    carOverrides: overrides.carOverrides || [],
    signOverride: overrides.signOverride || {},
    lastExportedAt: serverTimestamp(),
    lastExportedBy: userEmail || '',
  };
  // setDoc + merge:true：文件不存在時會自動建立（updateDoc 若文件不存在會直接失敗）
  await setDoc(unitDocRef(projectId, building, unitId), {
    realPriceReport: payload,
  }, { merge: true });
  return payload;
}

// ========== 標準化建案層級設定 ==========
function normalizeProjectSettings(raw) {
  return {
    mainDefaults: { ...buildEmptyMainData(), ...(raw.mainDefaults || {}) },
    landDefaults: Array.isArray(raw.landDefaults) ? raw.landDefaults : [],
    buildDefaults: { ...buildEmptyBuildData(), ...(raw.buildDefaults || {}) },
    carDefaults: Array.isArray(raw.carDefaults) ? raw.carDefaults : [],
    signDefaults: raw.signDefaults || { defaultContractType: '一般合約' },
  };
}

// ========== 格式化工具 ==========
function toStr(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

// 西元日期 → 民國 YYYMMDD (7 碼固定：民國年補 0 至 3 碼 + 月 2 碼 + 日 2 碼)
// 支援格式：
//   - Firestore Timestamp 原生物件 (有 .toDate())
//   - JSON round-trip 後的 { seconds, nanoseconds } 或 { _seconds, _nanoseconds } 純物件
//   - Date 物件
//   - number (毫秒 epoch)
//   - ISO 字串 / "YYYY-MM-DD" / "YYYY/MM/DD" / "YYYY.MM.DD"
export function toROCDate(value) {
  if (!value) return '';
  let d;
  if (value && typeof value.toDate === 'function') {
    d = value.toDate();
  } else if (value instanceof Date) {
    d = value;
  } else if (typeof value === 'number') {
    d = new Date(value);
  } else if (typeof value === 'object' && value !== null &&
    (typeof value.seconds === 'number' || typeof value._seconds === 'number')) {
    // Firestore Timestamp 被 JSON.parse(JSON.stringify(...)) 深拷貝後會失去原型
    // 變成 { seconds, nanoseconds } (或底線版) 純物件 —— 仍需支援
    const sec = typeof value.seconds === 'number' ? value.seconds : value._seconds;
    d = new Date(sec * 1000);
  } else if (typeof value === 'string') {
    // 抓 YYYY[-/.]MM[-/.]DD 前綴，用本機時區構造 Date，避免 "2024-10-08" 被當 UTC 差一天
    const m = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) {
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    } else {
      d = new Date(value);
    }
  } else {
    return '';
  }
  if (!d || isNaN(d.getTime())) return '';
  const rocYear = d.getFullYear() - 1911;
  if (rocYear < 1) return '';   // 西元 1911 年以前不合申報格式
  const yyy = String(rocYear).padStart(3, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyy}${mm}${dd}`;
}

// 補 0 至 10 碼並格式化為 0000-000-000
export function formatPhone(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length !== 10) return String(phone);
  return digits.replace(/(\d{4})(\d{3})(\d{3})/, '$1-$2-$3');
}

// 樓層數字 → 3 碼字串 (17 → '017')
export function formatFloorCode(floor) {
  const n = Number(floor);
  if (!isFinite(n) || n <= 0) return '';
  return String(n).padStart(3, '0');
}

// 樓層數字 → 中文樓層 (17 → '十七層')
const CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
export function floorNumberToChinese(n) {
  const num = Number(n);
  if (!isFinite(num) || num <= 0) return '';
  if (num < 10) return `${CN_DIGITS[num]}層`;
  if (num === 10) return '十層';
  if (num < 20) return `十${CN_DIGITS[num - 10]}層`;
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${CN_DIGITS[tens]}十${ones === 0 ? '' : CN_DIGITS[ones]}層`;
}

// 從 unitId 推導樓層 ("C-17" → 17, "A3" → 3, "B-5F" → 5)
export function parseFloorFromUnitId(unitId) {
  if (!unitId) return null;
  const m = String(unitId).match(/(\d+)/);
  if (!m) return null;
  return Number(m[1]);
}

// 從 unitId 解析「號」部分 (C-17 → 17; A3 → 3; 若無數字則回傳原字串)
export function parseUnitNumber(unitId) {
  if (!unitId) return '';
  const m = String(unitId).match(/(\d+)\s*$/);
  return m ? m[1] : String(unitId);
}

// 物件類型（中文）→ 主要用途碼 (A=住家用 / B=商業用)
export function mapPropertyTypeToPurposeCode(propertyType) {
  if (!propertyType) return null;
  const t = String(propertyType);
  if (t.includes('住')) return { code: 'A', label: '住家用' };
  if (t.includes('商') || t.includes('店') || t.includes('辦公')) return { code: 'B', label: '商業用' };
  return null;
}

// 解析格局字串：如「4房2廳2衛」、「套房(1房1廳1衛)」、「無隔間」、「店面」
// 回傳 { rooms, livingRooms, bathrooms, noPartition } 或 null (無法解析)
export function parseLayoutString(layoutStr) {
  if (!layoutStr || typeof layoutStr !== 'string') return null;
  const result = {};
  const roomMatch = layoutStr.match(/(\d+)\s*房/);
  const hallMatch = layoutStr.match(/(\d+)\s*廳/);
  const bathMatch = layoutStr.match(/(\d+)\s*衛/);
  if (roomMatch) result.rooms = Number(roomMatch[1]);
  if (hallMatch) result.livingRooms = Number(hallMatch[1]);
  if (bathMatch) result.bathrooms = Number(bathMatch[1]);
  if (/無隔間/.test(layoutStr)) result.noPartition = true;
  return Object.keys(result).length > 0 ? result : null;
}

// ========== 自動映射：unitData → 主體資料欄位 ==========
export function autoMapMainFromUnit(unitData, projectDefaults = {}, extraContext = {}) {
  if (!unitData) return {};
  const mapped = {};

  // 系統內部固定欄位（使用者不需編輯，官方申報表單也是 hidden input）
  mapped.case_type = 'B1';     // B1 = 預售屋成交
  mapped.case_no = '';         // 由主管機關在申報時產生
  mapped.p1ma_caseSeq = '01';  // 同批序號，單戶匯出固定 01

  // ---- 買受人 ----
  if (unitData.buyerName) mapped.right_name = unitData.buyerName;
  if (unitData.buyerIdNumber) mapped.right_idNo = unitData.buyerIdNumber;
  if (unitData.buyerPhone) {
    // 可能為 "0980371014,0912345678" 多電話，取第一支
    const first = String(unitData.buyerPhone).split(',').map(s => s.trim()).filter(Boolean)[0] || '';
    if (first) mapped.right_tel = first;
  }
  if (unitData.buyerEmail) mapped.right_mail = unitData.buyerEmail;

  // 通訊地址：對應政府代碼表 (縣市/區域)；對應不到就留空讓使用者手選
  // 注意：地政事務所代碼表的「區域」不等於行政區，例如新竹市(O)在代碼表只有「新竹市」一個區域，
  //       UnitDetailModal 的「東區/北區/香山區」在代碼表中不存在，此時 right_x46 保持空白。
  if (unitData.buyerMailingAddressCity) {
    // 以名稱比對縣市（兼容「臺/台」異體）
    const normCity = String(unitData.buyerMailingAddressCity).replace(/臺/g, '台');
    const city = CITIES.find(c => c.name === unitData.buyerMailingAddressCity
      || c.name.replace(/臺/g, '台') === normCity);
    if (city) {
      mapped.right_x45 = city.code;
      mapped.right_x45c = city.name;
      if (unitData.buyerMailingAddressDistrict) {
        const towns = getTownsByCity(city.code);
        const normDist = String(unitData.buyerMailingAddressDistrict).replace(/臺/g, '台');
        const town = towns.find(t => t.name === unitData.buyerMailingAddressDistrict
          || t.name.replace(/臺/g, '台') === normDist);
        if (town) {
          mapped.right_x46 = town.code;
          mapped.right_x46c = town.name;
        }
        // 找不到對應 → right_x46 / right_x46c 皆留空
      }
    }
  }
  if (unitData.buyerMailingAddressDetail) mapped.right_addr = unitData.buyerMailingAddressDetail;

  // ---- 交易日期：簽約日期 (民國 YYYMMDD) ----
  if (unitData.payment_contract_date) {
    mapped.p1ma_date = toROCDate(unitData.payment_contract_date);
  }

  // ---- 格局 房/廳/衛：解析 unitData.layout 字串（如「4房2廳2衛」） ----
  const layout = parseLayoutString(unitData.layout);
  if (layout) {
    if (layout.rooms != null) mapped.p1ma_build1 = toStr(layout.rooms);
    if (layout.livingRooms != null) mapped.p1ma_build2 = toStr(layout.livingRooms);
    if (layout.bathrooms != null) mapped.p1ma_build3 = toStr(layout.bathrooms);
    if (layout.noPartition) mapped.p1ma_build4 = 'Y';
  }

  // ---- 主要用途：由 propertyType 推導 ----
  const purpose = mapPropertyTypeToPurposeCode(unitData.propertyType);
  if (purpose) {
    mapped.p1ma_build7 = purpose.code;
    mapped.p1ma_build7c = purpose.label;
  }

  // ---- 樓層推導：從 unitId 解析 ----
  const floor = parseFloorFromUnitId(unitData.unitId);
  if (floor) {
    mapped.p1ma_build10_1 = formatFloorCode(floor);
    mapped.p1ma_build10_1c = floorNumberToChinese(floor);
  }

  // ---- 建案名稱 / 棟 / 號 ----
  // 建案名稱：若使用者已在本案預設中設定，尊重使用者設定；否則才以 project.name 自動帶入
  if (extraContext.projectName && !projectDefaults?.mainDefaults?.p1ma_typeB_1) {
    mapped.p1ma_typeB_1 = extraContext.projectName;
  }
  if (unitData.building) mapped.p1ma_typeB_5 = unitData.building;
  if (unitData.unitId) mapped.p1ma_typeB_6 = parseUnitNumber(unitData.unitId);

  // ---- 備註 ----
  // 備註欄位 p1ma_note：不從 unitData.remarks 自動帶入，維持空值讓使用者手動填寫

  // ---- 金額：萬 → 元 ----
  const wan = (v) => {
    const n = Number(v);
    return isFinite(n) ? Math.round(n * 10000) : 0;
  };

  const parkingPrices = (unitData['持有車位'] || []).reduce((s, p) => s + wan(p['車位成交價']), 0);
  if (parkingPrices) mapped.p1ma_parkprice = toStr(parkingPrices);

  // 若 extraContext 有提供房土比公式 → 以公式計算房屋/土地價款（更精準）；
  // 否則沿用既有邏輯：house=price_transaction_house、land=total-house-parking
  if (extraContext.priceFormulas) {
    const r = computeHouseLandPrices(unitData, extraContext.priceFormulas);
    const housePriceWan = Number.isFinite(r.housePrice) ? r.housePrice : 0;
    const landPriceWan  = Number.isFinite(r.landPrice)  ? r.landPrice  : 0;
    const housePrice = wan(housePriceWan);  // 建物交易總價 = 房屋價款（公式結果）
    const landPrice  = wan(landPriceWan);   // 土地交易總價 = 土地價款（公式結果）
    // 不動產交易總價：
    //   特殊合約（毛胚/配套）→ 採「配套房屋總價」price_package_deal
    //   一般合約            → 採 price_transaction_total，若無則以 房屋+土地+車位 回推
    const isSpecial = isSpecialContractType(unitData?.contractType);
    const totalPriceWan = isSpecial
      ? (Number(unitData?.price_package_deal) || 0)
      : (Number(unitData?.price_transaction_total) || (housePriceWan + landPriceWan + (parkingPrices / 10000)));
    const totalPrice = wan(totalPriceWan);
    if (housePrice) mapped.p1ma_dbidprice = toStr(housePrice);
    if (landPrice)  mapped.p1ma_alidprice = toStr(landPrice);
    if (totalPrice) mapped.p1ma_totprice  = toStr(totalPrice);
  } else {
    const housePrice = wan(unitData.price_transaction_house);
    const totalPrice = housePrice + parkingPrices;
    if (housePrice) mapped.p1ma_dbidprice = toStr(housePrice);
    if (totalPrice) mapped.p1ma_totprice = toStr(totalPrice);
    if (totalPrice && (housePrice || parkingPrices)) {
      const land = totalPrice - housePrice - parkingPrices;
      if (land > 0) mapped.p1ma_alidprice = toStr(land);
    }
  }

  // ---- 車位個數 / flag / caseflag ----
  const parkingCount = (unitData['持有車位'] || []).length;
  mapped.p1ma_cntpark = toStr(parkingCount);
  mapped.p1ma_parkflag = parkingCount > 0 ? '0' : '2';
  mapped.caseflag = parkingCount > 0 ? '2' : '1';

  // 筆數
  mapped.p1ma_cntdbid = '1';
  // 土地筆數：優先以戶別 landParcels 為準，無則 fallback 建案預設
  const unitLandCount = Array.isArray(unitData.landParcels) ? unitData.landParcels.length : null;
  const landCount = unitLandCount != null ? unitLandCount : (projectDefaults.landDefaults || []).length;
  if (landCount > 0) mapped.p1ma_cntalid = toStr(landCount);
  else if (unitLandCount === 0) mapped.p1ma_cntalid = '0';

  return mapped;
}

// ========== 自動映射：unitData.landParcels → 土地資料 (LAND_DATA_SCHEMA) ==========
// 戶別的 landParcels 是新版資料來源（每戶獨立），取代原先「建案預設 landDefaults」作為土地資料的主要來源。
// 映射對照：landParcels 欄位 → LAND_DATA_SCHEMA key
const RIGHTS_TYPE_CODE_MAP = {
  '分別共有': 'X',
  '全部': 'A',
  '公同共有': 'B',
};
// 都市土地使用分區代碼 (參 LAND_DATA_SCHEMA land_use 註解)：1=住 2=商 3=工 4=農 5=其他
// 注意：landParcels 的 zoneText 採用「住/商/公/農/其他」；其中「公」(公共設施用地) 與實價登錄 3=工 不同，
//       對不上者留空由使用者於 ExportDialog 手動確認。
const ZONE_CATEGORY_CODE_MAP = {
  '住': '1',
  '商': '2',
  '農': '4',
  '其他': '5',
  // '公' 無對應代碼 → 留空
};

// 相容「臺/台」異體字的縣市名稱比對
function normalizeCityName(s) {
  return String(s || '').replace(/臺/g, '台');
}

export function autoMapLandDataFromUnit(unitData) {
  if (!unitData || !Array.isArray(unitData.landParcels)) return null;
  return unitData.landParcels.map(p => {
    // ── 縣市：雙向反查（code ↔ name），兼容 Excel 匯入或歷史資料只存其中一側的情況 ──
    let cityCode = p.cityCode || '';
    let cityName = p.city || '';
    if (!cityCode && cityName) {
      const norm = normalizeCityName(cityName);
      const c = CITIES.find(x => x.name === cityName || normalizeCityName(x.name) === norm);
      if (c) cityCode = c.code;
    } else if (cityCode && !cityName) {
      const c = CITIES.find(x => x.code === cityCode);
      if (c) cityName = c.name;
    }

    // ── 區域：依縣市反查代碼 ──
    let districtCode = p.districtCode || '';
    let districtName = p.district || '';
    if (cityCode && !districtCode && districtName) {
      const towns = getTownsByCity(cityCode);
      const t = towns.find(x => x.name === districtName);
      if (t) districtCode = t.code;
    } else if (cityCode && districtCode && !districtName) {
      const towns = getTownsByCity(cityCode);
      const t = towns.find(x => x.code === districtCode);
      if (t) districtName = t.name;
    }

    // ── 段小段：code ↔ name 的反查需要非同步載入段清單，於 LandDataEditor 的 loadSectionsForRow 中處理 ──
    return {
      land_x48:        p.sectionCode || '',
      land_x48c:       p.section || '',
      land_x45:        cityCode,
      land_x45c:       cityName,
      land_x46:        districtCode,
      land_x46c:       districtName,
      land_no:         p.parcelNumber || '',
      land_area:       p.landAreaSqm != null && p.landAreaSqm !== '' ? toStr(p.landAreaSqm) : '',
      land_right:      RIGHTS_TYPE_CODE_MAP[p.rightsType] || '',
      land_rightc:     p.rightsType || '',
      // 註：LAND_DATA_SCHEMA 欄位命名的 Deno/Nume 與實際 label (分子/分母) 相反，此處依 label 對應
      land_rightDeno:  p.rightsNumerator != null && p.rightsNumerator !== '' ? toStr(p.rightsNumerator) : '',
      land_rightNume:  p.rightsDenominator != null && p.rightsDenominator !== '' ? toStr(p.rightsDenominator) : '',
      // zoneText = 住/商/公/農/其他 (enum) → 對應 land_use 代碼與 land_usec 顯示名稱
      // zoneCategory = 自由文字 (如「第三種住宅區」) → 寫入 land_useText 次類別
      land_use:        ZONE_CATEGORY_CODE_MAP[p.zoneText] || '',
      land_usec:       p.zoneText || '',
      land_useText:    p.zoneCategory || '',
    };
  });
}

// ========== 自動映射：unitData → 建物資料 ==========
export function autoMapBuildFromUnit(unitData) {
  if (!unitData) return {};
  const mapped = {};
  if (unitData.area_main_sqm != null) mapped.build_areaM = toStr(unitData.area_main_sqm);
  if (unitData.area_ancillary_sqm != null) mapped.build_areaB = toStr(unitData.area_ancillary_sqm);
  if (unitData.area_common_sqm != null) mapped.build_areaP = toStr(unitData.area_common_sqm);
  return mapped;
}

// 車位類別代碼對照：salesParkings.type2（文字）→ 實價登錄 car_type（代碼）
// 代碼表：1=坡道平面 2=升降平面 3=坡道機械 4=升降機械 5=塔式車位 6=一樓平面 7=其他
const PARKING_TYPE2_TO_CODE = {
  '坡道平面': '1',
  '升降平面': '2',
  '坡道機械': '3',
  '升降機械': '4',
  '塔式車位': '5',
  '一樓平面': '6',
  // 以下未列於實價登錄類別，歸入「其他」
  '機械平面': '7',
  '機械升降': '7',
};
const PARKING_TYPE_NAMES = {
  '1': '坡道平面',
  '2': '升降平面',
  '3': '坡道機械',
  '4': '升降機械',
  '5': '塔式車位',
  '6': '一樓平面',
  '7': '其他',
};

function mapParkingTypeCode(type2Str) {
  const s = String(type2Str || '').trim();
  if (!s) return { code: '1', name: PARKING_TYPE_NAMES['1'] };  // 預設坡道平面
  const code = PARKING_TYPE2_TO_CODE[s];
  if (code) return { code, name: PARKING_TYPE_NAMES[code] };
  return { code: '7', name: PARKING_TYPE_NAMES['7'] };  // 無對應 → 其他
}

// 車位所在樓層代碼對照（實價登錄規範）
// 地下五樓含以下（B5、B6、B7...）一律歸為 B5
const PARKING_FLOOR_NAMES = {
  '0':  '無固定樓層',
  '1':  '一樓',
  '2':  '二樓含以上',
  'B1': '地下一樓',
  'B2': '地下二樓',
  'B3': '地下三樓',
  'B4': '地下四樓',
  'B5': '地下五樓含以下',
};

// 將 salesParkings 的 floor 字串（"B1"、"B6"、"1F"、"2" 等）轉為實價登錄的 { code, name }
export function mapParkingFloorCode(floorStr) {
  if (floorStr === null || floorStr === undefined || String(floorStr).trim() === '') {
    return { code: '0', name: PARKING_FLOOR_NAMES['0'] };
  }
  const s = String(floorStr).trim().toUpperCase();

  // 地下樓層：B1 ~ B4 依數字映射；B5 及以下（B5/B6/B7/...）一律歸 B5
  const bMatch = s.match(/^B(\d+)$/);
  if (bMatch) {
    const n = Number(bMatch[1]);
    const code = n >= 5 ? 'B5' : `B${n}`;
    return { code, name: PARKING_FLOOR_NAMES[code] };
  }

  // 地上樓層：1 / 1F → '1'（一樓）；2 以上 → '2'（二樓含以上）
  const numMatch = s.match(/^(\d+)F?$/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    if (n === 1) return { code: '1', name: PARKING_FLOOR_NAMES['1'] };
    if (n >= 2) return { code: '2', name: PARKING_FLOOR_NAMES['2'] };
  }

  // 無法識別的值 → 無固定樓層
  return { code: '0', name: PARKING_FLOOR_NAMES['0'] };
}

// ========== 自動映射：unitData → 車位資料 ==========
export function autoMapCarsFromUnit(unitData) {
  if (!unitData || !Array.isArray(unitData['持有車位'])) return [];
  return unitData['持有車位'].map(p => {
    const price = Number(p['車位成交價']);
    // 車位面積：優先使用 salesParkings 的 area 數值欄位（m²），fallback 空字串
    // （舊版誤以「車位尺寸」字串作為面積，此處改為正確的 area 欄位）
    const areaVal = p.area != null && p.area !== '' ? p.area : '';
    // 車位所在樓層：從 salesParkings.floor 推導實價登錄代碼
    const floorStr = p.floor ?? p['樓層'] ?? p['車位樓層'] ?? p['所在樓層'] ?? '';
    const floorInfo = mapParkingFloorCode(floorStr);
    // 車位類別：從 salesParkings.type2 推導實價登錄代碼
    const typeStr = p.type2 ?? p['車位形式'] ?? '';
    const typeInfo = mapParkingTypeCode(typeStr);
    return {
      // 非 Schema 欄位，僅供 UI 顯示車位編號，generateRealPriceReportJson 只取 CAR_DATA_SCHEMA 的 key，會自動排除
      _spotId: String(p.spotId || p['車位編號'] || '').trim(),
      car_type: typeInfo.code,
      car_typec: typeInfo.name,
      // 若對照不到而歸入「其他」，保留原始文字供實價登錄自訂欄位參考
      car_typeText: typeInfo.code === '7' ? String(typeStr || '').trim() : '',
      car_price: isFinite(price) ? toStr(Math.round(price * 10000)) : '',
      car_area: areaVal === '' ? '' : toStr(areaVal),
      car_floor: floorInfo.code,
      car_floorc: floorInfo.name,
    };
  });
}

// ========== 合併邏輯：建案預設 + 自動映射 + 戶別覆寫 ==========
export function mergeRealPriceReportData({ projectSettings, unitData, unitOverrides, relationFlag, extraContext }) {
  const defaults = normalizeProjectSettings(projectSettings || {});
  const overrides = unitOverrides || {};

  // 主體資料
  const mainAuto = autoMapMainFromUnit(unitData, defaults, extraContext || {});
  const mainData = {
    ...defaults.mainDefaults,
    ...mainAuto,
    ...(overrides.mainOverrides || {}),
  };
  // 親友關係 (由對話框控制)
  mainData.p1sp_code0201 = relationFlag ? 'Y' : '';
  // 毛胚屋 (依簽約類型)
  // 優先級：戶別覆寫 > 戶別實際合約方式 (unitData.contractType) > 建案預設
  const contractType = overrides.signOverride?.contractType
    || unitData?.contractType
    || defaults.signDefaults.defaultContractType;
  if (contractType === '毛胚合約') mainData.p1sp_code0505 = 'Y';

  // 土地資料：優先取戶別的 landParcels（每戶獨立），無則 fallback 建案預設 landDefaults
  // 覆寫（landOverrides）仍按 index 疊加於基底之上
  const landDefaults = Array.isArray(defaults.landDefaults) ? defaults.landDefaults : [];
  const landOverrides = Array.isArray(overrides.landOverrides) ? overrides.landOverrides : [];
  const landAuto = autoMapLandDataFromUnit(unitData);
  const landBase = (landAuto && landAuto.length > 0) ? landAuto : landDefaults;
  const landCount = Math.max(landBase.length, landOverrides.length);
  const landData = [];
  for (let i = 0; i < landCount; i++) {
    landData.push({
      ...(landBase[i] || {}),
      ...(landOverrides[i] || {}),
    });
  }

  // 建物資料：預設 + 自動映射 + 覆寫
  const buildAuto = autoMapBuildFromUnit(unitData);
  const buildData = {
    ...defaults.buildDefaults,
    ...buildAuto,
    ...(overrides.buildOverrides || {}),
  };

  // 車位資料：自動映射為基準，按 index 套用覆寫
  const carAuto = autoMapCarsFromUnit(unitData);
  const carOverrides = Array.isArray(overrides.carOverrides) ? overrides.carOverrides : [];
  const carCount = Math.max(carAuto.length, carOverrides.length);
  // 合法代碼集：偵測舊資料把名稱誤存入代碼欄位（反之亦然）時，改採 autoMap 正確值
  const VALID_CAR_TYPE_CODES  = new Set(['1', '2', '3', '4', '5', '6', '7']);
  const VALID_CAR_FLOOR_CODES = new Set(['0', '1', '2', 'B1', 'B2', 'B3', 'B4', 'B5']);
  const carData = [];
  for (let i = 0; i < carCount; i++) {
    const auto = carAuto[i] || {};
    const row = {
      ...auto,
      ...(carOverrides[i] || {}),
    };
    // 修正：若 car_type 不是合法代碼（例如舊資料存了 "坡道平面"），改採 autoMap 的代碼與名稱
    if (row.car_type && !VALID_CAR_TYPE_CODES.has(String(row.car_type))) {
      row.car_type  = auto.car_type  || '';
      row.car_typec = auto.car_typec || '';
    }
    // 同樣處理 car_floor
    if (row.car_floor && !VALID_CAR_FLOOR_CODES.has(String(row.car_floor))) {
      row.car_floor  = auto.car_floor  || '';
      row.car_floorc = auto.car_floorc || '';
    }
    // 僅保留有填 car_type 的列
    if (row.car_type) carData.push(row);
  }

  return { mainData, landData, buildData, carData };
}

// ========== JSON 產生 (符合內政部格式) ==========
export function generateRealPriceReportJson({ mainData, landData, buildData, carData }) {
  // 格式化 right_tel
  const main = { ...mainData };
  if (main.right_tel) main.right_tel = formatPhone(main.right_tel);

  // 所有值轉成字串（依原腳本：number → string）
  const stringifyAll = (obj) => {
    const out = {};
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      out[k] = (v === null || v === undefined) ? '' :
        (typeof v === 'number' ? v.toString() : v);
    });
    return out;
  };

  // 主體：只保留 Schema 內的欄位，維持順序
  const mainOut = {};
  MAIN_DATA_SCHEMA.forEach(f => {
    const v = main[f.key];
    mainOut[f.key] = (v === null || v === undefined) ? '' :
      (typeof v === 'number' ? v.toString() : v);
  });

  const result = { [JSON_KEYS.MAIN]: mainOut };

  // 土地資料
  if (Array.isArray(landData) && landData.length > 0) {
    result[JSON_KEYS.LAND] = landData.map((row, i) => {
      const obj = { land_SEQ: String(i + 1) };
      LAND_DATA_SCHEMA.forEach(f => {
        const v = row[f.key];
        obj[f.key] = (v === null || v === undefined) ? '' :
          (typeof v === 'number' ? v.toString() : v);
      });
      return obj;
    });
  }

  // 建物資料：空值 (null/undefined/空字串) 一律輸出 '0'
  // 上游 BuildTableEditor 已會在載入/失焦/新增時補 0，但舊資料或繞過編輯器的路徑仍可能漏掉，
  // 在匯出層做最後保險，確保 JSON 的 build_area* 欄位永遠為數值字串。
  const buildOut = { build_SEQ: '1' };
  BUILD_DATA_SCHEMA.forEach(f => {
    const v = buildData ? buildData[f.key] : '';
    if (v === null || v === undefined || String(v).trim() === '') {
      buildOut[f.key] = '0';
    } else {
      buildOut[f.key] = typeof v === 'number' ? v.toString() : v;
    }
  });
  result[JSON_KEYS.BUILD] = [buildOut];

  // 車位資料（無車位時不輸出）
  if (Array.isArray(carData) && carData.length > 0) {
    result[JSON_KEYS.CAR] = carData.map((row, i) => {
      const obj = { car_SEQ: String(i + 1) };
      CAR_DATA_SCHEMA.forEach(f => {
        const v = row[f.key];
        obj[f.key] = (v === null || v === undefined) ? '' :
          (typeof v === 'number' ? v.toString() : v);
      });
      return obj;
    });
  }

  return result;
}

// ========== 瀏覽器下載 .zip（內含 JSON 檔） ==========
// fileName 可為 "xxx.json"（保留與舊呼叫者相容），會改為 "xxx.zip" 並在 ZIP 內放入同名 json
export async function downloadRealPriceReportJson(jsonData, fileName) {
  const JSZip = (await import('jszip')).default;
  const json = JSON.stringify(jsonData, null, 2);

  const baseName = String(fileName || 'real-price-report').replace(/\.(json|zip)$/i, '');
  const innerJsonName = `${baseName}.json`;
  const zipName = `${baseName}.zip`;

  const zip = new JSZip();
  zip.file(innerJsonName, json);
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ========== Composable：封裝狀態 ==========
export function useRealPriceReport(projectId) {
  const settings = ref(null);
  const loading = ref(false);
  const saving = ref(false);

  async function load() {
    loading.value = true;
    try {
      settings.value = await loadProjectRealPriceReport(projectId);
    } finally {
      loading.value = false;
    }
  }

  async function save(newSettings, userEmail) {
    saving.value = true;
    try {
      await saveProjectRealPriceReport(projectId, newSettings, userEmail);
      settings.value = normalizeProjectSettings(newSettings);
    } finally {
      saving.value = false;
    }
  }

  return { settings, loading, saving, load, save };
}
