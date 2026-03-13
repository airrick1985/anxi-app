<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" fullscreen scrollable transition="dialog-bottom-transition">
    <v-card style="background: #F5F5F7;">
      <v-toolbar color="#f5f5f7" dark>
        <v-btn icon dark @click="closeDialog">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-toolbar-title>後台新增預約</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text>
        <v-window v-model="step" :touch="false">
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
                    :messages="isSearching ? '正在搜尋中...' : []"
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
                        <v-autocomplete
                          v-model="formStep1.building"
                          :items="projectBuildings"
                          label="棟別 (選擇或輸入)"
                          variant="outlined"
                          @update:model-value="onBuildingChange"
                          clearable
                         
                        ></v-autocomplete>
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
  
  <div v-if="initialBatchInfo.statusText" class="text-body-2 text-medium-emphasis">
    {{ selectedHouseholdDetails.initialInspectionBatch }} /
    <v-chip :color="initialBatchInfo.color" size="x-small" label class="ml-1">{{ initialBatchInfo.statusText }}</v-chip>
    <div class="text-caption mt-1">{{ initialBatchInfo.range }}</div>
  </div>
  
  <div v-else class="text-caption text-error">無指定批次，請確認是否已可初驗</div>
                          </v-list-item>

                          <v-list-item>
                            <v-list-item-title>{{ dynamicBatchTitle }}</v-list-item-title>
                            
                            <div v-if="reInspectionBatchInfo.statusText" class="text-body-2 text-medium-emphasis">
                              {{ dynamicBatchCode }} /
                              <v-chip :color="reInspectionBatchInfo.color" size="x-small" label class="ml-1">{{ reInspectionBatchInfo.statusText }}</v-chip>
                              <div class="text-caption mt-1">{{ reInspectionBatchInfo.range }}</div>
                            </div>
                            
                            <div v-else class="text-caption text-error">無指定批次，請確認是否已開放</div>
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
                        <v-select label="預約項目" :items="availableBookingTypes" v-model="formStep2.bookingType" variant="outlined" :rules="[v => !!v || '必填']"></v-select>
                      </v-col>
                       <v-col cols="12" sm="6">
                        <v-select label="選擇方式" :items="availableInspectionMethods" v-model="formStep2.inspectionMethod" variant="outlined" :rules="[v => !!v || '必填']" no-data-text="請先選擇預約項目"></v-select>
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

                    
                    <v-row>
                      <v-col cols="12" md="auto">
                      <VueDatePicker
                        v-model="formStep2.appointmentDate"
                        inline
                        :action-row="{ showNow: true, showPreview: true }"
                        auto-apply
                        select-text="選取"
                        now-button-label="今天"
                        locale="zh-TW"
                        :enable-time-picker="false"
                        :month-change-on-scroll="false"
                        @update:model-value="onDateChange"
                        :min-date="new Date()" 
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
                      <div class="d-flex align-center justify-start ga-4 mt-2 text-caption text-medium-emphasis">
                        <div class="d-flex align-center ga-1">
                        <v-icon icon="mdi-circle-outline" color="green" size="small"></v-icon>
                        <span>本戶批次</span>
                        </div>
                        <div class="d-flex align-center ga-1">
                        <v-icon icon="mdi-triangle-outline" color="blue" size="small"></v-icon>
                         <span>其他批次</span>
                        </div>
                      </div>
                      </v-col>
                      <v-col cols="12" md>
                      <v-alert v-if="dateSelectionAlert.show" :type="dateSelectionAlert.type" variant="tonal" border="start" class="mb-4" density="compact">
                      {{ dateSelectionAlert.text }}
                      </v-alert>

                        <div>
                        <v-label class="text-body-1 font-weight-medium mb-2">預約時段</v-label>
                    
                        <div v-if="isFetchingSlots" class="text-center pa-4 border rounded">
                          <v-progress-circular indeterminate color="primary" size="24" class="mb-2"></v-progress-circular>
                          <div class="text-caption text-grey">查詢可預約時段...</div>
                        </div>
                        <div v-else-if="!formStep2.appointmentDate" class="text-caption text-grey pa-4 border rounded">
                          請先選擇預約日期
                        </div>
                        <div v-else-if="availableTimeSlots.length === 0" class="text-caption text-grey pa-4 border rounded">
                          此日期無可預約時段，請手動輸入時段
                        </div>
                        <v-chip-group
                          v-else
                          v-model="formStep2.appointmentTimeSlot"
                          column
                          mandatory
                          filter
                        >
                          <v-chip
                          v-for="slot in availableTimeSlots"
                          :key="slot.value"
                          :value="slot.value"
                          
                          variant="outlined"
                          color="blue"
                          label
                          size="large"
                          class="ma-1"
                          >
 {{ slot.title }}
                          </v-chip>
                        </v-chip-group>

                        <v-text-field
                          v-model="formStep2.manualTimeSlot"
                          label="手動輸入時段"
                          placeholder="HH:MM"
                          variant="outlined"
                          
                          class="mt-4"
                          :rules="[manualTimeRule]"
                          persistent-hint
                          hint="若無可用時段，請手動輸入 24 小時制時間，例如：09:30"
                        ></v-text-field>

                        <div v-if="timeSlotError" class="v-input__details text-error px-2 pt-1">
                          <div class="v-messages__message">{{ timeSlotError }}</div>
                        </div>
                      </div>
                      </v-col>
                    </v-row>
                   
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

                    <v-dialog v-model="errorAlert.show" max-width="500px" persistent>
      <v-card>
        <v-card-title
          class="text-h6 d-flex align-center"
          :class="errorAlert.type === 'warning' ? 'bg-amber-lighten-4' : 'bg-red-lighten-4'"
        >
          <v-icon
            start
            :icon="errorAlert.type === 'warning' ? 'mdi-alert-outline' : 'mdi-alert-circle-outline'"
            :color="errorAlert.type === 'warning' ? 'warning' : 'error'"
          ></v-icon>
          <span>{{ errorAlert.type === 'warning' ? '操作提示' : '錯誤' }}</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1">
          {{ errorAlert.text }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            :color="errorAlert.type === 'warning' ? 'warning' : 'error'"
            variant="text"
            @click="errorAlert.show = false"
          >
            關閉
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


                    <v-alert v-if="isOverbooking" type="warning" variant="tonal" border="start" class="mb-4">
                      注意：您選擇的時段 <strong>{{ formStep2.appointmentTimeSlot.value || formStep2.appointmentTimeSlot }}</strong> 已額滿，此為強制預約。
                    </v-alert>

                     <v-checkbox
                      v-model="isAdminForcing"
                      label="強制新增預約"
                      color="error"
                      class="mt-4"
                      messages="選取後將忽略名額與日期、時段規則限制，請確認預約資訊無誤再送出"
                    ></v-checkbox>

                    <v-list lines="two">
                      <v-list-item title="戶別" :subtitle="finalBookingData.unitId"></v-list-item>
                      <v-list-item title="門牌" :subtitle="finalBookingData.address"></v-list-item>
                      <v-divider class="my-2"></v-divider>
                      <v-list-item title="預約項目" :subtitle="finalBookingData.bookingType"></v-list-item>
                      <v-list-item title="選擇方式" :subtitle="finalBookingData.inspectionMethod"></v-list-item>
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
      :calendar-data="calendarData"
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
import { useProjectStore } from '@/store/projectStore';
import {
  // fetchProjectConfig, // <--- 由 Store 處理
  searchHouseholdsForAdmin,
  getProjectBatchDetails, // <--- 由 Store 處理
  getAdminBookingCalendarData,
  getSlotsForAdmin,
  addAppointmentAdmin,
  // fetchAllHouseholds, // <--- 由 Store 處理
  getAppointmentsForHousehold,
  updateAppointment, 
  cancelAppointment,
} from '@/api'; // ✅ 簡化 api 引入

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, required: true },
});

const emit = defineEmits(['update:modelValue', 'booking-success']);

const userStore = useUserStore();
const projectStore = useProjectStore();

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
const isAdminForcing = ref(false); // <--- ✅ 新增這行：宣告 isAdminForcing 並設預設值為 false

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
  manualTimeSlot: '',
});
const bookingOptions = reactive({
    bookingTypes: [], // 已棄用，改用 availableBookingTypes
    inspectionMethods: [], // 已棄用，改用 availableInspectionMethods
});

const currentProjectConfig = computed(() => {
    return projectStore.projectDetailsCache[props.projectId]?.projectConfig || null;
});

const availableBookingTypes = computed(() => {
    const config = currentProjectConfig.value;
    if (!config) return [];
    
    // 1. 優先取用新的選單結構
    if (config.bookingMenu && config.bookingMenu.length > 0) {
        return config.bookingMenu.map(item => item.title);
    }
    
    // 2. 回退到舊的結構
    return config.bookingTypes || [];
});

const availableInspectionMethods = computed(() => {
    const config = currentProjectConfig.value;
    const selectedType = formStep2.bookingType;
    if (!config || !selectedType) return [];

    // 1. 優先從 bookingMenu 查找
    if (config.bookingMenu && config.bookingMenu.length > 0) {
        const menuItem = config.bookingMenu.find(item => item.title === selectedType);
        if (menuItem && menuItem.methods) {
            return menuItem.methods.map(m => m.title);
        }
    }

    // 2. 回退到全域設定 (如果有標記 showBookingMethod)
    return config.bookingMethodOptions || [];
});

const isBlockingDialogVisible = ref(false);
const blockingAppointmentDetails = ref(null); // 用來儲存造成阻擋的預約物件
const isConfirmContinueDialogVisible = ref(false);
const completedAppointmentDetails = ref(null); // 用來儲存已完成的預約物件

const errorAlert = reactive({ show: false, type: 'error', text: '' });

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
const timeSlotError = ref('');

const manualTimeRule = (v) => {
    if (!v) return true; // 允許為空 (如果選擇了 chip)
    return /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/.test(v) || '格式不正確，請輸入 HH:MM (例如 09:00)';
};

// --- Computed Properties ---
const canEdit = computed(() => userStore.hasProjectPermission('驗屋預約管理-修改', projectName.value));


const dialogModel = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const initialBatchInfo = computed(() => {
  const code = selectedHouseholdDetails.value?.initialInspectionBatch; // 預期是 "8"
  
  // 1. 強制解開 Proxy，查看最真實的資料結構
  const rawBatchDetails = JSON.parse(JSON.stringify(allBatchDetails.value));
  
  console.group('🔍 [Debug] 初驗批次查找診斷');
  console.log('目標代碼 (code):', code);
  console.log('所有批次資料 (rawBatchDetails):', rawBatchDetails);
  console.log('第一層 Keys (預約類型):', Object.keys(rawBatchDetails));

  // 2. 檢查第一層 Key
  // 注意：這裡檢查是否真的有 "初驗" 這個 key (有些系統可能是 "Initial" 或 "驗屋")
  const targetTypeKey = '初驗'; 
  const batchGroup = rawBatchDetails[targetTypeKey];

  if (!batchGroup) {
    console.warn(`❌ 找不到類型 [${targetTypeKey}]。現有的類型是:`, Object.keys(rawBatchDetails));
    console.groupEnd();
    return {};
  }

  console.log(`✅ 找到類型 [${targetTypeKey}]，內含批次代碼 Keys:`, Object.keys(batchGroup));

  // 3. 檢查第二層 Key (批次代碼)
  // 嘗試直接用 key 查找
  let info = batchGroup[code];
  
  if (!info) {
      console.warn(`❌ 在 [${targetTypeKey}] 中找不到 Key 為 [${code}] 的資料。`);
      
      // 嘗試模糊查找 (例如數字 8 vs 字串 "8")
      console.log('🔄 嘗試寬鬆查找...');
      const foundKey = Object.keys(batchGroup).find(k => String(k) === String(code));
      
      if (foundKey) {
          console.log(`✅ 找到寬鬆匹配的 Key: [${foundKey}]`);
          info = batchGroup[foundKey];
      } else {
          // 4. 如果 Key 找不到，檢查是否使用了 Document ID 當作 Key，而 batchCode 存在於內容中？
          console.log('🔄 嘗試遍歷內容查找 batchCode...');
          const foundEntry = Object.values(batchGroup).find(item => String(item.batchCode) === String(code));
          if (foundEntry) {
               console.log('✅ 透過內容比對找到了對應資料:', foundEntry);
               info = foundEntry;
          } else {
               console.error('❌ 徹底找不到對應的批次資料。');
          }
      }
  } else {
      console.log('✅ 直接查找成功。');
  }

  console.groupEnd();

  if (!info) {
    return {};
  }
  
  return { ...info, range: `${info.bookingStart} ~ ${info.bookingEnd}` };
});

const dynamicBatchTargetType = computed(() => {
    return formStep2.bookingType !== '初驗' ? formStep2.bookingType : '複驗';
});

const dynamicBatchTitle = computed(() => {
    return formStep2.bookingType !== '初驗' ? `${formStep2.bookingType}批次` : '複驗/其他批次';
});

const dynamicBatchCode = computed(() => {
    const type = dynamicBatchTargetType.value;
    return selectedHouseholdDetails.value?.customBatches?.[type] || selectedHouseholdDetails.value?.reInspectionBatch;
});

const reInspectionBatchInfo = computed(() => {
    const code = dynamicBatchCode.value;
    const type = dynamicBatchTargetType.value;
    
    console.log(`🔍 [Debug] Target Code (${type}):`, code);

    if (!code) {
      return {};
    }

    let info = allBatchDetails.value[type]?.[code];
    
    if (!info && allBatchDetails.value[type]) {
        info = allBatchDetails.value[type][String(code)];
    }

    // 若仍找不到，且 type 不是複驗，則試著看看這 code 是不是原本舊系統裡作為「對保/交屋」設定在「複驗」的批次
    if (!info && type !== '複驗' && allBatchDetails.value['複驗']) {
        info = allBatchDetails.value['複驗']?.[code] || allBatchDetails.value['複驗'][String(code)];
    }

    console.log(`🔍 [Debug] Found Info (${type}):`, info);

    if (!info) {
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
        appointmentTimeSlot: formStep2.manualTimeSlot || formStep2.appointmentTimeSlot,
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
  isOverbooking.value = false;
  isAdminForcing.value = false; // <--- ✅ 新增重設
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
        manualTimeSlot: '',
    });
    calendarData.value = [];
    dateSelectionAlert.show = false;    
    availableTimeSlots.value = [];
    isOverbooking.value = false;
};

watch(() => formStep2.bookingType, (newVal) => {
  // 重置選擇方式，修正 BUG
  formStep2.inspectionMethod = null;
  formStep2.inspectionCompanyName = '';

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

watch(() => formStep2.appointmentTimeSlot, (newSlotValue) => {
  timeSlotError.value = ''; // Clear error on new selection
 if (newSlotValue) {
    formStep2.manualTimeSlot = ''; // 清空手動輸入
    onTimeSlotChange(newSlotValue);
  }
});

watch(() => formStep2.manualTimeSlot, (newManualTime) => {
    if (newManualTime) {
        formStep2.appointmentTimeSlot = null; // 清空 chip 選擇
        isOverbooking.value = false; // 手動輸入不觸發超額檢查
        timeSlotError.value = '';
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
    dateSelectionAlert.text = `${formattedDate} 非本戶別可預約日期批次，請確保選擇日期正確。`;
  } else if (!selectedDayData) {
    dateSelectionAlert.show = true;
    dateSelectionAlert.type = 'error';
    dateSelectionAlert.text = `${formattedDate} 尚未建立可預約日期批次，請確保選擇日期正確。`;
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
  timeSlotError.value = '';
  const { valid } = await step2FormRef.value.validate();
  
  if (!formStep2.appointmentTimeSlot && !formStep2.manualTimeSlot) {
    timeSlotError.value = '請選擇或手動輸入一個預約時段';
  }

  if (!valid || timeSlotError.value) return;

  if (isOverbookingConfirmDialogVisible.value) {
    return;
  }
  step.value = 3;
};

const submitAdminBooking = async () => {
    isSubmitting.value = true;
    errorAlert.show = false; // ✓ 清除之前的錯誤提示
    try {
       const payload = {
            projectId: props.projectId,
            newBookingData: {
                ...finalBookingData.value,
                // ✓ START: 修改
                // [原始碼]
                // appointmentDate: finalBookingData.value.appointmentDate ? new Date(finalBookingData.value.appointmentDate).toISOString().split('T')[0] : null,
                // [修正] 直接使用 date-fns format 轉換本地 Date 物件為 'yyyy-MM-dd' 字串
                appointmentDate: formStep2.appointmentDate ? format(formStep2.appointmentDate, 'yyyy-MM-dd') : null,
                // ✓ END: 修改
            },
           force: isAdminForcing.value, // ✓ 使用 isAdminForcing 的值
        };

        console.log('Payload being sent to API:', payload);

        const result = await addAppointmentAdmin(payload);

        if (result.status === 'success') {
            emit('booking-success');
            closeDialog();
        } else {
            // 雖然 HttpsError 通常會在 catch 捕捉，但以防萬一後端回傳 status: 'error'
            throw new Error(result.message || '預約失敗');
        }
    } catch (error) {
        console.error("後台新增預約失敗:", error);
        const errorMessage = error.message || '未知錯誤';

        // ✅ START: 新增錯誤判斷邏輯
        const isRuleError = errorMessage.includes('不在可預約範圍內') || errorMessage.includes('規則已被刪除');
        const isSlotFullError = errorMessage.startsWith('SLOT_FULL:');
        const isMethodError = errorMessage.includes('不適用於選擇方式');
        const isSlotNotFoundError = errorMessage.includes('在規則中不存在'); // 保持包含句號的判斷

        // ✓ 檢查是否是需要強制執行的錯誤類型，並且【尚未】勾選強制
        if ((isRuleError || isSlotFullError || isMethodError || isSlotNotFoundError) && !isAdminForcing.value) {
            errorAlert.text = '超過名額或日期、時段不存在，確認後請勾選【強制新增預約】後再送出預約。';
            errorAlert.type = 'warning'; // 使用警告類型
            errorAlert.show = true;
            // 可以選擇性地將步驟移回 Step 3，讓使用者看到 Checkbox
            // step.value = 3; // 取消註解以跳回步驟三
        } else {
            // ✓ 其他錯誤，或者已勾選強制但仍然失敗，顯示原始錯誤訊息
            errorAlert.text = `預約失敗：${errorMessage}`;
            errorAlert.type = 'error';
            errorAlert.show = true;
        }
        // ✅ END: 新增錯誤判斷邏輯

   } finally {
        isSubmitting.value = false;
        // isAdminForcing.value = false; // 送出後不一定要重設 Checkbox，看需求
    }
};

//  建立一個獨立的函式來載入初始資料
const loadInitialData = async () => {
    if (!props.projectId) return;
    
    console.log('🚀 [Debug] loadInitialData started for project:', props.projectId);

    try {
        // 1. 先嘗試從 Store 獲取 (快取)
        let {
          projectConfig,
          householdsRes,
          batchesRes
        } = await projectStore.fetchAdminBookingData(props.projectId);
        
        console.log('📦 [Debug] Store returned batchesRes:', batchesRes);

        // ✅ [新增修正邏輯] 檢查批次資料是否為空
        // 如果 batchesRes 是空物件，且我們知道應該要有資料 (或是為了保險起見)
        // 強制直接呼叫 API 獲取最新資料
        if (!batchesRes || Object.keys(batchesRes).length === 0) {
            console.warn('⚠️ [Debug] Store 批次資料為空，嘗試直接呼叫 API...');
            try {
                const apiBatches = await getProjectBatchDetails({ projectId: props.projectId });
                if (apiBatches && Object.keys(apiBatches).length > 0) {
                    console.log('✅ [Debug] API 直接獲取成功:', apiBatches);
                    batchesRes = apiBatches; // 覆蓋原本的空資料
                } else {
                     console.error('❌ [Debug] API 也回傳空資料，請檢查資料庫 "bookingBatches" 集合。');
                }
            } catch (apiErr) {
                console.error('❌ [Debug] API 直接呼叫失敗:', apiErr);
            }
        }

        // 2. 賦值給本地變數
        if (projectConfig) {
            projectName.value = projectConfig.name;
            bookingOptions.bookingTypes = projectConfig.bookingTypes || [];
            bookingOptions.inspectionMethods = projectConfig.bookingMethodOptions || [];
        }

        allProjectHouseholds.value = householdsRes;
        const buildings = [...new Set(householdsRes.map(h => h.building))];
        
        projectBuildings.value = buildings.sort((a, b) => 
          String(a).localeCompare(String(b), 'zh-Hant-TW', { numeric: true, sensitivity: 'base' })
        );

        // 3. 設定批次資料
        allBatchDetails.value = batchesRes; 
        console.log('✅ [Debug] allBatchDetails assigned (Keys):', Object.keys(allBatchDetails.value));

    } catch (error) {
        console.error("初始化對話框資料失敗:", error);
        errorAlert.text = `載入建案資料失敗: ${error.message}`;
        errorAlert.type = 'error';
        errorAlert.show = true;
    }
};

// ✅ 4. 修改 isLoading 的綁定
// 我們讓本地的 isLoading 反映 store 的 isLoading 狀態
// 這樣當 store 在載入時，v-progress-circular 會自動顯示
watch(() => projectStore.isLoading, (newVal) => {
  isLoading.value = newVal;
});

// ✅ 5. 修改 watch (modelValue)
watch(() => props.modelValue, (newVal) => {
    if (newVal) {
        // 當對話框打開時，載入初始資料
        loadInitialData();
    } else {
        // 當對話框關閉時，重置所有狀態
        resetState();
    }
}, { immediate: true });

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