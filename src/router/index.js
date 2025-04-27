// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import Login from '@/views/Login.vue';
import Home from '@/views/Home.vue';
import InspectionRecord from '@/views/InspectionRecord.vue';
import InspectionOverview from '@/views/InspectionOverview.vue';

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login },
  { path: '/home', component: Home },
  { path: '/inspection-record', name: 'InspectionRecord', component: InspectionRecord },
  { path: '/inspection-overview', name: 'InspectionOverview', component: InspectionOverview },
  { path: '/:pathMatch(.*)*', redirect: '/login' } // 所有未定義路徑導回login
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
