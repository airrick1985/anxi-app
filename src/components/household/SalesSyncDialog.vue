<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="single ? 560 : 880"
    scrollable
    :persistent="applying"
    content-class="mac-dialog-fit"
    @update:model-value="v => { if (!v) close(); }"
  >
    <v-card class="mac-sheet iss" :class="{ 'is-single': single }">
      <div class="mac-sheet-head">
        <v-icon size="18">mdi-database-sync-outline</v-icon>
        <span class="iss-title">同步銷控資料</span>
        <span v-if="single" class="iss-last">{{ unitId }}</span>
        <span v-else-if="lastSyncText" class="iss-last">上次 {{ lastSyncText }}</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" :disabled="applying" @click="close">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="iss-main">
      <!-- 比對範圍：欄位與選項，切換後立即套用到下方清單 -->
      <div v-if="preview && !single" class="iss-controls">
        <div class="iss-stats">
          <span class="iss-stat"><b>{{ preview.counts.sales }}</b>銷控戶別</span>
          <v-icon size="14" class="iss-stat-arrow">mdi-arrow-right</v-icon>
          <span class="iss-stat"><b>{{ preview.counts.inspection }}</b>驗屋戶別</span>
          <button
            v-if="unmatchedUnits.length"
            type="button"
            class="mac-tag mac-tag--orange iss-unmatched"
            :aria-expanded="showUnmatched"
            @click="showUnmatched = !showUnmatched"
          >
            未對應 {{ unmatchedCount }} 戶
            <v-icon size="13">{{ showUnmatched ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
          </button>
        </div>
        <div v-if="showUnmatched && unmatchedUnits.length" class="iss-unmatched-list">{{ unmatchedUnits.join('、') }}</div>

        <div class="iss-chips" role="group" aria-label="同步欄位">
          <button
            v-for="f in preview.fields"
            :key="f.key"
            type="button"
            role="checkbox"
            class="iss-chip"
            :class="{ 'is-on': enabledFields.has(f.key) }"
            :aria-checked="enabledFields.has(f.key)"
            @click="toggleField(f.key)"
          >
            <v-icon size="14" class="iss-chip-check">mdi-check</v-icon>
            <span>{{ f.label }}</span>
            <span v-if="fieldCounts[f.key]" class="iss-chip-count">{{ fieldCounts[f.key] }}</span>
          </button>
        </div>

        <div class="iss-options">
          <label class="iss-option" :class="{ 'is-disabled': !preview.additions.length }">
            <input v-model="includeAdditions" type="checkbox" class="mac-check" :disabled="!preview.additions.length">
            <span>新增戶別</span>
            <span class="iss-option-count">{{ preview.additions.length }}</span>
          </label>
          <label class="iss-option" :class="{ 'is-disabled': !clearUnitCount }">
            <input v-model="includeClears" type="checkbox" class="mac-check" :disabled="!clearUnitCount">
            <span>清空已無買方的戶別</span>
            <span class="iss-option-count">{{ clearUnitCount }}</span>
          </label>
        </div>
      </div>

      <div class="mac-form iss-body">
        <div v-if="loading && !preview" class="iss-state">
          <v-progress-circular indeterminate size="26" width="3" color="#0071e3" />
          <span>比對中…</span>
        </div>

        <div v-else-if="loadError && !preview" class="iss-state">
          <div class="mac-callout mac-callout--error"><v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ loadError }}</span></div>
          <button type="button" class="mac-btn" @click="load">重試</button>
        </div>

        <template v-else-if="preview">
          <div v-if="resultText" class="mac-callout iss-result" :class="{ 'mac-callout--warning': resultWarning }">
            <v-icon size="16">{{ resultWarning ? 'mdi-alert-outline' : 'mdi-check-circle-outline' }}</v-icon>
            <span>{{ resultText }}</span>
          </div>
          <div v-if="loadError" class="mac-callout mac-callout--error iss-result">
            <v-icon size="16">mdi-alert-circle-outline</v-icon><span>{{ loadError }}</span>
          </div>

          <div v-if="!activeUnits.length && !activeAdditions.length" class="iss-state">
            <v-icon v-if="emptyState.ok" size="34" color="#34c759">mdi-check-circle-outline</v-icon>
            <v-icon v-else size="34" color="#8e8e93">mdi-database-off-outline</v-icon>
            <span>{{ emptyState.text }}</span>
          </div>

          <template v-else>
            <div v-if="!single" class="iss-listbar">
              <label class="iss-all">
                <input
                  type="checkbox"
                  class="mac-check"
                  :checked="shownState === 'all'"
                  :indeterminate.prop="shownState === 'some'"
                  :disabled="!shownTotal"
                  @change="setShownSelected($event.target.checked)"
                >
                <span>全選</span>
              </label>
              <span class="iss-selected">已選 {{ selectedUnitCount }}／{{ activeUnits.length + activeAdditions.length }} 戶</span>
              <v-text-field
                v-model="search"
                variant="solo"
                flat
                density="compact"
                hide-details
                clearable
                placeholder="搜尋戶別"
                prepend-inner-icon="mdi-magnify"
                class="mac-vfield mac-vfield--search iss-search"
              />
            </div>

            <div v-if="!shownTotal" class="iss-state iss-state--sm"><span>找不到符合的戶別</span></div>

            <!-- 更新：每戶一組，列出各欄位「驗屋目前值 → 銷控值」 -->
            <template v-if="shownUnits.length">
              <div v-if="!single" class="mac-form-label">
                <span>更新 {{ shownUnits.length }} 戶</span>
              </div>
              <div v-for="unit in visibleUnits" :key="unit.key" class="mac-form-group iss-unit">
                <label class="iss-unit-head">
                  <input
                    type="checkbox"
                    class="mac-check"
                    :checked="unitState(unit) === 'all'"
                    :indeterminate.prop="unitState(unit) === 'some'"
                    @change="setUnitSelected(unit, $event.target.checked)"
                  >
                  <span class="iss-unit-id">{{ single ? '全選' : unit.unitId }}</span>
                  <span v-if="unit.salesUnitId !== unit.unitId" class="iss-unit-alias">銷控 {{ unit.salesUnitId }}</span>
                </label>
                <label v-for="d in unit.diffs" :key="d.field" class="iss-diff" :class="{ 'is-off': !isSelected(diffId(unit, d)) }">
                  <input
                    type="checkbox"
                    class="mac-check"
                    :checked="isSelected(diffId(unit, d))"
                    @change="setSelected(diffId(unit, d), $event.target.checked)"
                  >
                  <span class="iss-diff-label">{{ fieldLabel(d.field) }}</span>
                  <span class="iss-diff-values">
                    <span class="iss-before" :class="{ 'is-empty': !d.before }">{{ d.before || '空白' }}</span>
                    <v-icon size="14" class="iss-arrow">mdi-arrow-right</v-icon>
                    <span v-if="d.clear" class="mac-tag mac-tag--red">清空</span>
                    <span v-else class="iss-after">{{ d.after }}</span>
                  </span>
                </label>
              </div>
              <div v-if="shownUnits.length > visibleUnits.length" class="iss-more">
                <button type="button" class="mac-link-btn" @click="unitLimit += PAGE_SIZE">顯示其餘 {{ shownUnits.length - visibleUnits.length }} 戶</button>
              </div>
            </template>

            <!-- 新增：銷控有、驗屋沒有的戶別 -->
            <template v-if="shownAdditions.length">
              <div class="mac-form-label">
                <span>新增 {{ shownAdditions.length }} 戶</span>
              </div>
              <div class="mac-form-group">
                <label v-for="a in visibleAdditions" :key="a.key" class="iss-add" :class="{ 'is-off': !isSelected(addId(a)) }">
                  <input
                    type="checkbox"
                    class="mac-check"
                    :checked="isSelected(addId(a))"
                    @change="setSelected(addId(a), $event.target.checked)"
                  >
                  <span class="iss-unit-id">{{ a.unitId }}</span>
                  <span class="iss-add-summary">
                    <span v-for="part in additionParts(a)" :key="part" class="iss-add-part">{{ part }}</span>
                    <span v-if="!additionParts(a).length" class="iss-add-part">只建立戶別</span>
                  </span>
                </label>
              </div>
              <div v-if="shownAdditions.length > visibleAdditions.length" class="iss-more">
                <button type="button" class="mac-link-btn" @click="addLimit += PAGE_SIZE">顯示其餘 {{ shownAdditions.length - visibleAdditions.length }} 戶</button>
              </div>
            </template>
          </template>
        </template>
      </div>
      </div>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" :disabled="loading || applying" @click="load">
          <v-icon size="15" :class="{ 'iss-spin': loading && !!preview }">mdi-refresh</v-icon><span>重新比對</span>
        </button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :disabled="applying" @click="close">關閉</button>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="!selectedCount || loading || applying" @click="apply">
          <v-progress-circular v-if="applying" indeterminate size="13" width="2" color="#fff" />
          <span>{{ applying ? '同步中…' : `同步 ${selectedCount} ${single ? '項' : '戶'}` }}</span>
        </button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
// 戶別資料總表：手動同步銷控戶別資料。開啟時向後端取得差異，使用者勾選後才寫入驗屋戶別；銷控資料不會被改動。
// 帶入 unitKey（households 文件 ID）時為單戶模式：只列該戶的差異，逐項勾選（戶別整合資訊使用）。
import { computed, reactive, ref, watch } from 'vue';
import { format } from 'date-fns';
import { syncInspectionFromSales } from '@/api';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  userKey: { type: String, default: '' },
  unitKey: { type: String, default: '' },
  unitId: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'notify']);

const single = computed(() => !!props.unitKey);

const PAGE_SIZE = 150;
const FIELD_PREF_KEY = 'inspectionSalesSync.offFields.v1';
// 身分證(驗證碼)是客戶預約時的驗證碼，預設不同步，需要時自行勾選
const DEFAULT_OFF_FIELDS = ['buyerIdNumber'];

const preview = ref(null);
const loading = ref(false);
const loadError = ref('');
const applying = ref(false);
const resultText = ref('');
const resultWarning = ref(false);

const enabledFields = ref(new Set());
const includeAdditions = ref(true);
const includeClears = ref(false);
const excluded = reactive(new Set());
const search = ref('');
const showUnmatched = ref(false);
const unitLimit = ref(PAGE_SIZE);
const addLimit = ref(PAGE_SIZE);

const readOffFields = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(FIELD_PREF_KEY));
    return Array.isArray(saved) ? saved : DEFAULT_OFF_FIELDS;
  } catch {
    return DEFAULT_OFF_FIELDS;
  }
};
const saveOffFields = () => {
  if (!preview.value) return;
  const off = preview.value.fields.map(f => f.key).filter(key => !enabledFields.value.has(key));
  try { localStorage.setItem(FIELD_PREF_KEY, JSON.stringify(off)); } catch { /* 無法儲存偏好不影響使用 */ }
};

const fieldLabels = computed(() => Object.fromEntries((preview.value?.fields || []).map(f => [f.key, f.label])));
const fieldLabel = (key) => fieldLabels.value[key] || key;

const toggleField = (key) => {
  const next = new Set(enabledFields.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  enabledFields.value = next;
  saveOffFields();
};

// ───────── 清單 ─────────

const isActiveDiff = d => enabledFields.value.has(d.field) && (includeClears.value || !d.clear);

// 單戶模式列出該戶全部差異（含清空、預設不同步的欄位），由勾選決定
const singleUnit = computed(() => (preview.value?.units || []).find(u => u.key === props.unitKey) || null);
const activeUnits = computed(() => {
  if (single.value) return singleUnit.value ? [singleUnit.value] : [];
  return (preview.value?.units || [])
    .map(u => ({ ...u, diffs: u.diffs.filter(isActiveDiff) }))
    .filter(u => u.diffs.length);
});
const activeAdditions = computed(() => (!single.value && includeAdditions.value ? (preview.value?.additions || []) : []));
const hasAnyDifference = computed(() => !!(preview.value?.units.length || preview.value?.additions.length));

const emptyState = computed(() => {
  if (!preview.value) return { ok: false, text: '' };
  const { counts, inspectionOnly } = preview.value;
  if (!counts.sales) return { ok: false, text: '此建案沒有銷控戶別' };
  if (single.value) {
    const unmatched = !counts.matched || inspectionOnly.includes(props.unitId);
    return unmatched ? { ok: false, text: '銷控找不到此戶別' } : { ok: true, text: '沒有需要同步的資料' };
  }
  return { ok: true, text: hasAnyDifference.value ? '所選欄位沒有差異' : '驗屋與銷控資料一致' };
});

// 欄位標籤上的數字：該欄位有幾戶要更新（含已開啟的清空）
const fieldCounts = computed(() => {
  const counts = {};
  for (const u of preview.value?.units || []) {
    for (const d of u.diffs) {
      if (d.clear && !includeClears.value) continue;
      counts[d.field] = (counts[d.field] || 0) + 1;
    }
  }
  return counts;
});
const clearUnitCount = computed(() => (preview.value?.units || [])
  .filter(u => u.diffs.some(d => d.clear && enabledFields.value.has(d.field))).length);

const unmatchedUnits = computed(() => [...(preview.value?.inspectionOnly || []), ...(preview.value?.blocked || [])]);
const unmatchedCount = computed(() => Math.max(
  unmatchedUnits.value.length,
  (preview.value?.counts.inspectionOnly || 0) + (preview.value?.blocked?.length || 0),
));

const keyword = computed(() => String(search.value || '').trim().toLowerCase());
const matchesKeyword = (...values) => !keyword.value || values.some(v => String(v || '').toLowerCase().includes(keyword.value));
const shownUnits = computed(() => activeUnits.value.filter(u => matchesKeyword(u.unitId, u.salesUnitId)));
const shownAdditions = computed(() => activeAdditions.value.filter(a => matchesKeyword(a.unitId)));
const shownTotal = computed(() => shownUnits.value.length + shownAdditions.value.length);
const visibleUnits = computed(() => shownUnits.value.slice(0, unitLimit.value));
const visibleAdditions = computed(() => shownAdditions.value.slice(0, addLimit.value));

watch([keyword, enabledFields, includeClears, includeAdditions], () => {
  unitLimit.value = PAGE_SIZE;
  addLimit.value = PAGE_SIZE;
});

// 新增戶別會帶入的資料（依上方勾選的欄位）
const additionParts = a => a.values.filter(v => enabledFields.value.has(v.field)).map(v => `${fieldLabel(v.field)} ${v.after}`);

// ───────── 勾選（預設全選，記錄取消勾選的項目） ─────────

const diffId = (unit, d) => `${unit.key}|${d.field}`;
const addId = a => `+${a.key}`;
const isSelected = id => !excluded.has(id);
const setSelected = (id, on) => {
  if (on) excluded.delete(id);
  else excluded.add(id);
};

const stateOf = (ids) => {
  const selected = ids.filter(isSelected).length;
  if (selected === 0) return 'none';
  return selected === ids.length ? 'all' : 'some';
};
const unitState = unit => stateOf(unit.diffs.map(d => diffId(unit, d)));
const setUnitSelected = (unit, on) => unit.diffs.forEach(d => setSelected(diffId(unit, d), on));

const shownIds = computed(() => [
  ...shownUnits.value.flatMap(u => u.diffs.map(d => diffId(u, d))),
  ...shownAdditions.value.map(addId),
]);
const shownState = computed(() => stateOf(shownIds.value));
const setShownSelected = on => shownIds.value.forEach(id => setSelected(id, on));

const selectedChanges = computed(() => activeUnits.value.flatMap(u => u.diffs
  .filter(d => isSelected(diffId(u, d)))
  .map(d => ({ key: u.key, field: d.field, rev: d.rev }))));
const selectedAdditions = computed(() => activeAdditions.value.filter(a => isSelected(addId(a))).map(a => a.key));
const selectedUnitCount = computed(() => new Set(selectedChanges.value.map(c => c.key)).size + selectedAdditions.value.length);
const selectedCount = computed(() => (single.value ? selectedChanges.value.length : selectedUnitCount.value));

// ───────── 載入／套用 ─────────

const lastSyncText = computed(() => {
  const last = preview.value?.lastSync;
  if (!last?.at) return '';
  return [format(new Date(last.at), 'M/d HH:mm'), last.operatorName].filter(Boolean).join(' ');
});

const errorMessage = (error) => String(error?.message || '發生未知錯誤').replace(/^(internal|permission-denied|invalid-argument)[:：]\s*/i, '');

const load = async () => {
  if (loading.value) return;
  loading.value = true;
  loadError.value = '';
  try {
    const res = await syncInspectionFromSales({ action: 'preview', projectId: props.projectId, userKey: props.userKey });
    const first = !preview.value;
    preview.value = res;
    if (first) {
      const off = new Set(readOffFields());
      enabledFields.value = new Set(res.fields.map(f => f.key).filter(key => !off.has(key)));
      // 單戶模式：清空與預設不同步的欄位先不勾
      if (singleUnit.value) {
        singleUnit.value.diffs
          .filter(d => d.clear || off.has(d.field))
          .forEach(d => setSelected(diffId(singleUnit.value, d), false));
      }
    }
  } catch (error) {
    loadError.value = `比對失敗：${errorMessage(error)}`;
  } finally {
    loading.value = false;
  }
};

const apply = async () => {
  if (applying.value || !selectedCount.value) return;
  applying.value = true;
  resultText.value = '';
  loadError.value = '';
  try {
    const res = await syncInspectionFromSales({
      action: 'apply',
      projectId: props.projectId,
      userKey: props.userKey,
      changes: selectedChanges.value,
      additions: selectedAdditions.value,
      addFields: [...enabledFields.value],
    });
    const parts = [];
    if (single.value) {
      if (res.updatedFields) parts.push(`同步 ${props.unitId} 共 ${res.updatedFields} 項`);
    } else if (res.updatedUnits) parts.push(`更新 ${res.updatedUnits} 戶`);
    if (res.addedUnits) parts.push(`新增 ${res.addedUnits} 戶`);
    let text = parts.length ? `已${parts.join('、')}` : '沒有資料被更新';
    if (res.staleCount) text += `；${res.staleCount} 項資料已變動，未同步`;
    resultText.value = text;
    resultWarning.value = !!res.staleCount || !parts.length;
    emit('notify', text, resultWarning.value ? 'warning' : 'success');
  } catch (error) {
    loadError.value = `同步失敗：${errorMessage(error)}`;
    applying.value = false;
    return;
  }
  applying.value = false;
  // 單戶全部同步成功就關閉，直接看整合資訊上的新資料
  if (single.value && !resultWarning.value) {
    close();
    return;
  }
  await load();
};

const close = () => {
  if (applying.value) return;
  emit('update:modelValue', false);
};

watch(() => props.modelValue, (open) => {
  if (!open) return;
  // 每次開啟都重新比對，不沿用上次的勾選
  preview.value = null;
  resultText.value = '';
  search.value = '';
  showUnmatched.value = false;
  includeAdditions.value = true;
  includeClears.value = false;
  excluded.clear();
  load();
}, { immediate: true });
</script>

<style scoped>
.iss { display: flex; flex-direction: column; }
.iss-title { white-space: nowrap; }
.iss-last { min-width: 0; font-size: 12px; font-weight: 400; color: #6e6e73; overflow-wrap: anywhere; }

.iss-main { flex: 1 1 auto; min-height: 0; display: flex; flex-direction: column; }
.iss-controls {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.iss-stats { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 8px; font-size: 12.5px; color: #6e6e73; }
.iss-stat { display: inline-flex; align-items: baseline; gap: 4px; white-space: nowrap; }
.iss-stat b { font-size: 17px; font-weight: 700; color: #1d1d1f; font-variant-numeric: tabular-nums; }
.iss-stat-arrow { color: #8e8e93; }
.iss-unmatched { margin-left: auto; border: 0; cursor: pointer; font-family: inherit; }
.iss-unmatched-list { font-size: 12.5px; color: #6e6e73; line-height: 1.6; overflow-wrap: anywhere; max-height: 84px; overflow-y: auto; }

.iss-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.iss-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 28px;
  padding: 3px 10px 3px 8px;
  border: 0;
  border-radius: 14px;
  background: rgba(0, 0, 0, 0.05);
  color: #6e6e73;
  font: 500 13px/1.3 -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Noto Sans TC", sans-serif;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.12s, color 0.12s;
  -webkit-tap-highlight-color: transparent;
}
.iss-chip-check { opacity: 0; width: 0; margin-right: -4px; transition: opacity 0.12s, width 0.12s, margin 0.12s; }
.iss-chip.is-on { background: rgba(0, 113, 227, 0.12); color: #0058b0; font-weight: 600; }
.iss-chip.is-on .iss-chip-check { opacity: 1; width: 14px; margin-right: 0; }
.iss-chip:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.4); outline-offset: 2px; }
.iss-chip-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.08);
  font-size: 11px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.iss-chip.is-on .iss-chip-count { background: #0071e3; color: #fff; }

.iss-options { display: flex; flex-wrap: wrap; gap: 8px 20px; }
.iss-option { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; cursor: pointer; }
.iss-option.is-disabled { color: #8e8e93; cursor: default; }
.iss-option-count { color: #6e6e73; font-size: 12px; font-variant-numeric: tabular-nums; }

.iss-body {
  flex: 1 1 auto;
  min-height: 180px;
  overflow-y: auto;
  padding: 12px 16px 16px;
  -webkit-overflow-scrolling: touch;
}
.iss-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 200px;
  color: #6e6e73;
  font-size: 13.5px;
  text-align: center;
}
.iss-state--sm { min-height: 90px; }
.iss-result { margin-bottom: 10px; }

.iss-listbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; }
.iss-all { display: inline-flex; align-items: center; gap: 7px; padding-left: 14px; font-size: 13px; font-weight: 500; cursor: pointer; white-space: nowrap; }
.iss-selected { font-size: 12.5px; color: #6e6e73; white-space: nowrap; font-variant-numeric: tabular-nums; }
.iss-search { flex: 0 1 220px; min-width: 150px; margin-left: auto; }
.iss-body .mac-form-label { margin-top: 12px; }

.iss-unit + .iss-unit { margin-top: 8px; }
.iss-unit-head {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 9px;
  padding: 9px 14px;
  background: #fafafc;
  border-bottom: 1px solid #ececf0;
  cursor: pointer;
}
.iss-unit-id { font-size: 13.5px; font-weight: 600; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.iss-unit-alias { font-size: 12px; color: #8e8e93; white-space: nowrap; }

.iss-diff {
  display: grid;
  grid-template-columns: 16px 118px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  padding: 8px 14px;
  font-size: 13px;
  line-height: 1.45;
  cursor: pointer;
}
.iss-diff + .iss-diff { border-top: 1px solid #f0f0f3; }
.iss-diff > .mac-check, .iss-add > .mac-check { margin-top: 1.5px; }
.iss-diff-label { color: #6e6e73; }
.iss-diff-values { display: flex; align-items: flex-start; flex-wrap: wrap; gap: 3px 7px; min-width: 0; }
.iss-before { color: #8e8e93; text-decoration: line-through; text-decoration-color: rgba(142, 142, 147, 0.6); overflow-wrap: anywhere; }
.iss-before.is-empty { text-decoration: none; font-style: normal; color: #aeaeb2; }
.iss-arrow { flex-shrink: 0; margin-top: 2.5px; color: #8e8e93; }
.iss-after { font-weight: 600; color: #1d1d1f; overflow-wrap: anywhere; }
.iss-diff.is-off .iss-diff-label,
.iss-diff.is-off .iss-after,
.iss-add.is-off .iss-unit-id,
.iss-add.is-off .iss-add-summary { color: #aeaeb2; }
.iss-diff.is-off .iss-after { font-weight: 500; }
.iss-diff.is-off .mac-tag { opacity: 0.5; }

.iss-add {
  display: grid;
  grid-template-columns: 16px minmax(64px, max-content) minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  padding: 8px 14px;
  font-size: 13px;
  line-height: 1.45;
  cursor: pointer;
}
.iss-add + .iss-add { border-top: 1px solid #f0f0f3; }
.iss-add-summary { display: flex; flex-wrap: wrap; gap: 2px 14px; min-width: 0; color: #6e6e73; }
.iss-add-part { max-width: 100%; overflow-wrap: anywhere; }

.iss-more { padding: 8px 4px 0; text-align: center; }
.iss-spin { animation: iss-spin 0.9s linear infinite; }
@keyframes iss-spin { to { transform: rotate(360deg); } }
.mac-sheet-close:disabled { opacity: 0.4; cursor: default; }

.iss.is-single .iss-body { min-height: 0; }
.iss.is-single .iss-state { min-height: 160px; }

@media (max-width: 600px) {
  /* 手機版欄位與選項跟著清單一起捲動，清單才有足夠高度 */
  .iss-main { display: block; overflow-y: auto; background: #f5f5f7; -webkit-overflow-scrolling: touch; }
  .iss-controls { padding: 10px 12px; }
  .iss-body { min-height: 0; overflow: visible; padding: 10px 12px 14px; }
  .iss-chip { min-height: 32px; font-size: 14px; }
  .iss-search { flex: 1 1 100%; margin-left: 0; }
  .iss-all { padding-left: 12px; }
  .iss-unit-head, .iss-diff, .iss-add { padding-left: 12px; padding-right: 12px; }
  /* 欄位名稱獨立一行，前後值可用整行寬度 */
  .iss-diff { grid-template-columns: 16px minmax(0, 1fr); }
  .iss-diff-label { font-size: 12px; }
  .iss-diff-values { grid-column: 2; }
  .iss-add { grid-template-columns: 16px minmax(0, 1fr); }
  .iss-add-summary { grid-column: 2; }
  .mac-sheet-foot .mac-btn { height: 36px; }
}
</style>
