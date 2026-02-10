<template>
  <v-card class="h-100 d-flex flex-column rounded-0">
    <v-toolbar color="white" elevation="1">
      <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
      <v-toolbar-title>
        {{ isEditMode ? '編輯表單' : '新增自訂表單' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        color="info"
        variant="text"
        prepend-icon="mdi-eye"
        @click="openPreview"
        class="mr-2"
      >
        預覽表單
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :loading="saving"
        @click="saveForm"
        prepend-icon="mdi-content-save"
        class="mr-4"
      >
        儲存表單
      </v-btn>
    </v-toolbar>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewDialog" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-grey-lighten-5">
        <v-toolbar color="primary" density="compact">
          <v-btn icon="mdi-close" @click="previewDialog = false"></v-btn>
          <v-toolbar-title>預覽模式 (模擬公開頁面)</v-toolbar-title>
        </v-toolbar>
        
        <v-container class="pa-4 flex-grow-1 overflow-y-auto" style="max-width: 600px">
           <v-card class="rounded-lg elevation-2 overflow-hidden mx-auto w-100">
              <!-- Form Header -->
              <div class="px-6 py-8 text-white form-header-gradient">
                <h1 class="text-h4 font-weight-bold mb-2 text-shadow-sm">{{ form.title }}</h1>
                <p class="text-body-1 opacity-90" style="white-space: pre-line">{{ form.description }}</p>
              </div>

              <v-card-text class="pa-6">
                <v-form @submit.prevent>
                  
                  <!-- Mock Unit Selector -->
                  <div class="mb-6">
                     <v-select
                      label="篩選棟別 (預覽)"
                      variant="outlined"
                      density="comfortable"
                      class="mb-4"
                      hide-details
                      disabled
                    ></v-select>
                    <v-autocomplete
                      label="請選擇您的戶別 (預覽)"
                      variant="outlined"
                      prepend-inner-icon="mdi-home"
                      placeholder="可輸入編號搜尋..."
                      disabled
                    ></v-autocomplete>
                  </div>

                  <!-- Dynamic Fields -->
                  <div v-for="field in form.fields" :key="field.id" class="mb-4">
                    <FormRenderItem
                      :field="field"
                      v-model="previewData[field.id]"
                      :formData="previewData"
                      :preview="true"
                    />
                  </div>
                
                  <v-btn
                    color="primary"
                    block
                    size="large"
                    class="mt-8 font-weight-bold text-h6"
                    elevation="3"
                    disabled
                  >
                    提交表單 (預覽無法提交)
                  </v-btn>
                </v-form>
              </v-card-text>
           </v-card>
           <div class="text-caption text-grey text-center mt-4 d-flex align-center justify-center">
              <span>Powered by&nbsp;</span>
              <v-chip class="ml-1" color="blue-grey" variant="tonal" size="small" pill>
                <v-icon start size="x-small">mdi-rocket-launch-outline</v-icon>
                anxismart
              </v-chip>
           </div>
        </v-container>
      </v-card>
    </v-dialog>

    <div class="d-flex flex-grow-1 overflow-hidden bg-grey-lighten-4">
      <!-- Left: Form Configuration -->
      <v-sheet class="flex-grow-1 ma-4 rounded-lg overflow-y-auto pa-6" elevation="1" max-width="800">
        <h3 class="text-h6 mb-4 font-weight-bold text-grey-darken-3">表單設定</h3>
        
        <v-text-field
          v-model="form.title"
          label="表單標題 (例如: 客戶資料調查表)"
          variant="outlined"
          :rules="[v => !!v || '標題為必填']"
          class="mb-2"
        ></v-text-field>

        <v-textarea
          v-model="form.description"
          label="表單說明 (選填)"
          variant="outlined"
          rows="3"
          hint="顯示在表單標題下方的說明文字"
          persistent-hint
          class="mb-6"
        ></v-textarea>

        <v-divider class="mb-6"></v-divider>

        <h3 class="text-h6 mb-4 font-weight-bold text-grey-darken-3 d-flex justify-space-between align-center">
          欄位設計
          <v-chip color="primary" size="small" variant="tonal">{{ form.fields.length }} 個欄位</v-chip>
        </h3>

        <!-- Dynamic Field Editor Integration -->
        <DynamicFieldEditor
          v-model:fields="form.fields"
          :allowSystemFields="true"
        />
        
        <v-divider class="my-6"></v-divider>

        <h3 class="text-h6 mb-4 font-weight-bold text-grey-darken-3">表單送出後設定</h3>
        
        <v-label class="mb-2">表單送出成功顯示訊息</v-label>
        <RichTextEditor
          v-model="form.submitSuccessMessage"
          class="mb-4"
        />

      </v-sheet>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, defineAsyncComponent } from 'vue';
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from 'vue-toastification';
import DynamicFieldEditor from '@/components/DynamicFieldEditor.vue';
import RichTextEditor from '@/components/RichTextEditor.vue';
// Use native browser UUID generator to avoid 'stream' module issues with uuid package
const uuidv4 = () => crypto.randomUUID();
import TwCities from '@/assets/TwCities.json';
import FormRenderItem from '@/components/FormRenderItem.vue';

const props = defineProps<{
  projectId: string;
  formId?: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const toast = useToast();

const saving = ref(false);
const isEditMode = ref(false);
const previewDialog = ref(false);
const previewData = ref<any>({});

const openPreview = () => {
  // Initialize mock data
  previewData.value = {};
  form.value.fields.forEach((f: any) => {
    if (f.type === 'address') {
      previewData.value[f.id] = { city: null, district: null, detail: '' };
    } else if (f.type === 'checkbox') {
      previewData.value[f.id] = [];
    } else {
      previewData.value[f.id] = '';
    }

    // Init subfields
    if (f.options) {
      f.options.forEach((opt: any) => {
        if (opt.subFields) {
          opt.subFields.forEach((sub: any) => {
             previewData.value[sub.id] = '';
          });
        }
      });
    }
  });
  previewDialog.value = true;
};

// --- Address Helpers for Preview ---
const cityOptions = computed(() => TwCities.map(c => c.name));
const getDistricts = (cityName: string) => {
  if (!cityName) return [];
  const city = TwCities.find(c => c.name === cityName);
  return city ? city.districts.map(d => d.name) : [];
};

const form = ref({
  title: '未命名表單',
  description: '',
  submitSuccessMessage: '', // New field
  isActive: true,
  fields: [] as any[] // DynamicField[]
});

const loadForm = async () => {
  if (!props.formId) {
    // Default Fields Template
    form.value.fields = [
      { id: uuidv4(), type: 'system', label: '戶別 (鎖定/選擇)', systemKey: 'unitId', required: true, readOnly: true },
      { id: uuidv4(), type: 'system', label: '買方姓名', systemKey: 'buyerName', required: true, autoFill: true },
      { id: uuidv4(), type: 'system', label: '買方電話', systemKey: 'buyerPhone', required: true, autoFill: true },
    ];
    return;
  }
  
  isEditMode.value = true;
  try {
    const docRef = doc(db, 'customFormTemplates', props.formId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      form.value = {
        title: data.title,
        description: data.description,
        submitSuccessMessage: data.submitSuccessMessage || '',
        isActive: data.isActive,
        fields: data.fields || []
      };
    } else {
      toast.error('找不到表單資料');
      emit('close');
    }
  } catch (err) {
    console.error(err);
    toast.error('載入失敗');
  }
};

const saveForm = async () => {
  if (!form.value.title) {
    toast.error('請輸入表單標題');
    return;
  }

  saving.value = true;
  try {
    const payload = {
      projectId: props.projectId,
      ...form.value,
      updatedAt: serverTimestamp()
    };

    if (isEditMode.value && props.formId) {
      await updateDoc(doc(db, 'customFormTemplates', props.formId), payload);
    } else {
      (payload as any).createdAt = serverTimestamp();
      await addDoc(collection(db, 'customFormTemplates'), payload);
    }
    
    emit('saved');
  } catch (err) {
    console.error(err);
    toast.error(`儲存失敗: ${(err as Error).message}`);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadForm();
});
</script>

<style scoped>
/* Customize scrollbar if needed */
.form-header-gradient {
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
</style>
