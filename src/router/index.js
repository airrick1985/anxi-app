import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/home', component: Home },
  {
    path: '/inspection-record',
    name: 'InspectionRecord',
    component: InspectionRecord
  },
  {
    path: '/inspection-overview',
    name: 'InspectionOverview',
    component: InspectionOverview
  },
  // Hash 模式下其餘路由直接導回 /login
  { path: '/:pathMatch(.*)*', redirect: '/login' }
];

const router = createRouter({
  // 改成 Hash 模式，使用 VITE base 作為前綴
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes
});

export default router;
