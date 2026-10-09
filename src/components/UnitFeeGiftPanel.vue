<template>
  <div class="fee-gift-panel">
    <div v-for="g in groups" :key="g.key" class="fg-group">
      <div class="fg-head">
        <v-icon size="16" :color="g.color">{{ g.icon }}</v-icon>
        <span class="fg-head-label">{{ g.label }}</span>
        <span v-if="g.list.length" class="fg-head-total">{{ money(g.total) }} 元</span>
        <v-spacer></v-spacer>
        <v-btn v-if="!readonly" size="x-small" variant="tonal" :color="g.color" prepend-icon="mdi-plus"
          @click="openEdit(g.key)">新增</v-btn>
      </div>
      <div v-if="!g.list.length" class="fg-empty">—</div>
      <div v-for="e in g.list" :key="e.id" class="fg-row" :class="{ 'fg-row--clickable': !readonly }"
        @click="!readonly && openEdit(g.key, e)">
        <div class="fg-row-main">
          <span class="fg-title">{{ feeGiftTitle(e, g.key) }}</span>
          <v-chip v-if="e.inNetPremium" size="x-small" color="deep-orange" variant="tonal" label class="ml-1">併入淨溢差</v-chip>
          <v-spacer></v-spacer>
          <span class="fg-amount">{{ money(e.amount) }}</span>
        </div>
        <div v-if="subText(e, g.key) || attachmentsOf(e).length" class="fg-row-sub">
          <span v-if="subText(e, g.key)" class="fg-sub-text">{{ subText(e, g.key) }}</span>
          <a v-for="att in attachmentsOf(e)" :key="att.id" :href="att.webViewLink" target="_blank" rel="noopener noreferrer"
            class="fg-att" :title="att.fileName" @click.stop>
            <v-icon size="15">{{ fileIconForDocument(att.mimeType, att.fileName).icon }}</v-icon>
          </a>
        </div>
      </div>
    </div>

    <!-- 新增／編輯 -->
    <v-dialog v-model="edit.open" max-width="520" :fullscreen="mobile" :persistent="edit.saving">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon start :color="kindMeta.color">{{ kindMeta.icon }}</v-icon>
          <span>{{ edit.entry ? '編輯' : '新增' }}{{ kindMeta.label }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" size="small" :disabled="edit.saving" @click="edit.open = false"></v-btn>
        </v-card-title>
        <v-card-text class="pt-1">
          <template v-if="edit.kind === 'referral'">
            <v-text-field v-model.number="edit.form.amount" label="金額" suffix="元" type="number" min="0"
              density="compact" variant="outlined" class="mb-2" hide-details="auto" autofocus></v-text-field>
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model="edit.form.name" label="介紹人姓名" density="compact" variant="outlined" hide-details></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="edit.form.phone" label="電話" density="compact" variant="outlined" hide-details></v-text-field>
              </v-col>
            </v-row>
            <v-text-field v-model="edit.form.address" label="地址" density="compact" variant="outlined" class="mt-2" hide-details></v-text-field>
          </template>
          <template v-else>
            <v-text-field v-model="edit.form.item" label="品項" density="compact" variant="outlined" class="mb-2"
              hide-details autofocus></v-text-field>
            <v-text-field v-model.number="edit.form.amount" label="金額" suffix="元" type="number" min="0"
              density="compact" variant="outlined" hide-details></v-text-field>
          </template>
          <v-textarea v-model="edit.form.remark" label="備註" rows="2" auto-grow density="compact" variant="outlined"
            class="mt-2" hide-details></v-textarea>
          <v-checkbox v-model="edit.form.inNetPremium" label="併入淨溢差價" color="deep-orange" density="compact" hide-details></v-checkbox>

          <!-- 附件：照片／PDF，存戶別 Drive 資料夾 -->
          <div class="fg-att-box" v-file-drop="canAttach && !edit.saving ? addFiles : false">
            <div class="d-flex align-center mb-1">
              <span class="text-caption font-weight-bold">附件</span>
              <v-spacer></v-spacer>
              <v-btn size="x-small" variant="tonal" prepend-icon="mdi-paperclip" :disabled="!canAttach || edit.saving"
                @click="fileInputRef?.click()">加入</v-btn>
              <input ref="fileInputRef" type="file" accept="image/*,application/pdf" multiple hidden @change="onFileInput">
            </div>
            <div v-if="!driveFolderUrl" class="text-caption text-grey">未設定戶別資料夾，無法上傳附件</div>
            <div class="d-flex flex-wrap ga-1">
              <v-chip v-for="att in editAttachments" :key="att.id" size="small" variant="outlined" :href="att.webViewLink"
                target="_blank" :prepend-icon="fileIconForDocument(att.mimeType, att.fileName).icon"
                :closable="!edit.saving" @click:close.prevent="removeAttachment(att.id)">{{ att.fileName }}</v-chip>
              <v-chip v-for="(p, i) in edit.pending" :key="'p' + i" size="small" color="primary" variant="tonal"
                :prepend-icon="p.uploading ? 'mdi-cloud-upload-outline' : 'mdi-file-clock-outline'"
                :closable="!edit.saving" @click:close="edit.pending.splice(i, 1)">{{ p.file.name }}</v-chip>
            </div>
          </div>
          <div v-if="edit.error" class="text-caption text-error mt-2">{{ edit.error }}</div>
        </v-card-text>
        <v-card-actions>
          <v-btn v-if="edit.entry" color="error" variant="text" prepend-icon="mdi-delete-outline" :disabled="edit.saving"
            @click="confirmDelete = true">刪除</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" :disabled="edit.saving" @click="edit.open = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="edit.saving" :disabled="!canSave" @click="save">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="confirmDelete" max-width="360">
      <v-card>
        <v-card-text class="pt-5">刪除這筆{{ kindMeta.label }}？附件仍保留在「上傳文件」。</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDelete = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="edit.saving" @click="removeEntry">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { ref as storageRef, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { storage } from '@/firebase';
import {
  FEE_GIFT_KINDS, normalizeReferralFees, normalizeGifts, feeGiftTitle, newFeeGiftId,
} from '@/utils/unitFeeGifts';
import {
  UNIT_DOCUMENT_MAX_SIZE, sanitizeFileNameSegment, getFileExtension, buildUnitDocumentBaseName, fileIconForDocument,
} from '@/utils/unitDocuments';

const props = defineProps({
  referralFees: { type: Array, default: () => [] },
  gifts: { type: Array, default: () => [] },
  unitDocuments: { type: Array, default: () => [] },
  projectId: { type: String, default: '' },
  unitId: { type: String, default: '' },
  driveFolderUrl: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  // 舊資料的介紹人（新增第一筆介紹費時帶入）
  legacyReferrer: { type: Object, default: () => ({ name: '', phone: '' }) },
  operator: { type: Object, default: () => ({ userKey: '', name: '' }) },
  // async ({ referralFees } | { gifts }) → 寫入戶別
  persistHandler: { type: Function, required: true },
  // async (unitDocumentApi commit payload) → 文件紀錄
  uploadHandler: { type: Function, default: null },
});

const { mobile } = useDisplay();
const toast = useToast();

const fees = computed(() => normalizeReferralFees(props.referralFees));
const giftList = computed(() => normalizeGifts(props.gifts));
const groups = computed(() => [
  { ...FEE_GIFT_KINDS.referral, list: fees.value, total: fees.value.reduce((s, e) => s + e.amount, 0) },
  { ...FEE_GIFT_KINDS.gift, list: giftList.value, total: giftList.value.reduce((s, e) => s + e.amount, 0) },
]);

const docMap = computed(() => new Map((props.unitDocuments || []).map(d => [d.id, d])));
const attachmentsOf = (e) => (e.attachmentIds || []).map(id => docMap.value.get(id)).filter(Boolean);

const money = (v) => (Number(v) || 0).toLocaleString('zh-TW');
function subText(e, kind) {
  const parts = kind === 'referral' ? [e.phone, e.address, e.remark] : [e.remark];
  return parts.filter(Boolean).join('・');
}

// ───────── 新增／編輯 ─────────
const fileInputRef = ref(null);
const confirmDelete = ref(false);
const emptyForm = () => ({ amount: null, name: '', phone: '', address: '', item: '', remark: '', inNetPremium: false, attachmentIds: [] });
const edit = reactive({ open: false, kind: 'referral', entry: null, form: emptyForm(), pending: [], saving: false, error: '' });
const kindMeta = computed(() => FEE_GIFT_KINDS[edit.kind]);
const canAttach = computed(() => !!props.driveFolderUrl && !!props.uploadHandler);
const editAttachments = computed(() => edit.form.attachmentIds.map(id => docMap.value.get(id)).filter(Boolean));
const canSave = computed(() => {
  const f = edit.form;
  if (f.amount !== null && f.amount !== '' && Number(f.amount) < 0) return false;
  return edit.kind === 'gift' ? !!String(f.item || '').trim() : (!!String(f.name || '').trim() || Number(f.amount) > 0);
});

function openEdit(kind, entry = null) {
  edit.kind = kind;
  edit.entry = entry;
  edit.form = entry ? { ...emptyForm(), ...JSON.parse(JSON.stringify(entry)) } : emptyForm();
  // 第一筆介紹費帶入舊資料的介紹人
  if (!entry && kind === 'referral' && fees.value.length === 0) {
    edit.form.name = props.legacyReferrer?.name || '';
    edit.form.phone = props.legacyReferrer?.phone || '';
  }
  edit.pending = [];
  edit.error = '';
  edit.saving = false;
  edit.open = true;
}

const isAllowedFile = (f) => {
  const ext = getFileExtension(f.name).toLowerCase();
  return String(f.type || '').startsWith('image/') || f.type === 'application/pdf' || ext === 'pdf';
};
function addFiles(files) {
  const list = Array.from(files || []);
  const ok = list.filter(f => isAllowedFile(f) && f.size <= UNIT_DOCUMENT_MAX_SIZE);
  if (ok.length < list.length) toast.warning('僅接受 100MB 以內的照片或 PDF');
  edit.pending.push(...ok.map(file => ({ file, uploading: false })));
}
function onFileInput(e) {
  addFiles(e.target.files);
  e.target.value = '';
}
function removeAttachment(id) {
  edit.form.attachmentIds = edit.form.attachmentIds.filter(x => x !== id);
}

function uploadToStorage(file) {
  const uploadId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const safeName = file.name.replace(/[^\w.\-]/g, '_') || 'file';
  const path = `unitDocuments/temp/${props.projectId}/${props.unitId}/${uploadId}/${safeName}`;
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef(storage, path), file, { contentType: file.type || 'application/octet-stream' });
    task.on('state_changed', null, reject, () => resolve(path));
  });
}

// 附件逐一上傳：Storage 暫存 → 轉存戶別 Drive（文件種類＝介紹費／贈品）；成功的即移出待上傳，重試不重傳
async function uploadPending() {
  const label = kindMeta.value.label;
  const title = sanitizeFileNameSegment(edit.kind === 'gift' ? edit.form.item : edit.form.name, 30);
  const base = [buildUnitDocumentBaseName(props.unitId, label), title].filter(Boolean).join('-');
  while (edit.pending.length) {
    const p = edit.pending[0];
    p.uploading = true;
    let storagePath = '';
    try {
      storagePath = await uploadToStorage(p.file);
      const n = edit.form.attachmentIds.length + 1;
      const record = await props.uploadHandler({
        storagePath,
        fileName: n > 1 ? `${base}-${n}` : base,
        docType: 'other',
        docTypeLabel: label,
        originalName: p.file.name,
        mimeType: p.file.type || '',
        size: p.file.size,
      });
      edit.form.attachmentIds.push(record.id);
      edit.pending.shift();
    } catch (err) {
      p.uploading = false;
      if (storagePath) {
        try { await deleteObject(storageRef(storage, storagePath)); } catch (e) { /* noop */ }
      }
      throw new Error(`附件「${p.file.name}」上傳失敗：${err?.message || '請稍後再試'}`);
    }
  }
}

function buildEntry() {
  const f = edit.form;
  const now = new Date().toISOString();
  const base = {
    id: edit.entry?.id || newFeeGiftId(edit.kind),
    amount: Number(f.amount) || 0,
    remark: String(f.remark || '').trim(),
    inNetPremium: f.inNetPremium === true,
    attachmentIds: f.attachmentIds.slice(),
    createdAt: edit.entry?.createdAt || now,
    createdBy: edit.entry?.createdBy || { userKey: props.operator?.userKey || '', name: props.operator?.name || '' },
    updatedAt: now,
  };
  return edit.kind === 'gift'
    ? { ...base, item: String(f.item || '').trim() }
    : { ...base, name: String(f.name || '').trim(), phone: String(f.phone || '').trim(), address: String(f.address || '').trim() };
}

async function persistList(list) {
  const field = kindMeta.value.field;
  await props.persistHandler({ [field]: list });
}

async function save() {
  if (!canSave.value || edit.saving) return;
  edit.saving = true;
  edit.error = '';
  try {
    if (edit.pending.length) await uploadPending();
    const entry = buildEntry();
    const current = edit.kind === 'gift' ? giftList.value : fees.value;
    const list = edit.entry ? current.map(e => (e.id === entry.id ? entry : e)) : [...current, entry];
    await persistList(list);
    toast.success(`${kindMeta.value.label}已儲存`);
    edit.open = false;
  } catch (err) {
    console.error('[UnitFeeGiftPanel] 儲存失敗:', err);
    edit.error = err?.message || '儲存失敗，請稍後再試';
  } finally {
    edit.saving = false;
  }
}

async function removeEntry() {
  if (!edit.entry || edit.saving) return;
  edit.saving = true;
  try {
    const current = edit.kind === 'gift' ? giftList.value : fees.value;
    await persistList(current.filter(e => e.id !== edit.entry.id));
    toast.success(`${kindMeta.value.label}已刪除`);
    confirmDelete.value = false;
    edit.open = false;
  } catch (err) {
    console.error('[UnitFeeGiftPanel] 刪除失敗:', err);
    toast.error('刪除失敗：' + (err?.message || '請稍後再試'));
  } finally {
    edit.saving = false;
  }
}
</script>

<style scoped>
.fee-gift-panel { display: flex; flex-direction: column; gap: 8px; }
.fg-head { display: flex; align-items: center; gap: 4px; font-size: 0.85rem; font-weight: 600; color: #455a64; }
.fg-head-total { margin-left: 6px; font-weight: 700; color: #37474f; }
.fg-empty { font-size: 0.8rem; color: #b0bec5; padding: 2px 0 0 22px; }
.fg-row { padding: 4px 6px 4px 22px; border-radius: 6px; }
.fg-row--clickable { cursor: pointer; }
.fg-row--clickable:hover { background: #f5f7fa; }
.fg-row-main { display: flex; align-items: center; font-size: 0.85rem; }
.fg-title { font-weight: 600; color: #263238; }
.fg-amount { font-weight: 700; color: #2e7d32; font-variant-numeric: tabular-nums; }
.fg-row-sub { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 0.75rem; color: #78909c; margin-top: 1px; }
.fg-sub-text { white-space: pre-wrap; word-break: break-word; }
.fg-att { color: #1976d2; text-decoration: none; display: inline-flex; }
.fg-att-box { border: 1px dashed #cfd8dc; border-radius: 8px; padding: 8px; margin-top: 4px; }
</style>
