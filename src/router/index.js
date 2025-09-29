import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // ✅ 1. 引入 projectStore

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
const DefaultLayout = () => import('@/layouts/DefaultLayout.vue');
const PublicLayout = () => import('@/layouts/PublicLayout.vue');
const BookingRuleManager = () => import('@/views/BookingRuleManager.vue');
const InspectionCalendar = () => import('@/views/public/InspectionCalendar.vue');
import HouseholdGrid from '@/views/HouseholdGrid.vue';



const routes = [
  { path: '/', redirect: '/home' },
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
    path: '/internal/inspection-calendar/:projectId',
    name: 'InternalInspectionCalendar',
    component: InspectionCalendar,
    props: true,
    meta: {
      requiresAuth: true,
      requiredAnySystem: ['驗屋預約管理-修改', '驗屋預約管理-檢視'], layout: DefaultLayout
    }
  },
  {
    path: '/booking-rule-manager/:projectId',
    name: 'BookingRuleManager',
    component: BookingRuleManager,
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋預約管理-修改',
      layout: DefaultLayout
    }
  },

  {
    path: '/project/:projectId/households',
    name: 'HouseholdGrid',
    component: HouseholdGrid,
    props: true, // 讓 Vue Router 自動將 projectId 作為 prop 傳入元件
    meta: {
      requiresAuth: true,
      // 假設查看戶別總表也需要 '驗屋預約管理-檢視' 或更高權限
      requiredAnySystem: ['驗屋預約管理-修改'],
      layout: DefaultLayout
    }
  },

{
    path: '/backup-management',
    name: 'BackupManagement',
    component: () => import('@/views/BackupManagement.vue'),
    // ✅ 1. 在 meta 中加入需要的角色
    meta: { 
      requiresAuth: true,
      requiredRoles: ['超級管理員'] // 指定只有超級管理員可以進入
    } 
  },

  {
  // ✅ 新增特殊上傳報告頁面的路由
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
  { path: '/:pathMatch(.*)*', redirect: '/home' }
];



const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});



router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const projectStore = useProjectStore();
  const isLoggedIn = userStore.isLoggedIn;

  // 確保專案資料已載入
  if (isLoggedIn && projectStore.projectsList.length === 0 && !projectStore.isLoading) {
    await projectStore.fetchProjects();
  }

  // 1. 檢查是否需要登入
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. 如果已登入，防止回到登入頁
  if (isLoggedIn && to.name === 'Login') {
    return next({ name: 'Home' });
  }
  
  // ✅ START: 在這裡插入我們新的「角色權限」檢查邏輯
  const requiredRoles = to.meta.requiredRoles;
  if (requiredRoles && Array.isArray(requiredRoles)) {
    const userRoles = userStore.currentUserRoles;
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    if (hasRequiredRole) {
      return next(); // 有權限，放行
    } else {
      alert(`權限不足：您需要具備 [${requiredRoles.join(', ')}] 角色才能訪問此頁面。`);
      return next({ name: 'Home' }); // 沒有權限，導回首頁
    }
  }
  // ✅ END: 插入結束

  // --- 以下是您所有既有的、強大的權限檢查邏輯，我們將它們保留下來 ---

  const requiredAny = to.meta.requiredAnySystem;
    if (requiredAny && Array.isArray(requiredAny)) {
      const hasAccess = requiredAny.some(permissionName => userStore.hasPermission(permissionName));
      if (hasAccess) {
        return next();
      } else {
        alert(`權限不足：您沒有進入此系統的權限。`);
        return next({ name: 'Home' });
      }
    }

  if (isLoggedIn) {
    const requiredPermission = to.meta.requiresPermission;
    const requiredSystem = to.meta.requiredSystem;
    const requiredProject = to.meta.requiredProjectForSystem;

    if (requiredPermission) {
      if (userStore[requiredPermission]) {
        return next();
      } else {
        alert(`權限不足：您沒有執行此操作的權限。`);
        return next({ name: 'Home' });
      }
    }
    
    if (requiredSystem) {
        if (requiredProject) {
            if (userStore.hasProjectPermission(requiredSystem, requiredProject)) {
                return next();
            } else {
                alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
                return next({ name: 'Home' });
            }
        }
      
      const projectId = to.params.projectName || to.params.projectId;
      if (projectId) {
        const fullProjectName = projectStore.idToNameMap[projectId];

        if (!fullProjectName) {
            alert(`錯誤：找不到建案 ID "${projectId}" 的對應資料。`);
            return next({ name: 'Home' });
        }

        if (userStore.hasProjectPermission(requiredSystem, fullProjectName)) {
          return next();
        } else {
          alert(`權限不足：您沒有進入建案「${fullProjectName}」的「${requiredSystem}」權限。`);
          return next({ name: 'Home' });
        }
      } else {
        if (userStore.hasPermission(requiredSystem)) {
          return next();
        } else {
          alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
          return next({ name: 'Home' });
        }
      }
    }
  }

  // 如果以上所有權限檢查都通過，或該頁面不需任何權限，則放行
  return next();
});

export default router;


