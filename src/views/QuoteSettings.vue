<!-- /src/views/QuoteSettings.vue -->
<template>

    <v-container fluid>
    <div class="page-header d-flex align-center">
   
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
      <div>
        
        <h1 class="text-h4 font-weight-bold text-primary">報價單設定</h1>
        <p class="text-grey-darken-1">建案: {{ projectName }}</p>
      </div>
    </div>

    <!-- 卡片一：主要內容區域 -->
    <v-card class="mt-4">
      <v-card-text>
        <div v-if="quoteStore.items.length === 0" class="text-center py-10">
          <p>報價單中沒有任何戶別。</p>
          <v-btn color="primary" class="mt-4" @click="goBack">返回銷控表</v-btn>
        </div>

        <!-- 報價列表 -->
        <div v-else class="quote-list">
          <!-- 表頭 (只在桌面顯示) -->
       <div class="quote-item-header d-none d-md-flex">
            <div class="item-cell flex-1">戶別</div>
            <div class="item-cell flex-1">面積(坪)</div>
            <div class="item-cell flex-1">房屋總價</div>
            <div class="item-cell flex-1">單價(表價)</div>
            <div class="item-cell flex-2">車位</div>
            <div class="item-cell flex-1">車位價格</div>
            <div class="item-cell flex-1">首購</div>
            <div class="item-cell flex-1">總價</div>
            <div class="item-cell flex-1">配套</div>
            <div class="item-cell flex-1">配套價</div>
            <div class="item-cell flex-shrink-0" style="width: 50px;"></div>
          </div>

          <!-- 循環渲染每一行 -->
          <v-card 
            v-for="item in quoteStore.items" 
            :key="item.unitId" 
            class="quote-item-card"
          >
            <QuoteItem 
              :item="item" 
              @remove="quoteStore.removeItem(item.unitId)"
              @open-parking-modal="openParkingModal(item.unitId)"
            />
          </v-card>
        </div>
      </v-card-text>
    </v-card>
    
    <!-- ✅ 關鍵修改：將報價人員卡片移到外面，與上面的卡片平級 -->
    <!-- 卡片二：下方報價人員區塊 -->
    <v-card class="mt-4" v-if="quoteStore.items.length > 0">
      <v-card-text>
        <v-row align="center">
          <v-col cols="12" md="4">
            <v-select label="報價人員" :items="personnelOptions" v-model="selectedPersonnel" :readonly="!canEditPersonnel" item-title="name" return-object></v-select>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field label="聯絡電話" :model-value="personnelPhone" readonly></v-text-field>
          </v-col>
          <v-col cols="12" md="4" class="text-right">
            <v-btn color="success" size="large">產生報價單</v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Modal 組件的放置位置不影響佈局，可以放在這裡 -->
    <ParkingSelectionModal 
      v-model:show="isParkingModalVisible"
      :unit-id="currentEditingUnitId"
      :all-parking-data="allParkingData"
      :initial-selected-parking="currentInitialParking"
      @confirm="handleParkingConfirm"
    />
  </v-container>
</template>

<script setup>
import QuoteItem from '@/components/QuoteItem.vue';
import ParkingSelectionModal from '@/components/ParkingSelectionModal.vue';

const isParkingModalVisible = ref(false);
const currentEditingUnitId = ref(null);

const currentInitialParking = computed(() => {
  if (!currentEditingUnitId.value) return [];
  const item = quoteStore.items.find(i => i.unitId === currentEditingUnitId.value);
  return item ? item.selectedParking : [];
});

function openParkingModal(unitId) {
  currentEditingUnitId.value = unitId;
  isParkingModalVisible.value = true;
}

function handleParkingConfirm(parkingList) {
  quoteStore.updateParking(currentEditingUnitId.value, parkingList);
  isParkingModalVisible.value = false;
}

import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuoteStore } from '@/store/quoteStore';
import { useUserStore } from '@/store/user';
import { fetchParkingList, fetchQuotePersonnelList } from '@/api';

const route = useRoute();
const router = useRouter();
const quoteStore = useQuoteStore();
const userStore = useUserStore();

// --- 頁面狀態 ---
const loading = ref(true);
const error = ref(null);
const projectName = route.params.projectName;

// --- 數據存儲 ---
const allParkingData = ref([]);
const personnelOptions = ref([]);
const canEditPersonnel = ref(false);
const selectedPersonnel = ref(null);

const personnelPhone = computed(() => selectedPersonnel.value?.phone || '');

// --- 生命週期鉤子 ---
onMounted(async () => {
  loading.value = true;
  try {
    // 並行獲取車位和報價人員數據
    const [parkingRes, personnelRes] = await Promise.all([
      fetchParkingList(projectName),
      fetchQuotePersonnelList(projectName, userStore.user.key)
    ]);

    if (parkingRes.status === 'success') {
      allParkingData.value = parkingRes.data;
    } else {
      throw new Error('無法獲取車位列表: ' + parkingRes.message);
    }

    if (personnelRes.status === 'success') {
      personnelOptions.value = personnelRes.data.personnelList;
      canEditPersonnel.value = personnelRes.data.canEdit;
      // 預設選中當前登入用戶
      const currentUser = personnelRes.data.personnelList.find(p => p.phone === userStore.user.key);
      if (currentUser) {
        selectedPersonnel.value = currentUser;
      }
    } else {
      throw new Error('無法獲取報價人員列表: ' + personnelRes.message);
    }
    
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

// --- 方法 ---
function goBack() {
  // ✅ 關鍵修改：從 route.query 中讀取 viewMode
  const sourceMode = route.query.viewMode;
  const projectName = route.params.projectName;

  // 根據來源模式決定返回到哪個頁面
  const backRouteName = sourceMode === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
  
  router.push({ name: backRouteName, params: { projectName } });
}
</script>

<style scoped>
.page-header {
  padding-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}
.quote-item-header {
  font-weight: bold;
  padding: 8px 16px;
  background-color: #f5f5f5;
  border-radius: 4px;
  margin-bottom: 8px;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }

.quote-item-card {
  margin-bottom: 12px;
  padding: 16px;
  transition: box-shadow 0.2s ease-in-out;
}
.quote-item-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
</style>