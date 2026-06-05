<script setup>
import { ref, computed, onMounted } from 'vue';
import { MOCK_STATES, DAILY_TREND } from '@/data/mockData.js';
import { dispatchScreenshot, fetchSendLogs } from '@/network/automation.service.js';
import { useToast } from '@/composables/useToastComposable.js';
import { captureElementToBase64, defaultReportCaption } from '@/composables/useDashboardCapture.js';
import FiltersBar from '@/components/dashboard/FiltersBar.vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import SalesTable from '@/components/dashboard/SalesTable.vue';
import ChartSection from '@/components/dashboard/ChartSection.vue';
import SendPanel from '@/components/dashboard/SendPanel.vue';

const { success, error: toastError } = useToast();

const activeFilters = ref({
  dateFrom: '',
  dateTo: '',
  states: [],
  region: '',
  manager: '',
});

const lastLog = ref(null);
const sending = ref(false);
const sendResult = ref(null);

const filteredData = computed(() => {
  let data = MOCK_STATES;
  const { states, region, manager } = activeFilters.value;
  if (states?.length) data = data.filter((r) => states.includes(r.state));
  if (region) data = data.filter((r) => r.region === region);
  if (manager) data = data.filter((r) => r.manager === manager);
  return data;
});

const filteredTrend = computed(() => {
  const { dateFrom, dateTo } = activeFilters.value;
  const trend = DAILY_TREND;
  if (!dateFrom && !dateTo) return trend.slice(-30);
  return trend.filter((d) => {
    if (dateFrom && d.date < dateFrom) return false;
    if (dateTo && d.date > dateTo) return false;
    return true;
  });
});

const applyFilters = (filters) => {
  activeFilters.value = { ...filters };
};

const resetFilters = () => {
  activeFilters.value = { dateFrom: '', dateTo: '', states: [], region: '', manager: '' };
};

const handleSendNow = async () => {
  sending.value = true;
  sendResult.value = null;

  try {
    const { imageBase64, mimeType, imageBlob } = await captureElementToBase64();

    const result = await dispatchScreenshot({
      imageBlob,
      imageBase64,
      mimeType,
      caption: defaultReportCaption(),
      manual: true,
    });

    sendResult.value = result;

    if (result.ok) {
      const sent = result.data?.result?.sent ?? 0;
      const failed = (result.data?.result?.results || []).filter((r) => r.ok === false);
      if (sent > 0) {
        success(`Report sent to ${sent} group(s)`);
      } else {
        toastError('No messages were delivered. Check API logs and group chatId.');
      }
      if (failed.length) {
        toastError(
          `Failed for: ${failed.map((r) => r.groupName || r.chatId).join(', ')} — ${failed[0]?.error || 'send error'}`,
        );
      }
      const logsRes = await fetchSendLogs(1);
      if (logsRes.ok && logsRes.data?.logs?.length) {
        lastLog.value = logsRes.data.logs[0];
      }
    } else {
      toastError(result.message || 'Dispatch failed');
    }
  } catch (err) {
    sendResult.value = { ok: false, message: err.message };
    toastError(err.message);
  } finally {
    sending.value = false;
  }
};

onMounted(async () => {
  const res = await fetchSendLogs(1);
  if (res.ok && res.data?.logs?.length) {
    lastLog.value = res.data.logs[0];
  }
});
</script>

<template>
  <div class="dashboard-view">
    <FiltersBar @apply="applyFilters" @reset="resetFilters" />

    <div id="dashboard-capture">
      <KpiCards :data="filteredData" />
      <SalesTable :data="filteredData" />
      <ChartSection :data="filteredData" :daily-trend="filteredTrend" />
    </div>

    <SendPanel
      :sending="sending"
      :send-result="sendResult"
      :last-log="lastLog"
      @send="handleSendNow"
    />
  </div>
</template>

<style lang="scss" scoped>
.dashboard-view {
  padding: 1.5rem;
  background: var(--rf-page-bg, #f1f5f9);
  min-height: 100%;
}

#dashboard-capture {
  background: var(--rf-page-bg, #f1f5f9);
}
</style>
