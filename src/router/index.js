import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; //  1. 引入 projectStore
const InspectionManagement = () => import('@/views/InspectionManagement.vue');



import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionSystem from '@/views/InspectionSystem.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionDetail from '@/views/InspectionDetail.vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
import SalesControlSystemEntry from '@/views/SalesControlSystemEntry.vue';
const InspectionCalendarEntry = () => import('@/views/inspectionCalenderEntry.vue');
const MessageCenter = () => import('@/views/MessageCenter.vue');
const SendMessage = () => import('@/views/SendMessage.vue');
const MessageDetail = () => import('@/views/MessageDetail.vue');
const UserManagement = () => import('@/views/UserManagement.vue');
const SubscriptionManagement = () => import('@/views/SubscriptionManagement.vue');
const SubscriptionStatus = () => import('@/views/SubscriptionStatus.vue');
import DefaultLayout from '@/layouts/DefaultLayout.vue'; // <-- ✓ 修改為靜態引入
const PublicLayout = () => import('@/layouts/PublicLayout.vue');
const BookingRuleManager = () => import('@/views/BookingRuleManager.vue');
const InspectionCalendar = () => import('@/views/public/InspectionCalendar.vue');
import HouseholdGrid from '@/views/HouseholdGrid.vue';





const routes = [
 // { path: '/', redirect: '/home' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home, meta: { requiresAuth: true } },
  {
    path: '/inspectionsystem',
    name: 'InspectionSystem',
    component: InspectionSystem,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋系統',
      layout: DefaultLayout
    }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('@/views/UserProfile.vue'),
    meta: {
      requiresAuth: true, // 確保只有登入的使用者才能進入
      layout: DefaultLayout
    }
  },
  {
    path: '/inspection-record',
    name: 'InspectionRecord',
    component: InspectionRecord,
    meta: { requiresAuth: true, layout: DefaultLayout }
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
    path: '/sales-control-entry',
    name: 'SalesControlSystemEntry',
    component: SalesControlSystemEntry,
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統',
      layout: DefaultLayout
    }
  },
  {
    path: '/quote-system-entry',
    name: 'QuoteSystemEntry',
    component: SalesControlSystemEntry,
    meta: {
      requiresAuth: true,
      requiredSystem: '報價系統',
      layout: DefaultLayout
    }
  },
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
    requiresAuth: true, // 假設此頁面需要登入
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

  //  START: 新增授權書簽署頁面路由
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
    path: '/line-binding', // 您可以自訂網址路徑
    name: 'LineBindingPage',
    component: () => import('@/views/public/LineBinding.vue'),
    meta: {
      layout: PublicLayout // ✓ 指定使用公開頁面佈局，不需要登入
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
    path: '/inspection-calendar-entry',
    name: 'ProjectSelector',
    component: InspectionCalendarEntry,
    meta: {
      requiresAuth: true,
      requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'], layout: DefaultLayout
    }
  },
  {
    path: '/inspection-management/:projectId',
    component: InspectionManagement,
    //  3. 將原本的頁面設定為子路由
    children: [
      {
        path: 'calendar', //  <- 使用相對路徑
        name: 'InternalInspectionCalendar',
        component: InspectionCalendar,
        props: true,
        meta: {
          requiresAuth: true,
          requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'],
          layout: DefaultLayout // 佈局設定可以保留或移除，取決於您的 DefaultLayout 設計
        }
      },
      {
        path: 'households', // <- 使用相對路徑
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
        path: 'rules', // <- 使用相對路徑
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
    //  1. 在 meta 中加入需要的角色
    meta: { 
      requiresAuth: true,
      requiredRoles: ['超級管理員'] // 指定只有超級管理員可以進入
    } 
  },

  {
  //  新增特殊上傳報告頁面的路由
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
      // 您可以在此加入其他 meta 資訊，例如頁面標題
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
 // { path: '/:pathMatch(.*)*', redirect: '/home' }
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

  // 1. 公開頁面快速通道：如果目標頁面不需要登入，立即放行。
  // 這是最重要的修改，它會讓 /line-binding 和 /booking 等頁面直接通過。
  if (!to.meta.requiresAuth) {
    // 額外處理：如果使用者已登入但試圖訪問登入頁，將他導回首頁。
    if (isLoggedIn && to.name === 'Login') {
      return next({ name: 'Home' });
    }
    // 其他所有公開頁面，一律放行。
    return next();
  }

  // --- 從這裡開始，所有頁面都確定是需要登入的 ---

  // 2. 檢查登入狀態：如果頁面需要登入但使用者未登入，導向登入頁。
  if (!isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // --- 從這裡開始，使用者確定已登入 ---
  
  // 3. 確保專案資料已載入 (維持不變)
  if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
    await projectStore.fetchProjects();
  }

  // 4. 執行所有後續的、更詳細的權限檢查 (角色、系統權限等)
  // (您所有既有的 requiredRoles, requiredAnySystem, requiredSystem 等檢查邏輯都放在這裡，維持不變)
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
      const requiredProject = to.meta.requiredProjectForSystem;
      if (requiredProject) {
          if (!userStore.hasProjectPermission(requiredSystem, requiredProject)) {
              alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
              return next({ name: 'Home' });
          }
      } else {
        const projectId = to.params.projectName || to.params.projectId;
        if (projectId) {
          const fullProjectName = projectStore.idToNameMap[projectId];
          if (!fullProjectName) {
              alert(`錯誤：找不到建案 ID "${projectId}" 的對應資料。`);
              return next({ name: 'Home' });
          }
          if (!userStore.hasProjectPermission(requiredSystem, fullProjectName)) {
            alert(`權限不足：您沒有進入建案「${fullProjectName}」的「${requiredSystem}」權限。`);
            return next({ name: 'Home' });
          }
        } else {
          if (!userStore.hasPermission(requiredSystem)) {
            alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
            return next({ name: 'Home' });
          }
        }
      }
  }

  // 5. 如果所有檢查都通過，最終放行
  return next();
});

export default router;


