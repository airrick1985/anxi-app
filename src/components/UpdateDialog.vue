<!-- src/components/UpdateDialog.vue -->
<!-- ✅ [改版] 原本綁 PWA useRegisterSW（已停用、永不觸發），改為 props 驅動：
     由 App.vue 的 useVersionCheck 偵測新版本後開啟。persistent + 無關閉鈕 = 強制更新。 -->
<!-- ✅ [權限] 更新明細（版本號 + CHANGELOG 內容）只給已登入的內部人員看；
     未登入者（預約頁、報價頁、LIFF 等面向一般客戶的頁面）只顯示「請重新整理」的簡化提示，
     且完全不去抓 release-notes.json，避免內部更新內容外流。 -->
<template>
    <v-dialog :model-value="modelValue" persistent max-width="400">
      <v-card>
        <v-card-title>{{ canSeeReleaseNotes ? '新版本已推出' : '系統已更新' }}</v-card-title>
        <v-card-text>
          <!-- 已登入：顯示完整版本號與更新明細 -->
          <template v-if="canSeeReleaseNotes">
            <p v-if="release.version"><strong>版本：</strong> {{ release.version }}</p>
            <p><strong>更新內容：</strong></p>

            <!-- 【關鍵修改】遍歷分類後的更新內容 -->
            <div v-if="Object.keys(release.categories).length > 0">
              <div v-for="(notes, category) in release.categories" :key="category" class="mb-2">
                <h4 class="text-subtitle-1 font-weight-bold">{{ category }}</h4>
                <ul>
                  <li v-for="(note, index) in notes" :key="index" v-html="note"></li>
                </ul>
              </div>
            </div>
            <!-- 如果沒有分類內容，顯示原始筆記或備用訊息 -->
            <div v-else-if="release.rawNotes && release.rawNotes.length > 0">
              <ul>
                <li v-for="(note, index) in release.rawNotes" :key="index" v-html="note"></li>
              </ul>
            </div>
            <div v-else>
              <p>有新版本可用！</p>
            </div>
            <!-- 【修改結束】 -->
          </template>

          <!-- 未登入（一般客戶）：只給簡化提示，不顯示版本號與更新明細 -->
          <p v-else class="mb-0">系統已更新至最新版本，請點擊下方按鈕重新整理頁面，以確保功能正常運作。</p>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" variant="elevated" prepend-icon="mdi-refresh" @click="refreshApp">立即更新</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { ref, computed, watch } from 'vue';
  import { forceReloadToLatest } from '@/composables/useVersionCheck';
  import { useUserStore } from '@/store/user';

  const props = defineProps({
    modelValue: { type: Boolean, default: false },
    // 偵測到的新版本號（release-notes.json 抓不到時的備援顯示）
    latestVersion: { type: String, default: '' },
  });

  const userStore = useUserStore();
  // 只有已登入的內部人員能看到版本號與更新明細（user state 由 pinia-persistedstate 從
  // sessionStorage 同步還原，重新整理後即可判斷，不會有先閃出明細再隱藏的問題）
  const canSeeReleaseNotes = computed(() => userStore.isLoggedIn);

  // 【關鍵修改】初始化 release 物件以匹配新的 JSON 結構
  const release = ref({ version: '', date: '', categories: {}, rawNotes: [] });

  const fetchReleaseNotes = async () => {
    try {
      // 為了確保每次都獲取最新檔案，加入時間戳
      const res = await fetch('/release-notes.json?_t=' + Date.now());
      if (!res.ok) {
        throw new Error(`HTTP 錯誤！狀態碼: ${res.status}`);
      }
      const data = await res.json();
      
      // 【關鍵修改】直接將獲取的資料賦值給 release.value
      release.value = {
        version: data.version || props.latestVersion || '新版本',
        date: data.date || '',
        categories: data.categories || {},
        rawNotes: Array.isArray(data.rawNotes) && data.rawNotes.length > 0 
                    ? data.rawNotes 
                    : ['修復了一些問題並提升了效能。'] // 備用訊息
      };

    } catch (e) {
      console.error('載入 release-notes.json 失敗', e);
      // 【關鍵修改】提供更完整的備用資訊，包括版本號
      release.value = {
        version: props.latestVersion || '新版本',
        date: '',
        categories: {}, // 清空分類
        rawNotes: ['有新版本可用，請點擊下方按鈕更新！'] // 顯示通用提示
      };
    }
  };
  
  const refreshApp = () => {
    // 帶時間戳 query 重新載入，突破 index.html 的 HTTP 快取
    forceReloadToLatest();
  };

  // 對話框開啟時抓取更新內容（未登入不抓，避免內部更新內容出現在客戶端的網路請求中）
  watch(() => props.modelValue, (isOpen) => {
    if (isOpen && canSeeReleaseNotes.value) fetchReleaseNotes();
  });
  </script>
  
  <style scoped>
  /* 這裡可以添加一些樣式來美化分類標題 */
  .text-subtitle-1 {
    margin-top: 10px;
    margin-bottom: 5px;
  }
  ul {
    padding-left: 20px; /* 調整列表縮進 */
  }
  </style>