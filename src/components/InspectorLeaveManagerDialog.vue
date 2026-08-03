<template>
  <v-dialog :model-value="modelValue" @update:model-value="v => emit('update:modelValue', v)" :fullscreen="xs" max-width="1180px" scrollable>
    <v-card class="d-flex flex-column">
      <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
        <v-icon start>mdi-account-clock</v-icon>
        <span class="text-subtitle-1 font-weight-bold">驗屋人員排休{{ projectName ? `：${projectName}` : '' }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-3 pa-sm-4" style="background-color:#f5f6f8;">
        <!-- 工具列：月份切換 + 篩選 + 動作 -->
        <div class="d-flex align-center flex-wrap ga-2 mb-3">
          <div class="d-flex align-center">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" title="上月" @click="shiftMonth(-1)"></v-btn>
            <span class="text-h6 font-weight-bold mx-1" style="min-width:110px;text-align:center;">{{ monthLabel }}</span>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" title="下月" @click="shiftMonth(1)"></v-btn>
            <v-btn size="small" variant="tonal" color="primary" class="ml-1" @click="goThisMonth">本月</v-btn>
            <v-progress-circular v-if="isLoading" indeterminate size="18" width="2" color="primary" class="ml-2"></v-progress-circular>
          </div>
          <v-spacer></v-spacer>
          <v-select
            v-model="staffFilter"
            :items="staffNames"
            label="人員篩選（不選=全部）"
            multiple chips closable-chips clearable
            density="compact" variant="outlined" hide-details
            prepend-inner-icon="mdi-filter-variant"
            style="min-width:220px;max-width:320px;"
          ></v-select>
          <v-btn v-if="canEdit" size="small" variant="outlined" color="primary" prepend-icon="mdi-account-cog" @click="openManageStaff">管理人員</v-btn>
          <v-btn v-if="canEdit" size="small" variant="flat" color="primary" prepend-icon="mdi-plus" @click="openCreateDialog()">新增排休/備註</v-btn>
        </div>

        <!-- 人員快速選取列 -->
        <div class="bg-white rounded-lg pa-3 mb-3" style="border:1px solid #eceff1;">
          <div class="d-flex align-center mb-1">
            <v-icon size="16" color="primary" class="mr-1">mdi-account-hard-hat-outline</v-icon>
            <span class="text-caption font-weight-bold">驗屋人員（{{ staffNames.length }} 人）</span>
            <span v-if="canEdit" class="text-caption text-grey ml-2">先點選人員、再點月曆日期即可快速建立排休；或直接點日期再選人員。</span>
          </div>
          <div v-if="staffNames.length" class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="name in staffNames" :key="name"
              size="small" label style="cursor:pointer;"
              :color="selectedStaff === name ? 'primary' : 'grey-darken-1'"
              :variant="selectedStaff === name ? 'flat' : 'outlined'"
              :prepend-icon="selectedStaff === name ? 'mdi-cursor-default-click' : 'mdi-account-outline'"
              @click="toggleSelectedStaff(name)"
            >
              {{ name }}
              <span v-if="monthLeaveCountByStaff[name]" class="ml-1 text-caption">({{ monthLeaveCountByStaff[name] }}休)</span>
            </v-chip>
          </div>
          <div v-else class="text-caption text-grey">尚未建立驗屋人員，請點「管理人員」新增。</div>
          <v-alert v-if="selectedStaff" type="info" variant="tonal" density="compact" class="mt-2 text-caption">
            已選取「{{ selectedStaff }}」，點月曆上的日期即可為其建立排休。（再點一次人員可取消選取）
          </v-alert>
        </div>

        <!-- 月曆 -->
        <div class="leave-calendar-scroll bg-white rounded-lg" style="border:1px solid #eceff1;">
          <div class="leave-calendar">
            <div v-for="d in ['一','二','三','四','五','六','日']" :key="d" class="leave-dow">{{ d }}</div>
            <div
              v-for="cell in monthCells" :key="cell.key"
              :class="['leave-cell', { dim: !cell.inMonth, today: cell.isToday, weekend: cell.isWeekend, clickable: canEdit }]"
              @click="onCellClick(cell)"
            >
              <div class="d-flex align-center mb-1">
                <span class="leave-cell-date">{{ cell.dateNum }}</span>
                <v-spacer></v-spacer>
                <v-tooltip v-if="staffNames.length" location="top">
                  <template v-slot:activator="{ props }">
                    <span v-bind="props" :class="['leave-availability', cell.availability.levelClass]">
                      出勤 {{ cell.availability.available }}/{{ cell.availability.total }}
                    </span>
                  </template>
                  <div class="text-caption">
                    <div v-if="cell.availability.fullNames.length">休假：{{ cell.availability.fullNames.join('、') }}</div>
                    <div v-if="cell.availability.amNames.length">上休：{{ cell.availability.amNames.join('、') }}</div>
                    <div v-if="cell.availability.pmNames.length">下休：{{ cell.availability.pmNames.join('、') }}</div>
                    <div v-if="!cell.availability.fullNames.length && !cell.availability.amNames.length && !cell.availability.pmNames.length">全員可出勤</div>
                  </div>
                </v-tooltip>
              </div>

              <!-- 排休 chips -->
              <v-tooltip v-for="leave in cell.leaves" :key="leave.id" location="top">
                <template v-slot:activator="{ props }">
                  <div
                    v-bind="props"
                    :class="['leave-chip', { conflict: leave.hasConflict }]"
                    :style="leaveChipStyle(leave)"
                    @click.stop="canEdit && openEditLeave(leave)"
                  >
                    <v-icon v-if="leave.hasConflict" size="x-small" color="red-darken-2" class="mr-1">mdi-alert</v-icon>
                    {{ leave.staffName }}({{ LEAVE_TYPE_LABELS[leave.type] }})
                  </div>
                </template>
                <div class="text-caption">
                  <div>{{ leave.staffName }}：{{ LEAVE_TYPE_LABELS[leave.type] }}</div>
                  <div v-if="leave.note">備註：{{ leave.note }}</div>
                  <div v-if="leave.updatedByName">建立/修改：{{ leave.updatedByName }}{{ formatLogTime(leave.updatedAt || leave.createdAt) }}</div>
                  <div v-if="leave.hasConflict" class="text-red-lighten-3">⚠ 該時段已被排入 {{ leave.conflicts.length }} 筆驗屋（{{ leave.conflicts.map(c => c.unitId).join('、') }}）</div>
                  <div v-if="canEdit">點擊可修改/刪除</div>
                </div>
              </v-tooltip>

              <!-- 備註事項 chips -->
              <v-tooltip v-for="note in cell.notes" :key="note.id" location="top">
                <template v-slot:activator="{ props }">
                  <div v-bind="props" class="leave-note-chip" @click.stop="canEdit && openEditNote(note)">
                    <v-icon size="x-small" class="mr-1">mdi-note-text-outline</v-icon>{{ note.note }}
                  </div>
                </template>
                <div class="text-caption">
                  <div>備註：{{ note.note }}</div>
                  <div v-if="note.updatedByName">建立/修改：{{ note.updatedByName }}{{ formatLogTime(note.updatedAt || note.createdAt) }}</div>
                  <div v-if="canEdit">點擊可修改/刪除</div>
                </div>
              </v-tooltip>
            </div>
          </div>
        </div>

        <!-- 圖例 -->
        <div class="d-flex align-center flex-wrap ga-3 mt-3 text-caption text-grey-darken-1">
          <span class="d-flex align-center"><span class="legend-dot" :style="{ backgroundColor: LEAVE_TYPE_COLORS.am.bg, borderColor: LEAVE_TYPE_COLORS.am.border }"></span>上休（12:00 前）</span>
          <span class="d-flex align-center"><span class="legend-dot" :style="{ backgroundColor: LEAVE_TYPE_COLORS.pm.bg, borderColor: LEAVE_TYPE_COLORS.pm.border }"></span>下休（12:00 起）</span>
          <span class="d-flex align-center"><span class="legend-dot" :style="{ backgroundColor: LEAVE_TYPE_COLORS.full.bg, borderColor: LEAVE_TYPE_COLORS.full.border }"></span>休假（整天）</span>
          <span class="d-flex align-center"><v-icon size="14" color="red-darken-2" class="mr-1">mdi-alert</v-icon>排休當日/時段已被排入驗屋</span>
          <span class="d-flex align-center"><v-icon size="14" class="mr-1">mdi-note-text-outline</v-icon>備註事項</span>
        </div>
      </v-card-text>
    </v-card>

    <!-- 建立排休 / 備註 -->
    <v-dialog v-model="isCreateDialogVisible" max-width="560px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>mdi-calendar-plus</v-icon>
          <span class="text-subtitle-1">新增排休 / 備註事項</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isCreateDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-btn-toggle v-model="createForm.kind" mandatory density="compact" color="primary" variant="outlined" class="mb-4 d-flex">
            <v-btn value="leave" size="small" prepend-icon="mdi-account-clock" class="flex-grow-1">人員排休</v-btn>
            <v-btn value="note" size="small" prepend-icon="mdi-note-text-outline" class="flex-grow-1">備註事項</v-btn>
          </v-btn-toggle>

          <template v-if="createForm.kind === 'leave'">
            <div class="text-caption font-weight-bold mb-1">人員（可複選）</div>
            <div class="d-flex flex-wrap ga-2 mb-4">
              <v-chip
                v-for="name in staffNames" :key="name"
                size="small" label style="cursor:pointer;"
                :color="createForm.staff.includes(name) ? 'primary' : 'grey-darken-1'"
                :variant="createForm.staff.includes(name) ? 'flat' : 'outlined'"
                :prepend-icon="createForm.staff.includes(name) ? 'mdi-check-circle' : 'mdi-plus-circle-outline'"
                @click="toggleCreateStaff(name)"
              >{{ name }}</v-chip>
              <div v-if="!staffNames.length" class="text-caption text-grey">尚未建立人員，請先於「管理人員」新增。</div>
            </div>
          </template>

          <div class="text-caption font-weight-bold mb-1">日期</div>
          <v-btn-toggle v-model="createForm.dateMode" mandatory density="compact" color="primary" variant="outlined" class="mb-2">
            <v-btn value="multi" size="small">單日 / 多日</v-btn>
            <v-btn value="range" size="small">連續區間</v-btn>
          </v-btn-toggle>
          <VueDatePicker
            v-if="createForm.dateMode === 'multi'"
            v-model="createForm.datesMulti"
            multi-dates :enable-time-picker="false"
            locale="zh-TW" format="yyyy/MM/dd" teleport
            placeholder="點選一個或多個日期"
            class="mb-4"
          />
          <VueDatePicker
            v-else
            v-model="createForm.dateRangeVal"
            range :enable-time-picker="false"
            locale="zh-TW" format="yyyy/MM/dd" teleport auto-apply
            placeholder="選擇起迄日期"
            class="mb-4"
          />

          <template v-if="createForm.kind === 'leave'">
            <div class="text-caption font-weight-bold mb-1">排休方式</div>
            <v-btn-toggle v-model="createForm.type" mandatory density="compact" color="primary" variant="outlined" class="mb-1 d-flex">
              <v-btn v-for="opt in LEAVE_TYPE_OPTIONS" :key="opt.value" :value="opt.value" size="small" :prepend-icon="opt.icon" class="flex-grow-1">{{ opt.label }}</v-btn>
            </v-btn-toggle>
            <div class="text-caption text-grey mb-3">{{ LEAVE_TYPE_OPTIONS.find(o => o.value === createForm.type)?.hint }}</div>
            <v-text-field v-model="createForm.note" label="排休原因/備註（選填，如：特休、事假）" variant="outlined" density="compact" maxlength="200" hide-details class="mb-2"></v-text-field>
          </template>
          <template v-else>
            <v-textarea v-model="createForm.note" label="備註內容（顯示於排休月曆上）" variant="outlined" density="compact" rows="2" auto-grow maxlength="200" hide-details class="mb-2"></v-textarea>
          </template>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isCreateDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="submitCreate">建立</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 排休衝突確認 -->
    <v-dialog v-model="isConflictDialogVisible" max-width="560px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-warning py-3 px-4">
          <v-icon start>mdi-alert</v-icon>
          <span class="text-subtitle-1">排休時段已有驗屋編排</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-2 mb-3">以下人員在排休時段內已被排入驗屋人員，建立排休後時間表上會以醒目標記提醒：</p>
          <v-list density="compact" class="border rounded">
            <v-list-item v-for="(c, i) in pendingConflicts" :key="i">
              <template v-slot:prepend><v-icon size="small" color="warning">mdi-account-alert</v-icon></template>
              <v-list-item-title class="text-body-2">
                {{ c.staffName }}（{{ LEAVE_TYPE_LABELS[c.leaveType] }}）－ {{ c.date }} {{ c.time }}
              </v-list-item-title>
              <v-list-item-subtitle class="text-caption">{{ c.unitId }} {{ c.bookingType }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isConflictDialogVisible = false">取消</v-btn>
          <v-btn color="warning" variant="flat" :loading="isSaving" @click="confirmConflictSave">仍要建立排休</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 編輯排休 -->
    <v-dialog v-model="isEditLeaveDialogVisible" max-width="480px">
      <v-card v-if="editingLeave">
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>mdi-account-clock</v-icon>
          <span class="text-subtitle-1">{{ editingLeave.staffName }}－{{ editingLeave.date }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isEditLeaveDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <div class="text-caption font-weight-bold mb-1">排休方式</div>
          <v-btn-toggle v-model="editLeaveForm.type" mandatory density="compact" color="primary" variant="outlined" class="mb-3 d-flex">
            <v-btn v-for="opt in LEAVE_TYPE_OPTIONS" :key="opt.value" :value="opt.value" size="small" :prepend-icon="opt.icon" class="flex-grow-1">{{ opt.label }}</v-btn>
          </v-btn-toggle>
          <v-text-field v-model="editLeaveForm.note" label="排休原因/備註（選填）" variant="outlined" density="compact" maxlength="200" hide-details></v-text-field>
          <div v-if="editingLeave.updatedByName" class="text-caption text-grey mt-2">
            最後異動：{{ editingLeave.updatedByName }}{{ formatLogTime(editingLeave.updatedAt || editingLeave.createdAt) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" :loading="isSaving" @click="deleteLeaveRecord(editingLeave)">刪除排休</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isEditLeaveDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveEditLeave">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 編輯備註 -->
    <v-dialog v-model="isEditNoteDialogVisible" max-width="480px">
      <v-card v-if="editingNote">
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>mdi-note-text-outline</v-icon>
          <span class="text-subtitle-1">備註事項－{{ editingNote.date }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isEditNoteDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-textarea v-model="editNoteForm.note" label="備註內容" variant="outlined" density="compact" rows="2" auto-grow maxlength="200" hide-details></v-textarea>
          <div v-if="editingNote.updatedByName" class="text-caption text-grey mt-2">
            最後異動：{{ editingNote.updatedByName }}{{ formatLogTime(editingNote.updatedAt || editingNote.createdAt) }}
          </div>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-btn color="error" variant="tonal" prepend-icon="mdi-delete-outline" :loading="isSaving" @click="deleteNoteRecord(editingNote)">刪除備註</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isEditNoteDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveEditNote">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 管理人員（與「預約選單設定 > 編輯人員」共用同一份名單） -->
    <v-dialog v-model="isManageStaffDialogVisible" max-width="560px">
      <v-card>
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>mdi-account-cog</v-icon>
          <span class="text-subtitle-1">管理驗屋人員</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isManageStaffDialogVisible = false"></v-btn>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-alert type="info" variant="tonal" density="compact" class="mb-3 text-caption">
            此名單與「預約選單設定」的「編輯人員」共用，修改後兩邊同步生效。輸入姓名後按 Enter 新增，點 chip 的 × 可移除。
          </v-alert>
          <v-combobox
            v-model="staffDraft"
            label="驗屋人員名單"
            multiple chips closable-chips clearable
            variant="outlined" density="compact"
            hint="輸入姓名後按 Enter 新增"
            persistent-hint
          ></v-combobox>
        </v-card-text>
        <v-card-actions class="pa-3 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isManageStaffDialogVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="saveStaffList">儲存名單</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :timeout="2500" :color="snackbarColor">{{ snackbarText }}</v-snackbar>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue';
import { useDisplay } from 'vuetify';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, isToday, isSaturday, isSunday, parseISO } from 'date-fns';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { useUserStore } from '@/store/user';
import {
  LEAVE_TYPE_LABELS, LEAVE_TYPE_OPTIONS, LEAVE_TYPE_COLORS,
  buildLeaveMap, extractStartTime,
} from '@/utils/inspectorLeaveUtils';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  staffList: { type: Array, default: () => [] },
  canEdit: { type: Boolean, default: false },
});
const emit = defineEmits(['update:modelValue', 'staff-updated', 'leaves-changed']);

const { xs } = useDisplay();
const userStore = useUserStore();

const inspectionApi = (action, data) => {
  const callable = httpsCallable(functions, 'inspectionCalendarApi');
  return callable({ action, data });
};

// --- 狀態 ---
const displayedMonth = ref(startOfMonth(new Date()));
const isLoading = ref(false);
const isSaving = ref(false);
const leaveRecords = ref([]); // 本月（含前後補格）的排休 + 備註
const monthAppointments = ref([]); // 本月預約（衝突比對用）
const staffFilter = ref([]);
const selectedStaff = ref(null);

// 人員名單：以內部狀態為準（props 先帶入，開啟時再向後端抓最新，避免父層尚未載入導致名單為空）
const staffNames = ref([...props.staffList]);
watch(() => props.staffList, (list) => {
  if (Array.isArray(list) && list.length) staffNames.value = [...list];
});

async function refreshStaffFromServer() {
  try {
    const res = await inspectionApi('getProjectConfig', { projectId: props.projectId });
    const list = Array.isArray(res.data?.inspectionStaff) ? res.data.inspectionStaff : [];
    staffNames.value = list;
    emit('staff-updated', list); // 同步回父層的人員選單
  } catch (err) {
    console.warn('[排休] 讀取人員名單失敗:', err);
  }
}

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
function showMsg(text, color = 'success') {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

// 台灣時區日期字串（與時間表判定一致）
const TAIPEI_DATE_FMT = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
const toTaipeiDateStr = (date) => TAIPEI_DATE_FMT.format(date);

const monthLabel = computed(() => format(displayedMonth.value, 'yyyy年M月'));
const gridStart = computed(() => startOfWeek(displayedMonth.value, { weekStartsOn: 1 }));
const gridEnd = computed(() => endOfWeek(endOfMonth(displayedMonth.value), { weekStartsOn: 1 }));

function shiftMonth(delta) {
  displayedMonth.value = addMonths(displayedMonth.value, delta);
}
function goThisMonth() {
  displayedMonth.value = startOfMonth(new Date());
}

// --- 資料載入 ---
async function fetchMonthData() {
  if (!props.projectId) return;
  isLoading.value = true;
  try {
    const startStr = format(gridStart.value, 'yyyy-MM-dd');
    const endStr = format(gridEnd.value, 'yyyy-MM-dd');
    const [leavesRes, apptsRes] = await Promise.all([
      inspectionApi('fetchInspectorLeaves', { projectId: props.projectId, startDate: startStr, endDate: endStr }),
      inspectionApi('fetchCalendarData', { projectId: props.projectId, startDate: gridStart.value.toISOString(), endDate: new Date(gridEnd.value.getTime() + 24 * 3600 * 1000).toISOString() }),
    ]);
    leaveRecords.value = leavesRes.data?.data || [];
    monthAppointments.value = normalizeAppointments(apptsRes.data || []);
  } catch (err) {
    console.error('[排休] 載入月份資料失敗:', err);
    showMsg(`載入排休資料失敗：${err.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

// 將預約資料整理成衝突比對用的精簡結構（僅保留「預約中」且有驗屋人員的）
function normalizeAppointments(rawList) {
  const result = [];
  for (const appt of rawList) {
    if (appt.status !== '預約中') continue;
    const inspectors = String(appt.inspectors || '').split(',').map(s => s.trim()).filter(Boolean);
    if (!inspectors.length) continue;
    let dateObj = appt.appointmentDate;
    if (dateObj && typeof dateObj === 'object' && dateObj._seconds !== undefined) dateObj = new Date(dateObj._seconds * 1000);
    else if (typeof dateObj === 'string') dateObj = new Date(dateObj);
    if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) continue;
    result.push({
      id: appt.id,
      unitId: appt.unitId || '',
      bookingType: appt.bookingType || '',
      dateStr: toTaipeiDateStr(dateObj),
      time: String(appt.appointmentTimeSlot || ''),
      startTime: extractStartTime(appt.appointmentTimeSlot),
      inspectors,
    });
  }
  return result;
}

watch([() => props.modelValue, displayedMonth], ([open]) => {
  if (open) fetchMonthData();
}, { immediate: true });

// 開啟時向後端抓最新人員名單（父層 bookingOptions 可能尚未載入）
watch(() => props.modelValue, (open) => {
  if (open) refreshStaffFromServer();
}, { immediate: true });

// --- 衝突比對 ---
// 判斷排休類型與預約開始時間是否重疊
function leaveAffectsTime(leaveType, startTime) {
  if (leaveType === 'full') return true;
  if (leaveType === 'am') return startTime < '12:00';
  if (leaveType === 'pm') return startTime >= '12:00';
  return false;
}

// 找出某人某日某排休類型的衝突預約
function findConflicts(staffName, dateStr, leaveType, appointments) {
  return (appointments || monthAppointments.value).filter(a =>
    a.dateStr === dateStr && a.inspectors.includes(staffName) && leaveAffectsTime(leaveType, a.startTime)
  );
}

// --- 月曆格 ---
const parsedRecords = computed(() => buildLeaveMap(leaveRecords.value));

const monthCells = computed(() => {
  const { leaveMap, notesByDate } = parsedRecords.value;
  const totalStaff = staffNames.value.length;
  return eachDayOfInterval({ start: gridStart.value, end: gridEnd.value }).map(d => {
    const key = format(d, 'yyyy-MM-dd');
    const dayLeaves = Object.values(leaveMap[key] || {})
      .sort((a, b) => a.staffName.localeCompare(b.staffName, 'zh-Hant'));
    const visibleLeaves = (staffFilter.value.length ? dayLeaves.filter(l => staffFilter.value.includes(l.staffName)) : dayLeaves)
      .map(l => {
        const conflicts = findConflicts(l.staffName, key, l.type);
        return { ...l, hasConflict: conflicts.length > 0, conflicts };
      });
    const fullNames = dayLeaves.filter(l => l.type === 'full').map(l => l.staffName);
    const amNames = dayLeaves.filter(l => l.type === 'am').map(l => l.staffName);
    const pmNames = dayLeaves.filter(l => l.type === 'pm').map(l => l.staffName);
    const available = Math.max(0, totalStaff - fullNames.length);
    const ratio = totalStaff ? available / totalStaff : 1;
    return {
      key,
      dateObj: d,
      dateNum: format(d, 'd'),
      inMonth: d.getMonth() === displayedMonth.value.getMonth(),
      isToday: isToday(d),
      isWeekend: isSaturday(d) || isSunday(d),
      leaves: visibleLeaves,
      notes: notesByDate[key] || [],
      availability: {
        total: totalStaff,
        available,
        fullNames, amNames, pmNames,
        levelClass: ratio < 0.5 ? 'level-danger' : (ratio < 0.8 || amNames.length + pmNames.length > 0 ? 'level-warn' : 'level-ok'),
      },
    };
  });
});

// 本月每人排休天數（人員 chips 顯示）
const monthLeaveCountByStaff = computed(() => {
  const monthPrefix = format(displayedMonth.value, 'yyyy-MM');
  const counts = {};
  for (const rec of leaveRecords.value) {
    if ((rec.kind || 'leave') !== 'leave') continue;
    if (!rec.date.startsWith(monthPrefix)) continue;
    counts[rec.staffName] = (counts[rec.staffName] || 0) + 1;
  }
  return counts;
});

function leaveChipStyle(leave) {
  const c = LEAVE_TYPE_COLORS[leave.type] || LEAVE_TYPE_COLORS.full;
  return { backgroundColor: c.bg, color: c.text, borderColor: leave.hasConflict ? '#D32F2F' : c.border };
}

function formatLogTime(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return ` 於 ${new Intl.DateTimeFormat('zh-TW', { timeZone: 'Asia/Taipei', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d)}`;
  } catch { return ''; }
}

// --- 快速選人 ---
function toggleSelectedStaff(name) {
  selectedStaff.value = selectedStaff.value === name ? null : name;
}

// --- 建立排休/備註 ---
const isCreateDialogVisible = ref(false);
const createForm = reactive({
  kind: 'leave',
  staff: [],
  dateMode: 'multi',
  datesMulti: [],
  dateRangeVal: [],
  type: 'full',
  note: '',
});

function openCreateDialog(prefill = {}) {
  createForm.kind = 'leave';
  createForm.staff = prefill.staff ? [...prefill.staff] : (selectedStaff.value ? [selectedStaff.value] : []);
  createForm.dateMode = 'multi';
  createForm.datesMulti = prefill.date ? [prefill.date] : [];
  createForm.dateRangeVal = [];
  createForm.type = 'full';
  createForm.note = '';
  isCreateDialogVisible.value = true;
}

function onCellClick(cell) {
  if (!props.canEdit) return;
  openCreateDialog({ date: cell.dateObj });
}

function toggleCreateStaff(name) {
  const idx = createForm.staff.indexOf(name);
  if (idx >= 0) createForm.staff.splice(idx, 1);
  else createForm.staff.push(name);
}

// 取出建立表單選定的日期字串陣列
function resolveCreateDates() {
  let dates = [];
  if (createForm.dateMode === 'multi') {
    dates = (createForm.datesMulti || []).map(d => (d instanceof Date ? d : new Date(d)));
  } else {
    const [s, e] = createForm.dateRangeVal || [];
    if (s && e) dates = eachDayOfInterval({ start: new Date(s), end: new Date(e) });
    else if (s) dates = [new Date(s)];
  }
  return [...new Set(dates.filter(d => !isNaN(d.getTime())).map(d => format(d, 'yyyy-MM-dd')))].sort();
}

const pendingConflicts = ref([]);
const pendingEntries = ref([]);
const isConflictDialogVisible = ref(false);

async function submitCreate() {
  const dates = resolveCreateDates();
  if (!dates.length) { showMsg('請選擇日期', 'warning'); return; }

  if (createForm.kind === 'note') {
    const note = (createForm.note || '').trim();
    if (!note) { showMsg('請輸入備註內容', 'warning'); return; }
    const entries = dates.map(date => ({ kind: 'note', date, note }));
    await saveEntries(entries);
    return;
  }

  if (!createForm.staff.length) { showMsg('請選擇人員', 'warning'); return; }
  const entries = [];
  for (const name of createForm.staff) {
    for (const date of dates) {
      entries.push({ kind: 'leave', date, staffName: name, type: createForm.type, note: (createForm.note || '').trim() });
    }
  }

  // B1：建立前檢查衝突（該人員該時段已被排入驗屋）
  isSaving.value = true;
  try {
    const appointments = await getAppointmentsCovering(dates);
    const conflicts = [];
    for (const entry of entries) {
      for (const appt of findConflicts(entry.staffName, entry.date, entry.type, appointments)) {
        conflicts.push({ staffName: entry.staffName, leaveType: entry.type, date: entry.date, time: appt.time, unitId: appt.unitId, bookingType: appt.bookingType });
      }
    }
    if (conflicts.length) {
      pendingConflicts.value = conflicts;
      pendingEntries.value = entries;
      isConflictDialogVisible.value = true;
      return;
    }
    await saveEntries(entries);
  } catch (err) {
    showMsg(`建立排休失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

// 取得涵蓋指定日期的預約（超出目前載入月份時另外查詢）
async function getAppointmentsCovering(dates) {
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  const loadedMin = format(gridStart.value, 'yyyy-MM-dd');
  const loadedMax = format(gridEnd.value, 'yyyy-MM-dd');
  if (minDate >= loadedMin && maxDate <= loadedMax) return monthAppointments.value;
  const res = await inspectionApi('fetchCalendarData', {
    projectId: props.projectId,
    startDate: parseISO(`${minDate}T00:00:00`).toISOString(),
    endDate: parseISO(`${maxDate}T23:59:59`).toISOString(),
  });
  return normalizeAppointments(res.data || []);
}

async function confirmConflictSave() {
  await saveEntries(pendingEntries.value);
  isConflictDialogVisible.value = false;
  pendingEntries.value = [];
  pendingConflicts.value = [];
}

async function saveEntries(entries) {
  isSaving.value = true;
  try {
    await inspectionApi('saveInspectorLeaves', {
      projectId: props.projectId,
      userKey: userStore.user?.key,
      entries,
    });
    showMsg(`已建立 ${entries.length} 筆${entries[0]?.kind === 'note' ? '備註' : '排休'}`);
    isCreateDialogVisible.value = false;
    await fetchMonthData();
    emit('leaves-changed');
  } catch (err) {
    showMsg(`儲存失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

// --- 編輯 / 刪除排休 ---
const isEditLeaveDialogVisible = ref(false);
const editingLeave = ref(null);
const editLeaveForm = reactive({ type: 'full', note: '' });

function openEditLeave(leave) {
  editingLeave.value = leave;
  editLeaveForm.type = leave.type;
  editLeaveForm.note = leave.note || '';
  isEditLeaveDialogVisible.value = true;
}

async function saveEditLeave() {
  if (!editingLeave.value) return;
  await saveEntries([{
    kind: 'leave',
    date: editingLeave.value.date,
    staffName: editingLeave.value.staffName,
    type: editLeaveForm.type,
    note: (editLeaveForm.note || '').trim(),
  }]);
  isEditLeaveDialogVisible.value = false;
}

async function deleteLeaveRecord(leave) {
  isSaving.value = true;
  try {
    await inspectionApi('deleteInspectorLeave', { projectId: props.projectId, userKey: userStore.user?.key, leaveId: leave.id });
    showMsg('已刪除排休');
    isEditLeaveDialogVisible.value = false;
    await fetchMonthData();
    emit('leaves-changed');
  } catch (err) {
    showMsg(`刪除失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

// --- 編輯 / 刪除備註 ---
const isEditNoteDialogVisible = ref(false);
const editingNote = ref(null);
const editNoteForm = reactive({ note: '' });

function openEditNote(note) {
  editingNote.value = note;
  editNoteForm.note = note.note || '';
  isEditNoteDialogVisible.value = true;
}

async function saveEditNote() {
  if (!editingNote.value) return;
  const text = (editNoteForm.note || '').trim();
  if (!text) { showMsg('備註內容不可為空，若要移除請按刪除', 'warning'); return; }
  isSaving.value = true;
  try {
    // 備註為自動 ID：以「刪除舊筆 + 建立新筆」完成更新
    await inspectionApi('deleteInspectorLeave', { projectId: props.projectId, userKey: userStore.user?.key, leaveId: editingNote.value.id });
    await inspectionApi('saveInspectorLeaves', {
      projectId: props.projectId,
      userKey: userStore.user?.key,
      entries: [{ kind: 'note', date: editingNote.value.date, note: text }],
    });
    showMsg('備註已更新');
    isEditNoteDialogVisible.value = false;
    await fetchMonthData();
    emit('leaves-changed');
  } catch (err) {
    showMsg(`更新備註失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function deleteNoteRecord(note) {
  isSaving.value = true;
  try {
    await inspectionApi('deleteInspectorLeave', { projectId: props.projectId, userKey: userStore.user?.key, leaveId: note.id });
    showMsg('已刪除備註');
    isEditNoteDialogVisible.value = false;
    await fetchMonthData();
    emit('leaves-changed');
  } catch (err) {
    showMsg(`刪除失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

// --- 管理人員（共用 projects.inspectionStaff） ---
const isManageStaffDialogVisible = ref(false);
const staffDraft = ref([]);

function openManageStaff() {
  staffDraft.value = [...staffNames.value];
  isManageStaffDialogVisible.value = true;
}

async function saveStaffList() {
  isSaving.value = true;
  try {
    const res = await inspectionApi('updateInspectionStaffList', {
      projectId: props.projectId,
      userKey: userStore.user?.key,
      inspectionStaff: staffDraft.value,
    });
    const newList = res.data?.inspectionStaff || staffDraft.value;
    staffNames.value = newList;
    showMsg('人員名單已更新');
    isManageStaffDialogVisible.value = false;
    emit('staff-updated', newList);
  } catch (err) {
    showMsg(`更新名單失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.leave-calendar-scroll {
  overflow-x: auto;
}
.leave-calendar {
  display: grid;
  grid-template-columns: repeat(7, minmax(96px, 1fr));
  min-width: 700px;
}
.leave-dow {
  text-align: center;
  font-weight: 700;
  font-size: 0.8rem;
  color: #607d8b;
  padding: 8px 0 6px;
  border-bottom: 1px solid #eceff1;
}
.leave-cell {
  min-height: 108px;
  border-right: 1px solid #f0f2f4;
  border-bottom: 1px solid #f0f2f4;
  padding: 6px;
  font-size: 0.8rem;
  overflow: hidden;
}
.leave-cell.clickable { cursor: pointer; }
.leave-cell.clickable:hover { background-color: #f5f9ff; }
.leave-cell.dim { background-color: #fafafa; }
.leave-cell.dim .leave-cell-date { color: #bdbdbd; }
.leave-cell.weekend { background-color: #fffafa; }
.leave-cell.today { background-color: #e8f2fe; }
.leave-cell.today .leave-cell-date {
  background-color: #1976d2;
  color: #fff;
  border-radius: 50%;
  width: 22px; height: 22px;
  display: inline-flex; align-items: center; justify-content: center;
}
.leave-cell-date {
  font-weight: 700;
  color: #37474f;
}
.leave-availability {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 8px;
  white-space: nowrap;
}
.leave-availability.level-ok { background-color: #E8F5E9; color: #2E7D32; }
.leave-availability.level-warn { background-color: #FFF3E0; color: #E65100; }
.leave-availability.level-danger { background-color: #FFEBEE; color: #C62828; }
.leave-chip {
  display: flex;
  align-items: center;
  width: fit-content;
  max-width: 100%;
  margin-top: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 0.72rem;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.leave-chip.conflict {
  border-style: solid;
  border-width: 1.5px;
  box-shadow: 0 0 0 2px rgba(211, 47, 47, 0.15);
}
.leave-note-chip {
  display: flex;
  align-items: center;
  margin-top: 3px;
  padding: 1px 6px;
  border-radius: 4px;
  background-color: #FFF8E1;
  color: #6D4C41;
  border: 1px solid #FFE082;
  font-size: 0.72rem;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-dot {
  display: inline-block;
  width: 12px; height: 12px;
  border-radius: 3px;
  border: 1px solid;
  margin-right: 4px;
}
</style>
