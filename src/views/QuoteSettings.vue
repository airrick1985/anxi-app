<template>
  <v-container fluid>
    <div class="page-header d-flex align-center">
      <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" class="mr-4"></v-btn>
      <div>
        <h1 class="text-h4 font-weight-bold text-primary">報價單設定</h1>
        <p class="text-grey-darken-1">建案: {{ projectName }}</p>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        color="info"
        variant="tonal"
        @click="openSlideViewer(quoteParkingSlideId)"
        :disabled="!quoteParkingSlideId"
        title="車位表"
      >
        車位表
      </v-btn>
    </div>

    <v-card class="mt-4">
      <v-card-text>
        <div v-if="quoteStore.items.length === 0" class="text-center py-10">
          <p>報價單中沒有任何戶別。</p>
          <v-btn color="primary" class="mt-4" @click="goBack">返回銷控表</v-btn>
        </div>

        <div v-else class="quote-list">
          <div class="quote-item-header d-none d-md-flex">
            <div class="item-cell flex-1">戶別</div>
            <div class="item-cell flex-1">面積(坪)</div>
            <div class="item-cell flex-1">房屋總價</div>
            <div class="item-cell flex-1">房屋單價</div>
            <div class="item-cell flex-2">車位</div>
            <div class="item-cell flex-1">車位價格</div>
            <div class="item-cell flex-1">首購</div>
            <div class="item-cell flex-1">總價</div>
            <div class="item-cell flex-1">配套</div>
            <div class="item-cell flex-1">配套價</div>
            <div class="item-cell flex-1">付款方式</div>
            <div class="item-cell flex-shrink-0" style="width: 50px;"></div>
          </div>

          <v-card v-for="item in quoteStore.items" :key="item.internalId" class="quote-item-card">
            <QuoteItem 
              :item="item"
              :payment-terms-data="paymentTermsData"
              @remove="quoteStore.removeItem(item.internalId)"
              @open-parking-modal="openParkingModal(item.internalId)"
            />
          </v-card>
        </div>
      </v-card-text>
    </v-card>
    
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

    <ParkingSelectionModal 
      v-model:show="isParkingModalVisible"
      :unit-id="currentEditingInternalId" 
      :all-parking-data="allParkingData"
      :initial-selected-parking="currentInitialParking"
      @confirm="handleParkingConfirm"
      @request-open-slide="openSlideViewer(quoteParkingSlideId)"
    />

    <v-dialog v-model="isSlideDialogVisible" fullscreen hide-overlay transition="dialog-bottom-transition">
      <v-card>
        <v-toolbar dark color="primary">
          <v-btn icon dark @click="isSlideDialogVisible = false"><v-icon>mdi-close</v-icon></v-btn>
          <v-toolbar-title>車位表</v-toolbar-title>
        </v-toolbar>
        <div class="iframe-container">
          <iframe v-if="slideEmbedUrl" :src="slideEmbedUrl" frameborder="0" allowfullscreen></iframe>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useQuoteStore } from '@/store/quoteStore';
import { useUserStore } from '@/store/user';
import { fetchSalesControlData, fetchParkingList, fetchQuotePersonnelList } from '@/api';
import { useSlideViewer } from '@/composables/useSlideViewer';
import QuoteItem from '@/components/QuoteItem.vue';
import ParkingSelectionModal from '@/components/ParkingSelectionModal.vue';

const route = useRoute();
const router = useRouter();
const quoteStore = useQuoteStore();
const userStore = useUserStore();
const { isSlideDialogVisible, slideEmbedUrl, openSlideViewer } = useSlideViewer();

const loading = ref(true);
const error = ref(null);
const projectName = route.params.projectName;
const allParkingData = ref([]);
const personnelOptions = ref([]);
const canEditPersonnel = ref(false);
const selectedPersonnel = ref(null);
const quoteParkingSlideId = ref('');
const isParkingModalVisible = ref(false);
const currentEditingInternalId = ref(null);
const paymentTermsData = ref([]);

const personnelPhone = computed(() => selectedPersonnel.value?.phone || '');
const currentInitialParking = computed(() => {
  if (!currentEditingInternalId.value) return [];
  const item = quoteStore.items.find(i => i.internalId === currentEditingInternalId.value);
  return item ? item.selectedParking : [];
});

function openParkingModal(internalId) {
  currentEditingInternalId.value = internalId;
  isParkingModalVisible.value = true;
}
function handleParkingConfirm(parkingList) {
  quoteStore.updateParking(currentEditingInternalId.value, parkingList);
  isParkingModalVisible.value = false;
}

onMounted(async () => {
  loading.value = true;
  try {
    const [salesControlRes, parkingRes, personnelRes] = await Promise.all([
      fetchSalesControlData(projectName),
      fetchParkingList(projectName),
      fetchQuotePersonnelList(projectName, userStore.user.key)
    ]);
    
    if (salesControlRes.status === 'success' && salesControlRes.data) {
      paymentTermsData.value = salesControlRes.data.期款比例 || [];
      if (salesControlRes.data.車位SLIDE?.length > 0) {
        const slideInfo = salesControlRes.data.車位SLIDE[0];
        quoteParkingSlideId.value = slideInfo['報價車位SLIDEID'] || '';
      }
    }

    if (parkingRes.status === 'success') allParkingData.value = parkingRes.data;
    else throw new Error('無法獲取車位列表: ' + parkingRes.message);

    if (personnelRes.status === 'success') {
      personnelOptions.value = personnelRes.data.personnelList;
      canEditPersonnel.value = personnelRes.data.canEdit;
      const currentUser = personnelRes.data.personnelList.find(p => p.phone === userStore.user.key);
      if (currentUser) selectedPersonnel.value = currentUser;
    } else {
      throw new Error('無法獲取報價人員列表: ' + personnelRes.message);
    }
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
});

function goBack() {
  const sourceMode = route.query.viewMode;
  const backRouteName = sourceMode === 'quote' ? 'QuoteSystem' : 'SalesControlSystem';
  router.push({ name: backRouteName, params: { projectName } });
}
</script>

<style scoped>
/* Style 內容維持原樣 */
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
.quote-item-header .item-cell {
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.flex-1 { flex: 1; }
.flex-2 { flex: 2; }
.flex-shrink-0 { flex-shrink: 0; }
.quote-item-card {
  margin-bottom: 12px;
  transition: box-shadow 0.2s ease-in-out;
}
.quote-item-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.iframe-container {
  width: 100%;
  height: calc(100vh - 48px);
  overflow: hidden;
}
.iframe-container iframe {
  width: 100%;
  height: 100%;
  border: none;
}
</style>