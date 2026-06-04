<template>
  <div class="date-picker-wrapper" ref="datePickerRef">
    <VueDatePicker
      v-model="internalValue"
      :time-picker="isTimePicker"
      :enable-time-picker="isDateTimePicker"
      :auto-apply="autoApply"
      :range="range"
      :multi-dates="multiDates"
      :multi-dates-limit="multiDatesLimit"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled-dates="disabledDates"
      :disabled-week-days="disabledWeekDays"
      :year-range="yearRange"
      :time-picker-options="timePickerOptions"
      :format="datePickerFormat"
      :preview-format="previewFormat"
      :month-change-on-scroll="monthChangeOnScroll"
      :markers="markers"
      :highlight="highlight"
      :week-start="weekStart"
      :dark="dark"
      :locale="locale"
      :timezone="timezone"
      :hide-offset-dates="hideOffsetDates"
      :text-input="true"
      :close-on-auto-apply="closeOnAutoApply"
      :no-today="noToday"
      :no-hours-overlay="noHoursOverlay"
      :no-minutes-overlay="noMinutesOverlay"
      :no-seconds-overlay="noSecondsOverlay"
      :six-weeks="sixWeeks"
      :week-numbers="weekNumbers"
      :month-picker="monthPicker"
      :year-picker="yearPicker"
      :quarter-picker="quarterPicker"
      :select-text="selectText"
      :cancel-text="cancelText"
      :now-button-label="nowButtonLabel"
      :disabled="disabled"
      :readonly="readonly"
      :is-24="is24Hour"
      :enable-seconds="enableSeconds"
      :clearable="false"
      @update:model-value="handleDateChange"
      @closed="handlePickerClose"
      @open="handlePickerOpen"
      @cleared="handleClear"
    >
      <template #dp-input="slotProps">
        <OInput
          ref="inputRef"
          v-bind="inputProps"
          :modelValue="inputValue"
          :key="`input-${displayValue}`"
          :placeholder="placeholder"
          :label="label"
          :disabled="disabled"
          :readonly="readonly || !textInput"
          :rules="rules"
          :clearable="clearable"
          :hideDetails="hideDetails"
          :hint="hint"
          :loading="loading"
          :append-inner="!hideCalendarIcon"
          @update:modelValue="(val) => handleManualInput(val, slotProps.onInput)"
          @focus="slotProps.onFocus"
          @blur="slotProps.onBlur"
          @clear:click="
            () => {
              handleClear();
              slotProps.onClear && slotProps.onClear();
            }
          "
          @keydown.enter="slotProps.onEnter"
          @keydown.tab="slotProps.onTab"
          @keypress="slotProps.onKeypress"
          @paste="slotProps.onPaste"
          @click="!textInput && slotProps.openMenu ? slotProps.openMenu() : null"
        >
          <template v-if="!hideCalendarIcon || (clearable && internalValue)" #append-inner="{ props: appendProps }">
            <div class="icon-container">
              <!-- Clear icon - only show if clearable and has value -->
              <svg
                v-if="clearable && internalValue && !disabled && !readonly"
                class="clear-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                @click.stop="handleClear"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path
                  d="m15 9-6 6m0-6 6 6"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <!-- Calendar icon for date picker -->
              <svg
                v-if="!hideCalendarIcon && !isTimePicker"
                class="calendar-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                @click.stop="handleIconClick(slotProps)"
              >
                <path
                  d="M7 2V5M17 2V5M3 8H21M5 4H19C20.1046 4 21 4.89543 21 6V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V6C3 4.89543 3.89543 4 5 4Z"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 14H8.01M12 14H12.01M16 14H16.01M8 18H8.01M12 18H12.01M16 18H16.01"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>

              <!-- Time icon for time picker -->
              <svg
                v-if="!hideCalendarIcon && isTimePicker"
                class="calendar-icon"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                @click.stop="handleIconClick(slotProps)"
              >
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <polyline
                  points="12,6 12,12 16,14"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
          </template>
        </OInput>
      </template>
      <template v-if="$slots['date-picker-header']" #header>
        <slot name="date-picker-header"></slot>
      </template>
      <template v-if="$slots['date-picker-footer']" #action-buttons>
        <slot name="date-picker-footer"></slot>
      </template>
    </VueDatePicker>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue';
import VueDatePicker from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import moment from 'moment';
import OInput from './OInput.vue';

// Props
const props = defineProps({
  modelValue: {
    type: [Date, String, Array, Object, Number],
    default: null,
  },
  type: {
    type: String,
    default: 'date',
    validator: (value) => ['date', 'time', 'datetime'].includes(value),
  },
  format: {
    type: String,
    default: null, // Will be auto-set based on type if not provided
  },
  displayFormat: {
    type: String,
    default: null, // Uses moment.js format (DD for days, MM for months, YYYY for years)
  },
  outputFormat: {
    type: String,
    default: null, // Uses moment.js format - if provided, emits formatted strings instead of Date objects
  },
  range: {
    type: Boolean,
    default: false,
  },
  multiDates: {
    type: Boolean,
    default: false,
  },
  multiDatesLimit: {
    type: Number,
    default: null,
  },
  minDate: {
    type: [Date, String],
    default: null,
  },
  maxDate: {
    type: [Date, String],
    default: null,
  },
  disabledDates: {
    type: Array,
    default: () => [],
  },
  disabledWeekDays: {
    type: Array,
    default: () => [],
  },
  placeholder: {
    type: String,
    default: null, // Will be auto-set based on type if not provided
  },
  label: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  rules: {
    type: Array,
    default: () => [],
  },
  hideDetails: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  autoApply: {
    type: Boolean,
    default: true,
  },
  enableTimePicker: {
    type: Boolean,
    default: false,
  },
  timePickerOptions: {
    type: Object,
    default: () => ({}),
  },
  yearRange: {
    type: Array,
    default: () => {
      const currentYear = new Date().getFullYear();
      return [currentYear - 50, currentYear + 50];
    },
  },
  previewFormat: {
    type: String,
    default: null,
  },
  monthChangeOnScroll: {
    type: Boolean,
    default: true,
  },
  markers: {
    type: Array,
    default: () => [],
  },
  highlight: {
    type: [Array, Function],
    default: () => [],
  },
  weekStart: {
    type: [Number, String],
    default: 0,
  },
  dark: {
    type: Boolean,
    default: false,
  },
  locale: {
    type: String,
    default: 'en-US',
  },
  timezone: {
    type: String,
    default: null,
  },
  hideOffsetDates: {
    type: Boolean,
    default: false,
  },
  noToday: {
    type: Boolean,
    default: false,
  },
  noHoursOverlay: {
    type: Boolean,
    default: false,
  },
  noMinutesOverlay: {
    type: Boolean,
    default: false,
  },
  noSecondsOverlay: {
    type: Boolean,
    default: false,
  },
  sixWeeks: {
    type: Boolean,
    default: true,
  },
  weekNumbers: {
    type: [String, Function, Object],
    default: null,
  },
  monthPicker: {
    type: Boolean,
    default: false,
  },
  yearPicker: {
    type: Boolean,
    default: false,
  },
  quarterPicker: {
    type: Boolean,
    default: false,
  },
  hideCalendarIcon: {
    type: Boolean,
    default: false,
  },
  selectText: {
    type: String,
    default: 'Select',
  },
  cancelText: {
    type: String,
    default: 'Cancel',
  },
  nowButtonLabel: {
    type: String,
    default: 'Now',
  },
  textInput: {
    type: Boolean,
    default: false,
  },
  closeOnAutoApply: {
    type: Boolean,
    default: true,
  },
  is24Hour: {
    type: Boolean,
    default: true,
  },
  enableSeconds: {
    type: Boolean,
    default: false,
  },
});

// Emits
const emit = defineEmits(['update:modelValue', 'change', 'open', 'close', 'cleared']);

// Refs
const datePickerRef = ref(null);
const inputRef = ref(null);
const internalValue = ref(null);
const displayValue = ref('');

// Computed properties for picker type
const isTimePicker = computed(() => props.type === 'time');
const isDateTimePicker = computed(() => props.type === 'datetime');
const isDatePicker = computed(() => props.type === 'date');

// Auto-set format based on type if not provided
const defaultFormat = computed(() => {
  if (props.format) return props.format;

  switch (props.type) {
    case 'time':
      return 'HH:mm'; // Always use 24-hour format for internal processing
    case 'datetime':
      return 'dd/MM/yyyy HH:mm';
    case 'date':
    default:
      return 'dd/MM/yyyy';
  }
});

// Auto-set placeholder based on type if not provided
const defaultPlaceholder = computed(() => {
  if (props.placeholder) return props.placeholder;

  switch (props.type) {
    case 'time':
      return 'Select time';
    case 'datetime':
      return 'Select date and time';
    case 'date':
    default:
      return 'Select date';
  }
});

// Force reactivity for input
const inputValue = computed({
  get() {
    return displayValue.value;
  },
  set(value) {
    displayValue.value = value;
  },
});

// Computed properties
const inputProps = computed(() => {
  const excludeProps = [
    'modelValue',
    'type',
    'format',
    'displayFormat',
    'outputFormat',
    'range',
    'multiDates',
    'multiDatesLimit',
    'minDate',
    'maxDate',
    'disabledDates',
    'disabledWeekDays',
    'autoApply',
    'enableTimePicker',
    'timePickerOptions',
    'yearRange',
    'previewFormat',
    'monthChangeOnScroll',
    'markers',
    'highlight',
    'weekStart',
    'dark',
    'locale',
    'timezone',
    'hideOffsetDates',
    'noToday',
    'noHoursOverlay',
    'noMinutesOverlay',
    'noSecondsOverlay',
    'sixWeeks',
    'weekNumbers',
    'monthPicker',
    'yearPicker',
    'quarterPicker',
    'hideCalendarIcon',
    'selectText',
    'cancelText',
    'nowButtonLabel',
    'textInput',
    'closeOnAutoApply',
    'is24Hour',
    'enableSeconds',
  ];

  const inputPropsObj = {};
  Object.keys(props).forEach((key) => {
    if (!excludeProps.includes(key)) {
      inputPropsObj[key] = props[key];
    }
  });

  // Override placeholder with computed default
  inputPropsObj.placeholder = defaultPlaceholder.value;

  return inputPropsObj;
});

// Convert format from moment.js style to date-fns style (for VueDatePicker)
const convertMomentToDateFns = (momentFormat) => {
  return (
    momentFormat
      .replace(/YYYY/g, 'yyyy')
      .replace(/YY/g, 'yy')
      .replace(/DD/g, 'dd')
      .replace(/D/g, 'd')
      // MM and M stay the same
      .replace(/HH/g, 'HH')
      .replace(/H/g, 'H')
      .replace(/hh/g, 'hh')
      .replace(/h/g, 'h')
      .replace(/mm/g, 'mm')
      .replace(/m/g, 'm')
      .replace(/ss/g, 'ss')
      .replace(/s/g, 's')
      .replace(/A/g, 'aa') // Fix: Convert moment's A to date-fns aa
      .replace(/a/g, 'a')
  );
};

// For VueDatePicker - use date-fns format
const datePickerFormat = computed(() => convertMomentToDateFns(defaultFormat.value));
// For moment.js - ensure we use moment format
const momentDisplayFormat = computed(() => props.displayFormat || defaultFormat.value);
const momentOutputFormat = computed(() => props.outputFormat || null);

// Helper function to safely create moment object
const createMoment = (date) => {
  if (!date) return null;

  if (moment.isMoment(date)) return date;
  if (date instanceof Date) return moment(date);
  if (typeof date === 'string' || typeof date === 'number') return moment(date);

  return null;
};

// Helper function to format a single date with moment
const formatSingleDate = (date, format) => {
  const momentDate = createMoment(date);
  return momentDate && momentDate.isValid() ? momentDate.format(format) : '';
};

// Helper function to handle time values specifically
const formatTimeValue = (timeObj) => {
  if (!timeObj) return '';

  // Handle time object format from VueDatePicker
  if (typeof timeObj === 'object' && 'hours' in timeObj) {
    const hours = String(timeObj.hours || 0).padStart(2, '0');
    const minutes = String(timeObj.minutes || 0).padStart(2, '0');
    if (props.enableSeconds) {
      const seconds = String(timeObj.seconds || 0).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}`;
  }

  // Handle Date objects for time display
  if (timeObj instanceof Date) {
    return formatSingleDate(timeObj, momentDisplayFormat.value);
  }

  return String(timeObj);
};

// Helper function to format output value
const formatOutputValue = (value) => {
  if (!value) return null;

  // For time picker, handle time objects specially
  if (isTimePicker.value && typeof value === 'object' && 'hours' in value) {
    if (!momentOutputFormat.value) {
      // Convert time object to Date object for today's date
      const today = new Date();
      today.setHours(value.hours || 0);
      today.setMinutes(value.minutes || 0);
      today.setSeconds(value.seconds || 0);
      today.setMilliseconds(0);
      return today;
    } else {
      // Return formatted string
      return formatTimeValue(value);
    }
  }

  if (!momentOutputFormat.value) {
    // Return Date objects by default
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (isTimePicker.value && typeof v === 'object' && 'hours' in v) {
            const today = new Date();
            today.setHours(v.hours || 0);
            today.setMinutes(v.minutes || 0);
            today.setSeconds(v.seconds || 0);
            return today;
          }
          const momentDate = createMoment(v);
          return momentDate && momentDate.isValid() ? momentDate.toDate() : null;
        })
        .filter(Boolean);
    } else if (typeof value === 'object' && 'start' in value) {
      return {
        start: createMoment(value.start)?.toDate() || null,
        end: createMoment(value.end)?.toDate() || null,
      };
    } else {
      const momentDate = createMoment(value);
      return momentDate && momentDate.isValid() ? momentDate.toDate() : null;
    }
  }

  // Return formatted strings
  if (Array.isArray(value)) {
    return value
      .map((v) => {
        if (isTimePicker.value && typeof v === 'object' && 'hours' in v) {
          return formatTimeValue(v);
        }
        return formatSingleDate(v, momentOutputFormat.value);
      })
      .filter(Boolean);
  } else if (typeof value === 'object' && 'start' in value) {
    return {
      start: formatSingleDate(value.start, momentOutputFormat.value),
      end: formatSingleDate(value.end, momentOutputFormat.value),
    };
  } else {
    if (isTimePicker.value && typeof value === 'object' && 'hours' in value) {
      return formatTimeValue(value);
    }
    return formatSingleDate(value, momentOutputFormat.value);
  }
};

// Methods
const updateDisplayValue = () => {
  console.log('updateDisplayValue called with:', internalValue.value, 'type:', props.type);

  if (!internalValue.value) {
    displayValue.value = '';
    return;
  }

  const formatStr = momentDisplayFormat.value;

  // Handle time picker specifically
  if (isTimePicker.value) {
    displayValue.value = formatTimeValue(internalValue.value);
    console.log('Time formatted:', displayValue.value);
    return;
  }

  // For single date
  if (!props.range && !props.multiDates) {
    const formatted = formatSingleDate(internalValue.value, formatStr);
    console.log('Single date formatted:', formatted);
    displayValue.value = formatted;
    return;
  }

  // For range
  if (props.range && internalValue.value) {
    if (Array.isArray(internalValue.value) && internalValue.value.length === 2) {
      const start = isTimePicker.value
        ? formatTimeValue(internalValue.value[0])
        : formatSingleDate(internalValue.value[0], formatStr);
      const end = isTimePicker.value
        ? formatTimeValue(internalValue.value[1])
        : formatSingleDate(internalValue.value[1], formatStr);
      displayValue.value = start && end ? `${start} - ${end}` : start || end || '';
      console.log('Range formatted:', displayValue.value);
      return;
    }
    // Handle object format for ranges
    if (internalValue.value && typeof internalValue.value === 'object' && 'start' in internalValue.value) {
      const start = isTimePicker.value
        ? formatTimeValue(internalValue.value.start)
        : formatSingleDate(internalValue.value.start, formatStr);
      const end = isTimePicker.value
        ? formatTimeValue(internalValue.value.end)
        : formatSingleDate(internalValue.value.end, formatStr);
      displayValue.value = start && end ? `${start} - ${end}` : start || end || '';
      console.log('Range object formatted:', displayValue.value);
      return;
    }
  }

  // For multi-dates
  if (props.multiDates && Array.isArray(internalValue.value)) {
    const formattedDates = internalValue.value
      .map((d) => (isTimePicker.value ? formatTimeValue(d) : formatSingleDate(d, formatStr)))
      .filter(Boolean);
    displayValue.value = formattedDates.join(', ');
    console.log('Multi dates formatted:', displayValue.value);
    return;
  }

  displayValue.value = '';
};

const handleManualInput = (val, onInput) => {
  if (props.textInput && onInput) {
    onInput({ target: { value: val } });
  }
};

const handleIconClick = (slotProps) => {
  // Try multiple methods to open the menu
  if (slotProps.toggleMenu) {
    slotProps.toggleMenu();
  } else if (slotProps.openMenu) {
    slotProps.openMenu();
  } else if (slotProps.onMenuToggle) {
    slotProps.onMenuToggle();
  }

  // Also try to focus the input to ensure proper behavior
  if (inputRef.value && inputRef.value.$el) {
    const inputElement = inputRef.value.$el.querySelector('input');
    if (inputElement) {
      inputElement.focus();
    }
  }
};

const handleDateChange = (value) => {
  console.log('Raw date picker value:', value, 'type:', props.type);

  internalValue.value = value;
  updateDisplayValue();

  // Force input update immediately
  nextTick(() => {
    if (inputRef.value && inputRef.value.setInternalValue) {
      inputRef.value.setInternalValue(displayValue.value);
    }
  });

  const outputValue = formatOutputValue(value);
  console.log('Formatted output value:', outputValue);

  emit('update:modelValue', outputValue);
  emit('change', outputValue);
};

const handlePickerClose = () => {
  emit('close');
};

const handlePickerOpen = () => {
  emit('open');
};

const handleClear = () => {
  internalValue.value = null;
  displayValue.value = '';
  emit('update:modelValue', null);
  emit('change', null);
  emit('cleared');
};

// Watch modelValue changes
watch(
  () => props.modelValue,
  (newValue) => {
    console.log('ModelValue changed:', newValue, 'type:', props.type);
    internalValue.value = newValue;
    updateDisplayValue();
  },
  { immediate: true }
);

// Watch displayValue and sync with input
watch(
  displayValue,
  (newDisplayValue) => {
    console.log('Display value updated:', newDisplayValue);
    // Force update the input's internal value using nextTick to ensure DOM is updated
    nextTick(() => {
      if (inputRef.value && inputRef.value.setInternalValue) {
        inputRef.value.setInternalValue(newDisplayValue);
      }
    });
  },
  { immediate: true }
);

// Expose methods
defineExpose({
  validate: () => inputRef.value?.validate(),
  setInternalValue: (value) => {
    internalValue.value = value;
  },
  getMomentValue: () => {
    if (!internalValue.value) return null;

    if (Array.isArray(internalValue.value)) {
      return internalValue.value.map(createMoment).filter(Boolean);
    } else if (typeof internalValue.value === 'object' && 'start' in internalValue.value) {
      return {
        start: createMoment(internalValue.value.start),
        end: createMoment(internalValue.value.end),
      };
    } else {
      return createMoment(internalValue.value);
    }
  },
});
</script>

<style scoped lang="scss">
.date-picker-wrapper {
  width: 100%;
  position: relative;

  // Override vue3-datepicker styles to match your design system
  :deep(.dp__main) {
    font-family: inherit;
  }

  :deep(.dp__theme_light) {
    --dp-primary-color: #3b82f6;
    --dp-primary-text-color: #fff;
    --dp-hover-color: #f3f4f6;
    --dp-hover-text-color: #1f2937;
    --dp-hover-icon-color: #1f2937;
    --dp-border-color: #e5e7eb;
    --dp-menu-border-color: #e5e7eb;
  }

  :deep(.dp__theme_dark) {
    --dp-primary-color: #3b82f6;
    --dp-primary-text-color: #fff;
    --dp-hover-color: #374151;
    --dp-hover-text-color: #f3f4f6;
    --dp-hover-icon-color: #f3f4f6;
    --dp-border-color: #4b5563;
    --dp-menu-border-color: #4b5563;
  }

  // Hide VueDatePicker's default clear icon to prevent overlap
  :deep(.dp__clear_icon) {
    display: none !important;
  }
}

.icon-container {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 100%;
  padding-right: 4px;
}

.calendar-icon,
.clear-icon {
  width: 1.25rem;
  height: 1.25rem;
  cursor: pointer;
  color: #666;
  transition: color 0.2s ease;
  flex-shrink: 0;
  user-select: none;
  pointer-events: auto;

  &:hover {
    color: #333;
  }
}

.clear-icon {
  color: #999;

  &:hover {
    color: #666;
  }
}
</style>
