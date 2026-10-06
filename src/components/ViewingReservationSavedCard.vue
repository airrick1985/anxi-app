<template>
  <v-card>
    <v-card-title class="bg-success text-white d-flex align-center">
      <v-icon start>mdi-check-circle</v-icon>
      <span class="text-h6 flex-grow-1">{{ isEdit ? '已更新賞屋預約' : '已新增賞屋預約' }}</span>
      <v-btn icon="mdi-close" variant="text" @click="emit('close')"></v-btn>
    </v-card-title>

    <v-card-text class="pt-4">
      <div v-for="row in rows" :key="row.label" class="saved-row">
        <span class="saved-label">{{ row.label }}</span>
        <span class="saved-value">
          <template v-if="row.label === '時間'">
            <span v-if="timeChanged" class="text-grey text-decoration-line-through mr-1">{{ formatTime(reservation.previousTime) }}</span>
            <v-icon v-if="timeChanged" size="14" class="mr-1">mdi-arrow-right</v-icon>
            <span class="font-weight-bold">{{ row.value }}</span>
          </template>
          <template v-else-if="row.label === '客戶'">
            {{ reservation.customerName }}
            <a :href="`tel:${reservation.customerPhone}`" class="ml-2">{{ reservation.customerPhone }}</a>
          </template>
          <template v-else>{{ row.value }}</template>
        </span>
      </div>

      <div class="calendar-box mt-4">
        <div v-if="showQr" class="text-center mr-4">
          <qrcode-vue :value="calendarUrl" :size="128" level="M" />
          <div class="text-caption text-grey-darken-1">手機掃描</div>
        </div>
        <div class="flex-grow-1 d-flex flex-column justify-center ga-2">
          <!-- Apple 裝置也可能使用 Google 日曆，讓使用者選；其他裝置直接開 Google 日曆 -->
          <template v-if="IS_APPLE">
            <div class="text-subtitle-2 font-weight-bold">加入到我的行事曆</div>
            <div class="d-flex flex-column flex-sm-row ga-2">
              <v-btn color="primary" variant="flat" size="large" class="flex-1-1" prepend-icon="mdi-apple"
                @click="openCalendar('apple')">
                Apple 行事曆
              </v-btn>
              <v-btn color="primary" variant="flat" size="large" class="flex-1-1" prepend-icon="mdi-google"
                @click="openCalendar('google')">
                Google 日曆
              </v-btn>
            </div>
          </template>
          <v-btn v-else color="primary" variant="flat" size="large" block prepend-icon="mdi-google"
            @click="openCalendar()">
            加入到我的行事曆
          </v-btn>
          <v-btn variant="tonal" block prepend-icon="mdi-content-copy" @click="copyText">複製預約文字</v-btn>
        </div>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions class="pa-4">
      <v-spacer></v-spacer>
      <v-btn color="primary" variant="flat" @click="emit('close')">完成</v-btn>
    </v-card-actions>
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
.saved-row {
  display: flex;
  padding: 4px 0;
  font-size: 0.95rem;
}

.saved-label {
  flex: 0 0 72px;
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}

.saved-value {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.calendar-box {
  display: flex;
  align-items: stretch;
  padding: 12px;
  border-radius: 8px;
  background: rgba(var(--v-theme-primary), 0.06);
}
</style>
