<template>
  <div class="land-data-editor">
    <div class="d-flex align-center mb-3">
      <div class="text-subtitle-1 font-weight-bold flex-grow-1">土地資料 ({{ rows.length }} 筆)</div>
    </div>

    <v-alert type="info" variant="tonal" density="compact" class="mb-3" icon="mdi-information-outline">
      此處資料自動帶入該戶的「土地標的清冊」。如需新增土地筆數，請至戶別詳細資訊編輯。
    </v-alert>

    <v-card v-for="(row, idx) in rows" :key="idx" variant="outlined" class="mb-3">
      <v-card-title class="d-flex align-center py-2">
        <v-chip size="small" color="primary" variant="flat" class="mr-2">#{{ idx + 1 }}</v-chip>
        <span class="text-subtitle-2">{{ rowTitle(row) }}</span>
        <v-spacer />
        <v-btn icon="mdi-arrow-up" size="x-small" variant="text" :disabled="idx === 0" @click="move(idx, -1)" />
        <v-btn icon="mdi-arrow-down" size="x-small" variant="text" :disabled="idx === rows.length - 1" @click="move(idx, 1)" />
        <v-btn icon="mdi-delete" color="error" size="x-small" variant="text" @click="removeRow(idx)" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <!-- 縣市 / 區域 / 地段 三層連動 -->
        <div class="field-group-label">標的座落</div>
        <v-row dense class="mt-1">
          <v-col cols="12" sm="4" md="3">
            <v-select
              :model-value="row.land_x45"
              :items="cityOptions" item-title="name" item-value="code"
              label="縣市 (land_x45)"
              hide-details variant="outlined" density="compact" clearable
              @update:model-value="onCityChange(idx, $event)" />
          </v-col>
          <v-col cols="12" sm="4" md="3">
            <v-select
              :model-value="row.land_x46"
              :items="townsOf(idx)" item-title="name" item-value="code"
              label="區域 (land_x46)"
              :disabled="!row.land_x45"
              hide-details variant="outlined" density="compact" clearable
              @update:model-value="onTownChange(idx, $event)" />
          </v-col>
          <v-col cols="12" sm="4" md="6">
            <v-autocomplete
              :model-value="row.land_x48"
              :items="sectionItemsFor(idx)"
              item-title="section" item-value="sectCode"
              :custom-filter="sectionFilter"
              label="段小段 (land_x48)"
              :disabled="!row.land_x46"
              :loading="rowStates[idx]?.loading"
              :hint="sectionHint(idx, row)"
              :error-messages="rowStates[idx]?.error ? [`載入失敗：${rowStates[idx].error}`] : []"
              persistent-hint variant="outlined" density="compact" clearable
              @update:model-value="onSectionChange(idx, $event)">
              <template #item="{ props: itemProps, item }">
                <v-list-item v-bind="itemProps"
                  :title="item.raw.section"
                  :subtitle="`${item.raw.sectCode} · ${item.raw.officeName}地所`" />
              </template>
              <template #append-inner>
                <v-btn icon="mdi-refresh" size="x-small" variant="text" density="compact"
                  :disabled="!row.land_x46 || rowStates[idx]?.loading"
                  title="重新抓取段清單"
                  @click.stop="reloadSections(idx)" />
              </template>
              <template #no-data>
                <v-list-item v-if="!row.land_x46" title="請先選擇縣市與區域" />
                <v-list-item v-else-if="rowStates[idx]?.loading" title="載入中…" />
                <v-list-item v-else title="查無段小段資料" />
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>

        <!-- 權利範圍：分子/分母合併為單一列顯示 -->
        <v-row dense class="mt-2" align="center">
          <v-col cols="12" sm="6" md="4">
            <div class="field-group-label">權利範圍</div>
            <div class="d-flex align-center ga-2 mt-1">
              <v-text-field
                v-model="row.land_rightDeno"
                type="number" min="0"
                placeholder="分子"
                hide-details variant="outlined" density="compact"
                style="max-width: 140px;" />
              <span class="fraction-divider">/</span>
              <v-text-field
                v-model="row.land_rightNume"
                type="number" min="0"
                placeholder="分母"
                hide-details variant="outlined" density="compact"
                style="max-width: 140px;" />
              <span v-if="rightPercent(row)" class="text-caption text-grey ml-2">
                ≈ {{ rightPercent(row) }}
              </span>
            </div>
          </v-col>
        </v-row>

        <!-- 其餘欄位（地號、面積、土地使用分區等） -->
        <v-row dense class="mt-2">
          <v-col v-for="f in genericFields" :key="f.key" cols="12" sm="6" md="4">
            <v-select
              v-if="f.type === 'select'"
              :model-value="row[f.key]"
              :items="f.options" item-title="label" item-value="value"
              :label="f.label"
              :hint="f.key"
              persistent-hint
              variant="outlined"
              density="compact"
              clearable
              @update:model-value="onGenericSelectChange(idx, f, $event)" />
            <v-text-field
              v-else
              v-model="row[f.key]"
              :label="f.label"
              :hint="f.key"
              :type="f.type === 'number' ? 'number' : 'text'"
              persistent-hint
              variant="outlined"
              density="compact"
              clearable />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-alert v-if="rows.length === 0" type="warning" variant="tonal" density="compact">
      此戶尚無土地標的清冊資料，請先至戶別詳細資訊的「土地標的清冊」新增土地後再匯出。
    </v-alert>
  </div>
</template>

<script setup>
import { ref, watch, reactive } from 'vue';
import { LAND_DATA_SCHEMA, buildEmptyLandRow } from '@/constants/realPriceReportSchema';
// buildEmptyLandRow 仍在 modelValue watcher 中使用（為上游既有欄位補齊缺項）
import { CITIES, getTownsByCity, getCityName, getTownName } from '@/constants/landOfficeCodeTable';
import { fetchLandSections, getCachedLandSections, clearLandSectionsCache } from '@/composables/useLandSections';

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue']);

const rows = ref([]);

// 每列的段清單狀態: { [idx]: { sections, loading, error } }
const rowStates = reactive({});
// 保留那些來自舊資料、但段清單裡找不到的既存代碼，讓 v-autocomplete 仍能顯示
// { [idx]: [{ sectCode, section, officeName }] }
const rowFallbacks = reactive({});

const cityOptions = CITIES;

// 由 cascade 專管的欄位，從通用欄位清單中剔除
const CASCADE_KEYS = new Set(['land_x45', 'land_x45c', 'land_x46', 'land_x46c', 'land_x48', 'land_x48c']);
// 隱藏欄位：僅作為匯出 JSON 用的代碼，由 autoMapLandDataFromUnit 自動填入（land_rightc 映射 land_right；land_useText 映射 land_use）
const HIDDEN_KEYS = new Set(['land_right', 'land_use']);
// 自訂排版的欄位：權利範圍分子/分母以「權利範圍：分子/分母」單列呈現
const CUSTOM_LAYOUT_KEYS = new Set(['land_rightDeno', 'land_rightNume']);
const genericFields = LAND_DATA_SCHEMA.filter(f =>
  !CASCADE_KEYS.has(f.key) && !HIDDEN_KEYS.has(f.key) && !CUSTOM_LAYOUT_KEYS.has(f.key)
);

// 權利範圍百分比：LAND_DATA_SCHEMA 的 Deno/Nume 命名與 label (分子/分母) 相反，此處依 label 計算
function rightPercent(row) {
  const num = Number(row?.land_rightDeno);
  const den = Number(row?.land_rightNume);
  if (!den || Number.isNaN(num) || Number.isNaN(den)) return '';
  return `${((num / den) * 100).toFixed(2)}%`;
}

// --- 打破 modelValue ↔ rows 的反應式迴圈 ---
// 本元件自己 emit 出去後，父層會把新陣列回拋到 modelValue，若不過濾會無限重建 rows。
let syncingFromSelf = false;

watch(() => props.modelValue, (val) => {
  if (syncingFromSelf) { syncingFromSelf = false; return; }
  rows.value = Array.isArray(val) ? val.map(r => ({ ...buildEmptyLandRow(), ...(r || {}) })) : [];
  // 對已有 x45+x46 的列預載段清單（走快取同步路徑，不會造成 loading 閃爍）
  rows.value.forEach((r, i) => {
    if (r.land_x45 && r.land_x46) loadSectionsForRow(i);
  });
}, { immediate: true });  // deep:true 沒必要：父層 v-model 觸發時都是整個陣列換掉

watch(rows, (val) => {
  syncingFromSelf = true;
  emit('update:modelValue', val.map(r => ({ ...r })));
}, { deep: true });

function rowTitle(row) {
  const name = row.land_x48c || row.land_x46c || row.land_x45c || '土地';
  return `${name}${row.land_no ? ' ' + row.land_no : ''}`;
}

function townsOf(idx) {
  const x45 = rows.value[idx]?.land_x45;
  return x45 ? getTownsByCity(x45) : [];
}

// v-autocomplete 的 items：段清單 + 既存 fallback
function sectionItemsFor(idx) {
  const list = rowStates[idx]?.sections || [];
  const fb = rowFallbacks[idx] || [];
  // 合併且以 sectCode 去重 (以 API 資料為主)
  if (fb.length === 0) return list;
  const seen = new Set(list.map(s => s.sectCode));
  return [...list, ...fb.filter(s => !seen.has(s.sectCode))];
}

// autocomplete 自訂過濾：以段名、段代碼、地所名任一匹配
function sectionFilter(value, query, item) {
  if (!query) return true;
  const q = String(query).toLowerCase();
  const raw = item?.raw || {};
  return String(raw.section || '').toLowerCase().includes(q)
    || String(raw.sectCode || '').toLowerCase().includes(q)
    || String(raw.officeName || '').toLowerCase().includes(q);
}

function sectionHint(idx, row) {
  if (!row.land_x46) return 'land_x48';
  const items = sectionItemsFor(idx);
  if (rowStates[idx]?.loading) return '載入段清單中…';
  if (items.length > 0) return `${items.length} 筆段小段可選 · land_x48`;
  return 'land_x48';
}

// 段清單載入後的補救：
//   A) 只有段名沒有段代碼 → 以名稱反查代碼並回寫 row.land_x48，讓 v-autocomplete 能正確顯示
//   B) 只有段代碼沒有段名 → 以代碼反查名稱並回寫 row.land_x48c
//   C) 代碼存在但不在段清單中 → 建立 fallback 項目讓 autocomplete 仍能顯示原值
function applyFallback(idx, row, list) {
  // A) name-only → 反查 code
  if (!row.land_x48 && row.land_x48c) {
    const match = list.find(s => s.section === row.land_x48c);
    if (match) {
      const next = { ...row, land_x48: match.sectCode };
      rows.value[idx] = next;
      rowFallbacks[idx] = [];
      return;
    }
  }
  // B) code-only → 反查 name
  if (row.land_x48 && !row.land_x48c) {
    const match = list.find(s => s.sectCode === row.land_x48);
    if (match) {
      const next = { ...row, land_x48c: match.section };
      rows.value[idx] = next;
      rowFallbacks[idx] = [];
      return;
    }
  }
  // C) code 在清單中找不到 → 建立 fallback 項目
  if (row.land_x48 && !list.some(s => s.sectCode === row.land_x48)) {
    rowFallbacks[idx] = [{
      sectCode: row.land_x48,
      section: row.land_x48c || `(未知段代碼 ${row.land_x48})`,
      officeName: '',
    }];
  } else {
    rowFallbacks[idx] = [];
  }
}

async function loadSectionsForRow(idx) {
  const row = rows.value[idx];
  if (!row || !row.land_x45 || !row.land_x46) {
    rowStates[idx] = { sections: [], loading: false, error: null, loadedKey: '' };
    return;
  }
  const key = `${row.land_x45}${row.land_x46}`;

  // 去重：同列相同 (縣市,鄉鎮) 已載過就跳過，避免 modelValue 重建時重覆執行
  if (rowStates[idx]?.loadedKey === key) return;

  // 同步快取命中：立即寫入，不觸發 loading state
  const cached = getCachedLandSections(row.land_x45, row.land_x46);
  if (cached) {
    rowStates[idx] = { sections: cached, loading: false, error: null, loadedKey: key };
    applyFallback(idx, row, cached);
    return;
  }

  rowStates[idx] = { sections: [], loading: true, error: null, loadedKey: key };
  try {
    const list = await fetchLandSections(row.land_x45, row.land_x46);
    // 在 await 期間使用者可能已改選了不同縣市/鄉鎮 → 若 key 變了就丟棄
    const nowKey = `${rows.value[idx]?.land_x45 || ''}${rows.value[idx]?.land_x46 || ''}`;
    if (nowKey !== key) return;
    rowStates[idx] = { sections: list, loading: false, error: null, loadedKey: key };
    applyFallback(idx, rows.value[idx], list);
  } catch (e) {
    rowStates[idx] = { sections: [], loading: false, error: e.message || String(e), loadedKey: '' };
  }
}

function reloadSections(idx) {
  const row = rows.value[idx];
  if (!row?.land_x45 || !row?.land_x46) return;
  clearLandSectionsCache(row.land_x45, row.land_x46);
  // 清 loadedKey 才會重新走一次流程
  if (rowStates[idx]) rowStates[idx].loadedKey = '';
  loadSectionsForRow(idx);
}

function onCityChange(idx, code) {
  const r = { ...rows.value[idx] };
  r.land_x45 = code || '';
  r.land_x45c = code ? getCityName(code) : '';
  // 換縣市 → 清空下層連動
  r.land_x46 = '';
  r.land_x46c = '';
  r.land_x48 = '';
  r.land_x48c = '';
  rows.value[idx] = r;
  rowStates[idx] = { sections: [], loading: false, error: null, loadedKey: '' };
  rowFallbacks[idx] = [];
}

function onTownChange(idx, code) {
  const r = { ...rows.value[idx] };
  const x45 = r.land_x45;
  r.land_x46 = code || '';
  r.land_x46c = code ? getTownName(x45, code) : '';
  // 換區域 → 清空段
  r.land_x48 = '';
  r.land_x48c = '';
  rows.value[idx] = r;
  rowFallbacks[idx] = [];
  loadSectionsForRow(idx);
}

// 通用 select 欄位變動：同步對應的代號欄位 (e.g. land_usec 選取後寫入 land_use)
function onGenericSelectChange(idx, field, value) {
  const r = { ...rows.value[idx] };
  r[field.key] = value || '';
  if (field.codeKey) {
    const opt = (field.options || []).find(o => o.value === value);
    r[field.codeKey] = (opt && opt.code !== undefined) ? opt.code : '';
  }
  rows.value[idx] = r;
}

function onSectionChange(idx, sectCode) {
  const r = { ...rows.value[idx] };
  r.land_x48 = sectCode || '';
  if (sectCode) {
    const items = sectionItemsFor(idx);
    const hit = items.find(s => s.sectCode === sectCode);
    r.land_x48c = hit?.section || r.land_x48c || '';
  } else {
    r.land_x48c = '';
  }
  rows.value[idx] = r;
}

function removeRow(i) {
  rows.value.splice(i, 1);
  delete rowStates[i];
  delete rowFallbacks[i];
}
function move(i, dir) {
  const j = i + dir;
  if (j < 0 || j >= rows.value.length) return;
  const arr = rows.value.slice();
  [arr[i], arr[j]] = [arr[j], arr[i]];
  rows.value = arr;
  // 交換對應狀態
  const tmpS = rowStates[i]; rowStates[i] = rowStates[j]; rowStates[j] = tmpS;
  const tmpF = rowFallbacks[i]; rowFallbacks[i] = rowFallbacks[j]; rowFallbacks[j] = tmpF;
}
</script>

<style scoped>
.field-group-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 2px;
}
.fraction-divider {
  font-size: 1.25rem;
  font-weight: 600;
  color: #555;
  user-select: none;
}
</style>
