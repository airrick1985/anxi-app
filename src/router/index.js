import { createRouter, createWebHashHistory } from 'vue-router';
import { useUserStore } from '@/store/user';        
import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';
import InspectionDetail from '@/views/InspectionDetail.vue'; // ✅ 新增

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/home', name: 'Home', component: Home },
  { path: '/inspection-record', name: 'InspectionRecord', component: InspectionRecord },
  { path: '/inspection-overview', name: 'InspectionOverview', component: InspectionOverview },
  { 
    path: '/inspection-detail/:unitId', // ✅ 新增這條
    name: 'InspectionDetail',
    component: InspectionDetail,
    props: true   // ✅ 讓 unitId 直接以 props 傳入
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

// 路由守衛：未登入只能進 Login
router.beforeEach((to, from, next) => {
  const userStore = useUserStore();
  const isLoggedIn = !!userStore.user;  
  if (!isLoggedIn && to.name !== 'Login') {
    return next({ name: 'Login' });
  }
  next();
});

export default router;
