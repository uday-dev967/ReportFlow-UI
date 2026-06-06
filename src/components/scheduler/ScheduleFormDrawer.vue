<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { buildCron, parseCron, DAY_LABELS, PRESET_CRONS } from '@/utils/cronUtils.js';
import { fetchGroups, fetchDashboardFilters } from '@/network/automation.service.js';
import BasicPopup from '@/components/sharedComponents/BasicPopup.vue';
import ODropdown from '@/components/sharedComponents/ODropdown.vue';

const props = defineProps({
  schedule: { type: Object, default: null },
});

const emit = defineEmits(['save', 'cancel']);

const groups = ref([]);
const groupsLoading = ref(false);
const filterOptions = ref({
  states: [],
  regions: [],
  managers: [],
  reportTypes: ['Productivity Report'],
  dateRanges: [],
});
const errors = reactive({});

const form = reactive({
  name: '',
  reportType: 'Productivity Report',
  groupIds: [],
  frequency: 'preset',
  presetCron: PRESET_CRONS[5].value,
  time: '09:00',
  days: [1, 2, 3, 4, 5],
  customCron: '',
  activeFrom: '',
  activeUntil: '',
  filterStates: [],
  filterRegions: [],
  filterManagers: [],
  filterDateRange: 'last30days',
  filterDateFrom: '',
  filterDateTo: '',
});

const groupItems = computed(() =>
  groups.value.map((g) => ({ text: g.name, value: g._id })),
);

const dateRangeItems = computed(() => {
  if (filterOptions.value.dateRanges?.length) return filterOptions.value.dateRanges;
  return [{ label: 'Last 30 Days', value: 'last30days' }];
});

const populate = (s) => {
  if (!s) {
    form.name = '';
    form.groupIds = [];
    form.frequency = 'preset';
    form.presetCron = PRESET_CRONS[5].value;
    form.time = '09:00';
    form.days = [1, 2, 3, 4, 5];
    form.customCron = '';
    form.activeFrom = '';
    form.activeUntil = '';
    form.reportType = filterOptions.value.reportTypes?.[0] || 'Productivity Report';
    form.filterStates = [];
    form.filterRegions = [];
    form.filterManagers = [];
    form.filterDateRange = 'last30days';
    form.filterDateFrom = '';
    form.filterDateTo = '';
    return;
  }
  const parsed = parseCron(s.cron);
  form.name = s.name || '';
  form.reportType = s.filters?.reportType || filterOptions.value.reportTypes?.[0] || 'Productivity Report';
  form.groupIds = (s.groups?.length ? s.groups : s.group ? [s.group] : []).map((g) =>
    typeof g === 'object' ? g._id : g,
  );
  form.frequency = parsed.frequency;
  form.presetCron = parsed.presetCron || PRESET_CRONS[5].value;
  form.time = parsed.time || '09:00';
  form.days = parsed.days?.length ? [...parsed.days] : [1, 2, 3, 4, 5];
  form.customCron = parsed.customCron || '';
  form.activeFrom = '';
  form.activeUntil = '';
  form.filterStates = s.filters?.states ? [...s.filters.states] : [];
  form.filterRegions = s.filters?.regions ? [...s.filters.regions] : [];
  form.filterManagers = s.filters?.managers ? [...s.filters.managers] : [];
  form.filterDateRange = s.filters?.dateRange || 'last30days';
  form.filterDateFrom = s.filters?.startDate || '';
  form.filterDateTo = s.filters?.endDate || '';
};

watch(() => props.schedule, populate, { immediate: true });

onMounted(async () => {
  groupsLoading.value = true;
  const [groupsRes, filtersRes] = await Promise.all([fetchGroups(), fetchDashboardFilters()]);
  groupsLoading.value = false;
  if (groupsRes.ok) groups.value = groupsRes.data.groups || [];
  if (filtersRes.ok) {
    filterOptions.value = {
      states: filtersRes.data.states || [],
      regions: filtersRes.data.regions || [],
      managers: filtersRes.data.managers || [],
      reportTypes: filtersRes.data.reportTypes || ['Productivity Report'],
      dateRanges: filtersRes.data.dateRanges || [],
    };
    if (!props.schedule) {
      form.reportType = filterOptions.value.reportTypes[0] || 'Productivity Report';
    }
  }
});

const toggleDay = (d) => {
  const idx = form.days.indexOf(d);
  if (idx === -1) form.days.push(d);
  else form.days.splice(idx, 1);
};

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.name.trim()) errors.name = 'Schedule name is required';
  if (!form.groupIds.length) errors.groupIds = 'Select at least one group';
  if (form.frequency === 'preset' && !form.presetCron) errors.presetCron = 'Select an interval';
  if (form.frequency === 'weekly' && !form.days.length) errors.days = 'Select at least one day';
  if (form.frequency === 'custom' && !form.customCron.trim()) errors.customCron = 'Enter a cron expression';
  if (['daily', 'weekly'].includes(form.frequency) && !form.time) errors.time = 'Time is required';
  return !Object.keys(errors).length;
};

const handleSave = () => {
  if (!validate()) return;
  const cron = buildCron({
    frequency: form.frequency,
    time: form.time,
    days: form.days,
    customCron: form.customCron,
    presetCron: form.presetCron,
  });
  emit('save', {
    name: form.name.trim(),
    groupIds: [...form.groupIds],
    cron,
    timezone: 'Asia/Kolkata',
    isActive: true,
    filters: {
      states: [...form.filterStates],
      regions: [...form.filterRegions],
      managers: [...form.filterManagers],
      reportType: form.reportType,
      dateRange: form.filterDateRange,
      startDate: form.filterDateFrom || '',
      endDate: form.filterDateTo || '',
    },
  });
};
</script>

<template>
  <BasicPopup max-width="52rem"  @popup-outside-click="emit('cancel')">
    <div class="schedule-modal">
      <div class="modal-header">
        <div class="header-text">
          <h2>{{ schedule ? 'Edit Schedule' : 'Create Schedule' }}</h2>
          <p>Configure report delivery, filters, and timing</p>
        </div>
        <button type="button" class="close-btn" aria-label="Close" @click="emit('cancel')">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <section class="form-section">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <rect x="3" y="4" width="14" height="12" rx="2" stroke="currentColor" stroke-width="1.5" />
                <path d="M7 8h6M7 11h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>
            Basic Details
          </h3>
          <div class="section-content">
            <div class="field-group" :class="{ error: errors.name }">
              <label class="field-label">Schedule Name <span class="required">*</span></label>
              <input
                v-model="form.name"
                type="text"
                class="rf-input"
                placeholder="e.g. Daily North Region Report"
              />
              <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
            </div>

            <div class="fields-row">
              <div class="field-group">
                <label class="field-label">Report Type</label>
                <div class="field-control">
                  <ODropdown
                    :items="filterOptions.reportTypes"
                    :model-value="form.reportType"
                    button-text="Select report type"
                    button-width="100%"
                    @update:model-value="form.reportType = $event"
                  />
                </div>
              </div>

              <div class="field-group" :class="{ error: errors.groupIds }">
                <label class="field-label">Target Groups <span class="required">*</span></label>
                <div v-if="!groupsLoading && groups.length" class="field-control">
                  <ODropdown
                    :items="groupItems"
                    :model-value="form.groupIds"
                    item-text="text"
                    item-value="value"
                    multiple
                    button-text="Select groups"
                    button-width="100%"
                    no-data-text="No groups available"
                    @update:model-value="form.groupIds = $event"
                  />
                </div>
                <div v-else-if="groupsLoading" class="field-hint">Loading groups…</div>
                <div v-else class="field-hint">No registered groups found</div>
                <span v-if="errors.groupIds" class="field-error">{{ errors.groupIds }}</span>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M4 6h12M4 10h8M4 14h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>
            Report Filters
          </h3>
          <div class="section-content">
            <div class="field-group">
              <label class="field-label">Date Range Preset</label>
              <div class="field-control">
                <ODropdown
                  :items="dateRangeItems"
                  :model-value="form.filterDateRange"
                  item-text="label"
                  item-value="value"
                  button-text="Select date range"
                  button-width="100%"
                  @update:model-value="form.filterDateRange = $event"
                />
              </div>
            </div>

            <div class="fields-row">
              <div class="field-group">
                <label class="field-label">Date From</label>
                <input v-model="form.filterDateFrom" type="date" class="rf-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Date To</label>
                <input v-model="form.filterDateTo" type="date" class="rf-input" />
              </div>
            </div>

            <div class="fields-row fields-row-3">
              <div class="field-group">
                <label class="field-label">States</label>
                <div class="field-control">
                  <ODropdown
                    :items="filterOptions.states"
                    :model-value="form.filterStates"
                    multiple
                    button-text="All States"
                    button-width="100%"
                    @update:model-value="form.filterStates = $event"
                  />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Regions</label>
                <div class="field-control">
                  <ODropdown
                    :items="filterOptions.regions"
                    :model-value="form.filterRegions"
                    multiple
                    button-text="All Regions"
                    button-width="100%"
                    @update:model-value="form.filterRegions = $event"
                  />
                </div>
              </div>
              <div class="field-group">
                <label class="field-label">Managers</label>
                <div class="field-control">
                  <ODropdown
                    :items="filterOptions.managers"
                    :model-value="form.filterManagers"
                    multiple
                    button-text="All Managers"
                    button-width="100%"
                    @update:model-value="form.filterManagers = $event"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="form-section">
          <h3 class="section-title">
            <span class="section-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5" />
                <path d="M10 6v4l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </span>
            Schedule Timing
          </h3>
          <div class="section-content">
            <div class="field-group">
              <label class="field-label">Frequency <span class="required">*</span></label>
              <div class="freq-pills">
                <button
                  v-for="opt in [
                    { value: 'preset', label: 'Preset' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'custom', label: 'Custom' },
                  ]"
                  :key="opt.value"
                  type="button"
                  class="freq-pill"
                  :class="{ active: form.frequency === opt.value }"
                  @click="form.frequency = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <div v-if="form.frequency === 'preset'" class="field-group" :class="{ error: errors.presetCron }">
              <label class="field-label">Interval <span class="required">*</span></label>
              <div class="field-control">
                <ODropdown
                  :items="PRESET_CRONS"
                  :model-value="form.presetCron"
                  item-text="label"
                  item-value="value"
                  button-text="Select interval"
                  button-width="100%"
                  @update:model-value="form.presetCron = $event"
                />
              </div>
              <span v-if="errors.presetCron" class="field-error">{{ errors.presetCron }}</span>
            </div>

            <div
              v-if="form.frequency === 'daily' || form.frequency === 'weekly'"
              class="fields-row"
            >
              <div class="field-group" :class="{ error: errors.time }">
                <label class="field-label">Time <span class="required">*</span></label>
                <input v-model="form.time" type="time" class="rf-input rf-input-sm" />
                <span v-if="errors.time" class="field-error">{{ errors.time }}</span>
              </div>
            </div>

            <div v-if="form.frequency === 'weekly'" class="field-group" :class="{ error: errors.days }">
              <label class="field-label">Days of Week <span class="required">*</span></label>
              <div class="days-grid">
                <button
                  v-for="(label, idx) in DAY_LABELS"
                  :key="idx"
                  type="button"
                  class="day-btn"
                  :class="{ selected: form.days.includes(idx) }"
                  @click="toggleDay(idx)"
                >
                  {{ label }}
                </button>
              </div>
              <span v-if="errors.days" class="field-error">{{ errors.days }}</span>
            </div>

            <div v-if="form.frequency === 'custom'" class="field-group" :class="{ error: errors.customCron }">
              <label class="field-label">Cron Expression <span class="required">*</span></label>
              <input
                v-model="form.customCron"
                type="text"
                class="rf-input"
                placeholder="e.g. 0 9 * * 1-5"
              />
              <span class="field-hint">Format: Minute Hour DayOfMonth Month DayOfWeek</span>
              <span v-if="errors.customCron" class="field-error">{{ errors.customCron }}</span>
            </div>

            <div class="fields-row">
              <div class="field-group">
                <label class="field-label">Active From</label>
                <input v-model="form.activeFrom" type="date" class="rf-input" />
              </div>
              <div class="field-group">
                <label class="field-label">Active Until <span class="optional">(optional)</span></label>
                <input v-model="form.activeUntil" type="date" class="rf-input" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn-ghost" @click="emit('cancel')">Cancel</button>
        <button type="button" class="btn-primary" @click="handleSave">
          {{ schedule ? 'Save Changes' : 'Create Schedule' }}
        </button>
      </div>
    </div>
  </BasicPopup>
</template>

<style lang="scss" scoped>
.schedule-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.375rem 1.5rem;
  border-bottom: 1px solid var(--rf-surface-border);
  flex-shrink: 0;
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);

  h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--rf-text-primary);
    letter-spacing: -0.01em;
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--rf-text-secondary);
  }
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rf-text-secondary);
  flex-shrink: 0;
  transition: all 0.15s ease;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    background: var(--rf-page-bg);
    color: var(--rf-text-primary);
  }
}

.modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(90vh - 8.75rem);
  -webkit-overflow-scrolling: touch;
}

.form-section {
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.75rem;
  overflow: visible;
  background: #fff;
  flex-shrink: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  padding: 0.75rem 1rem;
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--rf-text-primary);
  background: var(--rf-page-bg);
  border-bottom: 1px solid var(--rf-surface-border);
}

.section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.375rem;
  background: var(--rf-accent-light);
  color: var(--rf-accent);

  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
}

.section-content {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;

  &.error .field-control :deep(.dropdown-button),
  &.error .rf-input {
    border-color: var(--rf-error);
  }
}

.field-control {
  width: 100%;
  min-width: 0;

  :deep(.dropdown-container) {
    width: 100%;
  }

  :deep(.dropdown-button) {
    width: 100% !important;
    max-width: 100%;
    height: var(--rf-control-height, 2.5rem) !important;
    min-height: var(--rf-control-height, 2.5rem) !important;
    max-height: var(--rf-control-height, 2.5rem) !important;
  }
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary);

  .required {
    color: var(--rf-error);
  }

  .optional {
    font-weight: 400;
    color: var(--rf-text-muted);
  }
}

.rf-input,
.rf-select {
  height: var(--rf-control-height, 2.5rem);
  padding: 0 0.75rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  box-sizing: border-box;
  color: var(--rf-text-primary);
  background: #fff;
  outline: none;
  width: 100%;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus {
    border-color: var(--rf-accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &.rf-input-sm {
    max-width: 10rem;
  }
}

.field-error {
  font-size: 0.75rem;
  color: var(--rf-error);
  font-weight: 500;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--rf-text-muted);
  margin: 0;
}

.freq-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.freq-pill {
  padding: 0.4375rem 0.875rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-secondary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &.active,
  &:hover {
    border-color: var(--rf-accent);
    color: var(--rf-accent);
    background: var(--rf-accent-light);
  }

  &.active {
    background: var(--rf-accent);
    border-color: var(--rf-accent);
    color: #fff;
  }
}

.days-grid {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.day-btn {
  width: 2.75rem;
  height: 2.375rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rf-text-secondary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &.selected {
    background: var(--rf-accent);
    border-color: var(--rf-accent);
    color: #fff;
  }

  &:not(.selected):hover {
    border-color: var(--rf-accent);
    color: var(--rf-accent);
  }
}

.fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}

.fields-row-3 {
  grid-template-columns: repeat(3, 1fr);
}

@media (max-width: 640px) {
  .fields-row,
  .fields-row-3 {
    grid-template-columns: 1fr;
  }
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--rf-surface-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  flex-shrink: 0;
  background: #f8fafc;
}

.btn-ghost {
  padding: 0.5625rem 1.125rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--rf-text-secondary);
    color: var(--rf-text-primary);
  }
}

.btn-primary {
  padding: 0.5625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--rf-accent);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--rf-accent-hover);
  }
}
</style>
