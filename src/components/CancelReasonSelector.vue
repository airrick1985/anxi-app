<template>
  <div>
    <v-container class="pa-0">
      <v-row>
        <v-col
          v-for="reason in options"
          :key="reason"
          cols="12"
          sm="6"
          class="pb-2"
        >
          <v-checkbox
            :model-value="modelValue"
            :label="reason"
            :value="reason"
            density="compact"
            hide-details
            @update:model-value="emitValue($event)"
          ></v-checkbox>
        </v-col>
      </v-row>
    </v-container>

    <!-- 自訂原因輸入 -->
    <div class="mt-3">
      <v-text-field
        v-model="customInput"
        label="其他原因（自行輸入後按 Enter 或「新增」）"
        variant="outlined"
        density="compact"
        :maxlength="maxLength"
        :counter="maxLength"
        :error-messages="customError"
        prepend-inner-icon="mdi-pencil-plus-outline"
        @keydown.enter.prevent="addCustomReason"
        @update:model-value="customError = ''"
      >
        <template #append-inner>
          <v-btn
            size="small"
            variant="tonal"
            color="primary"
            :disabled="!customInput.trim()"
            @click="addCustomReason"
          >
            新增
          </v-btn>
        </template>
      </v-text-field>

      <div v-if="customReasons.length > 0" class="d-flex flex-wrap ga-2 mt-1">
        <v-chip
          v-for="reason in customReasons"
          :key="reason"
          size="small"
          color="primary"
          variant="tonal"
          closable
          @click:close="removeReason(reason)"
        >
          {{ reason }}
        </v-chip>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { CANCEL_REASONS, CUSTOM_REASON_MAX_LENGTH } from '@/utils/cancelReasons';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  options: { type: Array, default: () => CANCEL_REASONS },
  maxLength: { type: Number, default: CUSTOM_REASON_MAX_LENGTH },
});

const emit = defineEmits(['update:modelValue']);

const customInput = ref('');
const customError = ref('');

/** 不在預設清單內的原因 → 視為自訂原因，以 chip 顯示 */
const customReasons = computed(() =>
  (props.modelValue || []).filter(r => !props.options.includes(r))
);

function emitValue(value) {
  emit('update:modelValue', Array.isArray(value) ? value : []);
}

function addCustomReason() {
  const text = customInput.value.trim().replace(/\s+/g, ' ');
  if (!text) return;
  if (text.length > props.maxLength) {
    customError.value = `最多 ${props.maxLength} 字`;
    return;
  }
  const current = props.modelValue || [];
  if (current.includes(text)) {
    customError.value = '此原因已加入';
    return;
  }
  emitValue([...current, text]);
  customInput.value = '';
  customError.value = '';
}

function removeReason(reason) {
  emitValue((props.modelValue || []).filter(r => r !== reason));
}
</script>
