<template>
  <div>
    <v-card variant="outlined" class="pa-3 mb-4">
      <v-chip-group v-model="form.type" mandatory selected-class="text-primary" class="mb-1">
        <v-chip v-for="t in TYPES" :key="t" :value="t" size="small" filter variant="outlined">{{ t }}</v-chip>
      </v-chip-group>
      <v-textarea
        v-model="form.content"
        label="跟進內容"
        rows="2"
        auto-grow
        variant="outlined"
        density="compact"
        hide-details
      ></v-textarea>
      <div class="d-flex flex-wrap align-center ga-3 mt-3">
        <v-text-field
          v-model="form.nextFollowUpDate"
          type="date"
          label="下次跟進"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          style="max-width: 190px;"
        ></v-text-field>
        <AttachmentField v-model="form.attachments" :path-prefix="`${pathPrefix}/followups`" :project-id="subscription.projectId" />
        <v-spacer></v-spacer>
        <v-btn color="primary" :loading="saving" :disabled="!form.content.trim()" @click="add">新增</v-btn>
      </div>
    </v-card>

    <div v-if="loading" class="text-center py-6">
      <v-progress-circular indeterminate size="28" color="primary"></v-progress-circular>
    </div>
    <div v-else-if="list.length === 0" class="text-center text-grey py-6">尚無跟進紀錄</div>

    <v-timeline v-else side="end" density="compact" align="start" truncate-line="both">
      <v-timeline-item
        v-for="f in list"
        :key="f.id"
        :dot-color="f.type === '系統' ? 'grey-lighten-1' : 'primary'"
        :icon="ICONS[f.type] || ICONS['其他']"
        size="small"
        fill-dot
      >
        <div class="d-flex align-center flex-wrap ga-2">
          <span class="text-body-2 font-weight-bold">{{ f.type }}</span>
          <span v-if="f.cycleNo" class="text-caption text-grey">第{{ f.cycleNo }}輪</span>
          <span class="text-caption text-grey">{{ f.createdByName || f.createdBy }} · {{ formatTime(f.createdAt) }}</span>
          <v-chip v-if="f.nextFollowUpDate" size="x-small" color="orange" label>下次 {{ f.nextFollowUpDate }}</v-chip>
          <v-spacer></v-spacer>
          <v-btn
            v-if="f.type !== '系統'"
            icon="mdi-delete-outline"
            size="x-small"
            variant="text"
            color="grey"
            @click="remove(f)"
          ></v-btn>
        </div>
        <div class="text-body-2 followup-content" :class="{ 'text-grey-darken-1': f.type === '系統' }">{{ f.content }}</div>
        <AttachmentField
          v-if="f.attachments?.length"
          :model-value="f.attachments"
          :path-prefix="pathPrefix"
          readonly
          class="mt-1"
        />
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import AttachmentField from './AttachmentField.vue';
import { fetchSubscriptionFollowups, addSubscriptionFollowup, deleteSubscriptionFollowup } from '@/api.js';

const props = defineProps({
  subscription: { type: Object, required: true },
  cycleNo: { type: Number, default: null },
  user: { type: Object, default: () => ({}) },
  refreshKey: { type: Number, default: 0 },
});
const emit = defineEmits(['changed']);

const TYPES = ['電話', '拜訪', 'Email', 'LINE', '其他'];
const ICONS = {
  電話: 'mdi-phone',
  拜訪: 'mdi-account-tie',
  Email: 'mdi-email-outline',
  LINE: 'mdi-chat-outline',
  其他: 'mdi-note-text-outline',
  系統: 'mdi-cog-outline',
};

const list = ref([]);
const loading = ref(false);
const saving = ref(false);
const pathPrefix = computed(() => `subscriptions/${props.subscription.projectId || 'misc'}/${props.subscription.id}`);
const blankForm = () => ({ type: '電話', content: '', attachments: [], nextFollowUpDate: '' });
const form = ref(blankForm());

async function load() {
  loading.value = true;
  try {
    list.value = await fetchSubscriptionFollowups(props.subscription.id);
  } catch (e) {
    console.error('載入跟進紀錄失敗:', e);
  } finally {
    loading.value = false;
  }
}

watch(() => [props.subscription.id, props.refreshKey], load, { immediate: true });

function formatTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false }).replace(/:\d{2}$/, '');
}

async function add() {
  saving.value = true;
  try {
    await addSubscriptionFollowup(props.subscription.id, {
      ...form.value,
      content: form.value.content.trim(),
      cycleNo: props.cycleNo,
      createdBy: props.user.key || '',
      createdByName: props.user.name || '',
    });
    form.value = blankForm();
    await load();
    emit('changed');
  } catch (e) {
    alert('新增跟進失敗：' + e.message);
  } finally {
    saving.value = false;
  }
}

async function remove(f) {
  if (!confirm('刪除這筆跟進紀錄？')) return;
  try {
    await deleteSubscriptionFollowup(props.subscription.id, f.id);
    await load();
    emit('changed');
  } catch (e) {
    alert('刪除失敗：' + e.message);
  }
}
</script>

<style scoped>
.followup-content {
  white-space: pre-line;
  margin-top: 2px;
}
</style>
