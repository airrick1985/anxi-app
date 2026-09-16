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
              <v-alert
                v-if="!teamGroupOptions.length && legacyTeamGroupKeys.length"
                type="warning" variant="tonal" density="compact" class="mb-3"
              >
                此人員已設定團獎分組（{{ legacyTeamGroupKeys.join('、') }}），
                但目前無法載入本案分組選項（尚未於「請佣獎金 → 設定」建立分組，或載入失敗）。既有設定將維持不變。
              </v-alert>

              <v-card
                v-for="(seg, i) in localSegments"
                :key="seg._id"
                variant="outlined"
                class="mb-3 segment-card"
              >
                <div class="d-flex align-center px-3 pt-2">
                  <span class="text-subtitle-2">第 {{ i + 1 }} 段</span>
                  <v-chip size="x-small" class="ml-2" :color="seg.outDate ? undefined : 'success'" variant="tonal">
                    {{ seg.outDate ? '已結案' : '在案中' }}
                  </v-chip>
                  <v-spacer></v-spacer>
                  <v-btn icon="mdi-delete-outline" size="small" variant="text" :aria-label="`刪除第 ${i + 1} 段`" @click="removeSegment(i)"></v-btn>
                </div>
                <v-card-text class="pt-2">
                  <v-row dense>
                    <v-col cols="6">
                      <v-text-field v-model="seg.inDate" label="進場時間 (yyyy/mm/dd)" placeholder="2025/03/01"
                        :rules="[dateRule]" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                    <v-col cols="6">
                      <v-text-field v-model="seg.outDate" label="結案時間 (yyyy/mm/dd)" placeholder="空白＝在案中"
                        :rules="[dateRule]" variant="outlined" density="compact"></v-text-field>
                    </v-col>
                  </v-row>
                  <v-row dense>
                    <v-col cols="4">
                      <v-text-field v-model="seg.keepPct" label="保留款%" type="number" step="0.01"
                        variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model="seg.taxPct" label="稅金%" type="number" step="0.01"
                        variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                    <v-col cols="4">
                      <v-text-field v-model="seg.nhiPct" label="二代健保%" type="number" step="0.01"
                        variant="outlined" density="compact" hide-details></v-text-field>
                    </v-col>
                  </v-row>
                  <v-select
                    v-if="teamGroupOptions.length"
                    v-model="seg.teamGroupKeys"
                    :items="teamGroupOptions"
                    item-title="label"
                    item-value="key"
                    label="所屬團獎分組"
                    multiple chips closable-chips
                    variant="outlined" density="compact" class="mt-3" hide-details
                  ></v-select>
                  <v-text-field v-model="seg.remark" label="預設備註（帶入獎金明細）"
                    variant="outlined" density="compact" class="mt-3" hide-details></v-text-field>
                </v-card-text>
              </v-card>

              <div v-if="segmentError" class="text-error text-caption mb-2">{{ segmentError }}</div>
              <v-btn variant="tonal" color="primary" size="small" prepend-icon="mdi-plus" @click="addSegment">
                {{ localSegments.length ? '新增一段（再次進場）' : '新增進退場設定' }}
              </v-btn>
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
import { bonusSegments, normalizeSegment, emptySegment, buildBonusConfig, validateSegments, segmentHasValue } from '@/utils/bonusSegments';

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

// ✅ 請佣獎金設定：多段進退場（docs/請佣獎金系統-spec.md §4.2）。使用本地副本編輯，儲存時才合併進 payload
// （避免 computed 副作用寫入 props，也避免「未設定」的人被寫回全零 bonusConfig）
let segSeq = 0;
const toLocalSegment = (seg) => ({ _id: `s${segSeq++}`, ...normalizeSegment(seg) });
const localSegments = ref([]);
const segmentError = ref('');
const legacyTeamGroupKeys = computed(() => [...new Set(localSegments.value.flatMap(s => s.teamGroupKeys || []))]);
watch(() => props.modelValue, (mv) => {
  localSegments.value = bonusSegments(mv?.bonusConfig).map(toLocalSegment);
  segmentError.value = '';
}, { immediate: true });

/** 新增一段：預設帶前一段的費率與分組，日期留空 */
function addSegment() {
  const last = localSegments.value[localSegments.value.length - 1] || null;
  localSegments.value.push(toLocalSegment(emptySegment(last)));
  segmentError.value = '';
}
function removeSegment(i) {
  localSegments.value.splice(i, 1);
  segmentError.value = '';
}

// 日期格式驗證：空白或 yyyy/mm/dd（西元），格式錯誤會使團獎資格判斷失效
const dateRule = v => !v || /^\d{4}[\/-]\d{1,2}[\/-]\d{1,2}$/.test(String(v).trim()) || '格式須為西元 yyyy/mm/dd';

/** 是否有需要儲存的請佣獎金設定（原本就有、或本次有填任何值） */
function hasMeaningfulBonusConfig() {
  if (props.modelValue?.bonusConfig) return true;
  return localSegments.value.some(segmentHasValue);
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
  segmentError.value = validateSegments(localSegments.value);
  if (segmentError.value) return;
  const payload = { ...editableData.value };
  // 只在原本就有設定、或本次有填值時，才寫入 bonusConfig（避免全零覆蓋「未設定」狀態）
  if (hasMeaningfulBonusConfig()) {
    payload.bonusConfig = buildBonusConfig(localSegments.value.map(({ _id, ...seg }) => seg));
  }
  emit('save', payload);
};
</script>

<style scoped>
.segment-card { border-color: rgba(0, 0, 0, 0.12); }
</style>