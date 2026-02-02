<template>
  <div class="d-flex align-center justify-start w-100 h-100">
    <span v-if="!files || files.length === 0">-</span>

    <v-btn
      v-else-if="files.length === 1"
      variant="text"
      size="small"
      :href="files[0].url"
      target="_blank"
      rel="noopener noreferrer"
      @click.stop
      class="text-none pa-1"
      color="primary"
    >
      <template v-slot:prepend>
        <v-icon color="red" size="30">mdi-file-pdf-box</v-icon>
      </template>
      {{ files[0].name }}
    </v-btn>

    <v-menu v-else location="bottom">
      <template v-slot:activator="{ props }">
        <v-btn
          v-bind="props"
          variant="tonal"
          color="primary"
          size="small"
          append-icon="mdi-menu-down"
        >
          查看報告 ({{ files.length }})
        </v-btn>
      </template>
      <v-list density="compact">
        <v-list-item
          v-for="(file, index) in files"
          :key="index"
          :href="file.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <template v-slot:prepend>
            <v-icon color="red" size="30">mdi-file-pdf-box</v-icon>
          </template>
          <v-list-item-title>{{ file.name }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup>
import { computed } from 'vue';

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
</script>