<template>
  <v-app>
    <v-overlay :model-value="loading" class="d-flex align-center justify-center" persistent>
      <v-progress-circular indeterminate size="64" color="primary" />
    </v-overlay>

    <v-snackbar v-model="snackbar" :timeout="3000">{{ snackbarMessage }}</v-snackbar>

    <v-app-bar app color="primary" dark>
      <v-toolbar-title>ANXI 驗屋系統</v-toolbar-title>
      <v-spacer />
      <template v-if="user">
        <v-btn icon @click="dialog = true">
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="me-4 clickable" @click="dialog = true">{{ user.name }}</span>
      </template>
    </v-app-bar>

    <v-main>
      <router-view @start-loading="loading = true" @stop-loading="loading = false" @notify="showSnackbar" />
    </v-main>

    <!-- 底部 Tab Bar 快捷連結 -->
    <BottomNavBar v-if="showBottomNav" />

    <EditProfileDialog
      v-model:dialog="dialog"
      @start-loading="loading = true"
      @stop-loading="loading = false"
      @notify="showSnackbar"
    />
  </v-app>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';
import { useRouter, useRoute } from 'vue-router';
import EditProfileDialog from './components/EditProfileDialog.vue';
import BottomNavBar from './components/BottomNavBar.vue'; // 新增底部導航條元件

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const dialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');

const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

const router = useRouter();
const route = useRoute();

// 只有已登入且在特定頁面時顯示底部 Tab Bar
const showBottomNav = computed(() => {
  return user.value && 
    ['Home','InspectionRecord','InspectionOverview'].includes(route.name);
});

// 頁面進入檢查，未登入自動重導
if (!user.value && router.currentRoute.value.path === '/') {
  router.replace('/login');
}
</script>

<style>
body {
  margin: 0;
}
.clickable {
  cursor: pointer;
}
</style>
