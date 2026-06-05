<script setup>
import { computed } from 'vue';
import { MOCK_STATES, DAILY_TREND } from '@/data/mockData.js';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import SalesTable from '@/components/dashboard/SalesTable.vue';
import ChartSection from '@/components/dashboard/ChartSection.vue';

/** Default unfiltered data for scheduled captures (any route). */
const captureData = computed(() => MOCK_STATES);
const captureTrend = computed(() => DAILY_TREND.slice(-30));
</script>

<template>
  <div id="dashboard-capture-scheduler" class="dashboard-capture-host" aria-hidden="true">
    <KpiCards :data="captureData" />
    <SalesTable :data="captureData" />
    <ChartSection :data="captureData" :daily-trend="captureTrend" />
  </div>
</template>

<style lang="scss">
/* Off-screen when idle; .rf-capture-prep (added during capture) moves it on-screen — see useDashboardCapture.js */
.dashboard-capture-host:not(.rf-capture-prep) {
  position: fixed;
  left: -12000px;
  top: 0;
  width: 1200px;
  padding: 1.5rem;
  background: #f1f5f9;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.dashboard-capture-host.rf-capture-prep {
  position: fixed !important;
  left: 0 !important;
  top: 0 !important;
  width: 1200px !important;
  padding: 1.5rem !important;
  background: #f1f5f9 !important;
  opacity: 1 !important;
  visibility: visible !important;
  z-index: 2147483646 !important;
  pointer-events: none !important;
  overflow: visible !important;
}
</style>
