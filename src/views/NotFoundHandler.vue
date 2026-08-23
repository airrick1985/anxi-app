<template>
  <v-container class="fill-height" fluid>
    <v-row justify="center" align="center">
      <v-col class="text-center">
        <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
        <p class="mt-4 text-grey-darken-1">頁面載入中...</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
// 未知路由處理：
// 舊版前端快取遇到「新版才有的路由」時會走到這裡（例如剛發版新增的頁面連結）。
// 先比對線上版本，有新版就帶原網址強制更新（保留 hash，新版載入後路由即存在）；
// 沒有新版（真的是無效網址）或已嘗試更新過仍找不到，才導回首頁。
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { fetchLatestVersion, forceReloadToLatest } from '@/composables/useVersionCheck';
import { appVersion } from '@/version';

const router = useRouter();

onMounted(async () => {
  try {
    if (!import.meta.env.DEV) {
      const latest = await fetchLatestVersion();
      if (latest && latest !== appVersion) {
        // sessionStorage 保險絲：同一版本只自動更新一次，杜絕 reload 循環
        const guardKey = `anxi-notfound-reloaded-${latest}`;
        if (!sessionStorage.getItem(guardKey)) {
          sessionStorage.setItem(guardKey, '1');
          forceReloadToLatest();
          return;
        }
      }
    }
  } catch (e) {
    console.warn('[NotFound] 版本檢查失敗:', e);
  }
  router.replace({ name: 'Home' });
});
</script>
