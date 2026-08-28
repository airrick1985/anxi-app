<template>
  <div 
    class="home-container"
    :style="containerStyle"
  >
    <draggable
      v-model="visibleButtons"
      item-key="id"
      class="draggable-container"
      animation="300"
      @end="saveButtonOrder"
      :delay="200"
      :delay-on-touch-only="true"
      :touch-start-threshold="5"
      :fallback-tolerance="12"
    >
      <template #item="{ element: button }">
        <IconButton
          :icon="button.icon"
          :text="button.text"
          :scale="iconScale"
          :tour-id="'home-' + button.id"
          @click="handleNavigation(button)"
        />
      </template>
    </draggable>

    <!-- ✅ 試用帳號：右下角「?」重新開始導覽（docs/SPEC_LandingTrialLeadsOnboarding.md §7） -->
    <v-btn
      v-if="isTrialUser"
      class="tour-fab"
      icon="mdi-help"
      color="#2F6BFF"
      size="large"
      elevation="6"
      title="功能導覽"
      data-tour="home-help"
      @click="startTour(true)"
    />
  </div>

</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserStore } from '../store/user';
import draggable from 'vuedraggable';
import { appVersion as versionString } from '@/version';
import { useOnboardingTour } from '@/composables/useOnboardingTour';
import { trackTrialEvent } from '@/utils/trialTracking';

// ✓ 導入新元件
import IconButton from '@/components/IconButton.vue'; 

// 引入所有需要的圖片
import databaseIcon from '@/assets/icons/database.png';
import myBackgroundImage from '@/assets/login-bg.webp';
import subscriptionIcon from '@/assets/icons/subscription.png';
import userManagementIcon from '@/assets/icons/user-management.png';
import statusIcon from '@/assets/icons/status.png';
import emailIcon from '@/assets/icons/email.png';
import sendEmailIcon from '@/assets/icons/send-email.png';
import propertyIcon from '@/assets/icons/property.png';
import priceIcon from '@/assets/icons/price.png';
import tableIcon from '@/assets/icons/table.png';
import customerIcon from '@/assets/icons/customer.png';
import blueprintIcon from '@/assets/icons/blueprint.png';
import inspectionCalenderIcon from '@/assets/icons/inspection-calender .png';
import reservationCalenderIcon from '@/assets/icons/reservation-calender.png';
import profileIcon from '@/assets/icons/profile.png';
import SMSIcon from '@/assets/icons/SMS.png';
import fileIcon from '@/assets/icons/file.png';


const router = useRouter();
const route = useRoute();
const userStore = useUserStore();
const backgroundImageUrl = ref(myBackgroundImage);
const isTrialUser = computed(() => userStore.isTrialUser);

//  新增 footer 所需的響應式變數
const appVersion = ref(versionString);
const currentYear = ref(new Date().getFullYear());

// ✓ 新增控制縮放比例的 ref
// 預設為 1 (100%)。您可以從 localStorage 讀取或允許使用者修改此值
const iconScale = ref(0.7); 

const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));

const allButtons = ref([

 { 
    id: 'userProfile', 
    text: '個人資料', 
    icon: profileIcon, 
    permissionType: 'loggedIn', // 權限類型：只要登入就可見
    nav: { name: 'UserProfile' } // 導航目標：UserProfile 頁面
  },
   { 
    id: 'backupManagement', 
    text: '資料庫管理', 
    icon: databaseIcon, // 請替換為您的圖示
    permissionType: 'system', 
    permissionArgs: ['超級管理員'], // 權限檢查，只檢查 roles 是否包含 '超級管理員'
    nav: { name: 'BackupManagement' } 
  },
  { id: 'subscriptionManagement', text: '訂閱管理', icon: subscriptionIcon, permissionType: 'system', permissionArgs: ['系統管理員', '超級管理員'], nav: { name: 'SubscriptionManagement' } },
  { id: 'UserManagement', text: '人員管理', icon: userManagementIcon, permissionType: 'system', permissionArgs: ['人員管理'], nav: { name: 'UserManagement' } },
  { id: 'subscriptionStatus', text: '訂閱查詢', icon: statusIcon, permissionType: 'system', permissionArgs: ['訂閱查詢'], nav: { name: 'SubscriptionStatus' } },
  { id: 'messageCenter', text: '訊息中心', icon: emailIcon, permissionType: 'loggedIn', nav: { name: 'MessageCenter' } },
  { id: 'sendMessage', text: '發送訊息', icon: sendEmailIcon, permissionType: 'getter', permissionArgs: ['canSendMessage'], nav: { name: 'SendMessage' } },
  { id: 'inspectionSystem', text: '驗屋系統', icon: propertyIcon, permissionType: 'system', permissionArgs: ['驗屋系統'],  nav: { name: 'InspectionConsole' } },
  { id: 'quoteSystem', text: '報價系統', icon: priceIcon, permissionType: 'system', permissionArgs: ['報價系統'], nav: { name: 'QuoteSystemEntry', query: { viewMode: 'quote' } } },
  { id: 'salesSystem', text: '銷控系統', icon: tableIcon, permissionType: 'system', permissionArgs: ['銷控系統'], nav: { name: 'SalesControlSystemEntry', query: { viewMode: 'sales' } } },
  



  // ✓ START: 新增「客資系統」按鈕
  { 
    id: 'customerSystem', 
    text: '客資系統', 
    icon: customerIcon, 
    permissionType: 'anySystem', // 使用 'anySystem'
    permissionArgs: ['客資系統-櫃台', '客資系統-銷售'], // 檢查這兩個權限
    nav: { name: 'CustomerSystemEntry' } // 導向新的路由入口
  },
  // ✓ END: 新增按鈕

  { id: 'designChangeSystem', text: '客變系統', icon: blueprintIcon, permissionType: 'system', permissionArgs: ['客變系統'], nav: null },
  { id: 'inspectionTimetable', text: '驗屋預約', icon: inspectionCalenderIcon, permissionType: 'anySystem', permissionArgs:  ['驗屋預約管理-修改', '驗屋預約管理-檢視'], nav: { name: 'ProjectSelector' }
  },

  // 驗屋報告管理：獨立權限、獨立入口
  {
    id: 'inspectionReportManager',
    text: '驗屋報告',
    icon: fileIcon,
    permissionType: 'system',
    permissionArgs: ['驗屋報告管理'],
    nav: { name: 'InspectionReportManager' }
  },
   { 
    id: 'ViewingReservation', 
    text: '賞屋預約', 
    icon: reservationCalenderIcon, 
    permissionType: 'anySystem', // 使用 'anySystem'
    permissionArgs: ['客資系統-櫃台', '客資系統-銷售'], // 檢查這兩個權限
    nav: { name: 'ViewingReservationCalendarEntry' } // 導向新的路由入口
  },

  {
    id: 'smsMonitor',
    text: '簡訊監控',
    icon: SMSIcon, // 建議使用代表監控或狀態的圖示
    permissionType: 'system',
    permissionArgs: ['系統管理員','超級管理員'], // 依照您的 Home.vue 邏輯，會檢查角色是否包含此權限
    nav: { name: 'SmsReportMonitor' } // 導向您在 router/index.js 定義的名稱
  },

  // ✅ 新增：管理員工具中心
  {
    id: 'adminToolsCenter',
    text: '管理員工具',
    icon: userManagementIcon, // 使用現有的管理圖標
    permissionType: 'system',
    permissionArgs: ['系統管理員', '超級管理員'],
    nav: { name: 'AdminToolsCenter' }
  },

  // ✅ 試用留資管理（僅超級管理員；docs/SPEC_LandingTrialLeadsOnboarding.md §5）
  {
    id: 'trialLeads',
    text: '試用留資',
    icon: customerIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'TrialLeadsManager' }
  },

  // 預約頁功能測試（僅超級管理員）
  {
    id: 'bookingTest',
    text: '預約頁測試',
    icon: inspectionCalenderIcon,
    permissionType: 'system',
    permissionArgs: ['超級管理員'],
    nav: { name: 'BookingTest' }
  },
]);

const visibleButtons = ref([]);

// ✅ 試用帳號隱藏的管理類功能（docs/SPEC_LandingTrialLeadsOnboarding.md §3.7）
const HIDE_FOR_TRIAL = new Set([
  'backupManagement', 'subscriptionManagement', 'UserManagement', 'subscriptionStatus',
  'sendMessage', 'smsMonitor', 'adminToolsCenter', 'bookingTest', 'trialLeads',
]);

// ✅ Home 導覽文案（僅試用帳號；步驟由 visibleButtons 產生，沒權限的功能自然不出現）
const TOUR_COPY = {
  salesSystem: { title: '銷控系統', text: '櫃台即時銷控：戶別狀態、價格、成交資訊，一張表全掌握，還能拖曳排序。' },
  quoteSystem: { title: '報價系統', text: '選戶別、選車位、套用付款方案，自動算出各期款項並列印報價單。' },
  customerSystem: { title: '客資系統', text: '客戶建檔、洽談紀錄、撞客比對，掃 QR Code 讓客戶自己填貴賓資料表。' },
  ViewingReservation: { title: '賞屋預約', text: '行事曆安排客戶賞屋時段，整合客資系統自動帶入資料。' },
  inspectionTimetable: { title: '驗屋預約', text: '設定開放批次與時段名額，客戶線上自助預約、修改與取消。' },
  inspectionSystem: { title: '驗屋系統', text: '手機拍照標記缺失、追蹤廠商修繕進度、一鍵產出 PDF 驗屋報告。' },
  inspectionReportManager: { title: '驗屋報告', text: '集中管理各戶驗屋報告檔案，住戶可掃碼查詢。' },
  designChangeSystem: { title: '客變系統', text: '客變需求與圖說管理（規劃中）。' },
  messageCenter: { title: '訊息中心', text: '系統通知與公告都在這裡，未讀會在右上角顯示數字。' },
  userProfile: { title: '個人資料', text: '檢視帳號資料；測試帳號為唯讀。' },
};

const TOUR_DONE_KEY = 'anxi-trial-tour-done'; // TESTA 為共用帳號 → 用 localStorage 而非 users.preferences

const tour = useOnboardingTour({
  onStart: () => trackTrialEvent('tour_started'),
  onComplete: () => { markTourDone(); trackTrialEvent('tour_completed'); },
  onCancel: () => { markTourDone(); trackTrialEvent('tour_skipped'); },
});

const markTourDone = () => {
  try { localStorage.setItem(TOUR_DONE_KEY, '1'); } catch (e) { /* ignore */ }
};

const buildTourSteps = () => {
  const steps = [{
    id: 'welcome',
    title: '歡迎使用 ANXI 測試環境',
    text: '這裡是功能首頁，每個圖示就是一套系統。30 秒帶您快速認識，之後隨時點右下角「?」可以重看。',
  }];

  visibleButtons.value.forEach((button) => {
    const copy = TOUR_COPY[button.id];
    if (!copy) return;
    steps.push({
      id: `btn-${button.id}`,
      title: copy.title,
      text: copy.text,
      attachTo: { element: `[data-tour="home-${button.id}"]`, on: 'bottom' },
    });
  });

  steps.push({
    id: 'toolbar',
    title: '常用工具',
    text: '右上角有房貸試算、聯絡客服、全螢幕與訊息中心。',
    attachTo: { element: '.custom-app-bar', on: 'bottom' },
  });
  steps.push({
    id: 'finish',
    title: '開始探索吧！',
    text: '想進一步了解方案，歡迎透過「聯絡客服」或 LINE 找我們。隨時點右下角「?」可重看導覽。',
    attachTo: { element: '[data-tour="home-help"]', on: 'top' },
  });
  return steps;
};

/**
 * 啟動導覽
 * @param {boolean} force - true：使用者主動點「?」（不看是否已看過）
 */
const startTour = async (force = false) => {
  if (!isTrialUser.value) return;
  await nextTick();
  tour.start(buildTourSteps());
  if (!force) return;
};

const onRestartTour = () => startTour(true);

onMounted(() => {
  const savedOrder = localStorage.getItem('homeButtonOrder');
  const buttonOrder = savedOrder ? JSON.parse(savedOrder) : allButtons.value.map(b => b.id);

  const sortedButtons = [];
  buttonOrder.forEach(id => {
    const button = allButtons.value.find(b => b.id === id);
    if (button) {
      sortedButtons.push(button);
    }
  });

  allButtons.value.forEach(button => {
    if (!sortedButtons.some(b => b.id === button.id)) {
      sortedButtons.push(button);
    }
  });

   visibleButtons.value = sortedButtons.filter(button => {
    //  新增：直接從 userStore 讀取角色列表
    const userRoles = userStore.currentUserRoles;

    // ✅ 試用帳號：隱藏管理類功能
    if (isTrialUser.value && HIDE_FOR_TRIAL.has(button.id)) return false;

    switch(button.permissionType) {
      case 'project':
        return userStore.hasProjectPermission(button.permissionArgs[0], button.permissionArgs[1]);
      case 'anySystem':
        // ✓ 您的 'anySystem' 邏輯已存在，完全符合需求
        return userStore.hasAnyPermission(button.permissionArgs);
      case 'system': {
        //  修改：讓 'system' 類型可以同時檢查 detailedPermissions 和 roles
        // 若 permissionArgs 內含角色（超級管理員／系統管理員），就檢查 roles，命中任一角色即可
        const roleArgs = button.permissionArgs.filter(arg => ['超級管理員', '系統管理員'].includes(arg));
        if (roleArgs.length > 0) {
            return roleArgs.some(role => userRoles.includes(role));
        }
        // 否則，維持原有的系統權限檢查
        return userStore.hasPermission(button.permissionArgs[0]);
      }
      case 'getter':
        return userStore[button.permissionArgs[0]];
      case 'loggedIn':
        return !!userStore.user;
      default:
        return false;
    }
  });

  // ✅ 試用帳號導覽：?tour=1 或首次（此瀏覽器）自動啟動；「?」可重看
  if (isTrialUser.value) {
    window.addEventListener('anxi:restart-tour', onRestartTour);
    let seen = false;
    try { seen = localStorage.getItem(TOUR_DONE_KEY) === '1'; } catch (e) { /* ignore */ }
    const forced = route.query.tour === '1';
    if (forced || !seen) {
      if (forced) router.replace({ name: 'Home' });
      setTimeout(() => startTour(true), 600); // 等按鈕渲染與背景轉場
    }
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('anxi:restart-tour', onRestartTour);
  tour.cancel();
});

const saveButtonOrder = () => {
  const newOrder = visibleButtons.value.map(b => b.id);
  localStorage.setItem('homeButtonOrder', JSON.stringify(newOrder));
};

const handleNavigation = (button) => {
  if (button.nav) {
    // ✅ 修改：判斷 nav 是字串 (外部連結) 還是物件 (內部路由)
    if (typeof button.nav === 'string') {
      window.location.href = button.nav; // 導向外部連結
    } else {
      router.push(button.nav); // 導向內部路由
    }
  } else {
    alert('此功能尚未開放');
  }
};


</script>
<style scoped>
/* 您的所有樣式都維持不變 */
.home-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  padding: 40px;
  gap: 30px;
  min-height: 100%;
  box-sizing: border-box;
  background-image: 
    linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0)),
    var(--bg-image-url);
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: background-image 1s ease-in-out;
}

/* ✓ .icon-button 相關的所有樣式都已被移除 (遷移到 IconButton.vue) */

/* ✅ 試用導覽「?」浮動按鈕（避開右下角系統問題回報鈕） */
.tour-fab {
  position: fixed;
  right: 24px;
  bottom: 96px;
  z-index: 1005;
  color: #fff !important;
}

/* 為 draggable 元件提供一個 flex 容器 */
.draggable-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 30px;
}
</style>