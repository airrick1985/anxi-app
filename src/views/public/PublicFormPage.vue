<template>
  <v-app>
    <v-main class="bg-grey-lighten-5">
      <v-container class="pa-0 pa-sm-4 h-100 d-flex flex-column justify-center" style="max-width: 600px">
        
        <!-- Loading State -->
        <div v-if="loading" class="text-center mt-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey">正在載入表單...</p>
        </div>

        <!-- Error State -->
        <v-card v-else-if="error" color="error" variant="tonal" class="ma-4">
          <v-card-text class="text-center pa-6">
            <v-icon size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">無法存取表單</h3>
            <p>{{ error }}</p>
          </v-card-text>
        </v-card>

        <!-- Form Success State -->
        <v-card v-else-if="submitted" color="success" class="ma-4 text-center pa-8">
           <v-icon size="80" color="white" class="mb-4">mdi-check-circle-outline</v-icon>
           <h2 class="text-h4 text-white font-weight-bold mb-4">提交成功</h2>
           
           <div v-if="form.submitSuccessMessage" class="bg-white rounded-lg pa-6 text-left text-body-1 text-grey-darken-3 elevation-1">
             <div class="rich-text-content" v-html="form.submitSuccessMessage"></div>
           </div>
           
           <p v-else class="text-white text-body-1 opacity-90">感謝您的填寫，資料已成功送出。</p>

           <div class="mt-6">
             <v-btn
               color="white"
               variant="outlined"
               prepend-icon="mdi-pencil"
               @click="modifyResponse"
             >
               修改回覆
             </v-btn>
           </div>
        </v-card>

        <!-- Form Content -->
        <v-card v-else class="rounded-lg elevation-2 overflow-hidden mx-sm-auto w-100">
          <!-- Form Header -->
          <div class="px-6 py-8 text-white form-header-gradient">
            <div class="d-flex justify-space-between align-start">
              <h1 class="text-h4 font-weight-bold mb-2 text-shadow-sm">{{ form.title }}</h1>
               <v-btn icon="mdi-share-variant" variant="text" color="white" @click="openShareDialog"></v-btn>
            </div>
            <p class="text-body-1 opacity-90" style="white-space: pre-line">{{ form.description }}</p>

            <!-- LINE 登入身份標示 -->
            <v-chip
              v-if="lineProfile"
              size="small"
              color="white"
              variant="outlined"
              prepend-icon="mdi-line"
              class="mt-3"
            >
              已以 LINE 帳號 {{ lineProfile.displayName }} 登入
            </v-chip>
          </div>

          <!-- 修改模式提示 -->
          <v-alert
            v-if="isModifyMode"
            type="info"
            variant="tonal"
            density="compact"
            class="mx-6 mt-4 mb-0"
            icon="mdi-pencil-outline"
          >
            您先前已填寫過此表單{{ formData.unitId ? `（戶別 ${formData.unitId}）` : '' }}，本次提交將覆寫先前的回覆
          </v-alert>

          <v-card-text class="pa-6">
            <!-- 驗證錯誤提示 -->
            <v-alert
              v-if="validationError"
              type="error"
              variant="tonal"
              closable
              class="mb-6"
              icon="mdi-alert-circle-outline"
              title="填寫不完整"
            >
              {{ validationError }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="submitForm">

              <!-- Unit Selector (if not locked) -->
              <div v-if="!lockedUnitId" class="mb-6">
                <v-select
                  v-if="uniqueBuildings.length > 0"
                  v-model="selectedBuilding"
                  :items="uniqueBuildings"
                  label="篩選棟別"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  class="mb-4"
                  color="primary"
                ></v-select>

                <v-autocomplete
                  v-model="formData.unitId"
                  :items="filteredUnits"
                  item-title="label"
                  item-value="unitId"
                  label="請選擇您的戶別"
                  variant="outlined"
                  :rules="[v => !!v || '請選擇戶別']"
                  prepend-inner-icon="mdi-home"
                  @update:model-value="onUnitChanged"
                  no-data-text="無符合戶別"
                  placeholder="可輸入編號搜尋..."
                ></v-autocomplete>
              </div>
              <div v-else class="mb-6 d-flex align-center pa-3 bg-blue-grey-lighten-5 rounded border">
                <v-icon color="blue-grey" class="mr-3">mdi-home-lock</v-icon>
                <div>
                  <div class="text-caption text-blue-grey">指定戶別</div>
                  <div class="font-weight-bold text-h6">{{ lockedUnitId }}</div>
                </div>
              </div>

              <!-- Dynamic Fields -->
              <div
                v-for="field in form.fields"
                :key="field.id"
                :data-field-id="field.id"
                class="mb-4 field-item"
              >
                <FormRenderItem
                  :field="field"
                  v-model="formData[field.id]"
                  :formData="formData"
                />
              </div>
            
              <v-btn
                type="submit"
                color="primary"
                block
                size="large"
                class="mt-8 font-weight-bold text-h6"
                elevation="3"
                :loading="submitting"
              >
                提交表單
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
        
        <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
          <span>Powered by&nbsp;</span>
          <v-chip
            class="ml-1"
            href="https://anxismart.com/"
            target="_blank"
            rel="noopener noreferrer"
            color="blue-grey"
            variant="tonal"
            size="small"
            pill
          >
            <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
            anxismart
          </v-chip>
        </div>
      </v-container>

    <!-- Share Dialog -->
    <v-dialog v-model="shareDialog" max-width="400">
      <v-card>
        <v-card-title class="bg-primary text-white d-flex justify-space-between align-center">
          分享表單
          <v-btn icon="mdi-close" variant="text" size="small" @click="shareDialog = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-6 text-center">
          <div class="mb-4">
            <qrcode-vue :value="currentUrl" :size="200" level="H" class="mx-auto border pa-2 rounded" />
          </div>
          <p class="text-caption text-grey mb-4">掃描上方 QR Code 開啟此表單</p>
          
          <v-divider class="mb-4"></v-divider>
          
          <v-text-field
            v-model="currentUrl"
            readonly
            variant="outlined"
            density="compact"
            append-inner-icon="mdi-content-copy"
            @click:append-inner="copyLink"
            hide-details
          ></v-text-field>
          <v-btn block color="primary" variant="tonal" class="mt-4" @click="copyLink">
            複製頁面連結
          </v-btn>
        </v-card-text>
      </v-card>
    </v-dialog>

    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import QrcodeVue from 'qrcode.vue';
import { db } from '@/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import TwCities from '@/assets/TwCities.json';
import FormRenderItem from '@/components/FormRenderItem.vue';
import liff from '@line/liff';

const route = useRoute();
const token = route.params.token as string;

const loading = ref(true);
const error = ref('');
const submitted = ref(false);
const submitting = ref(false);
const validationError = ref(''); // 驗證錯誤訊息
const formRef = ref<any>(null); // v-form ref

const form = ref<any>({});
const formData = reactive<Record<string, any>>({});
const lockedUnitId = ref<string | null>(null);
const projectId = ref('');
const units = ref<any[]>([]);
const householdData = ref<any>(null); // Cache for auto-fill
const currentSubmissionId = ref<string | null>(null); // Track ID for session overwrite
const fieldRefs = ref<Record<string, HTMLElement>>({});

// --- LIFF / LINE 收集狀態 ---
const lineProfile = ref<{ userId: string; displayName: string } | null>(null);
const isModifyMode = ref(false);
const lineModeChecked = ref(false);  // 標記目前載入流程已套用過修改模式檢查

const sanitizeForId = (s: string) => String(s || '').replace(/[^\w-]/g, '_');
const buildLineSubmissionId = (pid: string, fid: string, lineId: string, unitId?: string | null) => {
  const base = `${pid}_${fid}_LINE_${lineId}`;
  return unitId ? `${base}_${sanitizeForId(unitId)}` : base;
};

const initLineLogin = async (): Promise<boolean> => {
  // DEV 環境 mock：localhost 不支援 LIFF（HTTPS only），使用假 profile 走完整流程
  // 透過 ?mockLineId=Uxxx&mockLineName=測試A 可模擬不同用戶（測修改模式去重）
  const env = (import.meta as any).env || {};
  const isDevLocalhost = env.DEV && window.location.hostname === 'localhost';
  if (isDevLocalhost) {
    const mockId = (route.query.mockLineId as string) || 'U_DEV_MOCK_001';
    const mockName = (route.query.mockLineName as string) || '開發測試帳號';
    lineProfile.value = { userId: mockId, displayName: mockName };
    console.warn('[PublicFormPage] DEV mock LINE profile:', lineProfile.value);
    return true;
  }

  try {
    const liffId = env.VITE_LIFF_ID_FORM;
    if (!liffId) {
      error.value = 'LIFF 設定缺失，無法繼續';
      return false;
    }
    await liff.init({ liffId });

    if (!liff.isLoggedIn()) {
      // 跳到 LINE 授權，授權完成後 redirect 回當前頁
      liff.login({ redirectUri: window.location.href });
      // 跳轉中，標記 loading 持續到 redirect 完成
      return false;
    }

    const profile = await liff.getProfile();
    lineProfile.value = {
      userId: profile.userId,
      displayName: profile.displayName,
    };
    return true;
  } catch (err: any) {
    console.error('[PublicFormPage] LIFF init/login 失敗:', err);
    error.value = '需要 LINE 授權才能填寫此表單，請允許授權後再試';
    return false;
  }
};

// 依目前 unitId（或無）嘗試載入既有 submission 預填
const tryLoadExistingSubmission = async (unitId: string | null) => {
  if (!lineProfile.value || !form.value.id || !projectId.value) return;
  const sid = buildLineSubmissionId(projectId.value, form.value.id, lineProfile.value.userId, unitId);
  try {
    const snap = await getDoc(doc(db, 'customFormSubmissions', sid));
    if (snap.exists() && snap.data().isDeleted !== true) {
      const existing = snap.data();
      const sourceData = existing.data || {};
      // 覆寫 formData（保留原本初始化的鍵結構）
      Object.keys(sourceData).forEach((k) => {
        formData[k] = sourceData[k];
      });
      currentSubmissionId.value = sid;
      isModifyMode.value = true;
    } else {
      isModifyMode.value = false;
      currentSubmissionId.value = null;
    }
  } catch (err) {
    console.warn('[PublicFormPage] 查詢既有 submission 失敗:', err);
  }
};

// --- Intialization ---

onMounted(async () => {
  if (!token) {
    error.value = '無效的連結';
    loading.value = false;
    return;
  }

  try {
    // 1. Validate Token
    const qToken = query(collection(db, 'formShareLinks'), where('token', '==', token));
    const tokenSnap = await getDocs(qToken);
    
    if (tokenSnap.empty) {
      error.value = '連結無效或已不存在';
      loading.value = false;
      return;
    }

    const tokenData = tokenSnap.docs[0].data();
    
    // Check Expiry
    if (tokenData.expiresAt && tokenData.expiresAt.toDate() < new Date()) {
      error.value = '連結已過期';
      loading.value = false;
      return;
    }

    projectId.value = tokenData.projectId;
    lockedUnitId.value = tokenData.unitId;

    // 2. Load Form Template
    const formDoc = await getDoc(doc(db, 'customFormTemplates', tokenData.formId));
    if (!formDoc.exists() || !formDoc.data().isActive) {
      error.value = '表單已關閉或刪除';
      loading.value = false;
      return;
    }

    form.value = { id: formDoc.id, ...formDoc.data() };

    // Init form data structure
    initializeFormData();

    // 2.5 若表單需收集 LINE，先完成 LIFF 登入（拒絕授權則 error 阻擋）
    if (form.value.requireLineLogin) {
      const ok = await initLineLogin();
      if (!ok) {
        // initLineLogin 內已設好 error，或正在 redirect 中
        loading.value = false;
        return;
      }
    }

    // 3. If locked unit, load unit data and auto-fill
    if (lockedUnitId.value) {
      formData.unitId = lockedUnitId.value;
      await fetchHouseholdData(lockedUnitId.value);
      // 鎖定戶別 + 已 LINE 登入 → 嘗試預填既有 submission
      if (lineProfile.value) {
        await tryLoadExistingSubmission(lockedUnitId.value);
        lineModeChecked.value = true;
      }
    } else {
      // If public, load available units for selector
      await loadUnits();
      // 無戶別欄位的表單（form.fields 沒有 systemKey: 'unitId'）也要查
      const hasUnitField = (form.value.fields || []).some((f: any) => f.type === 'system' && f.systemKey === 'unitId');
      if (lineProfile.value && !hasUnitField) {
        await tryLoadExistingSubmission(null);
        lineModeChecked.value = true;
      }
    }

  } catch (err) {
    console.error(err);
    error.value = '載入發生錯誤，請稍後再試';
  } finally {
    loading.value = false;
  }
});

const initializeFormData = () => {
  if (!form.value.fields) return;
  
  form.value.fields.forEach((f: any) => {
    if (f.type === 'checkbox') {
      formData[f.id] = [];
    } else if (f.type === 'address') {
      formData[f.id] = { city: null, district: null, detail: '' };
    } else if (f.type === 'system' && f.systemKey === 'unitId' && lockedUnitId.value) {
       // handled separately
    } else {
      formData[f.id] = '';
    }
  });
};

// --- Sorting Helper ---
const naturalSort = (a: any, b: any) => {
  return a.label.localeCompare(b.label, 'zh-Hant-TW', { numeric: true, sensitivity: 'base' });
};

const loadUnits = async () => {
   const q = query(collection(db, 'salesHouseholds'), where('projectId', '==', projectId.value));
   // Optimize: limit fields if possible, but Firestore JS SDK client-side doesn't support select() easily without cloud function
   const snap = await getDocs(q);
   units.value = snap.docs.map(d => ({
     label: d.data().unitId || d.id,
     unitId: d.data().unitId || d.id,
     building: d.data().building || '未分類', // Fetch building
     ...d.data()
   })).sort(naturalSort);
};

// ...

// --- Building Filter Logic ---
const selectedBuilding = ref<string | null>(null);

const uniqueBuildings = computed(() => {
  const buildings = new Set(units.value.map(u => u.building));
  return Array.from(buildings).sort((a, b) => a.localeCompare(b, 'zh-Hant-TW', { numeric: true }));
});

const filteredUnits = computed(() => {
  if (!selectedBuilding.value) return units.value;
  return units.value.filter(u => u.building === selectedBuilding.value);
});

const fetchHouseholdData = async (unitId: string) => {
  // Find doc by unitId (assuming unitId field exists, or use ID directly)
  // Here we query for robustness since ID format might vary
  const q = query(
    collection(db, 'salesHouseholds'), 
    where('projectId', '==', projectId.value),
    where('unitId', '==', unitId)
  );
  const snap = await getDocs(q);
  
  if (!snap.empty) {
    householdData.value = snap.docs[0].data();
    autoFillFields();
  }
};

const onUnitChanged = async (newUnitId: string) => {
  if (newUnitId) {
    // Check if we already have data in 'units' array
    const unit = units.value.find(u => u.unitId === newUnitId);
    if (unit) {
      householdData.value = unit;
      autoFillFields();
    } else {
      await fetchHouseholdData(newUnitId);
    }
    // 若已 LINE 登入：依新 unitId 查既有 submission，存在則覆寫表單為修改模式
    if (lineProfile.value) {
      await tryLoadExistingSubmission(newUnitId);
    }
  }
};

const autoFillFields = () => {
  if (!householdData.value) return;
  const data = householdData.value;
  
  form.value.fields.forEach((f: any) => {
    if (f.type === 'system' && f.autoFill && f.systemKey) {
       // Mapping logic matching 'salesHouseholds' schema provided in user request
       let val = '';
       switch (f.systemKey) {
         case 'buyerName': val = data.buyerName || ''; break;
         case 'buyerPhone': val = data.buyerPhone || ''; break;
         case 'buyerAddress': val = formatAddress(data) || ''; break;
         case 'buyerIdNumber': val = data.buyerIdNumber || ''; break;
         case 'salesPerson': val = data.salesperson || ''; break;
         case 'unitId': val = data.unitId || ''; break;
       }
       formData[f.id] = val;
    }
  });
};

const formatAddress = (data: any) => {
  // Try mapping (priority to mailing, then permanent)
  // "buyerMailingAddressCity" ...
  const city = data.buyerMailingAddressCity || data.buyerPermanentAddressCity || '';
  const dist = data.buyerMailingAddressDistrict || data.buyerPermanentAddressDistrict || '';
  const street = data.buyerMailingAddressDetail || data.buyerPermanentAddressDetail || '';
  if (!city && !dist && !street) return '';
  return `${city}${dist}${street}`;
};

// --- Address Helpers ---
const cityOptions = computed(() => TwCities.map(c => c.name));

const getDistricts = (cityName: string) => {
  if (!cityName) return [];
  const city = TwCities.find(c => c.name === cityName);
  return city ? city.districts.map(d => d.name) : [];
};

// 檢查必填欄位並跳轉到第一個空欄位
const findAndHighlightEmptyField = (): string | null => {
  validationError.value = '';

  // 檢查戶別（如果未鎖定）
  if (!lockedUnitId.value && !formData.unitId) {
    validationError.value = '請選擇您的戶別';
    const unitSelector = document.querySelector('[label="請選擇您的戶別"]');
    if (unitSelector) {
      unitSelector.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (unitSelector as any).focus?.();
    }
    return '戶別';
  }

  // 檢查各個表單欄位的必填項
  for (const field of form.value.fields || []) {
    if (field.required && ['header', 'description', 'divider', 'link'].includes(field.type)) {
      continue; // 跳過非輸入類型
    }

    const fieldValue = formData[field.id];

    if (field.required) {
      let isEmpty = false;

      // 檢查不同類型欄位的空值
      if (field.type === 'address') {
        isEmpty = !fieldValue || (!fieldValue.city && !fieldValue.district && !fieldValue.detail);
      } else if (field.type === 'checkbox') {
        isEmpty = !fieldValue || (Array.isArray(fieldValue) && fieldValue.length === 0);
      } else if (field.type === 'radio') {
        isEmpty = !fieldValue;
      } else {
        isEmpty = !fieldValue || fieldValue.toString().trim() === '';
      }

      if (isEmpty) {
        validationError.value = `必填欄位「${field.label}」未填寫`;

        // 滾動到該欄位並高亮
        const fieldElement = document.querySelector(`[data-field-id="${field.id}"]`);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 添加高亮效果
          fieldElement.classList.add('field-error-highlight');
          setTimeout(() => {
            fieldElement.classList.remove('field-error-highlight');
          }, 3000);
        }

        return field.label;
      }
    }
  }

  return null;
};

const submitForm = async () => {
  // @ts-ignore
  const { valid } = await formRef.value?.validate() || { valid: false };

  // 找出並突出顯示第一個空的必填欄位
  const emptyField = findAndHighlightEmptyField();

  if (!valid || emptyField) {
    return;
  }

  if (!formData.unitId) {
      validationError.value = '請選擇戶別';
      return;
  }

  submitting.value = true;
  try {
      const timestamp = new Date();
      // Generate Submission ID:
      //  - LINE 模式：用 deterministic ID (projectId, formId, lineId, unitId)，setDoc 自動 upsert
      //  - 一般模式：沿用 session 既有 ID 或新建 timestamp ID
      let submissionId = currentSubmissionId.value;

      if (lineProfile.value) {
        submissionId = buildLineSubmissionId(
          projectId.value, form.value.id, lineProfile.value.userId, formData.unitId || null
        );
        currentSubmissionId.value = submissionId;
      } else if (!submissionId) {
         submissionId = `${projectId.value}_${formData.unitId}_${form.value.title}_${timestamp.getTime()}`;
         currentSubmissionId.value = submissionId;
      }
      
      // Generate Readable Snapshot (Label -> Value)
      const readableSnapshot: Record<string, any> = {};
      
      form.value.fields.forEach((field: any) => {
        const val = formData[field.id];
        
        // Add main field (if value exists)
        if (val !== undefined && val !== '' && val !== null) {
          if (field.type === 'address' && typeof val === 'object') {
             // Format Address Object
             const addr = `${val.city || ''}${val.district || ''}${val.detail || ''}`;
             readableSnapshot[field.label] = addr;
          } else {
             // Handle Array for Checkbox (join for readability, or keep array)
             readableSnapshot[field.label] = Array.isArray(val) ? val.join(', ') : val;
          }
        }

        // Handle Subfields
        if (field.options) {
             field.options.forEach((opt: any) => {
                 if (opt.subFields) {
                     opt.subFields.forEach((sub: any) => {
                         const subVal = formData[sub.id];
                         if (subVal !== undefined && subVal !== '' && subVal !== null) {
                             readableSnapshot[sub.label] = subVal;
                         }
                     });
                 }
             });
        }
      });

      // Add unitId explicitly to root of submission for easy indexing
      const submissionData = { ...formData };
      submissionData.unitId = formData.unitId;
      
      // Ensure unitId is in readable snapshot if not already (it should be since it's a field)
      if (!readableSnapshot['戶別']) {
          readableSnapshot['戶別'] = formData.unitId;
      }

      const writePayload: any = {
        projectId: projectId.value,
        formId: form.value.id,
        unitId: formData.unitId,
        data: submissionData,
        readableSnapshot: readableSnapshot,
        snapshotAvailable: true,
        submittedAt: serverTimestamp(),
        tokenUsed: token,
      };
      if (lineProfile.value) {
        writePayload.submitterLineId = lineProfile.value.userId;
        writePayload.submitterLineName = lineProfile.value.displayName;
      }
      // 修改模式：標記最後修改時間（不覆寫 submittedAt 由 merge 自動處理）
      if (isModifyMode.value) {
        writePayload.lastModifiedAt = serverTimestamp();
      }

      await setDoc(doc(db, 'customFormSubmissions', submissionId), writePayload, { merge: true });

      submitted.value = true;
  } catch (err) {
      console.error(err);
      alert('提交失敗，請檢查網路連線');
  } finally {
      submitting.value = false;
  }
};

const modifyResponse = () => {
  submitted.value = false;
  // Keep form data as is
};

// --- Share Logic ---
const shareDialog = ref(false);
const currentUrl = ref('');

const openShareDialog = () => {
  currentUrl.value = window.location.href;
  shareDialog.value = true;
};

const copyLink = () => {
  navigator.clipboard.writeText(currentUrl.value).then(() => {
    alert('連結已複製');
  }).catch(() => {
    alert('複製失敗，請手動複製');
  });
};

</script>

<style scoped>
/* Responsive tweaks */
.form-header-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #1565C0 100%); /* Primary to Blue 800 */
  /* Fallback if primary is not resolved in css var in some contexts, but usually works in Vuetify */
  /* Let's use a verified nice gradient */
  background: linear-gradient(135deg, #1A237E 0%, #0288D1 100%);
  position: relative;
  overflow: hidden;
}

.form-header-gradient::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}

.text-shadow-sm {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.rich-text-content {
  line-height: 1.6;
}
.rich-text-content :deep(a) {
  color: #1976D2; /* Primary Blue */
  text-decoration: underline;
  font-weight: bold;
}
.rich-text-content :deep(p) {
  margin-bottom: 0.5em;
}
.rich-text-content :deep(ul), .rich-text-content :deep(ol) {
  padding-left: 1.5em;
  margin-bottom: 0.5em;
}

/* 欄位錯誤高亮效果 */
.field-item {
  transition: all 0.3s ease;
}

.field-item.field-error-highlight {
  background: rgba(211, 47, 47, 0.1);
  border-left: 4px solid #d32f2f;
  padding-left: 12px;
  margin-left: -12px;
  animation: errorPulse 0.6s ease-in-out;
}

@keyframes errorPulse {
  0%, 100% {
    box-shadow: none;
  }
  50% {
    box-shadow: 0 0 0 8px rgba(211, 47, 47, 0.15);
  }
}
</style>
