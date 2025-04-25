// src/components/EditProfileDialog.vue
<template>
  <v-dialog v-model="dialog" max-width="500px">
    <v-card>
      <v-card-title>修改個人資料</v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="newName" label="姓名" required />
          <v-text-field v-model="oldPassword" label="原密碼" type="password" required />
          <v-text-field v-model="newPassword" label="新密碼 (可留空)" type="password" />
          <v-alert v-if="errorMsg" type="error" dense class="mt-2">{{ errorMsg }}</v-alert>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="dialog = false">取消</v-btn>
        <v-btn color="primary" @click="submit">儲存</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useUserStore } from '../store/user';
import { updateUserProfile } from '../api';

const props = defineProps({ dialog: Boolean });
const emit = defineEmits(['update:dialog']);

const dialog = ref(props.dialog);
watch(() => props.dialog, val => dialog.value = val);
watch(dialog, val => emit('update:dialog', val));

const userStore = useUserStore();
const newName = ref(userStore.user?.name || '');
const oldPassword = ref('');
const newPassword = ref('');
const errorMsg = ref('');

const submit = async () => {
  errorMsg.value = '';
  const result = await updateUserProfile({
    originalName: userStore.user.name,
    originalPassword: oldPassword.value,
    newName: newName.value,
    newPassword: newPassword.value
  });

  if (result.status === 'success') {
    userStore.setUser({ name: newName.value });
    dialog.value = false;
  } else {
    errorMsg.value = result.message || '修改失敗';
  }
};
</script>