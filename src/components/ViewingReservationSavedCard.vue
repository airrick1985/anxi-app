<template>
  <v-card class="mac-sheet vr-saved">
    <div class="mac-sheet-head">
      <v-icon size="20" class="vr-saved-icon">mdi-check-circle</v-icon>
      <span class="vr-saved-title">{{ isEdit ? '已更新賞屋預約' : '已新增賞屋預約' }}</span>
      <button type="button" class="mac-sheet-close" title="關閉" @click="emit('close')">
        <v-icon size="18">mdi-close</v-icon>
      </button>
    </div>

    <v-card-text class="mac-form vr-saved-body">
      <div class="mac-form-group">
        <div v-for="row in rows" :key="row.label" class="saved-row">
          <span class="saved-label">{{ row.label }}</span>
          <span class="saved-value">
            <template v-if="row.label === '時間'">
              <span v-if="timeChanged" class="saved-old-time">{{ formatTime(reservation.previousTime) }}</span>
              <v-icon v-if="timeChanged" size="14" class="saved-arrow">mdi-arrow-right</v-icon>
              <span class="saved-strong">{{ row.value }}</span>
            </template>
            <template v-else-if="row.label === '客戶'">
              {{ reservation.customerName }}
              <a :href="`tel:${reservation.customerPhone}`" class="saved-tel">{{ reservation.customerPhone }}</a>
            </template>
            <template v-else>{{ row.value }}</template>
          </span>
        </div>
      </div>

      <div class="mac-form-label">加入到我的行事曆</div>
      <div class="mac-form-group calendar-box">
        <div v-if="showQr" class="calendar-qr">
          <qrcode-vue :value="calendarUrl" :size="112" level="M" />
          <div class="calendar-qr-caption">手機掃描</div>
        </div>
        <div class="calendar-actions">
          <!-- Apple 裝置也可能使用 Google 日曆，讓使用者選；其他裝置直接開 Google 日曆 -->
          <div v-if="IS_APPLE" class="calendar-choice">
            <button type="button" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--wrap" @click="openCalendar('apple')">
              <v-icon size="18">mdi-apple</v-icon>Apple 行事曆
            </button>
            <button type="button" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--wrap" @click="openCalendar('google')">
              <v-icon size="18">mdi-google</v-icon>Google 日曆
            </button>
          </div>
          <button v-else type="button" class="mac-btn mac-btn--primary mac-btn--lg mac-btn--block" @click="openCalendar()">
            <v-icon size="18">mdi-google</v-icon>加入 Google 日曆
          </button>
          <button type="button" class="mac-btn mac-btn--lg mac-btn--block" @click="copyText">
            <v-icon size="16">mdi-content-copy</v-icon>複製預約文字
          </button>
        </div>
      </div>
    </v-card-text>

    <div class="mac-sheet-foot">
      <span class="mac-spacer"></span>
      <button type="button" class="mac-btn mac-btn--primary vr-done-btn" @click="emit('close')">完成</button>
    </div>
  </v-card>
</template>

<script setup>
import { computed } from 'vue';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import liff from '@line/liff';
import QrcodeVue from 'qrcode.vue';
import { useToast } from 'vue-toastification';

const props = defineProps({
  // { id, projectName, customerName, customerPhone, reservationTime, previousTime, type, unitId, salesName, note }
  reservation: { type: Object, required: true },
  isEdit: { type: Boolean, default: false },
});
const emit = defineEmits(['close']);
const toast = useToast();

// 同一網址供一鍵加入與 QR Code：Apple 裝置回傳 .ics，其他裝置轉 Google 日曆（functions/viewingReservationCalendar.js）
const CALENDAR_ENDPOINT = 'https://asia-east1-apps-script-api-443402.cloudfunctions.net/viewingReservationCalendar';
const UA = navigator.userAgent;
const IS_APPLE = /iPhone|iPad|iPod|Macintosh/i.test(UA); // iPadOS Safari 回報 Macintosh，一併涵蓋
const IN_LINE = /\bLine\//i.test(UA);
const showQr = !/iPhone|iPod|Android.*Mobile/i.test(UA);

const calendarUrl = computed(() => `${CALENDAR_ENDPOINT}?id=${encodeURIComponent(props.reservation.id)}`);

const formatTime = (date) => (date ? format(date, 'yyyy/MM/dd（EEEEE）HH:mm', { locale: zhTW }) : '');

const timeChanged = computed(() => {
  const { previousTime, reservationTime } = props.reservation;
  return !!previousTime && previousTime.getTime() !== reservationTime.getTime();
});

const rows = computed(() => {
  const r = props.reservation;
  return [
    { label: '建案', value: r.projectName },
    { label: '時間', value: formatTime(r.reservationTime) },
    { label: '類型', value: r.type },
    { label: '客戶', value: r.customerName },
    { label: '負責銷售', value: r.salesName || '不指定' },
    r.unitId && { label: '戶別', value: r.unitId },
    r.note && { label: '備註', value: r.note },
  ].filter(Boolean);
});

// target：'apple'／'google' 由使用者指定（Apple 裝置），未指定時由後端依裝置判斷
const openCalendar = (target) => {
  const url = target ? `${calendarUrl.value}&target=${target}` : calendarUrl.value;
  // LINE 內建瀏覽器無法開啟 .ics、也無法登入 Google，一律轉外部瀏覽器
  if (IN_LINE) {
    try {
      if (liff.isInClient()) return liff.openWindow({ url, external: true });
    } catch (e) {
      console.warn('liff.openWindow 失敗，改用 openExternalBrowser:', e);
    }
    window.location.href = `${url}&openExternalBrowser=1`;
    return;
  }
  if (IS_APPLE && target !== 'google') window.location.href = url;
  else window.open(url, '_blank', 'noopener');
};

const buildCopyText = () => {
  const r = props.reservation;
  const time = formatTime(r.reservationTime) + (timeChanged.value ? `（原 ${formatTime(r.previousTime)}）` : '');
  return [
    `【${r.projectName}】賞屋預約${props.isEdit ? '（已更新）' : ''}`,
    `時間：${time}`,
    `客戶：${r.customerName} ${r.customerPhone}`,
    `類型：${r.type}`,
    `負責銷售：${r.salesName || '不指定'}`,
    r.unitId && `戶別：${r.unitId}`,
    r.note && `備註：${r.note}`,
  ].filter(Boolean).join('\n');
};

const copyText = async () => {
  const text = buildCopyText();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // 部分 App 內建瀏覽器不支援 Clipboard API
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
  }
  toast.success('已複製預約文字');
};
</script>

<style scoped>
.vr-saved-icon { color: #34c759 !important; }
.vr-saved-title { flex: 1 1 auto; min-width: 0; font-size: 15px; line-height: 1.35; overflow-wrap: anywhere; }
.vr-saved-body { padding: 14px 16px 16px !important; }
.vr-saved-body .mac-form-label { margin-top: 16px; }

.saved-row {
  display: flex;
  gap: 12px;
  padding: 9px 14px;
  font-size: 14px;
  line-height: 1.5;
}
.saved-row + .saved-row { border-top: 1px solid #ececf0; }
.saved-label { flex: 0 0 auto; min-width: 64px; color: #6e6e73; white-space: nowrap; }
.saved-value {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.saved-strong { font-weight: 600; }
.saved-old-time { margin-right: 4px; color: #8e8e93; text-decoration: line-through; }
.saved-arrow { margin-right: 4px; color: #8e8e93; }
.saved-tel { margin-left: 8px; color: #0071e3; text-decoration: none; white-space: nowrap; }

.calendar-box { display: flex; align-items: center; gap: 16px; padding: 14px; }
.calendar-qr { flex-shrink: 0; text-align: center; }
.calendar-qr-caption { margin-top: 4px; font-size: 11.5px; color: #6e6e73; }
.calendar-actions { flex: 1 1 auto; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.calendar-choice { display: flex; gap: 8px; }
.calendar-choice .mac-btn { flex: 1 1 0; min-width: 0; }
.vr-done-btn { min-width: 72px; }

@media (max-width: 600px) {
  .vr-saved-body { padding: 12px 12px 14px !important; }
  .saved-row { padding: 9px 12px; font-size: 15px; }
  .calendar-choice { flex-direction: column; }
  .vr-done-btn { height: 36px; font-size: 14px; }
}
</style>
