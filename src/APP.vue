// src/App.vue
<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <v-toolbar-title>ANXI 驗屋系統</v-toolbar-title>
      <v-spacer />
      <template v-if="user">
        <v-btn icon>
          <v-icon>mdi-account</v-icon>
        </v-btn>
        <span class="me-4">{{ user.name }}</span>
      </template>
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useUserStore } from './store/user';

const userStore = useUserStore();
const { user } = storeToRefs(userStore);
</script>

<style>
body {
  margin: 0;
}
</style>