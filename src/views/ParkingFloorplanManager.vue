<template>
  <div class="parking-floorplan-manager">
    <!-- 頭部操作區 - 在編輯模式時隱藏 -->
    <div class="manager-header" v-show="!selectedFloorPlan">
      <div class="header-left">
        <v-btn @click="goBackToParkingControl" variant="outlined" prepend-icon="mdi-arrow-left" class="mr-4">
          返回車位銷控
        </v-btn>
        <h1 class="page-title">車位平面圖管理</h1>
        <span v-if="projectName" class="text-h6 font-weight-bold text-primary ml-4">{{ projectName }}</span>
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
            <!-- 儲存與預覽組 -->
            <div class="action-group">
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
            </div>

            <!-- 編輯工具組 -->
            <div class="action-group">
              <v-btn 
                @click="toggleCanvasTools" 
                :color="showCanvasTools ? 'primary' : ''"
                variant="outlined"
                prepend-icon="mdi-tools"
              >
                {{ showCanvasTools ? '隱藏工具' : '顯示工具' }}
              </v-btn>
              <v-btn 
                @click="toggleStatusColorEditor" 
                :color="showStatusColorEditor ? 'primary' : ''"
                variant="outlined"
                prepend-icon="mdi-palette"
              >
                狀態顏色
              </v-btn>
              <v-btn 
                @click="toggleTextStyleEditor" 
                :color="showTextStyleEditor ? 'primary' : ''"
                variant="outlined"
                prepend-icon="mdi-format-letter-case"
              >
                文字樣式
              </v-btn>
            </div>

            <!-- 匯出組 -->
            <div class="action-group">
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
        </div>

     
        <!-- Canvas 容器 -->
           <div class="canvas-container">
          <ParkingCanvas
            ref="parkingCanvas"
            :floor-plan="selectedFloorPlan"
            :project-id="selectedProjectId"
            :preview-mode="isPreviewMode"
            v-model:display-mode="displayMode"
            :text-styles="textStyleStore.styles"
            :status-colors="statusColorStore.colors" 
            :show-tools="showCanvasTools"
            @spots-changed="onSpotsChanged"
            @floor-switched="handleFloorSwitch" 
          />

           <div v-if="showStatusColorEditor" class="style-editor-overlay">
            <StatusColorEditor
              v-model="statusColorStore.colors"
              @close="showStatusColorEditor = false"
            />
          </div>

          <!-- 樣式編輯器 -->
           <div v-if="showTextStyleEditor" class="style-editor-overlay">
            <TextStyleEditor
              v-model="textStyleStore.styles"
              @close="showTextStyleEditor = false"
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
              :label="editingFloorPlan ? '更換平面圖底圖' : '平面圖底圖 *'"
              placeholder="請選擇圖片或 SVG 檔案"
              accept="image/png, image/jpeg, image/webp, image/svg+xml"
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
import { useRoute, useRouter } from 'vue-router' // 引入 useRouter
import { useUserStore } from '@/store/user'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { db } from '@/firebase'; // 引入 db

import ParkingCanvas from '@/components/ParkingCanvas.vue'
import { storeToRefs } from 'pinia'
import { useTextStyleStore } from '@/store/textStyleStore'
import TextStyleEditor from '@/components/TextStyleEditor.vue'
import { useStatusColorStore } from '@/store/statusColorStore'
import StatusColorEditor from '@/components/StatusColorEditor.vue'
import {
  uploadSalesImage, // 假設這個已在 api.js 中且正確
  uploadSalesSvgViaFunction, // ✓ 新增匯入 SVG 專用函式
  getFloorPlansAPI,
  getProjectFloorsForManager,
  createFloorPlanAPI,
  updateFloorPlanAPI,
  deleteFloorPlanAPI,
  saveSpotLayoutsAPI,
  getSpotLayoutsAPI
} from '@/api'
import { useToast } from 'vue-toastification';

export default {
  name: 'ParkingFloorplanManager',
  components: {
    ParkingCanvas,
    TextStyleEditor,
    StatusColorEditor
  },
  props: {
    projectId: {
      type: String,
      required: true
    }
  },
  setup(props) {
    // Stores
    const userStore = useUserStore()
    const projectStore = useProjectStore()
    const uiStore = useUiStore()
    const textStyleStore = useTextStyleStore()
    const statusColorStore = useStatusColorStore()
    const functions = getFunctions()
    const route = useRoute()
    const router = useRouter() // 實例化 useRouter
    const toast = useToast();

    // Reactive data
    const selectedProjectId = ref(props.projectId)
    const floorPlans = ref([])
    const selectedFloorPlan = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const submitting = ref(false)
    const isEditorDirty = ref(false)

    const isPreviewMode = ref(false)
    const displayMode = ref('backend') 


//// 車位狀態顏色相關狀態
    const showStatusColorEditor = ref(false)
    const toggleStatusColorEditor = () => {
      showStatusColorEditor.value = !showStatusColorEditor.value
    }

    const showTextStyleEditor = ref(false)
    const toggleTextStyleEditor = () => {
      showTextStyleEditor.value = !showTextStyleEditor.value
    }

    const showCanvasTools = ref(true)
    const toggleCanvasTools = () => {
      showCanvasTools.value = !showCanvasTools.value
    }

     // ✓ 新增：導航到 TEST.vue 的函式
    const goToTestPage = () => {
      // 假設 'TestPage' 是您在 vue-router 中為 TEST.vue 設定的路由名稱
      router.push({ name: 'Test' });
    };
    
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

    const projectName = computed(() => {
      return projectStore.idToNameMap[props.projectId] || '未知建案'
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
        displayMode,
        disabled: isDisabled && !isCurrentEditingOption,
      };
    };


    // Methods

    // 新增：返回車位銷控管理頁面的方法
    const goBackToParkingControl = () => {
      if (props.projectId) {
        router.push({
          name: 'ParkingControl',
          params: { projectId: props.projectId }
        });
      } else {
        // 如果沒有 projectId，可以導覽回上一頁或一個預設頁面
        router.back();
      }
    };

   const onProjectChange = async () => {
      if (selectedProjectId.value) {
        await Promise.all([
          loadFloorPlans(),
          loadProjectFloors(),
          textStyleStore.fetchStyles(selectedProjectId.value),
          statusColorStore.fetchColors(selectedProjectId.value)
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
        // ✓ 修改：呼叫 api.js 函式
        const resultData = await getFloorPlansAPI(selectedProjectId.value)
        if (resultData.status === 'success') {
          floorPlans.value = resultData.data || []
        } else {
          throw new Error(resultData.message || '後端回報錯誤');
        }
      } catch (error) {
        console.error('載入平面圖失敗:', error)
        // ✓ 使用 toast 提示錯誤
        toast.error(`載入平面圖失敗: ${error.message}`);
      } finally {
        loading.value = false
      }
    }

   const loadProjectFloors = async () => {
      if (!selectedProjectId.value) return
      loadingFloors.value = true
      try {
        // ✓ 修改：呼叫 api.js 函式
        const resultData = await getProjectFloorsForManager(selectedProjectId.value)
        if (resultData.status === 'error') {
          // ✓ 使用 toast 提示錯誤
          toast.error(resultData.message);
          floorOptions.value = []
        } else {
          const floors = resultData.data || []
          floorOptions.value = floors
        }
      } catch (error) {
        console.error('載入樓層清單失敗:', error)
        // ✓ 使用 toast 提示錯誤
        toast.error(`載入樓層清單失敗: ${error.message}`);
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

    // ✓ 2. 新增 handleFloorSwitch 函式
    const handleFloorSwitch = (newPlan) => {
      // 檢查是否有未儲存的變更
      if (isEditorDirty.value) {
        if (!confirm('您有未儲存的變更，確定要切換樓層嗎？（目前變更將會遺失）')) {
          return; // 使用者取消，中斷切換
        }
      }
      
      console.log(`[Manager] 接收到 floor-switched 事件, 切換至: ${newPlan.floor}`);
      // 更新父元件的 selectedFloorPlan
      selectedFloorPlan.value = newPlan;
      // 重設 "未儲存" 狀態，因為我們剛載入新樓層
      isEditorDirty.value = false; 
    };

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
    alert('請輸入平面圖名稱');
    return;
  }
  
  if (!floorPlanForm.value.floor || (typeof floorPlanForm.value.floor === 'string' && !floorPlanForm.value.floor.trim())) {
    alert('請選擇樓層');
    return;
  }

  const isEditingMode = !!editingFloorPlan.value;
  if (!isEditingMode && (!floorPlanForm.value.backgroundImageFile || floorPlanForm.value.backgroundImageFile.length === 0)) {
    alert('請選擇平面圖底圖檔案');
    return;
  }

  submitting.value = true
  try {
    let backgroundImageUrl = editingFloorPlan.value ? editingFloorPlan.value.backgroundImageUrl : null;

    if (floorPlanForm.value.backgroundImageFile) {
      const file = Array.isArray(floorPlanForm.value.backgroundImageFile)
        ? floorPlanForm.value.backgroundImageFile[0]
        : floorPlanForm.value.backgroundImageFile;
        
      try {
        const base64 = await fileToBase64(file);
        const fileName = `${Date.now()}_${file.name}`;
        const storagePath = `floorplan-backgrounds/${fileName}`;

        // --- 修正後的上傳邏輯 (只保留這一組) ---
        let uploadResult;
        const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
        
        if (isSvg) {
          // 使用 SVG 專用上傳函式
          uploadResult = await uploadSalesSvgViaFunction(
            storagePath, fileName, base64, selectedProjectId.value
          );
        } else {
          // 使用一般圖片上傳函式，傳入真實的 file.type
          uploadResult = await uploadSalesImage(
            storagePath, fileName, base64, selectedProjectId.value, file.type
          );
        }
        
        backgroundImageUrl = uploadResult.downloadURL;
        console.log('[Manager] 檔案上傳成功:', backgroundImageUrl);
        // --- 結束上傳邏輯 ---

      } catch (uploadError) {
        console.error('圖片上傳或處理失敗:', uploadError);
        toast.error(`圖片上傳失敗: ${uploadError.message}`);
        submitting.value = false;
        return;
      }
    } else if (!editingFloorPlan.value) {
      if (!backgroundImageUrl) {
        toast.error('新增平面圖時必須選擇底圖檔案');
        submitting.value = false;
        return;
      }
    }

    // 準備儲存至 Firestore 的 Payload
    const payload = {
      projectId: selectedProjectId.value,
      name: floorPlanForm.value.name,
      description: floorPlanForm.value.description,
      floor: floorPlanForm.value.floor,
      isActive: floorPlanForm.value.isActive,
      backgroundImageUrl: backgroundImageUrl
    };

    if (editingFloorPlan.value) {
      payload.floorPlanId = editingFloorPlan.value.id;
      await updateFloorPlanAPI(payload);
    } else {
      await createFloorPlanAPI(payload);
    }

    await Promise.all([loadFloorPlans(), loadProjectFloors()]);
    closeFloorPlanDialog();
    toast.success(editingFloorPlan.value ? '平面圖更新成功！' : '平面圖建立成功！');

  } catch (error) {
    console.error('儲存平面圖失敗:', error);
    toast.error(`儲存失敗: ${error.message}`);
  } finally {
    submitting.value = false
  }
};

     const deleteFloorPlan = async (floorPlan) => {
      if (!confirm(`確定要刪除平面圖「${floorPlan.name}」嗎？此操作無法復原。`)) {
        return
      }
      deletingFloorPlanId.value = floorPlan.id
      try {
        // ✓ 修改：呼叫 api.js 的刪除函式
        await deleteFloorPlanAPI(floorPlan.id)

        // 從本地列表移除 (保持不變)
        const index = floorPlans.value.findIndex(fp => fp.id === floorPlan.id)
        if (index !== -1) {
          floorPlans.value.splice(index, 1)
        }
        if (selectedFloorPlan.value && selectedFloorPlan.value.id === floorPlan.id) {
          selectedFloorPlan.value = null
        }
        await loadProjectFloors() // 重新載入樓層選項
        // ✓ 使用 toast 提示成功
        toast.success('平面圖刪除成功！');
      } catch (error) {
        console.error('刪除平面圖失敗:', error)
        // ✓ 使用 toast 提示錯誤
        toast.error(`刪除失敗: ${error.message}`);
      } finally {
        deletingFloorPlanId.value = null
      }
    }

    const saveFloorPlan = async () => {
      if (!parkingCanvas.value) return;
      saving.value = true;
      
      try {
        const layouts = parkingCanvas.value.getSpotLayouts();
        const floorPlanId = selectedFloorPlan.value.id;
        const projId = selectedProjectId.value;

//console.log('[Manager] 呼叫 saveSpotLayoutsAPI 之前，從 Canvas 獲取的資料：', JSON.stringify(layouts, null, 2));
        // ✓ 1. 呼叫 api.js 中的函式
        await saveSpotLayoutsAPI(floorPlanId, layouts, projId);

        isEditorDirty.value = false;
        toast.success('平面圖儲存成功！');
        
        // ✓ 2. 儲存成功後，重新載入畫布


      } catch (error) {
        console.error('儲存平面圖失敗:', error);
        toast.error(`儲存失敗: ${error.message}`);
      } finally {
        saving.value = false;
      }
    }

    const togglePreviewMode = () => {
      isPreviewMode.value = !isPreviewMode.value
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

    const onCanvasReady = async () => {
      //console.log('[Manager] Canvas 準備就緒 (onCanvasReady event received)')
      if (selectedFloorPlan.value && selectedFloorPlan.value.id) {
        try {
          //console.log(`[Manager] 正在為 floorPlanId: ${selectedFloorPlan.value.id} 獲取佈局...`)
          // ✓ 修改：呼叫 api.js 的獲取佈局函式
          const resultData = await getSpotLayoutsAPI(
            selectedFloorPlan.value.id,
            selectedProjectId.value // ✓ 傳遞 projectId
          )

          console.log(`[MANAGER LOG] onCanvasReady: getSpotLayoutsAPI 回傳的 resultData:`, JSON.stringify(resultData));

          //console.log('[Manager] 從 getSpotLayoutsAPI 獲取到的原始 resultData:', resultData)

          if (resultData.status === 'success' && resultData.layouts) {
            const layouts = resultData.layouts
            //console.log('[Manager] 解析後的 layouts 資料:', JSON.parse(JSON.stringify(layouts)))
            if (parkingCanvas.value) {
              //console.log('[Manager] 呼叫 parkingCanvas.loadSpotLayouts...')
              parkingCanvas.value.loadSpotLayouts(layouts)
              // ✓ 載入成功後，標記為未修改
              isEditorDirty.value = false;
            } else {
              console.error('[Manager] parkingCanvas ref 為空，無法載入佈局！')
            }
          } else if (resultData.status === 'success' && !resultData.layouts) {
            console.warn('[Manager] getSpotLayoutsAPI 成功但未回傳 layouts 陣列。')
            if (parkingCanvas.value) parkingCanvas.value.loadSpotLayouts([]); // 載入空佈局
          } else {
            // 如果後端回報 status: 'error'
            throw new Error(resultData.message || '獲取佈局時後端回報錯誤');
          }
        } catch (error) {
          console.error('[Manager] 載入車位佈局失敗:', error)
          // ✓ 使用 toast 提示錯誤
          toast.error(`載入佈局失敗: ${error.message}`);
          if (parkingCanvas.value) parkingCanvas.value.loadSpotLayouts([]); // 載入空佈局以防萬一
        }
      } else {
        console.warn('[Manager] 沒有 selectedFloorPlan 或其 id，不執行載入。')
        if (parkingCanvas.value) parkingCanvas.value.loadSpotLayouts([]); // 確保載入空佈局
      }
    }//


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

    // 生命週期
    onMounted(async () => {
      // 確保專案資料已載入
      if (projectStore.projectsList.length === 0 && !projectStore.isLoading) {
        await projectStore.fetchProjects()
      }
      // 直接觸發資料載入
      if(selectedProjectId.value) {
        onProjectChange()
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
      displayMode,

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
      projectName,
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
      onSpotsChanged,
      onCanvasReady,
      formatDate,
      exportImage,
      exportPDF,
      printFloorplan,
      goBackToParkingControl,

      // 導出文字樣式相關的變數和方法
      textStyleStore,
      showTextStyleEditor,
      toggleTextStyleEditor,
      // 導出車位狀態顏色相關的變數和方法
      statusColorStore,
      showStatusColorEditor,
      toggleStatusColorEditor,
      // 導出畫布工具相關的變數和方法
      showCanvasTools,
      toggleCanvasTools,

      // ✓ 3. 匯出 handleFloorSwitch
      handleFloorSwitch,
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
  gap: 1rem;
  align-items: center;
}

.action-group {
  display: flex;
  gap: 0.5rem;
  align-items: center;
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
  position: relative; 
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
  top: 0px; 
  right: 0px; 
  z-index: 200;
}

/* ✓ 4. 刪除這裡的 .floor-chip-group 樣式 */

</style>
