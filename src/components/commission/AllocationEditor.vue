<template>
  <div class="allocation-editor" :class="{ 'is-empty': needsPeople, 'is-error': category.allocations.length && !result.valid }">
    <!-- 標題列：類別 / 比例 / 池 / 狀態 -->
    <div class="ae-head">
      <div class="ae-title">
        <span class="text-subtitle-2 font-weight-bold">{{ category.label }}</span>
        <span class="rate-wrap text-caption">
          比例
          <v-text-field
            :model-value="category.ratePct"
            type="number" step="0.001" min="0"
            density="compact" hide-details variant="outlined" suffix="%" class="rate-input"
            @update:model-value="v => { category.ratePct = Number(v) || 0; }"
          ></v-text-field>
        </span>
        <v-chip size="x-small" color="indigo" variant="tonal">獎金池 {{ money(pool) }} 元</v-chip>
      </div>
      <div class="ae-status">
        <v-chip v-if="!category.allocations.length" size="x-small" :color="needsPeople ? 'warning' : undefined" variant="tonal">
          <v-icon start size="x-small">{{ needsPeople ? 'mdi-alert' : 'mdi-minus-circle-outline' }}</v-icon>
          {{ needsPeople ? '尚未選擇人員' : '比例為 0，不發放' }}
        </v-chip>
        <v-chip v-else-if="!result.valid" size="x-small" color="error" variant="tonal">
          <v-icon start size="x-small">mdi-alert-circle</v-icon>{{ result.error }}
        </v-chip>
        <v-chip v-else size="x-small" color="success" variant="tonal">
          <v-icon start size="x-small">mdi-check</v-icon>{{ category.allocations.length }} 人・{{ isEven ? '均分' : '自訂分配' }}
        </v-chip>
      </div>
    </div>

    <!-- 人員選擇：點選即加入（預設均分） -->
    <div class="d-flex flex-wrap align-center ga-1 mt-2">
      <v-chip
        v-for="p in poolOptions"
        :key="p.personKey"
        size="small"
        :color="isSelected(p.personKey) ? 'primary' : undefined"
        :variant="isSelected(p.personKey) ? 'flat' : 'outlined'"
        :disabled="p.disabled"
        :title="p.disabled ? '資格不符' : (isSelected(p.personKey) ? '點選移除' : '點選加入')"
        @click="!p.disabled && togglePerson(p)"
      >
        <v-icon start size="x-small">{{ isSelected(p.personKey) ? 'mdi-check-circle' : 'mdi-plus-circle-outline' }}</v-icon>
        {{ p.name }}
        <span v-if="isSelected(p.personKey)" class="chip-amt">{{ money(result.amounts[p.personKey] || 0) }}</span>
        <span v-else-if="p.hint" class="text-caption ml-1 opacity-70">{{ p.hint }}</span>
      </v-chip>
      <!-- 他案／臨時人員（不在本案候選名單） -->
      <v-chip
        v-for="a in externalAllocations"
        :key="a.personKey"
        size="small" color="orange-darken-2" variant="flat" closable
        @click:close="removePerson(a.personKey)"
      >
        <v-icon start size="x-small">mdi-check-circle</v-icon>
        {{ a.name }}
        <span class="text-caption ml-1 opacity-80">{{ a.sourceProjectId && a.sourceProjectId !== projectId ? (a.sourceProjectName || a.sourceProjectId) : '臨時' }}</span>
        <span class="chip-amt">{{ money(result.amounts[a.personKey] || 0) }}</span>
      </v-chip>
      <v-btn size="x-small" variant="text" color="primary" prepend-icon="mdi-account-search" @click="$emit('add-person')">他案人員</v-btn>
    </div>

    <!-- 分配方式 -->
    <div v-if="category.allocations.length" class="d-flex flex-wrap align-center ga-2 mt-2">
      <span class="text-caption text-medium-emphasis">分配方式：</span>
      <v-btn-toggle :model-value="customOpen ? 'custom' : 'even'" mandatory density="compact" variant="outlined" divided color="primary"
        @update:model-value="onModeToggle">
        <v-btn size="x-small" value="even">均分</v-btn>
        <v-btn size="x-small" value="custom">自訂比例／鎖定金額</v-btn>
      </v-btn-toggle>
      <span v-if="!customOpen" class="text-caption text-medium-emphasis">{{ evenText }}</span>
    </div>

    <!-- 自訂分配表（僅在自訂時展開） -->
    <v-expand-transition>
      <div v-if="customOpen && category.allocations.length" class="mt-2">
        <v-table density="compact" class="allocation-table">
          <thead>
            <tr>
              <th>人員</th><th style="width:150px">模式</th><th style="width:160px">數值</th><th class="text-right" style="width:120px">金額</th><th style="width:40px"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in category.allocations" :key="a.personKey">
              <td>
                {{ a.name }}
                <v-chip v-if="a.sourceProjectId && a.sourceProjectId !== projectId" size="x-small" color="orange" variant="tonal" class="ml-1">
                  {{ a.sourceProjectName || a.sourceProjectId }}
                </v-chip>
                <v-chip v-else-if="a.isExternal" size="x-small" color="grey" variant="tonal" class="ml-1">臨時</v-chip>
              </td>
              <td>
                <v-btn-toggle :model-value="a.mode" density="compact" mandatory variant="outlined" divided @update:model-value="m => switchMode(a, m)">
                  <v-btn size="x-small" value="pct">%</v-btn>
                  <v-btn size="x-small" value="locked">鎖定額</v-btn>
                </v-btn-toggle>
              </td>
              <td>
                <v-text-field v-if="a.mode === 'pct'" :model-value="a.sharePct" type="number" step="0.01" min="0"
                  density="compact" hide-details variant="outlined" suffix="%"
                  @update:model-value="v => { a.sharePct = Number(v) || 0; }"></v-text-field>
                <v-text-field v-else :model-value="a.lockedAmount" type="number" step="1" min="0"
                  density="compact" hide-details variant="outlined" suffix="元"
                  @update:model-value="v => { a.lockedAmount = Number(v) || 0; }"></v-text-field>
              </td>
              <td class="text-right font-weight-medium">{{ money(result.amounts[a.personKey] || 0) }}</td>
              <td><v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removePerson(a.personKey)"></v-btn></td>
            </tr>
          </tbody>
        </v-table>
        <div class="d-flex align-center flex-wrap ga-2 mt-1">
          <v-chip v-if="result.valid" size="small" color="success" variant="tonal">
            <v-icon start size="small">mdi-check</v-icon>分配合計 {{ money(result.total) }} 元 ＝ 獎金池
          </v-chip>
          <v-chip v-else size="small" color="error" variant="tonal">
            <v-icon start size="small">mdi-alert</v-icon>{{ result.error }}
          </v-chip>
          <v-btn size="x-small" variant="text" prepend-icon="mdi-restore" @click="resetEven">重設為均分</v-btn>
        </div>
      </div>
    </v-expand-transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { money, evenShares, toNum } from '@/utils/commissionCalculation';

const props = defineProps({
  category: { type: Object, required: true },       // { key, label, ratePct, allocations: [] }（直接操作同一 reactive 物件）
  pool: { type: Number, default: 0 },
  result: { type: Object, default: () => ({ amounts: {}, valid: true, error: '', total: 0 }) },
  poolOptions: { type: Array, default: () => [] },  // 候選人員 [{ personKey, name, hint, disabled, sourceProjectId, sourceProjectName }]
  projectId: { type: String, default: '' },
});

defineEmits(['add-person']);

const selectedKeys = computed(() => new Set(props.category.allocations.map(a => a.personKey)));
const needsPeople = computed(() => !props.category.allocations.length && toNum(props.category.ratePct) > 0);

/** 已加入但不在本案候選名單者（他案／臨時） */
const externalAllocations = computed(() => {
  const local = new Set(props.poolOptions.map(p => p.personKey));
  return props.category.allocations.filter(a => !local.has(a.personKey));
});

/** 目前是否為均分（全部 % 模式且比例等於均分值） */
const isEven = computed(() => {
  const list = props.category.allocations;
  if (!list.length) return true;
  if (list.some(a => a.mode === 'locked')) return false;
  const shares = evenShares(list.length);
  return list.every((a, i) => Math.abs(toNum(a.sharePct) - shares[i]) < 0.011);
});

/** 均分說明文字（依實際分配結果） */
const evenText = computed(() => {
  const pcts = props.category.allocations.filter(a => a.mode !== 'locked');
  if (!pcts.length) return '';
  const r = props.result || {};
  if (r.perHead !== undefined) {
    const rem = toNum(r.remainder);
    if (rem > 0) return `每人各 ${money(r.perHead)} 元，尾差 ${money(rem)} 元不發放（建案設定：每人相同）`;
    if (rem < 0) return `每人各 ${money(r.perHead)} 元，合計比獎金池多 ${money(-rem)} 元（建案設定：四捨五入）`;
    return `每人各 ${money(r.perHead)} 元`;
  }
  const amts = pcts.map(a => toNum(r.amounts?.[a.personKey]));
  const min = Math.min(...amts), max = Math.max(...amts);
  return min === max
    ? `每人各 ${money(min)} 元`
    : `每人約 ${money(min)} 元，尾差由最後一人吸收（${money(max)} 元）；可於設定分頁改為「每人相同」`;
});

// 自訂分配表：非均分時自動展開
const customOpen = ref(!isEven.value);
watch(isEven, v => { if (!v) customOpen.value = true; });

function isSelected(personKey) {
  return selectedKeys.value.has(personKey);
}

/** 均分所有 pct 模式的人（鎖定額不動） */
function reEvenPct() {
  const pcts = props.category.allocations.filter(a => a.mode !== 'locked');
  const shares = evenShares(pcts.length);
  pcts.forEach((a, i) => { a.sharePct = shares[i]; });
}

function togglePerson(p) {
  if (isSelected(p.personKey)) {
    removePerson(p.personKey);
    return;
  }
  props.category.allocations.push({
    personKey: p.personKey,
    name: p.name,
    sourceProjectId: p.sourceProjectId || props.projectId,
    sourceProjectName: p.sourceProjectName || '',
    isExternal: !!p.isExternal,
    mode: 'pct',
    sharePct: 0,
    lockedAmount: null,
  });
  reEvenPct();
}

function removePerson(personKey) {
  const idx = props.category.allocations.findIndex(a => a.personKey === personKey);
  if (idx >= 0) props.category.allocations.splice(idx, 1);
  reEvenPct();
}

function switchMode(a, mode) {
  if (a.mode === mode) return;
  if (mode === 'locked') {
    a.lockedAmount = toNum(props.result.amounts[a.personKey]);
    a.mode = 'locked';
  } else {
    a.mode = 'pct';
  }
  reEvenPct();
}

/** 全部重設為均分（含原鎖定者） */
function resetEven() {
  props.category.allocations.forEach(a => { a.mode = 'pct'; a.lockedAmount = null; });
  reEvenPct();
  customOpen.value = false;
}

function onModeToggle(v) {
  if (v === 'even') resetEven();
  else customOpen.value = true;
}

defineExpose({ togglePerson, reEvenPct });
</script>

<style scoped>
.allocation-editor {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-left: 4px solid #c5cae9;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #fafbfe;
}
.allocation-editor.is-empty { border-left-color: #fb8c00; background: #fffaf3; }
.allocation-editor.is-error { border-left-color: #e53935; }
.ae-head { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 12px; }
.ae-title { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.rate-wrap { display: inline-flex; align-items: center; gap: 4px; }
.rate-input { width: 118px; }
.rate-input :deep(input) { font-size: 13px; }
.chip-amt { margin-left: 6px; padding-left: 6px; border-left: 1px solid rgba(255,255,255,.5); font-variant-numeric: tabular-nums; font-size: 12px; }
.allocation-table :deep(td) { padding: 4px 8px !important; }
.opacity-70 { opacity: .7; }
.opacity-80 { opacity: .8; }
</style>
