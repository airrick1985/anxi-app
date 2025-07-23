<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon left class="mr-2">mdi-calculator-variant-outline</v-icon>
      <span class="headline">房貸試算機</span>
      <v-spacer></v-spacer>
      <v-btn icon @click="$emit('close')" variant="text">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-card-title>
    <v-divider></v-divider>

    <v-card-text>
      <v-form ref="form">
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="loanAmount"
              label="貸款總額"
              suffix="萬元"
              type="number"
              variant="outlined"
              :rules="[rules.required, rules.positive]"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="interestRate"
              label="貸款年利率"
              suffix="%"
              type="number"
              step="0.01"
              variant="outlined"
              :rules="[rules.required, rules.positive]"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-select
              v-model.number="loanTerm"
              :items="[10, 15, 20, 25, 30, 40]"
              label="貸款年限"
              suffix="年"
              variant="outlined"
              :rules="[rules.required]"
            ></v-select>
          </v-col>
          <v-col cols="12" md="6">
             <v-select
              v-model.number="gracePeriod"
              :items="[0, 1, 2, 3, 4, 5]"
              label="寬限期 (可選)"
              suffix="年"
              variant="outlined"
            ></v-select>
          </v-col>
          <v-col cols="12">
            <v-radio-group v-model="repaymentMethod" inline label="還款方式">
              <v-radio label="本息平均攤還" value="equalInstallment"></v-radio>
              <v-radio label="本金平均攤還" value="equalPrincipal"></v-radio>
            </v-radio-group>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions class="px-4 pb-4">
      <v-btn @click="clearForm" color="grey">清除</v-btn>
      <v-spacer></v-spacer>
      <v-btn @click="calculate" color="primary" large>開始計算</v-btn>
    </v-card-actions>

    <div v-if="result.totalPayment > 0">
      <v-divider></v-divider>
      <v-card-text>
        <h3 class="text-h6 mb-4 text-center">試算結果</h3>
        <v-row>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-grey">
              {{ result.firstPhaseLabel }}
            </div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatCurrency(result.firstPhasePayment) }} 元
            </div>
          </v-col>
          <v-col v-if="gracePeriod > 0" cols="12" sm="4" class="text-center">
            <div class="text-grey">{{ result.secondPhaseLabel }}</div>
            <div class="text-h5 font-weight-bold text-success">
              {{ formatCurrency(result.secondPhasePayment) }} 元
            </div>
          </v-col>
           <v-col cols="12" sm="4" class="text-center">
            <div class="text-grey">總利息支出</div>
            <div class="text-h5 font-weight-bold">
              {{ formatCurrency(result.totalInterest) }} 元
            </div>
          </v-col>
          <v-col cols="12" sm="4" class="text-center">
            <div class="text-grey">總還款金額</div>
            <div class="text-h5 font-weight-bold">
              {{ formatCurrency(result.totalPayment) }} 元
            </div>
          </v-col>
        </v-row>
        <div class="text-center mt-4">
            <v-btn color="secondary" @click="showSchedule = !showSchedule">
                {{ showSchedule ? '隱藏' : '查看' }}詳細還款計畫
            </v-btn>
        </div>
      </v-card-text>

      <v-expand-transition>
        <div v-if="showSchedule">
          <v-divider></v-divider>
          <v-card-text>
            <v-data-table
              :headers="scheduleHeaders"
              :items="paymentSchedule"
              item-key="period"
              class="elevation-1"
              density="compact"
              items-per-page="12"
              items-per-page-text="每頁顯示筆數："
              :page-text="'{0}-{1} / 共 {2} 筆'"
            >
              <template v-slot:item.monthlyPayment="{ item }">
                {{ formatCurrency(item.monthlyPayment) }}
              </template>
              <template v-slot:item.principalPaid="{ item }">
                {{ formatCurrency(item.principalPaid) }}
              </template>
              <template v-slot:item.interestPaid="{ item }">
                {{ formatCurrency(item.interestPaid) }}
              </template>
              <template v-slot:item.remainingPrincipal="{ item }">
                {{ formatCurrency(item.remainingPrincipal) }}
              </template>
            </v-data-table>
          </v-card-text>
        </div>
      </v-expand-transition>
    </div>
  </v-card>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['close']);

const form = ref(null);
const loanAmount = ref(1000);
const interestRate = ref(2.1);
const loanTerm = ref(30);
const gracePeriod = ref(0);
const repaymentMethod = ref('equalInstallment');

const result = ref({
  firstPhasePayment: 0,
  secondPhasePayment: 0,
  totalInterest: 0,
  totalPayment: 0,
  firstPhaseLabel: '',
  secondPhaseLabel: '',
});

const paymentSchedule = ref([]);
const showSchedule = ref(false);

const scheduleHeaders = [
  { title: '期數', key: 'period', align: 'center' },
  { title: '應付本息 (元)', key: 'monthlyPayment', align: 'end' },
  { title: '償還本金 (元)', key: 'principalPaid', align: 'end' },
  { title: '償還利息 (元)', key: 'interestPaid', align: 'end' },
  { title: '剩餘本金 (元)', key: 'remainingPrincipal', align: 'end' },
];

const rules = {
  required: value => !!value || '此欄位為必填。',
  positive: value => value > 0 || '數值必須大於 0。',
};

const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const clearForm = () => {
    loanAmount.value = 1000;
    interestRate.value = 2.1;
    loanTerm.value = 30;
    gracePeriod.value = 0;
    repaymentMethod.value = 'equalInstallment';
    result.value = {
        firstPhasePayment: 0,
        secondPhasePayment: 0,
        totalInterest: 0,
        totalPayment: 0,
        firstPhaseLabel: '',
        secondPhaseLabel: '',
    };
    paymentSchedule.value = [];
    showSchedule.value = false;
};

const calculate = async () => {
  const { valid } = await form.value.validate();
  if (!valid) return;

  const principal = loanAmount.value * 10000;
  const monthlyRate = interestRate.value / 100 / 12;
  const totalMonths = loanTerm.value * 12;
  const graceMonths = gracePeriod.value * 12;

  let schedule = [];
  let totalInterestPaid = 0;
  let remainingPrincipal = principal;

  // 寬限期計算
  for (let i = 1; i <= graceMonths; i++) {
    const interest = remainingPrincipal * monthlyRate;
    totalInterestPaid += interest;
    schedule.push({
      period: i,
      monthlyPayment: interest,
      principalPaid: 0,
      interestPaid: interest,
      remainingPrincipal: remainingPrincipal,
    });
  }

  // 正常還款期計算
  const repaymentMonths = totalMonths - graceMonths;
  if (repaymentMonths > 0) {
    if (repaymentMethod.value === 'equalInstallment') { // 本息平均攤還
      const monthlyPaymentDenominator = Math.pow(1 + monthlyRate, repaymentMonths) - 1;
      const monthlyPaymentNumerator = remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths);
      const monthlyPayment = monthlyPaymentNumerator / monthlyPaymentDenominator;

      for (let i = 1; i <= repaymentMonths; i++) {
        const interest = remainingPrincipal * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        remainingPrincipal -= principalPaid;
        totalInterestPaid += interest;
        schedule.push({
          period: graceMonths + i,
          monthlyPayment: monthlyPayment,
          principalPaid: principalPaid,
          interestPaid: interest,
          remainingPrincipal: remainingPrincipal < 0 ? 0 : remainingPrincipal,
        });
      }
    } else { // 本金平均攤還
      const principalPerMonth = principal / repaymentMonths;
      for (let i = 1; i <= repaymentMonths; i++) {
        const interest = remainingPrincipal * monthlyRate;
        const monthlyPayment = principalPerMonth + interest;
        remainingPrincipal -= principalPerMonth;
        totalInterestPaid += interest;
        schedule.push({
          period: graceMonths + i,
          monthlyPayment: monthlyPayment,
          principalPaid: principalPerMonth,
          interestPaid: interest,
          remainingPrincipal: remainingPrincipal < 0 ? 0 : remainingPrincipal,
        });
      }
    }
  }
  
  paymentSchedule.value = schedule;

  // 設定結果顯示
  let firstPhasePayment = 0;
  let secondPhasePayment = 0;
  let firstPhaseLabel = '每月應付本息';
  let secondPhaseLabel = '';

  if (graceMonths > 0) {
    firstPhasePayment = schedule[0]?.monthlyPayment || 0;
    firstPhaseLabel = '寬限期內月付';
    if (repaymentMonths > 0) {
      secondPhasePayment = schedule[graceMonths]?.monthlyPayment || 0;
      secondPhaseLabel = repaymentMethod.value === 'equalInstallment' ? '寬限期後月付' : '寬限期後首月月付';
    }
  } else if (schedule.length > 0) {
    firstPhasePayment = schedule[0].monthlyPayment;
    if (repaymentMethod.value === 'equalPrincipal') {
      firstPhaseLabel = '首月應付本息 (逐月遞減)';
    }
  }

  result.value = {
    firstPhasePayment,
    secondPhasePayment,
    totalInterest: totalInterestPaid,
    totalPayment: principal + totalInterestPaid,
    firstPhaseLabel,
    secondPhaseLabel,
  };
};
</script>

<style scoped>
.text-success {
  color: #28a745;
}
</style>
