import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
const InspectionManagement = () => import('@/views/InspectionManagement.vue');

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionSystem from '@/views/InspectionSystem.vue'
import InspectionDetail from '@/views/InspectionDetail.vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';

// ✅ 1. 移除舊的 Entry 元件
// import SalesControlSystemEntry from '@/views/SalesControlSystemEntry.vue';
// const InspectionCalendarEntry = () => import('@/views/inspectionCalenderEntry.vue');

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
    path: '/inspection-system',
    name: 'InspectionSystem',
    component: InspectionSystem,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋系統',
      layout: DefaultLayout
    }
  },

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

  if (!to.meta.requiresAuth) {
    if (isLoggedIn && to.name === 'Login') {
      return next({ name: 'Home' });
    }
    return next();
  }

  if (!isLoggedIn) {
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
          // ✅ 6. 修正：當路由沒有 projectId 時 (例如在 ProjectSelector 頁面)
          // 權限檢查應改為檢查 "是否至少有 *任一* 建案的此系統權限"
          // 而不是檢查 `hasPermission` (它會檢查所有建案)
          // 我們在 `router.beforeEach` 中 *放寬* 檢查，讓使用者先進到 ProjectSelector
          // ProjectSelector 內部的 `onMounted` 會做 *精確* 檢查，只顯示他有權限的建案
          
          // 原本的邏輯:
          // if (!userStore.hasPermission(requiredSystem)) {
          
          // ✅ 修改後的邏輯:
          // 我們信任 ProjectSelector 會處理好篩選，
          // 但我們仍需檢查使用者是否 *至少有一個* 該系統的權限
          const hasAnyAccess = userStore.hasPermission(requiredSystem);
          
          if (!hasAnyAccess) {
            alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
            return next({ name: 'Home' });
          }
        }
      }
  }

  return next();
});

export default router;