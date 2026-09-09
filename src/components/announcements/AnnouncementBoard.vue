<template>
  <div v-if="visibleList.length > 0 || canManage" class="ab" :class="{ 'ab--collapsed': collapsed, 'ab--empty': visibleList.length === 0 }">
    <!-- 標題列（macOS 通知中心風格） -->
    <div class="ab-bar" @dblclick="toggleCollapsed">
      <button class="ab-chev" :title="collapsed ? '展開公告' : '收合公告'" @click="toggleCollapsed">
        <v-icon size="16">{{ collapsed ? 'mdi-chevron-right' : 'mdi-chevron-down' }}</v-icon>
      </button>
      <span class="ab-icon">
        <v-icon size="13" color="#fff">mdi-bullhorn-variant</v-icon>
        <span v-if="unreadCount" class="ab-icon-badge d-sm-none" :title="`${unreadCount} 則未讀`"></span>
      </span>
      <span class="ab-title d-none d-sm-inline">公告</span>
      <span v-if="visibleList.length" class="ab-count d-none d-sm-inline">{{ visibleList.length }}</span>
      <span v-if="unreadCount" class="ab-unread d-none d-sm-inline" :title="`${unreadCount} 則未讀`">{{ unreadCount }} 則未讀</span>

      <!-- 收合時：輪播公告標題（hover 暫停、可點開） -->
      <div
        v-if="collapsed && peekItem"
        class="ab-ticker"
        @mouseenter="tickerPaused = true"
        @mouseleave="tickerPaused = false"
      >
        <transition name="ab-ticker" mode="out-in">
          <button :key="peekItem.id" class="ab-peek" @click="openDetail(peekItem)">
            <v-icon v-if="peekItem.pinned" size="12" color="#ff9500" class="mr-1">mdi-pin</v-icon>
            <span class="ab-peek-dot" :style="{ background: levelMeta(peekItem.level).color }"></span>
            <span class="ab-peek-title" :class="{ 'ab-peek-title--unread': isUnread(peekItem) }">{{ peekItem.title }}</span>
          </button>
        </transition>
        <span v-if="visibleList.length > 1" class="ab-ticker-idx">{{ peekIndex + 1 }}/{{ visibleList.length }}</span>
        <button v-if="visibleList.length > 1" class="ab-ticker-nav" title="下一則" @click="stepPeek(1)"><v-icon size="14">mdi-chevron-right</v-icon></button>
      </div>
      <span v-else-if="visibleList.length === 0" class="ab-peek ab-peek--muted">目前沒有公告</span>

      <span class="ab-spacer"></span>
      <button v-if="unreadCount && !collapsed" class="ab-link" @click="markAllRead">全部已讀</button>
      <button v-if="canManage" class="ab-link ab-link--primary" title="公告管理" @click="openManager()">
        <v-icon size="14">mdi-cog-outline</v-icon><span class="d-none d-sm-inline ml-1">管理</span>
      </button>
    </div>

    <!-- 卡片列 -->
    <div v-show="!collapsed && visibleList.length > 0" class="ab-cards" ref="cardsRef">
      <button
        v-for="a in visibleList"
        :key="a.id"
        class="ab-card"
        :class="[`ab-card--${a.level || 'info'}`, { 'ab-card--pinned': a.pinned, 'ab-card--unread': isUnread(a) }]"
        @click="openDetail(a)"
      >
        <span class="ab-card-icon" :style="{ background: levelMeta(a.level).color }">
          <v-icon size="15" color="#fff">{{ levelMeta(a.level).icon }}</v-icon>
        </span>
        <span class="ab-card-body">
          <span class="ab-card-head">
            <span class="ab-card-title">
              <v-icon v-if="a.pinned" size="12" color="#ff9500" class="mr-1">mdi-pin</v-icon>{{ a.title }}
            </span>
            <span class="ab-card-time">{{ formatRelativeTime(a.createdAt, now) }}</span>
          </span>
          <span class="ab-card-text">{{ a.content || '（點擊查看圖片）' }}</span>
          <span v-if="(a.images || []).length || a.endAt" class="ab-card-foot">
            <span v-if="(a.images || []).length" class="ab-card-thumbs">
              <img v-for="img in a.images.slice(0, 3)" :key="img.path || img.url" :src="img.url" alt="" />
              <span v-if="a.images.length > 3" class="ab-card-thumb-more">+{{ a.images.length - 3 }}</span>
            </span>
            <span v-if="a.endAt" class="ab-card-remain"><v-icon size="11" class="mr-1">mdi-clock-outline</v-icon>{{ formatRemaining(a.endAt, now) }}</span>
          </span>
        </span>
        <span v-if="isUnread(a)" class="ab-card-dot"></span>
      </button>
    </div>

    <!-- 詳細內容（mac 視窗） -->
    <v-dialog v-model="detail.show" :max-width="isMobile ? undefined : 640" :fullscreen="isMobile" content-class="ab-dialog">
      <div v-if="detail.item" class="ab-win" :class="{ 'ab-win--mobile': isMobile }">
        <div class="ab-win-bar">
          <div class="ab-lights"><button class="ab-light ab-light--close" title="關閉" @click="detail.show = false"></button></div>
          <div class="ab-win-title">
            <v-icon size="13" :color="levelMeta(detail.item.level).color" class="mr-1">{{ levelMeta(detail.item.level).icon }}</v-icon>
            {{ levelMeta(detail.item.level).label }}公告
          </div>
          <div class="ab-win-right">
            <button v-if="visibleList.length > 1" class="ab-win-nav" title="上一則" @click="stepDetail(-1)"><v-icon size="16">mdi-chevron-up</v-icon></button>
            <button v-if="visibleList.length > 1" class="ab-win-nav" title="下一則" @click="stepDetail(1)"><v-icon size="16">mdi-chevron-down</v-icon></button>
          </div>
        </div>
        <div class="ab-win-body">
          <div class="ab-win-heading">
            <v-icon v-if="detail.item.pinned" size="14" color="#ff9500" class="mr-1">mdi-pin</v-icon>{{ detail.item.title }}
          </div>
          <div class="ab-win-meta">
            <span v-if="detail.item.authorName"><v-icon size="12">mdi-account-outline</v-icon> {{ detail.item.authorName }}</span>
            <span><v-icon size="12">mdi-calendar-outline</v-icon> {{ formatDateTime(detail.item.createdAt) }}</span>
            <span v-if="detail.item.endAt"><v-icon size="12">mdi-clock-outline</v-icon> 至 {{ formatDateTime(detail.item.endAt) }}（{{ formatRemaining(detail.item.endAt, now) }}）</span>
          </div>
          <div v-if="detail.item.content" class="ab-win-content" v-html="contentToHtml(detail.item.content)"></div>
          <div v-if="(detail.item.images || []).length" class="ab-win-images">
            <img
              v-for="(img, i) in detail.item.images"
              :key="img.path || img.url"
              :src="img.url"
              :alt="img.name"
              @click="openLightbox(detail.item.images, i)"
            />
          </div>
        </div>
        <div class="ab-win-foot">
          <span class="ab-win-idx" v-if="visibleList.length > 1">{{ detailIndex + 1 }} / {{ visibleList.length }}</span>
          <span class="ab-spacer"></span>
          <button v-if="canManage" class="ab-push" @click="openManager(detail.item)"><v-icon size="14" class="mr-1">mdi-pencil-outline</v-icon>編輯</button>
          <button class="ab-push ab-push--primary" @click="detail.show = false">關閉</button>
        </div>
      </div>
    </v-dialog>

    <!-- 進入頁面強制提醒（燈箱） -->
    <v-dialog v-model="popup.show" :max-width="isMobile ? undefined : 560" :fullscreen="isMobile" persistent no-click-animation content-class="ab-dialog">
      <div v-if="popupItem" class="ab-win ab-win--popup" :class="{ 'ab-win--mobile': isMobile }">
        <div class="ab-win-bar ab-win-bar--popup" :style="{ '--c': levelMeta(popupItem.level).color }">
          <div class="ab-lights"><span class="ab-light ab-light--close ab-light--disabled"></span></div>
          <div class="ab-win-title"><v-icon size="13" class="mr-1" color="#fff">mdi-bell-ring-outline</v-icon>重要公告提醒</div>
          <div class="ab-win-right"><span class="ab-win-idx ab-win-idx--light" v-if="popup.queue.length > 1">{{ popup.index + 1 }} / {{ popup.queue.length }}</span></div>
        </div>
        <div class="ab-win-body">
          <div class="ab-popup-level" :style="{ '--c': levelMeta(popupItem.level).color }">
            <v-icon size="16" :color="levelMeta(popupItem.level).color" class="mr-1">{{ levelMeta(popupItem.level).icon }}</v-icon>{{ levelMeta(popupItem.level).label }}
          </div>
          <div class="ab-win-heading">{{ popupItem.title }}</div>
          <div class="ab-win-meta">
            <span v-if="popupItem.authorName"><v-icon size="12">mdi-account-outline</v-icon> {{ popupItem.authorName }}</span>
            <span><v-icon size="12">mdi-calendar-outline</v-icon> {{ formatDateTime(popupItem.createdAt) }}</span>
          </div>
          <div v-if="popupItem.content" class="ab-win-content" v-html="contentToHtml(popupItem.content)"></div>
          <div v-if="(popupItem.images || []).length" class="ab-win-images">
            <img v-for="(img, i) in popupItem.images" :key="img.path || img.url" :src="img.url" :alt="img.name" @click="openLightbox(popupItem.images, i)" />
          </div>
        </div>
        <div class="ab-win-foot">
          <label class="ab-check">
            <input v-model="popup.ackAll" type="checkbox" />
            <span>其餘 {{ Math.max(0, popup.queue.length - popup.index - 1) }} 則一併確認</span>
          </label>
          <span class="ab-spacer"></span>
          <button class="ab-push ab-push--primary" @click="ackPopup">我知道了</button>
        </div>
      </div>
    </v-dialog>

    <!-- 圖片燈箱 -->
    <v-dialog v-model="lightbox.show" max-width="1000" content-class="ab-dialog">
      <div class="ab-lb" @click.self="lightbox.show = false">
        <button class="ab-lb-close" @click="lightbox.show = false"><v-icon size="18" color="#fff">mdi-close</v-icon></button>
        <button v-if="lightbox.list.length > 1" class="ab-lb-nav ab-lb-nav--prev" @click.stop="stepLightbox(-1)"><v-icon size="26" color="#fff">mdi-chevron-left</v-icon></button>
        <img :key="lightboxUrl" :src="lightboxUrl" alt="" class="ab-lb-img" @click.stop="stepLightbox(1)" />
        <button v-if="lightbox.list.length > 1" class="ab-lb-nav ab-lb-nav--next" @click.stop="stepLightbox(1)"><v-icon size="26" color="#fff">mdi-chevron-right</v-icon></button>
        <span v-if="lightbox.list.length > 1" class="ab-lb-count">{{ lightbox.index + 1 }} / {{ lightbox.list.length }}</span>
      </div>
    </v-dialog>

    <!-- 管理視窗 -->
    <AnnouncementManagerDialog
      v-if="canManage"
      ref="managerRef"
      v-model="manager.show"
      :project-id="projectId"
      :project-name="projectName"
      :announcements="announcements"
      :default-target="mode"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useDisplay } from 'vuetify';
import AnnouncementManagerDialog from './AnnouncementManagerDialog.vue';
import {
  listenToProjectAnnouncements, isAnnouncementVisible, sortForDisplay, levelMeta, toDate,
  formatRelativeTime, formatDateTime, formatRemaining, contentToHtml,
} from '@/services/announcementService';

const props = defineProps({
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  mode: { type: String, default: 'sales' },   // 'sales' | 'quote'
  canManage: { type: Boolean, default: false },
});

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const announcements = ref([]);
const now = ref(new Date());
const collapsed = ref(true);   // 預設收合，僅顯示輪播標題
const peekIndex = ref(0);
const tickerPaused = ref(false);
const TICKER_INTERVAL_MS = 4000;
let tickerTimer = null;
const seen = ref({});      // id -> updatedAt millis（已讀）
const acked = ref({});     // id -> updatedAt millis（燈箱已確認）
const detail = ref({ show: false, item: null });
const popup = ref({ show: false, queue: [], index: 0, ackAll: false });
const lightbox = ref({ show: false, list: [], index: 0 });
const manager = ref({ show: false });
const managerRef = ref(null);
const cardsRef = ref(null);

let unsubscribe = null;
let tick = null;

// ---------- 儲存鍵 ----------
const collapsedKey = computed(() => `anx_ann_collapsed_${props.projectId}_${props.mode}`);
const seenKey = computed(() => `anx_ann_seen_${props.projectId}`);
const ackKey = computed(() => `anx_ann_ack_${props.projectId}`);

function loadJson(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
}
function saveJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* noop */ }
}

function versionOf(a) { return toDate(a.updatedAt)?.getTime() || toDate(a.createdAt)?.getTime() || 0; }

// ---------- 顯示清單 ----------
const visibleList = computed(() => sortForDisplay(announcements.value.filter(a => isAnnouncementVisible(a, props.mode, now.value))));
function isUnread(a) { return (seen.value[a.id] || 0) < versionOf(a); }
const unreadCount = computed(() => visibleList.value.filter(isUnread).length);

function toggleCollapsed() {
  collapsed.value = !collapsed.value;
  saveJson(collapsedKey.value, collapsed.value);
}

// ---------- 收合輪播 ----------
const peekItem = computed(() => {
  const n = visibleList.value.length;
  if (n === 0) return null;
  return visibleList.value[((peekIndex.value % n) + n) % n];
});
function stepPeek(delta) {
  const n = visibleList.value.length;
  if (n === 0) return;
  peekIndex.value = ((peekIndex.value + delta) % n + n) % n;
}
function startTicker() {
  stopTicker();
  tickerTimer = setInterval(() => {
    if (!collapsed.value || tickerPaused.value || detail.value.show || popup.value.show || document.hidden) return;
    if (visibleList.value.length > 1) stepPeek(1);
  }, TICKER_INTERVAL_MS);
}
function stopTicker() {
  if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null; }
}
watch(() => visibleList.value.length, (n) => { if (n === 0) peekIndex.value = 0; else peekIndex.value %= n; });

function markRead(a) {
  if (!isUnread(a)) return;
  seen.value = { ...seen.value, [a.id]: versionOf(a) };
  saveJson(seenKey.value, seen.value);
}
function markAllRead() {
  const next = { ...seen.value };
  visibleList.value.forEach(a => { next[a.id] = versionOf(a); });
  seen.value = next;
  saveJson(seenKey.value, next);
}

// ---------- 詳細視窗 ----------
const detailIndex = computed(() => visibleList.value.findIndex(a => a.id === detail.value.item?.id));
function openDetail(a) {
  detail.value = { show: true, item: a };
  markRead(a);
}
function stepDetail(delta) {
  const n = visibleList.value.length;
  if (n <= 1) return;
  const i = (Math.max(0, detailIndex.value) + delta + n) % n;
  openDetail(visibleList.value[i]);
}

// ---------- 燈箱 ----------
const lightboxUrl = computed(() => lightbox.value.list[lightbox.value.index]?.url || '');
function openLightbox(list, index) { lightbox.value = { show: true, list: list || [], index: index || 0 }; }
function stepLightbox(delta) {
  const n = lightbox.value.list.length;
  if (n <= 1) return;
  lightbox.value.index = (lightbox.value.index + delta + n) % n;
}

// ---------- 強制提醒 ----------
const popupItem = computed(() => popup.value.queue[popup.value.index] || null);
function pendingPopups() {
  return visibleList.value.filter(a => a.popup && (acked.value[a.id] || 0) < versionOf(a));
}
function checkPopups() {
  if (popup.value.show || manager.value.show) return;
  const queue = pendingPopups();
  if (queue.length === 0) return;
  popup.value = { show: true, queue, index: 0, ackAll: false };
}
function ackOne(a) {
  acked.value = { ...acked.value, [a.id]: versionOf(a) };
  markRead(a);
}
function ackPopup() {
  const item = popupItem.value;
  if (!item) { popup.value.show = false; return; }
  if (popup.value.ackAll) {
    popup.value.queue.slice(popup.value.index).forEach(ackOne);
    saveJson(ackKey.value, acked.value);
    popup.value.show = false;
    return;
  }
  ackOne(item);
  saveJson(ackKey.value, acked.value);
  if (popup.value.index + 1 < popup.value.queue.length) popup.value.index += 1;
  else popup.value.show = false;
}

// ---------- 管理 ----------
function openManager(item = null) {
  detail.value.show = false;
  manager.value.show = true;
  if (item) setTimeout(() => managerRef.value?.startEdit?.(item), 50);
}
defineExpose({ openManager });

// ---------- 訂閱 ----------
function subscribe() {
  if (unsubscribe) { unsubscribe(); unsubscribe = null; }
  announcements.value = [];
  if (!props.projectId) return;
  unsubscribe = listenToProjectAnnouncements(props.projectId, (list) => {
    announcements.value = list;
    // 若正在看的公告被更新，同步內容
    if (detail.value.item) {
      const fresh = list.find(a => a.id === detail.value.item.id);
      if (fresh) detail.value.item = fresh; else detail.value.show = false;
    }
    checkPopups();
  });
}

function loadLocalState() {
  collapsed.value = loadJson(collapsedKey.value, true) !== false;
  seen.value = loadJson(seenKey.value, {});
  acked.value = loadJson(ackKey.value, {});
}

watch(() => props.projectId, () => { loadLocalState(); subscribe(); });
watch(() => props.mode, () => { collapsed.value = loadJson(collapsedKey.value, true) !== false; checkPopups(); });
watch(() => manager.value.show, (v) => { if (!v) checkPopups(); });

onMounted(() => {
  loadLocalState();
  subscribe();
  tick = setInterval(() => { now.value = new Date(); checkPopups(); }, 60000);
  startTicker();
});
onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe();
  if (tick) clearInterval(tick);
  stopTicker();
});
</script>

<style scoped>
/* 變數同時定義在視窗／燈箱上：v-dialog 會被移到 body，讀不到 .ab 上的變數 */
.ab, .ab-win, .ab-lb {
  --f: -apple-system, BlinkMacSystemFont, "SF Pro Text", "PingFang TC", "Helvetica Neue", "Noto Sans TC", sans-serif;
  --blue: #0a7aff;
}
.ab {
  font-family: var(--f);
  flex-shrink: 0;
  margin: 0 0 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 0 0 0.5px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}
.ab--collapsed { border-radius: 10px; }
.ab--empty .ab-bar { opacity: 0.85; }

.ab-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 10px 0 6px;
  font-size: 13px;
  color: #1d1d1f;
  user-select: none;
}
.ab-chev {
  width: 24px; height: 24px; border: none; border-radius: 6px; background: transparent; color: rgba(0,0,0,.55); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.ab-chev:hover { background: rgba(0,0,0,.06); }
.ab-icon {
  position: relative; flex-shrink: 0;
  width: 20px; height: 20px; border-radius: 6px; background: linear-gradient(#ff6259, #ff3b30);
  display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,.2);
}
.ab-icon-badge { position: absolute; top: -3px; right: -3px; width: 9px; height: 9px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 2px #fff; }
.ab-title { font-weight: 700; }
.ab-count { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: rgba(0,0,0,.08); color: rgba(0,0,0,.6); }
.ab-unread { font-size: 11px; font-weight: 600; padding: 1px 7px; border-radius: 999px; background: var(--blue); color: #fff; }
.ab-ticker { display: flex; align-items: center; gap: 4px; min-width: 0; flex: 1; margin-left: 8px; overflow: hidden; }
.ab-ticker-idx { font-size: 11px; color: rgba(0,0,0,.45); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.ab-ticker-nav { width: 22px; height: 22px; border: none; border-radius: 6px; background: transparent; color: rgba(0,0,0,.5); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ab-ticker-nav:hover { background: rgba(0,0,0,.06); }
.ab-ticker-enter-active, .ab-ticker-leave-active { transition: opacity .22s ease, transform .22s ease; }
.ab-ticker-enter-from { opacity: 0; transform: translateY(8px); }
.ab-ticker-leave-to { opacity: 0; transform: translateY(-8px); }
.ab-peek-title--unread { font-weight: 600; }
.ab-peek {
  display: inline-flex; align-items: center; gap: 6px; min-width: 0; flex: 1; padding: 2px 8px;
  border: none; border-radius: 6px; background: transparent; font-family: var(--f); font-size: 12px; color: #3a3a3c; cursor: pointer;
}
.ab-peek:hover { background: rgba(0,0,0,.05); }
.ab-peek--muted { color: rgba(0,0,0,.4); cursor: default; }
.ab-peek-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ab-peek-title { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; text-align: left; }
.ab-peek-more { color: rgba(0,0,0,.45); flex-shrink: 0; }
.ab-spacer { flex: 1; }
.ab-link {
  height: 24px; padding: 0 10px; border: none; border-radius: 6px; background: transparent; color: var(--blue);
  font-family: var(--f); font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center;
}
.ab-link:hover { background: rgba(10,122,255,.1); }
.ab-link--primary { background: rgba(10,122,255,.1); }

/* 卡片列 */
.ab-cards {
  display: flex;
  gap: 8px;
  padding: 0 10px 10px;
  overflow-x: auto;
  scroll-snap-type: x proximity;
  scrollbar-width: thin;
}
.ab-card {
  position: relative;
  flex: 0 0 300px;
  max-width: 300px;
  display: flex;
  gap: 10px;
  padding: 10px 12px;
  text-align: left;
  border: none;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 0 0 0.5px rgba(0,0,0,.08);
  cursor: pointer;
  font-family: var(--f);
  color: #1d1d1f;
  scroll-snap-align: start;
  transition: transform .12s, box-shadow .12s;
}
.ab-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,.12), 0 0 0 0.5px rgba(0,0,0,.08); }
.ab-card--pinned { background: linear-gradient(rgba(255,204,0,.14), rgba(255,255,255,.92)); }
.ab-card--urgent { box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 0 0 1px rgba(255,59,48,.45); }
.ab-card--important { box-shadow: 0 1px 3px rgba(0,0,0,.08), 0 0 0 1px rgba(255,149,0,.4); }
.ab-card-icon { width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0,0,0,.2); }
.ab-card-body { min-width: 0; flex: 1; display: flex; flex-direction: column; gap: 2px; }
.ab-card-head { display: flex; align-items: baseline; gap: 6px; }
.ab-card-title { font-weight: 700; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
.ab-card-time { font-size: 11px; color: rgba(0,0,0,.45); flex-shrink: 0; }
.ab-card-text {
  font-size: 12px; color: #3a3a3c; line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; white-space: pre-line;
}
.ab-card-foot { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.ab-card-thumbs { display: inline-flex; gap: 4px; align-items: center; }
.ab-card-thumbs img { width: 30px; height: 30px; object-fit: cover; border-radius: 5px; box-shadow: 0 0 0 0.5px rgba(0,0,0,.15); }
.ab-card-thumb-more { font-size: 11px; color: rgba(0,0,0,.5); }
.ab-card-remain { font-size: 11px; color: rgba(0,0,0,.5); display: inline-flex; align-items: center; margin-left: auto; }
.ab-card-dot { position: absolute; top: 10px; right: 10px; width: 8px; height: 8px; border-radius: 50%; background: var(--blue); box-shadow: 0 0 0 2px #fff; }
.ab-card--unread .ab-card-time { padding-right: 12px; }

/* mac 視窗 */
.ab-win {
  font-family: var(--f); font-size: 13px; color: #1d1d1f; background: #f5f5f7; border-radius: 12px; overflow: hidden;
  display: flex; flex-direction: column; max-height: 86vh; box-shadow: 0 30px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.12);
}
.ab-win--mobile { max-height: none; height: 100vh; height: 100dvh; border-radius: 0; }
.ab-win-bar {
  position: relative; height: 40px; display: flex; align-items: center; padding: 0 12px; flex-shrink: 0;
  background: linear-gradient(#ececec, #e2e2e2); border-bottom: 1px solid rgba(0,0,0,.14);
}
.ab-win-bar--popup { background: linear-gradient(color-mix(in srgb, var(--c) 92%, #fff), var(--c)); border-bottom-color: rgba(0,0,0,.2); }
.ab-win-bar--popup .ab-win-title { color: #fff; }
.ab-lights { display: flex; gap: 8px; z-index: 1; }
.ab-light { width: 12px; height: 12px; border-radius: 50%; border: 1px solid rgba(0,0,0,.15); padding: 0; cursor: pointer; display: inline-block; }
.ab-light--close { background: #ff5f57; }
.ab-light--disabled { background: #d1d1d6; cursor: default; }
.ab-win-title { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: center; pointer-events: none; font-weight: 600; color: #3a3a3c; }
.ab-win-right { margin-left: auto; z-index: 1; display: flex; gap: 2px; align-items: center; }
.ab-win-nav { width: 26px; height: 24px; border: none; border-radius: 6px; background: rgba(0,0,0,.06); color: #3a3a3c; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
.ab-win-nav:hover { background: rgba(0,0,0,.12); }
.ab-win-body { flex: 1; min-height: 0; overflow-y: auto; padding: 18px 20px; }
.ab-popup-level { display: inline-flex; align-items: center; font-size: 12px; font-weight: 700; color: var(--c); padding: 2px 10px 2px 6px; border-radius: 999px; background: color-mix(in srgb, var(--c) 12%, transparent); margin-bottom: 8px; }
.ab-win-heading { font-size: 17px; font-weight: 700; line-height: 1.35; display: flex; align-items: center; }
.ab-win-meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 11px; color: rgba(0,0,0,.5); margin-top: 6px; }
.ab-win-meta span { display: inline-flex; align-items: center; gap: 3px; }
.ab-win-content { margin-top: 14px; font-size: 14px; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
.ab-win-content :deep(a) { color: var(--blue); }
.ab-win-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; margin-top: 14px; }
.ab-win-images img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; cursor: zoom-in; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.ab-win-foot { display: flex; align-items: center; gap: 8px; padding: 10px 16px; border-top: 1px solid rgba(0,0,0,.1); background: #ececec; flex-shrink: 0; }
.ab-win-idx { font-size: 11px; color: rgba(0,0,0,.5); font-variant-numeric: tabular-nums; }
.ab-win-idx--light { color: rgba(255,255,255,.85); }
.ab-check { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #3a3a3c; cursor: pointer; }
.ab-check input { accent-color: var(--blue); }
.ab-push {
  height: 28px; padding: 0 14px; border-radius: 7px; border: 1px solid rgba(0,0,0,.16); background: linear-gradient(#fff, #f2f2f2);
  color: #1d1d1f; font-family: var(--f); font-size: 13px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; box-shadow: 0 1px 1px rgba(0,0,0,.06);
}
.ab-push:hover { background: linear-gradient(#fafafa, #e9e9e9); }
.ab-push--primary { background: linear-gradient(#2f8dff, #0a7aff); border-color: #0a6ae0; color: #fff !important; font-weight: 700; min-width: 96px; justify-content: center; text-shadow: 0 1px 1px rgba(0,0,0,.2); }
.ab-push--primary:hover { background: linear-gradient(#2a82ee, #0a6ae0); }

/* 燈箱 */
.ab-lb { position: relative; display: flex; align-items: center; justify-content: center; min-height: 200px; padding: 40px 56px; }
.ab-lb-img { max-width: 100%; max-height: 82vh; border-radius: 6px; box-shadow: 0 20px 60px rgba(0,0,0,.6); cursor: pointer; animation: ab-fade .18s ease-out; }
@keyframes ab-fade { from { opacity: 0; transform: scale(.985); } to { opacity: 1; transform: scale(1); } }
.ab-lb-close { position: absolute; top: 4px; right: 12px; width: 32px; height: 32px; border: none; border-radius: 50%; background: rgba(0,0,0,.5); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ab-lb-nav { position: absolute; top: 50%; transform: translateY(-50%); width: 40px; height: 64px; border: none; border-radius: 10px; background: rgba(0,0,0,.45); cursor: pointer; display: flex; align-items: center; justify-content: center; }
.ab-lb-nav:hover { background: rgba(0,0,0,.7); }
.ab-lb-nav--prev { left: 8px; }
.ab-lb-nav--next { right: 8px; }
.ab-lb-count { position: absolute; bottom: 10px; left: 0; right: 0; text-align: center; color: #fff; font-size: 12px; text-shadow: 0 1px 2px rgba(0,0,0,.6); }

/* 📱 手機／平板（<960px 桌面工具列隱藏）：公告列位於頁面最上方，
   必須避開全站浮動漢堡鈕（DefaultLayout fixed top:10 left:10，約 40px 寬高）：
   左側讓出 46px、列高拉到 40px 讓卡片列從漢堡鈕下緣（y≈50px）之後開始 */
@media (max-width: 959.98px) {
  .ab-bar { padding-left: 46px; height: 40px; }
}
@media (max-width: 600px) {
  .ab { margin: 0 0 6px; border-radius: 10px; }
  .ab-card { flex: 0 0 82vw; max-width: 82vw; }
  .ab-bar { padding: 0 6px 0 46px; gap: 4px; }
  .ab-ticker { margin-left: 2px; }
  .ab-peek { padding: 2px 4px; }
  .ab-link--primary { width: 28px; padding: 0; justify-content: center; }
  .ab-lb { padding: 40px 8px; }
}
</style>

<style>
.ab-dialog { box-shadow: none !important; overflow: visible !important; }
</style>
