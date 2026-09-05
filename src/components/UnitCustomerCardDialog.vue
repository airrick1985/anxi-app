<template>
  <!-- 戶別客戶資料卡：從銷控戶別 Modal 直接進入「匯出文件」畫面
       只有一筆紀錄 → 直接開匯出文件；多筆 → 先選一筆；無紀錄 → 提示 -->
  <v-dialog :model-value="pickerVisible" max-width="640" scrollable @update:model-value="v => { if (!v) close(); }">
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <v-icon start>mdi-card-account-details-outline</v-icon>
        <span>客戶資料卡 — {{ unitId }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4" style="max-height: 70vh;">
        <div v-if="loading" class="text-center pa-10">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <div class="text-caption text-grey mt-3">查詢客戶資料卡紀錄中...</div>
        </div>

        <template v-else>
          <v-alert v-if="loadError" type="error" variant="tonal" class="mb-3">{{ loadError }}</v-alert>

          <v-alert v-else-if="records.length === 0" type="info" variant="tonal">
            戶別 {{ unitId }} 目前沒有客戶資料卡填寫紀錄。<br>
            <span class="text-caption">系統會搜尋表單名稱含「客戶資料卡／客資卡／客戶資料」或已標記為客戶資料卡的自訂表單。</span>
          </v-alert>

          <template v-else>
            <p class="text-body-2 text-grey-darken-1 mb-3">
              戶別 <strong>{{ unitId }}</strong> 共 {{ records.length }} 筆客戶資料卡紀錄，點選一筆進入匯出文件。
            </p>
            <v-card
              v-for="rec in records"
              :key="rec.id"
              variant="outlined"
              class="mb-2 record-card"
              @click="openExport(rec)"
            >
              <div class="d-flex align-center pa-3">
                <v-avatar color="indigo-lighten-5" size="36" class="me-3">
                  <v-icon color="indigo" size="20">mdi-account</v-icon>
                </v-avatar>
                <div class="flex-grow-1 min-width-0">
                  <div class="font-weight-bold text-truncate">{{ rec.displayName }}</div>
                  <div class="text-caption text-grey-darken-1 text-truncate">
                    {{ rec.formTitle }}<span v-if="rec.submittedAtText">｜{{ rec.submittedAtText }}</span>
                  </div>
                </div>
                <v-btn size="small" variant="tonal" color="primary" prepend-icon="mdi-file-export-outline" class="flex-shrink-0">
                  匯出文件
                </v-btn>
              </div>
            </v-card>
          </template>
        </template>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- 匯出文件（PDF / Word 模板）：沿用自訂表單回覆頁的同一個元件 -->
  <FormExportDialog
    v-if="exportOpen"
    v-model="exportOpen"
    :project-id="projectId"
    :project-name="projectName"
    :form="exportForm"
    :item="exportItem"
  />
</template>

<script setup>
import { ref, computed, watch, defineAsyncComponent } from 'vue';
import { extractBuyerFromSubmission } from '@/utils/customerCardImport';
import { loadUnitCustomerCardSubmissions, flattenSubmissionForExport, formatTaiwanTime } from '@/utils/customerCardSubmissions';

const FormExportDialog = defineAsyncComponent(() => import('@/components/FormExportDialog.vue'));

const props = defineProps({
  show: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  unitId: { type: String, default: '' },
});
const emit = defineEmits(['update:show']);

const loading = ref(false);
const loadError = ref('');
const records = ref([]);
const exportOpen = ref(false);
const exportForm = ref(null);
const exportItem = ref(null);
// 只有一筆時跳過選擇畫面直接進匯出
const autoOpened = ref(false);

// 選擇畫面：載入中或需要使用者挑選／無紀錄時顯示；單筆自動開匯出時隱藏
const pickerVisible = computed(() => props.show && !(autoOpened.value && exportOpen.value));

watch(() => props.show, (visible) => {
  if (visible) load();
  else reset();
}, { immediate: true }); // 父層以 v-if 掛載（開啟時才建立），首次掛載也要載入

// 匯出文件關閉：單筆自動開啟的情境整個關閉；多筆情境回到選擇畫面
watch(exportOpen, (open) => {
  if (!open && autoOpened.value) close();
});

function reset() {
  loading.value = false;
  loadError.value = '';
  records.value = [];
  exportOpen.value = false;
  exportForm.value = null;
  exportItem.value = null;
  autoOpened.value = false;
}

function close() {
  emit('update:show', false);
}

async function load() {
  reset();
  if (!props.unitId) {
    loadError.value = '此戶別缺少戶別編號，無法查詢客戶資料卡。';
    return;
  }
  loading.value = true;
  try {
    const list = await loadUnitCustomerCardSubmissions(props.projectId, props.unitId);
    records.value = list.map(({ id, form, data }) => {
      const buyer = extractBuyerFromSubmission(form, data);
      return {
        id,
        form,
        data,
        formTitle: form.title || '未命名表單',
        displayName: buyer.name || data.submitterLineName || '未填姓名',
        submittedAtText: formatTaiwanTime(data.submittedAt),
      };
    });
    if (records.value.length === 1) {
      autoOpened.value = true;
      openExport(records.value[0]);
    }
  } catch (err) {
    console.error('載入客戶資料卡紀錄失敗:', err);
    loadError.value = '載入客戶資料卡紀錄失敗，請稍後再試。';
  } finally {
    loading.value = false;
  }
}

function openExport(rec) {
  exportForm.value = rec.form;
  exportItem.value = flattenSubmissionForExport(rec.id, rec.data);
  exportOpen.value = true;
}
</script>

<style scoped>
.record-card { cursor: pointer; transition: background-color .15s; }
.record-card:hover { background-color: #f5f7fb; }
.min-width-0 { min-width: 0; }
</style>
