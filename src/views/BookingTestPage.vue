<template>
  <v-container class="py-6" style="max-width: 1000px;">
    <!-- 權限不足 -->
    <v-alert v-if="!hasAccess" type="error" variant="tonal" class="mt-4">
      此頁面僅限「超級管理員」使用。
    </v-alert>

    <template v-else>
      <!-- 標題 -->
      <v-card class="mb-4" elevation="2">
        <v-card-title class="d-flex align-center">
          <v-icon color="primary" class="mr-2">mdi-test-tube</v-icon>
          BookingPage 功能測試
        </v-card-title>
        <v-card-text class="text-body-2 text-medium-emphasis">
          針對公開預約頁（BookingPage）的各個後端節點做實際連線測試。所有測試信件只會寄到下方指定的
          Email（預設為您本人），不會寄給客戶或副本收件人；寫入流程測試建立的預約單會自動取消並從資料庫刪除，不影響正式資料與統計。
        </v-card-text>
      </v-card>

      <!-- 測試參數 -->
      <v-card class="mb-4" elevation="2">
        <v-card-title class="text-subtitle-1">測試參數</v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-autocomplete
                v-model="selectedProjectId"
                :items="projectStore.projectsList"
                item-title="name"
                item-value="id"
                label="選擇建案"
                variant="outlined"
                density="comfortable"
                :loading="isLoadingProjects"
                :disabled="isRunning"
                @update:model-value="onProjectChange"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="testEmail"
                label="測試信件收件 Email（僅寄給此信箱）"
                variant="outlined"
                density="comfortable"
                :disabled="isRunning"
                prepend-inner-icon="mdi-email-lock"
              />
            </v-col>
          </v-row>

          <v-row dense v-if="selectedProjectId">
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedBookingType"
                :items="bookingTypeOptions"
                label="預約項目"
                variant="outlined"
                density="comfortable"
                :disabled="isRunning || isLoadingParams"
                @update:model-value="onBookingTypeChange"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-select
                v-model="selectedMethod"
                :items="methodOptions"
                label="預約方式"
                variant="outlined"
                density="comfortable"
                :disabled="isRunning || isLoadingParams"
              />
            </v-col>
            <v-col cols="12" md="4">
              <v-autocomplete
                v-model="selectedUnit"
                :items="unitOptions"
                label="測試戶別"
                variant="outlined"
                density="comfortable"
                :disabled="isRunning || isLoadingParams"
                :loading="isLoadingParams"
              />
            </v-col>
          </v-row>

          <v-alert v-if="paramsError" type="warning" variant="tonal" density="compact" class="mt-2">
            {{ paramsError }}
          </v-alert>
        </v-card-text>
      </v-card>

      <!-- 執行區 -->
      <v-card class="mb-4" elevation="2">
        <v-card-text class="d-flex flex-wrap align-center ga-3">
          <v-btn
            color="primary"
            prepend-icon="mdi-play-circle"
            :loading="isRunningAll"
            :disabled="!canRun || isRunning"
            @click="runAllTests"
          >
            執行全部測試
          </v-btn>
          <v-btn
            color="secondary"
            variant="tonal"
            prepend-icon="mdi-broom"
            :disabled="!selectedProjectId || isRunning"
            :loading="isCleaning"
            @click="runCleanupOnly"
          >
            清除殘留測試資料
          </v-btn>
          <v-spacer />
          <div class="text-caption text-medium-emphasis">
            通過 {{ passCount }}／失敗 {{ failCount }}／共 {{ nodes.length }} 項
          </div>
        </v-card-text>
        <v-alert v-if="!canRun && selectedProjectId" type="info" variant="tonal" density="compact" class="mx-4 mb-4">
          請先確認測試參數（預約項目／方式／戶別／Email）皆已選擇。
        </v-alert>
      </v-card>

      <!-- 節點列表 -->
      <v-card elevation="2">
        <v-list lines="two">
          <template v-for="(node, idx) in nodes" :key="node.id">
            <v-divider v-if="idx > 0" />
            <v-list-item>
              <template #prepend>
                <v-progress-circular
                  v-if="results[node.id].status === 'running'"
                  indeterminate size="24" width="2" color="primary" class="mr-4"
                />
                <v-icon v-else :color="statusColor(results[node.id].status)" class="mr-2">
                  {{ statusIcon(results[node.id].status) }}
                </v-icon>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ idx + 1 }}. {{ node.name }}
                <v-chip
                  v-if="results[node.id].ms != null"
                  size="x-small" class="ml-2" variant="tonal"
                >
                  {{ results[node.id].ms }} ms
                </v-chip>
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ results[node.id].message || node.desc }}
              </v-list-item-subtitle>

              <!-- 寫入流程子步驟 -->
              <div v-if="node.id === 'fullFlow' && flowSteps.length" class="mt-2">
                <div
                  v-for="step in flowSteps"
                  :key="step.label"
                  class="d-flex align-center text-caption py-1"
                >
                  <v-icon size="16" :color="statusColor(step.status)" class="mr-2">
                    {{ statusIcon(step.status) }}
                  </v-icon>
                  <span class="mr-2">{{ step.label }}</span>
                  <span class="text-medium-emphasis">{{ step.message }}</span>
                </div>
              </div>

              <template #append>
                <v-btn
                  size="small"
                  variant="outlined"
                  color="primary"
                  :disabled="!canRun || isRunning"
                  @click="runSingle(node.id)"
                >
                  單獨測試
                </v-btn>
              </template>
            </v-list-item>
          </template>
        </v-list>
      </v-card>

      <v-alert type="info" variant="tonal" density="compact" class="mt-4 text-caption">
        說明：「驗證碼驗證（正向）」使用系統內部通行鑰匙（建案 ID）測試，不需真實身分證號；「完整預約寫入流程」會實際建立一筆標記為測試的預約
        → 寄出【系統測試】預約成功信（僅給上方 Email）→ 取消（寄出【系統測試】取消信）→ 從資料庫刪除該筆測試資料並更新戶別摘要。
        若測試中斷留下殘料，可按「清除殘留測試資料」。
      </v-alert>
    </template>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import {
  fetchProjectConfig,
  getBookingInitialData,
  fetchAllUnitsForBooking,
  checkExistingBooking,
  validateId,
  getBookingSlots,
  initiateBookingConfirmation,
  saveBooking,
  cancelBooking,
  cleanupTestBookings,
} from '@/api';

const userStore = useUserStore();
const projectStore = useProjectStore();

const hasAccess = computed(() => userStore.currentUserRoles?.includes('超級管理員'));

// --- 測試參數 ---
const selectedProjectId = ref(null);
const testEmail = ref(userStore.user?.email || '');
const selectedBookingType = ref(null);
const selectedMethod = ref(null);
const selectedUnit = ref(null);

const isLoadingProjects = ref(false);
const isLoadingParams = ref(false);
const paramsError = ref('');

// 載入後的建案資料（也做為節點 1-3 的測試素材）
const projectConfig = ref(null);
const initialData = ref(null);
const allUnitsByBuilding = ref({});

const selectedProjectName = computed(() => {
  const p = projectStore.projectsList.find(p => p.id === selectedProjectId.value);
  return p?.name || projectConfig.value?.name || '';
});

const bookingTypeOptions = computed(() => {
  const menu = projectConfig.value?.bookingMenu;
  if (Array.isArray(menu) && menu.length) {
    return menu.filter(m => !m.deleted).map(m => m.title).filter(Boolean);
  }
  const types = projectConfig.value?.bookingTypes || initialData.value?.bookingTypes || [];
  return types.map(t => (typeof t === 'string' ? t : t?.title)).filter(Boolean);
});

const methodOptions = computed(() => {
  const menu = projectConfig.value?.bookingMenu;
  if (Array.isArray(menu)) {
    const item = menu.find(m => m.title === selectedBookingType.value && !m.deleted);
    if (item?.methods?.length) {
      return item.methods.filter(m => !m.deleted).map(m => m.title).filter(Boolean);
    }
  }
  return projectConfig.value?.bookingMethodOptions || [];
});

const unitOptions = computed(() => {
  const list = [];
  for (const units of Object.values(allUnitsByBuilding.value || {})) {
    if (!Array.isArray(units)) continue;
    for (const u of units) {
      const id = typeof u === 'string' ? u : u?.unit;
      if (id) list.push(id);
    }
  }
  return list;
});

const canRun = computed(() =>
  !!selectedProjectId.value &&
  !!selectedBookingType.value &&
  !!selectedMethod.value &&
  !!selectedUnit.value &&
  /.+@.+\..+/.test(testEmail.value)
);

// --- 測試節點與結果 ---
const nodes = [
  { id: 'projectConfig', name: '建案設定讀取 (getProjectConfig)', desc: '讀取建案公開設定：名稱、發佈狀態、預約選單。' },
  { id: 'initialData', name: '初始資料 (getBookingInitialData)', desc: '讀取棟別清單、開放中的預約項目與批次時程。' },
  { id: 'allUnits', name: '戶別清單 (getAllUnitsForBooking)', desc: '讀取全部可預約戶別資料。' },
  { id: 'checkExisting', name: '既有預約查詢 (checkExistingBooking)', desc: '查詢所選戶別／項目是否已有有效預約。' },
  { id: 'validateIdPass', name: '驗證碼驗證-正向 (validateId)', desc: '以內部通行鑰匙驗證，預期通過。' },
  { id: 'validateIdReject', name: '驗證碼驗證-負向 (validateId)', desc: '以無效驗證碼驗證，預期被拒絕（拒絕才算通過）。' },
  { id: 'slots', name: '可預約時段 (getAvailableSlots)', desc: '以內部模式讀取可預約日期與時段。' },
  { id: 'token', name: '確認憑證 (initiateBookingConfirmation)', desc: '產生 5 分鐘時效的預約確認 Token。' },
  { id: 'fullFlow', name: '完整預約寫入流程（建立→查詢→取消→清除）', desc: '實際走一次 saveBooking／cancelBooking，測試信僅寄給上方 Email，資料自動清除。' },
];

const makeResult = () => ({ status: 'idle', ms: null, message: '' });
const results = reactive(Object.fromEntries(nodes.map(n => [n.id, makeResult()])));
const flowSteps = ref([]);

const isRunningAll = ref(false);
const isCleaning = ref(false);
const isRunning = computed(() =>
  isRunningAll.value || isCleaning.value || Object.values(results).some(r => r.status === 'running')
);

const passCount = computed(() => Object.values(results).filter(r => r.status === 'pass').length);
const failCount = computed(() => Object.values(results).filter(r => r.status === 'fail').length);

const statusColor = (s) => ({ pass: 'success', fail: 'error', skip: 'warning', running: 'primary' }[s] || 'grey');
const statusIcon = (s) => ({
  pass: 'mdi-check-circle',
  fail: 'mdi-close-circle',
  skip: 'mdi-minus-circle',
  running: 'mdi-progress-clock',
}[s] || 'mdi-circle-outline');

// --- 載入 ---
onMounted(async () => {
  if (!hasAccess.value) return;
  isLoadingProjects.value = true;
  try {
    await projectStore.fetchProjects();
  } catch (e) {
    console.error('載入建案清單失敗:', e);
  } finally {
    isLoadingProjects.value = false;
  }
});

const onProjectChange = async () => {
  // 重置狀態
  projectConfig.value = null;
  initialData.value = null;
  allUnitsByBuilding.value = {};
  selectedBookingType.value = null;
  selectedMethod.value = null;
  selectedUnit.value = null;
  paramsError.value = '';
  flowSteps.value = [];
  nodes.forEach(n => Object.assign(results[n.id], makeResult()));
  if (!selectedProjectId.value) return;

  isLoadingParams.value = true;
  try {
    // 載入參數同時就是節點 1-3 的實測
    await runNode('projectConfig');
    await runNode('initialData');
    await runNode('allUnits');

    // 自動帶入預設參數
    selectedBookingType.value = bookingTypeOptions.value[0] || null;
    selectedMethod.value = methodOptions.value[0] || null;
    selectedUnit.value = unitOptions.value[0] || null;
    if (!selectedBookingType.value) paramsError.value = '此建案沒有可用的預約項目，寫入相關測試將無法執行。';
    else if (!selectedUnit.value) paramsError.value = '此建案沒有可用的戶別資料，寫入相關測試將無法執行。';
  } finally {
    isLoadingParams.value = false;
  }
};

const onBookingTypeChange = () => {
  selectedMethod.value = methodOptions.value[0] || null;
};

// --- 節點執行器 ---
const runners = {
  async projectConfig() {
    const config = await fetchProjectConfig(selectedProjectId.value);
    if (!config || !config.name) throw new Error('未取得建案設定或缺少建案名稱。');
    projectConfig.value = config;
    const menuCount = Array.isArray(config.bookingMenu) ? config.bookingMenu.filter(m => !m.deleted).length : 0;
    return `建案「${config.name}」，發佈狀態：${config.isPublished === false ? '關閉' : '開啟'}，預約項目 ${menuCount} 項。`;
  },

  async initialData() {
    const res = await getBookingInitialData(selectedProjectName.value, selectedProjectId.value);
    if (res.status !== 'success') throw new Error(res.message || '讀取初始資料失敗。');
    initialData.value = res.data;
    const buildings = res.data?.buildings?.length || 0;
    const active = res.data?.activeBookingTypes || [];
    return `棟別 ${buildings} 筆；開放中的項目：${active.length ? active.join('、') : '（目前無開放批次）'}。`;
  },

  async allUnits() {
    const res = await fetchAllUnitsForBooking(selectedProjectName.value, selectedProjectId.value);
    if (res.status !== 'success') throw new Error(res.message || '讀取戶別清單失敗。');
    allUnitsByBuilding.value = res.data || {};
    const count = Object.values(res.data || {}).reduce((n, arr) => n + (Array.isArray(arr) ? arr.length : 0), 0);
    if (!count) throw new Error('戶別清單為空。');
    return `共 ${count} 戶。`;
  },

  async checkExisting() {
    const res = await checkExistingBooking(selectedProjectId.value, selectedUnit.value, selectedBookingType.value);
    if (res.status !== 'success') throw new Error(res.message || '查詢失敗。');
    const found = res.data?.status === 'found';
    return found
      ? `${selectedUnit.value} 的「${selectedBookingType.value}」已有 ${res.data.bookings?.length || 0} 筆有效預約。`
      : `${selectedUnit.value} 的「${selectedBookingType.value}」目前無有效預約。`;
  },

  async validateIdPass() {
    const res = await validateId(selectedProjectName.value, selectedUnit.value, selectedProjectId.value, selectedProjectId.value);
    if (res.status !== 'success') throw new Error(`內部通行鑰匙未通過驗證：${res.message || ''}`);
    return '內部通行鑰匙驗證通過，validateId 節點運作正常。';
  },

  async validateIdReject() {
    const res = await validateId(selectedProjectName.value, selectedUnit.value, 'ANXI-TEST-INVALID-ID', selectedProjectId.value);
    if (res.status === 'success') throw new Error('無效驗證碼竟然通過驗證，請立即檢查 validateId 邏輯！');
    return `無效驗證碼被正確拒絕（${res.message || '驗證不符'}）。`;
  },

  async slots() {
    const res = await getBookingSlots(
      selectedProjectName.value, selectedUnit.value, selectedBookingType.value,
      selectedMethod.value, selectedProjectId.value, '', selectedProjectId.value
    );
    if (res.status !== 'success') throw new Error(res.message || '讀取時段失敗。');
    const dates = Object.keys(res.data?.timeSlotsByDate || {});
    if (!dates.length) return '節點連線正常，但目前批次內沒有任何可列出的日期。';
    return `可預約日期 ${dates.length} 天（${dates[0]} ~ ${dates[dates.length - 1]}）。`;
  },

  async token() {
    const res = await initiateBookingConfirmation({
      projectId: selectedProjectId.value,
      unitId: selectedUnit.value,
      bookingType: selectedBookingType.value,
    });
    if (res.status !== 'success' || !res.token) throw new Error(res.message || '未取得確認 Token。');
    return `已取得確認 Token（${res.token.slice(0, 8)}…，5 分鐘內有效，過期後會由清理程序移除）。`;
  },

  async fullFlow() {
    flowSteps.value = [];
    const step = (label) => {
      const s = reactive({ label, status: 'running', message: '' });
      flowSteps.value.push(s);
      return s;
    };
    const pid = selectedProjectId.value;
    let bookingCode = null;

    try {
      // a. 取得時段
      let s = step('取得可預約時段');
      const slotsRes = await getBookingSlots(
        selectedProjectName.value, selectedUnit.value, selectedBookingType.value,
        selectedMethod.value, pid, '', pid
      );
      if (slotsRes.status !== 'success') throw new Error(slotsRes.message || '讀取時段失敗。');
      const byDate = slotsRes.data?.timeSlotsByDate || {};
      let chosenDate = null, chosenSlot = null;
      for (const [date, slots] of Object.entries(byDate)) {
        const ok = (slots || []).find(t => String(t).includes('尚餘'));
        if (ok) {
          chosenDate = date;
          chosenSlot = (String(ok).match(/(\d{1,2}:\d{2})/) || [])[1] || null;
          if (chosenSlot) break;
        }
      }
      if (!chosenDate || !chosenSlot) {
        s.status = 'skip';
        s.message = '沒有任何「尚餘名額」的時段，無法在不佔用名額的情況下測試寫入，已跳過。';
        return { status: 'skip', message: '寫入流程已跳過：目前批次內沒有可用名額的時段。' };
      }
      s.status = 'pass';
      s.message = `選用 ${chosenDate} ${chosenSlot}`;

      // b. 取得確認 Token
      s = step('取得確認憑證 Token');
      const tokenRes = await initiateBookingConfirmation({
        projectId: pid, unitId: selectedUnit.value, bookingType: selectedBookingType.value,
      });
      if (tokenRes.status !== 'success' || !tokenRes.token) throw new Error(tokenRes.message || '未取得 Token。');
      s.status = 'pass';
      s.message = `${tokenRes.token.slice(0, 8)}…`;

      // c. 建立測試預約（isTest：信件只寄測試 Email、不 CC、文件標記供清除）
      s = step('建立測試預約 (saveBooking) 並寄出【系統測試】通知信');
      const saveRes = await saveBooking({
        projectId: pid,
        devBypass: pid,
        bookingData: {
          projectName: selectedProjectName.value,
          unitId: selectedUnit.value,
          address: '',
          name: '系統功能測試',
          phone: '0900000000',
          email: testEmail.value,
          idNumber: pid,
          bookingType: selectedBookingType.value,
          bookingDate: chosenDate,
          bookingTimeSlot: chosenSlot,
          bookingMethod: selectedMethod.value,
          subOption: '',
          companyName: '',
          confirmationToken: tokenRes.token,
          isTest: true,
        },
      });
      if (saveRes.status !== 'success' || !saveRes.data?.bookingCode) {
        throw new Error(saveRes.message || '建立預約失敗。');
      }
      bookingCode = saveRes.data.bookingCode;
      s.status = 'pass';
      s.message = `預約代碼 ${bookingCode}，成功信已寄至 ${testEmail.value}`;

      // d. 驗證預約已寫入
      s = step('驗證預約已寫入 (checkExistingBooking)');
      const checkRes = await checkExistingBooking(pid, selectedUnit.value, selectedBookingType.value);
      const foundIt = checkRes.status === 'success' &&
        (checkRes.data?.bookings || []).some(b => b.bookingCode === bookingCode);
      if (!foundIt) throw new Error('查不到剛建立的測試預約。');
      s.status = 'pass';
      s.message = '資料庫中已可查得該筆測試預約。';

      // e. 取消預約
      s = step('取消測試預約 (cancelBooking) 並寄出【系統測試】取消信');
      const cancelRes = await cancelBooking({ projectId: pid, bookingCode });
      if (cancelRes.status !== 'success') throw new Error(cancelRes.message || '取消失敗。');
      bookingCode = null; // 已取消，之後由 cleanup 刪檔
      s.status = 'pass';
      s.message = `取消信已寄至 ${testEmail.value}`;

      // f. 刪除測試資料
      s = step('刪除測試資料 (cleanupTestBookings)');
      const cleanRes = await cleanupTestBookings(pid);
      if (cleanRes.status !== 'success') throw new Error(cleanRes.message || '清除失敗。');
      s.status = 'pass';
      s.message = `已刪除 ${cleanRes.data?.deletedAppointments ?? 0} 筆測試預約、${cleanRes.data?.deletedExpiredTokens ?? 0} 筆過期 Token。`;

      return `全流程通過：建立、查詢、取消、清除皆正常，兩封【系統測試】信已寄至 ${testEmail.value}。`;
    } catch (e) {
      const running = flowSteps.value.find(st => st.status === 'running');
      if (running) {
        running.status = 'fail';
        running.message = e.message;
      }
      // 無論在哪一步失敗，都嘗試把測試資料清乾淨
      try {
        if (bookingCode) await cancelBooking({ projectId: pid, bookingCode });
        const cleanRes = await cleanupTestBookings(pid);
        const s = step('失敗後自動清理');
        s.status = cleanRes.status === 'success' ? 'pass' : 'fail';
        s.message = cleanRes.status === 'success'
          ? `已刪除 ${cleanRes.data?.deletedAppointments ?? 0} 筆測試預約。`
          : (cleanRes.message || '清理失敗，請按「清除殘留測試資料」。');
      } catch (cleanupErr) {
        console.error('測試失敗後清理錯誤:', cleanupErr);
      }
      throw e;
    }
  },
};

async function runNode(id) {
  const r = results[id];
  r.status = 'running';
  r.message = '';
  r.ms = null;
  const t0 = performance.now();
  try {
    const outcome = await runners[id]();
    r.ms = Math.round(performance.now() - t0);
    if (outcome && typeof outcome === 'object' && outcome.status === 'skip') {
      r.status = 'skip';
      r.message = outcome.message;
    } else {
      r.status = 'pass';
      r.message = typeof outcome === 'string' ? outcome : '通過';
    }
    return true;
  } catch (e) {
    r.ms = Math.round(performance.now() - t0);
    r.status = 'fail';
    r.message = e.message || String(e);
    console.error(`[BookingTest] 節點 ${id} 失敗:`, e);
    return false;
  }
}

const runSingle = async (id) => {
  if (id === 'fullFlow') flowSteps.value = [];
  await runNode(id);
};

const runAllTests = async () => {
  if (!canRun.value) return;
  isRunningAll.value = true;
  flowSteps.value = [];
  nodes.forEach(n => Object.assign(results[n.id], makeResult()));
  try {
    for (const node of nodes) {
      await runNode(node.id);
    }
  } finally {
    isRunningAll.value = false;
  }
};

const runCleanupOnly = async () => {
  if (!selectedProjectId.value) return;
  isCleaning.value = true;
  try {
    const res = await cleanupTestBookings(selectedProjectId.value);
    if (res.status === 'success') {
      alert(`清理完成：刪除 ${res.data?.deletedAppointments ?? 0} 筆測試預約、${res.data?.deletedExpiredTokens ?? 0} 筆過期 Token。`);
    } else {
      alert(`清理失敗：${res.message || '未知錯誤'}`);
    }
  } finally {
    isCleaning.value = false;
  }
};
</script>
