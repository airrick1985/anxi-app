<template>
  <v-card variant="outlined" class="my-4">
    <v-card-title class="text-subtitle-1">每人當期獎金結果</v-card-title>
    <v-card-text>
      <div class="text-caption mb-3">第 {{ period }} 期・所有方案（含一般、配套）已送出獎金＋本次草稿；拉回修改的原筆不重複計入。</div>
      <v-table density="compact">
        <thead><tr><th>人員</th><th>小計</th><th>保留款</th><th>稅金</th><th>二代健保</th><th>實發</th><th style="min-width: 300px">當期備註</th></tr></thead>
        <tbody>
          <tr v-for="p in summary.people" :key="p.personKey">
            <td>{{ p.name }}</td>
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
          <tr v-if="!summary.people.length"><td colspan="7" class="text-center">本期尚無獎金資料</td></tr>
          <tr v-else class="font-weight-bold"><td>合計</td><td v-for="field in fields" :key="field" class="text-right">{{ money(summary.totals[field]) }}</td><td /></tr>
        </tbody>
      </v-table>
      <v-btn class="mt-3" color="primary" variant="tonal" :disabled="!dirty" :loading="saving" @click="$emit('save')">儲存當期備註</v-btn>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { money } from '@/utils/commissionCalculation';
import { periodPersonNotes } from '@/utils/commissionPeriodBonus';
const props = defineProps({ period: Number, summary: Object, notes: Array, dirty: Boolean, saving: Boolean });
const emit = defineEmits(['update', 'save']);
const fields = ['subtotal', 'keep', 'tax', 'nhi', 'net'];
const notesOf = person => periodPersonNotes(props.notes, props.period, person.personKey, person.legacyNotes || []);
const update = (person, notes) => emit('update', { period: Number(props.period), personKey: person.personKey, notes });
function change(person, index, value) { const notes = [...notesOf(person)]; notes[index] = value; update(person, notes); }
function remove(person, index) { update(person, notesOf(person).filter((_, i) => i !== index)); }
</script>
