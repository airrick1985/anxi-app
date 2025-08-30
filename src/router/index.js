import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // ✅ 1. 引入 projectStore

import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionSystem from '@/views/InspectionSystem.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';
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
    path: '/inspection-overview',
    name: 'InspectionOverview',
    component: InspectionOverview,
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
      requiredAnySystem: ['驗屋時間表-修改', '驗屋時間表-檢視'], layout: DefaultLayout
    }
  },
  {
    path: '/internal/inspection-calendar/:projectId',
    name: 'InternalInspectionCalendar',
    component: InspectionCalendar,
    props: true,
    meta: {
      requiresAuth: true,
      requiredAnySystem: ['驗屋時間表-修改', '驗屋時間表-檢視'], layout: DefaultLayout
    }
  },
  {
    path: '/booking-rule-manager/:projectId',
    name: 'BookingRuleManager',
    component: BookingRuleManager,
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋時間表-修改',
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
      // 假設查看戶別總表也需要 '驗屋時間表-檢視' 或更高權限
      requiredAnySystem: ['驗屋時間表-修改'],
      layout: DefaultLayout
    }
  },

  { path: '/:pathMatch(.*)*', redirect: '/home' }
];



const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

// ❌ 不再需要寫死的對照表
// const PROJECT_NAME_MAP = { ... };

router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore();
  const projectStore = useProjectStore(); // ✅ 2. 獲取 projectStore 的實例
  const isLoggedIn = userStore.isLoggedIn;

  // ✅ 3. 確保專案資料已載入
  // 如果 projectStore 內的列表是空的，且不是在讀取中，就觸發載入
  if (isLoggedIn && projectStore.projectsList.length === 0 && !projectStore.isLoading) {
    await projectStore.fetchProjects();
  }

  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  if (isLoggedIn && to.name === 'Login') {
    return next({ name: 'Home' });
  }

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
        // ✅ 4. 使用 projectStore 中的 idToNameMap 來動態查找專案名稱
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

  return next();
});

export default router;