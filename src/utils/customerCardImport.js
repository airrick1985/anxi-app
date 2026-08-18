// 客戶資料卡導入銷控 — 共用純函式
// SPEC: docs/local/SPEC_客戶資料卡導入銷控.md
// 職責：認定哪些自訂表單是「客戶資料卡」、將客製表單欄位對應到銷控買方欄位、型別轉換（日期/地址/電話）
import TwCities from '@/assets/TwCities.json';

// 表單標題含以下關鍵字即自動視為客戶資料卡（isCustomerDataCard 明確設定時優先）
export const CARD_KEYWORDS = ['客戶資料卡', '客資卡', '客戶資料', '客戶基本資料'];

export function isCustomerDataCardForm(form) {
  if (!form) return false;
  if (form.isCustomerDataCard === true) return true;
  if (form.isCustomerDataCard === false) return false;
  const title = String(form.title || '');
  return CARD_KEYWORDS.some(kw => title.includes(kw));
}

// 版面元件不參與欄位對應
const NON_INPUT_TYPES = ['header', 'description', 'divider', 'link'];

// 目標欄位對應規則：systemKey 完全比對優先，其次依 keywords 順序做 label 模糊比對
// exclude：label 含排除詞者不參與該目標欄位比對（避免「代理人姓名」誤配買方姓名）
const TARGET_RULES = {
  name: {
    systemKey: 'buyerName',
    keywords: ['買方姓名', '客戶姓名', '姓名'],
    exclude: ['代理', '緊急', '介紹', '銷售', '監護'],
  },
  phone: {
    systemKey: 'buyerPhone',
    keywords: ['聯絡電話', '手機', '電話'],
    exclude: ['代理', '緊急', '介紹', '公司'],
  },
  idNumber: {
    systemKey: 'buyerIdNumber',
    keywords: ['身分證'],
    exclude: ['代理', '監護'],
  },
  email: {
    systemKey: 'buyerEmail',
    keywords: ['email', 'e-mail', '電子郵件', '電子信箱', '信箱'],
    exclude: ['代理', '公司'],
  },
  dateOfBirth: {
    systemKey: 'buyerDateOfBirth',
    keywords: ['出生', '生日'],
    exclude: [],
  },
  mailingAddress: {
    systemKey: 'buyerMailingAddress',
    keywords: ['通訊地址', '聯絡地址', '地址'],
    exclude: ['戶籍', '公司'],
    // 該表單完全沒有其他地址欄位時，才退回舊的混合地址 systemKey
    fallbackSystemKey: 'buyerAddress',
  },
};

// 攤平欄位定義（含 radio/checkbox 選項下的子欄位）
export function flattenFields(fields) {
  const result = [];
  (fields || []).forEach(field => {
    result.push(field);
    (field.options || []).forEach(opt => {
      (opt.subFields || []).forEach(sub => result.push(sub));
    });
  });
  return result;
}

function matchTargetField(fields, rule) {
  if (rule.systemKey) {
    const f = fields.find(f => f.type === 'system' && f.systemKey === rule.systemKey);
    if (f) return f;
  }
  for (const kw of rule.keywords) {
    // label 比對不分大小寫（EMAIL / Email / e-mail 等英文 label）
    const f = fields.find(f =>
      !NON_INPUT_TYPES.includes(f.type) &&
      f.type !== 'system' &&
      String(f.label || '').toLowerCase().includes(kw.toLowerCase()) &&
      !rule.exclude.some(ex => String(f.label || '').includes(ex))
    );
    if (f) return f;
  }
  if (rule.fallbackSystemKey) {
    const f = fields.find(f => f.type === 'system' && f.systemKey === rule.fallbackSystemKey);
    if (f) return f;
  }
  return null;
}

// 讀值：優先取原始值 data[fieldId]（保留物件結構），退回 readableSnapshot[label]（舊資料相容）
function readFieldValue(submission, field) {
  const dataVal = submission?.data?.[field.id];
  if (dataVal !== undefined && dataVal !== null && dataVal !== '') return dataVal;
  const snapVal = submission?.readableSnapshot?.[field.label];
  if (snapVal !== undefined && snapVal !== null && snapVal !== '') return snapVal;
  return null;
}

function isValidRocDate(year, month, day) {
  if (!year || !month || !day || year < 1 || year > 200) return false;
  const ce = year + 1911;
  const date = new Date(ce, month - 1, day);
  return date.getFullYear() === ce && date.getMonth() === month - 1 && date.getDate() === day;
}

// 解析各種日期輸入為銷控的民國物件 { year, month, day }（數字）
// 支援：{year,month,day} 物件、Firestore Timestamp/Date、
//       1990-01-01 / 1990/1/1（西元）、民國79年1月1日 / 79年1月1日 / 79/1/1 / 79.1.1（民國）
export function parseRocDate(value) {
  if (value === null || value === undefined || value === '') return { ok: false, raw: '' };

  if (typeof value === 'object' && !Array.isArray(value)) {
    if ('year' in value && 'month' in value) {
      const y = Number(value.year), m = Number(value.month), d = Number(value.day);
      if (isValidRocDate(y, m, d)) return { ok: true, value: { year: y, month: m, day: d } };
      return { ok: false, raw: `${value.year}/${value.month}/${value.day}` };
    }
    const dateObj = typeof value.toDate === 'function' ? value.toDate() : (value instanceof Date ? value : null);
    if (dateObj && !isNaN(dateObj.getTime())) {
      return { ok: true, value: { year: dateObj.getFullYear() - 1911, month: dateObj.getMonth() + 1, day: dateObj.getDate() } };
    }
    return { ok: false, raw: String(value) };
  }

  const str = String(value).trim();
  const m = str.replace(/^民國/, '').match(/^(\d{1,4})\s*[-/年.]\s*(\d{1,2})\s*[-/月.]\s*(\d{1,2})\s*日?$/);
  if (!m) return { ok: false, raw: str };
  let year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (year >= 1000) year -= 1911; // 4 位數視為西元 → 轉民國；1~3 位數視為民國
  if (!isValidRocDate(year, month, day)) return { ok: false, raw: str };
  return { ok: true, value: { year, month, day } };
}

// 相容台/臺的字串正規化（僅供比對，回傳值一律用 TwCities 的正式名稱以符合 v-select 選項）
const normTW = s => String(s || '').replace(/台/g, '臺');

function canonicalCityName(name) {
  if (!name) return '';
  const found = TwCities.find(c => normTW(c.name) === normTW(name));
  return found ? found.name : String(name);
}

// 解析地址輸入為 { city, district, detail }
// 支援：address 型別物件 {city, district, detail}、純文字地址（嘗試縣市/鄉鎮前綴解析，失敗全放 detail）
export function parseAddressValue(value) {
  if (!value) return { ok: false, raw: '' };

  if (typeof value === 'object' && !Array.isArray(value)) {
    return {
      ok: true,
      value: {
        city: canonicalCityName(value.city),
        district: value.district || '',
        detail: value.detail || '',
      },
    };
  }

  const str = String(value).trim();
  if (!str) return { ok: false, raw: '' };

  for (const cityData of TwCities) {
    if (normTW(str).startsWith(normTW(cityData.name))) {
      const rest = str.slice(cityData.name.length);
      const district = (cityData.districts || []).find(d => normTW(rest).startsWith(normTW(d.name)));
      if (district) {
        return { ok: true, value: { city: cityData.name, district: district.name, detail: rest.slice(district.name.length).trim() } };
      }
      return { ok: true, value: { city: cityData.name, district: '', detail: rest.trim() } };
    }
  }
  // 解析不出縣市 → 全部放詳細地址
  return { ok: true, value: { city: '', district: '', detail: str } };
}

// 電話：陣列合併為逗號分隔字串（比照 buyerPhone 現況格式）
function normalizePhoneValue(value) {
  if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean).join(',');
  return String(value).trim();
}

// 依表單定義將一筆填寫紀錄對應為買方資料
// 回傳 { name, phone, idNumber, dateOfBirth, mailingAddress, unparsed }
// unparsed：有值但解析失敗的原始字串（供 UI 顯示「無法解析」）
export function extractBuyerFromSubmission(form, submission) {
  const fields = flattenFields(form?.fields || []);
  const result = {
    name: '',
    phone: '',
    idNumber: '',
    email: '',
    dateOfBirth: null,
    mailingAddress: null,
    unparsed: {},
  };

  const nameField = matchTargetField(fields, TARGET_RULES.name);
  if (nameField) {
    const v = readFieldValue(submission, nameField);
    if (v) result.name = String(v).trim();
  }

  const phoneField = matchTargetField(fields, TARGET_RULES.phone);
  if (phoneField) {
    const v = readFieldValue(submission, phoneField);
    if (v) result.phone = normalizePhoneValue(v);
  }

  const idField = matchTargetField(fields, TARGET_RULES.idNumber);
  if (idField) {
    const v = readFieldValue(submission, idField);
    if (v) result.idNumber = String(v).trim();
  }

  const emailField = matchTargetField(fields, TARGET_RULES.email);
  if (emailField) {
    const v = readFieldValue(submission, emailField);
    if (v) result.email = String(v).trim();
  }

  const dobField = matchTargetField(fields, TARGET_RULES.dateOfBirth);
  if (dobField) {
    const v = readFieldValue(submission, dobField);
    if (v) {
      const parsed = parseRocDate(v);
      if (parsed.ok) result.dateOfBirth = parsed.value;
      else result.unparsed.dateOfBirth = parsed.raw;
    }
  }

  const addrField = matchTargetField(fields, TARGET_RULES.mailingAddress);
  if (addrField) {
    const v = readFieldValue(submission, addrField);
    if (v) {
      const parsed = parseAddressValue(v);
      if (parsed.ok) result.mailingAddress = parsed.value;
      else result.unparsed.mailingAddress = parsed.raw;
    }
  }

  return result;
}

// 將對應結果轉為 salesHouseholds.coBuyers 的一筆共同買方
export function buildCoBuyer(extracted, sourceSubmissionId) {
  return {
    name: extracted.name || '',
    phone: extracted.phone || '',
    idNumber: extracted.idNumber || '',
    email: extracted.email || '',
    dateOfBirth: extracted.dateOfBirth || null,
    mailingAddressCity: extracted.mailingAddress?.city || '',
    mailingAddressDistrict: extracted.mailingAddress?.district || '',
    mailingAddressDetail: extracted.mailingAddress?.detail || '',
    sourceSubmissionId: sourceSubmissionId || '',
    importedAt: new Date().toISOString(),
  };
}

// 顯示：民國日期物件 → 「民國79年1月1日」
export function formatRocDateText(dob) {
  if (!dob) return '';
  const parsed = parseRocDate(dob);
  if (!parsed.ok) return '';
  return `民國${parsed.value.year}年${parsed.value.month}月${parsed.value.day}日`;
}

// 顯示：地址物件 → 連接字串
export function formatAddressText(addr) {
  if (!addr) return '';
  return `${addr.city || ''}${addr.district || ''}${addr.detail || ''}`;
}
