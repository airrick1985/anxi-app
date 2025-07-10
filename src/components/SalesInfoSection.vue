<template>
  <div v-if="salesData">
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="mb-5" elevation="2" style="height: 100%;">
            <v-card-item class="card-header-accent">
                <v-card-title>
                    <v-icon start>mdi-calculator-variant</v-icon>
                    成交總覽
                </v-card-title>
            </v-card-item>
            <v-divider></v-divider>
            <v-card-text class="price-summary">
                <div class="price-item">
                    <span class="price-label">合約方式</span>
                    <span class="price-value-static">{{ salesData['合約方式'] || 'N/A' }}</span>
                </div>
                <div class="price-item">
                    <span class="price-label">是否首購</span>
                    <span class="price-value-static">{{ salesData['是否首購'] || 'N/A' }}</span>
                </div>
                <v-divider class="my-2"></v-divider>
                <div class="price-item">
                    <span class="price-label">房屋成交價</span>
                    <div class="d-flex flex-column align-end">
                        <span class="price-value">{{ formatNumber(salesData['房屋成交價']) }} 萬</span>
                        <small class="text-grey">{{ formatNumber(unitSalePrice, 2) }} 萬/坪</small>
                    </div>
                </div>
                <div class="price-item">
                    <span class="price-label">房屋底價</span>
                     <div class="d-flex flex-column align-end">
                        <span class="price-value price-value-secondary">{{ formatNumber(houseBasePrice) }} 萬</span>
                        <small class="text-grey">{{ formatNumber(houseBaseUnitPrice, 2) }} 萬/坪</small>
                    </div>
                </div>
                
                <v-divider class="my-2"></v-divider>
                
                <div class="parking-header-embedded">
                    <div class="parking-col id">車位編號</div>
                    <div class="parking-col size">尺寸</div>
                    <div class="parking-col price">底價</div>
                    <div class="parking-col price sale">成交價</div>
                </div>
                <div v-if="parkingInfo && parkingInfo.length > 0" class="parking-table-embedded">
                    <div class="parking-body">
                        <template v-for="(parking) in parkingInfo" :key="parking['車位編號']">
                            <div class="parking-row">
                                <div class="parking-col id" data-label="編號">{{ parking['車位編號'] }}</div>
                                <div class="parking-col size" data-label="尺寸">{{ parking['車位尺寸'] || '標準' }}</div>
                                <div class="parking-col price" data-label="底價 (萬)">{{ formatNumber(parking['車位底價']) }}</div>
                                <div class="parking-col price sale" data-label="成交價 (萬)">{{ formatNumber(parking['車位成交價'] || parking['車位總價']) }}</div>
                            </div>
                        </template>
                    </div>
                </div>
                <p v-else class="text-center text-grey-darken-1 py-2">-- 無持有車位 --</p>
                <v-divider class="my-2"></v-divider>

                <div class="price-item pt-0">
                    <span class="price-label">車位總成交價</span>
                    <span class="price-value">{{ formatNumber(parkingSalePrice) }} 萬</span>
                </div>
                <div class="price-item">
                    <span class="price-label">車位總底價</span>
                    <span class="price-value price-value-secondary">{{ formatNumber(parkingBasePrice) }} 萬</span>
                </div>
                <v-divider class="my-2 thick-divider"></v-divider>
                <div class="price-item total">
                    <span class="price-label">成交總價</span>
                    <span class="price-value total-value">{{ formatNumber(totalSalePrice) }} 萬</span>
                </div>
                <div class="price-item total">
                    <span class="price-label">總底價</span>
                    <span class="price-value total-value text-red">{{ formatNumber(totalBasePrice) }} 萬</span>
                </div>
                <v-divider class="my-2"></v-divider>
                <div class="price-item difference" :class="priceDifference.colorClass">
                    <span class="price-label">溢差價</span>
                    <span class="price-value">{{ priceDifference.text }}</span>
                </div>
            </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <div class="info-section">
          <div class="section-title">
            <v-icon>mdi-information-outline</v-icon>
            銷售資訊
          </div>
          
          <div class="sales-info-grid">
            <div class="info-item">
              <span class="info-label">後台狀態</span>
              <span class="info-value">{{ salesData['銷控後台狀態'] || 'N/A' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">銷售人員</span>
              <span class="info-value">{{ salesData['銷售'] || 'N/A' }}</span>
            </div>
            <v-divider class="my-1"></v-divider>
            <div class="info-item">
              <span class="info-label">小訂日期</span>
              <span class="info-value">{{ formatDate(salesData['小訂日期']) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">小訂金額</span>
              <span class="info-value">{{ formatNumber(salesData['小訂金額']) }} 元</span>
            </div>
            <v-divider class="my-1"></v-divider>
            <div class="info-item">
              <span class="info-label">補足日期</span>
              <span class="info-value">{{ formatDate(salesData['補足日期']) }}</span>
            </div>
             <div class="info-item">
              <span class="info-label">補足金額</span>
              <span class="info-value">{{ formatNumber(salesData['補足金額']) }} 元</span>
            </div>
            <v-divider class="my-1"></v-divider>
             <div class="info-item">
              <span class="info-label">簽約日期</span>
              <span class="info-value">{{ formatDate(salesData['簽約日期']) }}</span>
            </div>
             <div class="info-item">
              <span class="info-label">簽約金額</span>
              <span class="info-value">{{ formatNumber(salesData['簽約金額']) }} 元</span>
            </div>
          </div>
        </div>
      </v-col>

      <v-col cols="12" md="4">
        <div class="info-section">
          <div class="section-title">
            <v-icon>mdi-account-details</v-icon>
            買方資訊
          </div>
          <v-list lines="one" density="compact" class="bg-transparent">
            <v-row>
              <v-col cols="12">
                <v-list-item title="買方姓名" :subtitle="salesData['買方姓名'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item title="身分證字號" :subtitle="salesData['身分證字號'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item title="聯絡電話" :subtitle="salesData['電話'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item title="EMAIL" :subtitle="salesData['EMAIL'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item title="婚姻狀況" :subtitle="salesData['婚姻狀況'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item title="介紹人姓名" :subtitle="salesData['介紹人姓名'] || 'N/A'" density="compact"></v-list-item>
                <v-list-item
                  title="通訊地址"
                  :subtitle="(salesData['通訊地址_縣市'] || '') + (salesData['通訊地址_區域'] || '')+ (salesData['通訊地址_詳細'] || '') || 'N/A'"
                   density="compact">
                </v-list-item>
              </v-col>
            </v-row>
          </v-list>
        </div>

        <div class="info-section mt-4 pa-3">
            <div class="section-title">備註</div>
            <p class="note-content">{{ salesData['備註'] || '無' }}</p>
        </div>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { computed, defineProps } from 'vue'; 

const props = defineProps({
  salesData: { type: Object, required: true },
  allParkingData: { type: Array, default: () => [] } 
});

const houseBasePrice = computed(() => Number(props.salesData?.['房屋總底價'] || 0));
const parkingInfo = computed(() => {
    const parkingData = props.salesData?.['持有車位'] || [];
    if (Array.isArray(parkingData) && parkingData.length > 0) return parkingData;
    const parkingIdsString = props.salesData?.['車位'];
    if (typeof parkingIdsString === 'string' && parkingIdsString) {
        const parkingIds = parkingIdsString.split(',');
        return props.allParkingData.filter(p => parkingIds.includes(p['車位編號']));
    }
    return [];
});
const parkingSalePrice = computed(() => parkingInfo.value.reduce((sum, p) => sum + (Number(p['車位成交價'] || p['車位總價']) || 0), 0));
const parkingBasePrice = computed(() => parkingInfo.value.reduce((sum, p) => sum + (Number(p['車位底價']) || 0), 0));
const totalSalePrice = computed(() => (Number(props.salesData?.['房屋成交價'] || 0)) + parkingSalePrice.value);
const totalBasePrice = computed(() => houseBasePrice.value + parkingBasePrice.value);
const unitSalePrice = computed(() => {
    const housePrice = Number(props.salesData?.['房屋成交價'] || 0);
    const area = Number(props.salesData?.['房屋面積(坪)']);
    if (!area || area === 0) return 0;
    return (housePrice / area);
});
const houseBaseUnitPrice = computed(() => {
    const area = Number(props.salesData?.['房屋面積(坪)']);
    if (!area || area === 0) return 0;
    return (houseBasePrice.value / area);
});
const priceDifference = computed(() => {
  const diff = totalSalePrice.value - totalBasePrice.value;
  if (isNaN(diff)) return { text: 'N/A', colorClass: '' };
  const formattedValue = formatNumber(Math.abs(diff), 2);
  if (diff > 0) return { text: `+${formattedValue} 萬`, colorClass: 'positive' };
  if (diff < 0) return { text: `-${formattedValue} 萬`, colorClass: 'negative' };
  return { text: `${formatNumber(diff, 2)} 萬`, colorClass: '' };
});

function formatDate(dateString) {
  if (!dateString || typeof dateString !== 'string') return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  } catch (error) {
    return "N/A";
  }
}
function formatNumber(value, frac = 0) {
  const num = parseFloat(value);
  if (isNaN(num)) return frac > 0 ? (0).toFixed(frac) : '0';
  return num.toLocaleString('en-US', { minimumFractionDigits: frac, maximumFractionDigits: frac });
}
</script>

<style scoped>
.info-section {
  padding: 12px 16px; border: 1px solid #e0e0e0; border-radius: 8px;
}
.section-title {
  font-size: 1.1rem; font-weight: 600; color: #1a3a6e;
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e0e0e0;
  display: flex; align-items: center; gap: 8px;
}
.note-content {
  font-size: 0.9rem; white-space: pre-wrap; word-break: break-all; color: #333;
}
:deep(.v-list-item-title) {
  font-size: 0.8rem; color: #555; margin-bottom: 2px;
}
:deep(.v-list-item-subtitle) {
  font-size: 0.95rem !important; font-weight: 500 !important;
  color: #212121 !important; line-height: 1.4 !important;
}
.v-list-item { padding-inline: 8px !important; }

.sales-info-grid {
  display: grid; grid-template-columns: 1fr; gap: 0px; padding: 8px 0;
}
.info-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 4px;
}
.info-label {
  font-size: 0.9rem; color: #555;
}
.info-value {
  font-size: 0.95rem; font-weight: 500; color: #212121;
}

/* Parking Table Styles */
.parking-header-embedded {
  display: flex; font-weight: 600; font-size: 0.8rem; color: #555;
  padding: 4px; margin-bottom: 4px;
}
.parking-table-embedded .parking-row {
  display: flex; align-items: center;
  padding: 8px 4px; border-bottom: 1px solid #f5f5f5;
}
.parking-table-embedded .parking-body .parking-row:last-child {
  border-bottom: none;
}
.parking-col { padding: 0 4px; }
.parking-col.id    { flex: 0 0 90px; font-weight: 600; }
.parking-col.size  { flex: 1 1 auto; }
.parking-col.price { flex: 0 0 70px; text-align: right; }
.parking-col.price.sale { color: #1E88E5; font-weight: 600; }

@media (max-width: 959px) {
  .parking-header-embedded { display: none; }
  .parking-table-embedded .parking-row {
    flex-direction: column; align-items: stretch;
    border: 1px solid #eee; border-radius: 4px;
    margin-bottom: 8px; padding: 8px;
  }
  .parking-table-embedded .parking-col {
    display: flex; justify-content: space-between;
    width: 100%; padding: 6px 0;
  }
   .parking-table-embedded .parking-col:not(:last-child) {
     border-bottom: 1px dashed #eee;
   }
  .parking-table-embedded .parking-col::before {
    content: attr(data-label);
    font-weight: 600;
  }
}

/* Price Overview Card Styles */
.card-header-accent { background-color: #E3F2FD; border-bottom: 1px solid #90CAF9; }
.price-summary { padding: 16px; }
.price-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; font-size: 1rem; }
.price-label { color: #555; }
.price-value { font-weight: 600; font-size: 1.1rem; color: #333; }
.price-value-static { font-weight: 500; font-size: 1rem; color: #333; }
.price-value-secondary { color: #546E7A; font-weight: 400; }
.total { font-size: 1.2rem; }
.total .price-label { font-weight: bold; color: #212121; }
.total .total-value { color: #1E88E5; font-size: 1.6rem; font-weight: 700; }
.total .total-value.text-red { color: #C62828 !important; }
.difference { font-size: 1.1rem; }
.difference .price-label { font-weight: 500; }
.difference.positive .price-value { color: #2E7D32; font-weight: 700; font-size: 1.2rem; }
.difference.negative .price-value { color: #C62828; font-weight: 700; font-size: 1.2rem; }
.thick-divider { border-top-width: 2px !important; border-color: #90CAF9 !important; opacity: 1; }
</style>