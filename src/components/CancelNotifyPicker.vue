<template>
  <div class="cancel-notify-picker">
    <div class="text-subtitle-2 font-weight-bold d-flex align-center mb-1">
      <v-icon size="small" class="mr-1">mdi-email-outline</v-icon>
      <span>取消通知信收件對象</span>
    </div>

    <div v-if="loading" class="text-caption text-grey d-flex align-center py-2">
      <v-progress-circular indeterminate size="16" width="2" class="mr-2"></v-progress-circular>
      載入收件人資料中...
    </div>

    <template v-else>
      <v-alert v-if="loadError" type="warning" variant="tonal" density="compact" class="mb-2 text-caption">
        無法載入收件人清單；取消後僅系統/超級管理員必寄對象會收到通知信。
      </v-alert>

      <v-checkbox v-model="toBooker" :disabled="!booker.email" density="compact" hide-details color="error">
        <template v-slot:label>
          <span class="text-body-2">
            預約人：{{ booker.name || '—' }}
            <span class="text-caption" :class="booker.email ? 'text-grey-darken-1' : 'text-grey'">
              {{ booker.email ? `(${booker.email})` : '（無 Email，無法寄送）' }}
            </span>
          </span>
        </template>
      </v-checkbox>

      <v-checkbox v-for="r in ccRecipients" :key="r.email" v-model="selectedCc" :value="r.email"
        density="compact" hide-details color="error">
        <template v-slot:label>
          <span class="text-body-2">
            {{ r.name || '副本收件人' }}
            <span class="text-caption text-grey-darken-1">({{ r.email }})</span>
          </span>
        </template>
      </v-checkbox>
      <div v-if="!loadError && !ccRecipients.length && !mandatoryRecipients.length" class="text-caption text-grey mt-1">
        此建案沒有「驗屋系統信件副本」收件人。
      </div>

      <div v-if="mandatoryRecipients.length" class="text-caption text-grey-darken-1 mt-2 d-flex align-center">
        <v-icon size="x-small" class="mr-1">mdi-lock-outline</v-icon>
        必寄對象（系統/超級管理員）：{{ mandatoryRecipients.map(r => r.name || r.email).join('、') }}
      </div>

      <div v-if="!anySelected" class="text-caption text-orange-darken-2 mt-2 d-flex align-center">
        <v-icon size="x-small" class="mr-1">mdi-email-off-outline</v-icon>
        <span v-if="mandatoryRecipients.length">未勾選任何對象，取消後僅寄送給必寄對象。</span>
        <span v-else>未勾選任何對象，取消後將不寄送通知信。</span>
      </div>
    </template>
  </div>
</template>

<script setup>
// 後台取消預約通知信收件對象勾選元件：
// 掛載時向後端查詢預約人（Email 以系統紀錄為準）與「驗屋系統信件副本」人員，
// 以 v-model 回傳 { ready, toBooker, cc: [email] }，ready 為 false 時表示尚在載入。
import { ref, computed, watch, onMounted } from 'vue';
import { getCancelNotifyRecipients, liffGetCancelNotifyRecipients } from '@/api';

const props = defineProps({
  projectId: { type: String, required: true },
  appointmentId: { type: String, required: true },
  // LIFF 頁面走 liffCalendarApi 路由
  liff: { type: Boolean, default: false }
});
const emit = defineEmits(['update:modelValue']);

const loading = ref(true);
const loadError = ref(false);
const booker = ref({ name: '', email: '' });
const ccRecipients = ref([]);
// 必寄對象（roles 含超級管理員/系統管理員）：後端強制寄送，前端僅顯示、不可取消勾選
const mandatoryRecipients = ref([]);
const toBooker = ref(false);
const selectedCc = ref([]);

const anySelected = computed(() => (toBooker.value && !!booker.value.email) || selectedCc.value.length > 0);

const emitState = () => {
  emit('update:modelValue', {
    ready: !loading.value,
    toBooker: toBooker.value && !!booker.value.email,
    cc: [...selectedCc.value]
  });
};

onMounted(async () => {
  emitState();
  try {
    const fetcher = props.liff ? liffGetCancelNotifyRecipients : getCancelNotifyRecipients;
    const res = await fetcher(props.projectId, props.appointmentId);
    if (!res || res.status !== 'success') throw new Error(res?.message || '載入失敗');
    booker.value = { name: res.booker?.name || '', email: res.booker?.email || '' };
    ccRecipients.value = Array.isArray(res.ccRecipients) ? res.ccRecipients : [];
    mandatoryRecipients.value = Array.isArray(res.mandatoryRecipients) ? res.mandatoryRecipients : [];
    // 預設全部勾選（與原本「寄預約人 + 全部副本」行為一致）
    toBooker.value = !!booker.value.email;
    selectedCc.value = ccRecipients.value.map(r => r.email);
  } catch (err) {
    console.error('載入取消通知收件人失敗:', err);
    loadError.value = true;
  } finally {
    loading.value = false;
    emitState();
  }
});

watch([toBooker, selectedCc], emitState, { deep: true });
</script>
