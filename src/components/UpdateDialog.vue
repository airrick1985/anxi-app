<!-- src/components/UpdateDialog.vue -->
<template>
    <v-dialog v-model="show" persistent max-width="400">
      <v-card>
        <v-card-title>新版本已推出</v-card-title>
        <v-card-text>
          <p><strong>版本：</strong> {{ release.version }}</p>
          <p><strong>更新內容：</strong></p>
          <ul>
            <li v-for="(note, index) in release.notes" :key="index">{{ note }}</li>
          </ul>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="refreshApp">更新並重啟</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRegisterSW } from 'virtual:pwa-register/vue';
  
  const show = ref(false);
  const release = ref({ version: '', notes: [] });
  const { needRefresh, updateServiceWorker } = useRegisterSW({ immediate: true });
  
  const fetchReleaseNotes = async () => {
    try {
      const res = await fetch('/release-notes.json?_t=' + Date.now());
      const data = await res.json();
      release.value = data;
    } catch (e) {
      console.error('載入 release-notes.json 失敗', e);
      release.value.notes = ['有新版本可用，請更新！'];
    }
  };
  
  const refreshApp = async () => {
    await updateServiceWorker(true);
    window.location.reload();
  };
  
  onMounted(() => {
    if (needRefresh.value) {
      fetchReleaseNotes();
      show.value = true;
    }
  });
  </script>
  