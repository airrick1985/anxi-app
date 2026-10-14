<template>
  <div class="la-list">
    <div class="la-list__head" :class="{ 'la-list__head--menu': avoidMenu }">
      <div class="la-list__title">LINE AI</div>
      <v-spacer />
      <button class="mac-icon-btn" title="重新整理" :disabled="loading" @click="$emit('refresh')">
        <v-icon size="18" :class="{ 'la-spin': loading }">mdi-refresh</v-icon>
      </button>
    </div>
    <div class="la-list__tools">
      <v-text-field
        v-model="q"
        placeholder="搜尋"
        prepend-inner-icon="mdi-magnify"
        variant="solo"
        flat
        density="compact"
        hide-details
        clearable
        class="mac-vfield mac-vfield--search"
      />
      <div class="mac-form-seg mac-form-seg--block">
        <button
          v-for="f in filters"
          :key="f.key"
          type="button"
          class="mac-form-seg-btn"
          :class="{ 'is-active': filter === f.key }"
          @click="filter = f.key"
        >
          {{ f.label }}<span v-if="f.count" class="la-list__count">{{ f.count }}</span>
        </button>
      </div>
    </div>
    <div class="la-list__body">
      <div v-if="loading && !conversations.length" class="mac-list-loading">載入中…</div>
      <div v-else-if="!shown.length" class="mac-list-empty">沒有對話</div>
      <button
        v-for="c in shown"
        :key="c.id"
        type="button"
        class="la-row"
        :class="{ 'is-active': c.id === selectedId }"
        @click="$emit('select', c.id)"
      >
        <LineAvatar :src="c.pictureUrl" :icon="TYPE_ICON[c.type]" />
        <div class="la-row__main">
          <div class="la-row__line">
            <span class="la-row__name">{{ c.name }}</span>
            <span class="la-row__time">{{ shortTime(c.lastMessageAt) }}</span>
          </div>
          <div class="la-row__line">
            <span class="la-row__preview">{{ preview(c) }}</span>
            <span v-if="c.unread" class="la-row__dot" />
          </div>
          <div class="la-row__tags">
            <span class="mac-tag">{{ TYPE_LABEL[c.type] }}</span>
            <span v-if="c.assignState === 'unassigned'" class="mac-tag la-tag--warn">待認領</span>
            <span v-if="!c.active" class="mac-tag">{{ c.type === 'user' ? '已封鎖' : '已離開' }}</span>
            <span v-if="channelCount > 1 && c.channelName" class="la-row__channel">{{ c.channelName }}</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import LineAvatar from './LineAvatar.vue';
import { shortTime, TYPE_ICON, TYPE_LABEL } from './useLineAi';

const props = defineProps({
  conversations: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  loading: { type: Boolean, default: false },
  canClaim: { type: Boolean, default: false },
  avoidMenu: { type: Boolean, default: false },
});
defineEmits(['select', 'refresh']);

const q = ref('');
const filter = ref('all');

const channelCount = computed(() => new Set(props.conversations.map(c => c.channelId)).size);
const unreadCount = computed(() => props.conversations.filter(c => c.unread).length);
const unassignedCount = computed(() => props.conversations.filter(c => c.assignState === 'unassigned').length);

const filters = computed(() => [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未讀', count: unreadCount.value },
  ...(props.canClaim ? [{ key: 'unassigned', label: '待認領', count: unassignedCount.value }] : []),
]);

const shown = computed(() => {
  const term = (q.value || '').trim().toLowerCase();
  return props.conversations.filter(c => {
    if (filter.value === 'unread' && !c.unread) return false;
    if (filter.value === 'unassigned' && c.assignState !== 'unassigned') return false;
    if (!term) return true;
    return [c.name, c.lineName, c.lastMessagePreview].some(v => String(v || '').toLowerCase().includes(term));
  });
});

function preview(c) {
  if (!c.lastMessagePreview) return '尚無訊息';
  return c.type === 'user' || !c.lastSenderName ? c.lastMessagePreview : `${c.lastSenderName}：${c.lastMessagePreview}`;
}
</script>

<style scoped>
.la-list { display: flex; flex-direction: column; min-height: 0; height: 100%; background: #fff; }
.la-list__head { display: flex; align-items: center; gap: 6px; min-height: 52px; padding: 10px 12px 4px 16px; }
.la-list__head--menu { padding-left: 58px; }
.la-list__title { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; }
.la-list__tools { display: flex; flex-direction: column; gap: 8px; padding: 4px 12px 10px; }
.la-list__count { margin-left: 4px; font-size: 11px; color: #0071e3; font-weight: 700; }
.la-list__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; border-top: 1px solid rgba(0, 0, 0, 0.08); }
.la-row { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-bottom: 1px solid #f0f0f3; background: #fff; text-align: left; font-family: inherit; color: #1d1d1f; cursor: pointer; }
.la-row:hover { background: #f7f7f9; }
.la-row.is-active { background: rgba(0, 113, 227, 0.09); }
.la-row__main { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.la-row__line { display: flex; align-items: center; gap: 8px; }
.la-row__name { flex: 1 1 auto; min-width: 0; font-size: 14.5px; font-weight: 600; overflow-wrap: anywhere; }
.la-row__time { flex-shrink: 0; font-size: 12px; color: #8e8e93; }
.la-row__preview { flex: 1 1 auto; min-width: 0; font-size: 13px; color: #6e6e73; display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; word-break: break-all; }
.la-row__dot { flex-shrink: 0; width: 9px; height: 9px; border-radius: 50%; background: #0071e3; }
.la-row__tags { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 2px; }
.la-row__channel { font-size: 11.5px; color: #8e8e93; }
.la-tag--warn { --mac-tag-bg: rgba(255, 159, 10, 0.16); --mac-tag-color: #b25f00; }
.la-spin { animation: la-spin 0.9s linear infinite; }
@keyframes la-spin { to { transform: rotate(360deg); } }
</style>
