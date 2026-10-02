<template>
  <v-dialog :model-value="modelValue" fullscreen persistent :scrim="false" transition="dialog-bottom-transition">
    <!-- macOS 風格：淡灰工具列＋左側分組設定列＋右側即時預覽 -->
    <div v-if="draft" class="qe-window">
      <div class="qe-toolbar">
        <v-icon size="18" class="qe-toolbar-icon">mdi-file-document-edit-outline</v-icon>
        <div class="qe-title">
          <span class="qe-title-main">報價單</span>
          <span class="qe-title-sub">{{ subscription.projectName }} · {{ subscription.systemFunction }}</span>
          <span class="qe-badge">v{{ draft.version }}</span>
        </div>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" title="下載 PNG" :disabled="!!busy" @click="downloadPng">
          <v-progress-circular v-if="busy === 'png'" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-image-outline</v-icon>
          <span class="qe-btn-text">PNG</span>
        </button>
        <button type="button" class="mac-btn" title="下載 PDF" :disabled="!!busy" @click="downloadPdf">
          <v-progress-circular v-if="busy === 'pdf'" indeterminate size="14" width="2"></v-progress-circular>
          <v-icon v-else size="16">mdi-file-pdf-box</v-icon>
          <span class="qe-btn-text">PDF</span>
        </button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!!busy" @click="save">
          <v-progress-circular v-if="busy === 'save'" indeterminate size="14" width="2"></v-progress-circular>
          <span>儲存</span>
        </button>
        <button type="button" class="mac-sheet-close qe-close" aria-label="關閉" :disabled="!!busy" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div v-if="mobile" class="qe-segbar">
        <div class="mac-form-seg qe-seg-full" role="tablist">
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': mobileTab === 'edit' }" @click="mobileTab = 'edit'">編輯</button>
          <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': mobileTab === 'preview' }" @click="mobileTab = 'preview'">預覽</button>
        </div>
      </div>

      <div class="qe-body">
        <!-- 編輯 -->
        <div v-show="!mobile || mobileTab === 'edit'" class="qe-form mac-form">
          <div v-if="copySources.length" class="mac-form-group qe-first">
            <div class="mac-form-row">
              <span class="mac-form-row-label">複製自</span>
              <select class="mac-form-input mac-form-select" :value="''" @change="onCopyPick">
                <option value="" disabled>選擇其他報價</option>
                <option v-for="(src, i) in copySources" :key="i" :value="i">{{ src.title }}</option>
              </select>
            </div>
          </div>

          <div class="mac-form-label">基本</div>
          <div class="mac-form-group">
            <label class="mac-form-row">
              <span class="mac-form-row-label">報價日期</span>
              <input v-model="draft.date" type="date" class="mac-form-input" />
            </label>
            <label class="mac-form-row">
              <span class="mac-form-row-label">有效天數</span>
              <span class="mac-form-input mac-form-unit"><input v-model.number="draft.validDays" type="number" min="0" /><span>天</span></span>
            </label>
          </div>

          <div class="mac-form-label">買受人</div>
          <div class="mac-form-group">
            <label class="mac-form-row"><span class="mac-form-row-label">公司名稱</span><input v-model="draft.billTo.name" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">統編</span><input v-model="draft.billTo.taxId" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">聯絡人</span><input v-model="draft.billTo.contactName" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">電話</span><input v-model="draft.billTo.phone" class="mac-form-input" /></label>
          </div>

          <div class="mac-form-label">單位資訊</div>
          <div class="mac-form-group">
            <label class="mac-form-row"><span class="mac-form-row-label">聯絡人</span><input v-model="draft.from.contactName" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">電話</span><input v-model="draft.from.phone" class="mac-form-input" /></label>
          </div>

          <div class="mac-form-label">
            品項
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" @click="addItem"><v-icon size="14">mdi-plus</v-icon><span>新增</span></button>
          </div>
          <div class="mac-form-group">
            <div v-if="!draft.items.length" class="mac-form-row mac-form-empty">尚無品項</div>
            <div v-for="(item, i) in draft.items" :key="i" class="mac-form-pad">
              <div class="qe-item-row">
                <input v-model="item.name" class="mac-form-input" placeholder="品名" />
                <span class="mac-form-input mac-form-unit"><span>$</span><input v-model.number="item.amount" type="number" placeholder="金額" /></span>
              </div>
              <div class="qe-item-row is-desc">
                <input v-model="item.desc" class="mac-form-input" placeholder="說明" />
                <button type="button" class="mac-icon-btn" title="上移" :style="{ visibility: i > 0 ? 'visible' : 'hidden' }" @click="moveItem(i)"><v-icon size="16">mdi-arrow-up</v-icon></button>
                <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="draft.items.splice(i, 1)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
              </div>
            </div>
          </div>

          <div class="mac-form-label">金額</div>
          <div class="mac-form-group">
            <div class="mac-form-row qe-sum"><span>小計</span><span>{{ money(totals.subtotal) }}</span></div>
            <div class="mac-form-row qe-sum"><span>營業稅 {{ Math.round(draft.taxRate * 100) }}%</span><span>{{ money(totals.tax) }}</span></div>
            <div class="mac-form-row qe-sum is-total"><span>總計</span><span>{{ money(totals.total) }}</span></div>
            <label class="mac-form-row">
              <span class="mac-form-row-label">優惠價（含稅）</span>
              <span class="mac-form-input mac-form-unit qe-discount"><span>$</span><input v-model.number="draft.discountedTotal" type="number" placeholder="選填" /></span>
            </label>
          </div>

          <div class="mac-form-label">
            備註說明
            <span class="mac-spacer"></span>
            <v-menu v-if="settings.noteTemplates?.length">
              <template v-slot:activator="{ props: menuProps }">
                <button v-bind="menuProps" type="button" class="mac-btn mac-btn--sm"><v-icon size="14">mdi-format-list-bulleted</v-icon><span>範本</span></button>
              </template>
              <v-list density="compact">
                <v-list-item v-for="(t, i) in settings.noteTemplates" :key="i" :title="t.name" @click="applyNoteTemplate(t)"></v-list-item>
              </v-list>
            </v-menu>
            <button type="button" class="mac-btn mac-btn--sm" @click="openTemplateDialog('notes')"><v-icon size="14">mdi-content-save-outline</v-icon><span>存範本</span></button>
          </div>
          <div class="mac-form-group mac-form-pad">
            <textarea v-model="draft.notes" class="mac-form-textarea" rows="6"></textarea>
          </div>

          <div class="mac-form-label">
            圖片
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" @click="imagePicker = true"><v-icon size="14">mdi-image-plus-outline</v-icon><span>插入</span></button>
          </div>
          <div class="mac-form-group">
            <div v-if="!draft.images.length" class="mac-form-row mac-form-empty">尚無圖片</div>
            <div v-for="img in draft.images" :key="img.id" class="mac-form-row mac-form-link" @click="selectImage(img.id)">
              <span class="qe-thumb"><img :src="img.url" alt="" /></span>
              <span class="mac-form-row-main mac-form-row-title text-truncate">{{ img.name }}</span>
              <span class="qe-dim">{{ Math.round(img.rotate || 0) }}°</span>
              <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="移除" @click.stop="removeImage(img.id)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
            </div>
          </div>

          <div class="mac-form-label">
            付款條件
            <span class="mac-spacer"></span>
            <v-menu v-if="settings.planTemplates?.length">
              <template v-slot:activator="{ props: menuProps }">
                <button v-bind="menuProps" type="button" class="mac-btn mac-btn--sm"><v-icon size="14">mdi-format-list-bulleted</v-icon><span>範本</span></button>
              </template>
              <v-list density="compact">
                <v-list-item v-for="(t, i) in settings.planTemplates" :key="i" :title="t.name" @click="applyTemplate(t)"></v-list-item>
              </v-list>
            </v-menu>
            <button type="button" class="mac-btn mac-btn--sm" @click="openTemplateDialog('plan')"><v-icon size="14">mdi-content-save-outline</v-icon><span>存範本</span></button>
            <button type="button" class="mac-btn mac-btn--sm" @click="addPlanRow"><v-icon size="14">mdi-plus</v-icon><span>新增</span></button>
          </div>
          <div class="mac-form-group">
            <div v-if="!draft.plan.length" class="mac-form-row mac-form-empty">尚無付款條件</div>
            <div v-for="(p, i) in draft.plan" :key="i" class="mac-form-pad">
              <div class="qe-plan-head">
                <span class="qe-plan-no">{{ i + 1 }}</span>
                <span class="qe-plan-amount">{{ money(planPreview[i]?.amount) }}</span>
                <span class="mac-spacer"></span>
                <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="draft.plan.splice(i, 1)"><v-icon size="16">mdi-trash-can-outline</v-icon></button>
              </div>
              <div class="qe-plan-row is-main">
                <input v-model="p.label" class="mac-form-input" placeholder="期別" />
                <div class="mac-form-seg">
                  <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': p.mode === 'percent' }" @click="p.mode = 'percent'">%</button>
                  <button type="button" class="mac-form-seg-btn" :class="{ 'is-active': p.mode === 'amount' }" @click="p.mode = 'amount'">$</button>
                </div>
                <span class="mac-form-input mac-form-unit">
                  <span v-if="p.mode === 'amount'">$</span>
                  <input v-model.number="p.value" type="number" :placeholder="p.mode === 'percent' ? '比例' : '金額'" />
                  <span v-if="p.mode === 'percent'">%</span>
                </span>
              </div>
              <div class="qe-plan-row" :class="p.base === 'date' ? 'is-date' : 'is-base'">
                <select v-model="p.base" class="mac-form-input mac-form-select">
                  <option v-for="b in PLAN_BASES" :key="b.value" :value="b.value">{{ b.title }}</option>
                </select>
                <input v-if="p.base === 'date'" v-model="p.fixedDate" type="date" class="mac-form-input" />
                <template v-else>
                  <input v-model.number="p.offset" type="number" min="0" class="mac-form-input" placeholder="N" />
                  <select v-model="p.offsetUnit" class="mac-form-input mac-form-select">
                    <option v-for="u in OFFSET_UNITS" :key="u.value" :value="u.value">{{ u.title }}</option>
                  </select>
                </template>
              </div>
            </div>
          </div>
          <div v-if="planWarning" class="qe-warning">{{ planWarning }}</div>
        </div>

        <!-- 預覽 -->
        <div v-show="!mobile || mobileTab === 'preview'" ref="previewPane" class="qe-preview">
          <div class="qe-preview-frame" :style="{ width: `${794 * scale}px`, height: `${sheetHeight * scale}px` }">
            <div ref="previewInner" :style="{ transform: `scale(${scale})`, transformOrigin: 'top left' }">
              <QuoteSheet
                ref="previewSheet"
                :quote="draft"
                :seals="settings.seals"
                editable
                :ui-scale="scale"
                @update:images="draft.images = $event"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 匯出用：原尺寸渲染 -->
      <div class="qe-export-host" aria-hidden="true">
        <QuoteSheet ref="exportSheet" :quote="draft" :seals="settings.seals" />
      </div>
    </div>

    <v-dialog v-model="imagePicker" max-width="720" scrollable>
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-image-plus-outline</v-icon>
          <span>插入圖片</span>
          <button type="button" class="mac-sheet-close" aria-label="關閉" @click="imagePicker = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <v-card-text class="mac-form qe-dialog-body">
          <div class="mac-form-group mac-form-pad">
            <QuoteImageLibrary selectable mac @select="insertImage" />
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="templateDialog" max-width="400">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-content-save-outline</v-icon>
          <span>{{ templateKind === 'notes' ? '存為備註範本' : '存為付款條件範本' }}</span>
          <button type="button" class="mac-sheet-close" aria-label="關閉" @click="templateDialog = false"><v-icon size="18">mdi-close</v-icon></button>
        </div>
        <div class="mac-form qe-dialog-body">
          <div class="mac-form-group">
            <label class="mac-form-row">
              <span class="mac-form-row-label">範本名稱</span>
              <input v-model="templateName" class="mac-form-input" autofocus @keydown.enter="templateName.trim() && saveTemplate()" />
            </label>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <button type="button" class="mac-btn" @click="templateDialog = false">取消</button>
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!templateName.trim()" @click="saveTemplate">儲存</button>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QuoteSheet from './QuoteSheet.vue';
import QuoteImageLibrary from './QuoteImageLibrary.vue';
import { quoteTotals, buildInstallments, PLAN_BASES } from '@/utils/subscriptionPipeline';
import { quoteFileBase } from './quoteDefaults';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  subscription: { type: Object, required: true },
  quote: { type: Object, default: null },
  settings: { type: Object, required: true },
  copySources: { type: Array, default: () => [] },
  onSave: { type: Function, required: true },          // async (quote)
  onAttachPdf: { type: Function, required: true },     // async (blob, fileName, quote)
  onSaveTemplate: { type: Function, required: true },  // async (kind: 'plan'|'notes', name, value)
});
const emit = defineEmits(['update:modelValue']);

const { mobile } = useDisplay();
const mobileTab = ref('edit');
const draft = ref(null);
const busy = ref('');
const savedSnapshot = ref('');
const OFFSET_UNITS = [{ value: 'day', title: '天' }, { value: 'month', title: '個月' }];
const templateDialog = ref(false);
const templateKind = ref('plan');
const templateName = ref('');
const imagePicker = ref(false);
const previewSheet = ref(null);
const previewPane = ref(null);
const previewInner = ref(null);
const exportSheet = ref(null);
const scale = ref(0.6);
const sheetHeight = ref(1123);

const clone = (v) => JSON.parse(JSON.stringify(v));

// 版本判斷只看內容欄位
function contentOf(q) {
  const { version, pdfVersion, ...rest } = q;
  return JSON.stringify(rest);
}

watch(() => props.modelValue, (open) => {
  previewSheet.value?.select(null);
  if (!open) return;
  draft.value = clone(props.quote);
  if (!Array.isArray(draft.value.images)) draft.value.images = [];
  savedSnapshot.value = contentOf(draft.value);
  mobileTab.value = 'edit';
  nextTick(() => setTimeout(observePreview, 50));
}, { immediate: true });

const totals = computed(() => quoteTotals(draft.value));
// 拆期試算（金額為 0 的列不產生款項，對應回原列）
const planPreview = computed(() => {
  const plan = draft.value?.plan || [];
  const built = buildInstallments(plan, totals.value.finalAmount);
  let k = 0;
  return plan.map(p => (Number(p.value) > 0 ? built[k++] : { amount: 0 }));
});
const planWarning = computed(() => {
  const plan = draft.value?.plan || [];
  if (plan.length === 0) return '未設定付款條件';
  if (plan.every(p => p.mode === 'percent')) {
    const sum = plan.reduce((s, p) => s + (Number(p.value) || 0), 0);
    if (sum !== 100) return `比例合計 ${sum}%`;
  }
  return '';
});

function money(n) {
  return `$${(Number(n) || 0).toLocaleString()}`;
}

function addItem() {
  draft.value.items.push({ name: '', desc: '', amount: 0 });
}

function moveItem(i) {
  const items = draft.value.items;
  [items[i - 1], items[i]] = [items[i], items[i - 1]];
}

function addPlanRow() {
  const n = draft.value.plan.length + 1;
  draft.value.plan.push({ label: `第${n}期`, mode: 'percent', value: 0, base: 'activated', offset: 0, offsetUnit: 'day', fixedDate: '' });
}

function applyTemplate(t) {
  draft.value.plan = clone(t.plan || []);
}

function applyCopy(src) {
  if (!src?.quote) return;
  const q = src.quote;
  draft.value.items = clone(q.items || []);
  draft.value.notes = q.notes || '';
  draft.value.plan = clone(q.plan || []);
  draft.value.discountedTotal = q.discountedTotal || 0;
  draft.value.images = clone(q.images || []);
}

function onCopyPick(e) {
  const src = props.copySources[Number(e.target.value)];
  e.target.value = '';
  applyCopy(src);
}

function applyNoteTemplate(t) {
  const current = (draft.value.notes || '').trim();
  if (current && current !== t.content.trim() && !confirm(`以「${t.name}」取代目前的備註說明？`)) return;
  draft.value.notes = t.content;
}

function openTemplateDialog(kind) {
  templateKind.value = kind;
  templateName.value = '';
  templateDialog.value = true;
}

async function saveTemplate() {
  const value = templateKind.value === 'notes' ? draft.value.notes : clone(draft.value.plan);
  try {
    await props.onSaveTemplate(templateKind.value, templateName.value.trim(), value);
    templateDialog.value = false;
  } catch (e) {
    alert('儲存範本失敗：' + e.message);
  }
}

// --- 圖片 ---
function insertImage(libImage) {
  const ratio = libImage.width && libImage.height ? libImage.height / libImage.width : 1;
  const w = Math.min(220, libImage.width || 220);
  const h = Math.round(w * ratio * 10) / 10;
  const id = `IMG-${Date.now()}`;
  draft.value.images = [...draft.value.images, {
    id,
    imageId: libImage.id,
    name: libImage.name,
    url: libImage.url,
    x: Math.round((794 - w) / 2),
    y: 160,
    w,
    h,
    rotate: 0,
  }];
  imagePicker.value = false;
  if (mobile.value) mobileTab.value = 'preview';
  nextTick(() => previewSheet.value?.select(id));
}

function selectImage(id) {
  if (mobile.value) mobileTab.value = 'preview';
  previewSheet.value?.select(id);
}

function removeImage(id) {
  draft.value.images = draft.value.images.filter(i => i.id !== id);
}

// --- 預覽縮放 ---
let resizeObserver = null;
function observePreview() {
  resizeObserver?.disconnect();
  if (!previewPane.value) return;
  resizeObserver = new ResizeObserver(() => {
    const w = previewPane.value?.clientWidth || 0;
    if (w < 100) return;
    scale.value = Math.min(1, (w - 32) / 794);
    sheetHeight.value = previewInner.value?.firstElementChild?.offsetHeight || 1123;
  });
  resizeObserver.observe(previewPane.value);
  if (previewInner.value) resizeObserver.observe(previewInner.value);
}
onBeforeUnmount(() => resizeObserver?.disconnect());

// --- 儲存 / 匯出 ---
async function persistIfDirty() {
  const content = contentOf(draft.value);
  if (content === savedSnapshot.value) return;
  // 已存過 PDF 的版本被修改 → 新版號
  const bumped = draft.value.pdfVersion > 0 && draft.value.pdfVersion === draft.value.version;
  const next = { ...clone(draft.value), version: draft.value.version + (bumped ? 1 : 0) };
  await props.onSave(next);
  draft.value.version = next.version;
  savedSnapshot.value = content;
}

async function save() {
  busy.value = 'save';
  try {
    await persistIfDirty();
  } catch (e) {
    alert('儲存失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}

async function renderCanvas() {
  const el = exportSheet.value?.$el;
  await nextTick();
  if (document.fonts?.ready) await document.fonts.ready;
  await Promise.all(Array.from(el.querySelectorAll('img')).map(img => (
    img.complete ? null : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })
  )));
  return html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false });
}

function triggerDownload(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function downloadPdf() {
  busy.value = 'pdf';
  try {
    await persistIfDirty();
    const canvas = await renderCanvas();
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    let w = 210;
    let h = canvas.height * 210 / canvas.width;
    if (h > 297) {
      h = 297;
      w = canvas.width * 297 / canvas.height;
    }
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', (210 - w) / 2, 0, w, h);
    const base = quoteFileBase(draft.value, props.subscription);
    const blob = pdf.output('blob');
    triggerDownload(blob, `${base}.pdf`);
    // 此版本尚未存檔 → 存入「報價」步驟附件
    if (draft.value.pdfVersion !== draft.value.version) {
      const next = { ...clone(draft.value), pdfVersion: draft.value.version };
      await props.onAttachPdf(blob, `${base}-v${draft.value.version}.pdf`, next);
      draft.value.pdfVersion = draft.value.version;
    }
  } catch (e) {
    console.error('報價單 PDF 產生失敗:', e);
    alert('PDF 產生失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}

async function downloadPng() {
  busy.value = 'png';
  try {
    await persistIfDirty();
    const canvas = await renderCanvas();
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    triggerDownload(blob, `${quoteFileBase(draft.value, props.subscription)}.png`);
  } catch (e) {
    console.error('報價單 PNG 產生失敗:', e);
    alert('PNG 產生失敗：' + e.message);
  } finally {
    busy.value = '';
  }
}

function close() {
  if (contentOf(draft.value) !== savedSnapshot.value && !confirm('報價單尚未儲存，確定關閉？')) return;
  emit('update:modelValue', false);
}
</script>

<style scoped>
.qe-window {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.qe-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 0 12px 0 16px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.qe-toolbar .mac-spacer {
  flex: 1 1 auto;
}
.qe-toolbar-icon {
  color: #6e6e73;
}
.qe-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}
.qe-title-main {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.qe-title-sub {
  font-size: 12.5px;
  color: #6e6e73;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qe-badge {
  flex-shrink: 0;
  padding: 1px 6px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.06);
  color: #6e6e73;
  font-size: 11px;
}
.qe-close {
  margin-left: 2px;
}
.qe-segbar {
  padding: 8px 12px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.qe-seg-full {
  display: flex;
  width: 100%;
}
.qe-seg-full .mac-form-seg-btn {
  flex: 1;
}
.qe-body {
  flex: 1;
  display: flex;
  min-height: 0;
}
.qe-form {
  width: 460px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 0 16px 28px;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
}
.qe-first {
  margin-top: 16px;
}
.qe-form .mac-form-row-label {
  width: 96px;
}
.qe-preview {
  flex: 1;
  overflow: auto;
  background: #e8e8ed;
  padding: 24px 16px;
}
.qe-preview-frame {
  margin: 0 auto;
  overflow: hidden;
  border-radius: 2px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.14), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
}

/* 品項 */
.qe-item-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 120px;
  gap: 8px;
  align-items: center;
}
.qe-item-row.is-desc {
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 4px;
  margin-top: 8px;
}

/* 金額 */
.qe-sum {
  justify-content: space-between;
  min-height: 36px;
  color: #6e6e73;
}
.qe-sum.is-total {
  color: #1d1d1f;
  font-weight: 600;
}
.qe-discount {
  max-width: 170px !important;
}

/* 圖片 */
.qe-thumb {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  border: 1px solid #ececf0;
  overflow: hidden;
  background: #fafafa;
}
.qe-thumb img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
.qe-dim {
  font-size: 12px;
  color: #8e8e93;
}

/* 付款條件：期別｜%/$｜比例；基準｜N｜單位 (指定日期時：基準｜日期) */
.qe-plan-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.qe-plan-head .mac-spacer {
  flex: 1 1 auto;
}
.qe-plan-no {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #0071e3;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
}
.qe-plan-amount {
  font-weight: 600;
}
.qe-plan-row {
  display: grid;
  gap: 8px;
  align-items: center;
}
.qe-plan-row + .qe-plan-row {
  margin-top: 8px;
}
.qe-plan-row.is-main {
  grid-template-columns: minmax(0, 1fr) auto 112px;
}
.qe-plan-row.is-base {
  grid-template-columns: minmax(0, 1fr) 72px 104px;
}
.qe-plan-row.is-date {
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}
.qe-warning {
  margin: 6px 4px 0;
  font-size: 12px;
  color: #d62d20;
}

.qe-dialog-body {
  padding: 16px !important;
}
.qe-export-host {
  position: fixed;
  left: -10000px;
  top: 0;
  pointer-events: none;
}

@media (max-width: 959.98px) {
  .qe-body {
    display: block;
    overflow-y: auto;
  }
  .qe-form {
    width: 100%;
    border-right: 0;
  }
  .qe-preview {
    min-height: calc(100vh - 106px);
  }
  /* 避開全站左上角漢堡鈕；按鈕只留圖示 */
  .qe-toolbar {
    padding-left: 52px;
  }
  .qe-btn-text,
  .qe-title-sub {
    display: none;
  }
}
</style>
