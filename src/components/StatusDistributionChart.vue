<template>
  <v-card class="status-chart-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chart-donut</v-icon>
      狀態分布
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <div v-if="chartData.labels.length > 0" class="chart-container">
        <Pie :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="empty-state d-flex align-center justify-center" style="height: 300px">
        <div class="text-center text-grey">
          <v-icon size="48" class="mb-2">mdi-chart-box-outline</v-icon>
          <p>暫無分布數據</p>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { Pie } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  statusDistribution: {
    type: Object,
    required: true,
    // { labels: Array, data: Array }
  },
  statusColors: {
    type: Object,
    default: () => ({}),
    // { status: colorCode }
  },
})

/**
 * 生成隨機顏色 (作為備用)
 */
const generateColor = (index) => {
  const colors = [
    '#1976d2',
    '#388e3c',
    '#d32f2f',
    '#f57c00',
    '#7b1fa2',
    '#0097a7',
    '#388e3c',
    '#c62828',
  ]
  return colors[index % colors.length]
}

/**
 * 圖表數據
 */
const chartData = computed(() => {
  const { labels = [], data = [] } = props.statusDistribution

  return {
    labels,
    datasets: [
      {
        label: '戶數',
        data,
        backgroundColor: labels.map((label, idx) => {
          return props.statusColors[label] || generateColor(idx)
        }),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }
})

/**
 * 圖表選項
 */
const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: {
          size: 12,
          family: "'Segoe UI', 'Microsoft JhengHei', sans-serif",
        },
        padding: 15,
        usePointStyle: true,
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0)
          const value = context.parsed
          const percentage = ((value / total) * 100).toFixed(1)
          return `${value} 戶 (${percentage}%)`
        },
      },
    },
  },
}
</script>

<style scoped>
.status-chart-card {
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.chart-container {
  position: relative;
  height: 300px;
  width: 100%;
  margin-top: 20px;
}

.empty-state {
  background-color: #fafafa;
  border-radius: 4px;
}
</style>
