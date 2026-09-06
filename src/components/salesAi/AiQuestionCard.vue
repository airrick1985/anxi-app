<template>
  <div class="ai-qcard" :class="{ 'ai-qcard--done': answered }">
    <div class="ai-qcard__head">
      <v-icon size="18" color="amber-darken-2">mdi-help-circle-outline</v-icon>
      <span>{{ answered ? '已回答' : '請補充以下資訊' }}</span>
    </div>
    <div v-for="q in questions" :key="q.field" class="ai-qcard__q">
      <div class="ai-qcard__label">
        {{ q.label }}<span v-if="q.required === false" class="ai-qcard__opt">（選填）</span>
      </div>
      <div v-if="q.hint" class="ai-qcard__hint">{{ q.hint }}</div>

      <template v-if="answered">
        <div class="ai-qcard__answer">{{ displayAnswer(q) }}</div>
      </template>

      <template v-else-if="q.type === 'select'">
        <v-chip-group v-model="form[q.field]" column mandatory="force" selected-class="ai-qcard__chip--on">
          <v-chip v-for="o in q.options" :key="o.value" :value="o.value" size="small" variant="outlined" class="ai-qcard__chip">{{ o.label }}</v-chip>
        </v-chip-group>
      </template>

      <template v-else-if="q.type === 'multiselect'">
        <v-chip-group v-model="form[q.field]" column multiple selected-class="ai-qcard__chip--on">
          <v-chip v-for="o in q.options" :key="o.value" :value="o.value" size="small" variant="outlined" class="ai-qcard__chip">{{ o.label }}</v-chip>
        </v-chip-group>
      </template>

      <template v-else-if="q.type === 'number'">
        <div v-if="q.options && q.options.length" class="ai-qcard__presets">
          <v-chip v-for="o in q.options" :key="o.value" size="x-small" variant="tonal" color="primary" @click="form[q.field] = o.value">{{ o.label }}</v-chip>
        </div>
        <v-text-field v-model="form[q.field]" density="compact" variant="outlined" hide-details :placeholder="q.default != null ? String(q.default) : ''" inputmode="decimal" class="ai-qcard__input" />
      </template>

      <template v-else-if="q.type === 'date'">
        <v-text-field v-model="form[q.field]" type="date" density="compact" variant="outlined" hide-details class="ai-qcard__input" />
      </template>

      <template v-else-if="q.type === 'confirm'">
        <v-btn-toggle v-model="form[q.field]" density="compact" divided variant="outlined" color="primary">
          <v-btn value="yes" size="small">是</v-btn><v-btn value="no" size="small">否</v-btn>
        </v-btn-toggle>
      </template>

      <template v-else>
        <v-text-field v-model="form[q.field]" density="compact" variant="outlined" hide-details :placeholder="q.default != null ? String(q.default) : ''" class="ai-qcard__input" @keydown.enter.prevent="submit" />
      </template>
    </div>

    <div v-if="!answered" class="ai-qcard__actions">
      <v-btn size="small" variant="text" :disabled="disabled" @click="skip">略過選填</v-btn>
      <v-btn size="small" color="primary" variant="flat" :disabled="disabled || !valid" :loading="disabled" @click="submit">送出</v-btn>
    </div>
  </div>
</template>

<script setup>
// 問題卡（docs/銷控AI智能助理-spec.md §3.3）
import { reactive, computed, watch } from 'vue';

const props = defineProps({
  questions: { type: Array, default: () => [] },
  answered: { type: Boolean, default: false },
  answers: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
});
const emit = defineEmits(['submit']);

const form = reactive({});
function initForm() {
  for (const q of props.questions) {
    if (q.field in form) continue;
    if (props.answers && q.field in props.answers) { form[q.field] = props.answers[q.field]; continue; }
    if (q.type === 'multiselect') form[q.field] = [];
    else if (q.type === 'date') form[q.field] = q.default || '';
    else if (q.type === 'number') form[q.field] = q.default != null ? String(q.default) : '';
    else form[q.field] = '';
  }
}
initForm();
watch(() => props.questions, initForm);

const valid = computed(() => props.questions.every(q => {
  if (q.required === false) return true;
  const v = form[q.field];
  if (Array.isArray(v)) return v.length > 0;
  return v !== undefined && v !== null && String(v).trim() !== '';
}));

function collect({ includeEmpty = true } = {}) {
  const out = {};
  for (const q of props.questions) {
    let v = form[q.field];
    if (Array.isArray(v)) v = v.slice();
    else if (typeof v === 'string') v = v.trim();
    if (v === '' || v === undefined || (Array.isArray(v) && !v.length)) {
      if (q.required === false) out[q.field] = q.type === 'date' && q.default ? q.default : null;
      else if (includeEmpty) out[q.field] = null;
      continue;
    }
    if (q.type === 'confirm') v = v === 'yes';
    out[q.field] = v;
  }
  return out;
}
function submit() { if (valid.value) emit('submit', collect()); }
function skip() {
  // 只送必填已填者；選填給 null／預設
  if (!valid.value) return;
  emit('submit', collect());
}
function displayAnswer(q) {
  const v = props.answers ? props.answers[q.field] : form[q.field];
  if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) return '（略過）';
  if (Array.isArray(v)) return v.join('、');
  if (typeof v === 'boolean') return v ? '是' : '否';
  const o = (q.options || []).find(x => x.value === v);
  return o ? o.label : String(v);
}
</script>

<style scoped>
.ai-qcard { border: 1px solid #FFE082; background: #FFFDF5; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 8px; }
.ai-qcard--done { border-color: #E0E0E0; background: #FAFAFA; }
.ai-qcard__head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #6D4C00; }
.ai-qcard--done .ai-qcard__head { color: #757575; }
.ai-qcard__q { display: flex; flex-direction: column; gap: 4px; }
.ai-qcard__label { font-size: 13px; font-weight: 500; color: #263238; }
.ai-qcard__opt { color: #9E9E9E; font-weight: 400; font-size: 12px; }
.ai-qcard__hint { font-size: 12px; color: #78909C; }
.ai-qcard__answer { font-size: 13px; color: #37474F; padding: 4px 8px; background: #fff; border-radius: 6px; border: 1px solid #EEEEEE; }
.ai-qcard__chip { margin: 2px; }
.ai-qcard__chip--on { background: #2F6BFF !important; color: #fff !important; border-color: #2F6BFF !important; }
.ai-qcard__presets { display: flex; gap: 6px; flex-wrap: wrap; }
.ai-qcard__input { max-width: 260px; }
.ai-qcard__actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 2px; }
</style>
