<template>
  <div>
    <v-list lines="two">
      <v-list-item
        v-for="status in sortedStatuses"
        :key="status.name"
        class="mb-2"
        elevation="1"
        border
      >
        <template v-slot:prepend>
          <v-avatar :color="status.color" size="36" class="mr-4 elevation-2"></v-avatar>
        </template>

        <v-list-item-title class="font-weight-bold">
          {{ status.name === 'default' ? '預設顏色' : status.name }}
        </v-list-item-title>
        <v-list-item-subtitle>
          色碼: {{ status.color }}
        </v-list-item-subtitle>
        
        <template v-slot:append>
          <v-btn 
            icon="mdi-pencil" 
            variant="text" 
            size="small" 
            @click="$emit('edit', status)"
          ></v-btn>
          <v-btn 
            v-if="status.name !== 'default'" 
            icon="mdi-delete" 
            variant="text" 
            color="error" 
            size="small" 
            @click="$emit('remove', { type, name: status.name })"
          ></v-btn>
        </template>
      </v-list-item>
    </v-list>

    <v-btn
      color="primary"
      @click="$emit('add')"
      prepend-icon="mdi-plus"
      class="mt-4"
      block
    >
      新增狀態
    </v-btn>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  statuses: {
    type: Object,
    required: true
  },
  type: {
    type: String,
    required: true
  }
});

defineEmits(['add', 'edit', 'remove']);

const sortedStatuses = computed(() => {
  const statusesArray = Object.entries(props.statuses).map(([name, color]) => ({ name, color }));
  const defaultStatus = statusesArray.find(s => s.name === 'default');
  const otherStatuses = statusesArray.filter(s => s.name !== 'default');
  
  if (defaultStatus) {
    return [...otherStatuses, defaultStatus];
  }
  
  return otherStatuses;
});
</script>
