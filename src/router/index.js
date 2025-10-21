import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
const InspectionManagement = () => import('@/views/InspectionManagement.vue');

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';

import InspectionDetail from '@/views/InspectionDetail.vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
const InspectionConsole = () => import('@/views/public/InspectionConsole.vue');


// ✅ 2. 引入新的 ProjectSelector 元件
const ProjectSelector = () => import('@/views/ProjectSelector.vue');

const MessageCenter = () => import('@/views/MessageCenter.vue');
const SendMessage = () => import('@/views/SendMessage.vue');
const MessageDetail = () => import('@/views/MessageDetail.vue');
const UserManagement = () => import('@/views/UserManagement.vue');
const SubscriptionManagement = () => import('@/views/SubscriptionManagement.vue');
const SubscriptionStatus = () => import('@/views/SubscriptionStatus.vue');
import DefaultLayout from '@/layouts/DefaultLayout.vue';
const PublicLayout = () => import('@/layouts/PublicLayout.vue');
const BookingRuleManager = () => import('@/views/BookingRuleManager.vue');
const InspectionCalendar = () => import('@/views/public/InspectionCalendar.vue');
import HouseholdGrid from '@/views/HouseholdGrid.vue';
const InspectionAdmin = () => import('@/views/admin/InspectionAdmin.vue')

const routes = [
 // { path: '/', redirect: '/home' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home, meta: { requiresAuth: true } },
 

  {
  path: '/admin/inspection-admin',
  name: 'InspectionAdmin',
  component: InspectionAdmin,
  meta: {
    requiredSystem: '驗屋系統',
    requiredRoles: ['超級管理員','系統管理員','客服主管','工務主管'],
    requiresAuth: true,
    layout: DefaultLayout
  }
},

  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: {
      requiresAuth: true,
      layout: DefaultLayout
    }
  },
  {
    path: '/inspection-detail/:unitId',
    name: 'InspectionDetail',
    component: InspectionDetail,
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout }
  },
  {
    path: '/inspection-record-table/:unitId',
    name: 'InspectionRecordTable',
    component: InspectionRecordTable,
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout }
  },
 {
    // ✅ 3. 修改「銷控系統」入口
    path: '/sales-control-entry',
    name: 'SalesControlSystemEntry',
    component: ProjectSelector, // ✅ 改為 ProjectSelector
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout,
      targetRouteName: 'SalesControlSystem', // ✅ 新增 meta: 目標路由
      paramKey: 'projectName'              // ✅ 新增 meta: 路由參數 key
    }
  },
  {
    // ✅ 4. 修改「報價系統」入口
    path: '/quote-system-entry',
    name: 'QuoteSystemEntry',
    component: ProjectSelector, // ✅ 改為 ProjectSelector
    meta: {
      requiresAuth: true,
      requiredSystem: '報價系統', // 權限檢查依賴此
      layout: DefaultLayout,
      targetRouteName: 'QuoteSystem', // ✅ 新增 meta: 目標路由
      paramKey: 'projectName'           // ✅ 新增 meta: 路由參數 key
    }
  },
// ✅ 3. 新增驗屋系統入口路由
  {
    path: '/inspection-console-entry',
    name: 'InspectionConsoleEntry', // 給入口路由一個獨立的名字
    component: ProjectSelector,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋系統', // 指定需要的系統權限
      layout: DefaultLayout,
      targetRouteName: 'InspectionConsole', // 目標路由名稱
      paramKey: 'projectId' // 目標路由參數的 key
    }
  },
  // ✓ START: 修改 - 仿照 ReportFolderManager，改用 PublicLayout 並移除 requiresAuth
  {
    path: '/inspection-console/:projectId?', // ✓ 保持 '?'
    name: 'InspectionConsole',
    component: InspectionConsole,
    props: true, 
    meta: {
      // requiresAuth: true, // ✓ 移除
      // requiredSystem: '驗屋系統', // ✓ 移除 (由元件內部 liff 驗證)
      layout: PublicLayout, // ✓ 修改
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
      layout: DefaultLayout
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
      layout: DefaultLayout
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
      layout: DefaultLayout
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
      layout: DefaultLayout
    }
  },
  {
    path: '/messages',
    name: 'MessageCenter',
    component: MessageCenter,
    meta: { requiresAuth: true, layout: DefaultLayout }
  },
  {
    path: '/message/:statusId',
    name: 'MessageDetail',
    component: MessageDetail,
    props: true,
    meta: { requiresAuth: true, layout: DefaultLayout }
  },
  {
    path: '/send-message',
    name: 'SendMessage',
    component: SendMessage,
    meta: {
      requiresAuth: true,
      requiresPermission: 'canSendMessage',
      layout: DefaultLayout
    }
  },
  {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
            requiresAuth: true,
            requiredSystem: '人員管理',
            layout: DefaultLayout
        }
    },
    {
        path: '/subscription-management',
        name: 'SubscriptionManagement',
        component: SubscriptionManagement,
        meta: {
            requiresAuth: true,
            requiredSystem: '訂閱管理',
            requiredProjectForSystem: '安熙智慧',
            layout: DefaultLayout
        }
    },
 {
    path: '/subscription-status',
    name: 'SubscriptionStatus',
    component: SubscriptionStatus,
    meta: {
      requiresAuth: true,
      requiredSystem: '訂閱查詢',
      layout: DefaultLayout
    }
  },
  {
    path: '/booking/:projectId',
    name: 'PublicBookingPage',
    component: () => import('@/views/BookingPage.vue'),
    props: true,
    meta: {
    layout: PublicLayout
    }
  },

  {
    path: '/sign-auth/:token',
    name: 'AuthSigningPage',
    component: () => import('@/views/public/AuthSigningPage.vue'),
    props: true,
    meta: {
      layout: PublicLayout 
    }
  },

    {
    path: '/line-binding',
    name: 'LineBindingPage',
    component: () => import('@/views/public/LineBinding.vue'),
    meta: {
      layout: PublicLayout
    }
  },

   {
    path: '/verify-line-binding',
    name: 'VerifyLineBindingPage',
    component: () => import('@/views/public/VerifyLineBinding.vue'),
    meta: {
      layout: PublicLayout
    }
  },

   {
    path: '/appointment-query',
    name: 'AppointmentQueryPage',
    component: () => import('@/views/public/AppointmentQuery.vue'),
    meta: {
      layout: PublicLayout
    }
  },
  
{
    path: '/liffinspection-calendar',
    name: 'LiffInspectionCalendar',
    component: () => import('@/views/public/LiffInspectionCalendar.vue'),
    meta: {
     layout: PublicLayout
    }
  },

{
    path: '/report-folder-manager/:projectId?',
    name: 'ReportFolderManager',
    component: () => import('@/views/public/ReportFolderManager.vue'),
    props: true,
    meta: {
      layout: PublicLayout,
      title: '驗屋報告資料夾管理'
    }
  },
{
        path: '/inspection-calendar/:projectId',
        name: 'InspectionCalendar',
        component: InspectionCalendar,
        meta: {
          title: '驗屋預約表',
          layout: PublicLayout
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

    {
    path: '/test', 
    name: 'Test',
    component: () => import('@/views/TestDatePicker.vue'),
    meta: {
          title: 'TEST',
          layout: PublicLayout
        }
  },
  
  {
    // ✅ 5. 修改「驗屋預約」入口
    path: '/inspection-calendar-entry',
    name: 'ProjectSelector',
    component: ProjectSelector, // ✅ 改為 ProjectSelector
    meta: {
      requiresAuth: true,
      requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'], // 權限檢查依賴此
      layout: DefaultLayout,
      targetRouteName: 'InternalInspectionCalendar', // ✅ 新增 meta: 目標路由
      paramKey: 'projectId'                        // ✅ 新增 meta: 路由參數 key
    }
  },
  {
    path: '/inspection-management/:projectId',
    component: InspectionManagement,
    children: [
      {
        path: 'calendar',
        name: 'InternalInspectionCalendar',
        component: InspectionCalendar,
        props: true,
        meta: {
          requiresAuth: true,
          requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'],
          layout: DefaultLayout
        }
      },
      {
        path: 'households',
        name: 'HouseholdGrid',
        component: HouseholdGrid,
        props: true,
        meta: {
          requiresAuth: true,
          requiredAnySystem: ['驗屋預約管理-修改'],
          layout: DefaultLayout
        }
      },
      {
        path: 'rules',
        name: 'BookingRuleManager',
        component: BookingRuleManager,
        props: true,
        meta: {
          requiresAuth: true,
          requiredSystem: '驗屋預約管理-修改',
          layout: DefaultLayout
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
    layout: PublicLayout
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
      layout: DefaultLayout,
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
      layout: DefaultLayout,
      title: '車位銷控管理'
    }
  },

   { path: '/:pathMatch(.*)*', name: 'NotFound', redirect: { name: 'Home' } }

];



const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});



router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const projectStore = useProjectStore();
  const isLoggedIn = userStore.isLoggedIn;

  // ✅ --- 新增：LIFF 路徑判斷 ---
  // 檢查是否是從 LIFF 帶 liff_path 參數進入
  const isLiffEntry = to.query.liff_path && from.name === undefined; // from.name === undefined 判斷是否為首次進入

  if (isLiffEntry) {
    // 如果是 LIFF 首次進入，直接放行，讓目標元件處理 LIFF 初始化和登入
    console.log('[Router Guard] LIFF entry detected, bypassing initial auth check.');
    return next();
  }
  // ✅ --- LIFF 路徑判斷結束 ---

  if (!to.meta.requiresAuth) {
    if (isLoggedIn && to.name === 'Login') {
      return next({ name: 'Home' });
    }
    return next();
  }

  if (!isLoggedIn) {
     // 如果不是 LIFF 首次進入，且未登入，才導向 Login
    console.log('[Router Guard] Not logged in, redirecting to Login.');
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }
  
  if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
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
    const hasAccess = requiredAny.some(permissionName => userStore.hasPermission(permissionName));
    if (!hasAccess) {
      alert(`權限不足：您沒有進入此系統的權限。`);
      return next({ name: 'Home' });
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
              // 情況 B.2: 路由包含 projectName (例如 /sales-control/:projectName)
              // 假設 projectNameParam 就是完整的建案名稱
              if (!userStore.hasProjectPermission(requiredSystem, projectNameParam)) {
                alert(`權限不足：您沒有進入建案「${projectNameParam}」的「${requiredSystem}」權限。`);
                return next({ name: 'Home' });
              }
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

  return next();
});

export default router;