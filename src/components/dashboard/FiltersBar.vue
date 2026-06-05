<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { ALL_STATES, ALL_REGIONS, MANAGERS, REPORT_TYPES } from '@/data/mockData.js';

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
const selectedReportType = ref(REPORT_TYPES[0]);
const stateDropdownOpen = ref(false);

const closeDropdownOnOutsideClick = (e) => {
  if (!e.target.closest('.state-filter')) stateDropdownOpen.value = false;
};

onMounted(() => document.addEventListener('click', closeDropdownOnOutsideClick));
onBeforeUnmount(() => document.removeEventListener('click', closeDropdownOnOutsideClick));

const stateLabel = computed(() => {
  if (!selectedStates.value.length) return 'All States';
  if (selectedStates.value.length === 1) return selectedStates.value[0];
  return `${selectedStates.value.length} states selected`;
});

const toggleState = (state) => {
  const idx = selectedStates.value.indexOf(state);
  if (idx === -1) selectedStates.value.push(state);
  else selectedStates.value.splice(idx, 1);
};

const handleApply = () => {
  stateDropdownOpen.value = false;
  emit('apply', {
    dateFrom: dateFrom.value,
    dateTo: dateTo.value,
    states: [...selectedStates.value],
    region: selectedRegion.value,
    manager: selectedManager.value,
    reportType: selectedReportType.value,
  });
};

const handleReset = () => {
  dateFrom.value = defaultDateFrom();
  dateTo.value = defaultDateTo();
  selectedStates.value = [];
  selectedRegion.value = '';
  selectedManager.value = '';
  selectedReportType.value = REPORT_TYPES[0];
  stateDropdownOpen.value = false;
  emit('reset');
};
</script>

<template>
  <div class="filters-bar">
    <div class="filters-row">
      <div class="filter-group">
        <label class="filter-label">Date From</label>
        <input type="date" v-model="dateFrom" class="filter-input" />
      </div>

      <div class="filter-group">
        <label class="filter-label">Date To</label>
        <input type="date" v-model="dateTo" class="filter-input" />
      </div>

      <div class="filter-group state-filter">
        <label class="filter-label">State</label>
        <div class="dropdown-wrapper">
          <button
            type="button"
            class="filter-select dropdown-trigger"
            @click="stateDropdownOpen = !stateDropdownOpen"
          >
            <span class="trigger-text">{{ stateLabel }}</span>
            <svg
              viewBox="0 0 16 16"
              fill="none"
              class="chevron"
              :class="{ rotated: stateDropdownOpen }"
            >
              <path
                d="M4 6l4 4 4-4"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <div v-if="stateDropdownOpen" class="state-dropdown">
            <label
              v-for="s in ALL_STATES"
              :key="s"
              class="state-option"
              :class="{ checked: selectedStates.includes(s) }"
            >
              <input
                type="checkbox"
                :value="s"
                :checked="selectedStates.includes(s)"
                @change="toggleState(s)"
              />
              {{ s }}
            </label>
          </div>
        </div>
      </div>

      <div class="filter-group">
        <label class="filter-label">Region</label>
        <select v-model="selectedRegion" class="filter-select">
          <option value="">All Regions</option>
          <option v-for="r in ALL_REGIONS" :key="r" :value="r">{{ r }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Manager</label>
        <select v-model="selectedManager" class="filter-select">
          <option value="">All Managers</option>
          <option v-for="m in MANAGERS" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label class="filter-label">Report Type</label>
        <select v-model="selectedReportType" class="filter-select">
          <option v-for="t in REPORT_TYPES" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>

      <div class="filter-actions">
        <button type="button" class="btn-apply" @click="handleApply">Apply Filters</button>
        <button type="button" class="btn-reset" @click="handleReset">Reset</button>
      </div>
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

.filters-row {
  display: flex;
  align-items: flex-end;
  gap: 0.875rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;

  &.state-filter {
    min-width: 10rem;
  }
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rf-text-secondary, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.filter-input,
.filter-select {
  height: 2.125rem;
  padding: 0 0.625rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  color: var(--rf-text-primary, #1e293b);
  background: #fff;
  outline: none;
  cursor: pointer;
  user-select: text;

  &:focus {
    border-color: var(--rf-accent, #2563eb);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
  }
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 10rem;
  cursor: pointer;

  .trigger-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
    text-align: left;
  }

  .chevron {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    transition: transform 0.15s ease;
    color: var(--rf-text-secondary);

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.state-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-height: 16rem;
  overflow-y: auto;
  min-width: 14rem;
  padding: 0.375rem;
}

.state-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  color: var(--rf-text-primary, #1e293b);
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    cursor: pointer;
    accent-color: var(--rf-accent, #2563eb);
  }

  &:hover,
  &.checked {
    background: var(--rf-accent-light, #eff6ff);
  }
}

.filter-actions {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  padding-bottom: 0;
  margin-left: auto;
}

.btn-apply {
  height: 2.125rem;
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
  height: 2.125rem;
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
</style>
