<template>
  <div ref="scroller" class="la-thread" @scroll.passive="onScroll">
    <div v-if="hasMore" class="la-thread__more">
      <button class="mac-link-btn" :disabled="loadingMore" @click="$emit('load-more')">{{ loadingMore ? '載入中…' : '載入更早的訊息' }}</button>
    </div>
    <div v-if="!messages.length" class="mac-list-empty">尚無訊息</div>
    <template v-for="item in items" :key="item.key">
      <div v-if="item.kind === 'day'" class="la-thread__day"><span>{{ item.label }}</span></div>
      <div v-else class="la-msg" :class="{ 'la-msg--mine': item.mine }">
        <div class="la-msg__col">
          <div v-if="item.showName" class="la-msg__name">
            {{ item.m.senderRole === 'bot' ? `官方帳號${item.m.sentByName ? `・${item.m.sentByName}` : ''}` : item.m.senderName }}
            <span v-if="item.m.senderRole === 'staff' && !item.mine" class="la-msg__staff">同仁</span>
          </div>
          <div class="la-msg__row">
            <div class="la-msg__bubble" :class="bubbleClass(item.m)">
              <template v-if="item.m.type === 'text'">{{ item.m.text }}</template>
              <img
                v-else-if="item.m.type === 'sticker' && item.m.sticker?.stickerId"
                class="la-msg__sticker"
                :src="`https://stickershop.line-scdn.net/stickershop/v1/sticker/${item.m.sticker.stickerId}/android/sticker.png`"
                alt="貼圖"
                @error="e => (e.target.style.display = 'none')"
              />
              <button v-else-if="item.m.media?.stored" class="la-msg__file" @click="$emit('open-media', item.m)">
                <v-icon size="18">{{ mediaIcon(item.m.type) }}</v-icon>
                <span>{{ mediaLabel(item.m) }}</span>
              </button>
              <span v-else-if="item.m.type === 'location'" class="la-msg__file">
                <v-icon size="18">mdi-map-marker</v-icon><span>{{ item.m.location?.title || item.m.location?.address || '位置' }}</span>
              </span>
              <span v-else class="la-msg__muted">{{ mediaLabel(item.m) }}</span>
            </div>
            <span class="la-msg__time">{{ time(item.m.createdAt) }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';

const props = defineProps({
  messages: { type: Array, default: () => [] },
  hasMore: { type: Boolean, default: false },
  loadingMore: { type: Boolean, default: false },
  conversationId: { type: String, default: null },
});
defineEmits(['load-more', 'open-media']);

const scroller = ref(null);
const nearBottom = ref(true);
const tz = { timeZone: 'Asia/Taipei' };

const items = computed(() => {
  const out = [];
  let lastDay = null;
  let lastSender = null;
  for (const m of props.messages) {
    const d = m.createdAt ? new Date(m.createdAt) : null;
    const day = d ? d.toLocaleDateString('en-CA', tz) : '';
    if (day && day !== lastDay) {
      out.push({ kind: 'day', key: `d-${day}`, label: d.toLocaleDateString('zh-TW', { ...tz, month: 'long', day: 'numeric', weekday: 'short' }) });
      lastDay = day;
      lastSender = null;
    }
    const mine = m.isMe || m.senderRole === 'bot';
    const senderKey = m.senderRole === 'bot' ? `bot-${m.sentByName}` : m.senderName;
    out.push({ kind: 'msg', key: m.id, m, mine, showName: senderKey !== lastSender && !(m.isMe && m.senderRole !== 'bot') });
    lastSender = senderKey;
  }
  return out;
});

function time(iso) {
  return iso ? new Date(iso).toLocaleTimeString('zh-TW', { ...tz, hour: '2-digit', minute: '2-digit', hour12: false }) : '';
}

function bubbleClass(m) {
  return {
    'la-msg__bubble--me': m.isMe && m.senderRole !== 'bot',
    'la-msg__bubble--bot': m.senderRole === 'bot',
    'la-msg__bubble--plain': m.type === 'sticker',
  };
}

const ICONS = { image: 'mdi-image-outline', file: 'mdi-paperclip', audio: 'mdi-microphone-outline', video: 'mdi-video-outline' };
const mediaIcon = type => ICONS[type] || 'mdi-file-outline';

function mediaLabel(m) {
  if (m.type === 'image') return '圖片';
  if (m.type === 'audio') return '語音';
  if (m.type === 'video') return m.media?.stored ? '影片' : '影片（未保存）';
  if (m.type === 'file') {
    const size = m.media?.size ? `（${(m.media.size / 1024 / 1024).toFixed(1)}MB）` : '';
    return `${m.media?.fileName || '檔案'}${size}`;
  }
  if (m.type === 'sticker') return '[貼圖]';
  return '[訊息]';
}

function onScroll() {
  const el = scroller.value;
  if (el) nearBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
}

function scrollToBottom() {
  nextTick(() => { const el = scroller.value; if (el) el.scrollTop = el.scrollHeight; });
}

// 換對話一律捲到底；同一對話有新訊息時，使用者在底部才跟著捲
watch(() => props.conversationId, () => { nearBottom.value = true; scrollToBottom(); });
watch(() => props.messages.length && props.messages[props.messages.length - 1]?.id, (now, before) => {
  if (now !== before && nearBottom.value) scrollToBottom();
});

// 往上載入更早的訊息時，維持目前看到的位置
function keepPosition(update) {
  const el = scroller.value;
  const before = el ? el.scrollHeight - el.scrollTop : 0;
  update();
  nextTick(() => { if (el) el.scrollTop = el.scrollHeight - before; });
}

defineExpose({ scrollToBottom, keepPosition });
</script>

<style scoped>
.la-thread { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 12px 14px 16px; background: #f5f5f7; }
.la-thread__more { text-align: center; padding: 4px 0 10px; }
.la-thread__day { display: flex; justify-content: center; margin: 12px 0 8px; }
.la-thread__day span { padding: 2px 10px; border-radius: 10px; background: rgba(0, 0, 0, 0.06); color: #6e6e73; font-size: 12px; }
.la-msg { display: flex; margin: 3px 0; }
.la-msg--mine { justify-content: flex-end; }
.la-msg__col { display: flex; flex-direction: column; max-width: min(78%, 560px); }
.la-msg--mine .la-msg__col { align-items: flex-end; }
.la-msg__name { display: flex; align-items: center; gap: 4px; margin: 6px 4px 2px; font-size: 12px; color: #6e6e73; }
.la-msg__staff { padding: 0 5px; border-radius: 4px; background: rgba(0, 113, 227, 0.1); color: #0058b0; font-size: 10.5px; font-weight: 600; }
.la-msg__row { display: flex; align-items: flex-end; gap: 6px; }
.la-msg--mine .la-msg__row { flex-direction: row-reverse; }
.la-msg__bubble { padding: 8px 12px; border-radius: 16px; background: #fff; color: #1d1d1f; font-size: 14.5px; line-height: 1.5; white-space: pre-wrap; overflow-wrap: anywhere; box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.08); }
.la-msg__bubble--me { background: #0a84ff; color: #fff; }
.la-msg__bubble--bot { background: #e4f0ff; color: #1d1d1f; }
.la-msg__bubble--plain { padding: 0; background: transparent; box-shadow: none; }
.la-msg__sticker { display: block; width: 110px; height: auto; }
.la-msg__file { display: inline-flex; align-items: center; gap: 6px; border: 0; padding: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }
.la-msg__bubble--me .la-msg__file .v-icon { color: #fff; }
.la-msg__muted { color: #8e8e93; }
.la-msg__time { flex-shrink: 0; font-size: 11px; color: #8e8e93; }
</style>
