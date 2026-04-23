// 土地標的清冊欄位定義（Excel 匯入/匯出 + UI 共用）
// 每一戶可能有多筆土地資料，於戶別資料 Excel 的「土地標的清冊」工作表中
// 以 unitId 為 join key，一筆土地 = 一列。

import { CITIES, TOWNS } from './landOfficeCodeTable';

export const LAND_PARCEL_SHEET_NAME = '土地標的清冊';
export const HOUSEHOLDS_SHEET_NAME = '戶別資料';

// 權利範圍類型選項
export const RIGHTS_TYPE_OPTIONS = ['分別共有', '全部', '公同共有'];

// 都市土地使用分區選項（住 / 商 / 公 / 農 / 其他）
// 註：原本掛在「次類別名稱 (zoneCategory)」上，現移至「都市土地使用分區 (zoneText)」做 enum 驗證；
//     次類別名稱改為自由文字不再檢查。
export const ZONE_CATEGORY_OPTIONS = ['住', '商', '公', '農', '其他'];

// Excel 欄位順序與對應 key（匯入/匯出共用）
// - key: landParcel 物件內的欄位名稱；'unitId' 為特殊欄位，指向所屬戶別
// - title: Excel 表頭文字
// - type: 值型別（決定轉換邏輯）
//   - 'string' 原樣字串
//   - 'number' 可為數字或空
//   - 'enum'   必須在 enumOptions 之一或空
export const LAND_PARCEL_COLUMNS = [
  { key: 'unitId',            title: '戶別編號',            type: 'string', required: true },
  { key: 'city',              title: '縣市',                type: 'string' },
  { key: 'district',          title: '區域',                type: 'string' },
  { key: 'section',           title: '段小段',              type: 'string' },
  { key: 'parcelNumber',      title: '地號',                type: 'string' },
  { key: 'landAreaSqm',       title: '土地面積(m²)',        type: 'number' },
  { key: 'rightsType',        title: '權利範圍類型',        type: 'enum', enumOptions: RIGHTS_TYPE_OPTIONS },
  { key: 'rightsNumerator',   title: '權利範圍(分子)',      type: 'number' },
  { key: 'rightsDenominator', title: '權利範圍(分母)',      type: 'number' },
  { key: 'zoneCategory',      title: '次類別名稱',          type: 'string' },
  { key: 'zoneText',          title: '都市土地使用分區',    type: 'enum', enumOptions: ZONE_CATEGORY_OPTIONS },
];

// 給 SheetJS header 使用的純標題陣列（依序）
export const LAND_PARCEL_HEADERS = LAND_PARCEL_COLUMNS.map(c => c.title);

// 產生新土地列的預設物件（用於「新增土地」按鈕與匯入時 fallback）
export function createEmptyLandParcel() {
  return {
    id: `lp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    city: '',
    cityCode: '',
    district: '',
    districtCode: '',
    section: '',
    sectionCode: '',
    parcelNumber: '',
    landAreaSqm: null,
    rightsType: '',
    rightsNumerator: null,
    rightsDenominator: null,
    zoneCategory: '',
    zoneText: '',
  };
}

// 將一筆 landParcel 物件轉成 Excel 列（與 LAND_PARCEL_COLUMNS 順序一致）
// unitId 由外部傳入（不存在於 parcel 內）
export function landParcelToRow(parcel, unitId) {
  return LAND_PARCEL_COLUMNS.map(col => {
    if (col.key === 'unitId') return unitId || '';
    const v = parcel[col.key];
    if (v === null || v === undefined) return '';
    return v;
  });
}

// 將 Excel 一列（JSON 物件形式，key = 中文標題）轉成 landParcel 物件
// 回傳 { parcel, unitId, errors: string[] }
// errors 為該列的驗證錯誤訊息（非致命時仍回傳 parcel，讓匯入層決定是否整批拒絕）
export function rowToLandParcel(row, rowIndex) {
  const errors = [];
  const parcel = createEmptyLandParcel();
  let unitId = '';

  for (const col of LAND_PARCEL_COLUMNS) {
    const raw = row[col.title];
    const v = raw === null || raw === undefined ? '' : String(raw).trim();

    if (col.key === 'unitId') {
      unitId = v;
      if (!v) errors.push(`第 ${rowIndex} 列：戶別編號為必填`);
      continue;
    }

    if (v === '') {
      // 允許留空（依 SPEC 第 3.3 節）
      if (col.type === 'number') parcel[col.key] = null;
      else parcel[col.key] = '';
      continue;
    }

    if (col.type === 'number') {
      const num = Number(v);
      if (Number.isNaN(num)) {
        errors.push(`第 ${rowIndex} 列：${col.title} 欄位值「${v}」無法解析為數字`);
        parcel[col.key] = null;
      } else {
        parcel[col.key] = num;
      }
    } else if (col.type === 'enum') {
      if (!col.enumOptions.includes(v)) {
        errors.push(
          `第 ${rowIndex} 列：${col.title}「${v}」不是合法值（應為 ${col.enumOptions.join(' / ')}）`
        );
      }
      parcel[col.key] = v; // 即使錯誤仍保留值，由匯入層決定是否拒絕
    } else {
      parcel[col.key] = v;
    }
  }

  // ── 補齊 cityCode / districtCode：Excel 僅有名稱，依代碼表反查寫入 code ──
  // 段小段代碼 (sectionCode) 需依縣市非同步載入段清單才能反查，此處留空，
  // 由 LandDataEditor 於渲染時補上。
  if (parcel.city && !parcel.cityCode) {
    const code = lookupCityCode(parcel.city);
    if (code) parcel.cityCode = code;
  }
  if (parcel.cityCode && parcel.district && !parcel.districtCode) {
    const code = lookupDistrictCode(parcel.cityCode, parcel.district);
    if (code) parcel.districtCode = code;
  }

  return { parcel, unitId, errors };
}

// ── 同步反查工具 ──
function lookupCityCode(name) {
  if (!name) return '';
  const norm = String(name).replace(/臺/g, '台');
  const hit = CITIES.find(c => c.name === name || c.name.replace(/臺/g, '台') === norm);
  return hit?.code || '';
}

function lookupDistrictCode(cityCode, name) {
  if (!cityCode || !name) return '';
  const hit = TOWNS.find(t => t.cityCode === cityCode && t.name === name);
  return hit?.code || '';
}
