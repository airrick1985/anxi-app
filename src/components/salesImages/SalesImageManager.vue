<template>
  <div class="mac-page sim" v-file-drop="{ accept: SALES_IMAGE_ACCEPT, multiple: true, onFiles: files => openUpload(files) }">
    <!-- 標題列：標題＋張數｜缺圖、上傳 -->
    <div class="mac-page-bar">
      <div class="mac-page-title">
        <span class="mac-page-title-main">銷控圖片</span>
        <span class="mac-page-count">{{ images.length }} 張</span>
      </div>
      <div class="mac-page-actions">
        <button v-if="missingList.length" type="button" class="mac-btn sim-missing-btn" @click="missingDialog = true">
          <v-icon size="16">mdi-image-broken-variant</v-icon>缺圖 {{ missingList.length }}
        </button>
        <button type="button" class="mac-btn mac-btn--primary" @click="openUpload()">
          <v-icon size="16">mdi-tray-arrow-up</v-icon>上傳圖片
        </button>
      </div>
    </div>

    <!-- 搜尋＋使用狀態分段＋篩選 -->
    <div class="mac-searchbar sim-searchbar">
      <v-text-field
        v-model="search"
        placeholder="搜尋名稱、檔名、戶別"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="mac-vfield mac-vfield--search"
      ></v-text-field>
      <div class="sim-search-tools">
        <div class="mac-form-seg" role="tablist">
          <button
            v-for="opt in USAGE_OPTIONS"
            :key="opt.value"
            type="button"
            role="tab"
            class="mac-form-seg-btn"
            :class="{ 'is-active': usageFilter === opt.value }"
            @click="usageFilter = opt.value"
          >
            {{ opt.label }}<span class="sim-seg-count">{{ usageCounts[opt.value] }}</span>
          </button>
        </div>
        <MacFilterPopover :sheet="smAndDown" :count="filterTokens.length" :result-count="sortedRows.length" @clear="clearFilters">
          <div class="mac-filter-field">
            <div class="mac-sheet-label">格式</div>
            <v-select v-model="formatFilter" :items="SALES_IMAGE_FORMATS" multiple placeholder="全部" v-bind="macFieldProps"></v-select>
          </div>
          <div class="mac-filter-field mac-filter-field--wide">
            <div class="mac-sheet-label">更新日期</div>
            <div class="mac-filter-range">
              <v-text-field v-model="dateFrom" type="date" clearable v-bind="macFieldProps"></v-text-field>
              <span class="mac-filter-range-sep">～</span>
              <v-text-field v-model="dateTo" type="date" clearable :min="dateFrom || undefined" v-bind="macFieldProps"></v-text-field>
            </div>
          </div>
        </MacFilterPopover>
      </div>
    </div>

    <div v-if="filterTokens.length" class="mac-tokens">
      <span v-for="t in filterTokens" :key="t.key" class="mac-token">
        {{ t.label }}
        <button type="button" class="mac-token-x" :title="`移除 ${t.label}`" @click="t.clear()">
          <v-icon size="13">mdi-close</v-icon>
        </button>
      </span>
      <button type="button" class="mac-link-btn" @click="clearFilters">清除全部</button>
    </div>

    <!-- 勾選後的批次操作列 -->
    <div v-if="selectedIds.length" class="sim-selbar">
      <span class="sim-selbar-count">已選取 {{ selectedIds.length }} 張</span>
      <button type="button" class="mac-link-btn" @click="selectedIds = []">取消選取</button>
      <span class="mac-spacer"></span>
      <button type="button" class="mac-btn" :disabled="downloading" @click="downloadImages(selectedRows)">
        <v-progress-circular v-if="downloading" indeterminate size="14" width="2"></v-progress-circular>
        <v-icon v-else size="16">mdi-tray-arrow-down</v-icon>下載
      </button>
      <button type="button" class="mac-btn mac-btn--danger" @click="askDelete(selectedRows)">
        <v-icon size="16">mdi-trash-can-outline</v-icon>刪除
      </button>
    </div>

    <!-- 尚無圖片 -->
    <div v-if="!loading && images.length === 0" class="sim-empty">
      <v-icon size="44">mdi-image-multiple-outline</v-icon>
      <div class="sim-empty-title">尚無圖片</div>
      <button type="button" class="mac-btn mac-btn--primary mac-btn--lg" @click="openUpload()">
        <v-icon size="16">mdi-tray-arrow-up</v-icon>上傳圖片
      </button>
    </div>

    <!-- 💻 桌機：表格 -->
    <v-data-table
      v-else-if="!smAndDown"
      v-model="selectedIds"
      v-model:sort-by="sortBy"
      :headers="headers"
      :items="sortedRows"
      :custom-key-sort="{ imageName: compareText }"
      item-value="id"
      show-select
      select-strategy="all"
      :items-per-page="50"
      :items-per-page-options="PAGE_OPTIONS"
      :loading="loading"
      class="mac-table sim-table"
      no-data-text="找不到符合的圖片"
      loading-text="載入中…"
      hover
      @click:row="(_, { item }) => openPreview(item)"
    >
      <template #header.data-table-select="{ allSelected, someSelected, selectAll }">
        <label class="sim-check-cell" title="全選">
          <input type="checkbox" class="mac-check" :checked="allSelected" :indeterminate="someSelected && !allSelected" @change="selectAll(!allSelected)" />
        </label>
      </template>
      <template #item.data-table-select="{ internalItem, index, isSelected, toggleSelect }">
        <label class="sim-check-cell" @click.stop>
          <input type="checkbox" class="mac-check" :checked="isSelected(internalItem)" @click="toggleSelect(internalItem, index, $event)" />
        </label>
      </template>

      <template #item.thumb="{ item }">
        <div class="sim-thumb" :class="{ 'is-busy': replacingIds.has(item.id) }" v-file-drop="rowDrop(item)">
          <img :src="item.src" :alt="item.imageName" loading="lazy" @load="onThumbLoad(item, $event)" />
          <div v-if="replacingIds.has(item.id)" class="sim-thumb-mask">
            <v-progress-circular indeterminate size="18" width="2" color="white"></v-progress-circular>
          </div>
        </div>
      </template>

      <template #item.imageName="{ item }">
        <div class="sim-name-cell" v-file-drop="rowDrop(item)">
          <div class="sim-name">{{ item.imageName }}</div>
          <div class="sim-sub">{{ item.fileName }}</div>
        </div>
      </template>

      <template #item.format="{ item }">
        <span v-if="item.format" class="mac-tag sim-format">{{ item.format }}</span>
        <span v-if="item.width" class="sim-muted sim-dim">{{ item.width }}×{{ item.height }}</span>
      </template>

      <template #item.fileSize="{ item }">
        <span class="sim-muted">{{ item.sizeText || '—' }}</span>
      </template>

      <template #item.usageCount="{ item }">
        <span v-if="usageLoading" class="sim-muted">…</span>
        <v-menu v-else-if="item.units.length" location="bottom start" :close-on-content-click="false">
          <template #activator="{ props: menuProps }">
            <button type="button" class="mac-tag sim-usage" v-bind="menuProps" @click.stop>
              <v-icon size="12">mdi-home-outline</v-icon>{{ item.units.length }} 戶
            </button>
          </template>
          <div class="mac-sheet sim-units-pop">
            <div class="mac-sheet-label">使用戶別</div>
            <div class="sim-units">
              <span v-for="u in item.units" :key="u" class="mac-tag">{{ u }}</span>
            </div>
          </div>
        </v-menu>
        <span v-else class="sim-muted">未使用</span>
      </template>

      <template #item.updatedMs="{ item }">
        <span class="sim-muted">{{ item.updatedText }}</span>
      </template>

      <template #item.actions="{ item }">
        <div class="sim-actions">
          <button type="button" class="mac-icon-btn" title="更名" @click.stop="openRename(item)">
            <v-icon size="18">mdi-pencil-outline</v-icon>
          </button>
          <button type="button" class="mac-icon-btn" title="替換檔案" :disabled="replacingIds.has(item.id)" @click.stop="pickReplace(item)">
            <v-icon size="18">mdi-image-refresh-outline</v-icon>
          </button>
          <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click.stop="askDelete([item])">
            <v-icon size="18">mdi-trash-can-outline</v-icon>
          </button>
        </div>
      </template>
    </v-data-table>

    <!-- 📱 手機：清單列 -->
    <div v-else class="mac-list">
      <div v-if="loading" class="mac-list-loading">載入中…</div>
      <template v-else>
        <div v-if="sortedRows.length" class="sim-mhead">
          <label class="sim-mhead-all">
            <input type="checkbox" class="mac-check" :checked="allVisibleSelected" :indeterminate="selectedIds.length > 0 && !allVisibleSelected" @change="toggleAllVisible" />全選
          </label>
          <span class="sim-muted">{{ sortedRows.length }} 張</span>
        </div>
        <div
          v-for="row in mobileRows"
          :key="row.id"
          class="mac-list-row sim-mrow"
          :class="{ 'is-selected': selectedSet.has(row.id) }"
          role="button"
          tabindex="0"
          @click="openPreview(row)"
          @keydown.enter="openPreview(row)"
        >
          <label class="sim-mcheck" @click.stop>
            <input type="checkbox" class="mac-check" :checked="selectedSet.has(row.id)" @change="toggleOne(row.id)" />
          </label>
          <div class="sim-thumb sim-thumb--m" :class="{ 'is-busy': replacingIds.has(row.id) }">
            <img :src="row.src" :alt="row.imageName" loading="lazy" @load="onThumbLoad(row, $event)" />
            <div v-if="replacingIds.has(row.id)" class="sim-thumb-mask">
              <v-progress-circular indeterminate size="18" width="2" color="white"></v-progress-circular>
            </div>
          </div>
          <div class="mac-list-main">
            <div class="mac-list-line1">
              <span class="mac-list-title">{{ row.imageName }}</span>
              <span v-if="row.units.length" class="mac-tag sim-usage">{{ row.units.length }} 戶</span>
              <span v-else-if="!usageLoading" class="mac-tag sim-unused">未使用</span>
            </div>
            <div class="mac-list-meta">{{ [row.format, row.width ? `${row.width}×${row.height}` : '', row.sizeText].filter(Boolean).join(' · ') }}</div>
            <div class="mac-list-meta">{{ row.updatedText }}</div>
          </div>
          <v-menu location="bottom end" content-class="mac-menu">
            <template #activator="{ props: menuProps }">
              <button type="button" class="mac-icon-btn" title="更多" v-bind="menuProps" @click.stop @keydown.enter.stop>
                <v-icon size="18">mdi-dots-horizontal</v-icon>
              </button>
            </template>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-pencil-outline" title="更名" @click="openRename(row)"></v-list-item>
              <v-list-item prepend-icon="mdi-image-refresh-outline" title="替換檔案" @click="pickReplace(row)"></v-list-item>
              <v-list-item prepend-icon="mdi-trash-can-outline" title="刪除" base-color="error" @click="askDelete([row])"></v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div v-if="!sortedRows.length" class="mac-list-empty">找不到符合的圖片</div>
        <div v-if="sortedRows.length > mobileVisible" class="mac-list-more">
          <button type="button" class="mac-btn mac-btn--lg mac-btn--block" @click="mobileVisible += MOBILE_PAGE">
            載入更多（還有 {{ sortedRows.length - mobileVisible }} 張）
          </button>
        </div>
      </template>
    </div>

    <input ref="replaceInput" type="file" class="d-none" :accept="SALES_IMAGE_ACCEPT" @change="onReplaceInput" />
    <input ref="missingInput" type="file" class="d-none" :accept="SALES_IMAGE_ACCEPT" @change="onMissingInput" />

    <SalesImageUploadDialog
      ref="uploadDialog"
      v-model="uploadOpen"
      :project-id="projectId"
      :existing-names="existingNames"
    />

    <SalesImagePreviewDialog
      v-model="previewOpen"
      v-model:index="previewIndex"
      :images="sortedRows"
      @rename="openRename"
      @replace="pickReplace"
      @delete="row => askDelete([row])"
    />

    <!-- 更名 -->
    <v-dialog v-model="rename.open" max-width="420" content-class="mac-dialog-fit" :persistent="rename.saving">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-pencil-outline</v-icon>更名
          <button type="button" class="mac-sheet-close" title="關閉" :disabled="rename.saving" @click="rename.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mac-sheet-section">
          <div class="mac-sheet-label">圖片名稱</div>
          <input
            v-model="rename.name"
            type="text"
            class="mac-form-input sim-input"
            :class="{ 'is-invalid': !!renameError }"
            :maxlength="SALES_IMAGE_NAME_MAX"
            :disabled="rename.saving"
            autofocus
            @keydown.enter="saveRename"
          />
          <div v-if="renameError" class="sim-field-error">{{ renameError }}</div>
          <div v-else-if="rename.row?.units.length" class="mac-sheet-note sim-field-note">{{ rename.row.units.length }} 戶引用將一併更新</div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="rename.saving" @click="rename.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!canSaveRename" @click="saveRename">
            <v-progress-circular v-if="rename.saving" indeterminate size="14" width="2"></v-progress-circular>儲存
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 刪除確認 -->
    <v-dialog v-model="removal.open" max-width="440" content-class="mac-dialog-fit" :persistent="removal.saving">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-trash-can-outline</v-icon>刪除圖片
          <button type="button" class="mac-sheet-close" title="關閉" :disabled="removal.saving" @click="removal.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mac-sheet-section sim-del">
          <div class="sim-del-title">
            確定刪除{{ removal.rows.length === 1 ? `「${removal.rows[0].imageName}」` : ` ${removal.rows.length} 張圖片` }}？
          </div>
          <div v-if="removal.rows.length > 1" class="sim-del-names">
            {{ removal.rows.slice(0, 12).map(r => r.imageName).join('、') }}<template v-if="removal.rows.length > 12">⋯</template>
          </div>
          <div v-if="removalUsedCount" class="mac-callout mac-callout--warning">
            <v-icon size="16">mdi-alert</v-icon>{{ removalUsedCount }} 張仍有戶別使用
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" :disabled="removal.saving" @click="removal.open = false">取消</button>
          <button type="button" class="mac-btn mac-btn--danger-fill" :disabled="removal.saving" @click="executeDelete">
            <v-progress-circular v-if="removal.saving" indeterminate size="14" width="2"></v-progress-circular>刪除
          </button>
        </div>
      </v-card>
    </v-dialog>

    <!-- 缺圖：戶別有引用但圖庫沒有的名稱 -->
    <v-dialog v-model="missingDialog" max-width="520" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-image-broken-variant</v-icon>缺圖
          <span class="mac-page-count">{{ missingList.length }} 個名稱</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="missingDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="pa-0">
          <div v-for="m in missingList" :key="m.name" class="sim-missing-row">
            <div class="sim-missing-main">
              <div class="sim-name">{{ m.name }}</div>
              <div class="sim-sub">{{ m.units.join('、') }}</div>
            </div>
            <button type="button" class="mac-btn mac-btn--sm" @click="pickMissing(m.name)">
              <v-icon size="15">mdi-tray-arrow-up</v-icon>上傳
            </button>
          </div>
          <div v-if="!missingList.length" class="mac-list-empty">沒有缺圖</div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast } from 'vue-toastification';
import MacFilterPopover from '@/components/MacFilterPopover.vue';
import SalesImageUploadDialog from './SalesImageUploadDialog.vue';
import SalesImagePreviewDialog from './SalesImagePreviewDialog.vue';
import {
  listenToSalesImages, fetchSalesHouseholdsOnce, saveSalesImage, renameSalesImage, deleteSalesImages,
} from '@/api.js';
import { shrinkImageToLimit } from '@/utils/canvasCompress';
import {
  SALES_IMAGE_ACCEPT, SALES_IMAGE_MAX_BYTES, SALES_IMAGE_NAME_MAX, SALES_IMAGE_FORMATS,
  normalizeImageName, imageNameError, imageFormat, formatBytes, timestampMs, buildImageUsage,
  readImageSize, fileToBase64,
} from '@/utils/salesImages';

const props = defineProps({
  projectId: { type: String, required: true },
});

const toast = useToast();
const { smAndDown } = useDisplay();

const USAGE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'used', label: '使用中' },
  { value: 'unused', label: '未使用' },
];
const PAGE_OPTIONS = [
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: -1, title: '全部' },
];
const MOBILE_PAGE = 40;
const headers = [
  { key: 'thumb', title: '', sortable: false, width: 68 },
  { key: 'imageName', title: '圖片名稱' },
  { key: 'format', title: '格式／尺寸', width: 150 },
  { key: 'fileSize', title: '大小', width: 90 },
  { key: 'usageCount', title: '使用戶別', width: 110 },
  { key: 'updatedMs', title: '更新時間', width: 150 },
  { key: 'actions', title: '', sortable: false, align: 'end', width: 120 },
];
const macFieldProps = {
  variant: 'solo',
  flat: true,
  density: 'compact',
  hideDetails: true,
  class: 'mac-vfield',
  menuProps: { contentClass: 'mac-menu' },
};

const collator = new Intl.Collator('zh-Hant', { numeric: true });
const compareText = (a, b) => collator.compare(String(a ?? ''), String(b ?? ''));
const dateText = ms => (ms ? new Date(ms).toLocaleString('zh-TW', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '');
const withVersion = (url, ms) => (url && ms ? `${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(ms / 1000)}` : url);

// ── 資料 ──
const images = ref([]);
const loading = ref(true);
const usage = ref(new Map());
const usageLoading = ref(true);
const measured = reactive({});
let unsubscribe = null;

function subscribe() {
  unsubscribe?.();
  loading.value = true;
  images.value = [];
  unsubscribe = listenToSalesImages(props.projectId, (data) => {
    images.value = data;
    loading.value = false;
  }, (error) => {
    toast.error(`載入圖片失敗：${error.message}`);
    loading.value = false;
  });
}

async function loadUsage() {
  usageLoading.value = true;
  try {
    usage.value = buildImageUsage(await fetchSalesHouseholdsOnce(props.projectId));
  } catch (e) {
    console.error('[SalesImageManager] 載入戶別引用失敗', e);
  } finally {
    usageLoading.value = false;
  }
}

watch(() => props.projectId, (id) => {
  if (!id) return;
  subscribe();
  loadUsage();
}, { immediate: true });
onUnmounted(() => unsubscribe?.());

const rows = computed(() => images.value.map((img) => {
  const updatedMs = timestampMs(img.updatedAt) || timestampMs(img.createdAt);
  const size = measured[img.id];
  const units = usage.value.get(img.imageName) || [];
  return {
    id: img.id,
    imageName: img.imageName || '',
    fileName: img.fileName || '',
    src: withVersion(img.downloadURL, updatedMs),
    format: imageFormat(img),
    width: img.width || size?.width || 0,
    height: img.height || size?.height || 0,
    fileSize: img.fileSize || 0,
    sizeText: formatBytes(img.fileSize),
    units,
    usageCount: units.length,
    updatedMs,
    updatedText: dateText(updatedMs),
  };
}));
const existingNames = computed(() => images.value.map(i => i.imageName));

// 舊資料沒有存寬高：縮圖載入後補量
function onThumbLoad(row, e) {
  if (row.width || measured[row.id]) return;
  const { naturalWidth: width, naturalHeight: height } = e.target;
  if (width) measured[row.id] = { width, height };
}

const missingList = computed(() => {
  if (usageLoading.value || loading.value) return [];
  const names = new Set(images.value.map(i => i.imageName));
  return [...usage.value.entries()]
    .filter(([name]) => !names.has(name))
    .map(([name, units]) => ({ name, units }))
    .sort((a, b) => compareText(a.name, b.name));
});

// ── 搜尋／篩選／排序 ──
const search = ref('');
const usageFilter = ref('all');
const formatFilter = ref([]);
const dateFrom = ref('');
const dateTo = ref('');
const sortBy = ref([{ key: 'updatedMs', order: 'desc' }]);

const searchedRows = computed(() => {
  const q = (search.value || '').trim().toLowerCase();
  const from = dateFrom.value ? new Date(`${dateFrom.value}T00:00:00`).getTime() : null;
  const to = dateTo.value ? new Date(`${dateTo.value}T23:59:59.999`).getTime() : null;
  return rows.value.filter((r) => {
    if (q && !r.imageName.toLowerCase().includes(q) && !r.fileName.toLowerCase().includes(q)
      && !r.units.some(u => String(u).toLowerCase().includes(q))) return false;
    if (formatFilter.value.length && !formatFilter.value.includes(r.format)) return false;
    if (from && r.updatedMs < from) return false;
    if (to && r.updatedMs > to) return false;
    return true;
  });
});
const usageCounts = computed(() => {
  const used = searchedRows.value.filter(r => r.usageCount > 0).length;
  return { all: searchedRows.value.length, used, unused: searchedRows.value.length - used };
});
const filteredRows = computed(() => {
  if (usageFilter.value === 'used') return searchedRows.value.filter(r => r.usageCount > 0);
  if (usageFilter.value === 'unused') return searchedRows.value.filter(r => r.usageCount === 0);
  return searchedRows.value;
});
// 預覽的上一張／下一張依表格目前的排序
const sortedRows = computed(() => {
  const [s] = sortBy.value;
  if (!s) return filteredRows.value;
  const dir = s.order === 'desc' ? -1 : 1;
  const list = [...filteredRows.value];
  list.sort((a, b) => {
    const x = a[s.key];
    const y = b[s.key];
    return dir * (typeof x === 'number' && typeof y === 'number' ? x - y : compareText(x, y));
  });
  return list;
});

const filterTokens = computed(() => {
  const tokens = [];
  if (formatFilter.value.length) tokens.push({ key: 'format', label: `格式：${formatFilter.value.join('、')}`, clear: () => { formatFilter.value = []; } });
  if (dateFrom.value || dateTo.value) {
    tokens.push({ key: 'date', label: `更新：${dateFrom.value || '不限'}～${dateTo.value || '不限'}`, clear: () => { dateFrom.value = ''; dateTo.value = ''; } });
  }
  return tokens;
});
function clearFilters() {
  formatFilter.value = [];
  dateFrom.value = '';
  dateTo.value = '';
}

// ── 勾選 ──
const selectedIds = ref([]);
const selectedSet = computed(() => new Set(selectedIds.value));
const selectedRows = computed(() => sortedRows.value.filter(r => selectedSet.value.has(r.id)));
// 篩掉或已刪除的項目不保留勾選，避免批次操作動到看不到的圖片
watch(filteredRows, (list) => {
  const visible = new Set(list.map(r => r.id));
  if (selectedIds.value.some(id => !visible.has(id))) selectedIds.value = selectedIds.value.filter(id => visible.has(id));
});
const allVisibleSelected = computed(() => sortedRows.value.length > 0 && sortedRows.value.every(r => selectedSet.value.has(r.id)));
function toggleAllVisible() {
  selectedIds.value = allVisibleSelected.value ? [] : sortedRows.value.map(r => r.id);
}
function toggleOne(id) {
  selectedIds.value = selectedSet.value.has(id) ? selectedIds.value.filter(x => x !== id) : [...selectedIds.value, id];
}

const mobileVisible = ref(MOBILE_PAGE);
const mobileRows = computed(() => sortedRows.value.slice(0, mobileVisible.value));
watch([search, usageFilter, formatFilter, dateFrom, dateTo], () => { mobileVisible.value = MOBILE_PAGE; });

// ── 上傳 ──
const uploadOpen = ref(false);
const uploadDialog = ref(null);
function openUpload(files, presetName = '') {
  uploadOpen.value = true;
  if (files?.length) uploadDialog.value?.addFiles(files, presetName);
}

// ── 預覽 ──
const previewOpen = ref(false);
const previewIndex = ref(0);
function openPreview(row) {
  const i = sortedRows.value.findIndex(r => r.id === row.id);
  if (i < 0) return;
  previewIndex.value = i;
  previewOpen.value = true;
}

// ── 替換檔案 ──
const replaceInput = ref(null);
const replaceTarget = ref(null);
const replacingIds = reactive(new Set());

function pickReplace(row) {
  replaceTarget.value = row;
  replaceInput.value?.click();
}
function onReplaceInput(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (file && replaceTarget.value) replaceFile(replaceTarget.value, file);
}
function rowDrop(row) {
  return { accept: SALES_IMAGE_ACCEPT, multiple: false, disabled: replacingIds.has(row.id), onFiles: files => replaceFile(row, files[0]) };
}
async function replaceFile(row, file) {
  if (replacingIds.has(row.id)) return;
  if (!SALES_IMAGE_ACCEPT.split(',').includes(file.type)) {
    toast.error('僅支援 PNG、JPG、WEBP');
    return;
  }
  replacingIds.add(row.id);
  try {
    const upload = await shrinkImageToLimit(file, SALES_IMAGE_MAX_BYTES);
    const size = await readImageSize(upload);
    if (!size) throw new Error('無法讀取這張圖片');
    await saveSalesImage({
      projectId: props.projectId,
      docId: row.id,
      fileName: upload.name,
      contentType: upload.type,
      fileBase64: await fileToBase64(upload),
      width: size.width,
      height: size.height,
    });
    delete measured[row.id];
    toast.success(`已替換「${row.imageName}」`);
  } catch (e) {
    toast.error(`替換失敗：${e.message}`);
  } finally {
    replacingIds.delete(row.id);
  }
}

// ── 更名 ──
const rename = reactive({ open: false, row: null, name: '', saving: false });
const renameError = computed(() => {
  if (!rename.row) return '';
  const name = normalizeImageName(rename.name);
  if (name === rename.row.imageName) return '';
  return imageNameError(name, new Set(existingNames.value));
});
const canSaveRename = computed(() => !rename.saving && !renameError.value
  && normalizeImageName(rename.name) !== rename.row?.imageName);

function openRename(row) {
  Object.assign(rename, { open: true, row, name: row.imageName, saving: false });
}
async function saveRename() {
  if (!canSaveRename.value) return;
  rename.saving = true;
  try {
    const res = await renameSalesImage(props.projectId, rename.row.id, normalizeImageName(rename.name));
    toast.success(res.householdsUpdated ? `已更名，並更新 ${res.householdsUpdated} 戶` : '已更名');
    selectedIds.value = selectedIds.value.filter(id => id !== rename.row.id);
    rename.open = false;
    if (res.householdsUpdated) loadUsage();
  } catch (e) {
    toast.error(`更名失敗：${e.message}`);
  } finally {
    rename.saving = false;
  }
}

// ── 刪除 ──
const removal = reactive({ open: false, rows: [], saving: false });
const removalUsedCount = computed(() => removal.rows.filter(r => r.usageCount > 0).length);
function askDelete(list) {
  if (!list.length) return;
  Object.assign(removal, { open: true, rows: [...list], saving: false });
}
async function executeDelete() {
  removal.saving = true;
  try {
    const res = await deleteSalesImages(props.projectId, removal.rows.map(r => r.id));
    if (res.failed?.length) toast.error(`${res.failed.length} 張刪除失敗`);
    if (res.deleted) toast.success(`已刪除 ${res.deleted} 張圖片`);
    const removed = new Set(removal.rows.map(r => r.id));
    selectedIds.value = selectedIds.value.filter(id => !removed.has(id));
    removal.open = false;
  } catch (e) {
    toast.error(`刪除失敗：${e.message}`);
  } finally {
    removal.saving = false;
  }
}

// ── 下載（多張打包 ZIP） ──
const downloading = ref(false);
const FORMAT_EXT = { PNG: 'png', JPG: 'jpg', WEBP: 'webp' };
const safeFileName = name => String(name).replace(/[\\/:*?"<>|]/g, '_');
const extOf = row => FORMAT_EXT[row.format] || row.fileName.split('.').pop() || 'png';

async function downloadImages(list) {
  if (!list.length || downloading.value) return;
  downloading.value = true;
  try {
    const { saveAs } = await import('file-saver');
    const fetchBlob = async (row) => {
      const res = await fetch(row.src);
      if (!res.ok) throw new Error(`${row.imageName} 下載失敗`);
      return res.blob();
    };
    if (list.length === 1) {
      saveAs(await fetchBlob(list[0]), `${safeFileName(list[0].imageName)}.${extOf(list[0])}`);
    } else {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      for (const row of list) zip.file(`${safeFileName(row.imageName)}.${extOf(row)}`, await fetchBlob(row));
      saveAs(await zip.generateAsync({ type: 'blob' }), `銷控圖片_${list.length}張.zip`);
    }
  } catch (e) {
    toast.error(e.message || '下載失敗');
  } finally {
    downloading.value = false;
  }
}

// ── 缺圖補上傳 ──
const missingDialog = ref(false);
const missingInput = ref(null);
const missingTarget = ref('');
function pickMissing(name) {
  missingTarget.value = name;
  missingInput.value?.click();
}
function onMissingInput(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;
  missingDialog.value = false;
  openUpload([file], missingTarget.value);
}
</script>

<style scoped>
.sim {
  border-radius: 12px;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}
.sim-searchbar { flex-wrap: wrap; }
.sim-search-tools { display: flex; align-items: center; gap: 8px; }
.sim-seg-count { margin-left: 5px; font-size: 11.5px; font-weight: 500; color: #8e8e93; }
.mac-form-seg-btn.is-active .sim-seg-count { color: #6e6e73; }
.sim-missing-btn { color: #b25e00; }
.sim-missing-btn .v-icon { color: #c27400; }

/* 批次操作列 */
.sim-selbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 16px 10px;
  padding: 6px 8px 6px 12px;
  border-radius: 9px;
  background: rgba(0, 113, 227, 0.08);
}
.sim-selbar-count { font-size: 13px; font-weight: 600; color: #0058b0; }
.sim-selbar .mac-spacer { flex: 1 1 auto; }

/* 表格 */
.sim-table :deep(tbody tr) { cursor: pointer; }
.sim-check-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 34px;
  cursor: pointer;
}
.sim-thumb {
  position: relative;
  width: 48px;
  height: 48px;
  margin: 6px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f2f2f5;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.1);
}
.sim-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
.sim-thumb-mask {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  background: rgba(0, 0, 0, 0.42);
}
.sim-name-cell { padding: 6px 0; }
.sim-name { font-weight: 600; font-size: 13.5px; overflow-wrap: anywhere; }
.sim-sub { font-size: 12px; color: #6e6e73; overflow-wrap: anywhere; }
.sim-muted { font-size: 12.5px; color: #6e6e73; white-space: nowrap; }
.sim-format { margin-right: 6px; }
.sim-dim { font-variant-numeric: tabular-nums; }
.sim-usage {
  --mac-tag-bg: rgba(52, 199, 89, 0.14);
  --mac-tag-color: #1f7a35;
  border: 0;
  font-family: inherit;
  cursor: pointer;
}
.sim-unused { --mac-tag-color: #8e8e93; }
.sim-actions { display: inline-flex; gap: 2px; }
.sim-units-pop {
  min-width: 180px;
  max-width: min(360px, calc(100vw - 32px));
  max-height: 300px;
  overflow-y: auto;
  padding: 12px 14px;
  background: #fff;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
}
.sim-units { display: flex; flex-wrap: wrap; gap: 5px; }

/* 空狀態 */
.sim-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 56px 16px 64px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  color: #8e8e93;
}
.sim-empty-title { font-size: 15px; font-weight: 600; color: #6e6e73; }

/* 手機清單 */
.sim-mhead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #ececf0;
  background: #fafafa;
}
.sim-mhead-all { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.sim-mrow { align-items: center; gap: 10px; padding-left: 12px; }
.sim-mrow.is-selected { --mac-row-bg: rgba(0, 113, 227, 0.06); }
.sim-mcheck { display: grid; place-content: center; width: 28px; height: 44px; margin: -6px -4px -6px -4px; }
.sim-mcheck .mac-check { width: 20px; height: 20px; }
.sim-thumb--m { flex-shrink: 0; width: 56px; height: 56px; margin: 0; }

/* 對話框 */
.sim-input { display: block; width: 100%; height: 32px; font-size: 14px; }
.sim-input.is-invalid { border-color: #d62d20; box-shadow: 0 0 0 3px rgba(214, 45, 32, 0.14); }
.sim-field-error { margin-top: 6px; font-size: 12px; color: #d62d20; }
.sim-field-note { margin-top: 6px; }
.sim-del { display: flex; flex-direction: column; gap: 10px; }
.sim-del-title { font-size: 14px; font-weight: 600; overflow-wrap: anywhere; }
.sim-del-names { font-size: 12.5px; color: #6e6e73; line-height: 1.55; overflow-wrap: anywhere; }
.sim-missing-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  border-bottom: 1px solid #f0f0f3;
}
.sim-missing-main { flex: 1 1 auto; min-width: 0; }

@media (max-width: 600px) {
  .sim { border-radius: 0; box-shadow: none; }
  .sim-search-tools { width: 100%; justify-content: space-between; }
  .sim-selbar { margin: 0 12px 8px; }
  .sim-input { height: 40px; font-size: 16px; }
}
</style>
