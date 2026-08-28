<template>
  <v-dialog
    :model-value="modelValue"
    max-width="560"
    :fullscreen="xs"
    scrollable
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon class="mr-2">mdi-tag-multiple</v-icon>
        標籤管理
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>
      <v-divider />

      <v-card-text>
        <!-- 新增標籤 -->
        <div class="d-flex align-center ga-2 mb-4 flex-wrap">
          <v-text-field
            v-model="newName"
            label="新標籤名稱"
            density="compact"
            variant="outlined"
            hide-details
            class="flex-grow-1"
            style="min-width: 160px"
            @keyup.enter="addTag"
          />
          <v-select
            v-model="newColor"
            :items="colorOptions"
            item-title="title"
            item-value="value"
            density="compact"
            variant="outlined"
            hide-details
            style="max-width: 140px"
          >
            <template #selection="{ item }">
              <v-chip :color="item.value" size="x-small" variant="flat" class="mr-1">&nbsp;</v-chip>
              {{ item.title }}
            </template>
            <template #item="{ item, props: itemProps }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-chip :color="item.value" size="x-small" variant="flat" class="mr-2">&nbsp;</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
          <v-btn color="primary" :disabled="!newName.trim()" :loading="saving" @click="addTag">新增</v-btn>
        </div>

        <!-- 標籤清單 -->
        <v-list density="compact" lines="one">
          <v-list-item v-for="tag in localTags" :key="tag.id">
            <template #prepend>
              <v-chip :color="tag.color" variant="flat" size="small" class="mr-3">{{ tag.name }}</v-chip>
            </template>
            <v-list-item-title>
              <template v-if="editingId === tag.id">
                <div class="d-flex align-center ga-2 flex-wrap">
                  <v-text-field
                    v-model="editName"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 160px"
                    @keyup.enter="saveEdit(tag)"
                  />
                  <v-select
                    v-model="editColor"
                    :items="colorOptions"
                    item-title="title"
                    item-value="value"
                    density="compact"
                    variant="outlined"
                    hide-details
                    style="max-width: 130px"
                  />
                  <v-btn size="small" color="primary" :loading="saving" @click="saveEdit(tag)">儲存</v-btn>
                  <v-btn size="small" variant="text" @click="editingId = null">取消</v-btn>
                </div>
              </template>
              <template v-else>
                <span class="text-grey text-caption">{{ colorLabel(tag.color) }}</span>
              </template>
            </v-list-item-title>
            <template #append>
              <v-btn
                v-if="editingId !== tag.id"
                icon="mdi-pencil"
                size="small"
                variant="text"
                @click="startEdit(tag)"
              />
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="askDelete(tag)"
              />
            </template>
          </v-list-item>
        </v-list>
        <div v-if="!localTags.length" class="text-center text-grey py-4">尚無標籤</div>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="close">關閉</v-btn>
      </v-card-actions>
    </v-card>

    <!-- 刪除確認 -->
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card>
        <v-card-title>刪除標籤</v-card-title>
        <v-card-text>
          確定要刪除標籤
          <v-chip :color="deleteTarget?.color" size="small" variant="flat">{{ deleteTarget?.name }}</v-chip>
          嗎？<br />
          此標籤會從<strong>所有留資</strong>中移除，且無法復原。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" :loading="saving" @click="confirmDelete">刪除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useDisplay } from 'vuetify';
import { useUiStore } from '@/store/uiStore';
import {
  saveTrialLeadTags,
  renameTagOnAllLeads,
  removeTagFromAllLeads,
} from '@/services/trialLeadsService';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  tags: { type: Array, default: () => [] },
});
const emit = defineEmits(['update:modelValue', 'changed']);

const { xs } = useDisplay();
const uiStore = useUiStore();

const colorOptions = [
  { value: 'grey', title: '灰色' },
  { value: 'blue', title: '藍色' },
  { value: 'green', title: '綠色' },
  { value: 'orange', title: '橘色' },
  { value: 'red', title: '紅色' },
  { value: 'purple', title: '紫色' },
  { value: 'teal', title: '青色' },
  { value: 'pink', title: '粉色' },
  { value: 'indigo', title: '靛色' },
  { value: 'brown', title: '棕色' },
];
const colorLabel = (c) => colorOptions.find((o) => o.value === c)?.title || c;

const localTags = ref([]);
const newName = ref('');
const newColor = ref('blue');
const editingId = ref(null);
const editName = ref('');
const editColor = ref('grey');
const saving = ref(false);
const deleteDialog = ref(false);
const deleteTarget = ref(null);

watch(
  () => [props.modelValue, props.tags],
  () => {
    if (props.modelValue) {
      localTags.value = props.tags.map((t) => ({ ...t }));
    }
  },
  { immediate: true, deep: true },
);

function close() {
  editingId.value = null;
  emit('update:modelValue', false);
}

function genId() {
  return `tag_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

async function persist(tags, changeInfo = null) {
  saving.value = true;
  try {
    await saveTrialLeadTags(tags);
    localTags.value = tags;
    emit('changed', { tags, ...changeInfo });
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`儲存標籤失敗：${e.message || e}`, 'error');
  } finally {
    saving.value = false;
  }
}

async function addTag() {
  const name = newName.value.trim();
  if (!name) return;
  if (localTags.value.some((t) => t.name === name)) {
    uiStore.showSnackbar('已有相同名稱的標籤', 'warning');
    return;
  }
  const tags = [...localTags.value, { id: genId(), name, color: newColor.value }];
  await persist(tags);
  newName.value = '';
}

function startEdit(tag) {
  editingId.value = tag.id;
  editName.value = tag.name;
  editColor.value = tag.color;
}

async function saveEdit(tag) {
  const name = editName.value.trim();
  if (!name) return;
  if (localTags.value.some((t) => t.id !== tag.id && t.name === name)) {
    uiStore.showSnackbar('已有相同名稱的標籤', 'warning');
    return;
  }
  const oldName = tag.name;
  const tags = localTags.value.map((t) => (t.id === tag.id ? { ...t, name, color: editColor.value } : t));
  saving.value = true;
  try {
    if (oldName !== name) {
      const n = await renameTagOnAllLeads(oldName, name);
      if (n > 0) uiStore.showSnackbar(`已同步更新 ${n} 筆留資的標籤名稱`, 'info');
    }
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`同步留資標籤失敗：${e.message || e}`, 'error');
  } finally {
    saving.value = false;
  }
  await persist(tags, { renamed: oldName !== name ? { from: oldName, to: name } : null });
  editingId.value = null;
}

function askDelete(tag) {
  deleteTarget.value = tag;
  deleteDialog.value = true;
}

async function confirmDelete() {
  const tag = deleteTarget.value;
  if (!tag) return;
  saving.value = true;
  try {
    const n = await removeTagFromAllLeads(tag.name);
    if (n > 0) uiStore.showSnackbar(`已從 ${n} 筆留資移除標籤「${tag.name}」`, 'info');
  } catch (e) {
    console.error(e);
    uiStore.showSnackbar(`移除留資標籤失敗：${e.message || e}`, 'error');
    saving.value = false;
    return;
  } finally {
    saving.value = false;
  }
  await persist(localTags.value.filter((t) => t.id !== tag.id), { removed: tag.name });
  deleteDialog.value = false;
  deleteTarget.value = null;
}
</script>
