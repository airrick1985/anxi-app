<template>
  <v-card class="personnel-ranking-card">
    <v-data-table
      :headers="headers"
      :items="personnelStats"
      item-key="name"
      class="elevation-0"
      density="comfortable"
    >
      <!-- 排名列 -->
      <template v-slot:item.rank="{ index }">
        <v-chip
          :color="getRankColor(index)"
          text-color="white"
          class="font-weight-bold"
          size="small"
        >
          {{ index + 1 }}
        </v-chip>
      </template>

      <!-- 銷售人員列 -->
      <template v-slot:item.name="{ item, index }">
        <div class="personnel-name">
          <v-icon v-if="index < 3 && item.soldCount >= 1" color="amber" size="small" class="mr-2">
            mdi-star
          </v-icon>
          <span>{{ item.name }}</span>
        </div>
      </template>

      <!-- 成交戶數列 -->
      <template v-slot:item.soldCount="{ item }">
        <div class="text-center font-weight-bold text-h6 text-primary">
          {{ item.soldCount }}
        </div>
      </template>

      <!-- 銷售金額列 -->
      <template v-slot:item.totalAmount="{ item }">
        <div class="amount-cell">
          <div class="amount-value text-success font-weight-bold">
            {{ formatCurrency(item.totalAmount) }}
          </div>
          <div v-if="item.byStatus && Object.keys(item.byStatus).length > 0" class="status-breakdown-text">
            <div v-for="(count, status) in item.byStatus" :key="status" class="status-line">
              {{ status }}: {{ count }}戶({{ formatCurrency(item.byStatusAmount[status] || 0) }})
            </div>
          </div>
        </div>
      </template>

      <!-- 溢差價列 -->
      <template v-slot:item.premiumAmount="{ item }">
        <div class="premium-cell" :class="{ 'positive': item.premiumAmount >= 0 }">
          <span :class="item.premiumAmount >= 0 ? 'text-success' : 'text-error'">
            {{ formatCurrency(item.premiumAmount) }}
          </span>
        </div>
      </template>

      <!-- 空狀態 -->
      <template v-slot:no-data>
        <div class="py-8 text-center text-grey">
          <v-icon size="48" class="mb-2">mdi-account-search-outline</v-icon>
          <p>暫無銷售人員資料</p>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup>
import { computed, defineProps } from 'vue'

const props = defineProps({
  personnelStats: {
    type: Array,
    required: true,
    // 每個項目格式: { name, soldCount, totalAmount, premiumAmount, byStatus, byStatusAmount }
  },
})

const headers = [
  { title: '排名', key: 'rank', width: '60px', align: 'center' },
  { title: '銷售人員', key: 'name', width: '120px' },
  { title: '成交戶數', key: 'soldCount', width: '100px', align: 'center' },
  { title: '銷售金額', key: 'totalAmount', width: '150px', align: 'end' },
  { title: '溢差價', key: 'premiumAmount', width: '120px', align: 'end' },
]


/**
 * 格式化貨幣 (以萬元顯示)
 * 注：金額已為萬元單位 (來自 price_transaction_house、price_floor_house_total 等)
 */
const formatCurrency = (amount) => {
  const num = Number(amount) || 0
  return `${num.toLocaleString('zh-TW', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} 萬`
}

/**
 * 根據排名獲取顏色
 */
const getRankColor = (idx) => {
  switch (idx) {
    case 0:
      return '#FFD700' // 金色
    case 1:
      return '#C0C0C0' // 銀色
    case 2:
      return '#CD7F32' // 銅色
    default:
      return '#9E9E9E' // 灰色
  }
}
</script>

<style scoped>
.personnel-ranking-card {
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  overflow: hidden;

  :deep(.v-data-table) {
    background-color: transparent;
  }

  :deep(.v-data-table__header) {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);

    th {
      font-weight: 700 !important;
      color: white !important;
      border-bottom: none;
      font-size: 12px !important;
      text-transform: uppercase;
      letter-spacing: 0.2px;
      padding: 10px 8px !important;
      height: auto !important;
    }
  }

  :deep(.v-data-table__tr) {
    border-bottom: 1px solid #f0f0f0;
    transition: all 0.2s ease;

    &:hover {
      background-color: #f5f8ff;
    }

    td {
      padding: 10px 8px;
      font-size: 13px;
    }
  }

  :deep(.v-data-table__tr:last-child) {
    border-bottom: none;
  }
}

.personnel-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #1a1a1a;
  gap: 6px;
}

.amount-cell {
  text-align: right;
}

.amount-value {
  font-size: 15px;
  font-weight: 800;
  line-height: 1.4;
  color: #1976d2;
}

.status-breakdown-text {
  margin-top: 12px;
  font-size: 12px;
  color: #666;
  border-top: 2px solid #e8eaed;
  padding-top: 10px;
  background: #f9fafb;
  padding: 10px;
  border-radius: 6px;
  margin: 10px -12px -12px -12px;
}

.status-line {
  line-height: 1.6;
  padding: 4px 0;
  font-weight: 500;
}

.premium-cell {
  text-align: right;
  padding: 8px 12px;
  border-radius: 6px;

  &.positive {
    background-color: #e8f5e9;
  }

  span {
    font-weight: 700;
    font-size: 14px;
  }
}
</style>
