<template>
  <v-card>
    <v-card-title class="bg-primary text-white">
      <span class="text-h5">{{ isEditing ? '編輯' : '新增' }}銷售人員</span>
    </v-card-title>
    
    <v-card-text class="pt-4">
      <v-form ref="form">
        <v-combobox
          v-model="editableData.positions"
          :items="positionOptions"
          label="職位"
          multiple
          chips
          closable-chips
          variant="outlined"
          density="compact"
          :rules="[v => v && v.length > 0 || '職位為必填欄位']"
          hint="可選擇或手動輸入後按 Enter 新增"
          persistent-hint
          class="mb-4"
        ></v-combobox>

        <v-text-field
          v-model="editableData.name"
          label="姓名"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '姓名為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="editableData.phone"
          label="電話"
          variant="outlined"
          density="compact"
          :rules="[v => !!v || '電話為必填欄位']"
          required
          class="mb-4"
        ></v-text-field>

        <v-text-field
          v-model="editableData.email"
          label="Email"
          type="email"
          variant="outlined"
          density="compact"
        ></v-text-field>

        <!-- ✅ [新增] 請佣獎金設定（docs/請佣獎金系統-spec.md §4.2） -->
        <v-expansion-panels class="mt-4" variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title class="text-subtitle-2">
              <v-icon start size="small">mdi-cash-multiple</v-icon>請佣獎金設定（選填）
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row dense>
                <v-col cols="4">
                  <v-text-field v-model="localBonus.keepPct" label="保留款%" type="number" step="0.01"
                    variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field v-model="localBonus.taxPct" label="稅金%" type="number" step="0.01"
                    variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
                <v-col cols="4">
                  <v-text-field v-model="localBonus.nhiPct" label="二代健保%" type="number" step="0.01"
                    variant="outlined" density="compact" hide-details></v-text-field>
                </v-col>
              </v-row>
              <v-select
                v-if="teamGroupOptions.length"
                v-model="localBonus.teamGroupKeys"
                :items="teamGroupOptions"
                item-title="label"
                item-value="key"
                label="所屬團獎分組"
                multiple chips closable-chips
                variant="outlined" density="compact" class="mt-3"
              ></v-select>
              <v-alert
                v-else-if="(localBonus.teamGroupKeys || []).length"
                type="warning" variant="tonal" density="compact" class="mt-3"
              >
                此人員已設定團獎分組（{{ (localBonus.teamGroupKeys || []).join('、') }}），
                但目前無法載入本案分組選項（尚未於「請佣獎金 → 設定」建立分組，或載入失敗）。既有設定將維持不變。
              </v-alert>
              <v-row dense class="mt-1">
                <v-col cols="6">
                  <v-text-field v-model="localBonus.inDate" label="進場時間 (yyyy/mm/dd)" placeholder="2025/03/01"
                    :rules="[dateRule]" variant="outlined" density="compact" hint="團獎資格：簽約日 ≥ 進場時間" persistent-hint></v-text-field>
                </v-col>
                <v-col cols="6">
                  <v-text-field v-model="localBonus.outDate" label="結案時間 (yyyy/mm/dd)" placeholder="空白＝在案中"
                    :rules="[dateRule]" variant="outlined" density="compact" hint="團獎資格：簽約日 ≤ 結案時間" persistent-hint></v-text-field>
                </v-col>
              </v-row>
              <v-text-field v-model="localBonus.remark" label="預設備註（帶入獎金明細）"
                variant="outlined" density="compact" class="mt-1"></v-text-field>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-form>
    </v-card-text>
    
    <v-divider></v-divider>

    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey" variant="text" @click="$emit('cancel')">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="handleSave" :loading="loading">儲存</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits, onMounted } from 'vue';
import { fetchCommissionSettings } from '@/api';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({
      positions: [],
      name: '',
      phone: '',
      email: ''
    })
  },
  loading: {
    type: Boolean,
    default: false
  },
  // ✅ [新增] 用於載入請佣獎金團獎分組選項
  projectId: {
    type: String,
    default: ''
  },
  // ✅ [新增] 由父層傳入團獎分組（避免每次開窗都讀 Firestore）；null 時自行載入
  teamGroups: {
    type: Array,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'save', 'cancel']);

const form = ref(null);
// ✅ [新增] 職位選項擴充請佣獎金職務（主委/副總/輔導專案/專案團獎）
const positionOptions = ref(['銷售', '專案', '副專', '助理', '業主', '主委', '副總', '輔導專案', '專案團獎']);

// ✅ [新增] 請佣獎金設定：使用本地副本編輯，儲存時才合併進 payload
// （避免 computed 副作用寫入 props，也避免「未設定」的人被寫回全零 bonusConfig）
const EMPTY_BONUS = { keepPct: '', taxPct: '', nhiPct: '', teamGroupKeys: [], inDate: '', outDate: '', remark: '' };
const localBonus = ref({ ...EMPTY_BONUS });
watch(() => props.modelValue, (mv) => {
  const bc = mv?.bonusConfig || {};
  localBonus.value = {
    keepPct: bc.keepPct ?? '',
    taxPct: bc.taxPct ?? '',
    nhiPct: bc.nhiPct ?? '',
    teamGroupKeys: Array.isArray(bc.teamGroupKeys) ? [...bc.teamGroupKeys] : [],
    inDate: bc.inDate || '',
    outDate: bc.outDate || '',
    remark: bc.remark || ''
  };
}, { immediate: true });

// 日期格式驗證：空白或 yyyy/mm/dd（西元），格式錯誤會使團獎資格判斷失效
const dateRule = v => !v || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(String(v).trim()) || '格式須為西元 yyyy/mm/dd';

/** 是否有需要儲存的請佣獎金設定（原本就有、或本次有填任何值） */
function hasMeaningfulBonusConfig() {
  if (props.modelValue?.bonusConfig) return true;
  const b = localBonus.value;
  return Number(b.keepPct) > 0 || Number(b.taxPct) > 0 || Number(b.nhiPct) > 0
    || (b.teamGroupKeys || []).length > 0
    || String(b.inDate).trim() !== '' || String(b.outDate).trim() !== ''
    || String(b.remark).trim() !== '';
}

/** 數值欄位 sanitize：空字串/非數字一律存 0 */
function sanitizedBonusConfig() {
  const b = localBonus.value;
  return {
    keepPct: Number(b.keepPct) || 0,
    taxPct: Number(b.taxPct) || 0,
    nhiPct: Number(b.nhiPct) || 0,
    teamGroupKeys: [...(b.teamGroupKeys || [])],
    inDate: String(b.inDate || '').trim(),
    outDate: String(b.outDate || '').trim(),
    remark: String(b.remark || '').trim()
  };
}

const fetchedTeamGroups = ref([]);
const teamGroupOptions = computed(() =>
  Array.isArray(props.teamGroups) ? props.teamGroups : fetchedTeamGroups.value
);
onMounted(async () => {
  if (Array.isArray(props.teamGroups) || !props.projectId) return;
  try {
    const settings = await fetchCommissionSettings(props.projectId);
    fetchedTeamGroups.value = Array.isArray(settings?.teamGroups) ? settings.teamGroups : [];
  } catch (e) {
    console.warn('[SalesPersonnelForm] 載入團獎分組失敗:', e);
  }
});

const isEditing = computed(() => !!props.modelValue.id);

const editableData = computed({
  get: () => props.modelValue,
  set: (newValue) => emit('update:modelValue', newValue)
});

const handleSave = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;
  const payload = { ...editableData.value };
  // 只在原本就有設定、或本次有填值時，才寫入 bonusConfig（避免全零覆蓋「未設定」狀態）
  if (hasMeaningfulBonusConfig()) {
    payload.bonusConfig = sanitizedBonusConfig();
  }
  emit('save', payload);
};
</script>