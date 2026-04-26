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

        <template v-if="canEditNotify">
          <h3 class="text-h6 mb-4 font-weight-bold text-grey-darken-3 d-flex align-center">
            <v-icon class="mr-2" color="primary">mdi-bell-ring-outline</v-icon>
            通知設定
          </h3>

          <v-checkbox
            v-model="form.requireLineLogin"
            label="收集填寫者的 LINE ID（用戶填寫前需先登入 LINE）"
            color="primary"
            hide-details
            density="comfortable"
          ></v-checkbox>

          <v-checkbox
            v-model="form.notifyUnitSalesPerson"
            label="通知該戶別的銷售人員（表單需包含「戶別」欄位）"
            color="primary"
            hide-details
            density="comfortable"
            class="mt-1"
          ></v-checkbox>

          <div class="mt-4 mb-2 d-flex align-center justify-space-between">
            <span class="text-body-2 font-weight-medium">
              此表單完成後 LINE 通知人員
              <span class="text-caption text-grey ml-2">
                ({{ activeReceiverCount }} / {{ notificationCandidates.length }} 人接收中)
              </span>
            </span>
            <v-progress-circular v-if="loadingCandidates" indeterminate size="20" width="2" />
          </div>

          <v-card variant="outlined" class="rounded">
            <div v-if="!loadingCandidates && notificationCandidates.length === 0" class="text-center pa-4 text-grey text-body-2">
              本建案無符合「銷控系統」或「報價系統」權限的人員
            </div>
            <v-list v-else density="compact" class="py-0">
              <v-list-item
                v-for="(c, idx) in notificationCandidates"
                :key="c.userKey"
                :class="{ 'bg-grey-lighten-4': !isReceiving(c.userKey) }"
                :border="idx < notificationCandidates.length - 1 ? 'b' : undefined"
              >
                <template v-slot:prepend>
                  <v-checkbox-btn
                    :model-value="isReceiving(c.userKey)"
                    color="primary"
                    @update:model-value="(v) => toggleReceiving(c.userKey, !!v)"
                  />
                </template>

                <v-list-item-title class="d-flex align-center" style="gap: 6px">
                  <span :class="{ 'text-grey text-decoration-line-through': !isReceiving(c.userKey) }">
                    {{ c.name }}
                  </span>
                  <v-chip
                    v-for="s in c.systems"
                    :key="s"
                    :color="systemChipColor(s)"
                    size="x-small"
                    variant="tonal"
                    label
                  >{{ s }}</v-chip>
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ c.phone }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card>
          <div class="text-caption text-grey mt-1">
            勾選＝接收此表單通知；取消勾選＝停止接收
          </div>

          <v-divider class="my-6"></v-divider>
        </template>

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
import { useUserStore } from '@/store/user';
import { getFormNotificationCandidates } from '@/api';

const props = defineProps<{
  projectId: string;
  formId?: string | null;
}>();

const emit = defineEmits(['close', 'saved']);
const toast = useToast();
const userStore = useUserStore();

const saving = ref(false);
const isEditMode = ref(false);
const previewDialog = ref(false);
const previewData = ref<any>({});

const canEditNotify = computed(() => {
  const perms = (userStore.user as any)?.permissions;
  return !!perms?.[props.projectId]?.systems?.includes('銷控系統');
});

interface NotificationCandidate {
  userKey: string;
  name: string;
  phone: string;
  systems: string[];
}
const notificationCandidates = ref<NotificationCandidate[]>([]);
const loadingCandidates = ref(false);

const loadNotificationCandidates = async () => {
  if (!canEditNotify.value || !props.projectId) return;
  loadingCandidates.value = true;
  try {
    const res = await getFormNotificationCandidates({ projectId: props.projectId });
    notificationCandidates.value = (res.candidates || []).map((c: any) => ({
      userKey: c.userKey,
      name: c.name,
      phone: c.phone,
      systems: Array.isArray(c.systems) ? c.systems : [],
    }));
  } catch (err) {
    console.error('載入通知候選人員失敗:', err);
  } finally {
    loadingCandidates.value = false;
  }
};

const isReceiving = (userKey: string) =>
  !form.value.notificationExcludedUserKeys.includes(userKey);

const toggleReceiving = (userKey: string, willReceive: boolean) => {
  const list = form.value.notificationExcludedUserKeys;
  const idx = list.indexOf(userKey);
  if (willReceive && idx !== -1) list.splice(idx, 1);
  else if (!willReceive && idx === -1) list.push(userKey);
};

const activeReceiverCount = computed(() =>
  notificationCandidates.value.filter(c => isReceiving(c.userKey)).length
);

const systemChipColor = (s: string) => s === '銷控系統' ? 'indigo' : (s === '報價系統' ? 'teal' : 'grey');

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
  fields: [] as any[], // DynamicField[]
  notifySalesAdmins: true,
  notifyUnitSalesPerson: true,
  notificationExcludedUserKeys: [] as string[],
  requireLineLogin: false,
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
        title: data.title || '未命名表單',
        description: data.description || '',
        submitSuccessMessage: data.submitSuccessMessage || '',
        isActive: data.isActive ?? true,
        fields: data.fields || [],
        notifySalesAdmins: data.notifySalesAdmins ?? true,
        notifyUnitSalesPerson: data.notifyUnitSalesPerson ?? true,
        notificationExcludedUserKeys: Array.isArray(data.notificationExcludedUserKeys)
          ? data.notificationExcludedUserKeys : [],
        requireLineLogin: data.requireLineLogin ?? false,
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
    const payload: any = {
      projectId: props.projectId,
      ...form.value,
      // notifySalesAdmins 已無 UI 控制，固定為 true，由抑制名單作為唯一控制來源
      notifySalesAdmins: true,
      updatedAt: serverTimestamp()
    };

    // 無編輯通知設定權限者：移除通知/LINE 收集相關欄位以避免覆寫既有設定
    if (!canEditNotify.value) {
      delete payload.notifySalesAdmins;
      delete payload.notifyUnitSalesPerson;
      delete payload.notificationExcludedUserKeys;
      delete payload.requireLineLogin;
    }

    if (isEditMode.value && props.formId) {
      await updateDoc(doc(db, 'customFormTemplates', props.formId), payload);
    } else {
      payload.createdAt = serverTimestamp();
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
  loadNotificationCandidates();
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
