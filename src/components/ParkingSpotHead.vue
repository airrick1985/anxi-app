<template>
  <div class="psh">
    <span class="psh-icon" :style="{ background: tone.solid, color: tone.onSolid }"><svg-icon type="mdi" :path="mdiCarSide" :size="20"></svg-icon></span>
    <h3 class="psh-title">
      <span v-if="floor" class="psh-floor">{{ floor }}</span>
      {{ number }}
    </h3>
    <span class="psh-chip" :style="{ background: tone.solid, color: tone.onSolid }">{{ status || '未設定' }}</span>
    <span v-if="tierLabel" class="psh-chip psh-chip--soft" :style="{ background: tone.soft, color: tone.text }">{{ tierLabel }}</span>
  </div>
</template>

<script setup>
// 車位資訊卡／編輯視窗共用標題：圖示＋樓層＋號碼＋狀態
import SvgIcon from '@jamescoyle/vue-icon';
import { mdiCarSide } from '@mdi/js';

defineProps({
  floor: { type: [String, Number], default: '' },
  number: { type: [String, Number], default: '' },
  status: { type: String, default: '' },
  tierLabel: { type: String, default: '' },
  tone: { type: Object, required: true },
});
</script>

<style scoped>
.psh { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; min-width: 0; }
.psh-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 9px;
  flex: 0 0 auto;
}
.psh-title {
  display: inline-flex;
  align-items: baseline;
  gap: 7px;
  margin: 0 4px 0 0;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
  color: #1d1d1f;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.psh-floor { font-size: 15px; font-weight: 600; color: #6e6e73; }
.psh-chip { padding: 4px 11px; border-radius: 999px; font-size: 13px; font-weight: 700; line-height: 1.4; }
.psh-chip--soft { font-weight: 600; }
</style>
