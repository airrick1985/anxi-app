<!-- /src/components/ParkingSelectionModal.vue -->
<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="800px" persistent>
    <v-card>
      <v-card-title>為 {{ displayUnitId }} 選擇車位</v-card-title>
      <v-card-text>
        <!-- 已選車位列表 -->
        <v-table v-if="localSelectedParking.length > 0" density="compact">
          <thead>
            <tr><th>車位編號</th><th>尺寸</th><th>表價(萬)</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in localSelectedParking" :key="p['車位編號']">
              <td>{{ p['車位編號'] }}</td>
              <td>{{ p['車位尺寸'] }}</td>
              <td>{{ p['車位表價'] }}</td>
              <td><v-btn icon="mdi-delete" size="x-small" variant="text" color="red" @click="removeParking(index)"></v-btn></td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-center text-grey my-4">尚未選擇任何車位</p>
        
        <v-divider class="my-4"></v-divider>

        <!-- 新增車位區域 -->
        <v-row align="center">
          <v-col cols="8">
       <v-select
              label="選擇可新增的車位"
              :items="availableParkingOptions"
              v-model="newParkingSelection"
              item-title="displayText"
              item-value="originalData"
              :item-props="itemProps" 
              return-object
              hide-details
            ></v-select>
          </v-col>
          <v-col cols="4">
             <v-btn color="primary" @click="addParking" :disabled="!newParkingSelection">新增此車位</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-btn color="success" @click="confirm">確定</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits } from 'vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  unitId: { type: String, default: '' },
  allParkingData: { type: Array, default: () => [] },
  initialSelectedParking: { type: Array, default: () => [] }
});

const emit = defineEmits(['update:show', 'confirm']);

const localSelectedParking = ref([]);
const newParkingSelection = ref(null);

// 當 Modal 打開時，用傳入的初始值初始化本地狀態
watch(() => props.show, (newVal) => {
  if (newVal) {
    localSelectedParking.value = [...props.initialSelectedParking];
    newParkingSelection.value = null;
  }
});

// ✅ 關鍵修改：使用 lastIndexOf 確保能處理像 D-17 這樣的戶別
const displayUnitId = computed(() => {
  if (!props.unitId) return '';

  const lastHyphenIndex = props.unitId.lastIndexOf('-');
  
  // 如果找不到 '-' 或 '-' 在第一個位置，則返回原字串 (安全機制)
  // 否則，返回從頭到最後一個 '-' 位置前的子字串
  if (lastHyphenIndex > 0) {
    return props.unitId.substring(0, lastHyphenIndex);
  }
  
  return props.unitId; // Fallback to the original string
});


const availableParkingOptions = computed(() => {
  const selectedIds = new Set(localSelectedParking.value.map(p => p['車位編號']));
  return props.allParkingData.map(p => {
    const isSold = p['銷控狀態'] === '已售';
    const isSelected = selectedIds.has(p['車位編號']);
    return {
      // 顯示文本，例如 "B1-01 (已售)"
      displayText: `${p['車位編號']}${p['銷控狀態'] ? ` (${p['銷控狀態']})` : ''}`,
      // 禁用條件
      disabled: isSold || isSelected,
      // 原始數據
      originalData: p
    };
  });
});

// ✅ 新增：定義 item-props 函數
const itemProps = (item) => {
  return {
    // 將我們在 availableParkingOptions 中計算好的 disabled 屬性，
    // 作為 prop 傳遞給 v-select 渲染出來的每一個 v-list-item
    disabled: item.disabled,
    // 我們也可以在這裡動態添加 class
    class: item.disabled ? 'text-grey' : ''
  };
};

function addParking() {

  // 檢查是否有選擇值，並且該值包含 originalData
  if (newParkingSelection.value && newParkingSelection.value.originalData) {
    // 將原始的車位資料物件推進陣列
    localSelectedParking.value.push(newParkingSelection.value.originalData);
    newParkingSelection.value = null; // 清空選擇
  }

}

function removeParking(index) {
  localSelectedParking.value.splice(index, 1);
}

function close() {
  emit('update:show', false);
}

function confirm() {
  emit('confirm', localSelectedParking.value);
}
</script>