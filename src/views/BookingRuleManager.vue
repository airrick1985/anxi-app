<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center text-h5 text-primary">

        <v-tooltip text="返回預約總表" location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-arrow-left"
              variant="text"
              class="mr-2"
              @click="goBack"
            ></v-btn>
          </template>
        </v-tooltip>

        <v-icon start>mdi-cogs</v-icon>
        <span>預約批次管理：{{ projectName || '讀取中...' }}</span> 
      </v-card-title>
      <v-divider></v-divider>
      
      <div v-if="isLoading" class="text-center pa-10">
        </div>
      <div v-else>
      
        <v-divider></v-divider>
        <v-window v-model="activeTab">
          <v-window-item value="batches" class="pa-4">
            
            <v-toolbar flat color="transparent">
             <v-text-field
                v-model="searchQuery"
                label="搜尋..."
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                flat
                density="compact"
                hide-details
                clearable
                class="mr-4"
                style="max-width: 350px;"
              ></v-text-field>

              <v-spacer></v-spacer>
              <v-btn color="primary" @click="openBatchDialog()" prepend-icon="mdi-plus">新增批次</v-btn>
            </v-toolbar>

            <v-data-table
              :headers="batchHeaders"
              :items="processedBookingBatches" 
              :loading="isBatchLoading"
              :search="searchQuery"  
              item-value="id"
              class="elevation-1"
            >
              <template v-slot:item.applicationWindow="{ item }">
                <div v-if="item.applicationStart && item.applicationEnd">
                  <div class="d-flex align-center">
                    <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label class="mr-1 font-weight-bold">起</v-chip>
                    <span>{{ formatDisplayDateTime(item.applicationStart) }}</span>
                  </div>
                  <div class="d-flex align-center mt-1">
                    <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label class="mr-1 font-weight-bold">迄</v-chip>
                    <span>{{ formatDisplayDateTime(item.applicationEnd) }}</span>
                  </div>
                </div>
                <span v-else class="text-grey">未設定</span>
              </template>
              <template v-slot:item.bookingWindow="{ item }">
                <div>
                    <div class="d-flex align-center">
                    <v-chip size="x-small" color="teal-lighten-3" text-color="teal-darken-4" label class="mr-1 font-weight-bold">起</v-chip>
                    <span>{{ item.bookingStart }}</span>
                  </div>
                  <div class="d-flex align-center mt-1">
                    <v-chip size="x-small" color="pink-lighten-3" text-color="pink-darken-4" label class="mr-1 font-weight-bold">迄</v-chip>
                    <span>{{ item.bookingEnd }}</span>
                  </div>
                </div>
              </template>

              <template v-slot:item.statusText="{ item }">
                <v-chip :color="getBatchStatus(item).color" size="small">
                  {{ item.statusText }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                  <v-btn
                    icon="mdi-eye"
                    variant="text"
                    color="info"
                    size="small"
                    class="mr-1"
                    @click="openPreviewDialog(item)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    color="primary"
                    size="small"
                    class="mr-1"
                    @click="openBatchDialog(item)"
                  ></v-btn>
                
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="openDeleteDialog(item)"
                ></v-btn>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </div>
    </v-card>

      <v-dialog v-model="isPreviewDialogVisible" max-width="800px">
        <v-card v-if="batchToPreview">
          <v-card-title class="d-flex align-center primary-bg">
            <v-icon start>mdi-calendar-search</v-icon>
            <span>預覽批次設定</span>
            <v-spacer></v-spacer>
            <v-btn variant="text" icon="mdi-close" @click="isPreviewDialogVisible = false"></v-btn>
          </v-card-title>
          
          <v-card-subtitle class="pa-3 bg-grey-lighten-4">
            <strong>{{ projectName }}</strong> / 「<strong>{{ batchToPreview.bookingType }}</strong>」批次 - <strong>{{ batchToPreview.batchCode }}</strong>
          </v-card-subtitle>
          
          <v-divider></v-divider>

          <v-card-text style="max-height: 70vh; overflow-y: auto;">
            <div v-if="isPreviewLoading" class="text-center pa-8">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <p class="mt-2 text-grey-darken-1">正在讀取規則...</p>
            </div>
            
            <div v-else>
              <div v-if="Object.keys(previewData).length === 0" class="text-center pa-8 text-grey-darken-1">
                <v-icon size="48">mdi-calendar-remove-outline</v-icon>
                <p class="mt-2">此批次未設定「可驗屋區間」。</p>
              </div>

              <v-list v-else lines="two">
                <template v-for="(dayData, date) in previewData" :key="date">
                  <v-list-subheader class="font-weight-bold text-primary">{{ formatDateWithWeekday(date) }}</v-list-subheader>
                  <v-list-item>
                    <div v-if="dayData.length > 0">
                      <div v-for="slot in dayData" :key="slot.time" class="mb-2">
                         <v-chip color="indigo" variant="tonal" label class="mb-1">
                            <v-icon start>mdi-clock-time-four-outline</v-icon>
                            <strong>{{ slot.time }}</strong>
                            <v-divider vertical class="mx-2"></v-divider>
                            <span class="font-weight-regular">{{ slot.capacity }} 名</span>
                         </v-chip>
                         <div class="pl-2 d-flex flex-wrap ga-2">
                             <v-chip
                                    v-for="method in allMethodOptions"
                                    :key="method"
                                    :variant="slot.methods.includes(method) ? 'elevated' : 'outlined'"
                                    :color="slot.methods.includes(method) ? 'green' : 'grey'"
                                    size="x-small"
                                    label
                                  >
                                    {{ method }}
                                  </v-chip>
                            <span v-if="slot.methods.length === 0" class="text-caption text-grey">未指定方式</span>
                         </div>
                      </div>
                    </div>
                    <div v-else class="text-grey-darken-1">
                      <v-icon size="small" class="mr-1">mdi-calendar-blank-outline</v-icon>
                      <span>無設定時段</span>
                    </div>
                  </v-list-item>
                  <v-divider class="mt-2"></v-divider>
                </template>
              </v-list>
              </div>
          </v-card-text>
          
          <v-card-actions class="bg-grey-lighten-5 pa-3">
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="tonal" @click="isPreviewDialogVisible = false">關閉</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>                                                      

      <v-dialog v-model="isDeleteDialogVisible" max-width="500px" persistent>
        <v-card v-if="batchToDelete">
          <v-card-title class="text-h6 d-flex align-center bg-red-lighten-4">
            <v-icon start color="red-darken-2">mdi-alert-circle-outline</v-icon>
            確認刪除批次
          </v-card-title>
          <v-card-text class="pt-4">
            您確定要永久刪除「<strong>{{ batchToDelete.bookingType }}</strong>」批次「<strong>{{ batchToDelete.batchCode }}</strong>」嗎？
            
            <v-divider class="my-3"></v-divider>

            <div v-if="isDeleteDatesLoading" class="text-center pa-4">
              <v-progress-circular indeterminate color="grey"></v-progress-circular>
              <p class="text-caption mt-2">正在讀取相關日期...</p>
            </div>
            <div v-else>
              <p v-if="deleteBatchDates.length > 0" class="mb-2">
                此操作將一併刪除以下 <strong>{{ deleteBatchDates.length }}</strong> 天的預約規則：
              </p>
              <p v-else class="text-grey-darken-1">
                此批次目前沒有設定任何可預約日期。
              </p>
              <v-list v-if="deleteBatchDates.length > 0" dense class="border rounded" style="max-height: 600px; overflow-y: auto;">
                <v-list-item v-for="day in deleteBatchDates" :key="day">
                  <v-list-item-title>
                    <span :class="{ 'weekend-highlight': isWeekend(day) }">
                      {{ formatDateWithWeekday(day) }}
                    </span>
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
            <p class="mt-4">此操作無法復原。</p>

          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="grey-darken-1" variant="text" @click="closeDeleteDialog">取消</v-btn>
            <v-btn color="error" variant="flat" :loading="isDeleting" @click="handleConfirmDelete">確定刪除</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

    <v-dialog v-model="isBatchDialogVisible" max-width="1200px" persistent>
      <v-card>
        <v-card-title class="primary-bg">
          <span class="text-h6">{{ editedBatch.id ? '編輯' : '新增' }}預約批次</span>
        </v-card-title>
        <v-card-text style="max-height: 80vh; overflow-y: auto;">
          <v-form ref="batchForm">
                  <v-row>
            <v-col cols="12" sm="6" md="3">
              <v-text-field 
                v-model="editedBatch.batchCode" 
                label="批次代號" 
                :rules="[v => !!v || '必填', batchUniquenessRule]"
                :readonly="!!editedBatch.id"
                :variant="editedBatch.id ? 'filled' : 'outlined'"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6" md="3">
              <v-select 
                v-model="editedBatch.bookingType" 
                :items="bookingTypeOptions" 
                label="預約項目" 
                :rules="[v => !!v || '必填', batchUniquenessRule]"
                :readonly="!!editedBatch.id"
                :variant="editedBatch.id ? 'filled' : 'outlined'"
              ></v-select>
            </v-col>
            
            <v-col v-if="editedBatch.bookingType === '其他'" cols="12" sm="6" md="3">
              <v-text-field
                v-model="customBookingType"
                label="請輸入自訂項目名稱"
                :rules="[v => !!v || '自訂項目為必填', batchUniquenessRule]"
                :readonly="!!editedBatch.id"
                :variant="editedBatch.id ? 'filled' : 'outlined'"
              ></v-text-field>
            </v-col>
          </v-row>
            <v-divider class="my-2"></v-divider>
            <v-row>
              <v-col cols="12" sm="6" md="3">
                <v-menu
                  v-model="menuAppStart"
                  :close-on-content-click="false"
                  location="bottom"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :model-value="formatDisplayDateTime(editedBatch.applicationStart)"
                      label="預約開放起始時間"
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-card min-width="300">
                    <v-tabs v-model="activePickerTabStart" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabStart">
                      <v-window-item :value="0">
                        <v-date-picker 
                          v-model="tempDateStart"
                          @update:model-value="activePickerTabStart = 1"
                          hide-header
                        ></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeStart" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn text @click="menuAppStart = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationStart">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu
                  v-model="menuAppEnd"
                  :close-on-content-click="false"
                  location="bottom"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      :model-value="formatDisplayDateTime(editedBatch.applicationEnd)"
                      label="預約開放結束時間"
                      prepend-inner-icon="mdi-calendar-clock"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                   <v-card min-width="300">
                    <v-tabs v-model="activePickerTabEnd" grow>
                      <v-tab><v-icon start>mdi-calendar</v-icon>日期</v-tab>
                      <v-tab><v-icon start>mdi-clock-outline</v-icon>時間</v-tab>
                    </v-tabs>
                    <v-window v-model="activePickerTabEnd">
                      <v-window-item :value="0">
                        <v-date-picker 
                          v-model="tempDateEnd"
                          @update:model-value="activePickerTabEnd = 1"
                           hide-header
                        ></v-date-picker>
                      </v-window-item>
                      <v-window-item :value="1">
                        <v-time-picker v-model="tempTimeEnd" format="24hr"></v-time-picker>
                      </v-window-item>
                    </v-window>
                    <v-divider></v-divider>
                    <v-card-actions>
                      <v-spacer></v-spacer>
                      <v-btn text @click="menuAppEnd = false">取消</v-btn>
                      <v-btn color="primary" @click="saveApplicationEnd">確定</v-btn>
                    </v-card-actions>
                  </v-card>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                 <v-menu
                  v-model="menuBookingStart"
                  :close-on-content-click="false"
                  location="bottom"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="editedBatch.bookingStart"
                      label="可驗屋起始日"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                       variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="tempBookingStartDate"
                    @update:model-value="menuBookingStart = false"
                    title="選擇起始日"
                    hide-header
                  ></v-date-picker>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="6" md="3">
                <v-menu
                  v-model="menuBookingEnd"
                  :close-on-content-click="false"
                  location="bottom"
                  transition="scale-transition"
                >
                  <template v-slot:activator="{ props }">
                    <v-text-field
                      v-model="editedBatch.bookingEnd"
                      label="可驗屋結束日"
                      prepend-inner-icon="mdi-calendar"
                      readonly
                      v-bind="props"
                      :rules="[v => !!v || '必填']"
                      variant="outlined"
                    ></v-text-field>
                  </template>
                  <v-date-picker
                    v-model="tempBookingEndDate"
                    @update:model-value="menuBookingEnd = false"
                    title="選擇結束日"
                    hide-header
                  ></v-date-picker>
                </v-menu>
              </v-col>
            </v-row>
            </v-form>

          <v-divider class="my-4"></v-divider>
          
          <div v-if="!editedBatch.bookingStart || !editedBatch.bookingEnd">
             <p class="text-center text-grey-darken-1 pa-4">請先設定可驗屋的起訖日期</p>
          </div>
          <v-row v-else>
            <v-col cols="12" md="4">
                <v-date-picker
                v-model="selectedDaysForEditing"
                :min="editedBatch.bookingStart"
                :max="editedBatch.bookingEnd"
                show-adjacent-months
                hide-header
                color="primary"
                class="w-100"
                multiple
              ></v-date-picker>
            </v-col>
            <v-col cols="12" md="8">
              <div v-if="selectedDaysForEditing.length === 0" class="d-flex align-center justify-center h-100 text-grey">
                <div><v-icon size="48">mdi-calendar-cursor</v-icon><p>請從左側日曆選擇一天或多天來設定</p></div>
              </div>
              <div v-else>
                <h3 class="text-h6 mb-4 d-flex justify-space-between align-center">
                  <span v-if="selectedDaysForEditing.length === 1">設定 {{ formatDateWithWeekday(selectedDaysForEditing[0]) }} 的時段</span>
                  <span v-else>批次設定 {{ selectedDaysForEditing.length }} 個已選日期的時段</span>
                  
                  <v-chip v-if="selectedDaysForEditing.length === 1" size="small" :color="isDayConfigured(selectedDaysForEditing[0]) ? 'green' : 'grey'" variant="tonal">
                    {{ isDayConfigured(selectedDaysForEditing[0]) ? '已設定' : '未設定' }}
                  </v-chip>
                </h3>
                
                  <v-combobox
                    v-model="currentDaySlots"
                    :items="timeSlotPresets"
                    :rules="[timeArrayRule]"
                    label="選擇或輸入時段 (例如: 09:00)"
                    chips
                    clearable
                    multiple
                    closable-chips  
                    hint="輸入後按 Enter 新增"
                    persistent-hint
                  ></v-combobox>

                <v-divider class="my-4"></v-divider>
                
                <p class="text-subtitle-1 mb-2">設定各時段名額與可預約方式</p>
                
                <div style="max-height: 400px; overflow-y: auto;" class="pr-2">
                  <div v-if="sortedCurrentDaySlots.length === 0" class="text-center text-grey pa-4">
                      請先在上方輸入時段
                  </div>
                 <v-sheet
                  v-for="slot in sortedCurrentDaySlots"
                  :key="slot"
                  border
                  rounded
                  class="pa-3 mb-3"
                >
                  <div class="d-flex justify-space-between align-center">
                    <span class="font-weight-bold text-h6 text-grey-darken-2">{{ slot }}</span>
                   <v-combobox
                      label="名額"
                      :model-value="getCapacityForSlot(slot)"
                      @update:model-value="setCapacityForSlot(slot, $event)"
                      :items="capacityPresets"
                      type="number"
                      min="0"
                      variant="outlined"
                      density="compact"
                      hide-details
                      style="max-width: 120px;"
                    ></v-combobox>
                  </div>
                  <v-divider class="my-2"></v-divider>
                  <div>
                    <div class="text-caption mb-1 ml-1">可預約方式</div>

                    <div class="d-flex flex-wrap align-center">
                      <v-checkbox
                        :model-value="getSelectAllState(slot).checked"
                        :indeterminate="getSelectAllState(slot).indeterminate"
                        label="全選"
                        density="compact"
                        hide-details
                        class="d-inline-block mr-2 font-weight-bold"
                        @update:model-value="handleSelectAll($event, slot)"
                      ></v-checkbox>

                      <v-divider vertical class="mx-2 d-none d-sm-flex"></v-divider>

                   <v-checkbox
                      v-for="method in allMethodOptions"
                      :key="method"
                      :model-value="isMethodSelectedForSlot(slot, method)"
                      @update:model-value="updateMethodsForSlot(slot, method, $event)"
                      :label="method"
                      density="compact"
                      hide-details
                      class="d-inline-block mr-2"
                    ></v-checkbox>
                    </div>

                  </div>
                </v-sheet>
                </div>
                </div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="isBatchDialogVisible = false">取消</v-btn>
        <v-btn color="success" variant="flat" @click="openConfirmSaveDialog" :loading="isSaving">儲存</v-btn>
      </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="isConfirmSaveDialogVisible" max-width="500px" persistent>
  <v-card v-if="editedBatch">
  <v-card-title class="text-h6 d-flex align-center bg-green-lighten-4">
      <v-icon start>mdi-checkbox-marked-circle-outline</v-icon>
      請確認預約批次日期
    </v-card-title>
    <v-card-text class="pt-4">
      <p class="mb-3">
        您已選擇 <strong>{{ selectedDaysForEditing.length }}</strong> 天：
      </p>
        <v-list dense class="mb-3" style="max-height: 600px; overflow-y: auto;">
        <v-list-item v-for="day in selectedDaysForEditing" :key="day">
          <v-list-item-title>
            <span :class="{ 'weekend-highlight': isWeekend(day) }">
              {{ formatDateWithWeekday(day) }}
            </span>
          </v-list-item-title>
        </v-list-item>
      </v-list>
      <p>
        以上日期將套用
        <strong>{{ editedBatch.bookingType === '其他' ? customBookingType : editedBatch.bookingType }} ({{ editedBatch.batchCode }})</strong>
        的預約批次設定。
      </p>
      <p class="mt-4 font-weight-bold">
        確定要儲存嗎？
      </p>
    </v-card-text>
    <v-card-actions>
      <v-spacer></v-spacer>
      <v-btn color="grey-darken-1" variant="text" @click="isConfirmSaveDialogVisible = false">取消</v-btn>
      <v-btn color="success" variant="flat" :loading="isSaving" @click="confirmAndSaveBatch">確定儲存</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router'; 
import { useProjectStore } from '@/store/projectStore';
import { eachDayOfInterval, parseISO } from 'date-fns';
import {
  saveBookingBatch,
  fetchBookingBatches,
  saveDailyRules, 
  fetchDailyRules, 
  deleteBookingBatch, 
} from '@/api';

// --- Component State ---
const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();
const projectId = ref(route.params.projectId);
const isLoading = ref(false);
const isSaving = ref(false);
const activeTab = ref('batches');
const snackbar = reactive({ show: false, text: '', color: 'success' });
const isBatchLoading = ref(false);
const isBatchDialogVisible = ref(false);
const batchForm = ref(null);
const bookingBatches = ref([]);
const bookingTypeOptions = ref(['初驗', '複驗', '其他']);
const customBookingType = ref('');
const searchQuery = ref('');
const isDeleteDialogVisible = ref(false);
const batchToDelete = ref(null);
const isDeleting = ref(false);

const isPreviewDialogVisible = ref(false);
const batchToPreview = ref(null);
const previewData = ref({});
const isPreviewLoading = ref(false);


// ✅ [新增] 確認儲存的 Dialog 狀態
const isConfirmSaveDialogVisible = ref(false);

// ✅ [新增] 刪除確認 Dialog 用的狀態
const deleteBatchDates = ref([]);
const isDeleteDatesLoading = ref(false);


const allMethodOptions = ['代驗公司', '屋主自驗', '授權驗屋', '設計師陪驗'];

// ✅ [新增] Date Time Picker 相關狀態
const menuAppStart = ref(false);
const menuAppEnd = ref(false);
const menuBookingStart = ref(false);
const menuBookingEnd = ref(false);

const activePickerTabStart = ref(0);
const tempDateStart = ref(null);
const tempTimeStart = ref(null);

const activePickerTabEnd = ref(0);
const tempDateEnd = ref(null);
const tempTimeEnd = ref(null);


const defaultBatch = {
  id: null,
  batchCode: '',
  bookingType: null,
  applicationStart: '', 
  applicationEnd: '',   
  bookingStart: '',     
  bookingEnd: '',       
  dailyRules: {}, 
};
const editedBatch = ref({ ...defaultBatch });
const selectedDaysForEditing = ref([]); 

// --- Computed Properties ---
const projectName = computed(() => projectStore.idToNameMap[projectId.value] || '');
const batchHeaders = [
  { title: '批次代號', key: 'batchCode' },
  { title: '預約項目', key: 'bookingType' },
  { title: '預約開放區間', key: 'applicationWindow', sortable: false },
  { title: '可驗屋區間', key: 'bookingWindow', sortable: false },
  { title: '狀態', key: 'statusText', sortable: true }, 
  { title: '操作', key: 'actions', sortable: false, align: 'end' },
];

const processedBookingBatches = computed(() => {
  return bookingBatches.value.map(item => ({
    ...item,
    statusText: getBatchStatus(item).text 
  }));
});

// ✅ [新增] Computed property for date-only pickers to handle Date object vs String
const tempBookingStartDate = computed({
    get: () => editedBatch.value.bookingStart ? new Date(editedBatch.value.bookingStart) : null,
    set: (val) => {
        if (val) {
            // 將 Date 物件轉為 YYYY-MM-DD 格式的字串
            const year = val.getFullYear();
            const month = (val.getMonth() + 1).toString().padStart(2, '0');
            const day = val.getDate().toString().padStart(2, '0');
            editedBatch.value.bookingStart = `${year}-${month}-${day}`;
        }
    }
});

const tempBookingEndDate = computed({
    get: () => editedBatch.value.bookingEnd ? new Date(editedBatch.value.bookingEnd) : null,
    set: (val) => {
        if (val) {
            const year = val.getFullYear();
            const month = (val.getMonth() + 1).toString().padStart(2, '0');
            const day = val.getDate().toString().padStart(2, '0');
            editedBatch.value.bookingEnd = `${year}-${month}-${day}`;
        }
    }
});

// ✅ 【新增】提供給 v-combobox 的快選名額選項
const capacityPresets = Array.from({ length: 9 }, (_, i) => i + 1);

const timeSlotPresets = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return [`${hour}:00`, `${hour}:30`];
}).flat().slice(18, 35); 


const timeArrayRule = (values) => {
  const pattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const isValid = values.every(v => pattern.test(v));
  if (!isValid) {
    return '格式錯誤，請移除不符合 HH:MM 格式的項目';
  }
  return true;
};

// --- Functions for Daily Rule Editing ---
const currentDaySlots = computed({
  get() {
    if (selectedDaysForEditing.value.length === 0) return [];
    const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
    const slots = editedBatch.value.dailyRules[firstDateKey]?.slots || {};
    return Object.keys(slots);
  },
  set(newSlots) {
    if (selectedDaysForEditing.value.length === 0) return;

    selectedDaysForEditing.value.forEach(day => {
        const dateKey = formatDate(day);
        if (!editedBatch.value.dailyRules[dateKey]) {
            editedBatch.value.dailyRules[dateKey] = { slots: {} };
        }
        
        const oldSlotsData = editedBatch.value.dailyRules[dateKey].slots;
        const newSlotsData = {};

        newSlots.forEach(slot => {
            newSlotsData[slot] = oldSlotsData[slot] || { capacity: 0, methods: [] };
        });
        editedBatch.value.dailyRules[dateKey].slots = newSlotsData;
    });
  }
});

const sortedCurrentDaySlots = computed(() => [...currentDaySlots.value].sort());


function getCapacityForSlot(slot) {
  if (selectedDaysForEditing.value.length === 0) return 0;
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.capacity || 0;
}

function setCapacityForSlot(slot, capacity) {
  const cap = Number(capacity) || 0;
  selectedDaysForEditing.value.forEach(day => {
    const dateKey = formatDate(day);
    const slots = editedBatch.value.dailyRules[dateKey]?.slots;
    if (slots && slots[slot]) {
      slots[slot].capacity = cap;
    }
  });
}

function isMethodSelectedForSlot(slot, method) {
    if (selectedDaysForEditing.value.length === 0) return false;
    const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
    return editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods.includes(method) || false;
}

function updateMethodsForSlot(slot, method, isSelected) {
 selectedDaysForEditing.value.forEach(day => {
  const dateKey = formatDate(day);
  const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
  if (!daySlot || !daySlot.methods) return;

  const methods = daySlot.methods;
  const index = methods.indexOf(method);

  if (isSelected && index === -1) {
   daySlot.methods = [...methods, method];
  } else if (!isSelected && index > -1) {
   daySlot.methods = methods.filter(m => m !== method);
  }
 });
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

const isDayConfigured = (day) => {
    const dateKey = formatDate(day);
    const slots = editedBatch.value.dailyRules[dateKey]?.slots;
    return slots && Object.keys(slots).length > 0;
}

const batchUniquenessRule = (value) => {
  const currentCode = value;
  const currentType = editedBatch.value.bookingType === '其他' 
    ? customBookingType.value 
    : editedBatch.value.bookingType;

  if (!currentCode || !currentType) {
    return true;
  }
  
  const isDuplicate = bookingBatches.value.some(batch => {
    if (editedBatch.value.id && batch.id === editedBatch.value.id) {
      return false;
    }
    return batch.bookingType === currentType && batch.batchCode === currentCode;
  });

  if (isDuplicate) {
    return `「${currentType}」項目已存在相同的批次代號`;
  }
  return true;
};

// --- Main Functions ---
function formatDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(date).split('T')[0];
}

function formatDateWithWeekday(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  const weekday = new Intl.DateTimeFormat('zh-TW', { weekday: 'short' }).format(date);
  return `${dateString} (${weekday})`;
}

function formatDisplayDateTime(dateTimeString) {
  if (!dateTimeString) return '';
  return dateTimeString.replace('T', ' ');
}

// ✅ [新增] 儲存 applicationStart 的值
function saveApplicationStart() {
  if (tempDateStart.value && tempTimeStart.value) {
    // 將 Date 物件轉為 YYYY-MM-DD 格式
    const dateStr = formatDate(tempDateStart.value);
    editedBatch.value.applicationStart = `${dateStr}T${tempTimeStart.value}`;
  }
  menuAppStart.value = false;
}

// ✅ [新增] 儲存 applicationEnd 的值
function saveApplicationEnd() {
  if (tempDateEnd.value && tempTimeEnd.value) {
    const dateStr = formatDate(tempDateEnd.value);
    editedBatch.value.applicationEnd = `${dateStr}T${tempTimeEnd.value}`;
  }
  menuAppEnd.value = false;
}


function getBatchStatus(item) {
  if (!item.applicationStart || !item.applicationEnd) {
    return { text: '時間未設定', color: 'grey-darken-2' };
  }
  
  const now = new Date(); 
  const start = new Date(item.applicationStart);
  const end = new Date(item.applicationEnd);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { text: '日期格式錯誤', color: 'orange' };
  }

  if (now < start) return { text: '尚未開放', color: 'blue-grey' };
  if (now > end) return { text: '已截止', color: 'red-darken-1' };
  return { text: '開放中', color: 'green' };
}

function showSnackbar(text, color = 'success') {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
}

async function openBatchDialog(item = null) {
  customBookingType.value = '';
  if (item) {
    const dailyRules = await fetchDailyRules(item.id);

    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          const capacity = slots[time];
          slots[time] = { capacity: capacity, methods: [] }; 
        }
      }
    }

    editedBatch.value = { ...JSON.parse(JSON.stringify(item)), dailyRules };
    
    const isStandardType = bookingTypeOptions.value.includes(item.bookingType);
    if (!isStandardType) {
      editedBatch.value.bookingType = '其他';
      customBookingType.value = item.bookingType;
    }
  } else {
    editedBatch.value = { ...defaultBatch, dailyRules: {} };
  }
  selectedDaysForEditing.value = []; 
  isBatchDialogVisible.value = true;
}

// ✅ [修改] 原本的儲存函式
async function handleSaveBatch() {
  // const { valid } = await batchForm.value.validate(); // 驗證移到 openConfirmSaveDialog
  // if (!valid) return;
  isSaving.value = true;

  const batchPayload = { ...editedBatch.value };
  
  if (batchPayload.bookingType === '其他') {
    batchPayload.bookingType = customBookingType.value;
  }

  batchPayload.projectId = projectId.value;
  batchPayload.projectName = projectName.value;
  
  try {
    const batchRes = await saveBookingBatch(batchPayload);
    if (batchRes.status !== 'success') throw new Error(batchRes.message);
    const batchId = batchRes.id;

    const rulesRes = await saveDailyRules(batchId, batchPayload.dailyRules);
    if (rulesRes.status !== 'success') throw new Error(rulesRes.message);

    showSnackbar('儲存成功！');
    isConfirmSaveDialogVisible.value = false; // ✅ [新增] 關閉確認 Dialog
    isBatchDialogVisible.value = false;
    bookingBatches.value = await fetchBookingBatches(projectId.value);
  } catch(error) {
    showSnackbar(`儲存失敗: ${error.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}


async function loadDataForProject() {
  isLoading.value = true;
    await projectStore.fetchProjects();
  if (projectName.value) {
    bookingBatches.value = await fetchBookingBatches(projectId.value);
  } else {
    showSnackbar(`錯誤：找不到建案 ID ${projectId.value}`, 'error');
  }
  isLoading.value = false;
}

// ✅ [修改] openDeleteDialog 函式
async function openDeleteDialog(item) {
  batchToDelete.value = item;
  isDeleteDialogVisible.value = true;
  isDeleteDatesLoading.value = true;
  deleteBatchDates.value = []; // 先清空舊資料

  try {
    const dailyRules = await fetchDailyRules(item.id);
    const configuredDates = Object.keys(dailyRules).filter(dateKey => {
      const dayData = dailyRules[dateKey];
      return dayData && dayData.slots && Object.keys(dayData.slots).length > 0;
    }).sort();
    deleteBatchDates.value = configuredDates;
  } catch (error) {
    showSnackbar(`讀取批次日期失敗: ${error.message}`, 'error');
  } finally {
    isDeleteDatesLoading.value = false;
  }
}

// ✅ [修改] closeDeleteDialog 函式
function closeDeleteDialog() {
  batchToDelete.value = null;
  deleteBatchDates.value = []; // 清空日期
  isDeleteDialogVisible.value = false;
}
async function handleConfirmDelete() {
  if (!batchToDelete.value) return;
  isDeleting.value = true;
  try {
    const res = await deleteBookingBatch(batchToDelete.value.id);
    if (res.status !== 'success') throw new Error(res.message);

    const index = bookingBatches.value.findIndex(b => b.id === batchToDelete.value.id);
    if (index > -1) {
      bookingBatches.value.splice(index, 1);
    }
    
    showSnackbar('批次已成功刪除');
    closeDeleteDialog();
  } catch (error) {
    showSnackbar(`刪除失敗: ${error.message}`, 'error');
  } finally {
    isDeleting.value = false;
  }
}

async function openPreviewDialog(item) {
  batchToPreview.value = item;
  isPreviewDialogVisible.value = true;
  isPreviewLoading.value = true;
  try {
    const dailyRules = await fetchDailyRules(item.id);

    for (const date in dailyRules) {
      const slots = dailyRules[date].slots;
      for (const time in slots) {
        if (typeof slots[time] === 'number') {
          const capacity = slots[time];
          slots[time] = { capacity: capacity, methods: [] };
        }
      }
    }
    
    const formattedData = {};
    if (item.bookingStart && item.bookingEnd) {
      const intervalDates = eachDayOfInterval({
        start: parseISO(item.bookingStart),
        end: parseISO(item.bookingEnd)
      });

      for (const dateObj of intervalDates) {
        const dateKey = formatDate(dateObj); 
        const ruleForDay = dailyRules[dateKey];
        const slotsData = [];
        if (ruleForDay && ruleForDay.slots) {
          for (const time of Object.keys(ruleForDay.slots).sort()) {
            const slotInfo = ruleForDay.slots[time];
            slotsData.push({
              time: time,
              capacity: slotInfo.capacity || 0,
              methods: slotInfo.methods || []
            });
          }
        }
        formattedData[dateKey] = slotsData;
      }
    }
    
    previewData.value = formattedData;

  } catch (error) {
    showSnackbar(`讀取預覽資料失敗: ${error.message}`, 'error');
  } finally {
    isPreviewLoading.value = false;
  }
}

function handleSelectAll(isChecked, slot) {
 selectedDaysForEditing.value.forEach(day => {
  const dateKey = formatDate(day);
  const daySlot = editedBatch.value.dailyRules[dateKey]?.slots?.[slot];
  if (!daySlot) return;

  if (isChecked) {
   daySlot.methods = [...allMethodOptions];
  } else {
   daySlot.methods = [];
  }
 });
  
  editedBatch.value.dailyRules = { ...editedBatch.value.dailyRules };
}

function getSelectAllState(slot) {
  if (selectedDaysForEditing.value.length === 0) return { checked: false, indeterminate: false };
  
  const firstDateKey = formatDate(selectedDaysForEditing.value[0]);
  const methodsArray = editedBatch.value.dailyRules[firstDateKey]?.slots?.[slot]?.methods;
  if (!methodsArray) return { checked: false, indeterminate: false };

  const selectedCount = methodsArray.length;
  const totalCount = allMethodOptions.length;

  return {
    checked: selectedCount === totalCount,
    indeterminate: selectedCount > 0 && selectedCount < totalCount,
  };
}

// ✅ [新增] 打開確認 Dialog 的函式
async function openConfirmSaveDialog() {
  const { valid } = await batchForm.value.validate();
  if (!valid) return;
  isConfirmSaveDialogVisible.value = true;
}

// ✅ [新增] 確認後執行的儲存函式
async function confirmAndSaveBatch() {
  // `handleSaveBatch` 函式現在只處理儲存邏輯，不再做表單驗證
  await handleSaveBatch(); 
}


// ✅ [新增] 判斷是否為週末的函式
function isWeekend(dateInput) {
  if (!dateInput) return false;
  const date = new Date(dateInput);
  const day = date.getDay();
  return day === 0 || day === 6; // 0 是星期日, 6 是星期六
}


function goBack() {
  router.back();
}

onMounted(loadDataForProject);


watch(() => [editedBatch.value.bookingStart, editedBatch.value.bookingEnd], () => {
    selectedDaysForEditing.value = [];
});

watch(() => editedBatch.value.bookingType, (newValue, oldValue) => {
  if (newValue !== oldValue && batchForm.value) {
    batchForm.value.validate();
  }
});

watch(customBookingType, (newValue, oldValue) => {
  if (newValue !== oldValue && batchForm.value) {
    batchForm.value.validate();
  }
});

// ✅ [新增] Watcher for datetime picker initialization
watch(menuAppStart, (isOpen) => {
  if (isOpen) {
    activePickerTabStart.value = 0; // 每次打開都先顯示日期
    if (editedBatch.value.applicationStart) {
      const [datePart, timePart] = editedBatch.value.applicationStart.split('T');
      tempDateStart.value = new Date(datePart);
      tempTimeStart.value = timePart || '09:00';
    } else {
      tempDateStart.value = new Date();
      tempTimeStart.value = '09:00';
    }
  }
});

watch(menuAppEnd, (isOpen) => {
  if (isOpen) {
    activePickerTabEnd.value = 0;
    if (editedBatch.value.applicationEnd) {
      const [datePart, timePart] = editedBatch.value.applicationEnd.split('T');
      tempDateEnd.value = new Date(datePart);
      tempTimeEnd.value = timePart || '17:00';
    } else {
      tempDateEnd.value = new Date();
      tempTimeEnd.value = '17:00';
    }
  }
});


</script>

<style scoped>
.primary-bg {
  background-color: #1a73e8;
  color: white;
}
.v-data-table-header__cell {
    background-color: #f5f5f5;
}

.weekend-highlight {
  color: red;
  font-weight: bold;
}

</style>