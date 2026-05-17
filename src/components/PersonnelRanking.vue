<template>
  <v-card class="personnel-ranking-card">
    <v-data-table
      :headers="headers"
      :items="personnelStats"
      item-key="name"
      class="elevation-0"
      density="compact"
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
        <div class="count-cell text-primary">
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

      <!-- 退戶戶數列 -->
      <template v-slot:item.cancelledCount="{ item }">
        <div class="count-cell text-error">
          {{ item.cancelledCount || 0 }}
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
    // 每個項目格式: { name, soldCount, totalAmount, premiumAmount, byStatus, byStatusAmount, cancelledCount }
  },
})

const headers = [
  { title: '排名', key: 'rank', width: '56px', align: 'center', sortable: false },
  { title: '銷售人員', key: 'name', width: '100px' },
  { title: '成交戶數', key: 'soldCount', width: '92px', align: 'center' },
  { title: '退戶戶數', key: 'cancelledCount', width: '92px', align: 'center' },
  // 銷售金額不設固定寬度：讓內容最多的此欄吸收多餘空間，其餘欄位保持緊湊
  { title: '銷售金額', key: 'totalAmount', align: 'end' },
  { title: '溢差價', key: 'premiumAmount', width: '100px', align: 'end' },
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
  /* 不讓表格被寬版面拉開：限制寬度並置中，欄位自然靠攏 */
  max-width: 760px;
  margin-inline: auto;

  :deep(.v-table) {
    background-color: transparent;
  }

  /* Vuetify 3 DOM：表頭是 thead > tr > th，整列套漸層底 */
  :deep(thead) {
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  }

  :deep(thead th) {
    background: transparent !important;
    color: #fff !important;
    font-weight: 700 !important;
    border-bottom: none !important;
    font-size: 12.5px !important;
    letter-spacing: 0.3px;
    padding: 9px 10px !important;
    height: auto !important;
    white-space: nowrap !important;
  }

  /* 關鍵：表頭文字實際在這個 flex 內層 span，要在這裡強制不換行 */
  :deep(thead th .v-data-table-header__content) {
    white-space: nowrap !important;
    flex-wrap: nowrap !important;
  }

  :deep(thead th .v-data-table-header__content > span) {
    white-space: nowrap !important;
  }

  :deep(tbody td) {
    padding: 7px 10px !important;
    font-size: 13px;
    border-bottom: 1px solid #eef1f5 !important;
  }

  :deep(tbody tr) {
    transition: background-color 0.18s ease;
  }

  :deep(tbody tr:hover) {
    background-color: #f5f8ff;
  }

  :deep(tbody tr:last-child td) {
    border-bottom: none !important;
  }
}

.personnel-name {
  display: flex;
  align-items: center;
  font-weight: 600;
  font-size: 13.5px;
  color: #1a1a1a;
  gap: 4px;
  white-space: nowrap;
}

/* 戶數：醒目但不過大，避免列被撐高、視覺空隙變大 */
.count-cell {
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  line-height: 1.2;
}

.amount-cell {
  text-align: right;
}

.amount-value {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.35;
  color: #1976d2;
  white-space: nowrap;
}

/* 明細區改為置中包覆的小卡，移除原本依賴 td 內距的負邊界 */
.status-breakdown-text {
  margin-top: 8px;
  padding: 7px 9px;
  font-size: 11.5px;
  color: #5f6b7a;
  background: #f7f9fc;
  border: 1px solid #eceff3;
  border-radius: 6px;
  text-align: left;
}

.status-line {
  line-height: 1.55;
  padding: 1px 0;
  font-weight: 500;
  white-space: nowrap;
}

.premium-cell {
  display: inline-block;
  text-align: right;
  padding: 3px 8px;
  border-radius: 6px;

  &.positive {
    background-color: #e8f5e9;
  }

  span {
    font-weight: 700;
    font-size: 13.5px;
    white-space: nowrap;
  }
}
</style>
