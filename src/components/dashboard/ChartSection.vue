<script setup>
import { computed } from 'vue';
import { Bar, Doughnut, Line } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
);

const props = defineProps({
  data: { type: Array, required: true },
  dailyTrend: { type: Array, required: true },
});

const barColor = (pct) => {
  if (pct >= 90) return '#10b981';
  if (pct >= 70) return '#f59e0b';
  return '#ef4444';
};

const REGION_COLORS = {
  North: '#3b82f6',
  South: '#f97316',
  East: '#8b5cf6',
  West: '#10b981',
};

const barData = computed(() => ({
  labels: props.data.map((r) => r.state.replace(' Pradesh', ' P.').replace('Himachal', 'HP')),
  datasets: [
    {
      label: 'Achievement %',
      data: props.data.map((r) => r.achievementPct),
      backgroundColor: props.data.map((r) => barColor(r.achievementPct)),
      borderRadius: 3,
      borderSkipped: false,
    },
  ],
}));

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => ` ${ctx.raw.toFixed(1)}%`,
        title: (items) => {
          const idx = items[0].dataIndex;
          return props.data[idx]?.state || items[0].label;
        },
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 9 }, maxRotation: 45 },
    },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: { callback: (v) => `${v}%` },
      min: 0,
      max: 120,
    },
  },
}));

const regionTotals = computed(() => {
  const totals = {};
  for (const r of props.data) {
    totals[r.region] = (totals[r.region] || 0) + r.achievement;
  }
  return totals;
});

const donutData = computed(() => {
  const regions = Object.keys(REGION_COLORS).filter((r) => regionTotals.value[r] != null);
  return {
    labels: regions,
    datasets: [
      {
        data: regions.map((r) => +(regionTotals.value[r] || 0).toFixed(1)),
        backgroundColor: regions.map((r) => REGION_COLORS[r]),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverBorderColor: '#ffffff',
      },
    ],
  };
});

const donutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '60%',
  plugins: {
    legend: {
      position: 'bottom',
      labels: { font: { size: 11 }, padding: 12, boxWidth: 12 },
    },
    tooltip: {
      callbacks: { label: (ctx) => ` ${ctx.label}: ₹${ctx.raw} Cr` },
    },
  },
};

const lineData = computed(() => ({
  labels: props.dailyTrend.map((d) => {
    const dt = new Date(d.date);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }),
  datasets: [
    {
      label: 'Daily Sales (₹ Cr)',
      data: props.dailyTrend.map((d) => d.value),
      borderColor: '#2563eb',
      backgroundColor: 'rgba(37, 99, 235, 0.08)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
      borderWidth: 2,
    },
  ],
}));

const lineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: { label: (ctx) => ` ₹${ctx.raw} Cr` },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 9 }, maxTicksLimit: 12 },
    },
    y: {
      grid: { color: '#f1f5f9' },
      ticks: { callback: (v) => `₹${v}` },
    },
  },
};
</script>

<template>
  <div class="charts-section">
    <div class="chart-card chart-bar">
      <div class="chart-title">Achievement % by State</div>
      <div class="chart-legend-inline">
        <span class="legend-dot" style="background: #10b981"></span><span>≥ 90%</span>
        <span class="legend-dot" style="background: #f59e0b; margin-left: 0.75rem"></span><span>70–90%</span>
        <span class="legend-dot" style="background: #ef4444; margin-left: 0.75rem"></span><span>&lt; 70%</span>
      </div>
      <div class="chart-body" style="height: 240px">
        <Bar v-if="data.length" :data="barData" :options="barOptions" />
        <div v-else class="chart-empty">No data</div>
      </div>
    </div>

    <div class="charts-bottom-row">
      <div class="chart-card chart-donut">
        <div class="chart-title">Region-wise Sales Contribution</div>
        <div class="chart-body" style="height: 220px">
          <Doughnut v-if="data.length" :data="donutData" :options="donutOptions" />
          <div v-else class="chart-empty">No data</div>
        </div>
      </div>

      <div class="chart-card chart-line">
        <div class="chart-title">Daily Sales Trend</div>
        <div class="chart-body" style="height: 220px">
          <Line v-if="dailyTrend.length" :data="lineData" :options="lineOptions" />
          <div v-else class="chart-empty">No trend data</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.charts-section {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 1.25rem;
}

.chart-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.125rem 1.25rem;
  box-shadow: var(--rf-surface-shadow);
}

.chart-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);
  margin-bottom: 0.75rem;
}

.chart-legend-inline {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: var(--rf-text-secondary, #64748b);
  margin-bottom: 0.75rem;
}

.legend-dot {
  width: 0.625rem;
  height: 0.625rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.chart-body {
  position: relative;
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--rf-text-muted, #94a3b8);
  font-style: italic;
}

.charts-bottom-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 1.25rem;
}
</style>
