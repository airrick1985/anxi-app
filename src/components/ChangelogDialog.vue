<!-- src/components/ChangelogDialog.vue -->
<!-- ✅ HOME「更新日誌」終端機視窗：讀取 public/changelog.json（generateReleaseNotes.js 產生，
     含 CHANGELOG.md 全部歷史版本），以工程師 IDE／終端機風格呈現，類似 git log 可逐版展開。
     電腦版固定寬度置中、手機版全螢幕；僅登入內部人員的 HOME 會掛載此元件。 -->
<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 820"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <div class="term" :class="{ 'term--mobile': isMobile }">
      <!-- 視窗標題列（macOS 紅黃綠 + 標題） -->
      <header class="term__titlebar">
        <div class="term__lights" aria-hidden="true">
          <span class="term__light term__light--r" />
          <span class="term__light term__light--y" />
          <span class="term__light term__light--g" />
        </div>
        <span class="term__titletext">changelog — anxi-app — {{ entries.length }} releases</span>
        <button type="button" class="term__close" aria-label="關閉" @click="$emit('update:modelValue', false)">✕</button>
      </header>

      <!-- 搜尋列：grep 提示符 -->
      <div class="term__search">
        <span class="term__prompt-sym">❯</span>
        <span class="term__grep">grep</span>
        <input
          v-model="keyword"
          class="term__input"
          type="text"
          placeholder="搜尋更新內容 / 版本號 / 日期…"
          spellcheck="false"
        />
        <button v-if="keyword" type="button" class="term__clear" aria-label="清除搜尋" @click="keyword = ''">✕</button>
      </div>

      <!-- 內容捲動區 -->
      <div class="term__body">
        <div v-if="loading" class="term__state">
          <span class="term__state-line">$ git log --oneline</span>
          <span class="term__state-line term__state-line--dim">loading changelog<span class="term__cursor" />…</span>
        </div>

        <div v-else-if="loadError" class="term__state">
          <span class="term__state-line term__state-line--err">error: failed to load changelog.json</span>
          <button type="button" class="term__retry" @click="fetchChangelog">$ retry</button>
        </div>

        <div v-else-if="shownEntries.length === 0" class="term__state">
          <span class="term__state-line term__state-line--dim">grep: 「{{ keyword }}」 no matches found</span>
        </div>

        <template v-else>
          <section
            v-for="entry in shownEntries"
            :key="entry.version"
            class="commit"
            :class="{ 'commit--open': isOpen(entry.version) }"
          >
            <!-- git log 一行（可點擊展開） -->
            <button type="button" class="commit__head" @click="toggle(entry.version)">
              <span class="commit__arrow">{{ isOpen(entry.version) ? '▾' : '▸' }}</span>
              <span class="commit__graph">*</span>
              <span class="commit__version">v{{ entry.version }}</span>
              <span class="commit__date">{{ entry.date }} ({{ weekday(entry.date) }})</span>
              <span class="commit__count">[{{ entry.notes.length }} 項]</span>
              <span v-if="!isOpen(entry.version)" class="commit__summary">{{ entry.notes[0]?.text }}</span>
            </button>

            <!-- 展開內容：diff 風格逐行列出 -->
            <v-expand-transition>
              <div v-show="isOpen(entry.version)" class="commit__content">
                <div v-for="(note, i) in entry.notes" :key="i" class="commit__line">
                  <span class="commit__plus">+</span>
                  <span class="commit__tag" :class="`commit__tag--${note.type}`">{{ typeLabel(note.type) }}:</span>
                  <span class="commit__text">{{ note.text }}</span>
                </div>
              </div>
            </v-expand-transition>
          </section>

          <button v-if="hasMore" type="button" class="term__more" @click="shownCount += PAGE_SIZE">
            <span class="term__prompt-sym">❯</span> git log --skip={{ shownCount }}
    <span class="term__more-hint"># 載入更早的 {{ Math.min(PAGE_SIZE, filteredEntries.length - shownCount) }} 版（還有 {{ filteredEntries.length - shownCount }} 版）</span>
          </button>

          <!-- 結尾提示符 -->
          <div class="term__prompt-end" aria-hidden="true">
            <span class="term__prompt-sym">❯</span><span class="term__cursor" />
          </div>
        </template>
      </div>

      <!-- IDE 底部狀態列 -->
      <footer class="term__statusbar">
        <span class="term__status-item">⎇ main</span>
        <span class="term__status-item">{{ filteredEntries.length }} / {{ entries.length }} versions</span>
        <span class="term__status-spacer" />
        <span class="term__status-item">UTF-8</span>
        <span class="term__status-item">CHANGELOG.md</span>
      </footer>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});
defineEmits(['update:modelValue']);

const { smAndDown } = useDisplay();
const isMobile = computed(() => smAndDown.value);

const PAGE_SIZE = 15;

const entries = ref([]);
const loading = ref(false);
const loadError = ref(false);
const loaded = ref(false);
const keyword = ref('');
const shownCount = ref(PAGE_SIZE);
const openSet = ref(new Set());

// 終端機風格：以 conventional-commit 前綴呈現分類
const TYPE_LABELS = { feature: 'feat', fix: 'fix', improve: 'perf', other: 'chore' };
const typeLabel = (type) => TYPE_LABELS[type] || TYPE_LABELS.other;

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const weekday = (dateStr) => {
  const [y, m, d] = String(dateStr || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return `週${WEEKDAYS[new Date(y, m - 1, d).getDay()]}`;
};

const filteredEntries = computed(() => {
  const kw = (keyword.value || '').trim().toLowerCase();
  if (!kw) return entries.value;
  return entries.value.filter(entry =>
    entry.version.toLowerCase().includes(kw) ||
    entry.date.includes(kw) ||
    entry.notes.some(note => note.text.toLowerCase().includes(kw))
  );
});

const shownEntries = computed(() => filteredEntries.value.slice(0, shownCount.value));
const hasMore = computed(() => filteredEntries.value.length > shownCount.value);

const isOpen = (version) => openSet.value.has(version);
const toggle = (version) => {
  const next = new Set(openSet.value);
  if (next.has(version)) next.delete(version);
  else next.add(version);
  openSet.value = next;
};

const fetchChangelog = async () => {
  loading.value = true;
  loadError.value = false;
  try {
    const res = await fetch('/changelog.json?_t=' + Date.now());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    entries.value = Array.isArray(data.entries) ? data.entries : [];
    loaded.value = true;
    // 預設展開最新一版
    if (entries.value.length > 0) openSet.value = new Set([entries.value[0].version]);
  } catch (e) {
    console.error('載入 changelog.json 失敗', e);
    loadError.value = true;
  } finally {
    loading.value = false;
  }
};

watch(() => props.modelValue, (isOpenDialog) => {
  if (isOpenDialog && !loaded.value && !loading.value) fetchChangelog();
});

// 搜尋時重置顯示數量，避免停留在「已翻很多頁」狀態
watch(keyword, () => { shownCount.value = PAGE_SIZE; });
</script>

<style scoped>
/* ── 終端機視窗（One Dark / VS Code 調性） ─────────────── */
.term {
  --t-bg: #1e2127;
  --t-bg-alt: #23272e;
  --t-border: #3a3f4b;
  --t-fg: #d7dae0;
  --t-dim: #6b7280;
  --t-comment: #5c6370;
  --t-green: #98c379;
  --t-red: #e06c75;
  --t-yellow: #e5c07b;
  --t-blue: #61afef;
  --t-purple: #c678dd;
  --t-cyan: #56b6c2;
  --t-mono: 'Cascadia Code', 'JetBrains Mono', Consolas, 'SF Mono', Menlo, 'Courier New', monospace;

  display: flex;
  flex-direction: column;
  max-height: 85vh;
  border-radius: 10px;
  overflow: hidden;
  background: var(--t-bg);
  border: 1px solid var(--t-border);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
  font-family: var(--t-mono);
  color: var(--t-fg);
}
.term--mobile {
  max-height: 100%;
  height: 100%;
  border-radius: 0;
  border: none;
}

/* 標題列 */
.term__titlebar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #2c313a 0%, #262b33 100%);
  border-bottom: 1px solid var(--t-border);
  flex-shrink: 0;
}
.term__lights { display: flex; gap: 7px; }
.term__light { width: 12px; height: 12px; border-radius: 50%; }
.term__light--r { background: #ff5f56; }
.term__light--y { background: #ffbd2e; }
.term__light--g { background: #27c93f; }
.term__titletext {
  flex: 1;
  text-align: center;
  font-size: 0.76rem;
  color: var(--t-dim);
  letter-spacing: 0.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.term__close {
  background: none;
  border: none;
  color: var(--t-dim);
  font-size: 0.9rem;
  line-height: 1;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
.term__close:hover { color: var(--t-fg); background: rgba(255, 255, 255, 0.08); }

/* 搜尋列 */
.term__search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--t-bg-alt);
  border-bottom: 1px solid var(--t-border);
  flex-shrink: 0;
}
.term__prompt-sym { color: var(--t-green); font-weight: 700; }
.term__grep { color: var(--t-purple); }
.term__input {
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  outline: none;
  color: var(--t-fg);
  font-family: inherit;
  font-size: 0.85rem;
  caret-color: var(--t-green);
  padding: 4px 0;
}
.term__input::placeholder { color: var(--t-comment); }
.term__clear {
  background: none;
  border: none;
  color: var(--t-dim);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  padding: 4px 6px;
  border-radius: 4px;
}
.term__clear:hover { color: var(--t-fg); background: rgba(255, 255, 255, 0.08); }

/* 內容捲動區 */
.term__body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 8px 16px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #4a5060 transparent;
}
.term__body::-webkit-scrollbar { width: 10px; }
.term__body::-webkit-scrollbar-thumb { background: #4a5060; border-radius: 5px; border: 2px solid var(--t-bg); }
.term__body::-webkit-scrollbar-track { background: transparent; }

/* 狀態訊息 */
.term__state {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 14px;
  font-size: 0.85rem;
}
.term__state-line { color: var(--t-fg); }
.term__state-line--dim { color: var(--t-dim); }
.term__state-line--err { color: var(--t-red); }
.term__retry {
  align-self: flex-start;
  background: none;
  border: 1px solid var(--t-border);
  border-radius: 6px;
  color: var(--t-green);
  font-family: inherit;
  font-size: 0.85rem;
  padding: 6px 14px;
  cursor: pointer;
}
.term__retry:hover { background: rgba(152, 195, 121, 0.12); }

/* ── 單筆版本（git log 行） ─────────────────── */
.commit--open {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 8px;
  margin: 2px 0;
}

/* 展開列：整列可點、目標夠大（手機好按） */
.commit__head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  min-height: 44px;
  padding: 11px 10px;
  text-align: left;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  color: var(--t-fg);
  line-height: 1.5;
}
.commit__head:hover { background: rgba(255, 255, 255, 0.05); }
.commit__head:focus-visible { outline: 1px solid var(--t-blue); outline-offset: -1px; }

.commit__arrow { color: var(--t-dim); flex-shrink: 0; width: 1em; }
.commit__graph { color: var(--t-red); flex-shrink: 0; font-weight: 700; }
.commit__version {
  color: var(--t-yellow);
  font-weight: 700;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
}
.commit__date {
  color: var(--t-cyan);
  flex-shrink: 0;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.commit__count {
  color: var(--t-comment);
  flex-shrink: 0;
  font-size: 0.75rem;
}
.commit__summary {
  color: var(--t-dim);
  font-size: 0.78rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

/* 手機：一行擠不下，摘要換行縮排全寬顯示 */
.term--mobile .commit__head { flex-wrap: wrap; row-gap: 2px; }
.term--mobile .commit__summary {
  flex-basis: 100%;
  padding-left: calc(1em + 8px); /* 對齊箭頭後的內容 */
}

/* 展開內容：diff 增行風格 */
.commit__content { padding: 0 10px 12px calc(1em + 18px); }
.commit__line {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 5px 8px;
  border-left: 2px solid rgba(152, 195, 121, 0.35);
  margin-bottom: 2px;
  background: rgba(152, 195, 121, 0.05);
  border-radius: 0 6px 6px 0;
}
.commit__plus { color: var(--t-green); font-weight: 700; flex-shrink: 0; }
.commit__tag { flex-shrink: 0; font-weight: 700; }
.commit__tag--feature { color: var(--t-green); }
.commit__tag--fix { color: var(--t-red); }
.commit__tag--improve { color: var(--t-blue); }
.commit__tag--other { color: var(--t-comment); }
.commit__text {
  font-size: 0.84rem;
  line-height: 1.7;
  color: var(--t-fg);
  word-break: break-word;
}

/* 載入更多：偽指令 */
.term__more {
  display: block;
  width: calc(100% - 12px);
  margin: 10px 6px 0;
  padding: 11px 12px;
  text-align: left;
  background: var(--t-bg-alt);
  border: 1px dashed var(--t-border);
  border-radius: 8px;
  color: var(--t-fg);
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: normal;
  word-break: break-all;
}
.term__more:hover { border-color: var(--t-green); background: rgba(152, 195, 121, 0.07); }
.term__more-hint { color: var(--t-comment); }

/* 結尾閃爍游標 */
.term__prompt-end { padding: 12px 14px 4px; font-size: 0.85rem; }
.term__cursor {
  display: inline-block;
  width: 8px;
  height: 1.05em;
  margin-left: 6px;
  vertical-align: text-bottom;
  background: var(--t-green);
  animation: term-blink 1.1s steps(1) infinite;
}
@keyframes term-blink { 50% { opacity: 0; } }

/* IDE 底部狀態列 */
.term__statusbar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 4px 12px;
  background: #007acc;
  color: rgba(255, 255, 255, 0.95);
  font-size: 0.7rem;
  letter-spacing: 0.3px;
  flex-shrink: 0;
  user-select: none;
}
.term__status-spacer { flex: 1; }
.term__status-item { white-space: nowrap; }
</style>
