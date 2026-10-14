<template>
  <div class="la-panel">
    <div class="la-panel__tabs">
      <div class="mac-form-seg mac-form-seg--block">
        <button v-for="t in tabs" :key="t.key" type="button" class="mac-form-seg-btn" :class="{ 'is-active': tab === t.key }" @click="tab = t.key">{{ t.label }}</button>
      </div>
    </div>

    <div class="la-panel__body">
      <!-- 記憶 -->
      <template v-if="tab === 'memory'">
        <template v-if="!editing">
          <div class="mac-form-label">
            摘要<span class="mac-spacer" />
            <button class="mac-link-btn" :disabled="refreshing" @click="refresh">{{ refreshing ? '整理中…' : '整理' }}</button>
            <button class="mac-link-btn" @click="startEdit">編輯</button>
          </div>
          <div class="mac-form-group mac-form-pad la-panel__text">{{ conv.summary || '尚未整理' }}</div>
          <div class="mac-form-label">重點</div>
          <div class="mac-form-group">
            <div v-if="!conv.facts?.length" class="mac-form-pad mac-form-empty">尚無</div>
            <div v-for="(f, i) in conv.facts" :key="i" class="mac-form-pad la-panel__fact">{{ f }}</div>
          </div>
          <div v-if="conv.summaryUpdatedAt" class="la-panel__meta">整理到 {{ fullTime(conv.summaryUpdatedAt) }}</div>
        </template>
        <template v-else>
          <div class="mac-form-label">摘要</div>
          <textarea v-model="edit.summary" class="mac-form-textarea" rows="6" />
          <div class="mac-form-label">重點（一行一條）</div>
          <textarea v-model="edit.facts" class="mac-form-textarea" rows="7" />
          <div class="la-panel__actions">
            <button class="mac-btn mac-btn--sm" @click="editing = false">取消</button>
            <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="saving" @click="saveMemory">儲存</button>
          </div>
        </template>
      </template>

      <!-- 客戶 -->
      <template v-else-if="tab === 'customer'">
        <div v-if="canClaim" class="mac-callout mac-callout--warning la-panel__claim">
          <v-icon size="18">mdi-account-question-outline</v-icon>
          <div class="la-panel__grow">尚未指定負責人</div>
          <button class="mac-btn mac-btn--sm mac-btn--primary" :disabled="claiming" @click="claim">認領</button>
        </div>

        <template v-if="projects.length">
          <div class="mac-form-label">建案</div>
          <v-select
            :model-value="conv.projectId"
            :items="projects"
            item-title="name"
            item-value="id"
            placeholder="選擇建案"
            variant="solo"
            flat
            density="compact"
            hide-details
            clearable
            class="mac-vfield"
            :menu-props="{ contentClass: 'mac-menu' }"
            @update:model-value="setProject"
          />

          <div class="mac-form-label">客戶</div>
          <div v-if="conv.customer" class="mac-form-group">
            <div class="mac-form-row">
              <div class="mac-form-row-main">
                <div class="mac-form-row-title">{{ conv.customer.name || '未填姓名' }}</div>
                <div class="mac-form-row-sub">{{ [conv.customer.phone, conv.customer.salesName && `業務 ${conv.customer.salesName}`].filter(Boolean).join('・') }}</div>
              </div>
              <button class="mac-link-btn" :disabled="linking" @click="link(null)">解除</button>
            </div>
          </div>
          <template v-else-if="conv.projectId">
            <div class="la-panel__search">
              <input v-model="q" class="mac-form-input" placeholder="姓名或電話" @keydown.enter.prevent="search" />
              <button class="mac-btn mac-btn--sm" :disabled="searching || !q.trim()" @click="search">搜尋</button>
            </div>
            <div v-if="results" class="mac-form-group la-panel__results">
              <div v-if="!results.length" class="mac-form-pad mac-form-empty">找不到</div>
              <button v-for="c in results" :key="c.id" class="mac-form-row mac-form-link la-panel__result" :disabled="linking" @click="link(c.id)">
                <div class="mac-form-row-main">
                  <div class="mac-form-row-title">{{ c.name || '未填姓名' }}</div>
                  <div class="mac-form-row-sub">{{ [c.phone, c.salesName && `業務 ${c.salesName}`].filter(Boolean).join('・') }}</div>
                </div>
                <v-icon size="16" color="#0071e3">mdi-link-variant</v-icon>
              </button>
            </div>
          </template>
          <div v-else class="mac-form-group mac-form-pad mac-form-empty">先選擇建案</div>
        </template>
        <div v-else class="mac-form-group mac-form-pad mac-form-empty">沒有客資權限</div>
      </template>

      <!-- 成員 -->
      <template v-else>
        <div class="mac-form-label">成員 {{ conv.members?.length || 0 }}</div>
        <div class="mac-form-group">
          <div v-if="!conv.members?.length" class="mac-form-pad mac-form-empty">尚無</div>
          <div v-for="m in conv.members" :key="m.lineId" class="mac-form-row">
            <LineAvatar :src="m.pictureUrl" :size="28" />
            <div class="mac-form-row-main"><div class="mac-form-row-title">{{ m.name }}</div></div>
            <span v-if="m.isMe" class="mac-tag">你</span>
            <span v-else-if="m.isStaff" class="mac-tag la-tag--staff">同仁</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useToast } from 'vue-toastification';
import LineAvatar from './LineAvatar.vue';
import { lineAiCall, errorText, fullTime } from './useLineAi';

const props = defineProps({
  detail: { type: Object, required: true },
});
const emit = defineEmits(['changed', 'memory']);
const toast = useToast();

const conv = computed(() => props.detail.conversation);
const projects = computed(() => props.detail.projects || []);
const canClaim = computed(() => !!props.detail.canClaim);
const tabs = computed(() => [
  { key: 'memory', label: '記憶' },
  { key: 'customer', label: '客戶' },
  ...(conv.value.type === 'user' ? [] : [{ key: 'members', label: '成員' }]),
]);

const tab = ref('memory');
const editing = ref(false);
const saving = ref(false);
const refreshing = ref(false);
const claiming = ref(false);
const linking = ref(false);
const searching = ref(false);
const edit = ref({ summary: '', facts: '' });
const q = ref('');
const results = ref(null);

watch(() => conv.value.id, () => {
  editing.value = false;
  q.value = '';
  results.value = null;
  if (canClaim.value) tab.value = 'customer';
  else if (!tabs.value.some(t => t.key === tab.value)) tab.value = 'memory';
}, { immediate: true });

function startEdit() {
  edit.value = { summary: conv.value.summary || '', facts: (conv.value.facts || []).join('\n') };
  editing.value = true;
}

async function saveMemory() {
  saving.value = true;
  try {
    const facts = edit.value.facts.split('\n').map(s => s.trim()).filter(Boolean);
    await lineAiCall('updateMemory', { conversationId: conv.value.id, summary: edit.value.summary, facts });
    emit('memory', { summary: edit.value.summary.trim(), facts });
    editing.value = false;
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    saving.value = false;
  }
}

async function refresh() {
  refreshing.value = true;
  try {
    const r = await lineAiCall('refreshMemory', { conversationId: conv.value.id });
    emit('memory', { summary: r.summary, facts: r.facts, summaryUpdatedAt: r.summaryUpdatedAt });
    if (!r.updated) toast.info('沒有新訊息');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    refreshing.value = false;
  }
}

async function claim() {
  claiming.value = true;
  try {
    await lineAiCall('claim', { conversationId: conv.value.id });
    toast.success('已認領');
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    claiming.value = false;
  }
}

async function setProject(projectId) {
  linking.value = true;
  try {
    await lineAiCall('linkCustomer', { conversationId: conv.value.id, projectId: projectId || null, customerId: null });
    results.value = null;
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    linking.value = false;
  }
}

async function search() {
  if (!q.value.trim()) return;
  searching.value = true;
  try {
    const r = await lineAiCall('searchCustomers', { projectId: conv.value.projectId, q: q.value.trim() });
    results.value = r.customers || [];
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    searching.value = false;
  }
}

async function link(customerId) {
  linking.value = true;
  try {
    await lineAiCall('linkCustomer', { conversationId: conv.value.id, projectId: conv.value.projectId, customerId });
    results.value = null;
    q.value = '';
    emit('changed');
  } catch (e) {
    toast.error(errorText(e));
  } finally {
    linking.value = false;
  }
}
</script>

<style scoped>
.la-panel { display: flex; flex-direction: column; min-height: 0; height: 100%; background: #f5f5f7; font-size: 13px; color: #1d1d1f; }
.la-panel__tabs { padding: 12px 12px 4px; }
.la-panel__body { flex: 1 1 auto; min-height: 0; overflow-y: auto; padding: 0 12px 16px; }
.la-panel__body > .mac-form-label:first-child { margin-top: 10px; }
.la-panel__text { white-space: pre-wrap; line-height: 1.6; overflow-wrap: anywhere; }
.la-panel__fact { line-height: 1.5; overflow-wrap: anywhere; }
.la-panel__meta { margin: 8px 4px 0; font-size: 12px; color: #8e8e93; }
.la-panel__actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; }
.la-panel__claim { align-items: center; margin-top: 12px; }
.la-panel__grow { flex: 1 1 auto; }
.la-panel__search { display: flex; gap: 6px; }
.la-panel__results { margin-top: 8px; }
.la-panel__result { width: 100%; border: 0; background: #fff; text-align: left; font: inherit; color: inherit; }
.la-tag--staff { --mac-tag-bg: rgba(0, 113, 227, 0.1); --mac-tag-color: #0058b0; }
.la-panel .mac-form-row-sub { white-space: normal; overflow: visible; overflow-wrap: anywhere; }
.la-panel .mac-form-row-title { overflow-wrap: anywhere; }
</style>
