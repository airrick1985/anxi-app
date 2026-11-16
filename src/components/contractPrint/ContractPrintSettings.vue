<script setup>
// 合約套印：建案層級設定（contractPrintConfigs/{projectId}）
import { computed, nextTick, reactive, ref } from 'vue'
import { mdiClose, mdiPlus, mdiTrashCanOutline } from '@mdi/js'
import McIcon from './McIcon.js'
import { PARKING_DEED_OPTIONS, PAYMENT_FIELDS } from '@/utils/contractPrint/fields.js'
import { saveContractPrintConfig } from '@/api'

const props = defineProps({
  projectId: { type: String, required: true },
  config: { type: Object, default: null },
  installmentNames: { type: Array, default: () => [] }, // 本戶期款的期別名稱
  canEdit: Boolean,
})
const emit = defineEmits(['close', 'saved'])

const TYPES = { text: '文字', number: '數字', money: '金額（元）' }
const src = props.config || {}
const form = reactive({
  landAreaTotalSqm: src.landAreaTotalSqm ?? '',
  commonBuildNo: src.commonBuildNo || '',
  commonAreaSqm: src.commonAreaSqm ?? '',
  commonShareDen: src.commonShareDen ?? '',
  parkingShare: src.parkingShare ?? '',
  mergeParkingShare: !!src.mergeParkingShare,
  parkingDeedDefault: src.parkingDeedDefault || '',
  installmentMap: Object.fromEntries(PAYMENT_FIELDS.map((f) => [f.key, [...(src.installmentMap?.[f.key] || [])]])),
  customFields: (src.customFields || []).map((f) => ({ ...f })),
})
const saving = ref(false)
const error = ref('')
const labelEls = ref([])

// 期別選項：本戶期款名稱＋已設定但本戶沒有的名稱
const nameOptions = computed(() => {
  const set = new Set(props.installmentNames)
  for (const list of Object.values(form.installmentMap)) for (const n of list) set.add(n)
  return [...set]
})
const autoNames = (f) => props.installmentNames.filter((n) => f.match.test(n))
function toggleName(key, name) {
  const list = form.installmentMap[key]
  const i = list.indexOf(name)
  if (i >= 0) list.splice(i, 1)
  else list.push(name)
}

function addField() {
  form.customFields.push({ key: 'c_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), label: '新欄位', type: 'text', value: '' })
  nextTick(() => {
    const el = labelEls.value.at(-1)
    el?.focus()
    el?.select()
  })
}
function removeField(i) {
  const f = form.customFields[i]
  if (!window.confirm(`刪除欄位「${f.label}」？`)) return
  form.customFields.splice(i, 1)
}

const numOrNull = (v) => {
  if (v === '' || v == null) return null
  const n = Number(String(v).replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

async function save() {
  if (!props.canEdit || saving.value) return
  saving.value = true
  error.value = ''
  const data = {
    landAreaTotalSqm: numOrNull(form.landAreaTotalSqm),
    commonBuildNo: String(form.commonBuildNo || '').trim(),
    commonAreaSqm: numOrNull(form.commonAreaSqm),
    commonShareDen: numOrNull(form.commonShareDen),
    parkingShare: numOrNull(form.parkingShare),
    mergeParkingShare: !!form.mergeParkingShare,
    parkingDeedDefault: form.parkingDeedDefault || '',
    installmentMap: Object.fromEntries(Object.entries(form.installmentMap).filter(([, list]) => list.length)),
    customFields: form.customFields
      .map((f) => ({
        key: f.key,
        label: String(f.label || '').trim(),
        type: f.type || 'text',
        value: f.type === 'text' ? String(f.value ?? '').trim() : numOrNull(f.value) ?? '',
      }))
      .filter((f) => f.label),
  }
  try {
    await saveContractPrintConfig(props.projectId, data)
    emit('saved', data)
  } catch (e) {
    console.error(e)
    error.value = '儲存失敗'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="cps-mask" @pointerdown.self="emit('close')">
    <div class="cps mac-sheet">
      <div class="mac-sheet-head">
        合約套印建案設定
        <button class="mac-sheet-close" title="關閉" @click="emit('close')"><McIcon :d="mdiClose" /></button>
      </div>
      <fieldset class="cps-body" :disabled="!canEdit">
        <section class="cps-sec">
          <div class="cps-title">土地</div>
          <div class="cps-grid">
            <label>全部土地面積（㎡）</label>
            <input v-model="form.landAreaTotalSqm" class="mac-form-input" inputmode="decimal" />
          </div>
        </section>

        <section class="cps-sec">
          <div class="cps-title">共同使用部分</div>
          <div class="cps-grid">
            <label>共有部分建號</label>
            <input v-model.trim="form.commonBuildNo" class="mac-form-input" />
            <label>整棟面積（㎡）</label>
            <input v-model="form.commonAreaSqm" class="mac-form-input" inputmode="decimal" />
            <label>持分分母</label>
            <input v-model="form.commonShareDen" class="mac-form-input" inputmode="numeric" placeholder="例：100000" />
            <label>共用部分持分（車位）</label>
            <div class="cps-inline">
              <input v-model="form.parkingShare" class="mac-form-input" inputmode="decimal" placeholder="每個車位" />
              <label class="cps-check">
                <input v-model="form.mergeParkingShare" type="checkbox" />
                併入共用部分持分
              </label>
            </div>
          </div>
        </section>

        <section class="cps-sec">
          <div class="cps-title">車位</div>
          <div class="cps-grid">
            <label>權狀預設</label>
            <select v-model="form.parkingDeedDefault" class="mac-form-input mac-form-select">
              <option value="">不設定</option>
              <option v-for="o in PARKING_DEED_OPTIONS" :key="o" :value="o">{{ o }}</option>
            </select>
          </div>
        </section>

        <section class="cps-sec">
          <div class="cps-title">期款對應</div>
          <div v-for="f in PAYMENT_FIELDS" :key="f.key" class="cps-pay">
            <span class="cps-pay-label">{{ f.label }}</span>
            <div class="cps-chips">
              <button
                v-for="n in nameOptions"
                :key="n"
                type="button"
                class="cps-chip"
                :class="{ 'is-on': form.installmentMap[f.key].includes(n), 'is-auto': !form.installmentMap[f.key].length && autoNames(f).includes(n) }"
                @click="toggleName(f.key, n)"
              >
                {{ n }}
              </button>
              <span v-if="!nameOptions.length" class="cps-dim">本戶尚未設定期款</span>
            </div>
          </div>
        </section>

        <section class="cps-sec">
          <div class="cps-title">自訂欄位</div>
          <div v-for="(f, i) in form.customFields" :key="f.key" class="cps-row">
            <input ref="labelEls" v-model="f.label" class="mac-form-input" placeholder="名稱" />
            <select v-model="f.type" class="mac-form-input mac-form-select">
              <option v-for="(t, k) in TYPES" :key="k" :value="k">{{ t }}</option>
            </select>
            <input v-model="f.value" class="mac-form-input" placeholder="值" />
            <button type="button" class="mac-icon-btn mac-icon-btn--danger" title="刪除" @click="removeField(i)"><McIcon :d="mdiTrashCanOutline" /></button>
          </div>
          <button type="button" class="mac-btn mac-btn--sm" @click="addField"><McIcon :d="mdiPlus" :size="16" />新增欄位</button>
        </section>
      </fieldset>
      <div class="mac-sheet-foot">
        <span v-if="error" class="cps-error">{{ error }}</span>
        <span v-else-if="!canEdit" class="cps-dim">需銷控系統權限</span>
        <span class="mac-spacer" />
        <button class="mac-btn" @click="emit('close')">取消</button>
        <button class="mac-btn mac-btn--primary" :disabled="!canEdit || saving" @click="save">{{ saving ? '儲存中…' : '儲存' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cps-mask { position: fixed; inset: 0; z-index: 3000; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.25); }
.cps { display: flex; flex-direction: column; width: min(560px, 100%); max-height: min(760px, 100%); background: #fff; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
.cps, .cps :deep(*) { box-sizing: border-box; }
.cps-body { flex: 1; overflow-y: auto; margin: 0; padding: 4px 16px 16px; border: 0; min-width: 0; }
.cps-sec { padding-top: 14px; }
.cps-title { margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #6e6e73; }
.cps-grid { display: grid; grid-template-columns: 150px 1fr; gap: 8px 10px; align-items: center; font-size: 13px; }
.cps-grid .mac-form-input { width: 100%; }
.cps-inline { display: flex; align-items: center; gap: 10px; min-width: 0; }
.cps-inline .mac-form-input { flex: 1; min-width: 0; width: auto; }
.cps-check { display: inline-flex; align-items: center; gap: 6px; flex: none; font-size: 13px; white-space: nowrap; cursor: pointer; }
.cps-check input { width: 15px; height: 15px; margin: 0; accent-color: #0071e3; }
.cps-pay { display: flex; gap: 10px; align-items: flex-start; padding: 6px 0; border-top: 1px solid #f0f0f3; }
.cps-pay:first-of-type { border-top: 0; }
.cps-pay-label { flex: none; width: 64px; padding-top: 3px; font-size: 13px; }
.cps-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; }
.cps-chip {
  padding: 3px 10px; border: 1px solid rgba(0, 0, 0, 0.14); border-radius: 12px; background: #fff;
  color: #1d1d1f; font: inherit; font-size: 12.5px; cursor: pointer;
}
.cps-chip.is-auto { border-style: dashed; border-color: #0071e3; color: #0071e3; }
.cps-chip.is-on { border-color: #0071e3; background: #0071e3; color: #fff; }
.cps-row { display: grid; grid-template-columns: 1fr 104px 1fr 26px; gap: 6px; align-items: center; margin-bottom: 8px; }
.cps-row .mac-form-input { width: 100%; min-width: 0; }
.cps-dim { color: #8e8e93; font-size: 12.5px; }
.cps-error { color: #d62d20; font-size: 12.5px; }
@media (max-width: 600px) {
  .cps-grid { grid-template-columns: 1fr; }
  .cps-row { grid-template-columns: 1fr 1fr 26px; }
  .cps-row > input:nth-of-type(2) { grid-column: 1 / 3; }
}
</style>
