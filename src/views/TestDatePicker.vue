<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card>
          <v-card-title class="text-h5 text-center py-4">
            自訂日期事件測試 (使用 vue-datepicker)
          </v-card-title>
          <v-card-text>
            <VueDatePicker 
              v-model="date" 
              inline 
              auto-apply 
              locale="zh-TW"
              :enable-time-picker="false"
            >
              <template #day="{ date }">
                <div class="custom-day-cell">
                  <div class="date-number">{{ date.getDate() }}</div>
                  
                  <div v-if="getEventInfo(date)" class="event-symbol">
                    <v-icon 
                      :icon="getEventInfo(date).icon" 
                      :color="getEventInfo(date).color"
                      size="x-small"
                    ></v-icon>
                  </div>
                  </div>
              </template>
            </VueDatePicker>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const date = ref(new Date('2025-10-13'));

// ✓ START: 修改 - 更新資料結構以包含 icon 和 color
const events = ref({
  '2025-10-13': { icon: 'mdi-circle-outline', color: 'green' }, // 綠色的 O
  '2025-10-14': { icon: 'mdi-triangle-outline', color: 'blue' },  // 藍色的三角形
  '2025-10-25': { icon: 'mdi-close', color: 'red' },      // 紅色的 X
  '2025-11-13': { icon: 'mdi-circle-outline', color: 'green' }, // 綠色的 O
  '2025-11-14': { icon: 'mdi-triangle-outline', color: 'blue' },  // 藍色的三角形
  '2025-11-25': { icon: 'mdi-close', color: 'red' },      // 紅色的 X
});
// ✓ END: 修改

const formatDate = (dateObj) => {
  if (!dateObj) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ✓ START: 修改 - 函式名稱以反映其回傳整個物件
const getEventInfo = (dateObj) => {
  if (!dateObj) return null;
  const dateString = formatDate(dateObj);
  return events.value[dateString] || null;
};
// ✓ END: 修改
</script>

<style scoped>
.custom-day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.date-number {
  line-height: 1;
}

/* ✓ START: 修改 - 優化圖示的樣式 */
.event-symbol {
  position: absolute;
  bottom: -12px; /* 稍微調整垂直位置 */
  left: 0;
  right: 0;
  text-align: center;
  line-height: 1;
  pointer-events: none;
}
/* ✓ END: 修改 */
</style>