<template>
  <v-dialog :model-value="modelValue" @update:model-value="val => emit('update:modelValue', val)" max-width="700px" persistent>
    <v-card>
      <v-card-title class="bg-primary">
        <span class="text-h5">編輯車位資訊 ({{ editedItem.spotId }})</span>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-container>
          <v-row>
            <v-col cols="12" sm="6">
              <div class="form-section-title">基本資料</div>
              <v-text-field v-model="editedItem.spotId" label="車位編號" readonly variant="outlined" density="compact" class="readonly-field"></v-text-field>
              <v-combobox v-model="editedItem.type" :items="['法定', '增設', '獎勵']" label="車位類型 (法定/增設...)" variant="outlined" density="compact" clearable></v-combobox>
              <v-combobox v-model="editedItem.type2" :items="['坡道平面', '坡道機械', '升降平面', '升降機械', '機械平面', '機械升降', '塔式車位']" label="車位形式 (坡平/機升...)" variant="outlined" density="compact" clearable></v-combobox>
              <v-text-field v-model="editedItem.size" label="車位尺寸"  variant="outlined" density="compact" ></v-text-field>
              <v-text-field v-model.number="editedItem.area" label="車位面積" suffix="m²" type="number" step="0.01" min="0" variant="outlined" density="compact"></v-text-field>
              <v-text-field v-model.number="editedItem.area_ping" label="車位面積" suffix="坪" type="number" step="0.01" min="0" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <div class="form-section-title">價格資訊</div>
              <v-text-field v-model.number="editedItem.price_list" label="車位表價" type="number"  variant="outlined" density="compact" ></v-text-field>
              <v-text-field v-model.number="editedItem.price_floor" label="車位底價" type="number"  variant="outlined" density="compact" ></v-text-field>
              <v-text-field v-model.number="editedItem.price_transaction" label="車位成交價" type="number" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-divider class="my-2"></v-divider>
              <div class="form-section-title">銷控資訊</div>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="editedItem.buyerUnitId" label="購買戶別" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model="editedItem.buyerName" label="買方姓名" variant="outlined" density="compact"></v-text-field>
            </v-col>
            <v-col cols="12" sm="4">
              <v-combobox v-model="editedItemSalesperson" label="銷售人員" variant="outlined" density="compact" multiple chips closable-chips clearable hint="可複選多位，或輸入後按 Enter" persistent-hint></v-combobox>
            </v-col>

            <v-col cols="12" sm="6">
              <v-select
                v-model="editedItem.status"
                :items="quoteStatusOptions"
                label="銷控狀態 (報價系統)"
                variant="outlined"
                density="compact"
                readonly
                class="readonly-field"
                hint="此欄位會根據後台狀態自動變更（來賓車位 → 來賓車位，其餘 → 已售）"
                persistent-hint
              ></v-select>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editedItem.status_backend"
                :items="backendStatusOptions"
                label="銷控後台狀態"
                variant="outlined"
                density="compact"
                clearable
              ></v-select>
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="editedItem.remarks" label="備註" variant="outlined" rows="3"></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey" variant="text" @click="close">取消</v-btn>
        <v-btn color="primary" variant="flat" @click="saveItem" :loading="isSaving">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { updateParkingLot } from '@/api';
import { normalizeSalespersons } from '@/utils/salespersonUtils';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 車位完整資料，需含 Firestore 文件 ID（docId 或 id 擇一）
  parking: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const toast = useToast();
const isSaving = ref(false);
const editedItem = ref({});

const backendStatusOptions = ['小訂', '補足', '簽約', '保留', '來賓車位'];
// 報價系統銷控狀態：由後台狀態自動對應（來賓車位 → 來賓車位，其餘 → 已售）
const quoteStatusOptions = ['已售', '來賓車位'];

// 銷售人員（複選）：相容舊單人字串與陣列，綁定 v-combobox(multiple)
const editedItemSalesperson = computed({
  get: () => normalizeSalespersons(editedItem.value?.salesperson),
  set: (val) => {
    if (editedItem.value) editedItem.value.salesperson = normalizeSalespersons(val);
  }
});

watch(() => props.modelValue, (show) => {
  if (show) {
    editedItem.value = { ...(props.parking || {}) };
  }
});

watch(() => editedItem.value.status_backend, (newValue) => {
  if (!editedItem.value) return;
  if (newValue === '來賓車位') {
    // 後台狀態為來賓車位 → 報價系統同步顯示來賓車位
    editedItem.value.status = '來賓車位';
  } else {
    // 其餘後台狀態一律視為已售；清空後台狀態則一併清空
    editedItem.value.status = newValue ? '已售' : '';
  }
});

const close = () => {
  emit('update:modelValue', false);
};

const saveItem = async () => {
  isSaving.value = true;
  try {
    // docId 來自銷控管理表格 (listenToParkingLots)；id 來自車位圖資料 (getSalesParkingsByFloor)
    const { docId, id, ...dataToUpdate } = editedItem.value;
    const targetDocId = docId || id;
    if (!targetDocId) throw new Error('缺少車位文件 ID，無法更新。');
    await updateParkingLot(targetDocId, dataToUpdate);
    toast.success(`車位 ${editedItem.value.spotId} 的資料已更新`);
    emit('saved', { ...editedItem.value });
    close();
  } catch (err) {
    toast.error(`更新失敗: ${err.message}`);
  } finally {
    isSaving.value = false;
  }
};
</script>

<style scoped>
.form-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: #0D47A1;
  border-left: 4px solid #0D47A1;
  padding-left: 8px;
  margin-bottom: 12px;
}
:deep(.readonly-field .v-field) {
  background-color: #f5f5f5 !important;
  color: #757575 !important;
}
</style>
