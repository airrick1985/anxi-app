<template>
  <v-container class="sdl-root" fluid>
    <div class="d-flex align-center flex-wrap ga-3 mb-4">
      <v-btn variant="outlined" color="grey-darken-1" prepend-icon="mdi-arrow-left" @click="goBack">返回銷控系統</v-btn>
      <div>
        <h1 class="text-h5 font-weight-bold text-grey-darken-3 d-flex align-center">
          <v-icon start color="indigo-darken-3">mdi-map-marker-multiple-outline</v-icon>銷售圖面
        </h1>
        <div class="text-caption text-grey">{{ projectName || projectId }}・在底圖上加註戶別資訊卡與標示，匯出圖片或 PDF</div>
      </div>
      <v-spacer />
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" :loading="creating" @click="createDrawing">新增圖面</v-btn>
    </div>

    <div v-if="loading" class="text-center py-12">
      <v-progress-circular indeterminate color="primary" />
      <div class="text-body-2 text-grey mt-3">載入圖面列表…</div>
    </div>

    <div v-else-if="!drawings.length" class="sdl-empty">
      <v-icon size="64" color="grey-lighten-1">mdi-image-multiple-outline</v-icon>
      <div class="text-h6 mt-3">尚未建立任何圖面</div>
      <div class="text-body-2 text-grey mt-1 mb-4">上傳全區平面圖或棟別立面圖，放上戶別資訊卡與箭頭說明。</div>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" :loading="creating" @click="createDrawing">建立第一張圖面</v-btn>
    </div>

    <div v-else class="sdl-grid">
      <v-card v-for="d in drawings" :key="d.id" class="sdl-card" rounded="lg" elevation="2" @click="openEditor(d.id)">
        <div class="sdl-thumb">
          <img v-if="d.thumbnailUrl" :src="d.thumbnailUrl" :alt="d.name" loading="lazy" />
          <img v-else-if="d.baseImage?.url" :src="d.baseImage.url" :alt="d.name" loading="lazy" />
          <div v-else class="sdl-thumb-placeholder"><v-icon size="40" color="grey-lighten-1">mdi-image-off-outline</v-icon><span>尚無底圖</span></div>
        </div>
        <div class="sdl-card-body">
          <div class="d-flex align-center ga-1">
            <input
              v-if="renamingId === d.id"
              v-model="renameText"
              class="sdl-rename"
              @click.stop
              @keydown.enter.prevent="commitRename(d)"
              @keydown.esc.prevent="renamingId = null"
              @blur="commitRename(d)"
              ref="renameInput"
            />
            <div v-else class="sdl-name text-truncate" :title="d.name">{{ d.name }}</div>
            <v-spacer />
            <v-menu>
              <template #activator="{ props: act }">
                <v-btn icon="mdi-dots-vertical" size="small" variant="text" v-bind="act" @click.stop />
              </template>
              <v-list density="compact">
                <v-list-item prepend-icon="mdi-pencil-outline" title="編輯" @click="openEditor(d.id)" />
                <v-list-item prepend-icon="mdi-eye-outline" title="檢視" @click="openEditor(d.id, true)" />
                <v-list-item prepend-icon="mdi-rename-box-outline" title="改名" @click="startRename(d)" />
                <v-list-item prepend-icon="mdi-content-copy" title="複製" @click="duplicate(d)" />
                <v-divider />
                <v-list-item prepend-icon="mdi-delete-outline" title="刪除" class="text-error" @click="confirmDelete(d)" />
              </v-list>
            </v-menu>
          </div>
          <div class="text-caption text-grey mt-1">
            {{ elementCount(d) }} 個元素・{{ d.baseImage ? `${d.baseImage.width}×${d.baseImage.height}` : '無底圖' }}
          </div>
          <div class="text-caption text-grey">{{ formatTime(d.updatedAt) }}<span v-if="d.updatedBy?.name">・{{ d.updatedBy.name }}</span></div>
        </div>
      </v-card>
    </div>

    <v-dialog v-model="deleteDialog.show" max-width="420">
      <v-card>
        <v-card-title class="text-h6">刪除圖面</v-card-title>
        <v-card-text>確定刪除「{{ deleteDialog.target?.name }}」？底圖與所有標註將一併移除，無法復原。</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.show = false">取消</v-btn>
          <v-btn color="error" variant="flat" :loading="deleteDialog.loading" @click="doDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { listenToSalesDrawings, createSalesDrawing, updateSalesDrawing, duplicateSalesDrawing, deleteSalesDrawing } from '@/api';
import { createEmptyDrawing } from '@/utils/salesDrawing/drawingSchema';

const props = defineProps({ projectId: { type: String, required: true } });
const router = useRouter();
const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore();

const drawings = ref([]);
const loading = ref(true);
const creating = ref(false);
let unsub = null;

const projectName = computed(() => projectStore.getProjectById(props.projectId)?.name || '');
const userInfo = computed(() => ({ userKey: userStore.user?.key || '', name: userStore.user?.name || '' }));

onMounted(() => {
  projectStore.fetchProjects().catch(e => console.warn('[SalesDrawingList] 載入建案清單失敗:', e));
  unsub = listenToSalesDrawings(props.projectId, (list) => { drawings.value = list; loading.value = false; }, () => { loading.value = false; toast.error('載入圖面列表失敗'); });
});
onUnmounted(() => { if (unsub) unsub(); });

function goBack() { router.push({ name: 'SalesControlSystem', params: { projectName: props.projectId } }); }
function openEditor(id, view = false) {
  router.push({ name: 'SalesDrawingEditor', params: { projectId: props.projectId, drawingId: id }, query: view ? { mode: 'view' } : {} });
}

async function createDrawing() {
  creating.value = true;
  try {
    const n = drawings.value.length + 1;
    const id = await createSalesDrawing(props.projectId, `新圖面 ${n}`, createEmptyDrawing(), userInfo.value);
    router.push({ name: 'SalesDrawingEditor', params: { projectId: props.projectId, drawingId: id }, query: { new: '1' } });
  } catch (e) {
    console.error('[SalesDrawingList] 建立圖面失敗:', e);
    toast.error(`建立圖面失敗：${e.message}`);
  } finally { creating.value = false; }
}

const renamingId = ref(null);
const renameText = ref('');
const renameInput = ref(null);
function startRename(d) {
  renamingId.value = d.id;
  renameText.value = d.name;
  nextTick(() => { const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value; el?.focus(); el?.select(); });
}
async function commitRename(d) {
  if (renamingId.value !== d.id) return;
  renamingId.value = null;
  const name = renameText.value.trim();
  if (!name || name === d.name) return;
  try { await updateSalesDrawing(d.id, { name }, userInfo.value); }
  catch (e) { toast.error(`改名失敗：${e.message}`); }
}

async function duplicate(d) {
  try {
    await duplicateSalesDrawing(d, `${d.name} (複製)`, userInfo.value);
    toast.success('已複製圖面');
  } catch (e) { toast.error(`複製失敗：${e.message}`); }
}

const deleteDialog = reactive({ show: false, target: null, loading: false });
function confirmDelete(d) { deleteDialog.target = d; deleteDialog.show = true; }
async function doDelete() {
  deleteDialog.loading = true;
  try {
    await deleteSalesDrawing(deleteDialog.target);
    toast.success('已刪除圖面');
    deleteDialog.show = false;
  } catch (e) { toast.error(`刪除失敗：${e.message}`); }
  finally { deleteDialog.loading = false; }
}

function elementCount(d) { return Array.isArray(d.drawing?.elements) ? d.drawing.elements.length : 0; }
function formatTime(t) {
  const d = t && typeof t.toDate === 'function' ? t.toDate() : (t ? new Date(t) : null);
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);
}
</script>

<style scoped>
.sdl-root { max-width: 1400px; }
.sdl-empty { text-align: center; padding: 60px 16px; background: #fff; border-radius: 12px; border: 1px dashed rgba(0,0,0,0.15); }
.sdl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.sdl-card { cursor: pointer; overflow: hidden; transition: transform .12s, box-shadow .12s; }
.sdl-card:hover { transform: translateY(-2px); box-shadow: 0 6px 18px rgba(0,0,0,0.12) !important; }
.sdl-thumb { aspect-ratio: 16 / 10; background: #e5e7eb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.sdl-thumb img { width: 100%; height: 100%; object-fit: cover; }
.sdl-thumb-placeholder { display: flex; flex-direction: column; align-items: center; gap: 4px; color: #9ca3af; font-size: 12px; }
.sdl-card-body { padding: 10px 12px 12px; }
.sdl-name { font-weight: 600; font-size: 14px; }
.sdl-rename { flex: 1; min-width: 0; font-size: 14px; font-weight: 600; padding: 2px 6px; border: 1px solid #2563eb; border-radius: 4px; }
</style>
