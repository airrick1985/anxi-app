<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="v => emit('update:modelValue', v)"
    max-width="720px"
    scrollable
    :fullscreen="xs"
  >
    <v-card class="d-flex flex-column">
      <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
        <v-icon start>mdi-calendar-text</v-icon>
        <span class="text-subtitle-1">行事曆備註{{ projectName ? `－${projectName}` : '' }}</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-4">
        <v-alert type="info" variant="tonal" density="compact" class="mb-4 text-caption">
          此備註會顯示在「預約時間表」的星期／日期標題下方，一則備註可同時套用多個日期。
          與「驗屋人員排休」內的備註事項是各自獨立的兩份資料，不會互相影響。
        </v-alert>

        <div class="d-flex align-center mb-3">
          <span class="text-subtitle-2 font-weight-bold">已建立的備註</span>
          <v-chip size="x-small" label class="ml-2" color="primary" variant="tonal">{{ noteGroups.length }} 則</v-chip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="canEdit"
            color="primary" variant="flat" size="small"
            prepend-icon="mdi-plus"
            @click="openCreate"
          >新增備註</v-btn>
        </div>

        <div v-if="isLoading" class="py-8 text-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>

        <div v-else-if="noteGroups.length === 0" class="text-center text-grey py-10">
          <v-icon size="42" color="grey-lighten-1">mdi-note-off-outline</v-icon>
          <p class="mt-2 text-body-2">尚未建立任何行事曆備註</p>
        </div>

        <div v-else class="note-group-list">
          <div
            v-for="group in noteGroups"
            :key="group.groupId"
            class="note-group-card"
            :style="{ backgroundColor: getNoteColor(group.color).bg, borderLeftColor: getNoteColor(group.color).border }"
          >
            <div class="note-group-body">
              <div class="note-group-text" :style="{ color: getNoteColor(group.color).text }">
                <v-icon size="small" class="mr-1">mdi-pin</v-icon>{{ group.note }}
              </div>
              <div class="note-group-dates">
                <v-chip
                  v-for="d in group.dates" :key="d"
                  size="x-small" label variant="flat" class="note-date-chip"
                >{{ formatDateLabel(d) }}</v-chip>
              </div>
              <div v-if="group.updatedByName" class="text-caption text-grey-darken-1 mt-1">
                最後異動：{{ group.updatedByName }}{{ formatLogTime(group.updatedAt) }}
              </div>
            </div>
            <div v-if="canEdit" class="note-group-actions">
              <v-btn icon="mdi-pencil" variant="text" size="small" title="編輯" @click="openEdit(group)"></v-btn>
              <v-btn icon="mdi-delete-outline" variant="text" size="small" color="error" title="刪除整則" :loading="isSaving" @click="deleteGroup(group)"></v-btn>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 新增 / 編輯備註 -->
    <v-dialog v-model="isEditorVisible" max-width="560px" scrollable>
      <v-card>
        <v-card-title class="d-flex align-center bg-primary text-white py-3 px-4">
          <v-icon start>{{ editingGroupId ? 'mdi-pencil' : 'mdi-calendar-plus' }}</v-icon>
          <span class="text-subtitle-1">{{ editingGroupId ? '編輯行事曆備註' : '新增行事曆備註' }}</span>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" color="white" size="small" @click="isEditorVisible = false"></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <div class="text-caption font-weight-bold mb-1">套用日期（可複選）</div>
          <v-btn-toggle v-model="form.dateMode" mandatory density="compact" color="primary" variant="outlined" class="mb-2">
            <v-btn value="multi" size="small">單日 / 多日</v-btn>
            <v-btn value="range" size="small">連續區間</v-btn>
          </v-btn-toggle>
          <VueDatePicker
            v-if="form.dateMode === 'multi'"
            v-model="form.datesMulti"
            multi-dates :enable-time-picker="false"
            locale="zh-TW" format="yyyy/MM/dd" teleport
            placeholder="點選一個或多個日期"
            class="mb-2"
          />
          <VueDatePicker
            v-else
            v-model="form.dateRangeVal"
            range :enable-time-picker="false"
            locale="zh-TW" format="yyyy/MM/dd" teleport auto-apply
            placeholder="選擇起迄日期"
            class="mb-2"
          />
          <div class="text-caption text-grey mb-4">已選 {{ resolvedDates.length }} 個日期</div>

          <div class="text-caption font-weight-bold mb-1">備註內容</div>
          <v-textarea
            v-model="form.note"
            placeholder="例如：本日下午社區停水，請提醒客戶"
            variant="outlined" density="compact"
            rows="2" auto-grow maxlength="300" counter
            class="mb-4"
          ></v-textarea>

          <div class="text-caption font-weight-bold mb-2">顯示顏色</div>
          <div class="d-flex flex-wrap ga-2 mb-3">
            <button
              v-for="opt in CALENDAR_NOTE_COLOR_OPTIONS" :key="opt.value"
              type="button"
              class="color-swatch"
              :class="{ selected: form.color === opt.value }"
              :style="{ backgroundColor: opt.bg, borderColor: opt.border, color: opt.text }"
              @click="form.color = opt.value"
            >
              <v-icon v-if="form.color === opt.value" size="14" class="mr-1">mdi-check</v-icon>{{ opt.label }}
            </button>
          </div>

          <div class="text-caption font-weight-bold mb-1">時間表上的顯示效果</div>
          <div
            class="note-preview"
            :style="{ backgroundColor: getNoteColor(form.color).bg, color: getNoteColor(form.color).text, borderColor: getNoteColor(form.color).border }"
          >
            <v-icon size="small" class="mr-1">mdi-pin</v-icon>
            <span>{{ form.note || '（備註內容）' }}</span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-3 pt-0">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="isEditorVisible = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSaving" @click="submitForm">儲存</v-btn>
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
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { useUserStore } from '@/store/user';
import { CALENDAR_NOTE_COLOR_OPTIONS, getNoteColor, groupCalendarNotes } from '@/utils/calendarNoteUtils';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  canEdit: { type: Boolean, default: false },
  // 由父層帶入「新增備註」時預設選取的日期（通常是時間表目前選定日）
  defaultDate: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'notes-changed']);

const { xs } = useDisplay();
const userStore = useUserStore();

const inspectionApi = (action, data) => {
  const callable = httpsCallable(functions, 'inspectionCalendarApi');
  return callable({ action, data });
};

const isLoading = ref(false);
const isSaving = ref(false);
const noteRecords = ref([]);
const noteGroups = computed(() => groupCalendarNotes(noteRecords.value));

const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');
function showMsg(text, color = 'success') {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
}

function formatDateLabel(dateStr) {
  try {
    return format(parseISO(dateStr), 'M/d (EEE)', { locale: zhTW });
  } catch (e) {
    return dateStr;
  }
}

function formatLogTime(iso) {
  if (!iso) return '';
  try {
    return `　${new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false })}`;
  } catch (e) {
    return '';
  }
}

// --- 資料載入（不帶日期區間，取得整個建案的備註以便管理） ---
async function fetchNotes() {
  if (!props.projectId) return;
  isLoading.value = true;
  try {
    const res = await inspectionApi('fetchCalendarNotes', { projectId: props.projectId });
    noteRecords.value = res.data?.data || [];
  } catch (err) {
    console.error('[行事曆備註] 載入失敗:', err);
    showMsg(`載入行事曆備註失敗：${err.message}`, 'error');
  } finally {
    isLoading.value = false;
  }
}

watch(() => props.modelValue, (open) => {
  if (open) fetchNotes();
}, { immediate: true });

// --- 新增 / 編輯表單 ---
const isEditorVisible = ref(false);
const editingGroupId = ref('');
const form = reactive({
  dateMode: 'multi',
  datesMulti: [],
  dateRangeVal: null,
  note: '',
  color: 'amber',
});

const resolvedDates = computed(() => {
  let dates = [];
  if (form.dateMode === 'multi') {
    dates = (form.datesMulti || []).map(d => (d instanceof Date ? d : new Date(d)));
  } else {
    const [s, e] = form.dateRangeVal || [];
    if (s && e) dates = eachDayOfInterval({ start: new Date(s), end: new Date(e) });
    else if (s) dates = [new Date(s)];
  }
  return [...new Set(dates.filter(d => !isNaN(d.getTime())).map(d => format(d, 'yyyy-MM-dd')))].sort();
});

function resetForm() {
  form.dateMode = 'multi';
  form.datesMulti = [];
  form.dateRangeVal = null;
  form.note = '';
  form.color = 'amber';
  editingGroupId.value = '';
}

function openCreate() {
  resetForm();
  if (props.defaultDate) {
    const d = parseISO(props.defaultDate);
    if (!isNaN(d.getTime())) form.datesMulti = [d];
  }
  isEditorVisible.value = true;
}

function openEdit(group) {
  resetForm();
  editingGroupId.value = group.groupId;
  form.note = group.note;
  form.color = group.color || 'amber';
  form.datesMulti = group.dates.map(d => parseISO(d)).filter(d => !isNaN(d.getTime()));
  isEditorVisible.value = true;
}

async function submitForm() {
  const dates = resolvedDates.value;
  if (!dates.length) { showMsg('請選擇至少一個日期', 'warning'); return; }
  const note = (form.note || '').trim();
  if (!note) { showMsg('請輸入備註內容', 'warning'); return; }

  isSaving.value = true;
  try {
    await inspectionApi('saveCalendarNote', {
      projectId: props.projectId,
      userKey: userStore.user?.key,
      dates,
      note,
      color: form.color,
      groupId: editingGroupId.value || undefined,
    });
    showMsg(editingGroupId.value ? '備註已更新' : `已建立備註，套用 ${dates.length} 個日期`);
    isEditorVisible.value = false;
    await fetchNotes();
    emit('notes-changed');
  } catch (err) {
    console.error('[行事曆備註] 儲存失敗:', err);
    showMsg(`儲存失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}

async function deleteGroup(group) {
  if (!window.confirm(`確定要刪除這則備註嗎？共套用 ${group.dates.length} 個日期。\n\n${group.note}`)) return;
  isSaving.value = true;
  try {
    await inspectionApi('deleteCalendarNote', {
      projectId: props.projectId,
      userKey: userStore.user?.key,
      groupId: group.groupId,
    });
    showMsg('備註已刪除');
    await fetchNotes();
    emit('notes-changed');
  } catch (err) {
    console.error('[行事曆備註] 刪除失敗:', err);
    showMsg(`刪除失敗：${err.message}`, 'error');
  } finally {
    isSaving.value = false;
  }
}
</script>

<style scoped>
.note-group-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.note-group-card {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  border-radius: 8px;
  border-left: 6px solid;
  padding: 10px 12px;
}

.note-group-body {
  flex: 1 1 auto;
  min-width: 0;
}

.note-group-text {
  font-weight: 700;
  font-size: 0.95rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-group-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.note-date-chip {
  background-color: rgba(255, 255, 255, 0.75) !important;
  color: rgba(0, 0, 0, 0.75) !important;
  font-weight: 600;
}

.note-group-actions {
  flex: 0 0 auto;
  display: flex;
}

.color-swatch {
  display: inline-flex;
  align-items: center;
  border: 2px solid;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  opacity: 0.65;
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.color-swatch.selected {
  opacity: 1;
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.note-preview {
  display: flex;
  align-items: center;
  border: 1px dashed;
  border-left-width: 5px;
  border-left-style: solid;
  border-radius: 6px;
  padding: 6px 10px;
  font-weight: 700;
  font-size: 0.85rem;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
