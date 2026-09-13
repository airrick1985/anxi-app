<template>
  <v-dialog
    v-model="open"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 1080"
    persistent
    no-click-animation
    :retain-focus="false"
    content-class="anm-dialog"
  >
    <div class="anm-window" :class="{ 'anm-window--mobile': isMobile }">
      <!-- 標題列 -->
      <div class="anm-titlebar">
        <div class="anm-lights">
          <button class="anm-light anm-light--close" title="關閉" @click="requestClose"><svg viewBox="0 0 12 12"><path d="M3.5 3.5l5 5M8.5 3.5l-5 5" /></svg></button>
        </div>
        <div class="anm-title">
          <v-icon size="14" class="mr-1" color="rgba(0,0,0,.55)">mdi-bullhorn-variant-outline</v-icon>
          公告管理
          <span class="anm-title-sub">— {{ projectName || '' }}</span>
        </div>
        <div class="anm-title-right">
          <span class="anm-meta">{{ announcements.length }} 則</span>
        </div>
      </div>

      <div class="anm-body">
        <!-- 側欄：列表 -->
        <aside class="anm-sidebar" v-show="!isMobile || mobilePane === 'list'">
          <div class="anm-side-top">
            <button class="anm-push anm-push--primary anm-push--block" @click="startCreate">
              <v-icon size="15" class="mr-1">mdi-plus</v-icon>新增公告
            </button>
            <div class="anm-seg anm-seg--filter">
              <button
                v-for="f in FILTERS"
                :key="f.value"
                class="anm-seg-btn"
                :class="{ 'anm-seg-btn--active': filter === f.value }"
                @click="filter = f.value"
              >{{ f.label }}<span v-if="filterCount(f.value)" class="anm-seg-count">{{ filterCount(f.value) }}</span></button>
            </div>
          </div>
          <div class="anm-list">
            <div v-if="filteredList.length === 0" class="anm-empty">
              <v-icon size="26" color="rgba(0,0,0,.3)">mdi-bullhorn-outline</v-icon>
              <span>沒有符合的公告</span>
            </div>
            <button
              v-for="a in filteredList"
              :key="a.id"
              class="anm-item"
              :class="{ 'anm-item--active': editing?.id === a.id }"
              @click="startEdit(a)"
            >
              <span class="anm-item-dot" :style="{ background: ANNOUNCEMENT_STATUS[statusOf(a)].color }" :title="ANNOUNCEMENT_STATUS[statusOf(a)].label"></span>
              <span class="anm-item-main">
                <span class="anm-item-title">
                  <v-icon v-if="a.pinned" size="12" color="#ff9500">mdi-pin</v-icon>
                  <v-icon v-if="a.popup" size="12" color="#ff3b30">mdi-bell-ring-outline</v-icon>
                  <v-icon size="12" :color="levelMeta(a.level).color">{{ levelMeta(a.level).icon }}</v-icon>
                  {{ a.title || '（無標題）' }}
                </span>
                <span class="anm-item-sub">
                  <span class="anm-tag" v-for="t in targetsOf(a)" :key="t">{{ targetLabel(t) }}</span>
                  <span class="anm-item-time">{{ formatRelativeTime(a.updatedAt || a.createdAt, now) }}</span>
                </span>
              </span>
            </button>
          </div>
        </aside>

        <!-- 主區：表單 -->
        <section class="anm-main" v-show="!isMobile || mobilePane === 'form'">
          <div v-if="!editing" class="anm-placeholder">
            <v-icon size="44" color="rgba(0,0,0,.2)">mdi-bullhorn-variant-outline</v-icon>
            <div class="anm-placeholder-title">選擇左側公告，或新增一則</div>
            <div class="anm-placeholder-text">公告會常駐顯示在銷控／報價系統頁面頂端，可設定顯示期間與置頂。</div>
            <button class="anm-push anm-push--primary mt-3" @click="startCreate"><v-icon size="15" class="mr-1">mdi-plus</v-icon>新增公告</button>
          </div>

          <div v-else class="anm-form">
            <div class="anm-form-head">
              <div class="anm-form-status">
                <span class="anm-status-chip" :style="{ '--c': ANNOUNCEMENT_STATUS[previewStatus].color }">{{ ANNOUNCEMENT_STATUS[previewStatus].label }}</span>
                <span v-if="editing.id" class="anm-meta">由 {{ editing.authorName || '—' }} 建立 · {{ formatDateTime(editing.createdAt) }}</span>
                <span v-else class="anm-meta">新公告</span>
              </div>
              <button v-if="isMobile" class="anm-push" @click="showListOnMobile"><v-icon size="15" class="mr-1">mdi-chevron-left</v-icon>列表</button>
            </div>

            <label class="anm-label">標題</label>
            <input v-model="form.title" class="anm-input" type="text" maxlength="80" placeholder="例如：本週 A 棟 3F 保留至週五" />

            <label class="anm-label">內容 <span class="anm-hint">可設定文字大小、顏色、底線、斜體與編號；網址會自動變成連結</span></label>
            <AnnouncementRichEditor v-model="form.content" placeholder="輸入公告內容…" />

            <div class="anm-row">
              <div class="anm-col">
                <label class="anm-label">發佈位置</label>
                <div class="anm-seg">
                  <button
                    v-for="t in ANNOUNCEMENT_TARGETS"
                    :key="t.value"
                    class="anm-seg-btn"
                    :class="{ 'anm-seg-btn--active': form.targets.includes(t.value) }"
                    @click="toggleTarget(t.value)"
                  ><v-icon size="14" class="mr-1">{{ t.icon }}</v-icon>{{ t.label }}</button>
                </div>
              </div>
              <div class="anm-col">
                <label class="anm-label">重要程度</label>
                <div class="anm-seg">
                  <button
                    v-for="l in ANNOUNCEMENT_LEVELS"
                    :key="l.value"
                    class="anm-seg-btn"
                    :class="{ 'anm-seg-btn--active': form.level === l.value }"
                    :style="form.level === l.value ? { color: l.color } : {}"
                    @click="form.level = l.value"
                  ><v-icon size="14" class="mr-1">{{ l.icon }}</v-icon>{{ l.label }}</button>
                </div>
              </div>
            </div>

            <div class="anm-row">
              <label class="anm-switch">
                <input v-model="form.pinned" type="checkbox" />
                <span class="anm-switch-track"><span class="anm-switch-knob"></span></span>
                <span class="anm-switch-label"><v-icon size="14" class="mr-1" color="#ff9500">mdi-pin</v-icon>置頂顯示</span>
              </label>
              <label class="anm-switch">
                <input v-model="form.popup" type="checkbox" />
                <span class="anm-switch-track"><span class="anm-switch-knob"></span></span>
                <span class="anm-switch-label"><v-icon size="14" class="mr-1" color="#ff3b30">mdi-bell-ring-outline</v-icon>進入頁面時強制燈箱提醒</span>
              </label>
              <label class="anm-switch">
                <input v-model="form.active" type="checkbox" />
                <span class="anm-switch-track"><span class="anm-switch-knob"></span></span>
                <span class="anm-switch-label">啟用（關閉即隱藏，不刪除）</span>
              </label>
            </div>

            <div v-if="form.popup" class="anm-note">
              <v-icon size="13" color="#ff3b30" class="mr-1">mdi-information-outline</v-icon>
              每位人員在顯示期間內首次進入頁面（或公告更新後）會以燈箱彈出，按「我知道了」後不再重複提醒。
            </div>

            <label class="anm-label">顯示期間 <span class="anm-hint">留空表示不限；超出期間會自動隱藏</span></label>
            <div class="anm-row anm-row--dates">
              <div class="anm-col">
                <span class="anm-sublabel">開始</span>
                <input v-model="form.startAt" class="anm-input" type="datetime-local" />
              </div>
              <div class="anm-col">
                <span class="anm-sublabel">結束</span>
                <input v-model="form.endAt" class="anm-input" type="datetime-local" :min="form.startAt || undefined" />
              </div>
            </div>
            <div class="anm-quick">
              <button class="anm-chip" @click="quickRange(1)">今天</button>
              <button class="anm-chip" @click="quickRange(3)">3 天</button>
              <button class="anm-chip" @click="quickRange(7)">1 週</button>
              <button class="anm-chip" @click="quickRange(30)">1 個月</button>
              <button class="anm-chip" @click="form.startAt = ''; form.endAt = ''">不限</button>
            </div>

            <label class="anm-label">圖片 <span class="anm-hint">JPG／PNG／WebP，單檔 8MB 內，不限張數</span></label>
            <div class="anm-images">
              <div v-for="img in form.images" :key="img.path || img.url" class="anm-thumb">
                <img :src="img.url" :alt="img.name" @click="preview(img.url)" />
                <button class="anm-thumb-x" title="移除" @click="removeExistingImage(img)"><v-icon size="12">mdi-close</v-icon></button>
              </div>
              <div v-for="p in pending" :key="p.id" class="anm-thumb anm-thumb--new">
                <img :src="p.previewUrl" :alt="p.file.name" @click="preview(p.previewUrl)" />
                <button class="anm-thumb-x" title="移除" @click="removePending(p.id)"><v-icon size="12">mdi-close</v-icon></button>
              </div>
              <button class="anm-thumb anm-thumb-add" title="新增圖片" @click="pickFiles">
                <v-icon size="22">mdi-image-plus-outline</v-icon>
              </button>
            </div>
            <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" multiple class="d-none" @change="onFiles" />

            <div class="anm-form-foot">
              <button v-if="editing.id" class="anm-push anm-push--danger" :disabled="busy" @click="askDelete"><v-icon size="15" class="mr-1">mdi-delete-outline</v-icon>刪除</button>
              <span class="anm-spacer"></span>
              <button class="anm-push" :disabled="busy" @click="cancelEdit">取消</button>
              <button class="anm-push anm-push--primary" :disabled="busy || !canSave" @click="save">
                <v-progress-circular v-if="busy" indeterminate size="12" width="2" class="mr-1"></v-progress-circular>
                {{ editing.id ? '儲存變更' : '發佈公告' }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- 刪除確認 -->
    <v-dialog v-model="deleteConfirm" max-width="360">
      <v-card class="anm-alert">
        <v-icon size="40" color="error">mdi-alert-circle-outline</v-icon>
        <div class="anm-alert-title">要刪除這則公告嗎？</div>
        <div class="anm-alert-text">「{{ editing?.title }}」與附圖會一併刪除，無法復原。</div>
        <div class="anm-alert-actions">
          <button class="anm-push" @click="deleteConfirm = false">取消</button>
          <button class="anm-push anm-push--danger" :disabled="busy" @click="confirmDelete">刪除</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 放棄變更確認 -->
    <v-dialog v-model="discardConfirm" max-width="360">
      <v-card class="anm-alert">
        <v-icon size="40" color="warning">mdi-alert-circle-outline</v-icon>
        <div class="anm-alert-title">要放棄尚未儲存的內容嗎？</div>
        <div class="anm-alert-actions">
          <button class="anm-push" @click="discardConfirm = false">繼續編輯</button>
          <button class="anm-push anm-push--danger" @click="discardAndRun">放棄</button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 圖片預覽 -->
    <v-dialog :model-value="!!previewUrl" max-width="900" content-class="anm-preview-dialog" @update:model-value="v => { if (!v) previewUrl = ''; }">
      <div class="anm-preview" @click="previewUrl = ''"><img :src="previewUrl" alt="" /></div>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast, POSITION } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import AnnouncementRichEditor from './AnnouncementRichEditor.vue';
import {
  ANNOUNCEMENT_TARGETS, ANNOUNCEMENT_LEVELS, ANNOUNCEMENT_STATUS,
  levelMeta, announcementStatus, formatRelativeTime, formatDateTime, toInputDateTime,
  newAnnouncementId, createAnnouncement, updateAnnouncement, deleteAnnouncement,
  uploadAnnouncementImages, deleteAnnouncementImages,
  isRichContent, isRichHtmlEmpty, plainTextToHtml,
} from '@/services/announcementService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  announcements: { type: Array, default: () => [] },
  defaultTarget: { type: String, default: 'sales' },
});
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const userStore = useUserStore();
const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const open = computed({ get: () => props.modelValue, set: v => emit('update:modelValue', v) });

const FILTERS = [
  { value: 'all', label: '全部' },
  { value: 'live', label: '進行中' },
  { value: 'scheduled', label: '排程' },
  { value: 'expired', label: '過期' },
  { value: 'inactive', label: '停用' },
];
const MAX_IMAGE_MB = 8;

const now = ref(new Date());
let tick = null;
const filter = ref('all');
const editing = ref(null);       // null | { id?, ...doc }
const form = ref(blankForm());
const pending = ref([]);         // { id, file, previewUrl }
const removedImages = ref([]);
const busy = ref(false);
const deleteConfirm = ref(false);
const discardConfirm = ref(false);
let pendingAction = null;
const previewUrl = ref('');
const fileInput = ref(null);
const mobilePane = ref('list');

function blankForm() {
  return {
    title: '', content: '', contentFormat: 'html', images: [],
    targets: props.defaultTarget === 'quote' ? ['quote'] : ['sales'],
    level: 'info', pinned: false, popup: false, active: true, startAt: '', endAt: '',
  };
}

function statusOf(a) { return announcementStatus(a, now.value); }
function targetsOf(a) { return Array.isArray(a.targets) && a.targets.length ? a.targets : ['sales', 'quote']; }
function targetLabel(t) { return ANNOUNCEMENT_TARGETS.find(x => x.value === t)?.label || t; }

const sortedList = computed(() => [...props.announcements].sort((x, y) => {
  const tx = (x.updatedAt?.toDate?.() || x.createdAt?.toDate?.() || new Date(0)).getTime();
  const ty = (y.updatedAt?.toDate?.() || y.createdAt?.toDate?.() || new Date(0)).getTime();
  return ty - tx;
}));
const filteredList = computed(() => filter.value === 'all' ? sortedList.value : sortedList.value.filter(a => statusOf(a) === filter.value));
function filterCount(f) { return f === 'all' ? 0 : props.announcements.filter(a => statusOf(a) === f).length; }

const previewStatus = computed(() => announcementStatus({
  active: form.value.active,
  startAt: form.value.startAt ? new Date(form.value.startAt) : null,
  endAt: form.value.endAt ? new Date(form.value.endAt) : null,
}, now.value));

const canSave = computed(() => form.value.title.trim().length > 0 && form.value.targets.length > 0);

/** 表單快照（比對是否有變更用）：空的富文本（如 <p></p>）一律視為空字串 */
function snapshot(f) {
  return JSON.stringify({ ...f, content: isRichHtmlEmpty(f?.content) ? '' : f?.content });
}
const dirty = computed(() => {
  if (!editing.value) return false;
  return snapshot(form.value) !== snapshot(baseline.value) || pending.value.length > 0 || removedImages.value.length > 0;
});
const baseline = ref(null);

// ---------- 編輯流程 ----------
function loadForm(a) {
  form.value = {
    title: a.title || '',
    // 舊的純文字公告轉成每行一段的 HTML 進編輯器；儲存後即成為富文本格式
    content: isRichContent(a) ? (a.content || '') : plainTextToHtml(a.content || ''),
    contentFormat: 'html',
    images: [...(a.images || [])],
    targets: [...targetsOf(a)],
    level: a.level || 'info',
    pinned: !!a.pinned,
    popup: !!a.popup,
    active: a.active !== false,
    startAt: toInputDateTime(a.startAt),
    endAt: toInputDateTime(a.endAt),
  };
  baseline.value = JSON.parse(JSON.stringify(form.value));
  clearPending();
  removedImages.value = [];
}

function guardDirty(action) {
  if (dirty.value) { pendingAction = action; discardConfirm.value = true; return; }
  action();
}
function discardAndRun() {
  discardConfirm.value = false;
  const fn = pendingAction; pendingAction = null;
  if (fn) fn();
}

function startCreate() {
  guardDirty(() => {
    editing.value = { id: null };
    loadForm(blankForm());
    mobilePane.value = 'form';
  });
}
function startEdit(a) {
  if (editing.value?.id === a.id) { mobilePane.value = 'form'; return; }
  guardDirty(() => {
    editing.value = a;
    loadForm(a);
    mobilePane.value = 'form';
  });
}
function cancelEdit() {
  guardDirty(() => {
    editing.value = null;
    clearPending();
    mobilePane.value = 'list';
  });
}
function showListOnMobile() { mobilePane.value = 'list'; }

function toggleTarget(t) {
  const i = form.value.targets.indexOf(t);
  if (i === -1) form.value.targets.push(t);
  else if (form.value.targets.length > 1) form.value.targets.splice(i, 1);
  else toast.info('至少要選一個發佈位置', { position: POSITION.BOTTOM_CENTER });
}

function quickRange(days) {
  const start = new Date();
  start.setSeconds(0, 0);
  const end = new Date(start);
  if (days === 1) end.setHours(23, 59, 0, 0);
  else { end.setDate(end.getDate() + days); end.setHours(23, 59, 0, 0); }
  form.value.startAt = toInputDateTime(start);
  form.value.endAt = toInputDateTime(end);
}

// ---------- 圖片 ----------
function pickFiles() { if (fileInput.value) { fileInput.value.value = ''; fileInput.value.click(); } }
function onFiles(e) {
  for (const file of Array.from(e.target.files || [])) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { toast.error(`不支援的格式：${file.name}`, { position: POSITION.BOTTOM_CENTER }); continue; }
    if (file.size > MAX_IMAGE_MB * 1024 * 1024) { toast.error(`檔案過大：${file.name}（上限 ${MAX_IMAGE_MB}MB）`, { position: POSITION.BOTTOM_CENTER }); continue; }
    pending.value.push({ id: `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, file, previewUrl: URL.createObjectURL(file) });
  }
}
function removePending(id) {
  const i = pending.value.findIndex(p => p.id === id);
  if (i !== -1) { try { URL.revokeObjectURL(pending.value[i].previewUrl); } catch (e) { /* noop */ } pending.value.splice(i, 1); }
}
function removeExistingImage(img) {
  form.value.images = form.value.images.filter(i => (i.path || i.url) !== (img.path || img.url));
  removedImages.value.push(img);
}
function clearPending() {
  pending.value.forEach(p => { try { URL.revokeObjectURL(p.previewUrl); } catch (e) { /* noop */ } });
  pending.value = [];
}
function preview(url) { previewUrl.value = url; }

// ---------- 儲存 / 刪除 ----------
async function save() {
  if (!canSave.value || busy.value) return;
  if (form.value.startAt && form.value.endAt && new Date(form.value.endAt) < new Date(form.value.startAt)) {
    toast.error('結束時間不可早於開始時間', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  busy.value = true;
  try {
    const id = editing.value.id || newAnnouncementId();
    const uploaded = pending.value.length ? await uploadAnnouncementImages(props.projectId, id, pending.value.map(p => p.file)) : [];
    const payload = {
      ...form.value,
      images: [...form.value.images, ...uploaded],
      startAt: form.value.startAt ? new Date(form.value.startAt) : null,
      endAt: form.value.endAt ? new Date(form.value.endAt) : null,
    };
    const author = { name: userStore.user?.name || '', key: userStore.user?.key || '' };
    if (editing.value.id) await updateAnnouncement(id, payload, author);
    else await createAnnouncement(id, props.projectId, payload, author);
    await deleteAnnouncementImages(removedImages.value);
    toast.success(editing.value.id ? '公告已更新' : '公告已發佈', { position: POSITION.BOTTOM_CENTER });
    editing.value = null;
    clearPending();
    removedImages.value = [];
    mobilePane.value = 'list';
  } catch (err) {
    console.error('儲存公告失敗:', err);
    toast.error(`儲存失敗：${err.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

function askDelete() { deleteConfirm.value = true; }
async function confirmDelete() {
  if (!editing.value?.id || busy.value) return;
  busy.value = true;
  try {
    await deleteAnnouncement(editing.value.id, editing.value.images || []);
    toast.success('公告已刪除', { position: POSITION.BOTTOM_CENTER });
    deleteConfirm.value = false;
    editing.value = null;
    clearPending();
    mobilePane.value = 'list';
  } catch (err) {
    console.error('刪除公告失敗:', err);
    toast.error(`刪除失敗：${err.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    busy.value = false;
  }
}

// ---------- 關閉 ----------
function requestClose() {
  guardDirty(() => { open.value = false; });
}

function onKeydown(e) {
  if (!open.value) return;
  if (e.key === 'Escape' && !deleteConfirm.value && !discardConfirm.value && !previewUrl.value) { e.preventDefault(); requestClose(); }
}

watch(() => props.modelValue, (v) => {
  if (v) {
    now.value = new Date();
    tick = setInterval(() => { now.value = new Date(); }, 60000);
    window.addEventListener('keydown', onKeydown);
    editing.value = null;
    filter.value = 'all';
    mobilePane.value = 'list';
  } else {
    if (tick) { clearInterval(tick); tick = null; }
    window.removeEventListener('keydown', onKeydown);
    clearPending();
  }
});

// 列表中的公告被別人更新時，同步目前編輯對象的基本資料（不覆蓋使用者正在輸入的表單）
watch(() => props.announcements, (list) => {
  if (!editing.value?.id) return;
  const fresh = list.find(a => a.id === editing.value.id);
  if (!fresh) { editing.value = null; clearPending(); mobilePane.value = 'list'; }
});

onBeforeUnmount(() => {
  if (tick) clearInterval(tick);
  window.removeEventListener('keydown', onKeydown);
  clearPending();
});

defineExpose({ startCreate, startEdit });
</script>

<style scoped>
.anm-window {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0a7aff;
  font-family: var(--f);
  font-size: 13px;
  color: #1d1d1f;
  background: #f5f5f7;
  border-radius: 12px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 82vh;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(0, 0, 0, 0.12);
}
.anm-window--mobile { height: 100vh; height: 100dvh; border-radius: 0; }

.anm-titlebar {
  position: relative; height: 40px; display: flex; align-items: center; padding: 0 12px;
  background: linear-gradient(#ececec, #e2e2e2); border-bottom: 1px solid rgba(0,0,0,.14); flex-shrink: 0;
}
.anm-lights { display: flex; gap: 8px; z-index: 1; }
.anm-light { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,.15); padding: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; }
.anm-light svg { width: 8px; height: 8px; stroke: rgba(0,0,0,.55); stroke-width: 1.5; fill: none; stroke-linecap: round; opacity: 0; transition: opacity .12s; }
.anm-lights:hover .anm-light svg { opacity: 1; }
.anm-light--close { background: #ff5f57; }
.anm-title { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; font-weight: 600; color: #3a3a3c; }
.anm-title-sub { color: rgba(0,0,0,.45); font-weight: 500; margin-left: 4px; max-width: 30vw; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.anm-title-right { margin-left: auto; z-index: 1; }
.anm-meta { font-size: 11px; color: rgba(0,0,0,.5); }

.anm-body { flex: 1; min-height: 0; display: flex; }
.anm-sidebar { width: 280px; flex-shrink: 0; border-right: 1px solid rgba(0,0,0,.1); background: #ebebed; display: flex; flex-direction: column; }
.anm-window--mobile .anm-sidebar { width: 100%; border-right: none; }
.anm-side-top { padding: 10px; display: flex; flex-direction: column; gap: 8px; border-bottom: 1px solid rgba(0,0,0,.08); }
.anm-list { flex: 1; overflow-y: auto; padding: 6px; display: flex; flex-direction: column; gap: 2px; }
.anm-empty { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 30px 0; color: rgba(0,0,0,.45); font-size: 12px; }
.anm-item { display: flex; align-items: flex-start; gap: 8px; width: 100%; text-align: left; padding: 8px 10px; border: none; border-radius: 8px; background: transparent; cursor: pointer; font-family: var(--f); color: inherit; }
.anm-item:hover { background: rgba(0,0,0,.05); }
.anm-item--active { background: var(--blue) !important; color: #fff; }
.anm-item--active .anm-item-time, .anm-item--active .anm-tag { color: rgba(255,255,255,.8); border-color: rgba(255,255,255,.5); }
.anm-item-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.anm-item-main { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 3px; }
.anm-item-title { font-weight: 600; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 3px; }
.anm-item-sub { display: flex; align-items: center; gap: 4px; }
.anm-tag { font-size: 10px; padding: 0 5px; border: 1px solid rgba(0,0,0,.2); border-radius: 4px; color: rgba(0,0,0,.6); }
.anm-item-time { margin-left: auto; font-size: 11px; color: rgba(0,0,0,.45); }

.anm-main { flex: 1; min-width: 0; overflow-y: auto; background: #f5f5f7; }
.anm-placeholder { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 24px; color: rgba(0,0,0,.55); }
.anm-placeholder-title { font-size: 15px; font-weight: 600; color: #1d1d1f; margin-top: 8px; }
.anm-placeholder-text { font-size: 12px; margin-top: 4px; max-width: 320px; }

.anm-form { padding: 16px 20px 20px; display: flex; flex-direction: column; }
.anm-form-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.anm-form-status { display: flex; align-items: center; gap: 8px; }
.anm-status-chip { font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 999px; color: var(--c); background: color-mix(in srgb, var(--c) 14%, transparent); }
.anm-label { font-size: 12px; font-weight: 600; color: #3a3a3c; margin: 12px 0 4px; }
.anm-sublabel { font-size: 11px; color: rgba(0,0,0,.5); margin-bottom: 3px; display: block; }
.anm-hint { font-weight: 400; color: rgba(0,0,0,.45); margin-left: 6px; }
.anm-input {
  width: 100%; font-family: var(--f); font-size: 13px; color: #1d1d1f;
  padding: 7px 10px; border: 1px solid rgba(0,0,0,.18); border-radius: 7px; background: #fff;
  outline: none; transition: box-shadow .12s, border-color .12s;
}
.anm-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(10,122,255,.25); }
.anm-row { display: flex; gap: 16px; flex-wrap: wrap; align-items: flex-start; }
.anm-row--dates { gap: 12px; }
.anm-col { flex: 1; min-width: 200px; }
.anm-seg { display: inline-flex; padding: 2px; background: rgba(0,0,0,.06); border-radius: 8px; gap: 2px; }
.anm-seg--filter { display: flex; }
.anm-seg--filter .anm-seg-btn { flex: 1; padding: 4px 4px; font-size: 11px; }
.anm-seg-btn {
  display: inline-flex; align-items: center; justify-content: center; padding: 5px 12px; border: none; border-radius: 6px;
  background: transparent; font-family: var(--f); font-size: 12px; font-weight: 500; color: #3a3a3c; cursor: pointer; white-space: nowrap;
}
.anm-seg-btn--active { background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,.15), 0 0 0 .5px rgba(0,0,0,.08); font-weight: 600; }
.anm-seg-count { margin-left: 3px; font-size: 10px; color: rgba(0,0,0,.45); }
.anm-switch { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; margin-top: 12px; }
.anm-switch input { display: none; }
.anm-switch-track { width: 34px; height: 20px; border-radius: 999px; background: rgba(0,0,0,.2); position: relative; transition: background .15s; flex-shrink: 0; }
.anm-switch-knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.3); transition: left .15s; }
.anm-switch input:checked + .anm-switch-track { background: #34c759; }
.anm-switch input:checked + .anm-switch-track .anm-switch-knob { left: 16px; }
.anm-switch-label { font-size: 12px; display: inline-flex; align-items: center; }
.anm-note { margin-top: 8px; padding: 6px 10px; border-radius: 7px; background: rgba(255,59,48,.08); color: #8a1f18; font-size: 11px; display: flex; align-items: center; }
.anm-quick { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
.anm-chip { font-family: var(--f); font-size: 11px; padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(0,0,0,.15); background: #fff; cursor: pointer; color: #3a3a3c; }
.anm-chip:hover { background: #f0f0f2; }

.anm-images { display: flex; flex-wrap: wrap; gap: 8px; }
.anm-thumb { position: relative; width: 84px; height: 84px; border-radius: 8px; overflow: visible; }
.anm-thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; cursor: zoom-in; box-shadow: 0 1px 3px rgba(0,0,0,.2); display: block; }
.anm-thumb--new img { outline: 2px dashed rgba(10,122,255,.6); outline-offset: 1px; }
.anm-thumb-x { position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; border: none; background: #ff3b30; color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 3px rgba(0,0,0,.3); }
.anm-thumb-add { border: 1.5px dashed rgba(0,0,0,.25); background: #fff; color: rgba(0,0,0,.45); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.anm-thumb-add:hover { border-color: var(--blue); color: var(--blue); }

.anm-form-foot { display: flex; align-items: center; gap: 8px; margin-top: 20px; padding-top: 14px; border-top: 1px solid rgba(0,0,0,.1); }
.anm-spacer { flex: 1; }
.anm-push {
  height: 28px; padding: 0 14px; border-radius: 7px; border: 1px solid rgba(0,0,0,.16);
  background: linear-gradient(#fff, #f2f2f2); color: #1d1d1f; font-family: var(--f); font-size: 13px; font-weight: 500;
  cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 1px rgba(0,0,0,.06);
}
.anm-push:hover:not(:disabled) { background: linear-gradient(#fafafa, #e9e9e9); }
.anm-push:disabled { opacity: .45; cursor: default; }
.anm-push--primary { background: linear-gradient(#2f8dff, var(--blue)); border-color: #0a6ae0; color: #fff; font-weight: 600; }
.anm-push--primary:hover:not(:disabled) { background: linear-gradient(#2a82ee, #0a6ae0); }
.anm-push--danger { background: linear-gradient(#ff6259, #ff3b30); border-color: #e0342a; color: #fff; font-weight: 600; }
.anm-push--block { width: 100%; height: 32px; }

.anm-alert { font-family: var(--f); border-radius: 12px !important; padding: 20px 20px 16px; text-align: center; background: #f5f5f7; }
.anm-alert-title { font-size: 14px; font-weight: 700; margin-top: 8px; }
.anm-alert-text { font-size: 12px; color: rgba(0,0,0,.6); margin-top: 4px; }
.anm-alert-actions { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
.anm-alert-actions .anm-push { flex: 1; }
.anm-preview { display: flex; justify-content: center; cursor: zoom-out; }
.anm-preview img { max-width: 100%; max-height: 85vh; border-radius: 8px; box-shadow: 0 20px 60px rgba(0,0,0,.5); }
</style>

<style>
.anm-dialog, .anm-preview-dialog { box-shadow: none !important; overflow: visible !important; }
</style>
