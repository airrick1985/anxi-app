<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="600px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 error-title">
        <v-icon left color="white">mdi-alert-circle-outline</v-icon>
        <span class="ml-2">{{ title }}</span>
      </v-card-title>

      <v-card-text class="py-4">
        <div class="text-body-2" v-html="message"></div>

        <!-- 退戶日期選擇 -->
        <div class="mt-4 mb-4">
          <p class="font-weight-bold mb-2">退戶日期</p>
          <v-text-field
            v-model="selectedDate"
            type="date"
            variant="outlined"
            density="compact"
          ></v-text-field>
        </div>

        <div v-if="showReasonSelection" class="mt-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <p class="font-weight-bold">請選擇退戶原因（可複選）</p>
            <v-chip
              label
              color="error"
              text-color="white"
              size="small"
            >
              至少須選一項
            </v-chip>
          </div>
          <v-container class="pa-0">
            <v-row>
              <v-col
                v-for="reason in cancelReasons"
                :key="reason"
                cols="12"
                sm="6"
                class="pb-2"
              >
                <v-checkbox
                  :model-value="selectedReasons"
                  :label="reason"
                  :value="reason"
                  @update:model-value="updateSelectedReasons"
                  density="compact"
                  hide-details
                ></v-checkbox>
              </v-col>
            </v-row>
          </v-container>
          <v-alert
            v-if="showReasonError"
            type="error"
            variant="tonal"
            class="mt-3"
            density="compact"
            icon="mdi-alert-circle"
          >
            請至少選擇一項退戶原因
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="$emit('cancel')"
        >
          取消
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          @click="handleConfirm"
          :loading="loading"
          :disabled="isConfirmDisabled"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch, computed } from 'vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: '確認辦理退戶' },
  message: { type: String, required: true },
  confirmText: { type: String, default: '確認退戶' },
  confirmColor: { type: String, default: 'error' },
  loading: { type: Boolean, default: false },
  showReasonSelection: { type: Boolean, default: true }
});

const emit = defineEmits(['update:show', 'confirm', 'cancel']);

const selectedReasons = ref([]);
const selectedDate = ref(getTodayDate());
const showReasonError = ref(false);

// 計算是否應該禁用確認按鈕
const isConfirmDisabled = computed(() => {
  // 如果不需要顯示原因選擇，不禁用
  if (!props.showReasonSelection) return false;
  // 如果沒有選擇任何原因，禁用
  return selectedReasons.value.length === 0;
});

// 退戶原因選項
const cancelReasons = [
  '總價太高',
  '單價太高',
  '自備款不足',
  '貸款成數太少',
  '地點不符',
  '家人反對',
  '家人意外、重病',
  '資金斷鏈',
  '神明指示',
  '風水忌諱',
  '生活機能不足',
  '環境不喜歡',
  '換戶',
  '景氣不好',
  '工期太久',
  '財務規劃暫不買房'
];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function updateSelectedReasons(value) {
  selectedReasons.value = value;
  // 清除錯誤提示
  showReasonError.value = false;
}

function handleConfirm() {
  // 驗證：如果需要選擇原因且未選擇，顯示錯誤
  if (props.showReasonSelection && selectedReasons.value.length === 0) {
    showReasonError.value = true;
    return;
  }

  // 驗證通過，發送確認事件
  emit('confirm', { reasons: selectedReasons.value, date: selectedDate.value });
}

// 重置選項和日期
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedReasons.value = [];
    selectedDate.value = getTodayDate();
    showReasonError.value = false;
  }
});
</script>

<style scoped>
.error-title {
  background-color: #D32F2F; /* Vuetify's error color */
  color: white;
}

:deep(strong) {
  color: #1976d2;
  font-weight: 600;
}
</style>
