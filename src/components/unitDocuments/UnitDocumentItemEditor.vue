<template>
  <div class="udie">
    <div v-if="item.status === 'done'" class="udie-done">
      <v-icon size="16" color="#34c759">mdi-check-circle</v-icon>
      <span>已存為 <b>{{ item.resultName }}</b></span>
    </div>

    <template v-else-if="!item.blocked">
      <div class="udie-row">
        <label class="udie-label" :for="nameId">名稱</label>
        <v-text-field
          :id="nameId"
          ref="nameField"
          :model-value="item.baseName"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="mac-vfield udie-field"
          :suffix="item.ext ? `.${item.ext}` : ''"
          :disabled="disabled"
          :error="!nameValid"
          enterkeyhint="next"
          @update:model-value="v => emit('update:name', v)"
          @keydown.enter.prevent="emit('next')"
        >
          <template v-if="item.nameTouched && !disabled" #append-inner>
            <button type="button" class="mac-icon-btn udie-reset" title="恢復自動名稱" @click.stop="emit('reset-name')">
              <v-icon size="16">mdi-restore</v-icon>
            </button>
          </template>
        </v-text-field>
      </div>

      <div class="udie-row udie-row--top">
        <span class="udie-label">種類</span>
        <div class="udie-types">
          <div class="udt-pills">
            <button
              v-for="t in UNIT_DOCUMENT_TYPES"
              :key="t.key"
              type="button"
              class="udt-pill"
              :class="[`udt--${t.tone}`, { 'is-active': item.docType === t.key }]"
              :disabled="disabled"
              @click="emit('update:type', t.key)"
            >
              {{ t.label }}
            </button>
          </div>
          <v-text-field
            v-if="isCustom"
            :model-value="item.customLabel"
            placeholder="自訂種類"
            variant="solo"
            flat
            density="compact"
            hide-details
            class="mac-vfield udie-custom"
            :maxlength="UNIT_DOCUMENT_CUSTOM_LABEL_MAX"
            :disabled="disabled"
            :error="!customValid"
            @update:model-value="v => emit('update:custom-label', v)"
          />
        </div>
      </div>
    </template>

    <div class="udie-info">
      <span class="udie-orig">{{ item.file.name }}</span>
      <span>{{ sizeText }}</span>
      <span v-if="item.pages">{{ item.pages }} 頁</span>
    </div>
    <div v-if="item.blocked" class="udie-error">{{ item.blocked }}</div>
    <div v-else-if="item.status === 'error' && item.error" class="udie-error">{{ item.error }}</div>
    <div v-else-if="item.prepNote" class="udie-note">{{ item.prepNote }}</div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import '@/styles/unitDocuments.css';
import {
  UNIT_DOCUMENT_TYPES,
  UNIT_DOCUMENT_CUSTOM_LABEL_MAX,
  getDocTypeMeta,
  sanitizeFileNameSegment,
  formatFileSize,
} from '@/utils/unitDocuments';

const props = defineProps({
  item: { type: Object, required: true },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['update:name', 'reset-name', 'update:type', 'update:custom-label', 'next']);

const nameId = `udie-name-${Math.random().toString(36).slice(2, 8)}`;
const nameField = ref(null);

const isCustom = computed(() => !!getDocTypeMeta(props.item.docType).custom);
const nameValid = computed(() => !!sanitizeFileNameSegment(props.item.baseName));
const customValid = computed(() => !!sanitizeFileNameSegment(props.item.customLabel, UNIT_DOCUMENT_CUSTOM_LABEL_MAX));

const sizeText = computed(() => {
  const it = props.item;
  const original = it.file?.size || 0;
  const finalBlob = it.out || it.source || it.file;
  const final = finalBlob?.size || original;
  if (final && final !== original) return `${formatFileSize(original)} → ${formatFileSize(final)}`;
  return formatFileSize(original);
});

defineExpose({
  focusName: () => nameField.value?.focus?.(),
});
</script>

<style scoped>
.udie {
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 13px;
  color: #1d1d1f;
}
.udie-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.udie-row--top { align-items: flex-start; }
.udie-row--top .udie-label { padding-top: 5px; }
.udie-label {
  flex-shrink: 0;
  width: 34px;
  color: #6e6e73;
  font-size: 12.5px;
  font-weight: 600;
}
.udie-field,
.udie-types { flex: 1 1 auto; min-width: 0; }
.udie-field :deep(.v-field__input) { font-variant-numeric: tabular-nums; }
.udie-field :deep(.v-text-field__suffix) { color: #8e8e93; padding-left: 2px; }
.udie-reset { width: 24px; height: 24px; }
.udie-custom { margin-top: 8px; max-width: 260px; }
.udie-info {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  padding-left: 44px;
  color: #6e6e73;
  font-size: 12px;
}
.udie-orig { overflow-wrap: anywhere; }
.udie-error,
.udie-note {
  padding-left: 44px;
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
.udie-error { color: #d62d20; }
.udie-note { color: #9a5b00; }
.udie-done {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  overflow-wrap: anywhere;
}

@media (max-width: 600px) {
  .udie-row { flex-direction: column; align-items: stretch; gap: 5px; }
  .udie-row--top .udie-label { padding-top: 0; }
  .udie-info, .udie-error, .udie-note { padding-left: 0; }
  .udie-custom { max-width: none; }
}
</style>
