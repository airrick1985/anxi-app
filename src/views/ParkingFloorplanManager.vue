<template>
  <div class="parking-floorplan-manager">
    <!-- 頭部操作區 - 在編輯模式時隱藏 -->
    <div class="manager-header" v-show="!selectedFloorPlan">
      <div class="header-left">
        <h1 class="page-title">車位平面圖管理</h1>
        <div class="project-selector">
          <label>選擇建案：</label>
          <select v-model="selectedProjectId" @change="onProjectChange" class="project-select">
            <option value="">請選擇建案</option>
            <option v-for="project in availableProjects" :key="project.id" :value="project.id">
              {{ project.name }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="header-right" v-if="selectedProjectId">
        <v-btn @click="createNewFloorPlan" color="primary" prepend-icon="mdi-plus">
          新增平面圖
        </v-btn>
      </div>
    </div>

    <!-- 內容區域 -->
    <div class="manager-content" v-if="selectedProjectId">
      <!-- 平面圖列表 -->
      <div class="floorplan-list" v-if="!selectedFloorPlan">
        <div class="list-header">
          <h2>平面圖列表</h2>
          <div class="list-actions">
            <v-btn 
              @click="refreshFloorPlans" 
              variant="outlined" 
              :loading="loading"
              prepend-icon="mdi-refresh"
            >
              重新整理
            </v-btn>
          </div>
        </div>

        <div class="floorplan-grid" v-if="floorPlans.length > 0">
          <div 
            v-for="floorPlan in floorPlans" 
            :key="floorPlan.id" 
            class="floorplan-card"
            @click="selectFloorPlan(floorPlan)"
          >
            <div class="card-preview">
              <img 
                v-if="floorPlan.backgroundImageUrl" 
                :src="floorPlan.backgroundImageUrl" 
                :alt="floorPlan.name"
                class="preview-image"
              />
              <div v-else class="preview-placeholder">
                <i class="fas fa-image"></i>
                <span>無背景圖</span>
              </div>
            </div>
            
            <div class="card-content">
              <h3 class="card-title">{{ floorPlan.name }}</h3>
              <p class="card-description">{{ floorPlan.description || '無描述' }}</p>
              <div class="card-meta">
                <span class="status-badge" :class="{ active: floorPlan.isActive }">
                  {{ floorPlan.isActive ? '啟用' : '停用' }}
                </span>
                <span class="created-date">
                  {{ formatDate(floorPlan.createdAt) }}
                </span>
              </div>
            </div>
            
            <div class="card-actions" @click.stop>
              <v-btn 
                @click="editFloorPlan(floorPlan)" 
                variant="outlined" 
                size="small"
                prepend-icon="mdi-pencil"
              >
                編輯
              </v-btn>
              <v-btn 
                  @click="deleteFloorPlan(floorPlan)" 
                  color="error" 
                  variant="outlined" 
                  size="small"
                  prepend-icon="mdi-delete"
                  :loading="deletingFloorPlanId === floorPlan.id"
                  :disabled="deletingFloorPlanId" 
                >
                  刪除
                </v-btn>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <v-icon size="80" color="grey">mdi-folder-open-outline</v-icon>
          <h3 class="mt-4">尚無平面圖</h3>
          <p class="text-body-2 mb-4">請點擊「新增平面圖」開始建立您的第一個車位平面圖</p>
          <v-btn @click="createNewFloorPlan" color="primary" prepend-icon="mdi-plus">
            新增平面圖
          </v-btn>
        </div>

        <div v-if="loading" class="loading-state">
          <v-progress-circular indeterminate color="primary" size="50"></v-progress-circular>
          <p class="mt-4">載入中...</p>
        </div>
      </div>

      <!-- 平面圖編輯器 -->
      <div class="floorplan-editor" v-if="selectedFloorPlan">
        <div class="editor-header">
          <div class="editor-title">
            <v-btn @click="backToList" variant="outlined" size="small" prepend-icon="mdi-arrow-left">
              返回列表
            </v-btn>
            <h2>{{ selectedFloorPlan.name }}</h2>
            <v-chip :color="isEditorDirty ? 'warning' : 'success'" size="small">
              {{ isEditorDirty ? '未儲存' : '已儲存' }}
            </v-chip>
          </div>
          
          <div class="editor-actions">
            <v-btn 
              @click="saveFloorPlan" 
              :disabled="!isEditorDirty" 
              :loading="saving" 
              color="success"
              prepend-icon="mdi-content-save"
            >
              {{ saving ? '儲存中...' : '儲存' }}
            </v-btn>
            <v-btn 
              @click="togglePreviewMode" 
              variant="outlined"
              prepend-icon="mdi-eye"
            >
              {{ isPreviewMode ? '編輯模式' : '預覽模式' }}
            </v-btn>
            
            <!-- 匯出功能按鈕群組 -->
            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn v-bind="props" color="info" prepend-icon="mdi-download">
                  匯出
                  <v-icon>mdi-chevron-down</v-icon>
                </v-btn>
              </template>
              <v-list>
                <v-list-item @click="exportImage('png')" prepend-icon="mdi-file-image">
                  <v-list-item-title>PNG 圖片</v-list-item-title>
                </v-list-item>
                <v-list-item @click="exportImage('jpeg')" prepend-icon="mdi-file-image">
                  <v-list-item-title>JPEG 圖片</v-list-item-title>
                </v-list-item>
                <v-list-item @click="exportPDF" prepend-icon="mdi-file-pdf-box">
                  <v-list-item-title>PDF 文件</v-list-item-title>
                </v-list-item>
                <v-divider></v-divider>
                <v-list-item @click="printFloorplan" prepend-icon="mdi-printer">
                  <v-list-item-title>列印</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
        </div>

        <!-- 編輯器工具列 -->
        <div class="editor-toolbar" v-if="!isPreviewMode">
          <div class="toolbar-section">
            <v-btn @click="addSpot" color="primary" size="small" prepend-icon="mdi-plus">
              新增車位
            </v-btn>
          </div>
          
          <div class="toolbar-section">
            <v-btn 
              @click="toggleGrid" 
              :color="showGrid ? 'primary' : 'default'"
              variant="outlined" 
              size="small"
              prepend-icon="mdi-grid"
            >
              {{ showGrid ? '隱藏網格' : '顯示網格' }}
            </v-btn>
          </div>
          


          <div class="toolbar-section">
            <v-btn 
              @click="toggleStyleEditor" 
              variant="outlined" 
              size="small"
              prepend-icon="mdi-palette"
            >
              樣式編輯器
            </v-btn>
          </div>
        </div>

        <!-- Canvas 容器 -->
        <div class="canvas-container">
          <ParkingCanvas
            ref="parkingCanvas"
            :floor-plan="selectedFloorPlan"
            :show-grid="showGrid"
            :preview-mode="isPreviewMode"
            @spots-changed="onSpotsChanged"
            @canvas-ready="onCanvasReady"
          />

          <!-- 樣式編輯器 -->
          <div v-if="showStyleEditor" class="style-editor-overlay">
            <StyleEditor
              :floor-plan-id="selectedFloorPlan.id"
              @close="closeStyleEditor"
              @styles-updated="onStylesUpdated"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 沒有選擇建案的提示 -->
    <div v-else class="no-project-selected">
      <v-icon size="100" color="grey">mdi-office-building</v-icon>
      <h2 class="mt-4">請選擇建案</h2>
      <p class="text-body-2">請先從上方選單選擇一個建案，才能開始管理車位平面圖</p>
    </div>

    <!-- 新增/編輯平面圖對話框 -->
    <v-dialog v-model="showFloorPlanDialog" max-width="500">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ editingFloorPlan ? '編輯平面圖' : '新增平面圖' }}</span>
          <v-btn @click="closeFloorPlanDialog" icon="mdi-close" variant="text" size="small"></v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-form @submit.prevent="submitFloorPlan">
            <v-text-field
              v-model="floorPlanForm.name"
              label="平面圖名稱"
              placeholder="例如：B1車位平面圖"
              required
              variant="outlined"
              class="mb-4"
            ></v-text-field>

            <v-select
              v-model="floorPlanForm.floor"
              :items="floorOptions"
              :loading="loadingFloors"
              label="選擇車位樓層"
              placeholder="請選擇樓層"
              variant="outlined"
              required
              item-title="label"
              item-value="value"
              :item-props="setItemProps"
              :return-object="false"
              class="mb-4"
            >
            </v-select>
            
            <v-textarea
              v-model="floorPlanForm.description"
              label="描述"
              placeholder="請輸入平面圖描述（可選）"
              variant="outlined"
              rows="3"
              class="mb-4"
            ></v-textarea>
            
            <v-file-input
              v-model="floorPlanForm.backgroundImageFile"
              :label="editingFloorPlan ? '更換平面圖底圖（可選）' : '平面圖底圖 *'"
              placeholder="請選擇圖片檔案"
              accept="image/*"
              :required="!editingFloorPlan"
              variant="outlined"
              prepend-icon="mdi-image"
              class="mb-4"
              :rules="editingFloorPlan ? backgroundImageRulesOptional : backgroundImageRules"
            ></v-file-input>
            
            <v-checkbox
              v-model="floorPlanForm.isActive"
              label="啟用此平面圖"
              class="mb-4"
            ></v-checkbox>
          </v-form>
        </v-card-text>
        
        <v-card-actions class="justify-end">
          <v-btn @click="closeFloorPlanDialog" variant="outlined">
            取消
          </v-btn>
          <v-btn 
            @click="submitFloorPlan" 
            :loading="submitting" 
            color="primary"
          >
            {{ editingFloorPlan ? '更新' : '建立' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useUserStore } from '@/store/user'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { uploadSalesImage } from '@/api'
import ParkingCanvas from '@/components/ParkingCanvas.vue'
import StyleEditor from '@/components/StyleEditor.vue'

export default {
  name: 'ParkingFloorplanManager',
  components: {
    ParkingCanvas,
    StyleEditor
  },
  setup() {
    // Stores
    const userStore = useUserStore()
    const projectStore = useProjectStore()
    const uiStore = useUiStore()
    const functions = getFunctions()

    // Reactive data
    const selectedProjectId = ref('')
    const floorPlans = ref([])
    const selectedFloorPlan = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const submitting = ref(false)
    const isEditorDirty = ref(false)
    const isPreviewMode = ref(false)
    const showGrid = ref(true)
    const showStyleEditor = ref(false)
    
    // Dialog states
    const showFloorPlanDialog = ref(false)
    const editingFloorPlan = ref(null)




    const deletingFloorPlanId = ref(null)
    const floorPlanForm = ref({
      name: '',
      description: '',
      floor: '',
      isActive: true,
      backgroundImageFile: null
    })

    // 背景圖片檔案驗證規則（新增時必填）
    const backgroundImageRules = [
      value => {
        if (!value || value.length === 0) return '請選擇平面圖底圖檔案'
        const file = Array.isArray(value) ? value[0] : value
        if (!file.type.startsWith('image/')) return '請選擇圖片檔案'
        if (file.size > 10 * 1024 * 1024) return '檔案大小不可超過 10MB'
        return true
      }
    ]

    // 背景圖片檔案驗證規則（編輯時可選）
    const backgroundImageRulesOptional = [
      value => {
        if (!value || value.length === 0) return true // 編輯時可以不選擇
        const file = Array.isArray(value) ? value[0] : value
        if (!file.type.startsWith('image/')) return '請選擇圖片檔案'
        if (file.size > 10 * 1024 * 1024) return '檔案大小不可超過 10MB'
        return true
      }
    ]

    // Floor selection
    const floorOptions = ref([])
    const loadingFloors = ref(false)

    // Canvas ref
    const parkingCanvas = ref(null)

    // Computed
    const availableProjects = computed(() => {
      // 檢查用戶是否有銷控系統權限的建案
      return projectStore.projectsList.filter(project => {
        return userStore.hasProjectPermission('銷控系統', project.name)
      })
    })

    // 處理樓層選項，在前端控制禁用狀態
    const setItemProps = (item) => {
      const createdRegex = /\(已建立\)/;

      // 提取當前正在編輯的樓層字串值
      let currentEditingFloor = null;
      if (editingFloorPlan.value && editingFloorPlan.value.floor) {
        const floorData = editingFloorPlan.value.floor;
        currentEditingFloor = (typeof floorData === 'object' && floorData.value) 
          ? floorData.value 
          : floorData;
      }

      const isDisabled = createdRegex.test(item.label);
      const isCurrentEditingOption = editingFloorPlan.value && (item.value === currentEditingFloor);

      // 直接回傳一個物件，告訴 v-select 這個 item 有哪些 props
      return {
        disabled: isDisabled && !isCurrentEditingOption,
      };
    };

    // Cloud Functions
    const getFloorPlans = httpsCallable(functions, 'getFloorPlans')
    const getProjectFloors = httpsCallable(functions, 'getProjectFloors')
    const createFloorPlan = httpsCallable(functions, 'createFloorPlan')
    const updateFloorPlan = httpsCallable(functions, 'updateFloorPlan')
    const deleteFloorPlanFunc = httpsCallable(functions, 'deleteFloorPlan')
    const saveSpotLayouts = httpsCallable(functions, 'saveSpotLayouts')

    // Methods
    const onProjectChange = async () => {
      if (selectedProjectId.value) {
        await Promise.all([
          loadFloorPlans(),
          loadProjectFloors()
        ])
      } else {
        floorPlans.value = []
        floorOptions.value = []
        selectedFloorPlan.value = null
      }
    }

    const loadFloorPlans = async () => {
      if (!selectedProjectId.value) return
      
      loading.value = true
      try {
        const result = await getFloorPlans({ projectId: selectedProjectId.value })
        floorPlans.value = result.data.data || []
      } catch (error) {
        console.error('載入平面圖失敗:', error)
        alert('載入平面圖失敗，請稍後重試')
      } finally {
        loading.value = false
      }
    }

    const loadProjectFloors = async () => {
      if (!selectedProjectId.value) return
      
      loadingFloors.value = true
      try {
        const result = await getProjectFloors({ projectId: selectedProjectId.value })
        if (result.data.status === 'error') {
          alert(result.data.message)
          floorOptions.value = []
        } else {
          const floors = result.data.data || []
          console.log('樓層資料:', floors) // 偵錯用
          floorOptions.value = floors
        }
      } catch (error) {
        console.error('載入樓層清單失敗:', error)
        alert('載入樓層清單失敗，請稍後重試')
        floorOptions.value = []
      } finally {
        loadingFloors.value = false
      }
    }

    const refreshFloorPlans = async () => {
      await Promise.all([
        loadFloorPlans(),
        loadProjectFloors()
      ])
    }

    const selectFloorPlan = (floorPlan) => {
      selectedFloorPlan.value = floorPlan
      isEditorDirty.value = false
      isPreviewMode.value = false
      // 進入編輯模式，隱藏 App 工具列
      uiStore.enterParkingEditMode()
    }

    const backToList = () => {
      if (isEditorDirty.value) {
        if (confirm('您有未儲存的變更，確定要離開嗎？')) {
          selectedFloorPlan.value = null
          isEditorDirty.value = false
          // 離開編輯模式，顯示 App 工具列
          uiStore.exitParkingEditMode()
        }
      } else {
        selectedFloorPlan.value = null
        // 離開編輯模式，顯示 App 工具列
        uiStore.exitParkingEditMode()
      }
    }

    const createNewFloorPlan = async () => {
      editingFloorPlan.value = null
      floorPlanForm.value = {
        name: '',
        description: '',
        floor: '',
        isActive: true,
        backgroundImageFile: null
      }
      
      // 只有當樓層選項為空時才載入（避免重複調用）
      if (floorOptions.value.length === 0) {
        await loadProjectFloors()
      }
      
      showFloorPlanDialog.value = true
    }

    const editFloorPlan = async (floorPlan) => {
  editingFloorPlan.value = floorPlan;

  const floorValue = (typeof floorPlan.floor === 'object' && floorPlan.floor !== null && floorPlan.floor.value)
    ? floorPlan.floor.value
    : floorPlan.floor;

  floorPlanForm.value = {
    name: floorPlan.name,
    description: floorPlan.description || '',
    floor: floorValue || '', 
    isActive: floorPlan.isActive,
    backgroundImageFile: null  // 編輯時不需要重新上傳圖片
  };
  
  if (floorOptions.value.length === 0) {
    await loadProjectFloors();
  }
  
  showFloorPlanDialog.value = true;
};

    const closeFloorPlanDialog = () => {
      showFloorPlanDialog.value = false
      editingFloorPlan.value = null
      floorPlanForm.value = {
        name: '',
        description: '',
        floor: '',
        isActive: true,
        backgroundImageFile: null
      }
    }

    const submitFloorPlan = async () => {
      // 驗證必填欄位
      if (!floorPlanForm.value.name.trim()) {
        alert('請輸入平面圖名稱')
        return
      }
      
      if (!floorPlanForm.value.floor || (typeof floorPlanForm.value.floor === 'string' && !floorPlanForm.value.floor.trim())) {
        alert('請選擇樓層')
        return
      }

      // 驗證背景圖片檔案（僅在新增時需要）
      const isEditingMode = !!editingFloorPlan.value;
      if (!isEditingMode && (!floorPlanForm.value.backgroundImageFile || floorPlanForm.value.backgroundImageFile.length === 0)) {
        alert('請選擇平面圖底圖檔案')
        return
      }
  
 
      submitting.value = true
      try {
        if (isEditingMode) { // ✓ 使用變數來判斷
          let updateData = {
            floorPlanId: editingFloorPlan.value.id,
            projectId: selectedProjectId.value,
            name: floorPlanForm.value.name,
            description: floorPlanForm.value.description,
            floor: floorPlanForm.value.floor,
            isActive: floorPlanForm.value.isActive
          }

          // 如果用戶選擇了新的背景圖片，先上傳
          if (floorPlanForm.value.backgroundImageFile && floorPlanForm.value.backgroundImageFile.length > 0) {
            const file = Array.isArray(floorPlanForm.value.backgroundImageFile) 
              ? floorPlanForm.value.backgroundImageFile[0] 
              : floorPlanForm.value.backgroundImageFile
            
            try {
              // 1. 將檔案轉換為 Base64
              const base64 = await fileToBase64(file)
              
              // 2. 準備上傳參數
              const fileName = `${Date.now()}_${file.name}`
              const storagePath = `floorplan-backgrounds` // 修正：只傳遞資料夾路徑
              
              // 3. 透過代理 API 上傳
              const { downloadURL } = await uploadSalesImage(
                storagePath,        // storagePath
                fileName,           // fileName
                base64,            // fileBase64
                selectedProjectId.value || 'default' // projectId
              )
              
              updateData.backgroundImageUrl = downloadURL
              console.log('背景圖片更新成功:', downloadURL)
            } catch (error) {
              console.error('圖片上傳失敗:', error)
              alert('圖片上傳失敗，請重試')
              return
            }
          }

          // 更新現有平面圖
          await updateFloorPlan(updateData)
          
          // 更新本地資料
          const index = floorPlans.value.findIndex(fp => fp.id === editingFloorPlan.value.id)
          if (index !== -1) {
            // ✓ 這裡直接使用 editingFloorPlan.value.id，因為此時狀態還沒被清除
            floorPlans.value[index] = { ...floorPlans.value[index], ...floorPlanForm.value, id: editingFloorPlan.value.id }
          }
          await loadProjectFloors() // ✓ 更新後也重新載入樓層選項，以更新 (已建立) 狀態
        } else {
          // 創建新平面圖
          let backgroundImageUrl = null
          
          // 上傳背景圖片
          if (floorPlanForm.value.backgroundImageFile && floorPlanForm.value.backgroundImageFile.length > 0) {
            const file = Array.isArray(floorPlanForm.value.backgroundImageFile) 
              ? floorPlanForm.value.backgroundImageFile[0] 
              : floorPlanForm.value.backgroundImageFile
            
            try {
              // 1. 將檔案轉換為 Base64
              const base64 = await fileToBase64(file)
              
              // 2. 準備上傳參數
              const fileName = `${Date.now()}_${file.name}`
              const storagePath = `floorplan-backgrounds` // 修正：只傳遞資料夾路徑
              
              // 3. 透過代理 API 上傳
              const { downloadURL } = await uploadSalesImage(
                storagePath,        // storagePath
                fileName,           // fileName
                base64,            // fileBase64
                selectedProjectId.value || 'default' // projectId
              )
              
              backgroundImageUrl = downloadURL
              console.log('背景圖片上傳成功:', downloadURL)
            } catch (error) {
              console.error('圖片上傳失敗:', error)
              alert('圖片上傳失敗，請重試')
              return
            }
          }

          await createFloorPlan({
            projectId: selectedProjectId.value,
            name: floorPlanForm.value.name,
            description: floorPlanForm.value.description,
            floor: floorPlanForm.value.floor,
            isActive: floorPlanForm.value.isActive,
            backgroundImageUrl: backgroundImageUrl // 加入背景圖片 URL
          })
          
          // 重新載入列表和樓層選項
          await Promise.all([
            loadFloorPlans(),
            loadProjectFloors()
          ])
        }
        
        closeFloorPlanDialog()
        
        const successMessage = isEditingMode ? '平面圖更新成功！' : '平面圖建立成功！';
        alert(successMessage);

      } catch (error) {
        console.error('儲存平面圖失敗:', error)
        if (error.code === 'functions/already-exists') {
          alert(error.message)
        } else {
          alert('儲存失敗，請稍後重試')
        }
      } finally {
        submitting.value = false
      }
    }

     const deleteFloorPlan = async (floorPlan) => {
      if (!confirm(`確定要刪除平面圖「${floorPlan.name}」嗎？此操作無法復原。`)) {
        return
      }
      
      // ✓ 開始刪除，設定載入狀態
      deletingFloorPlanId.value = floorPlan.id
      try {
        await deleteFloorPlanFunc({ floorPlanId: floorPlan.id })
        
        // 從本地列表移除
        const index = floorPlans.value.findIndex(fp => fp.id === floorPlan.id)
        if (index !== -1) {
          floorPlans.value.splice(index, 1)
        }
        
        if (selectedFloorPlan.value && selectedFloorPlan.value.id === floorPlan.id) {
          selectedFloorPlan.value = null
        }
        
        await loadProjectFloors()
        
        alert('平面圖刪除成功！')
      } catch (error) {
        console.error('刪除平面圖失敗:', error)
        alert('刪除失敗，請稍後重試')
      } finally {
        // ✓ 無論成功或失敗，最後都清除載入狀態
        deletingFloorPlanId.value = null
      }
    }

    const saveFloorPlan = async () => {
      if (!parkingCanvas.value) return
      
      saving.value = true
      try {
        const layouts = parkingCanvas.value.getSpotLayouts()
        await saveSpotLayouts({
          floorPlanId: selectedFloorPlan.value.id,
          layouts
        })
        
        isEditorDirty.value = false
        alert('平面圖儲存成功！')
      } catch (error) {
        console.error('儲存平面圖失敗:', error)
        alert('儲存失敗，請稍後重試')
      } finally {
        saving.value = false
      }
    }

    const togglePreviewMode = () => {
      isPreviewMode.value = !isPreviewMode.value
    }

    const toggleGrid = () => {
      showGrid.value = !showGrid.value
    }

    const addSpot = () => {
      if (parkingCanvas.value) {
        parkingCanvas.value.addSpot()
      }
    }

    // 匯出圖片
    const exportImage = (format) => {
      if (parkingCanvas.value && selectedFloorPlan.value) {
        const filename = `${selectedFloorPlan.value.name || 'parking-floorplan'}_${new Date().toISOString().split('T')[0]}`
        parkingCanvas.value.downloadImage(filename, format)
        toast.success(`${format.toUpperCase()} 圖片已下載`)
      }
    }

    // 匯出 PDF
    const exportPDF = async () => {
      if (parkingCanvas.value && selectedFloorPlan.value) {
        const filename = `${selectedFloorPlan.value.name || 'parking-floorplan'}_${new Date().toISOString().split('T')[0]}`
        await parkingCanvas.value.exportAsPDF(filename)
        toast.success('PDF 文件已下載')
      }
    }

    // 列印平面圖
    const printFloorplan = () => {
      if (parkingCanvas.value) {
        parkingCanvas.value.printFloorplan()
        toast.success('列印功能已啟動')
      }
    }

    const onSpotsChanged = () => {
      isEditorDirty.value = true
    }

    const onCanvasReady = () => {
      console.log('Canvas 準備就緒')
    }



    const toggleStyleEditor = () => {
      showStyleEditor.value = !showStyleEditor.value
    }

    const closeStyleEditor = () => {
      showStyleEditor.value = false
    }

    const onStylesUpdated = (styles) => {
      // 通知 Canvas 更新樣式
      if (parkingCanvas.value) {
        parkingCanvas.value.updateStyles(styles)
      }
    }

   const formatDate = (timestamp) => {
      if (!timestamp) return '';

      let date;

      // ✅ 新增：優先處理从 Cloud Function 序列化後的時間戳格式
      if (timestamp && typeof timestamp === 'object' && timestamp._seconds !== undefined) {
        date = new Date(timestamp._seconds * 1000 + (timestamp._nanoseconds || 0) / 1000000);
      } 
      // ✓ 保留原始邏輯作為備用
      else {
        date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      }

      // 檢查最終結果是否為有效日期
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }

      // 使用台灣時區與格式回傳日期字串
      return date.toLocaleDateString('zh-TW', {
        timeZone: 'Asia/Taipei',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // 檔案轉 Base64 工具函數
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const base64 = reader.result.split(',')[1] // 移除 data:image/...;base64, 前綴
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })

    // 監聽專案變化
    watch(() => projectStore.projectsList, () => {
      // 如果當前選擇的專案不在可用列表中，清空選擇
      if (selectedProjectId.value && !availableProjects.value.find(p => p.id === selectedProjectId.value)) {
        selectedProjectId.value = ''
        floorPlans.value = []
        selectedFloorPlan.value = null
      }
    })

    // 生命週期
    onMounted(async () => {
      // 確保專案資料已載入
      if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
        await projectStore.fetchProjects()
      }
    })

    // 確保離開頁面時重置 UI 狀態
    onUnmounted(() => {
      uiStore.exitParkingEditMode()
    })

    return {
      // Reactive data
      selectedProjectId,
      floorPlans,
      selectedFloorPlan,
      loading,
      saving,
      submitting,
      isEditorDirty,
      isPreviewMode,
      showGrid,
      showStyleEditor,
      showFloorPlanDialog,
      editingFloorPlan,
      floorPlanForm,
      backgroundImageRules,
      backgroundImageRulesOptional,
      parkingCanvas,
      floorOptions,

      loadingFloors,
      deletingFloorPlanId, 


      // Computed
      availableProjects,
      setItemProps,

      // Methods
      onProjectChange,
      loadFloorPlans,
      loadProjectFloors,
      refreshFloorPlans,
      selectFloorPlan,
      backToList,
      createNewFloorPlan,
      editFloorPlan,
      closeFloorPlanDialog,
      submitFloorPlan,
      deleteFloorPlan,
      saveFloorPlan,
      togglePreviewMode,
      toggleGrid,
      addSpot,
      onSpotsChanged,
      onCanvasReady,
      toggleStyleEditor,
      closeStyleEditor,
      onStylesUpdated,
      formatDate,
      exportImage,
      exportPDF,
      printFloorplan
    }
  }
}
</script>

<style scoped>
.parking-floorplan-manager {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f8f9fa;
}

.manager-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.page-title {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.project-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.project-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-width: 200px;
}

.manager-content {
  flex: 1;
  overflow: hidden;
}

.floorplan-list {
  padding: 2rem;
  height: 100%;
  overflow-y: auto;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.list-header h2 {
  margin: 0;
  color: #2c3e50;
}

.floorplan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.floorplan-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.floorplan-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
}

.card-preview {
  height: 200px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-placeholder {
  text-align: center;
  color: #6c757d;
}

.preview-placeholder i {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}

.card-content {
  padding: 1rem;
}

.card-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  color: #2c3e50;
}

.card-description {
  margin: 0 0 1rem 0;
  color: #6c757d;
  font-size: 0.9rem;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  background: #dc3545;
  color: white;
}

.status-badge.active {
  background: #28a745;
}

.created-date {
  font-size: 0.8rem;
  color: #6c757d;
}

.card-actions {
  padding: 1rem;
  border-top: 1px solid #e9ecef;
  display: flex;
  gap: 0.5rem;
}

.empty-state, .no-project-selected {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state i, .no-project-selected i {
  font-size: 4rem;
  color: #6c757d;
  margin-bottom: 1rem;
}

.loading-state {
  text-align: center;
  padding: 4rem 2rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.floorplan-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e9ecef;
}

.editor-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editor-title h2 {
  margin: 0;
}

.editor-status {
  font-size: 0.9rem;
  color: #6c757d;
}

.editor-actions {
  display: flex;
  gap: 0.5rem;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 2rem;
  padding: 1rem 2rem;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.file-input {
  display: none;
}

.canvas-container {
  flex: 1;
  overflow: hidden;
  background: white;
}

/* Dialog styles */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.dialog {
  background: white;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e9ecef;
}

.dialog-header h3 {
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #6c757d;
}

.dialog-content {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #2c3e50;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-checkbox {
  margin-right: 0.5rem;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
}

/* Button styles */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #1e7e34;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-outline {
  background: white;
  border: 1px solid #ddd;
  color: #495057;
}

.btn-outline:hover:not(:disabled) {
  background: #f8f9fa;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
}

.btn.active {
  background: #007bff;
  color: white;
}

.list-actions .btn {
  gap: 0.25rem;
}

.style-editor-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 200;
}
</style>