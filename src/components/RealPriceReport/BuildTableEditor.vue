<template>
  <div class="build-table-editor">
    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold flex-grow-1">建物標的 ({{ rows.length }} 筆)</div>
      <v-btn size="small" color="primary" variant="flat" prepend-icon="mdi-plus" @click="addRow">新增一筆</v-btn>
    </div>

    <v-alert type="info" density="compact" variant="tonal" class="mb-3">
      107/01/01 以後申請建造執照者，免填屋簷及雨遮面積。
    </v-alert>

    <v-card v-for="(row, idx) in rows" :key="idx" variant="outlined" class="mb-3">
      <v-card-title class="d-flex align-center py-2">
        <v-chip size="small" color="primary" variant="flat" class="mr-2">#{{ idx + 1 }}</v-chip>
        <span class="text-subtitle-2">建物 {{ idx + 1 }}</span>
        <v-chip v-if="idx === 0" size="x-small" color="success" variant="flat" class="ml-2">此筆將輸出至 JSON</v-chip>
        <v-spacer />
        <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="idx === 0" @click="move(idx, -1)" />
        <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="idx === rows.length - 1" @click="move(idx, 1)" />
        <v-btn icon="mdi-delete" color="error" size="x-small" variant="text" :disabled="rows.length === 1" @click="removeRow(idx)" />
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-row dense>
          <v-col v-for="f in schema" :key="f.key" cols="12" sm="6" md="4" lg="3">
            <v-text-field
              v-model="row[f.key]"
              :label="f.label"
              :hint="f.key"
              :type="f.type === 'number' ? 'number' : 'text'"
              persistent-hint
              variant="outlined"
              density="compact"
              clearable
              @blur="onFieldBlur(idx, f.key)"
            />
          </v-col>
          <v-col cols="12" sm="6" md="4" lg="3">
            <v-text-field
              :model-value="totalArea(row)"
              label="交易總面積(m²)"
              hint="自動計算 (主+陽+屋簷+雨遮+共有)"
              persistent-hint
              variant="outlined"
              density="compact"
              readonly
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="rows.length === 0" type="warning" variant="tonal" density="compact">
      無建物資料，請點選上方「新增一筆」。
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { BUILD_DATA_SCHEMA, buildEmptyBuildData } from '@/constants/realPriceReportSchema';

const props = defineProps({
  modelValue: { type: Array, default: () => [{}] },
});
const emit = defineEmits(['update:modelValue']);

const schema = BUILD_DATA_SCHEMA;
const rows = ref([]);

// 將 null/undefined/空字串統一視為「空」，填入 '0' 以符合匯出規格
function fillEmptyWithZero(row) {
  const out = { ...row };
  schema.forEach(f => {
    const v = out[f.key];
    if (v === null || v === undefined || String(v).trim() === '') out[f.key] = '0';
  });
  return out;
}

// 失焦時：該欄位若為空值 → 自動填 0
function onFieldBlur(idx, key) {
  const r = rows.value[idx];
  if (!r) return;
  const v = r[key];
  if (v === null || v === undefined || String(v).trim() === '') {
    rows.value[idx] = { ...r, [key]: '0' };
  }
}

watch(() => props.modelValue, (val) => {
  const arr = Array.isArray(val) && val.length ? val : [{}];
  // 載入時將空值一併補 0，確保從一開始就符合匯出規格
  rows.value = arr.map(r => fillEmptyWithZero({ ...buildEmptyBuildData(), ...(r || {}) }));
}, { immediate: true, deep: true });

watch(rows, (val) => {
  emit('update:modelValue', val.map(r => ({ ...r })));
}, { deep: true });

function totalArea(row) {
  const sum = schema.reduce((s, f) => {
    const n = Number(row[f.key]);
    return s + (isFinite(n) ? n : 0);
  }, 0);
  return sum ? sum.toFixed(2) : '';
}

function addRow() { rows.value.push(fillEmptyWithZero(buildEmptyBuildData())); }
function removeRow(i) { if (rows.value.length > 1) rows.value.splice(i, 1); }
function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= rows.value.length) return;
  const arr = rows.value.slice();
  [arr[i], arr[j]] = [arr[j], arr[i]];
  rows.value = arr;
}
</script>
