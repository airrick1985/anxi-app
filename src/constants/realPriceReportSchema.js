// 實價登錄申報 欄位 Schema
// 來源：預售屋成交申報JSON轉檔列表.xlsx / 匯出實價登錄申報JSON.gs
// UI 分組對應內政部「不動產預售屋成交案件實際資訊申報作業」HTML 10 步驟

// ===== 交易層次代碼對照表 (p1ma_build10_1 ↔ p1ma_build10_1c) =====
const _CN_DIGITS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
function _floorCh(n) {
  if (n < 10) return `${_CN_DIGITS[n]}層`;
  if (n === 10) return '十層';
  if (n < 20) return `十${_CN_DIGITS[n - 10]}層`;
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return `${_CN_DIGITS[tens]}十${ones === 0 ? '' : _CN_DIGITS[ones]}層`;
}
export const BUILD_FLOOR_OPTIONS = [
  // 地上 1~85 層
  ...Array.from({ length: 85 }, (_, i) => ({
    code: String(i + 1).padStart(3, '0'),
    label: _floorCh(i + 1),
  })),
  { code: 'B00', label: '地下層' },
  { code: 'B01', label: '地下一層' },
  { code: 'B02', label: '地下二層' },
  { code: 'B03', label: '地下三層' },
  { code: 'B04', label: '地下四層' },
  { code: 'B05', label: '地下五層' },
  { code: 'B06', label: '地下六層' },
  { code: 'B07', label: '地下七層' },
  { code: 'B08', label: '地下八層' },
  { code: 'Y',   label: '見使用執照' },
  { code: 'Z',   label: '見其他登記事項' },
];

// ===== 建物規格代碼對照表 =====
// 主要用途 (p1ma_build7 代碼 ↔ p1ma_build7c 名稱)
export const BUILD_PURPOSE_OPTIONS = [
  { code: 'A', label: '住家用' },
  { code: 'B', label: '商業用' },
  { code: 'C', label: '工業用' },
  { code: 'D', label: '農業用' },
  { code: 'E', label: '農舍' },
  { code: 'F', label: '住商用' },
  { code: 'G', label: '住工用' },
  { code: 'H', label: '工商用' },
  { code: 'J', label: '共用部分' },
  { code: 'K', label: '列管標準廠房' },
  { code: 'L', label: '國民住宅' },
  { code: 'M', label: '市場攤位' },
  { code: 'P', label: '停車空間' },
  { code: 'Y', label: '見使用執照' },
  { code: 'Z', label: '見其他登記事項' },
];

// 建物型態 (p1ma_build5 代碼 ↔ p1ma_build5c 名稱)
export const BUILD_TYPE_OPTIONS = [
  { code: '01', label: '公寓(5樓含以下無電梯)' },
  { code: '02', label: '透天厝' },
  { code: '03', label: '店面(店鋪)' },
  { code: '04', label: '辦公商業大樓' },
  { code: '05', label: '住宅大樓(11層含以上有電梯)' },
  { code: '06', label: '華廈(10層含以下有電梯)' },
  { code: '07', label: '套房(1房(1廳)1衛)' },
  { code: '08', label: '工廠' },
  { code: '09', label: '廠辦' },
  { code: '10', label: '農舍' },
  { code: '11', label: '倉庫' },
  { code: 'Z',  label: '其他' },
];

// 主要建材 (p1ma_build8 代碼 ↔ p1ma_build8c 名稱)
export const BUILD_MATERIAL_OPTIONS = [
  { code: '01', label: '木造' },
  { code: '02', label: '鋼造' },
  { code: '03', label: '混凝土造' },
  { code: '04', label: '鋼筋混凝土造' },
  { code: '05', label: '石造' },
  { code: '06', label: '磚造' },
  { code: '07', label: '預力混凝土造' },
  { code: '08', label: '加強磚造' },
  { code: '09', label: '壁式預鑄鋼筋混凝土造' },
  { code: '10', label: '鋼骨混凝土造' },
  { code: '11', label: '鋼骨鋼筋混凝土造' },
  { code: '12', label: '鋼筋混凝土加強磚造' },
  { code: '13', label: '鐵造' },
  { code: '14', label: '土造' },
  { code: '15', label: '土石造' },
  { code: '16', label: '土磚石混合造' },
  { code: '17', label: '竹造' },
  { code: '18', label: '鋼筋混凝土加強空心磚造' },
  { code: '19', label: '土木造' },
  { code: '20', label: '鋁架造' },
  { code: 'Y',  label: '見使用執照' },
  { code: 'Z',  label: '見其他登記事項' },
];

// Step 5 「本案共用欄位」：點儲存為本案預設時只儲存這些欄位
export const TARGET_SHARED_KEYS = [
  // 建物坐落
  'land_x45', 'land_x45c', 'land_x46', 'land_x46c', 'p1ma_dd09',
  // 建案資訊
  'p1ma_typeB_1', 'p1ma_typeB_2', 'p1ma_typeB_3', 'p1ma_typeB_4',
  // 建物規格 (共用)
  'p1ma_build9',
  'p1ma_build7', 'p1ma_build7c',
  'p1ma_build5', 'p1ma_build5c', 'p1ma_build5Text',
  'p1ma_build8', 'p1ma_build8c', 'p1ma_build8Text',
  // 交易標的種類 (多半同建案一致：預售屋 => 1 房地 或 2 房地+車位)
  'caseflag',
];

// ===== 必填欄位清單（依內政部申報表單 required 屬性）=====
export const REQUIRED_MAIN_KEYS = new Set([
  // 1. 案件基本資料
  'case_x45', 'case_x46', 'case_unit',
  // 2. 申報人
  'case_kind', 'apply_name', 'apply_idNo', 'apply_tel', 'apply_x45', 'apply_x46', 'apply_addr',
  // 4. 買受人
  'right_name', 'right_idNo', 'right_tel', 'right_x45', 'right_x46', 'right_addr',
  // 5. 交易標的
  'land_x45', 'land_x46', 'p1ma_dd09',
  'p1ma_typeB_1', 'p1ma_typeB_2', 'p1ma_typeB_3', 'p1ma_typeB_5', 'p1ma_typeB_6',
  'p1ma_build10_1', 'p1ma_build9', 'p1ma_build7', 'p1ma_build5', 'p1ma_build8',
  'caseflag',
  // 6. 價格資訊
  'p1ma_totprice', 'p1ma_parkflag',
]);
export const REQUIRED_LAND_KEYS = new Set([
  'land_x48', 'land_no', 'land_area', 'land_right', 'land_rightDeno', 'land_rightNume',
]);
export const REQUIRED_BUILD_KEYS = new Set([
  'build_areaM', 'build_areaB', 'build_areaE', 'build_areaU', 'build_areaP',
]);
export const REQUIRED_CAR_KEYS = new Set([
  'car_floor',
]);
export const isRequiredMainField = k => REQUIRED_MAIN_KEYS.has(k);
export const isRequiredLandField = k => REQUIRED_LAND_KEYS.has(k);
export const isRequiredBuildField = k => REQUIRED_BUILD_KEYS.has(k);
export const isRequiredCarField = k => REQUIRED_CAR_KEYS.has(k);

// ===== 主體資料 (ZWw1MDEw) =====
// group 值對應 HTML 的 10 個段落 (1~6 + 10)：
//   case        = 1.案件基本資料
//   applicant   = 2.申報人
//   agent       = 3.申報代理人
//   buyer       = 4.買受人資料
//   target      = 5.交易標的 (建物坐落/建案/建物規格/交易日期/筆數)
//   price       = 6.價格資訊
//   note        = 10.備註欄 (以 subGroup 分 5 子段)
export const MAIN_DATA_SCHEMA = [
  // --- 1. 案件基本資料 ---
  { key: 'case_type',     label: '案件類型 (預售屋=B1)', group: 'case', type: 'text' },
  { key: 'case_no',       label: '案件編號',             group: 'case', type: 'text' },
  { key: 'p1ma_caseSeq',  label: '案件序號',             group: 'case', type: 'text' },
  { key: 'case_x45',      label: '標的縣市代碼',         group: 'case', type: 'text' },
  { key: 'case_x45c',     label: '標的縣市',             group: 'case', type: 'text' },
  { key: 'case_x46',      label: '標的鄉鎮代碼',         group: 'case', type: 'text' },
  { key: 'case_x46c',     label: '標的鄉鎮',             group: 'case', type: 'text' },
  { key: 'case_unit',     label: '受理機關代碼',         group: 'case', type: 'text' },
  { key: 'case_unitc',    label: '受理機關',             group: 'case', type: 'text' },
  { key: 'apply_no',      label: '預售屋備查申報書序號', group: 'case', type: 'text' },

  // --- 2. 申報人 ---
  { key: 'case_kind',     label: '申報人種類 (14=銷售預售屋者 / 12=不動產經紀業)', group: 'applicant', type: 'text' },
  { key: 'apply_name',    label: '名稱',             group: 'applicant', type: 'text' },
  { key: 'apply_idNo',    label: '統一編號 / 身分證', group: 'applicant', type: 'text', format: 'taxIdOrNatId' },
  { key: 'apply_tel',     label: '聯絡電話',         group: 'applicant', type: 'text' },
  { key: 'apply_mail',    label: '電子信箱',         group: 'applicant', type: 'text' },
  { key: 'apply_x45',     label: '縣市碼',           group: 'applicant', type: 'text' },
  { key: 'apply_x45c',    label: '縣市',             group: 'applicant', type: 'text' },
  { key: 'apply_x46',     label: '區域碼',           group: 'applicant', type: 'text' },
  { key: 'apply_x46c',    label: '區域',             group: 'applicant', type: 'text' },
  { key: 'apply_addr',    label: '詳細地址',         group: 'applicant', type: 'text' },

  // --- 3. 申報代理人 ---
  { key: 'agents_name',   label: '名稱',             group: 'agent', type: 'text' },
  { key: 'agents_idNo',   label: '統一編號 / 身分證', group: 'agent', type: 'text', format: 'taxIdOrNatId' },
  { key: 'agents_tel',    label: '聯絡電話',         group: 'agent', type: 'text' },
  { key: 'agents_mail',   label: '電子信箱',         group: 'agent', type: 'text' },
  { key: 'agents_x45',    label: '縣市碼',           group: 'agent', type: 'text' },
  { key: 'agents_x45c',   label: '縣市',             group: 'agent', type: 'text' },
  { key: 'agents_x46',    label: '區域碼',           group: 'agent', type: 'text' },
  { key: 'agents_x46c',   label: '區域',             group: 'agent', type: 'text' },
  { key: 'agents_addr',   label: '詳細地址',         group: 'agent', type: 'text' },

  // --- 4. 買受人資料 ---
  { key: 'right_name',    label: '名稱',             group: 'buyer', type: 'text' },
  { key: 'right_idNo',    label: '統一編號 / 身分證', group: 'buyer', type: 'text', format: 'taxIdOrNatId' },
  { key: 'right_tel',     label: '聯絡電話',         group: 'buyer', type: 'text' },
  { key: 'right_mail',    label: '電子信箱',         group: 'buyer', type: 'text' },
  { key: 'right_x45',     label: '縣市碼',           group: 'buyer', type: 'text' },
  { key: 'right_x45c',    label: '縣市',             group: 'buyer', type: 'text' },
  { key: 'right_x46',     label: '區域碼',           group: 'buyer', type: 'text' },
  { key: 'right_x46c',    label: '區域',             group: 'buyer', type: 'text' },
  { key: 'right_addr',    label: '詳細地址',         group: 'buyer', type: 'text' },

  // --- 5. 交易標的 (建物坐落) ---
  { key: 'land_x45',      label: '建物坐落縣市碼',   group: 'target', type: 'text' },
  { key: 'land_x45c',     label: '建物坐落縣市',     group: 'target', type: 'text' },
  { key: 'land_x46',      label: '建物坐落區域碼',   group: 'target', type: 'text' },
  { key: 'land_x46c',     label: '建物坐落區域',     group: 'target', type: 'text' },
  { key: 'p1ma_dd09',     label: '建物坐落 (門牌/街路)', group: 'target', type: 'text' },

  // --- 5. 交易標的 (建案資訊) ---
  { key: 'p1ma_typeB_1',  label: '建案名稱',         group: 'target', type: 'text' },
  { key: 'p1ma_typeB_2',  label: '起造人名稱',       group: 'target', type: 'text' },
  { key: 'p1ma_typeB_3',  label: '建造執照字號',     group: 'target', type: 'text' },
  { key: 'p1ma_typeB_4',  label: '建造執照核發日期',    group: 'target', type: 'text', format: 'rocDate' },

  // --- 5. 交易標的 (建物規格) ---
  { key: 'p1ma_build10_1',     label: '交易層次碼 (隱藏)',     group: 'target', type: 'text' },
  { key: 'p1ma_build10_1c',    label: '交易層次 (樓層)',        group: 'target', type: 'autocomplete',
    codeKey: 'p1ma_build10_1',
    options: BUILD_FLOOR_OPTIONS.map(o => ({ value: o.label, label: o.label, code: o.code })) },
  { key: 'p1ma_build10_1Text', label: '交易層次(自訂)',         group: 'target', type: 'text' },
  { key: 'p1ma_build9',        label: '總樓層數',               group: 'target', type: 'number' },
  { key: 'p1ma_build7',        label: '主要用途碼 (隱藏)', group: 'target', type: 'text' },
  { key: 'p1ma_build7c',       label: '主要用途',           group: 'target', type: 'autocomplete',
    codeKey: 'p1ma_build7',
    options: BUILD_PURPOSE_OPTIONS.map(o => ({ value: o.label, label: o.label, code: o.code })) },
  { key: 'p1ma_build7Text',    label: '主要用途(自訂)',     group: 'target', type: 'text' },
  { key: 'p1ma_build5',        label: '建物型態碼 (隱藏)', group: 'target', type: 'text' },
  { key: 'p1ma_build5c',       label: '建物型態',           group: 'target', type: 'autocomplete',
    codeKey: 'p1ma_build5',
    options: BUILD_TYPE_OPTIONS.map(o => ({ value: o.label, label: o.label, code: o.code })) },
  { key: 'p1ma_build5Text',    label: '建物型態(自訂)',     group: 'target', type: 'text' },
  { key: 'p1ma_build8',        label: '主要建材碼 (隱藏)', group: 'target', type: 'text' },
  { key: 'p1ma_build8c',       label: '主要建材',           group: 'target', type: 'autocomplete',
    codeKey: 'p1ma_build8',
    options: BUILD_MATERIAL_OPTIONS.map(o => ({ value: o.label, label: o.label, code: o.code })) },
  { key: 'p1ma_build8Text',    label: '主要建材(自訂)',     group: 'target', type: 'text' },
  { key: 'p1ma_build1',        label: '建物格局-房',             group: 'target', type: 'number' },
  { key: 'p1ma_build2',        label: '建物格局-廳',             group: 'target', type: 'number' },
  { key: 'p1ma_build3',        label: '建物格局-衛',             group: 'target', type: 'number' },
  { key: 'p1ma_build4',        label: '無隔間 ',           group: 'target', type: 'text' },

  // --- 5. 交易標的 (交易日期 / 標的種類 / 編號/棟號 / 筆數) ---
  { key: 'p1ma_date',          label: '交易日期',             group: 'target', type: 'text', format: 'rocDate' },
  { key: 'caseflag',           label: '交易標的種類 (1=房地 2=房地+車 3=土地 4=建物 5=車位)', group: 'target', type: 'text' },
  { key: 'p1ma_typeB_5',       label: '編號(棟)',       group: 'target', type: 'text' },
  { key: 'p1ma_typeB_6',       label: '號(樓)',              group: 'target', type: 'text' },
  { key: 'p1ma_cntalid',       label: '土地筆數',                 group: 'target', type: 'number' },
  { key: 'p1ma_cntdbid',       label: '建物筆數(戶)',             group: 'target', type: 'number' },
  { key: 'p1ma_cntpark',       label: '車位個數',                 group: 'target', type: 'number' },

  // --- 6. 價格資訊 ---
  { key: 'p1ma_totprice',      label: '不動產交易總價(元)', group: 'price', type: 'number' },
  { key: 'p1ma_alidprice',     label: '土地交易總價(元)',   group: 'price', type: 'number' },
  { key: 'p1ma_dbidprice',     label: '建物交易總價(元)',   group: 'price', type: 'number' },
  { key: 'p1ma_parkprice',     label: '車位交易總價(元)',   group: 'price', type: 'number' },
  { key: 'p1ma_parkflag',      label: '車位備註 (0=單獨計價 / 1=已納入總價 / 2=無車位)', group: 'price', type: 'text' },

  // --- 10. 備註欄 (subGroup: note1~note5) ---
  // (1) 交易總價包含下列非屬預售屋價格之費用
  { key: 'p1sp_code0101',      label: '裝潢費 ',           group: 'note', subGroup: 'note1', type: 'checkbox' },
  { key: 'p1sp_price0101',     label: '裝潢費 金額(元)',         group: 'note', subGroup: 'note1', type: 'number' },
  { key: 'p1sp_code0102',      label: '傢俱設備費 ',       group: 'note', subGroup: 'note1', type: 'checkbox' },
  { key: 'p1sp_price0102',     label: '傢俱設備費 金額(元)',     group: 'note', subGroup: 'note1', type: 'number' },
  { key: 'p1sp_code0106',      label: '其他費用 ',         group: 'note', subGroup: 'note1', type: 'checkbox' },
  { key: 'p1sp_desc0106',      label: '其他費用 描述',           group: 'note', subGroup: 'note1', type: 'text' },
  { key: 'p1sp_price0106',     label: '其他費用 金額(元)',       group: 'note', subGroup: 'note1', type: 'number' },
  // (2) 關係人間交易
  { key: 'p1sp_code0201',      label: '親友/員工/共有人/其他特殊關係間之交易 ', group: 'note', subGroup: 'note2', type: 'checkbox' },
  { key: 'p1sp_code0202',      label: '合建案建商與地主間之交易 ',             group: 'note', subGroup: 'note2', type: 'checkbox' },
  // (3) 特殊交易情況、條件
  { key: 'p1sp_code0501',      label: '急買急賣 ',                 group: 'note', subGroup: 'note3', type: 'checkbox' },
  { key: 'p1sp_code0502',      label: '受民情風俗因素影響 ',       group: 'note', subGroup: 'note3', type: 'checkbox' },
  { key: 'p1sp_code0512',      label: '期待因素影響之交易 ',       group: 'note', subGroup: 'note3', type: 'checkbox' },
  { key: 'p1sp_code0509',      label: '受債權債務關係影響或債務抵償 ', group: 'note', subGroup: 'note3', type: 'checkbox' },
  { key: 'p1sp_code0602',      label: '地上權房屋 ',               group: 'note', subGroup: 'note3', type: 'checkbox' },
  { key: 'p1sp_code0505',      label: '毛胚屋  — 由合約類型自動判斷', group: 'note', subGroup: 'note3', type: 'checkbox' },
  // (4) 解約後再次出售之交易
  { key: 'p1sp_desc1301',      label: '原申報書序號',             group: 'note', subGroup: 'note4', type: 'text' },
  // (5) 其他買受人姓名及統編
  { key: 'p1sp_desc1401',      label: '其他買受人姓名及統編',     group: 'note', subGroup: 'note5', type: 'textarea' },
  // 備註 (.gs 實際未寫入 JSON，保留作為 UI 輔助欄位)
  { key: 'p1ma_note',          label: '備註',                     group: 'note', subGroup: 'note5', type: 'textarea' },
];

// 10 個步驟的 UI 標題 / 圖示（步驟 7/8/9 為土地/建物/車位表格，不從 MAIN_GROUPS）
export const REPORT_STEPS = [
  { step: 1,  key: 'case',      label: '案件基本資料',  icon: 'mdi-file-document-outline' },
  { step: 2,  key: 'applicant', label: '申報人',         icon: 'mdi-account-tie' },
  { step: 3,  key: 'agent',     label: '申報代理人',     icon: 'mdi-account-arrow-right' },
  { step: 4,  key: 'buyer',     label: '買受人資料',     icon: 'mdi-account' },
  { step: 5,  key: 'target',    label: '交易標的',       icon: 'mdi-home-city' },
  { step: 6,  key: 'price',     label: '價格資訊',       icon: 'mdi-cash-multiple' },
  { step: 7,  key: 'land',      label: '土地標的清冊',   icon: 'mdi-terrain',   table: true },
  { step: 8,  key: 'build',     label: '建物標的清冊',   icon: 'mdi-home-modern', table: true },
  { step: 9,  key: 'car',       label: '車位標的清冊',   icon: 'mdi-parking',     table: true },
  { step: 10, key: 'note',      label: '備註欄',         icon: 'mdi-note-text-outline' },
];

// 備註欄的 5 個子段落
export const NOTE_SUB_GROUPS = [
  { key: 'note1', label: '(1) 交易總價包含下列非屬預售屋價格之費用' },
  { key: 'note2', label: '(2) 關係人間交易' },
  { key: 'note3', label: '(3) 特殊交易情況、條件' },
  { key: 'note4', label: '(4) 解約後再次出售之交易' },
  { key: 'note5', label: '(5) 其他買受人姓名及統編 / 備註' },
];

// 為了相容舊版 MainDataEditor（仍用於建案預設頁），保留舊的 MAIN_GROUPS 名稱
export const MAIN_GROUPS = REPORT_STEPS.filter(s => !s.table).map(s => ({
  key: s.key,
  label: `${s.step}. ${s.label}`,
  icon: s.icon,
}));

// ===== 土地資料 (ZWw1MDEwMQ==) =====
export const LAND_DATA_SCHEMA = [
  { key: 'land_x48',       label: '地段碼',     type: 'text' },
  { key: 'land_x48c',      label: '段小段',     type: 'text' },
  { key: 'land_x45',       label: '縣市碼',     type: 'text' },
  { key: 'land_x45c',      label: '標的縣市',   type: 'text' },
  { key: 'land_x46',       label: '鄉鎮碼',     type: 'text' },
  { key: 'land_x46c',      label: '標的鄉鎮',   type: 'text' },
  { key: 'land_no',        label: '地號',       type: 'text' },
  { key: 'land_area',      label: '土地面積(m²)', type: 'text' },
  { key: 'land_right',     label: '權利範圍類型 (X=分別共有/A=全部/B=公同共有)', type: 'text' },
  // land_rightc：顯示名稱 → 選擇後自動將代號寫入 land_right (codeKey)
  { key: 'land_rightc',    label: '權利範圍', type: 'select', codeKey: 'land_right', options: [
    { value: '分別共有', label: '分別共有', code: 'X' },
    { value: '全部',     label: '全部',     code: 'A' },
    { value: '公同共有', label: '公同共有', code: 'B' },
  ] },
  { key: 'land_rightDeno', label: '權利範圍 分子',  type: 'number' },
  { key: 'land_rightNume', label: '權利範圍 分母',  type: 'number' },
  { key: 'land_use',       label: '都市土地使用分區碼 (1=住 2=商 3=工 4=農 5=其他)', type: 'text' },
  // land_usec：顯示名稱 → 選擇後自動將代號寫入 land_use (codeKey)
  { key: 'land_usec',      label: '都市土地使用分區', type: 'select', codeKey: 'land_use', options: [
    { value: '住',   label: '住',   code: '1' },
    { value: '商',   label: '商',   code: '2' },
    { value: '工',   label: '工',   code: '3' },
    { value: '農',   label: '農',   code: '4' },
    { value: '其他', label: '其他', code: '5' },
  ] },
  { key: 'land_useText',   label: '次類別名稱', type: 'text' },
];

// ===== 建物資料 (ZWw1MDEwMg==) =====
export const BUILD_DATA_SCHEMA = [
  { key: 'build_areaM', label: '主建物面積(m²)',       type: 'number' },
  { key: 'build_areaB', label: '陽臺面積(m²)',         type: 'number' },
  { key: 'build_areaE', label: '屋簷面積(m²)',         type: 'text' },
  { key: 'build_areaU', label: '雨遮面積(m²)',         type: 'text' },
  { key: 'build_areaP', label: '共有部分面積(含車位)(m²)', type: 'number' },
];

// ===== 車位資料 (ZWw1MDEwMw==) =====
export const CAR_DATA_SCHEMA = [
  { key: 'car_type',     label: '車位類別碼', type: 'select', options: [
    { value: '1', label: '坡道平面' },
    { value: '2', label: '升降平面' },
    { value: '3', label: '坡道機械' },
    { value: '4', label: '升降機械' },
    { value: '5', label: '塔式車位' },
    { value: '6', label: '一樓平面' },
    { value: '7', label: '其他' },
  ] },
  { key: 'car_typec',    label: '車位類別',   type: 'text' },
  { key: 'car_typeText', label: '其他(自訂)', type: 'text' },
  { key: 'car_price',    label: '車位價格(元)', type: 'number' },
  { key: 'car_area',     label: '車位面積(m²)', type: 'text' },
  { key: 'car_floor',    label: '車位所在樓層碼', type: 'select', options: [
    { value: '2', label: '二樓含以上' },
    { value: '1', label: '一樓' },
    { value: 'B1', label: '地下一樓' },
    { value: 'B2', label: '地下二樓' },
    { value: 'B3', label: '地下三樓' },
    { value: 'B4', label: '地下四樓' },
    { value: 'B5', label: '地下五樓含以下' },
    { value: '0', label: '無固定樓層' },
  ] },
  { key: 'car_floorc',   label: '車位所在樓層', type: 'text' },
];

// JSON key (Base64 編碼的分類代號)
export const JSON_KEYS = {
  MAIN: 'ZWw1MDEw',
  LAND: 'ZWw1MDEwMQ==',
  BUILD: 'ZWw1MDEwMg==',
  CAR: 'ZWw1MDEwMw==',
};

export function buildEmptyMainData() {
  const obj = {};
  MAIN_DATA_SCHEMA.forEach(f => { obj[f.key] = ''; });
  return obj;
}

export function buildEmptyLandRow() {
  const obj = {};
  LAND_DATA_SCHEMA.forEach(f => { obj[f.key] = ''; });
  return obj;
}

export function buildEmptyBuildData() {
  const obj = {};
  BUILD_DATA_SCHEMA.forEach(f => { obj[f.key] = ''; });
  return obj;
}

export function buildEmptyCarRow() {
  const obj = {};
  CAR_DATA_SCHEMA.forEach(f => { obj[f.key] = ''; });
  return obj;
}
