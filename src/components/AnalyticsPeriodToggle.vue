<template>
  <div class="period-toggle-container">
    <v-btn-toggle
      :model-value="period"
      @update:model-value="$emit('update:period', $event)"
      color="primary"
      variant="outlined"
      density="compact"
      mandatory
      class="period-toggle"
    >
      <v-btn value="today">
        <v-icon start>mdi-calendar-today</v-icon>
        本日
      </v-btn>
      <v-btn value="week">
        <v-icon start>mdi-calendar-week</v-icon>
        本週
      </v-btn>
      <v-btn value="month">
        <v-icon start>mdi-calendar-month</v-icon>
        本月
      </v-btn>
      <v-btn value="all">
        <v-icon start>mdi-chart-box-outline</v-icon>
        累計
      </v-btn>
    </v-btn-toggle>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

defineProps({
  period: {
    type: String,
    default: 'month',
    validator: (v) => ['today', 'week', 'month', 'all'].includes(v),
  },
})

defineEmits(['update:period'])
</script>

<style scoped>
.period-toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.period-toggle {
  margin: 0 auto;
}
</style>
