<script setup>
const props = defineProps({
  logs: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

const fmtTime = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="log-section">
    <h2 class="section-title">Send Log</h2>
    <div class="table-card">
      <div v-if="loading" class="skeleton-rows">
        <div v-for="i in 4" :key="i" class="skeleton-row"></div>
      </div>

      <template v-else-if="logs.length">
        <table class="log-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Schedule</th>
              <th>Groups</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(log, i) in logs" :key="i">
              <td class="cell-time">{{ fmtTime(log.sentAt) }}</td>
              <td>{{ log.scheduleName || '—' }}</td>
              <td>{{ log.groupCount ?? '—' }}</td>
              <td>
                <span class="status-badge" :class="log.status">
                  {{ log.status === 'success' ? 'Success' : 'Failed' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <div v-else class="empty-state">
        <p>No send events recorded yet. Dispatches will appear here after screenshots are sent.</p>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.log-section {
  margin-top: 1.5rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);
  margin: 0 0 1rem;
}

.table-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--rf-surface-shadow);
}

.log-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  thead {
    background: var(--rf-page-bg, #f1f5f9);
    border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
  }

  th {
    padding: 0.625rem 1rem;
    text-align: left;
    font-size: 0.6875rem;
    font-weight: 700;
    color: var(--rf-text-secondary, #64748b);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  tbody tr {
    border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
    &:last-child { border-bottom: none; }
  }

  td {
    padding: 0.75rem 1rem;
    color: var(--rf-text-primary, #1e293b);
    &.cell-time { color: var(--rf-text-secondary); font-size: 0.75rem; }
  }
}

.status-badge {
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  &.success { background: var(--rf-success-light); color: var(--rf-success); }
  &.failed { background: var(--rf-error-light); color: var(--rf-error); }
}

.empty-state {
  padding: 2.5rem 1.5rem;
  text-align: center;
  color: var(--rf-text-muted);
  font-size: 0.875rem;
  font-style: italic;
  p { margin: 0; }
}

.skeleton-rows {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.skeleton-row {
  height: 2.5rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 0.375rem;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
