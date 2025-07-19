import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';
import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionSystem from '@/views/InspectionSystem.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';
import InspectionDetail from '@/views/InspectionDetail.vue';
import InspectionRecordTable from '@/components/InspectionRecordTable.vue';
import SalesControlSystemEntry from '@/views/SalesControlSystemEntry.vue';

// ✅ 懶加載 (Lazy Loading) 新的訊息頁面元件
const MessageCenter = () => import('@/views/MessageCenter.vue');
const SendMessage = () => import('@/views/SendMessage.vue');
const MessageDetail = () => import('@/views/MessageDetail.vue');
const UserManagement = () => import('@/views/UserManagement.vue');

const routes = [
  { path: '/', redirect: '/home' }, // 調整：通常登入後會導向 /home
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home, meta: { requiresAuth: true } },
  {
    path: '/inspectionsystem',
    name: 'InspectionSystem',
    component: InspectionSystem,
    meta: {
      requiresAuth: true,
      requiredSystem: '驗屋系統'
    }
  },
  {
    path: '/inspection-record',
    name: 'InspectionRecord',
    component: InspectionRecord,
    meta: { requiresAuth: true }
  },
  {
    path: '/inspection-overview',
    name: 'InspectionOverview',
    component: InspectionOverview,
    meta: { requiresAuth: true }
  },
  {
    path: '/inspection-detail/:unitId',
    name: 'InspectionDetail',
    component: InspectionDetail,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/inspection-record-table/:unitId',
    name: 'InspectionRecordTable',
    component: InspectionRecordTable,
    props: true,
    meta: { requiresAuth: true }
  },
  {
    path: '/sales-control-entry',
    name: 'SalesControlSystemEntry',
    component: SalesControlSystemEntry,
    meta: { requiresAuth: true, requiredSystem: '銷控系統' } // 建議加上權限檢查
  },
  {
    path: '/sales-control/:projectName',
    name: 'SalesControlSystem',
    component: () => import('@/views/SalesControlSystem.vue'),
    props: true, // 讓 projectName 可以作為 props 傳入
    meta: {
      requiresAuth: true,
      viewMode: 'sales',
      requiredSystem: '銷控系統'
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
      requiredSystem: '報價系統'
    }
  },
  {
    path: '/quote-settings/:projectName',
    name: 'QuoteSettings',
    component: () => import('@/views/QuoteSettings.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '報價系統'
    }
  },
  {
    path: '/payment-settings/:projectName/:unitId',
    name: 'PaymentSettings',
    component: () => import('@/views/PaymentSettings.vue'),
    props: true,
    meta: {
      requiresAuth: true,
      requiredSystem: '銷控系統'
    }
  },
  {
    path: '/quote-summary',
    name: 'QuoteSummary',
    component: () => import('@/views/QuoteSummary.vue'),
    meta: {
      requiresAuth: true
    }
  },

  // ✅ 新增的訊息系統路由
  {
    path: '/messages',
    name: 'MessageCenter',
    component: MessageCenter,
    meta: { requiresAuth: true }
  },
  {
    path: '/message/:statusId',
    name: 'MessageDetail',
    component: MessageDetail,
    props: true, // 讓 statusId 可以作為 props 傳入
    meta: { requiresAuth: true }
  },
  {
    path: '/send-message',
    name: 'SendMessage',
    component: SendMessage,
    meta: {
      requiresAuth: true,
      requiresPermission: 'canSendMessage' // 觸發我們在 store 中定義的 getter
    }
  },

  {
        path: '/user-management',
        name: 'UserManagement',
        component: UserManagement,
        meta: {
            requiresAuth: true,
            requiredSystem: '人員管理' 
        }
    },

  // 捕獲所有未匹配的路由，導向首頁或登入頁
  { path: '/:pathMatch(.*)*', redirect: '/home' }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

// ✅ 整合後的路由守衛
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = userStore.isLoggedIn;

  // 1. 檢查是否需要登入
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. 檢查已登入者是否訪問登入頁
  if (isLoggedIn && to.name === 'Login') {
    return next({ name: 'Home' });
  }

  // 3. 權限檢查 (合併版)
  if (isLoggedIn) {
    const requiredPermission = to.meta.requiresPermission;
    const requiredSystem = to.meta.requiredSystem;

    // A. 檢查特定的單一權限 (例如 'canSendMessage')
    if (requiredPermission) {
      if (userStore[requiredPermission]) { // 動態呼叫 store getter
        return next();
      } else {
        alert(`權限不足：您沒有執行此操作的權限。`);
        return next({ name: 'Home' });
      }
    }
    
    // B. 檢查系統/建案權限
    if (requiredSystem) {
      const projectName = to.params.projectName;
      if (projectName) {
        if (userStore.hasProjectPermission(requiredSystem, projectName)) {
          return next();
        } else {
          alert(`權限不足：您沒有進入建案「${projectName}」的「${requiredSystem}」權限。`);
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

  // 4. 如果路由不需要任何權限，直接放行
  return next();
});

export default router;