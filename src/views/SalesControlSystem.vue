// src/views/SalesControlSystem.vue (臨時佔位)
<template>
  <v-container>
    <h1>銷控系統主頁面</h1>
    <p v-if="projectName">當前建案：{{ projectName }}</p>
    <p>這裡將是銷控系統的功能內容。</p>
  </v-container>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '@/store/user';
const userStore = useUserStore();
const projectName = computed(() => userStore.user?.projectName);
</script>