<template>
  <v-dialog :model-value="modelValue" @update:model-value="closeDialog" fullscreen scrollable transition="dialog-bottom-transition">
    <v-card style="background: #F5F5F7;">
      <v-toolbar color="primary" density="comfortable" class="admin-booking-toolbar">
        <v-btn icon @click="closeDialog" title="關閉">
          <v-icon>mdi-close</v-icon>
        </v-btn>
        <v-icon class="mr-2" size="22">mdi-calendar-plus</v-icon>
        <v-toolbar-title class="d-flex align-center flex-wrap ga-1 admin-booking-title">
          <span class="font-weight-bold">後台新增預約</span>
          <template v-for="(p, i) in dialogTitleParts" :key="`tt-${i}`">
            <span class="title-sep">·</span>
            <span class="title-part">{{ p }}</span>
          </template>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-chip color="white" variant="flat" size="small" class="text-primary font-weight-bold mr-2 d-none d-sm-inline-flex">
          步驟 {{ step }} / {{ stepLabels.length }}
        </v-chip>
      </v-toolbar>

      <!-- Step Indicator (水平 pill 列) -->
      <div class="admin-booking-stepper px-3 py-2">
        <div class="d-flex align-center justify-center flex-wrap ga-2">
          <div
            v-for="(label, idx) in stepLabels"
            :key="`step-pill-${idx}`"
            class="step-pill"
            :class="{ 'is-active': step === idx + 1, 'is-done': step > idx + 1 }"
          >
            <v-icon size="16" v-if="step > idx + 1" class="mr-1">mdi-check-circle</v-icon>
            <span v-else class="step-num">{{ idx + 1 }}</span>
            <span class="step-label">{{ label }}</span>
          </div>
        </div>
      </div>

      <v-card-text>
        <v-window v-model="step" :touch="false">
          <v-window-item :value="1">
            <v-container>
              <v-row justify="center">
                <v-col cols="12" md="10" lg="8">
                        <v-card class="pa-4 pa-md-6">

                  <div class="step-section-header mb-4">
                    <v-icon class="mr-2" color="primary">mdi-home-search-outline</v-icon>
                    <span class="text-h6 font-weight-bold">選擇戶別</span>
                  </div>

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
                             <v-list-item title="買方身分證(驗證碼)" :subtitle="selectedHouseholdDetails.buyerIdNumber || '無'"></v-list-item>
                          </v-list>
                        </v-card>
                      </v-col>
                      <v-col cols="12" md="6">
                         <v-card variant="outlined">
                          <v-card-title class="text-subtitle-1">{{ selectedHouseholdDetails.unitId }}批次與文件</v-card-title>
                           <v-list density="compact">
                            <!-- 動態依該建案 availableBookingTypes 逐一顯示批次（取代寫死的初驗 / 複驗 / 對保） -->
                            <v-list-item
                              v-for="type in availableBookingTypes"
                              :key="`batch-row-${type}`"
                            >
                              <v-list-item-title>{{ type }}批次</v-list-item-title>
                              <template v-if="householdBatchByType[type]?.code">
                                <div v-if="householdBatchByType[type]?.statusText" class="text-body-2 text-medium-emphasis">
                                  {{ householdBatchByType[type].code }} /
                                  <v-chip :color="householdBatchByType[type].color" size="x-small" label class="ml-1">{{ householdBatchByType[type].statusText }}</v-chip>
                                  <div class="text-caption mt-1">{{ householdBatchByType[type].range }}</div>
                                </div>
                                <div v-else class="text-caption text-error">
                                  批次代碼 {{ householdBatchByType[type].code }}：查無此批次設定
                                </div>
                              </template>
                              <div v-else class="text-caption text-error">尚未指派批次</div>
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
                  <div class="step-section-header mb-4">
                    <v-icon class="mr-2" color="primary">mdi-form-textbox</v-icon>
                    <span class="text-h6 font-weight-bold">填寫預約資訊</span>
                  </div>
                  <v-form ref="step2FormRef">
                    <v-row dense>
                      <v-col cols="12" sm="6">
                        <v-select label="預約項目" :items="availableBookingTypes" v-model="formStep2.bookingType" variant="outlined" :rules="[v => !!v || '必填']"></v-select>
                      </v-col>
                       <v-col cols="12" sm="6">
                        <v-select label="選擇方式" :items="availableInspectionMethods" v-model="formStep2.inspectionMethod" variant="outlined" :rules="[v => !!v || '必填']" no-data-text="請先選擇預約項目"></v-select>
                      </v-col>
                      <!-- 新增：子選項選擇 -->
                      <v-col v-if="availableSubOptions.length > 0" cols="12" sm="6">
                        <v-select label="請選擇項目" :items="availableSubOptions" v-model="formStep2.subOption" variant="outlined" :rules="[v => !!v || '此項為必填']"></v-select>
                      </v-col>
                      <!-- 動態自訂欄位 - 使用 DynamicFormRenderer 支持各種欄位類型 -->
                      <template v-if="currentCustomFields.length > 0">
                        <v-col cols="12">
                          <DynamicFormRenderer
                            :fields="currentCustomFields"
                            v-model="dynamicFormData"
                          />
                        </v-col>
                      </template>
                    </v-row>

                    <!-- 屋主本人是否到場 (依據 askOwnerPresence 設定) -->
                    <v-card v-if="adminShowOwnerPresenceQuestion" variant="tonal" color="warning" class="my-4">
                      <v-card-text>
                        <div class="text-subtitle-1 font-weight-bold mb-2">請問本人是否到場?</div>
                        <v-radio-group v-model="formStep2.isOwnerPresent" inline hide-details>
                          <v-radio label="是 (本人到場)" :value="true" color="primary"></v-radio>
                          <v-radio label="否 (委託或授權)" :value="false" color="error"></v-radio>
                        </v-radio-group>
                      </v-card-text>
                    </v-card>

                    <!-- 受託人資訊 (依據 adminShowAuthFields 判斷) -->
                    <v-row v-if="adminShowAuthFields" dense class="mt-2">
                      <v-col cols="12">
                        <v-alert type="info" variant="tonal" density="compact" class="mb-2">委託驗屋 - 請填寫受託人資訊</v-alert>
                      </v-col>
                      <v-col cols="12" sm="4"><v-text-field label="受託人姓名" v-model="formStep2.agentName" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                      <v-col cols="12" sm="4"><v-text-field label="受託人電話" v-model="formStep2.agentPhone" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field></v-col>
                      <v-col cols="12" sm="4">
                        <v-select
                          label="與委託人關係"
                          v-model="formStep2.agentRelationship"
                          :items="['配偶', '父母', '子女', '兄弟姊妹', '朋友', '其他']"
                          variant="outlined"
                          :rules="[v => !!v || '必填']"
                        ></v-select>
                      </v-col>
                      <v-col v-if="formStep2.agentRelationship === '其他'" cols="12" sm="4">
                        <v-text-field label="請輸入關係" v-model="formStep2.agentRelationshipOther" variant="outlined" :rules="[v => !!v || '必填']"></v-text-field>
                      </v-col>
                      <v-col cols="12" sm="4"><v-text-field label="受託人身分證" v-model="formStep2.agentIdNumber" variant="outlined"></v-text-field></v-col>
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
                    <div class="step-section-header mb-4">
                      <v-icon class="mr-2" color="primary">mdi-check-decagram-outline</v-icon>
                      <span class="text-h6 font-weight-bold">確認預約資訊</span>
                    </div>
                    
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
                      <v-list-item v-if="finalBookingData.subOption" title="子選項" :subtitle="finalBookingData.subOption"></v-list-item>
                      <template v-for="field in currentCustomFields" :key="field.id">
                        <v-list-item v-if="dynamicFormData[field.id]" :title="field.label" :subtitle="dynamicFormData[field.id]"></v-list-item>
                      </template>
                      <template v-if="adminShowAuthFields">
                        <v-list-item title="受託人姓名" :subtitle="finalBookingData.agentName"></v-list-item>
                        <v-list-item title="受託人電話" :subtitle="finalBookingData.agentPhone"></v-list-item>
                        <v-list-item title="與委託人關係" :subtitle="finalBookingData.agentRelationship"></v-list-item>
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
          <v-divider class="my-3"></v-divider>
          <CancelNotifyPicker v-if="isCancelConfirmDialogVisible && eventToCancel.id"
            :project-id="eventToCancel.projectId || props.projectId"
            :appointment-id="eventToCancel.id"
            v-model="cancelNotifySelection" />
        </v-card-text>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCancelConfirmDialogVisible = false">返回</v-btn>
          <v-btn color="error" variant="flat" :loading="isCancelling" :disabled="!cancelNotifySelection.ready" @click="handleConfirmCancelBooking">確定取消</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

<v-dialog v-model="isBlockingDialogVisible" max-width="500px" persistent>
      <v-card v-if="blockingAppointmentDetails">
        <v-card-title class="text-h6 d-flex align-center bg-error">
          <v-icon start color="white">mdi-alert-circle-outline</v-icon>
          <span>請確認操作</span>
        </v-card-title>
        <v-card-text class="pt-4 text-body-1">
          <p>您選擇的「<strong>{{ blockingAppointmentDetails.bookingType }}</strong>」已有一筆進行中的預約。</p>
          <p class="mt-4">詳細資訊如下：</p>
          <v-list density="compact" class="bg-red-lighten-5 rounded mt-2">
            <v-list-item
              :title="blockingAppointmentDetails.bookerName"
              :subtitle="blockingAppointmentDetails.unitId"
              prepend-icon="mdi-account-clock-outline"
            ></v-list-item>
            <v-list-item
              :title="blockingAppointmentDetails.appointmentDate?.toLocaleDateString()"
              :subtitle="blockingAppointmentDetails.appointmentTimeSlot"
              prepend-icon="mdi-calendar-clock-outline"
            ></v-list-item>
          </v-list>
          <p class="mt-4 font-weight-bold">您確定要為【{{ blockingAppointmentDetails.unitId }}】再新增一筆預約嗎？</p>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="handleCancelBlocking">取消</v-btn>
          <v-btn color="error" variant="flat" @click="handleConfirmBlocking">繼續新增</v-btn>
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
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue';
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
import CancelNotifyPicker from '@/components/CancelNotifyPicker.vue';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, required: true },
  // [新增] 開啟時若帶入此戶號，會自動完成步驟一的戶別選取，直接進入後續步驟
  preselectedUnitId: { type: String, default: '' },
});

const emit = defineEmits(['update:modelValue', 'booking-success']);

const userStore = useUserStore();
const projectStore = useProjectStore();

const isCancelConfirmDialogVisible = ref(false);
const eventToCancel = ref(null);
const isCancelling = ref(false);
// 取消通知信收件對象勾選結果（由 CancelNotifyPicker 以 v-model 回傳）
const cancelNotifySelection = ref({ ready: false, toBooker: false, cc: [] });
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
  subOption: null, // 新增：第三層子選項
  inspectionCompanyName: '',
  agentName: '',
  agentPhone: '',
  agentIdNumber: '',
  agentRelationship: '',
  agentRelationshipOther: '',
  isOwnerPresent: null,
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
        return config.bookingMenu.filter(item => !item.deleted).map(item => item.title);
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
        const menuItem = config.bookingMenu.find(item => item.title === selectedType && !item.deleted);
        if (menuItem && menuItem.methods) {
            return menuItem.methods.filter(m => !m.deleted).map(m => m.title);
        }
    }

    // 2. 回退到全域設定
    return config.bookingMethodOptions || [];
});

// 新增：子選項 computed（比照 BookingPage 邏輯）
const availableSubOptions = computed(() => {
  const config = currentProjectConfig.value;
  const selectedType = formStep2.bookingType;
  const selectedMethod = formStep2.inspectionMethod;
  if (!config?.bookingMenu?.length || !selectedType || !selectedMethod) return [];

  const menuItem = config.bookingMenu.find(item => item.title === selectedType && !item.deleted);
  if (!menuItem?.methods) return [];

  const methodObj = menuItem.methods.find(m => m.title === selectedMethod && !m.deleted);
  if (methodObj && methodObj.subOptions && Array.isArray(methodObj.subOptions) && methodObj.subOptions.length > 0) {
    return methodObj.subOptions;
  }
  return [];
});

// 根據選中的 inspectionMethod 動態取得 customFields
const currentCustomFields = computed(() => {
  const config = currentProjectConfig.value;
  const selectedType = formStep2.bookingType;
  const selectedMethod = formStep2.inspectionMethod;
  if (!config?.bookingMenu || !selectedType || !selectedMethod) return [];

  const menuItem = config.bookingMenu.find(item => item.title === selectedType && !item.deleted);
  if (!menuItem?.methods) return [];

  const method = menuItem.methods.find(m => m.title === selectedMethod && !m.deleted);
  if (!method?.customFields) return [];

  return method.customFields.filter(cf => !cf.deleted);
});

// 動態欄位的表單資料
const dynamicFormData = reactive({});

// 當選擇方式改變時，重置動態欄位與受託人資料
watch(() => formStep2.inspectionMethod, () => {
  // 重置子選項
  formStep2.subOption = null;
  // 清空舊的動態資料
  Object.keys(dynamicFormData).forEach(key => delete dynamicFormData[key]);
  // 初始化新的動態欄位
  currentCustomFields.value.forEach(field => {
    dynamicFormData[field.id] = '';
  });
  // 重置受託人與問答狀態
  formStep2.agentName = '';
  formStep2.agentPhone = '';
  formStep2.agentIdNumber = '';
  formStep2.agentRelationship = '';
  formStep2.agentRelationshipOther = '';
  formStep2.isOwnerPresent = null;
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
  cancelNotifySelection.value = { ready: false, toBooker: false, cc: [] };
  isCancelConfirmDialogVisible.value = true;
}

async function handleConfirmCancelBooking() {
    isCancelling.value = true;
    try {
        await cancelAppointment(
            eventToCancel.value.id,
            eventToCancel.value.projectId,
            eventToCancel.value.unitId,
            eventToCancel.value.bookingType,
            { toBooker: cancelNotifySelection.value.toBooker, cc: cancelNotifySelection.value.cc }
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

function handleConfirmBlocking() {
  isBlockingDialogVisible.value = false;
  // 使用者選擇繼續，保留目前的預約項目選擇
}

function handleCancelBlocking() {
  isBlockingDialogVisible.value = false;
  formStep2.bookingType = null;
  blockingAppointmentDetails.value = null; // 清除已儲存的物件
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

// 取得戶別對應某 type 的批次代碼（優先 customBatches、再 fallback 到初驗/複驗的固定欄位）
// Toolbar 動態標題與步驟指示器
const stepLabels = ['選擇戶別', '填寫預約資訊', '確認送出'];
const dialogTitleParts = computed(() => {
    const parts = [];
    if (projectName.value) parts.push(projectName.value);
    const unitId = selectedHouseholdDetails.value?.unitId || formStep1.unitId;
    if (unitId) parts.push(unitId);
    const buyerName = selectedHouseholdDetails.value?.buyerName;
    if (buyerName) parts.push(buyerName);
    return parts;
});

const _resolveBatchCodeForType = (type) => {
    const h = selectedHouseholdDetails.value;
    if (!h) return null;
    const custom = h.customBatches?.[type];
    if (custom) return custom;
    if (type === '初驗') return h.initialInspectionBatch || null;
    if (type === '複驗') return h.reInspectionBatch || null;
    return null;
};

// 依 type + code 在 allBatchDetails 中找到批次資料（含舊系統相容查找）
const _resolveBatchInfo = (type, code) => {
    if (!type || !code) return null;
    const group = allBatchDetails.value?.[type];
    let info = group?.[code] || group?.[String(code)] || null;
    if (!info && group) {
        info = Object.values(group).find(item => String(item?.batchCode) === String(code)) || null;
    }
    // 對保/交屋等舊資料可能存在「複驗」群組底下
    if (!info && type !== '複驗' && allBatchDetails.value?.['複驗']) {
        const fallbackGroup = allBatchDetails.value['複驗'];
        info = fallbackGroup[code] || fallbackGroup[String(code)] || null;
    }
    return info;
};

// 依 availableBookingTypes 動態算出每個 type 的批次代碼與批次資料（取代舊的初驗 / 動態複驗硬編碼）
const householdBatchByType = computed(() => {
    const result = {};
    if (!selectedHouseholdDetails.value) return result;
    const types = availableBookingTypes.value || [];
    for (const type of types) {
        const code = _resolveBatchCodeForType(type);
        if (!code) {
            result[type] = { code: null, info: null };
            continue;
        }
        const info = _resolveBatchInfo(type, code);
        result[type] = info
            ? { code, info, statusText: info.statusText || '', color: info.color || 'primary', range: `${info.bookingStart} ~ ${info.bookingEnd}` }
            : { code, info: null };
    }
    return result;
});

// 判斷後台是否需要顯示「本人是否到場」問答
const adminShowOwnerPresenceQuestion = computed(() => {
  const config = currentProjectConfig.value;
  const selectedType = formStep2.bookingType;
  const selectedMethod = formStep2.inspectionMethod;
  if (!config?.bookingMenu?.length || !selectedType || !selectedMethod) return false;
  const menuItem = config.bookingMenu.find(item => item.title === selectedType && !item.deleted);
  if (!menuItem?.methods) return false;
  const methodObj = menuItem.methods.find(m => m.title === selectedMethod && !m.deleted);
  return !!(methodObj && methodObj.askOwnerPresence);
});

// 判斷後台是否需要顯示受託人欄位
const adminShowAuthFields = computed(() => {
  const config = currentProjectConfig.value;
  const selectedType = formStep2.bookingType;
  const selectedMethod = formStep2.inspectionMethod;
  if (!config?.bookingMenu?.length || !selectedType || !selectedMethod) return false;
  const menuItem = config.bookingMenu.find(item => item.title === selectedType && !item.deleted);
  if (!menuItem?.methods) return false;
  const methodObj = menuItem.methods.find(m => m.title === selectedMethod && !m.deleted);
  if (!methodObj?.triggerAuthFlow) return false;
  // 若有問答 → 回答「否」才顯示；若無問答 → 直接顯示
  if (adminShowOwnerPresenceQuestion.value) {
    return formStep2.isOwnerPresent === false;
  }
  return true;
});

const finalBookingData = computed(() => {
    const timeSlotValue = typeof formStep2.appointmentTimeSlot === 'object'
        ? formStep2.appointmentTimeSlot?.value
        : formStep2.appointmentTimeSlot;

    const agentRel = formStep2.agentRelationship === '其他'
      ? formStep2.agentRelationshipOther
      : formStep2.agentRelationship;

    return {
        unitId: formStep1.unitId,
        address: selectedHouseholdDetails.value?.address || '',
        ...formStep2,
        agentRelationship: agentRel || '',
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
        bookingType: null, inspectionMethod: null, subOption: null, inspectionCompanyName: '',
        agentName: '', agentPhone: '', agentIdNumber: '',
        agentRelationship: '', agentRelationshipOther: '', isOwnerPresent: null,
        bookerName: '', bookerPhone: '', bookerEmail: '', bookerIdNumber: '',
        appointmentDate: new Date(), appointmentTimeSlot: null,
        manualTimeSlot: '',
    });
    calendarData.value = [];
    dateSelectionAlert.show = false;    
    availableTimeSlots.value = [];
    isOverbooking.value = false;
};

watch(() => formStep2.bookingType, (newVal) => {
  // 重置選擇方式與子選項，修正 BUG
  formStep2.inspectionMethod = null;
  formStep2.subOption = null;
  formStep2.inspectionCompanyName = '';

  if (!newVal) return;

  const blockingAppt = appointmentHistory.value.find(
    appt => appt.bookingType === newVal && appt.status === '預約中'
  );

  if (blockingAppt) {
    blockingAppointmentDetails.value = blockingAppt; // 儲存整個物件
    isBlockingDialogVisible.value = true;
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
                // 動態欄位寫入
                bookingMethodDetails: { ...dynamicFormData },
                bookingMethodDetailsDisplay: currentCustomFields.value
                  .filter(cf => dynamicFormData[cf.id])
                  .map(cf => ({ label: cf.label, value: dynamicFormData[cf.id] })),
                appointmentDate: formStep2.appointmentDate ? format(formStep2.appointmentDate, 'yyyy-MM-dd') : null,
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
watch(() => props.modelValue, async (newVal) => {
    if (newVal) {
        // 當對話框打開時，載入初始資料
        await loadInitialData();
        // [新增] 若有預先指定的戶號，自動完成步驟一的戶別選擇，直接進入後續流程
        if (props.preselectedUnitId) {
            const exists = allProjectHouseholds.value.some(h => h.unitId === props.preselectedUnitId);
            if (exists) {
                await selectHouseholdFromSearch({ unitId: props.preselectedUnitId });
            }
        }
    } else {
        // 當對話框關閉時，重置所有狀態
        resetState();
    }
}, { immediate: true });

</script>


<style scoped>
/* ─────────── 後台新增預約對話框 視覺優化 ─────────── */
.admin-booking-toolbar :deep(.v-toolbar__content) {
  padding-left: 8px;
  padding-right: 8px;
}
.admin-booking-title {
  font-size: 1rem;
  letter-spacing: 0;
  min-width: 0;
}
.admin-booking-title .title-sep {
  opacity: 0.55;
  margin: 0 2px;
}
.admin-booking-title .title-part {
  opacity: 0.92;
  font-weight: 500;
}

/* Step Indicator */
.admin-booking-stepper {
  background: linear-gradient(180deg, rgba(33, 150, 243, 0.10) 0%, rgba(245, 245, 247, 0) 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}
.step-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  background: #ffffff;
  color: #757575;
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
  user-select: none;
}
.step-pill .step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #ffffff;
  font-size: 0.75rem;
  font-weight: 700;
}
.step-pill.is-done {
  background: rgba(76, 175, 80, 0.10);
  border-color: rgba(76, 175, 80, 0.45);
  color: #2e7d32;
}
.step-pill.is-active {
  background: #1976d2;
  border-color: #1976d2;
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(25, 118, 210, 0.35);
}
.step-pill.is-active .step-num {
  background: #ffffff;
  color: #1976d2;
}
.step-pill .step-label {
  white-space: nowrap;
}
@media (max-width: 600px) {
  .step-pill .step-label { display: none; }
  .step-pill { padding: 6px 10px; }
}

/* 各 step 內部標題列（與 toolbar / stepper 視覺一致） */
.step-section-header {
  display: flex;
  align-items: center;
  padding-bottom: 8px;
  border-bottom: 2px solid rgba(25, 118, 210, 0.18);
}

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