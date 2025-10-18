<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
// ✅ 引入 collection, query, getDocs, orderBy, doc, getDoc
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/store/user'

// --- 響應式變數 ---
const router = useRouter()
const userStore = useUserStore()

const tab = ref('projectSettings')

// 建案選擇相關
const selectedProjectId = ref(null)
const projects = ref([])
const isLoadingProjects = ref(false)

// ✅ 新增：棟別列表相關
const buildings = ref([]) // 儲存棟別列表
const isLoadingBuildings = ref(false) // 控制棟別讀取狀態

const currentUserKey = computed(() => userStore.user?.key || null)

// ✅ 新增：表格標頭定義
const headers = ref([
  { title: '棟別名稱', key: 'name', sortable: true },
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
])

// --- 函數 ---

async function fetchProjects() {
  // ... (fetchProjects 函數保持不變) ...
  if (!currentUserKey.value) {
    console.error("fetchProjects: currentUserKey 無效，無法讀取權限。")
    isLoadingProjects.value = false
    projects.value = []
    return
  }
  isLoadingProjects.value = true
  projects.value = []
  console.log(`fetchProjects (Admin): 使用 USERKEY ${currentUserKey.value} 讀取權限...`);
  try {
    const userPermissionsRef = doc(db, 'userPermissions', currentUserKey.value)
    const docSnap = await getDoc(userPermissionsRef)
    if (docSnap.exists()) {
      const permissionsData = docSnap.data()?.permissions
      if (permissionsData) {
        const allowedProjects = []
        for (const [projectId, projectData] of Object.entries(permissionsData)) {
          // ❗ 根據 Admin 權限需求調整: 若 Admin 可管理所有建案，移除 system 檢查
          if (projectData?.systems && Array.isArray(projectData.systems) && projectData.systems.includes('驗屋系統')) {
             allowedProjects.push({
               id: projectId,
               name: projectData.projectName
             })
          }
        }
        allowedProjects.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
        projects.value = allowedProjects
        console.log('Fetched Accessible Projects (Admin):', projects.value)
      } else {
        console.warn('使用者權限文件中找不到 permissions 欄位。')
      }
    } else {
      console.warn(`找不到使用者 ${currentUserKey.value} 的權限文件。`)
    }
  } catch (error) {
    console.error("讀取使用者權限時發生錯誤: ", error);
  } finally {
    isLoadingProjects.value = false
  }
}

// ✅ 新增：讀取棟別列表的函數 (用於管理頁面)
async function fetchManagedBuildings(projectId) {
  if (!projectId) {
    buildings.value = []
    return
  }
  isLoadingBuildings.value = true
  buildings.value = []
  console.log(`fetchManagedBuildings: 讀取建案 ${projectId} 的棟別...`);
  try {
    // ❗ 請再次確認❗ Firestore 路徑是否為 'projects/[projectId]/buildings'
    const buildingsColRef = collection(db, 'projects', projectId, 'buildings')

    // ❗ 請再次確認❗ 排序欄位 'buildingName' 是否存在？
    const q = query(buildingsColRef, orderBy('buildingName', 'asc'))

    const querySnapshot = await getDocs(q)
    console.log(`fetchManagedBuildings: Firestore returned ${querySnapshot.docs.length} documents.`);

    buildings.value = querySnapshot.docs.map(doc => {
      console.log(`fetchManagedBuildings: Processing doc ${doc.id}, data:`, doc.data());
       return {
         id: doc.id,
         // ❗ 請再次確認❗ 棟別名稱欄位是否【確實】是 'buildingName'？
         name: doc.data().buildingName
       }
    }).filter(b => b.name); // 過濾掉 name 無效的

    console.log(`Fetched Buildings for ${projectId} (processed):`, JSON.parse(JSON.stringify(buildings.value)))
  } catch (error) {
    console.error(`讀取建案 ${projectId} 的棟別時發生錯誤: `, error);
  } finally {
    isLoadingBuildings.value = false
  }
}

watch(() => userStore.user, (newUser) => {
  // ... (watch user 保持不變) ...
  console.log('watch userStore.user triggered (Admin):', newUser);
  if (newUser && newUser.key) {
    fetchProjects();
  } else {
    projects.value = [];
    selectedProjectId.value = null;
    console.log('User logged out or not yet loaded, clearing projects list (Admin).');
  }
}, { immediate: true });

// ✅ 新增：監聽 selectedProjectId 的變化以載入棟別
watch(selectedProjectId, (newProjectId, oldProjectId) => {
  console.log(`watch selectedProjectId (Admin): changed from ${oldProjectId} to ${newProjectId}`);
  buildings.value = [] // 清空棟別列表

  if (newProjectId) {
    fetchManagedBuildings(newProjectId)
  }
})

// --- CRUD 函數稍後加入 ---
// 例如: addBuilding, updateBuilding, deleteBuilding

</script>

<template>
  <v-container fluid>
    <v-card>
      <v-tabs v-model="tab" bg-color="primary">
        <v-tab value="projectSettings">設定</v-tab>
        <v-tab value="globalTemplate">全域範本</v-tab>
        <v-tab value="categoriesItems">分類與細項</v-tab>
      </v-tabs>

      <v-card-text>
        <v-window v-model="tab">
          <v-window-item value="projectSettings">
            <v-container fluid>
              <v-row>
                <v-col cols="12" md="6">
                  <v-autocomplete
                    v-model="selectedProjectId"
                    :items="projects"
                    item-title="name"
                    item-value="id"
                    label="選擇要管理的建案"
                    :loading="isLoadingProjects"
                    variant="outlined"
                    clearable
                    dense
                    no-data-text="找不到符合權限的建案"
                    :disabled="isLoadingProjects"
                  ></v-autocomplete>
                </v-col>
              </v-row>

              <v-row v-if="selectedProjectId">
                <v-col cols="12">
                  <v-data-table
                    :headers="headers"
                    :items="buildings"
                    :loading="isLoadingBuildings"
                    loading-text="正在載入棟別資料..."
                    no-data-text="此建案尚無棟別資料"
                    class="elevation-1"
                    items-per-page="15"
                  >
                    <template v-slot:top>
                      <v-toolbar flat color="white">
                        <v-toolbar-title>棟別管理</v-toolbar-title>
                        <v-divider class="mx-4" inset vertical></v-divider>
                        <v-spacer></v-spacer>
                        <v-btn color="primary" dark class="mb-2">
                          新增棟別
                        </v-btn>
                      </v-toolbar>
                    </template>

                    <template v-slot:item.actions="{ item }">
                      <v-icon small class="mr-2" color="blue darken-1">
                        mdi-pencil
                      </v-icon>
                      <v-icon small color="red darken-1">
                        mdi-delete
                      </v-icon>
                    </template>

                  </v-data-table>
                </v-col>
              </v-row>
              <v-row v-else>
                 <v-col cols="12">
                   <p class="text-center text-grey">請先選擇一個建案以管理棟別。</p>
                 </v-col>
              </v-row>
            </v-container>
          </v-window-item>

          <v-window-item value="globalTemplate">
            <p>管理檢查區域、檢查狀態、缺失等級等通用選項。</p>
            <p>[此功能稍後實作]</p>
          </v-window-item>

          <v-window-item value="categoriesItems">
            <p>管理主要的檢查分類及其對應的細項。</p>
            <p>[此功能稍後實作]</p>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
/* 可選：加入此頁面專屬的 CSS */
</style>