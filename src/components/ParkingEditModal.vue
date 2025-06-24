<template>
  <v-dialog :model-value="show" @update:model-value="close" max-width="800px" persistent>
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span>編輯持有車位</span>
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
        <v-table v-if="localParking.length > 0" density="compact">
          <thead>
            <tr>
              <th>車位編號</th>
              <th>底價</th>
              <th style="width: 150px;">成交價</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, index) in localParking" :key="p['車位編號']">
              <td>{{ p['車位編號'] }}</td>
              <td>{{ p['車位底價'] }}</td>
              <td>
                <v-text-field
                  v-model.number="p['車位成交價']"
                  type="number"
                  density="compact"
                  hide-details
                  variant="outlined"
                ></v-text-field>
              </td>
              <td>
                <v-btn icon="mdi-close-circle-outline" size="M-small" variant="text" color="red" @click="removeParking(index)"></v-btn>
              </td>
            </tr>
          </tbody>
        </v-table>
        <p v-else class="text-center text-grey my-4">尚未選擇任何車位</p>
        <v-divider class="my-4"></v-divider>
        <v-row align="center" dense>
          <v-col cols="8">
            <v-select
              label="選擇可新增的車位"
              :items="availableParkingOptions"
              v-model="newParkingSelection"
              item-title="displayText"
              :item-props="itemProps"
              return-object
              hide-details
              no-data-text="沒有可選擇的車位"
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
  allParkingData: { type: Array, default: () => [] },
  initialSelectedParking: { type: Array, default: () => [] }
});

// ✅ 2. 在 defineEmits 中加入 'request-open-slide'
const emit = defineEmits(['update:show', 'confirm', 'request-open-slide']);

const localParking = ref([]);
const newParkingSelection = ref(null);

watch(() => props.show, (newVal) => {
  if (newVal) {
    localParking.value = JSON.parse(JSON.stringify(props.initialSelectedParking));
    newParkingSelection.value = null;
  }
});

const availableParkingOptions = computed(() => {
  const selectedIds = new Set(localParking.value.map(p => p['車位編號']));
  return props.allParkingData
    .filter(p => !selectedIds.has(p['車位編號']))
    .map(p => {
      const isSold = p['銷控狀態'] === '已售';
      const backendStatusText = p['銷控後台狀態'] ? ` - ${p['銷控後台狀態']}` : '';
      return {
        displayText: `${p['車位編號']} (表價: ${p['車位表價']}萬)${isSold ? ' - 已售' : ''}${backendStatusText}`,
        originalData: p,
        disabled: isSold
      };
    });
});

const itemProps = (item) => ({
  disabled: item.disabled,
  class: item.disabled ? 'text-grey' : ''
});

function addParking() {
  if (newParkingSelection.value && newParkingSelection.value.originalData) {
    const newSpot = { ...newParkingSelection.value.originalData };
    if (!newSpot['車位成交價']) {
      newSpot['車位成交價'] = newSpot['車位表價'];
    }
    localParking.value.push(newSpot);
    newParkingSelection.value = null;
  }
}

function removeParking(index) {
  localParking.value.splice(index, 1);
}

function close() {
  emit('update:show', false);
}

function confirm() {
  emit('confirm', localParking.value);
  close();
}
</script>