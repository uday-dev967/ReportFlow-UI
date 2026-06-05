<!-- eslint-disable vue/multi-word-component-names -->
<script setup>
import App from './App.vue';
import Auth from './Auth.vue';
import { useUser } from '@/stores/user.store';
import { storeToRefs } from 'pinia';

const useUserStore = useUser();
const { auth } = storeToRefs(useUserStore);

// Internal tool: auto-authenticate if no token is present
let authToken = localStorage.getItem('Authorization') || 'reportflow-internal-session';
if (authToken) {
  useUserStore.setAuth(authToken);
}
</script>

<template>
  <template v-if="auth">
    <App></App>
  </template>
  <template v-else>
    <Auth></Auth>
  </template>
</template>

<style scoped>
.app-wrapper {
  height: 100%;
  width: 100%;
}
</style>
