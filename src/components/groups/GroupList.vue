<script setup>
import { ref } from 'vue';

const props = defineProps({
  groups: { type: Array, required: true },
  loading: { type: Boolean, default: false },
});

const emit = defineEmits(['register', 'edit', 'delete', 'toggle']);

const pendingDeleteId = ref(null);

const confirmDelete = (id) => (pendingDeleteId.value = id);
const doDelete = () => {
  if (pendingDeleteId.value) {
    emit('delete', pendingDeleteId.value);
    pendingDeleteId.value = null;
  }
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
</script>

<template>
  <div class="groups-section">
    <div class="section-header">
      <h2 class="section-title">Registered Groups</h2>
      <button type="button" class="btn-register" @click="emit('register')">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        Register Group
      </button>
    </div>

    <div class="table-card">
      <div v-if="loading" class="skeleton-rows">
        <div v-for="i in 4" :key="i" class="skeleton-row"></div>
      </div>

      <template v-else-if="groups.length">
        <div class="table-wrap">
          <table class="groups-table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>WhatsApp Group ID</th>
                <th>State</th>
                <th>Region</th>
                <th>Manager</th>
                <th>Report Types</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="g in groups" :key="g._id">
                <td class="cell-name">{{ g.name }}</td>
                <td class="cell-id">{{ g.chatId }}</td>
                <td>{{ g.state || '—' }}</td>
                <td>
                  <span v-if="g.region" class="region-tag" :class="g.region.toLowerCase()">
                    {{ g.region }}
                  </span>
                  <span v-else>—</span>
                </td>
                <td>{{ g.manager || '—' }}</td>
                <td>
                  <span
                    v-for="rt in g.reportTypes || []"
                    :key="rt"
                    class="report-tag"
                  >{{ rt }}</span>
                  <span v-if="!g.reportTypes?.length">—</span>
                </td>
                <td>
                  <button
                    type="button"
                    class="toggle-switch"
                    :class="{ active: g.isActive }"
                    :title="g.isActive ? 'Deactivate' : 'Activate'"
                    @click="emit('toggle', g)"
                  >
                    <span class="toggle-thumb"></span>
                  </button>
                </td>
                <td class="cell-muted">{{ fmtDate(g.createdAt) }}</td>
                <td class="cell-actions">
                  <button type="button" class="btn-icon edit" title="Edit" @click="emit('edit', g)">
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M11 2l3 3-9 9H2v-3L11 2z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round" />
                    </svg>
                  </button>
                  <button type="button" class="btn-icon delete" title="Delete" @click="confirmDelete(g._id)">
                    <svg viewBox="0 0 16 16" fill="none">
                      <path d="M3 5h10M6 5V3h4v2M7 8v4M9 8v4M4 5l1 9h6l1-9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <div v-else class="empty-state">
        <svg viewBox="0 0 48 48" fill="none">
          <circle cx="18" cy="16" r="7" stroke="#e2e8f0" stroke-width="2" />
          <path d="M4 40c0-7.732 6.268-14 14-14" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
          <circle cx="32" cy="18" r="5.5" stroke="#e2e8f0" stroke-width="2" />
          <path d="M24 40c0-5.523 3.582-10 8-10s8 4.477 8 10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round" />
        </svg>
        <p>No groups registered yet.</p>
        <button type="button" class="btn-register" @click="emit('register')">
          + Register your first group
        </button>
      </div>
    </div>

    <!-- Delete confirmation -->
    <div v-if="pendingDeleteId" class="confirm-overlay" @click.self="pendingDeleteId = null">
      <div class="confirm-dialog">
        <h3>Delete Group?</h3>
        <p>This will permanently remove this WhatsApp group from receiving reports. Associated schedules will also be affected.</p>
        <div class="confirm-actions">
          <button type="button" class="btn-cancel" @click="pendingDeleteId = null">Cancel</button>
          <button type="button" class="btn-confirm-delete" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.groups-section { margin-bottom: 1.5rem; }

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: var(--rf-text-primary, #1e293b);
  margin: 0;
  letter-spacing: -0.01em;
}

.btn-register {
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

  svg { width: 0.9375rem; height: 0.9375rem; }
  &:hover { background: var(--rf-accent-hover, #1d4ed8); }
}

.table-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--rf-surface-shadow);
}

.table-wrap { overflow-x: auto; }

.groups-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  thead {
    background: var(--rf-page-bg, #f1f5f9);
    border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
  }

  th {
    padding: 0.625rem 0.875rem;
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
    padding: 0.75rem 0.875rem;
    color: var(--rf-text-primary, #1e293b);
    vertical-align: middle;
    user-select: text;

    &.cell-name { font-weight: 500; }
    &.cell-id { font-size: 0.6875rem; color: var(--rf-text-secondary); font-family: monospace; }
    &.cell-muted { color: var(--rf-text-muted); font-size: 0.75rem; }
    &.cell-actions { display: flex; gap: 0.375rem; }
  }
}

.region-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  &.north { background: #dbeafe; color: #1d4ed8; }
  &.south { background: #fde68a; color: #92400e; }
  &.east { background: #ede9fe; color: #6d28d9; }
  &.west { background: #d1fae5; color: #065f46; }
}

.report-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  background: var(--rf-info-light, #eff6ff);
  color: var(--rf-info, #3b82f6);
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

  &.active { background: var(--rf-success, #10b981); }

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

  &.active .toggle-thumb { transform: translateX(1.125rem); }
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
  &.edit { color: var(--rf-text-secondary); &:hover { border-color: var(--rf-accent); color: var(--rf-accent); background: var(--rf-accent-light); } }
  &.delete { color: var(--rf-text-secondary); &:hover { border-color: var(--rf-error); color: var(--rf-error); background: var(--rf-error-light); } }
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

.skeleton-rows { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.skeleton-row {
  height: 3rem;
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  border-radius: 0.375rem;
  animation: shimmer 1.2s infinite;
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

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
  max-width: 26rem;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  h3 { margin: 0 0 0.5rem; font-size: 1.0625rem; color: var(--rf-text-primary); }
  p { margin: 0 0 1.25rem; font-size: 0.875rem; color: var(--rf-text-secondary); }
}
.confirm-actions { display: flex; justify-content: flex-end; gap: 0.625rem; }
.btn-cancel {
  padding: 0.5rem 1rem; border: 1px solid var(--rf-surface-border); border-radius: 0.375rem;
  font-size: 0.875rem; font-weight: 500; color: var(--rf-text-secondary); background: transparent; cursor: pointer;
  &:hover { border-color: var(--rf-text-secondary); color: var(--rf-text-primary); }
}
.btn-confirm-delete {
  padding: 0.5rem 1rem; border: none; border-radius: 0.375rem;
  font-size: 0.875rem; font-weight: 600; background: var(--rf-error); color: #fff; cursor: pointer;
  &:hover { background: #dc2626; }
}
</style>
