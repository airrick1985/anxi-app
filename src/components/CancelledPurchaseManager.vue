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
          <v-alert type="info" variant="tonal" class="mb-4" density="compact">
            共 {{ items.length }} 筆退戶記錄
          </v-alert>

          <v-card
            v-for="item in items"
            :key="item.docId"
            variant="outlined"
            class="mb-3"
            :class="{ 'expanded-card': expandedDocId === item.docId }"
          >
            <!-- 摘要列 -->
            <v-card-item @click="toggleExpand(item.docId)" style="cursor: pointer;">
              <template v-slot:prepend>
                <v-avatar color="error" variant="tonal" size="40">
                  <v-icon>mdi-account-cancel</v-icon>
                </v-avatar>
              </template>
              <v-card-title class="text-body-1 font-weight-bold">
                {{ item.unitId }}
                <v-chip size="x-small" label color="error" variant="flat" class="ml-2">{{ item.salesStatus_backend || '退戶' }}</v-chip>
                <v-chip v-if="item.parkingCount > 0" size="x-small" label color="info" variant="tonal" class="ml-1">
                  車位 {{ item.parkingCount }}
                </v-chip>
              </v-card-title>
              <v-card-subtitle>
                {{ item.buyerName || '—' }} ｜ {{ item.salesperson || '—' }}
                <span v-if="item.price_transaction_house"> ｜ 成交 {{ formatPrice(item.price_transaction_house) }} 萬</span>
                <span v-if="item.area_house_ping"> ｜ {{ item.area_house_ping }} 坪</span>
              </v-card-subtitle>
              <template v-slot:append>
                <div class="text-right">
                  <div class="text-caption text-grey">{{ formatDate(item.cancellationDate) }}</div>
                  <div class="text-caption text-grey">操作人：{{ item.operatorName }}</div>
                </div>
                <v-icon class="ml-2">{{ expandedDocId === item.docId ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </template>
            </v-card-item>

            <!-- 展開詳情 -->
            <v-expand-transition>
              <div v-if="expandedDocId === item.docId">
                <v-divider></v-divider>
                <v-card-text class="pa-4">
                  <v-row dense>
                    <!-- 買方資訊 -->
                    <v-col cols="12" md="4">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="primary">mdi-account</v-icon>
                        買方資訊
                      </div>
                      <v-table density="compact" class="detail-table">
                        <tbody>
                          <tr><td class="label-cell">姓名</td><td class="font-weight-bold">{{ item.buyerName || '—' }}</td></tr>
                          <tr><td class="label-cell">電話</td><td>{{ item.buyerPhone || '—' }}</td></tr>
                          <tr><td class="label-cell">身分證</td><td>{{ item.buyerIdNumber || '—' }}</td></tr>
                          <tr><td class="label-cell">Email</td><td>{{ item.buyerEmail || '—' }}</td></tr>
                          <tr><td class="label-cell">業務</td><td>{{ item.salesperson || '—' }}</td></tr>
                          <tr><td class="label-cell">合約類型</td><td>{{ item.contractType || '—' }}</td></tr>
                        </tbody>
                      </v-table>
                    </v-col>

                    <!-- 面積資訊 -->
                    <v-col cols="12" md="4">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="teal">mdi-ruler-square</v-icon>
                        面積資訊
                      </div>
                      <v-table density="compact" class="detail-table">
                        <tbody>
                          <tr><td class="label-cell">權狀坪數</td><td class="font-weight-bold">{{ formatNum(item.area_house_ping) }} 坪</td></tr>
                          <tr><td class="label-cell">主建物</td><td>{{ formatNum(item.area_main_ping) }} 坪</td></tr>
                          <tr><td class="label-cell">附屬建物</td><td>{{ formatNum(item.area_ancillary_ping) }} 坪</td></tr>
                          <tr><td class="label-cell">公設</td><td>{{ formatNum(item.area_public_ping) }} 坪</td></tr>
                          <tr><td class="label-cell">露臺</td><td>{{ formatNum(item.area_terrace_ping) }} 坪</td></tr>
                        </tbody>
                      </v-table>
                    </v-col>

                    <!-- 價格資訊 -->
                    <v-col cols="12" md="4">
                      <div class="section-title">
                        <v-icon size="small" class="mr-1" color="warning">mdi-currency-usd</v-icon>
                        價格資訊
                      </div>
                      <v-table density="compact" class="detail-table">
                        <tbody>
                          <tr><td class="label-cell">表價總價</td><td>{{ formatPrice(item.price_list_house_total) }} 萬</td></tr>
                          <tr><td class="label-cell">底價總價</td><td class="text-red font-weight-bold">{{ formatPrice(item.price_floor_house_total) }} 萬</td></tr>
                          <tr><td class="label-cell">成交總價</td><td class="text-success font-weight-bold">{{ formatPrice(item.price_transaction_house) }} 萬</td></tr>
                          <tr><td class="label-cell">配套金額</td><td>{{ formatPrice(item.price_package_deal) }} 萬</td></tr>
                          <tr v-if="item.payment_deposit_amount"><td class="label-cell">小訂金額</td><td>{{ formatPrice(item.payment_deposit_amount) }} 萬</td></tr>
                          <tr v-if="item.payment_contract_amount"><td class="label-cell">簽約金額</td><td>{{ formatPrice(item.payment_contract_amount) }} 萬</td></tr>
                        </tbody>
                      </v-table>
                    </v-col>
                  </v-row>

                  <!-- 車位資訊 -->
                  <template v-if="item.parkingDetails && item.parkingDetails.length > 0">
                    <v-divider class="my-3"></v-divider>
                    <div class="section-title">
                      <v-icon size="small" class="mr-1" color="indigo">mdi-car</v-icon>
                      車位資訊（{{ item.parkingDetails.length }} 個）
                    </div>
                    <v-table density="compact" class="detail-table">
                      <thead>
                        <tr>
                          <th>車位編號</th>
                          <th>樓層</th>
                          <th>類型</th>
                          <th>表價</th>
                          <th>成交價</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(p, idx) in item.parkingDetails" :key="idx">
                          <td class="font-weight-bold">{{ p.spotId || '—' }}</td>
                          <td>{{ p.floor || '—' }}</td>
                          <td>{{ p.type || '—' }}</td>
                          <td>{{ formatPrice(p.price_list) }} 萬</td>
                          <td class="text-success font-weight-bold">{{ formatPrice(p.price_transaction) }} 萬</td>
                        </tr>
                      </tbody>
                    </v-table>
                  </template>

                  <!-- 持有車位 -->
                  <template v-if="item['持有車位'] && item['持有車位'].length > 0">
                    <div class="mt-2 text-caption text-grey">
                      持有車位：{{ item['持有車位'].map(p => p['車位編號'] || p.spotId || p).join('、') }}
                    </div>
                  </template>

                  <!-- 退戶資訊 & 復原 -->
                  <v-divider class="my-3"></v-divider>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text-caption text-grey">
                      退戶日期：{{ formatDate(item.cancellationDate) }} ｜
                      操作人員：{{ item.operatorName }} ｜
                      原始文檔：{{ item.originalDocId }}
                    </div>
                    <v-btn
                      color="success"
                      variant="flat"
                      prepend-icon="mdi-restore"
                      :loading="restoringDocId === item.docId"
                      @click="handleRestore(item)"
                    >
                      復原此筆退戶
                    </v-btn>
                  </div>
                </v-card-text>
              </div>
            </v-expand-transition>
          </v-card>
        </template>
      </v-card-text>
    </v-card>

    <!-- 復原確認 Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-success text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-restore</v-icon>
          確認復原退戶
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-1" v-html="confirmDialog.message"></p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false">取消</v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="executeRestore"
            :loading="confirmDialog.loading"
          >
            確認復原
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 衝突提示 Dialog -->
    <v-dialog v-model="conflictDialog.show" max-width="500">
      <v-card>
        <v-card-title class="bg-warning text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-alert</v-icon>
          無法復原
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-1">{{ conflictDialog.message }}</p>
          <v-alert type="warning" variant="tonal" class="mt-3" density="compact">
            目前買方：<strong>{{ conflictDialog.currentBuyerName || '—' }}</strong><br>
            目前狀態：<strong>{{ conflictDialog.currentStatus || '—' }}</strong>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="flat" color="primary" @click="conflictDialog.show = false">瞭解</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { getCancelledPurchases, restoreCancelledPurchase } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast, POSITION } from 'vue-toastification';

const props = defineProps({
  show: { type: Boolean, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['update:show', 'data-updated']);

const userStore = useUserStore();
const toast = useToast();

const isLoading = ref(false);
const items = ref([]);
const expandedDocId = ref(null);
const restoringDocId = ref(null);

const confirmDialog = reactive({
  show: false,
  message: '',
  loading: false,
  targetItem: null,
});

const conflictDialog = reactive({
  show: false,
  message: '',
  currentBuyerName: '',
  currentStatus: '',
});

async function loadData() {
  isLoading.value = true;
  try {
    const result = await getCancelledPurchases(props.projectId);
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

function toggleExpand(docId) {
  expandedDocId.value = expandedDocId.value === docId ? null : docId;
}

function formatDate(timestamp) {
  if (!timestamp) return '—';
  if (timestamp._seconds) {
    const date = new Date(timestamp._seconds * 1000);
    return date.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  if (timestamp instanceof Date) {
    return timestamp.toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
  }
  return String(timestamp);
}

function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString();
}

function formatNum(val) {
  if (val === null || val === undefined || val === '') return '—';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function handleRestore(item) {
  confirmDialog.targetItem = item;
  confirmDialog.message = `確定要將 <strong>【${item.unitId}】</strong> 的退戶資料復原嗎？<br><br>` +
    `買方：<strong>${item.buyerName || '—'}</strong><br>` +
    `成交價：<strong>${formatPrice(item.price_transaction_house)} 萬</strong><br>` +
    `車位：<strong>${item.parkingCount} 個</strong><br><br>` +
    `系統會將備份資料回寫至原始戶別，並恢復車位關聯。`;
  confirmDialog.show = true;
}

async function executeRestore() {
  const item = confirmDialog.targetItem;
  if (!item) return;

  confirmDialog.loading = true;
  restoringDocId.value = item.docId;

  try {
    const result = await restoreCancelledPurchase(
      props.projectId,
      item.docId,
      userStore.user?.name || '未知用戶'
    );

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      confirmDialog.show = false;
      items.value = items.value.filter(i => i.docId !== item.docId);
      expandedDocId.value = null;
      emit('data-updated');
    } else if (result.status === 'conflict') {
      confirmDialog.show = false;
      conflictDialog.message = result.message;
      conflictDialog.currentBuyerName = result.currentBuyerName;
      conflictDialog.currentStatus = result.currentStatus;
      conflictDialog.show = true;
    } else {
      toast.error(`復原失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('復原退戶資料失敗:', error);
    toast.error(`復原失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    confirmDialog.loading = false;
    restoringDocId.value = null;
  }
}

watch(() => props.show, (newVal) => {
  if (newVal) {
    loadData();
  } else {
    expandedDocId.value = null;
    items.value = [];
  }
});
</script>

<style scoped>
.expanded-card {
  border-color: rgb(var(--v-theme-primary)) !important;
  border-width: 2px !important;
}

.section-title {
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
}

.detail-table {
  background-color: #fafafa;
  border-radius: 8px;
}

.detail-table td,
.detail-table th {
  padding: 4px 12px !important;
  font-size: 0.8125rem;
}

.label-cell {
  color: #757575;
  white-space: nowrap;
  width: 90px;
}
</style>
