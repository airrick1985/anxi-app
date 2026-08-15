<template>
  <div class="bank-page">
    <div class="bank-unit">
      <span class="u-label">{{ headerText }}</span>
    </div>

    <div class="bank-body">
      <div class="bank-sets">
        <div v-for="set in data.bankSets" :key="set.id" class="bank-set">
          <div class="bank-set-title" v-if="showSetLabel">{{ set.label }}</div>
          <table class="bank-table">
            <tbody>
              <tr><td class="hd">繳款銀行名稱</td></tr>
              <tr><td>{{ set.bankName }}</td></tr>
              <tr><td class="hd">戶名</td></tr>
              <tr><td>{{ set.accountName }}</td></tr>
              <tr><td class="hd">帳號</td></tr>
              <tr><td class="account">{{ set.account }}</td></tr>
            </tbody>
          </table>
        </div>
        <div v-if="!data.bankSets.length" class="text-grey empty-hint">（無銀行帳戶資料）</div>
      </div>

      <div class="qr-block" v-if="data.showQr">
        <div class="qr-label">{{ data.qrLabel }}</div>
        <div v-if="data.qrUrl" class="qr-wrap">
          <qrcode-vue :value="data.qrUrl" :size="104" level="M" />
        </div>
        <div v-else class="qr-placeholder">（未輸入網址）</div>
        <div v-if="captionText" class="qr-caption">{{ captionText }}</div>
      </div>
    </div>

    <div v-if="(data.repeatCount || 1) > 1" class="repeat-hint">
      ✂ 匯出時本頁將重複 {{ data.repeatCount }} 份（等分裁切）
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import QrcodeVue from 'qrcode.vue';

const props = defineProps({
  data: { type: Object, required: true },  // buildBankAccountsPageData 輸出
});

// 只有一組時不顯示組名（比照範例：直接列銀行資訊）
const showSetLabel = computed(() => (props.data.bankSets || []).length > 1);

// 頁首：建案名稱 戶別 頁面名稱（例：富宇首馥 D-19 房屋繳款銀行帳戶）
const headerText = computed(() =>
  [props.data.projectName, props.data.unitId, props.data.pageTitle].filter(Boolean).join(' '));

// QR 下方標籤（建案名 + 戶別）
const captionText = computed(() => {
  return [props.data.projectName, props.data.unitId].filter(Boolean).join('　');
});
</script>

<style scoped>
.bank-page { font-family: var(--doc-font, 'Noto Serif TC', 'PMingLiU', serif); font-size: 13px; color: #000; padding: 4px 8px; }
.bank-unit { margin-bottom: 16px; font-family: var(--doc-font, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif); }
.bank-unit .u-label { font-weight: 700; font-size: 15px; }
.bank-unit .u-value { font-weight: 700; font-size: 15px; margin-left: 28px; }
.bank-body { display: flex; gap: 44px; align-items: flex-start; }
.bank-sets { width: 290px; flex-shrink: 0; }
.bank-set { margin-bottom: 16px; }
.bank-set-title { font-weight: 700; margin-bottom: 3px; font-family: var(--doc-font, 'Noto Sans TC', sans-serif); font-size: 12px; }
.bank-table { width: 100%; border-collapse: collapse; }
.bank-table td {
  border: 1.2px solid #000; text-align: center; height: 39px;
  vertical-align: middle; font-size: 14px; padding: 2px 6px;
}
.bank-table .account { letter-spacing: 1.5px; font-size: 15px; }
.qr-block { text-align: center; padding-top: 14px; min-width: 140px; }
.qr-label {
  font-weight: 700; margin-bottom: 10px; letter-spacing: 1px;
  font-family: var(--doc-font, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif); font-size: 13px;
}
.qr-wrap { display: inline-block; }
.qr-caption {
  margin-top: 6px; font-size: 11px; letter-spacing: 1px;
  font-family: var(--doc-font, 'Noto Sans TC', 'Microsoft JhengHei', sans-serif);
}
.qr-placeholder {
  width: 104px; height: 104px; border: 1px dashed #999;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; color: #999; margin: 0 auto;
}
.empty-hint { font-size: 11px; }
.repeat-hint { margin-top: 28px; font-size: 10px; color: #888; border-top: 1px dashed #aaa; padding-top: 4px; }
</style>
