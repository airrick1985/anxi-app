<template>
  <v-dialog v-model="dialog" max-width="560px" persistent scrollable content-class="mac-dialog-fit">
    <ViewingReservationSavedCard
      v-if="savedReservation"
      :reservation="savedReservation"
      :is-edit="isEdit"
      @close="closeDialog"
    />
    <v-card v-else class="mac-sheet vr-dlg">
      <div class="mac-sheet-head vr-dlg-head">
        <div class="vr-dlg-titles">
          <div class="vr-dlg-title">{{ isEdit ? '編輯預約' : '新增賞屋預約' }}</div>
          <!-- 編輯模式顯示建立者信息 -->
          <div v-if="isEdit && formData" class="vr-dlg-sub">
            建立者：{{ formData.operatorName || '不詳' }}｜建立時間：{{ formatDate(formData.createdAt) }}
          </div>
        </div>
        <button type="button" class="mac-sheet-close" title="關閉" @click="closeDialog">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <v-card-text class="mac-form vr-dlg-body">
        <v-form ref="formRef" v-model="valid" @submit.prevent="save">
          <div class="mac-form-group">
            <div v-if="projectSelectable" class="vr-field-row">
              <div class="vr-field-label">建案</div>
              <div class="vr-field-main">
                <v-select
                  :model-value="selectedProjectId"
                  :items="projectOptions"
                  item-title="name"
                  item-value="id"
                  placeholder="請選擇建案"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  menu-icon="mdi-unfold-more-horizontal"
                  :menu-props="{ contentClass: 'mac-menu' }"
                  :rules="[v => !!v || '請選擇建案']"
                  @update:model-value="onProjectChange"
                ></v-select>
              </div>
            </div>

            <div class="vr-field-row">
              <div class="vr-field-label">預約時間</div>
              <div class="vr-field-main">
                <!-- 已確認的時間顯示 -->
                <button
                  v-if="formData.reservationTime && !isEditingTime"
                  type="button"
                  class="native-dt-wrapper native-dt-wrapper--filled"
                  @click="startEditTime"
                >
                  <span class="native-dt-display">{{ formatSelectedTime(formData.reservationTime) }}</span>
                  <v-icon size="16" class="native-dt-icon">mdi-pencil</v-icon>
                </button>

                <!-- 尚未選擇：顯示可點擊的 placeholder -->
                <button
                  v-else-if="!isEditingTime"
                  type="button"
                  class="native-dt-wrapper native-dt-wrapper--placeholder"
                  @click="startEditTime"
                >
                  <span class="native-dt-placeholder">點此選擇日期</span>
                  <v-icon size="16" class="native-dt-icon">mdi-calendar</v-icon>
                </button>

                <!-- 編輯模式：原生日期時間選擇器 -->
                <div v-else class="native-dt-wrapper is-editing" :class="{ 'native-dt-wrapper--error': !tempDateTime }">
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

                <div v-if="holidayName" class="vr-holiday-tag">
                  <v-icon size="14">mdi-flag-variant</v-icon>國定假日・{{ holidayName }}
                </div>

                <!-- 撞期提醒：指定銷售在所有建案前後 1 小時內的預約 -->
                <div v-if="timeConflicts.length" class="mac-callout mac-callout--warning vr-clash">
                  <v-icon size="16">mdi-calendar-alert</v-icon>
                  <div class="vr-clash-main">
                    <div class="vr-strong">{{ conflictSalesName }} 此時段已有預約</div>
                    <div v-for="c in timeConflicts" :key="c.id" class="vr-clash-row">
                      {{ formatShortDate(c.reservationTime) }}｜{{ projectNameOf(c.projectId) }}｜{{ c.customerName }}・{{ c.type }}
                    </div>
                  </div>
                </div>

                <div v-if="isEditingTime" class="native-dt-actions">
                  <button type="button" class="mac-btn" @click="cancelEditTime">取消</button>
                  <button type="button" class="mac-btn mac-btn--primary" :disabled="!tempDateTime" @click="confirmDateTime">
                    <v-icon size="15">mdi-check</v-icon>確認選擇
                  </button>
                </div>

                <div v-if="!formData.reservationTime && !isEditingTime" class="vr-field-error">請選擇預約時間</div>
              </div>
            </div>

            <div class="vr-field-row">
              <div class="vr-field-label">預約類型</div>
              <div class="vr-field-main">
                <div class="mac-form-seg mac-form-seg--block vr-type-seg">
                  <button
                    v-for="t in PREDEFINED_TYPES"
                    :key="t"
                    type="button"
                    class="mac-form-seg-btn"
                    :class="{ 'is-active': formData.type === t }"
                    @click="formData.type = t"
                  >
                    <span class="vr-type-dot" :style="{ background: TYPE_DOT_COLORS[t] }"></span>{{ t }}
                  </button>
                </div>
              </div>
            </div>

            <div v-if="formData.type === '其他'" class="vr-field-row">
              <div class="vr-field-label">自訂類型</div>
              <div class="vr-field-main">
                <v-text-field
                  v-model="customType"
                  placeholder="例如：已購客"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  :rules="[v => !!(v && v.trim()) || '請輸入預約類型']"
                ></v-text-field>
              </div>
            </div>

            <div v-if="formData.type === '簽約'" class="vr-field-row">
              <div class="vr-field-label">戶別</div>
              <div class="vr-field-main">
                <v-combobox
                  v-model="formData.unitId"
                  :items="unitItems"
                  placeholder="選擇或手動輸入"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  menu-icon="mdi-unfold-more-horizontal"
                  :menu-props="{ contentClass: 'mac-menu' }"
                  hide-no-data
                  :clearable="!!formData.unitId"
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
              </div>
            </div>
          </div>

          <div class="mac-form-group vr-group">
            <div class="vr-field-row">
              <div class="vr-field-label">客戶姓名</div>
              <div class="vr-field-main">
                <v-text-field
                  v-model="formData.customerName"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  :rules="[v => !!v || '請輸入姓名']"
                ></v-text-field>
              </div>
            </div>

            <div class="vr-field-row">
              <div class="vr-field-label">客戶電話</div>
              <div class="vr-field-main">
                <v-text-field
                  v-model="formData.customerPhone"
                  placeholder="09xxxxxxxx"
                  type="tel"
                  inputmode="numeric"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  :rules="phoneRules"
                  @blur="handlePhoneBlur"
                ></v-text-field>
                <div v-if="conflictInfo" class="mac-callout mac-callout--warning mt-2">
                  <v-icon size="16">mdi-alert</v-icon>
                  <div>
                    注意：該號碼已有預約！<br>時間：{{ formatDate(conflictInfo.reservationTime) }}<br>銷售：{{ conflictInfo.salesName || '未指定' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mac-form-group vr-group">
            <div class="vr-field-row">
              <div class="vr-field-label">指定銷售</div>
              <div class="vr-field-main vr-field-inline">
                <v-select
                  v-model="formData.salesId"
                  :items="visibleSalesOptions"
                  item-title="name"
                  item-value="id"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield flex-grow-1"
                  menu-icon="mdi-unfold-more-horizontal"
                  :menu-props="{ contentClass: 'mac-menu' }"
                  :clearable="!!formData.salesId"
                >
                  <template v-slot:item="{ props: itemProps, item }">
                    <v-list-item v-bind="itemProps" :subtitle="item.raw.phone"></v-list-item>
                  </template>
                </v-select>

                <button
                  v-if="canManageSales"
                  type="button"
                  class="mac-icon-btn vr-gear"
                  title="設定顯示/隱藏人員"
                  @click="openSettingsDialog"
                >
                  <v-icon size="18">mdi-cog</v-icon>
                </button>
              </div>
            </div>

            <div class="vr-field-row vr-field-row--top">
              <div class="vr-field-label">備註事項</div>
              <div class="vr-field-main">
                <v-textarea
                  v-model="formData.note"
                  variant="solo"
                  flat
                  density="compact"
                  hide-details="auto"
                  class="mac-vfield"
                  rows="2"
                  auto-grow
                ></v-textarea>
              </div>
            </div>
          </div>
        </v-form>
      </v-card-text>

      <div class="mac-sheet-foot vr-dlg-foot">
        <button v-if="isEdit" type="button" class="mac-btn mac-btn--danger" @click="confirmDelete">
          <v-icon size="16">mdi-delete</v-icon>取消預約
        </button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" @click="closeDialog">關閉</button>
        <button
          type="button"
          class="mac-btn mac-btn--primary vr-save-btn"
          :disabled="saving || !valid || !formData.reservationTime || !activeProjectId"
          @click="save"
        >
          <v-progress-circular v-if="saving" indeterminate size="14" width="2"></v-progress-circular>
          {{ isEdit ? '更新' : '新增' }}
        </button>
      </div>

      <!-- 初始化載入遮罩：讓使用者明確知道正在讀取後端 / 等候 Cloud Function 冷啟動 -->
      <v-overlay
        :model-value="initializing"
        contained
        persistent
        scrim="white"
        class="align-center justify-center init-overlay"
      >
        <div class="text-center px-6 py-8">
          <v-progress-circular indeterminate color="#0071e3" size="40" width="3"></v-progress-circular>
          <div class="vr-init-status">{{ initStatus || '載入中...' }}</div>
          <div class="vr-init-sub">資料處理中，請稍後。</div>
        </div>
      </v-overlay>
    </v-card>

    <v-dialog v-model="vipConflictDialog" max-width="450" :persistent="isBlockedForSales" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18" :class="isBlockedForSales ? 'vr-icon-danger' : 'vr-icon-accent'">
            {{ isBlockedForSales ? 'mdi-account-lock' : 'mdi-database-search' }}
          </v-icon>
          <span class="vr-sheet-title">{{ isBlockedForSales ? '無法預約：他人客戶' : (vipGuestInfo ? '客資庫比對提醒' : '聯絡名單比對提醒') }}</span>
        </div>
        <div class="mac-sheet-section vr-sheet-text">
          <!-- 客資庫比對結果 -->
          <div v-if="vipGuestInfo">
            此電話 <span class="vr-strong vr-text-danger">{{ formData.customerPhone }}</span>
            已存在 <span class="vr-strong">{{ currentProjectName }}</span> 資料庫，<br>
            客資歸屬銷售：<span class="vr-strong">{{ vipGuestInfo?.latestSalesName || '未知' }}</span>
            <span v-if="!vipOwnerSales" class="vr-tag vr-tag--warning">已不在本案銷售名單</span>
          </div>

          <!-- 聯絡名單比對結果 -->
          <div v-if="leadInfo" :class="vipGuestInfo ? 'vr-split' : ''">
            <template v-if="leadInfo.assigned">
              此電話<span v-if="!vipGuestInfo">
                <span class="vr-strong vr-text-danger"> {{ formData.customerPhone }} </span></span>為
              <span class="vr-strong">{{ leadInfo.name || leadInfo.phone }}</span>
              的聯絡名單
              <span v-if="!leadAssigneeSales" class="vr-tag vr-tag--warning">已不在本案銷售名單</span>
            </template>
            <template v-else>
              此電話<span v-if="!vipGuestInfo">
                <span class="vr-strong vr-text-danger"> {{ formData.customerPhone }} </span></span>已在
              <span class="vr-strong">{{ currentProjectName }}</span> 聯絡名單中，尚未指派銷售。
            </template>
          </div>

          <!-- 他人客戶醒目警示（銷售：封鎖；櫃台：提醒） -->
          <div
            v-if="otherOwners.length > 0 && !selfIsOwner"
            class="mac-callout mt-3"
            :class="isBlockedForSales ? 'mac-callout--error' : 'mac-callout--warning'"
          >
            <v-icon size="18">{{ isBlockedForSales ? 'mdi-alert-octagon' : 'mdi-alert' }}</v-icon>
            <div>
              <div class="vr-strong">
                {{ isBlockedForSales ? `此為 ${ownerNamesText} 的客戶，無法預約` : `此為 ${ownerNamesText} 的客戶` }}
              </div>
              <div>請通知 <span class="vr-strong">{{ ownerNamesText }}</span> 聯繫客戶</div>
            </div>
          </div>

          <!-- 指定建議（被封鎖時不顯示） -->
          <div v-if="!isBlockedForSales" class="mt-3">
            <template v-if="assignOptions.length === 1">
              是否指定為銷售：<span class="vr-strong">{{ assignOptions[0].name }}</span>？
            </template>
            <template v-else-if="assignOptions.length > 1">
              客資與名單歸屬不同，請選擇要指定的銷售：
            </template>
            <div v-else class="vr-text-secondary">
              請於預約表單中自行選擇銷售人員。
            </div>
          </div>
        </div>
        <div class="mac-sheet-foot">
          <template v-if="isBlockedForSales">
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--danger-fill" @click="closeBlockedDialog">知道了</button>
          </template>
          <template v-else-if="assignOptions.length > 0">
            <button type="button" class="mac-btn" @click="vipConflictDialog = false">不指定</button>
            <span class="mac-spacer"></span>
            <button
              v-for="opt in assignOptions"
              :key="opt.id"
              type="button"
              class="mac-btn mac-btn--primary mac-btn--wrap"
              @click="assignSalesFromDialog(opt)"
            >
              指定 {{ opt.name }}<span v-if="assignOptions.length > 1" class="vr-btn-note">（{{ opt.sourceLabel }}）</span>
            </button>
          </template>
          <template v-else>
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--primary" @click="vipConflictDialog = false">知道了</button>
          </template>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="conflictDialog" max-width="450" content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18" class="vr-icon-warning">mdi-alert-circle</v-icon>
          <span class="vr-sheet-title">重複預約確認</span>
        </div>

        <div class="mac-form vr-conflict-body">
          <div class="vr-sheet-text">
            此電話號碼 <span class="vr-strong vr-text-danger">{{ formData.customerPhone }}</span>
            已有預約記錄，請確認處理方式：
          </div>

          <div class="mac-form-label">既有預約詳情</div>
          <div class="mac-form-group">
            <div class="mac-form-row">
              <span class="vr-info-label">預約時間</span>
              <span class="vr-info-value">{{ formatDate(conflictInfo?.reservationTime) }}</span>
            </div>
            <div class="mac-form-row">
              <span class="vr-info-label">負責銷售</span>
              <span class="vr-info-value">{{ conflictInfo?.salesName || '未指定' }}</span>
            </div>
          </div>

          <!-- 無刪除權限提示 -->
          <div v-if="!canDeleteConflictReservation" class="mac-callout mac-callout--warning mt-3">
            <v-icon size="16">mdi-lock</v-icon>
            <div>
              <div class="vr-strong">無法刪除此預約</div>
              <div>您不是此預約的負責銷售，且無櫃台權限</div>
            </div>
          </div>
        </div>

        <div class="mac-sheet-foot vr-foot-stack">
          <button
            type="button"
            class="mac-btn mac-btn--lg mac-btn--wrap mac-btn--block mac-btn--danger"
            :disabled="!canDeleteConflictReservation"
            @click="resolveConflict('replace')"
          >
            <v-icon size="16">{{ canDeleteConflictReservation ? 'mdi-delete' : 'mdi-lock' }}</v-icon>
            刪除舊預約，建立新預約{{ canDeleteConflictReservation ? '' : '（無權限）' }}
          </button>
          <button
            type="button"
            class="mac-btn mac-btn--lg mac-btn--wrap mac-btn--block mac-btn--primary"
            @click="resolveConflict('keep')"
          >
            <v-icon size="16">mdi-plus-box-multiple</v-icon>
            保留舊預約，繼續建立（重複）
          </button>
          <button type="button" class="mac-btn mac-btn--lg mac-btn--block" @click="conflictDialog = false">取消操作</button>
        </div>
      </v-card>
    </v-dialog>

    <v-dialog v-model="settingsDialog" max-width="400" scrollable content-class="mac-dialog-fit">
      <v-card class="mac-sheet">
        <div class="mac-sheet-head">
          <v-icon size="18">mdi-account-cog</v-icon>
          <span class="vr-sheet-title">設定銷售人員顯示</span>
          <button type="button" class="mac-sheet-close" title="關閉" @click="settingsDialog = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="mac-form vr-settings-body">
          <div class="mac-form-label">勾選的人員將顯示於選單中</div>
          <div class="mac-form-group">
            <label v-for="sales in allSalesList" :key="sales.id" class="mac-form-row vr-check-row">
              <input
                type="checkbox"
                class="mac-check"
                :checked="!tempHiddenIds.includes(sales.id)"
                @change="toggleVisibility(sales.id)"
              >
              <span class="mac-form-row-main">
                <span class="mac-form-row-title">{{ sales.name }}</span>
              </span>
            </label>
            <div v-if="allSalesList.length === 0" class="mac-form-row mac-form-empty">尚無銷售人員</div>
          </div>
        </v-card-text>
        <div class="mac-sheet-foot">
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn" @click="settingsDialog = false">取消</button>
          <button type="button" class="mac-btn mac-btn--primary" @click="saveSettings">儲存設定</button>
        </div>
      </v-card>
    </v-dialog>

  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useReservationStore } from '@/store/reservationStore';
import { useUserStore } from '@/store/user';
import { useProjectStore } from '@/store/projectStore'; // 確保引用
import { useSalesDataStore } from '@/store/salesDataStore'; // 戶別/銷控資料
import { format } from 'date-fns';
import { useToast } from 'vue-toastification';
import ViewingReservationSavedCard from '@/components/ViewingReservationSavedCard.vue';
import { getTaiwanHoliday } from '@/utils/taiwanHolidays';
import { getViewingProjects } from '@/utils/viewingReservationAccess';

// ===== 原生 datetime-local 轉換工具 =====

const dtInputRef = ref(null);
const tempDateTime = ref(''); // 暫存值（字串格式）
const isEditingTime = ref(false); // 是否正在編輯時間

// 預約類型相關
const PREDEFINED_TYPES = ['新客', '回訪', '簽約', '其他'];
// 類型分段按鈕上的色點（與行事曆事件顏色一致）
const TYPE_DOT_COLORS = { '新客': '#007aff', '回訪': '#ff3b30', '簽約': '#34c759', '其他': '#ff9500' };
const customType = ref(''); // 「其他」類型的自訂輸入值

// ✅ 開啟對話框時的初始化載入狀態（讀取銷售資料 / 等候 Cloud Function 冷啟動做衝突檢查）
const pendingInits = ref(0);
const initStatus = ref('');
const initializing = computed(() => pendingInits.value > 0);

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

// 選到的日期是國定假日時顯示名稱（選擇中即時反映）
const holidayName = computed(() => {
  const value = isEditingTime.value ? tempDateTime.value : formData.value.reservationTime;
  return value ? getTaiwanHoliday(value) : '';
});



const props = defineProps({
  modelValue: Boolean,
  projectId: String,
  initialData: { type: Object, default: () => ({}) },
  initialDate: Date, // ✅ [新增] 接收外部傳入的預設時間
  projectSelectable: Boolean // 個人賞屋預約：新增／編輯時可選建案
});


const emit = defineEmits(['update:modelValue', 'saved', 'deleted']);

const reservationStore = useReservationStore();
const toast = useToast();
const userStore = useUserStore();
const projectStore = useProjectStore(); // 用於查找建案名稱以驗證權限
const salesDataStore = useSalesDataStore(); // 戶別/銷控資料

// ===== 建案（個人賞屋預約可選）=====
const selectedProjectId = ref(null);
const activeProjectId = computed(() => (props.projectSelectable ? selectedProjectId.value : props.projectId) || null);
const originalProjectId = computed(() => props.initialData?.projectId || null);
// 編輯時改到其他建案：比照新增預約重新檢查電話與客戶歸屬
const projectChanged = computed(() => isEdit.value && !!originalProjectId.value && activeProjectId.value !== originalProjectId.value);

const projectOptions = computed(() => {
    const list = getViewingProjects(userStore, projectStore);
    const current = originalProjectId.value;
    if (current && !list.some(p => p.id === current)) {
        list.push({ id: current, name: projectStore.idToNameMap[current] || current });
    }
    return list;
});

const projectNameOf = (id) => projectStore.idToNameMap[id] || id || '';

// ===== 戶別（簽約用）=====
const projectHouseholds = computed(() => {
    if (!activeProjectId.value) return [];
    const data = salesDataStore.getProjectData(activeProjectId.value);
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
    if (!activeProjectId.value) return;
    salesDataStore.loadProjectData(activeProjectId.value);
};

// --- 新增與調整的狀態 ---
const vipConflictDialog = ref(false); // 客資/名單重複彈窗
const vipGuestInfo = ref(null);      // 儲存匹配到的客資資訊
const leadInfo = ref(null);          // ✅ 儲存匹配到的聯絡名單歸屬資訊


// 取得當前建案名稱
const currentProjectName = computed(() => {
    return projectStore.idToNameMap[activeProjectId.value] || '本建案';
});

// --- 核心邏輯：失去焦點檢查 ---
const handlePhoneBlur = async () => {
  const phone = formData.value.customerPhone;

  // 1. 基本校驗：10碼且為新增（或編輯時改到其他建案）
  if (activeProjectId.value && phone && /^09\d{8}$/.test(phone) && (!isEdit.value || projectChanged.value)) {

     // A. 檢查是否已有「現有預約」 (原有機制)
     const resResult = await reservationStore.checkPhoneConflict(activeProjectId.value, phone);
     if (resResult) {
         conflictInfo.value = resResult; // ✅ 確保資料先賦值
         await nextTick(); // ✅ 確保 DOM 更新完成
         conflictDialog.value = true; // ✅ 再打開 Dialog
         return; // 若已有預約，優先處理預約衝突
     }

     // B. 檢查「客資資料庫」與「聯絡名單」歸屬（並行查詢）
     const [vipResult, leadResult] = await Promise.all([
         reservationStore.checkVipGuestPhone(activeProjectId.value, phone),
         reservationStore.checkLeadAssignee(activeProjectId.value, phone)
     ]);
     vipGuestInfo.value = vipResult;
     leadInfo.value = leadResult;

     if (vipResult || leadResult) {
         await nextTick();
         vipConflictDialog.value = true;
     }
  }
};

// 正規化電話號碼 (移除符號) 以利比對
const normalizePhoneDigits = (p) => String(p || '').replace(/\D/g, '');

/**
 * ✅ [在案驗證] 客資庫歸屬人是否仍在本案銷售名單
 * 有電話用電話比對（也容忍以 users 文件 ID 儲存的情況）；舊資料只有姓名時退回姓名比對
 */
const vipOwnerSales = computed(() => {
    const info = vipGuestInfo.value;
    if (!info) return null;
    const targetPhone = normalizePhoneDigits(info.latestSalesPhone);
    return reservationStore.salesList.find(s => {
        if (targetPhone) {
            return normalizePhoneDigits(s.phone) === targetPhone || normalizePhoneDigits(s.id) === targetPhone;
        }
        return !!info.latestSalesName && s.name === info.latestSalesName;
    }) || null;
});

// ✅ 聯絡名單目前歸屬對應的本案銷售人員（需仍在本案銷售名單才可指定）
const leadAssigneeSales = computed(() => {
    const lead = leadInfo.value;
    if (!lead?.assigned || !lead.phone) return null;
    const targetPhone = normalizePhoneDigits(lead.phone);
    return reservationStore.salesList.find(s =>
        normalizePhoneDigits(s.phone) === targetPhone || normalizePhoneDigits(s.id) === targetPhone
    ) || null;
});

// ✅ 可一鍵指定的銷售選項：客資歸屬與名單歸屬（同一人時只顯示一個）
const assignOptions = computed(() => {
    const opts = [];
    if (vipOwnerSales.value) {
        opts.push({ ...vipOwnerSales.value, sourceLabel: '客資' });
    }
    if (leadAssigneeSales.value && (!vipOwnerSales.value || leadAssigneeSales.value.id !== vipOwnerSales.value.id)) {
        opts.push({ ...leadAssigneeSales.value, sourceLabel: '名單' });
    }
    return opts;
});

// ✅ [搶客防護] 受限銷售：有「客資系統-銷售」但無櫃台權限、非管理員
// （權限以 projectId 直查 user.permissions，與 CustomerInteractionLog 相同模式）
const isRestrictedSalesUser = computed(() => {
    if (!userStore.user) return false;
    const roles = userStore.user?.roles || [];
    if (roles.includes('系統管理員') || roles.includes('超級管理員')) return false;
    const systems = userStore.user?.permissions?.[activeProjectId.value]?.systems || [];
    if (systems.includes('客資系統-櫃台')) return false;
    return systems.includes('客資系統-銷售');
});

// 目前使用者是否為此電話的歸屬銷售之一
// ✅ 判斷範圍：主歸屬（星號）、名單分配對象、以及客資的「完整銷售人員名單」——
//    多位銷售共有同一客戶時（如 A、B 都有客資），只要自己在名單內即視同自己的客戶，可預約
const selfIsOwner = computed(() => {
    const selfId = normalizePhoneDigits(userStore.user?.key);
    const selfName = userStore.user?.name || '';
    if (!selfId && !selfName) return false;

    // 1) 主歸屬 / 名單分配對象
    if (selfId && assignOptions.value.some(o =>
        normalizePhoneDigits(o.id) === selfId || normalizePhoneDigits(o.phone) === selfId
    )) return true;

    // 2) 客資完整銷售人員名單（共同銷售）：優先比電話，舊資料無電話時比姓名
    const vip = vipGuestInfo.value;
    if (vip) {
        if (selfId && (vip.allSalesPhones || []).some(p => normalizePhoneDigits(p) === selfId)) return true;
        if (selfName && (vip.allSalesNames || []).includes(selfName)) return true;
    }
    return false;
});

// 歸屬他人（排除自己）的有效銷售清單
const otherOwners = computed(() => {
    const selfId = normalizePhoneDigits(userStore.user?.key);
    return assignOptions.value.filter(o =>
        normalizePhoneDigits(o.id) !== selfId && normalizePhoneDigits(o.phone) !== selfId
    );
});

const ownerNamesText = computed(() => [...new Set(otherOwners.value.map(o => o.name))].join('、'));

// ✅ [搶客防護] 銷售不可把已歸屬他人的電話預約給自己：有他人有效歸屬且自己非歸屬人 → 封鎖
const isBlockedForSales = computed(() =>
    isRestrictedSalesUser.value && otherOwners.value.length > 0 && !selfIsOwner.value
);

// 封鎖時關閉提醒：一併清空電話，避免略過提醒繼續送出
const closeBlockedDialog = () => {
    formData.value.customerPhone = '';
    vipConflictDialog.value = false;
};

/**
 * ✅ 點擊「指定銷售」：將該員 UID (id) 設為表單值
 * 此時 v-select 會因為 ID 匹配成功，自動在畫面上顯示該員的「姓名」
 */
const assignSalesFromDialog = (opt) => {
    if (opt?.id) {
        formData.value.salesId = opt.id;
        console.log(`[Matching Success] 匹配到人員: ${opt.name} (來源: ${opt.sourceLabel})`);
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
// 儲存成功後切換為成功畫面（含加入行事曆）
const savedReservation = ref(null);

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
    const fullProjectName = projectStore.idToNameMap[activeProjectId.value] || activeProjectId.value;
    return userStore.hasProjectPermission('銷控系統', fullProjectName);
});

// ✅ 新增：判斷是否可以刪除重複預約
const canDeleteConflictReservation = computed(() => {
    if (!conflictInfo.value || !userStore.user) return false;

    const fullProjectName = projectStore.idToNameMap[activeProjectId.value] || activeProjectId.value;
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
    // 尚未選建案（或名單仍是其他建案的）時只能「不指定」
    if (!activeProjectId.value || reservationStore.currentSalesListProjectId !== activeProjectId.value) {
        return [{ id: null, name: '不指定', phone: '' }];
    }

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

// 目前用戶在本案可見銷售名單中 → 回傳自己的 ID，否則 null（對應「不指定」）
const selfSalesId = () => {
    const currentUserId = userStore.user?.key;
    if (!currentUserId || !activeProjectId.value) return null;
    return reservationStore.visibleSalesList.some(s => s.id === currentUserId) ? currentUserId : null;
};

// 切換建案：重新載入該案銷售名單；原指定銷售不在新建案就改回自己，戶別清空，並依新建案重新檢查電話
const onProjectChange = async (newId) => {
    if (!newId || newId === selectedProjectId.value) return;
    selectedProjectId.value = newId;
    formData.value.unitId = '';
    conflictInfo.value = null;
    vipGuestInfo.value = null;
    leadInfo.value = null;
    pendingInits.value++;
    try {
        initStatus.value = '載入銷售名單...';
        await reservationStore.fetchProjectSales(newId);
        if (selectedProjectId.value !== newId) return;
        const keep = formData.value.salesId && reservationStore.salesList.some(s => s.id === formData.value.salesId);
        if (!keep) formData.value.salesId = selfSalesId();
        if (formData.value.type === '簽約') ensureHouseholdsLoaded();
    } finally {
        pendingInits.value--;
    }
    if (selectedProjectId.value === newId) await handlePhoneBlur();
};

// ===== 撞期提醒：指定銷售在所有建案前後 1 小時內的其他預約 =====
const timeConflicts = ref([]);
let timeConflictSeq = 0;
watch(
    () => [props.modelValue, formData.value.reservationTime, formData.value.salesId],
    async ([open, time, salesId]) => {
        const seq = ++timeConflictSeq;
        if (!open || !time || !salesId) {
            timeConflicts.value = [];
            return;
        }
        const list = await reservationStore.findSalesTimeConflicts(salesId, time, props.initialData?.id || null);
        if (seq === timeConflictSeq) timeConflicts.value = list;
    }
);

const conflictSalesName = computed(() => {
    const s = reservationStore.salesList.find(x => x.id === formData.value.salesId);
    return s?.name || timeConflicts.value[0]?.salesName || '指定銷售';
});

// ✅ 優化後的初始化監控邏輯
watch(() => props.modelValue, async (val) => {
  if (val) {
    savedReservation.value = null;
    conflictInfo.value = null; // 清除上次開啟殘留的重複預約提示
    timeConflicts.value = [];
    pendingInits.value++;
    try {
      if (props.projectSelectable) {
        // 編輯帶原建案；新增時只有一個建案就直接選好，否則請使用者自己選，避免約錯建案
        const options = projectOptions.value;
        selectedProjectId.value = isEdit.value
          ? originalProjectId.value
          : (options.length === 1 ? options[0].id : null);
      }
      initStatus.value = '資料連線中...';
      await reservationStore.fetchProjectSales(activeProjectId.value);

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
        formData.value = {
          customerName: props.initialData?.customerName || '',
          customerPhone: props.initialData?.customerPhone || '',
          note: props.initialData?.note || '',
          reservationTime: props.initialDate || null,
          type: '新客',
          salesId: selfSalesId(), // ✅ 新增模式：指定銷售預設為自己
          unitId: ''
        };
        customType.value = '';

        // ✅ 優化：從聯絡名單打開時，先重置再檢查，確保 conflictInfo 第一時間顯示
        if (formData.value.customerPhone) {
          initStatus.value = '檢查此號碼是否已有預約...';
          await nextTick(); // 確保表單已更新
          await handlePhoneBlur(); // 自動觸發檢查並等待完成
          await nextTick(); // 確保 conflictInfo 已更新
        }
      }
      // 編輯/新增模式皆檢查：若 type 為「簽約」則預載該建案戶別資料
      if (formData.value.type === '簽約') ensureHouseholdsLoaded();
    } finally {
      pendingInits.value--;
    }
  }
}, { immediate: true });



const resolveConflict = async (action) => {
    conflictDialog.value = false;
    if (action === 'replace') {
        if (conflictInfo.value?.id) {
            const result = await reservationStore.cancelReservation(conflictInfo.value.id, '系統：電話衝突，使用者選擇覆蓋', userStore.user?.name || '');
            if (result?.success) toast.warning('已取消原預約，請記得刪除行事曆中的原行程', { timeout: 8000 });
            else alert('取消原預約失敗：' + (result?.error || '未知錯誤'));
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
    await reservationStore.updateSalesVisibility(activeProjectId.value, tempHiddenIds.value);
    settingsDialog.value = false;
};

// ... (save 函式保持不變) ...
const save = async () => {
    if (!valid.value) return;

    if (!formData.value.reservationTime) {
        alert("請選擇預約時間");
        return;
    }

    // ✅ [搶客防護] 受限銷售新增預約（或改到其他建案）時，儲存前強制重查歸屬（防止略過失焦提醒直接送出）
    if ((!isEdit.value || projectChanged.value) && isRestrictedSalesUser.value) {
        const phone = formData.value.customerPhone;
        if (phone && /^09\d{8}$/.test(phone)) {
            const [vipResult, leadResult] = await Promise.all([
                reservationStore.checkVipGuestPhone(activeProjectId.value, phone),
                reservationStore.checkLeadAssignee(activeProjectId.value, phone)
            ]);
            vipGuestInfo.value = vipResult;
            leadInfo.value = leadResult;
            if (isBlockedForSales.value) {
                await nextTick();
                vipConflictDialog.value = true;
                return;
            }
        }
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
        ...formData.value,
        projectId: activeProjectId.value, // 放在展開之後：編輯改建案時覆蓋原建案
        type: finalType,
        unitId: finalUnitId,
        salesName: sName,
        salesPhone: sPhone,
        operatorId: userStore.user.key,
        operatorName: userStore.user.name
    };

    // updateReservation 會把 payload.reservationTime 轉成 Timestamp，先保留 Date 供成功畫面使用
    const reservationTime = formData.value.reservationTime;
    const prevRaw = props.initialData?.reservationTime;
    const previousTime = isEdit.value && prevRaw ? (prevRaw.toDate ? prevRaw.toDate() : new Date(prevRaw)) : null;

    try {
        let reservationId = props.initialData?.id;
        const result = isEdit.value
            ? await reservationStore.updateReservation(reservationId, payload)
            : await reservationStore.addReservation(payload);
        if (!result?.success) throw new Error(result?.error || '未知錯誤');
        if (!isEdit.value) reservationId = result.id;
        // ✅ [新客自動建名單] 提醒使用者：新電話已自動建立名單並分配給指定銷售（改到其他建案時亦同）
        if (result.autoAssignedLead) {
            toast.success(`已完成預約｜此電話為新客戶，名單已自動分配給 ${result.autoAssignedLead.salesName}`, { timeout: 6000 });
        }
       emit('saved', payload);
        savedReservation.value = {
            id: reservationId,
            projectName: currentProjectName.value,
            customerName: payload.customerName,
            customerPhone: payload.customerPhone,
            reservationTime,
            previousTime,
            type: finalType,
            unitId: finalUnitId,
            salesName: sName,
            note: payload.note || ''
        };
    } catch (e) {
        alert("儲存失敗：" + e.message);
    } finally {
        saving.value = false;
    }
};

const confirmDelete = async () => {
    if (confirm('確定要取消此預約嗎？')) {
        const result = await reservationStore.cancelReservation(props.initialData.id, '使用者手動取消', userStore.user?.name || '');
        if (!result?.success) {
            alert('取消失敗：' + (result?.error || '未知錯誤'));
            return;
        }
        toast.warning('已取消預約，請記得刪除行事曆中的行程', { timeout: 8000 });
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

const formatShortDate = (ts) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return format(date, 'MM/dd HH:mm');
};
</script>

<style scoped>
/* macOS 表單視窗：淡灰底＋白色圓角分組，桌機標籤在左、手機標籤在上 */
.vr-dlg-head { min-height: 52px; align-items: center; }
.vr-dlg-titles { flex: 1 1 auto; min-width: 0; padding: 6px 0; }
.vr-dlg-title { font-size: 15px; font-weight: 600; line-height: 1.35; }
.vr-dlg-sub { font-size: 11.5px; font-weight: 400; color: #6e6e73; line-height: 1.45; overflow-wrap: anywhere; }
.vr-dlg-body { padding: 14px 16px 16px !important; }
.vr-group { margin-top: 12px; }

.vr-field-row {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 48px;
  padding: 8px 14px;
}
.vr-field-row + .vr-field-row { border-top: 1px solid #ececf0; }
.vr-field-row--top { align-items: flex-start; }
.vr-field-row--top .vr-field-label { padding-top: 8px; }
.vr-field-label {
  flex: 0 0 auto;
  min-width: 64px;
  white-space: nowrap;
  font-size: 13px;
  font-weight: 500;
  color: #1d1d1f;
  line-height: 1.35;
}
.vr-field-main { flex: 1 1 auto; min-width: 0; }
.vr-field-inline { display: flex; align-items: flex-start; gap: 6px; }
.vr-gear { width: 34px; height: 34px; }
.vr-field-error { margin: 4px 4px 0; font-size: 12px; color: #d62d20; }

.vr-type-seg .mac-form-seg-btn { height: 28px; }
.vr-type-dot { width: 7px; height: 7px; flex-shrink: 0; border-radius: 50%; }

.vr-dlg-foot .mac-btn { min-width: 64px; }
.vr-save-btn .v-progress-circular { color: #fff; }

.vr-init-status { margin-top: 14px; font-size: 14px; font-weight: 600; color: #1d1d1f; }
.vr-init-sub { margin-top: 4px; font-size: 12px; color: #6e6e73; }

/* 子視窗（比對提醒／重複預約／人員設定） */
.vr-sheet-title { flex: 1 1 auto; min-width: 0; line-height: 1.35; overflow-wrap: anywhere; }
.vr-sheet-text { font-size: 13.5px; line-height: 1.65; color: #1d1d1f; overflow-wrap: anywhere; }
.vr-strong { font-weight: 700; }
.vr-text-danger { color: #d62d20; }
.vr-text-secondary { font-size: 12.5px; color: #6e6e73; }
.vr-split { margin-top: 12px; padding-top: 12px; border-top: 1px solid #ececf0; }
.vr-tag {
  display: inline-block;
  margin-left: 4px;
  padding: 0 7px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  vertical-align: 1px;
}
.vr-tag--warning { background: rgba(255, 159, 10, 0.16); color: #a35f00; }
.vr-btn-note { font-weight: 400; opacity: 0.9; }
.mac-sheet-head .v-icon.vr-icon-danger { color: #d62d20; }
.mac-sheet-head .v-icon.vr-icon-accent { color: #0071e3; }
.mac-sheet-head .v-icon.vr-icon-warning { color: #ff9500; }

.vr-conflict-body { padding: 14px 16px 16px; }
.vr-conflict-body .mac-form-label { margin-top: 14px; }
.vr-info-label { flex: 0 0 auto; min-width: 64px; color: #6e6e73; white-space: nowrap; }
.vr-info-value { flex: 1 1 auto; min-width: 0; font-weight: 600; overflow-wrap: anywhere; }
.vr-foot-stack { flex-direction: column; align-items: stretch; }

.vr-settings-body { padding: 4px 16px 16px !important; }
.vr-settings-body .mac-form-label { margin-top: 12px; }
.vr-check-row { cursor: pointer; }
.vr-check-row:hover { background: #f7f7f9; }

/* ===== 預約時間（原生 datetime-local） ===== */
.native-dt-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 34px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.14), 0 0.5px 1px rgba(0, 0, 0, 0.04);
  color: #1d1d1f;
  font-family: inherit;
  text-align: left;
  transition: box-shadow 0.12s;
}
button.native-dt-wrapper { cursor: pointer; }
button.native-dt-wrapper:hover { box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.24), 0 0.5px 1px rgba(0, 0, 0, 0.04); }
.native-dt-wrapper:focus-visible,
.native-dt-wrapper:focus-within {
  outline: none;
  box-shadow: inset 0 0 0 1px #0071e3, 0 0 0 3px rgba(0, 113, 227, 0.22);
}
.native-dt-wrapper--error:not(:focus-within) {
  box-shadow: inset 0 0 0 1px #d62d20, 0 0 0 3px rgba(214, 45, 32, 0.14);
}
.native-dt-icon { margin-left: auto; color: #8e8e93; flex-shrink: 0; }

.native-dt-input {
  flex: 1;
  min-width: 0;
  padding: 6px 0;
  border: none;
  outline: none;
  background: transparent;
  color: #1d1d1f;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.native-dt-input::-webkit-calendar-picker-indicator {
  cursor: pointer;
  opacity: 0.55;
  padding: 2px;
}
.native-dt-input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
.native-dt-input:invalid { color: #8e8e93; }

.native-dt-display {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  overflow-wrap: anywhere;
}
.native-dt-placeholder {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  color: #8e8e93;
}
.vr-holiday-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  padding: 2px 9px;
  border-radius: 10px;
  background: rgba(255, 59, 48, 0.1);
  color: #d62d20;
  font-size: 12.5px;
  font-weight: 600;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.vr-clash { margin-top: 8px; }
.vr-clash-main { min-width: 0; }
.vr-clash-row { font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
.native-dt-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

/* 初始化載入遮罩：提高白色 scrim 不透明度，蓋住半載入的表單 */
.init-overlay :deep(.v-overlay__scrim) {
  opacity: 0.94;
}

/* ===== 手機版：標籤在上、欄位滿寬；輸入字級 16px 避免 iOS 聚焦放大 ===== */
@media (max-width: 600px) {
  .vr-dlg-body { padding: 12px 12px 14px !important; }
  .vr-field-row { flex-direction: column; align-items: stretch; gap: 6px; padding: 10px 12px; }
  .vr-field-row--top .vr-field-label { padding-top: 0; }
  .vr-field-label { flex: 0 0 auto; font-size: 12px; font-weight: 600; color: #6e6e73; }
  .vr-gear { width: 40px; height: 40px; }
  .vr-type-seg .mac-form-seg-btn { height: 32px; font-size: 14px; }
  .native-dt-wrapper { min-height: 40px; }
  .native-dt-input, .native-dt-display, .native-dt-placeholder { font-size: 16px; }
  .vr-dlg-foot .mac-btn { height: 36px; font-size: 14px; }
  .native-dt-actions .mac-btn { height: 34px; }
}
</style>
