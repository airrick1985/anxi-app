<template>
  <transition name="pp-lb">
    <div
      v-if="shot"
      ref="rootEl"
      class="pp-lb"
      role="dialog"
      aria-modal="true"
      :aria-label="shot.alt"
    >
      <div ref="stageEl" class="pp-lb__stage" :class="{ 'is-zoom': zoom }" @click.self="$emit('close')">
        <button
          v-if="canToggle"
          ref="frameEl"
          type="button"
          class="pp-lb__frame"
          :class="{ 'is-phone': isPhoneShot }"
          :style="{ width: `${frameWidth}px` }"
          :aria-label="zoom ? '縮小到符合視窗' : '放大檢視'"
          @click="toggleZoom"
        >
          <ProductCrop :shot="shot" eager />
        </button>
        <div v-else ref="frameEl" class="pp-lb__frame is-static" :class="{ 'is-phone': isPhoneShot }" :style="{ width: `${frameWidth}px` }">
          <ProductCrop :shot="shot" eager />
        </div>
      </div>
      <button ref="closeEl" type="button" class="pp-lb__close" aria-label="關閉" @click="$emit('close')">
        <v-icon size="24">mdi-close</v-icon>
      </button>
    </div>
  </transition>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { SHOTS, shotCrop } from '@/constants/productPage';
import ProductCrop from './ProductCrop.vue';
import { lockScroll, unlockScroll, trapTab } from './overlay';

const props = defineProps({
  shotKey: { type: String, default: null },
});
const emit = defineEmits(['close']);

const rootEl = ref(null);
const stageEl = ref(null);
const frameEl = ref(null);
const closeEl = ref(null);

const shot = computed(() => (props.shotKey ? SHOTS[props.shotKey] : null));
const vw = ref(window.innerWidth);
const vh = ref(window.innerHeight);
const isMobile = computed(() => vw.value < 768);
const isPhoneShot = computed(() => shot.value?.frame === 'phone');
// 手機上看手機截圖維持符合視窗高度，不切換放大
const canToggle = computed(() => !(isMobile.value && isPhoneShot.value));
const zoom = ref(false);

const fitWidth = computed(() => {
  if (!shot.value) return 0;
  const c = shotCrop(shot.value);
  const ratio = c.w / c.h;
  const padX = isMobile.value ? 16 : 56;
  const padY = isMobile.value ? 72 : 64; // 上方留給關閉鈕
  return Math.max(120, Math.min(vw.value - padX * 2, (vh.value - padY * 2) * ratio));
});
const frameWidth = computed(() => {
  if (!zoom.value) return fitWidth.value;
  return isMobile.value ? vw.value * 3 : fitWidth.value * 2; // 手機：300vw；平板以上：2 倍
});

const toggleZoom = async (e) => {
  const rect = frameEl.value?.getBoundingClientRect();
  const hasPoint = rect && e && e.clientX > 0;
  const rx = hasPoint ? (e.clientX - rect.left) / rect.width : 0.5;
  const ry = hasPoint ? (e.clientY - rect.top) / rect.height : 0.5;
  zoom.value = !zoom.value;
  await nextTick();
  const stage = stageEl.value;
  const frame = frameEl.value;
  if (!stage || !frame || !zoom.value) return;
  // 放大後讓點到的位置留在畫面中間
  stage.scrollLeft = Math.max(0, frame.offsetLeft + frame.offsetWidth * rx - stage.clientWidth / 2);
  stage.scrollTop = Math.max(0, frame.offsetTop + frame.offsetHeight * ry - stage.clientHeight / 2);
};

const onKeydown = (e) => {
  if (e.key === 'Escape') {
    e.stopPropagation();
    emit('close');
    return;
  }
  trapTab(e, rootEl.value);
};

const onResize = () => {
  vw.value = window.innerWidth;
  vh.value = window.innerHeight;
};

// 鍵盤監聽掛在 document：Safari 點按鈕不會取得焦點，keydown 不一定落在燈箱內
let locked = false;
watch(shot, async (s) => {
  if (s) {
    // 手機開桌機截圖：直接以放大狀態開啟，從左上角開始看
    zoom.value = isMobile.value && s.frame !== 'phone';
    if (!locked) { lockScroll(); locked = true; document.addEventListener('keydown', onKeydown); }
    await nextTick();
    if (stageEl.value) { stageEl.value.scrollLeft = 0; stageEl.value.scrollTop = 0; }
    closeEl.value?.focus({ preventScroll: true });
  } else if (locked) {
    unlockScroll();
    locked = false;
    document.removeEventListener('keydown', onKeydown);
  }
}, { immediate: true });

onMounted(() => window.addEventListener('resize', onResize));
onBeforeUnmount(() => {
  window.removeEventListener('resize', onResize);
  document.removeEventListener('keydown', onKeydown);
  if (locked) unlockScroll();
});
</script>

<style scoped>
.pp-lb {
  position: fixed;
  inset: 0;
  z-index: 80;
  background: rgba(7, 10, 20, 0.94);
}
.pp-lb__stage {
  position: absolute;
  inset: 0;
  display: flex;
  overflow: auto;
  overscroll-behavior: contain;
  padding: 64px 56px;
  -webkit-overflow-scrolling: touch;
}
.pp-lb__frame {
  flex: none;
  margin: auto; /* 放大超出畫面時仍可捲到左上角（不用 justify-content 置中） */
  padding: 0;
  border: 0;
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
  cursor: zoom-in;
  box-shadow: 0 30px 70px rgba(0, 0, 0, 0.4);
}
.pp-lb__stage.is-zoom .pp-lb__frame { cursor: zoom-out; }
.pp-lb__frame.is-static { cursor: default; }
.pp-lb__frame.is-phone { border-radius: 24px; }
.pp-lb__frame:focus-visible { outline: 2px solid #2F6BFF; outline-offset: 2px; }
.pp-lb__close {
  position: fixed;
  top: max(12px, env(safe-area-inset-top));
  right: 12px;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: #fff;
  color: #0B0B0F;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}
.pp-lb__close:focus-visible { outline: 2px solid #2F6BFF; outline-offset: 2px; }
.pp-lb-enter-active, .pp-lb-leave-active { transition: opacity 0.2s ease; }
.pp-lb-enter-from, .pp-lb-leave-to { opacity: 0; }
@media (max-width: 767.98px) {
  .pp-lb__stage { padding: 72px 16px; }
  .pp-lb__stage.is-zoom { padding: 0; }
  .pp-lb__stage.is-zoom .pp-lb__frame { margin: auto 0; border-radius: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .pp-lb-enter-active, .pp-lb-leave-active { transition: none; }
}
</style>
