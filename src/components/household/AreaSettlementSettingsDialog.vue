<template>
  <v-dialog :model-value="modelValue" max-width="480" scrollable content-class="mac-dialog-fit" @update:model-value="close">
    <v-card class="mac-sheet ass">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-tune-variant</v-icon>
        <span>面積找補設定</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="close"><v-icon size="18">mdi-close</v-icon></button>
      </div>

      <div class="mac-form ass-body">
        <div class="mac-form-label">單據</div>
        <div class="mac-form-group">
          <label class="mac-form-row">
            <span class="mac-form-row-label">標題</span>
            <input v-model.trim="form.title" class="mac-form-input" :placeholder="defaultTitle">
          </label>
          <label class="mac-form-row">
            <span class="mac-form-row-label">大公面積</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <input v-model="form.publicArea" inputmode="decimal"><span>㎡</span>
            </span>
          </label>
          <label class="mac-form-row">
            <span class="mac-form-row-label">持分分母</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <span>/</span><input v-model="form.shareDen" inputmode="numeric">
            </span>
          </label>
        </div>

        <div class="mac-form-label">計算</div>
        <div class="mac-form-group">
          <label class="mac-form-row">
            <span class="mac-form-row-label">房屋價款比例</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <input v-model="form.buildingPct" inputmode="decimal"><span>%</span>
            </span>
          </label>
          <label class="mac-form-row">
            <span class="mac-form-row-label">陽台公設折算</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <span>×</span><input v-model="form.sideRatio" inputmode="decimal">
            </span>
          </label>
          <label class="mac-form-row">
            <span class="mac-form-row-label">找補上限</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <input v-model="form.capPct" inputmode="decimal"><span>%</span>
            </span>
          </label>
          <label class="mac-form-row">
            <span class="mac-form-row-label">實收比例</span>
            <span class="mac-form-input mac-form-unit ass-unit">
              <input v-model="form.payPct" inputmode="decimal"><span>%</span>
            </span>
          </label>
        </div>

        <div v-if="error" class="mac-callout mac-callout--error ass-error">
          <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ error }}</span>
        </div>
      </div>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" @click="resetAll">還原預設</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" @click="save">儲存</button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { DEFAULT_AREA_SETTINGS, toNumber } from '@/utils/areaSettlement';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  settings: { type: Object, required: true }, // resolveAreaSettings() 結果
  defaultTitle: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'save']);

const str = (v) => (v === null || v === undefined ? '' : String(v));
const form = reactive({
  title: props.settings.title,
  publicArea: str(props.settings.publicArea),
  shareDen: str(props.settings.shareDen),
  buildingPct: str(props.settings.buildingPct),
  sideRatio: str(props.settings.sideRatio),
  capPct: str(props.settings.capPct),
  payPct: str(props.settings.payPct),
});
const error = ref('');

const resetAll = () => {
  form.title = '';
  form.shareDen = str(DEFAULT_AREA_SETTINGS.shareDen);
  form.buildingPct = str(DEFAULT_AREA_SETTINGS.buildingPct);
  form.sideRatio = str(DEFAULT_AREA_SETTINGS.sideRatio);
  form.capPct = str(DEFAULT_AREA_SETTINGS.capPct);
  form.payPct = str(DEFAULT_AREA_SETTINGS.payPct);
  error.value = '';
};

const close = () => emit('update:modelValue', false);

const save = () => {
  const num = (label, v, { min = 0, allowEmpty = false, max = Infinity } = {}) => {
    if (allowEmpty && String(v).trim() === '') return null;
    const n = toNumber(v);
    if (n === null || n < min || n > max) throw new Error(`「${label}」請輸入有效數字`);
    return n;
  };
  try {
    const out = {
      title: form.title,
      publicArea: num('大公面積', form.publicArea, { allowEmpty: true }),
      shareDen: num('持分分母', form.shareDen, { min: 1 }),
      buildingPct: num('房屋價款比例', form.buildingPct, { min: 0.0001, max: 100 }),
      sideRatio: num('陽台公設折算', form.sideRatio, { min: 0.0001, max: 1 }),
      capPct: num('找補上限', form.capPct, { max: 100 }),
      payPct: num('實收比例', form.payPct, { max: 100 }),
    };
    emit('save', out);
    close();
  } catch (e) {
    error.value = e.message;
  }
};
</script>

<style scoped>
.ass-body {
  max-height: min(68vh, 620px);
  overflow-y: auto;
  padding: 0 16px 16px;
}
.ass-unit { margin-left: auto; max-width: 160px; }
.ass-unit input { text-align: right; font-variant-numeric: tabular-nums; }
.mac-form-row > .mac-form-row-label { width: 112px; }
.ass-error { margin-top: 12px; }
</style>
