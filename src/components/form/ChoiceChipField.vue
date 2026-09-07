<template>
  <v-input
    :model-value="modelValue"
    :rules="rules"
    :hide-details="hideDetails"
    class="choice-chip-field mb-3"
    :class="{ 'choice-chip-field--multiple': multiple }"
  >
    <template #default="{ isValid }">
      <div class="choice-chip-field__body" :class="{ 'choice-chip-field__body--error': isValid.value === false }">
        <div class="choice-chip-field__header">
          <span class="choice-chip-field__label">
            {{ label }}
            <span v-if="required" class="choice-chip-field__required">*</span>
          </span>
          <span class="choice-chip-field__meta">
            <template v-if="multiple">
              <template v-if="selectedCount > 0">
                <v-icon size="14" :color="color" class="mr-1">mdi-check-circle</v-icon>{{ selectedText }}
              </template>
              <template v-else>{{ multipleHint }}</template>
            </template>
            <template v-else-if="!selectedCount">{{ singleHint }}</template>
          </span>
        </div>

        <v-chip-group
          :model-value="modelValue"
          :multiple="multiple"
          column
          :color="color"
          class="choice-chip-field__group"
          @update:model-value="onUpdate"
        >
          <v-chip
            v-for="item in normalizedItems"
            :key="item.value"
            :value="item.value"
            filter
            :variant="isSelected(item.value) ? 'flat' : 'outlined'"
            :class="{ 'choice-chip-field__chip--selected': isSelected(item.value) }"
            class="choice-chip-field__chip"
            size="default"
          >
            {{ item.title }}
          </v-chip>
        </v-chip-group>
      </div>
    </template>
  </v-input>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: { type: [Array, String, Number], default: null },
  // 字串陣列，或 { title, value } 物件陣列
  items: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  required: { type: Boolean, default: false },
  multiple: { type: Boolean, default: true },
  rules: { type: Array, default: () => [] },
  color: { type: String, default: 'primary' },
  hideDetails: { type: [Boolean, String], default: 'auto' },
  // 文案可覆寫（貴賓表單有英文模式）
  multipleHint: { type: String, default: '可複選' },
  singleHint: { type: String, default: '請選擇' },
  selectedCountText: { type: Function, default: (n) => `已選 ${n} 項` }
});

const emit = defineEmits(['update:modelValue']);

const normalizedItems = computed(() =>
  props.items.map((item) =>
    item !== null && typeof item === 'object'
      ? { title: item.title ?? String(item.value), value: item.value }
      : { title: String(item), value: item }
  )
);

const selectedCount = computed(() => {
  if (props.multiple) return Array.isArray(props.modelValue) ? props.modelValue.length : 0;
  return props.modelValue ? 1 : 0;
});

const selectedText = computed(() => props.selectedCountText(selectedCount.value));

function isSelected(item) {
  if (props.multiple) return Array.isArray(props.modelValue) && props.modelValue.includes(item);
  return props.modelValue === item;
}

function onUpdate(val) {
  if (props.multiple) {
    emit('update:modelValue', Array.isArray(val) ? val : []);
  } else {
    emit('update:modelValue', val === undefined ? null : val);
  }
}
</script>

<style scoped>
.choice-chip-field :deep(.v-input__control) {
  width: 100%;
}
.choice-chip-field__body {
  width: 100%;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 12px;
  padding: 10px 14px 6px;
  background: #fff;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}
.choice-chip-field__body--error {
  border-color: rgb(var(--v-theme-error));
}
.choice-chip-field__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}
.choice-chip-field__label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.78);
  letter-spacing: 0.02em;
}
.choice-chip-field__required {
  color: rgb(var(--v-theme-error));
  margin-left: 2px;
}
.choice-chip-field__meta {
  font-size: 0.75rem;
  color: rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
}
.choice-chip-field__group :deep(.v-slide-group__content) {
  gap: 4px 0;
}
.choice-chip-field__chip {
  border-radius: 999px;
  transition: all 0.18s ease;
}
.choice-chip-field__chip--selected {
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}
</style>
