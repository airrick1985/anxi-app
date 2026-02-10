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
            <div class="mt-3 text-center">
            <div class="mt-3 text-center">
              <qrcode-vue :value="generatedUrl" :size="200" level="H" class="mx-auto" />
              <div class="text-caption mt-2">掃描 QR Code 開啟表單</div>
            </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent, computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp, 
  getFirestore 
} from 'firebase/firestore'; // Assuming 'firebase/firestore' or local db instance
import { db } from '@/firebase'; // Adjust based on your project structure, e.g., '@/firebase/config' or just 'firebase/firestore'
import { useToast } from 'vue-toastification';

// 假設 CustomFormEditor 是另一個要建立的組件
const CustomFormEditor = defineAsyncComponent(() => import('./CustomFormEditor.vue'));

const props = defineProps<{
  projectId: string;
}>();

const toast = useToast();
const loading = ref(false);
const forms = ref<any[]>([]);

// Editor State
const editorDialog = ref(false);
const editingFormId = ref<string | null>(null);

// Share State
const shareDialog = ref(false);
const shareForm = ref<any>(null);
const shareType = ref('general'); // 'general' | 'locked'
const selectedUnitId = ref(null);
const units = ref<any[]>([]); // { label: 'A-5', unitId: 'A-5' }
const unitsLoading = ref(false);
const generatedUrl = ref('');
const generatingLink = ref(false);
// const expiryOption and options removed

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
  loadForms(); // Reload list
  toast.success('表單已儲存');
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
</style>
