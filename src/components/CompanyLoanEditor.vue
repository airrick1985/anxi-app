<template>
  <v-card variant="outlined" class="loan-editor-card d-flex flex-column">
    <v-card-title class="loan-editor-header d-flex align-center py-3">
      <v-icon size="20" class="mr-2">{{ local.isNew ? 'mdi-plus-box-outline' : 'mdi-pencil-box-outline' }}</v-icon>
      <span class="text-subtitle-1 font-weight-bold">{{ headerTitle }}</span>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('cancel')"></v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text class="flex-grow-1 overflow-y-auto pt-4">
      <v-row>
        <!-- 左：參數設定 -->
        <v-col cols="12" md="5">
          <v-text-field
            v-model="local.loanName"
            label="範本名稱"
            variant="outlined"
            density="comfortable"
            placeholder="例：公司借貸15%-3年12期"
            :rules="[v => !!v || '必填']"
          ></v-text-field>

          <v-text-field
            v-model.number="local.ratioPercent"
            label="借貸成數 (%)"
            type="number"
            suffix="%"
            variant="outlined"
            density="comfortable"
            hint="借貸金額＝報價總價 × 成數"
            persistent-hint
            class="mb-2"
            :rules="[v => (Number(v) > 0) || '須大於 0']"
          ></v-text-field>

          <v-row dense>
            <v-col cols="6">
              <v-text-field
                v-model.number="local.years"
                label="年數"
                type="number"
                suffix="年"
                variant="outlined"
                density="comfortable"
                :rules="[v => (Number(v) > 0) || '須大於 0']"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="local.periods"
                label="期數"
                type="number"
                suffix="期"
                variant="outlined"
                density="comfortable"
                :rules="[v => (Number.isInteger(Number(v)) && Number(v) > 0) || '須為正整數']"
              ></v-text-field>
            </v-col>
          </v-row>
          <div v-if="intervalMonthsText" class="text-caption text-grey-darken-1 mb-3 mt-n1">
            <v-icon size="14">mdi-calendar-clock</v-icon>
            每期間隔約 {{ intervalMonthsText }} 個月
          </div>

          <v-text-field
            v-model.number="local.annualRate"
            label="年利率 (%)（預設值，報價時可臨時調整）"
            type="number"
            suffix="%"
            variant="outlined"
            density="comfortable"
            hint="允許 0（無息借貸）"
            persistent-hint
            class="mb-2"
            :rules="[v => (Number(v) >= 0) || '不可為負數']"
          ></v-text-field>

          <v-select
            v-model="local.amortizationType"
            :items="['本金平均攤還', '本息平均攤還']"
            label="攤還方式"
            variant="outlined"
            density="comfortable"
          ></v-select>

          <v-row dense>
            <v-col cols="6">
              <v-select
                v-model="local.roundingMethod"
                :items="['四捨五入', '無條件進位', '無條件捨去']"
                label="借貸金額進位"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
            <v-col cols="6">
              <v-select
                v-model="local.roundingValue"
                :items="roundingOptions"
                item-title="label"
                item-value="value"
                label="進位精度"
                variant="outlined"
                density="comfortable"
              ></v-select>
            </v-col>
          </v-row>

          <v-textarea
            v-model="local.note"
            label="備註說明（選填）"
            variant="outlined"
            density="comfortable"
            rows="2"
            auto-grow
            clearable
            hint="報價攤還表下方以小字顯示；留空不顯示"
            persistent-hint
          ></v-textarea>
        </v-col>

        <!-- 右：即時試算預覽 -->
        <v-col cols="12" md="7">
          <v-sheet border rounded class="pa-3 loan-preview">
            <div class="d-flex align-center flex-wrap ga-2 mb-2">
              <v-icon size="18" color="brown-darken-1">mdi-calculator</v-icon>
              <span class="text-subtitle-2 font-weight-bold">試算預覽</span>
              <v-text-field
                v-model.number="trialPrice"
                label="試算總價"
                type="number"
                suffix="萬"
                variant="outlined"
                density="compact"
                hide-details
                style="max-width: 160px;"
              ></v-text-field>
              <span class="text-caption text-grey">僅供預覽，不會儲存</span>
            </div>

            <template v-if="trialSchedule">
              <div class="d-flex flex-wrap ga-2 mb-2">
                <v-chip size="small" color="brown-darken-1" variant="flat">
                  借貸金額 {{ trialSchedule.loanAmount.toLocaleString() }} 元
                </v-chip>
                <v-chip size="small" variant="outlined" color="brown">
                  單期利率 {{ (trialSchedule.periodRate * 100).toFixed(4).replace(/\.?0+$/, '') }}%
                </v-chip>
              </div>

              <div class="loan-table-wrap">
                <v-table density="compact" class="loan-table">
                  <thead>
                    <tr>
                      <th class="text-center">期別</th>
                      <th class="text-right">本金 (元)</th>
                      <th class="text-right">利息 (元)</th>
                      <th class="text-right">每期金額 (元)</th>
                      <th class="text-right">剩餘本金 (元)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in trialSchedule.rows" :key="row.period">
                      <td class="text-center">{{ row.period }}</td>
                      <td class="text-right">{{ row.principal.toLocaleString() }}</td>
                      <td class="text-right">{{ row.interest.toLocaleString() }}</td>
                      <td class="text-right font-weight-medium">{{ row.payment.toLocaleString() }}</td>
                      <td class="text-right text-grey">{{ row.remaining.toLocaleString() }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="loan-total-row">
                      <td class="text-center font-weight-bold">合計</td>
                      <td class="text-right font-weight-bold">{{ trialSchedule.totals.principal.toLocaleString() }}</td>
                      <td class="text-right font-weight-bold">{{ trialSchedule.totals.interest.toLocaleString() }}</td>
                      <td class="text-right font-weight-bold">{{ trialSchedule.totals.payment.toLocaleString() }}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </v-table>
              </div>
            </template>
            <div v-else class="text-center text-grey pa-6">
              <v-icon size="36" color="grey-lighten-1" class="mb-2">mdi-table-off</v-icon>
              <div class="text-body-2">請輸入試算總價與有效參數（成數、年數、期數）</div>
            </div>
          </v-sheet>
        </v-col>
      </v-row>
    </v-card-text>

    <v-divider></v-divider>
    <v-card-actions class="px-4 py-3">
      <v-spacer></v-spacer>
      <v-btn variant="text" @click="$emit('cancel')">取消</v-btn>
      <v-btn color="primary" variant="flat" @click="handleSave">儲存範本</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import { buildCompanyLoanSchedule } from '@/utils/companyLoanCalculation';

const props = defineProps({
  // 由父層傳入的工作副本，編輯過程不影響原始資料
  item: { type: Object, default: null },
});

const emit = defineEmits(['save', 'cancel']);

const toast = useToast();

const local = ref({});
const originalName = ref('');
const trialPrice = ref(1500); // 試算總價（萬），僅供預覽

const roundingOptions = [
  { label: '至元', value: 1 },
  { label: '至百元', value: 100 },
  { label: '至千元', value: 1000 },
  { label: '至萬元', value: 10000 },
];

const headerTitle = computed(() =>
  local.value.isNew ? '新增公司借貸範本' : `編輯：${originalName.value}`
);

watch(
  () => props.item,
  (val) => {
    local.value = val ? JSON.parse(JSON.stringify(val)) : {};
    originalName.value = val?.loanName || '';
  },
  { immediate: true }
);

// 每期間隔月數（顯示參考）
const intervalMonthsText = computed(() => {
  const years = Number(local.value.years);
  const periods = Number(local.value.periods);
  if (!(years > 0) || !(periods > 0)) return '';
  const months = years * 12 / periods;
  return Number.isInteger(months) ? String(months) : months.toFixed(1);
});

// 即時試算（總價以萬輸入，換算為元）
const trialSchedule = computed(() => {
  const priceYuan = (Number(trialPrice.value) || 0) * 10000;
  return buildCompanyLoanSchedule(priceYuan, local.value);
});

const handleSave = () => {
  if (!local.value.loanName || !String(local.value.loanName).trim()) {
    toast.error('範本名稱為必填');
    return;
  }
  if (!(Number(local.value.ratioPercent) > 0)) {
    toast.error('借貸成數須大於 0');
    return;
  }
  if (!(Number(local.value.years) > 0)) {
    toast.error('年數須大於 0');
    return;
  }
  const periods = Number(local.value.periods);
  if (!(Number.isInteger(periods) && periods > 0)) {
    toast.error('期數須為正整數');
    return;
  }
  if (Number(local.value.annualRate) < 0) {
    toast.error('年利率不可為負數');
    return;
  }

  const payload = JSON.parse(JSON.stringify(local.value));
  payload.loanName = String(payload.loanName).trim();
  payload.note = String(payload.note || '').trim();
  emit('save', payload);
};
</script>

<style scoped>
.loan-editor-card {
  height: 100%;
}

.loan-editor-header {
  background: rgba(121, 85, 72, 0.08);
  color: #4E342E;
}

.loan-preview {
  background: rgba(0, 0, 0, 0.015);
}

.loan-table-wrap {
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 4px;
}

.loan-table thead th {
  background: rgba(121, 85, 72, 0.08);
  white-space: nowrap;
}

.loan-total-row td {
  border-top: 2px solid rgba(121, 85, 72, 0.4);
  background: rgba(121, 85, 72, 0.05);
}
</style>
