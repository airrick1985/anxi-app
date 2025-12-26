<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <v-card>
      <v-card-title class="bg-primary text-white d-flex align-center">
        <span class="text-h6">{{ isEdit ? '編輯預約' : '新增賞屋預約' }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeDialog"></v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <v-form ref="formRef" v-model="valid" @submit.prevent="save">
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <label class="text-caption text-grey-darken-1">預約時間 (台灣時間)</label>
              <VueDatePicker 
                    v-model="formData.reservationTime" 
                    :enable-time-picker="true"
                    :is-24="false"
                    format="yyyy/MM/dd aa hh:mm" 
                    locale="zh-TW"
                    :min-date="new Date()"
                    :teleport="true"
                    select-text="確認選擇" 
                    cancel-text="取消"
                    class="mt-1"
                >
                    <template #am-pm-button="{ toggle, value }">
                        <button 
                            @click="toggle" 
                            class="dp__pm_am_button" 
                            type="button"
                        >
                            {{ value === 'AM' ? '上午' : '下午' }}
                        </button>
                    </template>
                </VueDatePicker>
              </v-col>
              
              <v-col cols="12" sm="6">
                 <v-select
                  v-model="formData.type"
                  label="預約類型"
                  :items="['新客', '回訪']"
                  variant="underlined"
                  
                  :rules="[v => !!v || '請選擇類型']"
                  prepend-inner-icon="mdi-account-tag"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerName"
                  label="客戶姓名"
                  variant="underlined"
                  
                  :rules="[v => !!v || '請輸入姓名']"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerPhone"
                  label="客戶電話"
                  variant="underlined"
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
        <v-btn color="primary" variant="flat" @click="save" :loading="saving" :disabled="!valid">{{ isEdit ? '更新' : '新增' }}</v-btn>
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

    <v-dialog v-model="conflictDialog" max-width="400">
        <v-card>
            <v-card-title class="text-warning">重複預約確認</v-card-title>
            <v-card-text>此電話號碼在 <strong>{{ formatDate(conflictInfo?.reservationTime) }}</strong> 已預約。<br>請問您要如何處理？</v-card-text>
            <v-card-actions class="flex-column align-stretch pa-4">
                <v-btn color="error" variant="tonal" class="mb-2" @click="resolveConflict('replace')">刪除舊預約，建立新預約</v-btn>
                <v-btn color="primary" variant="tonal" class="mb-2" @click="resolveConflict('keep')">保留舊預約，繼續建立 (重複)</v-btn>
                <v-btn variant="text" @click="conflictDialog = false">取消操作</v-btn>
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
import { ref, computed, watch, onMounted } from 'vue';
import { useReservationStore } from '@/store/reservationStore';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // 確保引用
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { format } from 'date-fns';

const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  initialData: Object,
  initialDate: Date // ✅ [新增] 接收外部傳入的預設時間
});

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);

const reservationStore = useReservationStore();
const userStore = useUserStore();
const projectStore = useProjectStore(); // 用於查找建案名稱以驗證權限

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
         conflictInfo.value = resResult;
         conflictDialog.value = true;
         return; // 若已有預約，優先處理預約衝突
     }

     // B. 檢查是否已在「客資資料庫」 (新機制)
     const vipResult = await reservationStore.checkVipGuestPhone(props.projectId, phone);
     if (vipResult) {
         vipGuestInfo.value = vipResult;
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
  reservationTime: new Date(),
  type: '新客',
  salesId: null,
  note: ''
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

// ✅ [修改] 初始化邏輯
watch(() => props.modelValue, async (val) => {
  if (val) {
    // 開啟時載入銷售名單
    await reservationStore.fetchProjectSales(props.projectId);
    
    if (props.initialData) {
      // 編輯模式：複製資料
      const d = props.initialData;
      formData.value = {
        ...d,
        reservationTime: d.reservationTime?.toDate ? d.reservationTime.toDate() : new Date(d.reservationTime),
      };
    } else {
      // 新增模式：初始化
      formData.value = {
        customerName: '',
        customerPhone: '',
        // ✅ [關鍵修改] 使用傳入的 initialDate，若無則使用現在時間
        reservationTime: props.initialDate || new Date(),
        type: '新客',
        salesId: null,
        note: ''
      };
    }
    conflictInfo.value = null;
  }
});



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

    const payload = {
        projectId: props.projectId,
        ...formData.value,
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
        emit('saved');
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
.dp__main {
    font-family: inherit;
}
</style>