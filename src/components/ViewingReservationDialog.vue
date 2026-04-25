<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <div class="flex-grow-1">
          <div class="text-h6">{{ isEdit ? '編輯預約' : '新增賞屋預約' }}</div>
          <!-- ✅ 新增：顯示編輯模式下的建立者信息 -->
          <div v-if="isEdit && formData" class="text-caption opacity-80 mt-1">
            建立者：{{ formData.operatorName || '不詳' }} |
            建立時間：{{ formatDate(formData.createdAt) }}
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="formRef" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <label class="native-dt-label">
                  <v-icon size="18" class="mr-1">mdi-calendar-clock</v-icon>
                  預約時間(必填)
                </label>

                <!-- 已確認的時間顯示 -->
                <div 
                  v-if="formData.reservationTime && !isEditingTime" 
                  class="native-dt-wrapper native-dt-wrapper--filled"
                  @click="startEditTime"
                >
                  <span class="native-dt-display">
                    {{ formatSelectedTime(formData.reservationTime) }}
                  </span>
                  <v-icon size="16" color="grey" class="ml-auto">mdi-pencil</v-icon>
                </div>

                <!-- 編輯模式：原生日期時間選擇器 -->
                <div v-else>
                  <div 
                    class="native-dt-wrapper" 
                    :class="{ 'native-dt-wrapper--error': !tempDateTime }"
                  >
                    <input
                      ref="dtInputRef"
                      type="datetime-local"
                      lang="en-GB"
                      v-model="tempDateTime"
                      :min="minDateTimeLocal"
                      step="300"
                      class="native-dt-input"
                    />
                  </div>

                  <!-- 確認 / 取消 按鈕列 -->
                  <div class="native-dt-actions mt-2">
                    <v-btn 
                      size="small" 
                      variant="text" 
                      color="grey"
                      @click="cancelEditTime"
                    >
                      取消
                    </v-btn>
                    <v-btn 
                      size="small" 
                      variant="flat" 
                      color="primary"
                      :disabled="!tempDateTime"
                      @click="confirmDateTime"
                      prepend-icon="mdi-check"
                    >
                      確認選擇
                    </v-btn>
                  </div>
                </div>

                <div v-if="!formData.reservationTime && !isEditingTime" class="text-caption text-error mt-1 ml-1">請選擇預約時間</div>
              </v-col>
              
              <v-col cols="12" sm="6">
                 <v-select
                  v-model="formData.type"
                  label="預約類型"
                  :items="['新客', '回訪', '簽約', '其他']"
                  variant="underlined"
                  density="compact"
                  :rules="[v => !!v || '請選擇類型']"
                  prepend-inner-icon="mdi-account-tag"
                ></v-select>
              </v-col>

              <v-col v-if="formData.type === '其他'" cols="12" sm="6">
                <v-text-field
                  v-model="customType"
                  label="請輸入預約類型"
                  variant="underlined"
                  density="compact"
                  placeholder="例如：已購客"
                  :rules="[v => !!(v && v.trim()) || '請輸入預約類型']"
                  prepend-inner-icon="mdi-pencil"
                ></v-text-field>
              </v-col>

              <v-col v-if="formData.type === '簽約'" cols="12" sm="6">
                <v-combobox
                  v-model="formData.unitId"
                  :items="unitItems"
                  label="戶別"
                  variant="underlined"
                  density="compact"
                  placeholder="選擇或手動輸入"
                  prepend-inner-icon="mdi-home-variant"
                  hide-no-data
                  clearable
                  @update:modelValue="onUnitSelected"
                >
                  <template v-slot:item="{ props: itemProps, item }">
                    <v-list-item
                      v-bind="itemProps"
                      :title="item.raw"
                      :subtitle="getUnitBuyerInfo(item.raw)"
                    ></v-list-item>
                  </template>
                </v-combobox>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerName"
                  label="客戶姓名"
                  variant="underlined"
                  density="compact"
                  :rules="[v => !!v || '請輸入姓名']"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerPhone"
                  label="客戶電話"
                  variant="underlined"
                  density="compact"
                  placeholder="09xxxxxxxx"
                  :rules="phoneRules"
                  prepend-inner-icon="mdi-phone"
                  @blur="handlePhoneBlur" 
                ></v-text-field>
                <v-alert v-if="conflictInfo" type="warning" variant="tonal"  class="mt-2 text-caption">
                  注意：該號碼已有預約！<br>時間：{{ formatDate(conflictInfo.reservationTime) }}<br>銷售：{{ conflictInfo.salesName || '未指定' }}
                </v-alert>
              </v-col>

              <v-col cols="12">
                <div class="d-flex align-start">
                    <v-select
                      v-model="formData.salesId"
                      label="指定銷售"
                      :items="visibleSalesOptions" 
                      item-title="name"
                      item-value="id"
                      variant="underlined"
                      density="compact"
                      prepend-inner-icon="mdi-badge-account"
                      clearable
                      class="flex-grow-1"
                    >
                       <template v-slot:item="{ props, item }">
                          <v-list-item v-bind="props" :subtitle="item.raw.phone"></v-list-item>
                       </template>
                    </v-select>
                    
                    <v-btn 
                        v-if="canManageSales"
                        icon="mdi-cog" 
                        variant="text" 
                        size="small" 
                        class="ml-2 mt-1"
                        color="grey-darken-1"
                        @click="openSettingsDialog"
                        v-tooltip:bottom="'設定顯示/隱藏人員'"
                    ></v-btn>
                </div>
              </v-col>

              <v-col cols="12">
                <v-textarea
                  v-model="formData.note"
                  label="備註事項"
                  variant="underlined"
                  density="compact"
                  rows="2"
                  auto-grow
                  prepend-inner-icon="mdi-note-text"
                ></v-textarea>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn v-if="isEdit" color="error" variant="text" prepend-icon="mdi-delete" @click="confirmDelete">取消預約</v-btn>
        <v-spacer></v-spacer>
        <v-btn variant="underlined" @click="closeDialog">關閉</v-btn>
                <v-btn 
                color="primary" 
                variant="flat" 
                @click="save" 
                :loading="saving" 
                :disabled="!valid || !formData.reservationTime" 
                > {{ isEdit ? '更新' : '新增' }}
                </v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="vipConflictDialog" max-width="450">
        <v-card>
            <v-card-title class="text-primary d-flex align-center">
                <v-icon start color="primary">mdi-database-search</v-icon>
                客資庫比對提醒
            </v-card-title>
            <v-card-text class="py-4">
                此電話 <span class="font-weight-bold text-error">{{ formData.customerPhone }}</span> 
                已存在 <span class="font-weight-bold">{{ currentProjectName }}</span> 資料庫，<br>
                是否指定為銷售：<span class="text-subtitle-1 font-weight-bold">{{ vipGuestInfo?.latestSalesName }}</span>？
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions class="pa-4">
                <v-btn variant="text" @click="vipConflictDialog = false">不指定</v-btn>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="flat" @click="assignSalesFromVip">指定銷售</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="conflictDialog" max-width="450">
        <v-card class="rounded-lg">
            <v-card-title class="bg-warning text-white d-flex align-center pa-4">
                <v-icon start size="24">mdi-alert-circle</v-icon>
                <span class="text-subtitle-1 font-weight-bold">重複預約確認</span>
            </v-card-title>

            <v-card-text class="pa-6">
                <div class="text-body-2 mb-4 text-grey-darken-2">
                    此電話號碼 <span class="font-weight-bold text-error">{{ formData.customerPhone }}</span>
                    已有預約記錄，請確認處理方式：
                </div>

                <!-- 既有預約信息卡片 -->
                <v-card variant="flat" class="mb-5 bg-orange-lighten-5 border-l-5" style="border-left-color: #ff9800;">
                    <v-card-text class="pa-4">
                        <div class="d-flex align-center mb-3">
                            <v-icon size="20" color="orange">mdi-calendar-check</v-icon>
                            <span class="text-caption text-grey-darken-1 ms-2 font-weight-bold">既有預約詳情</span>
                        </div>

                        <v-row dense class="mt-1">
                            <v-col cols="12" class="pb-2">
                                <div class="text-caption text-grey-darken-1">預約時間</div>
                                <div class="text-body-2 font-weight-bold text-grey-darken-3">
                                    {{ formatDate(conflictInfo?.reservationTime) }}
                                </div>
                            </v-col>

                            <v-col cols="12" class="pb-2">
                                <div class="text-caption text-grey-darken-1">負責銷售</div>
                                <div class="d-flex align-center mt-1">
                                    <v-icon size="18" color="indigo" class="me-1">mdi-badge-account</v-icon>
                                    <span class="text-body-2 font-weight-bold text-grey-darken-3">
                                        {{ conflictInfo?.salesName || '未指定' }}
                                    </span>
                                </div>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>

                <v-divider class="my-4"></v-divider>

                <div class="text-caption font-weight-bold text-grey-darken-1 mb-3">
                    請選擇處理方式：
                </div>
            </v-card-text>

            <v-card-actions class="pa-4 pt-0 flex-column align-stretch gap-2">
                <!-- ✅ 優化：添加權限限制和禁用提示 -->
                <div v-if="!canDeleteConflictReservation" class="mb-2">
                    <v-alert
                        type="warning"
                        variant="tonal"
                        density="compact"
                        class="text-caption"
                        icon="mdi-lock"
                    >
                        <div class="font-weight-bold">無法刪除此預約</div>
                        <div>您不是此預約的負責銷售，且無櫃台權限</div>
                    </v-alert>
                </div>

                <v-btn
                    color="error"
                    variant="tonal"
                    prepend-icon="mdi-delete"
                    @click="resolveConflict('replace')"
                    :disabled="!canDeleteConflictReservation"
                    class="font-weight-bold"
                >
                    <template v-if="!canDeleteConflictReservation">
                        <v-icon start>mdi-lock</v-icon>
                        刪除舊預約，建立新預約 (無權限)
                    </template>
                    <template v-else>
                        刪除舊預約，建立新預約
                    </template>
                </v-btn>

                <v-btn
                    color="primary"
                    variant="tonal"
                    prepend-icon="mdi-plus-multiple"
                    @click="resolveConflict('keep')"
                    class="font-weight-bold"
                >
                    保留舊預約，繼續建立 (重複)
                </v-btn>

                <v-divider class="my-2"></v-divider>

                <v-btn
                    variant="text"
                    color="grey-darken-1"
                    @click="conflictDialog = false"
                >
                    取消操作
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="settingsDialog" max-width="400" scrollable>
        <v-card>
            <v-card-title class="text-subtitle-1 font-weight-bold bg-grey-lighten-4">
                設定銷售人員顯示
            </v-card-title>
            <v-card-text class="pa-0" style="max-height: 400px;">
                <v-list lines="one" select-strategy="classic">
                    <v-list-subheader>勾選的人員將顯示於選單中</v-list-subheader>
                    
                    <v-list-item
                        v-for="sales in allSalesList"
                        :key="sales.id"
                        :value="sales.id"
                        @click="toggleVisibility(sales.id)"
                    >
                        <template v-slot:prepend>
                            <v-list-item-action start>
                                <v-checkbox-btn :model-value="!tempHiddenIds.includes(sales.id)"></v-checkbox-btn>
                            </v-list-item-action>
                        </template>
                        <v-list-item-title>{{ sales.name }}</v-list-item-title>
                    </v-list-item>
                </v-list>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="settingsDialog = false">取消</v-btn>
                <v-btn color="primary" @click="saveSettings">儲存設定</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useReservationStore } from '@/store/reservationStore';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // 確保引用
import { useSalesDataStore } from '@/store/salesDataStore'; // 戶別/銷控資料
import { format } from 'date-fns';

// ===== 原生 datetime-local 轉換工具 =====

const dtInputRef = ref(null);
const tempDateTime = ref(''); // 暫存值（字串格式）
const isEditingTime = ref(false); // 是否正在編輯時間

// 預約類型相關
const PREDEFINED_TYPES = ['新客', '回訪', '簽約', '其他'];
const customType = ref(''); // 「其他」類型的自訂輸入值

// Date → 原生 input 值 (yyyy-MM-ddTHH:mm)
const toDateTimeLocalString = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 計算 min 屬性（不能選過去時間）
const minDateTimeLocal = computed(() => {
  return toDateTimeLocalString(new Date());
});

// 顯示已選擇的時間（友善格式）
const formatSelectedTime = (date) => {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return format(d, 'yyyy/MM/dd HH:mm');
};

// 開始編輯時間
const startEditTime = () => {
  tempDateTime.value = toDateTimeLocalString(formData.value.reservationTime);
  isEditingTime.value = true;
  nextTick(() => {
    dtInputRef.value?.focus();
  });
};

// 確認選擇
const confirmDateTime = () => {
  if (tempDateTime.value) {
    formData.value.reservationTime = new Date(tempDateTime.value);
  }
  isEditingTime.value = false;
};

// 取消編輯
const cancelEditTime = () => {
  tempDateTime.value = '';
  isEditingTime.value = false;
};



const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  initialData: { type: Object, default: () => ({}) },
  initialDate: Date // ✅ [新增] 接收外部傳入的預設時間
});


// 2. 修改 initDialogData (處理新增模式)
const initDialogData = async () => {
    await reservationStore.fetchProjectSales(props.projectId);

    if (isEdit.value) {
        const d = props.initialData;
        formData.value = {
            ...d,
            reservationTime: d.reservationTime?.toDate ? d.reservationTime.toDate() : new Date(d.reservationTime),
        };
        // 編輯模式：若 type 不在預設清單，視為「其他」並還原自訂值
        if (d.type && !PREDEFINED_TYPES.includes(d.type)) {
            customType.value = d.type;
            formData.value.type = '其他';
        } else {
            customType.value = '';
        }
    } else {
        // ✅ 新增模式：優化指定銷售欄位預設值
        let defaultSalesId = null;

        // 取得當前用戶的 ID
        const currentUserId = userStore.user?.key;

        // 從可見銷售列表中查找當前用戶
        if (currentUserId) {
          const currentUserInSales = reservationStore.visibleSalesList.find(s => s.id === currentUserId);
          if (currentUserInSales) {
            defaultSalesId = currentUserId; // 若用戶在列表中，設為當前用戶
          }
          // 若不在列表中，defaultSalesId 保持 null（對應"不指定"）
        }

        formData.value = {
            customerName: props.initialData?.customerName || '',
            customerPhone: props.initialData?.customerPhone || '',
            reservationTime: props.initialDate || null, // ✅ 若無傳入則預設 null
            type: '新客',
            salesId: defaultSalesId,
            note: props.initialData?.note || '',
            unitId: ''
        };
        customType.value = '';
    }
    // 編輯模式若為「簽約」則預載戶別資料供下拉使用
    if (formData.value.type === '簽約') ensureHouseholdsLoaded();
    conflictInfo.value = null;
};

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);

const reservationStore = useReservationStore();
const userStore = useUserStore();
const projectStore = useProjectStore(); // 用於查找建案名稱以驗證權限
const salesDataStore = useSalesDataStore(); // 戶別/銷控資料

// ===== 戶別（簽約用）=====
const projectHouseholds = computed(() => {
    if (!props.projectId) return [];
    const data = salesDataStore.getProjectData(props.projectId);
    return data?.households || [];
});

// 戶別下拉選項（去重 + 排序）
const unitItems = computed(() => {
    const seen = new Set();
    const items = [];
    for (const h of projectHouseholds.value) {
        if (h.unitId && !seen.has(h.unitId)) {
            seen.add(h.unitId);
            items.push(h.unitId);
        }
    }
    return items.sort((a, b) => String(a).localeCompare(String(b), 'zh-Hant', { numeric: true }));
});

// 顯示在下拉項目副標題的買方資訊
const getUnitBuyerInfo = (unitId) => {
    if (!unitId) return '';
    const h = projectHouseholds.value.find(x => x.unitId === unitId);
    if (!h || !h.buyerName) return '';
    return `買方：${h.buyerName}${h.buyerPhone ? ` / ${h.buyerPhone}` : ''}`;
};

// 使用者選/輸入戶別後，若匹配到資料則自動填入買方資訊
// （只有 update:modelValue 事件會觸發；外部賦值給 formData 不會誤觸發 → 編輯模式安全）
const onUnitSelected = (newUnitId) => {
    if (!newUnitId) return;
    const matched = projectHouseholds.value.find(h => h.unitId === newUnitId);
    if (!matched) return;
    if (matched.buyerName) formData.value.customerName = matched.buyerName;
    if (matched.buyerPhone) formData.value.customerPhone = matched.buyerPhone;
};

// 簽約時預載戶別資料（store 內建快取，重複呼叫不會重複拉資料）
const ensureHouseholdsLoaded = () => {
    if (!props.projectId) return;
    salesDataStore.loadProjectData(props.projectId);
};

// --- 新增與調整的狀態 ---
const vipConflictDialog = ref(false); // 客資重複彈窗
const vipGuestInfo = ref(null);      // 儲存匹配到的客資資訊


// 取得當前建案名稱
const currentProjectName = computed(() => {
    return projectStore.idToNameMap[props.projectId] || '本建案';
});

// --- 核心邏輯：失去焦點檢查 ---
const handlePhoneBlur = async () => {
  const phone = formData.value.customerPhone;

  // 1. 基本校驗：10碼且非編輯模式
  if (phone && /^09\d{8}$/.test(phone) && !isEdit.value) {

     // A. 檢查是否已有「現有預約」 (原有機制)
     const resResult = await reservationStore.checkPhoneConflict(props.projectId, phone);
     if (resResult) {
         conflictInfo.value = resResult; // ✅ 確保資料先賦值
         await nextTick(); // ✅ 確保 DOM 更新完成
         conflictDialog.value = true; // ✅ 再打開 Dialog
         return; // 若已有預約，優先處理預約衝突
     }

     // B. 檢查是否已在「客資資料庫」 (新機制)
     const vipResult = await reservationStore.checkVipGuestPhone(props.projectId, phone);
     if (vipResult) {
         vipGuestInfo.value = vipResult;
         await nextTick();
         vipConflictDialog.value = true;
     }
  }
};

/**
 * ✅ 修正版：點擊「指定銷售」後的處理流程
 * 邏輯：Phone (Vip庫) -> 搜尋 salesList -> 取得 ID (UID) -> 填入表單
 */
const assignSalesFromVip = () => {
    const targetPhone = vipGuestInfo.value?.latestSalesPhone; // 來自 Vip 客資庫
    const targetName = vipGuestInfo.value?.latestSalesName;

    if (targetPhone) {
        // 1. 正規化電話號碼 (移除符號) 以利比對
        const cleanTargetPhone = targetPhone.replace(/\D/g, '');

        // 2. 從目前的專案銷售名單中，尋找「電話號碼」相符的人員
        const matchedSales = reservationStore.salesList.find(s => {
            const cleanSalesPhone = (s.phone || '').replace(/\D/g, '');
            return cleanSalesPhone === cleanTargetPhone;
        });

        if (matchedSales) {
            // 3. 成功找到匹配人員：將其 UID (id) 設為表單值
            // 此時 v-select 會因為 ID 匹配成功，自動在畫面上顯示該員的「姓名」
            formData.value.salesId = matchedSales.id;
            console.log(`[Matching Success] 匹配到人員: ${matchedSales.name}`);
        } else {
            // 異常處理：客資庫雖然有這個人，但該人員目前沒被分配到這個建案
            alert(`分配失敗：\n銷售 ${targetName}(${targetPhone}) 不在${currentProjectName.value}的銷售名單中。`);
        }
    }
    
    vipConflictDialog.value = false;
};

// ... (原有的 formRef, valid, formData 等 ref 保持不變) ...
const formRef = ref(null);
const valid = ref(false);
const saving = ref(false);
const formData = ref({
  customerName: '',
  customerPhone: '',
  reservationTime: null,
  type: '新客',
  salesId: null,
  note: '',
  unitId: '',       // ✅ 新增：簽約戶別
  operatorName: '', // ✅ 新增：記錄建立者名稱
  createdAt: null   // ✅ 新增：記錄建立時間
});

// 監聽 type → 切到「簽約」時自動載入該建案戶別資料
watch(() => formData.value.type, (newType) => {
    if (newType === '簽約') ensureHouseholdsLoaded();
});


const conflictInfo = ref(null);
const conflictDialog = ref(false);

const isEdit = computed(() => !!props.initialData?.id);
const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// ✅ 新增：設定功能相關
const settingsDialog = ref(false);
const tempHiddenIds = ref([]); // 暫存編輯中的隱藏名單

// 判斷是否擁有「銷控系統」權限
const canManageSales = computed(() => {
    // 透過 projectId 查找完整建案名稱 (Store 中 idToNameMap)
    const fullProjectName = projectStore.idToNameMap[props.projectId] || props.projectId;
    return userStore.hasProjectPermission('銷控系統', fullProjectName);
});

// ✅ 新增：判斷是否可以刪除重複預約
const canDeleteConflictReservation = computed(() => {
    if (!conflictInfo.value || !userStore.user) return false;

    const fullProjectName = projectStore.idToNameMap[props.projectId] || props.projectId;
    const currentUserId = userStore.user.key; // 當前用戶 ID
    const reservationSalesId = conflictInfo.value.salesId; // 既有預約的銷售人員 ID

    // 條件 1：當前用戶是該預約的負責銷售
    if (currentUserId === reservationSalesId) {
        return true;
    }

    // 條件 2：當前用戶有「客資系統-櫃台」權限
    return userStore.hasProjectPermission('客資系統-櫃台', fullProjectName);
});

// 下拉選單使用 "可見" 的名單
const visibleSalesOptions = computed(() => {
    // 1. 取得目前「未被隱藏」的業務員
    let list = reservationStore.visibleSalesList.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone
    }));

    // 2. [優化重點]：如果目前的 formData.salesId 不在可見名單中（例如被隱藏了）
    // 則從總名單 (salesList) 中找出該員並手動加入，確保選單能正確對應並顯示「姓名」
    if (formData.value.salesId && !list.some(s => s.id === formData.value.salesId)) {
        const matchedSales = reservationStore.salesList.find(s => s.id === formData.value.salesId);
        if (matchedSales) {
            list.push({
                id: matchedSales.id,
                name: `${matchedSales.name} (原負責人)`,
                phone: matchedSales.phone
            });
        }
    }

    return [
        { id: null, name: '不指定', phone: '' }, 
        ...list
    ];
});

// 設定視窗使用 "全部" 名單
const allSalesList = computed(() => reservationStore.salesList);

const phoneRules = [
  v => !!v || '請輸入電話',
  v => /^09\d{8}$/.test(v) || '格式錯誤 (需為09開頭10碼)'
];

// ... (watch, handlePhoneBlur, resolveConflict, confirmDelete, closeDialog, formatDate 保持不變) ...

// ✅ 優化後的初始化監控邏輯
watch(() => props.modelValue, async (val) => {
  if (val) {
    await reservationStore.fetchProjectSales(props.projectId);

    if (isEdit.value) {
      const d = props.initialData;
      formData.value = {
        ...d,
        reservationTime: d.reservationTime?.toDate ? d.reservationTime.toDate() : new Date(d.reservationTime),
      };
      // 編輯模式：若 type 不在預設清單，視為「其他」並還原自訂值
      if (d.type && !PREDEFINED_TYPES.includes(d.type)) {
        customType.value = d.type;
        formData.value.type = '其他';
      } else {
        customType.value = '';
      }
    } else {
      // ✅ 新增模式：優化指定銷售欄位預設值
      let defaultSalesId = null;

      // 取得當前用戶的 ID
      const currentUserId = userStore.user?.key;

      // 從可見銷售列表中查找當前用戶
      if (currentUserId) {
        const currentUserInSales = reservationStore.visibleSalesList.find(s => s.id === currentUserId);
        if (currentUserInSales) {
          defaultSalesId = currentUserId; // 若用戶在列表中，設為當前用戶
        }
        // 若不在列表中，defaultSalesId 保持 null（對應"不指定"）
      }

      formData.value = {
        customerName: props.initialData?.customerName || '',
        customerPhone: props.initialData?.customerPhone || '',
        note: props.initialData?.note || '',
        reservationTime: props.initialDate || null,
        type: '新客',
        salesId: defaultSalesId,
        unitId: ''
      };
      customType.value = '';

      // ✅ 優化：從聯絡名單打開時，先重置再檢查，確保 conflictInfo 第一時間顯示
      if (formData.value.customerPhone) {
        conflictInfo.value = null; // 先清除舊的 conflictInfo
        await nextTick(); // 確保表單已更新
        await handlePhoneBlur(); // 自動觸發檢查並等待完成
        await nextTick(); // 確保 conflictInfo 已更新
      }
    }
    // 編輯/新增模式皆檢查：若 type 為「簽約」則預載該建案戶別資料
    if (formData.value.type === '簽約') ensureHouseholdsLoaded();
  }
}, { immediate: true });



const resolveConflict = async (action) => {
    conflictDialog.value = false;
    if (action === 'replace') {
        if (conflictInfo.value?.id) {
            await reservationStore.cancelReservation(conflictInfo.value.id, '系統：電話衝突，使用者選擇覆蓋');
        }
    }
};

// ✅ 新增：設定功能函式
const openSettingsDialog = () => {
    // 複製目前的設定到暫存區
    tempHiddenIds.value = [...reservationStore.hiddenSalesIds];
    settingsDialog.value = true;
};

const toggleVisibility = (id) => {
    const index = tempHiddenIds.value.indexOf(id);
    if (index === -1) {
        // 目前是顯示 (不在 hidden 中)，點擊後加入 hidden
        tempHiddenIds.value.push(id);
    } else {
        // 目前是隱藏，點擊後移除 hidden
        tempHiddenIds.value.splice(index, 1);
    }
};

const saveSettings = async () => {
    await reservationStore.updateSalesVisibility(props.projectId, tempHiddenIds.value);
    settingsDialog.value = false;
};

// 3. 在掛載時執行 (解決 v-if 開啟問題)
onMounted(() => {
    if (props.modelValue) initDialogData();
});

// ... (save 函式保持不變) ...
const save = async () => {
    if (!valid.value) return;
    
    if (!formData.value.reservationTime) {
        alert("請選擇預約時間");
        return;
    }

    saving.value = true;

    let sName = '不指定';
    let sPhone = '';
    
    if (formData.value.salesId) {
        // 這裡要搜尋 reservationStore.salesList (全部名單)，以免編輯舊資料時，該業務已被隱藏而找不到名字
        const s = reservationStore.salesList.find(x => x.id === formData.value.salesId);
        if (s) {
            sName = s.name;
            sPhone = s.phone;
        }
    }

    // 「其他」類型時，將自訂輸入內容寫入 type
    const finalType = formData.value.type === '其他'
        ? (customType.value?.trim() || '其他')
        : formData.value.type;

    // 戶別僅在「簽約」時寫入，其他類型一律清空避免殘留
    const finalUnitId = formData.value.type === '簽約'
        ? (formData.value.unitId || '').trim()
        : '';

    const payload = {
        projectId: props.projectId,
        ...formData.value,
        type: finalType,
        unitId: finalUnitId,
        salesName: sName,
        salesPhone: sPhone,
        operatorId: userStore.user.key,
        operatorName: userStore.user.name
    };

    try {
        if (isEdit.value) {
            await reservationStore.updateReservation(props.initialData.id, payload);
        } else {
            await reservationStore.addReservation(payload);
        }
       emit('saved', payload);
        closeDialog();
    } catch (e) {
        alert("儲存失敗：" + e.message);
    } finally {
        saving.value = false;
    }
};

const confirmDelete = async () => {
    if (confirm('確定要取消此預約嗎？')) {
        await reservationStore.cancelReservation(props.initialData.id, '使用者手動取消');
        emit('deleted');
        closeDialog();
    }
};

const closeDialog = () => {
  dialog.value = false;
};

const formatDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'yyyy/MM/dd HH:mm');
};
</script>

<style scoped>
/* ===== 標籤 ===== */
.native-dt-label {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #757575;
    margin-bottom: 6px;
    font-weight: 500;
    letter-spacing: 0.3px;
}

/* ===== 原生日期時間輸入框容器 ===== */
.native-dt-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 12px;
    border: 1.5px solid #bdbdbd;
    border-radius: 10px;
    background: #fafafa;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    min-height: 48px;
}

.native-dt-wrapper:focus-within {
    border-color: #1976d2;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.15);
}

.native-dt-wrapper--error:not(:focus-within) {
    border-color: #e53935;
    background: #fff5f5;
}

.native-dt-wrapper--filled {
    border-color: #4caf50;
    background: #f9fff9;
}

.native-dt-wrapper--filled:focus-within {
    border-color: #1976d2;
    background: #fff;
}

/* ===== 原生 input 本體 ===== */
.native-dt-input {
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 16px;
    font-weight: 500;
    color: #212121;
    font-family: inherit;
    letter-spacing: 0.3px;
    min-width: 0;
    /* 讓 input 佔滿高度，增加點擊區域 */
    padding: 8px 0;
    cursor: pointer;
}

/* iOS / Safari 移除預設樣式 */
.native-dt-input::-webkit-inner-spin-button,
.native-dt-input::-webkit-calendar-picker-indicator {
    font-size: 20px;
    cursor: pointer;
    opacity: 0.6;
    padding: 4px;
}

.native-dt-input::-webkit-calendar-picker-indicator:hover {
    opacity: 1;
}

/* placeholder 樣式（未選值時） */
.native-dt-input:invalid {
    color: #9e9e9e;
}

/* ===== 清除按鈕 ===== */
.native-dt-clear {
    color: #bdbdbd;
    flex-shrink: 0;
    cursor: pointer;
    transition: color 0.2s;
    padding: 4px;
}

.native-dt-clear:hover {
    color: #e53935;
}

/* ===== 已確認時間顯示 ===== */
.native-dt-wrapper--filled {
    cursor: pointer;
}

.native-dt-wrapper--filled:hover {
    border-color: #1976d2;
    background: #f5f9ff;
}

.native-dt-display {
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    color: #212121;
    letter-spacing: 0.5px;
}

/* ===== 確認/取消按鈕列 ===== */
.native-dt-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
}
</style>