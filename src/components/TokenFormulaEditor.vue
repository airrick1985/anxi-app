<template>
  <div class="token-formula-editor">
    <!-- 目前公式 -->
    <div class="text-subtitle-2 mb-2">
      <v-icon size="small" class="mr-1">mdi-function-variant</v-icon>
      {{ formulaName }}公式
    </div>
    <div class="token-chip-area">
      <template v-if="tokens.length === 0">
        <span class="text-caption text-grey">(尚未加入任何 token，請由下方工具區點擊加入)</span>
      </template>
      <v-chip v-for="(t, idx) in tokens" :key="idx"
        :color="tokenColor(t)"
        size="default"
        closable
        @click:close="removeToken(idx)">
        {{ tokenLabel(t) }}
      </v-chip>
      <v-btn v-if="tokens.length > 0"
        variant="text" size="small" color="error"
        prepend-icon="mdi-trash-can-outline"
        @click="clearAll">清空</v-btn>
    </div>

    <v-alert v-if="!valid.valid" type="error" variant="tonal" density="compact" class="mt-3" icon="mdi-alert-circle">
      公式無效：{{ valid.message }}
    </v-alert>

    <v-divider class="my-4" />

    <!-- 工具區 -->
    <div class="text-subtitle-2 mb-2">
      <v-icon size="small" class="mr-1">mdi-tools</v-icon>
      加入 token
    </div>

    <template v-for="group in refGroups" :key="group.label">
      <div class="token-group-label">{{ group.label }}</div>
      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-btn v-for="r in group.refs" :key="r.key"
          size="small" variant="tonal" :color="group.color || 'primary'"
          @click="appendToken({ type: 'ref', key: r.key })">
          {{ r.label }}
          <span v-if="r.unit" class="text-caption ml-1 opacity-70">({{ r.unit }})</span>
        </v-btn>
      </div>
    </template>

    <div class="token-group-label">運算子</div>
    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-btn v-for="op in OP_OPTIONS" :key="op.op"
        size="small" variant="tonal" color="grey-darken-2"
        @click="appendToken({ type: 'op', op: op.op })">
        {{ op.label }}
      </v-btn>
      <v-btn size="small" variant="tonal" color="grey-darken-2"
        @click="appendToken({ type: 'paren', value: '(' })">(</v-btn>
      <v-btn size="small" variant="tonal" color="grey-darken-2"
        @click="appendToken({ type: 'paren', value: ')' })">)</v-btn>
    </div>

    <div class="token-group-label">自訂數字</div>
    <div class="d-flex align-center ga-2 mb-3" style="max-width: 360px;">
      <v-text-field
        v-model.number="customNumber"
        type="number"
        step="any"
        placeholder="輸入數字後按加入"
        density="compact" variant="outlined"
        hide-details
        @keydown.enter.prevent="addCustomNumber" />
      <v-btn size="small" color="primary" variant="flat"
        :disabled="!Number.isFinite(Number(customNumber))"
        @click="addCustomNumber">加入</v-btn>
    </div>

    <v-divider class="my-4" />

    <!-- 進位設定 -->
    <div class="text-subtitle-2 mb-2">
      <v-icon size="small" class="mr-1">mdi-decimal</v-icon>
      進位設定
    </div>
    <v-row dense>
      <v-col cols="12" md="4">
        <v-select
          :model-value="formula.rounding?.mode || 'round'"
          :items="ROUNDING_MODES" item-title="label" item-value="value"
          label="進位方式"
          density="compact" variant="outlined" hide-details
          @update:model-value="setRounding('mode', $event)" />
      </v-col>
      <v-col cols="12" md="4">
        <v-select
          :model-value="formula.rounding?.decimals ?? 0"
          :items="DECIMAL_OPTIONS"
          label="小數位數"
          density="compact" variant="outlined" hide-details
          @update:model-value="setRounding('decimals', Number($event))" />
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center">
        <span class="text-caption text-grey">例：{{ roundingSample }}</span>
      </v-col>
    </v-row>

    <template v-if="previewContext">
      <v-divider class="my-4" />
      <div class="text-subtitle-2 mb-2">
        <v-icon size="small" class="mr-1">mdi-eye-outline</v-icon>
        即時預覽
      </div>
      <div class="preview-panel">
        <div v-if="previewLabel" class="preview-line">
          <span class="text-grey">試算資料：</span>
          <span>{{ previewLabel }}</span>
        </div>
        <div class="preview-line mt-1">
          <span class="text-grey">公式：</span>
          <span>{{ displayString }}</span>
        </div>
        <div class="preview-line">
          <span class="text-grey">進位：</span>
          <span>{{ roundingDisplay }}</span>
        </div>
        <div class="preview-line mt-2 font-weight-bold text-primary">
          計算結果：
          <span v-if="!valid.valid" class="text-error">公式無效</span>
          <span v-else>{{ computedPreview }} 萬</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  OP_OPTIONS,
  ROUNDING_MODES,
  formulaToDisplayString,
  roundingToDisplayString,
  validateFormula,
  evaluateFormulaWithContext,
  refDefinitionsToMap,
} from '@/composables/usePriceFormula';

const props = defineProps({
  formula: { type: Object, required: true },        // { tokens, rounding }
  formulaName: { type: String, required: true },
  // [{ label: '基礎變數', color: 'primary', refs: [{ key, label, unit }] }]
  refGroups: { type: Array, required: true },
  previewContext: { type: Object, default: () => null },  // 扁平 context；null 則不顯示預覽
  previewLabel: { type: String, default: '' },
});
const emit = defineEmits(['update']);

const DECIMAL_OPTIONS = [0, 1, 2, 3];
const customNumber = ref(0);

const tokens = computed(() => props.formula?.tokens || []);
const allRefs = computed(() => props.refGroups.flatMap(g => g.refs || []));
const refMap = computed(() => refDefinitionsToMap(allRefs.value));

const valid = computed(() => validateFormula(props.formula));
const displayString = computed(() => formulaToDisplayString(props.formula, refMap.value));
const roundingDisplay = computed(() => roundingToDisplayString(props.formula.rounding));

function tokenLabel(t) {
  if (t.type === 'ref') return refMap.value[t.key]?.label || t.key;
  if (t.type === 'op') {
    const o = OP_OPTIONS.find(x => x.op === t.op);
    return o ? o.label : t.op;
  }
  if (t.type === 'paren') return t.value;
  if (t.type === 'number') return String(t.value);
  return '?';
}

function tokenColor(t) {
  if (t.type === 'ref') {
    const g = props.refGroups.find(gr => (gr.refs || []).some(r => r.key === t.key));
    return g?.color || 'primary';
  }
  if (t.type === 'op') return 'grey-darken-2';
  if (t.type === 'paren') return 'grey';
  if (t.type === 'number') return 'orange-darken-2';
  return 'default';
}

function commit(next) { emit('update', next); }

function appendToken(tok) {
  commit({ ...props.formula, tokens: [...tokens.value, tok] });
}

function removeToken(idx) {
  commit({ ...props.formula, tokens: tokens.value.filter((_, i) => i !== idx) });
}

function clearAll() {
  if (!window.confirm('確認清空所有 token？')) return;
  commit({ ...props.formula, tokens: [] });
}

function addCustomNumber() {
  const n = Number(customNumber.value);
  if (!Number.isFinite(n)) return;
  appendToken({ type: 'number', value: n });
  customNumber.value = 0;
}

function setRounding(field, value) {
  commit({
    ...props.formula,
    rounding: { ...(props.formula.rounding || { mode: 'round', decimals: 0 }), [field]: value },
  });
}

const roundingSample = computed(() => {
  const mode = props.formula?.rounding?.mode || 'round';
  const d = Number(props.formula?.rounding?.decimals) || 0;
  const factor = Math.pow(10, d);
  const sample = 123.4567;
  let result;
  if (mode === 'ceil') result = Math.ceil(sample * factor) / factor;
  else if (mode === 'floor') result = Math.floor(sample * factor) / factor;
  else result = Math.round(sample * factor) / factor;
  return `123.4567 → ${result}`;
});

const computedPreview = computed(() => {
  if (!valid.value.valid || !props.previewContext) return '—';
  const v = evaluateFormulaWithContext(props.formula, props.previewContext);
  return Number.isFinite(v) ? v : '—';
});
</script>

<style scoped>
.token-chip-area {
  min-height: 44px;
  border: 1px dashed #bbb;
  border-radius: 8px;
  padding: 8px 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  background: #fafafa;
}
.token-group-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}
.preview-panel {
  background: #f5f5f7;
  border-radius: 8px;
  padding: 12px 16px;
  font-size: 0.9rem;
}
.preview-line { line-height: 1.8; }
</style>
