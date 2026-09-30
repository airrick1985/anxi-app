<template>
  <div class="sales-filter-panel">
    <v-row dense>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="draft.buildings"
          :items="buildingOptions"
          label="棟別 (多選)"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :menu-props="{ maxHeight: 320 }"
        ></v-select>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="draft.floors"
          :items="floorOptions"
          label="樓層 (多選)"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :menu-props="{ maxHeight: 320 }"
        ></v-select>
      </v-col>
      <!-- ✅ [新增] 文字標籤篩選（任一符合即顯示；可選「(無標籤)」） -->
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="draft.tags"
          :items="tagOptions"
          item-title="text"
          item-value="text"
          label="標籤 (多選)"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          hide-details
          clearable
          :menu-props="{ maxHeight: 320 }"
        >
          <template #chip="{ props: chipProps, item }">
            <v-chip
              v-bind="chipProps"
              size="small"
              label
              :style="item.raw.bgColor ? { backgroundColor: item.raw.bgColor, color: item.raw.textColor } : {}"
            >{{ item.raw.text }}</v-chip>
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :title="undefined">
              <span
                class="unit-tag-chip unit-tag-chip--lg mr-2"
                :style="item.raw.bgColor ? { backgroundColor: item.raw.bgColor, color: item.raw.textColor } : { backgroundColor: '#eceff1', color: '#607d8b' }"
              >{{ item.raw.text }}</span>
              <span class="text-caption text-grey">{{ item.raw.count }} 戶</span>
            </v-list-item>
          </template>
        </v-select>
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <div class="d-flex align-center gap-2">
            <v-text-field v-model.number="draft.areaMin" label="面積 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
            <span class="text-grey">~</span>
            <v-text-field v-model.number="draft.areaMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
         </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <div class="d-flex align-center gap-2">
            <v-text-field v-model.number="draft.totalPriceMin" label="房屋總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
            <span class="text-grey">~</span>
            <v-text-field v-model.number="draft.totalPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
         </div>
      </v-col>
      <v-col cols="12" sm="6" md="3">
         <div class="d-flex align-center gap-2">
            <v-text-field v-model.number="draft.unitPriceMin" label="房屋單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
            <span class="text-grey">~</span>
            <v-text-field v-model.number="draft.unitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
         </div>
      </v-col>
    </v-row>

    <v-divider v-if="viewMode !== 'quote'" class="my-3 border-dashed"></v-divider>

    <v-row dense v-if="viewMode !== 'quote'">
      <v-col cols="12" class="pb-0">
        <v-switch
          v-model="draft.quoteCustomized"
          label="只看報價顯示已自訂的戶別"
          color="blue"
          density="compact"
          hide-details
          inset
        ></v-switch>
      </v-col>
    </v-row>
    <v-row dense v-if="viewMode !== 'quote'">
      <v-col cols="12" sm="6" md="3">
        <v-select
          v-model="draft.statuses"
          :items="statusOptions"
          label="銷控狀態 (多選)"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-select>
      </v-col>

      <v-col cols="12" sm="6" md="3"> <v-autocomplete
          v-model="draft.salesperson"
          :items="personnelOptions"
          label="銷售人員 (多選)" 
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-autocomplete>
      </v-col>

      <v-col cols="12" sm="6" md="2">
        <v-text-field
          v-model="draft.buyerName"
          label="買方姓名"
          variant="outlined"
          density="compact"
          hide-details
          clearable
        ></v-text-field>
      </v-col>

      <v-col cols="12" sm="6" md="2.5">
        <div class="d-flex flex-column">
          <span class="text-caption text-grey ml-1">小訂日期</span>
          <div class="d-flex align-center gap-1">
            <input type="date" v-model="draft.depositDateStart" class="date-input-compact" :class="{ 'is-empty': !draft.depositDateStart }">
            <span class="text-grey">~</span>
            <input type="date" v-model="draft.depositDateEnd" class="date-input-compact" :class="{ 'is-empty': !draft.depositDateEnd }">
          </div>
        </div>
      </v-col>

      <v-col cols="12" sm="6" md="2.5">
        <div class="d-flex flex-column">
          <span class="text-caption text-grey ml-1">簽約日期</span>
          <div class="d-flex align-center gap-1">
            <input type="date" v-model="draft.contractDateStart" class="date-input-compact" :class="{ 'is-empty': !draft.contractDateStart }">
            <span class="text-grey">~</span>
            <input type="date" v-model="draft.contractDateEnd" class="date-input-compact" :class="{ 'is-empty': !draft.contractDateEnd }">
          </div>
        </div>
      </v-col>
    </v-row>


  
    <template v-if="viewMode !== 'quote'">
      <v-divider class="my-3 border-dashed"></v-divider>
      <div class="text-caption text-grey mb-1 ml-1 font-weight-bold">進階價格篩選</div>
      <v-row dense>
        <v-col cols="12" sm="6" md="4">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="draft.floorPriceMin" label="底價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="draft.floorPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="draft.floorUnitPriceMin" label="底價單價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="draft.floorUnitPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>

        <v-col cols="12" sm="6" md="4">
           <div class="d-flex align-center gap-2">
              <v-text-field v-model.number="draft.transPriceMin" label="成交總價 最小" type="number" variant="outlined" density="compact" hide-details></v-text-field>
              <span class="text-grey">~</span>
              <v-text-field v-model.number="draft.transPriceMax" label="最大" type="number" variant="outlined" density="compact" hide-details></v-text-field>
           </div>
        </v-col>
      </v-row>
    </template>
  
    <div class="d-flex justify-end mt-2">
      <v-btn 
        color="grey-darken-1" 
        variant="text" 
        size="small" 
        prepend-icon="mdi-broom"
        @click="onClear"
        v-if="activeCount > 0"
      >
        清除所有條件
      </v-btn>
    </div>
  </div>
</template>

<script setup>
// 銷控篩選面板：輸入先寫進本地草稿，停止輸入 300ms 後才套用到頁面，
// 避免每按一個鍵就重算篩選、重繪整張戶別網格（手機上特別明顯）
import { reactive, watch, onBeforeUnmount } from 'vue';

const props = defineProps({
  filters: { type: Object, required: true },
  viewMode: { type: String, default: 'sales' },
  activeCount: { type: Number, default: 0 },
  buildingOptions: { type: Array, default: () => [] },
  floorOptions: { type: Array, default: () => [] },
  tagOptions: { type: Array, default: () => [] },
  statusOptions: { type: Array, default: () => [] },
  personnelOptions: { type: Array, default: () => [] },
});
const emit = defineEmits(['apply', 'clear']);

const APPLY_DELAY_MS = 300;
// 全域關鍵字不在面板內，由頁面自行處理
const snapshot = (src) => {
  const out = {};
  for (const [k, v] of Object.entries(src)) {
    if (k === 'keyword') continue;
    out[k] = Array.isArray(v) ? [...v] : v;
  }
  return out;
};
const sameAs = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const draft = reactive(snapshot(props.filters));
let lastApplied = snapshot(props.filters);
let timer = null;

watch(draft, () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    const next = snapshot(draft);
    if (sameAs(next, lastApplied)) return;
    lastApplied = next;
    emit('apply', next);
  }, APPLY_DELAY_MS);
}, { deep: true });

// 頁面端變更（例如清除條件）同步回草稿
watch(() => snapshot(props.filters), (next) => {
  if (sameAs(next, lastApplied)) return;
  clearTimeout(timer);
  lastApplied = next;
  Object.assign(draft, snapshot(next));
}, { deep: true });

function onClear() {
  clearTimeout(timer);
  emit('clear');
}

onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.gap-1 {
  gap: 4px;
}
.gap-2 {
  gap: 8px;
}
.border-dashed {
  border-style: dashed !important;
}
.date-input-compact {
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 0.9rem;
  width: 100%;
  color: #333;
}
.date-input-compact:focus {
  outline: 2px solid #1976D2;
  border-color: transparent;
}
/* 空值且未聚焦時隱藏瀏覽器原生「年/月/日」佔位文字，預設呈現空白 */
.date-input-compact.is-empty:not(:focus) {
  color: transparent;
}
.date-input-compact.is-empty:not(:focus)::-webkit-datetime-edit {
  color: transparent;
}
/* 標籤下拉選項的色塊（與網格標籤同款） */
.unit-tag-chip {
  display: inline-block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 700;
  letter-spacing: 0.2px;
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 0 0 0.5px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}
.unit-tag-chip--lg {
  max-width: 120px;
  height: 20px;
  line-height: 18px;
  padding: 0 8px;
  border-radius: 10px;
  font-size: 11px;
}
</style>
