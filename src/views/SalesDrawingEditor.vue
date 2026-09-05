<template>
  <div class="sde-root" :class="{ 'is-mobile': isMobile, 'is-view': !canEdit }" :data-households="householdsWithDerived.length">
    <!-- ===== 頂部列 ===== -->
    <header class="sde-topbar">
      <v-btn v-if="isMobile" icon="mdi-arrow-left" variant="text" size="small" title="返回圖面列表" @click="goBack" />
      <v-btn v-else variant="text" size="small" prepend-icon="mdi-arrow-left" title="返回圖面列表，可選擇其他圖面" @click="goBack">返回列表</v-btn>
      <v-divider vertical class="mx-1" />
      <input v-if="canEdit" v-model="drawingName" class="sde-name" placeholder="圖面名稱" @change="renameDrawing" />
      <span v-else class="sde-name sde-name--static text-truncate">{{ drawingName }}</span>
      <!-- 切換圖面：直接開啟同建案的其他圖面（切換前自動儲存） -->
      <v-menu v-model="switchMenu" :close-on-content-click="true" location="bottom start" :offset="4" max-height="420">
        <template #activator="{ props: act }">
          <v-btn v-bind="act" icon="mdi-chevron-down" variant="text" size="small" title="切換圖面" />
        </template>
        <v-list density="compact" class="sde-switch-list">
          <v-list-subheader>{{ projectName }} 的圖面（{{ drawingList.length }}）</v-list-subheader>
          <v-list-item v-for="d in drawingList" :key="d.id" :active="d.id === drawingId" :disabled="d.id === drawingId" @click="switchDrawing(d.id)">
            <template #prepend>
              <div class="sde-switch-thumb">
                <img v-if="d.thumbnailUrl || d.baseImage?.url" :src="d.thumbnailUrl || d.baseImage.url" alt="" loading="lazy" />
                <v-icon v-else size="18" color="grey">mdi-image-off-outline</v-icon>
              </div>
            </template>
            <v-list-item-title>{{ d.name }}</v-list-item-title>
            <v-list-item-subtitle>{{ (d.drawing?.elements || []).length }} 個元素・{{ formatTime(d.updatedAt) }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item v-if="canEdit" prepend-icon="mdi-plus" title="新增圖面" @click="createAndSwitch" />
          <v-list-item prepend-icon="mdi-view-grid-outline" title="返回圖面列表" @click="goBack" />
        </v-list>
      </v-menu>
      <span class="sde-save-state" :class="saveStateClass">
        <v-icon size="14">{{ saveStateIcon }}</v-icon> {{ saveStateText }}
      </span>
      <v-spacer />
      <template v-if="canEdit && !isMobile">
        <v-btn icon="mdi-undo" variant="text" size="small" title="復原 (Ctrl+Z)" :disabled="!api.canUndo.value" @click="api.undo()" />
        <v-btn icon="mdi-redo" variant="text" size="small" title="重做 (Ctrl+Y)" :disabled="!api.canRedo.value" @click="api.redo()" />
        <v-divider vertical class="mx-1" />
      </template>
      <v-btn icon="mdi-magnify-minus-outline" variant="text" size="small" title="縮小" @click="api.zoomOut()" />
      <button type="button" class="sde-zoom" title="適應視窗 (Ctrl+0)" @click="api.zoomToFit()">{{ Math.round(api.zoom.value * 100) }}%</button>
      <v-btn icon="mdi-magnify-plus-outline" variant="text" size="small" title="放大" @click="api.zoomIn()" />
      <v-btn icon="mdi-fit-to-screen-outline" variant="text" size="small" title="適應視窗 (Ctrl+0)" @click="api.zoomToFit()" />
      <v-divider vertical class="mx-1" />
      <v-btn variant="tonal" size="small" prepend-icon="mdi-export-variant" :disabled="loading" @click="exportDialog = true">匯出</v-btn>
      <v-btn v-if="canEdit" color="primary" variant="flat" size="small" class="ml-2" prepend-icon="mdi-content-save-outline" :loading="saving" :disabled="loading" @click="save()">儲存</v-btn>
      <v-btn v-if="isMobile && canEdit" icon="mdi-tune-variant" variant="text" size="small" class="ml-1" @click="mobilePanel = true" />
    </header>

    <!-- ===== 他人更新提示 ===== -->
    <div v-if="remoteUpdate" class="sde-banner">
      <v-icon size="18" color="amber-darken-3">mdi-account-alert-outline</v-icon>
      <span>{{ remoteUpdate.updatedBy?.name || '其他使用者' }} 於 {{ formatTime(remoteUpdate.updatedAt) }} 更新了此圖面。</span>
      <v-btn size="x-small" variant="flat" color="amber-darken-3" @click="loadRemote">載入最新（放棄本地變更）</v-btn>
      <v-btn size="x-small" variant="text" @click="remoteUpdate = null">忽略</v-btn>
    </div>

    <!-- ===== 主區 ===== -->
    <div class="sde-main">
      <aside v-if="canEdit && !isMobile" class="sde-tools">
        <button v-for="t in toolButtons" :key="t.key" type="button" class="sde-tool" :class="{ 'is-active': activeTool === t.key }" :title="t.title" @click="t.action">
          <v-icon size="22">{{ t.icon }}</v-icon>
          <span>{{ t.label }}</span>
        </button>
        <div class="sde-tools-spacer" />
        <button type="button" class="sde-tool" title="上傳／更換底圖" @click="baseImageDialog = true">
          <v-icon size="22">mdi-image-edit-outline</v-icon><span>底圖</span>
        </button>
      </aside>

      <div ref="containerRef" class="sde-canvas-wrap" :class="{ 'is-drawing': isDrawTool }">
        <canvas ref="canvasRef"></canvas>
        <div v-if="loading" class="sde-overlay">
          <v-progress-circular indeterminate color="white" />
          <div class="mt-3 text-white">{{ loadingText }}</div>
        </div>
        <div v-else-if="!hasBaseImage && !api.getObjects().length && canEdit" class="sde-hint">
          <v-icon size="36" color="white">mdi-image-plus-outline</v-icon>
          <div class="mt-2">尚未上傳底圖</div>
          <v-btn size="small" variant="flat" color="primary" class="mt-3" @click="baseImageDialog = true">上傳底圖</v-btn>
          <div class="text-caption mt-2" style="opacity:.8">也可以直接在白底畫布上新增資訊卡</div>
        </div>
        <div v-if="uploadProgress !== null" class="sde-upload">
          <v-progress-linear :model-value="uploadProgress" color="primary" height="6" rounded />
          <div class="text-caption mt-1">底圖上傳中 {{ uploadProgress }}%</div>
        </div>
        <div v-if="hoverCard" class="sde-hover" :style="{ left: hoverCard.x + 'px', top: hoverCard.y + 'px' }">
          <b>{{ hoverCard.unitId }}</b><span v-if="hoverCard.status"> ・ {{ hoverCard.status }}</span>
        </div>
      </div>

      <aside v-if="canEdit && !isMobile" class="sde-panel">
        <DrawingPropertyPanel :recent-colors="recentColors" @refresh-data="refreshSelectedCards" @use-template="openTemplateDialog" @set-card-default="setCardDefault" />
      </aside>
    </div>

    <!-- ===== 手機版工具列 ===== -->
    <div v-if="canEdit && isMobile" class="sde-mobile-tools">
      <button v-for="t in toolButtons" :key="t.key" type="button" class="sde-tool" :class="{ 'is-active': activeTool === t.key }" @click="t.action">
        <v-icon size="20">{{ t.icon }}</v-icon><span>{{ t.label }}</span>
      </button>
      <button type="button" class="sde-tool" @click="baseImageDialog = true"><v-icon size="20">mdi-image-edit-outline</v-icon><span>底圖</span></button>
      <button type="button" class="sde-tool" :disabled="!api.canUndo.value" @click="api.undo()"><v-icon size="20">mdi-undo</v-icon><span>復原</span></button>
    </div>

    <!-- ===== 狀態列 ===== -->
    <footer v-if="!isMobile" class="sde-status">
      <span>畫布 {{ api.canvasSize.value.width }} × {{ api.canvasSize.value.height }} px</span>
      <span>元素 {{ elementCount }}</span>
      <span v-if="api.selected.value.length">已選 {{ api.selected.value.length }}</span>
      <v-spacer />
      <span v-if="api.baseImageError.value === 'tainted'" class="text-warning"><v-icon size="14">mdi-alert-outline</v-icon> 底圖跨域設定未完成，無法匯出</span>
      <span v-if="lastSavedAt">最後儲存 {{ formatTime(lastSavedAt) }}</span>
      <span v-if="canEdit" class="sde-status-hint">V 選取・H 平移・T 文字・A 箭頭・L 線段・R 矩形・E 橢圓・Esc 取消</span>
    </footer>

    <!-- ===== 手機版屬性面板 ===== -->
    <v-bottom-sheet v-if="canEdit && isMobile" v-model="mobilePanel" inset>
      <div class="sde-mobile-panel">
        <DrawingPropertyPanel :recent-colors="recentColors" @refresh-data="refreshSelectedCards" @use-template="openTemplateDialog" @set-card-default="setCardDefault" />
      </div>
    </v-bottom-sheet>

    <!-- ===== 對話框 ===== -->
    <InfoCardDialog
      v-model="infoCardDialog"
      :project-id="projectId"
      :households="householdsWithDerived"
      :plan-id-to-name="planIdToName"
      :default-style="infoCardDefault"
      :template="cardTemplate"
      @insert="onInsertCards"
    />
    <BaseImageDialog v-model="baseImageDialog" :has-existing="hasBaseImage" :existing-size="currentDrawing?.baseImage ? { width: currentDrawing.baseImage.width, height: currentDrawing.baseImage.height } : null" @select="onBaseImageSelected" @skip="onSkipBaseImage" />
    <ExportDialog v-model="exportDialog" :canvas-size="api.canvasSize.value" :has-internal-fields="hasInternalFields" :tainted="api.baseImageError.value === 'tainted'" :loading="exporting" @export="doExport" />
  </div>
</template>

<script setup>
import { ref, shallowRef, computed, onMounted, onBeforeUnmount, provide, nextTick, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useSalesDataStore } from '@/store/salesDataStore';
import { getSalesDrawing, listenToSalesDrawing, listenToSalesDrawings, createSalesDrawing, updateSalesDrawing, uploadSalesDrawingFile, deleteSalesDrawingFile, listenToQuotePlans } from '@/api';
import { useDrawingCanvas, TOOLS } from '@/composables/useDrawingCanvas';
import { normalizeDrawing, drawingSize, MAX_DRAWING_SIZE, SCHEMA_VERSION, genElementId, DEFAULT_INFO_CARD_STYLE, collectFieldKeys, createEmptyDrawing } from '@/utils/salesDrawing/drawingSchema';
import { withDerivedFields, refreshInfoCardRows } from '@/utils/salesDrawing/fieldFormat';
import { renderDrawingDataUrl, dataUrlToBlob, downloadBlob, safeFileName, todayStamp, exportPdf, printDataUrl, EXPORT_FORMATS } from '@/utils/salesDrawing/exportDrawing';
import { isDrawingInternalField } from '@/constants/householdColumns';
import DrawingPropertyPanel from '@/components/salesDrawing/DrawingPropertyPanel.vue';
import InfoCardDialog from '@/components/salesDrawing/InfoCardDialog.vue';
import BaseImageDialog from '@/components/salesDrawing/BaseImageDialog.vue';
import ExportDialog from '@/components/salesDrawing/ExportDialog.vue';

const props = defineProps({
  projectId: { type: String, required: true },
  drawingId: { type: String, required: true },
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { mobile: isMobile } = useDisplay();
const userStore = useUserStore();
const projectStore = useProjectStore();
const salesDataStore = useSalesDataStore();

const api = useDrawingCanvas();
provide('drawingCanvas', api);
if (import.meta.env.DEV) window.__drawingApi = api; // 開發／自動化測試用

const canEdit = computed(() => route.query.mode !== 'view');
const userInfo = computed(() => ({ userKey: userStore.user?.key || '', name: userStore.user?.name || '' }));
const projectName = computed(() => projectStore.getProjectById(props.projectId)?.name || salesDataStore.getProjectData(props.projectId)?.project?.name || props.projectId);

const canvasRef = ref(null);
const containerRef = ref(null);
const loading = ref(true);
const loadingText = ref('載入圖面…');
const currentDrawing = shallowRef(null);
const drawingName = ref('');
const switchMenu = ref(false);
const drawingList = ref([]);
let unsubList = null;
const infoCardDefault = ref({ ...DEFAULT_INFO_CARD_STYLE });
const hasBaseImage = computed(() => !!currentDrawing.value?.baseImage?.url);
const elementCount = computed(() => { void api.objectsVersion.value; return api.getObjects().length; });

/* ---------- 戶別資料 ---------- */
const projectData = computed(() => salesDataStore.getProjectData(props.projectId));
const householdsWithDerived = computed(() => {
  const list = projectData.value?.households || [];
  const parkings = projectData.value?.parkings || [];
  return list.map(u => withDerivedFields(u, parkings));
});
const householdMap = computed(() => new Map(householdsWithDerived.value.map(u => [u.unitId, u])));
const planIdToName = ref(new Map());
let unsubPlans = null;

/* ---------- 載入 ---------- */
let unsubDoc = null;
let knownRev = 0;
const remoteUpdate = ref(null);

/** 切換到同建案其他圖面（onBeforeRouteUpdate 會先自動儲存目前變更） */
function switchDrawing(id) {
  if (!id || id === props.drawingId) return;
  router.push({ name: 'SalesDrawingEditor', params: { projectId: props.projectId, drawingId: id }, query: route.query.mode ? { mode: route.query.mode } : {} });
}
async function createAndSwitch() {
  try {
    const id = await createSalesDrawing(props.projectId, `新圖面 ${drawingList.value.length + 1}`, createEmptyDrawing(), userInfo.value);
    router.push({ name: 'SalesDrawingEditor', params: { projectId: props.projectId, drawingId: id }, query: { new: '1' } });
  } catch (e) { toast.error(`建立圖面失敗：${e.message}`); }
}

function releaseDoc() {
  if (unsubDoc) { unsubDoc(); unsubDoc = null; }
  clearTimeout(autoSaveTimer);
  clearTimeout(retryTimer);
  remoteUpdate.value = null;
  saveError.value = '';
  lastSavedAt.value = null;
  api.deselect();
}

async function load() {
  loading.value = true;
  try {
    const [doc] = await Promise.all([
      getSalesDrawing(props.drawingId),
      salesDataStore.loadProjectData(props.projectId).catch(e => console.warn('[SalesDrawingEditor] 載入戶別資料失敗:', e)),
    ]);
    if (!doc) { toast.error('找不到此圖面'); goBack(); return; }
    if (doc.projectId !== props.projectId) { toast.error('圖面不屬於此建案'); goBack(); return; }
    applyDoc(doc);
    knownRev = doc.rev || 0;
    unsubDoc = listenToSalesDrawing(props.drawingId, onRemoteSnapshot);
    if (!unsubPlans) unsubPlans = listenToQuotePlans(props.projectId, (plans) => { planIdToName.value = new Map(plans.map(p => [p.id, p.name])); });
    if (!unsubList) unsubList = listenToSalesDrawings(props.projectId, (list) => { drawingList.value = list; });
    if (route.query.new === '1' && !doc.baseImage && canEdit.value) {
      baseImageDialog.value = true;
      router.replace({ query: { ...route.query, new: undefined } });
    }
  } catch (e) {
    console.error('[SalesDrawingEditor] 載入失敗:', e);
    toast.error(`載入圖面失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function applyDoc(doc) {
  currentDrawing.value = doc;
  drawingName.value = doc.name || '';
  const drawing = normalizeDrawing(doc.drawing);
  if (doc.baseImage) { drawing.canvas.width = doc.baseImage.width; drawing.canvas.height = doc.baseImage.height; }
  infoCardDefault.value = { ...DEFAULT_INFO_CARD_STYLE, ...(drawing.defaults.infoCard || {}) };
  api.loadDrawing(drawing);
  if (doc.baseImage?.url) {
    loadingText.value = '載入底圖…';
    await api.setBaseImage(doc.baseImage.url);
    if (api.baseImageError.value === 'tainted') console.warn('[SalesDrawingEditor] 底圖以非跨域模式載入，無法匯出（需設定 Storage CORS）');
    else if (api.baseImageError.value) toast.error('底圖載入失敗');
  }
  await nextTick();
  api.fitToContainer();
  api.zoomToFit();
}

function onRemoteSnapshot(doc) {
  if (!doc) return;
  const rev = doc.rev || 0;
  if (rev <= knownRev) return;
  if (doc.updatedBy?.userKey === userInfo.value.userKey) {
    knownRev = rev;
    currentDrawing.value = { ...currentDrawing.value, ...doc, drawing: currentDrawing.value?.drawing };
    return;
  }
  remoteUpdate.value = doc;
}

async function loadRemote() {
  const doc = remoteUpdate.value;
  remoteUpdate.value = null;
  if (!doc) return;
  loading.value = true;
  try { await applyDoc(doc); knownRev = doc.rev || 0; api.markClean(); }
  finally { loading.value = false; }
}

/* ---------- 儲存 ---------- */
const saving = ref(false);
const lastSavedAt = ref(null);
const saveError = ref('');
let autoSaveTimer = null;
let retryTimer = null;

const saveStateText = computed(() => {
  if (!canEdit.value) return '檢視模式';
  if (saving.value) return '儲存中…';
  if (saveError.value) return '儲存失敗';
  return api.dirty.value ? '未儲存' : '已儲存';
});
const saveStateIcon = computed(() => saving.value ? 'mdi-cloud-sync-outline' : (saveError.value ? 'mdi-cloud-alert-outline' : (api.dirty.value ? 'mdi-cloud-clock-outline' : 'mdi-cloud-check-outline')));
const saveStateClass = computed(() => ({ 'is-dirty': api.dirty.value && !saving.value, 'is-error': !!saveError.value }));

function buildDrawing() {
  const d = api.getDefaults();
  return {
    schemaVersion: SCHEMA_VERSION,
    canvas: { width: api.canvasSize.value.width, height: api.canvasSize.value.height, background: '#ffffff' },
    defaults: { infoCard: { ...infoCardDefault.value }, line: d.line, text: d.text, shape: d.shape },
    elements: api.toElements(),
  };
}

async function makeThumbnail() {
  const c = api.getCanvas();
  if (!c || api.baseImageError.value === 'tainted') return null;
  const { width, height } = api.canvasSize.value;
  const dataUrl = renderDrawingDataUrl(c, { format: 'jpeg', quality: 0.8, multiplier: Math.min(1, 480 / width), width, height, background: '#ffffff' });
  const blob = await dataUrlToBlob(dataUrl);
  const { url } = await uploadSalesDrawingFile(props.projectId, props.drawingId, blob, 'thumb.jpg');
  return url;
}

async function save({ silent = false } = {}) {
  if (!canEdit.value || saving.value || loading.value) return false;
  clearTimeout(autoSaveTimer);
  const drawing = buildDrawing();
  const size = drawingSize(drawing);
  if (size > MAX_DRAWING_SIZE) {
    toast.error(`圖面元素過多（${Math.round(size / 1024)}KB），請拆分圖面後再儲存`);
    return false;
  }
  saving.value = true;
  saveError.value = '';
  try {
    let thumbnailUrl = currentDrawing.value?.thumbnailUrl || null;
    try { const t = await makeThumbnail(); if (t) thumbnailUrl = t; } catch (e) { console.warn('[SalesDrawingEditor] 縮圖產生失敗（略過）:', e); }
    await updateSalesDrawing(props.drawingId, { drawing, drawingSize: size, thumbnailUrl }, userInfo.value);
    currentDrawing.value = { ...currentDrawing.value, drawing, drawingSize: size, thumbnailUrl };
    api.markClean();
    lastSavedAt.value = new Date();
    if (!silent) toast.success('已儲存圖面', { timeout: 1500 });
    return true;
  } catch (e) {
    console.error('[SalesDrawingEditor] 儲存失敗:', e);
    saveError.value = e.message;
    toast.error(`儲存失敗：${e.message}`);
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => { if (api.dirty.value) save({ silent: true }); }, 30000);
    return false;
  } finally {
    saving.value = false;
  }
}

function scheduleAutoSave() {
  if (!canEdit.value) return;
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => { if (api.dirty.value && !saving.value) save({ silent: true }); }, 3000);
}
api.on('change', scheduleAutoSave);

async function renameDrawing() {
  const name = drawingName.value.trim();
  if (!name) { drawingName.value = currentDrawing.value?.name || ''; return; }
  if (name === currentDrawing.value?.name) return;
  try { await updateSalesDrawing(props.drawingId, { name }, userInfo.value); currentDrawing.value = { ...currentDrawing.value, name }; }
  catch (e) { toast.error(`改名失敗：${e.message}`); }
}

/* ---------- 底圖 ---------- */
const baseImageDialog = ref(false);
const uploadProgress = ref(null);

function scaleElements(elements, rx, ry) {
  const rs = Math.min(rx, ry);
  return elements.map(el => {
    const c = { ...el };
    if (c.type === 'line') { c.x1 *= rx; c.y1 *= ry; c.x2 *= rx; c.y2 *= ry; }
    else { c.x *= rx; c.y *= ry; }
    if (c.type === 'infoCard' || c.type === 'text') c.scale = (c.scale || 1) * rs;
    if (c.type === 'shape') { c.width *= rx; c.height *= ry; }
    if (c.type === 'text') c.width *= rx;
    return c;
  });
}

async function onBaseImageSelected(img) {
  uploadProgress.value = 0;
  try {
    const ext = img.contentType === 'image/png' ? 'png' : 'jpg';
    const fileName = `base_${Date.now()}.${ext}`;
    const { url, storagePath } = await uploadSalesDrawingFile(props.projectId, props.drawingId, img.blob, fileName, p => { uploadProgress.value = p; });
    const old = currentDrawing.value?.baseImage || null;
    const prev = api.canvasSize.value;
    let elements = api.toElements();
    if (elements.length && (prev.width !== img.width || prev.height !== img.height)) {
      elements = scaleElements(elements, img.width / prev.width, img.height / prev.height);
    }
    api.setCanvasSize(img.width, img.height, '#ffffff');
    api.loadElements(elements);
    await api.setBaseImage(img.previewUrl || url);
    api.zoomToFit();
    const baseImage = { url, storagePath, width: img.width, height: img.height, contentType: img.contentType, originalName: img.originalName, size: img.size };
    const drawing = buildDrawing();
    await updateSalesDrawing(props.drawingId, { baseImage, drawing, drawingSize: drawingSize(drawing) }, userInfo.value);
    currentDrawing.value = { ...currentDrawing.value, baseImage, drawing };
    api.markClean();
    api.pushHistory();
    if (old?.storagePath && !old.shared && old.storagePath !== storagePath) deleteSalesDrawingFile(old.storagePath);
    toast.success('底圖已更新');
  } catch (e) {
    console.error('[SalesDrawingEditor] 底圖上傳失敗:', e);
    toast.error(`底圖上傳失敗：${e.message}`);
  } finally {
    uploadProgress.value = null;
  }
}
function onSkipBaseImage() { /* 維持白底畫布 */ }

/* ---------- 工具 ---------- */
const activeTool = computed(() => api.tool.value);
const isDrawTool = computed(() => ![TOOLS.select, TOOLS.pan].includes(api.tool.value));
const infoCardDialog = ref(false);
const cardTemplate = ref(null);
const exportDialog = ref(false);
const mobilePanel = ref(false);

const toolButtons = computed(() => [
  { key: TOOLS.select, icon: 'mdi-cursor-default-outline', label: '選取', title: '選取 (V)', action: () => api.setTool(TOOLS.select) },
  { key: TOOLS.pan, icon: 'mdi-hand-back-right-outline', label: '平移', title: '平移 (H／空白鍵)', action: () => api.setTool(TOOLS.pan) },
  { key: 'infoCard', icon: 'mdi-card-plus-outline', label: '資訊卡', title: '新增資訊卡 (I)', action: openInfoCardDialog },
  { key: TOOLS.text, icon: 'mdi-format-text', label: '文字', title: '文字 (T)', action: () => api.setTool(TOOLS.text) },
  { key: TOOLS.arrow, icon: 'mdi-arrow-top-right', label: '箭頭', title: '箭頭 (A)', action: () => api.setTool(TOOLS.arrow) },
  { key: TOOLS.arrowDouble, icon: 'mdi-arrow-left-right', label: '雙箭頭', title: '雙向箭頭', action: () => api.setTool(TOOLS.arrowDouble) },
  { key: TOOLS.line, icon: 'mdi-minus', label: '線段', title: '線段 (L)', action: () => api.setTool(TOOLS.line) },
  { key: TOOLS.dashed, icon: 'mdi-dots-horizontal', label: '虛線', title: '虛線', action: () => api.setTool(TOOLS.dashed) },
  { key: TOOLS.rect, icon: 'mdi-rectangle-outline', label: '矩形', title: '矩形 (R)', action: () => api.setTool(TOOLS.rect) },
  { key: TOOLS.ellipse, icon: 'mdi-ellipse-outline', label: '橢圓', title: '橢圓 (E)', action: () => api.setTool(TOOLS.ellipse) },
]);

async function openInfoCardDialog() {
  if (!householdsWithDerived.value.length) {
    const id = toast.info('載入戶別資料中…', { timeout: false });
    try { await salesDataStore.loadProjectData(props.projectId, true); }
    catch (e) { console.warn('[SalesDrawingEditor] 載入戶別資料失敗:', e); }
    finally { toast.dismiss(id); }
    if (!householdsWithDerived.value.length) { toast.warning('此建案尚無戶別資料'); return; }
  }
  cardTemplate.value = null;
  infoCardDialog.value = true;
}

function openTemplateDialog() {
  const card = api.selected.value[0];
  if (!card || card.type !== 'infoCard') return;
  cardTemplate.value = {
    fieldKeys: card.cardRows.filter(r => r.fieldKey).map(r => r.fieldKey),
    showHeader: !!card.cardHeader.show,
    showLabelColumn: card.cardLayout.showLabelColumn !== false,
    shortLabel: card.cardFormat?.shortLabel !== false,
    priceUnit: card.cardFormat?.priceUnit || 'wan',
    style: { ...card.cardStyle },
    layout: { colWidths: card.cardLayout.colWidths ? [...card.cardLayout.colWidths] : null, headerHeight: card.cardLayout.headerHeight, padding: card.cardLayout.padding },
  };
  infoCardDialog.value = true;
}

function onInsertCards(cards) {
  const els = cards.map(c => ({ id: genElementId(), type: 'infoCard', x: 0, y: 0, scale: 1, angle: 0, locked: false, ...c }));
  const objs = api.addElements(els, { select: false, history: false });
  if (!objs.length) return;
  const view = api.getViewRect();
  const { width: W, height: H } = api.canvasSize.value;
  const gap = 24 / Math.max(0.2, api.zoom.value) > 24 ? 24 : 24;
  if (objs.length === 1) {
    const o = objs[0];
    const c = api.getViewCenter();
    o.set({ left: Math.max(0, Math.min(W - o.getScaledWidth(), c.x - o.getScaledWidth() / 2)), top: Math.max(0, Math.min(H - o.getScaledHeight(), c.y - o.getScaledHeight() / 2)) });
    o.setCoords();
  } else {
    const maxW = Math.max(...objs.map(o => o.getScaledWidth()));
    const maxH = Math.max(...objs.map(o => o.getScaledHeight()));
    const availW = Math.max(maxW, Math.min(view.width, W) - gap * 2);
    const cols = Math.max(1, Math.min(objs.length, Math.floor(availW / (maxW + gap))));
    const startX = Math.max(gap, view.left + gap), startY = Math.max(gap, view.top + gap);
    objs.forEach((o, i) => {
      const r = Math.floor(i / cols), cidx = i % cols;
      o.set({ left: startX + cidx * (maxW + gap), top: startY + r * (maxH + gap) });
      o.setCoords();
    });
  }
  api.selectObjects(objs);
  api.refresh();
  api.setTool(TOOLS.select);
  toast.success(`已插入 ${objs.length} 張資訊卡`, { timeout: 1500 });
}

function refreshCards(cards) {
  let missing = 0;
  cards.forEach(card => {
    const unit = householdMap.value.get(card.unitId);
    if (!unit) { missing++; return; }
    card.cardRows = refreshInfoCardRows(card.cardRows, unit, { ...card.cardFormat, planIdToName: planIdToName.value });
    if (!card.cardHeader.overridden) card.cardHeader.text = String(unit.unitId);
  });
  api.applyToObjects(cards, () => {});
  if (missing) toast.warning(`${missing} 張資訊卡的戶別已不存在，未更新`);
  else toast.success('已重新整理戶別資料', { timeout: 1500 });
}
function refreshSelectedCards() {
  const cards = api.selected.value.filter(o => o.type === 'infoCard');
  refreshCards(cards.length ? cards : api.getObjects().filter(o => o.type === 'infoCard'));
}
function setCardDefault(style) {
  infoCardDefault.value = { ...infoCardDefault.value, ...style };
  api.markDirty();
  toast.success('已設為新資訊卡的預設樣式', { timeout: 1500 });
}

/* 最近使用顏色（供色票） */
const recentColors = computed(() => {
  void api.objectsVersion.value;
  const set = new Set();
  for (const o of api.getObjects()) {
    if (o.type === 'infoCard') [o.cardStyle.fill, o.cardStyle.stroke, o.cardStyle.headerFill, o.cardStyle.valueTextColor].forEach(c => c && set.add(c));
    else { if (o.stroke) set.add(o.stroke); if (o.fill && typeof o.fill === 'string') set.add(o.fill); }
  }
  return [...set].slice(0, 8);
});

/* ---------- 匯出 ---------- */
const exporting = ref(false);
const hasInternalFields = computed(() => { void api.objectsVersion.value; void api.selectionVersion.value; return collectFieldKeys({ elements: api.toElements() }).some(isDrawingInternalField); });

async function doExport(opts) {
  const c = api.getCanvas();
  if (!c) return;
  exporting.value = true;
  try {
    const { width, height } = api.canvasSize.value;
    const base = `${safeFileName(projectName.value)}_${safeFileName(drawingName.value)}_${todayStamp()}`;
    const bigMultiplier = Math.max(width, height) * opts.multiplier > 8000 ? 8000 / Math.max(width, height) : opts.multiplier;
    if (bigMultiplier !== opts.multiplier) toast.info('底圖過大，已自動降低匯出倍率');
    if (opts.kind === 'image') {
      const fmt = EXPORT_FORMATS.find(f => f.value === opts.format) || EXPORT_FORMATS[0];
      const dataUrl = renderDrawingDataUrl(c, { format: fmt.value, quality: opts.quality, multiplier: bigMultiplier, width, height, background: '#ffffff' });
      const blob = await dataUrlToBlob(dataUrl);
      downloadBlob(blob, `${base}.${fmt.ext}`);
    } else if (opts.kind === 'pdf') {
      const dataUrl = renderDrawingDataUrl(c, { format: 'jpeg', quality: 0.92, multiplier: bigMultiplier, width, height, background: '#ffffff' });
      await exportPdf(dataUrl, { pageSize: opts.pageSize, width, height, filename: `${base}.pdf` });
    } else {
      const dataUrl = renderDrawingDataUrl(c, { format: 'jpeg', quality: 0.92, multiplier: Math.min(bigMultiplier, 1.5), width, height, background: '#ffffff' });
      printDataUrl(dataUrl, drawingName.value);
    }
    exportDialog.value = false;
  } catch (e) {
    console.error('[SalesDrawingEditor] 匯出失敗:', e);
    toast.error(e?.name === 'SecurityError' ? '底圖跨域設定未完成，無法匯出，請聯絡管理員設定 Storage CORS' : `匯出失敗：${e.message}`);
  } finally {
    exporting.value = false;
  }
}

/* ---------- 檢視模式 hover ---------- */
const hoverCard = ref(null);
function bindHover() {
  const c = api.getCanvas();
  if (!c) return;
  c.on('mouse:over', (e) => {
    if (!e.target || e.target.type !== 'infoCard') return;
    const unit = householdMap.value.get(e.target.unitId);
    const rect = containerRef.value?.getBoundingClientRect();
    hoverCard.value = { unitId: e.target.unitId, status: unit?.salesStatus_backend || '', x: (e.e.clientX - (rect?.left || 0)) + 12, y: (e.e.clientY - (rect?.top || 0)) + 12 };
  });
  c.on('mouse:out', () => { hoverCard.value = null; });
}

/* ---------- 鍵盤 ---------- */
function isTyping(e) {
  const t = e.target;
  if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return true;
  const active = api.getCanvas()?.getActiveObject();
  return !!(active && active.isEditing);
}
function onKeyDown(e) {
  if (e.key === ' ' && !isTyping(e)) { api.setSpaceDown(true); e.preventDefault(); return; }
  if (isTyping(e)) return;
  const ctrl = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (ctrl && k === 's') { e.preventDefault(); if (canEdit.value) save(); return; }
  if (ctrl && k === '0') { e.preventDefault(); api.zoomToFit(); return; }
  if (ctrl && k === '1') { e.preventDefault(); api.zoomTo100(); return; }
  if (!canEdit.value) return;
  if (ctrl && k === 'z') { e.preventDefault(); e.shiftKey ? api.redo() : api.undo(); return; }
  if (ctrl && k === 'y') { e.preventDefault(); api.redo(); return; }
  if (ctrl && k === 'c') { if (api.copy()) e.preventDefault(); return; }
  if (ctrl && k === 'v') { e.preventDefault(); api.paste(); return; }
  if (ctrl && k === 'd') { e.preventDefault(); api.duplicateSelected(); return; }
  if (ctrl && k === 'a') { e.preventDefault(); api.selectAll(); return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); api.removeSelected(); return; }
  if (e.key === 'Escape') { api.setTool(TOOLS.select); api.deselect(); return; }
  if (e.key.startsWith('Arrow')) {
    const step = e.shiftKey ? 10 : 1;
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (api.selected.value.length) { e.preventDefault(); api.nudge(...map[e.key]); }
    return;
  }
  if (ctrl || e.altKey) return;
  const toolKeys = { v: TOOLS.select, h: TOOLS.pan, t: TOOLS.text, a: TOOLS.arrow, l: TOOLS.line, r: TOOLS.rect, e: TOOLS.ellipse };
  if (toolKeys[k]) { api.setTool(toolKeys[k]); return; }
  if (k === 'i') openInfoCardDialog();
}
function onKeyUp(e) { if (e.key === ' ') api.setSpaceDown(false); }
function onBeforeUnload(e) { if (canEdit.value && api.dirty.value) { e.preventDefault(); e.returnValue = ''; } }

/* ---------- 生命週期 ---------- */
onMounted(async () => {
  api.init(canvasRef.value, containerRef.value, { readOnly: !canEdit.value });
  bindHover();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('beforeunload', onBeforeUnload);
  projectStore.fetchProjects().catch(e => console.warn('[SalesDrawingEditor] 載入建案清單失敗:', e));
  await load();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('beforeunload', onBeforeUnload);
  clearTimeout(autoSaveTimer);
  clearTimeout(retryTimer);
  if (unsubDoc) unsubDoc();
  if (unsubPlans) unsubPlans();
  if (unsubList) unsubList();
  api.dispose();
});

async function guardUnsaved() {
  if (!canEdit.value || !api.dirty.value) return true;
  const ok = await save({ silent: true });
  if (ok) return true;
  return window.confirm('圖面尚未儲存成功，確定離開？未儲存的變更將遺失。');
}
onBeforeRouteLeave(guardUnsaved);
onBeforeRouteUpdate(async (to, from) => {
  if (to.params.drawingId === from.params.drawingId) return true;
  return guardUnsaved();
});

// 同一元件內切換圖面（路由參數變更）：釋放舊文件監聽後重新載入
watch(() => props.drawingId, async (id, old) => {
  if (!id || id === old) return;
  releaseDoc();
  await load();
});

watch(isMobile, () => nextTick(() => api.fitToContainer()));

function goBack() { router.push({ name: 'SalesDrawingList', params: { projectId: props.projectId } }); }
function formatTime(t) {
  const d = t && typeof t.toDate === 'function' ? t.toDate() : (t ? new Date(t) : null);
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
</script>

<style scoped>
.sde-root { display: flex; flex-direction: column; height: calc(100dvh - var(--v-layout-top, 0px) - var(--v-layout-bottom, 0px)); min-height: 480px; background: #1f2937; color: #111827; }
.sde-topbar { display: flex; align-items: center; gap: 2px; padding: 4px 8px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
.sde-name { font-size: 15px; font-weight: 600; border: 1px solid transparent; border-radius: 6px; padding: 4px 8px; min-width: 120px; max-width: 320px; background: transparent; }
.sde-name:hover, .sde-name:focus { border-color: rgba(0,0,0,0.2); background: #fff; outline: none; }
.sde-name--static { max-width: 50vw; }
.sde-switch-list { min-width: 300px; }
.sde-switch-thumb { width: 44px; height: 30px; border-radius: 4px; background: #e5e7eb; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-right: 10px; }
.sde-switch-thumb img { width: 100%; height: 100%; object-fit: cover; }
.sde-save-state { font-size: 12px; color: #6b7280; display: inline-flex; align-items: center; gap: 3px; margin-left: 6px; white-space: nowrap; }
.sde-save-state.is-dirty { color: #d97706; }
.sde-save-state.is-error { color: #dc2626; }
.sde-zoom { font-size: 12px; font-family: monospace; min-width: 48px; border: none; background: transparent; cursor: pointer; padding: 4px; border-radius: 4px; }
.sde-zoom:hover { background: #f3f4f6; }
.sde-banner { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: #fef3c7; color: #92400e; font-size: 13px; flex-shrink: 0; }
.sde-main { display: flex; flex: 1; min-height: 0; }
.sde-tools { width: 64px; background: #fff; border-right: 1px solid rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: stretch; padding: 4px; gap: 2px; overflow-y: auto; flex-shrink: 0; }
.sde-tools-spacer { flex: 1; }
.sde-tool { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 6px 2px; border: none; border-radius: 8px; background: transparent; color: #374151; cursor: pointer; font-size: 10px; }
.sde-tool:hover { background: #f3f4f6; }
.sde-tool.is-active { background: #e0e7ff; color: #1e3a8a; }
.sde-tool:disabled { opacity: .4; cursor: default; }
.sde-canvas-wrap { position: relative; flex: 1; min-width: 0; min-height: 0; overflow: hidden; background: #374151; }
.sde-canvas-wrap.is-drawing :deep(.upper-canvas) { cursor: crosshair !important; }
.sde-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(31,41,55,0.7); z-index: 5; }
.sde-hint { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); text-align: center; color: #fff; pointer-events: none; z-index: 3; }
.sde-hint .v-btn { pointer-events: auto; }
.sde-upload { position: absolute; left: 16px; right: 16px; bottom: 12px; background: #fff; padding: 8px 12px; border-radius: 8px; z-index: 4; }
.sde-hover { position: absolute; z-index: 6; pointer-events: none; background: rgba(17,24,39,0.9); color: #fff; font-size: 12px; padding: 4px 8px; border-radius: 6px; white-space: nowrap; }
.sde-panel { width: 320px; background: #fff; border-left: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; min-height: 0; }
.sde-status { display: flex; align-items: center; gap: 14px; padding: 3px 12px; background: #fff; border-top: 1px solid rgba(0,0,0,0.1); font-size: 11px; color: #6b7280; flex-shrink: 0; }
.sde-status-hint { color: #9ca3af; }
.sde-mobile-tools { display: flex; overflow-x: auto; gap: 2px; padding: 4px; background: #fff; border-top: 1px solid rgba(0,0,0,0.1); flex-shrink: 0; }
.sde-mobile-tools .sde-tool { min-width: 56px; }
.sde-mobile-panel { height: 70vh; background: #fff; }
.is-view .sde-canvas-wrap :deep(.upper-canvas) { cursor: default !important; }
</style>
