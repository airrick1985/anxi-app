<template>
  <div class="ai-rcard">
    <div class="ai-rcard__head">
      <v-icon size="18" color="success">mdi-check-circle</v-icon>
      <span>已執行</span>
      <span v-if="result.unitId" class="ai-rcard__unit">{{ result.unitId }}</span>
    </div>
    <ul class="ai-rcard__list">
      <li v-for="(a, i) in result.applied || []" :key="i">{{ a }}</li>
    </ul>
    <div class="ai-rcard__actions">
      <v-btn v-if="result.unitId" size="x-small" variant="tonal" color="primary" prepend-icon="mdi-open-in-app" @click="$emit('open-unit', result.unitId)">開啟戶別</v-btn>
      <v-btn v-if="result.notification && result.notification.statusChanged && (result.notification.eligibleRecipients || []).length" size="x-small" variant="tonal" color="teal" prepend-icon="mdi-bell-ring-outline" @click="$emit('notify', result)">發送狀態通知</v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({ result: { type: Object, required: true } });
defineEmits(['open-unit', 'notify']);
</script>

<style scoped>
.ai-rcard { border: 1px solid #C8E6C9; background: #F6FCF6; border-radius: 12px; padding: 10px 12px; display: flex; flex-direction: column; gap: 6px; }
.ai-rcard__head { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: #1B5E20; }
.ai-rcard__unit { margin-left: auto; font-size: 12px; color: #2E7D32; background: #E8F5E9; border-radius: 6px; padding: 1px 6px; }
.ai-rcard__list { margin: 0; padding-left: 18px; font-size: 12.5px; color: #33691E; display: flex; flex-direction: column; gap: 2px; }
.ai-rcard__actions { display: flex; gap: 6px; flex-wrap: wrap; }
</style>
