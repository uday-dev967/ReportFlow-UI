<script setup>
import { ref, reactive, watch, onMounted, computed } from 'vue';
import { buildCron, parseCron, DAY_LABELS, PRESET_CRONS } from '@/utils/cronUtils.js';
import { fetchGroups } from '@/network/automation.service.js';
import { REPORT_TYPES } from '@/data/mockData.js';

const props = defineProps({
  schedule: { type: Object, default: null },
});

const emit = defineEmits(['save', 'cancel']);

const groups = ref([]);
const groupsLoading = ref(false);
const errors = reactive({});

const form = reactive({
  name: '',
  reportType: REPORT_TYPES[0],
  groupIds: [],
  frequency: 'preset',
  presetCron: PRESET_CRONS[5].value, // default: Every 1 hour
  time: '09:00',
  days: [1, 2, 3, 4, 5],
  customCron: '',
  activeFrom: '',
  activeUntil: '',
});

const groupDropdownOpen = ref(false);

const selectedGroupLabels = computed(() => {
  if (!form.groupIds.length) return 'Select groups';
  if (form.groupIds.length === 1) {
    const g = groups.value.find((g) => g._id === form.groupIds[0]);
    return g?.name || '1 group selected';
  }
  return `${form.groupIds.length} groups selected`;
});

const toggleGroup = (id) => {
  const idx = form.groupIds.indexOf(id);
  if (idx === -1) form.groupIds.push(id);
  else form.groupIds.splice(idx, 1);
};

const toggleDay = (d) => {
  const idx = form.days.indexOf(d);
  if (idx === -1) form.days.push(d);
  else form.days.splice(idx, 1);
};

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
    return;
  }
  const parsed = parseCron(s.cron);
  form.name = s.name || '';
  form.reportType = REPORT_TYPES[0];
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
};

watch(() => props.schedule, populate, { immediate: true });

onMounted(async () => {
  groupsLoading.value = true;
  const res = await fetchGroups();
  groupsLoading.value = false;
  if (res.ok) groups.value = res.data.groups || [];
});

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
  });
};
</script>

<template>
  <div class="drawer-overlay" @click.self="emit('cancel')">
    <div class="drawer">
      <div class="drawer-header">
        <h2>{{ schedule ? 'Edit Schedule' : 'Create Schedule' }}</h2>
        <button type="button" class="close-btn" @click="emit('cancel')">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="drawer-body">
        <!-- Name -->
        <div class="field-group" :class="{ error: errors.name }">
          <label class="field-label">Schedule Name <span class="required">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="field-input"
            placeholder="e.g. Daily North Region Report"
          />
          <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
        </div>

        <!-- Report Type -->
        <div class="field-group">
          <label class="field-label">Report</label>
          <select v-model="form.reportType" class="field-input">
            <option v-for="t in REPORT_TYPES" :key="t" :value="t">{{ t }}</option>
          </select>
        </div>

        <!-- Target Groups -->
        <div class="field-group" :class="{ error: errors.groupIds }">
          <label class="field-label">Target Groups <span class="required">*</span></label>
          <div class="dropdown-wrapper">
            <button
              type="button"
              class="field-input dropdown-trigger"
              @click="groupDropdownOpen = !groupDropdownOpen"
            >
              <span class="trigger-text">{{ selectedGroupLabels }}</span>
              <svg viewBox="0 0 16 16" fill="none" class="chevron" :class="{ rotated: groupDropdownOpen }">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
            <div v-if="groupDropdownOpen" class="group-dropdown">
              <div v-if="groupsLoading" class="dropdown-loading">Loading groups…</div>
              <div v-else-if="!groups.length" class="dropdown-empty">No registered groups found</div>
              <label
                v-for="g in groups"
                :key="g._id"
                class="group-option"
                :class="{ checked: form.groupIds.includes(g._id) }"
              >
                <input
                  type="checkbox"
                  :checked="form.groupIds.includes(g._id)"
                  @change="toggleGroup(g._id)"
                />
                <span class="option-name">{{ g.name }}</span>
              </label>
            </div>
          </div>
          <span v-if="errors.groupIds" class="field-error">{{ errors.groupIds }}</span>
        </div>

        <!-- Frequency -->
        <div class="field-group">
          <label class="field-label">Frequency <span class="required">*</span></label>
          <div class="radio-group">
            <label class="radio-option">
              <input type="radio" v-model="form.frequency" value="preset" />
              Preset Interval
            </label>
            <label class="radio-option">
              <input type="radio" v-model="form.frequency" value="daily" />
              Daily
            </label>
            <label class="radio-option">
              <input type="radio" v-model="form.frequency" value="weekly" />
              Weekly
            </label>
            <label class="radio-option">
              <input type="radio" v-model="form.frequency" value="custom" />
              Custom Cron
            </label>
          </div>
        </div>

        <!-- Preset interval select -->
        <div v-if="form.frequency === 'preset'" class="field-group" :class="{ error: errors.presetCron }">
          <label class="field-label">Interval <span class="required">*</span></label>
          <select v-model="form.presetCron" class="field-input">
            <option v-for="p in PRESET_CRONS" :key="p.value" :value="p.value">
              {{ p.label }}
            </option>
          </select>
          <span v-if="errors.presetCron" class="field-error">{{ errors.presetCron }}</span>
        </div>

        <!-- Time picker (daily + weekly) -->
        <div
          v-if="form.frequency === 'daily' || form.frequency === 'weekly'"
          class="field-group"
          :class="{ error: errors.time }"
        >
          <label class="field-label">Time <span class="required">*</span></label>
          <input v-model="form.time" type="time" class="field-input field-input-sm" />
          <span v-if="errors.time" class="field-error">{{ errors.time }}</span>
        </div>

        <!-- Days of week (weekly only) -->
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

        <!-- Custom cron -->
        <div v-if="form.frequency === 'custom'" class="field-group" :class="{ error: errors.customCron }">
          <label class="field-label">Cron Expression <span class="required">*</span></label>
          <input
            v-model="form.customCron"
            type="text"
            class="field-input"
            placeholder="e.g. 0 9 * * 1-5"
          />
          <span class="field-hint">Format: Minute Hour DayOfMonth Month DayOfWeek</span>
          <span v-if="errors.customCron" class="field-error">{{ errors.customCron }}</span>
        </div>

        <!-- Active From / Until -->
        <div class="fields-row">
          <div class="field-group">
            <label class="field-label">Active From</label>
            <input v-model="form.activeFrom" type="date" class="field-input" />
          </div>
          <div class="field-group">
            <label class="field-label">Active Until <span class="optional">(optional)</span></label>
            <input v-model="form.activeUntil" type="date" class="field-input" />
          </div>
        </div>
      </div>

      <div class="drawer-footer">
        <button type="button" class="btn-cancel" @click="emit('cancel')">Cancel</button>
        <button type="button" class="btn-save" @click="handleSave">
          {{ schedule ? 'Save Changes' : 'Create Schedule' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: 300;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 28rem;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--rf-text-primary);
  }
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rf-text-secondary);

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    background: var(--rf-page-bg);
  }
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.125rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;

  &.error .field-input {
    border-color: var(--rf-error, #ef4444);
  }
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);

  .required {
    color: var(--rf-error);
    margin-left: 0.125rem;
  }

  .optional {
    font-weight: 400;
    color: var(--rf-text-muted);
  }
}

.field-input {
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--rf-text-primary, #1e293b);
  background: #fff;
  outline: none;
  user-select: text;

  &:focus {
    border-color: var(--rf-accent);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
  }

  &.field-input-sm {
    max-width: 9rem;
  }
}

.field-error {
  font-size: 0.75rem;
  color: var(--rf-error);
  font-weight: 500;
}

.field-hint {
  font-size: 0.6875rem;
  color: var(--rf-text-muted);
}

.dropdown-wrapper {
  position: relative;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;

  .trigger-text {
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chevron {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
    color: var(--rf-text-secondary);
    transition: transform 0.15s ease;

    &.rotated {
      transform: rotate(180deg);
    }
  }
}

.group-dropdown {
  position: absolute;
  top: calc(100% + 0.25rem);
  left: 0;
  right: 0;
  z-index: 100;
  background: #fff;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  max-height: 14rem;
  overflow-y: auto;
  padding: 0.375rem;
}

.group-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.25rem;
  cursor: pointer;
  user-select: none;

  input[type='checkbox'] {
    cursor: pointer;
    accent-color: var(--rf-accent);
  }

  .option-name {
    font-size: 0.8125rem;
    color: var(--rf-text-primary);
    font-weight: 500;
  }

  &.checked,
  &:hover {
    background: var(--rf-accent-light);
  }
}

.dropdown-loading,
.dropdown-empty {
  padding: 0.75rem;
  font-size: 0.8125rem;
  color: var(--rf-text-muted);
  text-align: center;
}

.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1.25rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--rf-text-primary);
  cursor: pointer;

  input[type='radio'] {
    accent-color: var(--rf-accent);
    cursor: pointer;
  }
}

.days-grid {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.day-btn {
  width: 2.625rem;
  height: 2.25rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rf-text-secondary);
  background: transparent;
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
  gap: 1rem;
}

.drawer-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--rf-surface-border);
  display: flex;
  justify-content: flex-end;
  gap: 0.625rem;
  flex-shrink: 0;
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

  &:hover {
    border-color: var(--rf-text-secondary);
    color: var(--rf-text-primary);
  }
}

.btn-save {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--rf-accent);
  color: #fff;
  cursor: pointer;

  &:hover {
    background: var(--rf-accent-hover);
  }
}
</style>
