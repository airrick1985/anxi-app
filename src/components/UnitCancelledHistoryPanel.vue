<template>
  <!-- 戶別資訊「退戶紀錄」分頁：本戶歷次退戶（有效 + 已復原），點列開明細視窗，明細操作與退戶記錄管理相同 -->
  <div class="unit-cancelled-panel">
    <div v-if="isLoading" class="d-flex justify-center align-center py-10">
      <v-progress-circular indeterminate color="primary" size="36" />
    </div>

    <div v-else-if="items.length === 0" class="d-flex flex-column align-center justify-center py-10 text-grey">
      <v-icon size="56" color="grey-lighten-1">mdi-file-document-remove-outline</v-icon>
      <div class="mt-3 text-body-1">沒有退戶紀錄</div>
    </div>

    <template v-else>
      <div class="d-flex align-center justify-space-between mb-2 px-1">
        <span class="text-body-2 text-grey">共 {{ items.length }} 筆</span>
        <v-btn size="small" variant="text" prepend-icon="mdi-refresh" :loading="isLoading" @click="loadData">重新整理</v-btn>
      </div>

      <div class="cancel-list">
        <button
          v-for="(item, idx) in items"
          :key="item.docId"
          type="button"
          class="cancel-row"
          :class="{ 'cancel-row--restored': item.isRestored }"
          @click="openDetail(item)"
        >
          <div class="cancel-row__index">{{ items.length - idx }}</div>
          <div class="cancel-row__body">
            <div class="cancel-row__line">
              <span class="cancel-row__date">
                <v-icon size="14" class="mr-1">mdi-calendar-outline</v-icon>{{ formatDateOnly(item.cancellationDate) }}
              </span>
              <span class="cancel-row__buyer">{{ item.buyerName || '—' }}</span>
              <v-chip v-if="item.isRestored" size="x-small" color="success" variant="tonal" prepend-icon="mdi-check-circle-outline">已復原</v-chip>
              <v-chip v-if="item.parkingCount > 0" size="x-small" color="info" variant="tonal">車位 {{ item.parkingCount }}</v-chip>
            </div>
            <div class="cancel-row__line cancel-row__meta">
              <span>業務 {{ formatSalespersons(item.salesperson, '、', '—') }}</span>
              <span v-if="calculateTotalTransactionPrice(item) > 0" class="text-success font-weight-bold">
                {{ formatPrice(calculateTotalTransactionPrice(item)) }} 萬
              </span>
              <span v-if="item.operatorName">{{ item.operatorName }}</span>
            </div>
            <div v-if="item.cancelReasons && item.cancelReasons.length" class="cancel-row__line">
              <v-chip v-for="(reason, i) in item.cancelReasons.slice(0, 3)" :key="i" label size="x-small" color="error" variant="tonal">{{ reason }}</v-chip>
              <v-chip v-if="item.cancelReasons.length > 3" label size="x-small" color="grey" variant="tonal">+{{ item.cancelReasons.length - 3 }}</v-chip>
            </div>
          </div>
          <v-icon size="20" color="grey" class="cancel-row__chevron">mdi-chevron-right</v-icon>
        </button>
      </div>
    </template>

    <!-- 明細視窗 -->
    <v-dialog v-model="detailDialog.show" :fullscreen="isMobile" :max-width="isMobile ? '100%' : '960px'" scrollable
      :transition="isMobile ? 'dialog-bottom-transition' : 'dialog-transition'">
      <v-card v-if="currentItem" class="d-flex flex-column">
        <v-toolbar density="compact" color="#1a3a6e" class="cancel-detail-bar">
          <v-toolbar-title class="text-body-1 font-weight-bold">
            退戶明細
            <span class="ml-2 font-weight-regular">{{ formatDateOnly(currentItem.cancellationDate) }} · {{ currentItem.buyerName || '—' }}</span>
          </v-toolbar-title>
          <v-btn icon="mdi-close" variant="text" @click="detailDialog.show = false" />
        </v-toolbar>
        <v-card-text class="pa-4 bg-grey-lighten-5">
          <CancelledPurchaseDetail
            :item="currentItem"
            :project-id="projectId"
            @patched="onPatched"
            @removed="onRemoved"
            @restored="onRestored"
          />
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useToast, POSITION } from 'vue-toastification';
import { getCancelledPurchases } from '@/api';
import { formatSalespersons } from '@/utils/salespersonUtils';
import { formatDateOnly, formatPrice, calculateTotalTransactionPrice } from '@/utils/cancelledPurchaseUtils';
import CancelledPurchaseDetail from './CancelledPurchaseDetail.vue';

const props = defineProps({
  show: { type: Boolean, default: false },      // 戶別資訊是否開啟（銷控模式）
  projectId: { type: String, default: '' },
  unitId: { type: String, default: '' },
});

// count：本戶紀錄筆數（分頁 badge）；restored：已復原退戶，銷售資料已回寫，戶別資訊需刷新
const emit = defineEmits(['count', 'restored']);

const { mobile: isMobile } = useDisplay();
const toast = useToast();

const isLoading = ref(false);
const items = ref([]);
const detailDialog = reactive({ show: false, docId: null });
const currentItem = computed(() => items.value.find(i => i.docId === detailDialog.docId) || null);

let loadSeq = 0;
async function loadData() {
  if (!props.projectId || !props.unitId) {
    items.value = [];
    emit('count', 0);
    return;
  }
  const seq = ++loadSeq;
  isLoading.value = true;
  try {
    // 不含冷刪除；含「復原時保留」的已復原紀錄（僅供查閱）
    const result = await getCancelledPurchases(props.projectId, false, true);
    if (seq !== loadSeq) return; // 期間已切換戶別，丟棄舊結果
    if (result.status === 'success') {
      items.value = (result.data || []).filter(i => i.unitId === props.unitId);
    } else {
      items.value = [];
      toast.error(`載入退戶紀錄失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    if (seq !== loadSeq) return;
    console.error('載入退戶紀錄失敗:', error);
    items.value = [];
    toast.error('載入退戶紀錄失敗', { position: POSITION.BOTTOM_CENTER });
  } finally {
    if (seq === loadSeq) {
      isLoading.value = false;
      emit('count', items.value.length);
    }
  }
}

function openDetail(item) {
  detailDialog.docId = item.docId;
  detailDialog.show = true;
}

function onPatched(docId, patch) {
  const idx = items.value.findIndex(i => i.docId === docId);
  if (idx !== -1) Object.assign(items.value[idx], patch);
  // 本分頁不顯示冷刪除紀錄：標記刪除後自列表移除並關閉明細
  if (patch && patch.isDeleted === true) {
    detailDialog.show = false;
    items.value = items.value.filter(i => i.docId !== docId);
    emit('count', items.value.length);
  }
}

function onRemoved(docId) {
  detailDialog.show = false;
  items.value = items.value.filter(i => i.docId !== docId);
  emit('count', items.value.length);
}

function onRestored() {
  detailDialog.show = false;
  emit('restored');
}

watch(
  () => [props.show, props.projectId, props.unitId],
  ([show]) => {
    detailDialog.show = false;
    if (show) {
      loadData();
    } else {
      loadSeq++;
      items.value = [];
      isLoading.value = false;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.cancel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cancel-row {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.cancel-row:hover {
  background: #f5f7fb;
  border-color: #b8c4dc;
}

.cancel-row--restored {
  background: #f6fbf7;
}

.cancel-row__index {
  flex: 0 0 28px;
  height: 28px;
  border-radius: 50%;
  background: #fdecea;
  color: #c62828;
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cancel-row--restored .cancel-row__index {
  background: #e6f4ea;
  color: #2e7d32;
}

.cancel-row__body {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cancel-row__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.cancel-row__date {
  display: inline-flex;
  align-items: center;
  font-size: 0.8rem;
  color: #616161;
}

.cancel-row__buyer {
  font-weight: 700;
  font-size: 0.95rem;
}

.cancel-row__meta {
  font-size: 0.8rem;
  color: #757575;
  column-gap: 12px;
}

.cancel-row__chevron {
  flex: 0 0 auto;
}

/* 手機全螢幕明細：避開全站左上角固定漢堡鈕（約 40×40，z-index 高於 dialog） */
@media (max-width: 959.98px) {
  .cancel-detail-bar :deep(.v-toolbar__content) {
    padding-left: 52px;
  }
}
</style>
