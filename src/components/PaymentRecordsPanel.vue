<template>
  <v-expansion-panels v-model="expanded" class="payment-records-panel" flat variant="accordion">
    <v-expansion-panel elevation="0">
      <v-expansion-panel-title class="payment-records-title">
        <div class="d-flex align-center flex-wrap" style="gap: 6px;">
          <v-icon size="small" color="teal">mdi-cash-multiple</v-icon>
          <span class="font-weight-medium">戶別繳款紀錄</span>
          <v-chip size="x-small" :color="records.length > 0 ? 'primary' : 'grey'" variant="tonal">
            {{ records.length }} 筆
          </v-chip>
          <v-chip v-if="records.length > 0" size="x-small" color="teal" variant="tonal">
            合計 {{ formatMoney(totalPaid) }} 元
          </v-chip>
          <v-chip size="x-small" :color="ratioText === '—' ? 'grey' : 'deep-orange'" variant="tonal">
            繳款比例 {{ ratioText }}
          </v-chip>
        </div>
      </v-expansion-panel-title>

      <v-expansion-panel-text>
        <div v-if="ratioText === '—'" class="text-caption text-grey mb-2">
          尚未填寫成交總價，無法計算繳款比例
        </div>

        <!-- ── 檢視模式 ── -->
        <div v-if="!editable">
          <div v-if="allowQuickAdd" class="d-flex justify-end mb-2">
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="openQuickAdd">
              新增繳款紀錄
            </v-btn>
          </div>
          <div v-if="records.length === 0" class="text-caption text-grey text-center py-3">
            尚無繳款紀錄
          </div>
          <div v-else class="pr-view-table">
            <div class="pr-row pr-header">
              <div class="pr-col-idx">#</div>
              <div class="pr-col-date">日期</div>
              <div class="pr-col-amount">金額(元)</div>
              <div class="pr-col-note">備註</div>
              <div class="pr-col-img">憑證</div>
            </div>
            <div v-for="(r, idx) in records" :key="r.id || idx" class="pr-row">
              <div class="pr-col-idx">{{ idx + 1 }}</div>
              <div class="pr-col-date">{{ r.date || '—' }}</div>
              <div class="pr-col-amount">{{ formatMoney(r.amount) }}</div>
              <div class="pr-col-note">{{ r.note || '—' }}</div>
              <div class="pr-col-img">
                <v-img
                  v-if="r.file"
                  :src="thumbSrc(r)"
                  width="48"
                  height="48"
                  cover
                  class="pr-thumb rounded"
                  @click.stop="openLightbox(r)"
                >
                  <template v-slot:error>
                    <div class="pr-thumb-fallback" @click.stop="openLightbox(r)">
                      <v-icon size="28" color="grey">mdi-file-image</v-icon>
                    </div>
                  </template>
                </v-img>
                <span v-else class="text-caption text-grey">—</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── 編輯模式 ── -->
        <div v-else>
          <div class="d-flex justify-end mb-2">
            <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addRecord">
              新增繳款紀錄
            </v-btn>
          </div>

          <div v-if="records.length === 0" class="text-caption text-grey text-center py-3">
            尚無繳款紀錄，請點擊上方「新增繳款紀錄」
          </div>

          <div v-for="(r, idx) in records" :key="r.id || idx" class="pr-edit-card mb-3">
            <div class="d-flex align-center mb-2">
              <div class="text-subtitle-2 font-weight-medium">繳款 #{{ idx + 1 }}</div>
              <v-spacer></v-spacer>
              <v-btn icon size="small" variant="text" color="error" @click="confirmRemove(idx)">
                <v-icon size="small">mdi-delete</v-icon>
              </v-btn>
            </div>

            <v-row dense>
              <v-col cols="6" md="3">
                <v-text-field
                  :model-value="r.date"
                  label="繳款日期 *"
                  type="date"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  @update:model-value="v => update(idx, 'date', v)"
                />
              </v-col>
              <v-col cols="6" md="3">
                <v-text-field
                  :model-value="r.amount"
                  label="金額(元) *"
                  type="number"
                  min="1"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  @update:model-value="v => update(idx, 'amount', toIntOrNull(v))"
                />
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field
                  :model-value="r.note"
                  label="備註"
                  variant="outlined"
                  density="compact"
                  hide-details="auto"
                  placeholder="例: 簽約款"
                  @update:model-value="v => update(idx, 'note', v)"
                />
              </v-col>

              <!-- 圖檔區 -->
              <v-col cols="12">
                <div v-if="!driveFolderUrl" class="text-caption text-orange-darken-2">
                  <v-icon size="14" class="mr-1">mdi-alert</v-icon>
                  請先於銷控設定此戶別的「戶別資料夾位置」，才能上傳繳款憑證
                </div>
                <template v-else>
                  <!-- 已有圖（待上傳或已上傳） -->
                  <div v-if="r._pendingFile || r.file" class="d-flex align-center" style="gap: 12px;">
                    <v-img
                      :src="editThumbSrc(r)"
                      width="64"
                      height="64"
                      cover
                      class="pr-thumb rounded"
                      @click.stop="openLightbox(r)"
                    >
                      <template v-slot:error>
                        <div class="pr-thumb-fallback" @click.stop="openLightbox(r)">
                          <v-icon size="32" color="grey">mdi-file-image</v-icon>
                        </div>
                      </template>
                    </v-img>
                    <div class="d-flex flex-column" style="gap: 4px; min-width: 0;">
                      <div class="d-flex align-center" style="gap: 6px;">
                        <v-chip v-if="r._pendingFile" size="x-small" color="orange" variant="flat" label>待上傳</v-chip>
                        <span class="text-caption text-truncate">
                          {{ r._pendingFile ? r._pendingFile.name : (r.file && r.file.fileName) }}
                        </span>
                      </div>
                      <div class="d-flex" style="gap: 6px;">
                        <v-btn size="x-small" variant="tonal" prepend-icon="mdi-image-sync" @click="triggerFileSelect(idx)">
                          更換圖檔
                        </v-btn>
                        <v-btn
                          v-if="r._pendingFile"
                          size="x-small"
                          variant="tonal"
                          color="error"
                          prepend-icon="mdi-close"
                          @click="removePendingFile(idx)"
                        >
                          移除
                        </v-btn>
                      </div>
                    </div>
                  </div>
                  <!-- 尚無圖 -->
                  <v-btn v-else size="small" variant="outlined" prepend-icon="mdi-image-plus" @click="triggerFileSelect(idx)">
                    選擇繳款憑證圖檔
                  </v-btn>
                  <div class="text-caption text-grey mt-1">JPG / PNG / WEBP，10MB 以內，每筆 1 張；按「儲存」後才會上傳至戶別資料夾</div>
                </template>
              </v-col>
            </v-row>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            class="d-none"
            @change="onFileSelected"
          />
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <!-- ── 快速新增（檢視模式，即時儲存） ── -->
  <v-dialog v-model="quickAdd.open" max-width="520" persistent>
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon color="teal" size="small" class="mr-1">mdi-cash-plus</v-icon>
        新增繳款紀錄{{ unitId ? `（${unitId}）` : '' }}
      </v-card-title>
      <v-card-text class="pt-2">
        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model="quickAdd.date" label="繳款日期 *" type="date" variant="outlined"
              density="compact" hide-details="auto" />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="quickAdd.amount" label="金額(元) *" type="number" min="1" variant="outlined"
              density="compact" hide-details="auto" />
          </v-col>
          <v-col cols="12">
            <v-text-field v-model="quickAdd.note" label="備註" variant="outlined" density="compact"
              hide-details="auto" placeholder="例: 簽約款" />
          </v-col>
          <v-col cols="12">
            <div v-if="!driveFolderUrl" class="text-caption text-orange-darken-2">
              <v-icon size="14" class="mr-1">mdi-alert</v-icon>
              請先於銷控設定此戶別的「戶別資料夾位置」，才能上傳繳款憑證
            </div>
            <template v-else>
              <div v-if="quickAdd.file" class="d-flex align-center" style="gap: 12px;">
                <v-img :src="quickAdd.previewUrl" width="64" height="64" cover class="pr-thumb rounded"
                  @click.stop="openRawLightbox(quickAdd.previewUrl, quickAdd.file.name)" />
                <div class="d-flex flex-column" style="gap: 4px; min-width: 0;">
                  <span class="text-caption text-truncate">{{ quickAdd.file.name }}</span>
                  <div class="d-flex" style="gap: 6px;">
                    <v-btn size="x-small" variant="tonal" prepend-icon="mdi-image-sync" @click="triggerQuickAddFileSelect">
                      更換圖檔
                    </v-btn>
                    <v-btn size="x-small" variant="tonal" color="error" prepend-icon="mdi-close" @click="removeQuickAddFile">
                      移除
                    </v-btn>
                  </div>
                </div>
              </div>
              <v-btn v-else size="small" variant="outlined" prepend-icon="mdi-image-plus" @click="triggerQuickAddFileSelect">
                選擇繳款憑證圖檔
              </v-btn>
              <div class="text-caption text-grey mt-1">JPG / PNG / WEBP，10MB 以內；點縮圖可放大確認</div>
            </template>
            <input ref="quickAddFileInputRef" type="file" accept="image/jpeg,image/png,image/webp"
              class="d-none" @change="onQuickAddFileSelected" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" :disabled="quickAdd.saving" @click="closeQuickAdd">取消</v-btn>
        <v-btn color="primary" variant="flat" :loading="quickAdd.saving" @click="submitQuickAdd">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- ── 燈箱放大 ── -->
  <v-dialog v-model="lightbox.open" max-width="1000">
    <v-card class="pr-lightbox-card">
      <v-btn icon size="small" variant="flat" class="pr-lightbox-close" @click.stop="lightbox.open = false">
        <v-icon>mdi-close</v-icon>
      </v-btn>
      <div
        ref="lightboxStageRef"
        class="pr-lightbox-stage"
        :class="{ 'pr-lightbox-dragging': lbView.dragging }"
        @wheel.prevent="onLightboxWheel"
        @pointerdown="onLightboxPointerDown"
        @pointermove="onLightboxPointerMove"
        @pointerup="onLightboxPointerUp"
        @pointercancel="onLightboxPointerUp"
        @dblclick="onLightboxDblclick"
      >
        <img
          v-if="!lbView.error"
          :src="lightbox.src"
          :style="lightboxImgStyle"
          class="pr-lightbox-img"
          draggable="false"
          alt=""
          @load="lbView.loading = false"
          @error="lbView.loading = false; lbView.error = true"
        />
        <div v-if="lbView.error" class="text-center pa-10">
          <v-icon size="64" color="grey">mdi-image-off-outline</v-icon>
          <p class="text-caption text-grey mt-2">無法載入預覽圖</p>
        </div>
        <div v-else-if="lbView.loading" class="pr-lightbox-loading">
          <v-progress-circular indeterminate color="grey"></v-progress-circular>
        </div>
      </div>
      <div class="pr-lightbox-toolbar" @click.stop>
        <v-btn icon size="small" variant="text" color="grey-lighten-1" title="縮小" @click="zoomLightboxAt(1 / 1.25)">
          <v-icon>mdi-magnify-minus-outline</v-icon>
        </v-btn>
        <span class="pr-lightbox-zoom-label" title="重設檢視" @click="resetLightboxView">{{ Math.round(lbView.zoom * 100) }}%</span>
        <v-btn icon size="small" variant="text" color="grey-lighten-1" title="放大" @click="zoomLightboxAt(1.25)">
          <v-icon>mdi-magnify-plus-outline</v-icon>
        </v-btn>
        <v-divider vertical class="mx-1 pr-lightbox-divider" />
        <v-btn icon size="small" variant="text" color="grey-lighten-1" title="向左旋轉" @click="lbView.rotate -= 90">
          <v-icon>mdi-rotate-left</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="grey-lighten-1" title="向右旋轉" @click="lbView.rotate += 90">
          <v-icon>mdi-rotate-right</v-icon>
        </v-btn>
        <v-btn icon size="small" variant="text" color="grey-lighten-1" title="重設檢視" @click="resetLightboxView">
          <v-icon>mdi-backup-restore</v-icon>
        </v-btn>
      </div>
      <v-card-actions class="justify-center" @click.stop>
        <span class="text-caption text-grey text-truncate mr-2">{{ lightbox.name }}</span>
        <v-btn
          v-if="lightbox.webViewLink"
          size="small"
          variant="tonal"
          color="primary"
          prepend-icon="mdi-google-drive"
          :href="lightbox.webViewLink"
          target="_blank"
        >
          在 Drive 開啟
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, reactive, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  editable: { type: Boolean, default: false },
  totalPriceWan: { type: [Number, String], default: null }, // 成交總價（萬）
  unitId: { type: String, default: '' },
  driveFolderUrl: { type: String, default: '' },
  allowQuickAdd: { type: Boolean, default: false }, // 檢視模式是否顯示「新增繳款紀錄」（即時儲存）
  quickAddHandler: { type: Function, default: null }, // async ({date, amount, note, file}) => void，由父層執行上傳與寫入
  defaultExpanded: { type: Boolean, default: false }, // 是否預設展開（浮動一覽用）
});
const emit = defineEmits(['update:modelValue']);

const expanded = ref(props.defaultExpanded ? [0] : []); // 預設收合；defaultExpanded 時展開
const fileInputRef = ref(null);
const pendingSelectIdx = ref(-1);

const records = computed(() => props.modelValue || []);

// ── 合計與繳款比例 ──
const totalPaid = computed(() =>
  records.value.reduce((sum, r) => sum + (Number(r.amount) || 0), 0)
);
const ratioText = computed(() => {
  const totalWan = Number(props.totalPriceWan);
  if (!totalWan || Number.isNaN(totalWan)) return '—';
  const ratio = totalPaid.value / (totalWan * 10000);
  return `${(ratio * 100).toFixed(1)}%`;
});

// ── 縮圖來源 ──
function driveThumb(fileId, size) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=${size}`;
}
function thumbSrc(r) {
  return r.file ? driveThumb(r.file.fileId, 'w200') : '';
}
function editThumbSrc(r) {
  if (r._pendingPreviewUrl) return r._pendingPreviewUrl;
  return thumbSrc(r);
}

// ── 快速新增（檢視模式，即時儲存；上傳與寫入由父層 quickAddHandler 執行）──
const quickAddFileInputRef = ref(null);
const quickAdd = reactive({ open: false, saving: false, date: '', amount: null, note: '', file: null, previewUrl: '' });

function openQuickAdd() {
  quickAdd.date = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  quickAdd.amount = null;
  quickAdd.note = '';
  removeQuickAddFile();
  quickAdd.saving = false;
  quickAdd.open = true;
}
function closeQuickAdd() {
  if (quickAdd.saving) return;
  removeQuickAddFile();
  quickAdd.open = false;
}
function triggerQuickAddFileSelect() {
  if (quickAddFileInputRef.value) {
    quickAddFileInputRef.value.value = '';
    quickAddFileInputRef.value.click();
  }
}
function onQuickAddFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;
  if (!ACCEPT_TYPES.includes(file.type)) {
    window.alert('僅接受 JPG、PNG、WEBP 圖檔。');
    return;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    window.alert(`圖檔大小不可超過 ${MAX_SIZE_MB}MB。`);
    return;
  }
  if (quickAdd.previewUrl) URL.revokeObjectURL(quickAdd.previewUrl);
  quickAdd.file = file;
  quickAdd.previewUrl = URL.createObjectURL(file);
}
function removeQuickAddFile() {
  if (quickAdd.previewUrl) URL.revokeObjectURL(quickAdd.previewUrl);
  quickAdd.file = null;
  quickAdd.previewUrl = '';
}
async function submitQuickAdd() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(quickAdd.date || ''))) {
    window.alert('請選擇繳款日期。');
    return;
  }
  const amountNum = Math.round(Number(quickAdd.amount));
  if (!Number.isInteger(amountNum) || amountNum <= 0 || Number.isNaN(amountNum)) {
    window.alert('金額必須為大於 0 的整數（元）。');
    return;
  }
  if (typeof props.quickAddHandler !== 'function') return;
  quickAdd.saving = true;
  try {
    await props.quickAddHandler({
      date: quickAdd.date,
      amount: amountNum,
      note: quickAdd.note || '',
      file: quickAdd.file,
    });
    removeQuickAddFile();
    quickAdd.open = false;
  } catch (error) {
    window.alert(`新增繳款紀錄失敗：${error.message}`);
  } finally {
    quickAdd.saving = false;
  }
}

// ── 燈箱 ──
const lightbox = reactive({ open: false, src: '', name: '', webViewLink: '' });
const lbView = reactive({ zoom: 1, rotate: 0, panX: 0, panY: 0, loading: true, error: false, dragging: false });
const lightboxStageRef = ref(null);
const lightboxImgStyle = computed(() => ({
  transform: `translate(${lbView.panX}px, ${lbView.panY}px) scale(${lbView.zoom}) rotate(${lbView.rotate}deg)`,
}));
function resetLightboxView() {
  lbView.zoom = 1;
  lbView.rotate = 0;
  lbView.panX = 0;
  lbView.panY = 0;
}
function clampZoom(z) {
  return Math.min(8, Math.max(0.2, z));
}
// 以指定螢幕座標為錨點縮放（未給座標則以畫面中心）
function zoomLightboxAt(factor, clientX = null, clientY = null) {
  const oldZoom = lbView.zoom;
  const newZoom = clampZoom(oldZoom * factor);
  if (newZoom === oldZoom) return;
  const stage = lightboxStageRef.value;
  if (stage && clientX != null) {
    const rect = stage.getBoundingClientRect();
    const px = clientX - rect.left - rect.width / 2;
    const py = clientY - rect.top - rect.height / 2;
    const ratio = newZoom / oldZoom;
    lbView.panX = px - ratio * (px - lbView.panX);
    lbView.panY = py - ratio * (py - lbView.panY);
  }
  lbView.zoom = newZoom;
}
function onLightboxWheel(e) {
  zoomLightboxAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX, e.clientY);
}
function onLightboxDblclick(e) {
  if (lbView.zoom !== 1 || lbView.panX || lbView.panY) resetLightboxView();
  else zoomLightboxAt(2.5, e.clientX, e.clientY);
}
// 單指拖曳平移、雙指捏合縮放
const lbPointers = new Map();
let lbPanStart = null;
let lbPinchStart = null;
function lbPointerDist() {
  const pts = [...lbPointers.values()];
  return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
}
function onLightboxPointerDown(e) {
  e.currentTarget.setPointerCapture?.(e.pointerId);
  lbPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lbPointers.size === 1) {
    lbPanStart = { x: e.clientX, y: e.clientY, panX: lbView.panX, panY: lbView.panY };
    lbView.dragging = true;
  } else if (lbPointers.size === 2) {
    lbPanStart = null;
    lbPinchStart = { dist: lbPointerDist(), zoom: lbView.zoom };
  }
}
function onLightboxPointerMove(e) {
  if (!lbPointers.has(e.pointerId)) return;
  lbPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (lbPointers.size === 2 && lbPinchStart) {
    lbView.zoom = clampZoom(lbPinchStart.zoom * (lbPointerDist() / lbPinchStart.dist));
  } else if (lbPointers.size === 1 && lbPanStart) {
    lbView.panX = lbPanStart.panX + (e.clientX - lbPanStart.x);
    lbView.panY = lbPanStart.panY + (e.clientY - lbPanStart.y);
  }
}
function onLightboxPointerUp(e) {
  lbPointers.delete(e.pointerId);
  if (lbPointers.size < 2) lbPinchStart = null;
  if (lbPointers.size === 0) {
    lbPanStart = null;
    lbView.dragging = false;
  } else if (lbPointers.size === 1) {
    const p = [...lbPointers.values()][0];
    lbPanStart = { x: p.x, y: p.y, panX: lbView.panX, panY: lbView.panY };
  }
}
function prepareLightbox(newSrc) {
  resetLightboxView();
  // 同一張圖重開時 <img> 不會再觸發 load 事件，只有換圖才顯示 loading
  lbView.loading = newSrc !== lightbox.src;
  lbView.error = false;
  lbPointers.clear();
  lbPanStart = null;
  lbPinchStart = null;
}
function openRawLightbox(src, name) {
  prepareLightbox(src);
  lightbox.src = src;
  lightbox.name = name || '';
  lightbox.webViewLink = '';
  lightbox.open = true;
}
function openLightbox(r) {
  let src;
  if (r._pendingPreviewUrl) {
    src = r._pendingPreviewUrl;
    prepareLightbox(src);
    lightbox.name = r._pendingFile ? r._pendingFile.name : '';
    lightbox.webViewLink = '';
  } else if (r.file) {
    src = driveThumb(r.file.fileId, 'w1600');
    prepareLightbox(src);
    lightbox.name = r.file.fileName || '';
    lightbox.webViewLink = r.file.webViewLink || '';
  } else {
    return;
  }
  lightbox.src = src;
  lightbox.open = true;
}

// ── 編輯操作：emit 整個陣列（不就地改 props）──
function commit(next) {
  emit('update:modelValue', next);
}
function update(idx, key, value) {
  const nowIso = new Date().toISOString();
  const next = records.value.map((r, i) => (i === idx ? { ...r, [key]: value, updatedAt: nowIso } : r));
  commit(next);
}
function addRecord() {
  const nowIso = new Date().toISOString();
  const todayTaipei = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Taipei' });
  commit([
    ...records.value,
    {
      id: `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: todayTaipei,
      amount: null,
      note: '',
      file: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ]);
}
function confirmRemove(idx) {
  if (!window.confirm(`確定要刪除繳款 #${idx + 1} 嗎？（已上傳的 Drive 圖檔會保留）`)) return;
  const target = records.value[idx];
  if (target && target._pendingPreviewUrl) URL.revokeObjectURL(target._pendingPreviewUrl);
  commit(records.value.filter((_, i) => i !== idx));
}

// ── 圖檔選擇（延遲提交：僅存本地 File，儲存時由父層上傳）──
const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;

function triggerFileSelect(idx) {
  pendingSelectIdx.value = idx;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
}
function onFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  const idx = pendingSelectIdx.value;
  pendingSelectIdx.value = -1;
  if (!file || idx < 0) return;

  if (!ACCEPT_TYPES.includes(file.type)) {
    window.alert('僅接受 JPG、PNG、WEBP 圖檔。');
    return;
  }
  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    window.alert(`圖檔大小不可超過 ${MAX_SIZE_MB}MB。`);
    return;
  }

  const nowIso = new Date().toISOString();
  const next = records.value.map((r, i) => {
    if (i !== idx) return r;
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
    return {
      ...r,
      _pendingFile: file,
      _pendingPreviewUrl: URL.createObjectURL(file),
      updatedAt: nowIso,
    };
  });
  commit(next);
}
function removePendingFile(idx) {
  const next = records.value.map((r, i) => {
    if (i !== idx) return r;
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
    const { _pendingFile, _pendingPreviewUrl, ...rest } = r;
    return rest;
  });
  commit(next);
}

onBeforeUnmount(() => {
  records.value.forEach(r => {
    if (r._pendingPreviewUrl) URL.revokeObjectURL(r._pendingPreviewUrl);
  });
  if (quickAdd.previewUrl) URL.revokeObjectURL(quickAdd.previewUrl);
});

// ── 工具 ──
function toIntOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = Math.round(Number(v));
  return Number.isNaN(n) ? null : n;
}
function formatMoney(v) {
  const n = Number(v);
  if (!v && v !== 0) return '—';
  if (Number.isNaN(n)) return '—';
  return n.toLocaleString('zh-TW');
}
</script>

<style scoped>
.payment-records-panel :deep(.v-expansion-panel-title) {
  min-height: 40px;
  padding: 8px 12px;
}
.payment-records-panel :deep(.v-expansion-panel-text__wrapper) {
  padding: 8px 12px 12px;
}

/* ── 檢視模式表格 ── */
.pr-view-table {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
}
.pr-row {
  display: grid;
  grid-template-columns: 36px 1.2fr 1.2fr 2fr 64px;
  gap: 8px;
  padding: 4px 6px;
  border-bottom: 1px solid #eee;
  align-items: center;
}
.pr-header {
  background: #f5f5f5;
  font-weight: 600;
  color: #555;
  border-bottom: 1px solid #ddd;
}
.pr-col-idx { color: #999; text-align: center; }
.pr-col-amount { text-align: right; font-variant-numeric: tabular-nums; }

@media (max-width: 768px) {
  .pr-row {
    grid-template-columns: 1fr 1fr;
    row-gap: 4px;
  }
  .pr-header { display: none; }
  .pr-col-idx::before { content: '#'; margin-right: 4px; }
  .pr-col-date::before { content: '日期: '; color: #999; }
  .pr-col-amount::before { content: '金額: '; color: #999; }
  .pr-col-note::before { content: '備註: '; color: #999; }
}

/* ── 縮圖 ── */
.pr-thumb {
  cursor: pointer;
  border: 1px solid #ddd;
  flex: 0 0 auto;
}
.pr-thumb-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: #f5f5f5;
}

/* ── 編輯模式卡片 ── */
.pr-edit-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

/* ── 燈箱 ── */
.pr-lightbox-card {
  position: relative;
  background: rgba(0, 0, 0, 0.9);
}
.pr-lightbox-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}
.pr-lightbox-stage {
  position: relative;
  height: 72vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
}
.pr-lightbox-stage.pr-lightbox-dragging {
  cursor: grabbing;
}
.pr-lightbox-img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.15s ease;
  will-change: transform;
  pointer-events: none;
}
.pr-lightbox-dragging .pr-lightbox-img {
  transition: none;
}
.pr-lightbox-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pr-lightbox-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding-top: 4px;
}
.pr-lightbox-zoom-label {
  font-size: 12px;
  color: #bbb;
  min-width: 44px;
  text-align: center;
  cursor: pointer;
}
.pr-lightbox-divider {
  border-color: rgba(255, 255, 255, 0.3);
}
.pr-lightbox-card .v-card-actions .text-caption {
  color: #ccc;
  max-width: 50vw;
}
</style>
