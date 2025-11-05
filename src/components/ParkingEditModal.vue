<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="800px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>{{ title }}</span>
        <v-btn 
          prepend-icon="mdi-presentation" 
          variant="tonal" 
          color="info"
          @click="openParkingEditor"
        >
          車位總表
        </v-btn>
      </v-card-title>
      <v-card-text>
        <v-table v-if="localParking.length > 0" density="compact">
          <thead>
            <tr>
              <th>車位編號</th>
              <!-- 4. 根據 mode 顯示不同欄位 -->
              <th v-if="mode === 'sales'">底價</th>
              <th v-if="mode === 'sales'" style="width: 150px;">成交價</th>
              <th v-if="mode === 'quote'">尺寸</th>
              <th v-if="mode === 'quote'">車位價格(萬)</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in localParking" :key="p.spotId || p['車位編號']">
              <td>{{ p.spotId || p['車位編號'] }}</td>
              <!-- 5. 根據 mode 顯示不同資料 -->
              <td v-if="mode === 'sales'">{{ p.price_floor || p['車位底價'] || p['底價'] }}</td>
              <td v-if="mode === 'sales'">
                <v-text-field
                  v-model.number="p.price_transaction"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                ></v-text-field>
              </td>
              <td v-if="mode === 'quote'">{{ p.size || p['車位尺寸'] || p['坪數'] || '標準' }}</td>
              <td v-if="mode === 'quote'">{{ p.price_list || p['表價'] || p['車位表價'] }}</td>
              <td>
                <v-btn icon="mdi-close-circle-outline" size="small" variant="text" color="red" @click="removeParking(index)"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-center text-grey my-4">尚未選擇任何車位</p>
        <v-divider class="my-4"></v-divider>
        <v-row align="center" dense>
          <v-col cols="8">
            <v-select
              label="選擇可新增的車位"
              :items="availableParkingOptions"
              v-model="newParkingSelection"
              item-title="displayText"
              :item-props="itemProps"
              return-object
              hide-details
              no-data-text="沒有可選擇的車位"
            ></v-select>
          </v-col>
          <v-col cols="4">
            <v-btn color="primary" @click="addParking" :disabled="!newParkingSelection">新增此車位</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="success" @click="confirm">確定</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="isParkingEditorDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition" :eager="true">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="primary" density="compact">
          <v-btn icon dark @click="isParkingEditorDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位銷控管理</v-toolbar-title>
          <v-spacer></v-spacer>
      
        </v-toolbar>
        
        <div class="flex-grow-1" style="position: relative; overflow: hidden; background-color: #f0f2f5;">
          <v-overlay
            :model-value="isEditorLoading"
            class="align-center justify-center"
            persistent
            scrim="rgba(255, 255, 255, 0.7)"
          >
            <div class="text-center">
              <v-progress-circular indeterminate color="#008cff" size="64"></v-progress-circular>
              <p class="mt-4 text-body-1 text-black">正在載入車位資料...</p>
            </div>
          </v-overlay>
          
         <ParkingCanvas
            v-if="!isEditorLoading && activeEditorFloorPlan"
            :project-id="props.projectId"
            :floor-plan="activeEditorFloorPlan"
            
            :preview-mode="true" :show-tools="true"
            v-model:display-mode="parkingCanvasDisplayMode" 
            
            :allow-import="false" :allow-adjust-all="false" :show-status-toggle="props.mode === 'sales'" 

            :text-styles="textStyleStore.styles" 
            :status-colors="statusColorStore.colors" 
            @floor-switched="handleEditorFloorSwitch"
            @spots-changed="console.log('ParkingEditModal 偵測到畫布變更')"
            style="height: 100%; width: 100%;"
          />
        </div>
      </v-card>
    </v-dialog>

  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

// ✓ START: 匯入 ParkingCanvas 相關
import ParkingCanvas from '@/components/ParkingCanvas.vue'; 
import { getFloorPlansAPI } from '@/api'; 
import { useToast } from 'vue-toastification';

// ✓ START: 匯入樣式 Store
import { useTextStyleStore } from '@/store/textStyleStore';
import { useStatusColorStore } from '@/store/statusColorStore';
// ✓ END: 匯入

const props = defineProps({
  show: { type: Boolean, required: true },
  allParkingData: { type: Array, default: () => [] },
  initialSelectedParking: { type: Array, default: () => [] },
  // 1. 新增 mode prop，用於區分模式
  mode: {
    type: String,
    default: 'sales' // 'sales' 或 'quote'
  },
  // 2. 新增 unitId prop，用於報價模式顯示標題
  unitId: {
    type: String,
    default: ''
  },
  
  // ✓ START: 新增 projectId (必須由父組件傳入)
  projectId: {
    type: String,
    required: true
  },
  // ✓ START: 接收來自 SalesInfoForm 的 viewMode
  salesControlViewMode: {
    type: String,
    default: 'sales' // 預設為 'sales'
  }
  // ✓ END: 新增
});

const emit = defineEmits(['update:show', 'confirm']);

const localParking = ref([]);
const newParkingSelection = ref(null);

const toast = useToast(); // ✓ 實例化 toast

// ✓ START: 實例化樣式 Store
const textStyleStore = useTextStyleStore();
const statusColorStore = useStatusColorStore();
// ✓ END: 實例化

// ✓ START: 車位編輯器 (ParkingCanvas) 彈窗狀態
const isParkingEditorDialogVisible = ref(false); 
const editorFloorPlans = ref([]); 
const activeEditorFloorPlan = ref(null); 
const isEditorLoading = ref(false);
const parkingCanvasDisplayMode = ref('backend'); // ✓ 新增：Canvas 顯示模式狀態
// ✓ END: 編輯器狀態

watch(() => props.show, (newVal) => {
  if (newVal) {
    // ✅ 深拷貝傳入的車位資料，確保是獨立副本
    localParking.value = JSON.parse(JSON.stringify(props.initialSelectedParking));
    newParkingSelection.value = null;
  }
});

// 3. 動態標題
const title = computed(() => {
  if (props.mode === 'quote') {
    const lastHyphenIndex = props.unitId.lastIndexOf('-');
    const displayId = lastHyphenIndex > 0 ? props.unitId.substring(0, lastHyphenIndex) : props.unitId;
    return `為 ${displayId} 選擇車位`;
  }
  return '編輯持有車位';
});

// ✅ 更新 computed 屬性，使其讀取 Firestore 欄位
const availableParkingOptions = computed(() => {
  
  const selectedIds = new Set(localParking.value.map(p => p.spotId || p['車位編號']));
  return props.allParkingData
    .filter(p => {
      const id = p.spotId || p['車位編號'];
      return !selectedIds.has(id);
    })
    .map(p => {
      const spotId = p.spotId || p['車位編號'] || 'undefined';
      const priceList = p.price_list || p['表價'] || p['車位表價'] || 'undefined';
      const isSold = p.status === '已售' || p['狀態'] === '已售' || p['銷控狀態'] === '已售';
      const backendStatusText = p.status_backend || p['後台狀態'] ? ` - ${p.status_backend || p['後台狀態']}` : '';
      return {
        displayText: `${spotId} (表價: ${priceList}萬)${isSold ? ' - 已售' : ''}${props.mode === 'sales' ? backendStatusText : ''}`,
        originalData: p,
        disabled: isSold
      };
    });
});

const itemProps = (item) => ({
  disabled: item.disabled,
  class: item.disabled ? 'text-grey' : ''
});

// ✅ 更新新增邏輯，使其使用正確的欄位名稱
function addParking() {
  if (newParkingSelection.value && newParkingSelection.value.originalData) {
    const newSpotData = newParkingSelection.value.originalData;
    const newSpot = {
      // ✅ 使用統一的欄位名稱，支援中英文兩種格式
      spotId: newSpotData.spotId || newSpotData['車位編號'],
      '車位編號': newSpotData.spotId || newSpotData['車位編號'],
      size: newSpotData.size || newSpotData['車位尺寸'] || newSpotData['坪數'] || '標準',
      type: newSpotData.type || newSpotData['類型'] || newSpotData['車位類型'],
      price_list: newSpotData.price_list || newSpotData['表價'] || newSpotData['車位表價'],
      price_floor: newSpotData.price_floor || newSpotData['底價'] || newSpotData['車位底價'],
      // ✅ 如果成交價不存在，預設帶入表價
      price_transaction: (newSpotData.price_transaction !== undefined && newSpotData.price_transaction !== null) 
                         ? newSpotData.price_transaction 
                         : (newSpotData['車位成交價'] || newSpotData.price_list || newSpotData['表價'] || newSpotData['車位表價']),
    };
    localParking.value.push(newSpot);
    newParkingSelection.value = null;
  }
}

function removeParking(index) {
  localParking.value.splice(index, 1);
}

function close() {
  emit('update:show', false);
}

function confirm() {
  // ✅ 回傳的 localParking.value 已是符合 Firestore 結構的資料
  emit('confirm', localParking.value);
  close();
}

// ✓ START: 替換 handleOpenSlide 為開啟 ParkingCanvas 的邏輯
const openParkingEditor = async () => {
  // ✓ 我們使用從 prop 傳入的 projectId
  if (!props.projectId) {
    toast.error('未提供 projectId，無法開啟編輯器。');
    return;
  }
  isEditorLoading.value = true;
  isParkingEditorDialogVisible.value = true;

  // ✓ START: 根據 ParkingEditModal 自身的 mode 設置預設顯示模式
if (props.mode === 'quote') {
  parkingCanvasDisplayMode.value = 'sales'; // 報價單 (QuoteItem) -> 預設銷售狀態
} else { // props.mode === 'sales'
  parkingCanvasDisplayMode.value = 'backend'; // 銷控表單 (SalesInfoForm) -> 預設後台狀態
}


  activeEditorFloorPlan.value = null;
  editorFloorPlans.value = [];
  
  try {
    const result = await getFloorPlansAPI(props.projectId);
    if (result.status === 'success' && result.data && result.data.length > 0) {
      result.data.sort((a, b) => 
        (a.floor || '').localeCompare(b.floor || '', 'zh-Hant', { numeric: true })
      );
      editorFloorPlans.value = result.data;
      activeEditorFloorPlan.value = editorFloorPlans.value[0];
    } else {
      toast.error('此專案沒有可編輯的樓層平面圖。');
      isParkingEditorDialogVisible.value = false;
    }
  } catch (error) {
    toast.error(`載入樓層資料失敗: ${error.message}`);
    isParkingEditorDialogVisible.value = false;
  } finally {
    isEditorLoading.value = false;
  }
};

// ✓ NEW: 處理編輯器內部的樓層切換
const handleEditorFloorSwitch = (plan) => {
  activeEditorFloorPlan.value = plan;
};


</script>