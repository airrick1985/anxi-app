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
                    format="yyyy/MM/dd HH:mm"
                    locale="zh-TW"
                    auto-apply
                    :min-date="new Date()"
                    class="mt-1"
                ></VueDatePicker>
              </v-col>
              
              <v-col cols="12" sm="6">
                 <v-select
                  v-model="formData.type"
                  label="預約類型"
                  :items="['新客', '回訪']"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '請選擇類型']"
                  prepend-inner-icon="mdi-account-tag"
                ></v-select>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerName"
                  label="客戶姓名"
                  variant="outlined"
                  density="compact"
                  :rules="[v => !!v || '請輸入姓名']"
                  prepend-inner-icon="mdi-account"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.customerPhone"
                  label="客戶電話"
                  variant="outlined"
                  density="compact"
                  placeholder="09xxxxxxxx"
                  :rules="phoneRules"
                  prepend-inner-icon="mdi-phone"
                  @blur="handlePhoneBlur" 
                ></v-text-field>
                <v-alert v-if="conflictInfo" type="warning" variant="tonal" density="compact" class="mt-2 text-caption">
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
                      variant="outlined"
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
                  variant="outlined"
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
        <v-btn variant="outlined" @click="closeDialog">關閉</v-btn>
        <v-btn color="primary" variant="flat" @click="save" :loading="saving" :disabled="!valid">{{ isEdit ? '更新' : '新增' }}</v-btn>
      </v-card-actions>
    </v-card>

    <v-dialog v-model="conflictDialog" max-width="400">
        <v-card>
            <v-card-title class="text-warning">重複預約確認</v-card-title>
            <v-card-text>此電話號碼在 <strong>{{ formatDate(conflictInfo?.reservationTime) }}</strong> 已有有效預約。<br>請問您要如何處理？</v-card-text>
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
  initialData: Object 
});

const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);

const reservationStore = useReservationStore();
const userStore = useUserStore();
const projectStore = useProjectStore(); // 用於查找建案名稱以驗證權限

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
    const list = reservationStore.visibleSalesList.map(s => ({
        id: s.id,
        name: s.name,
        phone: s.phone
    }));
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

watch(() => props.modelValue, async (val) => {
  if (val) {
    // 開啟時載入銷售名單
    await reservationStore.fetchProjectSales(props.projectId);
    
    // ... (原本的初始化邏輯) ...
    if (props.initialData) {
      const d = props.initialData;
      formData.value = {
        ...d,
        reservationTime: d.reservationTime?.toDate ? d.reservationTime.toDate() : new Date(d.reservationTime),
      };
    } else {
      formData.value = {
        customerName: '',
        customerPhone: '',
        reservationTime: new Date(),
        type: '新客',
        salesId: null,
        note: ''
      };
    }
    conflictInfo.value = null;
  }
});

const handlePhoneBlur = async () => {
  const phone = formData.value.customerPhone;
  if (phone && /^09\d{8}$/.test(phone) && !isEdit.value) { 
     const result = await reservationStore.checkPhoneConflict(props.projectId, phone);
     if (result) {
         conflictInfo.value = result;
         conflictDialog.value = true;
     } else {
         conflictInfo.value = null;
     }
  }
};

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