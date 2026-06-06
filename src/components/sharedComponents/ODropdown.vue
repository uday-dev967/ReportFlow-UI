<script setup>
import { ref, computed, nextTick } from 'vue';
import OMenu from './OMenu.vue';

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  modelValue: {
    type: [Array, String, Number, Object],
    default: () => [],
  },
  itemText: {
    type: String,
    default: 'text',
  },
  itemValue: {
    type: String,
    default: 'value',
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  buttonText: {
    type: String,
    default: 'Select',
  },
  noDataText: {
    type: String,
    default: 'No items available',
  },
  selectedOnTop: {
    type: Boolean,
    default: false,
  },
  triggerType: {
    type: String,
    default: 'click',
  },
  placement: {
    type: String,
    default: 'bottom-start',
  },
  offset: {
    type: Array,
    default: () => [0, 0.125],
  },
  closeOnOutsideClick: {
    type: Boolean,
    default: true,
  },
  closeOnEsc: {
    type: Boolean,
    default: true,
  },
  buttonWidth: {
    type: [String, Number],
    default: '100%',
  },
  fullWidth: {
    type: Boolean,
    default: true,
  },
  width: {
    type: [String, Number],
    default: null,
  },
});

const emit = defineEmits(['update:modelValue', 'item:select', 'item:unselect', 'menu:open', 'menu:close']);

const menuRef = ref(null);
const buttonRef = ref(null);
const isMenuOpen = ref(false);
const menuWidth = ref('auto');

const buttonWidthStyle = computed(() => {
  if (props.buttonWidth == null || props.buttonWidth === '100%') return undefined;
  if (typeof props.buttonWidth === 'number') return { width: `${props.buttonWidth}px` };
  return { width: props.buttonWidth };
});

// Computed dropdown width
const dropdownWidth = computed(() => {
  if (props.width !== null) {
    if (typeof props.width === 'number') {
      return `${props.width}px`;
    }
    return props.width;
  }
  return menuWidth.value;
});

// Selected items tracking
const selectedItems = computed(() => {
  if (!props.multiple) {
    if (!props.modelValue) return [];
    const item = props.items.find((item) => getItemValue(item) === props.modelValue);
    return item ? [item] : [];
  }
  return Array.isArray(props.modelValue)
    ? props.items.filter((item) => props.modelValue.includes(getItemValue(item)))
    : [];
});

// Display items with optional sorting
const displayItems = computed(() => {
  if (!props.selectedOnTop) {
    return props.items;
  }

  const selected = [];
  const unselected = [];

  props.items.forEach((item) => {
    if (isItemSelected(item)) {
      selected.push(item);
    } else {
      unselected.push(item);
    }
  });

  return [...selected, ...unselected];
});

// Computed button text based on selection
const displayButtonText = computed(() => {
  if (selectedItems.value.length === 0) {
    return props.buttonText;
  }

  if (!props.multiple) {
    return getItemText(selectedItems.value[0]);
  }

  if (selectedItems.value.length === 1) {
    return getItemText(selectedItems.value[0]);
  }

  return `${selectedItems.value.length} items selected`;
});

// Item helpers
const getItemText = (item) => {
  if (typeof item === 'string' || typeof item === 'number') {
    return item.toString();
  }
  return item[props.itemText] || '';
};

const getItemValue = (item) => {
  if (typeof item === 'string' || typeof item === 'number') {
    return item;
  }
  return item[props.itemValue] !== undefined ? item[props.itemValue] : item;
};

// Check if item is selected
const isItemSelected = (item) => {
  const itemValue = getItemValue(item);
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(itemValue);
  } else {
    return props.modelValue === itemValue;
  }
};

// Toggle menu
const toggleMenu = () => {
  if (isMenuOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};

// Open menu
const openMenu = (canUseComingEvent = false, event = null) => {
  if (props.disabled) return;
  if (isMenuOpen.value) return;

  isMenuOpen.value = true;
  if (!menuRef.value.isOpen) {
    menuRef.value.openMenu();
  }
  emit('menu:open');

  // Set dropdown width to match button width if no width prop is provided
  if (props.width === null) {
    nextTick(() => {
      const buttonEl = canUseComingEvent === true ? event.currentTarget : buttonRef.value;
      if (buttonEl) {
        menuWidth.value = `${buttonEl.getBoundingClientRect().width}px`;
      }
    });
  }
};

// Close menu
const closeMenu = () => {
  if (props.disabled) return;
  if (!isMenuOpen.value) return;

  isMenuOpen.value = false;
  if (menuRef.value.isOpen) {
    menuRef.value.closeMenu();
  }
  emit('menu:close');
};

// Remove item (for chips)
const removeItem = (item) => {
  if (props.multiple) {
    const itemValue = getItemValue(item);
    const currentValues = Array.isArray(props.modelValue) ? props.modelValue : [];
    const newValues = currentValues.filter((value) => value !== itemValue);
    emit('update:modelValue', newValues);
    emit('item:unselect', item);
  }
};

const handleItemClick = (item) => {
  const itemValue = getItemValue(item);

  if (props.multiple) {
    const currentValues = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
    const existingIndex = currentValues.indexOf(itemValue);

    if (existingIndex > -1) {
      // Remove item
      currentValues.splice(existingIndex, 1);
      emit('item:unselect', item);
    } else {
      // Add item
      currentValues.push(itemValue);
      emit('item:select', item);
    }

    emit('update:modelValue', currentValues);
  } else {
    // Single select
    if (props.modelValue === itemValue) {
      // Deselect if same item
      emit('update:modelValue', null);
      emit('item:unselect', item);
    } else {
      // Select new item
      emit('update:modelValue', itemValue);
      emit('item:select', item);
    }
    // Close menu after selection for single select
    setTimeout(() => {
      if (menuRef.value) {
        menuRef.value.closeMenu();
      }
    }, 50);
  }
};

// Menu event handlers
const handleMenuOpen = () => {
  // Menu open is now handled by focus events
  if (props.disabled) return;
  isMenuOpen.value = true;
  emit('menu:open');
};

const handleMenuClose = () => {
  // Menu close is now handled by focus events
  if (props.disabled) return;
  isMenuOpen.value = false;
  emit('menu:close');
};

// Expose methods
defineExpose({
  openMenu,
  closeMenu,
  toggleMenu,
});
</script>

<template>
  <div class="dropdown-container" :class="{ 'dropdown-container--full': fullWidth }">
    <OMenu
      ref="menuRef"
      class="dropdown-menu"
      :trigger-type="triggerType"
      :placement="placement"
      :offset="offset"
      :close-on-outside-click="closeOnOutsideClick"
      :close-on-esc="closeOnEsc"
      :disabled="disabled"
      :width="dropdownWidth"
      :block="fullWidth"
      @open="handleMenuOpen"
      @close="handleMenuClose"
    >
      <template #trigger>
        <slot
          name="trigger"
          :props="{ isOpen: isMenuOpen, selectedItems, toggleMenu, openMenu, closeMenu, displayButtonText }"
        >
          <button
            ref="buttonRef"
            class="dropdown-button"
            :class="{ 'is-open': isMenuOpen }"
            :disabled="disabled"
            :style="buttonWidthStyle"
            type="button"
            @click.stop="toggleMenu"
          >
            <!-- Multiple selection with chips -->
            <slot
              name="triggerContent"
              :props="{
                isOpen: isMenuOpen,
                selectedItems,
                toggleMenu,
                openMenu,
                closeMenu,
                displayButtonText,
                multiple,
                disabled,
              }"
            >
              <span class="button-text">{{ displayButtonText }}</span>
            </slot>

            <svg
              class="dropdown-icon"
              :class="{ rotated: isMenuOpen }"
              width="16"
              height="16"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </slot>
      </template>

      <template #content>
        <div class="dropdown-content">
          <div class="items-wrapper">
            <template v-if="displayItems.length">
              <div
                v-for="item in displayItems"
                :key="getItemValue(item)"
                class="dropdown-item"
                :class="{ selected: isItemSelected(item) }"
                @click="handleItemClick(item)"
              >
                <slot name="item" :item="item" :selected="isItemSelected(item)" :toggle="() => handleItemClick(item)">
                  <div class="item-content">
                    <!-- Checkbox for multiple selection -->
                    <div v-if="multiple" class="option-checkbox">
                      <svg
                        v-if="isItemSelected(item)"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                    <span class="item-text">{{ getItemText(item) }}</span>
                  </div>
                </slot>
              </div>
            </template>

            <div v-else class="no-items">
              <slot name="no-data">
                {{ noDataText }}
              </slot>
            </div>
          </div>
        </div>
      </template>
    </OMenu>
  </div>
</template>

<style scoped>
.dropdown-container {
  position: relative;
  width: 100%;
  min-width: 0;
}

.dropdown-container--full :deep(.custom-menu-container),
.dropdown-container--full :deep(.menu-trigger-element) {
  display: block;
  width: 100%;
}

.dropdown-button {
  width: 100%;
  height: var(--rf-control-height, 2.5rem);
  padding: 0 0.625rem 0 0.75rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  background-color: #fff;
  color: var(--rf-text-primary, #1e293b);
  font-size: 0.8125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.375rem;
  cursor: pointer;
  transition: all 0.15s ease;
  overflow: hidden;
  box-sizing: border-box;
}

.dropdown-button:hover:not(:disabled) {
  border-color: #cbd5e1;
}

.dropdown-button:focus {
  outline: none;
  border-color: var(--rf-accent, #2563eb);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
}

.dropdown-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-button.is-open {
  border-color: var(--rf-accent, #2563eb);
}

.button-text {
  flex: 1;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.25;
}

.dropdown-icon {
  width: 1rem;
  height: 1rem;
  transition: transform 0.2s ease;
  color: var(--rf-text-secondary, #64748b);
  flex-shrink: 0;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-content {
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  min-width: 200px;
}

.items-wrapper {
  max-height: 300px;
  overflow-y: auto;
}

.dropdown-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.15s ease;
  border-bottom: 1px solid #f3f4f6;
  position: relative;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background-color: #f3f4f6;
}

.dropdown-item.selected {
  background-color: #eff6ff;
  color: #1e40af;
  font-weight: 500;
}

.dropdown-item.selected:hover {
  background-color: #dbeafe;
}

.dropdown-item.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background-color: #3b82f6;
}

.item-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.option-checkbox {
  width: 1rem;
  height: 1rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.item-text {
  flex: 1;
  font-size: 0.875rem;
  line-height: 1.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.no-items {
  padding: 2rem 1rem;
  text-align: center;
  color: #9ca3af;
  font-style: italic;
  font-size: 0.875rem;
}
</style>
