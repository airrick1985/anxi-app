<template>
  <v-app>
    <v-layout>
      <v-main>
        <router-view />
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