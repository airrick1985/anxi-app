<template>
  <div class="custom-form-manager">
    <v-row>
      <v-col cols="12" class="d-flex justify-space-between align-center">
        <div>
          <h2 class="text-h5 text-primary">自訂表單管理</h2>
          <p class="text-subtitle-2 text-grey-darken-1">設計與管理此建案的公開表單 (無需登入即可瀏覽)</p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openFormEditor()"
        >
          新增表單
        </v-btn>
      </v-col>
    </v-row>
    <v-divider class="my-4"></v-divider>

    <!-- Form List -->
    <v-row v-if="loading">
      <v-col cols="12" md="4" v-for="n in 3" :key="n">
        <v-skeleton-loader type="card"></v-skeleton-loader>
      </v-col>
    </v-row>
    
    <v-row v-else-if="forms.length > 0">
      <v-col cols="12" md="6" lg="4" v-for="form in forms" :key="form.id">
        <v-card variant="outlined" class="h-100 d-flex flex-column">
          <v-card-title class="d-flex justify-space-between align-start">
            <div class="text-truncate mr-2">{{ form.title }}</div>
            <v-chip size="x-small" :color="form.isActive ? 'success' : 'grey'">
              {{ form.isActive ? '啟用中' : '草稿' }}
            </v-chip>
          </v-card-title>
          <v-card-text class="flex-grow-1">
            <div class="text-caption text-grey mb-2">
              建立於: {{ formatDate(form.createdAt) }}
            </div>
            <div class="text-body-2 text-truncate-2">
              {{ form.description || '無描述' }}
            </div>
            <div class="mt-2">
              <v-chip size="small" variant="outlined" class="mr-1">
                {{ form.fields?.length || 0 }} 個欄位
              </v-chip>
            </div>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-btn
              variant="text"
              color="primary"
              prepend-icon="mdi-share-variant"
              @click="openShareDialog(form)"
            >
              分享
            </v-btn>
            <v-btn
              variant="text"
              color="teal"
              prepend-icon="mdi-format-list-bulleted"
              @click="openResponses(form)"
            >
              回覆
            </v-btn>
            <v-btn
              variant="text"
              color="green-darken-1"
              prepend-icon="mdi-google-spreadsheet"
              @click="openSyncDialog(form)"
              size="small"
            >
              同步
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              variant="text"
              color="grey-darken-2"
              icon="mdi-pencil"
              size="small"
              @click="openFormEditor(form)"
            ></v-btn>
            <v-btn
              variant="text"
              color="error"
              icon="mdi-delete"
              size="small"
              @click="confirmDelete(form)"
            ></v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-alert
      v-else
      type="info"
      variant="tonal"
      class="mt-4"
    >
      目前尚無自訂表單。請點擊上方按鈕建立新表單。
    </v-alert>

    <!-- Editor Dialog (Full Screen) -->
    <v-dialog
      v-model="editorDialog"
      fullscreen
      transition="dialog-bottom-transition"
    >
      <CustomFormEditor
        v-if="editorDialog"
        :projectId="projectId"
        :formId="editingFormId"
        @close="closeEditor"
        @saved="onFormSaved"
      />
    </v-dialog>

    <!-- Responses Dialog -->
    <v-dialog v-model="responsesDialog" fullscreen transition="dialog-bottom-transition">
      <CustomFormResponses
        v-if="responsesDialog"
        :projectId="projectId"
        :projectName="projectName"
        :form="viewingForm"
        @close="closeResponses"
      />
    </v-dialog>

    <!-- Share Dialog -->
    <v-dialog v-model="shareDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6 bg-primary text-white">
          分享表單: {{ shareForm?.title }}
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4 text-body-2 text-grey-darken-1">
            產生僅供客戶填寫的公開連結。您可以選擇鎖定特定戶別，或產生通用連結。
          </p>

          <v-radio-group v-model="shareType" inline hide-details class="mb-4">
            <v-radio label="通用連結 (讓客戶選擇戶別)" value="general"></v-radio>
            <v-radio label="鎖定特定戶別" value="locked"></v-radio>
          </v-radio-group>

           <v-row v-if="shareType === 'locked'" dense class="mb-2">
             <v-col cols="12" sm="5">
               <v-select
                v-model="selectedBuilding"
                :items="uniqueBuildings"
                label="篩選棟別"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                placeholder="全部棟別"
              ></v-select>
             </v-col>
             <v-col cols="12" sm="7">
               <v-autocomplete
                v-model="selectedUnitId"
                :items="filteredUnits"
                item-title="label"
                item-value="unitId"
                label="選擇要鎖定的戶別"
                variant="outlined"
                density="compact"
                :loading="unitsLoading"
                clearable
                placeholder="可輸入編號搜尋..."
                no-data-text="無符合戶別"
              ></v-autocomplete>
             </v-col>
           </v-row>

           <v-label class="mb-2 text-caption">連結有效時間</v-label>
           <v-row dense class="mb-4">
             <v-col cols="8">
               <v-text-field
                v-model.number="expiryValue"
                type="number"
                variant="outlined"
                density="compact"
                hide-details
                min="0"
                placeholder="輸入數值"
              ></v-text-field>
             </v-col>
             <v-col cols="4">
               <v-select
                v-model="expiryUnit"
                :items="expiryUnitOptions"
                variant="outlined"
                density="compact"
                hide-details
              ></v-select>
             </v-col>
             <v-col cols="12">
               <div class="text-caption text-grey">
                 若設為 0 則代表永久有效
               </div>
             </v-col>
           </v-row>

           <div v-if="generatedUrl" class="mt-4 pa-3 bg-grey-lighten-4 rounded border">
            <div class="text-caption font-weight-bold mb-1">分享連結 (點擊複製):</div>
            <div
              class="d-flex align-center cursor-pointer text-primary text-decoration-underline text-break"
              @click="copyToClipboard(generatedUrl)"
            >
              {{ generatedUrl }}
              <v-icon size="small" class="ml-1">mdi-content-copy</v-icon>
            </div>

            <v-divider class="my-3"></v-divider>
            <div class="text-caption font-weight-bold mb-2">QR Code 中央顯示設定</div>
            <v-row dense align="center" class="mb-1">
              <v-col cols="6">
                <v-switch
                  v-model="qrShowProjectName"
                  label="顯示建案名稱"
                  density="compact"
                  hide-details
                  color="primary"
                  :disabled="!projectName"
                ></v-switch>
              </v-col>
              <v-col cols="6">
                <v-switch
                  v-model="qrShowUnit"
                  label="顯示鎖定戶別"
                  density="compact"
                  hide-details
                  color="primary"
                  :disabled="shareType !== 'locked' || !selectedUnitLabel"
                ></v-switch>
              </v-col>
              <v-col cols="12">
                <div class="d-flex align-center">
                  <span class="text-caption mr-3" style="white-space: nowrap;">
                    文字大小：{{ qrTextSize }}px
                  </span>
                  <v-slider
                    v-model="qrTextSize"
                    :min="8"
                    :max="20"
                    :step="1"
                    hide-details
                    density="compact"
                    color="primary"
                    thumb-label
                  ></v-slider>
                </div>
              </v-col>
            </v-row>

            <div class="mt-2 text-center">
              <div
                class="qr-wrapper mx-auto"
                :style="{ width: qrSize + 'px', height: qrSize + 'px' }"
              >
                <qrcode-vue :value="generatedUrl" :size="qrSize" level="H" />
                <div
                  v-if="(qrShowProjectName && projectName) || (qrShowUnit && shareType === 'locked' && selectedUnitLabel)"
                  class="qr-overlay"
                >
                  <div class="qr-text-bg">
                    <div
                      v-if="qrShowProjectName && projectName"
                      class="qr-text-line"
                      :style="{ fontSize: qrTextSize + 'px' }"
                    >
                      {{ projectName }}
                    </div>
                    <div
                      v-if="qrShowUnit && shareType === 'locked' && selectedUnitLabel"
                      class="qr-text-line"
                      :style="{ fontSize: qrTextSize + 'px' }"
                    >
                      {{ selectedUnitLabel }}
                    </div>
                  </div>
                </div>
              </div>
              <div class="text-caption mt-2">掃描 QR Code 開啟表單</div>
              <v-btn
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-download"
                class="mt-2"
                @click="downloadQrPng"
              >
                下載 PNG（透明背景）
              </v-btn>
            </div>
          </div>

        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="shareDialog = false">關閉</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            @click="generateShareLink"
            :loading="generatingLink"
            :disabled="shareType === 'locked' && !selectedUnitId"
          >
            產生/更新連結
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sync Dialog -->
    <v-dialog v-model="syncDialog" max-width="600px">
      <v-card>
        <v-card-title class="text-h6 bg-green-darken-2 text-white d-flex align-center">
          <v-icon start>mdi-google-spreadsheet</v-icon>
          發布回覆至 Google Sheet
        </v-card-title>

        <v-card-text class="pt-4">
          <!-- 顯示目前正在同步的設定 -->
          <v-alert
            v-if="activeSyncConfig"
            type="success"
            variant="tonal"
            class="mb-4"
            density="compact"
            icon="mdi-check-circle-outline"
          >
            <div class="font-weight-bold mb-1">目前已設定自動同步至：</div>
            <div class="text-body-2 text-truncate">
              Google Sheet：<a :href="activeSyncConfig.url" target="_blank" class="text-decoration-underline text-success">{{ activeSyncConfig.url }}</a>
            </div>
            <div class="text-body-2 mt-1">
              工作表名稱：<strong>{{ activeSyncConfig.sheetName }}</strong>
            </div>
          </v-alert>

          <v-alert
            type="info"
            variant="tonal"
            class="mb-4"
            density="compact"
            icon="mdi-information"
          >
            設定或更新後，使用者的回覆將自動同步至指定的 Google Sheet 工作表。
          </v-alert>

          <v-form ref="syncForm" @submit.prevent>
            <v-text-field
              v-model="googleSheetForm.url"
              label="Google Sheet 網址或 ID"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || '請輸入 Google Sheet 網址']"
              prepend-inner-icon="mdi-link"
              clearable
            ></v-text-field>

            <div class="d-flex justify-end mb-4">
              <v-btn
                color="primary"
                prepend-icon="mdi-refresh"
                :loading="loadingSheets"
                :disabled="!googleSheetForm.url"
                @click="fetchSheetNames"
              >
                讀取工作表
              </v-btn>
            </div>

            <!-- 顯示 Service Account Email 提示 -->
            <v-alert
              v-if="serviceAccountEmail"
              type="info"
              variant="tonal"
              class="mb-4"
              border="start"
              closable
            >
              <template v-slot:title>
                請共用權限給機器人
              </template>
              為了讓系統能寫入資料，請將您的 Google Sheet 共用給以下 Email (編輯者權限)：
              <div class="d-flex align-center mt-2 bg-grey-lighten-4 pa-2 rounded">
                <code class="text-subtitle-1 flex-grow-1" style="word-break: break-all;">{{ serviceAccountEmail }}</code>
                <v-btn
                  size="small"
                  variant="text"
                  icon="mdi-content-copy"
                  @click="copyToClipboard(serviceAccountEmail)"
                ></v-btn>
              </div>
            </v-alert>

            <v-expand-transition>
              <div v-if="sheetNames.length > 0">
                <v-autocomplete
                  v-model="googleSheetForm.sheetName"
                  :items="sheetNames"
                  label="選擇要同步的工作表 (Tab)"
                  variant="outlined"
                  density="comfortable"
                  prepend-inner-icon="mdi-table"
                  :rules="[v => !!v || '請選擇工作表']"
                ></v-autocomplete>
              </div>
            </v-expand-transition>

            <v-alert v-if="syncResult" :type="syncResult.type" class="mt-4" variant="tonal">
              {{ syncResult.message }}
            </v-alert>
          </v-form>

          <div class="mt-4 text-caption text-grey">
             <p class="font-weight-bold mb-1">注意事項：</p>
             <ol class="pl-4">
               <li>請確保您輸入的 Google Sheet 已共用編輯權限給系統帳號。</li>
               <li>全量同步將會<b>清除並覆蓋</b>該工作表的所有內容。</li>
               <li>首次同步後，系統即會自動啟動即時同步功能。</li>
             </ol>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey" @click="syncDialog = false">取消</v-btn>
          <v-btn
            color="success"
            variant="elevated"
            prepend-icon="mdi-cloud-sync"
            :loading="isSyncing"
            @click="executeSync"
            :disabled="!googleSheetForm.sheetName"
          >
            開始全量同步
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, computed, reactive } from 'vue';
import QrcodeVue from 'qrcode.vue';
import QRCode from 'qrcode';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
  getFirestore,
  getDoc
} from 'firebase/firestore'; // Assuming 'firebase/firestore' or local db instance
import { db } from '@/firebase'; // Adjust based on your project structure, e.g., '@/firebase/config' or just 'firebase/firestore'
import { useToast } from 'vue-toastification';
import { listGoogleSheets, syncCustomFormSubmissionsToSheet } from '@/api';

// 假設 CustomFormEditor 是另一個要建立的組件
const CustomFormEditor = defineAsyncComponent(() => import('./CustomFormEditor.vue'));
const CustomFormResponses = defineAsyncComponent(() => import('./CustomFormResponses.vue'));

const props = defineProps<{
  projectId: string;
  projectName?: string;
}>();

const toast = useToast();
const loading = ref(false);
const forms = ref<any[]>([]);

// Editor State
const editorDialog = ref(false);
const editingFormId = ref<string | null>(null);

// Responses State
const responsesDialog = ref(false);
const viewingForm = ref<any>(null);

// Share State
const shareDialog = ref(false);
const shareForm = ref<any>(null);
const shareType = ref('general'); // 'general' | 'locked'
const selectedUnitId = ref(null);
const units = ref<any[]>([]); // { label: 'A-5', unitId: 'A-5' }
const unitsLoading = ref(false);
const generatedUrl = ref('');
const generatingLink = ref(false);

// QR Code 中央覆蓋顯示設定
const qrSize = 240;
const qrShowProjectName = ref(true);
const qrShowUnit = ref(true);
const qrTextSize = ref(12);
// const expiryOption and options removed

// Sync State
const syncDialog = ref(false);
const loadingSheets = ref(false);
const isSyncing = ref(false);
const sheetNames = ref<string[]>([]);
const serviceAccountEmail = ref('');
const syncResult = ref<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
const syncForm = ref<any>(null);
const activeSyncConfig = ref<{ url: string, sheetName: string } | null>(null);
const currentSyncForm = ref<any>(null); // 當前要同步的表單

const googleSheetForm = reactive({
  url: '',
  sheetName: ''
});

// --- Methods ---

const loadForms = async () => {
  loading.value = true;
  try {
    const q = query(
      collection(db, 'customFormTemplates'),
      where('projectId', '==', props.projectId)
    );
    const snapshot = await getDocs(q);
    forms.value = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error('Error loading forms:', err);
    toast.error('載入表單失敗');
  } finally {
    loading.value = false;
  }
};

const openFormEditor = (form: any = null) => {
  editingFormId.value = form ? form.id : null;
  editorDialog.value = true;
};

const closeEditor = () => {
  editorDialog.value = false;
  editingFormId.value = null;
};

const onFormSaved = () => {
  closeEditor();
  loadForms();
  toast.success('表單已儲存');
};

const openResponses = (form: any) => {
  viewingForm.value = form;
  responsesDialog.value = true;
};

const closeResponses = () => {
  responsesDialog.value = false;
  viewingForm.value = null;
};

const confirmDelete = async (form: any) => {
  if (!confirm(`確定要刪除表單「${form.title}」嗎？此操作無法復原。`)) return;
  try {
    await deleteDoc(doc(db, 'customFormTemplates', form.id));
    toast.success('表單已刪除');
    loadForms();
  } catch (err) {
    toast.error('刪除失敗');
  }
};

const formatDate = (ts: any) => {
  if (!ts) return '-';
  return new Date(ts.seconds * 1000).toLocaleDateString();
};

// ... Inside <script setup>

// ... (existing refs)
const selectedBuilding = ref<string | null>(null);

// ... (existing helper methods)

// --- Sorting Helper ---
// Natural Sort for Unit IDs (e.g., A-2 < A-10)
const naturalSort = (a: any, b: any) => {
  return a.label.localeCompare(b.label, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' });
};

const loadUnits = async () => {
  unitsLoading.value = true;
  try {
    const q = query(collection(db, 'salesHouseholds'), where('projectId', '==', props.projectId));
    const snapshot = await getDocs(q);
    units.value = snapshot.docs.map(d => {
        const data = d.data();
        return {
            label: data.unitId || d.id, // Display Name
            unitId: data.unitId || d.id, // Value
            building: data.building || '未分類' // Building field
        };
    }).sort(naturalSort);
  } catch (err) {
    console.error(err);
    toast.error('載入戶別失敗');
  } finally {
    unitsLoading.value = false;
  }
};

const uniqueBuildings = computed(() => {
  const buildings = new Set(units.value.map(u => u.building));
  return Array.from(buildings).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true }));
});

const filteredUnits = computed(() => {
  if (!selectedBuilding.value) return units.value;
  return units.value.filter(u => u.building === selectedBuilding.value);
});

const selectedUnitLabel = computed(() => {
  if (!selectedUnitId.value) return '';
  const u = units.value.find(u => u.unitId === selectedUnitId.value);
  return u?.label || String(selectedUnitId.value);
});

// Update Open logic to reset selection
// Update Open logic to reset selection
const expiryValue = ref<number | null>(7); 
const expiryUnit = ref('days');
const expiryUnitOptions = [
  { title: '分鐘', value: 'minutes' },
  { title: '小時', value: 'hours' },
  { title: '天', value: 'days' },
  { title: '月', value: 'months' }
];

// ... (existing helper methods)

// ...

// Update Open logic to reset selection
const openShareDialog = async (form: any) => {
  shareForm.value = form;
  shareDialog.value = true;
  generatedUrl.value = '';
  selectedUnitId.value = null;
  selectedBuilding.value = null; // Reset building filter
  selectedUnitId.value = null;
  selectedBuilding.value = null; // Reset building filter
  expiryValue.value = 3;  // Default 3 days
  expiryUnit.value = 'days';
  shareType.value = 'general';
  
  if (units.value.length === 0) {
    await loadUnits();
  }
};

// ...

const generateShareLink = async () => {
  generatingLink.value = true;
  try {
    // Determine expiration based on units
    let expiresAt = null;
    if (expiryValue.value && expiryValue.value > 0) {
      const now = new Date();
      let minutesToAdd = 0;
      switch (expiryUnit.value) {
        case 'minutes': minutesToAdd = expiryValue.value; break;
        case 'hours': minutesToAdd = expiryValue.value * 60; break;
        case 'days': minutesToAdd = expiryValue.value * 60 * 24; break;
        case 'months': minutesToAdd = expiryValue.value * 60 * 24 * 30; break;
      }
      now.setTime(now.getTime() + minutesToAdd * 60 * 1000);
      expiresAt = now;
    }

    // Create secure token doc
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    await addDoc(collection(db, 'formShareLinks'), {
      token,
      projectId: props.projectId,
      formId: shareForm.value.id,
      unitId: shareType.value === 'locked' ? selectedUnitId.value : null,
      expiresAt,
      createdAt: serverTimestamp(),
      createdBy: 'currentUser' // TODO: Get actual user ID
    });

    const host = window.location.origin;
    generatedUrl.value = `${host}/#/s/${token}`;
    
  } catch (err) {
    console.error(err);
    toast.error('產生連結失敗');
  } finally {
    generatingLink.value = false;
  }
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('連結已複製');
};

const downloadQrPng = async () => {
  if (!generatedUrl.value) return;
  try {
    const outputSize = 800;
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, generatedUrl.value, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: outputSize,
      color: {
        dark: '#000000ff',
        light: '#00000000'
      }
    });

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    const lines: string[] = [];
    if (qrShowProjectName.value && props.projectName) {
      lines.push(props.projectName);
    }
    if (qrShowUnit.value && shareType.value === 'locked' && selectedUnitLabel.value) {
      lines.push(selectedUnitLabel.value);
    }

    if (lines.length > 0) {
      const scale = outputSize / qrSize;
      const fontSize = qrTextSize.value * scale;
      const lineHeight = fontSize * 1.25;
      const padY = 4 * scale;
      const padX = 8 * scale;
      const radius = 4 * scale;

      ctx.font = `700 ${fontSize}px "Microsoft JhengHei", "PingFang TC", "Heiti TC", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let maxTextWidth = 0;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxTextWidth) maxTextWidth = w;
      }
      const boxWidth = Math.min(maxTextWidth + padX * 2, outputSize * 0.78);
      const boxHeight = lineHeight * lines.length + padY * 2;
      const boxX = (outputSize - boxWidth) / 2;
      const boxY = (outputSize - boxHeight) / 2;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(boxX + radius, boxY);
      ctx.lineTo(boxX + boxWidth - radius, boxY);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY, boxX + boxWidth, boxY + radius);
      ctx.lineTo(boxX + boxWidth, boxY + boxHeight - radius);
      ctx.quadraticCurveTo(boxX + boxWidth, boxY + boxHeight, boxX + boxWidth - radius, boxY + boxHeight);
      ctx.lineTo(boxX + radius, boxY + boxHeight);
      ctx.quadraticCurveTo(boxX, boxY + boxHeight, boxX, boxY + boxHeight - radius);
      ctx.lineTo(boxX, boxY + radius);
      ctx.quadraticCurveTo(boxX, boxY, boxX + radius, boxY);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#000000';
      const startY = boxY + padY + lineHeight / 2;
      const maxLineWidth = boxWidth - padX * 2;
      lines.forEach((line, i) => {
        ctx.fillText(line, outputSize / 2, startY + i * lineHeight, maxLineWidth);
      });
    }

    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('產生 PNG 失敗');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (props.projectName || 'qrcode').replace(/[\\/:*?"<>|]/g, '_');
      const unitPart = shareType.value === 'locked' && selectedUnitLabel.value
        ? `_${selectedUnitLabel.value.replace(/[\\/:*?"<>|]/g, '_')}`
        : '';
      a.download = `${safeName}${unitPart}_QRCode.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('已下載 QR Code');
    }, 'image/png');
  } catch (err) {
    console.error('Download QR PNG failed:', err);
    toast.error('下載 QR Code 失敗');
  }
};

// --- Sync Functions ---
const openSyncDialog = async (form: any) => {
  currentSyncForm.value = form;
  syncDialog.value = true;
  syncResult.value = null;
  googleSheetForm.url = '';
  googleSheetForm.sheetName = '';
  sheetNames.value = [];
  serviceAccountEmail.value = '';
  await loadSyncConfig(form);
};

const loadSyncConfig = async (form: any) => {
  try {
    const formRef = doc(db, 'customFormTemplates', form.id);
    const snap = await getDoc(formRef);
    if (snap.exists()) {
      const config = snap.data()?.syncConfig;
      if (config && config.spreadsheetId) {
        const url = config.sheetUrl || `https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`;
        googleSheetForm.url = url;
        if (config.sheetName) {
          googleSheetForm.sheetName = config.sheetName;
          activeSyncConfig.value = {
            url: url,
            sheetName: config.sheetName
          };
        }
      }
    }
  } catch (err) {
    console.error('載入同步設定失敗:', err);
  }
};

const fetchSheetNames = async () => {
  if (!googleSheetForm.url) return;
  loadingSheets.value = true;
  sheetNames.value = [];
  serviceAccountEmail.value = '';
  syncResult.value = null;

  try {
    const res: any = await listGoogleSheets(googleSheetForm.url);
    if (res.status === 'success') {
      sheetNames.value = res.sheetNames || [];
      serviceAccountEmail.value = res.agentEmail || '';

      if (!sheetNames.value.includes(googleSheetForm.sheetName)) {
        googleSheetForm.sheetName = ''; // Reset if not found
      }
      toast.success('成功讀取工作表列表');
    }
  } catch (error: any) {
    console.error('Fetch sheet names error:', error);
    toast.error(`讀取失敗: ${error.message}`);
    syncResult.value = { type: 'error', message: `讀取失敗: ${error.message}` };
  } finally {
    loadingSheets.value = false;
  }
};

// 格式化數據（將地址對象轉換為可讀字符串）
const formatDataForSync = (data: any): any => {
  const formatted: any = {};
  for (const [key, value] of Object.entries(data)) {
    // 檢查是否是地址對象
    if (typeof value === 'object' && value !== null && ('city' in value || 'district' in value || 'detail' in value)) {
      const { city = '', district = '', detail = '' } = value as any;
      formatted[key] = `${city}${district}${detail}`.trim();
    } else {
      formatted[key] = value;
    }
  }
  return formatted;
};

const executeSync = async () => {
  const { valid } = await syncForm.value.validate();
  if (!valid) return;

  isSyncing.value = true;
  syncResult.value = null;

  try {
    // 簡易萃取 ID
    let spreadsheetId = googleSheetForm.url;
    const match = googleSheetForm.url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match) {
      spreadsheetId = match[1];
    }

    // 格式化回覆數據（將地址等複雜對象轉換為字符串）
    const formattedSubmissions = [];
    // 這裡需要從responses中取出當前表單的回覆並進行格式化
    // 但由於executeSync在CustomFormManager中，我們需要透過API直接處理

    const payload = {
      projectId: props.projectId,
      formId: currentSyncForm.value.id,
      spreadsheetId: spreadsheetId,
      sheetName: googleSheetForm.sheetName,
      formatData: true // 告訴後端進行數據格式化
    };

    const res: any = await syncCustomFormSubmissionsToSheet(payload);

    if (res.status === 'success') {
      syncResult.value = { type: 'success', message: res.message || '同步成功' };
      activeSyncConfig.value = {
        url: googleSheetForm.url,
        sheetName: googleSheetForm.sheetName
      };
      toast.success('全量同步成功！未來的新回覆將會自動同步。');
    } else {
      syncResult.value = { type: 'error', message: res.message || '同步失敗' };
      toast.error('同步失敗');
    }
  } catch (error: any) {
    console.error('Sync error:', error);
    syncResult.value = { type: 'error', message: `同步發生錯誤: ${error.message}` };
  } finally {
    isSyncing.value = false;
  }
};

onMounted(() => {
  loadForms();
});
</script>

<style scoped>
.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.qr-wrapper {
  position: relative;
  display: inline-block;
  line-height: 0;
}

.qr-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.qr-text-bg {
  background: #ffffff;
  padding: 4px 8px;
  border-radius: 4px;
  text-align: center;
  max-width: 78%;
  line-height: 1.25;
  box-shadow: 0 0 0 2px #ffffff;
}

.qr-text-line {
  color: #000000;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
