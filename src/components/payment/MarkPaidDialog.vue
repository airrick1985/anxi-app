<template>
  <v-dialog
    :model-value="modelValue"
    max-width="520"
    persistent
    scrollable
    content-class="mac-dialog-fit"
    @update:model-value="value => emit('update:modelValue', value)"
  >
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-check-circle-outline</v-icon>
        <span class="mpd-title">標記已繳{{ unitId ? `（${unitId}）` : '' }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" :disabled="saving" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <v-card-text
        v-file-drop="driveFolderUrl && !saving ? { accept: PROOF_ACCEPT_ATTR, multiple: false, onFiles: files => pickFile(files[0]) } : false"
        class="mac-form mpd-body"
      >
        <div class="mpd-summary">
          <span class="mpd-summary-note">{{ record?.note || '預計繳款' }}</span>
          <span>預計 {{ formatYmd(record?.expectedDate) }}</span>
          <span v-if="expectedAmount > 0">{{ formatMoney(expectedAmount) }} 元</span>
        </div>

        <div class="mac-form-group mac-form-pad mpd-grid">
          <div>
            <label class="mpd-label" :for="dateFieldId">繳款日</label>
            <v-text-field
              :id="dateFieldId"
              v-model="date"
              type="date"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield"
            />
          </div>
          <div>
            <label class="mpd-label" :for="amountFieldId">實繳金額</label>
            <v-text-field
              :id="amountFieldId"
              v-model="amount"
              type="number"
              min="1"
              inputmode="numeric"
              suffix="元"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield"
            />
          </div>
        </div>

        <div class="mac-form-group mac-form-pad mpd-section">
          <span class="mpd-label">憑證</span>
          <div v-if="!driveFolderUrl" class="mpd-muted">未設定戶別資料夾，無法上傳</div>
          <template v-else>
            <div v-if="file" class="mpd-file">
              <button type="button" class="mpd-thumb" title="放大確認" @click="previewOpen = true">
                <v-icon v-if="fileIsPdf" size="30" color="red-darken-1">mdi-file-pdf-box</v-icon>
                <img v-else :src="previewUrl" alt="" />
              </button>
              <div class="mpd-file-main">
                <span class="mpd-file-name">{{ file.name }}</span>
                <div class="mpd-file-actions">
                  <button type="button" class="mac-btn mac-btn--sm" :disabled="saving" @click="triggerFile">更換</button>
                  <button type="button" class="mac-btn mac-btn--sm mac-btn--danger" :disabled="saving" @click="clearFile">移除</button>
                </div>
              </div>
            </div>
            <button v-else type="button" class="mac-btn" :disabled="saving" @click="triggerFile">
              <v-icon size="16">mdi-file-plus-outline</v-icon>選擇檔案
            </button>
            <div class="mpd-muted mpd-format">JPG、PNG、WEBP、PDF，10MB 內</div>
          </template>
          <input ref="fileInputRef" type="file" :accept="PROOF_ACCEPT_ATTR" class="d-none" @change="onFileSelected" />
        </div>

        <div v-if="balance > 0" class="mac-form-group mac-form-pad mpd-section">
          <div class="mpd-balance-head">
            <span class="mpd-balance-amount">差額 {{ formatMoney(balance) }} 元</span>
            <label class="mpd-switch">
              <span>新增預計繳款</span>
              <v-switch v-model="addBalance" color="#34c759" inset hide-details density="compact" />
            </label>
          </div>
          <div v-if="addBalance">
            <label class="mpd-label" :for="balanceDateFieldId">預計日</label>
            <v-text-field
              :id="balanceDateFieldId"
              v-model="balanceDate"
              type="date"
              variant="solo"
              flat
              density="compact"
              hide-details
              class="mac-vfield"
            />
          </div>
        </div>

        <div v-if="errorMessage" class="mac-callout mac-callout--error mpd-error">
          <v-icon size="16">mdi-alert-circle-outline</v-icon>
          <span>{{ errorMessage }}</span>
        </div>
      </v-card-text>

      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="saving" @click="close">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="saving" @click="submit">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2" />
          確認已繳
        </button>
      </div>
    </v-card>
  </v-dialog>

  <v-dialog v-model="previewOpen" max-width="900" content-class="mac-dialog-fit">
    <v-card class="mac-sheet">
      <div class="mac-sheet-head">
        <span class="mpd-preview-name">{{ file?.name }}</span>
        <button type="button" class="mac-sheet-close" title="關閉" @click="previewOpen = false">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <div class="mpd-preview">
        <iframe v-if="fileIsPdf" :src="previewUrl" title="憑證預覽"></iframe>
        <img v-else :src="previewUrl" alt="" />
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { balanceNote, isValidYmd, paymentBalance, taipeiToday } from '@/utils/paymentRecordStatus';
import { PROOF_ACCEPT_ATTR, isPdfLocalFile, proofFileError } from './paymentProofFile';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  record: { type: Object, default: null },
  unitId: { type: String, default: '' },
  driveFolderUrl: { type: String, default: '' },
  submitHandler: { type: Function, required: true },
});
const emit = defineEmits(['update:modelValue']);

const uid = Math.random().toString(36).slice(2, 8);
const dateFieldId = `mpd-date-${uid}`;
const amountFieldId = `mpd-amount-${uid}`;
const balanceDateFieldId = `mpd-balance-date-${uid}`;

const date = ref('');
const amount = ref(null);
const file = ref(null);
const previewUrl = ref('');
const previewOpen = ref(false);
const addBalance = ref(true);
const balanceDate = ref('');
const saving = ref(false);
const errorMessage = ref('');
const fileInputRef = ref(null);

const expectedAmount = computed(() => Number(props.record?.expectedAmount) || 0);
const balance = computed(() => paymentBalance(props.record, amount.value));
const fileIsPdf = computed(() => isPdfLocalFile(file.value));

function clearFile() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  file.value = null;
  previewUrl.value = '';
}

watch(() => props.modelValue, (open) => {
  if (!open) {
    clearFile();
    previewOpen.value = false;
    return;
  }
  date.value = taipeiToday();
  amount.value = expectedAmount.value > 0 ? expectedAmount.value : null;
  addBalance.value = true;
  balanceDate.value = '';
  saving.value = false;
  errorMessage.value = '';
  clearFile();
}, { immediate: true });

function pickFile(picked) {
  if (!picked) return;
  const message = proofFileError(picked);
  if (message) {
    errorMessage.value = message;
    return;
  }
  errorMessage.value = '';
  clearFile();
  file.value = picked;
  previewUrl.value = URL.createObjectURL(picked);
}

function triggerFile() {
  if (!fileInputRef.value) return;
  fileInputRef.value.value = '';
  fileInputRef.value.click();
}

function onFileSelected(event) {
  pickFile(event.target.files && event.target.files[0]);
}

function close() {
  if (saving.value) return;
  emit('update:modelValue', false);
}

async function submit() {
  const amountNum = Number(amount.value);
  if (!isValidYmd(date.value)) {
    errorMessage.value = '請選擇繳款日';
    return;
  }
  if (!Number.isInteger(amountNum) || amountNum <= 0) {
    errorMessage.value = '實繳金額須為大於 0 的整數';
    return;
  }
  const needsBalance = addBalance.value && balance.value > 0;
  if (needsBalance && !isValidYmd(balanceDate.value)) {
    errorMessage.value = '請選擇差額的預計日';
    return;
  }

  saving.value = true;
  errorMessage.value = '';
  try {
    await props.submitHandler({
      record: props.record,
      date: date.value,
      amount: amountNum,
      note: props.record?.note || '',
      file: file.value,
      balancePlan: needsBalance
        ? { expectedDate: balanceDate.value, expectedAmount: balance.value, note: balanceNote(props.record?.note) }
        : null,
    });
    emit('update:modelValue', false);
  } catch (error) {
    errorMessage.value = error.message || '請稍後再試';
  } finally {
    saving.value = false;
  }
}

function formatYmd(value) {
  return isValidYmd(value) ? String(value).replace(/-/g, '/') : '—';
}

function formatMoney(value) {
  return Number(value).toLocaleString('zh-TW');
}

onBeforeUnmount(clearFile);
</script>

<style scoped>
.mpd-title { min-width: 0; overflow-wrap: anywhere; }
.mpd-body { display: flex; flex-direction: column; gap: 10px; padding: 12px 16px !important; }
.mpd-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 10px;
  padding: 0 2px;
  font-size: 13px;
  color: #6e6e73;
}
.mpd-summary-note { font-weight: 600; color: #1d1d1f; overflow-wrap: anywhere; }
.mpd-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.mpd-label { display: block; margin: 0 0 4px 2px; font-size: 12px; font-weight: 600; color: #6e6e73; }
.mpd-section { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
.mpd-section > .mac-btn { align-self: flex-start; }
.mpd-section > .mpd-label { margin-bottom: 0; }
.mpd-muted { font-size: 12px; color: #6e6e73; }
.mpd-file { display: flex; align-items: center; gap: 12px; }
.mpd-file-main { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.mpd-file-name { font-size: 12.5px; overflow-wrap: anywhere; }
.mpd-file-actions { display: flex; gap: 6px; }
.mpd-thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  padding: 0;
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 8px;
  background: #fafafa;
  cursor: zoom-in;
}
.mpd-thumb img { width: 100%; height: 100%; object-fit: cover; }
.mpd-balance-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 4px 12px; }
.mpd-balance-amount { font-size: 14px; font-weight: 600; }
.mpd-switch { display: inline-flex; align-items: center; gap: 8px; font-size: 13px; cursor: pointer; }
.mpd-error { margin: 0; }
.mpd-preview-name { min-width: 0; overflow-wrap: anywhere; font-weight: 500; }
.mpd-preview { height: 72vh; background: #1d1d1f; display: flex; align-items: center; justify-content: center; }
.mpd-preview img { max-width: 100%; max-height: 100%; object-fit: contain; }
.mpd-preview iframe { width: 100%; height: 100%; border: 0; background: #fff; }
@media (max-width: 600px) {
  .mpd-grid { grid-template-columns: minmax(0, 1fr); }
}
</style>
