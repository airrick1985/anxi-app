// 動態表單欄位類型（DynamicFieldEditor／DynamicFieldOutline 共用）
// 只是編輯器的顯示用對照；欄位資料結構（type、options、subFields…）不在這裡定義，也不可更動。

export const INPUT_FIELD_TYPES = [
  { type: 'text', title: '單行文字', icon: 'mdi-form-textbox' },
  { type: 'textarea', title: '多行文字', icon: 'mdi-form-textarea' },
  { type: 'radio', title: '單選', icon: 'mdi-radiobox-marked' },
  { type: 'checkbox', title: '多選', icon: 'mdi-checkbox-marked-outline' },
  { type: 'date', title: '日期', icon: 'mdi-calendar' },
  { type: 'address', title: '地址', icon: 'mdi-map-marker-outline' },
];

export const LAYOUT_FIELD_TYPES = [
  { type: 'header', title: '標題', icon: 'mdi-format-header-1' },
  { type: 'description', title: '說明文字', icon: 'mdi-text' },
  { type: 'divider', title: '分隔線', icon: 'mdi-minus' },
  { type: 'link', title: '連結', icon: 'mdi-link-variant' },
];

// 系統欄位（自動帶入戶別／買方資料），僅自訂表單可用
export const SYSTEM_FIELD_KEYS = [
  { value: 'unitId', title: '戶別', icon: 'mdi-home-outline' },
  { value: 'buyerName', title: '買方姓名', icon: 'mdi-account-outline' },
  { value: 'buyerPhone', title: '買方電話', icon: 'mdi-phone-outline' },
  { value: 'buyerAddress', title: '買方戶籍地址', icon: 'mdi-map-marker-outline' },
  { value: 'buyerIdNumber', title: '身分證字號', icon: 'mdi-card-account-details-outline' },
  { value: 'buyerEmail', title: 'EMAIL', icon: 'mdi-email-outline' },
  { value: 'buyerDateOfBirth', title: '出生年月日', icon: 'mdi-cake-variant-outline' },
  { value: 'buyerMailingAddress', title: '買方通訊地址', icon: 'mdi-email-open-outline' },
  { value: 'salesPerson', title: '銷售人員', icon: 'mdi-badge-account-outline' },
];

const TYPE_META = {
  ...Object.fromEntries([...INPUT_FIELD_TYPES, ...LAYOUT_FIELD_TYPES].map(t => [t.type, t])),
  // 舊資料才有的類型：選單不提供新增，但仍要能顯示與編輯
  phone: { type: 'phone', title: '電話', icon: 'mdi-phone-outline' },
  system: { type: 'system', title: '系統帶入', icon: 'mdi-database-outline' },
};

export const fieldTypeIcon = (field) => TYPE_META[field?.type]?.icon || 'mdi-help-circle-outline';
export const fieldTypeName = (field) => TYPE_META[field?.type]?.title || field?.type || '';
