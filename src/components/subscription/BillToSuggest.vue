<template>
  <!-- 放在公司名稱欄位旁：輸入或空白聚焦時，列出歷史買受人供點選帶入 -->
  <span ref="anchor" class="d-none"></span>
  <v-menu
    v-if="target"
    v-model="open"
    :activator="target"
    location="bottom start"
    :open-on-click="false"
    :close-on-content-click="false"
    :capture-focus="false"
    :disabled="!matches.length"
    min-width="280"
    max-height="280"
  >
    <v-list ref="list" density="compact" @mousedown.prevent>
      <v-list-item
        v-for="b in matches"
        :key="b.key"
        :title="b.name"
        :subtitle="[b.taxId, b.contactName, b.phone].filter(Boolean).join(' · ')"
        @click="pick(b)"
      ></v-list-item>
    </v-list>
  </v-menu>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  query: { type: String, default: '' },
  history: { type: Array, default: () => [] },  // [{ key, name, taxId, contactName, phone }]
});
const emit = defineEmits(['select']);

const anchor = ref(null);
const target = ref(null);
const list = ref(null);
const open = ref(false);

const matches = computed(() => {
  const q = (props.query || '').trim().toLowerCase();
  if (!q) return props.history;
  return props.history.filter(b => b.name.toLowerCase().includes(q) || b.taxId.includes(q));
});

function show() {
  open.value = matches.value.length > 0;
}

// 等 v-model 更新 query 後再篩選
function onInput() {
  nextTick(show);
}

// 已有內容時點進欄位不跳出，打字才跳出
function onFocusIn() {
  if (!(props.query || '').trim()) show();
}

function onFocusOut(e) {
  if (list.value?.$el?.contains(e.relatedTarget)) return;
  open.value = false;
}

function pick(b) {
  emit('select', b);
  open.value = false;
}

onMounted(() => {
  target.value = anchor.value?.parentElement || null;
  target.value?.addEventListener('focusin', onFocusIn);
  target.value?.addEventListener('input', onInput);
  target.value?.addEventListener('focusout', onFocusOut);
});

onBeforeUnmount(() => {
  target.value?.removeEventListener('focusin', onFocusIn);
  target.value?.removeEventListener('input', onInput);
  target.value?.removeEventListener('focusout', onFocusOut);
});
</script>
