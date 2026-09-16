<template>
  <v-card class="mc-card" elevation="0">
    <!-- 標題列 -->
    <div class="mc-header">
      <div class="mc-title">
        <v-icon size="20">mdi-calculator-variant-outline</v-icon>
        <span>房貸試算</span>
      </div>
      <button type="button" class="mc-close" aria-label="關閉" @click="emit('close')">
        <v-icon size="18">mdi-close</v-icon>
      </button>
    </div>

    <!-- 顯示屏 -->
    <div class="mc-display">
      <div class="mc-display-meta">
        <span class="mc-mono">{{ displayAmount }} 萬 · {{ displayRate }}% · {{ displayTerm }} 年<template v-if="graceNum > 0"> · 寬限 {{ graceNum }} 年</template></span>
        <span class="mc-display-tag">{{ repaymentMethod === 'equalInstallment' ? '本息平均' : '本金平均' }}</span>
      </div>

      <template v-if="hasResult">
        <div class="mc-display-main">
          <div class="mc-display-label">{{ result.firstPhaseLabel }}</div>
          <div class="mc-display-value mc-mono">
            <span class="mc-display-currency">NT$</span>{{ formatCurrency(result.firstPhasePayment) }}
          </div>
        </div>
        <div v-if="result.secondPhaseLabel" class="mc-display-sub">
          <div class="mc-display-label">{{ result.secondPhaseLabel }}</div>
          <div class="mc-display-value mc-display-value--sm mc-mono">
            <span class="mc-display-currency">NT$</span>{{ formatCurrency(result.secondPhasePayment) }}
          </div>
        </div>
        <div class="mc-display-footer">
          <button type="button" class="mc-display-link" @click="showSchedule = !showSchedule">
            <v-icon size="16">{{ showSchedule ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            {{ showSchedule ? '隱藏還款計畫' : '查看還款計畫' }}
          </button>
          <div class="mc-display-stats">
            <div class="mc-display-stat">
              <span class="mc-display-stat-label">合計利息</span>
              <span class="mc-display-stat-value mc-mono">{{ formatCurrency(result.totalInterest) }}</span>
            </div>
            <div class="mc-display-stat">
              <span class="mc-display-stat-label">總還款</span>
              <span class="mc-display-stat-value mc-mono">{{ formatCurrency(result.totalPayment) }}</span>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="mc-display-main">
        <div class="mc-display-label">每月應付</div>
        <div class="mc-display-value mc-display-value--idle mc-mono">
          <span class="mc-display-currency">NT$</span>0
        </div>
      </div>
    </div>

    <!-- 輸入區 -->
    <form class="mc-body" @submit.prevent="calculate">
      <div class="mc-grid">
        <div class="mc-field">
          <label class="mc-label" for="mc-amount">貸款總額</label>
          <div class="mc-input" :class="{ 'is-error': errors.loanAmount }">
            <input
              id="mc-amount"
              class="mc-mono"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :value="loanAmount"
              placeholder="0"
              @input="loanAmount = sanitizeDecimal($event.target.value)"
            />
            <span class="mc-input-suffix">萬元</span>
          </div>
          <div v-if="errors.loanAmount" class="mc-error">{{ errors.loanAmount }}</div>
        </div>

        <div class="mc-field">
          <label class="mc-label" for="mc-rate">貸款年利率</label>
          <div class="mc-input" :class="{ 'is-error': errors.interestRate }">
            <input
              id="mc-rate"
              class="mc-mono"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              :value="interestRate"
              placeholder="0.00"
              @input="interestRate = sanitizeDecimal($event.target.value)"
            />
            <span class="mc-input-suffix">%</span>
          </div>
          <div v-if="errors.interestRate" class="mc-error">{{ errors.interestRate }}</div>
        </div>

        <div class="mc-field mc-field--full">
          <label class="mc-label">貸款年限</label>
          <div class="mc-keys" :class="{ 'is-error': errors.loanTerm }">
            <button
              v-for="y in termOptions"
              :key="`term-${y}`"
              type="button"
              class="mc-key mc-mono"
              :class="{ 'is-active': termNum === y }"
              @click="loanTerm = String(y)"
            >{{ y }}</button>
            <div class="mc-key-input" :class="{ 'is-active': loanTerm !== '' && !termOptions.includes(termNum) }">
              <input
                class="mc-mono"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="2"
                placeholder="自訂"
                :value="loanTerm"
                @input="loanTerm = sanitizeInt($event.target.value, 2)"
              />
              <span>年</span>
            </div>
          </div>
          <div v-if="errors.loanTerm" class="mc-error">{{ errors.loanTerm }}</div>
        </div>

        <div class="mc-field mc-field--full">
          <label class="mc-label">寬限期</label>
          <div class="mc-keys" :class="{ 'is-error': errors.gracePeriod }">
            <button
              v-for="g in graceOptions"
              :key="`grace-${g}`"
              type="button"
              class="mc-key mc-mono"
              :class="{ 'is-active': graceNum === g }"
              @click="gracePeriod = String(g)"
            >{{ g === 0 ? '無' : g }}</button>
            <div class="mc-key-input" :class="{ 'is-active': gracePeriod !== '' && !graceOptions.includes(graceNum) }">
              <input
                class="mc-mono"
                type="text"
                inputmode="numeric"
                autocomplete="off"
                maxlength="2"
                placeholder="自訂"
                :value="gracePeriod"
                @input="gracePeriod = sanitizeInt($event.target.value, 2)"
              />
              <span>年</span>
            </div>
          </div>
          <div v-if="errors.gracePeriod" class="mc-error">{{ errors.gracePeriod }}</div>
        </div>

        <div class="mc-field mc-field--full">
          <label class="mc-label">還款方式</label>
          <div class="mc-segment">
            <button
              type="button"
              class="mc-segment-btn"
              :class="{ 'is-active': repaymentMethod === 'equalInstallment' }"
              @click="repaymentMethod = 'equalInstallment'"
            >本息平均攤還</button>
            <button
              type="button"
              class="mc-segment-btn"
              :class="{ 'is-active': repaymentMethod === 'equalPrincipal' }"
              @click="repaymentMethod = 'equalPrincipal'"
            >本金平均攤還</button>
          </div>
        </div>
      </div>

      <!-- 操作鍵 -->
      <div class="mc-actions">
        <button type="button" class="mc-action mc-action--ac" @click="clearForm">
          <span class="mc-mono">AC</span>清除
        </button>
        <button type="submit" class="mc-action mc-action--eq">
          <span class="mc-mono">=</span>開始計算
        </button>
      </div>
    </form>

    <!-- 還款計畫 -->
    <v-expand-transition>
      <div v-if="hasResult && showSchedule" class="mc-schedule">
        <v-data-table
          :headers="scheduleHeaders"
          :items="paymentSchedule"
          item-key="period"
          class="mc-table"
          density="compact"
          items-per-page="12"
          items-per-page-text="每頁顯示筆數："
          :page-text="'{0}-{1} / 共 {2} 筆'"
        >
          <template v-slot:item.monthlyPayment="{ item }">
            <span class="mc-mono">{{ formatCurrency(item.monthlyPayment) }}</span>
          </template>
          <template v-slot:item.principalPaid="{ item }">
            <span class="mc-mono">{{ formatCurrency(item.principalPaid) }}</span>
          </template>
          <template v-slot:item.interestPaid="{ item }">
            <span class="mc-mono">{{ formatCurrency(item.interestPaid) }}</span>
          </template>
          <template v-slot:item.remainingPrincipal="{ item }">
            <span class="mc-mono">{{ formatCurrency(item.remainingPrincipal) }}</span>
          </template>
        </v-data-table>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed, reactive, watch } from 'vue';

const emit = defineEmits(['close']);

const termOptions = [10, 15, 20, 25, 30, 40];
const graceOptions = [0, 1, 2, 3, 4, 5];
const MAX_TERM = 50;

// 輸入值一律以字串保存，方便限制輸入內容；計算時再轉數字
const loanAmount = ref('');
const interestRate = ref('');
const loanTerm = ref('');
const gracePeriod = ref('0');
const repaymentMethod = ref('equalInstallment');

const errors = reactive({
  loanAmount: '',
  interestRate: '',
  loanTerm: '',
  gracePeriod: '',
});

const result = ref({
  firstPhasePayment: 0,
  secondPhasePayment: 0,
  totalInterest: 0,
  totalPayment: 0,
  firstPhaseLabel: '',
  secondPhaseLabel: '',
});
const hasResult = ref(false);
const paymentSchedule = ref([]);
const showSchedule = ref(false);

const scheduleHeaders = [
  { title: '期數', key: 'period', align: 'center' },
  { title: '應付本息 (元)', key: 'monthlyPayment', align: 'end' },
  { title: '償還本金 (元)', key: 'principalPaid', align: 'end' },
  { title: '償還利息 (元)', key: 'interestPaid', align: 'end' },
  { title: '剩餘本金 (元)', key: 'remainingPrincipal', align: 'end' },
];

const termNum = computed(() => (loanTerm.value === '' ? NaN : Number(loanTerm.value)));
const graceNum = computed(() => (gracePeriod.value === '' ? 0 : Number(gracePeriod.value)));

const displayAmount = computed(() => (loanAmount.value === '' ? '0' : loanAmount.value));
const displayRate = computed(() => (interestRate.value === '' ? '0' : interestRate.value));
const displayTerm = computed(() => (loanTerm.value === '' ? '0' : loanTerm.value));

// 只允許數字與一個小數點
const sanitizeDecimal = (raw) => {
  let s = String(raw ?? '').replace(/[^\d.]/g, '');
  const firstDot = s.indexOf('.');
  if (firstDot !== -1) {
    s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
  }
  return s;
};

// 只允許整數數字
const sanitizeInt = (raw, maxLen = 2) => {
  return String(raw ?? '').replace(/\D/g, '').slice(0, maxLen);
};

const formatCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0';
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

const resetResult = () => {
  hasResult.value = false;
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

const clearErrors = () => {
  errors.loanAmount = '';
  errors.interestRate = '';
  errors.loanTerm = '';
  errors.gracePeriod = '';
};

// 任一輸入變更時，顯示屏回到待計算狀態
watch([loanAmount, interestRate, loanTerm, gracePeriod, repaymentMethod], () => {
  if (hasResult.value) resetResult();
  clearErrors();
});

const clearForm = () => {
  loanAmount.value = '';
  interestRate.value = '';
  loanTerm.value = '';
  gracePeriod.value = '0';
  repaymentMethod.value = 'equalInstallment';
  clearErrors();
  resetResult();
};

const validate = () => {
  clearErrors();
  let ok = true;

  const amount = Number(loanAmount.value);
  if (loanAmount.value === '' || !(amount > 0)) {
    errors.loanAmount = '請輸入大於 0 的金額';
    ok = false;
  }

  const rate = Number(interestRate.value);
  if (interestRate.value === '' || !(rate > 0)) {
    errors.interestRate = '請輸入大於 0 的利率';
    ok = false;
  }

  const term = termNum.value;
  if (!Number.isInteger(term) || term < 1 || term > MAX_TERM) {
    errors.loanTerm = `請輸入 1–${MAX_TERM} 年`;
    ok = false;
  }

  const grace = graceNum.value;
  if (!Number.isInteger(grace) || grace < 0) {
    errors.gracePeriod = '請輸入整數年';
    ok = false;
  } else if (Number.isInteger(term) && grace >= term) {
    errors.gracePeriod = '寬限期須小於貸款年限';
    ok = false;
  }

  return ok;
};

const calculate = () => {
  if (!validate()) return;

  const principal = Number(loanAmount.value) * 10000;
  const monthlyRate = Number(interestRate.value) / 100 / 12;
  const totalMonths = termNum.value * 12;
  const graceMonths = graceNum.value * 12;

  const schedule = [];
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
      remainingPrincipal,
    });
  }

  // 正常還款期計算
  const repaymentMonths = totalMonths - graceMonths;
  if (repaymentMonths > 0) {
    if (repaymentMethod.value === 'equalInstallment') { // 本息平均攤還
      const denominator = Math.pow(1 + monthlyRate, repaymentMonths) - 1;
      const numerator = remainingPrincipal * monthlyRate * Math.pow(1 + monthlyRate, repaymentMonths);
      const monthlyPayment = numerator / denominator;

      for (let i = 1; i <= repaymentMonths; i++) {
        const interest = remainingPrincipal * monthlyRate;
        const principalPaid = monthlyPayment - interest;
        remainingPrincipal -= principalPaid;
        totalInterestPaid += interest;
        schedule.push({
          period: graceMonths + i,
          monthlyPayment,
          principalPaid,
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
          monthlyPayment,
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
  hasResult.value = true;
};
</script>

<style scoped>
.mc-card {
  --mc-bg: #f2f2f7;
  --mc-panel: #ffffff;
  --mc-text: #1d1d1f;
  --mc-secondary: #6e6e73;
  --mc-line: rgba(0, 0, 0, 0.08);
  --mc-key: #e5e5ea;
  --mc-key-active: #1d1d1f;
  --mc-accent: #ff9f0a;
  --mc-danger: #ff453a;
  --mc-radius: 14px;
  background: var(--mc-bg);
  color: var(--mc-text);
  border-radius: 18px !important;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
}

.mc-mono {
  font-family: "SF Mono", "JetBrains Mono", Menlo, Consolas, "Roboto Mono", monospace;
  font-variant-numeric: tabular-nums;
}

/* 標題列 */
.mc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 12px 18px;
  background: var(--mc-panel);
  border-bottom: 1px solid var(--mc-line);
}
.mc-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.mc-title .v-icon { color: var(--mc-secondary); }
.mc-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 50%;
  background: var(--mc-key);
  color: var(--mc-secondary);
  cursor: pointer;
  transition: filter 0.12s;
}
.mc-close:hover { filter: brightness(0.94); }

/* 顯示屏 */
.mc-display {
  position: relative;
  margin: 14px 14px 0;
  padding: 16px 20px 14px;
  border-radius: var(--mc-radius);
  background: linear-gradient(160deg, #2c2c2e 0%, #1c1c1e 100%);
  color: #f5f5f7;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(0, 0, 0, 0.18);
  min-height: 132px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}
.mc-display-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: rgba(245, 245, 247, 0.6);
  letter-spacing: 0.3px;
}
.mc-display-tag {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(245, 245, 247, 0.85);
  font-size: 11px;
}
.mc-display-main { text-align: right; }
.mc-display-label {
  font-size: 12px;
  color: rgba(245, 245, 247, 0.6);
  margin-bottom: 2px;
}
.mc-display-value {
  font-size: clamp(30px, 6vw, 42px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.5px;
  color: #ffffff;
  word-break: break-all;
}
.mc-display-value--sm {
  font-size: clamp(18px, 3.6vw, 24px);
  color: var(--mc-accent);
}
.mc-display-value--idle { color: rgba(245, 245, 247, 0.28); }
.mc-display-currency {
  font-size: 0.42em;
  font-weight: 500;
  margin-right: 6px;
  color: rgba(245, 245, 247, 0.55);
  vertical-align: baseline;
}
.mc-display-sub {
  text-align: right;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.mc-display-footer {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}
.mc-display-stats {
  display: flex;
  gap: 18px;
  margin-left: auto;
}
.mc-display-stat {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
}
.mc-display-stat-label {
  font-size: 11px;
  color: rgba(245, 245, 247, 0.55);
}
.mc-display-stat-value {
  font-size: 15px;
  font-weight: 600;
  color: rgba(245, 245, 247, 0.9);
}
.mc-display-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 2px;
  padding: 4px 8px 4px 4px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--mc-accent);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  margin-left: -4px;
}
.mc-display-link:hover { background: rgba(255, 159, 10, 0.12); }

/* 輸入區 */
.mc-body { padding: 14px; }
.mc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 12px;
}
.mc-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.mc-field--full { grid-column: 1 / -1; }
.mc-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--mc-secondary);
  letter-spacing: 0.3px;
  padding-left: 2px;
}

.mc-input {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--mc-panel);
  box-shadow: 0 0 0 1px var(--mc-line);
  transition: box-shadow 0.15s;
}
.mc-input:focus-within { box-shadow: 0 0 0 2px var(--mc-accent); }
.mc-input.is-error { box-shadow: 0 0 0 2px var(--mc-danger); }
.mc-input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 20px;
  font-weight: 600;
  color: var(--mc-text);
  text-align: right;
}
.mc-input input::placeholder { color: rgba(0, 0, 0, 0.22); font-weight: 500; }
.mc-input-suffix {
  margin-left: 8px;
  font-size: 13px;
  color: var(--mc-secondary);
  white-space: nowrap;
}

/* 按鍵組 */
.mc-keys {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 2px;
  border-radius: 12px;
}
.mc-keys.is-error { box-shadow: 0 0 0 2px var(--mc-danger); }
.mc-key {
  flex: 1 1 52px;
  min-width: 52px;
  height: 44px;
  border: 0;
  border-radius: 12px;
  background: var(--mc-key);
  color: var(--mc-text);
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s, color 0.12s, transform 0.08s;
  -webkit-tap-highlight-color: transparent;
}
.mc-key:hover { filter: brightness(0.96); }
.mc-key:active { transform: scale(0.97); }
.mc-key.is-active {
  background: var(--mc-key-active);
  color: #fff;
}
.mc-key-input {
  flex: 1.6 1 96px;
  min-width: 96px;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  background: var(--mc-panel);
  box-shadow: 0 0 0 1px var(--mc-line);
  color: var(--mc-secondary);
  font-size: 13px;
  transition: box-shadow 0.15s, background 0.12s, color 0.12s;
}
.mc-key-input:focus-within { box-shadow: 0 0 0 2px var(--mc-accent); }
.mc-key-input.is-active {
  background: var(--mc-key-active);
  color: rgba(255, 255, 255, 0.7);
  box-shadow: none;
}
.mc-key-input input {
  flex: 1;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  font-size: 17px;
  font-weight: 600;
  color: var(--mc-text);
  text-align: right;
  margin-right: 6px;
}
.mc-key-input.is-active input { color: #fff; }
.mc-key-input input::placeholder { color: rgba(0, 0, 0, 0.28); font-size: 14px; font-weight: 500; }
.mc-key-input.is-active input::placeholder { color: rgba(255, 255, 255, 0.4); }

/* 分段選擇 */
.mc-segment {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  border-radius: 12px;
  background: var(--mc-key);
}
.mc-segment-btn {
  height: 38px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--mc-secondary);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, box-shadow 0.15s;
  -webkit-tap-highlight-color: transparent;
}
.mc-segment-btn.is-active {
  background: var(--mc-panel);
  color: var(--mc-text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.mc-error {
  font-size: 12px;
  color: var(--mc-danger);
  padding-left: 2px;
}

/* 操作鍵 */
.mc-actions {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 12px;
  margin-top: 16px;
}
.mc-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 54px;
  border: 0;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.12s, transform 0.08s;
  -webkit-tap-highlight-color: transparent;
}
.mc-action:hover { filter: brightness(0.96); }
.mc-action:active { transform: scale(0.985); }
.mc-action .mc-mono { font-size: 18px; font-weight: 700; opacity: 0.75; }
.mc-action--ac {
  background: var(--mc-key);
  color: var(--mc-text);
}
.mc-action--eq {
  background: linear-gradient(180deg, #ffb340, var(--mc-accent));
  color: #1d1d1f;
  box-shadow: 0 6px 18px rgba(255, 159, 10, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.35);
}
.mc-action--eq:hover { filter: brightness(1.04); }

/* 還款計畫 */
.mc-schedule {
  margin: 0 14px 14px;
  border-radius: var(--mc-radius);
  background: var(--mc-panel);
  box-shadow: 0 0 0 1px var(--mc-line);
  overflow: hidden;
}
.mc-table { background: transparent !important; }
.mc-table :deep(th) {
  font-size: 12px !important;
  font-weight: 600 !important;
  color: var(--mc-secondary) !important;
  background: #fafafa !important;
}
.mc-table :deep(td) { font-size: 13px; }

@media (max-width: 600px) {
  .mc-grid { grid-template-columns: 1fr; }
  .mc-display { margin: 12px 12px 0; padding: 14px 16px 12px; }
  .mc-body { padding: 12px; }
  .mc-actions { grid-template-columns: 1fr 1.6fr; }
  .mc-key { flex-basis: 44px; min-width: 44px; }
}
</style>
