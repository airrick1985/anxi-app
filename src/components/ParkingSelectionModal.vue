<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="800px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">為 {{ displayUnitId }} 選擇車位
         <v-btn 
          prepend-icon="mdi-presentation" 
          variant="tonal" 
          color="info"
          @click="$emit('request-open-slide')"
        >
          車位總表
        </v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-table v-if="localSelectedParking.length > 0" density="compact">
          <thead>
            <tr><th>車位編號</th><th>尺寸</th><th>車位價格(萬)</th><th>刪除</th></tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in localSelectedParking" :key="p['車位編號']">
              <td>{{ p['車位編號'] }}</td>
              <td>{{ p['車位尺寸'] }}</td>
              <td>{{ p['車位表價'] }}</td>
              <td><v-btn icon="mdi-close-circle-outline" size="M-small" variant="text" color="red" @click="removeParking(index)"></v-btn></td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-center text-grey my-4">尚未選擇任何車位</p>
        
        <v-divider class="my-4"></v-divider>

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

// ✅ 2. 在 defineEmits 中註冊新的事件名稱
const emit = defineEmits(['update:show', 'confirm', 'request-open-slide']);

const localSelectedParking = ref([]);
const newParkingSelection = ref(null);

watch(() => props.show, (newVal) => {
  if (newVal) {
    localSelectedParking.value = [...props.initialSelectedParking];
    newParkingSelection.value = null;
  }
});

const displayUnitId = computed(() => {
  if (!props.unitId) return '';
  const lastHyphenIndex = props.unitId.lastIndexOf('-');
  if (lastHyphenIndex > 0) {
    return props.unitId.substring(0, lastHyphenIndex);
  }
  return props.unitId;
});

const availableParkingOptions = computed(() => {
  const selectedIds = new Set(localSelectedParking.value.map(p => p['車位編號']));
  return props.allParkingData.map(p => {
    const isSold = p['銷控狀態'] === '已售';
    const isSelected = selectedIds.has(p['車位編號']);
    return {
      displayText: `${p['車位編號']}${p['銷控狀態'] ? ` (${p['銷控狀態']})` : ''}`,
      disabled: isSold || isSelected,
      originalData: p
    };
  });
});

const itemProps = (item) => {
  return {
    disabled: item.disabled,
    class: item.disabled ? 'text-grey' : ''
  };
};

function addParking() {
  if (newParkingSelection.value && newParkingSelection.value.originalData) {
    localSelectedParking.value.push(newParkingSelection.value.originalData);
    newParkingSelection.value = null;
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
  close(); // 確認後也關閉視窗
}
</script>