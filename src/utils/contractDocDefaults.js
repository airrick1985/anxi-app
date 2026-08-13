// 合約製作資料範本：頁面類型定義與預設 config
// 見 docs/合約製作資料範本-spec.md §3、§4

export const PAGE_TYPES = [
  { type: 'breakdown',           label: '拆款表（簽約會辦單）', icon: 'mdi-file-table-outline' },
  { type: 'bankAccounts',        label: '繳款銀行帳戶名稱',     icon: 'mdi-bank-outline' },
  { type: 'paymentDetail',       label: '付款明細表',           icon: 'mdi-cash-multiple' },
  { type: 'contractNotes',       label: '合約加註',             icon: 'mdi-note-text-outline' },
  { type: 'contractAttachments', label: '合約附圖',             icon: 'mdi-floor-plan' },
];

export const PAGE_TYPE_MAP = Object.fromEntries(PAGE_TYPES.map(p => [p.type, p]));

export const PAPER_SIZES = ['A4', 'A3', 'B4', 'Letter'];
export const ORIENTATIONS = [
  { value: 'portrait', label: '直式' },
  { value: 'landscape', label: '橫式' },
];

export const CLAUSE_CONDITIONS = [
  { value: null, label: '不限' },
  { value: '首購', label: '首購' },
  { value: '非首購', label: '非首購' },
  { value: '店面', label: '店面' },
];

export const BANK_SET_SOURCES = [
  { value: 'unit-house', label: '戶別：房屋款帳戶' },
  { value: 'unit-land', label: '戶別：土地款帳戶' },
  { value: 'unit-package', label: '戶別：配套款帳戶' },
  { value: 'custom', label: '自訂（建案固定帳戶）' },
];

function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function buildDefaultPageOptions(type) {
  switch (type) {
    case 'breakdown':
      return {
        headerTitle: '簽約會辦單',
        freeFields: [
          { key: 'gift', label: '贈品', type: 'text', default: '' },
          { key: 'brokerFee', label: '仲人費', type: 'number', default: null },
          { key: 'referralFee', label: '介紹費', type: 'number', default: null },
          { key: 'priceDiff', label: '溢差價', type: 'number', default: null },
        ],
        signFields: [
          { label: '富宇主管', source: 'manual', default: '', readonly: false },
          { label: '富宇承辦', source: 'manual', default: '', readonly: false },
          { label: '專案經理', source: 'manual', default: '', readonly: false },
          { label: '銷售人員', source: 'salesperson', default: '', readonly: true },
        ],
      };
    case 'bankAccounts':
      return { bankSetIds: [], showQr: true, qrLabel: '請填寫客戶資料卡' };
    case 'paymentDetail':
      return {
        mode: 'combined', // combined | house | land
        noteText: '備註：本附件所列各款明細與契約所訂總價若有不符情事，概以本契約第七條之金額為準。',
        showSignColumn: true,
      };
    case 'contractNotes':
      return { defaultFontSize: 10, blockWidthMm: null, blockHeightMm: null, showBuyerSignLine: true };
    case 'contractAttachments':
      return { sourceField: 'contractDrawingFolderUrl', fitMode: 'fit' };
    default:
      return {};
  }
}

export function buildNewPage(type) {
  return {
    id: uid(),
    type,
    title: PAGE_TYPE_MAP[type]?.label || type,
    enabled: true,
    paper: { size: 'A4', orientation: 'portrait' },
    repeatCount: 1,   // 同頁重複份數（一頁內放多份，裁剪浮貼用）
    pageCopies: 1,    // 重複頁數（整頁複製 N 頁）
    options: buildDefaultPageOptions(type),
  };
}

// 預設價款公式（富宇學森範例；每建案可再調整）：
//   房屋款 = 房屋價款 - 車位總價
//   附屬建物(陽台)價款 = 房屋款 / 房屋總面積(㎡) × 附屬建物面積(㎡) × 0.95
//   共有部份價款 = 房屋款 / 房屋總面積(㎡) × 共有部份面積(㎡) × 0.95
//   主建物價款 = 房屋款 - 附屬建物價款 - 共有部份價款
//   專有部份價款 = 主建物價款 + 附屬建物價款
export function buildDefaultPriceFormulas() {
  const r1 = { mode: 'round', decimals: 1 };
  return [
    {
      key: 'houseAmount', label: '房屋款', showOnPage: true,
      tokens: [
        { type: 'ref', key: 'housePrice' },
      ],
      rounding: { ...r1 },
    },
    {
      key: 'ancillaryAmount', label: '附屬建物(陽台)價款', showOnPage: true,
      tokens: [
        { type: 'ref', key: 'houseAmount' },
        { type: 'op', op: '/' },
        { type: 'ref', key: 'houseAreaSqm' },
        { type: 'op', op: '*' },
        { type: 'ref', key: 'ancillaryAreaSqm' },
        { type: 'op', op: '*' },
        { type: 'number', value: 0.95 },
      ],
      rounding: { ...r1 },
    },
    {
      key: 'commonAmount', label: '共有部份價款', showOnPage: true,
      tokens: [
        { type: 'ref', key: 'houseAmount' },
        { type: 'op', op: '/' },
        { type: 'ref', key: 'houseAreaSqm' },
        { type: 'op', op: '*' },
        { type: 'ref', key: 'commonAreaSqm' },
        { type: 'op', op: '*' },
        { type: 'number', value: 0.95 },
      ],
      rounding: { ...r1 },
    },
    {
      key: 'mainAmount', label: '主建物價款', showOnPage: true,
      tokens: [
        { type: 'ref', key: 'houseAmount' },
        { type: 'op', op: '-' },
        { type: 'ref', key: 'ancillaryAmount' },
        { type: 'op', op: '-' },
        { type: 'ref', key: 'commonAmount' },
      ],
      rounding: { ...r1 },
    },
    {
      key: 'exclusiveAmount', label: '專有部份價款', showOnPage: true,
      tokens: [
        { type: 'ref', key: 'mainAmount' },
        { type: 'op', op: '+' },
        { type: 'ref', key: 'ancillaryAmount' },
      ],
      rounding: { ...r1 },
    },
  ];
}

export function buildDefaultBankSets() {
  return [
    { id: uid(), label: '房屋款', source: 'unit-house', bankName: '', accountName: '', account: '' },
    { id: uid(), label: '土地款', source: 'unit-land', bankName: '', accountName: '', account: '' },
  ];
}

export function buildDefaultContractDocConfig(projectId) {
  const bankSets = buildDefaultBankSets();
  const bankPage = buildNewPage('bankAccounts');
  bankPage.options.bankSetIds = bankSets.map(b => b.id);
  return {
    projectId,
    templateId: null,
    templateName: null,
    pages: [
      buildNewPage('breakdown'),
      bankPage,
      buildNewPage('paymentDetail'),
      buildNewPage('contractNotes'),
      buildNewPage('contractAttachments'),
    ],
    priceFormulas: buildDefaultPriceFormulas(),
    installmentSplitRules: {
      defaultLandTokens: [{ type: 'number', value: 0 }],
      rules: [],
    },
    clauseLibrary: [],
    bankSets,
  };
}

export function newClause() {
  return { id: uid(), title: '', condition: null, content: '', isDefault: false };
}

export function newBankSet() {
  return { id: uid(), label: '', source: 'custom', bankName: '', accountName: '', account: '' };
}

export function newPriceFormulaField(existingKeys = []) {
  let i = 1;
  let key = `custom${i}`;
  while (existingKeys.includes(key)) { i += 1; key = `custom${i}`; }
  return { key, label: '', showOnPage: true, tokens: [], rounding: { mode: 'round', decimals: 1 } };
}

export function newFreeField(existingKeys = []) {
  let i = 1;
  let key = `field${i}`;
  while (existingKeys.includes(key)) { i += 1; key = `field${i}`; }
  return { key, label: '', type: 'text', default: '' };
}
