<template>
  <div class="formula-editor pa-4">
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

    <!-- 工具區：參照、運算子、括號、數字 -->
    <div class="text-subtitle-2 mb-2">
      <v-icon size="small" class="mr-1">mdi-tools</v-icon>
      加入 token
    </div>

    <!-- 參照（主要）-->
    <div class="token-group-label">主要參照</div>
    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-btn v-for="ref in primaryRefs" :key="ref.key"
        size="small" variant="tonal" color="primary"
        @click="appendToken({ type: 'ref', key: ref.key })">
        {{ ref.label }}
        <span class="text-caption ml-1 opacity-70">({{ ref.unit }})</span>
      </v-btn>
    </div>

    <!-- 參照（結果）-->
    <div class="token-group-label">
      結果參照
      <span class="text-caption text-grey">（可在本公式中引用另一支公式的結果）</span>
    </div>
    <div class="d-flex flex-wrap ga-2 mb-3">
      <v-btn v-for="ref in resultRefs" :key="ref.key"
        size="small" variant="tonal" color="deep-purple"
        @click="appendToken({ type: 'ref', key: ref.key })">
        {{ ref.label }}
      </v-btn>
    </div>

    <!-- 運算子 -->
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

    <!-- 自訂數字 -->
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

    <v-divider class="my-4" />

    <!-- 即時預覽 -->
    <div class="text-subtitle-2 mb-2">
      <v-icon size="small" class="mr-1">mdi-eye-outline</v-icon>
      即時預覽（示範資料）
    </div>
    <div class="preview-panel">
      <div class="preview-line">
        <span class="text-grey">示範資料：</span>
        <span>成交總價 1000萬 · 車位總價 150萬 · 房屋比 59% · 土地比 41%</span>
      </div>
      <div class="preview-line mt-2">
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
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  REF_DEFINITIONS,
  OP_OPTIONS,
  ROUNDING_MODES,
  formulaToDisplayString,
  roundingToDisplayString,
  validateFormula,
  evaluateFormulaWithContext,
} from '@/composables/usePriceFormula';

const props = defineProps({
  formula: { type: Object, required: true },       // { tokens, rounding }
  formulaName: { type: String, required: true },   // '房屋價款' | '土地價款'
  previewContext: { type: Object, required: true },
  otherResult: { type: Number, default: 0 },
  otherResultLabel: { type: String, default: '' },
});
const emit = defineEmits(['update']);

const DECIMAL_OPTIONS = [0, 1, 2, 3];

const customNumber = ref(0);

const tokens = computed(() => props.formula?.tokens || []);
const primaryRefs = REF_DEFINITIONS.filter(r => r.group === 'primary');
const resultRefs  = REF_DEFINITIONS.filter(r => r.group === 'result');

const valid = computed(() => validateFormula(props.formula));
const displayString = computed(() => formulaToDisplayString(props.formula));
const roundingDisplay = computed(() => roundingToDisplayString(props.formula.rounding));

function tokenLabel(t) {
  if (t.type === 'ref') {
    const r = REF_DEFINITIONS.find(x => x.key === t.key);
    return r ? r.label : t.key;
  }
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
    const r = REF_DEFINITIONS.find(x => x.key === t.key);
    return r?.group === 'result' ? 'deep-purple' : 'primary';
  }
  if (t.type === 'op') return 'grey-darken-2';
  if (t.type === 'paren') return 'grey';
  if (t.type === 'number') return 'orange-darken-2';
  return 'default';
}

function commit(newFormula) {
  emit('update', newFormula);
}

function appendToken(tok) {
  const next = {
    ...props.formula,
    tokens: [...tokens.value, tok],
  };
  commit(next);
}

function removeToken(idx) {
  const next = {
    ...props.formula,
    tokens: tokens.value.filter((_, i) => i !== idx),
  };
  commit(next);
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
  const next = {
    ...props.formula,
    rounding: { ...(props.formula.rounding || { mode: 'round', decimals: 0 }), [field]: value },
  };
  commit(next);
}

// 進位範例文字（視覺化給使用者看進位效果）
const roundingSample = computed(() => {
  const mode = props.formula?.rounding?.mode || 'round';
  const d = Number(props.formula?.rounding?.decimals) || 0;
  const factor = Math.pow(10, d);
  const sample = 123.4567;
  let result;
  if (mode === 'ceil')  result = Math.ceil(sample * factor) / factor;
  else if (mode === 'floor') result = Math.floor(sample * factor) / factor;
  else result = Math.round(sample * factor) / factor;
  return `123.4567 → ${result}`;
});

// 計算預覽：以 previewContext + 當前公式即時算值
// 另一支公式的結果由 otherResult 直接注入 context（不再走 computeHouseLandPrices
// 的依賴推導，也不會被二次進位）
const computedPreview = computed(() => {
  if (!valid.value.valid) return '—';
  const u = props.previewContext.unitData;
  const parking = Array.isArray(u?.['持有車位'])
    ? u['持有車位'].reduce((s, p) => s + (Number(p?.['車位成交價']) || 0), 0)
    : 0;
  const ctx = {
    total:      Number(u?.price_transaction_total) || 0,
    parking,
    houseRatio: Number(u?.housePriceRatio) || 0,
    landRatio:  Number(u?.landPriceRatio)  || 0,
    // 本公式參照「另一支公式」時，直接用 otherResult（已由 PriceFormulaDialog 依完整 draft 算好）
    housePrice: props.formulaName === '土地價款' ? (Number(props.otherResult) || 0) : 0,
    landPrice:  props.formulaName === '房屋價款' ? (Number(props.otherResult) || 0) : 0,
  };
  const v = evaluateFormulaWithContext(props.formula, ctx);
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
.preview-line {
  line-height: 1.8;
}
</style>
