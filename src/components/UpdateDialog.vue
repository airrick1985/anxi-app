<!-- src/components/UpdateDialog.vue -->
<template>
    <v-dialog v-model="show" persistent max-width="400">
      <v-card>
        <v-card-title>新版本已推出</v-card-title>
        <v-card-text>
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

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="refreshApp">請重新整理頁面</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue';
  import { useRegisterSW } from 'virtual:pwa-register/vue';
  
  const show = ref(false);
  // 【關鍵修改】初始化 release 物件以匹配新的 JSON 結構
  const release = ref({ version: '', date: '', categories: {}, rawNotes: [] });
  
  const { needRefresh, updateServiceWorker } = useRegisterSW();
  
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
        version: data.version || '新版本',
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
        version: '新版本',
        date: '',
        categories: {}, // 清空分類
        rawNotes: ['有新版本可用，請點擊下方按鈕更新！'] // 顯示通用提示
      };
    }
  };
  
  const refreshApp = async () => {
    await updateServiceWorker(true);
  };
  
  watch(needRefresh, (isNeeded) => {
    if (isNeeded) {
      fetchReleaseNotes();
      show.value = true;
    }
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