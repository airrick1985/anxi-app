<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" max-width="700px" scrollable>
    <v-card v-if="appointment">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="font-weight-bold d-flex align-center">
          <v-icon start>mdi-text-box-search-outline</v-icon>
          <span>預約詳細資料</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="closeDialog"></v-btn>
      </v-toolbar>
      
      <v-card-text class="pt-4">
        <v-list lines="two" density="compact">
          <v-list-subheader>基本資料</v-list-subheader>
          <v-list-item prepend-icon="mdi-domain" title="建案" :subtitle="appointment.projectName"></v-list-item>
          <v-list-item prepend-icon="mdi-home-outline" title="戶別" :subtitle="appointment.unitId"></v-list-item>
          <v-list-item prepend-icon="mdi-map-marker-outline" title="門牌" :subtitle="appointment.address || '無'"></v-list-item>
          
          <v-alert
            v-if="appointment.remarks"
            density="compact"
            color="error"
            variant="tonal"
            icon="mdi-information-outline"
            class="mt-2 mx-4 mb-2"
            style="white-space: pre-wrap;"
          >
            <strong>備註：</strong><br>
            {{ appointment.remarks }}
          </v-alert>

          <v-list-subheader class="mt-2">預約人資訊</v-list-subheader>
          <v-list-item prepend-icon="mdi-account-outline" title="預約人" :subtitle="appointment.bookerName"></v-list-item>
          <v-list-item prepend-icon="mdi-phone-outline" title="電話">
            <v-list-item-subtitle>
              <a :href="`tel:${appointment.bookerPhone}`" class="text-decoration-none text-primary">{{ appointment.bookerPhone }}</a>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-email-outline" title="Email" v-if="appointment.bookerEmail">
            <v-list-item-subtitle>
              <a :href="`mailto:${appointment.bookerEmail}`" class="text-decoration-none text-primary">{{ appointment.bookerEmail }}</a>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-card-account-details-outline" title="身分證" :subtitle="appointment.bookerIdNumber" v-if="appointment.bookerIdNumber"></v-list-item>

          <v-list-subheader class="mt-2">預約項目詳情</v-list-subheader>
          <v-list-item prepend-icon="mdi-pound" title="預約代碼">
            <v-list-item-subtitle>
              <v-chip color="red" size="small" label variant="tonal">{{ appointment.bookingCode }}</v-chip>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-format-list-checks" title="預約項目" :subtitle="appointment.bookingType"></v-list-item>
          <v-list-item prepend-icon="mdi-calendar-clock" title="預約時程" :subtitle="formatDate(appointment.appointmentDate) + ' ' + appointment.appointmentTimeSlot"></v-list-item>
          <v-list-item prepend-icon="mdi-account-search-outline" title="驗屋方式" :subtitle="appointment.inspectionMethod"></v-list-item>
          <v-list-item v-if="appointment.inspectionMethod === '代驗公司'" prepend-icon="mdi-office-building-outline" title="代驗公司" :subtitle="appointment.inspectionCompanyName || '未填寫'"></v-list-item>
          <v-list-item prepend-icon="mdi-list-status" title="狀態">
            <v-list-item-subtitle>
              <v-chip :color="getStatusColor(appointment.status)" size="small" label>{{ appointment.status }}</v-chip>
            </v-list-item-subtitle>
          </v-list-item>

          <v-list-subheader class="mt-2">戶別相關資訊</v-list-subheader>
          <v-list-item prepend-icon="mdi-car" title="持有車位" :subtitle="appointment.parkingLots || '無'"></v-list-item>
          <v-list-item prepend-icon="mdi-file-document-outline" title="驗屋文件">
            <v-list-item-subtitle>
              <v-btn v-if="appointment.inspectionDocsUrl" :href="appointment.inspectionDocsUrl" target="_blank" rel="noopener noreferrer" size="small" variant="tonal" color="indigo">
                <v-icon start>mdi-folder-google-drive</v-icon>
                開啟雲端資料夾
              </v-btn>
              <span v-else>無</span>
            </v-list-item-subtitle>
          </v-list-item>
          <v-list-item prepend-icon="mdi-file-chart-outline" title="已上傳報告">
              <template v-if="!appointment.inspectionReportUrl || appointment.inspectionReportUrl.length === 0">
                  <v-list-item-subtitle>無</v-list-item-subtitle>
              </template>
          </v-list-item>
          <v-list-item 
            v-for="(report, index) in appointment.inspectionReportUrl" 
            :key="index"
            :href="report.url"
            target="_blank"
            rel="noopener noreferrer"
            class="pl-14"
          >
            <template v-slot:prepend>
              <v-icon color="red-darken-2">mdi-file-pdf-box</v-icon>
            </template>
            <v-list-item-title class="text-primary font-weight-medium">{{ report.name }}</v-list-item-title>
          </v-list-item>

          </v-list>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="bg-grey-lighten-5 pa-3">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="tonal" @click="closeDialog">關閉</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';
import { useDate } from 'vuetify';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  appointment: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['update:modelValue']);

const dateAdapter = useDate();

const closeDialog = () => {
  emit('update:modelValue', false);
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return dateAdapter.format(new Date(dateString), 'keyboardDate');
  } catch {
    return dateString;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case '預約中': return 'blue';
    case '已完成': return 'green';
    case '取消': return 'red';
    default: return 'grey';
  }
};
</script>