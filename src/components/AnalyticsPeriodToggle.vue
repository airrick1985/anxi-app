<template>
  <div class="period-toggle-container">
    <div class="toggle-and-picker">
      <v-btn-toggle
        :model-value="period"
        @update:model-value="handlePeriodChange"
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
        <v-btn value="custom">
          <v-icon start>mdi-calendar-range</v-icon>
          自訂日期
        </v-btn>
        <v-btn value="all">
          <v-icon start>mdi-chart-box-outline</v-icon>
          累計
        </v-btn>
      </v-btn-toggle>

      <!-- 自訂日期選擇器 -->
      <div v-if="period === 'custom'" class="custom-date-picker mt-3">
        <v-row>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customDateRange.start"
              type="date"
              label="開始日期"
              variant="outlined"
              density="compact"
              @update:model-value="emitCustomPeriod"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              v-model="customDateRange.end"
              type="date"
              label="結束日期"
              variant="outlined"
              density="compact"
              @update:model-value="emitCustomPeriod"
            ></v-text-field>
          </v-col>
        </v-row>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, ref, computed } from 'vue'

const props = defineProps({
  period: {
    type: String,
    default: 'month',
  },
  customDateRange: {
    type: Object,
    default: () => ({ start: '', end: '' }),
  },
})

const emit = defineEmits(['update:period', 'update:custom-date-range'])

const customDateRange = ref({
  start: props.customDateRange.start || formatDateToInput(new Date()),
  end: props.customDateRange.end || formatDateToInput(new Date()),
})

/**
 * 格式化日期為 YYYY-MM-DD 格式
 */
function formatDateToInput(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 處理時間粒度變更
 */
function handlePeriodChange(newPeriod) {
  emit('update:period', newPeriod)
}

/**
 * 發出自訂日期範圍
 */
function emitCustomPeriod() {
  if (customDateRange.value.start && customDateRange.value.end) {
    emit('update:custom-date-range', customDateRange.value)
  }
}
</script>

<style scoped>
.period-toggle-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.toggle-and-picker {
  width: 100%;
  max-width: 900px;
}

.period-toggle {
  margin: 0 auto;
  display: flex;
  flex-wrap: wrap;
}

.custom-date-picker {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
</style>
