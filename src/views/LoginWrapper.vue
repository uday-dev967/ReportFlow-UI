<script setup>
import { useUser } from '@/stores/user.store';
import queryString from 'query-string';

const useUserStore = useUser();

const tokenParams = queryString.parse(window.location.search);
if (tokenParams.code) {
  useUserStore
    .fetchAuthToken(tokenParams)
    .then(() => {
      // Can Perform any tasks that need to happen once the auth is fetched
    })
    .catch((e) => {});
} else {
  useUserStore.fetchLoginRedirectURL();
}
</script>

<template>
  <div class="login-wrapper">Redirecting to Login</div>
</template>

<style lang="scss" scoped>
.login-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
