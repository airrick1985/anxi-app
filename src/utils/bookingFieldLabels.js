// 預約頁面欄位標籤預設值與工具函式
// 用於 BookingRuleManager (後台設定) 與 BookingPage (前台顯示) 共用

export const BOOKING_FIELD_LABEL_GROUPS = [
  {
    group: '步驟一・預約資料',
    fields: [
      { key: 'idNumber', defaultLabel: '輸入身分證(驗證碼)' },
      { key: 'building', defaultLabel: '棟別(選擇或輸入)' },
      { key: 'unit', defaultLabel: '戶別' },
      { key: 'address', defaultLabel: '門牌' },
      { key: 'bookingMethod', defaultLabel: '選擇方式' },
      { key: 'subOption', defaultLabel: '請選擇項目' },
      { key: 'companyName', defaultLabel: '代驗公司名稱' },
    ],
  },
  {
    group: '步驟二・聯絡資訊',
    fields: [
      { key: 'name', defaultLabel: '姓名' },
      { key: 'phone', defaultLabel: '電話' },
      { key: 'email', defaultLabel: 'EMAIL' },
    ],
  },
];

const DEFAULT_LABEL_MAP = BOOKING_FIELD_LABEL_GROUPS
  .flatMap(g => g.fields)
  .reduce((acc, f) => {
    acc[f.key] = f.defaultLabel;
    return acc;
  }, {});

export function getDefaultLabel(key) {
  return DEFAULT_LABEL_MAP[key] || '';
}

// 從 projectConfig.fieldLabels 解析自訂 label；空字串/未設定則回傳預設
export function resolveFieldLabel(fieldLabels, key) {
  const custom = fieldLabels?.[key]?.label;
  if (typeof custom === 'string' && custom.trim()) return custom.trim();
  return getDefaultLabel(key);
}

// 解析自訂 hint；未設定或空字串則回傳空字串（不顯示）
export function resolveFieldHint(fieldLabels, key) {
  const custom = fieldLabels?.[key]?.hint;
  if (typeof custom === 'string' && custom.trim()) return custom.trim();
  return '';
}

// 為一份新建/缺漏的 fieldLabels 物件補齊空 slot
export function ensureFieldLabelsShape(fieldLabels = {}) {
  const next = { ...(fieldLabels || {}) };
  for (const g of BOOKING_FIELD_LABEL_GROUPS) {
    for (const f of g.fields) {
      if (!next[f.key] || typeof next[f.key] !== 'object') {
        next[f.key] = { label: '', hint: '' };
      } else {
        next[f.key] = {
          label: typeof next[f.key].label === 'string' ? next[f.key].label : '',
          hint: typeof next[f.key].hint === 'string' ? next[f.key].hint : '',
        };
      }
    }
  }
  return next;
}
