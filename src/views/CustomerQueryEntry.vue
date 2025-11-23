<template>
  <v-container class="fill-height justify-center align-center" style="background-color: #F5F5F7;">
    <v-card class="pa-6 text-center" max-width="400" flat color="transparent">
      <v-progress-circular indeterminate color="primary" size="64" class="mb-4"></v-progress-circular>
      <h3 class="text-h6 text-grey-darken-2">{{ statusMessage }}</h3>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // 引入 ProjectStore 以獲取建案名稱
import liff from '@line/liff';

const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();
const statusMessage = ref('系統驗證中...');

// 請確認此 ID 與 InspectionConsole 使用的一致 (或針對此頁面設定的 LIFF ID)
const LIFF_ID = '2008257338-G2EJPAda'; // 2008257338-G2EJPAda (正式) // 2008257338-6N3jwqxA (測試)

onMounted(async () => {
  try {
    // 1. 初始化 LIFF
    statusMessage.value = '正在連接 LINE...';
    await liff.init({ liffId: LIFF_ID });
    
    if (!liff.isLoggedIn()) {
      liff.login();
      return;
    }

    const profile = await liff.getProfile();
    const lineId = profile.userId;

    // 2. 驗證綁定狀態 (使用與 InspectionConsole 相同的 store action)
    statusMessage.value = '驗證使用者權限...';
    
    // ✅ 修正：使用 store 原有的 fetchUserByLineId，它會正確傳遞 { lineId } 給 API
    const isBound = await userStore.fetchUserByLineId(lineId);

    if (!isBound) {
      // 未綁定 -> 導向綁定頁 (修正路由名稱為 LineBindingPage)
      console.log('用戶未綁定，導向綁定頁面');
      router.replace({ name: 'LineBindingPage', query: { lineId } });
      return;
    }

    // 3. 檢查權限與建案
    statusMessage.value = '讀取建案資料...';
    
    // 確保建案列表已載入 (用於顯示名稱)
    if (projectStore.projectsList.length === 0) {
        await projectStore.fetchProjects();
    }

    const allowedProjects = [];
    const permissions = userStore.user?.permissions || {};

    // 遍歷權限找出符合「客資系統」的建案
    for (const [pid, pData] of Object.entries(permissions)) {
      if (pData.systems && (
          pData.systems.includes('客資系統-櫃台') || 
          pData.systems.includes('客資系統-銷售')
      )) {
        allowedProjects.push(pid);
      }
    }

    // 4. 分流導向
    if (allowedProjects.length === 0) {
      alert('您沒有任何建案的「客資系統」權限。');
      router.replace('/home');
    } else if (allowedProjects.length === 1) {
      // 只有一個建案 -> 直接進入
      router.replace({ 
        name: 'CustomerQuery', 
        params: { projectId: allowedProjects[0] } 
      });
    } else {
      // 多個建案 -> 導向建案選擇頁
      // 這裡我們傳遞 targetRouteName 參數，讓 ProjectSelector 知道選完要去哪
      router.replace({ 
        name: 'CustomerSystemEntry', // 這是我們在 router 中定義的入口路由
        query: { from: 'liff' }      // 可選：標記來源
      });
    }

  } catch (error) {
    console.error('Entry Error:', error);
    statusMessage.value = `發生錯誤: ${error.message}`;
  }
});
</script>