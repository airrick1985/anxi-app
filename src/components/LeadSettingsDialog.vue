<template>
  <v-dialog v-model="internalValue" max-width="600" scrollable>
    <v-card class="rounded-lg">
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title class="text-subtitle-1">聯絡名單系統設定</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="internalValue = false"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-4">
        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
          <v-icon start color="success">mdi-bell-ring</v-icon>
          LINE 每日未完成提醒
        </div>
        <v-card variant="outlined" class="pa-4 mb-6 border-dashed">
          <v-switch
            v-model="settings.isRemindEnabled"
            label="啟用自動提醒功能"
            color="success"
            hide-details
            class="mb-2"
          ></v-switch>
          
          <div :class="{ 'text-grey-lighten-1': !settings.isRemindEnabled }">
            <div class="text-caption mb-1">提醒時間 (每日執行)</div>
            <v-select
              v-model="settings.remindTime"
              :items="timeOptions"
              :disabled="!settings.isRemindEnabled"
              density="compact"
              variant="outlined"
              hide-details
            ></v-select>
            <div class="text-caption mt-2 text-grey">
              ※ 系統將於設定時間檢查「已分配但未回報」的名單，並發送 LINE 給該銷售人員與櫃檯。
            </div>
          </div>
        </v-card>

        <div class="text-subtitle-2 font-weight-bold mb-2 d-flex align-center">
          <v-icon start color="info">mdi-account-multiple-check</v-icon>
          分配通知對象 (固定通知主管／案場負責人)
        </div>
        <v-card variant="outlined" class="pa-4 mb-6 border-dashed">
          <v-select
            v-model="settings.notifyRecipients"
            :items="staffList"
            item-title="name"
            item-value="id"
            label="選擇固定接收分配通知的人員 (可複選)"
            multiple
            chips
            closable-chips
            density="compact"
            variant="outlined"
            hide-details
          >
            <template v-slot:item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template v-slot:append>
                  <v-chip
                    :color="item.raw.lineId ? 'success' : 'grey'"
                    size="x-small"
                    label
                  >
                    {{ item.raw.lineId ? 'LINE已綁定' : '未綁定' }}
                  </v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
          <div class="text-caption mt-2 text-grey">
            ※ 名單分配後，除了被指派的銷售人員外，這裡選擇的主管也會固定收到 LINE 通知。<br>
            ※ 未綁定 LINE 的人員即使勾選也收不到通知，請先請其完成 LINE 綁定。
          </div>
        </v-card>

        <div class="text-subtitle-2 font-weight-bold mb-2">
          <v-icon start color="primary">mdi-format-list-bulleted</v-icon>
          聯絡狀況選項 (Status)
        </div>
        <v-card variant="outlined" class="pa-2 mb-6">
          <v-chip-group column>
            <v-chip
              v-for="(opt, idx) in settings.statusOptions"
              :key="idx"
              closable
              size="small"
              @click:close="removeItem('statusOptions', idx)"
            >
              {{ opt }}
            </v-chip>
          </v-chip-group>
          <v-text-field
            v-model="newItem.status"
            label="新增選項..."
            density="compact"
            variant="plain"
            append-inner-icon="mdi-plus-circle"
            @click:append-inner="addItem('statusOptions', 'status')"
            @keyup.enter="addItem('statusOptions', 'status')"
            class="px-2"
            hide-details
          ></v-text-field>
        </v-card>

        <div class="text-subtitle-2 font-weight-bold mb-2">
          <v-icon start color="warning">mdi-alert-octagon</v-icon>
          未約原因選項 (Reason)
        </div>
        <v-card variant="outlined" class="pa-2 mb-2">
          <v-chip-group column>
            <v-chip
              v-for="(opt, idx) in settings.reasonOptions"
              :key="idx"
              closable
              size="small"
              color="orange-darken-2"
              @click:close="removeItem('reasonOptions', idx)"
            >
              {{ opt }}
            </v-chip>
          </v-chip-group>
          <v-text-field
            v-model="newItem.reason"
            label="新增原因..."
            density="compact"
            variant="plain"
            append-inner-icon="mdi-plus-circle"
            @click:append-inner="addItem('reasonOptions', 'reason')"
            @keyup.enter="addItem('reasonOptions', 'reason')"
            class="px-2"
            hide-details
          ></v-text-field>
        </v-card>
      </v-card-text>

      <v-divider></v-divider>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="internalValue = false">取消</v-btn>
        <v-btn color="primary" variant="elevated" prepend-icon="mdi-content-save" @click="saveSettings">
          儲存設定
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { db } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useUiStore } from '@/store/uiStore';

const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  staffList: { type: Array, default: () => [] }, // [{ id, name, lineId }]
});
const emit = defineEmits(['update:modelValue', 'settings-updated']);
const uiStore = useUiStore();

const internalValue = ref(props.modelValue);
watch(() => props.modelValue, (val) => internalValue.value = val);
watch(internalValue, (val) => emit('update:modelValue', val));

// --- 預設值 ---
const settings = ref({
  isRemindEnabled: false,
  remindTime: '15:00',
  statusOptions: ['不考慮', '已約賞屋', '空號', '未接'],
  reasonOptions: ['家人討論', '總價太高', '單價太高', '暫不買房', '號碼錯誤/空號'],
  notifyRecipients: [] // ✅ 本建案固定接收分配通知的人員 userId 陣列
});

const newItem = ref({ status: '', reason: '' });

// 產生時間選項 (每 30 分鐘一個單位)
const timeOptions = Array.from({ length: 48 }, (_, i) => { // ✓ 修改：24小時 * 2 = 48 筆
  const h = Math.floor(i / 2).toString().padStart(2, '0'); // ✓ 修改：每小時 2 筆
  const m = ((i % 2) * 30).toString().padStart(2, '0');    // ✓ 修改：間隔 30 分鐘
  return `${h}:${m}`;
});

// --- 邏輯操作 ---
onMounted(async () => {
  if (props.projectId) {
    const docRef = doc(db, 'projectSettings', props.projectId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      settings.value = { ...settings.value, ...docSnap.data() };
    }
  }
});

const addItem = (listKey, itemKey) => {
  const value = newItem.value[itemKey].trim();
  if (value && !settings.value[listKey].includes(value)) {
    settings.value[listKey].push(value);
    newItem.value[itemKey] = '';
  }
};

const removeItem = (listKey, index) => {
  settings.value[listKey].splice(index, 1);
};

const saveSettings = async () => {
  try {
    uiStore.setLoading(true);
    await setDoc(doc(db, 'projectSettings', props.projectId), {
      ...settings.value,
      lastModifiedAt: new Date(),
      lastModifiedBy: '櫃檯管理員'
    }, { merge: true });

    uiStore.showSnackbar('設定儲存成功，定時任務已更新。', 'success');
    emit('settings-updated', settings.value);
    internalValue.value = false;
  } catch (err) {
    uiStore.showSnackbar('儲存失敗：' + err.message, 'error');
  } finally {
    uiStore.setLoading(false);
  }
};
</script>