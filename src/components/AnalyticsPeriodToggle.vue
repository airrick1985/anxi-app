<template>
  <div class="period-toggle-container">
    <div class="toggle-and-picker">
      <!-- 桌面版本：5個按鈕水平排列 -->
      <v-btn-toggle
        :model-value="period"
        @update:model-value="handlePeriodChange"
        color="primary"
        variant="outlined"
        density="compact"
        mandatory
        class="period-toggle d-none d-md-flex"
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

      <!-- 手機版本：下拉選擇 -->
      <v-select
        :model-value="period"
        @update:model-value="handlePeriodChange"
        :items="periodOptions"
        item-title="label"
        item-value="value"
        label="選擇期間"
        variant="outlined"
        density="compact"
        class="d-md-none"
      ></v-select>

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

const periodOptions = [
  { value: 'today', label: '本日' },
  { value: 'week', label: '本週' },
  { value: 'month', label: '本月' },
  { value: 'custom', label: '自訂日期' },
  { value: 'all', label: '累計' },
]

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
