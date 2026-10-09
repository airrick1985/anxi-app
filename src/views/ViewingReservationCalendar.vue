<template>
  <v-layout class="vr-page fill-height">
    <v-navigation-drawer
      v-model="drawer"
      :permanent="mdAndUp"
      :temporary="smAndDown"
      width="300"
      class="vr-sidebar"
    >
      <!-- 左側留白避開全站漢堡鈕（fixed 左上 10px＋40px） -->
      <div class="vr-side-head">
        <div class="vr-side-title">賞屋預約</div>
        <div class="vr-side-project">{{ scopeLabel }}</div>
      </div>

      <!-- 切換：我的預約（全部建案）／各建案（有 客資系統-櫃台 或 客資系統-銷售 權限的建案） -->
      <section class="vr-side-section">
        <div class="vr-side-label">檢視</div>
        <v-select
          :model-value="scopeValue"
          :items="scopeOptions"
          item-title="name"
          item-value="id"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="mac-vfield"
          menu-icon="mdi-unfold-more-horizontal"
          :menu-props="{ contentClass: 'mac-menu' }"
          :disabled="isSwitchingProject"
          @update:model-value="switchScope"
        ></v-select>
      </section>

      <!-- 我的預約：依建案篩選 -->
      <section v-if="isPersonal" class="vr-side-section">
        <div class="vr-side-label">
          建案
          <button type="button" class="vr-side-link" @click="filters.hiddenProjectIds = []">全選</button>
        </div>
        <div class="vr-check-list vr-check-list--scroll">
          <label v-for="p in projectsInData" :key="p.id" class="vr-check-row">
            <input
              type="checkbox"
              class="mac-check"
              :checked="!filters.hiddenProjectIds.includes(p.id)"
              @change="toggleProjectFilter(p.id)"
            >
            <span class="vr-check-text">{{ p.name }}</span>
          </label>
          <div v-if="projectsInData.length === 0" class="vr-side-empty">尚無預約</div>
        </div>
      </section>

      <section v-else class="vr-side-section">
        <div class="vr-side-label">
          銷售人員
          <button type="button" class="vr-side-link" @click="filters.salesNames = []">清除</button>
        </div>
        <div class="vr-check-list vr-check-list--scroll">
          <label v-for="name in allSalesPeople" :key="name" class="vr-check-row">
            <input v-model="filters.salesNames" type="checkbox" class="mac-check" :value="name">
            <span class="vr-check-text">{{ name || '未指派' }}</span>
          </label>
          <div v-if="allSalesPeople.length === 0" class="vr-side-empty">尚無預約</div>
        </div>
      </section>

      <section class="vr-side-section">
        <div class="vr-side-label">快速跳轉</div>
        <v-date-picker
          v-model="miniCalendarDate"
          hide-header
          flat
          control-variant="modal"
          color="#0071e3"
          class="vr-mini-cal"
          @update:model-value="onMiniCalendarChange"
        ></v-date-picker>
      </section>

      <section class="vr-side-section">
        <div class="vr-side-label">預約類型</div>
        <div class="vr-check-list">
          <label v-for="t in TYPE_FILTERS" :key="t.value" class="vr-check-row">
            <input
              v-model="filters.type"
              type="checkbox"
              class="mac-check"
              :value="t.value"
              :style="{ '--mac-check-color': TYPE_COLORS[t.value].border }"
            >
            <span class="vr-check-text">{{ t.label }}</span>
          </label>
        </div>
      </section>

      <section v-if="canAccessSettings" class="vr-side-section vr-side-actions">
        <button v-if="!isPersonal" type="button" class="mac-btn mac-btn--block" @click="smsSettingsDialog = true">
          <v-icon size="16">mdi-message-cog</v-icon>簡訊提醒設定
        </button>
        <button type="button" class="mac-btn mac-btn--block" @click="router.push('/sms-monitor')">
          <v-icon size="16">mdi-monitor-dashboard</v-icon>簡訊回報監控
        </button>
      </section>
    </v-navigation-drawer>

    <SmsReminderSettingsDialog
      v-if="!isPersonal"
      v-model="smsSettingsDialog"
      :projectId="projectId"
    />

    <v-main class="vr-main d-flex flex-column fill-height">
      <!-- 第一列：標題＋前後切換；側欄未固定時左側留給全站漢堡鈕 -->
      <header class="vr-bar" :class="{ 'vr-bar--inset': !sidebarDocked }">
        <button v-if="smAndUp" type="button" class="mac-icon-btn vr-tool-icon" title="側邊欄" @click="drawer = !drawer">
          <v-icon size="20">mdi-dock-left</v-icon>
        </button>
        <div class="vr-title">
          <div class="vr-title-main">{{ currentTitle }}</div>
          <v-menu location="bottom start" content-class="mac-menu">
            <template v-slot:activator="{ props: menuProps }">
              <button type="button" class="vr-scope-btn" :class="{ 'is-mine': isPersonal }" v-bind="menuProps" :disabled="isSwitchingProject">
                <v-icon size="14">{{ isPersonal ? 'mdi-account-clock' : 'mdi-office-building' }}</v-icon>
                <span class="vr-scope-text">{{ scopeLabel }}</span>
                <v-icon size="14">mdi-chevron-down</v-icon>
              </button>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="opt in scopeOptions"
                :key="opt.id"
                :title="opt.name"
                :prepend-icon="opt.id === MINE ? 'mdi-account-clock' : 'mdi-office-building'"
                :active="opt.id === scopeValue"
                @click="switchScope(opt.id)"
              ></v-list-item>
            </v-list>
          </v-menu>
        </div>
        <div class="vr-nav">
          <button type="button" class="vr-nav-btn" title="上一頁" @click="goPrev"><v-icon size="18">mdi-chevron-left</v-icon></button>
          <button type="button" class="vr-nav-btn vr-nav-today" @click="goToday">今天</button>
          <button type="button" class="vr-nav-btn" title="下一頁" @click="goNext"><v-icon size="18">mdi-chevron-right</v-icon></button>
        </div>
        <template v-if="smAndUp">
          <button type="button" class="mac-icon-btn vr-tool-icon" title="重新整理" @click="fetchData">
            <v-icon size="20">mdi-refresh</v-icon>
          </button>
          <button v-if="canAccessSettings && lgAndUp" type="button" class="mac-btn" @click="router.push('/sms-monitor')">
            <v-icon size="16">mdi-monitor-dashboard</v-icon>簡訊回報監控
          </button>
          <button type="button" class="mac-btn mac-btn--primary" @click="openAddDialog">
            <v-icon size="16">mdi-plus</v-icon>新增預約
          </button>
        </template>
      </header>

      <!-- 第二列：視圖切換＋搜尋 -->
      <div class="vr-subbar">
        <button v-if="xs" type="button" class="mac-icon-btn vr-tool-icon" title="篩選" @click="drawer = !drawer">
          <v-icon size="20">mdi-dock-left</v-icon>
        </button>
        <div class="mac-form-seg mac-form-seg--block vr-view-seg">
          <button
            v-for="(label, view) in viewLabelMap"
            :key="view"
            type="button"
            class="mac-form-seg-btn"
            :class="{ 'is-active': currentView === view }"
            @click="changeView(view)"
          >{{ label }}</button>
        </div>

        <v-autocomplete
          v-if="smAndUp"
          v-model="selectedSearchItem"
          :items="searchItems"
          item-title="searchLabel"
          placeholder="搜尋姓名、電話、戶別、備註"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          density="compact"
          hide-details
          class="mac-vfield mac-vfield--search vr-search"
          menu-icon=""
          :menu-props="{ contentClass: 'mac-menu', minWidth: 320 }"
          return-object
          clearable
          :custom-filter="autocompleteFilter"
          @update:model-value="onSearchSelect"
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.customerPhone + (isPersonal ? '｜' + projectNameOf(item.raw.projectId) : '｜負責銷售：' + (item.raw.salesName || '未指定'))"></v-list-item>
          </template>
        </v-autocomplete>
        <template v-else>
          <button type="button" class="mac-icon-btn vr-tool-icon" :class="{ 'is-on': mobileSearchOpen }" title="搜尋" @click="toggleMobileSearch">
            <v-icon size="20">mdi-magnify</v-icon>
          </button>
          <button type="button" class="mac-icon-btn vr-tool-icon" title="重新整理" @click="fetchData">
            <v-icon size="20">mdi-refresh</v-icon>
          </button>
        </template>
      </div>

      <!-- 手機版搜尋 -->
      <v-expand-transition>
        <div v-if="xs && mobileSearchOpen" class="vr-msearch">
          <div class="vr-msearch-row">
            <v-text-field
              ref="mobileSearchRef"
              v-model="searchQuery"
              placeholder="搜尋姓名、電話、戶別、備註"
              prepend-inner-icon="mdi-magnify"
              variant="solo"
              flat
              density="compact"
              hide-details
              clearable
              class="mac-vfield mac-vfield--search"
            ></v-text-field>
            <button type="button" class="vr-msearch-cancel" @click="closeMobileSearch">取消</button>
          </div>
          <div v-if="searchQuery" class="vr-msearch-list">
            <button
              v-for="res in filteredSearchItems"
              :key="res.id"
              type="button"
              class="vr-msearch-item"
              @click="onSearchSelect(res)"
            >
              <span class="vr-msearch-dot" :style="{ background: TYPE_COLORS[resolveTypeKey(res.type)].border }"></span>
              <span class="vr-msearch-main">
                <span class="vr-msearch-title">{{ res.customerName }}　{{ res.customerPhone }}</span>
                <span class="vr-msearch-sub">{{ formatDate(res.reservationTime) }}｜{{ isPersonal ? projectNameOf(res.projectId) : (res.salesName || '未指定') }}</span>
              </span>
            </button>
            <div v-if="filteredSearchItems.length === 0" class="vr-msearch-empty">找不到相符的預約</div>
          </div>
        </div>
      </v-expand-transition>

      <div
        class="flex-grow-1 w-100 position-relative calendar-wrapper"
        :class="transitionClass"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @click="handleCalendarAreaClick"
      >
        <FullCalendar ref="calendarRef" :options="calendarOptions" class="calendar-container" />
        <v-overlay :model-value="reservationStore.loading" contained class="align-center justify-center">
          <v-progress-circular indeterminate color="#0071e3" size="32" width="3"></v-progress-circular>
        </v-overlay>
      </div>
    </v-main>

    <button v-if="xs" type="button" class="vr-fab" title="新增預約" @click="openAddDialog">
      <v-icon size="28">mdi-plus</v-icon>
    </button>

    <ViewingReservationDialog
      v-model="showDialog"
      :projectId="projectId"
      :project-selectable="isPersonal"
      :initialData="selectedReservation"
      :initialDate="selectedDate"
      @saved="fetchData"
      @deleted="fetchData"
    />

    <!-- 列表視圖：日期統計 -->
    <v-dialog v-model="daySummaryDialog" max-width="400">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-account-group</v-icon>
          <span class="vr-sheet-title">{{ daySummaryTitle }}</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="daySummaryDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <div class="mac-form vr-summary-body">
          <div class="mac-form-group">
            <div v-for="item in daySummaryItems" :key="item.name" class="mac-form-row">
              <span class="mac-form-row-main mac-form-row-title">{{ item.name }}</span>
              <span class="vr-count-pill">{{ item.count }} 筆</span>
            </div>
            <div v-if="daySummaryItems.length === 0" class="mac-form-row mac-form-empty">當日無預約</div>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" @click="daySummaryDialog = false">關閉</button>
        </div>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore';
import { useReservationStore } from '@/store/reservationStore';
import { useDisplay } from 'vuetify';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import zhTwLocale from '@fullcalendar/core/locales/zh-tw';
import ViewingReservationDialog from '@/components/ViewingReservationDialog.vue';
import SmsReminderSettingsDialog from '@/components/SmsReminderSettingsDialog.vue';
import { getTaiwanHoliday, holidaysRevision } from '@/utils/taiwanHolidays';
import { getViewingProjects } from '@/utils/viewingReservationAccess';


// personal：我的賞屋預約（彙整所有建案中指定銷售為自己的預約）
const props = defineProps({
    projectId: { type: String, default: null },
    personal: { type: Boolean, default: false }
});
const isPersonal = computed(() => props.personal);
const router = useRouter();
const userStore = useUserStore();
const projectStore = useProjectStore();
const reservationStore = useReservationStore();
const { xs, smAndUp, smAndDown, mdAndUp, lgAndUp } = useDisplay();

const calendarRef = ref(null);
const drawer = ref(mdAndUp.value);
// 側欄固定顯示時工具列在側欄右側；否則工具列貼齊左緣，要讓出全站漢堡鈕的位置
const sidebarDocked = computed(() => mdAndUp.value && drawer.value);
const showDialog = ref(false);
const selectedReservation = ref(null);
const selectedDate = ref(null);

// ✅ 列表視圖優化：日期統計 modal
const daySummaryDialog = ref(false);
const daySummaryTitle = ref('');
const daySummaryItems = ref([]);
const miniCalendarDate = ref(new Date());
const currentTitle = ref('');
const currentView = ref('dayGridMonth');
const smsSettingsDialog = ref(false);

// 權限判斷：包含系統管理員或超級管理員
 const canAccessSettings = computed(() => {
    const roles = userStore.user?.roles || [];
    return roles.includes('系統管理員') || roles.includes('超級管理員');
});

// ✅ 新增：檢查用戶是否有「客資系統-管理」權限
const hasLeadManagementPermission = computed(() => {
    return userStore.hasProjectPermission('客資系統-管理', projectName.value);
});

// ✅ 檢查用戶是否為系統管理員或超級管理員
const isAdmin = computed(() => {
    const roles = userStore.user?.roles || [];
    return roles.includes('系統管理員') || roles.includes('超級管理員');
});

// ✅ 檢查用戶是否有「客資系統-櫃台」權限
const hasReceptionPermission = computed(() => {
    return userStore.hasProjectPermission('客資系統-櫃台', projectName.value);
});

// ✅ 是否可查看所有銷售人員預約（管理員、櫃台、客資管理皆可）
const canViewAllReservations = computed(() => {
    return isAdmin.value || hasReceptionPermission.value || hasLeadManagementPermission.value;
});

const transitionClass = ref('');
let touchstartX = 0;
let touchstartY = 0;

const MAX_CONCURRENT_RESERVATIONS = 3;
const conflictWarning = ref({ show: false, count: 0, time: '' });

// ✅ 修改：根據權限初始化銷售人員篩選
// - 管理員 / 櫃台 / 客資管理：預設勾選所有銷售人員
// - 其他：預設只勾選當前用戶
const defaultSalesNames = computed(() => {
  if (canViewAllReservations.value) {
    return [...allSalesPeople.value];
  }
  const currentUserName = userStore.user?.name;
  return currentUserName ? [currentUserName] : [];
});

// hiddenProjectIds 用排除法：重新載入後新出現的建案預設顯示
const filters = ref({ type: ['新客', '回訪', '簽約', '__other__'], salesNames: [], hiddenProjectIds: [] });

// 預設預約類型；非預設類型（如「已購客」自訂值）統一歸為 '__other__'
const PREDEFINED_RESERVATION_TYPES = ['新客', '回訪', '簽約'];
// 色系對齊 macOS 行事曆（系統藍／紅／綠／橘）
const TYPE_COLORS = {
    '新客':   { bg: '#e3effd', border: '#007aff', text: '#0a4a8f' },
    '回訪':   { bg: '#fde7e6', border: '#ff3b30', text: '#a1271d' },
    '簽約':   { bg: '#e2f5e7', border: '#34c759', text: '#1e6b33' },
    '__other__': { bg: '#fff1dc', border: '#ff9500', text: '#8f5200' },
};
const TYPE_FILTERS = [
    { value: '新客', label: '新客預約' },
    { value: '回訪', label: '回訪' },
    { value: '簽約', label: '簽約' },
    { value: '__other__', label: '其他' },
];
const resolveTypeKey = (type) => PREDEFINED_RESERVATION_TYPES.includes(type) ? type : '__other__';
const viewLabelMap = { dayGridMonth: '月', timeGridWeek: '週', timeGridDay: '日', listWeek: '列表' };
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六'];

// 事件內容：以 DOM 節點組成（客戶輸入的文字一律 textContent，不拼 HTML），可換行不截斷
function renderEventContent(arg) {
    const r = arg.event.extendedProps;
    const root = document.createElement('div');
    root.className = 'vr-ev';
    const add = (cls, text) => {
        if (!text) return;
        const el = document.createElement('span');
        el.className = cls;
        el.textContent = text;
        root.appendChild(el);
    };
    const who = `${r.unitId ? r.unitId + ' ' : ''}${r.customerName || ''}`;
    const sales = r.salesName || '未指派';
    // 我的預約：銷售都是自己，改標示建案
    const prefix = isPersonal.value ? `【${projectNameOf(r.projectId)}】` : '';
    if (arg.view.type === 'dayGridMonth') {
        // 月視圖格子窄：類型以顏色表示、備註點開再看
        root.classList.add('vr-ev--month');
        add('vr-ev-time', arg.timeText);
        add('vr-ev-name', isPersonal.value ? `${prefix}${who}` : `${who}（${sales}）`);
    } else {
        if (arg.view.type !== 'listWeek') add('vr-ev-time', arg.timeText);
        add('vr-ev-name', `${prefix}${who}`);
        add('vr-ev-meta', isPersonal.value ? r.type : `${sales}・${r.type}`);
        add('vr-ev-note', r.note);
    }
    return { domNodes: [root] };
}

function holidayLabel(name) {
    const el = document.createElement('span');
    el.className = 'vr-holiday-name';
    el.textContent = name;
    return el;
}

// 國定假日：日期格／欄加 class（淡紅底、日期紅字）。假日資料非同步載入，載入後換一個新函式讓 FullCalendar 重繪
const buildHolidayClassNames = () => (arg) => (getTaiwanHoliday(arg.date) ? ['vr-holiday'] : []);

// 月視圖日期格：左側假日名稱、右側日期數字（今天以紅圈標示）
function renderMonthDayCell(arg) {
    const num = document.createElement('span');
    num.className = 'vr-dn-num';
    num.textContent = String(arg.date.getDate());
    const holiday = getTaiwanHoliday(arg.date);
    return { domNodes: holiday ? [holidayLabel(holiday), num] : [num] };
}

// 週／日視圖欄首：星期＋日期數字（今天以紅圈標示）＋假日名稱
function renderTimeGridHeader(arg) {
    const wrap = document.createElement('div');
    wrap.className = 'vr-dh';
    const dow = document.createElement('span');
    dow.className = 'vr-dh-dow';
    dow.textContent = `週${WEEKDAY_NAMES[arg.date.getDay()]}`;
    const num = document.createElement('span');
    num.className = 'vr-dh-num';
    num.textContent = String(arg.date.getDate());
    wrap.append(dow, num);
    const holiday = getTaiwanHoliday(arg.date);
    if (holiday) {
        wrap.classList.add('vr-dh--holiday');
        wrap.appendChild(holidayLabel(holiday));
    }
    return { domNodes: [wrap] };
}

// 列表視圖日期標題：日期＋假日名稱＋當日筆數（點筆數看各銷售分佈）
function renderListDayHeader(arg) {
    const date = arg.date;
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const count = calendarEvents.value.filter(e => {
        const d = new Date(e.start);
        return d.getFullYear() === date.getFullYear() &&
               d.getMonth() === date.getMonth() &&
               d.getDate() === date.getDate();
    }).length;
    const wrap = document.createElement('span');
    wrap.className = 'list-header-content';
    wrap.append(`${mm}/${dd} 星期${WEEKDAY_NAMES[date.getDay()]}`);
    const holiday = getTaiwanHoliday(date);
    if (holiday) wrap.appendChild(holidayLabel(holiday));
    const badge = document.createElement('span');
    badge.className = 'list-day-count-badge';
    badge.dataset.date = `${date.getFullYear()}-${mm}-${dd}`;
    badge.textContent = `${count} 筆`;
    wrap.appendChild(badge);
    return { domNodes: [wrap] };
}

const projectNameOf = (id) => projectStore.idToNameMap[id] || id || '';
const projectName = computed(() => (isPersonal.value ? '' : projectNameOf(props.projectId)));

// ✅ 檢視切換：我的預約（全部建案）＋具「客資系統-櫃台」或「客資系統-銷售」權限的建案
const MINE = '__mine__';
const scopeValue = computed(() => (isPersonal.value ? MINE : props.projectId));
const scopeLabel = computed(() => (isPersonal.value ? '我的預約・全部建案' : projectName.value));
const scopeOptions = computed(() => [
    { id: MINE, name: '我的預約（全部建案）' },
    ...getViewingProjects(userStore, projectStore)
]);

const isSwitchingProject = ref(false);
async function switchScope(value) {
    if (!value || value === scopeValue.value) return;
    isSwitchingProject.value = true;
    try {
        await router.push(value === MINE
            ? { name: 'MyViewingReservations' }
            : { name: 'ViewingReservationCalendar', params: { projectId: value } });
        if (xs.value) drawer.value = false;
    } finally {
        isSwitchingProject.value = false;
    }
}

// 我的預約：資料中出現的建案（側欄篩選用）
const projectsInData = computed(() => {
    const ids = [...new Set(reservationStore.activeReservations.map(r => r.projectId).filter(Boolean))];
    return ids
        .map(id => ({ id, name: projectNameOf(id) }))
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
});

function toggleProjectFilter(id) {
    const hidden = filters.value.hiddenProjectIds;
    filters.value.hiddenProjectIds = hidden.includes(id) ? hidden.filter(x => x !== id) : [...hidden, id];
}
const allSalesPeople = computed(() => {
    const names = reservationStore.activeReservations.map(res => res.salesName);
    return Array.from(new Set(names)).sort();
});

const calendarEvents = computed(() => {
    return reservationStore.activeReservations
        .filter(res => {
            const typeKey = resolveTypeKey(res.type);
            const typeMatch = filters.value.type.includes(typeKey);
            if (isPersonal.value) return typeMatch && !filters.value.hiddenProjectIds.includes(res.projectId);
            const salesMatch = filters.value.salesNames.length === 0 || filters.value.salesNames.includes(res.salesName);
            return typeMatch && salesMatch;
        })
        .map(res => {
            const start = res.reservationTime.toDate();
            const colors = TYPE_COLORS[resolveTypeKey(res.type)] || TYPE_COLORS['__other__'];
            const who = `${res.unitId ? res.unitId + ' ' : ''}${res.customerName}`;
            const head = isPersonal.value ? `【${projectNameOf(res.projectId)}】${who}` : `${who}(${res.salesName || '未指派'})`;
            return {
                id: res.id,
                title: `${head}-${res.type}${res.note ? ' ' + res.note : ''}`,
                start: start,
                end: new Date(start.getTime() + 90 * 60000),
                backgroundColor: colors.bg,
                borderColor: colors.border,
                textColor: colors.text,
                extendedProps: { ...res }
            };
        });
});

function getConflictCount(dateTime) {
    if (!dateTime) return 0;
    const checkTime = dateTime.getTime();
    return reservationStore.activeReservations.filter(res => {
        const resTime = res.reservationTime.toDate().getTime();
        return Math.abs(resTime - checkTime) / 60000 < 60;
    }).length;
}

const calendarOptions = ref({
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin],
    initialView: xs.value ? 'timeGridDay' : 'dayGridMonth',
    locale: zhTwLocale,
    headerToolbar: false,
    height: '100%',
    events: calendarEvents,
    eventClick: handleEventClick,
    dateClick: handleDateClick,
    nowIndicator: true,
    slotMinTime: '08:00:00',
    slotMaxTime: '22:00:00',
    allDaySlot: false,
    dayMaxEvents: true,
    stickyHeaderDates: true,
    eventClassNames: 'vr-event',
    dayCellClassNames: buildHolidayClassNames(),
    eventDisplay: 'block',
    eventContent: renderEventContent,
    // 滑鼠停留顯示完整內容（桌機）
    eventDidMount: (info) => { info.el.title = info.event.title; },
    moreLinkContent: (arg) => `+${arg.num}`,
    noEventsContent: '這段期間沒有預約',
    displayEventTime: true,
    displayEventEnd: false,
    eventTimeFormat: {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    },
    firstDay: 1, // ✅ 列表視圖優化：週一開始
    views: {
        dayGridMonth: { dayCellContent: renderMonthDayCell },
        // 同時段預約並排顯示，避免後一筆蓋住前一筆的文字
        timeGridWeek: { dayHeaderContent: renderTimeGridHeader, slotEventOverlap: false },
        timeGridDay: { dayHeaderContent: renderTimeGridHeader, slotEventOverlap: false },
        listWeek: { dayHeaderContent: renderListDayHeader }
    },
    datesSet: (info) => {
        currentTitle.value = info.view.title;
        currentView.value = info.view.type;
    }
});

watch(holidaysRevision, () => {
    calendarOptions.value.dayCellClassNames = buildHolidayClassNames();
});

const handleTouchStart = (e) => {
    touchstartX = e.changedTouches[0].screenX;
    touchstartY = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e) => {
    const touchendX = e.changedTouches[0].screenX;
    const touchendY = e.changedTouches[0].screenY;
    const dx = touchendX - touchstartX;
    const dy = touchendY - touchstartY;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 70) {
        if (dx > 0) triggerTransition('prev');
        else triggerTransition('next');
    }
};

const triggerTransition = (direction) => {
    transitionClass.value = direction === 'next' ? 'slide-next' : 'slide-prev';
    if (direction === 'next') goNext();
    else goPrev();
    
    setTimeout(() => {
        transitionClass.value = '';
    }, 300);
};

const syncCalendarDate = (date) => {
    const api = calendarRef.value.getApi();
    api.gotoDate(date);
    api.changeView('timeGridDay');
    currentView.value = 'timeGridDay';
};

const onMiniCalendarChange = (date) => {
    if (!date) return;
    syncCalendarDate(date);
    if (xs.value) {
        drawer.value = false;
    }
};

const goToday = () => calendarRef.value.getApi().today();
const goPrev = () => calendarRef.value.getApi().prev();
const goNext = () => calendarRef.value.getApi().next();
const changeView = (view) => calendarRef.value.getApi().changeView(view);
const fetchData = () => (isPersonal.value
    ? reservationStore.fetchMyReservations(userStore.user?.key)
    : reservationStore.fetchReservations(props.projectId));

// 載入資料並重設篩選（銷售人員依權限預設；建案全部顯示）
async function loadScope() {
    reservationStore.reservations = []; // 避免短暫顯示上一個建案的預約
    await fetchData();
    filters.value.salesNames = isPersonal.value ? [] : defaultSalesNames.value;
    filters.value.hiddenProjectIds = [];
}

onMounted(async () => {
    if (!userStore.isLoggedIn) {
        router.replace({ name: 'ViewingReservationEntry' });
        return;
    }
    // ✅ 確保建案清單已載入（供建案切換下拉使用）
    await projectStore.fetchProjects();
    await loadScope();
});

// ✅ 切換建案／我的預約時（同一個頁面元件會被重用）：重新載入預約資料並重設篩選
watch(scopeValue, async (newVal, oldVal) => {
    if (!newVal || newVal === oldVal || !userStore.isLoggedIn) return;
    await loadScope();
});

const searchQuery = ref('');
const selectedSearchItem = ref(null);
const mobileSearchOpen = ref(false);
const mobileSearchRef = ref(null);

function toggleMobileSearch() {
    if (mobileSearchOpen.value) return closeMobileSearch();
    mobileSearchOpen.value = true;
    nextTick(() => mobileSearchRef.value?.focus());
}

function closeMobileSearch() {
    mobileSearchOpen.value = false;
    searchQuery.value = '';
}

const searchItems = computed(() => {
    return reservationStore.activeReservations.map(res => ({
        ...res,
        ...(isPersonal.value ? { projectName: projectNameOf(res.projectId) } : {}),
        searchLabel: `${res.customerName} (${res.customerPhone})`
    }));
});

// ✅ 跨所有欄位比對：字串/數字/布林直接比對；Firestore Timestamp 與 Date 轉成可讀字串比對
function matchesAllFields(item, query) {
    if (!query) return false;
    const q = String(query).toLowerCase().trim();
    if (!q) return false;
    const SKIP_KEYS = new Set(['id', 'searchLabel', 'projectId', 'salesId']);
    return Object.entries(item).some(([key, val]) => {
        if (val == null || SKIP_KEYS.has(key)) return false;
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (typeof val === 'number' || typeof val === 'boolean') return String(val).toLowerCase().includes(q);
        if (typeof val.toDate === 'function') {
            const d = val.toDate();
            return formatDateForSearch(d).includes(q);
        }
        if (val instanceof Date) return formatDateForSearch(val).includes(q);
        return false;
    });
}

function formatDateForSearch(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${yyyy}/${mm}/${dd} ${hh}:${mi}`;
}

// v-autocomplete 自訂過濾：value/queryText 由 Vuetify 傳入，item 包含原始資料
function autocompleteFilter(value, queryText, item) {
    return matchesAllFields(item?.raw || {}, queryText);
}

const filteredSearchItems = computed(() => {
    if (!searchQuery.value) return [];
    return searchItems.value.filter(item => matchesAllFields(item, searchQuery.value));
});

function onSearchSelect(res) {
    if (!res) return;
    // 用原始預約資料開啟（不帶 searchLabel 等搜尋用欄位，避免寫回資料庫）
    selectedReservation.value = { ...(reservationStore.reservations.find(r => r.id === res.id) || res) };
    showDialog.value = true;
    const dateObj = res.reservationTime.toDate ? res.reservationTime.toDate() : new Date(res.reservationTime);
    syncCalendarDate(dateObj);
    if (xs.value) {
        closeMobileSearch();
    } else {
        selectedSearchItem.value = null;
    }
}

const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleDateString('zh-TW', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    }); 
};

function handleEventClick(info) {
    selectedReservation.value = info.event.extendedProps;
    showDialog.value = true;
}

function handleDateClick(info) {
    if (currentView.value === 'dayGridMonth') {
        syncCalendarDate(info.date);
        return;
    }
    selectedReservation.value = null;
    selectedDate.value = info.date;
    showDialog.value = true;
}

function openAddDialog() {
    selectedReservation.value = null;
    selectedDate.value = null;
    showDialog.value = true;
}

// ✅ 列表視圖優化：顯示日期統計 modal
function showDaySummary(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    const events = calendarEvents.value.filter(e => {
        const d = new Date(e.start);
        return d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day;
    });
    const breakdown = {};
    events.forEach(e => {
        const name = isPersonal.value
            ? projectNameOf(e.extendedProps.projectId)
            : (e.extendedProps.salesName || '未指派');
        breakdown[name] = (breakdown[name] || 0) + 1;
    });
    daySummaryTitle.value = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')} 預約分佈`;
    daySummaryItems.value = Object.entries(breakdown)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    daySummaryDialog.value = true;
}

function handleCalendarAreaClick(e) {
    const badge = e.target.closest('.list-day-count-badge');
    if (badge) {
        e.stopPropagation();
        showDaySummary(badge.dataset.date);
    }
}
</script>

<style lang="scss" scoped>
/* macOS 行事曆風格：淡灰側欄、白色內容區、細分隔線、系統字型 */
$mac-font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", "PingFang TC", "Noto Sans TC", sans-serif;
$mac-text: #1d1d1f;
$mac-secondary: #6e6e73;
$mac-hairline: rgba(0, 0, 0, 0.08);
$mac-accent: #0071e3;
$mac-red: #ff3b30;

.vr-page {
  background: #fff;
  color: $mac-text;
  font-family: $mac-font;
}

/* ===== 側欄 ===== */
.vr-sidebar {
  background: #f3f3f5 !important;
  border-right: 1px solid $mac-hairline !important;
  font-family: $mac-font;
  color: $mac-text;
}
.vr-side-head {
  min-height: 60px;
  padding: 12px 16px 10px 58px;
}
.vr-side-title { font-size: 15px; font-weight: 700; line-height: 1.3; }
.vr-side-project { font-size: 12px; color: $mac-secondary; line-height: 1.4; overflow-wrap: anywhere; }
.vr-side-section { padding: 6px 14px 12px; }
.vr-side-section + .vr-side-section { border-top: 1px solid $mac-hairline; padding-top: 12px; }
.vr-side-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 2px 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: $mac-secondary;
  letter-spacing: 0.02em;
}
.vr-side-link {
  margin-left: auto;
  padding: 0 4px;
  border: 0;
  background: none;
  color: $mac-accent;
  font: inherit;
  font-weight: 500;
  cursor: pointer;
  &:hover { text-decoration: underline; }
}
.vr-check-list { display: flex; flex-direction: column; }
.vr-check-list--scroll { max-height: 220px; overflow-y: auto; }
.vr-check-row {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 30px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 13.5px;
  cursor: pointer;
  &:hover { background: rgba(0, 0, 0, 0.05); }
}
.vr-check-text { min-width: 0; line-height: 1.35; overflow-wrap: anywhere; }
.vr-side-empty { padding: 4px 6px; font-size: 12.5px; color: #8e8e93; }
.vr-side-actions { display: flex; flex-direction: column; gap: 8px; }

/* 迷你月曆 */
.vr-mini-cal {
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  font-family: $mac-font;
  :deep(.v-picker__body) { width: 100% !important; margin: 0 !important; }
  :deep(.v-date-picker-controls) { --v-date-picker-controls-height: 36px; padding: 0 0 4px 2px; font-size: 13px; }
  :deep(.v-date-picker-controls .v-btn) { font-size: 13px; font-weight: 600; }
  :deep(.v-date-picker-month) { width: 100%; min-width: 0; padding: 0 !important; }
  :deep(.v-date-picker-month__days) { padding: 0 !important; column-gap: 0; justify-content: space-between !important; }
  :deep(.v-date-picker-month__day) { width: 34px; height: 30px; }
  :deep(.v-date-picker-month__weekday) { font-size: 11px; color: $mac-secondary; }
  :deep(.v-date-picker-month__day-btn) { --v-btn-height: 26px; font-size: 12.5px; }
  :deep(.v-date-picker-month__day-btn.v-btn--variant-outlined) { border: 0; color: $mac-red; font-weight: 700; }
}

/* ===== 工具列 ===== */
.vr-main { font-family: $mac-font; }
.vr-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 8px 16px;
  background: #fff;
}
.vr-bar--inset { padding-left: 58px; }
.vr-title { flex: 1 1 auto; min-width: 0; }
.vr-title-main { font-size: 20px; font-weight: 700; line-height: 1.25; letter-spacing: -0.01em; overflow-wrap: anywhere; }
/* 標題下方：檢視切換（我的預約／各建案） */
.vr-scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  margin: 2px 0 0 -6px;
  padding: 2px 8px 2px 6px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: $mac-accent;
  font: 500 12.5px $mac-font;
  line-height: 1.35;
  text-align: left;
  cursor: pointer;
  &:hover { background: rgba(0, 113, 227, 0.08); }
  &:disabled { opacity: 0.5; cursor: default; }
  &.is-mine { background: rgba(0, 113, 227, 0.1); font-weight: 600; }
}
.vr-scope-text { min-width: 0; overflow-wrap: anywhere; }
.vr-tool-icon { width: 32px; height: 32px; }
.vr-tool-icon.is-on { background: rgba(0, 113, 227, 0.12); color: $mac-accent; }

/* 上一頁／今天／下一頁：一組相連按鈕 */
.vr-nav {
  display: inline-flex;
  flex-shrink: 0;
  height: 30px;
  border-radius: 7px;
  background: #fff;
  box-shadow: 0 0.5px 1px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}
.vr-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 30px;
  padding: 0 6px;
  border: 0;
  background: transparent;
  color: $mac-text;
  font: 500 13px $mac-font;
  white-space: nowrap;
  cursor: pointer;
  &:hover { background: rgba(0, 0, 0, 0.04); }
  &:active { background: rgba(0, 0, 0, 0.08); }
  & + & { border-left: 1px solid rgba(0, 0, 0, 0.08); }
}
.vr-nav-today { padding: 0 12px; }

.vr-subbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 16px 10px;
  border-bottom: 1px solid $mac-hairline;
}
.vr-view-seg { flex: 0 0 auto; width: 240px; }
.vr-view-seg .mac-form-seg-btn { height: 26px; }
.vr-search { flex: 0 1 300px; margin-left: auto; }

/* 手機版搜尋 */
.vr-msearch { border-bottom: 1px solid $mac-hairline; background: #fff; }
.vr-msearch-row { display: flex; align-items: center; gap: 8px; padding: 8px 12px; }
.vr-msearch-row .mac-vfield { flex: 1 1 auto; }
.vr-msearch-cancel {
  flex-shrink: 0;
  border: 0;
  background: none;
  color: $mac-accent;
  font: 500 15px $mac-font;
  white-space: nowrap;
  cursor: pointer;
}
.vr-msearch-list { max-height: 300px; overflow-y: auto; padding: 0 8px 8px; }
.vr-msearch-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  padding: 9px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: $mac-text;
  font-family: $mac-font;
  text-align: left;
  cursor: pointer;
  &:active { background: rgba(0, 0, 0, 0.06); }
  & + & { border-top: 1px solid #ececf0; border-radius: 0; }
}
.vr-msearch-dot { flex-shrink: 0; width: 8px; height: 8px; margin-top: 6px; border-radius: 50%; }
.vr-msearch-main { display: flex; flex-direction: column; min-width: 0; }
.vr-msearch-title { font-size: 15px; font-weight: 600; line-height: 1.4; overflow-wrap: anywhere; }
.vr-msearch-sub { font-size: 12.5px; color: $mac-secondary; line-height: 1.4; overflow-wrap: anywhere; }
.vr-msearch-empty { padding: 12px; text-align: center; font-size: 13px; color: #8e8e93; }

/* 新增按鈕（手機） */
.vr-fab {
  position: fixed;
  right: 18px;
  bottom: calc(22px + env(safe-area-inset-bottom));
  z-index: 1000;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #2b8cf2, #0a6fdc);
  color: #fff;
  box-shadow: 0 6px 18px rgba(0, 113, 227, 0.35), 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  &:active { transform: scale(0.95); }
}

/* ===== FullCalendar ===== */
:deep(.fc.calendar-container) {
  --fc-border-color: #e5e5ea;
  --fc-page-bg-color: #fff;
  --fc-neutral-bg-color: #f5f5f7;
  --fc-today-bg-color: transparent;
  --fc-now-indicator-color: #{$mac-red};
  --fc-list-event-hover-bg-color: #f5f5f7;
  --fc-small-font-size: 12px;
  font-family: $mac-font;
  font-size: 13px;
  color: $mac-text;

  .fc-scrollgrid { border-left: 0; border-right: 0; }
  .fc-col-header-cell { border-left-color: transparent; border-right-color: transparent; }
  .fc-col-header-cell-cushion { padding: 6px 4px; font-size: 11.5px; font-weight: 600; color: $mac-secondary; text-decoration: none; }

  /* 月視圖：假日名稱在左、日期在右上、今天紅圈 */
  .fc-daygrid-day-number {
    display: flex;
    flex: 1 1 auto;
    align-items: flex-start;
    justify-content: flex-end;
    gap: 4px;
    min-width: 0;
    margin: 3px 3px 1px;
    padding: 0;
    color: $mac-text;
    text-decoration: none;
  }
  .vr-dn-num {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    min-width: 22px;
    height: 22px;
    padding: 0 5px;
    border-radius: 11px;
    font-size: 12.5px;
    font-weight: 500;
  }
  .fc-daygrid-day-number .vr-holiday-name { flex: 1 1 auto; padding: 4px 0 0 2px; text-align: left; }
  .fc-day-other .fc-daygrid-day-top { opacity: 0.35; }
  .fc-day-sat, .fc-day-sun { background: #fbfbfc; }

  /* 國定假日：淡紅底、日期與名稱紅字 */
  .fc-day.vr-holiday { background: #fff6f5; }
  .vr-holiday-name { min-width: 0; font-size: 11px; font-weight: 600; line-height: 1.3; color: $mac-red; white-space: normal; overflow-wrap: anywhere; }
  .vr-holiday .vr-dn-num { color: $mac-red; }
  .fc-day-today .vr-dn-num { background: $mac-red; color: #fff; font-weight: 700; }
  .fc-daygrid-event { white-space: normal; }
  .fc-daygrid-more-link { margin: 1px 2px 0; padding: 1px 5px; border-radius: 5px; font-size: 11.5px; font-weight: 600; color: $mac-secondary; }

  /* 週／日視圖 */
  .vr-dh { display: flex; flex-direction: column; align-items: center; gap: 2px; line-height: 1.2; }
  .vr-dh-dow { font-size: 11px; font-weight: 600; color: $mac-secondary; }
  .vr-dh-num {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 26px;
    height: 26px;
    padding: 0 4px;
    border-radius: 13px;
    font-size: 15px;
    font-weight: 500;
    color: $mac-text;
  }
  .vr-dh--holiday .vr-dh-num { color: $mac-red; }
  .fc-day-today .vr-dh-num { background: $mac-red; color: #fff; font-weight: 700; }
  .vr-dh .vr-holiday-name { font-size: 10.5px; text-align: center; }
  .fc-timegrid-slot { height: 2.4em; }
  .fc-timegrid-slot-minor { border-top-style: dotted; border-top-color: #efeff2; }
  .fc-timegrid-slot-label-cushion { font-size: 11px; color: #8e8e93; font-variant-numeric: tabular-nums; }
  .fc-timegrid-axis-cushion { font-size: 11px; color: #8e8e93; }
  .fc-timegrid-now-indicator-line { border-width: 1.5px 0 0; }

  /* 事件：淡色底＋左側色條，文字可換行 */
  .vr-event {
    border-width: 0 0 0 3px !important;
    border-style: solid;
    border-radius: 5px !important;
    box-shadow: none;
    cursor: pointer;
    transition: filter 0.12s;
    &:hover { filter: brightness(0.96); }
  }
  .fc-timegrid-event-harness-inset .vr-event { box-shadow: 0 0 0 1px #fff; }
  .fc-timegrid-event .fc-event-main { overflow: hidden; }
  .vr-ev {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
    padding: 2px 4px;
    line-height: 1.3;
    white-space: normal;
    overflow-wrap: anywhere;
  }
  .vr-ev-time { font-size: 11px; font-weight: 600; opacity: 0.8; font-variant-numeric: tabular-nums; }
  .vr-ev-name { font-size: 12px; font-weight: 600; }
  .vr-ev-meta, .vr-ev-note { font-size: 11px; opacity: 0.85; }
  .vr-ev--month { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 4px; padding: 1px 4px; }
  .vr-ev--month .vr-ev-name { font-size: 11.5px; }

  /* 列表視圖 */
  .fc-list { border: 0; }
  .fc-list-day-cushion { padding: 7px 16px; background: #f5f5f7; text-align: left; }
  .fc-list-event td { padding: 9px 12px; border-color: #ececf0; }
  .fc-list-event-time { width: 1%; font-variant-numeric: tabular-nums; color: $mac-secondary; white-space: nowrap; }
  .fc-list-event-dot { border-width: 5px; border-radius: 5px; }
  .fc-list-event .vr-ev { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 8px; padding: 0; }
  .fc-list-event .vr-ev-name { font-size: 14px; color: $mac-text; }
  .fc-list-event .vr-ev-meta, .fc-list-event .vr-ev-note { font-size: 12.5px; color: $mac-secondary; opacity: 1; }
  .fc-list-empty { background: #fff; color: #8e8e93; }

  /* 「+N」彈出清單 */
  .fc-popover {
    border: 0;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.18), 0 0 0 0.5px rgba(0, 0, 0, 0.12);
  }
  .fc-popover-header { padding: 7px 10px; background: #f6f6f8; font-size: 12.5px; font-weight: 600; }
  .fc-more-popover .fc-popover-body { min-width: 200px; max-width: 280px; padding: 8px; }
}

.calendar-wrapper {
  transition: transform 0.3s ease-out, opacity 0.3s ease-out;
  &.slide-next { animation: slideNext 0.3s ease-out; }
  &.slide-prev { animation: slidePrev 0.3s ease-out; }
}
@keyframes slideNext { 0% { transform: translateX(0); opacity: 1; } 50% { transform: translateX(-20px); opacity: 0.6; } 100% { transform: translateX(0); opacity: 1; } }
@keyframes slidePrev { 0% { transform: translateX(0); opacity: 1; } 50% { transform: translateX(20px); opacity: 0.6; } 100% { transform: translateX(0); opacity: 1; } }

/* 列表視圖：日期標題與當日筆數（點筆數看各銷售分佈） */
:deep(.list-header-content) {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  font-size: 13px;
  font-weight: 600;
  color: $mac-text;
}
:deep(.list-day-count-badge) {
  padding: 1px 8px;
  border-radius: 10px;
  background: rgba(0, 113, 227, 0.1);
  color: $mac-accent;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background-color 0.15s, color 0.15s;
  &:hover { background: $mac-accent; color: #fff; }
}

/* 日期統計視窗 */
.vr-sheet-title { flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
.vr-summary-body { padding: 12px 16px 16px; max-height: 60vh; overflow-y: auto; }
.vr-count-pill {
  flex-shrink: 0;
  padding: 2px 9px;
  border-radius: 10px;
  background: rgba(0, 113, 227, 0.1);
  color: $mac-accent;
  font-size: 12px;
  font-weight: 600;
}

/* ===== 手機版 ===== */
@media (max-width: 599.98px) {
  .vr-bar { min-height: 56px; padding: 8px 12px 6px 58px; }
  .vr-title-main { font-size: 17px; }
  .vr-scope-btn { font-size: 12px; }
  .vr-nav { height: 32px; }
  .vr-nav-btn { min-width: 32px; font-size: 14px; }
  .vr-nav-today { padding: 0 10px; }
  .vr-subbar { padding: 0 12px 8px; gap: 6px; }
  .vr-view-seg { flex: 1 1 auto; width: auto; }
  .vr-view-seg .mac-form-seg-btn { height: 30px; font-size: 14px; }

  :deep(.fc.calendar-container) {
    font-size: 12px;
    .fc-daygrid-day-number { flex-wrap: wrap; margin: 2px 1px 0; }
    .vr-dn-num { min-width: 20px; height: 20px; padding: 0 3px; font-size: 11.5px; }
    /* 手機格子窄：假日名稱移到日期下方、整行可換行 */
    .fc-daygrid-day-number .vr-holiday-name { order: 2; flex-basis: 100%; padding: 1px 1px 0; font-size: 9.5px; line-height: 1.2; text-align: center; }
    .vr-dh .vr-holiday-name { font-size: 9.5px; line-height: 1.2; }
    .fc-daygrid-event { margin-left: 1px !important; margin-right: 1px !important; }
    .vr-ev--month { padding: 1px 2px; }
    .vr-ev--month .vr-ev-time { display: none; }
    .vr-ev--month .vr-ev-name { font-size: 10.5px; font-weight: 500; line-height: 1.25; }
    .fc-timegrid-axis-cushion, .fc-timegrid-slot-label-cushion { font-size: 10px; }
    .vr-dh-dow { font-size: 10.5px; }
    .vr-dh-num { min-width: 24px; height: 24px; font-size: 14px; }
    .vr-ev { padding: 2px 3px; }
    .vr-ev-name { font-size: 11.5px; }
    .vr-ev-meta, .vr-ev-note, .vr-ev-time { font-size: 10.5px; }
    /* 手機週視圖一欄約 40px：只留姓名，時間看位置、其餘點開看 */
    .fc-timeGridWeek-view .vr-ev { padding: 2px; }
    .fc-timeGridWeek-view .vr-ev-time,
    .fc-timeGridWeek-view .vr-ev-meta,
    .fc-timeGridWeek-view .vr-ev-note { display: none; }
    .fc-timeGridWeek-view .vr-ev-name { font-size: 10.5px; font-weight: 500; line-height: 1.25; }
    .fc-list-event td { padding: 9px 8px; }
    .fc-list-event .vr-ev-name { font-size: 14.5px; }
  }
}
</style>
