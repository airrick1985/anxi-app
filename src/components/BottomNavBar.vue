<!-- src/components/BottomNavBar.vue -->
<template>
  <v-bottom-navigation
    v-model="active"
    grow
    app
  >
    <v-btn
      :value="0"
      :to="{ name: 'InspectionRecord' }"
      replace
    >
      <span class="d-flex flex-column align-center">
        <v-icon size="24">mdi-home-search</v-icon>
        <small>驗屋紀錄</small>
      </span>
    </v-btn>

    <v-btn
      :value="1"
      :to="{ name: 'InspectionOverview' }"
      replace
    >
      <span class="d-flex flex-column align-center">
        <v-icon size="24">mdi-view-list</v-icon>
        <small>紀錄總覽</small>
      </span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const active = ref(0);

// 當路由變更，自動切換 Tab 的選取
watch(() => route.name, name => {
  if (name === 'InspectionRecord') active.value = 0;
  else if (name === 'InspectionOverview') active.value = 1;
});
</script>

<style scoped>
.v-bottom-navigation {
  position: fixed;
  bottom: 0;
  width: 100%;
}
</style>
