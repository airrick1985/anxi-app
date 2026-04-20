<template>
  <v-dialog v-model="dialogOpen" max-width="640" persistent>
    <v-card>
      <v-card-title
        class="text-white d-flex align-center"
        :style="{ background: style.color }"
      >
        <v-icon class="mr-2">mdi-bell-ring-outline</v-icon>
        銷控通知
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- 狀態摘要 -->
        <div class="mb-3">
          <div class="text-subtitle-2 text-grey-darken-2">{{ projectName }} {{ unitId }}</div>
          <div class="d-flex align-center mt-1" style="gap: 8px;">
            <span class="text-body-2 text-grey-darken-1">狀態變更：</span>
            <span class="text-body-2">{{ oldStatus || '（無）' }}</span>
            <v-icon size="small">mdi-arrow-right</v-icon>
            <span class="text-body-1 font-weight-bold" :style="{ color: style.color }">
              {{ newStatus || '（已清空）' }}
            </span>
          </div>
        </div>

        <!-- 加註訊息（可編輯） -->
        <v-text-field
          v-model="customTag"
          :prefix="style.emoji"
          label="加註訊息"
          placeholder="（不顯示加註）"
          variant="outlined"
          density="compact"
          hide-details
          class="mb-3"
          :style="{ '--tag-color': style.color }"
          color="primary"
        />

        <!-- 備註（可選） -->
        <v-textarea
          v-model="remark"
          label="備註（選填，會額外附加到通知訊息中）"
          placeholder="例如：客戶今早完成簽約，請業務助理協助後續流程"
          variant="outlined"
          density="compact"
          rows="2"
          auto-grow
          hide-details
          class="mb-3"
        />

        <v-divider class="my-3" />

        <!-- 候選名單 -->
        <div v-if="visibleRecipients.length === 0" class="text-center text-grey py-6">
          無符合「銷控系統」或「報價系統」權限的可通知人員
        </div>

        <div v-else>
          <div class="d-flex align-center mb-2" style="gap: 12px;">
            <v-checkbox
              :model-value="allSelected"
              :indeterminate="someSelected && !allSelected"
              hide-details density="compact"
              label="全選人員"
              @update:model-value="toggleAll"
            />
            <v-checkbox
              :model-value="allLine"
              :indeterminate="someLine && !allLine"
              :disabled="!anyLineAvailable"
              hide-details density="compact"
              label="LINE 全選"
              @update:model-value="toggleAllChannel('line', $event)"
            />
            <v-checkbox
              :model-value="allEmail"
              :indeterminate="someEmail && !allEmail"
              :disabled="!anyEmailAvailable"
              hide-details density="compact"
              label="Email 全選"
              @update:model-value="toggleAllChannel('email', $event)"
            />
          </div>

          <v-divider class="mb-2" />

          <div class="recipient-list">
            <div
              v-for="r in visibleRecipients" :key="r.userKey"
              class="d-flex align-center recipient-row py-2"
            >
              <v-checkbox
                v-model="selected[r.userKey].selected"
                hide-details density="compact"
                @update:model-value="onRowToggle(r)"
              />
              <div class="flex-grow-1">
                <div class="text-body-2 font-weight-medium">{{ r.name }}</div>
                <div class="text-caption text-grey">{{ r.userKey }}</div>
              </div>
              <v-checkbox
                v-model="selected[r.userKey].channels.line"
                :disabled="!r.hasLine || !selected[r.userKey].selected"
                hide-details density="compact"
                label="LINE"
                class="mr-2"
              />
              <v-checkbox
                v-model="selected[r.userKey].channels.email"
                :disabled="!r.hasEmail || !selected[r.userKey].selected"
                hide-details density="compact"
                label="Email"
              />
            </div>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-4">
        <v-spacer />
        <v-btn variant="text" :disabled="sending" @click="onSkip">本次不通知</v-btn>
        <v-btn
          color="primary" variant="flat"
          :disabled="sendCount === 0 || sending"
          :loading="sending"
          @click="onSend"
        >
          發送通知 ({{ sendCount }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { STATUS_STYLE, classifySalesStatus } from '@/utils/salesStatusGroups';
import { sendSalesStatusNotification, logSalesStatusNotification } from '@/api';

const props = defineProps({
  show: { type: Boolean, default: false },
  projectId: { type: String, required: true },
  projectName: { type: String, default: '' },
  unitId: { type: String, required: true },
  oldStatus: { type: String, default: null },
  newStatus: { type: String, default: null },
  triggerType: { type: String, default: 'update' }, // 'update' | 'cancel'
  operatorName: { type: String, default: '' },
  recipients: { type: Array, default: () => [] }, // [{ userKey, name, email, hasLine, hasEmail }]
});

const emit = defineEmits(['update:show', 'finished']);

// 系統管理員帳號，不顯示於通知候選名單（與後端 EXCLUDED_USER_KEYS 一致）
const EXCLUDED_USER_KEYS = new Set(['60763998']);

const visibleRecipients = computed(() =>
  (props.recipients || []).filter(r => r && !EXCLUDED_USER_KEYS.has(r.userKey))
);

const dialogOpen = computed({
  get: () => props.show,
  set: (v) => emit('update:show', v),
});

const sending = ref(false);
const selected = ref({}); // { [userKey]: { selected: bool, channels: { line: bool, email: bool } } }
const customTag = ref('');
const remark = ref('');

const style = computed(() => STATUS_STYLE[classifySalesStatus(props.newStatus)]);

function buildDefaultSelection() {
  const map = {};
  for (const r of visibleRecipients.value) {
    map[r.userKey] = {
      selected: true,
      channels: {
        line: !!r.hasLine,
        email: !!r.hasEmail,
      },
    };
  }
  selected.value = map;
}

function resetEditableFields() {
  customTag.value = style.value?.tag || '';
  remark.value = '';
}

watch(() => [props.show, props.recipients], () => {
  if (props.show) {
    buildDefaultSelection();
    resetEditableFields();
  }
}, { immediate: true });

const anyLineAvailable = computed(() => visibleRecipients.value.some(r => r.hasLine));
const anyEmailAvailable = computed(() => visibleRecipients.value.some(r => r.hasEmail));

const allSelected = computed(() =>
  visibleRecipients.value.length > 0 && visibleRecipients.value.every(r => selected.value[r.userKey]?.selected)
);
const someSelected = computed(() =>
  visibleRecipients.value.some(r => selected.value[r.userKey]?.selected)
);

const allLine = computed(() => {
  const elig = visibleRecipients.value.filter(r => r.hasLine);
  return elig.length > 0 && elig.every(r =>
    selected.value[r.userKey]?.selected && selected.value[r.userKey]?.channels.line
  );
});
const someLine = computed(() =>
  visibleRecipients.value.some(r => r.hasLine && selected.value[r.userKey]?.channels.line)
);
const allEmail = computed(() => {
  const elig = visibleRecipients.value.filter(r => r.hasEmail);
  return elig.length > 0 && elig.every(r =>
    selected.value[r.userKey]?.selected && selected.value[r.userKey]?.channels.email
  );
});
const someEmail = computed(() =>
  visibleRecipients.value.some(r => r.hasEmail && selected.value[r.userKey]?.channels.email)
);

const sendCount = computed(() => {
  let n = 0;
  for (const r of visibleRecipients.value) {
    const s = selected.value[r.userKey];
    if (!s || !s.selected) continue;
    if ((s.channels.line && r.hasLine) || (s.channels.email && r.hasEmail)) n += 1;
  }
  return n;
});

function toggleAll(v) {
  for (const r of visibleRecipients.value) {
    if (selected.value[r.userKey]) selected.value[r.userKey].selected = !!v;
  }
}

function toggleAllChannel(channel, v) {
  for (const r of visibleRecipients.value) {
    if (channel === 'line' && !r.hasLine) continue;
    if (channel === 'email' && !r.hasEmail) continue;
    if (selected.value[r.userKey]) selected.value[r.userKey].channels[channel] = !!v;
  }
}

function onRowToggle(r) {
  const s = selected.value[r.userKey];
  if (!s) return;
  // 取消選人時不動 channel；勾回來時依候選通道恢復
  if (s.selected) {
    if (r.hasLine) s.channels.line = true;
    if (r.hasEmail) s.channels.email = true;
  }
}

function buildPayload() {
  const recipients = [];
  for (const r of visibleRecipients.value) {
    const s = selected.value[r.userKey];
    if (!s || !s.selected) continue;
    const channels = [];
    if (s.channels.line && r.hasLine) channels.push('line');
    if (s.channels.email && r.hasEmail) channels.push('email');
    if (channels.length > 0) recipients.push({ userKey: r.userKey, channels });
  }
  return {
    projectId: props.projectId,
    projectName: props.projectName,
    unitId: props.unitId,
    oldStatus: props.oldStatus,
    newStatus: props.newStatus,
    operatorName: props.operatorName,
    triggerType: props.triggerType,
    recipients,
    customTag: (customTag.value || '').trim(),
    remark: (remark.value || '').trim(),
  };
}

async function onSend() {
  if (sendCount.value === 0) return;
  sending.value = true;
  try {
    const result = await sendSalesStatusNotification(buildPayload());
    emit('finished', { action: 'sent', result });
  } finally {
    sending.value = false;
    emit('update:show', false);
  }
}

async function onSkip() {
  try {
    await logSalesStatusNotification({
      projectId: props.projectId,
      unitId: props.unitId,
      oldStatus: props.oldStatus,
      newStatus: props.newStatus,
      operatorName: props.operatorName,
      triggerType: props.triggerType,
      reason: 'skipped',
    });
  } finally {
    emit('finished', { action: 'skipped' });
    emit('update:show', false);
  }
}
</script>

<style scoped>
.recipient-list { max-height: 320px; overflow-y: auto; }
.recipient-row { border-bottom: 1px dashed #eee; gap: 8px; }
.recipient-row:last-child { border-bottom: none; }
</style>
