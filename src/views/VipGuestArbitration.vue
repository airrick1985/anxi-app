<template>
  <v-container class="py-6" style="max-width: 720px;">

    <!-- 載入中 -->
    <v-card v-if="isLoading" class="text-center pa-10">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="mt-4 text-grey">正在載入裁決資料...</p>
    </v-card>

    <!-- 載入失敗 -->
    <v-alert v-else-if="loadError" type="error" variant="tonal" prominent>
      {{ loadError }}
    </v-alert>

    <template v-else>
      <!-- 客戶資訊 -->
      <v-card class="mb-4" elevation="2">
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon start>mdi-gavel</v-icon>
          客資歸屬裁決
        </v-card-title>
        <v-card-text class="pa-4">
          <v-row dense>
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey">建案</div>
              <div class="text-body-1 font-weight-bold">{{ projectName }}</div>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="text-caption text-grey">客戶</div>
              <div class="text-body-1 font-weight-bold">
                {{ customer.latestName }}（{{ customer.phone }}）
              </div>
            </v-col>
            <v-col cols="12">
              <div class="text-caption text-grey">目前歸屬銷售</div>
              <v-chip
                :color="customer.latestSalesName ? 'teal' : 'grey'"
                variant="flat"
                size="small"
                class="mt-1"
              >
                {{ customer.latestSalesName || '未歸屬' }}
              </v-chip>
            </v-col>
          </v-row>

          <!-- 最近裁決資訊 -->
          <v-alert
            v-if="latestLog"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-3 mb-0"
          >
            最近裁決：{{ latestLog.decidedByName }} 於 {{ formatTime(latestLog.decidedAt) }}
            裁決給 {{ latestLog.toSalesName }}（仍可再次裁決）
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- 候選銷售選擇 -->
      <v-card class="mb-4" elevation="2">
        <v-card-title class="text-subtitle-1 font-weight-bold">
          <v-icon start color="primary">mdi-account-switch</v-icon>
          請選擇該筆客戶資料的歸屬銷售人員
        </v-card-title>
        <v-card-text>
          <v-radio-group v-model="selectedSalesPhone" hide-details>
            <v-radio
              v-for="candidate in candidates"
              :key="candidate.phone || candidate.name"
              :value="candidate.phone"
              :disabled="!candidate.phone"
              color="primary"
            >
              <template v-slot:label>
                <div class="d-flex align-center flex-wrap">
                  <span class="font-weight-medium mr-2">{{ candidate.name }}</span>
                  <v-chip
                    v-if="candidate.phone === customer.latestSalesPhone"
                    color="teal"
                    size="x-small"
                    variant="flat"
                    class="mr-2"
                  >目前歸屬</v-chip>
                  <span class="text-caption text-grey">
                    最近填表：{{ candidate.lastSubmittedAt ? formatTime(candidate.lastSubmittedAt) : '未知' }}
                    <template v-if="!candidate.phone">（無電話資料，無法指派）</template>
                  </span>
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <!-- 例外：指派給其他銷售人員 -->
          <v-expansion-panels variant="accordion" class="mt-3">
            <v-expansion-panel>
              <v-expansion-panel-title class="text-body-2">
                選擇其他銷售人員
              </v-expansion-panel-title>
              <v-expansion-panel-text>
                <v-select
                  v-model="otherSalesPhone"
                  label="該建案其他人員"
                  :items="otherSalesOptions"
                  item-title="name"
                  item-value="phone"
                  variant="outlined"
                  density="comfortable"
                  clearable
                  hide-details
                >
                  <template v-slot:item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps" :subtitle="item.raw.phone"></v-list-item>
                  </template>
                </v-select>
                <p class="text-caption text-grey mt-2 mb-0">
                  選擇後將以此人員為準（優先於上方候選清單的選擇）。
                </p>
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            prepend-icon="mdi-check-bold"
            :loading="isSubmitting"
            :disabled="!finalTargetPhone"
            @click="submitArbitration"
          >
            確認歸屬給「{{ finalTargetName || '—' }}」
          </v-btn>
        </v-card-actions>
      </v-card>

      <!-- 裁決紀錄 -->
      <v-card elevation="2">
        <v-card-title class="text-subtitle-1 font-weight-bold">
          <v-icon start color="grey-darken-1">mdi-history</v-icon>
          裁決紀錄
        </v-card-title>
        <v-card-text>
          <p v-if="sortedLog.length === 0" class="text-body-2 text-grey mb-0">尚無裁決紀錄。</p>
          <v-timeline v-else side="end" density="compact" truncate-line="both">
            <v-timeline-item
              v-for="(log, index) in sortedLog"
              :key="index"
              dot-color="primary"
              size="x-small"
            >
              <div class="text-body-2">
                <span class="font-weight-medium">{{ log.decidedByName }}</span>
                將歸屬由「{{ log.fromSalesName || '未歸屬' }}」改為「{{ log.toSalesName }}」
              </div>
              <div class="text-caption text-grey">{{ formatTime(log.decidedAt) }}</div>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </template>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { fetchVipGuestArbitration, arbitrateVipGuestSales } from '@/api';

const props = defineProps({
  projectId: { type: String, required: true },
  docId: { type: String, required: true }
});

const userStore = useUserStore();

const isLoading = ref(true);
const loadError = ref(null);
const isSubmitting = ref(false);

const projectName = ref('');
const customer = ref({});
const candidates = ref([]);
const allSalesOptions = ref([]);
const arbitrationLog = ref([]);

const selectedSalesPhone = ref('');
const otherSalesPhone = ref(null);

const snackbar = ref({ show: false, text: '', color: 'success' });

// 「其他銷售」下拉排除已在候選清單中的人員
const otherSalesOptions = computed(() => {
  const candidatePhones = new Set(candidates.value.map(c => c.phone).filter(Boolean));
  return allSalesOptions.value.filter(s => !candidatePhones.has(s.phone));
});

// 「其他銷售」有選擇時優先於候選清單
const finalTargetPhone = computed(() => otherSalesPhone.value || selectedSalesPhone.value || '');

const finalTargetName = computed(() => {
  if (!finalTargetPhone.value) return '';
  const fromOther = allSalesOptions.value.find(s => s.phone === finalTargetPhone.value);
  if (fromOther) return fromOther.name;
  const fromCandidate = candidates.value.find(c => c.phone === finalTargetPhone.value);
  return fromCandidate?.name || '';
});

const sortedLog = computed(() =>
  [...arbitrationLog.value].sort((a, b) => (b.decidedAt || 0) - (a.decidedAt || 0))
);

const latestLog = computed(() => sortedLog.value[0] || null);

// 一律以台灣時間顯示
function formatTime(millis) {
  if (!millis) return '未知';
  return new Date(millis).toLocaleString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}

async function loadData() {
  isLoading.value = true;
  loadError.value = null;
  try {
    const result = await fetchVipGuestArbitration(props.projectId, props.docId, userStore.user?.key);
    if (result.status !== 'success') {
      throw new Error(result.message || '載入失敗');
    }
    projectName.value = result.projectName;
    customer.value = result.customer || {};
    candidates.value = result.candidates || [];
    allSalesOptions.value = result.allSalesOptions || [];
    arbitrationLog.value = result.arbitrationLog || [];

    // 預設選中：目前歸屬者；無歸屬時取最新一筆有銷售的提交
    otherSalesPhone.value = null;
    if (customer.value.latestSalesPhone && candidates.value.some(c => c.phone === customer.value.latestSalesPhone)) {
      selectedSalesPhone.value = customer.value.latestSalesPhone;
    } else {
      const latestCandidate = [...candidates.value]
        .filter(c => c.phone)
        .sort((a, b) => (b.lastSubmittedAt || 0) - (a.lastSubmittedAt || 0))[0];
      selectedSalesPhone.value = latestCandidate?.phone || '';
    }
  } catch (error) {
    console.error('載入裁決資料失敗:', error);
    loadError.value = `載入裁決資料失敗：${error.message}`;
  } finally {
    isLoading.value = false;
  }
}

async function submitArbitration() {
  if (!finalTargetPhone.value) return;
  isSubmitting.value = true;
  try {
    const result = await arbitrateVipGuestSales(
      props.projectId,
      props.docId,
      finalTargetPhone.value,
      userStore.user?.key
    );
    if (result.status !== 'success') {
      throw new Error(result.message || '裁決失敗');
    }
    snackbar.value = { show: true, text: `已將客戶歸屬給「${result.toSalesName}」`, color: 'success' };
    await loadData();
  } catch (error) {
    console.error('執行裁決失敗:', error);
    snackbar.value = { show: true, text: `裁決失敗：${error.message}`, color: 'error' };
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(loadData);
</script>
