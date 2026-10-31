<template>
  <v-dialog
    :model-value="modelValue"
    max-width="1200"
    content-class="mac-dialog-fit"
    @update:model-value="v => emit('update:modelValue', v)"
  >
    <v-card v-if="current" class="mac-sheet sip">
      <div class="mac-sheet-head">
        <span class="sip-title">{{ current.imageName }}</span>
        <span class="mac-page-count">{{ index + 1 }} / {{ images.length }}</span>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-icon-btn" title="更名" @click="emit('rename', current)">
          <v-icon size="18">mdi-pencil-outline</v-icon>
        </button>
        <button type="button" class="mac-icon-btn" title="替換檔案" @click="emit('replace', current)">
          <v-icon size="18">mdi-image-refresh-outline</v-icon>
        </button>
        <a class="mac-icon-btn" title="開新分頁" :href="current.src" target="_blank" rel="noopener">
          <v-icon size="18">mdi-open-in-new</v-icon>
        </a>
        <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="emit('delete', current)">
          <v-icon size="18">mdi-trash-can-outline</v-icon>
        </button>
        <button type="button" class="mac-sheet-close sip-close" title="關閉" @click="emit('update:modelValue', false)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="sip-stage">
        <img :key="current.src" :src="current.src" :alt="current.imageName" />
        <button v-if="images.length > 1" type="button" class="sip-nav sip-nav--prev" title="上一張" @click="go(-1)">
          <v-icon size="26">mdi-chevron-left</v-icon>
        </button>
        <button v-if="images.length > 1" type="button" class="sip-nav sip-nav--next" title="下一張" @click="go(1)">
          <v-icon size="26">mdi-chevron-right</v-icon>
        </button>
      </div>

      <div class="mac-sheet-foot sip-foot">
        <span class="sip-meta">{{ metaText }}</span>
        <span class="mac-spacer"></span>
        <span v-if="!current.units.length" class="mac-tag sip-unused">未使用</span>
        <template v-else>
          <span class="sip-units-label">使用戶別</span>
          <span v-for="u in current.units.slice(0, UNIT_PREVIEW)" :key="u" class="mac-tag">{{ u }}</span>
          <span v-if="current.units.length > UNIT_PREVIEW" class="sip-more">等 {{ current.units.length }} 戶</span>
        </template>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  images: { type: Array, default: () => [] },
  index: { type: Number, default: 0 },
});
const emit = defineEmits(['update:modelValue', 'update:index', 'rename', 'replace', 'delete']);

const UNIT_PREVIEW = 8;

const current = computed(() => props.images[props.index] || null);
const metaText = computed(() => {
  const c = current.value;
  if (!c) return '';
  return [c.fileName, c.format, c.width ? `${c.width}×${c.height}` : '', c.sizeText, c.updatedText].filter(Boolean).join(' · ');
});

// 目前這張被刪除或篩掉時關閉
watch(current, (c) => { if (!c && props.modelValue) emit('update:modelValue', false); });

function go(step) {
  const n = props.images.length;
  if (n) emit('update:index', (props.index + step + n) % n);
}

function onKey(e) {
  if (!props.modelValue || e.target?.closest?.('input, textarea')) return;
  if (e.key === 'ArrowLeft') go(-1);
  else if (e.key === 'ArrowRight') go(1);
}
watch(() => props.modelValue, (open) => {
  if (open) window.addEventListener('keydown', onKey);
  else window.removeEventListener('keydown', onKey);
}, { immediate: true });
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));
</script>

<style scoped>
.sip-title { min-width: 0; overflow-wrap: anywhere; }
.sip .mac-spacer { flex: 1 1 auto; }
.sip-close { margin-left: 4px; }
.sip-stage {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: min(72vh, 820px);
  padding: 12px 56px;
  background: #1c1c1e;
}
.sip-stage img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 4px;
  background: #fff;
}
.sip-nav {
  position: absolute;
  top: 50%;
  display: grid;
  place-content: center;
  width: 40px;
  height: 40px;
  margin-top: -20px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  cursor: pointer;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  transition: background-color 0.12s;
}
.sip-nav:hover { background: rgba(255, 255, 255, 0.28); }
.sip-nav .v-icon { color: #fff; }
.sip-nav--prev { left: 10px; }
.sip-nav--next { right: 10px; }
.sip-foot { row-gap: 6px; }
.sip-meta { font-size: 12.5px; color: #6e6e73; overflow-wrap: anywhere; }
.sip-units-label { font-size: 12px; font-weight: 600; color: #6e6e73; }
.sip-unused { --mac-tag-color: #8e8e93; }
.sip-more { font-size: 12px; color: #6e6e73; }

@media (max-width: 600px) {
  .sip-stage { height: 60vh; padding: 8px; }
  .sip-nav { width: 36px; height: 36px; margin-top: -18px; }
  .sip-nav--prev { left: 6px; }
  .sip-nav--next { right: 6px; }
}
</style>
