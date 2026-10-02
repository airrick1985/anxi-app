<template>
  <v-dialog :model-value="modelValue" max-width="680" persistent scrollable>
    <!-- macOS sheet：淡灰標題列＋分段切換＋分組設定列＋淡灰底部按鈕列 -->
    <v-card v-if="form" class="mac-sheet">
      <div class="mac-sheet-head qsd-head">
        <v-icon size="18">mdi-cog-outline</v-icon>
        <span>報價單設定</span>
        <button type="button" class="mac-sheet-close" aria-label="關閉" @click="emit('update:modelValue', false)">
          <v-icon size="18">mdi-close</v-icon>
        </button>
      </div>
      <div class="qsd-segbar">
        <div class="mac-form-seg qsd-seg" role="tablist">
          <button
            v-for="t in TABS"
            :key="t.value"
            type="button"
            role="tab"
            class="mac-form-seg-btn qsd-seg-btn"
            :class="{ 'is-active': tab === t.value }"
            :aria-selected="tab === t.value"
            @click="tab = t.value"
          >{{ t.title }}</button>
        </div>
      </div>

      <v-card-text class="qsd-body mac-form">
        <!-- 基本 -->
        <template v-if="tab === 'basic'">
          <div class="mac-form-label">公司</div>
          <div class="mac-form-group">
            <label class="mac-form-row"><span class="mac-form-row-label">公司名稱</span><input v-model="form.companyName" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">英文名稱</span><input v-model="form.companyNameEn" class="mac-form-input" /></label>
          </div>

          <div class="mac-form-label">單位資訊</div>
          <div class="mac-form-group">
            <label class="mac-form-row"><span class="mac-form-row-label">聯絡人</span><input v-model="form.from.contactName" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">電話</span><input v-model="form.from.phone" class="mac-form-input" /></label>
            <label class="mac-form-row"><span class="mac-form-row-label">統編</span><input v-model="form.from.taxId" class="mac-form-input" /></label>
          </div>

          <div class="mac-form-label">報價</div>
          <div class="mac-form-group">
            <label class="mac-form-row">
              <span class="mac-form-row-label">報價有效天數</span>
              <span class="mac-form-input mac-form-unit">
                <input v-model.number="form.validDays" type="number" min="0" />
                <span>天</span>
              </span>
            </label>
            <label class="mac-form-row">
              <span class="mac-form-row-label">營業稅</span>
              <span class="mac-form-input mac-form-unit">
                <input v-model.number="taxPercent" type="number" min="0" />
                <span>%</span>
              </span>
            </label>
          </div>

          <div class="mac-form-label">大小章</div>
          <div class="mac-form-group mac-form-pad">
            <AttachmentField v-model="form.seals" path-prefix="subscriptionSettings/seals" project-id="subscription" accept="image/*" label="上傳" mac />
          </div>

          <div class="mac-form-label">
            預設品項
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" @click="form.defaultItems.push({ name: '', desc: '', amount: 0 })">
              <v-icon size="15">mdi-plus</v-icon><span>新增</span>
            </button>
          </div>
          <div class="mac-form-group">
            <div v-if="form.defaultItems.length === 0" class="mac-form-row mac-form-empty">尚無品項</div>
            <div v-for="(item, i) in form.defaultItems" :key="i" class="mac-form-row qsd-item-row">
              <input v-model="item.name" class="mac-form-input" placeholder="品名" />
              <input v-model="item.desc" class="mac-form-input" placeholder="說明" />
              <span class="mac-form-input mac-form-unit">
                <span>$</span>
                <input v-model.number="item.amount" type="number" placeholder="金額" />
              </span>
              <button type="button" class="mac-icon-btn mac-icon-btn--danger" aria-label="刪除" @click="form.defaultItems.splice(i, 1)">
                <v-icon size="16">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>

          <div class="mac-form-label">預設備註說明</div>
          <div class="mac-form-group mac-form-pad">
            <textarea v-model="form.defaultNotes" class="mac-form-textarea" rows="4"></textarea>
          </div>
        </template>

        <!-- 範本 -->
        <template v-else-if="tab === 'templates'">
          <div class="mac-form-label">
            備註範本
            <span class="mac-spacer"></span>
            <button type="button" class="mac-btn mac-btn--sm" @click="openNoteTemplate(-1)">
              <v-icon size="15">mdi-plus</v-icon><span>新增</span>
            </button>
          </div>
          <div class="mac-form-group">
            <div v-if="form.noteTemplates.length === 0" class="mac-form-row mac-form-empty">尚無範本</div>
            <div v-for="(t, i) in form.noteTemplates" :key="i" class="mac-form-row mac-form-link" @click="openNoteTemplate(i)">
              <div class="mac-form-row-main">
                <div class="mac-form-row-title">{{ t.name }}</div>
                <div class="mac-form-row-sub">{{ t.content.split('\n')[0] }}</div>
              </div>
              <button type="button" class="mac-icon-btn mac-icon-btn--danger" aria-label="刪除" @click.stop="form.noteTemplates.splice(i, 1)">
                <v-icon size="16">mdi-trash-can-outline</v-icon>
              </button>
              <v-icon size="18" class="qsd-chevron">mdi-chevron-right</v-icon>
            </div>
          </div>

          <div class="mac-form-label">付款條件範本</div>
          <div class="mac-form-group">
            <div v-if="form.planTemplates.length === 0" class="mac-form-row mac-form-empty">於報價單「存範本」建立</div>
            <div v-for="(t, i) in form.planTemplates" :key="i" class="mac-form-row">
              <div class="mac-form-row-main">
                <div class="mac-form-row-title">{{ t.name }}</div>
                <div class="mac-form-row-sub">{{ planSummary(t.plan) }}</div>
              </div>
              <button type="button" class="mac-icon-btn mac-icon-btn--danger" aria-label="刪除" @click="form.planTemplates.splice(i, 1)">
                <v-icon size="16">mdi-trash-can-outline</v-icon>
              </button>
            </div>
          </div>
        </template>

        <!-- 圖片庫 (即時存檔) -->
        <template v-else>
          <div class="mac-form-group mac-form-pad">
            <QuoteImageLibrary mac />
          </div>
        </template>
      </v-card-text>

      <div class="mac-sheet-foot">
        <button type="button" class="mac-btn" @click="emit('update:modelValue', false)">取消</button>
        <span class="mac-spacer"></span>
        <button type="button" class="mac-btn mac-btn--primary" :disabled="saving" @click="save">
          <v-progress-circular v-if="saving" indeterminate size="14" width="2"></v-progress-circular>
          <span>儲存</span>
        </button>
      </div>
    </v-card>

    <v-dialog v-model="noteDialog.open" max-width="600" scrollable>
      <v-card class="mac-sheet">
        <div class="mac-sheet-head qsd-head">
          <v-icon size="18">mdi-text-box-outline</v-icon>
          <span>{{ noteDialog.index < 0 ? '新增備註範本' : '編輯備註範本' }}</span>
          <button type="button" class="mac-sheet-close" aria-label="關閉" @click="noteDialog.open = false">
            <v-icon size="18">mdi-close</v-icon>
          </button>
        </div>
        <v-card-text class="qsd-body mac-form">
          <div class="mac-form-group">
            <label class="mac-form-row"><span class="mac-form-row-label">範本名稱</span><input v-model="noteDialog.name" class="mac-form-input" /></label>
          </div>
          <div class="mac-form-label">內容</div>
          <div class="mac-form-group mac-form-pad">
            <textarea v-model="noteDialog.content" class="mac-form-textarea" rows="9"></textarea>
          </div>
        </v-card-text>
        <div class="mac-sheet-foot">
          <button type="button" class="mac-btn" @click="noteDialog.open = false">取消</button>
          <span class="mac-spacer"></span>
          <button type="button" class="mac-btn mac-btn--primary" :disabled="!noteDialog.name.trim()" @click="saveNoteTemplate">確定</button>
        </div>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AttachmentField from './AttachmentField.vue';
import QuoteImageLibrary from './QuoteImageLibrary.vue';
import { saveSubscriptionQuoteSettings } from '@/api.js';
import { planText } from '@/utils/subscriptionPipeline';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  settings: { type: Object, required: true },
  adminKey: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue', 'saved']);

const TABS = [
  { value: 'basic', title: '基本' },
  { value: 'templates', title: '範本' },
  { value: 'images', title: '圖片庫' },
];

const form = ref(null);
const saving = ref(false);
const tab = ref('basic');
const noteDialog = ref({ open: false, index: -1, name: '', content: '' });

watch(() => props.modelValue, (open) => {
  if (!open) return;
  form.value = JSON.parse(JSON.stringify(props.settings));
  tab.value = 'basic';
}, { immediate: true });

function openNoteTemplate(index) {
  const t = index >= 0 ? form.value.noteTemplates[index] : { name: '', content: '' };
  noteDialog.value = { open: true, index, name: t.name, content: t.content };
}

// 範本於按「儲存」時一併寫入
function saveNoteTemplate() {
  const { index, name, content } = noteDialog.value;
  const entry = { name: name.trim(), content };
  if (index >= 0) form.value.noteTemplates.splice(index, 1, entry);
  else form.value.noteTemplates.push(entry);
  noteDialog.value.open = false;
}

const taxPercent = computed({
  get: () => Math.round((form.value?.taxRate ?? 0.05) * 100),
  set: (v) => { form.value.taxRate = (Number(v) || 0) / 100; },
});

function planSummary(plan) {
  return (plan || [])
    .map(p => `${p.label} ${p.mode === 'percent' ? `${p.value}%` : `$${Number(p.value).toLocaleString()}`} ${planText(p)}`)
    .join('、');
}

async function save() {
  saving.value = true;
  try {
    const data = JSON.parse(JSON.stringify(form.value));
    data.defaultItems = data.defaultItems.filter(i => i.name?.trim());
    await saveSubscriptionQuoteSettings(data, props.adminKey);
    emit('saved', data);
    emit('update:modelValue', false);
  } catch (e) {
    alert('儲存失敗：' + e.message);
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
/* 共用樣式見 src/styles/macosUi.css（mac-sheet／mac-form-*）；此處只放本視窗特有的版面 */
.qsd-segbar {
  display: flex;
  justify-content: center;
  padding: 10px 16px;
  background: #f6f6f8;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
.qsd-seg-btn {
  min-width: 88px;
  height: 26px;
  padding: 0 14px;
}
.qsd-body {
  padding: 4px 18px 18px !important;
  min-height: 440px;
}
.qsd-body > .mac-form-group:first-child {
  margin-top: 16px;
}
.qsd-chevron {
  color: #b0b0b5 !important;
}
.qsd-item-row {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1.6fr) 110px 26px;
}
.qsd-item-row > .mac-form-input,
.qsd-item-row > .mac-form-unit {
  max-width: none;
  margin: 0;
}

@media (max-width: 600px) {
  /* 避開全站左上角漢堡鈕 */
  .qsd-head {
    padding-left: 46px;
  }
  .qsd-body {
    padding: 4px 12px 14px !important;
  }
  .qsd-seg {
    display: flex;
    width: 100%;
  }
  .qsd-seg-btn {
    min-width: 0;
    flex: 1;
  }
  .qsd-item-row {
    grid-template-columns: minmax(0, 1fr) 96px 26px;
  }
  .qsd-item-row > .mac-form-input:nth-child(2) {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
