<template>
  <v-dialog v-model="isOpen" max-width="1280" scrollable>
    <v-card>
      <v-toolbar color="primary" density="comfortable">
        <v-toolbar-title class="text-white">
          <v-icon class="mr-2">mdi-file-export-outline</v-icon>匯出文件 — {{ item?._unitId || '' }}
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon="mdi-close" color="white" @click="isOpen = false" />
      </v-toolbar>

      <v-card-text class="pa-4" style="max-height: 82vh;">
        <v-row dense>
          <!-- 左：模板與欄位對應 -->
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedTemplateKey"
              :items="templateOptions"
              item-title="name"
              item-value="key"
              label="文件模板"
              variant="outlined"
              density="comfortable"
              hide-details
              class="mb-1"
            />
            <div class="text-caption text-medium-emphasis mb-3">{{ template?.description }}</div>

            <div class="d-flex align-center mb-2">
              <span class="text-subtitle-2">欄位對應</span>
              <v-spacer />
              <v-btn size="x-small" variant="text" color="primary" @click="autoMapAll">重新自動比對</v-btn>
            </div>
            <v-alert type="info" variant="tonal" density="compact" class="text-caption mb-2">
              每一格可選「⚙ 智慧來源」（系統自動查詢／計算）、「表單欄位」（帶入該筆回覆的值），或直接輸入固定文字。對應可儲存，之後此表單匯出都會沿用。
            </v-alert>

            <div class="mapping-panel">
              <v-combobox
                v-for="slot in template?.slots || []"
                :key="slot.key"
                v-model="mapping[slot.key]"
                :items="mappingOptions"
                :label="slot.name"
                variant="outlined"
                density="compact"
                hide-details
                clearable
                class="mb-2"
              >
                <template #append-inner>
                  <v-progress-circular
                    v-if="isSmartMapped(slot.key) && smartLoading[mapping[slot.key]]"
                    indeterminate size="14" width="2" color="deep-purple"
                  />
                  <v-icon v-else-if="isSmartMapped(slot.key)" size="16" color="deep-purple" title="智慧來源（系統自動查詢／計算）">mdi-cog-outline</v-icon>
                  <v-icon v-else-if="isFieldMapped(slot.key)" size="16" color="success" title="已對應表單欄位">mdi-link-variant</v-icon>
                  <v-icon v-else-if="mapping[slot.key]" size="16" color="warning" title="固定文字">mdi-format-text</v-icon>
                </template>
              </v-combobox>
            </div>

            <v-btn
              block
              color="secondary"
              variant="tonal"
              prepend-icon="mdi-content-save-outline"
              class="mt-2"
              :loading="savingMapping"
              @click="saveMapping"
            >
              儲存欄位對應（供此表單重複使用）
            </v-btn>
          </v-col>

          <!-- 右：預覽 -->
          <v-col cols="12" md="8">
            <div class="d-flex align-center mb-2 ga-2">
              <span class="text-subtitle-2">預覽</span>
              <v-spacer />
              <v-btn
                color="error"
                variant="flat"
                prepend-icon="mdi-file-pdf-box"
                :loading="exportingPdf"
                @click="exportPdf"
              >
                匯出 PDF
              </v-btn>
              <v-btn
                color="indigo"
                variant="flat"
                prepend-icon="mdi-file-word-box"
                :loading="exportingWord"
                @click="exportWord"
              >
                匯出 Word
              </v-btn>
            </div>
            <div class="preview-scroll">
              <div class="preview-scale">
                <div ref="previewEl" v-html="previewHtml"></div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useToast } from 'vue-toastification';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  formExportTemplates, normalizeLabel, formatSlotValue, Packer,
  smartSources, isSmartToken, getSmartSourceByToken, getSmartSourceByKey, findBirthdayLabel,
} from '@/utils/formExportTemplates';

// 觸發瀏覽器下載 Blob
const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const props = defineProps<{
  modelValue: boolean;
  projectId: string;
  projectName?: string;
  form: any;          // customFormTemplates 文件（含 id, fields, exportMappings）
  item: any;          // 單筆回覆（CustomFormResponses 已攤平：label → value）
}>();
const emit = defineEmits(['update:modelValue']);

const toast = useToast();
const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
});

const selectedTemplateKey = ref(formExportTemplates[0]?.key || '');
const templateOptions = formExportTemplates.map(t => ({ key: t.key, name: t.name }));
const template = computed(() => formExportTemplates.find(t => t.key === selectedTemplateKey.value));

const mapping = ref<Record<string, string>>({});
const savingMapping = ref(false);
const exportingPdf = ref(false);
const exportingWord = ref(false);
const previewEl = ref<HTMLElement | null>(null);

// --- 表單欄位名稱（含子欄位）---
const collectLabels = (fields: any[]): string[] => {
  const out: string[] = [];
  (fields || []).forEach((f: any) => {
    if (['header', 'description', 'divider', 'link'].includes(f.type)) return;
    if (f.label) out.push(f.label);
    (f.options || []).forEach((opt: any) => {
      if (opt.subFields) out.push(...collectLabels(opt.subFields));
    });
  });
  return Array.from(new Set(out));
};
const fieldLabelOptions = computed(() => collectLabels(props.form?.fields || []));

// 對應下拉選項：智慧來源在前、表單欄位在後
const mappingOptions = computed(() => [
  ...smartSources.map(s => s.token),
  ...fieldLabelOptions.value,
]);

const isFieldMapped = (slotKey: string) =>
  !!mapping.value[slotKey] && fieldLabelOptions.value.includes(mapping.value[slotKey]);
const isSmartMapped = (slotKey: string) => isSmartToken(mapping.value[slotKey]);

// --- 智慧來源解析（非同步，依 token 快取）---
const smartValues = ref<Record<string, string>>({});
const smartLoading = ref<Record<string, boolean>>({});

const smartContext = computed(() => ({
  projectId: props.projectId,
  unitId: props.item?._unitId || '',
  fieldLabels: fieldLabelOptions.value,
  getFieldValue: (label: string) => props.item?.[label],
}));

const resolveSmartToken = async (token: string) => {
  const source = getSmartSourceByToken(token);
  if (!source || smartLoading.value[token]) return;
  smartLoading.value = { ...smartLoading.value, [token]: true };
  try {
    const result = await source.resolve(smartContext.value);
    smartValues.value = { ...smartValues.value, [token]: result };
  } catch (err) {
    console.error(`智慧來源「${token}」解析失敗:`, err);
    smartValues.value = { ...smartValues.value, [token]: '' };
  } finally {
    smartLoading.value = { ...smartLoading.value, [token]: false };
  }
};

// mapping 中用到的智慧 token 一有變動就解析（同 token 已解析過則沿用快取）；
// 換一筆資料時先清除快取再重新解析（戶別/出生日期都不同）
watch([mapping, () => props.item], ([, newItem], old) => {
  if (old && newItem !== old[1]) {
    smartValues.value = {};
    smartLoading.value = {};
  }
  Object.values(mapping.value).forEach(m => {
    if (isSmartToken(m) && smartValues.value[m] === undefined) {
      resolveSmartToken(m);
    }
  });
}, { deep: true });

// --- 自動比對：slot aliases ↔ 表單欄位名稱（正規化比對）---
const autoMatchSlot = (slot: any): string => {
  const labels = fieldLabelOptions.value;
  const normalized = labels.map(l => ({ label: l, norm: normalizeLabel(l) }));
  for (const alias of [slot.name, ...(slot.aliases || [])]) {
    const target = normalizeLabel(alias);
    if (!target) continue;
    const hit = normalized.find(n => n.norm === target);
    if (hit) return hit.label;
  }
  return '';
};

const defaultForSlot = (slot: any): string => {
  switch (slot.defaultSource) {
    case 'projectName': return props.projectName || '';
    case 'unitId': return props.item?._unitId || '';
    case 'today': return new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' });
    case 'literal': return slot.defaultLiteral || '';
    default: return '';
  }
};

const autoMapAll = () => {
  const map: Record<string, string> = {};
  (template.value?.slots || []).forEach(slot => {
    const smartToken = slot.smartDefault ? (getSmartSourceByKey(slot.smartDefault)?.token || '') : '';
    const fieldMatch = autoMatchSlot(slot);

    if (smartToken && slot.smartPriority === 'beforeField') {
      // 系統資料為權威（專案經理／目前銷售人員）：智慧來源優先
      map[slot.key] = smartToken;
    } else if (fieldMatch) {
      map[slot.key] = fieldMatch;
    } else if (smartToken) {
      // afterField（年齡）：表單沒有對應欄位時，若找得到出生日期欄位才改用自動計算
      if (slot.smartDefault !== 'ageFromBirthday' || findBirthdayLabel(fieldLabelOptions.value)) {
        map[slot.key] = smartToken;
      } else {
        map[slot.key] = defaultForSlot(slot);
      }
    } else {
      map[slot.key] = defaultForSlot(slot);
    }
  });
  mapping.value = map;
};

// 開啟時初始化：已儲存的對應優先，否則自動比對
const initMapping = () => {
  const saved = props.form?.exportMappings?.[selectedTemplateKey.value];
  if (saved && typeof saved === 'object') {
    const map: Record<string, string> = {};
    (template.value?.slots || []).forEach(slot => {
      map[slot.key] = saved[slot.key] ?? (autoMatchSlot(slot) || defaultForSlot(slot));
    });
    mapping.value = map;
  } else {
    autoMapAll();
  }
};
watch(() => [props.modelValue, selectedTemplateKey.value], ([open]) => {
  if (open) initMapping();
}, { immediate: true });

// --- 解析每個 slot 的實際值 ---
const resolvedValues = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {};
  (template.value?.slots || []).forEach(slot => {
    const m = mapping.value[slot.key] || '';
    if (!m) {
      out[slot.key] = '';
    } else if (isSmartToken(m)) {
      // 智慧來源 → 取非同步解析結果（解析中顯示佔位）
      out[slot.key] = smartLoading.value[m] ? '…' : (smartValues.value[m] ?? '');
    } else if (fieldLabelOptions.value.includes(m)) {
      // 對應到表單欄位 → 取該筆回覆的值
      out[slot.key] = formatSlotValue(props.item?.[m]);
    } else {
      // 非欄位名稱 → 視為固定文字
      out[slot.key] = m;
    }
  });
  return out;
});

/** 匯出前確保智慧來源已全部解析完成 */
const waitSmartResolved = async () => {
  const tokens = Object.values(mapping.value).filter(m => isSmartToken(m));
  await Promise.all(tokens.map(t => smartValues.value[t] === undefined ? resolveSmartToken(t) : Promise.resolve()));
  // 等待進行中的解析結束
  while (Object.values(smartLoading.value).some(Boolean)) {
    await new Promise(r => setTimeout(r, 100));
  }
};

const previewHtml = computed(() => template.value?.buildHtml(resolvedValues.value) || '');

// --- 儲存對應（寫回表單文件）---
const saveMapping = async () => {
  if (!props.form?.id || !template.value) return;
  savingMapping.value = true;
  try {
    await updateDoc(doc(db, 'customFormTemplates', props.form.id), {
      [`exportMappings.${template.value.key}`]: { ...mapping.value },
    });
    // 同步本地 form 物件，避免重開 dialog 讀到舊值
    if (!props.form.exportMappings) props.form.exportMappings = {};
    props.form.exportMappings[template.value.key] = { ...mapping.value };
    toast.success('欄位對應已儲存');
  } catch (err: any) {
    console.error('儲存欄位對應失敗:', err);
    toast.error(`儲存失敗: ${err.message}`);
  } finally {
    savingMapping.value = false;
  }
};

// --- 匯出 PDF（html2canvas 截圖 → jsPDF A4）---
const exportPdf = async () => {
  if (!previewEl.value || !template.value) return;
  exportingPdf.value = true;
  try {
    await waitSmartResolved();
    await new Promise(r => setTimeout(r, 50)); // 等待預覽 DOM 更新
    const target = previewEl.value.firstElementChild as HTMLElement;
    const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const imgH = (canvas.height / canvas.width) * pageW;
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, Math.min(imgH, pageH));
    pdf.save(`${template.value.fileName(resolvedValues.value)}.pdf`);
    toast.success('PDF 匯出成功');
  } catch (err: any) {
    console.error('PDF 匯出失敗:', err);
    toast.error(`PDF 匯出失敗: ${err.message}`);
  } finally {
    exportingPdf.value = false;
  }
};

// --- 匯出 Word (docx) ---
const exportWord = async () => {
  if (!template.value) return;
  exportingWord.value = true;
  try {
    await waitSmartResolved();
    const docFile = template.value.buildDocx(resolvedValues.value);
    const blob = await Packer.toBlob(docFile);
    downloadBlob(blob, `${template.value.fileName(resolvedValues.value)}.docx`);
    toast.success('Word 匯出成功');
  } catch (err: any) {
    console.error('Word 匯出失敗:', err);
    toast.error(`Word 匯出失敗: ${err.message}`);
  } finally {
    exportingWord.value = false;
  }
};
</script>

<style scoped>
.mapping-panel {
  max-height: 48vh;
  overflow-y: auto;
  padding-right: 4px;
}

.preview-scroll {
  border: 1px solid #ddd;
  background: #9e9e9e;
  overflow: auto;
  max-height: 70vh;
  padding: 16px;
}

/* 預覽縮放：A4 794px 寬，縮到容器內 */
.preview-scale {
  transform: scale(0.85);
  transform-origin: top left;
  width: 794px;
}

@media (max-width: 960px) {
  .preview-scale {
    transform: scale(0.45);
  }
}
</style>
