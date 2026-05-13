<template>
  <div class="d-flex align-center justify-start w-100 h-100">
    <span v-if="!files || files.length === 0">-</span>

    <div v-else-if="files.length === 1" class="d-flex align-center w-100 pr-2">
      <v-btn
        variant="text"
        size="small"
        :href="files[0].url"
        target="_blank"
        rel="noopener noreferrer"
        @click.stop
        class="text-none pa-1 flex-grow-1 justify-start"
        color="teal-darken-2"
      >
        <template v-slot:prepend>
          <v-icon color="teal-darken-2" size="28">mdi-file-sign</v-icon>
        </template>
        <span class="text-truncate" style="max-width: 250px;">{{ formatAuthLetterName(files[0], unitId) }}</span>
      </v-btn>
    </div>

    <v-menu v-else location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="tonal"
          color="teal-darken-2"
          size="small"
          append-icon="mdi-menu-down"
          prepend-icon="mdi-file-sign"
        >
          授權書 ({{ files.length }})
        </v-btn>
      </template>
      <v-list density="compact" min-width="320">
        <v-list-item
          v-for="(file, index) in files"
          :key="index"
          :href="file.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <template v-slot:prepend>
            <v-icon color="teal-darken-2" size="28" class="mr-2">mdi-file-sign</v-icon>
          </template>
          <v-list-item-title class="text-truncate" style="max-width: 260px;">{{ formatAuthLetterName(file, unitId) }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { formatAuthLetterName } from '@/utils/authLetterName.js';

const props = defineProps({
  params: {
    type: Object,
    required: true,
  },
});

const files = computed(() => {
  const value = props.params.value;
  if (Array.isArray(value)) {
    return value.filter(item => item && typeof item.name === 'string' && typeof item.url === 'string');
  }
  return [];
});

const unitId = computed(() => props.params.data?.unitId || '');
</script>
