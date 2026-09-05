<template>
  <div class="metric-card" :class="{ 'loading': isLoading }">
    <div v-if="icon" class="metric-icon" :class="`metric-icon--${iconColor}`">
      <v-icon :color="iconColor" size="18">{{ icon }}</v-icon>
    </div>
    <div class="metric-body">
      <div class="metric-title">{{ title }}</div>
      <div class="metric-value" :class="`text-${valueColor}`">{{ formattedValue }}</div>
      <div v-if="subtitle" class="metric-subtitle">{{ subtitle }}</div>
      <div v-if="showTrend && trend" class="metric-trend">
        <v-chip :color="trend.value >= 0 ? 'success' : 'error'" size="x-small" class="font-weight-bold">
          <v-icon v-if="trend.value >= 0" start size="12">mdi-trending-up</v-icon>
          <v-icon v-else start size="12">mdi-trending-down</v-icon>
          {{ trend.label }}
        </v-chip>
      </div>
    </div>
    <v-progress-linear v-if="isLoading" indeterminate absolute location="bottom" height="2" />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    default: 0,
  },
  subtitle: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
  iconColor: {
    type: String,
    default: 'primary',
  },
  valueColor: {
    type: String,
    default: 'primary',
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  format: {
    type: String,
    default: 'number', // 'number' | 'currency' | 'percentage'
  },
  showTrend: {
    type: Boolean,
    default: false,
  },
  trend: {
    type: Object,
    default: null,
    // { value: number, label: string }
  },
})

const formattedValue = computed(() => {
  const val = Number(props.value) || 0

  switch (props.format) {
    case 'currency': {
      // 金額已為萬元單位
      const formatted = val.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      return `${formatted} 萬`
    }

    case 'percentage':
      return `${val.toFixed(1)}%`

    case 'number':
    default:
      return new Intl.NumberFormat('zh-TW').format(Math.round(val))
  }
})
</script>

<style scoped>
/* 緊湊的橫向指標卡：左側小圖示、右側標題／數值／副標 */
.metric-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #ffffff;
  border: 1px solid #e8eaed;
  border-radius: 10px;
  min-width: 0;
  overflow: hidden;
}

.metric-card.loading {
  opacity: 0.7;
}

.metric-icon {
  flex: none;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #eef3fb;
}

.metric-icon--success { background: #e8f5e9; }
.metric-icon--info { background: #e3f2fd; }
.metric-icon--warning { background: #fff3e0; }
.metric-icon--error { background: #ffebee; }
.metric-icon--primary { background: #e3f2fd; }

.metric-body {
  min-width: 0;
  flex: 1;
}

.metric-title {
  font-size: 11.5px;
  font-weight: 700;
  color: #6b7785;
  letter-spacing: 0.2px;
  line-height: 1.2;
}

.metric-value {
  font-size: 20px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.4px;
  margin-top: 2px;
  white-space: nowrap;
}

.metric-subtitle {
  font-size: 11.5px;
  font-weight: 600;
  color: #1976d2;
  line-height: 1.3;
  margin-top: 1px;
  white-space: normal;
  word-break: break-word;
}

.metric-trend {
  margin-top: 4px;
}
</style>
