<template>
  <div class="allocation-editor">
    <div class="d-flex align-center flex-wrap ga-2 mb-1">
      <span class="text-subtitle-2 font-weight-bold">{{ category.label }}</span>
      <span class="rate-input d-inline-flex align-center">
        比例
        <v-text-field
          :model-value="category.ratePct"
          type="number"
          step="0.001"
          min="0"
          density="compact"
          hide-details
          variant="outlined"
          style="width: 110px"
          class="mx-1"
          suffix="%"
          @update:model-value="v => { category.ratePct = Number(v) || 0; }"
        ></v-text-field>
      </span>
      <v-chip size="small" color="indigo" variant="tonal">獎金池 {{ money(pool) }} 元</v-chip>
      <v-spacer></v-spacer>
      <v-btn size="small" variant="text" prepend-icon="mdi-account-multiple-check" @click="resetEven" :disabled="!category.allocations.length">重設均分</v-btn>
      <v-btn size="small" variant="text" color="primary" prepend-icon="mdi-account-search" @click="$emit('add-person')">＋他案人員</v-btn>
    </div>

    <!-- 候選人員 chips（本案） -->
    <div class="d-flex flex-wrap ga-1 mb-2" v-if="poolOptions.length">
      <v-chip
        v-for="p in poolOptions"
        :key="p.personKey"
        size="small"
        :color="isSelected(p.personKey) ? 'primary' : undefined"
        :variant="isSelected(p.personKey) ? 'flat' : 'outlined'"
        :disabled="p.disabled"
        @click="!p.disabled && togglePerson(p)"
      >
        <v-icon start size="x-small">{{ isSelected(p.personKey) ? 'mdi-check-circle' : 'mdi-circle-outline' }}</v-icon>
        {{ p.name }}
        <span v-if="p.hint" class="text-caption ml-1 text-medium-emphasis">{{ p.hint }}</span>
      </v-chip>
    </div>
    <div v-else class="text-caption text-medium-emphasis mb-2">（本案無符合此類別職務的人員，可用「＋他案人員」加入）</div>

    <!-- 分配表 -->
    <v-table density="compact" class="allocation-table" v-if="category.allocations.length">
      <thead>
        <tr>
          <th style="min-width: 140px">人員</th>
          <th style="width: 120px">分配模式</th>
          <th style="width: 140px">數值</th>
          <th class="text-right" style="width: 120px">分得金額</th>
          <th style="width: 44px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="a in category.allocations" :key="a.personKey">
          <td>
            <span class="font-weight-medium">{{ a.name }}</span>
            <v-chip v-if="a.sourceProjectId && a.sourceProjectId !== projectId" size="x-small" color="orange" variant="tonal" class="ml-1">
              {{ a.sourceProjectName || a.sourceProjectId }}
            </v-chip>
            <v-chip v-else-if="a.isExternal" size="x-small" color="grey" variant="tonal" class="ml-1">臨時</v-chip>
          </td>
          <td>
            <v-btn-toggle
              :model-value="a.mode"
              density="compact"
              mandatory
              variant="outlined"
              divided
              @update:model-value="m => switchMode(a, m)"
            >
              <v-btn size="x-small" value="pct">%</v-btn>
              <v-btn size="x-small" value="locked">鎖定額</v-btn>
            </v-btn-toggle>
          </td>
          <td>
            <v-text-field
              v-if="a.mode === 'pct'"
              :model-value="a.sharePct"
              type="number"
              step="0.01"
              min="0"
              density="compact"
              hide-details
              variant="outlined"
              suffix="%"
              @update:model-value="v => { a.sharePct = Number(v) || 0; }"
            ></v-text-field>
            <v-text-field
              v-else
              :model-value="a.lockedAmount"
              type="number"
              step="1"
              min="0"
              density="compact"
              hide-details
              variant="outlined"
              suffix="元"
              @update:model-value="v => { a.lockedAmount = Number(v) || 0; }"
            ></v-text-field>
          </td>
          <td class="text-right font-weight-medium">{{ money(result.amounts[a.personKey] || 0) }}</td>
          <td>
            <v-btn icon="mdi-close" size="x-small" variant="text" color="error" @click="removePerson(a.personKey)"></v-btn>
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- 驗證狀態 -->
    <div v-if="category.allocations.length" class="mt-1">
      <v-chip v-if="result.valid" size="small" color="success" variant="tonal">
        <v-icon start size="small">mdi-check</v-icon>
        分配合計 {{ money(result.total) }} 元 ＝ 獎金池
      </v-chip>
      <v-chip v-else size="small" color="error" variant="tonal">
        <v-icon start size="small">mdi-alert</v-icon>
        {{ result.error }}
      </v-chip>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
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
}

defineExpose({ togglePerson, reEvenPct });
</script>

<style scoped>
.allocation-table :deep(td) {
  padding: 4px 8px !important;
}
.allocation-editor {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 10px;
  background: #fafbfe;
}
</style>
