<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="500px"
    persistent
  >
    <v-card>
      <v-card-title class="text-h5 error-title">
        <v-icon left color="white">mdi-alert-circle-outline</v-icon>
        <span class="ml-2">{{ title }}</span>
      </v-card-title>
      
      <v-card-text class="py-4">
        <p class="text-body-1" v-html="message"></p>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="$emit('cancel')"
        >
          取消
        </v-btn>
        <v-btn
          :color="confirmColor"
          variant="flat"
          @click="$emit('confirm')"
          :loading="loading"
        >
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

defineProps({
  show: { type: Boolean, required: true },
  title: { type: String, default: '確認操作' },
  message: { type: String, required: true },
  confirmText: { type: String, default: '確認' },
  confirmColor: { type: String, default: 'error' },
  loading: { type: Boolean, default: false }
});

defineEmits(['update:show', 'confirm', 'cancel']);
</script>

<style scoped>
.error-title {
  background-color: #D32F2F; /* Vuetify's error color */
  color: white;
}
</style>