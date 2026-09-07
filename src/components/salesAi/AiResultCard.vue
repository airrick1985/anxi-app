<template>
  <div class="ai-rcard">
    <div class="ai-rcard__head">
      <v-icon size="18" color="success">mdi-check-circle</v-icon>
      <span>{{ result.headline || '已執行' }}</span>
      <span v-if="result.unitId" class="ai-rcard__unit">{{ result.unitId }}</span>
      <span v-else-if="unitCount > 1" class="ai-rcard__unit">共 {{ unitCount }} 戶</span>
    </div>

    <!-- 修改前後差異：依戶別／車位分組，逐欄位列出 -->
    <template v-if="hasDiff">
      <div class="ai-rcard__diff-title">修改前 → 修改後</div>
      <div v-for="(rows, target) in grouped" :key="target" class="ai-rcard__group">
        <div class="ai-rcard__target">{{ target }}</div>
        <table class="ai-rcard__table">
          <tbody>
            <tr v-for="(d, i) in rows" :key="i">
              <td class="ai-rcard__label">{{ rowLabel(d) }}</td>
              <td class="ai-rcard__from">{{ fmt(d.from) }}</td>
              <td class="ai-rcard__arrow">→</td>
              <td class="ai-rcard__to">
                {{ fmt(d.to) }}<span v-if="d.note" class="ai-rcard__note">（{{ d.note }}）</span><span v-else-if="d.auto" class="ai-rcard__note">（自動計算）</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
    <ul v-else class="ai-rcard__list">
      <li v-for="(a, i) in result.applied || []" :key="i">{{ a }}</li>
    </ul>
    <!-- 非欄位變更的補充（備註留言、車位同步等） -->
    <ul v-if="hasDiff && extraApplied.length" class="ai-rcard__list ai-rcard__list--sub">
      <li v-for="(a, i) in extraApplied" :key="i">{{ a }}</li>
    </ul>

    <div class="ai-rcard__actions">
      <v-btn v-if="result.unitId" size="x-small" variant="tonal" color="primary" prepend-icon="mdi-open-in-app" @click="$emit('open-unit', result.unitId)">開啟戶別</v-btn>
      <v-btn v-if="result.notification && result.notification.statusChanged && (result.notification.eligibleRecipients || []).length" size="x-small" variant="tonal" color="teal" prepend-icon="mdi-bell-ring-outline" @click="$emit('notify', result)">發送狀態通知</v-btn>
    </div>
  </div>
</template>

<script setup>
// 執行結果卡：完成後把「修改前 → 修改後」逐欄位回給使用者（docs/銷控AI智能助理-spec.md §3.4）
import { computed } from 'vue';

const props = defineProps({ result: { type: Object, required: true } });
defineEmits(['open-unit', 'notify']);

const unitCount = computed(() => (props.result.unitIds || []).length);
const hasDiff = computed(() => Array.isArray(props.result.diff) && props.result.diff.length > 0);
const grouped = computed(() => {
  const g = {};
  for (const d of props.result.diff || []) { (g[d.target] = g[d.target] || []).push(d); }
  return g;
});
// 「A-3 已更新：房屋表價」這類欄位摘要已由差異表呈現，只保留其他補充（車位、備註、退戶）
const extraApplied = computed(() => (props.result.applied || []).filter(a => !/已更新：/.test(String(a))));

function rowLabel(d) {
  if (d.field === 'assign') return '配置給';
  if (d.field === 'release') return '解除配置';
  return d.label;
}
function fmt(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? '是' : '否';
  if (typeof v === 'number') return v.toLocaleString('zh-TW');
  if (Array.isArray(v)) return v.join('、');
  if (typeof v === 'object' && v.year) return `民國${v.year}年${v.month}月${v.day}日`;
  return String(v).replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1/$2/$3');
}
</script>

<style scoped>
.ai-rcard { border: 1px solid #C8E6C9; background: #F6FCF6; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.ai-rcard__head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1B5E20; }
.ai-rcard__unit { margin-left: auto; font-size: 12px; color: #2E7D32; background: #E8F5E9; border-radius: 6px; padding: 1px 6px; }
.ai-rcard__diff-title { font-size: 11.5px; color: #558B2F; font-weight: 500; }
.ai-rcard__group { display: flex; flex-direction: column; gap: 2px; }
.ai-rcard__target { font-size: 12.5px; font-weight: 600; color: #2E7D32; }
.ai-rcard__table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.ai-rcard__table td { padding: 2px 4px; vertical-align: top; border-bottom: 1px dashed #DCEDC8; }
.ai-rcard__table tr:last-child td { border-bottom: none; }
.ai-rcard__label { color: #546E7A; white-space: nowrap; width: 34%; }
.ai-rcard__from { color: #90A4AE; text-decoration: line-through; word-break: break-all; }
.ai-rcard__arrow { color: #9E9E9E; width: 18px; text-align: center; }
.ai-rcard__to { color: #1B5E20; font-weight: 600; word-break: break-all; }
.ai-rcard__note { color: #78909C; font-weight: 400; font-size: 11.5px; }
.ai-rcard__list { margin: 0; padding-left: 18px; font-size: 12.5px; color: #33691E; display: flex; flex-direction: column; gap: 2px; }
.ai-rcard__list--sub { font-size: 12px; color: #558B2F; }
.ai-rcard__actions { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
