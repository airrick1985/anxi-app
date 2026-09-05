<template>
  <div class="period-toggle-container">
    <!-- 桌面版本：5 個按鈕水平排列 -->
    <v-btn-toggle
      :model-value="period"
      @update:model-value="handlePeriodChange"
      color="primary"
      variant="outlined"
      density="compact"
      mandatory
      divided
      class="period-toggle d-none d-md-flex"
    >
      <v-btn v-for="opt in periodOptions" :key="opt.value" :value="opt.value" size="small" class="period-btn">
        <v-icon start size="15">{{ opt.icon }}</v-icon>
        {{ opt.label }}
      </v-btn>
    </v-btn-toggle>

    <!-- 手機版本：下拉選擇 -->
    <v-select
      :model-value="period"
      @update:model-value="handlePeriodChange"
      :items="periodOptions"
      item-title="label"
      item-value="value"
      label="期間"
      variant="outlined"
      density="compact"
      hide-details
      class="period-select d-md-none"
    ></v-select>

    <!-- 自訂日期：起訖同一列 -->
    <div v-if="period === 'custom'" class="custom-date-picker">
      <v-text-field
        v-model="customDateRange.start"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        class="date-field"
        @update:model-value="emitCustomPeriod"
      ></v-text-field>
      <span class="date-sep">～</span>
      <v-text-field
        v-model="customDateRange.end"
        type="date"
        variant="outlined"
        density="compact"
        hide-details
        class="date-field"
        @update:model-value="emitCustomPeriod"
      ></v-text-field>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

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
  { value: 'today', label: '本日', icon: 'mdi-calendar-today' },
  { value: 'week', label: '本週', icon: 'mdi-calendar-week' },
  { value: 'month', label: '本月', icon: 'mdi-calendar-month' },
  { value: 'custom', label: '自訂', icon: 'mdi-calendar-range' },
  { value: 'all', label: '累計', icon: 'mdi-chart-box-outline' },
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
  if (!newPeriod) return
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
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  min-width: 0;
}

.period-toggle {
  height: 32px !important;
}

.period-btn {
  font-size: 12.5px !important;
  letter-spacing: 0;
  padding: 0 10px !important;
}

.period-select {
  min-width: 120px;
  max-width: 160px;
}

.custom-date-picker {
  display: flex;
  align-items: center;
  gap: 4px;
}

.date-field {
  width: 150px;
}

.date-field :deep(input) {
  font-size: 13px;
}

.date-sep {
  font-size: 12px;
  color: #888;
}

@media (max-width: 599px) {
  .period-toggle-container {
    width: 100%;
  }

  .custom-date-picker {
    width: 100%;
  }

  .date-field {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}
</style>
