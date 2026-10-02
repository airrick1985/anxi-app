<template>
  <v-tooltip text="使用說明" location="bottom">
    <template v-slot:activator="{ props: tooltipProps }">
      <v-btn
        v-bind="tooltipProps"
        :href="href"
        target="_blank"
        rel="noopener"
        icon="mdi-help-circle-outline"
        variant="text"
        :color="color"
        :size="size"
        aria-label="使用說明"
      ></v-btn>
    </template>
  </v-tooltip>
</template>

<script setup>
// 開啟預約系統使用說明（新分頁），section 為章節 id，見 views/guide/BookingGuide.vue
import { computed } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  section: { type: String, default: '' },
  color: { type: String, default: undefined },
  size: { type: String, default: 'default' },
});

const router = useRouter();
const href = computed(() => router.resolve({
  name: 'BookingGuide',
  params: props.section ? { section: props.section } : {},
}).href);
</script>
