<template>
  <v-app>
    <v-layout>
      <v-main>
        <!-- meta.remountOnParamChange：同路由切換參數（如 /standby/A → /standby/B）時強制重建元件 -->
        <router-view v-slot="{ Component, route }">
          <component :is="Component" :key="route.meta.remountOnParamChange ? route.fullPath : undefined" />
        </router-view>
      </v-main>
    </v-layout>
  </v-app>
</template>

<script>
export default {
  name: 'PublicLayout'
};
</script>

<style scoped>
/* 您可以在此添加針對公開佈局的特定樣式 */
</style>