<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  data: { type: Array, required: true },
});

const search = ref('');
const sortKey = ref('');
const sortDir = ref('asc');
const currentPage = ref(1);
const PAGE_SIZE = 10;

const achievementClass = (pct) => {
  if (pct >= 90) return 'green';
  if (pct >= 70) return 'amber';
  return 'red';
};

const fmtCr = (v) =>
  `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Cr`;

const relTime = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const columns = [
  { key: 'state', label: 'State Name', sortable: true },
  { key: 'region', label: 'Region', sortable: true },
  { key: 'manager', label: 'Manager', sortable: true },
  { key: 'target', label: 'Target', sortable: true },
  { key: 'achievement', label: 'Achievement', sortable: true },
  { key: 'achievementPct', label: 'Achiev. %', sortable: true },
  { key: 'activeSKUs', label: 'Active SKUs', sortable: true },
  { key: 'ordersCount', label: 'Orders', sortable: true },
  { key: 'lastUpdated', label: 'Last Updated', sortable: true },
];

const setSort = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortDir.value = 'asc';
  }
  currentPage.value = 1;
};

const filtered = computed(() => {
  const q = search.value.toLowerCase();
  if (!q) return props.data;
  return props.data.filter(
    (r) =>
      r.state.toLowerCase().includes(q) ||
      r.region.toLowerCase().includes(q) ||
      r.manager.toLowerCase().includes(q),
  );
});

const sorted = computed(() => {
  if (!sortKey.value) return filtered.value;
  return [...filtered.value].sort((a, b) => {
    const va = a[sortKey.value];
    const vb = b[sortKey.value];
    let cmp = 0;
    if (typeof va === 'string') cmp = va.localeCompare(vb);
    else cmp = va - vb;
    return sortDir.value === 'asc' ? cmp : -cmp;
  });
});

const totalPages = computed(() => Math.ceil(sorted.value.length / PAGE_SIZE));
const paginated = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE;
  return sorted.value.slice(start, start + PAGE_SIZE);
});
const showingFrom = computed(() => (currentPage.value - 1) * PAGE_SIZE + 1);
const showingTo = computed(() =>
  Math.min(currentPage.value * PAGE_SIZE, sorted.value.length),
);

const visiblePages = computed(() => {
  const total = totalPages.value;
  const cur = currentPage.value;
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (cur <= 3) return [1, 2, 3, 4, '...', total];
  if (cur >= total - 2) return [1, '...', total - 3, total - 2, total - 1, total];
  return [1, '...', cur - 1, cur, cur + 1, '...', total];
});

const goPage = (p) => {
  if (typeof p === 'number') currentPage.value = p;
};
</script>

<template>
  <div class="table-card">
    <div class="table-toolbar">
      <div class="search-box">
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" stroke-width="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <input
          v-model="search"
          type="text"
          placeholder="Search by state, region or manager…"
          @input="currentPage = 1"
        />
      </div>
      <div class="table-info" v-if="sorted.length">
        Showing {{ showingFrom }}–{{ showingTo }} of {{ sorted.length }} entries
      </div>
    </div>

    <div class="table-wrap">
      <table class="sales-table">
        <thead>
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              :class="{ sortable: col.sortable, sorted: sortKey === col.key }"
              @click="col.sortable && setSort(col.key)"
            >
              {{ col.label }}
              <span v-if="col.sortable" class="sort-icon">
                <span
                  :class="[
                    'arrow',
                    sortKey === col.key ? (sortDir === 'asc' ? 'asc' : 'desc') : 'neutral',
                  ]"
                >
                  {{ sortKey === col.key ? (sortDir === 'asc' ? '↑' : '↓') : '↕' }}
                </span>
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in paginated" :key="row.id">
            <td class="cell-state">{{ row.state }}</td>
            <td>
              <span class="region-tag" :class="row.region.toLowerCase()">{{ row.region }}</span>
            </td>
            <td>{{ row.manager }}</td>
            <td class="cell-num">{{ fmtCr(row.target) }}</td>
            <td class="cell-num">{{ fmtCr(row.achievement) }}</td>
            <td>
              <span class="pct-badge" :class="achievementClass(row.achievementPct)">
                {{ row.achievementPct.toFixed(1) }}%
              </span>
            </td>
            <td class="cell-num">{{ row.activeSKUs.toLocaleString('en-IN') }}</td>
            <td class="cell-num">{{ row.ordersCount.toLocaleString('en-IN') }}</td>
            <td class="cell-muted">{{ relTime(row.lastUpdated) }}</td>
          </tr>
          <tr v-if="!paginated.length">
            <td colspan="9" class="empty-row">No data matches the current filters.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button
        class="page-btn"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        ← Prev
      </button>
      <template v-for="p in visiblePages" :key="p">
        <button
          v-if="p !== '...'"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <span v-else class="page-ellipsis">…</span>
      </template>
      <button
        class="page-btn"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Next →
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.table-card {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  box-shadow: var(--rf-surface-shadow);
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1.25rem;
  border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
  gap: 1rem;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--rf-page-bg, #f1f5f9);
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  padding: 0 0.625rem;
  height: 2rem;
  flex: 0 0 22rem;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
    color: var(--rf-text-muted, #94a3b8);
    flex-shrink: 0;
  }

  input {
    border: none;
    background: transparent;
    outline: none;
    font-size: 0.8125rem;
    color: var(--rf-text-primary, #1e293b);
    width: 100%;
    user-select: text;

    &::placeholder {
      color: var(--rf-text-muted, #94a3b8);
    }
  }
}

.table-info {
  font-size: 0.8125rem;
  color: var(--rf-text-secondary, #64748b);
}

.table-wrap {
  overflow-x: auto;
}

.sales-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;

  thead tr {
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
    user-select: none;

    &.sortable {
      cursor: pointer;

      &:hover {
        color: var(--rf-text-primary, #1e293b);
      }
    }

    &.sorted {
      color: var(--rf-accent, #2563eb);
    }
  }

  .sort-icon {
    margin-left: 0.25rem;
    opacity: 0.6;
    font-style: normal;

    .arrow.neutral {
      opacity: 0.35;
    }
  }

  tbody tr {
    border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
    transition: background-color 0.1s ease;

    &:last-child {
      border-bottom: none;
    }

    &:hover {
      background: var(--rf-accent-light, #eff6ff);
    }
  }

  td {
    padding: 0.625rem 0.875rem;
    color: var(--rf-text-primary, #1e293b);
    user-select: text;
    white-space: nowrap;

    &.cell-num {
      font-variant-numeric: tabular-nums;
    }

    &.cell-muted {
      color: var(--rf-text-muted, #94a3b8);
    }

    &.cell-state {
      font-weight: 500;
    }
  }
}

.region-tag {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;

  &.north {
    background: #dbeafe;
    color: #1d4ed8;
  }
  &.south {
    background: #fde68a;
    color: #92400e;
  }
  &.east {
    background: #ede9fe;
    color: #6d28d9;
  }
  &.west {
    background: #d1fae5;
    color: #065f46;
  }
}

.pct-badge {
  display: inline-block;
  padding: 0.1875rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;

  &.green {
    background: var(--rf-success-light, #ecfdf5);
    color: var(--rf-success, #10b981);
  }
  &.amber {
    background: var(--rf-warning-light, #fffbeb);
    color: #b45309;
  }
  &.red {
    background: var(--rf-error-light, #fef2f2);
    color: var(--rf-error, #ef4444);
  }
}

.empty-row {
  text-align: center;
  padding: 3rem;
  color: var(--rf-text-muted, #94a3b8);
  font-style: italic;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  padding: 0.875rem;
  border-top: 1px solid var(--rf-surface-border, #e2e8f0);
}

.page-btn {
  min-width: 2rem;
  height: 2rem;
  padding: 0 0.5rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: var(--rf-text-secondary, #64748b);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: var(--rf-accent, #2563eb);
    color: var(--rf-accent, #2563eb);
  }

  &.active {
    background: var(--rf-accent, #2563eb);
    border-color: var(--rf-accent, #2563eb);
    color: #fff;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

.page-ellipsis {
  color: var(--rf-text-muted, #94a3b8);
  padding: 0 0.25rem;
}
</style>
