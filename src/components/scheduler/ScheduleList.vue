<script setup>
import { ref } from 'vue';
import { cronToHuman, parseCron, DAY_LABELS, format12h, PRESET_CRONS } from '@/utils/cronUtils.js';

const props = defineProps({
  schedules: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['create', 'edit', 'delete', 'toggle']);

const pendingDeleteId = ref(null);

const groupNames = (s) => {
  const names = [];
  const add = (g) => {
    if (!g || typeof g !== 'object') return;
    const name = g.name?.trim();
    if (name && !names.includes(name)) names.push(name);
  };
  add(s.group);
  (s.groups || []).forEach(add);
  return names;
};

const scheduleFrequency = (s) => {
  const trimmed = s.cron?.trim();
  const preset = PRESET_CRONS.find((p) => p.value === trimmed);
  if (preset) return preset.label;
  const p = parseCron(s.cron);
  if (p.frequency === 'preset') {
    const match = PRESET_CRONS.find((pr) => pr.value === p.presetCron);
    return match?.label || 'Interval';
  }
  if (p.frequency === 'daily') return 'Daily';
  if (p.frequency === 'weekly') return 'Weekly';
  return 'Custom';
};

const scheduleTime = (s) => {
  const p = parseCron(s.cron);
  if (p.frequency === 'preset' || p.frequency === 'custom') return '—';
  return format12h(p.time);
};

const scheduleDays = (s) => {
  const p = parseCron(s.cron);
  if (p.frequency === 'preset') return 'Continuous';
  if (p.frequency === 'daily') return 'Every day';
  if (p.frequency === 'weekly') {
    return p.days.length ? p.days.map((d) => DAY_LABELS[d]).join(', ') : '—';
  }
  return '—';
};

const DATE_RANGE_LABELS = {
  today: 'Today',
  last7days: 'Last 7 Days',
  last30days: 'Last 30 Days',
  thisMonth: 'This Month',
};

const filterSummary = (s) => {
  const f = s.filters || {};
  const parts = [];

  if (f.startDate || f.endDate) {
    parts.push(`${f.startDate || '…'} → ${f.endDate || '…'}`);
  } else {
    parts.push(DATE_RANGE_LABELS[f.dateRange] || f.dateRange || 'Last 30 Days');
  }

  if (f.states?.length) parts.push(`${f.states.length} state(s)`);
  else if (f.regions?.length) parts.push(f.regions.join(', '));
  else parts.push('All regions');

  if (f.managers?.length) parts.push(`${f.managers.length} manager(s)`);

  return parts.join(' · ');
};

const confirmDelete = (id) => {
  pendingDeleteId.value = id;
};

const doDelete = () => {
  if (pendingDeleteId.value) {
    emit('delete', pendingDeleteId.value);
    pendingDeleteId.value = null;
  }
};
</script>

<template>
  <div class="schedule-section">
    <div class="section-header">
      <h2 class="section-title">Schedules</h2>
      <button type="button" class="btn-create" @click="emit('create')">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        Create Schedule
      </button>
    </div>

    <div class="table-card">
      <div v-if="loading" class="skeleton-rows">
        <div v-for="i in 3" :key="i" class="skeleton-row"></div>
      </div>

      <template v-else-if="schedules.length">
        <table class="schedule-table">
          <thead>
            <tr>
              <th>Schedule Name</th>
              <th>Groups</th>
              <th>Frequency</th>
              <th>Time</th>
              <th>Days Active</th>
              <th>Report Filters</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in schedules" :key="s._id">
              <td class="cell-name">{{ s.name }}</td>
              <td class="cell-groups">
                <template v-if="groupNames(s).length">
                  <span
                    v-for="name in groupNames(s)"
                    :key="name"
                    class="group-pill"
                    :title="name"
                  >
                    {{ name }}
                  </span>
                </template>
                <span v-else class="cell-muted">—</span>
              </td>
              <td>{{ scheduleFrequency(s) }}</td>
              <td class="cell-mono">{{ scheduleTime(s) }}</td>
              <td class="cell-days">{{ scheduleDays(s) }}</td>
              <td class="cell-filters" :title="filterSummary(s)">{{ filterSummary(s) }}</td>
              <td>
                <button
                  type="button"
                  class="toggle-switch"
                  :class="{ active: s.isRunning }"
                  :title="s.isRunning ? 'Deactivate' : 'Activate'"
                  @click="emit('toggle', s)"
                >
                  <span class="toggle-thumb"></span>
                </button>
              </td>
              <td class="cell-actions">
                <button type="button" class="btn-icon edit" @click="emit('edit', s)" title="Edit">
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="btn-icon delete"
                  @click="confirmDelete(s._id)"
                  title="Delete"
                >
                  <svg viewBox="0 0 16 16" fill="none">
                    <path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                  </svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <div v-else class="empty-state">
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#e2e8f0" stroke-width="2" />
          <path d="M24 16v8l4 3" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p>No schedules found.</p>
        <button type="button" class="btn-create" @click="emit('create')">
          + Create your first schedule
        </button>
      </div>
    </div>

    <!-- Delete confirmation dialog -->
    <div v-if="pendingDeleteId" class="confirm-overlay" @click.self="pendingDeleteId = null">
      <div class="confirm-dialog">
        <h3>Delete Schedule?</h3>
        <p>This will permanently remove the schedule. This action cannot be undone.</p>
        <div class="confirm-actions">
          <button type="button" class="btn-cancel" @click="pendingDeleteId = null">Cancel</button>
          <button type="button" class="btn-confirm-delete" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.schedule-section {
  margin-bottom: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);
  margin: 0;
}

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: var(--rf-accent, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.4375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    background: var(--rf-accent-hover, #1d4ed8);
  }
}

.table-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--rf-surface-shadow);
}

.schedule-table {
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
    white-space: nowrap;
  }

  tbody tr {
    border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
    transition: background-color 0.1s ease;

    &:last-child { border-bottom: none; }
    &:hover { background: var(--rf-accent-light, #eff6ff); }
  }

  td {
    padding: 0.875rem 1rem;
    color: var(--rf-text-primary, #1e293b);
    vertical-align: middle;

    &.cell-name { font-weight: 500; }
    &.cell-mono { font-variant-numeric: tabular-nums; }
    &.cell-days { color: var(--rf-text-secondary); font-size: 0.75rem; }
    &.cell-filters {
      color: var(--rf-text-secondary);
      font-size: 0.75rem;
      max-width: 12rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &.cell-actions { display: flex; gap: 0.375rem; align-items: center; }
  }
}

.cell-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  max-width: 14rem;
}

.cell-muted {
  color: var(--rf-text-muted, #94a3b8);
}

.group-pill {
  display: inline-block;
  max-width: 10rem;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  background: var(--rf-info-light, #eff6ff);
  color: var(--rf-info, #3b82f6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.toggle-switch {
  width: 2.5rem;
  height: 1.375rem;
  border-radius: 9999px;
  background: var(--rf-surface-border, #e2e8f0);
  border: none;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  padding: 0;

  &.active {
    background: var(--rf-success, #10b981);
  }

  .toggle-thumb {
    position: absolute;
    top: 0.1875rem;
    left: 0.1875rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &.active .toggle-thumb {
    transform: translateX(1.125rem);
  }
}

.btn-icon {
  width: 1.875rem;
  height: 1.875rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;

  svg { width: 0.9375rem; height: 0.9375rem; }

  &.edit {
    color: var(--rf-text-secondary);
    &:hover { border-color: var(--rf-accent); color: var(--rf-accent); background: var(--rf-accent-light); }
  }

  &.delete {
    color: var(--rf-text-secondary);
    &:hover { border-color: var(--rf-error); color: var(--rf-error); background: var(--rf-error-light); }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3.5rem 2rem;
  color: var(--rf-text-muted);

  svg { width: 3rem; height: 3rem; }
  p { margin: 0; font-size: 0.9375rem; }
}

.skeleton-rows {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton-row {
  height: 3rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 0.375rem;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-dialog {
  background: #fff;
  border-radius: 0.75rem;
  padding: 1.75rem;
  max-width: 24rem;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  h3 { margin: 0 0 0.5rem; font-size: 1.0625rem; color: var(--rf-text-primary); }
  p { margin: 0 0 1.25rem; font-size: 0.875rem; color: var(--rf-text-secondary); }
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
  background: transparent;
  cursor: pointer;

  &:hover { border-color: var(--rf-text-secondary); color: var(--rf-text-primary); }
}

.btn-confirm-delete {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--rf-error);
  color: #fff;
  cursor: pointer;

  &:hover { background: #dc2626; }
}
</style>
