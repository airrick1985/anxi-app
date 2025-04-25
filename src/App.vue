// src/App.vue
<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>ANXI 驗屋系統</v-toolbar-title>
      <v-spacer />
      <template v-if="user">
        <v-btn icon @click="dialog = true">
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="me-4 clickable" @click="dialog = true">{{ user.name }}</span>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>

    <EditProfileDialog v-model:dialog="dialog" />
  </v-app>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';
import { useRouter } from 'vue-router';
import EditProfileDialog from './components/EditProfileDialog.vue';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
const dialog = ref(false);

const router = useRouter();
if (!user.value && router.currentRoute.value.path === '/') {
  router.replace('/login');
}
</script>

<style>
body {
  margin: 0;
}
.clickable {
  cursor: pointer;
}
</style>