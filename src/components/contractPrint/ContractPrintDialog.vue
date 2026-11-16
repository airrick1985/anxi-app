<script setup>
// 合約套印（從「合約製作設定」開啟）：範本清單 → 以本戶資料預覽／列印／存 PDF；
// 有本建案銷控系統權限者可新增與編輯範本、修改建案設定。金額與期款沿用合約製作已算好的價款與期款拆分。
import { computed, ref, watch } from 'vue'
import { fetchContractPrintConfig } from '@/api'
import { useUserStore } from '@/store/user'
import { allPrintFields, buildPrintValues, installmentNames } from '@/utils/contractPrint/fields.js'
import ContractPrintTemplateList from './ContractPrintTemplateList.vue'
import ContractPrintEditor from './ContractPrintEditor.vue'
import ContractPrintSettings from './ContractPrintSettings.vue'

const props = defineProps({
  show: Boolean,
  projectId: { type: String, required: true },
  unitData: { type: Object, default: null },
  priceModel: { type: Object, default: null }, // 合約製作 buildPriceModel
  splitModel: { type: Object, default: null }, // 合約製作 buildSplitModel
  allParkings: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:show'])

// 範本與建案設定的寫入權限：有本建案「銷控系統」權限即可（超管／系管免勾）
const ADMIN_ROLES = ['超級管理員', '系統管理員']
const userStore = useUserStore()
const canEdit = computed(() =>
  (userStore.currentUserRoles || []).some((r) => ADMIN_ROLES.includes(r)) ||
  (userStore.user?.permissions?.[props.projectId]?.systems || []).includes('銷控系統'))

const config = ref(null)
const view = ref({ name: 'list' }) // { name: 'list' } | { name: 'editor', templateId, detect }
const showSettings = ref(false)

watch(
  () => [props.show, props.projectId],
  async ([show]) => {
    if (!show) return
    view.value = { name: 'list' }
    try {
      config.value = await fetchContractPrintConfig(props.projectId)
    } catch (e) {
      console.error('[合約套印] 建案設定讀取失敗', e)
      config.value = null
    }
  },
  { immediate: true },
)

const fields = computed(() => allPrintFields(config.value))
const values = computed(() =>
  buildPrintValues({
    unitData: props.unitData,
    priceModel: props.priceModel,
    splitModel: props.splitModel,
    allParkings: props.allParkings,
    config: config.value,
  }),
)
const unitLabel = computed(() => String(props.unitData?.unitId || ''))
const names = computed(() => installmentNames(props.splitModel))

function open(id, opts = {}) {
  view.value = { name: 'editor', templateId: id, detect: !!opts.detect }
}
function close() {
  emit('update:show', false)
}
function onSaved(data) {
  config.value = { ...(config.value || {}), ...data }
  showSettings.value = false
}
</script>

<template>
  <v-dialog :model-value="show" fullscreen persistent :scrim="false" transition="dialog-bottom-transition"
    @update:model-value="emit('update:show', $event)">
    <div class="cpd">
      <ContractPrintEditor
        v-if="view.name === 'editor'"
        :key="view.templateId"
        :template-id="view.templateId"
        :detect="view.detect"
        :can-edit="canEdit"
        :values="values"
        :fields="fields"
        :unit-label="unitLabel"
        @back="view = { name: 'list' }"
        @close="close"
        @detected="view.detect = false"
        @settings="showSettings = true"
      />
      <ContractPrintTemplateList
        v-else
        :project-id="projectId"
        :title="unitLabel"
        :can-edit="canEdit"
        @open="open"
        @close="close"
        @settings="showSettings = true"
      />
      <ContractPrintSettings
        v-if="showSettings"
        :project-id="projectId"
        :config="config"
        :installment-names="names"
        :can-edit="canEdit"
        @close="showSettings = false"
        @saved="onSaved"
      />
    </div>
  </v-dialog>
</template>

<style scoped>
.cpd { height: 100dvh; background: #f5f5f7; }
</style>
