<template>
  <v-dialog
    :model-value="show"
    @update:model-value="$emit('update:show', $event)"
    max-width="1000px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon left class="mr-2">mdi-chart-box</v-icon>
        退戶統計分析
      </v-card-title>

      <v-card-text class="py-4">
        <!-- 關鍵指標 -->
        <v-row class="mb-4">
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4 text-center">
              <div class="text-caption text-grey">總退戶數</div>
              <div class="text-h5 font-weight-bold text-primary">{{ validItems.length }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4 text-center">
              <div class="text-caption text-grey">有原因記錄</div>
              <div class="text-h5 font-weight-bold text-success">{{ itemsWithReasons }}</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4 text-center">
              <div class="text-caption text-grey">最常見原因</div>
              <div class="text-body-2 font-weight-bold">{{ topReason }}</div>
              <div class="text-caption text-grey">{{ topReasonCount }} 筆</div>
            </v-card>
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-card variant="outlined" class="pa-4 text-center">
              <div class="text-caption text-grey">退戶最多業務員</div>
              <div class="text-body-2 font-weight-bold">{{ topSalesperson }}</div>
              <div class="text-caption text-grey">{{ topSalespersonCount }} 筆</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- 圖表 -->
        <v-divider class="my-4"></v-divider>
        <v-row>
          <!-- 退戶原因分布圖 -->
          <v-col cols="12" md="6" v-if="reasonStats.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-3">退戶原因分布</div>
            <div style="height: 300px; position: relative;">
              <Doughnut
                :key="`doughnut-${reasonStats.length}`"
                :data="reasonChartData"
                :options="chartOptions"
              />
            </div>
          </v-col>
          <v-col cols="12" md="6" v-else>
            <div class="text-caption text-grey text-center py-16">
              <v-icon class="mb-2">mdi-information-outline</v-icon>
              <p>暫無退戶原因數據</p>
            </div>
          </v-col>

          <!-- 業務員退戶排名 -->
          <v-col cols="12" md="6" v-if="salespersonStats.length > 0">
            <div class="text-subtitle-2 font-weight-bold mb-3">業務員退戶排名</div>
            <div :style="{ height: Math.max(300, salespersonStats.length * 40) + 'px', position: 'relative' }">
              <Bar
                :key="`bar-${salespersonStats.length}`"
                :data="salespersonChartData"
                :options="barChartOptions"
              />
            </div>
          </v-col>
          <v-col cols="12" md="6" v-else>
            <div class="text-caption text-grey text-center py-16">
              <v-icon class="mb-2">mdi-information-outline</v-icon>
              <p>暫無業務員數據</p>
            </div>
          </v-col>
        </v-row>

        <!-- 詳細退戶原因列表 -->
        <v-divider class="my-4"></v-divider>
        <div class="text-subtitle-2 font-weight-bold mb-3">退戶原因詳細統計</div>
        <v-table density="compact" v-if="reasonStats.length > 0">
          <thead>
            <tr>
              <th>退戶原因</th>
              <th style="text-align: right">筆數</th>
              <th style="text-align: right">占比</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="([reason, count], idx) in reasonStats" :key="idx">
              <td>{{ reason }}</td>
              <td style="text-align: right" class="font-weight-bold">{{ count }}</td>
              <td style="text-align: right" class="text-caption">
                {{ validItems.length > 0 ? ((count / validItems.length) * 100).toFixed(1) : 0 }}%
              </td>
            </tr>
          </tbody>
        </v-table>
        <div v-else class="text-caption text-grey">暫無數據</div>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="flat" @click="$emit('update:show', false)">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits, computed, onBeforeUnmount } from 'vue';
import { normalizeSalespersons } from '@/utils/salespersonUtils';
import { Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const props = defineProps({
  show: { type: Boolean, required: true },
  items: { type: Array, default: () => [] },
});

defineEmits(['update:show']);

// 過濾掉冷刪除的項目
const validItems = computed(() => {
  return props.items.filter(item => !item.isDeleted);
});

// 退戶原因統計
const reasonStats = computed(() => {
  const counts = {};
  validItems.value.forEach(item => {
    (item.cancelReasons || []).forEach(reason => {
      counts[reason] = (counts[reason] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);
});

// 業務員退戶統計（複選：平均分配制，一戶 N 人各分攤 1/N）
const salespersonStats = computed(() => {
  const counts = {};
  validItems.value.forEach(item => {
    const persons = normalizeSalespersons(item.salesperson);
    if (persons.length === 0) {
      counts['未知'] = (counts['未知'] || 0) + 1;
      return;
    }
    const share = 1 / persons.length;
    persons.forEach(name => {
      counts[name] = (counts[name] || 0) + share;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1]);
});

// KPI 計算
const itemsWithReasons = computed(() => {
  return validItems.value.filter(item => item.cancelReasons && item.cancelReasons.length > 0).length;
});

const topReason = computed(() => {
  return reasonStats.value.length > 0 ? reasonStats.value[0][0] : '—';
});

const topReasonCount = computed(() => {
  return reasonStats.value.length > 0 ? reasonStats.value[0][1] : 0;
});

const topSalesperson = computed(() => {
  return salespersonStats.value.length > 0 ? salespersonStats.value[0][0] : '—';
});

const topSalespersonCount = computed(() => {
  return salespersonStats.value.length > 0 ? salespersonStats.value[0][1] : 0;
});

// 退戶原因圓餅圖
const reasonChartData = computed(() => {
  const colors = [
    '#EF5350', '#AB47BC', '#42A5F5', '#29B6F6', '#26C6DA',
    '#26A69A', '#66BB6A', '#FDD835', '#FFA726', '#EC407A',
    '#AF52DE', '#5E35B1', '#3949AB', '#1565C0', '#00838F', '#00695C'
  ];
  return {
    labels: reasonStats.value.map(item => item[0]),
    datasets: [
      {
        data: reasonStats.value.map(item => item[1]),
        backgroundColor: colors.slice(0, reasonStats.value.length),
        borderColor: '#fff',
        borderWidth: 2,
      }
    ]
  };
});

// 業務員條形圖
const salespersonChartData = computed(() => {
  return {
    labels: salespersonStats.value.map(item => item[0]),
    datasets: [
      {
        label: '退戶數',
        data: salespersonStats.value.map(item => item[1]),
        backgroundColor: '#42A5F5',
        borderRadius: 4,
      }
    ]
  };
});

// 圖表選項
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        font: { size: 12 },
        padding: 15,
      }
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const value = context.parsed;
          const percentage = ((value / total) * 100).toFixed(1);
          return `${value} 筆 (${percentage}%)`;
        }
      }
    }
  }
};

const barChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        font: { size: 12 }
      }
    }
  },
  scales: {
    x: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    },
    y: {
      ticks: {
        font: { size: 11 }
      }
    }
  }
};

// 清理 Chart.js 實例（防止內存洩漏）
onBeforeUnmount(() => {
  try {
    if (ChartJS && ChartJS.instances) {
      ChartJS.instances.forEach(instance => {
        if (instance && instance.destroy) {
          instance.destroy();
        }
      });
    }
  } catch (e) {
    console.warn('清理 Chart 實例時出錯:', e);
  }
});
</script>

<style scoped>
/* 無額外樣式需求 */
</style>
