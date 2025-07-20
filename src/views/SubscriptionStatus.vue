<template>
 <v-container>
   <v-card class="mx-auto" max-width="1000">
     <v-toolbar color="blue-grey" dark>
       <v-toolbar-title>
         <v-icon left>mdi-shield-check</v-icon>
         訂閱狀態查詢
       </v-toolbar-title>
     </v-toolbar>

     <div v-if="loading" class="text-center pa-10">
       <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
       <p class="mt-4">正在查詢訂閱狀態...</p>
     </div>

     <div v-else-if="error" class="text-center pa-10">
       <v-icon size="x-large" color="error" class="mb-2">mdi-alert-circle-outline</v-icon>
       <p class="text-h6">查詢失敗</p>
       <p>{{ error }}</p>
       <v-btn color="primary" class="mt-4" @click="$router.push('/home')">返回首頁</v-btn>
     </div>

     <div v-else-if="Object.keys(subscriptionData).length === 0" class="text-center pa-10">
       <v-icon size="x-large" class="mb-2">mdi-information-outline</v-icon>
       <p>您目前沒有任何建案的服務訂閱紀錄可供查詢。</p>
     </div>

     <v-expansion-panels v-else variant="accordion">
       <v-expansion-panel
         v-for="(subscriptions, projectName) in subscriptionData"
         :key="projectName"
       >
         <v-expansion-panel-title class="font-weight-bold text-h6">
           {{ projectName }}
         </v-expansion-panel-title>
         <v-expansion-panel-text>
           <v-list lines="three">
             <div v-for="(sub, index) in subscriptions" :key="index">
               <v-list-item>
                 <template v-slot:prepend>
                   <v-chip :color="sub.color" class="font-weight-bold mr-2" label>
                     {{ sub.status }}
                   </v-chip>
                 </template>

                 <v-list-item-title class="font-weight-bold">{{ sub.system }}</v-list-item-title>

                 <v-list-item-subtitle>
                   <strong>有效期限：</strong>{{ sub.validityPeriod }}
                 </v-list-item-subtitle>

                  <v-list-item-subtitle>
                   <strong>訂閱聯絡人：</strong>{{ sub.contact }} ({{ sub.contactPhone }})
                 </v-list-item-subtitle>

               </v-list-item>
               <v-divider v-if="index < subscriptions.length - 1"></v-divider>
             </div>
           </v-list>
         </v-expansion-panel-text>
       </v-expansion-panel>
     </v-expansion-panels>

   </v-card>
 </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useUserStore } from '@/store/user';
import { fetchMySubscriptionStatus } from '@/api.js';

const userStore = useUserStore();
const userKey = computed(() => userStore.user?.key);

const loading = ref(true);
const error = ref('');
const subscriptionData = ref({}); // 存放從 API 獲取的、按建案分組的物件

onMounted(async () => {
 if (!userKey.value) {
   error.value = '無法獲取用戶資訊，請重新登入。';
   loading.value = false;
   return;
 }

 try {
   const response = await fetchMySubscriptionStatus(userKey.value);
   // api.js 中已經處理了 status !== 'success' 的情況
   subscriptionData.value = response;
 } catch (err) {
   error.value = err.message || '查詢訂閱狀態時發生未知錯誤。';
   console.error('[SubscriptionStatus] Error:', err);
 } finally {
   loading.value = false;
 }
});
</script>

<style scoped>
.v-expansion-panel-title {
 background-color: #f5f5f5;
}
</style>