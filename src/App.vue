<script setup>
// vue imports
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
//  stores
import { useCommon } from '@/stores/common.store.js';
// composables
import { useRemIndicator } from '@/composables/remIndicatorComposable';
// components
import CircularProgressBar from '@/components/sharedComponents/CircularProgressBar.vue';

const useCommonStore = useCommon();
let { commonLoaderState } = storeToRefs(useCommonStore);

const { remIndicatorRef } = useRemIndicator();
const route = useRoute();

const init = () => {
  // Call any API call here that needs to happen on app initialization
};

init();
</script>

<template>
  <div class="app-wrapper">
    <RouterView :key="route.fullPath" />
    <CircularProgressBar v-if="commonLoaderState"></CircularProgressBar>
  </div>
  <div id="remIndicator" ref="remIndicatorRef"></div>
</template>

<style lang="scss" scoped>
.app-wrapper {
  height: 100%;
  width: 100%;
}

#remIndicator {
  position: absolute;
  top: -10000px;
  left: -10000px;
  background: transparent;
  opacity: 0;
  width: 1rem;
  height: 1rem;
  z-index: 1;
  pointer-events: none;
  visibility: hidden;
}
</style>
