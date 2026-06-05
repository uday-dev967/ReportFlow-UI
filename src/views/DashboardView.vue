<script setup>
import { ref, onMounted } from 'vue';
import {
  dispatchScreenshot,
  fetchSendLogs,
  fetchDashboardSummary,
  fetchDashboardTrend,
  fetchDashboardFilters,
} from '@/network/automation.service.js';
import { useToast } from '@/composables/useToastComposable.js';
import FiltersBar from '@/components/dashboard/FiltersBar.vue';
import KpiCards from '@/components/dashboard/KpiCards.vue';
import SalesTable from '@/components/dashboard/SalesTable.vue';
import ChartSection from '@/components/dashboard/ChartSection.vue';
import SendPanel from '@/components/dashboard/SendPanel.vue';

const { success, error: toastError } = useToast();

const filterOptions = ref({
  states: [],
  regions: [],
  managers: [],
  reportTypes: ['Productivity Report'],
  dateRanges: [],
});

const activeFilters = ref({
  dateFrom: '',
  dateTo: '',
  states: [],
  region: '',
  manager: '',
  reportType: 'Productivity Report',
  dateRange: 'last30days',
});

const dashboardData = ref([]);
const dailyTrend = ref([]);
const loading = ref(false);
const lastLog = ref(null);
const sending = ref(false);
const sendResult = ref(null);

function buildApiFilters(filters) {
  const apiFilters = {
    reportType: filters.reportType || 'Productivity Report',
    dateRange: filters.dateRange || 'today',
  };
  if (filters.states?.length) apiFilters.states = filters.states;
  if (filters.region) apiFilters.regions = [filters.region];
  if (filters.manager) apiFilters.managers = [filters.manager];
  if (filters.dateFrom) apiFilters.startDate = filters.dateFrom;
  if (filters.dateTo) apiFilters.endDate = filters.dateTo;
  return apiFilters;
}

async function loadDashboard(filters) {
  loading.value = true;
  const apiFilters = buildApiFilters(filters);

  const [summaryRes, trendRes] = await Promise.all([
    fetchDashboardSummary(apiFilters),
    fetchDashboardTrend({
      dateRange: apiFilters.dateRange,
      startDate: apiFilters.startDate,
      endDate: apiFilters.endDate,
    }),
  ]);

  loading.value = false;

  if (summaryRes.ok) {
    dashboardData.value = summaryRes.data.rows || [];
  } else {
    dashboardData.value = [];
    toastError(summaryRes.message || 'Failed to load dashboard data');
  }

  if (trendRes.ok) {
    dailyTrend.value = trendRes.data.trend || [];
  } else {
    dailyTrend.value = [];
  }
}

const applyFilters = (filters) => {
  activeFilters.value = { ...filters };
  loadDashboard(filters);
};

const resetFilters = () => {
  activeFilters.value = {
    dateFrom: '',
    dateTo: '',
    states: [],
    region: '',
    manager: '',
    reportType: 'Productivity Report',
    dateRange: 'last30days',
  };
  loadDashboard(activeFilters.value);
};

const handleSendNow = async () => {
  sending.value = true;
  sendResult.value = null;

  try {
    const apiFilters = buildApiFilters(activeFilters.value);
    const result = await dispatchScreenshot({
      filters: apiFilters,
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
  const [filtersRes, logsRes] = await Promise.all([
    fetchDashboardFilters(),
    fetchSendLogs(1),
  ]);

  if (filtersRes.ok) {
    filterOptions.value = {
      states: filtersRes.data.states || [],
      regions: filtersRes.data.regions || [],
      managers: filtersRes.data.managers || [],
      reportTypes: filtersRes.data.reportTypes || ['Productivity Report'],
      dateRanges: filtersRes.data.dateRanges || [],
    };
  }

  if (logsRes.ok && logsRes.data?.logs?.length) {
    lastLog.value = logsRes.data.logs[0];
  }

  await loadDashboard(activeFilters.value);
});
</script>

<template>
  <div class="dashboard-view">
    <FiltersBar
      :filter-options="filterOptions"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <div v-if="loading" class="loading-state">Loading dashboard data…</div>

    <div v-else id="dashboard-capture">
      <KpiCards :data="dashboardData" />
      <SalesTable :data="dashboardData" />
      <ChartSection :data="dashboardData" :daily-trend="dailyTrend" />
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

.loading-state {
  padding: 2rem;
  text-align: center;
  color: var(--rf-text-secondary, #64748b);
  font-size: 0.875rem;
}
</style>
