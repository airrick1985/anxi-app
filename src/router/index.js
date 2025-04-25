// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router';
import Login from '../views/Login.vue';
import Home from '../views/Home.vue';

const routes = [ /* … */ ];

export default createRouter({
  history: createWebHashHistory(),  // ← 改成 Hash 模式
  routes,
});
