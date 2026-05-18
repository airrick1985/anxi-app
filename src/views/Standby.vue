<template>
<v-container fluid class="standby-page fill-height d-flex flex-column pa-0" ref="standbyPageRef" >

  <v-toolbar density="compact">
      
      <h1 class="text-h5 text-grey-darken-3 font-weight-medium ml-3">{{ projectName }}</h1> 

      <v-spacer></v-spacer>

      <v-btn 
        icon="mdi-camera" 
        variant="text" 
        color="grey-darken-1" 
        @click="captureAndSaveScreenshot"
        :loading="isCapturing"
        :disabled="isCapturing"
      ></v-btn>

      <v-btn 
        icon="mdi-image-multiple" 
        variant="text" 
        color="grey-darken-1" 
        @click="openScreenshotBrowser"
      ></v-btn>

      <v-btn icon="mdi-cog" variant="text" color="grey-darken-1" @click="openSettingsDialog"></v-btn>
    
    <v-btn 
    icon="mdi-office-building-marker" 
    variant="text" 
    color="grey-darken-1" 
    @click="showProjectDialog = true"
    title="切換建案"
  ></v-btn>

    </v-toolbar>


   

     <span class="clock text-subtitle-1 font-weight-bold text-grey-darken-1 mr-4">
        {{ formattedTime }}
      </span>

    

     

   <v-row justify="center" class="outer-content-row flex-grow-1">
      <v-col cols="12" md="11" lg="10" xl="9"> 
        <v-row class="content-area" dense>
          <v-col cols="12" class="standby-zone-col">
               <v-sheet rounded="lg" class="pa-2" border>
          <div class="d-flex flex-wrap justify-start align-center ga-3">
            <span class="text-caption text-grey-darken-1 mr-2">狀態顏色說明:</span>
            <v-chip
              v-for="(color, status) in statusColorsConfig"
              :key="status"
              :color="color"
              label
              size="small"
              class="status-legend-chip"
            >
              {{ statusMap[status] || status }}
            </v-chip>
          </div>
        </v-sheet>
             <v-divider class="my-6"></v-divider>
        <v-card  color="white">
          <v-card-title class="zone-title text-grey-darken-1 d-flex justify-space-between align-center">
            <span>STAND BY 區</span>
            <v-chip size="small" color="blue-grey-darken-1">{{ standbyPersonnel.length }}</v-chip>
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="pa-4">
          <draggable
            v-model="standbyPersonnel"
            item-key="id"
            group="personnel"
            class="name-tag-container d-flex flex-wrap ga-4"
            ghost-class="ghost"
            drag-class="dragging"
            animation="200"
            @end="handleDragEnd"
            :disabled="isLoading"
            :delay="0" 
            :touch-start-threshold="5"
            :delay-on-touch-only="true"
            chosen-class="item-chosen"
            handle=".drag-handle"
            >
              <template #item="{ element: person, index }">
              <NameTag
                      :name="person.name"
                      :status="person.status"
                      :order="index + 1"
                      :color="getColorForStatus(person.status)"
                      @click="openPersonnelDialog(person)"
                     
                    />
              </template>
            </draggable>
            <div v-if="standbyPersonnel.length === 0 && !isLoading" class="placeholder text-center text-disabled pa-5">尚無人員在此區</div>
            <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" class="serving-zone-col">
        <v-sheet class="serving-zone-sheet fill-height" rounded="lg">
          <div class="zone-title text-grey-darken-1 d-flex justify-space-between align-center px-4 pt-4 pb-2">
            <span>接待區</span>
            <v-chip size="small" color="blue-darken-2">{{ servingPersonnel.length }}</v-chip>
          </div>
          <v-divider class="mx-4"></v-divider>
          <div class="pa-4">
          <draggable
            v-model="servingPersonnel"
            item-key="id"
            group="personnel"
            class="name-tag-container d-flex flex-wrap ga-4"
            ghost-class="ghost"
            drag-class="dragging"
            animation="200"
            @end="handleDragEnd"
            :disabled="isLoading"
            :delay="0"
            :touch-start-threshold="5"
            :delay-on-touch-only="true"
            chosen-class="item-chosen"
            handle=".drag-handle"
            >
              <template #item="{ element: person }">
            <NameTag
                  :name="person.name"
                  :status="person.status"
                  :order="null"
                  :color="getColorForStatus(person.status)"
                  @click="openPersonnelDialog(person)"
                  :alert="shouldShowAlert(person)"
                  :class="{ 'vibrating-alert': shouldShowAlert(person) }"
                  
                  :data-duration-text="getDurationText(person)"
                />
              </template>
            </draggable>
            <div v-if="servingPersonnel.length === 0 && !isLoading" class="placeholder text-center text-disabled pa-5">尚無人員在此區</div>
            <v-progress-linear v-if="isLoading" indeterminate color="primary"></v-progress-linear>
          </div>
        </v-sheet>
          </v-col>
        </v-row>
        </v-col>
    </v-row>
    </v-container>

    <v-dialog v-model="showPersonnelDialog" max-width="400" persistent>
      <v-card>
        <v-card-title class="text-h5">{{ selectedPersonnel?.name }}</v-card-title>
        <v-card-text>
          <p>目前狀態: {{ statusMap[selectedPersonnel?.status] || selectedPersonnel?.status }}</p>
          <p class="text-caption text-grey">(已持續 {{ currentStatusDuration }})</p>
          <v-switch
            v-model="isAway"
            color="blue-grey-darken-1"
            label="休假中"
            inset
            hide-details
            class="mt-4"
            @change="handleAwaySwitchChange"
            :disabled="isRevisit" ></v-switch>
          <v-switch
            v-model="isRevisit"
            color="red-darken-1"       
            label="回訪中"
            inset
            hide-details
            class="mt-2"
            @change="handleRevisitSwitchChange"
            :disabled="isAway"   ></v-switch>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="closePersonnelDialog"
            :loading="isSavingStatus"  
            :disabled="isSavingStatus" 
          >
            確認
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showSettingsDialog" max-width="760" persistent scrollable>
       <v-card :loading="isLoadingSettings" rounded="lg" class="settings-dialog__card">
        <v-card-title class="settings-dialog__bar">
          <v-icon size="22" class="me-2" color="primary">mdi-view-dashboard-edit-outline</v-icon>
          <span class="text-h6 font-weight-bold">看板設定</span>
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            :disabled="isLoadingSettings"
            @click="closeSettingsDialog"
          ></v-btn>
        </v-card-title>
        <v-divider></v-divider>

<v-card-text class="settings-dialog__body">
      <fieldset class="settings-section personnel-section">            
<header class="settings-block__head">
              <v-icon class="settings-block__icon" color="primary">mdi-account-multiple-outline</v-icon>
              <div class="settings-block__titles">
                <div class="settings-block__title">顯示人員</div>
                <div class="settings-block__hint">勾選要顯示在看板上的銷售人員</div>
              </div>
              <v-spacer></v-spacer>
              <div class="settings-block__actions">
                <v-chip size="small" variant="tonal" color="primary" label>
                  已選 {{ selectedPersonnelInDialog.length }} / {{ selectablePersonnel.length }}
                </v-chip>
                <v-btn
                  v-if="selectablePersonnel.length > 0"
                  variant="text"
                  size="small"
                  color="primary"
                  :prepend-icon="allPersonnelSelected ? 'mdi-close-box-multiple-outline' : 'mdi-checkbox-multiple-marked-outline'"
                  @click="toggleAllPersonnel"
                >{{ allPersonnelSelected ? '全部取消' : '全部選取' }}</v-btn>
              </div>
            </header>
           <v-row dense>
               <v-col
                 v-for="person in selectablePersonnel"
                 :key="person.id"
                 cols="6" sm="4" md="3"
               >
                 <v-checkbox
                   v-model="selectedPersonnelInDialog"
                   :label="person.name"
                   :value="person.id"
                   density="compact"
                   hide-details
                   color="primary"
                   @update:modelValue="logCheckboxChange"
                 ></v-checkbox>
                 </v-col>
             </v-row>
            <v-alert
              v-if="selectablePersonnel.length === 0"
              type="info"
              variant="tonal"
              density="compact"
              class="mt-1"
            >找不到可設定的人員。</v-alert>
          </fieldset>

          <fieldset class="settings-section color-section mt-4">
            <header class="settings-block__head">
              <v-icon class="settings-block__icon" color="primary">mdi-palette-outline</v-icon>
              <div class="settings-block__titles">
                <div class="settings-block__title">狀態顏色</div>
                <div class="settings-block__hint">自訂各接待狀態在看板上的顯示色</div>
              </div>
            </header>
            <v-row dense>
              <v-col
                v-for="(color, status) in tempStatusColors"
                :key="status"
                cols="12" sm="6"
              >
                <div class="color-row">
                  <span class="color-row__label">{{ statusMap[status] }}</span>
                  <v-menu
                    location="bottom start"
                    origin="top start"
                    :close-on-content-click="false"
                  >
                    <template v-slot:activator="{ props: menuProps }">
                      <button type="button" v-bind="menuProps" class="color-row__trigger">
                        <span
                          class="color-row__swatch"
                          :style="{ backgroundColor: tempStatusColors[status] }"
                        ></span>
                        <span class="color-row__hex">{{ tempStatusColors[status] }}</span>
                        <v-icon size="16" class="color-row__chev">mdi-chevron-down</v-icon>
                      </button>
                    </template>
                    <v-card flat>
                      <v-color-picker
                        v-model="tempStatusColors[status]"
                        hide-inputs
                        show-swatches
                        elevation="0"
                        mode="hex"
                      ></v-color-picker>
                    </v-card>
                  </v-menu>
                </div>
              </v-col>
            </v-row>
          </fieldset>

          <fieldset class="settings-section alert-section mt-4">
    <header class="settings-block__head">
      <v-icon class="settings-block__icon" color="primary">mdi-alarm-light-outline</v-icon>
      <div class="settings-block__titles">
        <div class="settings-block__title">警示設定</div>
        <div class="settings-block__hint">接待時間超過設定值時，於看板標示提醒（預設 120 分鐘）</div>
      </div>
    </header>
    <v-text-field
      v-model.number="tempAlertThresholdMinutes"
      label="接待逾時"
      type="number"
      variant="outlined"
      density="comfortable"
      suffix="分鐘"
      hide-details
      placeholder="120"
      prepend-inner-icon="mdi-timer-sand"
      class="settings-block__field"
    ></v-text-field>
  </fieldset>

          <fieldset class="settings-section screenshot-section mt-4">
            <header class="settings-block__head">
              <v-icon class="settings-block__icon" color="primary">mdi-camera-timer</v-icon>
              <div class="settings-block__titles">
                <div class="settings-block__title">自動截圖時段</div>
                <div class="settings-block__hint">以台灣時間 (Asia/Taipei) 為準，需有人開著本頁面才會截圖</div>
              </div>
              <v-spacer></v-spacer>
              <v-btn
                variant="tonal"
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                @click="addScreenshotTime"
              >新增時段</v-btn>
            </header>

            <v-row
              v-for="(t, idx) in tempScreenshotTimes"
              :key="idx"
              dense
              align="center"
              class="time-row"
            >
              <v-col cols="auto">
                <span class="time-row__index">{{ idx + 1 }}</span>
              </v-col>
              <v-col cols="7" sm="5">
                <v-text-field
                  v-model="tempScreenshotTimes[idx]"
                  type="time"
                  variant="outlined"
                  density="compact"
                  hide-details
                  prepend-inner-icon="mdi-clock-outline"
                ></v-text-field>
              </v-col>
              <v-col cols="auto">
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeScreenshotTime(idx)"
                ></v-btn>
              </v-col>
            </v-row>

            <v-btn
              v-if="tempScreenshotTimes.length > 0"
              variant="tonal"
              color="primary"
              size="small"
              prepend-icon="mdi-plus"
              block
              class="time-row__add mt-1"
              @click="addScreenshotTime"
            >新增時段</v-btn>

            <v-alert
              v-if="tempScreenshotTimes.length === 0"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-1"
            >目前未設定任何截圖時段，將不會自動截圖。</v-alert>

            <div v-if="sortedScreenshotPreview.length > 0" class="time-preview">
              <v-icon size="16" class="me-1">mdi-sort-clock-ascending-outline</v-icon>
              <span class="time-preview__label">儲存後生效順序：</span>
              <v-chip
                v-for="h in sortedScreenshotPreview"
                :key="h"
                size="x-small"
                variant="flat"
                color="primary"
                label
                class="me-1 mb-1"
              >{{ h }}</v-chip>
            </div>
          </fieldset>


        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="settings-dialog__footer">
           <v-btn
             variant="text"
             :disabled="isLoadingSettings"
             @click="closeSettingsDialog"
           >取消</v-btn>
           <v-spacer></v-spacer>
           <v-btn
             color="primary"
             variant="flat"
             prepend-icon="mdi-content-save-outline"
             @click="saveSettings"
             :disabled="isLoadingSettings"
             :loading="isLoadingSettings"
           >
             儲存設定
           </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<v-dialog v-model="showScreenshotBrowserDialog" max-width="900" scrollable persistent>      <v-card>
        <v-card-title class="text-h5">截圖歷史</v-card-title>
        
        <v-progress-linear
          :active="isLoadingScreenshots"
          indeterminate
          absolute
          top
          color="primary"
        ></v-progress-linear>

        <v-divider></v-divider>

        <v-card-text style="max-height: 70vh;">
          <div 
            v-if="!isLoadingScreenshots && screenshotHistory.length === 0" 
            class="text-center text-disabled pa-10"
          >
            尚無截圖紀錄
          </div>

          <v-row v-if="!isLoadingScreenshots" dense>
            <v-col
              v-for="item in screenshotHistory"
              :key="item.id"
              cols="12"
              sm="6"
              md="4"
            >
              <v-card border flat>
                <v-img
                  :src="item.imageUrl"
                  aspect-ratio="16/9"
                  cover
                  class="bg-grey-lighten-2"
                  @click="openLightbox(item.imageUrl)" style="cursor: pointer;" >
                  <template v-slot:placeholder>
                    <v-row
                      class="fill-height ma-0"
                      align="center"
                      justify="center"
                    >
                      <v-progress-circular
                        indeterminate
                        color="grey-lighten-5"
                      ></v-progress-circular>
                    </v-row>
                  </template>
                </v-img>

                <v-card-subtitle class="pt-3">
                  {{ formatScreenshotTimestamp(item.timestamp) }}
               </v-card-subtitle>
               
                        </v-card>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            variant="flat"
            @click="closeScreenshotBrowser"
            :disabled="isLoadingScreenshots"
          >
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<v-dialog 
      v-model="showLightbox" 
      max-width="90vw"
      max-height="95vh"
      @click:outside="closeLightbox"
      content-class="bg-transparent" 
      elevation="0"
      > <div style="position: relative;"> 
        <v-img
          :src="selectedImageUrl"
          contain
          max-height="90vh"
          max-width="90vw"
          class="elevation-4"
        ></v-img>

        <v-btn
          icon="mdi-close"
          variant="flat"
          color="white"
          
          @click="closeLightbox"
          style="position: absolute; top: -10px; right: -10px; z-index: 10;" 
          density="comfortable"
        ></v-btn>
      </div> </v-dialog>

      <v-dialog v-model="showProjectDialog" max-width="400px" persistent>
  <v-card class="pa-4">
    <v-card-title class="text-h5 font-weight-bold text-center">
      進入建案BY序
    </v-card-title>
    
    <v-card-text>
      <div class="text-center mb-4 d-flex flex-column align-center">
        
      </div>

      <v-form @submit.prevent="navigateToProject">
        <v-text-field
          v-model="inputProjectId"
          label="建案 ID"
          
          required
          variant="outlined"
          
          hide-details="auto"
          class="mb-4"
          autofocus
        />
        <v-btn 
          type="submit" 
          block 
          color="primary" 
          class="mt-2"
          :disabled="!inputProjectId"
        >
          前往
        </v-btn>
      </v-form>
    </v-card-text>
    
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="showProjectDialog = false">取消</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

      <v-snackbar
    v-model="showSnackbar"
    :timeout="3000"
    :color="snackbarColor"
    location="top right" 
    variant="elevated"
  >
    {{ snackbarMessage }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="showSnackbar = false"
        icon="mdi-close"
      >
      </v-btn>
    </template>
  </v-snackbar>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'; // 加入 watch
import { getDoc, doc, collection, getDocs } from "firebase/firestore"; // ✅ 修改此行
import { db } from '@/firebase'; // 確保 db 已從 firebase.js 匯出
import { useRoute,useRouter } from 'vue-router';
import { formatInTimeZone } from 'date-fns-tz';
import { formatDistanceToNowStrict } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import NameTag from '@/components/NameTag.vue';
import draggable from 'vuedraggable';
import { rtdb } from '@/firebase';
import { get, ref as dbRef, onValue, off, update, serverTimestamp as rtdbServerTimestamp } from "firebase/database";// ❌ 移除 vue-color-kit 相關 import
import html2canvas from 'html2canvas';
import { 
  fetchPotentialPersonnelAPI, 
  fetchStandbyConfigAPI, 
  saveStandbyConfigAPI, 
  logStandbyStatusChangeAPI,
  updateStandbyStatusAPI,
  updateStandbyBatchAPI,
  syncStandbyPersonnelAPI,
  saveStandbyScreenshotAPI,
  fetchStandbyScreenshotsAPI 


} from '@/api'; // 保持 API import
import { useUserStore } from '@/store/user';




const router = useRouter(); // 初始化 router

// [新增] 建案跳轉相關狀態
const showProjectDialog = ref(false);
const inputProjectId = ref('');

/**
 * [新增] 跳轉至指定建案的看板
 */
const navigateToProject = () => {
  if (!inputProjectId.value) return;
  
  const targetId = inputProjectId.value.trim();
  showProjectDialog.value = false;
  
  // 執行導航，前往該建案的 standby 頁面
  // 假設路由格式為 /standby/:projectId
  router.push(`/standby/${targetId}`);
  
  // 重置輸入值
  inputProjectId.value = '';
};
// --- Props ---
const props = defineProps({
  projectId: { type: String, required: true },
});
const userStore = useUserStore();

// --- Refs ---
const standbyPageRef = ref(null); // 新增：用於綁定截圖根元素
const isCapturing = ref(false); // 新增：用於截圖按鈕 loading 狀態
const showScreenshotBrowserDialog = ref(false);
const isLoadingScreenshots = ref(false);
const screenshotHistory = ref([]); // 存放從 API 獲取的截圖列表
const selectedImageUrl = ref(null); // (保持不變) 用於 Lightbox 顯示的圖片 URL
const showLightbox = ref(false); // 新增：控制 Lightbox Dialog 的開關
const projectName = ref(props.projectId);
const formattedTime = ref('');
const currentTime = ref(new Date());
const standbyPersonnel = ref([]);
const servingPersonnel = ref([]);
const isLoading = ref(true);
const showPersonnelDialog = ref(false);
const selectedPersonnel = ref(null);
const showSettingsDialog = ref(false);
const isAway = ref(false); // 用於 v-switch 的 v-model
const isRevisit = ref(false); // 新增 isRevisit ref
const isSavingStatus = ref(false); // 新增：用於控制按鈕 loading 狀態
// --- 自動截圖時段 ---
// 未設定過(欄位不存在)時的回退預設，維持舊有行為
const DEFAULT_SCREENSHOT_TIMES = ['09:00', '12:00', '15:00', '18:00', '20:00'];
const screenshotTimes = ref([]); // 實際生效時段 (台灣時間 "HH:mm")，供 updateClock 讀取
const tempScreenshotTimes = ref([]); // 設定對話框編輯用暫存
const lastTriggeredKey = ref(''); // 去重鍵：台灣時間 "yyyy-MM-dd HH:mm"，每個(日期,時段)只觸發一次
const showSnackbar = ref(false); // 新增：控制 Snackbar 顯示
const snackbarMessage = ref(''); // 新增：Snackbar 訊息內容
const snackbarColor = ref('success'); // 新增：Snackbar 顏色 (預設成功)


// --- 設定 Dialog Refs ---
const allAvailablePersonnel = ref([]);
const visiblePersonnelIds = ref([]);
const selectedPersonnelInDialog = ref([]); // 用於人員 v-checkbox 的 v-model
const statusColorsConfig = ref({
  standby: '#4CAF50', serving: '#03A9F4', revisit: '#F44336', away: '#9E9E9E',
});
const tempStatusColors = ref({});

const isLoadingSettings = ref(false);

const statusMap = {
  standby: '待命中',
  serving: '接待中',
  revisit: '回訪中',
  away: '休假中',
};

// --- 時鐘邏輯 ---
let clockInterval = null;
const updateClock = () => {
  currentTime.value = new Date();
  try {
    formattedTime.value = formatInTimeZone(
      currentTime.value, 'Asia/Taipei', 'yyyy年MM月dd日 EEEE ahh:mm:ss', { locale: zhTW }
    );
  } catch (error) {
    console.error("格式化時間錯誤:", error);
    formattedTime.value = '時間載入錯誤';
  }

  // --- 定時截圖觸發邏輯 (強制以台灣時間 Asia/Taipei 判斷) ---
  try {
    // 取得台灣時間的 "yyyy-MM-dd HH:mm"，不受瀏覽器本機時區影響
    const twKey = formatInTimeZone(currentTime.value, 'Asia/Taipei', 'yyyy-MM-dd HH:mm');
    const nowHHmm = twKey.slice(11); // "HH:mm"

    // 命中任一設定時段，且該「日期+時段」尚未觸發過 → 截圖一次
    if (screenshotTimes.value.includes(nowHHmm) && lastTriggeredKey.value !== twKey) {
      console.log(`[定時截圖] 台灣時間到達 ${nowHHmm}，觸發截圖。`);
      lastTriggeredKey.value = twKey; // 記錄已觸發；隔日同時段 key 不同可再次觸發
      captureAndSaveScreenshot(); // 不 await，讓它在背景執行
    }
  } catch (e) {
    console.error("[定時截圖] 檢查時間或觸發截圖時發生錯誤:", e);
  }
  // --- 定時截圖邏輯結束 ---
};

// [新增] 用 ref 來儲存分鐘數，並設定預設值 120
const alertThresholdMinutes = ref(120);

// [新增] 用 computed 來自動計算毫秒，供 shouldShowAlert 使用
const alertThresholdMs = computed(() => {
  const minutes = Number(alertThresholdMinutes.value) || 120; // 確保是數字
  return minutes * 60 * 1000;
});

// [新增] 獲取持續時間文字的輔助函數
const getDurationText = (person) => {
  if (!person || !person.currentStatusStartTime) return ''; // 返回空字串
  try {
    const startTime = new Date(person.currentStatusStartTime);
    // 專門計算並返回 "x 分鐘" 或 "x 小時" 這樣的字串
    return formatDistanceToNowStrict(startTime, { addSuffix: false, locale: zhTW });
  } catch (e) {
    console.error("計算持續時間錯誤:", e);
    return '計算錯誤'; // 出錯時返回
  }
};

// [修改] shouldShowAlert 函數，使用新的 computed 屬性
const shouldShowAlert = (person) => {
  if (person.status !== 'serving' || !person.currentStatusStartTime) {
    return false;
  }
  try {
    const startTime = new Date(person.currentStatusStartTime).getTime();
    const now = currentTime.value.getTime();
    const timeDiff = now - startTime;
    
    // [修改] 
    const result = timeDiff > alertThresholdMs.value; 

    return result;
  } catch (e) {
    return false;
  }
};

// [新增] 在 "設定 Dialog Refs" 區塊，加入一個 temp ref
const tempAlertThresholdMinutes = ref(120); // 新增

// --- 人員 Dialog 相關 ---
const selectedPersonnelOriginalStatus = ref(null);

const openPersonnelDialog = (person) => {
  selectedPersonnel.value = { ...person };
  selectedPersonnelOriginalStatus.value = person.status;
  isAway.value = person.status === 'away';
  isRevisit.value = person.status === 'revisit'; // 初始化 isRevisit
  showPersonnelDialog.value = true;
};
// 修改：關閉按鈕觸發儲存
const closePersonnelDialog = () => {
  savePersonnelStatusChange(); // 在關閉時觸發儲存邏輯
};

// 修改：Switch 改變時更新 selectedPersonnel.status
const handleAwaySwitchChange = () => {
  if (!selectedPersonnel.value) return;
  if (isAway.value) { // 如果要開啟休假
    isRevisit.value = false; // 關閉回訪
    selectedPersonnel.value.status = 'away';
  } else { // 如果要關閉休假
    selectedPersonnel.value.status = 'standby'; // 預設回到 standby
  }
};

/**
 * [新增] 處理回訪開關變更
 */
const handleRevisitSwitchChange = () => {
  if (!selectedPersonnel.value) return;
  if (isRevisit.value) { // 如果要開啟回訪
    isAway.value = false; // 關閉休假
    selectedPersonnel.value.status = 'revisit';
  } else { // 如果要關閉回訪
    selectedPersonnel.value.status = 'standby'; // 預設回到 standby
  }
};

const currentStatusDuration = computed(() => { /* ... (保持不變) ... */
  if (!selectedPersonnel.value || !selectedPersonnel.value.currentStatusStartTime) return '無法計算';
  try {
    const startTime = new Date(selectedPersonnel.value.currentStatusStartTime);
    return formatDistanceToNowStrict(startTime, { addSuffix: false, locale: zhTW });
  } catch (e) {
    console.error("計算持續時間錯誤:", e); return '計算錯誤';
  }
});

/**
 * [完整版] 儲存人員狀態變更 (休假/回訪切換) - 改為呼叫 API，包含除錯 Log 和 alert
 */
const savePersonnelStatusChange = () => {
  // 1. 狀態檢查 (如果狀態沒變，或沒有選中人員，則不執行任何操作並關閉 Dialog)
  if (!selectedPersonnel.value || selectedPersonnelOriginalStatus.value === selectedPersonnel.value.status) {
    console.log('[DEBUG savePersonnelStatusChange] Status not changed or no selected personnel. Closing dialog.');
    showPersonnelDialog.value = false;
    selectedPersonnel.value = null;
    selectedPersonnelOriginalStatus.value = null;
    return;
  }

  isSavingStatus.value = true; // 開始儲存，顯示 loading

  // 2. 準備更新所需的數據
  const personToUpdate = selectedPersonnel.value;
  const previousStatus = selectedPersonnelOriginalStatus.value;
  const newStatus = personToUpdate.status;
  // 在 API 呼叫前捕獲舊的開始時間，用於後續 Log 記錄
  const previousStartTimeForLog = personToUpdate.currentStatusStartTime;

  // 3. 準備要傳給 Cloud Function (updateStandbyStatusAPI) 的 updates 物件
  const updatesForAPI = {};
  updatesForAPI.status = newStatus;
  updatesForAPI.currentStatusStartTime = rtdbServerTimestamp(); // 使用 RTDB 的 Timestamp 標記

  // 如果從休假 (away) 狀態切換回來，預設放回 Stand By 區末尾
 if (previousStatus === 'away' && newStatus !== 'away') {
    // 明確設定 zone 回到 standby
    updatesForAPI.zone = 'standby';
    // ❗ 不再計算和設定 order，保留 RTDB 中該人員原有的 order 值
    // const currentStandbyCount = standbyPersonnel.value.length; // 移除
    // updatesForAPI.order = currentStandbyCount + 1; // 移除
    console.log(`[DEBUG savePersonnelStatusChange] Returning from 'away'. Setting zone to 'standby', keeping existing order.`);
  }
  // --- 修改點 END ---
  // 注意：如果切換到 'away'，zone 和 order 也不需要在這裡修改

  console.log('[DEBUG savePersonnelStatusChange] Calling updateStandbyStatusAPI with:', props.projectId, personToUpdate.id, updatesForAPI);
  let apiUpdatePromiseResolved = false; // 追蹤更新 API 是否結束
  let logApiPromiseResolved = false;    // 追蹤 Log API 是否結束

  // 4. 呼叫 API 執行狀態更新
  updateStandbyStatusAPI(props.projectId, personToUpdate.id, updatesForAPI)
    .then(result => {
      apiUpdatePromiseResolved = true; // 標記更新 API 完成
      console.log('[DEBUG savePersonnelStatusChange] API updateStandbyStatus successful:', result);
      if (result.status === 'success') {
        // 5. 狀態更新成功後，記錄 Log
        if (previousStartTimeForLog) {
          // 在 .then 內部重新建立 logData 物件
          const logData = {
            projectId: props.projectId,
            personnelId: personToUpdate.id,
            personnelName: personToUpdate.name, // 確保 personToUpdate 仍然有效
            previousStatus: previousStatus,     // 使用閉包捕獲的 previousStatus
            newStatus: newStatus,             // 使用閉包捕獲的 newStatus
            startTime: previousStartTimeForLog, // 使用先前捕獲的時間
            endTime: new Date().toISOString(),  // 記錄狀態結束時間 (客戶端時間)
            operator: userStore.user?.name || null // 可選：記錄操作者
          };
          console.log('[DEBUG savePersonnelStatusChange] Calling logStandbyStatusChangeAPI with:', logData); // 檢查 logData
          return logStandbyStatusChangeAPI(logData)
                   .then(logResult => { // 顯式處理 Log API 的 Promise
                       logApiPromiseResolved = true; // 標記 Log API 完成
                       console.log('[DEBUG savePersonnelStatusChange] logStandbyStatusChangeAPI successful:', logResult);
                   })
                   .catch(logError => { // 捕捉 Log API 的錯誤
                       logApiPromiseResolved = true; // 即使出錯也要標記完成
                       console.error('[DEBUG savePersonnelStatusChange] 記錄狀態變更失敗:', logError);
                       // 這裡可以選擇是否將錯誤往上拋，目前不影響 finally
                   });
        } else {
          logApiPromiseResolved = true; // 如果不需要 Log，直接標記完成
          console.log('[DEBUG savePersonnelStatusChange] previousStartTimeForLog was falsy, skipping log.'); // 增加 Log
        }
      } else {
        // API 回報錯誤
        apiUpdatePromiseResolved = true; // API 回報錯誤，也算完成
        logApiPromiseResolved = true;    // 不會執行 Log API，也算完成
        throw new Error(result.message || '更新狀態時後端回報錯誤');
      }
    })
    .catch(error => {
      // 6. 捕捉任何錯誤 (更新 API 或 Log API 拋出的)
      console.error('[DEBUG savePersonnelStatusChange] Error during status save or logging:', error);
      if (!apiUpdatePromiseResolved) apiUpdatePromiseResolved = true; // 確保標記完成
      if (!logApiPromiseResolved) logApiPromiseResolved = true;     // 確保標記完成
      alert(`儲存狀態失敗: ${error.message}`);
    })
    .finally(() => {
      // 7. 無論成功或失敗，最終都關閉 Dialog 並清除狀態
      console.log(`[DEBUG savePersonnelStatusChange] Entering finally block. API Update Resolved: ${apiUpdatePromiseResolved}, Log API Resolved: ${logApiPromiseResolved}`);
      showPersonnelDialog.value = false;
      selectedPersonnel.value = null;
      selectedPersonnelOriginalStatus.value = null;
      console.log('[DEBUG savePersonnelStatusChange] Dialog closed and state cleared.'); // 確認執行關閉
      
      isSavingStatus.value = false; // 操作完成，隱藏 loading
      
    });
}; // <-- savePersonnelStatusChange 函數結束

// --- 自動截圖時段：工具函數 ---
const HHMM_RE = /^([01]?\d|2[0-3]):([0-5]\d)$/;

// 由 config 解析出生效時段：
// - screenshotTimes 為合法陣列(含空陣列) → 直接採用 (空陣列代表不自動截圖)
// - 欄位不存在/非陣列 (舊資料) → 回退舊五時段，維持現行行為
const resolveScreenshotTimes = (config) => {
  if (config && Array.isArray(config.screenshotTimes)) {
    return normalizeScreenshotTimes(config.screenshotTimes);
  }
  return [...DEFAULT_SCREENSHOT_TIMES];
};

// 正規化：trim → 驗證 → 補零 HH:mm → 去重 → 升冪排序
const normalizeScreenshotTimes = (list) => {
  const set = new Set();
  for (const raw of (list || [])) {
    const m = HHMM_RE.exec(String(raw ?? '').trim());
    if (!m) continue;
    set.add(`${m[1].padStart(2, '0')}:${m[2]}`);
  }
  return Array.from(set).sort();
};

const addScreenshotTime = () => {
  tempScreenshotTimes.value.push('09:00');
};

const removeScreenshotTime = (idx) => {
  tempScreenshotTimes.value.splice(idx, 1);
};

// 儲存後實際生效的順序預覽（即時排序去重，僅供顯示）
const sortedScreenshotPreview = computed(() =>
  normalizeScreenshotTimes(tempScreenshotTimes.value)
);

// --- 看板設定：人員多選輔助 ---
const selectablePersonnel = computed(() =>
  allAvailablePersonnel.value.filter(
    p => p && p.roles && !p.roles.includes('超級管理員')
  )
);
const allPersonnelSelected = computed(() =>
  selectablePersonnel.value.length > 0 &&
  selectablePersonnel.value.every(p => selectedPersonnelInDialog.value.includes(p.id))
);
const toggleAllPersonnel = () => {
  selectedPersonnelInDialog.value = allPersonnelSelected.value
    ? []
    : selectablePersonnel.value.map(p => p.id);
};

// --- 設定 Dialog 相關 ---
const openSettingsDialog = async () => {
  isLoadingSettings.value = true;
  showSettingsDialog.value = true;
  try {
    // 1. (保持不變) 獲取人員、設定、角色
    const [personnelList, currentConfig, allUsersSnapshot] = await Promise.all([
      fetchPotentialPersonnelAPI(props.projectId),
      fetchStandbyConfigAPI(props.projectId),
      getDocs(collection(db, 'users'))
    ]);

    // 2. (保持不變) 建立角色映射表
    const userRolesMap = new Map();
    allUsersSnapshot.forEach(doc => {
      userRolesMap.set(doc.id, doc.data().roles || []);
    });

    // 3. (保持不變) 合併角色資訊
    const personnelWithRoles = personnelList.map(person => ({
      ...person,
      roles: userRolesMap.get(person.id) || []
    }));

    // ✅ 4. 【關鍵修改】
    // 在賦值給 allAvailablePersonnel 之前，先過濾掉超級管理員
    allAvailablePersonnel.value = personnelWithRoles.filter(
      person => person && person.roles && !person.roles.includes('超級管理員')
    );
    // ✅ 【修改結束】

    // 5. (保持不變) 後續邏輯使用已經過濾的 allAvailablePersonnel
    const loadedVisibleIds = currentConfig.visiblePersonnelIds || [];
    const availableIdsSet = new Set(allAvailablePersonnel.value.map(p => p.id));
    const initialSelectedIds = loadedVisibleIds.filter(id => availableIdsSet.has(id));
    selectedPersonnelInDialog.value = initialSelectedIds;

    // ... (後續的顏色和警示設定保持不變) ...
    if (currentConfig.colors && Object.keys(currentConfig.colors).length > 0) {
      statusColorsConfig.value = { ...statusColorsConfig.value, ...currentConfig.colors };
    }
    tempStatusColors.value = JSON.parse(JSON.stringify(statusColorsConfig.value));
    const loadedMinutes = currentConfig.alertThresholdMinutes;
    alertThresholdMinutes.value = (loadedMinutes && Number(loadedMinutes) > 0) ? Number(loadedMinutes) : 120;
    tempAlertThresholdMinutes.value = alertThresholdMinutes.value;

    // 自動截圖時段：以最新 config 為準，並同步編輯用暫存
    screenshotTimes.value = resolveScreenshotTimes(currentConfig);
    tempScreenshotTimes.value = [...screenshotTimes.value];

  } catch (error) {
    console.error("載入設定失敗:", error);
    alert(`載入設定失敗: ${error.message}`);
    closeSettingsDialog();
  }
  finally {
    isLoadingSettings.value = false;
  }
};

// [修改] saveSettings
const saveSettings = async () => {
  isLoadingSettings.value = true;
  try {
    // [修改] 組合一個完整的 config 物件來儲存
    // 驗證自動截圖時段：任一筆不合法（含未選時間的空白列）即中止儲存並提示
    const rawScreenshotTimes = tempScreenshotTimes.value.map(s => String(s ?? '').trim());
    const invalidTimes = rawScreenshotTimes.filter(s => !HHMM_RE.test(s));
    if (invalidTimes.length > 0) {
      alert('自動截圖時段格式不正確：每一列都必須選擇有效時間。');
      return; // finally 會重置 isLoadingSettings，對話框維持開啟讓使用者修正
    }
    const normalizedScreenshotTimes = normalizeScreenshotTimes(rawScreenshotTimes);

    const configToSave = {
      visiblePersonnelIds: selectedPersonnelInDialog.value,
      colors: tempStatusColors.value,
      // 確保值大於 0，否則使用預設 120
      alertThresholdMinutes: Number(tempAlertThresholdMinutes.value) > 0 ? Number(tempAlertThresholdMinutes.value) : 120,
      screenshotTimes: normalizedScreenshotTimes
    };
    
    console.log('[DEBUG saveSettings] 準備儲存的完整設定:', JSON.stringify(configToSave));

    // [修改] 呼叫 API，傳入 projectId 和完整的 config 物件
    // (這需要您使用我前一則訊息中修改過的 saveStandbyConfigAPI)
    const result = await saveStandbyConfigAPI(props.projectId, configToSave);

    if (result.status === 'success') {
      // [修改] 從儲存的物件更新本地狀態
      visiblePersonnelIds.value = configToSave.visiblePersonnelIds;
      statusColorsConfig.value = JSON.parse(JSON.stringify(configToSave.colors));
      alertThresholdMinutes.value = configToSave.alertThresholdMinutes; // 更新主 ref
      screenshotTimes.value = [...configToSave.screenshotTimes]; // 更新生效時段，立即套用

      closeSettingsDialog();

      // (保持不變) 調用同步函數
      await syncPersonnelToRTDB(configToSave.visiblePersonnelIds);

    } else {
      throw new Error(result.message || '儲存設定失敗');
    }
  } catch (error) {
    console.error("儲存設定失敗:", error);
    alert(`儲存設定失敗: ${error.message}`);
  } finally {
    isLoadingSettings.value = false;
  }
};

const closeSettingsDialog = () => { showSettingsDialog.value = false; };

// --- RTDB 監聽與資料處理 ---
let personnelRef = null;
let personnelListener = null;

// src/views/Standby.vue - setupRealtimeListener
const setupRealtimeListener = () => {
  isLoading.value = true;
  personnelRef = dbRef(rtdb, `/standby/${props.projectId}/personnel`);

  personnelListener = onValue(personnelRef, (snapshot) => {
    const data = snapshot.val();
    // Log 1: 打印從 RTDB 收到的原始資料
    console.log('[DEBUG] RTDB raw data received:', JSON.stringify(data));

    let allPersonnel = [];
    if (data) {
      allPersonnel = Object.entries(data).map(([id, person]) => ({ id, ...person }));
       // Log 2: 打印轉換後的完整人員陣列
       console.log('[DEBUG] Processed allPersonnel from RTDB:', JSON.stringify(allPersonnel));
    } else {
       console.log('[DEBUG] No data found in RTDB for this path.');
    }

    // Log 3: 打印用於過濾的可見人員 ID
    console.log('[DEBUG] Filtering using visiblePersonnelIds:', JSON.stringify(visiblePersonnelIds.value));

    // 過濾：只顯示在 visiblePersonnelIds 中的人員
    const filteredPersonnel = allPersonnel.filter(p => {
        const isVisible = visiblePersonnelIds.value.includes(p.id);
        return isVisible;
    });
    // Log 4: 打印根據 visiblePersonnelIds 過濾後的結果
    console.log('[DEBUG] Filtered personnel (by visibility):', JSON.stringify(filteredPersonnel));

    // 過濾與排序 (使用 filteredPersonnel)
    // 在賦值前先清空，以防萬一 (雖然理論上 v-model 應該會處理好)
    // standbyPersonnel.value = [];
    // servingPersonnel.value = [];

    const finalStandby = filteredPersonnel
      .filter(p => p.zone === 'standby')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    const finalServing = filteredPersonnel
      .filter(p => p.zone === 'serving')
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    // Log 5: 打印最終要賦值給 Stand By 區的陣列
    console.log('[DEBUG] Final standbyPersonnel to assign:', JSON.stringify(finalStandby));
    // Log 6: 打印最終要賦值給 接待區 的陣列
    console.log('[DEBUG] Final servingPersonnel to assign:', JSON.stringify(finalServing));

    standbyPersonnel.value = finalStandby;
    servingPersonnel.value = finalServing;

    isLoading.value = false;
  }, (error) => {
     console.error("Firebase RTDB 監聽錯誤:", error);
     isLoading.value = false;
  });
};

const stopRealtimeListener = () => { /* ... (保持不變) ... */
  if (personnelRef && personnelListener) { off(personnelRef, 'value', personnelListener); console.log('RTDB listener stopped.'); }
};

// [再次修改] 拖曳結束處理 (修正 movedItem 獲取方式)
const handleDragEnd = (event) => {
    // 從事件物件中解構所需屬性
    const { oldIndex, newIndex, from, to } = event;

    // 判斷來源和目標區域 (保持不變)
    const sourceZoneCol = from.closest('.standby-zone-col') || from.closest('.serving-zone-col');
    const targetZoneCol = to.closest('.standby-zone-col') || to.closest('.serving-zone-col');
    const sourceZone = sourceZoneCol?.classList.contains('standby-zone-col') ? 'standby' : 'serving';
    const targetZone = targetZoneCol?.classList.contains('standby-zone-col') ? 'standby' : 'serving';

    // 如果只是在同一區域內點擊或移動後放回原位，則不處理
    if (from === to && oldIndex === newIndex) {
        console.log('Item position effectively unchanged.');
        return; // ✓ 修改：使用 from === to 判斷更準確
    }

    // 修改 movedItem 的獲取方式：
    // 假設 v-model 已經更新了目標列表 (standbyPersonnel 或 servingPersonnel)
    // 我們從 *目標* 列表的 *新索引* (newIndex) 去取得被移動的項目
    const targetList = (targetZone === 'standby') ? standbyPersonnel.value : servingPersonnel.value;
    const movedItem = targetList[newIndex]; // <--- 主要修改處

    // 增強檢查：確認 movedItem 是否成功獲取，並且看起來是正確的物件
    if (!movedItem || typeof movedItem !== 'object' || !movedItem.id || !movedItem.name) {
        console.error(
            `無法獲取拖曳項目或項目資料不正確 at newIndex ${newIndex} in target zone ${targetZone}.`,
            'MovedItem:', movedItem,
            'TargetList:', JSON.parse(JSON.stringify(targetList)), // Log 列表內容
            'Event:', event
        );
        // 增加對 sourceList 和 oldIndex 的 Log，輔助判斷
        const sourceList = (sourceZone === 'standby') ? standbyPersonnel.value : servingPersonnel.value;
         console.error(
             `Source zone was ${sourceZone}, oldIndex was ${oldIndex}.`,
             'SourceList (might be already updated):', JSON.parse(JSON.stringify(sourceList))
         );
        alert('處理拖曳操作時發生錯誤，無法識別移動的項目，請重新整理頁面。'); // ✓ 提示使用者
        return;
    }

    // --- 後續邏輯保持不變 ---
    console.log(`Item "${movedItem.name}" (ID: ${movedItem.id}) moved from ${sourceZone} zone (index ${oldIndex}) to ${targetZone} zone (index ${newIndex}).`);

    // 1. 準備 allUpdates 物件
    const allUpdates = {};
    let statusChanged = false;
    let previousStatus = movedItem.status; // ❗ 注意：這裡的 movedItem 是目標列表中的，狀態可能已被 v-model 更新？(需要驗證)
    let newStatus = movedItem.status;
    let previousStatusStartTime = movedItem.currentStatusStartTime; // ❗ 同上

    // 更新被移動項目的 zone, status, startTime (如果跨區)
    allUpdates[`${movedItem.id}/zone`] = targetZone;
    if (sourceZone !== targetZone) {
        // ❗ 重新計算 newStatus，不依賴可能已更新的 movedItem.status
        newStatus = (targetZone === 'standby') ? 'standby' : 'serving';
        allUpdates[`${movedItem.id}/status`] = newStatus;
        allUpdates[`${movedItem.id}/currentStatusStartTime`] = rtdbServerTimestamp();
        statusChanged = true;
        console.log(`Status changed for ${movedItem.name} to ${newStatus}`);
         // ❗ 重新獲取 previousStatus 和 previousStatusStartTime，需要從原始事件或拖曳前狀態獲取
         //    簡化處理：假設拖曳發生很快，我們直接用 RTDB 中讀到的 movedItem 初始狀態
         //    (更精確的方式需要在拖曳開始時記錄狀態)
         // previousStatus = ... (需要找到拖曳前的狀態)
         // previousStatusStartTime = ... (需要找到拖曳前的開始時間)
         // 暫時維持原樣，但 Log 可能不準確
    }


    // 2. 更新目標區域所有項目的 order (使用拖曳後 v-model 的最新狀態)
    console.log(`Target list (${targetZone}) for order update:`, JSON.stringify(targetList.map(p=>p.id))); // Log IDs for clarity
    targetList.forEach((person, index) => {
        allUpdates[`${person.id}/order`] = index + 1;
        console.log(`  - Setting order for ${person.id} to ${index + 1}`);
    });

    // 3. 如果是跨區移動，更新來源區域剩下項目的 order
    if (sourceZone !== targetZone) {
        const sourceList = (sourceZone === 'standby') ? standbyPersonnel.value : servingPersonnel.value;
        console.log(`Source list (${sourceZone}) for order update (after move):`, JSON.stringify(sourceList.map(p=>p.id)));
        sourceList.forEach((person, index) => {
            if (person.id !== movedItem.id) { // 確保來源列表的 order 是正確的 (從 1 開始)
               allUpdates[`${person.id}/order`] = index + 1;
               console.log(`  - Setting order for ${person.id} in source list to ${index + 1}`);
            }
        });
        // ❗ 如果來源列表為空，需要確保沒有留下舊的 order 值 (雖然 update 應該會覆蓋)
    }

    console.log('[handleDragEnd] Final updates object prepared for API:', allUpdates);

    // 4. 呼叫新的批次更新 API (保持不變)
    updateStandbyBatchAPI(props.projectId, allUpdates)
        .then(result => {
             if (result.status === 'success') {
                console.log('[handleDragEnd] API updateStandbyBatch successful.');
                if (statusChanged && previousStatusStartTime) {
                    const logData = { projectId: props.projectId, personnelId: movedItem.id, personnelName: movedItem.name, previousStatus: previousStatus, newStatus: newStatus, startTime: previousStatusStartTime, endTime: new Date().toISOString(), operator: userStore.user?.name || null };
                    console.log('[handleDragEnd] Calling logStandbyStatusChangeAPI after drag:', logData);
                    logStandbyStatusChangeAPI(logData).catch(logError => { console.error('[handleDragEnd] Error logging status change after drag:', logError); });
                }
             } else {
                throw new Error(result.message || '批次更新看板狀態時後端回報錯誤');
             }
        })
        .catch(error => {
            console.error('[handleDragEnd] Error processing drag end:', error);
            alert(`更新狀態失敗: ${error.message}`);
        });
};

// --- 輔助函式 ---
const getColorForStatus = (status) => {
  return statusColorsConfig.value[status] || '#BDBDBD';
};

/**
 * [最終完整版 + 移除偵錯 Log] 同步 Firestore 設定中的可見人員到 RTDB (新增不存在的，移除多餘的)
 * @param {Array<string>} savedVisibleIds - 剛剛儲存到 Firestore 的、應該顯示的人員 ID 列表
 */
const syncPersonnelToRTDB = async (savedVisibleIds) => {
  const functionName = '[Sync RTDB]'; // For logging clarity
  if (!savedVisibleIds) {
    console.log(`${functionName} No visible personnel IDs provided. Skipping sync.`);
    return; // savedVisibleIds 可能是 null 或 undefined
  }
  // 確保 savedVisibleIds 是純陣列 (以防 Proxy 問題)，再建立 Set
  const savedVisibleIdsArray = Array.from(savedVisibleIds);
  const savedVisibleIdsSet = new Set(savedVisibleIdsArray);
  console.log(`${functionName} Starting sync. Target visible IDs (Array):`, savedVisibleIdsArray); // Log 純陣列

  try {
    const personnelRTDBRef = dbRef(rtdb, `/standby/${props.projectId}/personnel`);
    // 1. 一次性讀取 RTDB 當前數據
    const snapshot = await get(personnelRTDBRef);
    const existingPersonnelData = snapshot.val() || {};
    const existingIds = Object.keys(existingPersonnelData);
    const existingIdsSet = new Set(existingIds);
    console.log(`${functionName} Existing personnel IDs in RTDB:`, existingIds);

    const batchUpdates = {};
    let addedCount = 0;
    let removedCount = 0;
    // 修正 order 計算：基於 RTDB 現有數量 + 本次淨增加數量
    //    先計算移除數量，以便後續計算 order
    existingIds.forEach(id => {
        if (!savedVisibleIdsSet.has(String(id))) {
            removedCount++;
        }
    });
    // const currentStandbyCount = standbyPersonnel.value.length; // 不再使用前端列表長度

    // --- 2. 找出需要新增的人員 ---
    console.log(`${functionName} Checking for personnel to add...`);
    for (const idToAdd of savedVisibleIdsArray) { // 使用純陣列遍歷
      const idToAddString = String(idToAdd); // 確保是字串
      if (!existingIdsSet.has(idToAddString)) {
        console.log(`${functionName} Personnel ID ${idToAddString} needs to be added.`);
        // 從 allAvailablePersonnel 查找姓名 (假設 Dialog 開啟時已載入)
        const personInfo = allAvailablePersonnel.value.find(p => String(p.id) === idToAddString); // 確保比較的是字串
        if (personInfo && personInfo.name) {
          console.log(`${functionName} Found name "${personInfo.name}". Preparing default data.`);
          const defaultData = {
            name: personInfo.name,
            status: 'standby', // 預設狀態
            zone: 'standby',   // 預設區域
            // 修正 order 計算：基於 RTDB 現有數量 - 已移除數量 + 已新增數量 + 1
            order: existingIds.length - removedCount + addedCount + 1,
            currentStatusStartTime: rtdbServerTimestamp() // 使用標記
          };
          batchUpdates[idToAddString] = defaultData; // 使用字串 ID
          addedCount++;
        } else {
          console.warn(`${functionName} Could not find name for ID ${idToAddString}. Skipping add.`);
        }
      }
    }
    console.log(`${functionName} Finished checking for additions. Total marked for addition: ${addedCount}`);
    // --- 新增邏輯結束 ---

    // --- 3. 找出需要移除的人員 ---
    console.log(`${functionName} Checking for personnel to remove...`);
    removedCount = 0; // 重新計算移除數量
    for (const idToRemove of existingIds) { // 遍歷 RTDB 中現有的 ID
      const idToRemoveString = String(idToRemove); // 確保是字串
      if (!savedVisibleIdsSet.has(idToRemoveString)) { // 使用確保是字串的 ID 進行判斷
        console.log(`${functionName} --> Identified for removal: ${idToRemoveString}`);
        batchUpdates[idToRemoveString] = null; // 標記為 null 以進行刪除
        removedCount++; // 在這裡累加移除計數
      }
    }
    console.log(`${functionName} Finished checking for removals. Total marked for removal: ${removedCount}`);
    // --- 移除邏輯結束 ---

    // --- 4. API 呼叫 (保持不變) ---
    if (Object.keys(batchUpdates).length > 0) {
      console.log(`${functionName} Applying batch updates to RTDB (Adds: ${addedCount}, Removes: ${removedCount}):`, JSON.stringify(batchUpdates));
      const result = await updateStandbyBatchAPI(props.projectId, batchUpdates);
      if (result.status === 'success') {
         console.log(`${functionName} API batch update successful.`);
      } else {
         console.warn(`${functionName} API batch update warning/error: ${result.message}`);
         alert(`同步部分人員狀態時出現問題: ${result.message}`);
      }
    } else {
      console.log(`${functionName} No personnel changes needed in RTDB.`);
    }

  } catch (error) {
    console.error(`${functionName} Error syncing personnel via API:`, error);
    alert(`同步人員狀態到看板時發生錯誤: ${error.message}`);
  }
};

/**
 * [新增] 截圖並儲存
 */
const captureAndSaveScreenshot = async () => {
  if (isCapturing.value) return; // 防止重複點擊
  isCapturing.value = true;
  console.log('[Capture] 開始截圖...');

 // --- 修改點 START ---
  // 由於 standbyPageRef 綁定在 Vuetify 組件上，我們需要 .value.$el 來獲取真實的 DOM 元素
  const elementToCapture = standbyPageRef.value?.$el; 
  
  if (!elementToCapture) {
    console.error('[Capture] 找不到截圖目標 DOM 元素 (standbyPageRef.$el)。 Component Ref:', standbyPageRef.value);
    alert('截圖失敗：找不到目標 DOM 元素。');
    isCapturing.value = false;
    return;
  }
  // 增加檢查，確認元素是否真的在 Document 中 (對應錯誤訊息)
  if (!document.body.contains(elementToCapture)) {
     console.error('[Capture] 截圖目標 DOM 元素已不在文件中。');
     alert('截圖失敗：Element is not attached to a Document');
     isCapturing.value = false;
     return;
  }


  try {
    // 1. 執行截圖
    const canvas = await html2canvas(elementToCapture, {
      useCORS: true, // 允許跨域圖片 (如果有的話)
      allowTaint: true,
      logging: false, // 關閉 html2canvas 的詳細日誌
    });
    
    // 2. 獲取 Base64 資料
    const dataUrl = canvas.toDataURL('image/png');
    const imageData = dataUrl.split(',')[1]; // API 需要純 Base64 字串
    
    if (!imageData) {
      throw new Error('無法從 Canvas 獲取圖片資料。');
    }

    // 3. 準備 Payload
    // 格式化為 'YYYYMMDDHHMMSS'
    const timestampStr = formatInTimeZone(currentTime.value, 'Asia/Taipei', 'yyyyMMddHHmmss');
    const operatorName = userStore.user?.name || 'Unknown Operator';

    const payload = {
      projectId: props.projectId,
      timestampStr: timestampStr,
      operatorName: operatorName,
      imageData: imageData
    };
    
    console.log(`[Capture] 截圖完成。準備上傳 (Operator: ${operatorName}, Time: ${timestampStr})`);

    // 4. 呼叫 API
    const result = await saveStandbyScreenshotAPI(payload);

if (result.status === 'success') {
      console.log('[Capture] API 儲存成功:', result.message);
      // alert('截圖已成功儲存。'); // 移除 alert
      // 使用 Snackbar 顯示成功訊息
      snackbarMessage.value = '截圖已成功儲存。';
      snackbarColor.value = 'success';
      showSnackbar.value = true;
    } else {
      throw new Error(result.message || '後端儲存截圖時回報錯誤');
    }

  } catch (error) {
    console.error('[Capture] 截圖或上傳時發生錯誤:', error);
    // alert(`截圖失敗：${error.message}`); // 移除 alert
    // 使用 Snackbar 顯示錯誤訊息
    snackbarMessage.value = `截圖失敗：${error.message}`;
    snackbarColor.value = 'error';
    showSnackbar.value = true;
  } finally {
    isCapturing.value = false;
  }
};
/**
 * [新增] 格式化截圖時間戳 (ISO -> 台灣本地時間)
 */
const formatScreenshotTimestamp = (isoString) => {
  if (!isoString) return '時間未知';
  try {
    const date = new Date(isoString);
    // 使用已導入的 formatInTimeZone
    return formatInTimeZone(date, 'Asia/Taipei', 'yyyy/MM/dd HH:mm', { locale: zhTW });
  } catch (error) {
    console.error("格式化時間戳錯誤:", error);
    return '無效日期';
  }
};

/**
 * [新增] 打開截圖瀏覽 Dialog
 */
const openScreenshotBrowser = async () => {
  showScreenshotBrowserDialog.value = true;
  isLoadingScreenshots.value = true;
  screenshotHistory.value = []; // 清空上次紀錄

  try {
    // 呼叫 API
    const screenshots = await fetchStandbyScreenshotsAPI(props.projectId);
    screenshotHistory.value = screenshots;
    console.log(`[Screenshot Browser] 成功載入 ${screenshots.length} 筆紀錄。`);

  } catch (error) {
    console.error('[Screenshot Browser] 載入截圖歷史失敗:', error);
    alert(`載入截圖歷史失敗：${error.message}`);
  } finally {
    isLoadingScreenshots.value = false;
  }
};

/**
 * [修改] 關閉截圖瀏覽 Dialog
 */
const closeScreenshotBrowser = () => {
  showScreenshotBrowserDialog.value = false;
  screenshotHistory.value = []; 
  closeLightbox(); // 確保關閉主 Dialog 時，Lightbox 也會關閉
};

/**
 * [新增] 打開 Lightbox 顯示大圖
 */
const openLightbox = (url) => {
  selectedImageUrl.value = url; // 設置圖片 URL
  showLightbox.value = true;    // 打開 Dialog
};
/**
 * [新增] 關閉 Lightbox
 */
const closeLightbox = () => {
  showLightbox.value = false;   // 關閉 Dialog
  // 可以在 Dialog 關閉動畫後再清除 URL，避免圖片閃爍
  setTimeout(() => {
    selectedImageUrl.value = null; 
  }, 300); // 延遲 300ms
};

// ✅ [新增] 定義禁用右鍵/長按選單的函式
const preventContextMenu = (event) => {
  // 這裡可以加判斷，例如只針對 .drag-handle 禁用，
  // 但為了操作順暢，建議在這個頁面全面禁用。
  if (event.cancelable) {
    event.preventDefault();
  }
};


// --- Lifecycle Hooks ---
onMounted(async () => {
  console.log(`Standby page mounted for projectId: ${props.projectId}`);
  
  // ✅ [新增] 在整個文件上禁用右鍵/長按選單
  document.addEventListener('contextmenu', preventContextMenu, { passive: false });
  
  updateClock(); // 更新時鐘
  clockInterval = setInterval(updateClock, 1000); // 設定時鐘定時器

  isLoading.value = true; // 開始載入
  try {
    // 平行獲取看板設定和專案名稱
    const [currentConfig, projectDocSnap] = await Promise.all([
      fetchStandbyConfigAPI(props.projectId), // 獲取看板設定
      getDoc(doc(db, 'projects', props.projectId)) // 獲取專案文件
    ]);

    // ✅ [修改] 處理看板設定
    visiblePersonnelIds.value = currentConfig.visiblePersonnelIds || [];
    if (currentConfig.colors && Object.keys(currentConfig.colors).length > 0) {
      statusColorsConfig.value = { ...statusColorsConfig.value, ...currentConfig.colors };
    }
    
    // ✅ [新增] 在 onMounted 時就載入正確的分鐘數
    const loadedMinutes = currentConfig.alertThresholdMinutes;
    alertThresholdMinutes.value = (loadedMinutes && Number(loadedMinutes) > 0) ? Number(loadedMinutes) : 120;

    // ✅ [新增] 載入自動截圖時段 (舊資料無此欄位 → 回退舊五時段)
    screenshotTimes.value = resolveScreenshotTimes(currentConfig);
    console.log('[onMounted] 自動截圖時段:', JSON.stringify(screenshotTimes.value));

    console.log('Loaded visiblePersonnelIds from Firestore:', visiblePersonnelIds.value);
    console.log(`[onMounted] Alert threshold set to: ${alertThresholdMinutes.value} minutes`); // ✅ 新增 Log


    // ✅ 處理專案名稱 (保持不變)
    if (projectDocSnap.exists()) {
      const projectData = projectDocSnap.data();
      if (projectData.name) {
        projectName.value = projectData.name; 
        console.log(`Project name set to: ${projectName.value}`);
      } else {
        console.warn(`Project document for ${props.projectId} exists but has no 'name' field.`);
      }
    } else {
      console.warn(`Project document with ID ${props.projectId} not found.`);
    }

  } catch (error) {
    console.error("載入初始設定或專案名稱失敗:", error);
    projectName.value = props.projectId;
  } finally {
    // 在所有初始資料載入完成後 (或失敗後)，啟動 RTDB 監聽
    setupRealtimeListener();
    // isLoading.value 會在 setupRealtimeListener 內部根據 RTDB 狀態設為 false
  }
});

onUnmounted(() => {
  if (clockInterval) clearInterval(clockInterval); 
  stopRealtimeListener();

  // ✅ [新增] 移除監聽器，恢復瀏覽器預設行為 (避免影響其他頁面)
  document.removeEventListener('contextmenu', preventContextMenu);
});
</script>

<style scoped>
/* 整體頁面 */
.standby-page { /* 在這裡加入或修改 */
  background-color: #f5f5f7; /* 設定背景顏色 */
  /* 其他可能已存在的樣式 */
}



/* 新增：Toolbar 樣式 */
.page-toolbar {
  border-bottom: 1px solid #dee2e6;
}

/* 標頭 (page-header class 已移除) */

.clock {
  font-family: 'Courier New', Courier, monospace;
}
.page-header {
  border-bottom: 1px solid #dee2e6;
}
.clock {
  font-family: 'Courier New', Courier, monospace;
}

/* 內容區域 */
.content-area {
  flex-grow: 1; /* 讓內容區域填滿剩餘高度 */
}

/* Stand By 區域 */


/* 接待區 */
.serving-zone-col {
  display: flex; /* 讓 v-sheet 填滿 */
}
.serving-zone-sheet {
  border: 2px dashed #ced4da;
  background-color: #bdbdbd;
  width: 100%; /* 確保填滿 v-col */
}

/* 通用區域樣式 */
.zone-title {
  font-size: 1.1rem; /* 稍小標題 */
}

.placeholder {
  width: 100%;
}

/* 拖曳樣式 */
.ghost {
  opacity: 0.4;
  background: #c8ebfb;
  border: 1px dashed #03A9F4;
  border-radius: 8px; /* 配合 NameTag 圓角 */
}

/* 新增：禁止 name-tag-container 中的所有子元件 (NameTag) 選取文字 */
.name-tag-container > * {
  user-select: none;
  -webkit-user-select: none; /* Safari */
  -moz-user-select: none;    /* Firefox */
  -ms-user-select: none;     /* IE */
}

/* 新增： "按下" (chosen) 時的樣式，在 delay 期間顯示 */
:deep(.item-chosen) { /* 改用 :deep() 確保穿透子元件 */
  transform: scale(1.08) !important; 
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3) !important; 
  cursor: grabbing !important; 
  /* 保持 transition，並也加上 !important 確保覆蓋子元件 */
  transition: transform 0.1s ease-out, box-shadow 0.1s ease-out !important; 
  z-index: 999; 
}

/* 核心優化：加強 .dragging 樣式... */
:deep(.dragging) { /* 改用 :deep() 確保穿透子元件 */
  transform: scale(1.08) !important; /* 您的 1.08 
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5) !important; 
  z-index: 1000; 

  /* 關鍵修復：
     在拖曳過程中，強制禁用所有 transition 動畫。
     這會防止子元件試圖 "動畫" 回 scale(1.0) 的狀態。
  */
  transition: none !important; 

  /* 游標/觸控樣式 */
  cursor: grabbing !important;
  
  /* 禁用瀏覽器預設的觸控/選擇高亮 */
  -webkit-user-select: none;
  -moz-user-select: none;   
  -ms-user-select: none;    
  user-select: none; 
  -webkit-touch-callout: none;
}
/* 人員 Dialog Switch */
.v-switch {
  justify-content: flex-start; /* 讓 label 在左邊 */
}

/* ===== 看板設定對話框 ===== */
.settings-dialog__card {
  overflow: hidden;
}
.settings-dialog__bar {
  display: flex;
  align-items: center;
  padding: 14px 12px 14px 20px;
}
.settings-dialog__body {
  max-height: 64vh;
  padding: 20px 20px 12px;
  background: rgba(var(--v-theme-on-surface), 0.015);
}
.settings-dialog__footer {
  padding: 12px 20px;
}

/* 區塊卡片 */
.settings-section {
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 14px;
  padding: 16px 18px;
  margin: 0 0 16px;
  background: rgb(var(--v-theme-surface));
}
.settings-section:last-child {
  margin-bottom: 4px;
}
.settings-section.mt-4 {
  margin-top: 0 !important;
}

/* 區塊標題列 */
.settings-block__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}
.settings-block__icon {
  margin-top: 2px;
  flex-shrink: 0;
}
.settings-block__titles {
  min-width: 0;
}
.settings-block__title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}
.settings-block__hint {
  font-size: 0.78rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 3px;
  line-height: 1.4;
}
.settings-block__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.settings-block__field {
  max-width: 260px;
}

/* 狀態顏色列 */
.color-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 5px 0;
}
.color-row__label {
  width: 60px;
  flex-shrink: 0;
  font-size: 0.9rem;
  font-weight: 600;
}
.color-row__trigger {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.2);
  border-radius: 9px;
  background: rgb(var(--v-theme-surface));
  cursor: pointer;
  transition: border-color .15s ease, box-shadow .15s ease;
}
.color-row__trigger:hover {
  border-color: rgba(var(--v-theme-primary), 0.65);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}
.color-row__swatch {
  width: 28px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}
.color-row__hex {
  font-family: ui-monospace, "SFMono-Regular", Menlo, monospace;
  font-size: 0.8rem;
  letter-spacing: .5px;
  text-transform: uppercase;
}
.color-row__chev {
  opacity: .5;
}

/* 截圖時段列 */
.time-row {
  margin-bottom: 6px;
}
.time-row__add {
  border: 1px dashed rgba(var(--v-theme-primary), 0.45);
}
.time-row__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(var(--v-theme-primary), 0.12);
  color: rgb(var(--v-theme-primary));
  font-size: 0.78rem;
  font-weight: 700;
}
.time-preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed rgba(var(--v-theme-on-surface), 0.14);
  color: rgba(var(--v-theme-on-surface), 0.6);
}
.time-preview__label {
  font-size: 0.78rem;
  margin-right: 8px;
}

/* 對話框內容捲軸 */
.settings-dialog__body::-webkit-scrollbar {
  width: 8px;
}
.settings-dialog__body::-webkit-scrollbar-thumb {
  background: rgba(var(--v-theme-on-surface), 0.22);
  border-radius: 4px;
}
.settings-dialog__body::-webkit-scrollbar-track {
  background: transparent;
}


.outer-content-row {
  padding-top: 20px; 
  /* max-width: 1000px; */ /* 您舊的註解 */
  max-width: 1400px; /* 將 1000px 調整為更大的數值，例如 1400px (您已修改) */
  width: 100%; 

  /* --- 以下為新增的凍結/滾動核心樣式 --- */
  overflow-y: auto; /* 內容過多時，啟用垂直滾動條 */
  min-height: 0;    /* flexbox 佈局中防止內容撐開容器的關鍵 */
  flex-shrink: 1;   /* 確保此元素可以被壓縮 (配合 min-height: 0) */
  /* flex-grow: 1; (您已在 <template> 中加入，所以 CSS 不需重複) */
}

/* [新增] 閃爍動畫 Keyframes */
@keyframes flash {
  0%, 100% {
    opacity: 1;
    transform: translateX(-50%) scale(1); /* 原始狀態 */
  }
  50% {
    opacity: 0.2; /* 閃爍效果 */
    transform: translateX(-50%) scale(1); /* 輕微縮小 */
  }
}

/* 震動動畫 Keyframes (來自上一回合) */
@keyframes vibrate {
  0%, 100% {
    transform: translateX(0);
  }
  10%, 30%, 50%, 70%, 90% {
    transform: translateX(-2px);
  }
  20%, 40%, 60%, 80% {
    transform: translateX(2px);
  }
}

/* [修改] 應用震動與閃爍文字的 Class */
.vibrating-alert {
  /* 1. 震動 (來自上一回合) */
  animation: vibrate 1s linear infinite;
  
  /* 2. 視覺提示 (來自上一回合) */
  border: 2px solid #D32F2F; 
  box-shadow: 0 0 30px rgba(211, 47, 47, 0.7); 

  /* 3. [新增] 設定相對定位，讓 ::after 可以定位 */
  position: relative; 
  /* 確保偽元素不會被遮擋 */
  overflow: visible; 
}

/* [修改] 偽元素使用 attr() 讀取動態內容 */
.vibrating-alert::after {
  /* 使用 'attr(data-duration-text)' 來讀取我們綁定的屬性值。
    我們將 "已逾時: " 作為靜態前綴。
  */
  content: '已接待: ' attr(data-duration-text); 
  
  /* --- (以下樣式保持不變) --- */
  position: absolute;
  bottom: -20px; 
  left: 50%;
  transform: translateX(-50%);
  
  background-color: #D32F2F; 
  color: white; 
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.75em; 
  font-weight: bold;
  white-space: nowrap; 
  
  animation: flash 1s linear infinite; 
  
  z-index: 10; 
  pointer-events: none; 
}

/* 確保對話框內的 App Icon 樣式正確 */
.app-icon {
  width: 80px;
  height: 80px;
  border-radius: 20%; 
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

/* 如果要套用 Login.vue 的玻璃質感卡片樣式 */
:deep(.v-dialog .v-card) {
  border-radius: 20px !important;
}

</style>