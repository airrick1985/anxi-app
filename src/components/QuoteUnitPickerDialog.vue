<template>
  <v-dialog
    :model-value="modelValue"
    max-width="720"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center bg-primary text-white">
        <v-icon start>mdi-home-search</v-icon>
        選擇戶別（最多 5 戶）
      </v-card-title>

      <v-card-text class="pt-4" style="min-height: 220px;">
        <div v-if="!units || units.length === 0" class="text-center py-8 text-grey">
          <v-icon size="48" color="grey-lighten-1">mdi-alert-circle-outline</v-icon>
          <p class="mt-3">無法載入戶別資料，請返回重試。</p>
        </div>

        <template v-else>
          <div
            v-for="(row, idx) in rows"
            :key="row.key"
            class="d-flex align-center mb-3"
            style="gap: 12px;"
          >
            <span class="text-body-2 text-grey-darken-1" style="min-width: 48px;">
              第 {{ idx + 1 }} 戶
            </span>

            <!-- 第一層：棟別 -->
            <v-select
              v-model="row.building"
              :items="buildingOptions"
              label="棟別"
              variant="outlined"
              density="comfortable"
              hide-details
              style="max-width: 180px;"
              @update:model-value="onBuildingChange(row)"
            ></v-select>

            <!-- 第二層：戶別（選棟別後出現） -->
            <!-- 不綁 :key（避免解鎖時重建導致選單收回）；
                 unitOptionsFor 內讀 unlocked.value → 解鎖後選單就地更新、保持展開 -->
            <v-select
              v-model="row.unitId"
              :items="unitOptionsFor(row.building)"
              item-title="title"
              item-value="value"
              :item-props="(i) => ({ disabled: i.disabled })"
              label="戶別"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              :disabled="!row.building"
              class="flex-grow-1"
            >
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps" class="unit-opt">
                  <template #title>
                    <div class="unit-opt-line">
                      <span class="unit-opt-id">{{ item.raw.unitId }}</span>
                      <v-chip
                        v-if="item.raw.sold"
                        size="x-small"
                        color="red"
                        variant="flat"
                        class="unit-opt-sold"
                      >已售</v-chip>
                      <span class="unit-opt-spacer"></span>
                      <span class="unit-opt-meta">{{ item.raw.ping }} 坪</span>
                      <span
                        v-if="!item.raw.sold"
                        class="unit-opt-meta unit-opt-price"
                      >{{ item.raw.total.toLocaleString() }} 萬</span>
                    </div>
                  </template>
                </v-list-item>
              </template>
              <template #selection="{ item }">
                <span class="unit-opt-selection">
                  <strong>{{ item.raw.unitId }}</strong>
                  <span class="unit-opt-sel-meta">
                    {{ item.raw.ping }} 坪<template v-if="!item.raw.sold"> · {{ item.raw.total.toLocaleString() }} 萬</template>
                  </span>
                  <span v-if="item.raw.sold" class="unit-opt-sel-sold">（已售）</span>
                </span>
              </template>
            </v-select>

            <v-btn
              icon="mdi-close"
              variant="text"
              color="grey"
              size="small"
              @click="removeRow(idx)"
            ></v-btn>
          </div>

          <v-btn
            color="primary"
            variant="tonal"
            prepend-icon="mdi-plus"
            :disabled="rows.length >= MAX_ROWS"
            @click="addRow"
          >
            {{ rows.length === 0 ? '新增戶別' : '繼續新增戶別' }}
          </v-btn>
          <span
            v-if="rows.length >= MAX_ROWS"
            class="text-caption text-grey ml-3"
          >已達上限（最多 5 戶）</span>
        </template>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="onCancel">取消</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          :disabled="selectedCount === 0"
          @click="onConfirm"
        >
          確認（已選 {{ selectedCount }} 戶）
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useToast, POSITION } from 'vue-toastification';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 戶別清單：salesDataStore.getProjectData().households（Firestore salesHouseholds）
  units: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const toast = useToast();

const MAX_ROWS = 5;
const UNLOCK_CODE = 'aaaaaaaa';
const NO_BUILDING = '未分棟';

const rows = ref([]);
const unlocked = ref(false);
let keyBuffer = '';

// 已售判定：對齊 UnitDetailModal / SalesControlSystem 的 quote 模式狀態
const isSold = (u) => u?.salesStatus_quote === '已售';
const buildingOf = (u) => u?.building || NO_BUILDING;

const naturalCompare = (a, b) =>
  String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

// 第一層：棟別清單（去重 + 自然排序，與 SalesControlSystem 一致）
const buildingOptions = computed(() => {
  const set = new Set((props.units || []).map(buildingOf));
  return Array.from(set).sort(naturalCompare);
});

// 第二層：依棟別過濾戶別，已售者 disabled（未解鎖時）
function unitOptionsFor(building) {
  if (!building) return [];
  return (props.units || [])
    .filter((u) => buildingOf(u) === building)
    .sort((a, b) => naturalCompare(a.unitId, b.unitId))
    .map((u) => {
      const sold = isSold(u);
      const ping = Number(u.area_house_ping) || 0;
      const total = Number(u.price_list_house_total) || 0;
      return {
        // 後備純文字（未套用 #item / #selection slot 時）；已售不顯示房屋總價
        title: sold
          ? `${u.unitId}　${ping} 坪（已售）`
          : `${u.unitId}　${ping} 坪　${total.toLocaleString()} 萬`,
        value: u.unitId,
        unitId: u.unitId,
        ping,
        total,
        sold,
        disabled: sold && !unlocked.value,
        raw: u,
      };
    });
}

const selectedCount = computed(
  () => rows.value.filter((r) => r.unitId).length
);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function addRow() {
  if (rows.value.length >= MAX_ROWS) return;
  rows.value.push({ key: uid(), building: null, unitId: null });
}

function removeRow(idx) {
  rows.value.splice(idx, 1);
}

// 棟別變更 → 清空該列已選戶別
function onBuildingChange(row) {
  row.unitId = null;
}

// 將戶別物件轉成 quoteStore.addItem 所需結構
// （完全對齊 UnitDetailModal.vue handleAddToQuote 的欄位映射）
function toUnitData(u) {
  return {
    ...u,
    房屋總表價: u.price_list_house_total,
    戶別: u.unitId,
    area_house_ping: Number(u.area_house_ping),
    area_main_ping: u.area_main_ping,
    area_ancillary_ping: u.area_ancillary_ping,
    area_common_ping: u.area_common_ping,
    area_terrace_ping: u.area_terrace_ping,
    common_area_ratio: u.common_area_ratio,
    area_main_sqm: u.area_main_sqm,
    area_ancillary_sqm: u.area_ancillary_sqm,
    area_common_sqm: u.area_common_sqm,
  };
}

function onConfirm() {
  const result = [];
  for (const r of rows.value) {
    if (!r.unitId) continue;
    const u = (props.units || []).find(
      (x) => x.unitId === r.unitId && buildingOf(x) === r.building
    );
    if (u) result.push(toUnitData(u));
  }
  if (result.length === 0) return;
  emit('confirm', result);
  emit('update:modelValue', false);
}

function onCancel() {
  emit('cancel');
  emit('update:modelValue', false);
}

// 將輸入字元正規化為半形小寫：
// 支援半形/全形、大小寫（aaaaaaaa / AAAAAAAA / ａａａａａａａａ / ＡＡＡＡＡＡＡＡ 皆可解鎖）。
// 全形 ASCII 區（U+FF01–U+FF5E）對應半形為 code - 0xFEE0。
function normalizeChar(ch) {
  const code = ch.charCodeAt(0);
  const half = (code >= 0xff01 && code <= 0xff5e)
    ? String.fromCharCode(code - 0xfee0)
    : ch;
  return half.toLowerCase();
}

// --- 解鎖碼：只要彈窗開著，無論棟別/戶別選單是否展開都能觸發 ---
// 關鍵：v-select 開啟選單時，其 typeahead/導覽只攔截 keydown，幾乎不碰 keyup。
//  - keydown：只負責「擋住」typeahead（preventDefault + 停止傳播），不做偵測
//  - keyup ：負責偵測解鎖碼（選單開啟時 keydown 可能被 Vuetify 吃掉，keyup 不會）
function onKeydownBlock(e) {
  if (typeof e.key !== 'string' || e.key.length !== 1) return;
  // 任何字元鍵一律攔截，不讓 v-select 收到（避免 typeahead 跳選）
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') {
    e.stopImmediatePropagation();
  }
}

function onKeyupDetect(e) {
  if (typeof e.key !== 'string' || e.key.length !== 1) return;
  keyBuffer = (keyBuffer + normalizeChar(e.key)).slice(-UNLOCK_CODE.length);
  if (keyBuffer === UNLOCK_CODE) {
    keyBuffer = '';
    if (!unlocked.value) {
      unlocked.value = true;
      toast.success('已解鎖', {
        position: POSITION.BOTTOM_CENTER,
        timeout: 1500,
      });
    }
  }
}

function attachListener() {
  // keydown：window+document capture 擋 typeahead（已用 stopImmediatePropagation 去重）
  // keyup ：僅 window capture 偵測解鎖（capture 根節點必觸發，且不重複計數）
  window.removeEventListener('keydown', onKeydownBlock, true);
  document.removeEventListener('keydown', onKeydownBlock, true);
  window.removeEventListener('keyup', onKeyupDetect, true);
  window.addEventListener('keydown', onKeydownBlock, true);
  document.addEventListener('keydown', onKeydownBlock, true);
  window.addEventListener('keyup', onKeyupDetect, true);
}
function detachListener() {
  window.removeEventListener('keydown', onKeydownBlock, true);
  document.removeEventListener('keydown', onKeydownBlock, true);
  window.removeEventListener('keyup', onKeyupDetect, true);
  keyBuffer = '';
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) {
      // 每次開啟重置狀態：預設帶入第 1 筆待選 row（使用者少按一次「新增戶別」）
      rows.value = [{ key: uid(), building: null, unitId: null }];
      unlocked.value = false;
      keyBuffer = '';
      attachListener();
      // 修正 BUG：開啟時不讓游標停留在任何選單，避免按鍵被選單吃掉
      nextTick(() => {
        if (document.activeElement && document.activeElement.blur) {
          document.activeElement.blur();
        }
      });
    } else {
      detachListener();
    }
  },
  { immediate: true }
);

onBeforeUnmount(detachListener);
</script>

<style scoped>
.unit-opt {
  min-height: 44px;
}

.unit-opt-line {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.unit-opt-id {
  font-weight: 700;
  font-size: 0.98rem;
  color: #263238;
}

.unit-opt-sold {
  font-weight: 700;
}

.unit-opt-spacer {
  flex: 1 1 auto;
}

.unit-opt-meta {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 0.82rem;
  color: #607d8b;
  white-space: nowrap;
}

.unit-opt-price {
  min-width: 6.5em;
  justify-content: flex-end;
  color: #1976d2;
  font-weight: 600;
}

.unit-opt-selection {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  overflow: hidden;
}

.unit-opt-selection strong {
  font-size: 0.98rem;
  color: #263238;
}

.unit-opt-sel-meta {
  font-size: 0.8rem;
  color: #607d8b;
}

.unit-opt-sel-sold {
  font-size: 0.8rem;
  color: #c62828;
  font-weight: 700;
}
</style>
