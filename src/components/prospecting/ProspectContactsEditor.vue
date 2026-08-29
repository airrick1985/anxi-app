<template>
  <div>
    <div class="d-flex align-center mb-1">
      <span class="text-subtitle-2">聯絡人（{{ contacts.length }}）</span>
      <v-spacer />
      <v-btn size="small" variant="tonal" prepend-icon="mdi-account-plus" @click="openEditor(null)">新增聯絡人</v-btn>
    </div>
    <div v-if="!contacts.length" class="text-caption text-grey py-2">尚無聯絡人，請新增至少一位有 Email 的聯絡人才能寄信。</div>
    <v-table v-else density="compact" class="contacts-table">
      <thead>
        <tr>
          <th style="width: 28px"></th>
          <th>姓名／職稱</th>
          <th>Email</th>
          <th>電話</th>
          <th>LINE</th>
          <th class="text-right" style="width: 130px"></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="c in contacts" :key="c.id">
          <td>
            <v-icon v-if="c.isPrimary" size="small" color="amber" title="主要聯絡人">mdi-star</v-icon>
          </td>
          <td>
            <div class="font-weight-medium">{{ c.name || '（未填姓名）' }}</div>
            <div v-if="c.title" class="text-caption text-grey">{{ c.title }}</div>
          </td>
          <td>
            <a v-if="c.email" :href="`mailto:${c.email}`" class="text-decoration-none">{{ c.email }}</a>
            <span v-else class="text-grey">—</span>
          </td>
          <td>
            <a v-if="c.phone" :href="`tel:${c.phone}`" class="text-decoration-none">{{ c.phone }}</a>
            <span v-else class="text-grey">—</span>
          </td>
          <td>{{ c.line || '—' }}</td>
          <td class="text-right text-no-wrap">
            <v-btn icon="mdi-email-send" size="x-small" variant="text" color="primary" :disabled="!c.email" title="寄信給此聯絡人" @click="emit('send-email', c)" />
            <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openEditor(c)" />
            <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="askRemove(c)" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <!-- 編輯 dialog -->
    <v-dialog v-model="editorOpen" max-width="520">
      <v-card>
        <v-card-title>{{ form.id ? '編輯聯絡人' : '新增聯絡人' }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="6"><v-text-field v-model="form.name" label="姓名" density="compact" variant="outlined" hide-details autofocus /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.title" label="職稱" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12">
              <v-text-field v-model="form.email" label="Email" density="compact" variant="outlined" :error-messages="emailError" />
            </v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.phone" label="電話" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12" sm="6"><v-text-field v-model="form.line" label="LINE" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-text-field v-model="form.note" label="備註" density="compact" variant="outlined" hide-details /></v-col>
            <v-col cols="12"><v-checkbox v-model="form.isPrimary" label="設為主要聯絡人" density="compact" hide-details /></v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editorOpen = false">取消</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!canSave" @click="save">儲存</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="removeDialog" max-width="400">
      <v-card>
        <v-card-title>刪除聯絡人</v-card-title>
        <v-card-text>確定要刪除「{{ removeTarget?.name || removeTarget?.email || '此聯絡人' }}」嗎？</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="removeDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="confirmRemove">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { genId, isValidEmail } from '@/services/prospectService';

const props = defineProps({
  contacts: { type: Array, default: () => [] },
});
const emit = defineEmits(['update', 'send-email']);

const editorOpen = ref(false);
const form = ref(blank());
const removeDialog = ref(false);
const removeTarget = ref(null);

function blank() {
  return { id: null, name: '', title: '', email: '', phone: '', line: '', note: '', isPrimary: false };
}

function openEditor(c) {
  form.value = c ? { ...blank(), ...c } : { ...blank(), isPrimary: props.contacts.length === 0 };
  editorOpen.value = true;
}

const emailError = computed(() => {
  const e = String(form.value.email || '').trim();
  if (!e) return '';
  if (!isValidEmail(e)) return 'Email 格式不正確';
  const dup = props.contacts.some((c) => c.id !== form.value.id && String(c.email || '').toLowerCase() === e.toLowerCase());
  return dup ? '已有相同 Email 的聯絡人' : '';
});
const canSave = computed(() => {
  const f = form.value;
  const hasAny = [f.name, f.email, f.phone, f.line].some((v) => String(v || '').trim());
  return hasAny && !emailError.value;
});

function normalize(c) {
  return {
    id: c.id || genId('c_'),
    name: String(c.name || '').trim(),
    title: String(c.title || '').trim(),
    email: String(c.email || '').trim(),
    phone: String(c.phone || '').trim(),
    line: String(c.line || '').trim(),
    note: String(c.note || '').trim(),
    isPrimary: !!c.isPrimary,
  };
}

function save() {
  if (!canSave.value) return;
  const next = normalize(form.value);
  let list = props.contacts.map((c) => ({ ...c }));
  const idx = list.findIndex((c) => c.id === next.id);
  if (idx >= 0) list[idx] = next; else list.push(next);
  if (next.isPrimary) list = list.map((c) => ({ ...c, isPrimary: c.id === next.id }));
  else if (!list.some((c) => c.isPrimary) && list.length) list[0].isPrimary = true;
  emit('update', list);
  editorOpen.value = false;
}

function askRemove(c) {
  removeTarget.value = c;
  removeDialog.value = true;
}
function confirmRemove() {
  const id = removeTarget.value?.id;
  let list = props.contacts.filter((c) => c.id !== id).map((c) => ({ ...c }));
  if (list.length && !list.some((c) => c.isPrimary)) list[0].isPrimary = true;
  emit('update', list);
  removeDialog.value = false;
  removeTarget.value = null;
}
</script>

<style scoped>
.contacts-table :deep(td) {
  vertical-align: middle;
}
</style>
