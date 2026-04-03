<template>
  <v-card class="metric-card" :class="{ 'loading': isLoading }">
    <v-card-text class="card-content">
      <!-- 加載狀態 -->
      <v-progress-linear v-if="isLoading" indeterminate class="mb-2"></v-progress-linear>

      <!-- 圖示 -->
      <div class="metric-icon" v-if="icon">
        <v-icon :color="iconColor" size="large">{{ icon }}</v-icon>
      </div>

      <!-- 標題 -->
      <div class="metric-title text-subtitle-2 text-grey-darken-1 mb-2">
        {{ title }}
      </div>

      <!-- 主要數值 -->
      <div class="metric-value" :class="[`text-${valueColor}`]">
        {{ formattedValue }}
      </div>

      <!-- 副標題/描述 -->
      <div v-if="subtitle" class="metric-subtitle text-caption text-grey">
        {{ subtitle }}
      </div>

      <!-- 趨勢指示 -->
      <div v-if="showTrend && trend" class="metric-trend mt-2">
        <v-chip
          :color="trend.value >= 0 ? 'success' : 'error'"
          size="small"
          class="font-weight-bold"
        >
          <v-icon v-if="trend.value >= 0" start size="small">mdi-trending-up</v-icon>
          <v-icon v-else start size="small">mdi-trending-down</v-icon>
          {{ trend.label }}
        </v-chip>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, defineProps } from 'vue'

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
    default: 'h5 text-primary',
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
    case 'currency':
      // 金額已為萬元單位
      const formatted = val.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      return `${formatted} 萬`

    case 'percentage':
      return `${val.toFixed(1)}%`

    case 'number':
    default:
      return new Intl.NumberFormat('zh-TW').format(Math.round(val))
  }
})
</script>

<style scoped>
.metric-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid #e8eaed;
  background: linear-gradient(135deg, #ffffff 0%, #fafbfc 100%);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    transform: translateY(-4px);
    border-color: #1976d2;
  }

  &.loading {
    opacity: 0.7;
  }
}

.card-content {
  text-align: center;
  padding: 14px 10px;
}

.metric-icon {
  margin-bottom: 6px;
  display: flex;
  justify-content: center;
}

.metric-title {
  font-weight: 600;
  font-size: 12px;
  letter-spacing: 0.2px;
  color: #666;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.metric-value {
  font-size: 28px;
  font-weight: 800;
  line-height: 1.1;
  margin: 4px 0 6px 0;
  letter-spacing: -0.5px;
}

.metric-subtitle {
  font-size: 12px;
  font-weight: 600;
  color: #1976d2;
  line-height: 1.3;
  white-space: normal;
  word-break: break-word;
}

.metric-trend {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
