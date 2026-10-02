<template>
  <v-dialog :model-value="modelValue" max-width="560" persistent scrollable>
    <v-card v-if="form">
      <v-card-title class="d-flex align-center bg-blue-darken-4 text-white">
        <span class="text-subtitle-1">{{ title }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" :disabled="saving" @click="cancel"></v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <template v-if="mode === 'skip'">
          <v-text-field v-model="form.skipReason" label="略過原因*" variant="outlined" density="compact" autofocus></v-text-field>
        </template>

        <template v-else>
          <v-row dense>
            <template v-if="stepKey === 'activated'">
              <v-col v-if="requireProjectId" cols="12">
                <v-text-field v-model="form.projectId" label="建案 ID*" variant="outlined" density="compact" hide-details="auto"></v-text-field>
              </v-col>
              <v-col cols="6"><v-text-field v-model="form.startDate" type="date" label="啟用日*" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model="form.endDate" type="date" label="停用日*" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model.number="form.userCount" type="number" label="使用人數*" suffix="人" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
            </template>

            <v-col v-else cols="6">
              <v-text-field v-model="form.date" type="date" :label="dateLabel" variant="outlined" density="compact" hide-details="auto"></v-text-field>
            </v-col>

            <template v-if="stepKey === 'invoice'">
              <v-col cols="6"><v-text-field v-model="form.invoiceNo" label="發票號碼" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
              <v-col cols="6"><v-text-field v-model.number="form.invoiceAmount" type="number" prefix="$" label="發票金額" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
            </template>

            <template v-if="stepKey === 'cashed'">
              <v-col cols="6">
                <v-select v-model="form.method" :items="PAYMENT_METHODS" label="收款方式" variant="outlined" density="compact" hide-details="auto"></v-select>
              </v-col>
              <template v-if="form.method === '支票'">
                <v-col cols="6"><v-text-field v-model="form.chequeNo" label="票號" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
                <v-col cols="6"><v-text-field v-model="form.chequeDueDate" type="date" label="支票到期日" variant="outlined" density="compact" hide-details="auto"></v-text-field></v-col>
              </template>
              <v-col cols="6">
                <v-text-field v-model.number="form.receivedAmount" type="number" prefix="$" label="實收金額" variant="outlined" density="compact" hide-details="auto"></v-text-field>
              </v-col>
              <v-col v-if="amountDiff !== 0" cols="12">
                <v-chip size="small" color="error" label>與應收差 {{ amountDiff > 0 ? '+' : '' }}{{ amountDiff.toLocaleString() }}</v-chip>
              </v-col>
            </template>

            <v-col cols="12">
              <v-textarea v-model="form.note" label="備註" rows="2" auto-grow variant="outlined" density="compact" hide-details></v-textarea>
            </v-col>
            <v-col cols="12">
              <AttachmentField v-model="form.attachments" :path-prefix="pathPrefix" :project-id="projectId" />
            </v-col>
          </v-row>
        </template>
        <div v-if="error" class="text-error text-body-2 mt-3">{{ error }}</div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="saving" @click="cancel">取消</v-btn>
        <template v-if="mode === 'skip'">
          <v-btn color="grey-darken-2" variant="flat" :loading="saving" @click="submit('skip')">略過</v-btn>
        </template>
        <template v-else-if="mode === 'complete'">
          <v-btn variant="tonal" :disabled="saving" @click="submit('draft')">暫存</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="submit('complete')">完成</v-btn>
        </template>
        <v-btn v-else color="primary" variant="flat" :loading="saving" @click="submit('update')">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AttachmentField from './AttachmentField.vue';
import { deleteSalesImage } from '@/api.js';
import { STEP_LABELS, PAYMENT_METHODS, taiwanToday, addDays, addMonths } from '@/utils/subscriptionPipeline';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  stepKey: { type: String, default: '' },
  step: { type: Object, default: null },
  mode: { type: String, default: 'complete' }, // complete | edit | skip
  suffix: { type: String, default: '' },
  expectedAmount: { type: Number, default: 0 },
  pathPrefix: { type: String, default: 'subscriptions/misc' },
  projectId: { type: String, default: '' },
  saving: { type: Boolean, default: false },
  requireProjectId: { type: Boolean, default: false },
  projectIdValidator: { type: Function, default: () => '' },
});
const emit = defineEmits(['update:modelValue', 'submit']);

const form = ref(null);
const error = ref('');
let initialPaths = new Set();

const DATE_LABELS = {
  quote: '報價日期',
  signed: '回簽日期',
  invoice: '發票日期',
  submitted: '送件日期',
  cashed: '兌現日期',
};

const title = computed(() => {
  const verb = props.mode === 'skip' ? '略過' : props.mode === 'edit' ? '編輯' : '';
  return `${verb}${STEP_LABELS[props.stepKey] || ''}${props.suffix ? ` · ${props.suffix}` : ''}`;
});
const dateLabel = computed(() => `${DATE_LABELS[props.stepKey] || '日期'}${props.mode === 'complete' ? '*' : ''}`);
const amountDiff = computed(() => {
  if (!form.value || props.stepKey !== 'cashed' || !props.expectedAmount) return 0;
  return (Number(form.value.receivedAmount) || 0) - props.expectedAmount;
});

watch(() => props.modelValue, (open) => {
  if (!open) return;
  error.value = '';
  const f = JSON.parse(JSON.stringify(props.step || {}));
  f.attachments = f.attachments || [];
  f.projectId = '';
  if (props.mode === 'complete') {
    const today = taiwanToday();
    if (!f.date) f.date = today;
    if (props.stepKey === 'activated') {
      if (!f.startDate) f.startDate = today;
      if (!f.endDate) f.endDate = addDays(addMonths(f.startDate, 12), -1);
    }
    if (props.stepKey === 'invoice' && !f.invoiceAmount) f.invoiceAmount = props.expectedAmount;
    if (props.stepKey === 'cashed' && !f.receivedAmount) f.receivedAmount = props.expectedAmount;
  }
  initialPaths = new Set(f.attachments.map(a => a.storagePath));
  form.value = f;
}, { immediate: true });

function validate(action) {
  const f = form.value;
  if (action === 'skip') return f.skipReason?.trim() ? '' : '請填寫略過原因';
  if (action === 'draft') return '';
  if (props.stepKey === 'activated') {
    if (props.requireProjectId) {
      const idError = props.projectIdValidator((f.projectId || '').trim());
      if (idError) return idError;
    }
    if (!f.startDate || !f.endDate) return '請填寫啟用日與停用日';
    if (f.endDate < f.startDate) return '停用日不可早於啟用日';
    if (!(Number(f.userCount) > 0)) return '請填寫使用人數';
    return '';
  }
  if (action === 'complete' && !f.date) return `請填寫${DATE_LABELS[props.stepKey] || '日期'}`;
  return '';
}

function submit(action) {
  error.value = validate(action);
  if (error.value) return;
  const { projectId, ...f } = form.value;
  if (props.stepKey === 'activated') f.date = f.startDate;
  ['invoiceAmount', 'receivedAmount', 'userCount'].forEach(k => {
    if (k in f) f[k] = Number(f[k]) || 0;
  });
  if (f.method && f.method !== '支票') {
    f.chequeNo = '';
    f.chequeDueDate = '';
  }
  emit('submit', { step: f, action, projectId: (projectId || '').trim() });
}

// 取消時刪除本次新上傳、未儲存的檔案
async function cancel() {
  const fresh = (form.value?.attachments || []).filter(a => a.storagePath && !initialPaths.has(a.storagePath));
  emit('update:modelValue', false);
  for (const att of fresh) {
    try {
      await deleteSalesImage(`subAttach_${Date.now()}`, att.storagePath);
    } catch (e) {
      console.warn('清除未儲存附件失敗:', att.storagePath, e);
    }
  }
}
</script>
