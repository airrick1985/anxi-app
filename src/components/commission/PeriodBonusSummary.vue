<template>
  <v-card variant="outlined" class="my-4">
    <v-card-title class="text-subtitle-1">每人當期獎金結果</v-card-title>
    <v-card-text>
      <div class="text-caption mb-3">第 {{ period }} 期・所有方案（含一般、配套）已送出獎金＋本次草稿；拉回修改的原筆不重複計入。</div>
      <v-table density="compact">
        <thead>
          <tr>
            <th>人員</th>
            <th>獎金項目</th>
            <th v-for="col in rateColumns" :key="col.field" class="text-right">{{ col.label }}</th>
            <th>小計</th><th>保留款</th><th>稅金</th><th>二代健保</th><th>實發</th><th style="min-width: 300px">當期備註</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in summary.people" :key="p.personKey">
            <td>{{ p.name }}</td>
            <td class="py-1">
              <div class="d-flex flex-wrap ga-1">
                <v-chip v-for="c in catsOf(p)" :key="c.key" size="x-small" variant="tonal" :color="c.amount < 0 ? 'error' : 'primary'">{{ c.label }} {{ money(c.amount) }}</v-chip>
                <span v-if="!catsOf(p).length" class="text-medium-emphasis">—</span>
              </div>
            </td>
            <td v-for="col in rateColumns" :key="col.field" class="text-right">
              <template v-if="rates[p.personKey]">
                <input class="pct-input" type="number" step="0.01" :value="rates[p.personKey][col.field]"
                  :aria-label="`${p.name} ${col.label}`" @change="e => emit('update-rate', { personKey: p.personKey, field: col.field, value: e.target.value })">%
              </template>
              <span v-else class="text-medium-emphasis">—</span>
            </td>
            <td v-for="field in fields" :key="field" class="text-right">{{ money(p[field]) }}</td>
            <td class="py-2">
              <div v-for="(note, i) in notesOf(p)" :key="i" class="d-flex align-start ga-1 mb-1">
                <v-textarea :model-value="note" :label="`備註 ${i + 1}`" rows="1" auto-grow hide-details variant="outlined" density="compact"
                  @update:model-value="value => change(p, i, value)" />
                <v-btn icon="mdi-close" size="x-small" variant="text" :aria-label="`刪除 ${p.name} 備註 ${i + 1}`" @click="remove(p, i)" />
              </div>
              <v-btn size="small" variant="text" prepend-icon="mdi-plus" @click="update(p, [...notesOf(p), ''])">新增備註</v-btn>
            </td>
          </tr>
          <tr v-if="!summary.people.length"><td colspan="11" class="text-center">本期尚無獎金資料</td></tr>
          <tr v-else class="font-weight-bold"><td>合計</td><td :colspan="rateColumns.length + 1" /><td v-for="field in fields" :key="field" class="text-right">{{ money(summary.totals[field]) }}</td><td /></tr>
        </tbody>
      </v-table>
      <v-btn class="mt-3" color="primary" variant="tonal" :disabled="!dirty" :loading="saving" @click="$emit('save')">儲存當期備註</v-btn>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { money } from '@/utils/commissionCalculation';
import { periodPersonNotes } from '@/utils/commissionPeriodBonus';
const props = defineProps({
  period: Number, summary: Object, notes: Array, dirty: Boolean, saving: Boolean,
  rates: { type: Object, default: () => ({}) },   // personKey -> { keepPct, taxPct, nhiPct }（本次草稿參與者可編輯，跨戶共用）
  history: { type: Object, default: () => ({}) },  // personKey -> [{ period, notes }]：歷期獎金明細備註，未存當期備註時自動帶入最近一期
  categories: { type: Array, default: () => [] },  // 建案獎金類別（順序＝顯示順序）
});
/** 該人員本期有金額的獎金項目（依建案類別順序；設定已移除的類別以 key 顯示） */
function catsOf(person) {
  const byCat = person.byCat || {};
  const defs = props.categories.slice().sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
  const list = defs.filter(c => byCat[c.key]).map(c => ({ key: c.key, label: c.label || c.key, amount: byCat[c.key] }));
  Object.keys(byCat).forEach(k => { if (byCat[k] && !list.some(c => c.key === k)) list.push({ key: k, label: k, amount: byCat[k] }); });
  return list;
}
const emit = defineEmits(['update', 'update-rate', 'save']);
const fields = ['subtotal', 'keep', 'tax', 'nhi', 'net'];
const rateColumns = [{ field: 'keepPct', label: '保留款％' }, { field: 'taxPct', label: '稅金％' }, { field: 'nhiPct', label: '二代健保％' }];
const notesOf = person => periodPersonNotes(props.notes, props.period, person.personKey, person.legacyNotes || [], props.history?.[person.personKey] || []);
const update = (person, notes) => emit('update', { period: Number(props.period), personKey: person.personKey, notes });
function change(person, index, value) { const notes = [...notesOf(person)]; notes[index] = value; update(person, notes); }
function remove(person, index) { update(person, notesOf(person).filter((_, i) => i !== index)); }
</script>
<style scoped>
.pct-input { width: 58px; border: 1px solid #cdd8ec; border-radius: 4px; padding: 1px 4px; text-align: right; font-size: 12px; }
</style>
