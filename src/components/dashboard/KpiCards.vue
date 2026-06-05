<script setup>
import { computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true },
});

const totalAchievement = computed(() =>
  props.data.reduce((s, r) => s + r.achievement, 0),
);
const totalTarget = computed(() =>
  props.data.reduce((s, r) => s + r.target, 0),
);
const overallPct = computed(() =>
  totalTarget.value > 0 ? (totalAchievement.value / totalTarget.value) * 100 : 0,
);
const totalDistributors = computed(() =>
  props.data.reduce((s, r) => s + r.distributors, 0),
);
const totalOrders = computed(() =>
  props.data.reduce((s, r) => s + r.ordersCount, 0),
);
const topState = computed(() => {
  if (!props.data.length) return null;
  return props.data.reduce((best, r) => (r.achievementPct > best.achievementPct ? r : best));
});
const bottomState = computed(() => {
  if (!props.data.length) return null;
  return props.data.reduce((worst, r) => (r.achievementPct < worst.achievementPct ? r : worst));
});

const fmtCr = (v) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} Cr`;
const fmtNum = (v) => v.toLocaleString('en-IN');
</script>

<template>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total Sales Value</div>
      <div class="kpi-value">{{ fmtCr(totalAchievement) }}</div>
      <div class="kpi-sub">{{ data.length }} states</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Target vs Achievement</div>
      <div class="kpi-value">{{ overallPct.toFixed(1) }}%</div>
      <div class="progress-track">
        <div
          class="progress-fill"
          :style="{
            width: `${Math.min(overallPct, 100)}%`,
            backgroundColor:
              overallPct >= 90 ? 'var(--rf-success)' : overallPct >= 70 ? 'var(--rf-warning)' : 'var(--rf-error)',
          }"
        ></div>
      </div>
      <div class="kpi-sub">vs {{ fmtCr(totalTarget) }} target</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Active Distributors</div>
      <div class="kpi-value">{{ fmtNum(totalDistributors) }}</div>
      <div class="kpi-sub">across {{ data.length }} states</div>
    </div>

    <div class="kpi-card">
      <div class="kpi-label">Total Orders</div>
      <div class="kpi-value">{{ fmtNum(totalOrders) }}</div>
      <div class="kpi-sub">this period</div>
    </div>

    <div class="kpi-card kpi-top" v-if="topState">
      <div class="kpi-label">Top Performing State</div>
      <div class="kpi-value kpi-state-name">{{ topState.state }}</div>
      <div class="kpi-badge green">{{ topState.achievementPct.toFixed(1) }}% ↑</div>
    </div>
    <div class="kpi-card kpi-placeholder" v-else>
      <div class="kpi-label">Top Performing State</div>
      <div class="kpi-value">—</div>
    </div>

    <div class="kpi-card kpi-bottom" v-if="bottomState">
      <div class="kpi-label">Lowest Performing State</div>
      <div class="kpi-value kpi-state-name">{{ bottomState.state }}</div>
      <div class="kpi-badge red">{{ bottomState.achievementPct.toFixed(1) }}% ↓</div>
    </div>
    <div class="kpi-card kpi-placeholder" v-else>
      <div class="kpi-label">Lowest Performing State</div>
      <div class="kpi-value">—</div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1rem;
  margin-bottom: 1.25rem;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
  }
}

.kpi-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1rem 1.125rem;
  box-shadow: var(--rf-surface-shadow);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &.kpi-top {
    border-top: 3px solid var(--rf-success, #10b981);
  }

  &.kpi-bottom {
    border-top: 3px solid var(--rf-error, #ef4444);
  }
}

.kpi-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--rf-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.125rem;
}

.kpi-value {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--rf-text-primary, #1e293b);
  line-height: 1.2;
  letter-spacing: -0.02em;

  &.kpi-state-name {
    font-size: 1rem;
  }
}

.kpi-sub {
  font-size: 0.75rem;
  color: var(--rf-text-muted, #94a3b8);
  margin-top: 0.125rem;
}

.progress-track {
  height: 0.3125rem;
  background: var(--rf-surface-border, #e2e8f0);
  border-radius: 9999px;
  overflow: hidden;
  margin: 0.25rem 0;

  .progress-fill {
    height: 100%;
    border-radius: 9999px;
    transition: width 0.4s ease;
  }
}

.kpi-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  width: fit-content;
  margin-top: 0.25rem;

  &.green {
    background: var(--rf-success-light, #ecfdf5);
    color: var(--rf-success, #10b981);
  }

  &.red {
    background: var(--rf-error-light, #fef2f2);
    color: var(--rf-error, #ef4444);
  }
}
</style>
