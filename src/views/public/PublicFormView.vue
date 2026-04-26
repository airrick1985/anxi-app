<template>
  <v-app>
    <v-main class="bg-grey-lighten-5">
      <v-container class="pa-0 pa-sm-4 h-100 d-flex flex-column justify-center" style="max-width: 600px">

        <!-- Loading -->
        <div v-if="loading" class="text-center mt-12">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4 text-grey">正在載入回覆內容...</p>
        </div>

        <!-- Error -->
        <v-card v-else-if="error" color="error" variant="tonal" class="ma-4">
          <v-card-text class="text-center pa-6">
            <v-icon size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">無法存取此回覆</h3>
            <p>{{ error }}</p>
          </v-card-text>
        </v-card>

        <!-- Form -->
        <v-card v-else class="rounded-lg elevation-2 overflow-hidden mx-sm-auto w-100">
          <div class="px-6 py-8 text-white form-header-gradient">
            <div class="d-flex align-center mb-2">
              <v-chip color="white" variant="outlined" size="small" class="mr-2">
                <v-icon start size="small">mdi-pencil</v-icon>
                修改回覆模式
              </v-chip>
            </div>
            <h1 class="text-h4 font-weight-bold mb-2 text-shadow-sm">{{ form.title }}</h1>
            <p class="text-body-2 opacity-90">
              您正在代客修改
              <span class="font-weight-bold">{{ buyerSummary || '此戶' }}</span>
              <span v-if="submission.unitId"> 在 <span class="font-weight-bold">{{ submission.unitId }}</span></span>
              的填寫內容
            </p>
          </div>

          <v-card-text class="pa-6">
            <v-alert
              v-if="validationError"
              type="error" variant="tonal" closable class="mb-6"
              icon="mdi-alert-circle-outline" title="填寫不完整"
            >
              {{ validationError }}
            </v-alert>

            <v-alert
              v-if="successMessage"
              type="success" variant="tonal" closable class="mb-6"
              icon="mdi-check-circle-outline"
            >
              {{ successMessage }}
            </v-alert>

            <v-form ref="formRef" @submit.prevent="saveChanges">
              <!-- 戶別固定顯示（永遠唯讀） -->
              <div v-if="submission.unitId" class="mb-6 d-flex align-center pa-3 bg-blue-grey-lighten-5 rounded border">
                <v-icon color="blue-grey" class="mr-3">mdi-home-lock</v-icon>
                <div>
                  <div class="text-caption text-blue-grey">戶別（不可修改）</div>
                  <div class="font-weight-bold text-h6">{{ submission.unitId }}</div>
                </div>
              </div>

              <div
                v-for="field in renderableFields"
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
                block size="large"
                class="mt-8 font-weight-bold text-h6"
                elevation="3"
                :loading="saving"
              >
                儲存修改
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
            color="blue-grey" variant="tonal" size="small" pill
          >
            <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
            anxismart
          </v-chip>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { db } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import FormRenderItem from '@/components/FormRenderItem.vue';

const route = useRoute();
const submissionId = route.params.submissionId as string;

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const validationError = ref('');
const successMessage = ref('');
const formRef = ref<any>(null);

const form = ref<any>({});
const submission = ref<any>({});
const formData = reactive<Record<string, any>>({});

const renderableFields = computed(() => {
  // 戶別系統欄位永遠不在主欄位列表中渲染（已在頂部以唯讀區塊呈現）
  return (form.value.fields || []).filter((f: any) =>
    !(f.type === 'system' && f.systemKey === 'unitId')
  );
});

const buyerSummary = computed(() => {
  const snap = submission.value.readableSnapshot || {};
  return [snap['買方姓名'], snap['買方電話']].filter(Boolean).join(' ');
});

onMounted(async () => {
  if (!submissionId) {
    error.value = '無效的連結';
    loading.value = false;
    return;
  }

  try {
    const subRef = doc(db, 'customFormSubmissions', submissionId);
    const subSnap = await getDoc(subRef);

    if (!subSnap.exists()) {
      error.value = '找不到此回覆，連結可能已失效';
      return;
    }

    const subData = subSnap.data();
    if (subData.isDeleted === true) {
      error.value = '此回覆已被刪除';
      return;
    }

    submission.value = { id: subSnap.id, ...subData };

    const formDoc = await getDoc(doc(db, 'customFormTemplates', subData.formId));
    if (!formDoc.exists()) {
      error.value = '找不到對應表單，請聯絡管理員';
      return;
    }
    form.value = { id: formDoc.id, ...formDoc.data() };

    // 將 submission.data 灌入 formData (key 為 fieldId)
    const sourceData = subData.data || {};
    (form.value.fields || []).forEach((f: any) => {
      const stored = sourceData[f.id];
      if (f.type === 'checkbox') {
        formData[f.id] = Array.isArray(stored) ? stored : [];
      } else if (f.type === 'address') {
        formData[f.id] = (stored && typeof stored === 'object')
          ? { city: stored.city || null, district: stored.district || null, detail: stored.detail || '' }
          : { city: null, district: null, detail: '' };
      } else {
        formData[f.id] = stored !== undefined && stored !== null ? stored : '';
      }
      // 子欄位
      if (f.options) {
        f.options.forEach((opt: any) => {
          if (opt.subFields) {
            opt.subFields.forEach((sub: any) => {
              const subStored = sourceData[sub.id];
              formData[sub.id] = subStored !== undefined && subStored !== null ? subStored : '';
            });
          }
        });
      }
    });

    // 戶別欄位也填入（雖然不渲染，但保留 formData 以便寫回）
    formData.unitId = subData.unitId;
  } catch (err) {
    console.error('[PublicFormView] 載入失敗:', err);
    error.value = '載入發生錯誤，請稍後再試';
  } finally {
    loading.value = false;
  }
});

const findEmptyRequired = (): string | null => {
  validationError.value = '';
  for (const field of renderableFields.value) {
    if (!field.required) continue;
    if (['header', 'description', 'divider', 'link'].includes(field.type)) continue;

    const val = formData[field.id];
    let isEmpty = false;
    if (field.type === 'address') {
      isEmpty = !val || (!val.city && !val.district && !val.detail);
    } else if (field.type === 'checkbox') {
      isEmpty = !val || (Array.isArray(val) && val.length === 0);
    } else if (field.type === 'radio') {
      isEmpty = !val;
    } else {
      isEmpty = !val || String(val).trim() === '';
    }

    if (isEmpty) {
      validationError.value = `必填欄位「${field.label}」未填寫`;
      const el = document.querySelector(`[data-field-id="${field.id}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('field-error-highlight');
        setTimeout(() => el.classList.remove('field-error-highlight'), 3000);
      }
      return field.label;
    }
  }
  return null;
};

const buildReadableSnapshot = () => {
  const snap: Record<string, any> = {};
  (form.value.fields || []).forEach((field: any) => {
    const val = formData[field.id];
    if (val !== undefined && val !== '' && val !== null) {
      if (field.type === 'address' && typeof val === 'object') {
        snap[field.label] = `${val.city || ''}${val.district || ''}${val.detail || ''}`;
      } else {
        snap[field.label] = Array.isArray(val) ? val.join(', ') : val;
      }
    }
    if (field.options) {
      field.options.forEach((opt: any) => {
        if (opt.subFields) {
          opt.subFields.forEach((sub: any) => {
            const subVal = formData[sub.id];
            if (subVal !== undefined && subVal !== '' && subVal !== null) {
              snap[sub.label] = subVal;
            }
          });
        }
      });
    }
  });
  if (submission.value.unitId && !snap['戶別']) {
    snap['戶別'] = submission.value.unitId;
  }
  return snap;
};

const saveChanges = async () => {
  successMessage.value = '';
  // @ts-ignore
  const validation = await formRef.value?.validate();
  const valid = validation?.valid ?? true;
  const empty = findEmptyRequired();
  if (!valid || empty) return;

  saving.value = true;
  try {
    const dataToWrite = { ...formData };
    dataToWrite.unitId = submission.value.unitId;  // 強制鎖死

    await updateDoc(doc(db, 'customFormSubmissions', submissionId), {
      data: dataToWrite,
      readableSnapshot: buildReadableSnapshot(),
      snapshotAvailable: true,
      lastModifiedAt: serverTimestamp(),
    });

    successMessage.value = '修改已儲存';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error('[PublicFormView] 儲存失敗:', err);
    validationError.value = `儲存失敗：${(err as Error).message}`;
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
.form-header-gradient {
  background: linear-gradient(135deg, #1A237E 0%, #0288D1 100%);
  position: relative;
  overflow: hidden;
}
.form-header-gradient::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: radial-gradient(circle at top right, rgba(255,255,255,0.1) 0%, transparent 60%);
  pointer-events: none;
}
.text-shadow-sm {
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}
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
  0%, 100% { box-shadow: none; }
  50% { box-shadow: 0 0 0 8px rgba(211, 47, 47, 0.15); }
}
</style>
