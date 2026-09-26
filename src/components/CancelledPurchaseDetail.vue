<template>
  <!-- 退戶紀錄明細 + 操作（復原／改原因／改日期／備註留言／冷刪除）：退戶記錄管理展開列與戶別資訊「退戶紀錄」共用 -->
  <div class="cancelled-detail">
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
            <tr><td class="label-cell">業務</td><td>{{ formatSalespersons(item.salesperson, '、', '—') }}</td></tr>
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
            <tr><td class="label-cell">房屋表價</td><td>{{ formatPrice(item.price_list_house_total) }} 萬</td></tr>
            <tr><td class="label-cell">房屋底價</td><td class="text-red font-weight-bold">{{ formatPrice(item.price_floor_house_total) }} 萬</td></tr>
            <tr><td class="label-cell">房屋成交價</td><td class="text-success font-weight-bold">{{ formatPrice(item.price_transaction_house) }} 萬</td></tr>
            <tr><td class="label-cell">配套金額</td><td>{{ formatPrice(item.price_package_deal) }} 萬</td></tr>
            <tr><td class="label-cell">成交總價</td><td class="text-success font-weight-bold text-h6">{{ formatPrice(calculateTotalTransactionPrice(item)) }} 萬</td></tr>
            <tr><td class="label-cell">溢差價</td><td class="font-weight-bold" :class="calculatePremiumPrice(item) >= 0 ? 'text-success' : 'text-red'">{{ formatPrice(calculatePremiumPrice(item)) }} 萬</td></tr>
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
            <th>底價</th>
            <th>成交價</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, idx) in item.parkingDetails" :key="idx">
            <td class="font-weight-bold">{{ p.spotId || '—' }}</td>
            <td>{{ p.floor || '—' }}</td>
            <td>{{ p.type || '—' }}</td>
            <td>{{ formatPrice(p.price_list) }} 萬</td>
            <td class="text-red">{{ formatPrice(p.price_floor) }} 萬</td>
            <td class="text-success font-weight-bold">{{ formatPrice(p.price_transaction) }} 萬</td>
          </tr>
        </tbody>
      </v-table>
    </template>

    <!-- 退戶日期 -->
    <v-divider class="my-3"></v-divider>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="section-title">
        <v-icon size="small" class="mr-1" color="warning">mdi-calendar</v-icon>
        退戶日期
      </div>
      <v-btn icon size="x-small" variant="text" @click="handleEditCancellationDate">
        <v-icon size="small">mdi-pencil</v-icon>
        <v-tooltip activator="parent">修改退戶日期</v-tooltip>
      </v-btn>
    </div>
    <div class="mb-4">
      <v-chip label color="info" variant="tonal" size="small" prepend-icon="mdi-calendar-outline">
        {{ formatCancelDateTime(item.cancellationDate) }}
      </v-chip>
    </div>

    <!-- 退戶原因 -->
    <v-divider class="my-3"></v-divider>
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="section-title">
        <v-icon size="small" class="mr-1" color="warning">mdi-information-outline</v-icon>
        退戶原因
      </div>
      <v-btn icon size="x-small" variant="text" @click="handleEditReasons">
        <v-icon size="small">mdi-pencil</v-icon>
        <v-tooltip activator="parent">修改退戶原因</v-tooltip>
      </v-btn>
    </div>
    <template v-if="item.cancelReasons && item.cancelReasons.length > 0">
      <div class="cancel-reasons-container">
        <v-chip v-for="(reason, idx) in item.cancelReasons" :key="idx" label size="medium" color="error" variant="tonal" class="mr-2 mb-2">
          {{ reason }}
        </v-chip>
      </div>
    </template>
    <template v-else>
      <div class="text-caption text-grey">
        <v-icon size="x-small" class="mr-1">mdi-information-outline</v-icon>
        本筆退戶記錄建立於新功能上線前，未記錄退戶原因
      </div>
    </template>

    <!-- 備註（留言式：免進編輯即可 CRUD，與銷控端共用元件） -->
    <v-divider class="my-3"></v-divider>
    <RemarkNotesPanel
      :notes="item.remarkNotes || []"
      :legacy-remarks="item.remarks || ''"
      :persist-handler="persistRemarkNotes"
      :storage-path-prefix="`cancelledPurchases/${projectId}/${item.docId}/remarkNotes`"
    />

    <!-- 文件 ID -->
    <v-divider class="my-3"></v-divider>
    <div class="d-flex align-center gap-2 mb-3">
      <span class="text-caption text-grey">文件 ID：</span>
      <code class="text-caption doc-id-code">{{ item.docId }}</code>
      <v-btn icon size="x-small" variant="text" @click="copyDocId" color="primary">
        <v-icon size="small">mdi-content-copy</v-icon>
        <v-tooltip activator="parent">複製 ID</v-tooltip>
      </v-btn>
    </div>

    <!-- 復原／冷刪除 -->
    <v-divider class="my-3"></v-divider>

    <v-alert v-if="item.isRestored" type="success" variant="tonal" density="compact" class="mb-3" icon="mdi-check-circle-outline">
      此筆退戶紀錄已由 <strong>{{ item.restoredBy || '—' }}</strong> 於 <strong>{{ formatCancelDateTime(item.restoredAt) }}</strong> 復原，
      戶別銷售資料已回寫至 【{{ item.unitId }}】。本紀錄僅保留供查閱，不計入退戶統計，也無法再次復原。
    </v-alert>

    <div class="d-flex align-center justify-space-between flex-wrap gap-2">
      <v-btn v-if="!item.isRestored" color="success" variant="flat" prepend-icon="mdi-restore" :loading="restoring" @click="handleRestore">
        復原此筆退戶
      </v-btn>
      <v-chip v-else color="success" size="small" variant="tonal" prepend-icon="mdi-check-circle-outline">
        已復原（僅供查閱）
      </v-chip>

      <v-btn v-if="!item.isDeleted" color="error" variant="outlined" prepend-icon="mdi-delete-outline" @click="handleSoftDelete">
        冷刪除
      </v-btn>

      <template v-else>
        <v-chip color="error" size="small" class="ml-auto">已標記刪除</v-chip>
        <v-btn color="success" variant="outlined" prepend-icon="mdi-undo" @click="handleUndoSoftDelete">
          復原冷刪除
        </v-btn>
        <v-btn color="error" variant="flat" prepend-icon="mdi-delete-forever" @click="handleHardDelete">
          永久刪除
        </v-btn>
      </template>
    </div>

    <!-- 復原確認 Dialog -->
    <v-dialog v-model="confirmDialog.show" max-width="560" persistent>
      <v-card>
        <v-card-title class="bg-success text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-restore</v-icon>
          確認復原退戶
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-1" v-html="confirmDialog.message"></p>

          <v-divider class="my-4"></v-divider>

          <p class="text-body-2 font-weight-bold mb-2">
            <v-icon size="small" class="mr-1" color="primary">mdi-file-document-outline</v-icon>
            本次退戶紀錄要如何處理？
          </p>
          <v-radio-group v-model="confirmDialog.keepRecord" hide-details density="comfortable" :disabled="confirmDialog.loading">
            <v-radio :value="true" color="success">
              <template #label>
                <div class="py-1">
                  <div class="font-weight-medium">保留退戶紀錄</div>
                  <div class="text-caption text-grey">紀錄會標記為「已復原」留在列表中供日後查閱，不再計入退戶統計，也無法再次復原。</div>
                </div>
              </template>
            </v-radio>
            <v-radio :value="false" color="error">
              <template #label>
                <div class="py-1">
                  <div class="font-weight-medium">連同退戶紀錄一併刪除</div>
                  <div class="text-caption text-grey">復原後這筆退戶紀錄（含退戶原因、備註留言）將永久從資料庫移除，無法找回。</div>
                </div>
              </template>
            </v-radio>
          </v-radio-group>

          <v-alert v-if="confirmDialog.keepRecord === false" type="warning" variant="tonal" density="compact" class="mt-3">
            <strong>注意：</strong>刪除後將無法再查閱此次退戶的原因與備註。
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="confirmDialog.show = false" :disabled="confirmDialog.loading">取消</v-btn>
          <v-btn :color="confirmDialog.keepRecord ? 'success' : 'error'" variant="flat" @click="executeRestore" :loading="confirmDialog.loading">
            {{ confirmDialog.keepRecord ? '復原並保留紀錄' : '復原並刪除紀錄' }}
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

    <!-- 修改退戶原因 Dialog -->
    <v-dialog v-model="editReasonsDialog.show" max-width="560" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-pencil</v-icon>
          修改退戶原因
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ item.unitId }}】</strong>
            買方：<strong>{{ item.buyerName || '—' }}</strong>
          </p>
          <p class="text-body-2 font-weight-bold mb-3">選擇退戶原因（可複選，亦可自行輸入）</p>
          <CancelReasonSelector v-model="editReasonsDialog.selectedReasons" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editReasonsDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="editReasonsDialog.loading" @click="executeUpdateReasons">確認修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 修改退戶日期 Dialog -->
    <v-dialog v-model="editDateDialog.show" max-width="480" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon left class="mr-2">mdi-calendar</v-icon>
          修改退戶日期
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-4">
            戶別：<strong>【{{ item.unitId }}】</strong>
            買方：<strong>{{ item.buyerName || '—' }}</strong>
          </p>
          <v-text-field v-model="editDateDialog.selectedDate" type="date" label="選擇退戶日期" variant="outlined" density="compact"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDateDialog.show = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="editDateDialog.loading" @click="executeUpdateDate">確認修改</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 冷刪除確認 Dialog -->
    <v-dialog v-model="softDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-error text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-delete-outline</v-icon>
          冷刪除退戶記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ item.unitId }}】</strong>
            買方：<strong>{{ item.buyerName || '—' }}</strong>
          </p>
          <v-alert type="warning" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
            此操作會將記錄標記為已刪除，但不會從資料庫移除。可隨時復原。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4 doc-id-block">{{ item.docId }}</code>
          <v-text-field v-model="softDeleteDialog.inputDocId" label="請輸入文件 ID 以確認刪除" variant="outlined" density="compact" hint="輸入正確的文件 ID 才能執行刪除" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="softDeleteDialog.show = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeSoftDelete" :loading="softDeleteDialog.loading" :disabled="softDeleteDialog.inputDocId !== item.docId">
            確認冷刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 復原冷刪除確認 Dialog -->
    <v-dialog v-model="undoSoftDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-success text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-undo</v-icon>
          復原冷刪除記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ item.unitId }}】</strong>
            買方：<strong>{{ item.buyerName || '—' }}</strong>
          </p>
          <v-alert type="info" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-information-outline</v-icon>
            確認復原此筆記錄的刪除標記。復原後將在正常列表中顯示。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4 doc-id-block">{{ item.docId }}</code>
          <v-text-field v-model="undoSoftDeleteDialog.inputDocId" label="請輸入文件 ID 以確認復原" variant="outlined" density="compact" hint="輸入正確的文件 ID 才能執行復原" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="undoSoftDeleteDialog.show = false">取消</v-btn>
          <v-btn color="success" variant="flat" @click="executeUndoSoftDelete" :loading="undoSoftDeleteDialog.loading" :disabled="undoSoftDeleteDialog.inputDocId !== item.docId">
            確認復原
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 永久刪除確認 Dialog -->
    <v-dialog v-model="hardDeleteDialog.show" max-width="500" persistent>
      <v-card>
        <v-card-title class="bg-error text-white d-flex align-center">
          <v-icon left color="white" class="mr-2">mdi-delete-forever</v-icon>
          永久刪除退戶記錄
        </v-card-title>
        <v-card-text class="py-4">
          <p class="text-body-2 text-grey mb-3">
            戶別：<strong>【{{ item.unitId }}】</strong>
            買方：<strong>{{ item.buyerName || '—' }}</strong>
          </p>
          <v-alert type="error" variant="tonal" density="compact" class="mb-4">
            <v-icon size="small" class="mr-1">mdi-alert-outline</v-icon>
            <strong>此操作無法還原！</strong>記錄將永久從資料庫刪除，無法復原。
          </v-alert>
          <p class="text-caption text-grey mb-2">文件 ID：</p>
          <code class="d-block mb-4 doc-id-block">{{ item.docId }}</code>
          <v-text-field v-model="hardDeleteDialog.inputDocId" label="請輸入文件 ID 以確認永久刪除" variant="outlined" density="compact" hint="輸入正確的文件 ID 才能執行永久刪除" />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="hardDeleteDialog.show = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="executeHardDelete" :loading="hardDeleteDialog.loading" :disabled="hardDeleteDialog.inputDocId !== item.docId">
            確認永久刪除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { restoreCancelledPurchase, updateCancelReason, updateCancellationDate, updateRemarks, softDeleteCancelledPurchase, undoSoftDeleteCancelledPurchase, hardDeleteCancelledPurchase } from '@/api';
import { useUserStore } from '@/store/user';
import { useToast, POSITION } from 'vue-toastification';
import { formatSalespersons } from '@/utils/salespersonUtils';
import RemarkNotesPanel from './RemarkNotesPanel.vue';
import CancelReasonSelector from './CancelReasonSelector.vue';
import { formatCancelDateTime, formatPrice, formatNum, calculateTotalTransactionPrice, calculatePremiumPrice } from '@/utils/cancelledPurchaseUtils';

const props = defineProps({
  item: { type: Object, required: true },
  projectId: { type: String, required: true },
});

// patched：(docId, patch) 局部欄位更新；removed：(docId) 已自資料庫移除；restored：(docId, keepRecord) 已回寫戶別銷售資料
const emit = defineEmits(['patched', 'removed', 'restored']);

const userStore = useUserStore();
const toast = useToast();
const operatorName = () => userStore.user?.name || '未知用戶';

const restoring = ref(false);

const confirmDialog = reactive({ show: false, message: '', loading: false, keepRecord: true });
const conflictDialog = reactive({ show: false, message: '', currentBuyerName: '', currentStatus: '' });
const editReasonsDialog = reactive({ show: false, loading: false, selectedReasons: [] });
const editDateDialog = reactive({ show: false, loading: false, selectedDate: '' });
const softDeleteDialog = reactive({ show: false, loading: false, inputDocId: '' });
const undoSoftDeleteDialog = reactive({ show: false, loading: false, inputDocId: '' });
const hardDeleteDialog = reactive({ show: false, loading: false, inputDocId: '' });

function handleRestore() {
  const item = props.item;
  if (item.isRestored) {
    toast.info('此筆退戶紀錄已復原過，僅供查閱，無法再次復原。', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  confirmDialog.keepRecord = true; // 每次開啟都回到預設「保留紀錄」
  const totalPrice = calculateTotalTransactionPrice(item);
  confirmDialog.message = `確定要將 <strong>【${item.unitId}】</strong> 的退戶資料復原嗎？<br><br>` +
    `買方：<strong>${item.buyerName || '—'}</strong><br>` +
    `銷售人員：<strong>${formatSalespersons(item.salesperson, '、', '—')}</strong><br>` +
    `成交總價：<strong>${formatPrice(totalPrice)} 萬</strong><br>` +
    `車位：<strong>${item.parkingCount || 0} 個</strong><br><br>` +
    `系統會將備份資料回寫至原始戶別，並恢復車位關聯。`;
  confirmDialog.show = true;
}

async function executeRestore() {
  const item = props.item;
  confirmDialog.loading = true;
  restoring.value = true;
  const name = operatorName();
  const keepRecord = confirmDialog.keepRecord === true;

  try {
    const result = await restoreCancelledPurchase(props.projectId, item.docId, name, keepRecord);

    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      confirmDialog.show = false;
      if (keepRecord) {
        // 保留紀錄：標記已復原並同步後端追加的系統留言
        emit('patched', item.docId, {
          isRestored: true,
          restoredBy: result.restoredBy || name,
          restoredAt: result.restoredAt || new Date(),
          remarkNotes: [
            ...(Array.isArray(item.remarkNotes) ? item.remarkNotes : []),
            {
              noteId: `system-restored-record-${Date.now()}`,
              type: 'system',
              category: 'general',
              content: '此筆退戶紀錄已復原（戶別銷售資料已回寫），紀錄保留供查閱',
              images: [],
              authorName: name,
              authorKey: '',
              createdAt: new Date(),
              updatedAt: null,
              pinned: false,
            },
          ],
        });
      } else {
        emit('removed', item.docId);
      }
      emit('restored', item.docId, keepRecord);
    } else if (result.status === 'already-restored') {
      // 後端判定此筆已復原過（例如其他人剛操作）：同步本地狀態並提示
      confirmDialog.show = false;
      emit('patched', item.docId, { isRestored: true, restoredBy: result.restoredBy || '', restoredAt: result.restoredAt || null });
      toast.warning(result.message, { position: POSITION.BOTTOM_CENTER });
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
    restoring.value = false;
  }
}

function handleEditReasons() {
  editReasonsDialog.selectedReasons = [...(props.item.cancelReasons || [])];
  editReasonsDialog.show = true;
}

async function executeUpdateReasons() {
  editReasonsDialog.loading = true;
  try {
    const result = await updateCancelReason(props.projectId, props.item.docId, editReasonsDialog.selectedReasons, operatorName());
    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      emit('patched', props.item.docId, { cancelReasons: [...editReasonsDialog.selectedReasons] });
      editReasonsDialog.show = false;
    } else {
      toast.error(`修改失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('修改退戶原因失敗:', error);
    toast.error(`修改失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    editReasonsDialog.loading = false;
  }
}

function handleEditCancellationDate() {
  const timestamp = props.item.cancellationDate;
  let date;
  if (timestamp?._seconds) {
    date = new Date(timestamp._seconds * 1000);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date();
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  editDateDialog.selectedDate = `${year}-${month}-${day}`;
  editDateDialog.show = true;
}

async function executeUpdateDate() {
  if (!editDateDialog.selectedDate) {
    toast.error('請選擇退戶日期', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  editDateDialog.loading = true;
  try {
    const result = await updateCancellationDate(props.projectId, props.item.docId, editDateDialog.selectedDate, operatorName());
    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      emit('patched', props.item.docId, { cancellationDate: result.cancellationDate });
      editDateDialog.show = false;
    } else {
      toast.error(`修改失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('修改退戶日期失敗:', error);
    toast.error(`修改失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    editDateDialog.loading = false;
  }
}

// 留言式 CRUD：經 updateRemarks CF 整包覆寫，成功後即時同步列表
async function persistRemarkNotes(newNotes) {
  const result = await updateRemarks(props.projectId, props.item.docId, null, operatorName(), newNotes);
  if (result.status !== 'success') {
    throw new Error(result.message || '更新失敗');
  }
  emit('patched', props.item.docId, { remarkNotes: newNotes, remarks: result.remarks || '' });
}

// ========== 冷刪除 ==========

function handleSoftDelete() {
  softDeleteDialog.inputDocId = '';
  softDeleteDialog.show = true;
}

async function executeSoftDelete() {
  if (softDeleteDialog.inputDocId !== props.item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  softDeleteDialog.loading = true;
  try {
    const result = await softDeleteCancelledPurchase(props.projectId, props.item.docId, operatorName());
    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      emit('patched', props.item.docId, { isDeleted: true, deletedBy: operatorName(), deletedAt: new Date() });
      softDeleteDialog.show = false;
    } else {
      toast.error(`冷刪除失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('冷刪除失敗:', error);
    toast.error(`冷刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    softDeleteDialog.loading = false;
  }
}

function handleUndoSoftDelete() {
  undoSoftDeleteDialog.inputDocId = '';
  undoSoftDeleteDialog.show = true;
}

async function executeUndoSoftDelete() {
  if (undoSoftDeleteDialog.inputDocId !== props.item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  undoSoftDeleteDialog.loading = true;
  try {
    const result = await undoSoftDeleteCancelledPurchase(props.projectId, props.item.docId, operatorName());
    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      emit('patched', props.item.docId, { isDeleted: false, deletedBy: '', deletedAt: null });
      undoSoftDeleteDialog.show = false;
    } else {
      toast.error(`復原失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('復原失敗:', error);
    toast.error(`復原失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    undoSoftDeleteDialog.loading = false;
  }
}

function handleHardDelete() {
  hardDeleteDialog.inputDocId = '';
  hardDeleteDialog.show = true;
}

async function executeHardDelete() {
  if (hardDeleteDialog.inputDocId !== props.item.docId) {
    toast.error('文件 ID 不符', { position: POSITION.BOTTOM_CENTER });
    return;
  }
  hardDeleteDialog.loading = true;
  try {
    const result = await hardDeleteCancelledPurchase(props.projectId, props.item.docId, operatorName());
    if (result.status === 'success') {
      toast.success(result.message, { position: POSITION.BOTTOM_CENTER });
      hardDeleteDialog.show = false;
      emit('removed', props.item.docId);
    } else {
      toast.error(`永久刪除失敗：${result.message}`, { position: POSITION.BOTTOM_CENTER });
    }
  } catch (error) {
    console.error('永久刪除失敗:', error);
    toast.error(`永久刪除失敗：${error.message}`, { position: POSITION.BOTTOM_CENTER });
  } finally {
    hardDeleteDialog.loading = false;
  }
}

function copyDocId() {
  navigator.clipboard.writeText(props.item.docId).then(() => {
    toast.success('文件 ID 已複製', { position: POSITION.BOTTOM_CENTER });
  }).catch(() => {
    toast.error('複製失敗', { position: POSITION.BOTTOM_CENTER });
  });
}
</script>

<style scoped>
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

.cancel-reasons-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
}

.doc-id-code {
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.doc-id-block {
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}
</style>
