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
          <p class="font-weight-bold mb-3">請選擇退戶原因（可複選）</p>
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
          @click="$emit('confirm', { reasons: selectedReasons, date: selectedDate })"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits, ref, watch } from 'vue';

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
}

// 重置選項和日期
watch(() => props.show, (newVal) => {
  if (newVal) {
    selectedReasons.value = [];
    selectedDate.value = getTodayDate();
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
