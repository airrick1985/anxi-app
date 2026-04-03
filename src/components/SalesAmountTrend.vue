<template>
  <v-card class="trend-chart-card">
    <v-card-title class="d-flex align-center">
      <v-icon class="mr-2">mdi-chart-line</v-icon>
      銷售金額趨勢
    </v-card-title>
    <v-divider></v-divider>
    <v-card-text>
      <div v-if="chartData.labels.length > 0" class="chart-container">
        <Line :data="chartData" :options="chartOptions" />
      </div>
      <div v-else class="empty-state d-flex align-center justify-center" style="height: 300px">
        <div class="text-center text-grey">
          <v-icon size="48" class="mb-2">mdi-chart-line-variant</v-icon>
          <p>暫無趨勢數據</p>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { computed, defineProps } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps({
  dailyTrend: {
    type: Array,
    required: true,
    // [{ date, amount, count, premium }]
  },
})

/**
 * 圖表數據
 */
const chartData = computed(() => {
  const dates = props.dailyTrend.map(item => {
    const [year, month, day] = item.date.split('-')
    return `${month}/${day}` // 格式化為 MM/DD
  })

  // 注：金額已為萬元單位，無需轉換
  const amounts = props.dailyTrend.map(item => item.amount)

  return {
    labels: dates,
    datasets: [
      {
        label: '銷售金額 (萬元)',
        data: amounts,
        borderColor: '#1976d2',
        backgroundColor: 'rgba(25, 118, 210, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: '#1976d2',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
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
      display: true,
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
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 12,
        weight: 'bold',
      },
      bodyFont: {
        size: 12,
      },
      borderColor: 'rgba(0, 0, 0, 0.2)',
      borderWidth: 1,
      callbacks: {
        label(context) {
          const value = context.parsed.y
          const formatted = value.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
          return `金額: ${formatted} 萬`
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: '金額 (萬元)',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
      ticks: {
        font: {
          size: 11,
        },
        callback(value) {
          return value + '萬'
        },
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false,
      },
    },
    x: {
      title: {
        display: true,
        text: '日期',
        font: {
          size: 12,
          weight: 'bold',
        },
      },
      ticks: {
        font: {
          size: 11,
        },
      },
      grid: {
        display: false,
        drawBorder: false,
      },
    },
  },
}
</script>

<style scoped>
.trend-chart-card {
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
