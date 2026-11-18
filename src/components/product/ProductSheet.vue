<template>
  <!-- 面板：手機為底部面板、平板以上為置中對話框（目錄、分享共用） -->
  <transition name="pp-sheet" @after-leave="restoreFocus">
    <div v-if="modelValue" class="pp-sheet">
      <div class="pp-sheet__backdrop" aria-hidden="true" @click="close"></div>
      <div
        ref="panelEl"
        class="pp-sheet__panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
      >
        <div class="pp-sheet__head">
          <h2 :id="titleId" class="pp-sheet__title">{{ title }}</h2>
          <button ref="closeEl" type="button" class="pp-sheet__close" aria-label="關閉" @click="close">
            <v-icon size="22">mdi-close</v-icon>
          </button>
        </div>
        <div class="pp-sheet__body">
          <slot></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { lockScroll, unlockScroll, trapTab } from './overlay';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, required: true },
  // 關閉後焦點要回到的元素；沒給就回到開啟前的焦點
  returnFocus: { type: Object, default: null },
});
const emit = defineEmits(['update:modelValue']);

const titleId = `pp-sheet-${useId()}`;
const panelEl = ref(null);
const closeEl = ref(null);
let opener = null;
let locked = false;
let skipRestore = false;

const close = () => emit('update:modelValue', false);

/** 關閉但不把焦點還回去（例如目錄跳轉後焦點交給目的地） */
const closeWithoutFocus = () => {
  skipRestore = true;
  close();
};
defineExpose({ closeWithoutFocus });

const restoreFocus = () => {
  if (skipRestore) { skipRestore = false; return; }
  const target = props.returnFocus || opener;
  target?.focus?.({ preventScroll: true });
};

const onKeydown = (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    close();
    return;
  }
  trapTab(e, panelEl.value);
};

watch(() => props.modelValue, async (open) => {
  if (open) {
    opener = document.activeElement;
    // 鍵盤監聽掛在 document：Safari 點按鈕不會取得焦點，keydown 不一定落在面板內
    if (!locked) { lockScroll(); locked = true; document.addEventListener('keydown', onKeydown); }
    await nextTick();
    closeEl.value?.focus({ preventScroll: true });
  } else if (locked) {
    unlockScroll();
    locked = false;
    document.removeEventListener('keydown', onKeydown);
  }
}, { immediate: true });

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown);
  if (locked) unlockScroll();
});
</script>

<style scoped>
.pp-sheet {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.pp-sheet__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(7, 10, 20, 0.5);
}
.pp-sheet__panel {
  position: relative;
  display: flex;
  flex-direction: column;
  width: min(480px, 100%);
  max-height: min(720px, calc(100vh - 48px));
  max-height: min(720px, calc(100dvh - 48px));
  border-radius: 20px;
  background: #fff;
  color: #111827;
  box-shadow: 0 30px 70px rgba(15, 23, 42, 0.25);
  overflow: hidden;
}
.pp-sheet__head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 60px;
  padding: 8px 8px 8px 20px;
  border-bottom: 1px solid #E5E7EB;
}
.pp-sheet__title {
  flex: 1;
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  line-height: 1.4;
}
.pp-sheet__close {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: transparent;
  color: #4B5563;
  cursor: pointer;
}
.pp-sheet__close:hover { background: #F5F6F8; color: #111827; }
.pp-sheet__close:focus-visible { outline: 2px solid #2F6BFF; outline-offset: 2px; }
.pp-sheet__body {
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 8px 0 16px;
}
.pp-sheet-enter-active, .pp-sheet-leave-active { transition: opacity 0.2s ease; }
.pp-sheet-enter-active .pp-sheet__panel, .pp-sheet-leave-active .pp-sheet__panel { transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1); }
.pp-sheet-enter-from, .pp-sheet-leave-to { opacity: 0; }
.pp-sheet-enter-from .pp-sheet__panel, .pp-sheet-leave-to .pp-sheet__panel { transform: translateY(12px) scale(0.98); }

@media (max-width: 767.98px) {
  .pp-sheet { align-items: flex-end; padding: 0; }
  .pp-sheet__panel {
    width: 100%;
    max-height: 85vh;
    max-height: 85dvh;
    border-radius: 20px 20px 0 0;
  }
  .pp-sheet__body { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
  .pp-sheet-enter-from .pp-sheet__panel, .pp-sheet-leave-to .pp-sheet__panel { transform: translateY(100%); }
}
@media (prefers-reduced-motion: reduce) {
  .pp-sheet-enter-active, .pp-sheet-leave-active,
  .pp-sheet-enter-active .pp-sheet__panel, .pp-sheet-leave-active .pp-sheet__panel { transition: none; }
}
</style>
