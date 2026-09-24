<template>
  <v-dialog v-model="dialogVisible" max-width="560px" scrollable>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <v-icon start>mdi-qrcode-plus</v-icon>
        銷售專屬表單連結
        <v-spacer></v-spacer>
        <v-btn icon variant="text" color="white" @click="dialogVisible = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <p class="text-body-2 text-grey-darken-1 mb-4">
          選擇表單類型與銷售人員後產生專屬網址與 QR Code，客戶掃碼填寫的資料會自動歸屬給該銷售人員。
        </p>

        <div class="text-subtitle-2 font-weight-bold mb-2">表單類型</div>
        <v-btn-toggle
          v-model="formType"
          mandatory
          color="primary"
          variant="outlined"
          density="comfortable"
          divided
          class="mb-4 w-100"
        >
          <v-btn value="vip" class="flex-grow-1" prepend-icon="mdi-star-outline">貴賓資料表</v-btn>
          <v-btn value="customer" class="flex-grow-1" prepend-icon="mdi-account-box-outline">客戶資料表</v-btn>
        </v-btn-toggle>

        <v-select
          v-model="selectedSalesPhone"
          label="選擇銷售人員"
          :items="staffList"
          item-title="name"
          item-value="phone"
          variant="outlined"
          density="comfortable"
          :loading="loading"
          prepend-inner-icon="mdi-account-tie"
          hide-details
          class="mb-4"
        >
          <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.phone"></v-list-item>
          </template>
        </v-select>

        <template v-if="selectedSalesPhone">
          <v-text-field
            :model-value="salesFormUrl"
            :label="`專屬網址（${currentFormType.label}）`"
            variant="outlined"
            density="comfortable"
            readonly
            prepend-inner-icon="mdi-link-variant"
            hide-details
            class="mb-3"
          >
            <template v-slot:append-inner>
              <v-btn
                :color="copySuccess ? 'success' : 'primary'"
                variant="text"
                size="small"
                :prepend-icon="copySuccess ? 'mdi-check' : 'mdi-content-copy'"
                @click="copyUrl"
              >
                {{ copySuccess ? '已複製' : '複製' }}
              </v-btn>
            </template>
          </v-text-field>

          <v-btn
            color="primary"
            variant="flat"
            block
            prepend-icon="mdi-qrcode"
            @click="showQrDialog = true"
          >
            產生 QR Code
          </v-btn>
        </template>
      </v-card-text>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="dialogVisible = false">關閉</v-btn>
      </v-card-actions>
    </v-card>

    <QrCodeGenerator
      v-model="showQrDialog"
      :target-url="salesFormUrl"
      :default-overlay-text="qrOverlayText"
      :download-file-name="qrDownloadFileName"
    />
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import QrCodeGenerator from '@/components/QrCodeGenerator.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  // [{ name, phone }] 該建案具客資權限的人員清單
  staffList: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// 表單類型定義：路徑與檔名後綴
const FORM_TYPES = {
  vip: { label: '貴賓資料表', path: '/#/vip-form/' },
  customer: { label: '客戶資料表', path: '/#/customer-data-sheet/' }
};

const formType = ref('vip');
const selectedSalesPhone = ref('');
const showQrDialog = ref(false);
const copySuccess = ref(false);

watch(dialogVisible, (val) => {
  if (val) {
    formType.value = 'vip';
    selectedSalesPhone.value = '';
    copySuccess.value = false;
  }
});

watch(formType, () => { copySuccess.value = false; });

const currentFormType = computed(() => FORM_TYPES[formType.value] || FORM_TYPES.vip);

const selectedSalesName = computed(() => {
  const staff = props.staffList.find(s => s.phone === selectedSalesPhone.value);
  return staff?.name || '';
});

const salesFormUrl = computed(() => {
  if (!selectedSalesPhone.value) return '';
  const origin = window.location.origin;
  let url = `${origin}${currentFormType.value.path}${props.projectId}?sp=${encodeURIComponent(selectedSalesPhone.value)}`;
  if (selectedSalesName.value) {
    url += `&sn=${encodeURIComponent(selectedSalesName.value)}`;
  }
  if (formType.value === 'customer' && props.projectName) {
    url += `&pn=${encodeURIComponent(props.projectName)}`;
  }
  return url;
});

const qrOverlayText = computed(() => {
  if (!selectedSalesName.value) return '';
  return props.projectName ? `${props.projectName}\n${selectedSalesName.value}` : selectedSalesName.value;
});

const qrDownloadFileName = computed(() => {
  if (!selectedSalesName.value) return '';
  return `${props.projectName || props.projectId}_${selectedSalesName.value}_${currentFormType.value.label}`;
});

async function copyUrl() {
  if (!salesFormUrl.value) return;
  try {
    await navigator.clipboard.writeText(salesFormUrl.value);
    copySuccess.value = true;
    setTimeout(() => { copySuccess.value = false; }, 2000);
  } catch (err) {
    console.error('複製網址失敗:', err);
    alert('複製失敗，請手動複製。');
  }
}
</script>
