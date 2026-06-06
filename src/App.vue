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
  background-color: var(--rf-page-bg, #f8fafc);
  background-image:
    radial-gradient(ellipse at 0% 0%, rgba(37, 99, 235, 0.04) 0%, transparent 50%),
    radial-gradient(ellipse at 100% 100%, rgba(16, 185, 129, 0.03) 0%, transparent 50%);
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
