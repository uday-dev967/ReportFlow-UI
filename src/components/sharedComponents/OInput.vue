<script setup>
// Import necessary Vue features
import { ref, useAttrs, watch } from 'vue';

// Define emitted events for the component
const emit = defineEmits([
  'prepend:click', // Event emitted when the prepend button is clicked
  'prependInner:click', // Event emitted when the inner prepend button is clicked
  'clear:click', // Event emitted when the clear button is clicked
  'append:click', // Event emitted when the append button is clicked
  'appendInner:click', // Event emitted when the inner append button is clicked
  'update:modelValue', // Event for v-model binding
  'validate', // Event emitted for validation results
  // Form events
  'focus', // Event emitted on input focus
  'blur', // Event emitted on input blur
  'input', // Event emitted on input change
  'change', // Event emitted on input change
  // Keyboard events
  'keydown', // Event emitted on key down
  'keyup', // Event emitted on key up
  'keypress', // Event emitted on key press
  // Mouse events
  'click', // Event emitted on mouse click
  'dblclick', // Event emitted on double click
  'mousedown', // Event emitted on mouse down
  'mouseup', // Event emitted on mouse up
  'mouseenter', // Event emitted on mouse enter
  'mouseleave', // Event emitted on mouse leave
  // Clipboard events
  'copy', // Event emitted on copy action
  'cut', // Event emitted on cut action
  'paste', // Event emitted on paste action
  // Composition events for languages with complex input
  'compositionstart', // Event emitted when composition starts
  'compositionupdate', // Event emitted during composition
  'compositionend', // Event emitted when composition ends
  // Drag events
  'dragenter', // Event emitted when dragging enters the component
  'dragover', // Event emitted when dragging over the component
  'dragleave', // Event emitted when dragging leaves the component
  'drop', // Event emitted when an item is dropped
  'parent:dragenter', // Event emitted when dragging enters the parent component
  'parent:dragover', // Event emitted when dragging over the parent component
  'parent:dragleave', // Event emitted when dragging leaves the parent component
  'parent:drop', // Event emitted when an item is dropped on the parent component
  'parent:paste', // Event emitted when pasting on the parent component
]);

// Define component props
const props = defineProps({
  prepend: { type: Boolean, required: false, default: false }, // Show prepend button
  prependInner: { type: Boolean, required: false, default: false }, // Show inner prepend button
  label: { type: String, required: false, default: '' }, // Label for the input
  appendInner: { type: Boolean, required: false, default: false }, // Show inner append button
  append: { type: Boolean, required: false, default: false }, // Show append button
  clearable: { type: Boolean, required: false, default: false }, // Allow clearing the input
  hideDetails: { type: Boolean, required: false, default: false }, // Hide validation details
  hint: { type: String, required: false }, // Hint message for the input
  loading: { type: Boolean, required: false, default: false }, // Show loading state
  disabled: { type: Boolean, required: false }, // Disable the input
  readonly: { type: Boolean, required: false }, // Make the input read-only
  placeholder: { type: String, required: false, default: '' }, // Placeholder text for the input
  type: { type: String, default: 'text', required: false }, // Input type (text, email, etc.)
  persistentDetails: { type: Boolean, required: false }, // Keep validation details visible
  modelValue: { type: [String, Number, Object, Array], required: false }, // v-model binding value
  value: [String, Number, Object, Array], // Alternative value prop
  rules: { type: Array, default: () => [], required: false }, // Validation rules
  hideSpinButtons: { type: Boolean, required: false },
});

// Use attributes passed to the component
const attrs = useAttrs();

// Internal state for the input value
const internalValue = ref(props.modelValue ?? props.value ?? '');
const internalType = ref(props.type);
// State for focus and validation
const focused = ref(false);
const error = ref(false);
const errorMessage = ref('');

// Watch for changes to modelValue or value, and set initial internal value
watch(
  () => props.modelValue ?? props.value ?? '',
  (newVal) => {
    internalValue.value = newVal;
  }
);

// Validation function to check input value against rules
const validate = () => {
  error.value = false; // Reset error state
  errorMessage.value = ''; // Reset error message

  // Check if the value is empty and validate required rule
  if (
    internalValue.value === '' ||
    internalValue.value === null ||
    internalValue.value === undefined ||
    (Array.isArray(internalValue.value) && internalValue.value.length === 0)
  ) {
    const requiredRule = props.rules.find((rule) => rule.rule === 'required');
    if (requiredRule && !handleStringRule('required', internalValue.value)) {
      error.value = true; // Set error state
      errorMessage.value = getDefaultErrorMessage('required'); // Set error message
      emit('validate', false, internalValue.value, errorMessage.value); // Emit validation result
      return;
    }
  } else {
    // Default validations based on input type
    if (props.type === 'email' && !handleStringRule('email', internalValue.value)) {
      error.value = true;
      errorMessage.value = getDefaultErrorMessage('email');
      emit('validate', false, internalValue.value, errorMessage.value);
      return;
    }

    if (props.type === 'number' && !handleStringRule('number', internalValue.value)) {
      error.value = true;
      errorMessage.value = getDefaultErrorMessage('number');
      emit('validate', false, internalValue.value, errorMessage.value);
      return;
    }

    if (props.type === 'tel' && !handleStringRule('phone', internalValue.value)) {
      error.value = true;
      errorMessage.value = getDefaultErrorMessage('tel');
      emit('validate', false, internalValue.value, errorMessage.value);
      return;
    }

    if (props.type === 'url' && !handleStringRule('url', internalValue.value)) {
      error.value = true;
      errorMessage.value = getDefaultErrorMessage('url');
      emit('validate', false, internalValue.value, errorMessage.value);
      return;
    }

    // Handle string-based rule validation
    for (const { rule, message, condition } of props.rules) {
      let result;

      try {
        // Handle function type rules
        if (typeof rule === 'function') {
          result = rule(internalValue.value);
        }
        // Handle string-based rules (e.g., 'required', 'minLength')
        else if (typeof rule === 'string') {
          result = handleStringRule(rule, internalValue.value, condition);
        }
        // Handle regular expression rules
        else if (rule instanceof RegExp) {
          result = rule.test(internalValue.value);
        }
        // Handle invalid rule types
        else {
          throw new Error(`Invalid rule type: ${typeof rule}`);
        }

        // If validation fails, set error state and break out of the loop
        if (result !== true) {
          error.value = true;
          // Set custom error message or use default error message
          errorMessage.value = message || getDefaultErrorMessage(rule, condition);
          break;
        }
      } catch (e) {
        // Handle invalid regex or other errors (e.g., rule is undefined or invalid)
        console.error('Validation error:', e.message); // Log the error message
        error.value = true;
        errorMessage.value = `Invalid rule: ${e.message}`;
        emit('validate', false, internalValue.value, errorMessage.value);
        return; // Exit the function early
      }
    }
  }

  // If all validations pass
  emit('validate', true, internalValue.value, '');
};

// Helper function to provide default error messages for string-based rules
const getDefaultErrorMessage = (rule, condition) => {
  switch (rule) {
    case 'required':
      return 'This field is required';
    case 'minLength':
      return `This field must be at least ${condition} characters long`;
    case 'maxLength':
      return `This field must be no more than ${condition} characters long`;
    case 'email':
      return 'Invalid email address';
    case 'number':
      return 'Invalid number';
    case 'tel':
      return 'Invalid phone number (must be 10 digits)';
    case 'url':
      return 'Invalid URL';
    default:
      return 'Field is invalid';
  }
};

// Function to handle string-based validation rules
const handleStringRule = (rule, value, condition) => {
  switch (rule) {
    case 'required':
      if (value === null || value === undefined || value === '') {
        return false;
      }

      switch (typeof value) {
        case 'string':
          return value.trim().length > 0;
        case 'object':
          if (Array.isArray(value)) {
            return value.length > 0;
          }
          // For File objects, check if the file exists and has a size
          if (value instanceof File) {
            return value.size > 0;
          }
          // For other objects, check if they have any properties
          return Object.keys(value).length > 0;
        default:
          return true;
      }

    case 'minLength':
      return value.length >= condition; // Check minimum length

    case 'maxLength':
      return value.length <= condition; // Check maximum length

    case 'email':
      const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/; // Email regex
      return emailPattern.test(value); // Validate email format

    case 'number':
      const numValue = Number(value); // Convert string to number
      return (
        !isNaN(numValue) &&
        (typeof value === 'string' ? value.trim().length > 0 : value !== null && value !== undefined && value !== '')
      ); // Check if valid number

    case 'minValue':
      const minValue = condition; // Example min value
      const minNumValue = Number(value);
      return !isNaN(minNumValue) && minNumValue >= minValue; // Check minimum value

    case 'maxValue':
      const maxValue = condition; // Example max value
      const maxNumValue = Number(value);
      return !isNaN(maxNumValue) && maxNumValue <= maxValue; // Check maximum value

    case 'phone':
      const phonePattern = /^[0-9]{10}$/; // Phone number regex
      return phonePattern.test(value); // Validate phone format

    case 'url':
      // Strict URL validation that only allows http/https protocols
      const urlPattern = /^(https?:\/\/)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(\/[-a-zA-Z0-9()@:%_\+.~#?&//=]*)?$/;
      return urlPattern.test(value); // Validate URL format

    default:
      return true; // Default to valid if rule is not recognized
  }
};

// Event handlers for various actions
const handlePrependClick = (payload) => {
  triggerEvent('prepend:click', payload); // Trigger prepend click event
};

const handlePrependInnerClick = (payload) => {
  triggerEvent('prependInner:click', payload); // Trigger inner prepend click event
};

const handleClearClick = (payload) => {
  triggerEvent('clear:click', payload); // Trigger clear click event
};

const handleAppendInnerClick = (payload) => {
  triggerEvent('appendInner:click', payload); // Trigger inner append click event
};

const handleAppendClick = (payload) => {
  triggerEvent('append:click', payload); // Trigger append click event
};

const changeInternalType = (type) => {
  internalType.value = type;
};

const setInternalValue = (value) => {
  internalValue.value = value;
};

// Function to trigger events and handle input changes
const triggerEvent = (eventName, payload) => {
  switch (eventName) {
    case 'focus':
      focused.value = true; // Set focus state
      break;
    case 'blur':
      focused.value = false; // Reset focus state
      validate(); // Validate input on blur
      break;
    case 'clear:click':
      internalValue.value = ''; // Clear input value
      emit('update:modelValue', internalValue.value); // Emit updated value
      validate(); // Validate after clearing
      break;
    case 'input':
      internalValue.value = payload.target.value; // Update internal value on input
      emit('update:modelValue', internalValue.value); // Emit updated value
      validate(); // Validate on input change
      break;
    default:
      // Handle other events
      break;
  }

  emit(eventName, payload); // Emit the event
};

defineExpose({
  validate,
  setInternalValue,
});
</script>

<template>
  <div class="basic-input-wrapper" :class="{ disabled, readonly }">
    <div v-if="prepend" class="prepend-wrapper">
      <slot name="prepend" :props="{ click: handlePrependClick }">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" @click="handlePrependClick">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M20.5348 3.46447C19.0704 2 16.7133 2 11.9993 2C7.28525 2 4.92823 2 3.46377 3.46447C2.70628 4.22195 2.3406 5.21824 2.16406 6.65598C2.69473 6.06532 3.33236 5.57328 4.04836 5.20846C4.82984 4.81027 5.66664 4.6488 6.59316 4.5731C7.48829 4.49997 8.58971 4.49998 9.93646 4.5H14.0621C15.4089 4.49998 16.5103 4.49997 17.4054 4.5731C18.332 4.6488 19.1688 4.81027 19.9502 5.20846C20.6662 5.57328 21.3039 6.06532 21.8345 6.65598C21.658 5.21824 21.2923 4.22195 20.5348 3.46447Z"
              fill="#1C274C"
            ></path>
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M2 14C2 11.1997 2 9.79961 2.54497 8.73005C3.02433 7.78924 3.78924 7.02433 4.73005 6.54497C5.79961 6 7.19974 6 10 6H14C16.8003 6 18.2004 6 19.27 6.54497C20.2108 7.02433 20.9757 7.78924 21.455 8.73005C22 9.79961 22 11.1997 22 14C22 16.8003 22 18.2004 21.455 19.27C20.9757 20.2108 20.2108 20.9757 19.27 21.455C18.2004 22 16.8003 22 14 22H10C7.19974 22 5.79961 22 4.73005 21.455C3.78924 20.9757 3.02433 20.2108 2.54497 19.27C2 18.2004 2 16.8003 2 14ZM12.5303 17.5303C12.3897 17.671 12.1989 17.75 12 17.75C11.8011 17.75 11.6103 17.671 11.4697 17.5303L8.96967 15.0303C8.67678 14.7374 8.67678 14.2626 8.96967 13.9697C9.26256 13.6768 9.73744 13.6768 10.0303 13.9697L11.25 15.1893V11C11.25 10.5858 11.5858 10.25 12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V15.1893L13.9697 13.9697C14.2626 13.6768 14.7374 13.6768 15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303L12.5303 17.5303Z"
              fill="#1C274C"
            ></path>
          </g>
        </svg>
      </slot>
    </div>
    <div
      class="input-wrapper"
      @dragenter.prevent="triggerEvent('parent:dragenter', $event)"
      @dragover.prevent="triggerEvent('parent:dragover', $event)"
      @dragleave.prevent="triggerEvent('parent:dragleave', $event)"
      @drop.prevent="triggerEvent('parent:drop', $event)"
      @paste="triggerEvent('parent:paste', $event)"
    >
      <div v-if="prependInner" class="prepend-inner-wrapper">
        <slot name="prepend-inner" :props="{ click: handlePrependInnerClick }">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" @click="handlePrependInnerClick">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M20.5348 3.46447C19.0704 2 16.7133 2 11.9993 2C7.28525 2 4.92823 2 3.46377 3.46447C2.70628 4.22195 2.3406 5.21824 2.16406 6.65598C2.69473 6.06532 3.33236 5.57328 4.04836 5.20846C4.82984 4.81027 5.66664 4.6488 6.59316 4.5731C7.48829 4.49997 8.58971 4.49998 9.93646 4.5H14.0621C15.4089 4.49998 16.5103 4.49997 17.4054 4.5731C18.332 4.6488 19.1688 4.81027 19.9502 5.20846C20.6662 5.57328 21.3039 6.06532 21.8345 6.65598C21.658 5.21824 21.2923 4.22195 20.5348 3.46447Z"
                fill="#1C274C"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2 14C2 11.1997 2 9.79961 2.54497 8.73005C3.02433 7.78924 3.78924 7.02433 4.73005 6.54497C5.79961 6 7.19974 6 10 6H14C16.8003 6 18.2004 6 19.27 6.54497C20.2108 7.02433 20.9757 7.78924 21.455 8.73005C22 9.79961 22 11.1997 22 14C22 16.8003 22 18.2004 21.455 19.27C20.9757 20.2108 20.2108 20.9757 19.27 21.455C18.2004 22 16.8003 22 14 22H10C7.19974 22 5.79961 22 4.73005 21.455C3.78924 20.9757 3.02433 20.2108 2.54497 19.27C2 18.2004 2 16.8003 2 14ZM12.5303 17.5303C12.3897 17.671 12.1989 17.75 12 17.75C11.8011 17.75 11.6103 17.671 11.4697 17.5303L8.96967 15.0303C8.67678 14.7374 8.67678 14.2626 8.96967 13.9697C9.26256 13.6768 9.73744 13.6768 10.0303 13.9697L11.25 15.1893V11C11.25 10.5858 11.5858 10.25 12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V15.1893L13.9697 13.9697C14.2626 13.6768 14.7374 13.6768 15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303L12.5303 17.5303Z"
                fill="#1C274C"
              ></path>
            </g>
          </svg>
        </slot>
      </div>
      <div class="input-field-wrapper" tabindex="-1">
        <label
          v-if="label"
          class="label"
          :class="{
            floating: focused || internalValue,
            'has-inner-prepend': prependInner,
            'un-floating': !focused && !internalValue && prependInner,
          }"
        >
          {{ label }}
        </label>
        <slot
          name="input-field"
          :props="{
            hideSpinButtons,
            internalType,
            readonly,
            disabled,
            placeholder,
            attrs,
            internalValue,
            triggerEvent,
          }"
        >
          <input
            class="input-field"
            :class="{ hideSpinButtons }"
            :type="internalType"
            :readonly="readonly"
            :disabled="disabled"
            :placeholder="placeholder"
            v-bind="attrs"
            :value="internalValue"
            @input="triggerEvent('input', $event)"
            @change="triggerEvent('change', $event)"
            @focus="triggerEvent('focus', $event)"
            @blur="triggerEvent('blur', $event)"
            @keydown="triggerEvent('keydown', $event)"
            @click="triggerEvent('click', $event)"
            @dblclick="triggerEvent('dblclick', $event)"
            @mousedown="triggerEvent('mousedown', $event)"
            @mouseup="triggerEvent('mouseup', $event)"
            @mouseenter="triggerEvent('mouseenter', $event)"
            @mouseleave="triggerEvent('mouseleave', $event)"
            @keyup="triggerEvent('keyup', $event)"
            @keypress="triggerEvent('keypress', $event)"
            @copy="triggerEvent('copy', $event)"
            @cut="triggerEvent('cut', $event)"
            @paste="triggerEvent('paste', $event)"
            @compositionstart="triggerEvent('compositionstart', $event)"
            @compositionupdate="triggerEvent('compositionupdate', $event)"
            @compositionend="triggerEvent('compositionend', $event)"
            @dragenter="triggerEvent('dragenter', $event)"
            @dragover="triggerEvent('dragover', $event)"
            @dragleave="triggerEvent('dragleave', $event)"
            @drop="triggerEvent('drop', $event)"
          />
        </slot>
        <div v-if="clearable" class="clear-wrapper" :class="{ 'has-value': internalValue }">
          <slot name="clear" :props="{ click: handleClearClick }">
            <svg
              width="64px"
              height="64px"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
              fill="#000000"
              @click="handleClearClick"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  fill="#000000"
                  fill-rule="evenodd"
                  d="M8,16 C12.4183,16 16,12.4183 16,8 C16,3.58172 12.4183,0 8,0 C3.58172,0 0,3.58172 0,8 C0,12.4183 3.58172,16 8,16 Z M4.29289,4.29289 C4.68342,3.90237 5.31658,3.90237 5.70711,4.29289 L8,6.58579 L10.2929,4.29289 C10.6834,3.90237 11.3166,3.90237 11.7071,4.29289 C12.0976,4.68342 12.0976,5.31658 11.7071,5.70711 L9.41421,8 L11.7071,10.2929 C12.0976,10.6834 12.0976,11.3166 11.7071,11.7071 C11.3166,12.0976 10.6834,12.0976 10.2929,11.7071 L8,9.41421 L5.70711,11.7071 C5.31658,12.0976 4.68342,12.0976 4.29289,11.7071 C3.90237,11.3166 3.90237,10.6834 4.29289,10.2929 L6.58579,8 L4.29289,5.70711 C3.90237,5.31658 3.90237,4.68342 4.29289,4.29289 Z"
                ></path>
              </g>
            </svg>
          </slot>
        </div>
      </div>
      <div v-if="appendInner || loading" class="append-inner-wrapper">
        <slot v-if="loading" name="loading">
          <svg class="default-loader" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
            <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="4" />
          </svg>
        </slot>
        <slot
          v-else-if="appendInner"
          name="append-inner"
          :props="{ click: handleAppendInnerClick, changeInternalType, internalType }"
        >
          <template v-if="type == 'password'">
            <svg
              v-if="internalType == 'password'"
              @click="changeInternalType('text')"
              width="64px"
              height="64px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M14.83 9.17999C14.2706 8.61995 13.5576 8.23846 12.7813 8.08386C12.0049 7.92926 11.2002 8.00851 10.4689 8.31152C9.73758 8.61453 9.11264 9.12769 8.67316 9.78607C8.23367 10.4444 7.99938 11.2184 8 12.01C7.99916 13.0663 8.41619 14.08 9.16004 14.83"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M12 16.01C13.0609 16.01 14.0783 15.5886 14.8284 14.8384C15.5786 14.0883 16 13.0709 16 12.01"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M17.61 6.39004L6.38 17.62C4.6208 15.9966 3.14099 14.0944 2 11.99C6.71 3.76002 12.44 1.89004 17.61 6.39004Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M20.9994 3L17.6094 6.39"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M6.38 17.62L3 21"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M19.5695 8.42999C20.4801 9.55186 21.2931 10.7496 21.9995 12.01C17.9995 19.01 13.2695 21.4 8.76953 19.23"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </g>
            </svg>
            <svg
              v-if="internalType == 'text'"
              @click="changeInternalType('password')"
              width="64px"
              height="64px"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
              <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M12 16.01C14.2091 16.01 16 14.2191 16 12.01C16 9.80087 14.2091 8.01001 12 8.01001C9.79086 8.01001 8 9.80087 8 12.01C8 14.2191 9.79086 16.01 12 16.01Z"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M2 11.98C8.09 1.31996 15.91 1.32996 22 11.98"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
                <path
                  d="M22 12.01C15.91 22.67 8.09 22.66 2 12.01"
                  stroke="#000000"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                ></path>
              </g>
            </svg>
          </template>
          <svg
            v-else
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            @click="handleAppendInnerClick"
          >
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path
                d="M20.5348 3.46447C19.0704 2 16.7133 2 11.9993 2C7.28525 2 4.92823 2 3.46377 3.46447C2.70628 4.22195 2.3406 5.21824 2.16406 6.65598C2.69473 6.06532 3.33236 5.57328 4.04836 5.20846C4.82984 4.81027 5.66664 4.6488 6.59316 4.5731C7.48829 4.49997 8.58971 4.49998 9.93646 4.5H14.0621C15.4089 4.49998 16.5103 4.49997 17.4054 4.5731C18.332 4.6488 19.1688 4.81027 19.9502 5.20846C20.6662 5.57328 21.3039 6.06532 21.8345 6.65598C21.658 5.21824 21.2923 4.22195 20.5348 3.46447Z"
                fill="#1C274C"
              ></path>
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M2 14C2 11.1997 2 9.79961 2.54497 8.73005C3.02433 7.78924 3.78924 7.02433 4.73005 6.54497C5.79961 6 7.19974 6 10 6H14C16.8003 6 18.2004 6 19.27 6.54497C20.2108 7.02433 20.9757 7.78924 21.455 8.73005C22 9.79961 22 11.1997 22 14C22 16.8003 22 18.2004 21.455 19.27C20.9757 20.2108 20.2108 20.9757 19.27 21.455C18.2004 22 16.8003 22 14 22H10C7.19974 22 5.79961 22 4.73005 21.455C3.78924 20.9757 3.02433 20.2108 2.54497 19.27C2 18.2004 2 16.8003 2 14ZM12.5303 17.5303C12.3897 17.671 12.1989 17.75 12 17.75C11.8011 17.75 11.6103 17.671 11.4697 17.5303L8.96967 15.0303C8.67678 14.7374 8.67678 14.2626 8.96967 13.9697C9.26256 13.6768 9.73744 13.6768 10.0303 13.9697L11.25 15.1893V11C11.25 10.5858 11.5858 10.25 12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V15.1893L13.9697 13.9697C14.2626 13.6768 14.7374 13.6768 15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303L12.5303 17.5303Z"
                fill="#1C274C"
              ></path>
            </g>
          </svg>
        </slot>
      </div>
    </div>

    <div v-if="append" class="append-wrapper">
      <slot name="append" :props="{ click: handleAppendClick }">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" @click="handleAppendClick">
          <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
          <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
          <g id="SVGRepo_iconCarrier">
            <path
              d="M20.5348 3.46447C19.0704 2 16.7133 2 11.9993 2C7.28525 2 4.92823 2 3.46377 3.46447C2.70628 4.22195 2.3406 5.21824 2.16406 6.65598C2.69473 6.06532 3.33236 5.57328 4.04836 5.20846C4.82984 4.81027 5.66664 4.6488 6.59316 4.5731C7.48829 4.49997 8.58971 4.49998 9.93646 4.5H14.0621C15.4089 4.49998 16.5103 4.49997 17.4054 4.5731C18.332 4.6488 19.1688 4.81027 19.9502 5.20846C20.6662 5.57328 21.3039 6.06532 21.8345 6.65598C21.658 5.21824 21.2923 4.22195 20.5348 3.46447Z"
              fill="#1C274C"
            ></path>
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M2 14C2 11.1997 2 9.79961 2.54497 8.73005C3.02433 7.78924 3.78924 7.02433 4.73005 6.54497C5.79961 6 7.19974 6 10 6H14C16.8003 6 18.2004 6 19.27 6.54497C20.2108 7.02433 20.9757 7.78924 21.455 8.73005C22 9.79961 22 11.1997 22 14C22 16.8003 22 18.2004 21.455 19.27C20.9757 20.2108 20.2108 20.9757 19.27 21.455C18.2004 22 16.8003 22 14 22H10C7.19974 22 5.79961 22 4.73005 21.455C3.78924 20.9757 3.02433 20.2108 2.54497 19.27C2 18.2004 2 16.8003 2 14ZM12.5303 17.5303C12.3897 17.671 12.1989 17.75 12 17.75C11.8011 17.75 11.6103 17.671 11.4697 17.5303L8.96967 15.0303C8.67678 14.7374 8.67678 14.2626 8.96967 13.9697C9.26256 13.6768 9.73744 13.6768 10.0303 13.9697L11.25 15.1893V11C11.25 10.5858 11.5858 10.25 12 10.25C12.4142 10.25 12.75 10.5858 12.75 11V15.1893L13.9697 13.9697C14.2626 13.6768 14.7374 13.6768 15.0303 13.9697C15.3232 14.2626 15.3232 14.7374 15.0303 15.0303L12.5303 17.5303Z"
              fill="#1C274C"
            ></path>
          </g>
        </svg>
      </slot>
    </div>

    <div class="details-wrapper" v-if="!hideDetails">
      <slot name="details" :props="{ hint, error, errorMessage, persistentDetails, focused }">
        <slot name="details-left-content" :props="{ hint, error, errorMessage, persistentDetails, focused }"> </slot>
        <div class="message" :class="{ hint, error, persistentDetails, focused }">
          {{ error ? errorMessage : hint }}
        </div>
        <slot
          name="details-right-content"
          :props="{ internalValue, hint, error, errorMessage, persistentDetails, focused }"
        >
        </slot>
      </slot>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* Styles for the basic input component */
.basic-input-wrapper {
  width: 100%; /* Full width */
  display: grid; /* Use grid layout */
  grid-template-areas:
    'prepend control append'
    'a messages b'; /* Define grid areas */
  grid-template-columns: max-content minmax(0, 1fr) max-content; /* Define column sizes */
  grid-template-rows: 1fr auto; /* Define row sizes */
  align-items: center; /* Center items vertically */

  &.disabled {
    opacity: 0.5; /* Dim the component when disabled */
    pointer-events: none; /* Disable pointer events */

    .prepend-wrapper,
    .prepend-inner-wrapper,
    .input-field,
    .append-wrapper,
    .append-inner-wrapper,
    .details-wrapper {
      opacity: 0.5; /* Dim child elements */
      pointer-events: none; /* Disable pointer events for child elements */
    }

    .input-wrapper {
      .input-field-wrapper {
        .label.floating {
          color: rgba(#333, 0.5);
        }
      }
    }
  }

  &.readonly {
    pointer-events: none; /* Disable pointer events for read-only state */

    input {
      pointer-events: none; /* Disable pointer events for input */
    }
  }

  /* Prepend button styles */
  .prepend-wrapper {
    width: 1.5rem; /* Fixed width */
    height: 1.5rem; /* Fixed height */
    margin-inline-end: 1rem; /* Margin to the right */
    overflow: hidden; /* Hide overflow */
    grid-area: prepend; /* Assign to grid area */
    svg {
      width: 100%; /* Full width for SVG */
      height: 100%; /* Full height for SVG */
      cursor: pointer; /* Pointer cursor on hover */
    }
  }

  /* Input wrapper styles */
  .input-wrapper {
    position: relative; /* Relative positioning */
    grid-area: control; /* Assign to grid area */
    padding: 0 0.625rem; /* Padding */
    display: grid; /* Use grid layout */
    align-items: center; /* Center items vertically */
    grid-template-areas: 'prepend-inner field clear append-inner'; /* Define grid areas */
    grid-template-columns: min-content minmax(0, 1fr) min-content min-content; /* Define column sizes */
    font-size: 1rem; /* Font size */
    letter-spacing: 0.009375em; /* Letter spacing */
    max-width: 100%; /* Full width */
    border-radius: 0.25rem; /* Rounded corners */
    border: 0.0625rem solid grey; /* Border style */

    /* Prepend inner button styles */
    .prepend-inner-wrapper {
      width: 1.5rem; /* Fixed width */
      height: 1.5rem; /* Fixed height */
      margin-inline-end: 0.375rem; /* Margin to the right */
      overflow: hidden; /* Hide overflow */
      grid-area: prepend-inner; /* Assign to grid area */
      svg {
        width: 100%; /* Full width for SVG */
        height: 100%; /* Full height for SVG */
        cursor: pointer; /* Pointer cursor on hover */
      }
    }

    /* Input field wrapper styles */
    .input-field-wrapper {
      grid-area: field; /* Assign to grid area */

      /* Label styles */
      .label {
        font-size: 0.875rem; /* Font size */
        color: #333; /* Text color */
        position: absolute; /* Absolute positioning */
        height: 100%; /* Full height */
        display: flex; /* Flexbox layout */
        align-items: center; /* Center items vertically */

        &:not(.has-inner-prepend) {
          transition: all 0.2s ease; /* Smooth transition for label */
          &.floating {
            top: 0; /* Position at the top */
            left: 0.625rem; /* Left position */
            font-size: 0.625rem; /* Smaller font size */
            height: max-content; /* Adjust height */
            transform: translateY(-50%); /* Center vertically */
            background: white; /* Background color */
            padding: 0 0.25rem; /* Padding */
          }
        }

        &.has-inner-prepend {
          transition: none; /* No transition for inner prepend */

          &.floating {
            animation: float-diagonal 0.2s ease forwards; /* Animation for floating */
            font-size: 0.625rem; /* Smaller font size */
            height: max-content; /* Adjust height */
            transform: translateY(-50%); /* Center vertically */
            left: 0.625rem; /* Left position */
            background: white; /* Background color */
            padding: 0 0.25rem; /* Padding */
          }

          &.un-floating {
            animation: reverse-float-diagonal 0.2s ease forwards; /* Animation for un-floating */
            font-size: 0.875rem; /* Normal font size */
            height: 100%; /* Full height */
            left: calc(0.625rem + 0.375rem + 1.5rem); /* Adjust left position */
            top: 50%; /* Center vertically */
            transform: translateY(-50%); /* Center vertically */
            padding: 0; /* No padding */
          }
        }

        /* Keyframes for floating animation */
        @keyframes float-diagonal {
          0% {
            left: calc(0.625rem + 0.375rem + 1.5rem); /* Start position */
            top: 40%; /* Start vertical position */
          }
          100% {
            left: 0.625rem; /* End position */
            top: 0; /* End vertical position */
          }
        }

        /* Keyframes for reverse floating animation */
        @keyframes reverse-float-diagonal {
          0% {
            left: calc(0.625rem + 0.375rem); /* Start position */
            top: 0%; /* Start vertical position */
          }
          100% {
            left: calc(0.625rem + 0.375rem + 1.5rem); /* End position */
            top: 50%; /* End vertical position */
          }
        }
      }

      /* Input field styles */
      &:has(.label) {
        .input-field {
          &:not(:focus) {
            &::placeholder {
              width: 0; /* Hide placeholder when not focused */
            }
          }
        }
      }

      /* Input field styles */
      input {
        position: relative; /* Relative positioning */
        z-index: 1; /* Layering */
        background: transparent; /* Transparent background */
        padding: 0; /* No padding */
        margin: 0; /* No margin */
        border: none; /* No border */
        outline: 0; /* No outline */
        padding: 1rem 0; /* Padding */
        width: 100%; /* Full width */
        &:focus {
          outline: none; /* No outline on focus */
        }

        &.hideSpinButtons {
          /* For Chrome, Safari, Edge, Opera */
          &[type='number']::-webkit-inner-spin-button,
          &[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }

          /* For Firefox */
          &[type='number'] {
            -moz-appearance: textfield;
          }
        }
        /* Always set cursor pointer on spin buttons if they exist */
        &[type='number']::-webkit-inner-spin-button,
        &[type='number']::-webkit-outer-spin-button {
          cursor: pointer;
        }
      }

      /* Clear button styles */
      &:has(.clear-wrapper) {
        input:focus {
          width: calc(100% - 2rem); /* Adjust width when focused */
        }
      }

      /* Clear button wrapper styles */
      .clear-wrapper {
        width: 1.5rem; /* Fixed width */
        height: 1.5rem; /* Fixed height */
        position: absolute; /* Absolute positioning */
        top: 50%; /* Center vertically */
        right: 0rem; /* Right position */
        transform: translateY(-50%); /* Center vertically */
        opacity: 0; /* Hidden by default */
        right: 1rem; /* Right position */
        visibility: hidden; /* Hidden by default */
        transition: all 0.2s ease-in-out; /* Smooth transition */
        svg {
          width: 100%; /* Full width for SVG */
          height: 100%; /* Full height for SVG */
          cursor: pointer; /* Pointer cursor on hover */
        }
      }

      /* Show clear button when focused */
      &:focus-within {
        &:has(.has-value) {
          input {
            width: calc(100% - 2rem); /* Adjust width when focused */
          }
          .clear-wrapper {
            opacity: 1; /* Show clear button */
            right: 2.5rem; /* Adjust right position */
            visibility: visible; /* Make visible */
          }
        }
      }
    }

    /* Append inner button styles */
    .append-inner-wrapper {
      min-width: 1.5rem; /* Fixed width */
      min-height: 1.5rem; /* Fixed height */
      margin-inline-start: 0.375rem; /* Margin to the left */
      overflow: hidden; /* Hide overflow */
      grid-area: append-inner; /* Assign to grid area */
      svg {
        width: 100%; /* Full width for SVG */
        height: 100%; /* Full height for SVG */
        cursor: pointer; /* Pointer cursor on hover */
      }

      /* Loader animation styles */
      .default-loader {
        animation: rotate 2s linear infinite; /* Rotate animation */
        width: 1.5rem; /* Fixed width */
        height: 1.5rem; /* Fixed height */
      }

      .default-loader .path {
        stroke: #1c274c; /* Stroke color */
        stroke-linecap: round; /* Round stroke ends */
        animation: dash 1.5s ease-in-out infinite; /* Dash animation */
      }

      /* Keyframes for rotation animation */
      @keyframes rotate {
        100% {
          transform: rotate(360deg); /* Full rotation */
        }
      }

      /* Keyframes for dash animation */
      @keyframes dash {
        0% {
          stroke-dasharray: 1, 150; /* Initial dash pattern */
          stroke-dashoffset: 0; /* Initial offset */
        }
        50% {
          stroke-dasharray: 90, 150; /* Mid dash pattern */
          stroke-dashoffset: -35; /* Mid offset */
        }
        100% {
          stroke-dasharray: 90, 150; /* Final dash pattern */
          stroke-dashoffset: -124; /* Final offset */
        }
      }
    }
  }

  /* Append button styles */
  .append-wrapper {
    width: 1.5rem; /* Fixed width */
    height: 1.5rem; /* Fixed height */
    margin-inline-start: 1rem; /* Margin to the left */
    overflow: hidden; /* Hide overflow */
    grid-area: append; /* Assign to grid area */
    svg {
      width: 100%; /* Full width for SVG */
      height: 100%; /* Full height for SVG */
      cursor: pointer; /* Pointer cursor on hover */
    }
  }

  /* Validation details styles */
  .details-wrapper {
    grid-area: messages; /* Assign to grid area */
    padding: 0.375rem 1rem 0; /* Padding */
    overflow: hidden; /* Hide overflow */
    position: relative; /* Relative positioning */
    min-height: 1.375rem; /* Minimum height */
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    .message {
      opacity: 0; /* Hidden by default */
      visibility: hidden; /* Hidden by default */
      font-size: 0.75rem; /* Font size */
      min-height: 0.875rem; /* Minimum height */
      min-width: 0.0625rem; /* Minimum width */
      position: relative; /* Relative positioning */
      transform: translateY(-100%); /* Move up */
      transition: all 0.2s ease-in-out; /* Smooth transition */

      &.hint {
        /* Hint styles */
      }

      &.error {
        color: red; /* Error text color */
      }

      &.focused,
      &.persistentDetails {
        opacity: 1; /* Show message */
        visibility: visible; /* Make visible */
        transform: translateY(0); /* Move to original position */
      }
    }
  }
}
</style>
