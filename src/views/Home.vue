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
      delay="150"
      :touch-start-threshold="5"
    >
      <template #item="{ element: button }">
        <IconButton 
          :icon="button.icon"
          :text="button.text"
          :scale="iconScale" 
          @click="handleNavigation(button)"
        />
      </template>
    </draggable>
  </div>

</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import draggable from 'vuedraggable';
import { appVersion as versionString } from '@/version';

// ✓ 導入新元件
import IconButton from '@/components/IconButton.vue'; 

// 引入所有需要的圖片
import databaseIcon from '@/assets/icons/database.png';
import myBackgroundImage from '@/assets/login-bg.jpg';
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


const router = useRouter();
const userStore = useUserStore();
const backgroundImageUrl = ref(myBackgroundImage);

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
  { id: 'subscriptionManagement', text: '訂閱管理', icon: subscriptionIcon, permissionType: 'project', permissionArgs: ['訂閱管理', '安熙智慧'], nav: { name: 'SubscriptionManagement' } },
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
]);

const visibleButtons = ref([]);

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

    switch(button.permissionType) {
      case 'project':
        return userStore.hasProjectPermission(button.permissionArgs[0], button.permissionArgs[1]);
      case 'anySystem':
        // ✓ 您的 'anySystem' 邏輯已存在，完全符合需求
        return userStore.hasAnyPermission(button.permissionArgs);
      case 'system':
        //  修改：讓 'system' 類型可以同時檢查 detailedPermissions 和 roles
        // 如果 permissionArgs 的值是'超級管理員'或'系統管理員'等角色，就檢查 roles
        if (['超級管理員', '系統管理員'].includes(button.permissionArgs[0])) {
            return userRoles.includes(button.permissionArgs[0]);
        }
        // 否則，維持原有的系統權限檢查
        return userStore.hasPermission(button.permissionArgs[0]);
      case 'getter':
        return userStore[button.permissionArgs[0]];
      case 'loggedIn':
        return !!userStore.user;
      default:
        return false;
    }
  });
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

/* 為 draggable 元件提供一個 flex 容器 */
.draggable-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 30px;
}
</style>