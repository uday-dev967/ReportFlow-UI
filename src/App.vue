<script setup>
import { RouterView, useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCommon } from '@/stores/common.store.js';
import { useRemIndicator } from '@/composables/remIndicatorComposable';
import CircularProgressBar from '@/components/sharedComponents/CircularProgressBar.vue';
import OToast from '@/components/sharedComponents/OToast.vue';
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';

const useCommonStore = useCommon();
const { commonLoaderState } = storeToRefs(useCommonStore);
const { remIndicatorRef } = useRemIndicator();
const route = useRoute();
</script>

<template>
  <div class="app-layout">
    <AppSidebar />
    <div class="app-main">
      <AppHeader />
      <main class="app-content">
        <RouterView :key="route.fullPath" />
      </main>
    </div>
    <CircularProgressBar v-if="commonLoaderState" />
    <OToast />
  </div>
  <div id="remIndicator" ref="remIndicatorRef"></div>
</template>

<style lang="scss" scoped>
.app-layout {
  height: 100%;
  width: 100%;
  display: flex;
  overflow: hidden;
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  background-color: var(--rf-page-bg, #f1f5f9);
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
