<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" max-width="1100" persistent scrollable>
    <v-card class="d-flex flex-column" style="max-height: 92vh;">
      <v-card-title class="d-flex align-center bg-primary text-white py-3">
        <v-icon start>mdi-calculator-variant</v-icon>
        房土比計算公式設定
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="$emit('update:show', false)" />
      </v-card-title>

      <v-alert type="info" variant="tonal" density="compact" class="ma-3">
        公式用於自動計算每戶的「房屋價款」與「土地價款」。可參照的項目：
        <strong>成交總價、車位總價、房屋價款比例、土地價款比例</strong>。
        兩個公式可互相參照（例：房屋價款公式使用「土地價款」結果），但不可循環依賴。
      </v-alert>

      <v-tabs v-model="tab" color="primary" grow>
        <v-tab value="house">
          <v-icon start>mdi-home</v-icon>
          房屋價款公式
        </v-tab>
        <v-tab value="land">
          <v-icon start>mdi-map</v-icon>
          土地價款公式
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card-text class="pa-0 flex-grow-1" style="overflow-y: auto;">
        <v-window v-model="tab">
          <v-window-item value="house">
            <FormulaEditor
              :formula="draft.housePriceFormula"
              formula-name="房屋價款"
              :preview-context="previewContext"
              :other-result="otherResults.landPrice"
              :other-result-label="'土地價款'"
              @update="v => draft.housePriceFormula = v" />
          </v-window-item>
          <v-window-item value="land">
            <FormulaEditor
              :formula="draft.landPriceFormula"
              formula-name="土地價款"
              :preview-context="previewContext"
              :other-result="otherResults.housePrice"
              :other-result-label="'房屋價款'"
              @update="v => draft.landPriceFormula = v" />
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />
      <v-card-actions class="pa-3">
        <v-btn variant="text" @click="resetToDefault" prepend-icon="mdi-restore">
          恢復預設
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:show', false)">取消</v-btn>
        <v-btn color="primary" variant="flat" :loading="saving" :disabled="!canSave" @click="onSave">
          <v-icon start>mdi-content-save</v-icon>
          儲存公式
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import {
  buildDefaultFormulas,
  validateFormula,
  computeHouseLandPrices,
} from '@/composables/usePriceFormula';
import FormulaEditor from './FormulaEditor.vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  modelValue: { type: Object, default: () => null },   // 既有公式（可為 null → 取預設）
});
const emit = defineEmits(['update:show', 'save']);

const tab = ref('house');
const saving = ref(false);

// 預覽用假資料（讓使用者看到公式計算範例）
const previewContext = {
  unitData: {
    price_transaction_total: 1000,  // 成交總價 1000 萬
    '持有車位': [{ '車位成交價': 150 }],  // 車位總價 150 萬
    housePriceRatio: 59,
    landPriceRatio: 41,
  },
};

const draft = ref(cloneDraft(props.modelValue));

function cloneDraft(src) {
  const fallback = buildDefaultFormulas();
  if (!src) return fallback;
  return {
    housePriceFormula: src.housePriceFormula
      ? JSON.parse(JSON.stringify(src.housePriceFormula))
      : fallback.housePriceFormula,
    landPriceFormula: src.landPriceFormula
      ? JSON.parse(JSON.stringify(src.landPriceFormula))
      : fallback.landPriceFormula,
  };
}

// 對話框重新開啟時同步
watch(() => props.show, (v) => {
  if (v) {
    draft.value = cloneDraft(props.modelValue);
    tab.value = 'house';
  }
});

// 另一支公式的計算結果（給 FormulaEditor 顯示相互參照時的預覽）
const otherResults = computed(() => {
  const r = computeHouseLandPrices(previewContext.unitData, draft.value);
  return { housePrice: r.housePrice, landPrice: r.landPrice };
});

const houseValid = computed(() => validateFormula(draft.value.housePriceFormula));
const landValid  = computed(() => validateFormula(draft.value.landPriceFormula));

const canSave = computed(() => houseValid.value.valid && landValid.value.valid);

function resetToDefault() {
  if (!window.confirm('恢復為系統預設公式？\n（土地 = (總價-車位)×土地比例，房屋 = 總價-車位-土地）')) return;
  draft.value = buildDefaultFormulas();
}

async function onSave() {
  if (!canSave.value) return;
  saving.value = true;
  try {
    emit('save', JSON.parse(JSON.stringify(draft.value)));
  } finally {
    saving.value = false;
  }
}
</script>
