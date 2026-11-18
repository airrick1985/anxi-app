/**
 * 產品介紹頁 /product 專用資料（docs/SPEC_ProductPage.md）
 * 共用文案（模組、痛點、五階段、理由、試用步驟）在 productModules.js。
 */
import salesGrid from '@/assets/landing/sales/sales-grid.webp';
import salesMobile from '@/assets/landing/sales/sales-mobile.webp';
import vipFormMobile from '@/assets/landing/customer/vip-form-mobile.webp';
import bookingMobile from '@/assets/landing/booking/booking-page-mobile.webp';
import website1 from '@/assets/landing/website/website-1.webp';
import website2 from '@/assets/landing/website/website-2.webp';

// 模組順序與分群（主力先講）
export const MODULE_GROUPS = [
  { id: 'sales', name: '銷售成交', modules: ['sales', 'quote', 'parking', 'ai'] },
  { id: 'prospect', name: '客戶開發', modules: ['customer', 'leads', 'lineAi'] },
  { id: 'deal', name: '成交管理', modules: ['contract', 'commission'] },
  { id: 'handover', name: '交屋售後', modules: ['booking', 'handover', 'inspection'] },
  { id: 'marketing', name: '預售行銷', modules: ['website'] },
  { id: 'admin', name: '管理', modules: ['admin'] },
];

export const MODULE_ORDER = MODULE_GROUPS.flatMap((g) => g.modules);

// 五階段（依 STAGES 順序）點了跳到的模組：該群第一個
export const STAGE_TARGETS = {
  預售行銷: 'website',
  客戶開發: 'customer',
  銷售成交: 'sales',
  成交管理: 'contract',
  交屋售後: 'booking',
};

// 角色捷徑：[連結文字, 模組 id]
export const ROLE_SHORTCUTS = [
  {
    title: '建設公司經營者', icon: 'mdi-office-building-outline',
    links: [['去化與價格即時掌握', 'sales'], ['議價有把關', 'quote'], ['交屋進度一張表', 'handover']],
  },
  {
    title: '專案主管', icon: 'mdi-clipboard-account-outline',
    links: [['名單公平分配', 'leads'], ['客資報表自動統計', 'customer'], ['指定時間自動調價', 'sales']],
  },
  {
    title: '代銷主管', icon: 'mdi-account-tie-outline',
    links: [['請佣獎金自動結算', 'commission'], ['撞客裁決有紀錄', 'customer'], ['合約文件一鍵產出', 'contract']],
  },
  {
    title: '櫃台／銷售', icon: 'mdi-card-account-details-outline',
    links: [['手機就能報價', 'quote'], ['一句話查銷控', 'ai'], ['預約不用打電話', 'booking']],
  },
];

// 只在本頁顯示的補充重點（deck 舞台高度固定，不加）
// sales 依據 components/ActivityMessageViewer.vue（銷控、報價系統內查看與列印，沒有對外連結）
// contract 依據 components/contractPrint/ContractPrintDialog.vue
export const MODULE_MORE = {
  sales: [['活動訊息頁', '自由排版活動頁，銷售在銷控與報價系統直接查看、列印']],
  contract: [['合約套印', '欄位套到既有合約 PDF 版型']],
};

export const FAQS = [
  { q: '需要安裝軟體嗎？', a: '不用。手機、平板、電腦打開瀏覽器就能用。' },
  { q: '可以只用其中一個系統嗎？', a: '可以。各系統可單獨訂閱，之後再加，資料彼此互通。' },
  { q: '可以先試用嗎？', a: '可以。留下基本資料就會自動登入範例建案，直接操作。' },
  { q: '現有的 Excel 資料能匯入嗎？', a: '銷控表與廣告名單都支援 Excel 匯入，導入時有專人協助。' },
  { q: '一定要有 LINE 官方帳號嗎？', a: '不用。通知、裁決、名單回報綁定個人 LINE 即可；LINE AI 助理與形象網站留資通知才需要建案的官方帳號。' },
  { q: '不同職務看到的資料一樣嗎？', a: '不一樣。櫃台、銷售、主管依權限各看各的；人員離職時，管理員可一鍵停用帳號。' },
  { q: '費用怎麼算？', a: '依系統分為按帳號、按戶數或按案計費，見上方方案價格；多人或大量戶別另有優惠。' },
  { q: '多久可以開始使用？', a: '確認需求後由專人協助建置開通。' },
];

/**
 * 截圖（原圖尺寸＋裁切，單位為原圖 px）。裁切後不可出現建案名稱、測試字樣、浮動鈕；
 * 2026-11-18 逐張開圖核對過。website-1／2 為已公開的作品，不裁切。
 */
export const SHOTS = {
  'sales-grid': { src: salesGrid, width: 3200, height: 2000, frame: 'browser', alt: '雲端銷控表（網格模式）', crop: { x: 704, y: 548, w: 1760, h: 990 } },
  'sales-mobile': { src: salesMobile, width: 780, height: 1688, frame: 'phone', alt: '手機版銷控表', crop: { x: 0, y: 0, w: 780, h: 1430 } },
  'vip-form-mobile': { src: vipFormMobile, width: 780, height: 1688, frame: 'phone', alt: '貴賓資料表（客戶手機填寫）', crop: { x: 0, y: 128, w: 780, h: 1430 } },
  'booking-page-mobile': { src: bookingMobile, width: 780, height: 1688, frame: 'phone', alt: '客戶線上預約頁', crop: { x: 0, y: 256, w: 780, h: 1430 } },
  'website-1': { src: website1, width: 1600, height: 904, frame: 'browser', alt: '建案形象網站', crop: null },
  'website-2': { src: website2, width: 1600, height: 899, frame: 'browser', alt: '案場電子表板', crop: null },
};

/** 截圖的裁切範圍（沒設定就是整張） */
export const shotCrop = (shot) => shot.crop || { x: 0, y: 0, w: shot.width, h: shot.height };

// 各模組示意：mock＝示意圖種類（ProductMock.vue），shots＝真實截圖
export const MODULE_VISUALS = {
  sales: { shots: ['sales-grid'] },
  quote: { mock: 'quote', shots: ['sales-mobile'] },
  parking: { mock: 'parking' }, // 原截圖在手機上看不清，改示意圖
  ai: { mock: 'ai' },
  customer: { mock: 'customer', shots: ['vip-form-mobile'] },
  leads: { mock: 'leads' },
  lineAi: { mock: 'lineAi' },
  contract: { mock: 'contract' },
  commission: { mock: 'commission' },
  booking: { mock: 'booking', shots: ['booking-page-mobile'] },
  handover: { mock: 'handover' },
  inspection: { mock: 'inspection' },
  website: { shots: ['website-1', 'website-2'] },
  admin: null,
};

// 開始試用三步驟：本頁第一步不寫「掃碼」（手機看不到自己螢幕上的 QR），其餘沿用共用文案（deck 不變）
export const PAGE_TRIAL_STEP_FIRST = { title: '留下資料', desc: '30 秒填寫基本資料' };

// 方案價格、常見問題也列在模組列與目錄
export const EXTRA_NAV = [
  { id: 'pricing', nav: '方案價格' },
  { id: 'faq', nav: '常見問題' },
];

// 頁面所有章節（scrollspy 與網址 /product/:section 使用的 id，依頁面順序）
export const SECTION_IDS = ['top', 'pain', 'flow', 'roles', ...MODULE_ORDER, 'why', 'pricing', 'faq', 'start'];
