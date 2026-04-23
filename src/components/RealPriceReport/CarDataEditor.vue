<template>
  <div class="car-data-editor">
    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold flex-grow-1">車位資料 ({{ rows.length }} 筆)</div>
      <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" @click="addRow">新增一筆</v-btn>
    </div>
    <v-card v-for="(row, idx) in rows" :key="idx" variant="outlined" class="mb-3">
      <v-card-title class="d-flex align-center py-2">
        <v-chip size="small" color="primary" variant="flat" class="mr-2">#{{ idx + 1 }}</v-chip>
        <span class="text-subtitle-2">{{ row._spotId || '車位' }}</span>
        <v-spacer />
        <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="idx === 0" @click="move(idx, -1)" />
        <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="idx === rows.length - 1" @click="move(idx, 1)" />
        <v-btn icon="mdi-delete" color="error" size="x-small" variant="text" @click="removeRow(idx)" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row dense>
          <template v-for="f in schema" :key="f.key">
            <!-- 代碼欄位 (car_type / car_floor)：隱藏，由對應名稱欄位的 select 自動填入代碼 -->
            <template v-if="isAutoFilledCodeField(f.key)" />
            <!-- 「其他(自訂)」欄位：僅當 car_type === '7' (其他) 才顯示 -->
            <template v-else-if="f.key === 'car_typeText' && row.car_type !== '7'" />
            <!-- 名稱欄位 (car_typec / car_floorc)：以下拉呈現，items 取自對應代碼欄位的 options -->
            <v-col v-else-if="isNameDropdownField(f.key)" cols="12" sm="6" md="4">
              <v-select
                :model-value="row[f.key]"
                :items="getNameOptionsFor(f.key)"
                item-title="label" item-value="label"
                :label="f.label"
                variant="outlined" density="compact" clearable
                @update:model-value="onNameSelectChange(idx, f.key, $event)" />
            </v-col>
            <!-- 其餘一般欄位 -->
            <v-col v-else cols="12" sm="6" md="4">
              <v-text-field
                v-model="row[f.key]"
                :label="f.label"
                :type="f.type === 'number' ? 'number' : 'text'"
                variant="outlined"
                density="compact"
                clearable
              />
            </v-col>
          </template>
        </v-row>
      </v-card-text>
    </v-card>
    <v-alert v-if="rows.length === 0" type="info" variant="tonal" density="compact">
      目前無車位資料。
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { CAR_DATA_SCHEMA, buildEmptyCarRow } from '@/constants/realPriceReportSchema';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const schema = CAR_DATA_SCHEMA;
const rows = ref([]);

watch(() => props.modelValue, (val) => {
  rows.value = Array.isArray(val) ? val.map(r => ({ ...buildEmptyCarRow(), ...(r || {}) })) : [];
}, { immediate: true, deep: true });

watch(rows, (val) => {
  emit('update:modelValue', val.map(r => ({ ...r })));
}, { deep: true });

// UI 呈現策略：
//   下拉選單給使用者選的是「名稱」欄位 (car_typec / car_floorc)，視覺上更直觀；
//   對應的「代碼」欄位 (car_type / car_floor) 隱藏，由選單變動時自動同步填入。
// 名稱 ↔ 代碼 的配對對照表
const NAME_TO_CODE_MAP = {
  car_typec: 'car_type',
  car_floorc: 'car_floor',
};
const CODE_FIELDS_AUTO_FILLED = new Set(Object.values(NAME_TO_CODE_MAP));
const NAME_DROPDOWN_FIELDS = new Set(Object.keys(NAME_TO_CODE_MAP));

function isAutoFilledCodeField(key) { return CODE_FIELDS_AUTO_FILLED.has(key); }
function isNameDropdownField(key)   { return NAME_DROPDOWN_FIELDS.has(key); }
function nameToCodeKey(nameKey)     { return NAME_TO_CODE_MAP[nameKey] || ''; }

// 取名稱下拉的 options：沿用 schema 中對應「代碼欄位」的 options
function getNameOptionsFor(nameKey) {
  const codeKey = nameToCodeKey(nameKey);
  const codeField = schema.find(f => f.key === codeKey);
  return codeField?.options || [];
}

// 名稱 select 變動時，同步填入代碼欄位（以名稱反查 option.value）
// 額外：car_typec 切換到非「其他」時，清空 car_typeText 自訂欄位
function onNameSelectChange(idx, nameKey, label) {
  const codeKey = nameToCodeKey(nameKey);
  const options = getNameOptionsFor(nameKey);
  const opt = options.find(o => o.label === label);
  const row = { ...rows.value[idx] };
  row[nameKey] = label || '';
  row[codeKey] = opt ? opt.value : '';
  if (codeKey === 'car_type' && row.car_type !== '7') {
    row.car_typeText = '';
  }
  rows.value[idx] = row;
}

function addRow() {
  rows.value.push({ ...buildEmptyCarRow(), car_type: '1', car_typec: '坡道平面' });
}
function removeRow(i) {
  rows.value.splice(i, 1);
}
function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= rows.value.length) return;
  const arr = rows.value.slice();
  [arr[i], arr[j]] = [arr[j], arr[i]];
  rows.value = arr;
}
</script>
