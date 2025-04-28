// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';        // 匯入你的 Pinia store
import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home },
  { path: '/inspection-record', name: 'InspectionRecord', component: InspectionRecord },
  { path: '/inspection-overview', name: 'InspectionOverview', component: InspectionOverview },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

// 路由守衛：未登入只能進 Login
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = !!userStore.user;  // 假設 userStore.user 為 null 或物件
  if (!isLoggedIn && to.name !== 'Login') {
    return next({ name: 'Login' });
  }
  next();
});

export default router;
