import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';



// ✅ 將 Layouts 改為延遲載入常數，方便重用
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue');
const PublicLayout = () => import('@/layouts/PublicLayout.vue');

// --- 保持您原有的延遲載入 View 元件 ---
const InspectionManagement = () => import('@/views/InspectionManagement.vue');
const InspectionConsole = () => import('@/views/public/InspectionConsole.vue');
const ProjectSelector = () => import('@/views/ProjectSelector.vue');
const MessageCenter = () => import('@/views/MessageCenter.vue');
const SendMessage = () => import('@/views/SendMessage.vue');
const MessageDetail = () => import('@/views/MessageDetail.vue');
const UserManagement = () => import('@/views/UserManagement.vue');
const SubscriptionManagement = () => import('@/views/SubscriptionManagement.vue');
const SubscriptionStatus = () => import('@/views/SubscriptionStatus.vue');
const BookingRuleManager = () => import('@/views/BookingRuleManager.vue');
const InspectionCalendar = () => import('@/views/public/InspectionCalendar.vue');
const InspectionAdmin = () => import('@/views/admin/InspectionAdmin.vue');
const SmsReportMonitor = () => import('@/views/SmsReportMonitor.vue');

const routes = [
  {
    path: '/',
    name: 'LandingPage',
    component: () => import('@/views/LandingPage.vue'),
    meta: {
      requiresAuth: false, // 公開頁面
      layout: PublicLayout, // 使用公開 Layout
      title: 'ANXI 安熙智慧 - 首頁'
    }
  },

  { path: '/login', name: 'Login', component: () => import('@/views/Login.vue') }, // ✅
  { path: '/home', name: 'Home', component: () => import('@/views/Home.vue'), meta: { requiresAuth: true } }, // ✅
 

  {
  path: '/admin/inspection-admin',
  name: 'InspectionAdmin',
  component: InspectionAdmin,
  meta: {
    requiredSystem: '驗屋系統',
    requiredRoles: ['超級管理員','系統管理員','客服主管','工務主管'],
    requiresAuth: true,
    layout: DefaultLayout // ✅
  }
},


{
  path: '/test', 
  name: 'Test',
  component: () => import('@/views/PrintQuotation.vue'),
  meta: {
     title: 'TEST',
     layout: PublicLayout // ✅
    }
 },

  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: {
      requiresAuth: true,
      layout: DefaultLayout // ✅
    }
  },
  {
    path: '/inspection-detail/:unitId',
    name: 'InspectionDetail',
    component: () => import('@/views/InspectionDetail.vue'), // ✅
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout } // ✅
  },
  {
    path: '/inspection-record-table/:unitId',
    name: 'InspectionRecordTable',
    component: () => import('@/components/InspectionRecordTable.vue'), // ✅
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout } // ✅
  },
 {
    // ✅ 3. 修改「銷控系統」入口
    path: '/sales-control-entry',
    name: 'SalesControlSystemEntry',
    component: ProjectSelector, // (保持延遲載入)
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout, // ✅
      targetRouteName: 'SalesControlSystem', 
      paramKey: 'projectName'              
    }
  },
  {
    // ✅ 4. 修改「報價系統」入口
    path: '/quote-system-entry',
    name: 'QuoteSystemEntry',
    component: ProjectSelector, // (保持延遲載入)
    meta: {
      requiresAuth: true,
      requiredSystem: '報價系統', 
      layout: DefaultLayout, // ✅
      targetRouteName: 'QuoteSystem', 
      paramKey: 'projectName'           
    }
  },


  {
    path: '/inspection-console/:projectId?', // ✓ 保持 '?'
    name: 'InspectionConsole',
    component: InspectionConsole, // (保持延遲載入)
    props: true, 
    meta: {
      layout: PublicLayout, // ✅
      title: '驗屋紀錄' 
    }
  },
  // ✓ END: 修改

  {
    path: '/sales-control/:projectName',
    name: 'SalesControlSystem',
    component: () => import('@/views/SalesControlSystem.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      viewMode: 'sales',
      requiredSystem: '銷控系統',
      layout: DefaultLayout // ✅
    }
  },
  {
    path: '/quote-system/:projectName',
    name: 'QuoteSystem',
    component: () => import('@/views/SalesControlSystem.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      viewMode: 'quote',
      requiredSystem: '報價系統',
      layout: DefaultLayout // ✅
    }
  },
  {
    path: '/quote-settings/:projectName',
    name: 'QuoteSettings',
    component: () => import('@/views/QuoteSettings.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '報價系統',
    }
  },
  {
    path: '/payment-settings/:projectName/:unitId',
    name: 'PaymentSettings',
    component: () => import('@/views/PaymentSettings.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout // ✅
    }
  },
  {
  path: '/sales-settings/:projectId',
  name: 'SalesSettings',
  component: () => import('@/views/SalesSettings.vue'),
  meta: {
    requiresAuth: true,
    requiredSystem: '銷控系統',
    title: '銷控設定'
  }
},
  {
    path: '/quote-summary',
    name: 'QuoteSummary',
    component: () => import('@/views/QuoteSummary.vue'),
    meta: {
      requiresAuth: true,
      layout: DefaultLayout // ✅
    }
  },
  {
    path: '/messages',
    name: 'MessageCenter',
    component: MessageCenter, // (保持延遲載入)
    meta: { requiresAuth: true, layout: DefaultLayout } // ✅
  },
  {
    path: '/message/:statusId',
    name: 'MessageDetail',
    component: MessageDetail, // (保持延遲載入)
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout } // ✅
  },
  {
    path: '/send-message',
    name: 'SendMessage',
    component: SendMessage, // (保持延遲載入)
    meta: {
      requiresAuth: true,
      requiresPermission: 'canSendMessage',
      layout: DefaultLayout // ✅
    }
  },
  {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement, // (保持延遲載入)
        meta: {
            requiresAuth: true,
            requiredSystem: '人員管理',
            layout: DefaultLayout // ✅
        }
    },
    {
        path: '/subscription-management',
        name: 'SubscriptionManagement',
        component: SubscriptionManagement, // (保持延遲載入)
        meta: {
            requiresAuth: true,
            requiredSystem: '訂閱管理',
            requiredProjectForSystem: '安熙智慧',
            layout: DefaultLayout // ✅
        }
    },
 {
    path: '/subscription-status',
    name: 'SubscriptionStatus',
    component: SubscriptionStatus, // (保持延遲載入)
    meta: {
      requiresAuth: true,
      requiredSystem: '訂閱查詢',
      layout: DefaultLayout // ✅
    }
  },
  {
    path: '/booking/:projectId',
    name: 'PublicBookingPage',
    component: () => import('@/views/BookingPage.vue'),
    props: true,
    meta: {
    layout: PublicLayout // ✅
    }
  },
  {
    path: '/vip-form/:projectId',
    name: 'VipForm',
    component: () => import('@/views/VipForm.vue'), // ✓ 指向新檔案
    props: true,
    meta: {
      layout: PublicLayout, // ✓ 使用 PublicLayout
      title: '貴賓資料表'
    }
  },

  {
    path: '/vip-login', // 這是銷售人員的登入入口
    name: 'VipFormLogin',
    component: () => import('@/views/VipFormLogin.vue'),
    props: true,
    meta: {
      layout: PublicLayout, // ✓ 使用 PublicLayout
      title: '貴賓資料表選擇入口'
    }
  },

{
    // ✓ 1. 新增「銷售人員登入」專用路徑 (沒有 props)
    path: '/customer-data-sheet',
    name: 'CustomerDataSheetLogin', // 登入頁
    component: () => import('@/views/CustomerDataSheet.vue'), 
    props: false, // ✓ 確保 props 為 false
    meta: {
      layout: PublicLayout,
      title: '客戶資料表登入'
    }
  },
  {
    // ✓ 2. 修改「客戶 QR Code」專用路徑 (有 props)
    path: '/customer-data-sheet/:projectId/:docId?', 
    name: 'CustomerDataSheetForm', // 表單頁
    component: () => import('@/views/CustomerDataSheet.vue'), 
    props: true,
    meta: {
      layout: PublicLayout,
      title: '客戶資料表'
    }
  },
// ✅ [新增] 客資查詢 - 入口 (負責 LIFF 驗證與分流)
  {
    path: '/customer-query-entry',
    name: 'CustomerQueryEntry',
    component: () => import('@/views/CustomerQueryEntry.vue'),
    meta: { 
       layout: PublicLayout,
        title: '客資查詢系統入口',
      requiresAuth: false
     } // 頁面內部處理 LIFF 登入
  },

  // ✅ [新增] 客資查詢 - 主頁面 (需權限)
  {
    path: '/customer-query/:projectId',
    name: 'CustomerQuery',
    component: () => import('@/views/CustomerQuery.vue'),
    meta: { 
      layout: PublicLayout,
      title: '客資查詢系統',
      requiresAuth: true,
      requiredAnySystem: ['客資系統-櫃台', '客資系統-銷售'] // 路由守衛會檢查
    }
  },


  {
    path: '/sign-auth/:token',
    name: 'AuthSigningPage',
    component: () => import('@/views/public/AuthSigningPage.vue'),
    props: true,
    meta: {
      layout: PublicLayout // ✅
    }
  },

    {
    path: '/line-binding',
    name: 'LineBindingPage',
    component: () => import('@/views/public/LineBinding.vue'),
    meta: {
      layout: PublicLayout // ✅
    }
  },

   {
    path: '/verify-line-binding',
    name: 'VerifyLineBindingPage',
    component: () => import('@/views/public/VerifyLineBinding.vue'),
    meta: {
      layout: PublicLayout // ✅
    }
  },

   {
    path: '/appointment-query',
    name: 'AppointmentQueryPage',
    component: () => import('@/views/public/AppointmentQuery.vue'),
    meta: {
      layout: PublicLayout // ✅
    }
  },
  
{
    path: '/liffinspection-calendar',
    name: 'LiffInspectionCalendar',
    component: () => import('@/views/public/LiffInspectionCalendar.vue'),
    meta: {
     layout: PublicLayout // ✅
    }
  },

{
    path: '/report-folder-manager/:projectId?',
    name: 'ReportFolderManager',
    component: () => import('@/views/public/ReportFolderManager.vue'),
    props: true,
    meta: {
      layout: PublicLayout, // ✅
      title: '驗屋報告資料夾管理'
    }
  },
  // ✓ START: 新增客戶端驗屋報告路由
 {
    path: '/customer-report', // Path matches the URL
    name: 'CustomerInspectionReport',
    component: () => import('@/views/public/CustomerInspectionReport.vue'),
    // props: true, // 這行其實可以移除，因為 projectId/unitId 來自 token
    meta: {
      layout: PublicLayout, // ✅
      title: '驗屋報告'
      // <<-- 這裡正確地沒有 requiresAuth: true -->>
    }
  },
  // ✓ END: 新增客戶端驗屋報告路由
{
        path: '/inspection-calendar/:projectId',
        name: 'InspectionCalendar',
        component: InspectionCalendar, // (保持延遲載入)
        meta: {
          title: '驗屋預約表',
          layout: PublicLayout // ✅
        }
      },
  
      {

    path: '/privacy',
    name: 'PrivacyPolicy',
    component: () => import('@/views/public/PrivacyPolicy.vue'),
    meta: {
      title: '隱私權政策',
      layout: PublicLayout 
    }
  },
  
  // ✅ [新增] 服務條款路由
  {
    path: '/terms',
    name: 'TermsOfService',
    component: () => import('@/views/public/TermsOfService.vue'),
    meta: {
      title: '服務條款',
      layout: PublicLayout
    }
  },

  
  {
    // ✅ 5. 修改「驗屋預約」入口
    path: '/inspection-calendar-entry',
    name: 'ProjectSelector',
    component: ProjectSelector, // (保持延遲載入)
    meta: {
      requiresAuth: true,
      requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'], 
      layout: DefaultLayout, // ✅
      targetRouteName: 'InternalInspectionCalendar', 
      paramKey: 'projectId'                        
    }
  },
  {
    path: '/inspection-management/:projectId',
    component: InspectionManagement, // (保持延遲載入)
    children: [
      {
        path: 'calendar',
        name: 'InternalInspectionCalendar',
        component: InspectionCalendar, // (保持延遲載入)
        props: true,
        meta: {
          requiresAuth: true,
          requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'],
          layout: DefaultLayout // ✅
        }
      },
      {
        path: 'households',
        name: 'HouseholdGrid',
        component: () => import('@/views/HouseholdGrid.vue'), // ✅
        props: true,
        meta: {
          requiresAuth: true,
          requiredAnySystem: ['驗屋預約管理-修改'],
          layout: DefaultLayout // ✅
        }
      },
      {
        path: 'rules',
        name: 'BookingRuleManager',
        component: BookingRuleManager, // (保持延遲載入)
        props: true,
        meta: {
          requiresAuth: true,
          requiredSystem: '驗屋預約管理-修改',
          layout: DefaultLayout // ✅
        }
      }
    ]
  },

{
    path: '/backup-management',
    name: 'BackupManagement',
    component: () => import('@/views/BackupManagement.vue'),
    meta: { 
      requiresAuth: true,
      requiredRoles: ['超級管理員']
    } 
  },

  {
  path: '/special-report-upload/:projectId',
  name: 'SpecialReportUpload',
  component: () => import('@/views/SpecialReportUpload.vue'),
   meta: {
    layout: PublicLayout // ✅
    }
},

  {
    path: '/sizing-tool/:projectId/:unitId',
    name: 'FloorplanSizingTool',
    component: () => import('@/views/FloorplanSizingTool.vue'),
    meta: { 
      requiresAuth: true,
      title: '平面圖測量工具' 
    }
  },

  {
    path: '/parking-floorplan-manager/:projectId',
    name: 'ParkingFloorplanManager',
    component: () => import('@/views/ParkingFloorplanManager.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout, // ✅
      title: '車位平面圖管理'
    }
  },
  {
    path: '/parking-control/:projectId',
    name: 'ParkingControl',
    component: () => import('@/views/ParkingControl.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout, // ✅
      title: '車位銷控管理'
    }
  },

 {
    path: '/customer-system-entry',
    name: 'CustomerSystemEntry',
    component: ProjectSelector, // 重用 ProjectSelector
    meta: {
      requiresAuth: true,
      // 權限檢查：使用者必須至少有這兩個權限之一
      requiredAnySystem: ['客資系統-櫃台', '客資系統-銷售'], 
      layout: DefaultLayout,
      // 點選建案後要導向的目標路由
      targetRouteName: 'CustomerManagementSystem', 
      // 傳遞的參數名稱
      paramKey: 'projectId'                        
    }
  },
  // ✓ END: 新增「客資系統」入口

  // 1. 新增入口路由 (負責驗證與建案選擇)
{
  path: '/customer-management-entry',
  name: 'CustomerManagementEntry',
  component: () => import('@/views/CustomerManagementEntry.vue'),
  meta: {
    requiresAuth: false, // 避開全域登入，由組件內 LIFF 驗證
    layout: PublicLayout,
    title: '客資系統 - 建案選擇'
  }
},

  // ✓ START: 新增「客資系統」最終頁面 (待開發)
  {
    path: '/customer-management/:projectId',
    name: 'CustomerManagementSystem',
    // 指向我們即將建立的 CustomerManagement.vue 檔案
    component: () => import('@/views/CustomerManagement.vue'), 
    props: true,
    meta: {
      requiresAuth: true,
      // 進入此頁面也需要權限
      requiredAnySystem: ['客資系統-櫃台', '客資系統-銷售'],
      layout: DefaultLayout,
      title: '客資系統'
    }
  },

  {
    path: '/booking-sync/:projectId',
    name: 'BookingSync',
    component: () => import('@/views/public/BookingSync.vue'),
    props: true,
    meta: {
      layout: PublicLayout,
      title: '預約同步'
    }
  },

  // --- ✅ START: 新增 Standby 路由 ---
  {
    path: '/standby/:projectId', // ✓ 路由路徑，包含 projectId 參數
    name: 'Standby', // ✓ 路由名稱
    component: () => import('@/views/Standby.vue'), // ✓ 指向新的 Standby.vue 組件
    props: true, // ✓ 允許將路由參數 projectId 作為 props 傳遞給組件
    meta: {
      layout: PublicLayout, // ✅
      title: '接待狀態看板' // ✓ 頁面標題
     
    }
  },
  // --- ✅ END: 新增 Standby 路由 ---

  // ✅ [修改] 賞屋預約系統 - 入口 (負責 LIFF 驗證與分流)
  // URL: /?liff_path=/viewing-reservation-entry
  {
    path: '/viewing-reservation-entry',
    name: 'ViewingReservationEntry',
    component: () => import('@/views/ViewingReservationEntry.vue'), // 指向新建立的 Entry 組件
    meta: {
      requiresAuth: false, // ⚠️ 關鍵：設為 false 以避開全域登入跳轉
      layout: PublicLayout,
      title: '賞屋預約 - 建案選擇'
    }
  },

  // ✅ [新增] 簡訊回報監控頁面
  {
    path: '/sms-monitor',
    name: 'SmsReportMonitor',
    component: SmsReportMonitor,
    meta: {
      requiresAuth: true,               // 需要登入主系統
      requiredRoles: ['超級管理員', '系統管理員'], // 僅限管理員層級進入
      layout: DefaultLayout,             // 依照您的需求使用 PublicLayout (或依專案改為 DefaultLayout)
      title: '簡訊回報監控'
    }
  },

   {
    path: '/viewing-reservation-entry',
    name: 'ViewingReservationCalendarEntry',
    component: ProjectSelector, // 重用 ProjectSelector
    meta: {
      requiresAuth: true,
      // 權限檢查：使用者必須至少有這兩個權限之一
      requiredAnySystem: ['客資系統-櫃台', '客資系統-銷售'], 
      layout: DefaultLayout,
      // 點選建案後要導向的目標路由
      targetRouteName: 'ViewingReservationCalendar', 
      // 傳遞的參數名稱
      paramKey: 'projectId'                        
    }
  },


  // ✅ [修改] 賞屋預約系統 - 行事曆主頁
  {
    path: '/viewing-reservation/:projectId',
    name: 'ViewingReservationCalendar',
    component: () => import('@/views/ViewingReservationCalendar.vue'),
    props: true,
    meta: {
      requiresAuth: false, // ⚠️ 關鍵：設為 false，由組件內部檢查狀態
      layout: DefaultLayout,
      title: '賞屋預約行事曆'
    }
  },

  // ✅ 客資系統 - 入口 (負責 LIFF 驗證與權限分流)
{
  path: '/lead-distribution-entry',
  name: 'LeadDistributionEntry',
  component: () => import('@/views/LeadDistributionEntry.vue'),
  meta: {
    requiresAuth: false, // 由頁面內部 LIFF 檢查
    layout: PublicLayout,
    title: '聯絡名單系統 - 驗證中'
  }
},

// ✅ 客資系統 - 主頁面 (包含名單分配與回報列表)
{
  path: '/lead-distribution/:projectId',
  name: 'LeadDistribution',
  component: () => import('@/views/LeadDistribution.vue'),
  props: true,
  meta: {
    requiresAuth: false,
    layout: DefaultLayout,
    title: '聯絡名單管理'
  }
},

{
  path: '/contact',
  name: 'LeadReport',
  component: () => import('@/views/LeadReport.vue'),
  meta: { 
    requiresAuth: false,
     layout: PublicLayout,
     title: '聯絡名單'
   } // 因為是從 LINE 直接點擊，通常由頁面內部判斷或透過 LIFF 登入
},




   { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: { name: 'Home' } }

];



const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});


// -----------------------------------------------------------------
// ✅ 以下 router.beforeEach 路由守衛部分保持不變，未做修改
// -----------------------------------------------------------------
router.beforeEach(async (to, from, next) => {
  // --- 1. 初始進入 Log ---
  const isMobile = /Mobi|Android/i.test(navigator.userAgent); // 簡單判斷是否為手機
  const logPrefix = `[Router Guard Debug - ${isMobile ? 'Mobile' : 'Desktop'}]`;
  //console.log(`${logPrefix} Entry Point. To: ${to.fullPath}, From: ${from.name}, Query: ${JSON.stringify(to.query)}`);


// **** 👇👇👇 新增：LIFF 路徑救援邏輯 👇👇👇 ****
  
  // 1. 取得網址中問號後的參數 (window.location.search 包含 ?liff.state=...)
  const urlParams = new URLSearchParams(window.location.search);
  const liffState = urlParams.get('liff.state');

  // 2. 如果偵測到 liff.state 且目前路由停在首頁 '/'
  if (liffState && to.path === '/') {
    // 解碼路徑 (例如將 %23%2F 轉回 #/)
    const decodedPath = decodeURIComponent(liffState);
    // 移除最前面的 '#' 字元，以便 Vue Router 跳轉
    const cleanPath = decodedPath.replace(/^#/, '');

    console.log('[LIFF Redirect] 偵測到登入回傳狀態，自動導向目標路徑:', cleanPath);

    // 強制跳轉至救援路徑，並結束此次守衛
    return next(cleanPath);
  }
  
  // **** 👆👆👆 修改點結束 👆👆👆 ****


  const userStore = useUserStore();
  const projectStore = useProjectStore();
  const isLoggedIn = userStore.isLoggedIn; // 獲取主系統登入狀態

  // --- 2. LIFF 路徑判斷 Log ---
  const liffPath = to.query.liff_path;
  //console.log(`${logPrefix} Checking LIFF Entry. liffPath: ${liffPath}, from.name: ${from.name}`);
  const isLiffEntry = liffPath && from.name === undefined; // <-- 檢查 from.name 是否為 undefined
  //console.log(`${logPrefix} isLiffEntry evaluated to: ${isLiffEntry}`);

  if (isLiffEntry) {
    //console.log(`${logPrefix} LIFF Entry Detected.`);
    const targetPath = liffPath.startsWith('/') ? liffPath : `/${liffPath}`;
    //console.log(`${logPrefix} --> Redirecting via next('${targetPath}')`); // <-- Log LIFF 重導向目標
    return next(targetPath); // 執行重導向
  }

  // --- ✅ 2. [新增] 針對「首頁」的已登入自動跳轉 ---
  // 如果使用者要去首頁 (/)，且已經登入，直接送去 Home
  if (to.path === '/' && isLoggedIn) {
    return next({ name: 'Home' });
  }

  // 🔥 [NEW] 新增：PWA 模式偵測 (解決舊用戶免重裝問題) 🔥
  // 偵測是否為 Standalone (App) 模式
  const isPWA = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;

  // 如果是用 App 開啟，且剛好在首頁 (Landing Page)，且尚未登入 -> 強制去登入頁
  if (to.path === '/' && isPWA) {
    return next({ name: 'Login' });
  }

  // --- 3. 檢查 requiresAuth Log ---
  const requiresAuth = to.meta.requiresAuth; // <-- 取得目標路由的 requiresAuth 值
  //console.log(`${logPrefix} Auth Check. Path: ${to.fullPath}, requiresAuth: ${requiresAuth}`); // <-- Log requiresAuth 的值

  // --- 不需要驗證的公開路由 ---
  if (!requiresAuth) {
    //console.log(`${logPrefix} Public route detected.`);
    // 如果是公開路由，但使用者已登入且目標是 Login 頁，導向 Home
    if (isLoggedIn && to.name === 'Login') {
      //console.log(`${logPrefix} Already logged in, redirecting from Login to Home. Calling next({ name: 'Home' })`);
      return next({ name: 'Home' });
    }
    // 允許訪問公開路由
    //console.log(`${logPrefix} --> Allowing public route via next(). Target: ${to.fullPath}`); // <-- Log 允許公開路由
    return next();
  }

// --- 需要驗證的路由 ---
  if (!isLoggedIn) {
     const redirectTarget = { name: 'Login', query: { redirect: to.fullPath } };
     return next(redirectTarget);
  }

  // --- 使用者已登入 (主系統)，執行後續權限檢查 ---
  //console.log(`${logPrefix} User Logged In (userStore.isLoggedIn is true). Proceeding with permission checks.`);

  // --- 載入建案資料 (如果需要) ---
  if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
    //console.log(`${logPrefix} Fetching projects...`);
    await projectStore.fetchProjects();
  }

  const requiredRoles = to.meta.requiredRoles;
  if (requiredRoles && Array.isArray(requiredRoles)) {
    const userRoles = userStore.currentUserRoles;
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      alert(`權限不足：您需要具備 [${requiredRoles.join(', ')}] 角色才能訪問此頁面。`);
      return next({ name: 'Home' });
    }
  }

  const requiredAny = to.meta.requiredAnySystem;
  if (requiredAny && Array.isArray(requiredAny)) {
    const projectId = to.params.projectId;
    
    // 情境 A: 路由包含 projectId，需檢查「該建案」是否擁有任一權限
    if (projectId) {
        const fullProjectName = projectStore.idToNameMap[projectId];
        
        if (!fullProjectName) {
            console.error(`路由守衛：找不到 projectId "${projectId}" 對應的建案名稱。`);
            alert(`錯誤：無法驗證建案權限 (ID: ${projectId})。`);
            return next({ name: 'Home' });
        }

        // 檢查使用者在該建案下，是否擁有 requiredAny 中的任一個系統權限
        const hasProjectAccess = requiredAny.some(sys => userStore.hasProjectPermission(sys, fullProjectName));

        if (!hasProjectAccess) {
            alert(`權限不足：您沒有進入建案「${fullProjectName}」的權限 (需具備 ${requiredAny.join(' 或 ')} )。`);
            return next({ name: 'Home' });
        }
    } 
    // 情境 B: 一般全域權限檢查 (如入口頁)
    else {
        const hasAccess = requiredAny.some(permissionName => userStore.hasPermission(permissionName));
        if (!hasAccess) {
          alert(`權限不足：您沒有進入此系統的權限。`);
          return next({ name: 'Home' });
        }
    }
  }

  const requiredPermission = to.meta.requiresPermission;
  if (requiredPermission && !userStore[requiredPermission]) {
      alert(`權限不足：您沒有執行此操作的權限。`);
      return next({ name: 'Home' });
  }
    
  const requiredSystem = to.meta.requiredSystem;
  if (requiredSystem) {
      const requiredProjectForSystem = to.meta.requiredProjectForSystem; // 特定建案的特定系統 (如訂閱管理)

      if (requiredProjectForSystem) {
          // 情況 A: 檢查特定建案的特定系統權限 (邏輯不變)
          if (!userStore.hasProjectPermission(requiredSystem, requiredProjectForSystem)) {
              alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
              return next({ name: 'Home' });
          }
      } else {
          // 情況 B: 檢查路由參數中的建案權限 或 檢查是否有任一建案權限
          const projectId = to.params.projectId; // 獲取 projectId
          const projectNameParam = to.params.projectName; // 獲取 projectName

          if (projectId) {
              // 情況 B.1: 路由包含 projectId (例如 /inspection-console/:projectId)
              // ✓ START: 修改 - 路由守衛現在會檢查 projectStore
              // 我們需要確保 projectStore 已經載入
              if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
                 await projectStore.fetchProjects(); // 確保 idToNameMap 是最新的
              }
              // ✓ END: 修改
              const fullProjectName = projectStore.idToNameMap[projectId];
              if (!fullProjectName) {
                  // 如果 projectStore 還沒載入完畢，可能需要等待或顯示錯誤
                  console.error(`路由守衛：找不到 projectId "${projectId}" 對應的建案名稱。`);
                  alert(`錯誤：無法驗證建案權限 (ID: ${projectId})。`);
                  // 可以在這裡加載 projectStore 或直接跳轉
                  // await projectStore.fetchProjects(); // 嘗試重新加載
                  // const retryName = projectStore.idToNameMap[projectId];
                  // if(!retryName) ...
                  return next({ name: 'Home' });
              }
              if (!userStore.hasProjectPermission(requiredSystem, fullProjectName)) {
                alert(`權限不足：您沒有進入建案「${fullProjectName}」的「${requiredSystem}」權限。`);
                return next({ name: 'Home' });
              }
          } else if (projectNameParam) {
            // 情況 B.2: 路由包含 projectName (需要修改)
              // **** 👇👇👇 修改點開始 👇👇👇 ****
              // 1. 從 projectStore 透過 ID ('fuyu141') 查找完整的建案名稱
              const fullProjectName = projectStore.idToNameMap[projectNameParam];
              //console.log(`${logPrefix} ProjectNameParam ('${projectNameParam}') resolved to FullProjectName: '${fullProjectName}'`);

              // 2. 檢查是否成功找到建案名稱
              if (!fullProjectName) {
                  console.error(`${logPrefix} 找不到建案 ID "${projectNameParam}" 對應的建案名稱。Project Store Data:`, projectStore.idToNameMap);
                  alert(`錯誤：無法驗證建案權限 (ID: ${projectNameParam})。請確認建案資料已載入。`);
                  return next({ name: 'Home' }); // 中斷並導向 Home
              }

              // 3. 使用找到的完整建案名稱進行權限驗證
              if (!userStore.hasProjectPermission(requiredSystem, fullProjectName)) {
                alert(`權限不足：您沒有進入建案「${fullProjectName}」的「${requiredSystem}」權限。`);
                return next({ name: 'Home' }); // 權限不足，導向 Home
              }
              // **** 👆👆👆 修改點結束 👆👆👆 ****
          }
          else {
              // 情況 B.3: 路由不包含建案參數 (例如入口路由 /inspection-console-entry)
              // 檢查使用者是否 *至少有一個* 該系統的權限
              const hasAnyAccess = userStore.hasPermission(requiredSystem);
              if (!hasAnyAccess) {
                alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
                return next({ name: 'Home' });
              }
              // 如果有任一權限，則放行，讓 ProjectSelector 元件去處理顯示哪些建案
          }
      }
  }

//console.log(`${logPrefix} All permission checks passed.`);
  //console.log(`${logPrefix} --> Allowing protected route via next(). Target: ${to.fullPath}`); // <-- Log 允許受保護路由
  return next();
});

export default router;


