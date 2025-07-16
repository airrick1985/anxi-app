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


const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home, meta: { requiresAuth: true } }, // 建議 Home 頁也需要登入
 {
    path: '/inspectionsystem',
    name: 'InspectionSystem',
    component: InspectionSystem,
    meta: { 
        requiresAuth: true,
        requiredSystem: '驗屋系統' // ✨ 新增
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

  // 🔵 新增：銷控系統的路由
  {
    path: '/sales-control-entry', // 銷控系統的建案選擇入口頁路徑
    name: 'SalesControlSystemEntry',
    component: SalesControlSystemEntry,
    meta: { requiresAuth: true } // 假設也需要登入
  },
 {
    path: '/sales-control/:projectName',
    name: 'SalesControlSystem',
    component: () => import('@/views/SalesControlSystem.vue'),
    meta: { 
      requiresAuth: true,
      viewMode: 'sales',
      requiredSystem: '銷控系統' // ✨ 新增：定義此路由需要的系統權限
    }
  },
  {
    path: '/quote-system/:projectName',
    name: 'QuoteSystem',
    component: () => import('@/views/SalesControlSystem.vue'),
    meta: {
      requiresAuth: true,
      viewMode: 'quote',
      requiredSystem: '報價系統' // ✨ 新增
    }
  },
  {
    path: '/quote-settings/:projectName', 
    name: 'QuoteSettings',
    component: () => import('@/views/QuoteSettings.vue'),
    props: true, 
    meta: { 
      requiresAuth: true,
      requiredSystem: '報價系統' // ✨ 新增 (假設設定頁也屬於報價系統)
    }
  },
{
  path: '/payment-settings/:projectName/:unitId', // 路徑中包含參數
  name: 'PaymentSettings',
  component: () => import('@/views/PaymentSettings.vue'),
  props: true, // 允許將路由參數作為 props 傳遞給元件
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
      requiresAuth: true // 假設這個頁面也需要登入才能訪問
    }
  },



  { path: '/:pathMatch(.*)*', redirect: '/login' } // 捕獲所有未匹配路由，重定向到登入


];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = !!userStore.user;

  // 1. 檢查是否需要登入 (邏輯不變)
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next({ name: 'Login', query: { redirect: to.fullPath } });
  }

  // 2. 檢查已登入者是否訪問登入頁 (邏輯不變)
  if (isLoggedIn && to.name === 'Login') {
    return next({ name: 'Home' });
  }

  // ✨ 3. 新的兩層權限檢查邏輯
  const requiredSystem = to.meta.requiredSystem;

  if (isLoggedIn && requiredSystem) {
    const projectName = to.params.projectName;

    // A. 如果路由包含建案名稱 (例如 /sales-control/富宇首馥)
    if (projectName) {
      if (userStore.hasProjectPermission(requiredSystem, projectName)) {
        // 有權限，放行
        return next(); 
      } else {
        // 無權限，提示並導回首頁
        alert(`權限不足：您沒有進入建案「${projectName}」的「${requiredSystem}」權限。`);
        return next({ name: 'Home' });
      }
    } 
    // B. 如果路由不含建案名稱，但需要系統權限 (例如 /inspectionsystem 這種入口頁)
    else {
      if (userStore.hasPermission(requiredSystem)) {
        // 只要對該系統有任何一個建案的權限，就放行
        return next();
      } else {
        // 完全沒有該系統的權限，提示並導回首頁
        alert(`權限不足：您沒有進入「${requiredSystem}」的權限。`);
        return next({ name: 'Home' });
      }
    }
  }

  // 4. 如果路由不需要任何權限，直接放行
  return next();
});

export default router;
