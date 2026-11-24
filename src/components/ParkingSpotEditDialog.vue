<template>
  <v-dialog
    :model-value="modelValue"
    content-class="pse-dialog"
    width="94%"
    max-width="540"
    persistent
    scrollable
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <div class="pse">
      <header class="pse-head">
        <ParkingSpotHead
          :floor="editedItem.floor"
          :number="editedItem.number || editedItem.spotId"
          :status="editedItem.status_backend || ''"
          :tier-label="tierMeta.occupied ? tierMeta.label : ''"
          :tone="tone"
        />
        <button class="mac-sheet-close" aria-label="關閉" @click="close"><v-icon size="18">mdi-close</v-icon></button>
      </header>

      <!-- 區塊順序、欄位位置與資訊卡（ParkingSpotInfo）一致 -->
      <div class="pse-body psi">
        <section class="psi-section">
          <h4 class="psi-title">狀態</h4>
          <div class="psi-grid psi-grid--1">
            <div class="psi-cell">
              <span class="psi-label">後台狀態</span>
              <div class="pse-pills" role="radiogroup" aria-label="後台狀態">
                <button
                  v-for="o in statusOptions"
                  :key="o.value || 'unset'"
                  type="button"
                  role="radio"
                  class="pse-pill"
                  :class="{ 'is-active': o.active }"
                  :aria-checked="o.active"
                  :style="o.active ? { background: o.tone.solid, color: o.tone.onSolid } : undefined"
                  @click="editedItem.status_backend = o.value"
                >
                  <i :style="{ background: o.active ? 'currentColor' : o.tone.solid }"></i>{{ o.label }}
                </button>
              </div>
            </div>
            <div class="psi-cell">
              <span class="psi-label">報價系統狀態（自動）</span>
              <span class="psi-value" :class="{ 'is-empty': !editedItem.status }">{{ editedItem.status || '—' }}</span>
            </div>
          </div>
        </section>

        <!-- 保留資訊：只有「暫時保留」層級才需要 -->
        <section v-if="isHeldTier" class="psi-section">
          <h4 class="psi-title">
            保留資訊
            <span class="psi-badge" :class="`psi-badge--${deadline.tone}`">{{ deadline.label }}</span>
          </h4>
          <div class="psi-grid psi-grid--2 psi-grid--hold" :class="{ 'is-overdue': isOverdue }">
            <label class="psi-cell psi-cell--wide">
              <span class="psi-label">保留人／保留客戶</span>
              <v-text-field v-model="editedItem.reservedBy" v-bind="field" aria-label="保留人" />
            </label>
            <div class="psi-cell">
              <span class="psi-label">保留到期</span>
              <MacDateInput v-model="editedItem.reservedUntil" class="pse-date" aria-label="保留到期" />
            </div>
            <div class="psi-cell">
              <span class="psi-label">已保留</span>
              <span class="psi-value pse-readonly" :class="{ 'is-empty': !daysHeldText }">{{ daysHeldText || '—' }}</span>
            </div>
            <label class="psi-cell psi-cell--wide">
              <span class="psi-label">保留備註</span>
              <v-textarea v-model="editedItem.reservedNote" v-bind="field" rows="1" auto-grow aria-label="保留備註" />
            </label>
          </div>
        </section>

        <section class="psi-section">
          <h4 class="psi-title">價格資訊</h4>
          <div class="psi-prices">
            <label v-for="p in priceFields" :key="p.key" class="psi-price" :class="`psi-price--${p.tone}`">
              <span class="psi-label">{{ p.label }}</span>
              <v-text-field
                v-model.number="editedItem[p.key]"
                v-bind="field"
                class="mac-vfield pse-price-field"
                type="number"
                hide-spin-buttons
                suffix="萬"
                :aria-label="p.label"
                @wheel="blurOnWheel"
              />
            </label>
          </div>
        </section>

        <section class="psi-section">
          <h4 class="psi-title">備註</h4>
          <v-textarea v-model="editedItem.remarks" v-bind="field" class="mac-vfield pse-remark" rows="2" auto-grow aria-label="備註" />
        </section>

        <section class="psi-section">
          <h4 class="psi-title">銷控資訊</h4>
          <div class="psi-grid psi-grid--2">
            <label class="psi-cell">
              <span class="psi-label">購買戶別</span>
              <v-text-field v-model="editedItem.buyerUnitId" v-bind="field" class="mac-vfield pse-accent" aria-label="購買戶別" />
            </label>
            <label class="psi-cell">
              <span class="psi-label">買方姓名</span>
              <v-text-field v-model="editedItem.buyerName" v-bind="field" aria-label="買方姓名" />
            </label>
            <div class="psi-cell psi-cell--wide">
              <span class="psi-label">銷售人員</span>
              <v-select
                v-model="editedItemSalesperson"
                v-bind="field"
                :items="salespersonOptions"
                :menu-props="{ contentClass: 'mac-menu' }"
                :no-data-text="personnelLoading ? '載入中…' : '尚無銷售人員'"
                multiple
                placeholder="選擇"
                aria-label="銷售人員"
                class="mac-vfield pse-people"
              >
                <!-- 自訂標籤：Vuetify 內建 chips 會攔截點擊，點在人名上打不開選單 -->
                <template #selection="{ item }">
                  <span class="pse-person">
                    {{ item.title }}
                    <button type="button" :aria-label="`移除 ${item.title}`" @mousedown.stop.prevent @click.stop="removeSalesperson(item.title)"><v-icon size="14">mdi-close</v-icon></button>
                  </span>
                </template>
              </v-select>
            </div>
          </div>
        </section>

        <section class="psi-section">
          <h4 class="psi-title">基本資料</h4>
          <div class="psi-grid">
            <div class="psi-cell">
              <span class="psi-label">類型</span>
              <v-combobox v-model="editedItem.type" v-bind="field" :items="TYPE_OPTIONS" :menu-props="{ contentClass: 'mac-menu' }" aria-label="類型" />
            </div>
            <div class="psi-cell">
              <span class="psi-label">形式</span>
              <v-combobox v-model="editedItem.type2" v-bind="field" :items="TYPE2_OPTIONS" :menu-props="{ contentClass: 'mac-menu' }" aria-label="形式" />
            </div>
            <label class="psi-cell">
              <span class="psi-label">尺寸</span>
              <v-text-field v-model="editedItem.size" v-bind="field" aria-label="尺寸" />
            </label>
            <label v-for="a in areaFields" :key="a.key" class="psi-cell">
              <span class="psi-label">{{ a.label }}</span>
              <v-text-field
                v-model.number="editedItem[a.key]"
                v-bind="field"
                type="number"
                step="0.01"
                min="0"
                hide-spin-buttons
                :aria-label="a.label"
                @wheel="blurOnWheel"
              />
            </label>
            <div class="psi-cell">
              <span class="psi-label">樓層／編號</span>
              <span class="psi-value pse-readonly">{{ [editedItem.floor, editedItem.spotId || editedItem.number].filter(Boolean).join('／') || '—' }}</span>
            </div>
          </div>
        </section>
      </div>

      <footer class="pse-foot">
        <button class="mac-btn mac-btn--lg" :disabled="isSaving" @click="close">取消</button>
        <button class="mac-btn mac-btn--primary mac-btn--lg" :disabled="isSaving" @click="saveItem">{{ isSaving ? '儲存中…' : '儲存' }}</button>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { fetchSalesPersonnelList, updateParkingLot } from '@/api';
import { normalizeSalespersons } from '@/utils/salespersonUtils';
import { classifyCommitment, COMMITMENT_TIERS } from '@/utils/salesStatusGroups';
import { buildHeldEntry, todayKey, toDateKey, addDaysKey, DEFAULT_RESERVATION_DAYS } from '@/composables/useParkingRatio';
import { backendTone, holdDeadline } from '@/utils/parkingSpotCard';
import MacDateInput from '@/components/MacDateInput.vue';
import ParkingSpotHead from '@/components/ParkingSpotHead.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 車位完整資料，需含 Firestore 文件 ID（docId 或 id 擇一）
  parking: { type: Object, default: null },
  // 建案在銷控設定指定的確定度層級覆蓋表 { 狀態名稱: tier }
  tierOverrides: { type: Object, default: () => ({}) },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const isSaving = ref(false);
const editedItem = ref({});

// 已售＝確定售出（已簽約層級），與保留類分開
const BACKEND_STATUSES = ['小訂', '補足', '簽約', '已售', '保留', '主管保留', '來賓車位'];
const TYPE_OPTIONS = ['法定', '增設', '獎勵'];
const TYPE2_OPTIONS = ['坡道平面', '坡道機械', '升降平面', '升降機械', '機械平面', '機械升降', '塔式車位'];

const field = { variant: 'solo', flat: true, density: 'compact', hideDetails: true, class: 'mac-vfield' };
const priceFields = [
  { key: 'price_list', label: '表價', tone: 'list' },
  { key: 'price_floor', label: '底價', tone: 'floor' },
  { key: 'price_transaction', label: '成交價', tone: 'deal' },
];
const areaFields = [
  { key: 'area', label: '面積（m²）' },
  { key: 'area_ping', label: '面積（坪）' },
];

// 後台狀態按鈕；目前的值不在清單內（匯入的自訂狀態）時一併列出，避免看不到現況
const statusOptions = computed(() => {
  const current = editedItem.value?.status_backend || null;
  const values = [...BACKEND_STATUSES];
  if (current && !values.includes(current)) values.push(current);
  return [null, ...values].map((value) => ({
    value,
    label: value || '未設定',
    active: value === current,
    tone: backendTone(value, props.tierOverrides),
  }));
});

// 數字欄聚焦時捲動畫面會改到數值，先失焦
const blurOnWheel = (e) => e.target.blur();

// 銷售人員（複選）：相容舊單人字串與陣列
const editedItemSalesperson = computed({
  get: () => normalizeSalespersons(editedItem.value?.salesperson),
  set: (val) => {
    if (editedItem.value) editedItem.value.salesperson = normalizeSalespersons(val);
  }
});

// 選單名單：建案銷售人員（與戶別銷控表單同來源、同排序）；車位上已不在名單的人仍列出，避免看不到現況
const personnel = ref([]);
const personnelLoading = ref(false);
let personnelProjectId = '';
const loadPersonnel = async (projectId) => {
  if (projectId !== personnelProjectId) personnel.value = [];
  personnelProjectId = projectId;
  if (!projectId) return;
  personnelLoading.value = true;
  const res = await fetchSalesPersonnelList(projectId);
  if (projectId !== personnelProjectId) return;
  personnelLoading.value = false;
  if (res.status !== 'success') {
    toast.error('銷售人員名單載入失敗');
    return;
  }
  const orderOf = (p) => (p.order === undefined || p.order === null ? 999999 : Number(p.order));
  personnel.value = res.data.personnelList
    .filter((p) => p.name)
    .sort((x, y) => orderOf(x) - orderOf(y) || x.name.localeCompare(y.name, 'zh-Hant'));
};
const salespersonOptions = computed(() => [...new Set([
  ...personnel.value.map((p) => p.name),
  ...normalizeSalespersons(props.parking?.salesperson),
  ...editedItemSalesperson.value,
])]);

const removeSalesperson = (name) => {
  editedItemSalesperson.value = editedItemSalesperson.value.filter((n) => n !== name);
};

// 人員有變動才同步 salespersonUserKey（姓名對應名單電話）；已不在名單的人沿用原本的對應
const syncedUserKeys = () => {
  const names = editedItemSalesperson.value;
  const oldNames = normalizeSalespersons(props.parking?.salesperson);
  if (JSON.stringify(names) === JSON.stringify(oldNames)) return null;
  const oldKeys = normalizeSalespersons(props.parking?.salespersonUserKey);
  const oldKeyOf = (name) => (oldNames.length === oldKeys.length ? oldKeys[oldNames.indexOf(name)] : '');
  return names
    .map((name) => personnel.value.find((p) => p.name === name)?.phone || oldKeyOf(name))
    .filter(Boolean);
};

// 確定度層級
const tier = computed(() => classifyCommitment(editedItem.value?.status_backend, props.tierOverrides));
const tierMeta = computed(() => COMMITMENT_TIERS[tier.value] || COMMITMENT_TIERS.available);
const isHeldTier = computed(() => tier.value === 'held');
const tone = computed(() => backendTone(editedItem.value?.status_backend, props.tierOverrides));

// 保留到期
const deadline = computed(() => holdDeadline(editedItem.value?.reservedUntil));
const isOverdue = computed(() => {
  const key = toDateKey(editedItem.value?.reservedUntil);
  return isHeldTier.value && !!key && key < todayKey();
});
// 已保留天數：原本就在保留層級才有
const daysHeldText = computed(() => {
  const p = props.parking;
  if (!p || classifyCommitment(p.status_backend, props.tierOverrides) !== 'held') return '';
  const { daysHeld } = buildHeldEntry(p, 'held', todayKey());
  return daysHeld === null ? '' : `${daysHeld} 天`;
});

// 報價系統狀態一律由後台狀態決定：空白 → 空白、來賓車位 → 來賓車位、其餘 → 已售
// 打開、切換、儲存都重算，結果才不會因打開順序或資料庫原值而不同
const quoteStatusOf = (statusBackend) => {
  const s = String(statusBackend ?? '').trim();
  if (!s) return '';
  return s === '來賓車位' ? '來賓車位' : '已售';
};

watch(() => props.modelValue, (show) => {
  if (show) {
    const src = { ...(props.parking || {}) };
    // 到期日統一成 YYYY-MM-DD
    src.reservedUntil = toDateKey(src.reservedUntil);
    src.status = quoteStatusOf(src.status_backend);
    editedItem.value = src;
    loadPersonnel(src.projectId || '');
  }
});

watch(() => editedItem.value.status_backend, (newValue) => {
  if (!editedItem.value) return;
  editedItem.value.status = quoteStatusOf(newValue);
  // 切到暫時保留且尚未設到期日 → 預設今天 + N 天
  if (classifyCommitment(newValue, props.tierOverrides) === 'held' && !toDateKey(editedItem.value.reservedUntil)) {
    editedItem.value.reservedUntil = addDaysKey(DEFAULT_RESERVATION_DAYS);
  }
});

const close = () => {
  emit('update:modelValue', false);
};

const saveItem = async () => {
  isSaving.value = true;
  try {
    // docId 來自銷控管理表格 (listenToParkingLots)；id 來自車位圖資料 (getSalesParkingsByFloor)
    const { docId, id, ...dataToUpdate } = editedItem.value;
    const targetDocId = docId || id;
    if (!targetDocId) throw new Error('缺少車位文件 ID，無法更新。');

    if (isHeldTier.value) {
      dataToUpdate.reservedBy = dataToUpdate.reservedBy || null;
      dataToUpdate.reservedUntil = toDateKey(dataToUpdate.reservedUntil) || null;
      dataToUpdate.reservedNote = dataToUpdate.reservedNote || null;
      // 首次進入保留才記錄開始時間，之後編輯不覆蓋（已保留天數以此計算）
      if (!dataToUpdate.reservedAt) dataToUpdate.reservedAt = new Date();
    } else {
      // 離開保留層級：清掉保留資訊，避免舊資料殘留造成誤判
      dataToUpdate.reservedBy = null;
      dataToUpdate.reservedUntil = null;
      dataToUpdate.reservedNote = null;
      dataToUpdate.reservedAt = null;
    }

    dataToUpdate.status = quoteStatusOf(dataToUpdate.status_backend);

    const userKeys = syncedUserKeys();
    if (userKeys) dataToUpdate.salespersonUserKey = userKeys;

    dataToUpdate.updatedAt = new Date();
    await updateParkingLot(targetDocId, dataToUpdate);
    toast.success(`車位 ${editedItem.value.spotId} 的資料已更新`);
    emit('saved', { ...editedItem.value, ...dataToUpdate, docId, id });
    close();
  } catch (err) {
    toast.error(`更新失敗: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped src="../styles/parkingSpotCard.css"></style>
<style scoped>
/* 外框與資訊卡（ParkingCanvas .detail-modal-content）同尺寸 */
.pse {
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: inherit;
  overflow: hidden;
  border-radius: 14px;
  background: #fff;
  color: #1d1d1f;
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.12), 0 12px 32px rgba(0, 0, 0, 0.18), 0 2px 6px rgba(0, 0, 0, 0.08);
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}
.pse-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 auto;
  min-height: 52px;
  padding: 12px 12px 12px 18px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.pse-head .mac-sheet-close { flex: 0 0 auto; }
.pse-body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 16px 18px 2px; }
.pse-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  flex: 0 0 auto;
  padding: 12px 16px;
  background: #f6f6f8;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}
.pse-foot .mac-btn { min-width: 88px; }

/* 後台狀態：一鍵切換，顏色與資訊卡標題列相同 */
.psi-grid--1 { grid-template-columns: minmax(0, 1fr); }
.pse-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.pse-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 999px;
  background: #fff;
  color: #1d1d1f;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14);
  -webkit-tap-highlight-color: transparent;
}
.pse-pill i { width: 8px; height: 8px; border-radius: 50%; flex: 0 0 auto; }
.pse-pill.is-active { box-shadow: none; font-weight: 700; }
.pse-pill:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.5); outline-offset: 2px; }

/* 輸入框：字級字重比照資訊卡的數值 */
.psi-cell { gap: 4px; }
.psi-price { gap: 4px; padding: 9px 10px 10px; }
.pse-readonly { display: flex; align-items: center; min-height: 34px; }
.pse :deep(.mac-vfield .v-field) { font-size: 15.5px; font-weight: 600; }
.pse :deep(.mac-vfield .v-field__input) { min-width: 0; opacity: 1; }
.pse :deep(.mac-vfield .v-text-field__suffix) { padding: 0 10px 0 4px; opacity: 1; font-size: 13px; font-weight: 600; color: #6e6e73; min-height: 0; align-self: center; }
.pse :deep(.mac-vfield input::placeholder) { font-weight: 400; color: #a1a1a6; opacity: 1; }
.pse :deep(.pse-price-field .v-field) { font-size: 19px; font-weight: 700; }
.pse :deep(.psi-price--floor .v-field), .pse :deep(.psi-price--floor .v-text-field__suffix) { color: #b3231a; }
.pse :deep(.psi-price--deal .v-field), .pse :deep(.psi-price--deal .v-text-field__suffix) { color: #17692f; }
.pse :deep(.pse-accent .v-field) { color: #0058b0; font-weight: 700; }
.pse :deep(.pse-remark .v-field) { background: #fff6d6; border-radius: 10px; font-size: 15px; font-weight: 500; box-shadow: inset 3px 0 0 #e0a800, inset 0 0 0 1px rgba(150, 110, 0, 0.28); }
.pse :deep(.pse-remark .v-field--focused) { box-shadow: inset 3px 0 0 #e0a800, inset 0 0 0 1px #0071e3, 0 0 0 3px rgba(0, 113, 227, 0.22); }
.pse-person {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: 100%;
  padding: 2px 3px 2px 10px;
  border-radius: 999px;
  background: #e8eef7;
  color: #1d1d1f;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
  white-space: normal;
}
.pse-person button { display: inline-grid; place-content: center; flex: 0 0 auto; width: 22px; height: 22px; padding: 0; border: 0; border-radius: 50%; background: transparent; color: #6e6e73; cursor: pointer; }
.pse-person button:hover { background: rgba(0, 0, 0, 0.1); color: #1d1d1f; }
.pse :deep(.pse-people .v-field__input) { gap: 5px; padding-block: 4px; }
.pse :deep(.pse-people .v-select__selection) { max-width: 100%; margin: 0; }
.pse :deep(.v-combobox .v-field__append-inner) { padding-inline-start: 0; }
.psi-cell .pse-date { max-width: none; height: 34px; border-radius: 7px; font-size: 15.5px; font-weight: 600; }

@media (max-width: 600px) {
  .pse { border-radius: 12px; }
  .pse-body { padding: 12px 12px 2px; }
  .pse-foot { padding: 10px 12px; }
  .pse-foot .mac-btn { flex: 1 1 0; height: 42px; font-size: 16px; }
  .pse-pill { min-height: 38px; font-size: 15px; }
  .pse-readonly { min-height: 40px; }
  .pse :deep(.mac-vfield .v-field) { font-size: 16px; }
  .pse :deep(.pse-price-field .v-field) { --v-field-padding-start: 8px; --v-field-padding-end: 2px; font-size: 17px; }
  .pse :deep(.pse-price-field .v-text-field__suffix) { padding: 0 7px 0 0; font-size: 12px; }
  .psi-cell .pse-date { height: 40px; font-size: 16px; }
}
/* 極窄手機：輸入框改單欄，內容才看得全 */
@container (max-width: 290px) {
  .psi-grid, .psi-grid--2, .psi-prices { grid-template-columns: minmax(0, 1fr); }
}
</style>
<style>
.v-dialog > .v-overlay__content.pse-dialog { margin: 0; max-height: 92vh; max-height: 92dvh; }
@media (max-width: 600px) {
  .v-dialog > .v-overlay__content.pse-dialog { max-height: calc(100vh - 108px); max-height: calc(100dvh - 108px); }
}
</style>
