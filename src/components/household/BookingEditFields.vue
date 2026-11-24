<template>
  <!-- 多根元素：外層由戶別整合資訊的 mac-form-group 包住 -->
  <div class="mac-form-row bef-row">
    <span class="bef-label">預約日期</span>
    <div class="bef-main bef-inline">
      <MacDateInput v-model="draft.date" class="bef-date" aria-label="預約日期" />
      <span v-if="dateTag" class="mac-tag" :class="dateTag.cls">{{ dateTag.text }}</span>
    </div>
  </div>
  <div class="mac-form-row bef-row">
    <span class="bef-label">時段</span>
    <div class="bef-main bef-inline">
      <template v-if="isCustomTime">
        <input v-model.trim="draft.timeSlot" class="mac-form-input bef-time" placeholder="HH:MM" inputmode="numeric" maxlength="5" aria-label="自訂時段">
        <button type="button" class="mac-btn mac-btn--sm bef-ghost" @click="isCustomTime = false">選時段</button>
      </template>
      <select v-else class="mac-form-input mac-form-select bef-slot" :value="draft.timeSlot" aria-label="時段" @change="onSlotChange">
        <option v-if="!draft.timeSlot" value="" disabled>請選擇</option>
        <option v-for="s in slotOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
        <option :value="CUSTOM">自訂時間…</option>
      </select>
      <v-progress-circular v-if="slotsLoading" indeterminate size="14" width="2" color="primary" />
      <span v-else-if="isSlotFull" class="mac-tag mac-tag--orange">額滿</span>
    </div>
  </div>
  <div class="mac-form-row bef-row">
    <span class="bef-label">選擇方式</span>
    <select class="mac-form-input mac-form-select bef-main" :value="draft.method" aria-label="選擇方式" @change="onMethodChange">
      <option v-if="!draft.method" value="" disabled>請選擇</option>
      <option v-for="m in methodOptions" :key="m" :value="m">{{ m }}</option>
    </select>
  </div>
  <div v-if="subOptions.length" class="mac-form-row bef-row">
    <span class="bef-label">子項目</span>
    <select v-model="draft.subOption" class="mac-form-input mac-form-select bef-main" aria-label="子項目">
      <option value="" disabled>請選擇</option>
      <option v-for="o in subOptions" :key="o" :value="o">{{ o }}</option>
    </select>
  </div>

  <div v-for="f in extraFields" :key="f.id" class="mac-form-row bef-row">
    <span class="bef-label">{{ f.label }}</span>
    <select v-if="f.type === 'radio'" v-model="draft.bookingMethodDetails[f.id]" class="mac-form-input mac-form-select bef-main" :aria-label="f.label">
      <option value="">—</option>
      <option v-for="o in optionsOf(f)" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
    <div v-else-if="f.type === 'checkbox'" class="bef-main bef-chips">
      <button
        v-for="o in optionsOf(f)" :key="o.value" type="button" class="bef-chip"
        :class="{ 'is-on': isChecked(f, o.value) }" :aria-pressed="isChecked(f, o.value)" @click="toggleOption(f, o.value)"
      >{{ o.label }}</button>
    </div>
    <textarea v-else-if="f.type === 'textarea'" v-model="draft.bookingMethodDetails[f.id]" class="mac-form-textarea bef-main" rows="2" :aria-label="f.label"></textarea>
    <MacDateInput v-else-if="f.type === 'date'" v-model="draft.bookingMethodDetails[f.id]" class="bef-date" :aria-label="f.label" />
    <input v-else v-model="draft.bookingMethodDetails[f.id]" class="mac-form-input bef-main" :type="f.type === 'phone' ? 'tel' : 'text'" :aria-label="f.label">
  </div>

  <div class="mac-form-row bef-row bef-sep">
    <span class="bef-label">預約人姓名</span>
    <input v-model="draft.bookerName" class="mac-form-input bef-main" aria-label="預約人姓名">
  </div>
  <div class="mac-form-row bef-row">
    <span class="bef-label">預約人電話</span>
    <input v-model="draft.bookerPhone" class="mac-form-input bef-main" type="tel" aria-label="預約人電話">
  </div>
  <div class="mac-form-row bef-row">
    <span class="bef-label">預約人 Email</span>
    <input v-model.trim="draft.bookerEmail" class="mac-form-input bef-main" type="email" aria-label="預約人 Email">
  </div>

  <template v-if="showAgent">
    <div class="mac-form-row bef-row bef-sep">
      <span class="bef-label">受託人姓名</span>
      <input v-model="draft.agentName" class="mac-form-input bef-main" aria-label="受託人姓名">
    </div>
    <div class="mac-form-row bef-row">
      <span class="bef-label">受託人電話</span>
      <input v-model="draft.agentPhone" class="mac-form-input bef-main" type="tel" aria-label="受託人電話">
    </div>
    <div class="mac-form-row bef-row">
      <span class="bef-label">受託人身分證</span>
      <input v-model.trim="draft.agentIdNumber" class="mac-form-input bef-main" aria-label="受託人身分證">
    </div>
    <div class="mac-form-row bef-row">
      <span class="bef-label">與委託人關係</span>
      <input v-model="draft.agentRelationship" class="mac-form-input bef-main" :list="relationListId" aria-label="與委託人關係">
      <datalist :id="relationListId"><option v-for="r in RELATIONS" :key="r" :value="r" /></datalist>
    </div>
  </template>
  <div v-else class="mac-form-row bef-row bef-sep">
    <span class="bef-label">受託人</span>
    <button type="button" class="mac-btn mac-btn--sm bef-ghost" @click="agentOpened = true"><v-icon size="15">mdi-plus</v-icon>新增受託人</button>
  </div>

  <div class="mac-form-row bef-row bef-sep">
    <span class="bef-label">驗屋人員</span>
    <div class="bef-main">
      <div class="bef-chips">
        <button
          v-for="name in staffOptions" :key="name" type="button" class="bef-chip"
          :class="{ 'is-on': draft.inspectors.includes(name), 'is-leave': leaveOf(name) }"
          :aria-pressed="draft.inspectors.includes(name)" @click="toggleInspector(name)"
        >{{ name }}<template v-if="leaveOf(name)">（{{ LEAVE_TYPE_LABELS[leaveOf(name)] }}）</template></button>
      </div>
      <div class="bef-inline bef-add">
        <input v-model.trim="newInspector" class="mac-form-input bef-new" placeholder="其他人員" aria-label="其他人員" @keydown.enter.prevent="addInspector">
        <button type="button" class="mac-btn mac-btn--sm bef-ghost" :disabled="!newInspector" @click="addInspector">加入</button>
      </div>
    </div>
  </div>
  <div class="mac-form-row bef-row">
    <span class="bef-label">預約備註</span>
    <textarea v-model="draft.bookingRemarks" class="mac-form-textarea bef-main" rows="2" aria-label="預約備註"></textarea>
  </div>
</template>

<script setup>
/**
 * 戶別整合資訊「進入編輯」時的單筆預約欄位；直接改 draft（bookingEditDraft.createBookingDraft 產生）
 * 日期、時段、方式的規則檢查由後端做，額滿或不在批次時在儲存時確認
 */
import { computed, ref, useId, watch } from 'vue';
import MacDateInput from '@/components/MacDateInput.vue';
import { getSlotsForAdmin } from '@/api';
import { useInspectionCalendarStore } from '@/store/inspectionCalendarStore';
import { buildLeaveMap, getLeaveTypeForSlot, extractStartTime, LEAVE_TYPE_LABELS } from '@/utils/inspectorLeaveUtils';
import { activeMethodFields, findBookingMethods } from '@/utils/bookingChanges';
import { detailsForMethod } from '@/utils/bookingEditDraft';

const props = defineProps({
  draft: { type: Object, required: true },
  snapshot: { type: Object, required: true },
  projectId: { type: String, required: true },
  bookingMenu: { type: Array, default: () => [] },
  staff: { type: Array, default: () => [] },
  // 該戶的日期分類 [{ date, type: 'own_batch' | 'other_batch' }]；null＝尚未載入
  calendar: { type: Array, default: null },
});

const CUSTOM = '__custom';
const RELATIONS = ['配偶', '父母', '子女', '兄弟姊妹', '朋友'];
const relationListId = useId();

// 日期：改過才標示是否為本戶批次
const dateTag = computed(() => {
  if (!props.calendar || !props.draft.date || props.draft.date === props.snapshot.date) return null;
  const type = props.calendar.find((d) => d.date === props.draft.date)?.type;
  if (type === 'own_batch') return { text: '本戶批次', cls: 'mac-tag--green' };
  if (type === 'other_batch') return { text: '其他批次', cls: 'mac-tag--orange' };
  return { text: '未開放日期', cls: 'mac-tag--red' };
});

// 時段
const slots = ref([]);
const slotsLoading = ref(false);
const isCustomTime = ref(false);
const leaveMap = ref({});
let requestId = 0;
watch(() => props.draft.date, async (date) => {
  const id = ++requestId;
  slots.value = [];
  leaveMap.value = {};
  slotsLoading.value = !!date;
  if (!date) return;
  useInspectionCalendarStore().fetchInspectorLeaves(props.projectId, date, date)
    .then((list) => { if (id === requestId) leaveMap.value = buildLeaveMap(list).leaveMap; })
    .catch(() => {});
  let list = [];
  try { list = await getSlotsForAdmin(props.projectId, date); } catch (e) { console.warn('讀取時段失敗:', e); }
  if (id !== requestId) return;
  slots.value = (list || []).map((text) => {
    const [value] = text.split(' ');
    const booked = text.match(/已預約\s*(\d+)/)?.[1];
    const rest = text.match(/尚餘\s*(\d+)/)?.[1];
    const full = text.includes('已額滿');
    return { value, full, label: `${value}（已約 ${booked ?? 0}・${full ? '額滿' : `剩 ${rest ?? 0}`}）` };
  });
  slotsLoading.value = false;
}, { immediate: true });

const slotOptions = computed(() => {
  const list = slots.value;
  if (!props.draft.timeSlot || list.some((s) => s.value === props.draft.timeSlot)) return list;
  return [{ value: props.draft.timeSlot, label: props.draft.timeSlot }, ...list];
});
const isSlotFull = computed(() => (props.draft.date !== props.snapshot.date || props.draft.timeSlot !== props.snapshot.timeSlot)
  && slots.value.some((s) => s.value === props.draft.timeSlot && s.full));
function onSlotChange(e) {
  if (e.target.value === CUSTOM) {
    isCustomTime.value = true;
    return;
  }
  props.draft.timeSlot = e.target.value;
}

// 方式、子項目、額外欄位
const methods = computed(() => findBookingMethods(props.bookingMenu, props.draft.type));
const currentMethod = computed(() => methods.value.find((m) => m.title === props.draft.method));
const withCurrent = (list, value) => (value && !list.includes(value) ? [value, ...list] : list);
const methodOptions = computed(() => withCurrent(methods.value.map((m) => m.title), props.draft.method));
const subOptions = computed(() => withCurrent(currentMethod.value?.subOptions || [], props.draft.subOption));
const extraFields = computed(() => activeMethodFields(currentMethod.value, props.draft.bookingMethodDetails));
const optionsOf = (f) => (f.options || []).map((o) => ({ value: o.value, label: o.label || o.value }));

function onMethodChange(e) {
  props.draft.method = e.target.value;
  props.draft.bookingMethodDetails = detailsForMethod(props.draft, props.snapshot, methods.value);
  const options = currentMethod.value?.subOptions || [];
  if (props.draft.method === props.snapshot.method) props.draft.subOption = props.snapshot.subOption;
  else if (!options.includes(props.draft.subOption)) props.draft.subOption = '';
}
const isChecked = (f, value) => Array.isArray(props.draft.bookingMethodDetails[f.id]) && props.draft.bookingMethodDetails[f.id].includes(value);
function toggleOption(f, value) {
  const list = Array.isArray(props.draft.bookingMethodDetails[f.id]) ? props.draft.bookingMethodDetails[f.id] : [];
  props.draft.bookingMethodDetails[f.id] = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// 受託人
const agentOpened = ref(false);
const showAgent = computed(() => agentOpened.value || !!currentMethod.value?.triggerAuthFlow
  || ['agentName', 'agentPhone', 'agentIdNumber', 'agentRelationship'].some((k) => props.draft[k] || props.snapshot[k]));

// 驗屋人員
const newInspector = ref('');
const staffOptions = computed(() => [...new Set([...props.staff, ...props.snapshot.inspectors, ...props.draft.inspectors])]);
const leaveOf = (name) => getLeaveTypeForSlot(leaveMap.value, props.draft.date, extractStartTime(props.draft.timeSlot), name);
function toggleInspector(name) {
  props.draft.inspectors = props.draft.inspectors.includes(name) ? props.draft.inspectors.filter((n) => n !== name) : [...props.draft.inspectors, name];
}
function addInspector() {
  const name = newInspector.value.replace(/[,，]/g, ' ').trim();
  if (name && !props.draft.inspectors.includes(name)) props.draft.inspectors = [...props.draft.inspectors, name];
  newInspector.value = '';
}
</script>

<style scoped>
.bef-row { gap: 6px 12px; }
.bef-label { flex: 0 0 128px; color: #6e6e73; font-size: 13px; line-height: 1.35; overflow-wrap: anywhere; }
.bef-main { flex: 1 1 auto; min-width: 0; }
.bef-row > .mac-form-input.bef-main { max-width: none; margin-left: 0; }
.bef-inline { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; }
.bef-date { flex: 0 1 170px; }
.bef-slot { flex: 0 1 240px; }
.bef-time { flex: 0 0 90px; }
.bef-new { flex: 0 1 160px; }
.bef-add { margin-top: 8px; }
.bef-ghost { background: #f2f2f4; box-shadow: none; }
.bef-sep { border-top: 1px solid #dcdce1 !important; }
.bef-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.bef-chip {
  padding: 4px 11px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  border-radius: 14px;
  background: #fff;
  color: #1d1d1f;
  font: inherit;
  font-size: 12.5px;
  line-height: 1.4;
  cursor: pointer;
}
.bef-chip.is-leave { border-color: #f48fb1; background: #fce4ec; color: #c2185b; }
.bef-chip.is-on { border-color: #0071e3; background: #0071e3; color: #fff; }
.bef-chip.is-on.is-leave { border-color: #c2185b; background: #c2185b; }
.bef-chip:focus-visible { outline: 2px solid rgba(0, 113, 227, 0.4); outline-offset: 1px; }
@media (max-width: 600px) {
  .bef-label { flex-basis: 100%; font-size: 12px; }
  .bef-main { flex-basis: 100%; }
  .bef-row .mac-form-input { height: 36px; font-size: 16px; }
  .bef-row .mac-form-textarea { font-size: 16px; }
  .bef-row :deep(.date-input) { height: 36px; max-width: none; font-size: 16px; }
  .bef-date { flex: 1 1 160px; }
  .bef-slot { flex: 1 1 200px; }
  .bef-chip { padding: 7px 14px; font-size: 14px; border-radius: 18px; }
  .bef-ghost { height: 34px; }
}
</style>
