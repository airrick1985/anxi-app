<template>
  <v-dialog :model-value="show" @update:model-value="close" :fullscreen="isMobile"
    :max-width="isMobile ? '100%' : '800px'"
    :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'" persistent>
    <v-card :class="{ 'd-flex flex-column': isMobile }" :style="isMobile ? 'height: 100%;' : ''">
      <v-card-title class="d-flex justify-space-between align-center flex-wrap ga-2">
        <!-- 🔐 手機版隱藏解鎖：連點標題（含戶別）8 次解除已售車位禁用（效果同連按 8 次 A） -->
        <span class="parking-modal-title tap-unlock-target" @click="tapUnlockSoldParking">{{ title }}</span>
        <div class="d-flex align-center ga-1">
          <v-btn
            prepend-icon="mdi-car-side"
            variant="tonal"
            color="info"
            :size="isMobile ? 'small' : 'default'"
            @click="openParkingEditor"
          >
            車位銷控
          </v-btn>
          <v-btn v-if="isMobile" icon="mdi-close" variant="text" @click="close"></v-btn>
        </div>
      </v-card-title>
      <v-card-text :class="{ 'flex-grow-1 overflow-y-auto': isMobile }">

        <!-- ✅ 已選車位：桌面/手機統一卡片式清單（原表格/灰卡片樣式單調難讀） -->
        <div class="d-flex align-center flex-wrap ga-2 mb-2">
          <v-icon color="primary" size="small">mdi-car-multiple</v-icon>
          <span class="text-subtitle-1 font-weight-bold">已選車位</span>
          <v-chip size="x-small" variant="tonal" color="primary">{{ localParking.length }} 個</v-chip>
          <v-spacer />
          <v-chip v-if="localParking.length > 0" size="small" variant="tonal" color="teal" prepend-icon="mdi-sigma">
            合計 {{ selectedParkingTotal }} 萬
          </v-chip>
        </div>

        <div v-if="localParking.length > 0">
          <div v-for="(p, index) in localParking" :key="p.spotId || p['車位編號']" class="parking-card">
            <div class="parking-card-icon"><v-icon color="white" size="20">mdi-car</v-icon></div>
            <div class="parking-card-main">
              <div class="parking-card-id">
                {{ spotIdOf(p) }}
                <v-chip v-if="typeOf(p)" size="x-small" variant="tonal"
                  :color="String(typeOf(p)).includes('法定') ? 'indigo' : 'brown'">{{ typeOf(p) }}</v-chip>
              </div>
              <div class="parking-card-meta">
                <span><v-icon size="12" class="mr-1">mdi-ruler</v-icon>{{ sizeOf(p) }}</span>
                <template v-if="mode === 'sales'">
                  <span>表價 <strong>{{ priceListOf(p) }}</strong> 萬</span>
                  <span>底價 <strong>{{ priceFloorOf(p) }}</strong> 萬</span>
                </template>
              </div>
            </div>
            <div class="parking-card-price">
              <template v-if="mode === 'quote'">
                <div class="parking-price-value">{{ priceListOf(p) }}<span class="unit"> 萬</span></div>
                <div class="parking-price-label">車位價格</div>
              </template>
              <v-text-field v-else
                v-model.number="p.price_transaction"
                label="成交價" suffix="萬" type="number" inputmode="decimal"
                density="compact" hide-details variant="outlined" bg-color="white"
                class="parking-trans-input" />
            </div>
            <v-btn icon="mdi-close" size="x-small" variant="text" color="grey"
              class="parking-card-remove" title="移除此車位" @click="removeParking(index)" />
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else class="parking-empty">
          <v-icon size="36" color="grey-lighten-1">mdi-car-off</v-icon>
          <div class="mt-1">尚未選擇任何車位</div>
          <div class="text-caption">請由下方「加入車位」選擇樓層與車位</div>
        </div>

        <!-- ✅ 加入車位：樓層改為 chips 一目了然，車位維持下拉（數量多） -->
        <div class="add-parking-panel mt-4 pa-3">
          <div class="text-subtitle-2 mb-2 d-flex align-center">
            <v-icon size="small" class="mr-1" color="primary">mdi-plus-circle-outline</v-icon>加入車位
            <span v-if="canSelectSoldParking" class="ml-2 text-caption text-amber-darken-3">✨ 已售可選</span>
          </div>
          <div class="text-caption text-grey mb-1">樓層</div>
          <v-chip-group v-model="selectedFloor" column class="floor-chips mb-2">
            <v-chip v-for="f in floorOptions" :key="f" :value="f" filter size="small"
              variant="outlined" color="primary" class="floor-chip">{{ f }}</v-chip>
          </v-chip-group>
          <v-row dense align="center">
            <v-col cols="12" sm="8">
              <v-select
                label="選擇車位"
                :items="availableParkingOptions"
                v-model="newParkingSelection"
                item-title="displayText"
                :item-props="itemProps"
                return-object
                hide-details
                no-data-text="請先選擇樓層"
                :disabled="!selectedFloor"
                :density="isMobile ? 'comfortable' : 'compact'"
                variant="outlined"
                bg-color="white"
              ></v-select>
            </v-col>
            <v-col cols="12" sm="4">
              <v-btn color="primary" variant="flat" @click="addParking"
                :disabled="!newParkingSelection" block
                prepend-icon="mdi-plus">加入</v-btn>
            </v-col>
          </v-row>
        </div>
      </v-card-text>
      <v-card-actions>
        <span v-if="localParking.length > 0" class="text-caption text-grey ml-2">
          共 {{ localParking.length }} 個車位・合計 {{ selectedParkingTotal }} 萬
        </span>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">關閉</v-btn>

        <v-btn
          color="success"
          :variant="isMobile ? 'flat' : 'text'"
          :class="{ 'px-6': isMobile }"
          @click="confirm"
        >
          確定
        </v-btn>

      </v-card-actions>
    </v-card>

    <v-dialog v-model="isParkingEditorDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition" :eager="true">
      <v-card class="d-flex flex-column">
        <v-toolbar dark color="f5f5f7" density="compact">
          <v-btn icon dark @click="isParkingEditorDialogVisible = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
          <v-toolbar-title>車位銷控</v-toolbar-title>
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
            :context-mode="props.mode"
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
import { ref, computed, watch, defineProps, defineEmits, onMounted, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';

// ✓ START: 匯入 ParkingCanvas 相關
import ParkingCanvas from '@/components/ParkingCanvas.vue'; 
import { getFloorPlansAPI } from '@/api'; 
import { useToast } from 'vue-toastification';
import { useTapUnlock } from '@/composables/useTapUnlock';

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

// 手機版判斷：與 UnitDetailModal 一致，使用 Vuetify useDisplay
const { mobile: isMobile } = useDisplay();

const localParking = ref([]);
const newParkingSelection = ref(null);

const selectedFloor = ref(null);

const toast = useToast(); // ✓ 實例化 toast

// 🆕 連按 A 鍵解除已售車位相關狀態
let aKeyPressCount = 0;
let aKeyPressTimer = null;
const canSelectSoldParking = ref(false); // 是否允許選擇已售車位

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

const floorOptions = computed(() => {
  if (!props.allParkingData) return [];
  // 提取所有唯一的 floor 值，過濾掉 null 或 undefined
  const floors = new Set(props.allParkingData.map(p => p.floor).filter(Boolean));
  // 排序 (使用 localeCompare 搭配 numeric: true 以正確處理 B1, B2, 1F, 2F 等)
  return Array.from(floors).sort((a, b) => 
    String(a).localeCompare(String(b), 'zh-Hant', { numeric: true })
  );
});


watch(() => props.show, (newVal) => {
  if (newVal) {
    // ✅ 深拷貝傳入的車位資料，確保是獨立副本
    localParking.value = JSON.parse(JSON.stringify(props.initialSelectedParking));
    newParkingSelection.value = null;
    selectedFloor.value = null; // ✅ [打勾] 3. 新增：重置樓層選擇
    // 🆕 Modal 開啟時添加鍵盤監聽
    document.addEventListener('keydown', handleKeyPress);
  } else {
    // 🆕 Modal 關閉時移除鍵盤監聽
    document.removeEventListener('keydown', handleKeyPress);
    // 清理計時器和計數
    if (aKeyPressTimer) {
      clearTimeout(aKeyPressTimer);
      aKeyPressTimer = null;
    }
    aKeyPressCount = 0;
    resetTapUnlockSoldParking();
  }
});

// ✅ [打勾] 4. 新增：監聽樓層變化，清空車位選擇
watch(selectedFloor, () => {
  newParkingSelection.value = null;
});

// ✅ [新增] 欄位讀取 helpers（容忍中英文兩種欄位名）＋合計
const spotIdOf = p => p.spotId || p['車位編號'] || '';
const sizeOf = p => p.size || p['車位尺寸'] || p['坪數'] || '標準';
const typeOf = p => p.type || p['類型'] || p['車位類型'] || '';
const priceListOf = p => p.price_list || p['車位表價'] || p['表價'] || '—';
const priceFloorOf = p => p.price_floor || p['車位底價'] || p['底價'] || '—';

// 合計：sales 用成交價（未填以表價備援）、quote 用表價
const selectedParkingTotal = computed(() =>
  localParking.value.reduce((sum, p) => {
    const v = props.mode === 'sales'
      ? (p.price_transaction ?? priceListOf(p))
      : priceListOf(p);
    return sum + (Number(v) || 0);
  }, 0));

// 3. 動態標題
const title = computed(() => {
  if (props.mode === 'quote') {
   
    const displayId = props.unitId;
    return `為 ${displayId} 選擇車位`;
  }
  return '選擇車位';
});

// ✅ 更新 computed 屬性，使其讀取 Firestore 欄位
const availableParkingOptions = computed(() => {
  // 如果沒有選擇樓層，則不顯示任何車位
  if (!selectedFloor.value) {
    return [];
  }

  const selectedIds = new Set(localParking.value.map(p => p.spotId || p['車位編號']));
  
  return props.allParkingData
    .filter(p => {
      return p.floor === selectedFloor.value;
    })
    .filter(p => {
      const id = p.spotId || p['車位編號'];
      return !selectedIds.has(id);
    })
    // (保留您上一部要求的排序邏輯)
    .sort((a, b) => {
      const idA = String(a.spotId || a['車位編號'] || '');
      const idB = String(b.spotId || b['車位編號'] || '');
      return idA.localeCompare(idB, 'zh-Hant', { numeric: true });
    })
    .map(p => {
      const spotId = p.spotId || p['車位編號'] || 'undefined';
      const priceList = p.price_list || p['表價'] || p['車位表價'] || 'undefined';
      const isSold = p.status === '已售' || p['狀態'] === '已售' || p['銷控狀態'] === '已售';
      const isGuest = p.status === '來賓車位' || p['狀態'] === '來賓車位' || p['銷控狀態'] === '來賓車位';
      const backendStatusText = p.status_backend || p['後台狀態'] ? ` - ${p.status_backend || p['後台狀態']}` : '';

      // ✅ [修改] 根據是否已售，決定顯示格式
      let displayText = '';

      if (isSold) {
        // 如果已售：顯示 "B2-120 (已售)"
        displayText = `${spotId} (已售)`;
      } else if (isGuest) {
        // 來賓車位：顯示 "B2-120 (來賓車位)"，不可選
        displayText = `${spotId} (來賓車位)`;
      } else {
        // 如果未售：顯示 "B2-120 (300萬)"
        displayText = `${spotId} (${priceList}萬)`;
      }

      // 如果是 sales 模式且有後台狀態，補在後面 (保持原有功能)
      if (props.mode === 'sales') {
        displayText += backendStatusText;
      }

      return {
        displayText: displayText,
        originalData: p,
        disabled: isSold || isGuest
      };
    });
});

const itemProps = (item) => ({
  disabled: item.disabled && !canSelectSoldParking.value,
  class: (item.disabled && !canSelectSoldParking.value) ? 'text-grey' : ''
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
      // ✅ 如果成交價不存在或為空，預設帶入表價
      price_transaction: newSpotData.price_transaction || newSpotData['車位成交價'] || newSpotData.price_list || newSpotData['表價'] || newSpotData['車位表價'],
      // ✅ [新增] 車位持分面積（m² / 坪）：供列印報價單「詳細面積」顯示
      area: newSpotData.area ?? newSpotData['車位面積(m²)'] ?? newSpotData['車位面積'] ?? null,
      area_ping: newSpotData.area_ping ?? newSpotData['車位面積_坪'] ?? newSpotData['車位面積(坪)'] ?? null,
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
    // ✓ 與樓層平面圖並行載入該建案的車位圖塊樣式（文字樣式 + 狀態顏色）
    // store 內部以 currentProjectId 守衛，已載過同建案則直接跳過，重複呼叫零成本
    const [result] = await Promise.all([
      getFloorPlansAPI(props.projectId),
      textStyleStore.fetchStyles(props.projectId),
      statusColorStore.fetchColors(props.projectId),
    ]);
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

// 🆕 連按 A 鍵解除已售車位的邏輯
const handleKeyPress = (event) => {
  const key = event.key.toUpperCase();

  if (key === 'A') {
    event.preventDefault();
    aKeyPressCount++;

    // 清除之前的計時器
    if (aKeyPressTimer) {
      clearTimeout(aKeyPressTimer);
    }

    // 如果達到 8 次，解除已售車位禁用
    if (aKeyPressCount >= 8) {
      unlockSoldParking();
      aKeyPressCount = 0;
    } else {
      // 3 秒內沒有按下 A 鍵，則重置計數
      aKeyPressTimer = setTimeout(() => {
        aKeyPressCount = 0;
      }, 3000);
    }
  }
};

// 解鎖動作（鍵盤連按 A 與手機連點標題共用）
function unlockSoldParking() {
  if (canSelectSoldParking.value) return;
  canSelectSoldParking.value = true;
  toast.success('✨ 已售車位已解除禁用');
}

// 🔐 手機版無鍵盤：連點標題「為 {戶別} 選擇車位」8 次解除已售車位禁用
const { tap: tapUnlockSoldParking, reset: resetTapUnlockSoldParking } = useTapUnlock(unlockSoldParking);

// 生命週期：卸載時的清理工作
onUnmounted(() => {
  // 移除鍵盤監聽（如果還沒被 watch 移除的話）
  document.removeEventListener('keydown', handleKeyPress);
  // 清理計時器
  if (aKeyPressTimer) {
    clearTimeout(aKeyPressTimer);
  }
});


</script>

<style scoped>
.parking-modal-title {
  min-width: 0;
  overflow-wrap: anywhere;
  white-space: normal;
  line-height: 1.3;
}

/* 🔐 手機版隱藏解鎖點按目標：無可點擊暗示、防連點選取 */
.tap-unlock-target {
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  cursor: default;
}

/* ── ✅ 已選車位卡片（桌面/手機共用） ── */
.parking-card {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e3e8ef;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 8px;
  background: #fff;
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}
.parking-card:hover {
  border-color: #bbd6f7;
  box-shadow: 0 2px 8px rgba(30, 80, 162, 0.12);
}

.parking-card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}

.parking-card-main {
  min-width: 0;
}

.parking-card-id {
  font-size: 1.05rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  overflow-wrap: anywhere;
}

.parking-card-meta {
  display: flex;
  flex-wrap: wrap;
  column-gap: 14px;
  row-gap: 2px;
  font-size: 0.8rem;
  color: #78909c;
  margin-top: 2px;
}

.parking-card-price {
  margin-left: auto;
  text-align: right;
  flex: 0 0 auto;
}

.parking-price-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #00695c;
  line-height: 1.2;
}
.parking-price-value .unit {
  font-size: 0.8rem;
  font-weight: 400;
  color: #90a4ae;
}
.parking-price-label {
  font-size: 0.7rem;
  color: #90a4ae;
}

.parking-trans-input {
  width: 150px;
}

.parking-card-remove {
  flex: 0 0 auto;
}

/* 空狀態 */
.parking-empty {
  border: 2px dashed #cfd8dc;
  border-radius: 12px;
  padding: 24px 12px;
  text-align: center;
  color: #90a4ae;
  font-size: 0.9rem;
}

/* 加入車位面板 */
.add-parking-panel {
  background: #f5f8fc;
  border: 1px solid #e3e8ef;
  border-radius: 12px;
}

.floor-chips :deep(.v-chip) {
  background: #fff;
}

/* 手機：價格/成交價換到下一行撐滿，避免擠壓 */
@media (max-width: 600px) {
  .parking-card {
    flex-wrap: wrap;
  }
  .parking-card-price {
    margin-left: 52px;
    width: calc(100% - 100px);
    text-align: left;
    order: 5;
  }
  .parking-trans-input {
    width: 100%;
  }
}
</style>