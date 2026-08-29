<template>
  <v-dialog :model-value="modelValue" max-width="480" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2" :color="meta.color">{{ meta.icon }}</v-icon>
        新增{{ meta.label }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="emit('update:modelValue', false)" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-text-field
          v-model="atInput"
          type="datetime-local"
          label="時間（台灣時間）"
          variant="outlined"
          density="compact"
          class="mb-2"
        />
        <v-textarea
          v-model="text"
          :label="type === 'reply' ? '回覆摘要（選填）' : '內容'"
          variant="outlined"
          density="compact"
          rows="3"
          auto-grow
          autofocus
          @keydown.ctrl.enter.prevent="submit"
        />
        <v-alert v-if="type === 'reply'" type="info" variant="tonal" density="compact">
          標記已回覆會寫入回覆日，若目前狀態為「未聯絡／已寄信」將自動改為「已回覆」。
        </v-alert>
      </v-card-text>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">取消</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!canSubmit" @click="submit">新增</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { formatInTimeZone } from 'date-fns-tz';
import { PROSPECT_EVENT_LABELS } from '@/services/prospectService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** call | line | meeting | note | reply */
  type: { type: String, default: 'note' },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const meta = computed(() => PROSPECT_EVENT_LABELS[props.type] || PROSPECT_EVENT_LABELS.note);
const atInput = ref('');
const text = ref('');

watch(() => props.modelValue, (open) => {
  if (open) {
    atInput.value = formatInTimeZone(new Date(), 'Asia/Taipei', "yyyy-MM-dd'T'HH:mm");
    text.value = '';
  }
});

const canSubmit = computed(() => !!atInput.value && (props.type === 'reply' || !!text.value.trim()));

function submit() {
  if (!canSubmit.value) return;
  const at = new Date(`${atInput.value}:00+08:00`);
  emit('submit', { type: props.type, at: Number.isNaN(at.getTime()) ? new Date() : at, text: text.value.trim() });
  emit('update:modelValue', false);
}
</script>
