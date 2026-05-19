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
            ></v-select>

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
      return {
        title: sold ? `${u.unitId}（已售）` : u.unitId,
        value: u.unitId,
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

// --- 解鎖碼：彈窗開啟時於畫面輸入 aaaaaaaa ---
// 改用 capture 階段監聽，且「不」略過選單焦點：
// 因本彈窗無自由文字輸入框（皆為 v-select），即使游標停在選單上，
// 連續輸入 aaaaaaaa 仍可被偵測並解鎖（修正先前卡在選單篩選的 BUG）。
function onKeydown(e) {
  // 只處理單一字元按鍵（a–z、數字、符號、全形字…即 typeahead 觸發鍵）
  if (typeof e.key !== 'string' || e.key.length !== 1) return;

  // 彈窗開啟期間，任何字元鍵一律攔截，完全不讓 v-select 收到 →
  // 解決「輸入 a 選單會依序往下選取」；也讓背景輸入解鎖碼不影響選單。
  e.preventDefault();
  e.stopPropagation();
  if (typeof e.stopImmediatePropagation === 'function') {
    e.stopImmediatePropagation();
  }

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
  window.removeEventListener('keydown', onKeydown, true);
  window.addEventListener('keydown', onKeydown, true);
}
function detachListener() {
  window.removeEventListener('keydown', onKeydown, true);
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
