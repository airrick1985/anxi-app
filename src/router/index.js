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
    meta: { requiresAuth: true } // 假設進入系統選擇頁需要登入
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
    name: 'SalesControlSystem', // 這是銷控系統的入口
    component: () => import('@/views/SalesControlSystem.vue'),
    meta: { 
      requiresAuth: true,
      viewMode: 'sales' // ✅ 銷控模式
    }
  },
  {
    path: '/quote-system/:projectName', // 為報價系統定義一個不同的路徑
    name: 'QuoteSystem', // 新的路由名稱
    component: () => import('@/views/SalesControlSystem.vue'), // ✅ 指向同一個組件
    meta: {
      requiresAuth: true,
      viewMode: 'quote' // ✅ 報價模式
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

// 路由守衛：未登入只能進 Login (保持不變)
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = !!userStore.user;
  // 檢查目標路由是否需要認證
  if (to.meta.requiresAuth && !isLoggedIn) {
    // 如果需要認證但用戶未登入，重定向到登入頁面
    // 同時可以保存用戶原本想去的頁面路徑，以便登入後跳轉回去
    next({ name: 'Login', query: { redirect: to.fullPath } });
  } else if (isLoggedIn && to.name === 'Login') {
    // 如果用戶已登入但嘗試訪問登入頁，重定向到首頁
    next({ name: 'Home' });
  }
  else {
    next(); // 正常導航
  }
});

export default router;
