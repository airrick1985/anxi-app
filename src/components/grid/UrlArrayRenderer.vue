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
        :color="files[0].isDownloaded ? 'grey' : 'primary'"
      >
        <template v-slot:prepend>
          <v-icon :color="files[0].isDownloaded ? 'grey' : 'red'" size="30">mdi-file-pdf-box</v-icon>
        </template>
        <span class="text-truncate" style="max-width: 250px;">{{ files[0].name }}</span>
      </v-btn>

      <v-tooltip text="標記為已下載" location="top" v-if="!files[0].isDownloaded">
        <template v-slot:activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-check-circle-outline"
            variant="text"
            color="success"
            size="small"
            class="ml-1 shrink-0"
            @click.stop.prevent="onDownloadMark(files[0])"
          ></v-btn>
        </template>
      </v-tooltip>
      <v-icon v-else color="success" size="small" class="ml-2 shrink-0" title="已下載">mdi-check-circle</v-icon>

      <v-btn
        icon="mdi-delete"
        variant="text"
        color="error"
        size="small"
        class="ml-1 shrink-0"
        @click.stop.prevent="onDelete(files[0])"
      ></v-btn>
    </div>

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
      <v-list density="compact" min-width="350">
        <v-list-item
          v-for="(file, index) in files"
          :key="index"
          :href="file.url"
          target="_blank"
          rel="noopener noreferrer"
          @click.stop
        >
          <template v-slot:prepend>
            <v-icon :color="file.isDownloaded ? 'grey' : 'red'" size="30" class="mr-2">mdi-file-pdf-box</v-icon>
          </template>
          <v-list-item-title class="d-flex align-center justify-space-between w-100">
            <span class="text-truncate flex-grow-1 mr-2" :class="{'text-grey': file.isDownloaded}" style="max-width: 200px;">{{ file.name }}</span>
            <div class="d-flex align-center shrink-0">
               <v-tooltip text="標記為已下載" location="top" v-if="!file.isDownloaded">
                 <template v-slot:activator="{ props }">
                   <v-btn
                     v-bind="props"
                     icon="mdi-check-circle-outline"
                     variant="text"
                     color="success"
                     size="small"
                     class="mr-1"
                     @click.stop.prevent="onDownloadMark(file)"
                   ></v-btn>
                 </template>
               </v-tooltip>
               <v-icon v-else color="success" size="small" class="mr-2" title="已下載">mdi-check-circle</v-icon>
               
               <v-btn
                 icon="mdi-delete"
                 variant="text"
                 color="error"
                 size="small"
                 @click.stop.prevent="onDelete(file)"
               ></v-btn>
            </div>
          </v-list-item-title>
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

const onDelete = (file) => {
  if (props.params.colDef && props.params.colDef.cellRendererParams && props.params.colDef.cellRendererParams.onDelete) {
     props.params.colDef.cellRendererParams.onDelete(file, props.params.data);
  }
};

const onDownloadMark = (file) => {
  if (props.params.colDef && props.params.colDef.cellRendererParams && props.params.colDef.cellRendererParams.onDownloadMark) {
     props.params.colDef.cellRendererParams.onDownloadMark(file, props.params.data);
  }
};
</script>