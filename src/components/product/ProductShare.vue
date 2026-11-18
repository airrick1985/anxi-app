<template>
  <div class="pp-share">
    <p class="pp-share__label"><v-icon size="18">mdi-bookmark-outline</v-icon>{{ label }}</p>
    <p class="pp-share__url">{{ url }}</p>
    <div class="pp-share__acts">
      <button type="button" class="pp-btn pp-btn--primary" @click="copy">
        <v-icon size="18">{{ copied ? 'mdi-check' : 'mdi-content-copy' }}</v-icon>{{ copied ? '已複製' : '複製連結' }}
      </button>
      <button v-if="canShare" type="button" class="pp-btn pp-btn--ghost" @click="share">
        <v-icon size="18">mdi-share-variant-outline</v-icon>分享
      </button>
    </div>
    <div class="pp-share__qr">
      <img v-if="qr" :src="qr" alt="此章節網址的 QR Code" width="180" height="180" />
      <span v-else class="pp-share__ph" aria-hidden="true"></span>
    </div>
    <span class="pp-sr" aria-live="polite">{{ copied ? '已複製連結' : '' }}</span>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import { copyText } from '@/utils/copyText';
import { makeQr } from './qr';

const props = defineProps({
  url: { type: String, required: true },
  label: { type: String, default: '' },
});

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
const copied = ref(false);
const qr = ref('');
let timer = 0;

const copy = async () => {
  const ok = await copyText(props.url);
  copied.value = ok;
  clearTimeout(timer);
  if (ok) timer = setTimeout(() => { copied.value = false; }, 2000);
};

const share = async () => {
  try {
    await navigator.share({ title: `${props.label}｜ANXI 安熙智慧`, url: props.url });
  } catch {
    // 使用者取消分享不需處理
  }
};

watch(() => props.url, async (url) => {
  copied.value = false;
  qr.value = '';
  const data = await makeQr(url);
  if (url === props.url) qr.value = data;
}, { immediate: true });

onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.pp-share { display: flex; flex-direction: column; gap: 14px; padding: 12px 20px 4px; }
.pp-share__label { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 15px; font-weight: 700; color: #111827; }
.pp-share__label .v-icon { color: #1F4FD1; }
.pp-share__url {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  background: #F5F6F8;
  font-size: 14px;
  line-height: 1.6;
  color: #111827;
  word-break: break-all;
  user-select: all;
}
.pp-share__acts { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
.pp-share__qr { display: flex; justify-content: center; padding: 4px 0 4px; }
.pp-share__qr img, .pp-share__ph { display: block; width: 180px; height: 180px; border-radius: 8px; }
.pp-share__ph { background: #F5F6F8; }
.pp-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
