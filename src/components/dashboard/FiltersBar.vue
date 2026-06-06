<script setup>
import { ref, computed } from 'vue';
import ODropdown from '@/components/sharedComponents/ODropdown.vue';

const props = defineProps({
  filterOptions: {
    type: Object,
    default: () => ({
      states: [],
      regions: [],
      managers: [],
      reportTypes: ['Productivity Report'],
      dateRanges: [],
    }),
  },
});

const emit = defineEmits(['apply', 'reset']);

const defaultDateFrom = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
};
const defaultDateTo = () => new Date().toISOString().split('T')[0];

const dateFrom = ref(defaultDateFrom());
const dateTo = ref(defaultDateTo());
const selectedStates = ref([]);
const selectedRegion = ref('');
const selectedManager = ref('');
const selectedReportType = ref('Productivity Report');
const selectedDateRange = ref('last30days');

const dateRangeItems = computed(() => {
  if (props.filterOptions.dateRanges?.length) return props.filterOptions.dateRanges;
  return [{ label: 'Today', value: 'today' }];
});

const regionItems = computed(() => [
  { text: 'All Regions', value: '' },
  ...props.filterOptions.regions.map((r) => ({ text: r, value: r })),
]);

const managerItems = computed(() => [
  { text: 'All Managers', value: '' },
  ...props.filterOptions.managers.map((m) => ({ text: m, value: m })),
]);

const handleApply = () => {
  emit('apply', {
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    states: [...selectedStates.value],
    region: selectedRegion.value,
    manager: selectedManager.value,
    reportType: selectedReportType.value,
    dateRange: selectedDateRange.value,
  });
};

const handleReset = () => {
  dateFrom.value = defaultDateFrom();
  dateTo.value = defaultDateTo();
  selectedStates.value = [];
  selectedRegion.value = '';
  selectedManager.value = '';
  selectedReportType.value = props.filterOptions.reportTypes?.[0] || 'Productivity Report';
  selectedDateRange.value = 'last30days';
  emit('reset');
};
</script>

<template>
  <div class="filters-bar">
    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">Date From</label>
        <input type="date" v-model="dateFrom" class="filter-control" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Date To</label>
        <input type="date" v-model="dateTo" class="filter-control" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Date Range</label>
        <ODropdown
          :items="dateRangeItems"
          :model-value="selectedDateRange"
          item-text="label"
          item-value="value"
          button-text="Select range"
          @update:model-value="selectedDateRange = $event"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">State</label>
        <ODropdown
          :items="filterOptions.states"
          :model-value="selectedStates"
          multiple
          button-text="All States"
          @update:model-value="selectedStates = $event"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Region</label>
        <ODropdown
          :items="regionItems"
          :model-value="selectedRegion"
          item-text="text"
          item-value="value"
          button-text="All Regions"
          @update:model-value="selectedRegion = $event || ''"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Manager</label>
        <ODropdown
          :items="managerItems"
          :model-value="selectedManager"
          item-text="text"
          item-value="value"
          button-text="All Managers"
          @update:model-value="selectedManager = $event || ''"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">Report Type</label>
        <ODropdown
          :items="filterOptions.reportTypes"
          :model-value="selectedReportType"
          button-text="Select report"
          @update:model-value="selectedReportType = $event"
        />
      </div>
    </div>

    <div class="filter-actions">
      <button type="button" class="btn-apply" @click="handleApply">Apply Filters</button>
      <button type="button" class="btn-reset" @click="handleReset">Reset</button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filters-bar {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.25rem;
  box-shadow: var(--rf-surface-shadow);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.75rem 0.875rem;
  align-items: end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;
  min-width: 0;

  :deep(.dropdown-container) {
    width: 100%;
    min-width: 0;
  }
}

.filter-label {
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--rf-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

.filter-control {
  height: var(--rf-control-height, 2.5rem);
  padding: 0 0.625rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: var(--rf-text-primary, #1e293b);
  background: #fff;
  outline: none;
  cursor: pointer;
  user-select: text;
  width: 100%;
  box-sizing: border-box;

  &:focus {
    border-color: var(--rf-accent, #2563eb);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
  }
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 0.875rem;
  padding-top: 0.875rem;
  border-top: 1px solid var(--rf-surface-border);
}

.btn-apply {
  height: var(--rf-control-height, 2.5rem);
  padding: 0 1rem;
  background-color: var(--rf-accent, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: var(--rf-accent-hover, #1d4ed8);
  }
}

.btn-reset {
  height: var(--rf-control-height, 2.5rem);
  padding: 0 0.875rem;
  background-color: transparent;
  color: var(--rf-text-secondary, #64748b);
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--rf-text-secondary, #64748b);
    color: var(--rf-text-primary, #1e293b);
  }
}

@media (max-width: 1100px) {
  .filters-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 480px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
