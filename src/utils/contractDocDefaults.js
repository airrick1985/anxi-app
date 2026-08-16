// 合約製作資料範本：頁面類型定義與預設 config
// 見 docs/合約製作資料範本-spec.md §3、§4

export const PAGE_TYPES = [
  { type: 'breakdown',           label: '拆款表（簽約會辦單）', icon: 'mdi-file-table-outline',
    description: '總價基準自動判定：一般戶＝成交總價、配套戶＝配套房屋總價' },
  { type: 'bankAccounts',        label: '繳款銀行帳戶名稱',     icon: 'mdi-bank-outline',
    description: '戶別的房屋款／土地款／配套款帳戶，依銀行組勾選' },
  { type: 'paymentDetail',       label: '付款明細表',           icon: 'mdi-cash-multiple',
    description: '金額單位元；版本：房土同頁／房屋版／土地版／配套款版' },
  { type: 'contractNotes',       label: '合約加註',             icon: 'mdi-note-text-outline',
    description: '磋商條款加註頁，預設同步拆款表勾選' },
  { type: 'contractAttachments', label: '合約附圖',             icon: 'mdi-floor-plan',
    description: '戶別雲端資料夾的圖檔／PDF，僅 PDF 匯出' },
  { type: 'contractNumberTable', label: '合約數字對照表（房屋土地分開）', icon: 'mdi-stamper',
    description: '蓋章對照表：房屋合約＋土地合約兩區；藍字＝需蓋章內容' },
  { type: 'contractNumberTableCombined', label: '合約數字對照表（房屋土地合一）', icon: 'mdi-stamper',
    description: '蓋章對照表：房地合一單一合約；藍字＝需蓋章內容' },
  // 裝修合約頁型（僅配套合約戶別適用，見 docs/裝修合約製作範本-spec.md）
  { type: 'decorationBreakdown',    label: '裝修工程會辦單', icon: 'mdi-hammer-wrench', packageOnly: true,
    description: '「配套價格」的拆款表（裝修期款單列）；僅配套合約戶別匯出' },
  { type: 'decorationPaymentDetail', label: '裝修付款明細表', icon: 'mdi-cash-clock',    packageOnly: true,
    description: '配套價格期款、金額國字大寫；僅配套合約戶別匯出' },
];

// 僅配套合約戶別適用的頁型
export function isPackageOnlyPageType(type) {
  return PAGE_TYPE_MAP[type]?.packageOnly === true;
}

// 頁面字體選項（PDF 楷體採政府開放授權「全字庫正楷體 TW-Kai」，外觀同標楷體）
export const DOC_FONT_OPTIONS = [
  { value: 'ming', label: '新細明體（明體）' },
  { value: 'hei', label: 'Noto 黑體' },
  { value: 'kai', label: '標楷體（全字庫正楷體）' },
];

// 各頁型的預設字體（null = 頁型內建混排；會辦單類黑體、明細表明體、帳戶頁黑體標題+明體表格）
export const DEFAULT_PAGE_FONT = {
  breakdown: 'hei',
  decorationBreakdown: 'hei',
  bankAccounts: null,
  paymentDetail: 'ming',
  contractNotes: 'ming',
  decorationPaymentDetail: 'ming',
  contractAttachments: null,
  contractNumberTable: 'kai',           // 蓋章對照表：預設標楷體（近印章字體）
  contractNumberTableCombined: 'kai',
};

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
    case 'contractNumberTable':
      return {
        loanItemName: '',                  // 銀行貸款期別名稱；空 = 自動比對名稱含「銀行貸款」/「貸款」
        constants: {                       // 契約書常數（藍字原樣輸出，每建案可調）
          handoverDays: '三',              // 交屋日起 N 日
          shortenYears: '七',              // 縮短償還期限 N 年
          noticeDays: '三十',              // 接獲通知之日起 N 天
          feePerTenThousand: '五',         // 房屋總價款萬分之 N 手續費
          housePenaltyPercent: '十五',     // 賠償房屋總價款百分之 N
          houseForfeitPercent: '十五',     // 沒收房屋總價款百分之 N
          landPenaltyPercent: '十五',      // 賠償土地總價款百分之 N
          landForfeitPercent: '十五',      // 沒收土地總價款百分之 N
        },
        pageLabels: {                      // 契約書頁碼標籤（黑字，每建案不同）
          handover: 'P11', houseLoan: 'P12 P22', shorten: 'P13', notice: 'P13',
          fee: 'P14', housePenalty: 'P15', houseForfeit: 'P15', houseUnitNo: 'P27 P28或P30 P31',
          landLoan: 'P6 P15', landPenalty: 'P9', landForfeit: 'P9', landUnitNo: 'P17',
        },
      };
    case 'contractNumberTableCombined':
      return {
        loanItemName: '',                  // 銀行貸款期別名稱；空 = 自動比對名稱含「銀行貸款」/「貸款」
        constants: {                       // 契約書常數（藍字原樣輸出；房地合一版無土地專屬條款）
          handoverDays: '三',
          shortenYears: '七',
          noticeDays: '三十',
          feePerTenThousand: '五',
          housePenaltyPercent: '十五',
          houseForfeitPercent: '十五',
        },
        pageLabels: {                      // 契約書頁碼標籤（預設照富宇學森）
          handover: 'P13', houseLoan: 'P14 P25', shorten: 'P15', notice: 'P15',
          fee: 'P16', housePenalty: 'P17', houseForfeit: 'P17', houseUnitNo: 'P33 P34',
        },
      };
    case 'decorationBreakdown':
      return {
        headerTitle: '裝修工程會辦單',
        signFields: [
          { label: '富宇主管', source: 'manual', default: '', readonly: false },
          { label: '富宇承辦', source: 'manual', default: '', readonly: false },
          { label: '專案經理', source: 'manual', default: '', readonly: false },
          { label: '銷售人員', source: 'salesperson', default: '', readonly: true },
        ],
      };
    case 'decorationPaymentDetail':
      return {
        headerTitle: '裝修付款明細表',
        siteLabel: '工地名稱',
        unitLabel: '房屋代號',
        noteText: '',
      };
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
    font: DEFAULT_PAGE_FONT[type] || null,   // 頁面字體（null = 各頁型內建預設）
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
    // 配套款（毛胚等配套合約戶別；戶別配套款欄位空白時自動隱藏，不影響一般戶）
    { id: uid(), label: '配套款', source: 'unit-package', bankName: '', accountName: '', account: '' },
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
