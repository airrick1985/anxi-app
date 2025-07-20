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
    >
      <template #item="{ element: button }">
        <button class="icon-button" @click="handleNavigation(button)">
          <img :src="button.icon" :alt="`${button.text}圖標`" class="icon" />
          <span class="text">{{ button.text }}</span>
        </button>
      </template>
    </draggable>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import draggable from 'vuedraggable';

// 引入所有需要的圖片
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

const router = useRouter();
const userStore = useUserStore();
const backgroundImageUrl = ref(myBackgroundImage);

const containerStyle = computed(() => ({
  '--bg-image-url': `url(${backgroundImageUrl.value})`
}));

const allButtons = ref([
  { id: 'subscriptionManagement', text: '訂閱管理', icon: subscriptionIcon, permissionType: 'project', permissionArgs: ['訂閱管理', '安熙智慧'], nav: { name: 'SubscriptionManagement' } },
  // ✅【核心修改】將 nav.name 從 'PersonnelManagement' 改回 'UserManagement'
  { id: 'personnelManagement', text: '人員管理', icon: userManagementIcon, permissionType: 'system', permissionArgs: ['人員管理'], nav: { name: 'UserManagement' } },
  { id: 'subscriptionStatus', text: '訂閱查詢', icon: statusIcon, permissionType: 'system', permissionArgs: ['訂閱查詢'], nav: { name: 'SubscriptionStatus' } },
  { id: 'messageCenter', text: '訊息中心', icon: emailIcon, permissionType: 'loggedIn', nav: { name: 'MessageCenter' } },
  { id: 'sendMessage', text: '發送訊息', icon: sendEmailIcon, permissionType: 'getter', permissionArgs: ['canSendMessage'], nav: { name: 'SendMessage' } },
  { id: 'inspectionSystem', text: '驗屋系統', icon: propertyIcon, permissionType: 'system', permissionArgs: ['驗屋系統'], nav: { name: 'InspectionSystem' } },
  { id: 'quoteSystem', text: '報價系統', icon: priceIcon, permissionType: 'system', permissionArgs: ['報價系統'], nav: { name: 'QuoteSystemEntry', query: { viewMode: 'quote' } } },
  { id: 'salesSystem', text: '銷控系統', icon: tableIcon, permissionType: 'system', permissionArgs: ['銷控系統'], nav: { name: 'SalesControlSystemEntry', query: { viewMode: 'sales' } } },
  { id: 'customerManagement', text: '客戶管理', icon: customerIcon, permissionType: 'system', permissionArgs: ['客戶管理'], nav: null },
  { id: 'designChangeSystem', text: '客變系統', icon: blueprintIcon, permissionType: 'system', permissionArgs: ['客變系統'], nav: null },
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
    switch(button.permissionType) {
      case 'project':
        return userStore.hasProjectPermission(button.permissionArgs[0], button.permissionArgs[1]);
      case 'system':
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
    router.push(button.nav);
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
    var(--bg-image-url, url('/img/background.png'));
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  transition: background-image 1s ease-in-out;
}

.icon-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;
  padding: 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(4px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.icon-button:hover {
  transform: translateY(-8px) scale(1.05);
  box-shadow: 0 16px 40px 0 rgba(31, 38, 135, 0.2), 
              0 0 20px rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.496);
}

.icon {
  width: 60px;
  height: 60px;
  margin-bottom: 12px;
  filter: drop-shadow(1px 1px 1px rgba(0, 0, 0, 0.2));
  opacity: 0.8;
  transition: all 0.3s ease;
}

.text {
  font-size: 1rem;
  font-weight: 500;
  color: #000000;
}

/* ✅ 核心修改：為 draggable 元件提供一個 flex 容器 */
.draggable-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 30px;
}
</style>