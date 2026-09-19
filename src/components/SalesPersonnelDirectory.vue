<template>
  <v-card class="personnel-directory" elevation="2">
    <div class="directory-toolbar">
      <div>
        <h2 class="text-h6 text-blue-darken-2">銷售人員管理 <span class="text-body-2 text-medium-emphasis">{{ personnel.length }} 人</span></h2>
        <div class="text-body-2 text-medium-emphasis">查找人員、編輯聯絡資料與請佣獎金設定</div>
      </div>
      <div class="directory-actions">
        <v-btn color="primary" prepend-icon="mdi-plus" :disabled="sorting || busy" @click="$emit('add')">新增人員</v-btn>
        <v-btn variant="tonal" color="primary" prepend-icon="mdi-account-multiple-plus-outline" :disabled="sorting || busy" @click="$emit('cross-import')">從其他建案引入</v-btn>
        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn v-bind="menuProps" variant="text" prepend-icon="mdi-dots-horizontal" :disabled="sorting || busy">更多</v-btn>
          </template>
          <v-list density="compact">
            <v-list-item title="匯入 Excel" prepend-icon="mdi-tray-arrow-up" @click="$emit('excel-import')" />
            <v-list-item title="匯出全部人員 Excel" prepend-icon="mdi-microsoft-excel" :disabled="!personnel.length" @click="$emit('export')" />
            <v-list-item title="重新整理" prepend-icon="mdi-refresh" @click="$emit('refresh')" />
          </v-list>
        </v-menu>
      </div>
    </div>

    <div class="directory-filters">
      <v-text-field v-model="search" label="搜尋姓名、電話、Email、職位" prepend-inner-icon="mdi-magnify"
        variant="outlined" density="compact" clearable hide-details :disabled="sorting" class="directory-search" />
      <v-select v-model="position" :items="positionOptions" label="全部職位" variant="outlined"
        density="compact" clearable hide-details :disabled="sorting" class="directory-position" />
      <v-btn :variant="sorting ? 'flat' : 'outlined'" :color="sorting ? 'primary' : undefined"
        prepend-icon="mdi-sort" :disabled="busy || personnel.length < 2" @click="toggleSorting">
        {{ sorting ? '完成排序' : '調整排序' }}
      </v-btn>
    </div>

    <div class="directory-summary" aria-live="polite">
      <span>{{ sorting ? `共 ${personnel.length} 人，拖曳左側把手或使用箭頭調整順序，變更會自動儲存` : `符合 ${filtered.length} / 共 ${personnel.length} 人` }}</span>
      <v-chip v-if="recentIds.length && !sorting" :color="recentOnly ? 'primary' : undefined" size="small"
        :variant="recentOnly ? 'flat' : 'outlined'" @click="recentOnly = !recentOnly">剛引入 {{ recentIds.length }} 人</v-chip>
      <v-btn v-if="hasFilters && !sorting" variant="text" size="small" @click="clearFilters">清除篩選</v-btn>
      <span v-if="savingOrder" class="text-primary">排序儲存中…</span>
    </div>
    <v-progress-linear v-if="busy" indeterminate color="primary" />
    <v-alert v-if="error" type="error" variant="tonal" class="ma-4" density="compact">
      {{ error }}
      <v-btn variant="text" size="small" :disabled="busy" @click="$emit('refresh')">重試</v-btn>
    </v-alert>
    <v-skeleton-loader v-if="loading && !personnel.length" type="list-item-two-line@5" />
    <div v-else-if="!filtered.length" class="directory-empty">
      <v-icon size="40" color="grey">{{ personnel.length ? 'mdi-account-search-outline' : 'mdi-account-group-outline' }}</v-icon>
      <p class="mt-3">{{ personnel.length ? '沒有符合條件的人員，請調整搜尋或篩選。' : '目前尚無銷售人員，可新增或從其他建案引入。' }}</p>
    </div>
    <div v-else class="directory-scroll">
      <div class="personnel-row directory-heading" :class="{ 'is-sorting': sorting }" aria-hidden="true">
        <span v-if="sorting">排序</span><span>姓名／電話</span><span>職位</span><span>Email</span><span>進場時間</span><span>結案時間</span><span>操作</span>
      </div>
      <draggable :model-value="visiblePersonnel" item-key="id" handle=".personnel-drag-handle"
        :disabled="!sorting || busy" :animation="150" :class="{ 'is-sorting': sorting }"
        @update:model-value="reorder">
        <template #item="{ element: person, index }">
          <div class="personnel-row" :class="{ 'recent-person': recentSet.has(person.id) }">
            <div v-if="sorting" class="personnel-order">
              <v-icon class="personnel-drag-handle" title="拖曳排序">mdi-drag</v-icon>
              <span class="text-caption">{{ index + 1 }}</span>
              <v-btn icon="mdi-arrow-up" variant="text" size="x-small" :aria-label="`將${person.name}往上移`"
                :disabled="busy || index === 0" @click="move(index, -1)" />
              <v-btn icon="mdi-arrow-down" variant="text" size="x-small" :aria-label="`將${person.name}往下移`"
                :disabled="busy || index === personnel.length - 1" @click="move(index, 1)" />
            </div>
            <div class="personnel-identity">
              <button class="personnel-name" :disabled="sorting || busy" @click="$emit('edit', person)">{{ person.name || '未填姓名' }}</button>
              <v-chip v-if="recentSet.has(person.id)" size="x-small" color="success" class="ml-2">剛引入</v-chip>
              <div class="text-body-2 text-medium-emphasis">{{ person.phone || '未填電話' }}</div>
            </div>
            <div class="personnel-positions">
              <v-chip v-for="pos in person.positions" :key="pos" size="x-small" variant="tonal">{{ pos }}</v-chip>
              <span v-if="!person.positions?.length" class="text-medium-emphasis">未設定職位</span>
            </div>
            <div class="personnel-email text-body-2 text-medium-emphasis">{{ person.email || '—' }}</div>
            <div class="personnel-date text-body-2">
              <span class="personnel-date-label">進場</span>
              <span :class="{ 'text-medium-emphasis': !segmentOf(person)?.inDate }">{{ segmentOf(person)?.inDate || '—' }}</span>
              <v-chip v-if="segmentCount(person) > 1" size="x-small" variant="tonal" class="ml-1">{{ segmentCount(person) }} 段</v-chip>
            </div>
            <div class="personnel-date text-body-2">
              <span class="personnel-date-label">結案</span>
              <span v-if="segmentOf(person)?.outDate">{{ segmentOf(person).outDate }}</span>
              <span v-else-if="segmentOf(person)" class="text-success">在案中</span>
              <span v-else class="text-medium-emphasis">—</span>
            </div>
            <div class="personnel-row-actions">
              <v-btn icon="mdi-pencil-outline" variant="text" color="primary" size="small" :aria-label="`編輯${person.name}`"
                :disabled="sorting || busy" @click="$emit('edit', person)" />
              <v-btn icon="mdi-delete-outline" variant="text" size="small" :aria-label="`刪除${person.name}`"
                :disabled="sorting || busy" @click="$emit('delete', person)" />
            </div>
          </div>
        </template>
      </draggable>
    </div>
    <div v-if="!sorting && filtered.length" class="directory-pagination">
      <span class="text-caption text-medium-emphasis">第 {{ (page - 1) * pageSize + 1 }}–{{ Math.min(page * pageSize, filtered.length) }} 位</span>
      <v-select v-model="pageSize" :items="[20, 50, 100]" label="每頁人數" hide-details density="compact" variant="outlined" class="page-size" />
      <v-pagination v-model="page" :length="pageCount" :total-visible="3" density="comfortable" size="small" aria-label="人員清單分頁" />
    </div>
  </v-card>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import draggable from 'vuedraggable';
import { bonusSegments, currentSegment } from '@/utils/bonusSegments';

const props = defineProps({
  personnel: { type: Array, default: () => [] },
  recentIds: { type: Array, default: () => [] },
  loading: Boolean,
  savingOrder: Boolean,
  error: { type: String, default: '' },
});
const emit = defineEmits(['add', 'edit', 'delete', 'cross-import', 'excel-import', 'export', 'refresh', 'reorder']);
const search = ref('');
const position = ref(null);
const recentOnly = ref(false);
const sorting = ref(false);
const page = ref(1);
const pageSize = ref(20);
const busy = computed(() => props.loading || props.savingOrder);
const recentSet = computed(() => new Set(props.recentIds));
/** 請佣獎金設定的目前生效段（在案中者優先，否則進場最晚者），供列表顯示進場／結案時間 */
const segmentCache = computed(() => {
  const map = new Map();
  props.personnel.forEach(p => {
    const segs = bonusSegments(p.bonusConfig);
    map.set(p, { current: currentSegment(segs), count: segs.length });
  });
  return map;
});
const segmentOf = person => segmentCache.value.get(person)?.current || null;
const segmentCount = person => segmentCache.value.get(person)?.count || 0;
const positionOptions = computed(() => [...new Set(props.personnel.flatMap(p => p.positions || []))].sort((a, b) => a.localeCompare(b, 'zh-Hant')));
const hasFilters = computed(() => !!(search.value || position.value || recentOnly.value));
const filtered = computed(() => {
  if (sorting.value) return props.personnel;
  const keyword = String(search.value || '').trim().toLowerCase();
  const phone = keyword.replace(/\D/g, '');
  return props.personnel.filter(p =>
    (!position.value || p.positions?.includes(position.value)) &&
    (!recentOnly.value || recentSet.value.has(p.id)) &&
    (!keyword || [p.name, p.phone, p.email, ...(p.positions || [])].some(value => String(value || '').toLowerCase().includes(keyword)) ||
      (phone && /^[\d\s()+-]+$/.test(keyword) && String(p.phone || '').replace(/\D/g, '').includes(phone)))
  );
});
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize.value)));
const visiblePersonnel = computed(() => sorting.value ? props.personnel : filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
watch([search, position, recentOnly, pageSize], () => { page.value = 1; });
watch(pageCount, count => { page.value = Math.min(page.value, count); });
watch(() => props.recentIds, ids => {
  if (!ids.length) return;
  sorting.value = false;
  clearFilters();
  recentOnly.value = true;
});
function clearFilters() {
  search.value = '';
  position.value = null;
  recentOnly.value = false;
  page.value = 1;
}
function toggleSorting() {
  clearFilters();
  sorting.value = !sorting.value;
}
function reorder(people) {
  if (sorting.value && !busy.value) emit('reorder', people);
}
function move(index, direction) {
  const people = [...props.personnel];
  const target = index + direction;
  if (target < 0 || target >= people.length) return;
  [people[index], people[target]] = [people[target], people[index]];
  reorder(people);
}
</script>

<style scoped>
.directory-toolbar, .directory-filters, .directory-summary, .directory-pagination, .directory-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.directory-toolbar { justify-content: space-between; padding: 20px; }
.directory-filters { padding: 0 20px 12px; }
.directory-search { flex: 1 1 280px; }
.directory-position { flex: 0 1 200px; }
.directory-summary { padding: 0 20px 12px; font-size: 13px; color: rgb(var(--v-theme-on-surface), .65); min-height: 40px; }
.directory-scroll { max-height: 60vh; min-height: 160px; overflow-y: auto; border-block: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.personnel-row { display: grid; grid-template-columns: minmax(170px, 1fr) minmax(120px, .7fr) minmax(160px, 1fr) minmax(120px, .6fr) minmax(110px, .5fr) 80px; align-items: center; gap: 16px; padding: 10px 20px; border-bottom: 1px solid rgba(var(--v-border-color), .08); }
.directory-heading { position: sticky; top: 0; z-index: 1; background: rgb(var(--v-theme-surface)); font-size: 12px; color: rgb(var(--v-theme-on-surface), .65); }
.directory-heading.is-sorting, .is-sorting .personnel-row { grid-template-columns: 120px minmax(150px, 1fr) minmax(110px, .7fr) minmax(120px, 1fr) minmax(120px, .6fr) minmax(110px, .5fr) 80px; }
.personnel-date { white-space: nowrap; font-variant-numeric: tabular-nums; }
.personnel-date-label { display: none; }
.personnel-name { text-align: left; font-size: 15px; font-weight: 600; color: rgb(var(--v-theme-primary)); overflow-wrap: anywhere; }
.personnel-name:hover { text-decoration: underline; }
.personnel-name:disabled { color: inherit; }
.personnel-positions { display: flex; flex-wrap: wrap; gap: 4px; }
.personnel-email { overflow-wrap: anywhere; }
.personnel-row-actions, .personnel-order { display: flex; align-items: center; }
.personnel-drag-handle { cursor: grab; touch-action: none; }
.recent-person { background: rgba(var(--v-theme-success), .04); }
.directory-empty { padding: 48px 20px; text-align: center; }
.directory-pagination { justify-content: flex-end; padding: 12px 20px; }
.page-size { flex: 0 0 110px; }
@media (max-width: 959px) {
  .personnel-row, .is-sorting .personnel-row { grid-template-columns: minmax(0, 1fr) 80px; gap: 6px 12px; }
  .directory-heading { display: none; }
  .personnel-identity { grid-column: 1; grid-row: 1; }
  .personnel-row-actions { grid-column: 2; grid-row: 1 / span 5; }
  .personnel-positions, .personnel-email, .personnel-date { grid-column: 1; }
  .personnel-date-label { display: inline; margin-right: 6px; color: rgb(var(--v-theme-on-surface), .6); font-size: 12px; }
  .personnel-order { grid-column: 1 / -1; }
  .is-sorting .personnel-identity { grid-row: 2; }
  .is-sorting .personnel-row-actions { grid-row: 2 / span 5; }
  .directory-scroll { max-height: 65vh; }
}
@media (max-width: 599px) {
  .directory-toolbar, .directory-pagination { padding: 16px; }
  .directory-filters { padding-inline: 16px; }
  .directory-actions { width: 100%; gap: 8px; }
  .directory-actions > .v-btn { flex-grow: 1; }
  .directory-position { flex-grow: 1; }
  .directory-pagination { justify-content: center; gap: 8px; }
}
</style>
