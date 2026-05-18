<template>
  <v-dialog :model-value="show" @update:model-value="$emit('update:show', $event)" max-width="1200" persistent scrollable>
    <v-card class="d-flex flex-column" style="height: 92vh;">
      <!-- 標題列 -->
      <v-card-title class="d-flex align-center bg-primary text-white py-3">
        <v-icon start>mdi-file-document-arrow-right-outline</v-icon>
        不動產預售屋成交案件實際資訊申報 —— {{ unitId }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" color="white" @click="close" />
      </v-card-title>

      <!-- 步驟導覽列 (對應 HTML process_box) -->
      <div class="process-box px-4 py-3">
        <v-chip v-for="s in REPORT_STEPS" :key="s.step"
          :color="activeStep === s.step ? 'primary' : 'default'"
          :variant="activeStep === s.step ? 'flat' : 'tonal'"
          size="default" class="process-chip" @click="scrollToStep(s.step)">
          <v-icon start>{{ s.icon }}</v-icon>
          {{ s.step }}. {{ s.label }}
        </v-chip>
      </div>

      <v-divider />

      <!-- 內容區 -->
      <v-card-text class="pa-0 form-body" ref="scrollArea">
        <v-skeleton-loader v-if="loading" type="article" />

        <template v-else>
          <!-- 1 ~ 6 + 10：主體資料各步驟 -->
          <div v-for="s in REPORT_STEPS" :key="s.step" :id="`step-${s.step}`" class="step-section"
            @mouseenter="onStepMouseEnter(s.step)">
            <div class="step-header d-flex align-center">
              <span class="step-num">{{ s.step }}.</span>
              <span>{{ s.label }}</span>
              <v-chip v-if="isSavableStep(s.key)" size="x-small" color="white" variant="tonal" class="ml-2">
                本案共用資料
              </v-chip>
              <v-spacer />
              <v-btn v-if="isSavableStep(s.key)"
                size="small" variant="flat" color="white" class="text-primary"
                prepend-icon="mdi-content-save-outline"
                :loading="savingStepKey === s.key"
                @click="onSaveStepAsDefault(s.key)">
                儲存為本案預設
              </v-btn>
            </div>

            <!-- Step 7: 土地標的清冊 -->
            <div v-if="s.key === 'land'" class="step-body">
              <LandDataEditor v-model="draft.landData" />
            </div>

            <!-- Step 8: 建物標的清冊 -->
            <div v-else-if="s.key === 'build'" class="step-body">
              <BuildTableEditor v-model="draft.buildDataList" />
            </div>

            <!-- Step 9: 車位標的清冊 -->
            <div v-else-if="s.key === 'car'" class="step-body">
              <CarDataEditor v-model="draft.carData" />
            </div>

            <!-- Step 10: 備註欄 (5 個子段落) -->
            <div v-else-if="s.key === 'note'" class="step-body">
              <div v-for="sub in NOTE_SUB_GROUPS" :key="sub.key" class="note-sub-group">
                <div class="note-sub-title">{{ sub.label }}</div>
                <v-row dense>
                  <v-col v-for="f in fieldsBySubGroup[sub.key]" :key="f.key"
                    :cols="f.type === 'textarea' ? 12 : 12" :md="f.type === 'textarea' ? 12 : 6">
                    <!-- Checkbox (Y/空) -->
                    <template v-if="f.type === 'checkbox'">
                      <v-checkbox :model-value="draft.mainData[f.key] === 'Y'"
                        @update:model-value="onCheckboxChange(f.key, $event)"
                        :label="f.label" hide-details density="compact" color="primary" />
                    </template>
                    <!-- Textarea -->
                    <v-textarea v-else-if="f.type === 'textarea'"
                      v-model="draft.mainData[f.key]"
                      :label="f.label"
                      rows="2" auto-grow variant="outlined" density="compact" />
                    <!-- Number -->
                    <v-text-field v-else-if="f.type === 'number'"
                      v-model="draft.mainData[f.key]"
                      :label="f.label" type="number"
                      variant="outlined" density="compact" clearable />
                    <!-- Text -->
                    <v-text-field v-else
                      v-model="draft.mainData[f.key]"
                      :label="f.label"
                      variant="outlined" density="compact" clearable />
                  </v-col>
                </v-row>
              </div>
            </div>

            <!-- Steps 1~6: 一般 MAIN 欄位 -->
            <div v-else class="step-body">
              <v-row dense>
                <template v-for="f in fieldsByGroup[s.key]" :key="f.key">
                  <!-- 系統內部隱藏欄位 (case_type / case_no / p1ma_caseSeq)：不渲染 -->
                  <template v-if="isSystemHiddenField(f.key)" />
                  <!-- 中文名稱欄位 (x45c / x46c / unitc)：不渲染 -->
                  <template v-else-if="isAutoFilledNameField(f.key)" />
                  <!-- 屬於整合地址區塊內的子欄位 (已由 _x45 區塊渲染)：跳過 -->
                  <template v-else-if="isMemberOfRenderedAddress(f.key)" />
                  <!-- 屬於建物格局整合區塊內的子欄位：跳過 -->
                  <template v-else-if="isBuildLayoutMember(f.key)" />

                  <!-- 建物格局整合 (房/廳/衛 + 無隔間) -->
                  <v-col v-else-if="isBuildLayoutStart(f.key)" cols="12">
                    <div class="field-group-label">建物格局</div>
                    <div class="d-flex align-center flex-wrap ga-3 mt-1">
                      <v-text-field
                        v-model="draft.mainData.p1ma_build1"
                        type="number" min="0" placeholder="0" suffix="房"
                        hide-details variant="outlined" density="compact"
                        style="max-width: 110px;" />
                      <v-text-field
                        v-model="draft.mainData.p1ma_build2"
                        type="number" min="0" placeholder="0" suffix="廳"
                        hide-details variant="outlined" density="compact"
                        style="max-width: 110px;" />
                      <v-text-field
                        v-model="draft.mainData.p1ma_build3"
                        type="number" min="0" placeholder="0" suffix="衛"
                        hide-details variant="outlined" density="compact"
                        style="max-width: 110px;" />
                      <v-checkbox
                        :model-value="draft.mainData.p1ma_build4 === 'Y'"
                        @update:model-value="onCheckboxChange('p1ma_build4', $event)"
                        label="無隔間" hide-details density="compact" color="primary" />
                    </div>
                  </v-col>

                  <!-- 申報人種類 case_kind → radio 單選 -->
                  <v-col v-else-if="f.key === 'case_kind'" cols="12">
                    <div class="field-group-label">
                      <span v-if="isRequiredMainField(f.key)" class="req">*</span>
                      {{ f.label.replace(/\s*\(.+\)$/, '') }}
                    </div>
                    <v-radio-group v-model="draft.mainData.case_kind" inline hide-details density="compact"
                      color="primary" class="mt-1">
                      <v-radio v-for="opt in CASE_KIND_OPTIONS" :key="opt.value"
                        :label="opt.label" :value="opt.value" />
                    </v-radio-group>
                  </v-col>

                  <!-- 交易標的種類 caseflag → radio 單選 -->
                  <v-col v-else-if="f.key === 'caseflag'" cols="12">
                    <div class="field-group-label">
                      <span v-if="isRequiredMainField(f.key)" class="req">*</span>
                      交易標的種類
                    </div>
                    <v-radio-group v-model="draft.mainData.caseflag" inline hide-details density="compact"
                      color="primary" class="mt-1">
                      <v-radio v-for="opt in CASEFLAG_OPTIONS" :key="opt.value"
                        :label="opt.label" :value="opt.value" />
                    </v-radio-group>
                  </v-col>

                  <!-- 車位備註 p1ma_parkflag → radio 單選 -->
                  <v-col v-else-if="f.key === 'p1ma_parkflag'" cols="12">
                    <div class="field-group-label">
                      <span v-if="isRequiredMainField(f.key)" class="req">*</span>
                      車位備註
                    </div>
                    <v-radio-group v-model="draft.mainData.p1ma_parkflag" inline hide-details density="compact"
                      color="primary" class="mt-1">
                      <v-radio v-for="opt in PARKFLAG_OPTIONS" :key="opt.value"
                        :label="opt.label" :value="opt.value" />
                    </v-radio-group>
                  </v-col>

                  <!-- 整合型地址 (通訊地址 / 建物坐落)：縣市 + 區域 + 詳細地址 -->
                  <v-col v-else-if="isAddressGroupStart(f.key)" cols="12">
                    <div class="field-group-label">
                      <span v-if="isAddressGroupRequired(f.key)" class="req">*</span>
                      {{ getAddressGroupConfig(f.key).label }}
                    </div>
                    <v-row dense class="mt-1">
                      <v-col cols="12" sm="4" md="3">
                        <v-select
                          :model-value="draft.mainData[`${getAddressGroupConfig(f.key).prefix}_x45`]"
                          :items="cityOptions" item-title="name" item-value="code"
                          placeholder="縣市" hide-details
                          variant="outlined" density="compact" clearable
                          @update:model-value="onCityChange(getAddressGroupConfig(f.key).prefix, $event)" />
                      </v-col>
                      <v-col cols="12" sm="4" md="3">
                        <v-select
                          :model-value="draft.mainData[`${getAddressGroupConfig(f.key).prefix}_x46`]"
                          :items="townOptionsFor(getAddressGroupConfig(f.key).prefix)"
                          item-title="name" item-value="code"
                          placeholder="區域" hide-details
                          :disabled="!draft.mainData[`${getAddressGroupConfig(f.key).prefix}_x45`]"
                          variant="outlined" density="compact" clearable
                          @update:model-value="onTownChange(getAddressGroupConfig(f.key).prefix, $event)" />
                      </v-col>
                      <v-col cols="12" sm="4" md="6">
                        <v-text-field
                          v-model="draft.mainData[getAddressGroupConfig(f.key).detailKey]"
                          :placeholder="getAddressGroupConfig(f.key).detailPlaceholder"
                          hide-details
                          variant="outlined" density="compact" clearable />
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- 縣市代碼 → 下拉 (僅剩 case_x45；其他已合併為地址區塊) -->
                  <v-col v-else-if="isCityCodeField(f.key)" cols="12" md="6" lg="4">
                    <v-select
                      :model-value="draft.mainData[f.key]"
                      :items="cityOptions" item-title="name" item-value="code"
                      :label="requiredLabel(f)"
                      variant="outlined" density="compact" clearable
                      @update:model-value="onCityChange(getPrefix(f.key), $event)" />
                  </v-col>
                  <!-- 鄉鎮代碼 → 下拉 (連動) -->
                  <v-col v-else-if="isTownCodeField(f.key)" cols="12" md="6" lg="4">
                    <v-select
                      :model-value="draft.mainData[f.key]"
                      :items="townOptionsFor(getPrefix(f.key))" item-title="name" item-value="code"
                      :label="requiredLabel(f)"
                      :disabled="!draft.mainData[`${getPrefix(f.key)}_x45`]"
                      variant="outlined" density="compact" clearable
                      @update:model-value="onTownChange(getPrefix(f.key), $event)" />
                  </v-col>
                  <!-- 受理機關 case_unit → 下拉 (連動 case_x45) -->
                  <v-col v-else-if="f.key === 'case_unit'" cols="12" md="6" lg="4">
                    <v-select
                      :model-value="draft.mainData.case_unit"
                      :items="caseUnitOptions" item-title="name" item-value="code"
                      :label="requiredLabel(f)"
                      :disabled="!draft.mainData.case_x45"
                      variant="outlined" density="compact" clearable
                      @update:model-value="onCaseUnitChange($event)" />
                  </v-col>
                  <!-- 以下為原本的通用欄位渲染 -->
                  <v-col v-else-if="f.type === 'autocomplete'" cols="12" md="6" lg="4">
                    <v-autocomplete
                      v-model="draft.mainData[f.key]"
                      :items="f.options" item-title="label" item-value="value"
                      :label="requiredLabel(f)"
                      variant="outlined" density="compact" clearable
                      @update:model-value="onSelectChange(f, $event)" />
                  </v-col>
                  <v-col v-else-if="f.type === 'select'" cols="12" md="6" lg="4">
                    <v-select
                      v-model="draft.mainData[f.key]"
                      :items="f.options" item-title="label" item-value="value"
                      :label="requiredLabel(f)"
                      variant="outlined" density="compact" clearable
                      @update:model-value="onSelectChange(f, $event)" />
                  </v-col>
                  <v-col v-else-if="f.type === 'textarea'" cols="12" md="6" lg="4">
                    <v-textarea
                      v-model="draft.mainData[f.key]"
                      :label="requiredLabel(f)"
                      rows="2" auto-grow variant="outlined" density="compact" />
                  </v-col>
                  <!-- 土地筆數：自動依「該戶土地標的清冊筆數」計算，唯讀 -->
                  <v-col v-else-if="f.key === 'p1ma_cntalid'" cols="12" md="6" lg="4">
                    <v-text-field
                      :model-value="draft.landData?.length ?? 0"
                      :label="requiredLabel(f)"
                      variant="outlined" density="compact"
                      readonly
                       />
                  </v-col>
                  <v-col v-else-if="f.type === 'number'" cols="12" md="6" lg="4">
                    <v-text-field
                      v-model="draft.mainData[f.key]"
                      :label="requiredLabel(f)" type="number"
                      variant="outlined" density="compact" clearable />
                  </v-col>
                  <!-- 民國日期 (YYYMMDD) - 即時格式驗證 -->
                  <v-col v-else-if="f.format === 'rocDate'" cols="12" md="6" lg="4">
                    <v-text-field
                      v-model="draft.mainData[f.key]"
                      :label="requiredLabel(f)"
                      placeholder="1101001"
                      variant="outlined" density="compact" clearable
                      inputmode="numeric" maxlength="7"
                      :rules="rocDateRules"
                      validate-on="input" />
                  </v-col>
                  <!-- 統一編號 (8 碼) - 即時格式驗證 -->
                  <v-col v-else-if="f.format === 'taxId'" cols="12" md="6" lg="4">
                    <v-text-field
                      v-model="draft.mainData[f.key]"
                      :label="requiredLabel(f)"
                      placeholder="12345678"
                      variant="outlined" density="compact" clearable
                      inputmode="numeric" maxlength="8"
                      :rules="taxIdRules"
                      validate-on="input" />
                  </v-col>
                  <!-- 統一編號 / 身分證字號 (擇一) - 即時格式驗證 -->
                  <v-col v-else-if="f.format === 'taxIdOrNatId'" cols="12" md="6" lg="4">
                    <v-text-field
                      :model-value="draft.mainData[f.key]"
                      @update:model-value="draft.mainData[f.key] = (typeof $event === 'string' ? $event.toUpperCase() : $event)"
                      :label="requiredLabel(f)"
                      placeholder="A123456789 或 12345678"
                      variant="outlined" density="compact" clearable
                      maxlength="10"
                      :rules="taxIdOrNatIdRules"
                      validate-on="input" />
                  </v-col>
                  <v-col v-else cols="12" md="6" lg="4">
                    <v-text-field
                      v-model="draft.mainData[f.key]"
                      :label="requiredLabel(f)"
                      variant="outlined" density="compact" clearable />
                  </v-col>
                </template>
              </v-row>
            </div>
          </div>

        </template>
      </v-card-text>

      <!-- 驗證錯誤提示列 -->
      <v-alert v-if="hasValidationErrors" type="error" density="compact" variant="tonal"
        class="mx-3 mt-2 validation-alert" icon="mdi-alert-circle">
        <div class="text-body-2 font-weight-medium mb-1">
          以下欄位格式有誤，請修正後才能下載 JSON：（共 {{ validationErrors.length }} 項）
        </div>
        <ul class="validation-error-list">
          <li v-for="err in validationErrors" :key="err.key">
            <a href="javascript:void(0)" class="text-error text-decoration-underline"
              @click="scrollToErrorField(err.key)">
              {{ err.label }}
            </a>
            <span class="text-body-2">—— {{ err.message }}</span>
          </li>
        </ul>
      </v-alert>

      <!-- 動作列 -->
      <v-divider />
      <v-card-actions class="pa-3 d-flex flex-wrap align-center ga-2">
        <v-text-field
          v-model="reportNo"
          label="申報書序號"
          placeholder="政府申報完成後回填"
          prepend-inner-icon="mdi-file-document-check-outline"
          variant="outlined" density="compact" hide-details clearable
          style="max-width: 280px;"
          @blur="onSaveReportNo" />
        <v-btn
          size="small" variant="tonal" color="primary"
          :loading="savingReportNo"
          :disabled="reportNo === initialReportNo"
          @click="onSaveReportNo">
          儲存序號
        </v-btn>
        <v-spacer />
        <v-btn variant="text" @click="close">取消</v-btn>
        <v-tooltip :disabled="!hasValidationErrors" location="top">
          <template #activator="{ props: tooltipProps }">
            <div v-bind="tooltipProps">
              <v-btn color="primary" variant="flat"
                :loading="exporting"
                :disabled="loading || hasValidationErrors"
                @click="onExport">
                <v-icon start>mdi-download</v-icon>
                產生並下載 JSON
              </v-btn>
            </div>
          </template>
          欄位格式錯誤：{{ validationErrors.map(e => e.label).join('、') }}
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue';
import { useToast } from 'vue-toastification';
import { useUserStore } from '@/store/user';
import {
  MAIN_DATA_SCHEMA, REPORT_STEPS, NOTE_SUB_GROUPS,
  isRequiredMainField, REQUIRED_MAIN_KEYS,
  TARGET_SHARED_KEYS,
} from '@/constants/realPriceReportSchema';
import {
  CITIES, getTownsByCity, getUnitsByCity, getUnitByTown,
  getCityName, getTownName, getUnitName,
} from '@/constants/landOfficeCodeTable';
import {
  loadProjectRealPriceReport,
  saveProjectRealPriceReport,
  mergeRealPriceReportData,
  generateRealPriceReportJson,
  downloadRealPriceReportJson,
} from '@/composables/useRealPriceReport';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';
import { fetchLandSections, getCachedLandSections } from '@/composables/useLandSections';
import LandDataEditor from './LandDataEditor.vue';
import BuildTableEditor from './BuildTableEditor.vue';
import CarDataEditor from './CarDataEditor.vue';

const props = defineProps({
  show: { type: Boolean, required: true },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  unitData: { type: Object, default: () => null },
  priceFormulas: { type: Object, default: () => null },  // 房土比計算公式（建案層級）
});
const emit = defineEmits(['update:show', 'unit-updated']);

const toast = useToast();
const userStore = useUserStore();

const loading = ref(false);
const exporting = ref(false);
const savingStepKey = ref('');  // 正在儲存為本案預設的 group key

// 申報書序號：政府申報完成後回填，存於戶別文件 top-level reportNo
const reportNo = ref('');
const initialReportNo = ref('');
const savingReportNo = ref(false);

// 可儲存為「本案常用資料」的段落（案件基本資料 / 申報人 / 代理人 / 交易標的共用項）
const SAVABLE_STEP_KEYS = new Set(['case', 'applicant', 'agent', 'target']);
function isSavableStep(key) { return SAVABLE_STEP_KEYS.has(key); }

const projectSettings = ref(null);

// contractType 不再提供 UI 下拉，直接由 loadAll 依戶別/建案資料決定
// 保留 ref 供 watch 同步 p1sp_code0505 毛胚屋旗標
const contractType = ref('一般合約');

const activeStep = ref(1);
const scrollArea = ref(null);

// 捲動時游標會連續進入多個 step section，直接賦值會高頻觸發頂部 chip 重繪。
// 用 requestAnimationFrame 節流：一幀內多次進入只保留最後一次。
let rafPending = false;
function onStepMouseEnter(step) {
  if (activeStep.value === step || rafPending) return;
  rafPending = true;
  requestAnimationFrame(() => {
    activeStep.value = step;
    rafPending = false;
  });
}

const draft = ref({
  mainData: {},
  landData: [],
  buildDataList: [{}],  // Step 8 改為陣列（HTML 允許多筆，但 JSON 只輸出第 1 筆）
  carData: [],
});

// ============ 共有部分面積(含車位) = 自動帶入共有部分面積 + 車位面積總和 ============
// build_areaP 由 unitData.area_common_sqm 自動帶入，未含各車位面積；
// 需再加上「車位資料」中有資料筆數的車位面積(car_area)。
// 以 baseBuildAreaP 保留不含車位的基底，避免車位變動時重複累加。
const baseBuildAreaP = ref(0);

function sumCarArea(carData) {
  return (Array.isArray(carData) ? carData : []).reduce((s, c) => {
    const n = Number(c?.car_area);
    return s + (isFinite(n) && n > 0 ? n : 0);
  }, 0);
}

// 將 baseBuildAreaP + 車位面積總和寫回 buildDataList[0].build_areaP
// 連動：交易總面積(BuildTableEditor.totalArea) 為 5 欄位加總，build_areaP 一更新即同步
function syncBuildAreaPWithCar() {
  const list = draft.value.buildDataList;
  if (!Array.isArray(list) || !list[0]) return;
  const total = baseBuildAreaP.value + sumCarArea(draft.value.carData);
  // 兩位小數，去除浮點誤差與多餘尾零
  const nextStr = total ? String(Number(total.toFixed(2))) : '0';
  if (String(list[0].build_areaP ?? '') !== nextStr) {
    const arr = list.slice();
    arr[0] = { ...arr[0], build_areaP: nextStr };
    draft.value.buildDataList = arr;
  }
}

const unitId = computed(() => props.unitData?.unitId || '');
const building = computed(() => props.unitData?.building || '');

// 依 group / subGroup 建立欄位索引
const fieldsByGroup = computed(() => {
  const out = {};
  REPORT_STEPS.forEach(s => { if (!s.table) out[s.key] = []; });
  MAIN_DATA_SCHEMA.forEach(f => {
    if (f.group === 'note') return; // note 獨立處理
    if (!out[f.group]) out[f.group] = [];
    out[f.group].push(f);
  });
  return out;
});
const fieldsBySubGroup = computed(() => {
  const out = {};
  NOTE_SUB_GROUPS.forEach(sg => { out[sg.key] = []; });
  MAIN_DATA_SCHEMA.forEach(f => {
    if (f.group !== 'note') return;
    const sg = f.subGroup || 'note5';
    if (!out[sg]) out[sg] = [];
    out[sg].push(f);
  });
  return out;
});

// select 連動邏輯：
// (A) 代碼 select (如 p1ma_build5) → 自動填名稱 p1ma_build5c（舊行為，保留給未來使用）
// (B) 名稱 select (如 p1ma_build7c，有 codeKey='p1ma_build7') → 自動填代碼 p1ma_build7
function onSelectChange(field, value) {
  if (!field.options) return;
  const opt = field.options.find(o => o.value === value);
  if (!opt) return;
  const md = { ...draft.value.mainData };
  // (A) xxx → xxxc
  const cKey = `${field.key}c`;
  if (Object.prototype.hasOwnProperty.call(md, cKey)) {
    md[cKey] = opt.label;
  }
  // (B) xxxc → xxx (codeKey)
  if (field.codeKey && opt.code !== undefined) {
    md[field.codeKey] = opt.code;
  }
  draft.value.mainData = md;
}
function onCheckboxChange(key, val) {
  draft.value.mainData = { ...draft.value.mainData, [key]: val ? 'Y' : '' };
}

// ============ 縣市/鄉鎮/地政所 三層連動 ============
// 識別：凡屬 CASCADE_PREFIXES 的 {prefix}_x45 / {prefix}_x46 / case_unit 皆為連動欄位
const CASCADE_PREFIXES = ['case', 'apply', 'agents', 'right', 'land'];

function getPrefix(key) {
  // case_x45 → case ; apply_x46 → apply
  const m = String(key || '').match(/^([a-z]+)_x4[56]$/);
  return m ? m[1] : '';
}
function isCityCodeField(key) {
  const p = getPrefix(key);
  return CASCADE_PREFIXES.includes(p) && /_x45$/.test(key);
}
function isTownCodeField(key) {
  const p = getPrefix(key);
  return CASCADE_PREFIXES.includes(p) && /_x46$/.test(key);
}
function isAutoFilledNameField(key) {
  // *_x45c, *_x46c → 由連動自動填入
  if (/^(case|apply|agents|right|land)_x45c$/.test(key)) return true;
  if (/^(case|apply|agents|right|land)_x46c$/.test(key)) return true;
  // case_unitc → 由 case_unit 自動填入
  if (key === 'case_unitc') return true;
  return false;
}

// 系統內部欄位（官方申報表單亦為 hidden input）：不在 UI 顯示，使用固定預設值
const SYSTEM_HIDDEN_KEYS = new Set([
  'case_type',           // 固定 B1 (預售屋成交)
  'case_no',             // 由主管機關產生
  'p1ma_caseSeq',        // 同批序號，單戶固定 01
  // 下列 4 個代碼欄位：由對應的 *c 名稱 select 自動填入
  'p1ma_build7',         // 主要用途碼 → 由 p1ma_build7c 連動
  'p1ma_build5',         // 建物型態碼 → 由 p1ma_build5c 連動
  'p1ma_build8',         // 主要建材碼 → 由 p1ma_build8c 連動
  'p1ma_build10_1',      // 交易層次碼 → 由 p1ma_build10_1c 連動
  // 下列 4 個「自訂」文字欄位：僅在選到 Z/Y 等特殊代碼時才使用，一般不顯示
  'p1ma_build7Text',
  'p1ma_build5Text',
  'p1ma_build8Text',
  'p1ma_build10_1Text',
]);
function isSystemHiddenField(key) {
  return SYSTEM_HIDDEN_KEYS.has(key);
}

// 申報人種類選項 (HTML radio)
const CASE_KIND_OPTIONS = [
  { value: '14', label: '銷售預售屋者' },
  { value: '12', label: '不動產經紀業' },
];

// 交易標的種類選項 (HTML radio)
const CASEFLAG_OPTIONS = [
  { value: '1', label: '房地(土地+房屋)' },
  { value: '2', label: '房地(土地+房屋)+車位' },
  { value: '3', label: '土地' },
  { value: '4', label: '建物' },
  { value: '5', label: '車位' },
];

// 車位備註選項
const PARKFLAG_OPTIONS = [
  { value: '0', label: '單獨計價' },
  { value: '1', label: '已納入總價' },
  { value: '2', label: '無車位' },
];

// 判斷該地址區塊 (通訊地址/建物坐落) 是否任一成員為必填 → 區塊標題加 *
function isAddressGroupRequired(key) {
  const cfg = getAddressGroupConfig(key);
  if (!cfg) return false;
  return REQUIRED_MAIN_KEYS.has(`${cfg.prefix}_x45`)
    || REQUIRED_MAIN_KEYS.has(`${cfg.prefix}_x46`)
    || REQUIRED_MAIN_KEYS.has(cfg.detailKey);
}

// ============ 建物格局整合 (房/廳/衛 + 無隔間) ============
// p1ma_build1 為整合區塊的起點，p1ma_build2/3/4 由外層 loop 跳過
function isBuildLayoutStart(key) { return key === 'p1ma_build1'; }
function isBuildLayoutMember(key) {
  return key === 'p1ma_build2' || key === 'p1ma_build3' || key === 'p1ma_build4';
}

// 為 v-text-field / v-select 的 label 加上 ※ 前綴以標示必填
function requiredLabel(field) {
  if (!field) return '';
  return isRequiredMainField(field.key) ? `※ ${field.label}` : field.label;
}

// ============ 民國日期格式驗證 (YYYMMDD 7 碼) ============
// 例：1101001 = 民國 110 年 10 月 01 日
function validateROCDate(value) {
  if (value === null || value === undefined || value === '') return true; // 空值不報錯 (由 required 另行處理)
  const str = String(value).trim();
  if (!/^\d{7}$/.test(str)) return '請輸入 7 碼數字 (民國年3碼+月2碼+日2碼，例: 1101001)';
  const year = Number(str.slice(0, 3));
  const month = Number(str.slice(3, 5));
  const day = Number(str.slice(5, 7));
  if (year < 1) return '民國年份錯誤';
  if (month < 1 || month > 12) return '月份須為 01~12';
  if (day < 1 || day > 31) return '日期須為 01~31';
  // 實際日期是否存在 (含閏年/小月)
  const adYear = year + 1911;
  const d = new Date(adYear, month - 1, day);
  if (d.getFullYear() !== adYear || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return '不是有效的日期';
  }
  return true;
}
// Vuetify rules 陣列 (可搭配 v-text-field :rules)
const rocDateRules = [v => validateROCDate(v)];

// ============ 統一編號 8 碼檢查碼驗證 (2023/04/01 新制) ============
// 經濟部商業司自 2023/04 起放寬規則：
//   - 位權 [1,2,1,2,1,2,4,1]；各位數 × 權重後，將乘積的十位+個位相加 (1 層 digit sum)；
//   - 8 個結果加總為 sum；sum % 5 === 0 即合法 (舊規則為 % 10 === 0 且第 7 碼=7 時特例)。
// 新規則向下相容舊號，且許多 2023 後核發的統編只滿足 % 5，故一律採新制。
function validateTaxId(value) {
  if (value === null || value === undefined || value === '') return true;
  const str = String(value).trim();
  if (!/^\d{8}$/.test(str)) return '統一編號須為 8 碼數字';
  const weights = [1, 2, 1, 2, 1, 2, 4, 1];
  const digits = str.split('').map(Number);
  const collapse = (n) => (n < 10 ? n : Math.floor(n / 10) + (n % 10));
  const sum = digits.reduce((s, d, i) => s + collapse(d * weights[i]), 0);
  return sum % 5 === 0 ? true : '統一編號檢查碼錯誤';
}
const taxIdRules = [v => validateTaxId(v)];

// ============ 身分證字號驗證 (1 字母 + 9 碼) ============
// 字母對映：A=10 B=11 C=12 D=13 E=14 F=15 G=16 H=17 I=34 J=18 K=19 L=20
//          M=21 N=22 O=35 P=23 Q=24 R=25 S=26 T=27 U=28 V=29 W=32 X=30 Y=31 Z=33
// 十位數 *1 + 個位數 *9 + 後 8 碼 * [8,7,6,5,4,3,2,1] + 第 10 碼 * 1，總和 mod 10 = 0
const NAT_ID_LETTER_MAP = {
  A:10,B:11,C:12,D:13,E:14,F:15,G:16,H:17,I:34,J:18,K:19,L:20,M:21,
  N:22,O:35,P:23,Q:24,R:25,S:26,T:27,U:28,V:29,W:32,X:30,Y:31,Z:33,
};
function validateNatId(value) {
  if (value === null || value === undefined || value === '') return true;
  const str = String(value).trim().toUpperCase();
  if (!/^[A-Z][0-9]{9}$/.test(str)) return '身分證字號格式錯誤 (1 字母 + 9 碼數字)';
  if (str[1] !== '1' && str[1] !== '2') return '身分證字號第 2 碼須為 1 (男) 或 2 (女)';
  const n = NAT_ID_LETTER_MAP[str[0]];
  const tail = [...str.slice(1)].map(Number);
  let sum = Math.floor(n / 10) + (n % 10) * 9;
  const weights = [8, 7, 6, 5, 4, 3, 2, 1];
  for (let i = 0; i < 8; i++) sum += tail[i] * weights[i];
  sum += tail[8];
  return sum % 10 === 0 ? true : '身分證字號檢查碼錯誤';
}

// 買受人可能為統一編號 (8 碼數字) 或身分證 (字母開頭)
function validateTaxIdOrNatId(value) {
  if (value === null || value === undefined || value === '') return true;
  const str = String(value).trim();
  if (/^\d+$/.test(str)) return validateTaxId(str);
  if (/^[A-Za-z]/.test(str)) return validateNatId(str);
  return '請輸入 8 碼統一編號或身分證字號';
}
const taxIdOrNatIdRules = [v => validateTaxIdOrNatId(v)];

// 全欄位驗證器對照表 (未來要加其他格式驗證可擴充)
// 三個 idNo 欄位皆放寬：統一編號 (8 碼) 或 身分證字號 (1 字母+9 碼) 擇一合法即可
const FIELD_VALIDATORS = {
  p1ma_typeB_4: validateROCDate,
  p1ma_date: validateROCDate,
  apply_idNo:  validateTaxIdOrNatId,
  agents_idNo: validateTaxIdOrNatId,
  right_idNo:  validateTaxIdOrNatId,
};

// 收集所有驗證錯誤
const validationErrors = computed(() => {
  const errors = [];
  Object.entries(FIELD_VALIDATORS).forEach(([key, validator]) => {
    const result = validator(draft.value.mainData?.[key]);
    if (result !== true) {
      const field = MAIN_DATA_SCHEMA.find(f => f.key === key);
      errors.push({ key, label: field?.label || key, message: result });
    }
  });
  return errors;
});
const hasValidationErrors = computed(() => validationErrors.value.length > 0);

// 點錯誤提示可捲動到該欄位段
function scrollToErrorField(key) {
  const field = MAIN_DATA_SCHEMA.find(f => f.key === key);
  if (!field) return;
  const step = REPORT_STEPS.find(s => s.key === field.group);
  if (step) scrollToStep(step.step);
}

// 整合型地址區塊：將 {prefix}_x45 + {prefix}_x46 + {prefix}_addr (或 p1ma_dd09) 合併為一組
// key = 第一欄 (_x45)；detailKey = 詳細地址/門牌欄位
const ADDRESS_GROUPS = {
  apply:  { label: '通訊地址', detailKey: 'apply_addr',  detailPlaceholder: '請輸入地址(縣市及區域不需要輸入)' },
  agents: { label: '通訊地址', detailKey: 'agents_addr', detailPlaceholder: '請輸入地址(縣市及區域不需要輸入)' },
  right:  { label: '通訊地址', detailKey: 'right_addr',  detailPlaceholder: '請輸入地址(縣市及區域不需要輸入)' },
  land:   { label: '建物坐落', detailKey: 'p1ma_dd09',   detailPlaceholder: '請依預售屋實際興建位置填載建物門牌或街路名稱' },
};
function isAddressGroupStart(key) {
  const m = String(key || '').match(/^([a-z]+)_x45$/);
  return !!(m && ADDRESS_GROUPS[m[1]]);
}
function getAddressGroupConfig(key) {
  const m = String(key || '').match(/^([a-z]+)_x45$/);
  if (!m) return null;
  const cfg = ADDRESS_GROUPS[m[1]];
  return cfg ? { prefix: m[1], ...cfg } : null;
}
// 已在地址區塊內渲染過的欄位，外層 for-loop 跳過
function isMemberOfRenderedAddress(key) {
  if (/^(apply|agents|right)_x46$/.test(key)) return true;
  if (/^(apply|agents|right)_addr$/.test(key)) return true;
  if (key === 'land_x46') return true;
  if (key === 'p1ma_dd09') return true;
  return false;
}

const cityOptions = CITIES;

function townOptionsFor(prefix) {
  if (!prefix) return [];
  const x45 = draft.value.mainData[`${prefix}_x45`];
  return getTownsByCity(x45);
}

const caseUnitOptions = computed(() => {
  const x45 = draft.value.mainData?.case_x45;
  return getUnitsByCity(x45);
});

function onCityChange(prefix, code) {
  if (!prefix) return;
  const md = { ...draft.value.mainData };
  md[`${prefix}_x45`] = code || '';
  md[`${prefix}_x45c`] = code ? getCityName(code) : '';
  // 換縣市時清空連動的鄉鎮
  md[`${prefix}_x46`] = '';
  md[`${prefix}_x46c`] = '';
  // case 段額外清空地政所
  if (prefix === 'case') {
    md.case_unit = '';
    md.case_unitc = '';
  }
  draft.value.mainData = md;
}

function onTownChange(prefix, code) {
  if (!prefix) return;
  const md = { ...draft.value.mainData };
  const x45 = md[`${prefix}_x45`];
  md[`${prefix}_x46`] = code || '';
  md[`${prefix}_x46c`] = code ? getTownName(x45, code) : '';
  // 若為案件基本資料，依鄉鎮自動預選對應地政所
  if (prefix === 'case' && code) {
    const unit = getUnitByTown(x45, code);
    if (unit) {
      md.case_unit = unit.code;
      md.case_unitc = unit.name;
    }
  }
  draft.value.mainData = md;
}

function onCaseUnitChange(code) {
  const md = { ...draft.value.mainData };
  md.case_unit = code || '';
  md.case_unitc = code ? getUnitName(md.case_x45, code) : '';
  draft.value.mainData = md;
}

async function loadAll() {
  if (!props.projectId || !props.unitData) return;
  loading.value = true;
  try {
    // 申報書序號：從 unitData 直接取 (UnitDetailModal 的上層已含此欄位)
    reportNo.value = String(props.unitData.reportNo ?? '').trim();
    initialReportNo.value = reportNo.value;

    const proj = await loadProjectRealPriceReport(props.projectId);
    projectSettings.value = proj;
    // 合約類型優先級：戶別實際合約方式 > 建案預設 > 一般合約
    contractType.value = props.unitData?.contractType
      || proj.signDefaults?.defaultContractType
      || '一般合約';

    const merged = mergeRealPriceReportData({
      projectSettings: proj,
      unitData: props.unitData,
      relationFlag: false,
      extraContext: {
        projectName: props.projectName,
        priceFormulas: props.priceFormulas,
      },
    });
    // 基底 = 自動帶入的共有部分面積(不含車位)；隨後加上車位面積總和
    baseBuildAreaP.value = Number(merged.buildData?.build_areaP) || 0;
    draft.value = {
      mainData: merged.mainData,
      landData: merged.landData,
      buildDataList: [merged.buildData],
      carData: merged.carData,
    };
    syncBuildAreaPWithCar();
  } catch (e) {
    toast.error(`載入實價登錄資料失敗：${e.message}`);
  } finally {
    loading.value = false;
  }
}

watch(() => props.show, (val) => {
  if (val) {
    activeStep.value = 1;
    loadAll();
  }
}, { immediate: true });

// 合約類型變動 → 毛胚屋旗標
watch(contractType, (val) => {
  if (draft.value.mainData) {
    draft.value.mainData = { ...draft.value.mainData, p1sp_code0505: val === '毛胚合約' ? 'Y' : '' };
  }
});

// 車位資料變動（新增/刪除/修改車位面積）→ 重算共有部分面積(含車位)
watch(() => draft.value.carData, () => {
  syncBuildAreaPWithCar();
}, { deep: true });

// 土地筆數：自動同步為 draft.landData 筆數，確保匯出 JSON 的 p1ma_cntalid 與實際資料一致
watch(() => draft.value.landData?.length ?? 0, (len) => {
  if (!draft.value.mainData) return;
  const next = String(len);
  if (String(draft.value.mainData.p1ma_cntalid ?? '') !== next) {
    draft.value.mainData = { ...draft.value.mainData, p1ma_cntalid: next };
  }
});

// ============ 儲存某段落為「本案常用預設」 ============
async function onSaveStepAsDefault(groupKey) {
  if (!SAVABLE_STEP_KEYS.has(groupKey)) return;
  savingStepKey.value = groupKey;
  try {
    // 決定要儲存的 key 清單
    // - target 段只存「本案共用欄位」（建物坐落/建案/建物規格），不存樓層/格局/交易日期/總價等戶別專屬欄位
    // - 其他段存該 group 內所有欄位
    let savableKeys;
    if (groupKey === 'target') {
      savableKeys = TARGET_SHARED_KEYS;
    } else {
      savableKeys = MAIN_DATA_SCHEMA.filter(f => f.group === groupKey).map(f => f.key);
    }

    const partial = {};
    savableKeys.forEach(k => {
      partial[k] = draft.value.mainData[k] ?? '';
    });

    const current = projectSettings.value || {};
    const newSettings = {
      ...current,
      mainDefaults: { ...(current.mainDefaults || {}), ...partial },
    };
    await saveProjectRealPriceReport(props.projectId, newSettings, userStore.user?.email || '');
    projectSettings.value = newSettings;

    const label = REPORT_STEPS.find(s => s.key === groupKey)?.label || groupKey;
    const scope = groupKey === 'target' ? '（僅本案共用欄位）' : '';
    toast.success(`已儲存「${label}」${scope} 為本案常用資料，之後開啟其他戶別會自動帶入`);
  } catch (e) {
    toast.error(`儲存失敗：${e.message}`);
  } finally {
    savingStepKey.value = '';
  }
}

// 匯出前的段小段反查：landData 若「有段名(land_x48c) 但無段代碼(land_x48)」→ 拉段清單反查填入
// 針對使用者一開啟對話框就按下載（段清單尚未由 LandDataEditor 的 applyFallback 非同步載入完成）的情境
async function ensureLandSectionCodes(landData) {
  if (!Array.isArray(landData) || landData.length === 0) return landData;
  const needed = landData.filter(r =>
    r && !r.land_x48 && r.land_x48c && r.land_x45 && r.land_x46
  );
  if (needed.length === 0) return landData;

  // 依 (縣市, 鄉鎮) 去重後批次載入段清單
  const keys = new Set(needed.map(r => `${r.land_x45}|${r.land_x46}`));
  await Promise.all([...keys].map(async k => {
    const [x45, x46] = k.split('|');
    if (!getCachedLandSections(x45, x46)) {
      try { await fetchLandSections(x45, x46); } catch (_) { /* 忽略網路錯誤，保持空代碼 */ }
    }
  }));

  return landData.map(r => {
    if (!r || r.land_x48 || !r.land_x48c || !r.land_x45 || !r.land_x46) return r;
    const list = getCachedLandSections(r.land_x45, r.land_x46) || [];
    const hit = list.find(s => s.section === r.land_x48c);
    return hit ? { ...r, land_x48: hit.sectCode } : r;
  });
}

async function onExport() {
  exporting.value = true;
  try {
    // 匯出前先補齊 land_x48 代碼（若段清單還沒載完）
    const landDataResolved = await ensureLandSectionCodes(draft.value.landData);

    // 產生並下載 JSON（不儲存戶別覆寫，所有欄位變更僅於本次對話框內有效）
    const finalJson = generateRealPriceReportJson({
      mainData: draft.value.mainData,
      landData: landDataResolved,
      buildData: (draft.value.buildDataList || [])[0] || {},
      carData: draft.value.carData,
    });

    // 檔名格式：YYYY-MM-DD-[建案名稱]-[戶別]-實登json.zip
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;
    const fileName = `${dateStr}-${props.projectName || ''}-${unitId.value || ''}-實登json`;
    await downloadRealPriceReportJson(finalJson, fileName);
    toast.success('ZIP 已產生並開始下載');
    close();
  } catch (e) {
    console.error('[ExportDialog] 匯出失敗:', e);
    toast.error(`匯出失敗：${e.message}`);
  } finally {
    exporting.value = false;
  }
}

// 儲存申報書序號：對 salesHouseholds/{docId} 做 updateDoc 純欄位 patch
// 刻意不走 updateSalesData Cloud Function (它會對 payload 做額外處理，曾造成其他欄位變動)
// updateDoc 僅 patch 所列欄位；其餘欄位保持不變
async function onSaveReportNo() {
  const next = String(reportNo.value ?? '').trim();
  if (next === initialReportNo.value) return;
  const householdDocId = props.unitData?.id;
  if (!householdDocId) {
    toast.error('缺少戶別文件 ID (unitData.id)，無法儲存');
    return;
  }
  savingReportNo.value = true;
  try {
    await updateDoc(doc(db, 'salesHouseholds', householdDocId), {
      reportNo: next,
      reportNoUpdatedAt: serverTimestamp(),
      reportNoUpdatedBy: userStore.user?.email || '',
    });
    initialReportNo.value = next;
    emit('unit-updated', { field: 'reportNo', value: next });
    toast.success(next ? `已儲存申報書序號：${next}` : '已清除申報書序號');
  } catch (e) {
    toast.error(`儲存序號失敗：${e.message}`);
  } finally {
    savingReportNo.value = false;
  }
}

function close() { emit('update:show', false); }

async function scrollToStep(step) {
  activeStep.value = step;
  await nextTick();
  const el = document.getElementById(`step-${step}`);
  if (el && scrollArea.value) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
</script>

<style scoped>
.process-box {
  background: #f5f5f7;
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
}
.process-chip {
  height: 36px !important;
  font-size: 0.9rem !important;
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.process-chip:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
}
.form-body {
  flex: 1 1 auto;  /* 佔滿 card 剩餘空間 */
  min-height: 0;   /* 允許縮得比內容小，讓下方 alert/actions 有位置 */
  overflow-y: auto;
  background: #fafafa;
}
/* 驗證錯誤提示列：釘在 card-text 與 actions 之間，錯誤多時內部捲動 */
.validation-alert {
  flex: 0 0 auto;
  max-height: 35vh;
  overflow-y: auto;
}
.step-section {
  background: #fff;
  margin: 12px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}
.step-header {
  background: linear-gradient(90deg, #1a3a6e 0%, #2d5a9e 100%);
  color: white;
  padding: 10px 16px;
  border-radius: 8px 8px 0 0;
  font-size: 1rem;
  font-weight: 600;
}
.step-header .step-num {
  display: inline-block;
  background: rgba(255,255,255,0.2);
  border-radius: 4px;
  padding: 2px 8px;
  margin-right: 8px;
  font-weight: 700;
}
.step-body {
  padding: 16px;
}
.note-sub-group {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafc;
  border-left: 4px solid #1a3a6e;
  border-radius: 4px;
}
.note-sub-title {
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 8px;
  font-size: 0.95rem;
}
.validation-error-list {
  margin: 0;
  padding-left: 20px;
  font-size: 0.875rem;
  line-height: 1.6;
  /* 錯誤多時這層先捲，避免整張 dialog 被撐大 */
  max-height: 28vh;
  overflow-y: auto;
}
.field-group-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a3a6e;
  margin-bottom: 4px;
}
.field-group-label .req {
  color: #e30000;
  margin-right: 2px;
}
</style>
