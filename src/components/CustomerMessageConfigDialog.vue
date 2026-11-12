<template>
  <!-- 客戶回傳功能編輯視窗（macOS 風格）：基本設定／表單欄位兩頁，右側即時預覽客戶看到的畫面。
       設定物件的欄位與舊版相同，存檔格式不變。 -->
  <v-dialog
    :model-value="modelValue"
    :fullscreen="isMobile"
    :max-width="isMobile ? undefined : 1220"
    :scrim="true"
    @update:model-value="v => { if (!v) requestClose(); }"
  >
    <v-card class="mac-sheet cmd" :class="{ 'cmd--full': isMobile }">
      <div class="mac-sheet-head cmd-head">
        <v-icon size="18">mdi-message-reply-text-outline</v-icon>
        <span class="cmd-title">{{ isNew ? '新增' : '編輯' }}客戶回傳功能</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="requestClose">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>

      <div class="cmd-tabs">
        <div class="mac-form-seg" :class="{ 'mac-form-seg--block': isMobile }" role="tablist">
          <button
            v-for="t in tabs"
            :key="t.value"
            type="button"
            role="tab"
            class="mac-form-seg-btn"
            :class="{ 'is-active': tab === t.value }"
            :aria-selected="tab === t.value"
            @click="tab = t.value"
          >
            <span>{{ t.title }}</span>
            <span v-if="t.value === 'fields' && fieldCount" class="cmd-tab-count">{{ fieldCount }}</span>
            <span v-if="t.value === 'settings' && showErrors && settingsInvalid" class="cmd-tab-dot" aria-label="有未填項目"></span>
          </button>
        </div>
      </div>

      <div class="cmd-body">
        <div v-show="wide || tab !== 'preview'" class="cmd-main">
          <!-- 基本設定 -->
          <div v-show="tab === 'settings'" class="cmd-settings mac-form">
            <div class="cmd-settings-inner">
              <div class="mac-form-label">名稱</div>
              <div class="mac-form-group">
                <label class="mac-form-row">
                  <span class="mac-form-row-label">功能名稱</span>
                  <input
                    ref="nameInput"
                    v-model="draft.functionName"
                    type="text"
                    class="mac-form-input"
                    :class="{ 'is-error': showErrors && !draft.functionName }"
                    placeholder="例：自覓銀行回傳"
                  />
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-label">按鈕文字</span>
                  <input
                    v-model="draft.buttonText"
                    type="text"
                    class="mac-form-input"
                    :class="{ 'is-error': showErrors && !draft.buttonText }"
                    placeholder="例：回傳自覓銀行資訊"
                  />
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-label">視窗標題</span>
                  <input v-model="draft.dialogTitle" type="text" class="mac-form-input" placeholder="例：填寫銀行資訊" />
                </label>
              </div>
              <div v-if="showErrors && settingsInvalid" class="cmd-error">請填功能名稱與按鈕文字</div>

              <div class="mac-form-label">客戶要填</div>
              <div class="mac-form-group">
                <label class="mac-form-row">
                  <span class="mac-form-row-main"><span class="mac-form-row-title">棟別</span><span class="mac-tag cmd-must">必要</span></span>
                  <input v-model="draft.enableBuildingSelect" type="checkbox" class="mac-switch" />
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-main"><span class="mac-form-row-title">戶別</span><span class="mac-tag cmd-must">必要</span></span>
                  <input v-model="draft.enableUnitSelect" type="checkbox" class="mac-switch" />
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-main"><span class="mac-form-row-title">身分證(驗證碼)</span></span>
                  <input v-model="draft.enableIdVerification" type="checkbox" class="mac-switch" />
                </label>
                <label class="mac-form-row">
                  <span class="mac-form-row-main">
                    <span class="mac-form-row-title">附件上傳</span>
                    <span class="cmd-row-sub">最多 10 個、單檔 30MB</span>
                  </span>
                  <input v-model="draft.enableFileUpload" type="checkbox" class="mac-switch" />
                </label>
              </div>
              <div v-if="!draft.enableBuildingSelect || !draft.enableUnitSelect" class="mac-callout mac-callout--warning cmd-callout">
                <v-icon size="16">mdi-alert-outline</v-icon>
                <span>關閉棟別或戶別，客戶會無法送出。</span>
              </div>
              <div v-else-if="!draft.enableIdVerification" class="mac-callout mac-callout--warning cmd-callout">
                <v-icon size="16">mdi-alert-outline</v-icon>
                <span>未驗證身分時，任何人都能替任一戶回傳。</span>
              </div>
            </div>
          </div>

          <!-- 表單欄位 -->
          <DynamicFieldEditor
            v-show="tab === 'fields'"
            v-model:fields="draft.customFields"
            fill
          />
        </div>

        <!-- 預覽：寬螢幕固定在右側，窄螢幕是第三個分頁 -->
        <aside v-show="wide || tab === 'preview'" class="cmd-preview" :class="{ 'cmd-preview--side': wide }">
          <div class="cmd-preview-scroll">
            <div class="cmd-preview-label">首頁按鈕</div>
            <div class="cmd-preview-btn">
              <v-btn block color="error" variant="elevated" class="py-4 font-weight-bold rounded-lg text-white h-auto cmd-preview-btn-inner" prepend-icon="mdi-message-alert-outline">
                {{ draft.buttonText || '按鈕文字' }}
              </v-btn>
            </div>

            <div class="cmd-preview-label">客戶填寫畫面</div>
            <v-card class="cmd-preview-card" elevation="3">
              <v-card-title class="bg-primary text-white d-flex justify-space-between align-center cmd-preview-title">
                <span>{{ draft.dialogTitle || '填寫資訊' }}</span>
                <v-icon size="20">mdi-close</v-icon>
              </v-card-title>
              <v-card-text class="pa-4">
                <v-row v-if="draft.enableBuildingSelect">
                  <v-col cols="12" sm="6">
                    <v-select label="棟別" :items="[]" variant="outlined" density="comfortable" hide-details readonly></v-select>
                  </v-col>
                  <v-col v-if="draft.enableUnitSelect" cols="12" sm="6">
                    <v-select label="戶別" :items="[]" variant="outlined" density="comfortable" hide-details readonly></v-select>
                  </v-col>
                </v-row>
                <v-text-field
                  v-if="draft.enableIdVerification"
                  label="身分證(驗證碼)"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  readonly
                  class="mt-4 mb-2"
                ></v-text-field>
                <v-divider class="my-3"></v-divider>
                <DynamicFormRenderer
                  v-if="draft.customFields && draft.customFields.length > 0"
                  :fields="draft.customFields"
                  v-model="previewData"
                />
                <div v-if="draft.enableFileUpload" class="mt-4">
                  <p class="text-subtitle-2 font-weight-bold mb-1">附件上傳 (最多10個，單檔30MB)</p>
                  <v-file-input label="選擇檔案 (圖片或PDF)" variant="outlined" density="comfortable" hide-details disabled></v-file-input>
                </div>
              </v-card-text>
              <v-card-actions class="pa-4 border-t">
                <v-spacer></v-spacer>
                <v-btn variant="text" tabindex="-1">取消</v-btn>
                <v-btn color="primary" variant="elevated" tabindex="-1">確認送出</v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </aside>
      </div>

      <div class="mac-sheet-foot">
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn" :class="{ 'mac-btn--lg': isMobile }" @click="requestClose">取消</button>
        <button type="button" class="mac-btn mac-btn--primary" :class="{ 'mac-btn--lg': isMobile }" @click="save">儲存</button>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useDisplay } from 'vuetify';
import DynamicFieldEditor from '@/components/DynamicFieldEditor.vue';
import DynamicFormRenderer from '@/components/DynamicFormRenderer.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  // 要編輯的設定（新增時由父層先給預設值）；本元件只改自己的副本，按「儲存」才交回
  config: { type: Object, default: null },
  isNew: { type: Boolean, default: false },
});

const emit = defineEmits(['update:modelValue', 'save']);

const { width } = useDisplay();
const isMobile = computed(() => width.value < 760);
const wide = computed(() => width.value >= 1180);

const emptyConfig = () => ({
  id: '',
  functionName: '',
  buttonText: '',
  dialogTitle: '',
  enableBuildingSelect: true,
  enableUnitSelect: true,
  enableIdVerification: false,
  enableFileUpload: false,
  customFields: [],
});

const draft = ref(emptyConfig());
const tab = ref('settings');
const showErrors = ref(false);
const previewData = ref({});
const nameInput = ref(null);
let snapshot = '';

const tabs = computed(() => {
  const list = [
    { value: 'settings', title: '基本設定' },
    { value: 'fields', title: '表單欄位' },
  ];
  if (!wide.value) list.push({ value: 'preview', title: '預覽' });
  return list;
});

const fieldCount = computed(() => (Array.isArray(draft.value.customFields) ? draft.value.customFields.length : 0));
const settingsInvalid = computed(() => !draft.value.functionName || !draft.value.buttonText);

watch(() => props.modelValue, (open) => {
  if (!open) return;
  // 深拷貝：保留設定物件上所有既有屬性（含本視窗沒有顯示的），只補上缺少的 customFields
  const copy = JSON.parse(JSON.stringify(props.config || emptyConfig()));
  if (!Array.isArray(copy.customFields)) copy.customFields = [];
  draft.value = copy;
  snapshot = JSON.stringify(copy);
  previewData.value = {};
  showErrors.value = false;
  // 新增從基本設定開始；編輯既有功能多半是改欄位，直接進表單欄位
  tab.value = props.isNew ? 'settings' : 'fields';
  if (props.isNew && !isMobile.value) nextTick(() => setTimeout(() => nameInput.value?.focus(), 80));
}, { immediate: true });

watch(wide, (isWide) => {
  if (isWide && tab.value === 'preview') tab.value = 'fields';
});

const isDirty = () => JSON.stringify(draft.value) !== snapshot;

const requestClose = () => {
  if (isDirty() && !confirm('尚未儲存，確定要關閉嗎？')) return;
  emit('update:modelValue', false);
};

const save = () => {
  if (settingsInvalid.value) {
    showErrors.value = true;
    tab.value = 'settings';
    return;
  }
  emit('save', draft.value);
};
</script>

<style scoped>
/* Vuetify 會給 dialog 內的 v-card 設 flex: 1 1 100%，高度會變成跟著內容走；改成固定高度，切換分頁時視窗不跳動 */
.cmd { display: flex; flex-direction: column; flex: 0 0 auto !important; height: min(88vh, 860px); }
.cmd--full { height: 100%; border-radius: 0 !important; }
.cmd-title { min-width: 0; overflow-wrap: anywhere; }
/* 全螢幕時避開左上角全站漢堡鈕 */
.cmd--full .cmd-head { min-height: 56px; padding-left: 60px; }

.cmd-tabs {
  display: flex;
  justify-content: center;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.cmd-tabs .mac-form-seg-btn { min-width: 96px; height: 28px; }
.cmd--full .cmd-tabs .mac-form-seg-btn { min-width: 0; height: 32px; }
.cmd-tab-count {
  min-width: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: rgba(0, 0, 0, 0.1);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
}
.cmd-tab-dot { width: 7px; height: 7px; border-radius: 50%; background: #d62d20; }

.cmd-body { display: flex; flex: 1 1 auto; min-height: 0; }
.cmd-main { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; min-height: 0; }
.cmd-settings { flex: 1 1 auto; min-height: 0; overflow-y: auto; }
.cmd-settings-inner { max-width: 560px; margin: 0 auto; padding: 4px 16px 24px; }
.cmd-settings .mac-form-row { flex-wrap: nowrap; }
.cmd-settings .mac-form-row-label { width: 76px; }
.cmd-settings .mac-form-row > .mac-form-input { flex: 1 1 0; max-width: none; margin-left: 0; height: 30px; }
.cmd-settings .mac-form-input.is-error { border-color: #d62d20; box-shadow: 0 0 0 3px rgba(214, 45, 32, 0.12); }
.cmd-settings .mac-form-row-main { display: flex; align-items: center; flex-wrap: wrap; gap: 2px 8px; }
.cmd-must { font-weight: 500; }
.cmd-row-sub { color: #6e6e73; font-size: 12px; }
.cmd-error { margin: 6px 4px 0; color: #d62d20; font-size: 12px; }
.cmd-callout { margin-top: 12px; }

/* 預覽 */
.cmd-preview { display: flex; flex-direction: column; flex: 1 1 auto; min-width: 0; min-height: 0; background: #e9e9ed; }
.cmd-preview--side { flex: 0 0 372px; border-left: 1px solid rgba(0, 0, 0, 0.08); }
.cmd-preview-scroll { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 4px 16px 24px; }
.cmd-preview-label { margin: 12px 4px 6px; color: #6e6e73; font-size: 11.5px; font-weight: 600; letter-spacing: 0.02em; }
.cmd-preview-btn { max-width: 440px; margin: 0 auto; pointer-events: none; }
.cmd-preview-btn-inner { white-space: normal; }
.cmd-preview-card { max-width: 440px; margin: 0 auto; border-radius: 10px; }
.cmd-preview-title { font-size: 1.1rem; white-space: normal; overflow-wrap: anywhere; }

@media (max-width: 759.98px) {
  .cmd-settings .mac-form-input { font-size: 16px; }
  .cmd-settings .mac-form-row > .mac-form-input { height: 36px; }
  .cmd-settings-inner { padding: 0 12px 24px; }
}
</style>
