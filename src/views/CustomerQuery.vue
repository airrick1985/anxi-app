<template>
  <v-app>
    <v-app-bar color="white" elevation="1" >
      <v-btn icon="mdi-home" to="/home" color="grey-darken-2"></v-btn>
      
      <v-app-bar-title class="text-subtitle-1 font-weight-bold text-grey-darken-3">
        客戶查詢
      </v-app-bar-title>

      <v-spacer></v-spacer>

      <v-menu>
        <template v-slot:activator="{ props }">
          <v-chip v-bind="props" color="primary" variant="flat" class="font-weight-bold">
            {{ currentProjectName }}
            <v-icon end icon="mdi-chevron-down"></v-icon>
          </v-chip>
        </template>
        <v-list>
          <v-list-item 
            v-for="project in availableProjects" 
            :key="project.id"
            @click="switchProject(project.id)"
            :active="project.id === projectId"
          >
            <v-list-item-title>{{ project.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="bg-grey-lighten-5">
      <v-container class="pa-4" style="max-width: 800px;">
        
        <v-card class="mb-4 pa-4" elevation="1">
          <div class="d-flex align-center">
            <v-text-field
              v-model="searchQuery"
              label="輸入電話或姓名"
              placeholder="例如: 0912345678 或 陳大明"
              variant="outlined"
              
              hide-details
              prepend-inner-icon="mdi-magnify"
              @keydown.enter="performSearch"
              class="flex-grow-1 mr-2"
              clearable
            ></v-text-field>
            <v-btn 
              color="primary" 
              height="40" 
              @click="performSearch" 
              :loading="isSearching"
            >
              查詢
            </v-btn>
          </div>
        </v-card>

        <div v-if="results.length > 0" class="d-flex flex-column gap-3">
          <v-card v-for="guest in results" :key="guest.docId" class="mb-3 border-s-4" style="border-left-color: #1976D2 !important;">
            
            <v-card-title class="text-subtitle-1 font-weight-bold bg-grey-lighten-4 py-2 d-flex justify-space-between align-center">
  <div>
    {{ guest.latestName }}
    
    <a :href="`tel:${guest.phone}`"class="text-h6 text-blue ml-2 text-decoration-none hover-underline">
      <v-icon size="x-small" start>mdi-phone</v-icon>
        {{ guest.phone }}
    </a>
  </div>
  <v-chip size="large" color="blue-grey" v-if="guest.salesPerson">
    銷售: {{ guest.salesPerson }}
  </v-chip>
</v-card-title>

            <v-divider></v-divider>

            <v-card-text class="pa-3">
              <div v-if="guest.otherPhones && guest.otherPhones.length > 0" class="mb-4">
                <div class="text-caption text-grey font-weight-bold mb-1">
                  <v-icon size="small" start>mdi-account-multiple</v-icon> 關係人
                </div>
                <div class="d-flex flex-wrap gap-2">
                  <v-chip 
                    v-for="(op, idx) in guest.otherPhones" 
                    :key="idx"
                    size="small"
                    variant="outlined"
                    color="teal-darken-1"
                  >
                    {{ op.name }} ({{ op.relation }})｜
                    <a :href="`tel:${op.phone}`"class="text-decoration-none text-inherit ml-1 font-weight-bold" @click.stop>
                      <v-icon size="x-small" start>mdi-phone</v-icon>
                        {{ op.phone }}
                    </a>
                  </v-chip>
                </div>
              </div>

              <div v-if="guest.submissions && guest.submissions.length > 0">
                <div class="text-caption text-grey font-weight-bold mb-1">
                  <v-icon size="small" start>mdi-history</v-icon> 來訪日期
                </div>
                
                <div class="d-flex flex-column" style="gap: 4px;">
                  <div 
                    v-for="(sub, idx) in [...guest.submissions].reverse()" 
                    :key="idx"
                    class="py-2 px-3 border rounded bg-grey-lighten-5 d-flex align-center justify-space-between"
                  >
                    <div class="d-flex align-center">
                      <span class="font-weight-bold mr-3 text-body-2 text-grey-darken-3">
                        {{ sub['拜訪日期'] || '未知日期' }}
                      </span>
                      <span class="text-caption text-grey-darken-2 font-weight-medium">
                        {{ sub['姓名'] }}
                      </span>
                    </div>

                    <v-chip 
                      size="small" 
                      :color="sub['銷售人員'] ? 'blue-grey-lighten-4' : 'grey-lighten-3'" 
                      :class="sub['銷售人員'] ? 'text-blue-grey-darken-3' : 'text-grey'"
                      variant="flat" 
                      label
                      class="font-weight-bold"
                    >
                       {{ sub['銷售人員'] || '無銷售' }}
                    </v-chip>
                  </div>
                </div>
              </div>
              <div v-else class="text-center text-caption text-grey pa-2">
                無詳細歷史紀錄
              </div>

            </v-card-text>
          </v-card>
        </div>

        <div v-else-if="hasSearched && !isSearching" class="text-center mt-8">
          <v-icon size="64" color="grey-lighten-2">mdi-text-box-search-outline</v-icon>
          <div class="text-grey mt-2">查無符合資料</div>
        </div>

      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProjectStore } from '@/store/projectStore';
import { useUserStore } from '@/store/user';
import { functions } from '@/firebase'; // 假設您有 export firebase functions
import { httpsCallable } from 'firebase/functions';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const userStore = useUserStore();

// State
const projectId = ref(route.params.projectId);
const searchQuery = ref('');
const isSearching = ref(false);
const hasSearched = ref(false);
const results = ref([]);

// Computed
const currentProjectName = computed(() => {
  return projectStore.idToNameMap[projectId.value] || projectId.value;
});

const availableProjects = computed(() => {
  // 從 userStore 篩選有權限的專案列表
  const perms = userStore.user?.permissions || {};
  const projects = [];
  for (const [pid, pData] of Object.entries(perms)) {
    if (pData.systems?.some(s => s.includes('客資'))) {
      projects.push({
        id: pid,
        name: projectStore.idToNameMap[pid] || pid
      });
    }
  }
  return projects;
});

// Methods
const switchProject = (newProjectId) => {
  projectId.value = newProjectId;
  results.value = []; // 清空結果
  hasSearched.value = false;
  router.push({ name: 'CustomerQuery', params: { projectId: newProjectId } });
};

const performSearch = async () => {
  if (!searchQuery.value.trim()) return;
  
  isSearching.value = true;
  hasSearched.value = true;
  results.value = [];

  try {
    const queryFunc = httpsCallable(functions, 'queryCustomerData');
    const resp = await queryFunc({
      projectId: projectId.value,
      queryText: searchQuery.value,
      // ✅ [新增] 傳送使用者的 Key 給後端驗證
      requestingUserKey: userStore.user?.key 
    });

    if (resp.data.status === 'success') {
      results.value = resp.data.data;
    }
  } catch (error) {
    console.error('Search failed:', error);
    // 顯示更友善的錯誤訊息
    const msg = error.message.includes('permission-denied') ? '權限不足' : error.message;
    alert('查詢失敗: ' + msg);
  } finally {
    isSearching.value = false;
  }
};

const formatDate = (timestamp) => {
  if (!timestamp) return '-';
  // 處理 Firestore Timestamp 或 一般 ISO String
  const d = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('zh-TW', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

// Watch route change (for project switching)
watch(() => route.params.projectId, (newId) => {
  if (newId) projectId.value = newId;
});

onMounted(async () => {
  // 確保建案對照表已載入 (若 projectStore 需要初始化)
  if (Object.keys(projectStore.idToNameMap).length === 0) {
    await projectStore.fetchProjects(); 
  }
});
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>