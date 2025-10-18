<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>
            開始驗屋
            <v-spacer></v-spacer>
            <v-btn
              v-if="canAccessAdmin"
              icon="mdi-cog-outline"
              variant="text"
              color="grey-darken-1"
              @click="goToAdminPage"
              title="驗屋系統設定"
            ></v-btn>
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="selectedProjectId"
                  :items="projects"
                  item-title="name"
                  item-value="id"
                  label="選擇建案"
                  :loading="isLoadingProjects"
                  variant="outlined"
                  clearable
                  dense
                  no-data-text="找不到建案"
                  :disabled="isLoadingProjects"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <v-autocomplete
                  v-model="selectedBuildingId"
                  :items="buildings"
                  item-title="name"
                  item-value="id"
                  label="選擇棟別"
                  :loading="isLoadingBuildings"
                  variant="outlined"
                  clearable
                  dense
                  no-data-text="請先選擇建案或此建案無棟別資料"
                  :disabled="!selectedProjectId || isLoadingBuildings || isLoadingProjects"
                ></v-autocomplete>
              </v-col>
              <v-col cols="12" md="4">
                <p>[戶別選擇]</p>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" v-if="selectedUnitId">
        <v-card>
          <v-card-title>
            戶別資訊: [顯示選定戶別]
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="6">
                <p><strong>基本資料</strong></p>
                <p>門牌: ...</p>
                <p>車位: ...</p>
                <p>買方: ...</p>
                <p>電話: ...</p>
              </v-col>
              <v-col cols="12" md="6">
                <p><strong>預約紀錄</strong></p>
                <p>[預約列表]</p>
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary">
              開始/繼續驗屋
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* 可選：加入此頁面專屬的 CSS */
</style>


<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '@/firebase'
import { collection, query, getDocs, orderBy, doc, getDoc } from 'firebase/firestore'
import { useUserStore } from '@/store/user' // 確保已引入

// --- 響應式變數 ---
const router = useRouter()
const userStore = useUserStore()

const selectedProjectId = ref(null)
const selectedBuildingId = ref(null)
const selectedUnitId = ref(null)

const projects = ref([])
const isLoadingProjects = ref(false)

const buildings = ref([])
const isLoadingBuildings = ref(false)

const currentUserKey = computed(() => userStore.user?.key || null)

// ✅ 新增：檢查是否有權限訪問 Admin 頁面
const requiredAdminRoles = ['超級管理員', '系統管理員', '客服主管', '工務主管'];
const canAccessAdmin = computed(() => {
  const userRoles = userStore.user?.roles || [];
  return userRoles.some(role => requiredAdminRoles.includes(role));
});


// ... 戶別變數稍後加入 ...

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
  console.log(`fetchProjects: 使用 USERKEY ${currentUserKey.value} 讀取權限...`);
  try {
    const userPermissionsRef = doc(db, 'userPermissions', currentUserKey.value)
    const docSnap = await getDoc(userPermissionsRef)
    if (docSnap.exists()) {
      const permissionsData = docSnap.data()?.permissions
      if (permissionsData) {
        const allowedProjects = []
        for (const [projectId, projectData] of Object.entries(permissionsData)) {
          if (projectData?.systems && Array.isArray(projectData.systems) && projectData.systems.includes('驗屋系統')) {
            allowedProjects.push({
              id: projectId,
              name: projectData.projectName
            })
          }
        }
        allowedProjects.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
        projects.value = allowedProjects
        console.log('Fetched Accessible Projects:', projects.value)
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

async function fetchBuildings(projectId) {
  // ... (fetchBuildings 函數保持不變) ...
   if (!projectId) {
    buildings.value = []
    return
  }
  isLoadingBuildings.value = true
  buildings.value = []
  console.log(`fetchBuildings: 讀取建案 ${projectId} 的棟別...`);
  try {
    const buildingsColRef = collection(db, 'projects', projectId, 'buildings')
    const q = query(buildingsColRef, orderBy('buildingName', 'asc')) // ❗ 確認欄位名
    const querySnapshot = await getDocs(q)
    console.log(`fetchBuildings: Firestore returned ${querySnapshot.docs.length} documents.`);
    buildings.value = querySnapshot.docs.map(doc => {
      console.log(`fetchBuildings: Processing doc ${doc.id}, data:`, doc.data());
      return {
        id: doc.id,
        name: doc.data().buildingName // ❗ 確認欄位名
      }
    })
    buildings.value = buildings.value.filter(b => b.name);
    console.log(`Fetched Buildings for ${projectId} (processed):`, JSON.parse(JSON.stringify(buildings.value)))

  } catch (error) {
    console.error(`讀取建案 ${projectId} 的棟別時發生錯誤: `, error);
  } finally {
    isLoadingBuildings.value = false
  }
}

// ✅ 新增：導航到 Admin 頁面的函數
function goToAdminPage() {
  router.push('/admin/inspection-admin');
}


watch(() => userStore.user, (newUser) => {
  // ... (watch user 保持不變) ...
  console.log('watch userStore.user triggered:', newUser);
  if (newUser && newUser.key) {
    fetchProjects();
  } else {
    projects.value = [];
    selectedProjectId.value = null;
    console.log('User logged out or not yet loaded, clearing projects list.');
  }
}, { immediate: true });

watch(selectedProjectId, (newProjectId, oldProjectId) => {
  // ... (watch selectedProjectId 保持不變) ...
  console.log(`watch selectedProjectId: changed from ${oldProjectId} to ${newProjectId}`);
  selectedBuildingId.value = null
  selectedUnitId.value = null
  buildings.value = []
  // units.value = [] // 稍後加入

  if (newProjectId) {
    fetchBuildings(newProjectId)
  }
})

</script>

<style scoped>
/* 可選：如果需要，在這裡加入此頁面專屬的 CSS */
</style>