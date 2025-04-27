<template>
  <v-app>
    <!-- 更新對話框：若有新版本可用，強制更新後才能繼續 -->
    <v-dialog
      v-model="showUpdateDialog"
      persistent
      max-width="400"
    >
      <v-card>
        <v-card-title>有新版本 {{ releaseVersion }} 可用</v-card-title>
        <v-card-text>
          <div v-html="formattedNotes"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="doUpdate">更新並重啟</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
      <router-view
        @start-loading="loading = true"
        @stop-loading="loading = false"
        @notify="showSnackbar"
      />
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
import { ref, computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';
import { useRouter, useRoute } from 'vue-router';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { getLatestRelease } from '@/api';
import EditProfileDialog from './components/EditProfileDialog.vue';
import BottomNavBar from './components/BottomNavBar.vue';

// 使用者狀態
const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const dialog = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref('');

// 顯示 Snackbar
const showSnackbar = (message) => {
  snackbarMessage.value = message;
  snackbar.value = true;
};

// Router & Route
const router = useRouter();
const route = useRoute();

// 底部導航列顯示條件
const showBottomNav = computed(() =>
  user.value &&
  ['Home', 'InspectionRecord', 'InspectionOverview'].includes(route.name)
);

// 未登入導回
if (!user.value && route.name !== 'Login') {
  router.replace({ name: 'Login' });
}

// PWA 自動更新機制
const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
const showUpdateDialog = ref(false);
const releaseVersion = ref('');
const releaseNotes = ref('');

// 當偵測到新版時，從 GitHub Releases 拉版本和說明
watch(needRefresh, async (val) => {
  if (val) {
    const { version, notes } = await getLatestRelease();
    releaseVersion.value = version;
    releaseNotes.value = notes;
    showUpdateDialog.value = true;
  }
});

// 格式化換行
const formattedNotes = computed(() =>
  releaseNotes.value.replace(/\n/g, '<br/>')
);

// 執行更新並重載
const doUpdate = async () => {
  await updateServiceWorker(true);
  window.location.reload();
};
</script>

<style>
body { margin: 0; }
.clickable { cursor: pointer; }
</style>
