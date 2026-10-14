<template>
  <div class="la-avatar" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src && !failed" :src="src" alt="" referrerpolicy="no-referrer" @error="failed = true" />
    <v-icon v-else :size="Math.round(size * 0.5)">{{ icon }}</v-icon>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  src: { type: String, default: null },
  icon: { type: String, default: 'mdi-account' },
  size: { type: Number, default: 40 },
});
const failed = ref(false);
watch(() => props.src, () => { failed.value = false; });
</script>

<style scoped>
.la-avatar { flex-shrink: 0; display: grid; place-items: center; overflow: hidden; border-radius: 50%; background: #e9e9ee; color: #8e8e93; }
.la-avatar img { width: 100%; height: 100%; object-fit: cover; }
</style>
