<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    fullscreen
    hide-overlay
    transition="dialog-bottom-transition"
  >
    <v-card class="d-flex flex-column">
      <v-toolbar dark color="#f5f5f7" density="compact">
        <v-btn icon dark @click="$emit('update:show', false)">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>退戶記錄管理</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-chart-bar"
          @click="statisticsDialog = true"
          :disabled="items.length === 0"
          class="mr-2"
        >
          統計分析
        </v-btn>
        <v-btn
          variant="tonal"
          prepend-icon="mdi-refresh"
          @click="loadData"
          :loading="isLoading"
        >
          重新整理
        </v-btn>
      </v-toolbar>

      <v-card-text class="flex-grow-1 pa-4" style="overflow-y: auto;">
        <!-- 載入中 -->
        <div v-if="isLoading && items.length === 0" class="d-flex justify-center align-center" style="height: 300px;">
          <div class="text-center">
            <v-progress-circular indeterminate color="primary" size="48" class="mb-4"></v-progress-circular>
            <p class="text-body-1 text-grey">正在載入退戶資料...</p>
          </div>
        </div>

        <!-- 空狀態 -->
        <div v-else-if="!isLoading && items.length === 0" class="d-flex flex-column justify-center align-center" style="height: 300px;">
          <v-icon size="80" color="grey-lighten-1">mdi-file-document-remove-outline</v-icon>
          <p class="mt-4 text-h6 text-grey">沒有退戶記錄</p>
          <p class="text-body-2 text-grey">本專案目前尚無退戶資料。</p>
        </div>

        <!-- 列表 -->
        <template v-else>
          <!-- 搜索欄 -->
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <v-text-field
                v-model="searchQuery"
                prepend-inner-icon="mdi-magnify"
                placeholder="搜尋關鍵字（戶別、買方、業務員、原因等）"
                variant="outlined"
                density="compact"
                clearable
              ></v-text-field>
            </v-col>
            <v-col cols="6" md="2">
              <v-switch
                v-model="showDeleted"
                label="顯示已刪除記錄"
                density="compact"
                color="error"
                hide-details
                class="pt-2"
              />
            </v-col>
            <v-col cols="6" md="3">
              <v-switch
                v-model="showRestored"
                label="顯示已復原記錄"
                density="compact"
                color="success"
                hide-details
                class="pt-2"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-alert type="info" variant="tonal" density="compact" class="h-100 d-flex align-center">
                共 {{ filteredItems.length }} / {{ items.length }} 筆
              </v-alert>
            </v-col>
          </v-row>

          <v-data-table
            :headers="tableHeaders"
            :items="filteredItems"
            v-model:expanded="expanded"
            item-value="docId"
            density="compact"
            class="mt-2"
            :loading="isLoading"
            @click:row="onRowClick"
            hover
          >
            <!-- 戶別 + 車位 chips -->
            <template v-slot:item.unitId="{ item }">
              <div class="d-flex align-center gap-1 flex-wrap" :class="{ 'text-grey': item.isDeleted, 'deleted-text': item.isDeleted }">
                <span class="font-weight-bold">{{ item.unitId }}</span>
                <v-chip v-if="item.parkingCount > 0" size="x-small" color="info" variant="tonal">
                  車位 {{ item.parkingCount }}
                </v-chip>
                <v-chip v-if="item.isDeleted" size="x-small" color="error" variant="tonal">
                  已刪除
                </v-chip>
                <v-chip v-if="item.isRestored" size="x-small" color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">
                  已復原
                  <v-tooltip activator="parent" location="top">
                    {{ item.restoredBy || '—' }} 於 {{ formatDate(item.restoredAt) }} 復原，此紀錄僅供查閱
                  </v-tooltip>
                </v-chip>
              </div>
            </template>

            <template v-slot:item.salesperson="{ item }">
              {{ formatSalespersons(item.salesperson, '、', '—') }}
            </template>

            <!-- 退戶原因 chips -->
            <template v-slot:item.cancelReasons="{ item }">
              <template v-if="item.cancelReasons && item.cancelReasons.length > 0">
                <v-chip
                  v-for="(reason, idx) in item.cancelReasons.slice(0, 2)"
                  :key="idx"
                  label
                  size="small"
                  color="error"
                  variant="tonal"
                  class="mr-1 my-1"
                >
                  {{ reason }}
                </v-chip>
                <v-chip
                  v-if="item.cancelReasons.length > 2"
                  label
                  size="x-small"
                  color="grey"
                  variant="tonal"
                >
                  +{{ item.cancelReasons.length - 2 }} 項
                </v-chip>
              </template>
            </template>

            <!-- 成交總價 -->
            <template v-slot:item.totalPrice="{ item }">
              <span v-if="calculateTotalTransactionPrice(item) > 0" class="font-weight-bold text-success">
                {{ formatPrice(calculateTotalTransactionPrice(item)) }} 萬
              </span>
              <span v-else>—</span>
            </template>

            <!-- 小訂日期 -->
            <template v-slot:item.payment_deposit_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_deposit_date) }}</span>
            </template>

            <!-- 補足日期 -->
            <template v-slot:item.payment_complete_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_complete_date) }}</span>
            </template>

            <!-- 簽約日期 -->
            <template v-slot:item.payment_contract_date="{ item }">
              <span class="text-caption">{{ formatDateOnly(item.payment_contract_date) }}</span>
            </template>

            <!-- 退戶日期 -->
            <template v-slot:item.cancellationDate="{ item }">
              {{ formatDate(item.cancellationDate) }}
            </template>

            <!-- 備註（留言式：badge + 最新一則摘要，展開列可完整檢視與 CRUD） -->
            <template v-slot:item.remarks="{ item }">
              <template v-if="remarkCellInfo(item).count > 0">
                <span class="text-body-2 d-inline-flex align-center">
                  <v-icon size="small" color="primary" class="mr-1">mdi-comment-text-outline</v-icon>
                  <span class="text-primary font-weight-bold mr-1">{{ remarkCellInfo(item).count }}</span>
                  {{ remarkCellInfo(item).preview }}
                </span>
              </template>
              <span v-else class="text-grey text-caption">—</span>
            </template>

            <!-- 展開列（保留現有詳情內容） -->
            <!-- 展開列：明細與操作共用 CancelledPurchaseDetail（戶別資訊「退戶紀錄」亦使用同一元件） -->
            <template v-slot:expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="pa-0">
                  <v-card flat class="pa-4 bg-grey-lighten-5">
                    <CancelledPurchaseDetail
                      :item="item"
                      :project-id="projectId"
                      @patched="onDetailPatched"
                      @removed="onDetailRemoved"
                      @restored="onDetailRestored"
                    />
                  </v-card>
                </td>
              </tr>
            </template>
          </v-data-table>
        </template>
      </v-card-text>
    </v-card>

    <!-- 退戶統計分析 Dialog -->
    <CancelledPurchaseStatistics
      :show="statisticsDialog"
      :items="items"
      @update:show="statisticsDialog = $event"
    />
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { getCancelledPurchases } from '@/api';
import { useToast, POSITION } from 'vue-toastification';
import CancelledPurchaseStatistics from './CancelledPurchaseStatistics.vue';
import { formatSalespersons } from '@/utils/salespersonUtils';
import CancelledPurchaseDetail from './CancelledPurchaseDetail.vue';
import { resolveDisplayNotes } from '@/utils/remarkNotes';
import { formatCancelDateTime as formatDate, formatDateOnly, formatPrice, calculateTotalTransactionPrice } from '@/utils/cancelledPurchaseUtils';

const props = defineProps({
  show: { type: Boolean, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['update:show', 'data-updated']);

const toast = useToast();

const isLoading = ref(false);
const items = ref([]);
const expanded = ref([]);
const statisticsDialog = ref(false);
const searchQuery = ref('');
const showDeleted = ref(false);
const showRestored = ref(true); // 復原時選擇保留的紀錄（已復原、僅供查閱）預設顯示，可切換隱藏

// Table headers
const tableHeaders = [
  { title: '戶別', key: 'unitId', sortable: true, width: '120px' },
  { title: '買方', key: 'buyerName', sortable: true },
  { title: '業務員', key: 'salesperson', sortable: true },
  { title: '成交總價', key: 'totalPrice', sortable: false },
  { title: '坪數', key: 'area_house_ping', sortable: true, width: '80px' },
  { title: '小訂日期', key: 'payment_deposit_date', sortable: true, width: '120px' },
  { title: '補足日期', key: 'payment_complete_date', sortable: true, width: '120px' },
  { title: '簽約日期', key: 'payment_contract_date', sortable: true, width: '120px' },
  { title: '退戶原因', key: 'cancelReasons', sortable: false },
  { title: '退戶日期', key: 'cancellationDate', sortable: true, width: '150px' },
  { title: '備註', key: 'remarks', sortable: false },
  { title: '操作人', key: 'operatorName', sortable: true },
];

// 搜尋過濾邏輯
const filteredItems = computed(() => {
  let result = items.value;

  // 過濾冷刪除項目
  if (!showDeleted.value) {
    result = result.filter(item => !item.isDeleted);
  }

  // 過濾已復原（保留紀錄）項目
  if (!showRestored.value) {
    result = result.filter(item => !item.isRestored);
  }

  // 搜尋過濾
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return result;

  return result.filter(item => {
    const searchFields = [
      item.unitId,
      item.buyerName,
      formatSalespersons(item.salesperson, ' ', ''),
      item.operatorName,
      item.area_house_ping,
      formatDate(item.cancellationDate),
      (item.cancelReasons || []).join(' '),
      item.remarks,
      formatPrice(calculateTotalTransactionPrice(item))
    ];
    return searchFields.some(field =>
      field && String(field).toLowerCase().includes(query)
    );
  });
});

async function loadData() {
  isLoading.value = true;
  try {
    // 管理畫面需要完整列表：含冷刪除與「復原時保留」的紀錄
    const result = await getCancelledPurchases(props.projectId, true, true);
    if (result.status === 'success') {
      items.value = result.data || [];
    } else {
      toast.error(`載入失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('載入退戶資料失敗:', error);
    toast.error('載入退戶資料失敗', { position: POSITION.BOTTOM_CENTER });
  } finally {
    isLoading.value = false;
  }
}

function onRowClick(event, { item }) {
  const docId = item.docId;
  const idx = expanded.value.indexOf(docId);
  if (idx === -1) {
    expanded.value = [docId]; // 單次只展開一筆
  } else {
    expanded.value = [];
  }
}

// ✅ [備註留言] 表格備註欄摘要（置頂優先、新到舊取第一則）
function remarkCellInfo(item) {
  const notes = resolveDisplayNotes(item.remarkNotes, item.remarks);
  if (notes.length === 0) return { count: 0, preview: '' };
  const first = notes[0];
  const author = first.type === 'legacy' ? '舊備註' : (first.type === 'system' ? '系統' : (first.authorName || ''));
  const text = String(first.content || '').replace(/\s+/g, ' ');
  const preview = `${author ? author + '：' : ''}${text}`;
  return { count: notes.length, preview: preview.length > 20 ? preview.slice(0, 20) + '…' : preview };
}

// 展開列明細（CancelledPurchaseDetail）回報的變更，即時同步列表
function onDetailPatched(docId, patch) {
  const idx = items.value.findIndex(i => i.docId === docId);
  if (idx !== -1) Object.assign(items.value[idx], patch);
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'isDeleted')) expanded.value = [];
}

function onDetailRemoved(docId) {
  items.value = items.value.filter(i => i.docId !== docId);
  expanded.value = [];
}

function onDetailRestored() {
  expanded.value = [];
  emit('data-updated');
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadData();
  } else {
    expanded.value = [];
    items.value = [];
  }
});
</script>

<style scoped>
.expanded-card {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}

/* 冷刪除項目樣式 */
.deleted-row {
  background-color: #f5f5f5 !important;
  opacity: 0.65;
}

.deleted-text {
  text-decoration: line-through;
}

.deleted-row:hover {
  background-color: #efefef !important;
}
</style>
