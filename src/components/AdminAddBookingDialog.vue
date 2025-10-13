<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" fullscreen scrollable transition="dialog-bottom-transition">
    <v-card style="background: #F4F4F7;">
      <v-toolbar color="primary" dark>
        <v-btn icon dark @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>後台新增預約</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text>
        <v-window v-model="step">
          <v-window-item :value="1">
            <v-container>
              <v-row justify="center">
                <v-col cols="12" md="10" lg="8">
                        <v-card class="pa-4 pa-md-6">

                  <h3 class="text-h6 mb-4">步驟一：選擇戶別</h3>

                  <v-text-field
                    v-model="searchKeyword"
                    label="輸入關鍵字查詢戶別 (姓名、電話、身分證、戶號)"
                    prepend-inner-icon="mdi-magnify"
                    variant="outlined"
                    clearable
                    :loading="isSearching"
                    class="mb-2"
                  ></v-text-field>

                  <v-list v-if="searchResults.length > 0" class="mb-4 border rounded" density="compact">
                    <v-list-item
                      v-for="item in searchResults"
                      :key="item.unitId"
                      @click="selectHouseholdFromSearch(item)"
                    >
                      <v-list-item-title>{{ item.unitId }} - {{ item.buyerName }}</v-list-item-title>
                    </v-list-item>
                  </v-list>

                  <div v-if="isLoading" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <p class="mt-2 text-grey">正在載入棟別戶別資料...</p>
                  </div>
                  <template v-else>
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-select
                          v-model="formStep1.building"
                          :items="projectBuildings"
                          label="棟別"
                          variant="outlined"
                          @update:model-value="onBuildingChange"
                        ></v-select>
                      </v-col>
                      <v-col cols="12" sm="6">
                        <v-select
                          v-model="formStep1.unitId"
                          :items="unitList"
                          label="戶別"
                          variant="outlined"
                          :disabled="!formStep1.building"
                          no-data-text="請先選擇棟別"
                          @update:model-value="onUnitChange"
                        ></v-select>
                      </v-col>
                    </v-row>
                  </template>

                  <v-divider class="my-6"></v-divider>

                  <div v-if="isLoadingDetails" class="text-center py-8">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                    <p class="mt-2 text-grey">正在載入戶別詳細資料...</p>
                  </div>

                  <div v-if="selectedHouseholdDetails">
                    <v-row dense>
                    <v-col cols="12">
                        <v-card variant="outlined">
                           <v-card-title class="text-subtitle-1">{{ selectedHouseholdDetails.unitId }}預約紀錄</v-card-title>
                        <v-list v-if="appointmentHistory.length > 0" lines="two" density="compact">
                          <template v-for="(appt, index) in appointmentHistory" :key="appt.id">
                            <v-list-item @click="showHistoryDetails(appt)" style="cursor: pointer;">
                            <v-list-item-title class="d-flex align-center">
                                <v-chip size="x-small" :color="getStatusColor(appt.status)" class="mr-2">{{ appt.status }}</v-chip>
                                <span>{{ appt.appointmentDate?.toLocaleDateString() }} {{ appt.appointmentTimeSlot }}</span>
                              </v-list-item-title>
                                <v-list-item-subtitle>
                                  {{ appt.bookingType }} / {{ appt.inspectionMethod }}
                                  <span v-if="appt.inspectionCompanyName"> ({{ appt.inspectionCompanyName }})</span>
                                </v-list-item-subtitle>
                              </v-list-item>
                              <v-divider v-if="index < appointmentHistory.length - 1"></v-divider>
                            </template>
                          </v-list>
                          <v-card-text v-else class="text-grey">此戶別尚無預約紀錄</v-card-text>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-card variant="outlined">
                          <v-card-title class="text-subtitle-1">{{ selectedHouseholdDetails.unitId }}基本資料</v-card-title>
                          <v-list density="compact">
                             <v-list-item title="備註" class="text-red-darken-2 font-weight-bold" :subtitle="selectedHouseholdDetails.remarks || '無'"></v-list-item>
                             <v-list-item title="門牌" :subtitle="selectedHouseholdDetails.address || '無'"></v-list-item>
                             <v-list-item title="車位" :subtitle="selectedHouseholdDetails.parkingLots || '無'"></v-list-item>
                             <v-list-item title="買方姓名" :subtitle="selectedHouseholdDetails.buyerName || '無'"></v-list-item>
                             <v-list-item title="買方電話" :subtitle="selectedHouseholdDetails.buyerPhone || '無'"></v-list-item>
                             <v-list-item title="買方EMAIL" :subtitle="selectedHouseholdDetails.buyerEmail || '無'"></v-list-item>
                             <v-list-item title="買方身分證" :subtitle="selectedHouseholdDetails.buyerIdNumber || '無'"></v-list-item>
                          </v-list>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6">
                         <v-card variant="outlined">
                          <v-card-title class="text-subtitle-1">{{ selectedHouseholdDetails.unitId }}批次與文件</v-card-title>
                           <v-list density="compact">
                            <v-list-item>
                              <v-list-item-title>初驗批次</v-list-item-title>
                              <v-list-item-subtitle v-if="initialBatchInfo.statusText">
                                {{ selectedHouseholdDetails.initialInspectionBatch }} /
                                <v-chip :color="initialBatchInfo.color" size="x-small" label>{{ initialBatchInfo.statusText }}</v-chip>
                                <div class="text-caption">{{ initialBatchInfo.range }}</div>
                              </v-list-item-subtitle>
                              <v-list-item-subtitle v-else class="text-error">無指定批次，請確認是否已可初驗</v-list-item-subtitle>
                            </v-list-item>
                             <v-list-item>
                              <v-list-item-title>複驗批次</v-list-item-title>
                               <v-list-item-subtitle v-if="reInspectionBatchInfo.statusText">
                                {{ selectedHouseholdDetails.reInspectionBatch }} /
                                <v-chip :color="reInspectionBatchInfo.color" size="x-small" label>{{ reInspectionBatchInfo.statusText }}</v-chip>
                                <div class="text-caption">{{ reInspectionBatchInfo.range }}</div>
                              </v-list-item-subtitle>
                              <v-list-item-subtitle v-else class="text-error">無指定批次，請確認是否已可複驗</v-list-item-subtitle>
                            </v-list-item>
                            <v-list-item title="戶別文件">
                               <v-btn v-if="selectedHouseholdDetails.inspectionDocsUrl" size="small" variant="tonal" color="blue" :href="selectedHouseholdDetails.inspectionDocsUrl" target="_blank">開啟 {{ formStep1.unitId }} 文件夾</v-btn>
                               <span v-else>無</span>
                            </v-list-item>
                            <v-list-item title="驗屋報告">
                              <v-list-item-subtitle color="blue" v-if="!selectedHouseholdDetails.inspectionReportUrl || selectedHouseholdDetails.inspectionReportUrl.length === 0">無</v-list-item-subtitle>
                              <div v-else>
                                <div v-for="report in selectedHouseholdDetails.inspectionReportUrl" :key="report.url">
                                          <v-btn
                                            :href="report.url"
                                            target="_blank"
                                            variant="text"
                                            color="blue-darken-2"
                                            size="small"
                                            class="text-none pa-1"
                                            style="height: auto; min-height: 28px;"
                                          >
                                            <template v-slot:prepend>
                                              <v-icon color="red">mdi-file-pdf-box</v-icon>
                                            </template>
                                            <span class="text-body-2" style="white-space: normal; text-align: left; line-height: 1.2;">
                                              {{ report.name }}
                                            </span>
                                          </v-btn>
                                        </div>
                              </div>
                            </v-list-item>
                          </v-list>
                        </v-card>
                      </v-col>
                      
                    </v-row>
                  </div>
                </v-card>
                  </v-col>
              </v-row>
            </v-container>
          </v-window-item>

          <v-window-item :value="2">
            <v-container>
              <v-row justify="center">
                <v-col cols="12" md="10" lg="8">
                <v-card class="pa-4 pa-md-6">
                  <h3 class="text-h6 mb-4">步驟二：填寫預約資訊</h3>
                  <v-form ref="step2FormRef">
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-select label="預約項目" :items="bookingOptions.bookingTypes" v-model="formStep2.bookingType" variant="outlined" :rules="[v => !!v || '必填']"></v-select>
                      </v-col>
                       <v-col cols="12" sm="6">
                        <v-select label="驗屋方式" :items="bookingOptions.inspectionMethods" v-model="formStep2.inspectionMethod" variant="outlined" :rules="[v => !!v || '必填']"></v-select>
                      </v-col>
                      <v-col v-if="formStep2.inspectionMethod === '代驗公司'" cols="12">
                        <v-text-field label="代驗公司名稱" v-model="formStep2.inspectionCompanyName" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
                      </v-col>
                      <template v-if="formStep2.inspectionMethod === '授權驗屋'">
                        <v-col cols="12" sm="4"><v-text-field label="受託人姓名" v-model="formStep2.agentName" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                        <v-col cols="12" sm="4"><v-text-field label="受託人電話" v-model="formStep2.agentPhone" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                        <v-col cols="12" sm="4"><v-text-field label="受託人身分證" v-model="formStep2.agentIdNumber" variant="outlined"></v-text-field></v-col>
                      </template>
                    </v-row>

                    <v-divider class="my-4"></v-divider>

                    <v-checkbox v-model="isBookerSameAsBuyer" label="預約人同買方本人" @change="syncBuyerData"></v-checkbox>
                     <v-row dense>
                        <v-col cols="12" sm="6"><v-text-field label="預約人姓名" v-model="formStep2.bookerName" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                        <v-col cols="12" sm="6"><v-text-field label="預約人電話" v-model="formStep2.bookerPhone" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                        <v-col cols="12" sm="6"><v-text-field label="預約人EMAIL (接收確認通知)" v-model="formStep2.bookerEmail" variant="outlined" :rules="[v => !!v || '必填', v => /.+@.+\..+/.test(v) || 'E-mail 格式不正確']"></v-text-field></v-col>
                        <v-col cols="12" sm="6"><v-text-field label="預約人身分證" v-model="formStep2.bookerIdNumber" variant="outlined"></v-text-field></v-col>
                    </v-row>

                     <v-divider class="my-4"></v-divider>

                    

                     <VueDatePicker
                        v-model="formStep2.appointmentDate"
                        inline
                        auto-apply
                        locale="zh-TW"
                        :enable-time-picker="false"
                        width="100%"
                        @update:model-value="onDateChange"
                        class="mb-4"
                        :min-date="tomorrow" 
                      >
                        <template #day="{ date }">
                          <div class="custom-day-cell">
                            <div class="date-number">{{ date.getDate() }}</div>
                            <div v-if="dateMarkers[format(date, 'yyyy-MM-dd')]" class="date-marker">
                              <v-icon
                                :icon="dateMarkers[format(date, 'yyyy-MM-dd')].icon"
                                :color="dateMarkers[format(date, 'yyyy-MM-dd')].color"
                                size="x-small"
                              ></v-icon>
                            </div>
                          </div>
                        </template>
                      </VueDatePicker>
                     <div class="d-flex align-center justify-start ga-4 mt-2 mb-4 text-caption text-medium-emphasis">
                        <div class="d-flex align-center ga-1">
                          <v-icon icon="mdi-circle-outline" color="green" size="small"></v-icon>
                          <span>本戶批次</span>
                        </div>
                        <div class="d-flex align-center ga-1">
                          <v-icon icon="mdi-triangle-outline" color="blue" size="small"></v-icon>
                          <span>其他批次</span>
                        </div>
                      </div>
                      
                      <v-alert v-if="dateSelectionAlert.show" :type="dateSelectionAlert.type" variant="tonal" border="start" class="mb-4" density="compact">
                      {{ dateSelectionAlert.text }}
                      </v-alert>

                       <v-combobox
                        v-model="formStep2.appointmentTimeSlot"
                        :items="availableTimeSlots"
                        label="預約時段 (可手動輸入，格式 HH:mm)"
                        variant="outlined"
                        class="mt-4"
                        :disabled="!formStep2.appointmentDate"
                        :loading="isFetchingSlots"  
                        :rules="[
                          v => !!v || '必填',
                          v => (typeof v === 'object' && v !== null) || (typeof v === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(v)) || '格式不正確，請輸入 HH:mm'
                        ]"
                        no-data-text="此日期無預設時段，請手動輸入"
                        @update:model-value="onTimeSlotChange"
                      ></v-combobox>
                  </v-form>
                </v-card>
                  </v-col>
              </v-row>
            </v-container>
          </v-window-item>

          <v-window-item :value="3">
            <v-container>
              <v-row justify="center">
                <v-col cols="12" md="10" lg="8">
                  <v-card class="pa-4 pa-md-6">
                    <h3 class="text-h6 mb-4">步驟三：確認預約資訊</h3>
                    
                    <v-alert
                      v-if="dateSelectionAlert.show"
                      :type="dateSelectionAlert.type"
                      variant="tonal"
                      border="start"
                      class="mb-4"
                      title="請注意日期"
                    >
                      {{ dateSelectionAlert.text }}
                    </v-alert>
                    <v-alert v-if="isOverbooking" type="warning" variant="tonal" border="start" class="mb-4">
                      注意：您選擇的時段 <strong>{{ formStep2.appointmentTimeSlot.value || formStep2.appointmentTimeSlot }}</strong> 已額滿，此為強制預約。
                    </v-alert>
                    <v-list lines="two">
                      <v-list-item title="戶別" :subtitle="finalBookingData.unitId"></v-list-item>
                      <v-list-item title="門牌" :subtitle="finalBookingData.address"></v-list-item>
                      <v-divider class="my-2"></v-divider>
                      <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType"></v-list-item>
                      <v-list-item title="驗屋方式" :subtitle="finalBookingData.inspectionMethod"></v-list-item>
                      <v-list-item v-if="finalBookingData.inspectionCompanyName" title="代驗公司" :subtitle="finalBookingData.inspectionCompanyName"></v-list-item>
                      <template v-if="finalBookingData.inspectionMethod === '授權驗屋'">
                        <v-list-item title="受託人姓名" :subtitle="finalBookingData.agentName"></v-list-item>
                        <v-list-item title="受託人電話" :subtitle="finalBookingData.agentPhone"></v-list-item>
                      </template>
                      <v-divider class="my-2"></v-divider>
                       <v-list-item title="預約人姓名" :subtitle="finalBookingData.bookerName"></v-list-item>
                       <v-list-item title="預約人電話" :subtitle="finalBookingData.bookerPhone"></v-list-item>
                       <v-list-item title="預約人EMAIL" :subtitle="finalBookingData.bookerEmail"></v-list-item>
                      <v-divider class="my-2"></v-divider>
                       <v-list-item title="預約日期" :subtitle="finalBookingData.appointmentDate"></v-list-item>
                       <v-list-item title="預約時段" :subtitle="finalBookingData.appointmentTimeSlot"></v-list-item>
                   </v-list>
                </v-card>
                </v-col>
            </v-row>
          </v-container>
        </v-window-item>

        </v-window>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-btn v-if="step > 1" size="large" variant="text" @click="step--">
          上一步
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn v-if="step === 1" size="large" variant="flat" color="primary" :disabled="!formStep1.unitId" @click="handleStep1Next">下一步</v-btn>
        <v-btn v-if="step === 2" size="large" variant="flat" color="primary" @click="handleStep2Next">下一步</v-btn>
        <v-btn v-if="step === 3" size="large" variant="flat" color="success" @click="submitAdminBooking" :loading="isSubmitting">送出預約</v-btn>
      </v-card-actions>
    </v-card>

     <AppointmentDetailsDialog
      v-model="isDetailsDialogVisible"
      :appointment="selectedHistoryAppointment"
      :can-edit="canEdit"
      :booking-options="bookingOptions"
      :booking-history="appointmentHistory"
      @save="handleSaveChangesFromDialog"
      @cancel-appointment="promptCancelBooking"
    />

    <v-dialog v-model="isOverbookingConfirmDialogVisible" max-width="500px" persistent>
        <v-card>
            <v-card-title class="text-h6 d-flex align-center bg-error">
                <v-icon start>mdi-alert-circle-outline</v-icon>
                <span>確認超額預約</span>
            </v-card-title>
            <v-card-text class="pt-4">
                您選擇的時段 <strong>{{ overbookingDetails.date }} {{ overbookingDetails.time }}</strong> 名額已超出限制，要繼續預約嗎？
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="cancelOverbooking">取消</v-btn>
                <v-btn color="error" variant="flat" @click="confirmOverbooking">是，繼續預約</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

     <v-dialog v-model="isCancelConfirmDialogVisible" max-width="500px" persistent>
      <v-card v-if="eventToCancel">
        <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
          <v-icon start color="error">mdi-alert-circle-outline</v-icon>
          <span>確認取消預約</span>
        </v-card-title>
        <v-card-text class="py-4">
          <p class="mb-4">您確定要取消以下這筆預約紀錄嗎？此操作無法復原！</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded">
            <v-list-item :title="`${eventToCancel.unitId} (${eventToCancel.bookerName})`" prepend-icon="mdi-home-account"></v-list-item>
            <v-list-item prepend-icon="mdi-calendar-clock-outline">
              <template v-slot:title><div>{{ eventToCancel.appointmentDate?.toLocaleDateString() }}</div></template>
              <template v-slot:subtitle><div class="font-weight-medium">{{ eventToCancel.appointmentTimeSlot }}</div></template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCancelConfirmDialogVisible = false">返回</v-btn>
          <v-btn color="error" variant="flat" :loading="isCancelling" @click="handleConfirmCancelBooking">確定取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<v-dialog v-model="isBlockingDialogVisible" max-width="500px" persistent>
      <v-card v-if="blockingAppointmentDetails">
        <v-card-title class="text-h6 d-flex align-center bg-red">
          <v-icon start color="white">mdi-alert-octagon-outline</v-icon>
          <span>無法新增預約</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1">
          <p>您選擇的「<strong>{{ blockingAppointmentDetails.bookingType }}</strong>」已有進行中的預約。</p>
          <p class="mt-4">請先取消以下紀錄，才能新增此項目的預約：</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded mt-2">
            <v-list-item 
              :title="blockingAppointmentDetails.bookerName" 
              :subtitle="blockingAppointmentDetails.unitId"
              prepend-icon="mdi-account-alert-outline"
            ></v-list-item>
            <v-list-item 
              :title="blockingAppointmentDetails.appointmentDate?.toLocaleDateString()" 
              :subtitle="blockingAppointmentDetails.appointmentTimeSlot"
              prepend-icon="mdi-calendar-alert-outline"
            ></v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="red-darken-1" variant="text" @click="isBlockingDialogVisible = false">
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isConfirmContinueDialogVisible" max-width="500px" persistent>
      <v-card v-if="completedAppointmentDetails">
        <v-card-title class="text-h6 d-flex align-center bg-error">
          <v-icon start color="white">mdi-alert-circle-outline</v-icon>
          <span>請確認操作</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1">
          <p>您選擇的「<strong>{{ completedAppointmentDetails.bookingType }}</strong>」已有一筆已完成的紀錄。</p>
          <p class="mt-4">詳細資訊如下：</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded mt-2">
             <v-list-item 
              :title="completedAppointmentDetails.bookerName" 
              :subtitle="completedAppointmentDetails.unitId"
              prepend-icon="mdi-account-check-outline"
            ></v-list-item>
            <v-list-item 
              :title="completedAppointmentDetails.appointmentDate?.toLocaleDateString()" 
              :subtitle="completedAppointmentDetails.appointmentTimeSlot"
              prepend-icon="mdi-calendar-check-outline"
            ></v-list-item>
          </v-list>
          <p class="mt-4 font-weight-bold">您確定要為【{{ completedAppointmentDetails.unitId }}】再新增一筆預約嗎？</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="handleCancelContinue">取消</v-btn>
          <v-btn color="error" variant="flat" @click="handleConfirmContinue">繼續新增</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


  </v-dialog>

  
</template>

<script setup>
import { ref, computed, watch, reactive, onMounted, nextTick } from 'vue'; //  引入 nextTick
import { useDate } from 'vuetify';
import { watchDebounced } from '@vueuse/core';
import VueDatePicker from '@vuepic/vue-datepicker'; // ✓ 新增
import '@vuepic/vue-datepicker/dist/main.css';      // ✓ 新增
import { format } from 'date-fns';                 // ✓ 新增

import AppointmentDetailsDialog from '@/components/AppointmentDetailsDialog.vue';
import { useUserStore } from '@/store/user';
import {
  fetchProjectConfig,
  searchHouseholdsForAdmin,
  getProjectBatchDetails,
  getAdminBookingCalendarData,
  getSlotsForAdmin,
  addAppointmentAdmin,
  fetchAllHouseholds,
  getAppointmentsForHousehold,
  updateAppointment, 
  cancelAppointment,
} from '@/api';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['update:modelValue', 'booking-success']);

const userStore = useUserStore();

const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null);
const isCancelling = ref(false);
const projectName = ref('');

const dateAdapter = useDate();
const step = ref(1);
const isLoading = ref(false);
const isSearching = ref(false);
const isLoadingDetails = ref(false);
const isSubmitting = ref(false);

const step2FormRef = ref(null);

const isDetailsDialogVisible = ref(false);
const selectedHistoryAppointment = ref(null);

const tomorrow = ref(new Date());
tomorrow.value.setDate(tomorrow.value.getDate() + 1);


// --- Step 1 States ---
const searchKeyword = ref('');
const searchResults = ref([]);
const formStep1 = reactive({ building: null, unitId: null });
const selectedHouseholdDetails = ref(null);
const allBatchDetails = ref({});
const appointmentHistory = ref([]);
const projectBuildings = ref([]);
const allProjectHouseholds = ref([]);
const unitList = ref([]);


// --- Step 2 States ---
const isBookerSameAsBuyer = ref(false);
const formStep2 = reactive({
  bookingType: null,
  inspectionMethod: null,
  inspectionCompanyName: '',
  agentName: '',
  agentPhone: '',
  agentIdNumber: '',
  bookerName: '',
  bookerPhone: '',
  bookerEmail: '',
  bookerIdNumber: '',
  appointmentDate: new Date(),
  appointmentTimeSlot: null,
});
const bookingOptions = reactive({
    bookingTypes: [],
    inspectionMethods: [],
});

const isBlockingDialogVisible = ref(false);
const blockingAppointmentDetails = ref(null); // 用來儲存造成阻擋的預約物件
const isConfirmContinueDialogVisible = ref(false);
const completedAppointmentDetails = ref(null); // 用來儲存已完成的預約物件


// ✓ START: 修改 - 新增處理儲存和取消的函式
async function handleSaveChangesFromDialog(payload) {
    const { appointmentId, bookingPayload, householdPayload } = payload;
    try {
        if (Object.keys(bookingPayload).length > 0 || Object.keys(householdPayload).length > 0) {
            bookingPayload.lastModifiedByName = userStore.user?.name || '未知使用者';
        }

        const response = await updateAppointment(appointmentId, bookingPayload, payload.householdDocId, householdPayload);
        
        isDetailsDialogVisible.value = false; // 關閉對話框
        await onUnitChange(formStep1.unitId); // ✓ 重新載入戶別詳細資料以更新畫面
        
    } catch (err) {
        console.error(`儲存失敗: ${err.message}`);
    }
}

function promptCancelBooking(event) {
  eventToCancel.value = event;
  isCancelConfirmDialogVisible.value = true;
}

async function handleConfirmCancelBooking() {
    isCancelling.value = true;
    try {
        await cancelAppointment(
            eventToCancel.value.id,
            eventToCancel.value.projectId,
            eventToCancel.value.unitId,
            eventToCancel.value.bookingType
        );
        
        isCancelConfirmDialogVisible.value = false;
        isDetailsDialogVisible.value = false; // 關閉詳細資料對話框
        await onUnitChange(formStep1.unitId); // ✓ 重新載入戶別詳細資料以更新畫面

    } catch (err) {
        console.error(`取消預約失敗: ${err.message}`);
    } finally {
        isCancelling.value = false;
    }
}
// ✓ END: 修改

function handleConfirmContinue() {
  isConfirmContinueDialogVisible.value = false;
  // 使用者選擇繼續，不做任何事，保留選擇
}

function handleCancelContinue() {
  isConfirmContinueDialogVisible.value = false;
  formStep2.bookingType = null;
  completedAppointmentDetails.value = null; // 清除已儲存的物件
}

const showHistoryDetails = (appointment) => {
  // ✓ 將當前已載入的「戶別資料」與被點擊的「預約紀錄」合併
  const combinedData = {
    ...selectedHouseholdDetails.value, // 來自 households 的資料
    ...appointment                   // 來自 appointments 的資料 (會覆蓋同名欄位，這是正確的)
  };
  
  selectedHistoryAppointment.value = combinedData;
  isDetailsDialogVisible.value = true;
};

const getDateType = (date) => {
  const dateStr = date instanceof Date ? date.toISOString().split('T')[0] : date;
  const dayData = calendarData.value.find(d => d.date === dateStr);
  return dayData ? dayData.type : 'no_batch';
};

const calendarData = ref([]);
const dateSelectionAlert = reactive({ show: false, type: 'info', text: '' });
const availableTimeSlots = ref([]);
const isFetchingSlots = ref(false); // ✓ 新增：用於控制時段載入狀態
const isOverbooking = ref(false);
const isOverbookingConfirmDialogVisible = ref(false);
const overbookingDetails = reactive({ date: '', time: '' });

// --- Computed Properties ---
const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));


const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const initialBatchInfo = computed(() => {
  // ✓ LOG 1: 檢查 allBatchDetails 的整體結構與內容
  ////console.log('🔍 所有批次資料 (allBatchDetails):', JSON.parse(JSON.stringify(allBatchDetails.value)));

  const code = selectedHouseholdDetails.value?.initialInspectionBatch;
  // ✓ LOG 2: 檢查從當前戶別取出的「初驗批次代碼」
  ////console.log('🏷️ 戶別的初驗批次代碼 (code):', code);

  if (!code) {
    ////console.log('   ➡️ 初驗批次代碼不存在，無法進行查找。');
    return {};
  }

  const info = allBatchDetails.value['初驗']?.[code];
  // ✓ LOG 3: 檢查使用代碼查找批次詳細資料的結果
  ////console.log('ℹ️ 查找到的初驗批次資訊 (info):', info);
  
  if (!info) {
    ////console.log('   ➡️ 查找失敗，因此 v-if 判斷為 false。');
    return {};
  }
  return { ...info, range: `${info.bookingStart} ~ ${info.bookingEnd}` };
});

const reInspectionBatchInfo = computed(() => {
    const code = selectedHouseholdDetails.value?.reInspectionBatch;
    // ✓ LOG 4: 檢查從當前戶別取出的「複驗批次代碼」
    ////console.log('🏷️ 戶別的複驗批次代碼 (code):', code);

    if (!code) {
      ////console.log('   ➡️ 複驗批次代碼不存在，無法進行查找。');
      return {};
    }

    const info = allBatchDetails.value['複驗']?.[code];
    // ✓ LOG 5: 檢查使用代碼查找批次詳細資料的結果
    ////console.log('ℹ️ 查找到的複驗批次資訊 (info):', info);

    if (!info) {
      ////console.log('   ➡️ 查找失敗，因此 v-if 判斷為 false。');
      return {};
    }
    return { ...info, range: `${info.bookingStart} ~ ${info.bookingEnd}` };
});

const finalBookingData = computed(() => {
    const timeSlotValue = typeof formStep2.appointmentTimeSlot === 'object'
        ? formStep2.appointmentTimeSlot?.value
        : formStep2.appointmentTimeSlot;

    return {
        unitId: formStep1.unitId,
        address: selectedHouseholdDetails.value?.address || '',
        ...formStep2,
        appointmentDate: formStep2.appointmentDate ? dateAdapter.format(formStep2.appointmentDate, 'keyboardDate') : null,
        appointmentTimeSlot: timeSlotValue,
    };
});


// ✓ 新增 dateMarkers
const dateMarkers = computed(() => {
  const markers = {};
  for (const event of calendarData.value) {
    if (event.type === 'own_batch') {
      markers[event.date] = { icon: 'mdi-circle-outline', color: 'green' };
    } else if (event.type === 'other_batch') {
      markers[event.date] = { icon: 'mdi-triangle-outline', color: 'blue' };
    }
  }
  return markers;
});

// --- Methods ---
const closeDialog = () => {
  dialogModel.value = false;
};

const resetState = () => {
    step.value = 1;
    searchKeyword.value = '';
    searchResults.value = [];
    Object.assign(formStep1, { building: null, unitId: null });
    selectedHouseholdDetails.value = null;
    allBatchDetails.value = {};
    appointmentHistory.value = [];
    unitList.value = [];
    isBookerSameAsBuyer.value = false;
    Object.assign(formStep2, {
        bookingType: null, inspectionMethod: null, inspectionCompanyName: '',
        agentName: '', agentPhone: '', agentIdNumber: '', bookerName: '',
        bookerPhone: '', bookerEmail: '', bookerIdNumber: '',
        appointmentDate: new Date(), appointmentTimeSlot: null,
    });
    calendarData.value = [];
    dateSelectionAlert.show = false;
    availableTimeSlots.value = [];
    isOverbooking.value = false;
};

watch(() => formStep2.bookingType, (newVal) => {
  if (!newVal) return;

  const blockingAppt = appointmentHistory.value.find(
    appt => appt.bookingType === newVal && appt.status === '預約中'
  );

  if (blockingAppt) {
    blockingAppointmentDetails.value = blockingAppt; // 儲存整個物件
    isBlockingDialogVisible.value = true;
    nextTick(() => {
      formStep2.bookingType = null;
    });
    return;
  }

  const completedAppt = appointmentHistory.value.find(
    appt => appt.bookingType === newVal && appt.status === '已完成'
  );

  if (completedAppt) {
    completedAppointmentDetails.value = completedAppt; // 儲存整個物件
    isConfirmContinueDialogVisible.value = true;
  }
});

watchDebounced(searchKeyword, async (newVal) => {
  if (newVal && newVal.length > 1) {
    isSearching.value = true;
    try {
      const res = await searchHouseholdsForAdmin({ projectId: props.projectId, keyword: newVal });
      if (res.status === 'success') {
        searchResults.value = res.data;
      }
    } catch (error) {
      console.error("搜尋戶別失敗:", error);
    } finally {
      isSearching.value = false;
    }
  } else {
    searchResults.value = [];
  }
}, { debounce: 500 });

const selectHouseholdFromSearch = async (item) => {
  const household = allProjectHouseholds.value.find(h => h.unitId === item.unitId);
  if (household) {
    formStep1.building = household.building;
    //  使用 await 確保 onBuildingChange 完成
    await onBuildingChange(household.building);
    //  使用 nextTick 確保 DOM 更新
    await nextTick();
    formStep1.unitId = item.unitId;
    await onUnitChange(item.unitId);
  }
  searchKeyword.value = '';
  searchResults.value = [];
};

const onBuildingChange = async (building) => {
  formStep1.unitId = null;
  selectedHouseholdDetails.value = null;
  appointmentHistory.value = [];
  if (!building) {
    unitList.value = [];
    return;
  }
  unitList.value = allProjectHouseholds.value
    .filter(h => h.building === building)
    .map(h => h.unitId)
    .sort((a,b) => a.localeCompare(b, 'zh-Hant-TW', {numeric: true}));
};

const onUnitChange = async (unitId) => {
  if (!unitId) {
    selectedHouseholdDetails.value = null;
    appointmentHistory.value = [];
    return;
  }
  isLoadingDetails.value = true;
  try {
    const [historyRes, calendarRes] = await Promise.all([
      getAppointmentsForHousehold({ projectId: props.projectId, unitId }),
      getAdminBookingCalendarData({ projectId: props.projectId, unitId }),
    ]);

    selectedHouseholdDetails.value = allProjectHouseholds.value.find(h => h.unitId === unitId);

    if (historyRes.status === 'success') {
      appointmentHistory.value = historyRes.data.map(appt => ({
        ...appt,
        appointmentDate: appt.appointmentDate ? new Date(appt.appointmentDate) : null,
      }));
    } else {
      appointmentHistory.value = [];
    }

    if (calendarRes.status === 'success') {
      calendarData.value = calendarRes.data; // 後端已回傳 'YYYY-MM-DD' 字串
    }

  } catch (error) {
    console.error(`載入戶別 ${unitId} 詳細資料失敗:`, error);
  } finally {
    isLoadingDetails.value = false;
  }
};

const syncBuyerData = () => {
  if (isBookerSameAsBuyer.value && selectedHouseholdDetails.value) {
    formStep2.bookerName = selectedHouseholdDetails.value.buyerName;
    formStep2.bookerPhone = selectedHouseholdDetails.value.buyerPhone;
    formStep2.bookerEmail = selectedHouseholdDetails.value.buyerEmail;
    formStep2.bookerIdNumber = selectedHouseholdDetails.value.buyerIdNumber;
  }
};

const onDateChange = async (date) => {
  formStep2.appointmentTimeSlot = null;
  isOverbooking.value = false;
  dateSelectionAlert.show = false;
  isFetchingSlots.value = true; // ✓ 開始載入
  availableTimeSlots.value = []; // ✓ 先清空舊時段

  const dateStr = date.toISOString().split('T')[0];
  const selectedDayData = calendarData.value.find(d => d.date === dateStr);
  const formattedDate = dateAdapter.format(date, 'keyboardDate');

  if (selectedDayData?.type === 'other_batch') {
    dateSelectionAlert.show = true;
    dateSelectionAlert.type = 'error';
    dateSelectionAlert.text = `${formattedDate} 非本戶別驗屋日期批次，請您確認屋況是否可驗屋。`;
  } else if (!selectedDayData) {
    dateSelectionAlert.show = true;
    dateSelectionAlert.type = 'error';
    dateSelectionAlert.text = `${formattedDate} 尚未建立可驗屋日期批次，請您確認屋況是否可驗屋。`;
  }

  try {
    const slots = await getSlotsForAdmin(props.projectId, dateStr);
    availableTimeSlots.value = slots.map(s => ({ title: s, value: s.split(' ')[0] }));
  } catch(e) {
    console.error("獲取時段失敗:", e);
    availableTimeSlots.value = [];
  } finally {
    isFetchingSlots.value = false; // ✓ 載入結束 (無論成功或失敗)
  }
};
const onTimeSlotChange = (selectedSlot) => {
    isOverbooking.value = false;

    if (!selectedSlot) {
        return;
    }

    // v-combobox 可能回傳物件 (選擇時) 或字串 (手動輸入時)。
    // 我們需要確保比較的對象是字串。
    let titleString;
    if (typeof selectedSlot === 'object' && selectedSlot !== null && selectedSlot.title) {
        // 處理 combobox 回傳整個物件的情況
        titleString = selectedSlot.title;
    } else {
        // 處理回傳字串值或手動輸入的情況
        const foundSlot = availableTimeSlots.value.find(s => s.value === selectedSlot);
        titleString = foundSlot ? foundSlot.title : String(selectedSlot);
    }

    if (titleString && (titleString.includes('已額滿') || titleString.includes('尚餘 0 位'))) {
        overbookingDetails.date = dateAdapter.format(formStep2.appointmentDate, 'keyboardDate');
        overbookingDetails.time = titleString;
        isOverbookingConfirmDialogVisible.value = true;
    }
};

const confirmOverbooking = () => {
    isOverbooking.value = true;
    isOverbookingConfirmDialogVisible.value = false;
};

const cancelOverbooking = () => {
    formStep2.appointmentTimeSlot = null;
    isOverbooking.value = false;
    isOverbookingConfirmDialogVisible.value = false;
};

const getStatusColor = (status) => {
  const map = { '預約中': 'blue', '已完成': 'green', '取消': 'red' };
  return map[status] || 'grey';
};

const handleStep1Next = () => {
  step.value = 2;
};

const handleStep2Next = async () => {
  const { valid } = await step2FormRef.value.validate();
  if (!valid) return;
  if (isOverbookingConfirmDialogVisible.value) {
    return;
  }
  step.value = 3;
};

const submitAdminBooking = async () => {
    isSubmitting.value = true;
    try {
        const payload = {
            projectId: props.projectId,
            newBookingData: {
                ...finalBookingData.value,
                appointmentDate: finalBookingData.value.appointmentDate.replace(/\//g, '-'),
            },
            force: isOverbooking.value,
        };

        const result = await addAppointmentAdmin(payload);

        if (result.status === 'success') {
            emit('booking-success');
            closeDialog();
        } else {
            throw new Error(result.message || '預約失敗');
        }
    } catch (error) {
        console.error("後台新增預約失敗:", error);
    } finally {
        isSubmitting.value = false;
    }
};

//  建立一個獨立的函式來載入初始資料
const loadInitialData = async () => {
    if (!props.projectId) return;
    isLoading.value = true;
    try {
        const [projectConfig, householdsRes, batchesRes] = await Promise.all([
            fetchProjectConfig(props.projectId),
            fetchAllHouseholds(props.projectId),
            getProjectBatchDetails({ projectId: props.projectId }),
        ]);
        
        if (projectConfig) {
            projectName.value = projectConfig.name; // ✓ 儲存建案名稱
            bookingOptions.bookingTypes = projectConfig.bookingTypes || [];
            bookingOptions.inspectionMethods = projectConfig.bookingMethodOptions || [];
        }

        allProjectHouseholds.value = householdsRes;
        const buildings = [...new Set(householdsRes.map(h => h.building))];
        projectBuildings.value = buildings.sort((a,b) => a.localeCompare(b, 'zh-Hant-TW'));

        if (batchesRes.status === 'success') {
            allBatchDetails.value = batchesRes.data;
        }
    } catch (error) {
        console.error("初始化對話框資料失敗:", error);
    } finally {
        isLoading.value = false;
    }
};

//  修改 watch 監聽器
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        // 當對話框打開時，載入初始資料
        loadInitialData();
    } else {
        // 當對話框關閉時，重置所有狀態
        resetState();
    }
}, { immediate: true }); // ✓ 修改：在此處加上 { immediate: true }
</script>


<style scoped>
.custom-day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.date-number {
  line-height: 1;
}

.date-marker {
  position: absolute;
  bottom: -12px;
  line-height: 1;
}
</style>