<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { remToPixels } from '../composables/useRemToPixel.js';

// Props
const props = defineProps({
  triggerType: {
    type: String,
    default: 'click',
    validator: (value) => ['click', 'hover'].includes(value),
  },
  offset: {
    type: Array,
    default: () => [0, 0.125],
  },
  placement: {
    type: String,
    default: 'bottom',
    validator: (value) =>
      [
        'top',
        'bottom',
        'left',
        'right',
        'top-start',
        'top-end',
        'bottom-start',
        'bottom-end',
        'left-top',
        'left-bottom',
        'right-top',
        'right-bottom',
      ].includes(value),
  },
  closeOnOutsideClick: {
    type: Boolean,
    default: true,
  },
  closeOnEsc: {
    type: Boolean,
    default: true,
  },
  width: {
    type: [String, Number],
    default: null,
  },
  matchTriggerWidth: {
    type: Boolean,
    default: true,
  },
  menuContentClass: {
    type: Array,
    default: [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  fixedX: {
    type: String,
    required: false,
    default: '',
  },
  fixedY: {
    type: String,
    required: false,
    default: '',
  },
  menuId: {
    type: String,
    default: '',
  },
  stopPropagation: {
    type: Boolean,
    default: true,
  },
});

// Emits
const emit = defineEmits(['open', 'close']);

// Refs
const menuContainer = ref(null);
const triggerEl = ref(null);
const menuEl = ref(null);
const isOpen = ref(false);
const hoverTimeoutId = ref(null);
const menuPosition = ref({ top: '0px', left: '0px', width: props.width });
const actualPlacement = ref(props.placement);
const maxRetries = ref(0);

// Computed
const menuStyle = computed(() => {
  return {
    position: 'absolute',
    top: props.fixedY ? props.fixedY : menuPosition.value.top,
    left: props.fixedX ? props.fixedX : menuPosition.value.left,
    width: menuPosition.value.width,
    zIndex: 1000,
    visibility: isOpen.value ? 'visible' : 'hidden',
  };
});

// Methods
const handleTriggerClick = (event) => {
  event.preventDefault();
  if (props.stopPropagation) {
    event.stopPropagation();
  }

  if (props.triggerType === 'click') {
    toggleMenu();
  }
};

const toggleMenu = () => {
  if (isOpen.value) {
    closeMenu();
  } else {
    openMenu();
  }
};

const openMenu = () => {
  if (props.disabled) return;
  if (isOpen.value) return;

  isOpen.value = true;
  emit('open');

  updatePosition();
};

const closeMenu = () => {
  if (props.disabled) return;
  if (!isOpen.value) return;

  isOpen.value = false;
  emit('close');
};

// Hover handling
const handleMouseEnter = () => {
  clearHoverTimeout();
  openMenu();
};

const handleMouseLeave = () => {
  if (hoverTimeoutId.value) {
    clearTimeout(hoverTimeoutId.value);
  }
  hoverTimeoutId.value = setTimeout(() => {
    closeMenu();
  }, 100);
};

const handleMenuMouseLeave = () => {
  if (hoverTimeoutId.value) {
    clearTimeout(hoverTimeoutId.value);
  }
  hoverTimeoutId.value = setTimeout(() => {
    closeMenu();
  }, 100);
};

const clearHoverTimeout = () => {
  if (hoverTimeoutId.value) {
    clearTimeout(hoverTimeoutId.value);
    hoverTimeoutId.value = null;
  }
};

// Collision detection helper
const getViewportBounds = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    scrollTop: window.pageYOffset || document.documentElement.scrollTop,
    scrollLeft: window.pageXOffset || document.documentElement.scrollLeft,
  };
};

const detectCollisions = (position, menuRect) => {
  const viewport = getViewportBounds();
  const collisions = {
    top: position.top < viewport.scrollTop,
    bottom: position.top + menuRect.height > viewport.scrollTop + viewport.height,
    left: position.left < viewport.scrollLeft,
    right: position.left + menuRect.width > viewport.scrollLeft + viewport.width,
  };

  return collisions;
};

const getFlippedPlacement = (placement, collisions) => {
  // Only flip if there's a collision and flipping would help
  if (placement.includes('bottom') && collisions.bottom && !collisions.top) {
    return placement.replace('bottom', 'top');
  }
  if (placement.includes('top') && collisions.top && !collisions.bottom) {
    return placement.replace('top', 'bottom');
  }
  if (placement.includes('right') && collisions.right && !collisions.left) {
    return placement.replace('right', 'left');
  }
  if (placement.includes('left') && collisions.left && !collisions.right) {
    return placement.replace('left', 'right');
  }

  return placement;
};

// Position calculation with collision detection
const calculatePosition = () => {
  if (!triggerEl.value || !menuEl.value) {
    return { top: '0px', left: '0px', width: 'auto' };
  }

  const triggerRect = triggerEl.value.getBoundingClientRect();
  const menuRect = menuEl.value.getBoundingClientRect();
  const viewport = getViewportBounds();

  const offsetX = remToPixels(props.offset[0]);
  const offsetY = remToPixels(props.offset[1]);

  // Calculate width first
  let width = 'auto';
  if (props.width) {
    width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  } else if (props.matchTriggerWidth) {
    width = `${triggerRect.width}px`;
  }

  // Calculate initial position based on placement
  let position = calculateInitialPosition(triggerRect, menuRect, props.placement, offsetX, offsetY, viewport);

  // Detect collisions
  const collisions = detectCollisions(position, menuRect);

  // Get flipped placement if needed
  const flippedPlacement = getFlippedPlacement(props.placement, collisions);
  actualPlacement.value = flippedPlacement;

  // Recalculate with flipped placement if it changed
  if (flippedPlacement !== props.placement) {
    position = calculateInitialPosition(triggerRect, menuRect, flippedPlacement, offsetX, offsetY, viewport);
  }

  // Final adjustments to keep within viewport bounds
  position = adjustForViewportBounds(position, menuRect, viewport);

  return {
    top: `${position.top}px`,
    left: `${position.left}px`,
    width,
    menuRect: menuRect,
    triggerRect: triggerRect,
  };
};

const calculateInitialPosition = (triggerRect, menuRect, placement, offsetX, offsetY, viewport) => {
  let top, left;

  switch (placement) {
    case 'bottom-start':
      top = triggerRect.bottom + viewport.scrollTop + offsetY;
      left = triggerRect.left + viewport.scrollLeft + offsetX;
      break;
    case 'bottom-end':
      top = triggerRect.bottom + viewport.scrollTop + offsetY;
      left = triggerRect.right + viewport.scrollLeft - menuRect.width - offsetX;
      break;
    case 'top-start':
      top = triggerRect.top + viewport.scrollTop - menuRect.height - offsetY;
      left = triggerRect.left + viewport.scrollLeft + offsetX;
      break;
    case 'top-end':
      top = triggerRect.top + viewport.scrollTop - menuRect.height - offsetY;
      left = triggerRect.right + viewport.scrollLeft - menuRect.width - offsetX;
      break;
    case 'left-top':
      top = triggerRect.top + viewport.scrollTop + offsetY;
      left = triggerRect.left + viewport.scrollLeft - menuRect.width - offsetX;
      break;
    case 'left-bottom':
      top = triggerRect.bottom + viewport.scrollTop - menuRect.height + offsetY;
      left = triggerRect.left + viewport.scrollLeft - menuRect.width - offsetX;
      break;
    case 'right-top':
      top = triggerRect.top + viewport.scrollTop + offsetY;
      left = triggerRect.right + viewport.scrollLeft + offsetX;
      break;
    case 'right-bottom':
      top = triggerRect.bottom + viewport.scrollTop - menuRect.height + offsetY;
      left = triggerRect.right + viewport.scrollLeft + offsetX;
      break;
    case 'top':
      top = triggerRect.top + viewport.scrollTop - menuRect.height - offsetY;
      left = triggerRect.left + viewport.scrollLeft + (triggerRect.width - menuRect.width) / 2 + offsetX;
      break;
    case 'right':
      top = triggerRect.top + viewport.scrollTop + (triggerRect.height - menuRect.height) / 2 + offsetY;
      left = triggerRect.right + viewport.scrollLeft + offsetX;
      break;
    case 'left':
      top = triggerRect.top + viewport.scrollTop + (triggerRect.height - menuRect.height) / 2 + offsetY;
      left = triggerRect.left + viewport.scrollLeft - menuRect.width - offsetX;
      break;
    case 'bottom':
    default:
      top = triggerRect.bottom + viewport.scrollTop + offsetY;
      left = triggerRect.left + viewport.scrollLeft + (triggerRect.width - menuRect.width) / 2 + offsetX;
      break;
  }

  return { top, left };
};

const adjustForViewportBounds = (position, menuRect, viewport) => {
  let { top, left } = position;

  // Adjust horizontal position
  if (left < viewport.scrollLeft) {
    left = viewport.scrollLeft + 8; // 8px padding from edge
  } else if (left + menuRect.width > viewport.scrollLeft + viewport.width) {
    left = viewport.scrollLeft + viewport.width - menuRect.width - 8;
  }

  // Adjust vertical position
  if (top < viewport.scrollTop) {
    top = viewport.scrollTop + 8;
  } else if (top + menuRect.height > viewport.scrollTop + viewport.height) {
    top = viewport.scrollTop + viewport.height - menuRect.height - 8;
  }

  return { top, left };
};

const updatePosition = () => {
  if (menuEl.value && isOpen.value && triggerEl.value) {
    nextTick(() => {
      const { menuRect, triggerRect, ...newPosition } = calculatePosition();
      menuPosition.value = newPosition;
      reCalculatePosition(menuRect, triggerRect);
    });
  }
};

const reCalculatePosition = (menuRect) => {
  const isInvalid = menuRect.x <= 0 || menuRect.y <= 0 || menuRect.width <= 0 || menuRect.height <= 0;
  if (isInvalid && maxRetries.value < 3) {
    maxRetries.value++;
    updatePosition();
  } else {
    maxRetries.value = 0;
  }
};
// Event handlers
const handleOutsideClick = (event) => {
  if (!props.closeOnOutsideClick || !isOpen.value) return;

  const target = event.target;
  if (
    menuEl.value &&
    !menuEl.value.contains(target) &&
    triggerEl.value &&
    !triggerEl.value.contains(target) &&
    menuContainer.value &&
    !menuContainer.value.contains(target)
  ) {
    closeMenu();
  }
};

const handleKeyDown = (event) => {
  if (props.closeOnEsc && isOpen.value && event.key === 'Escape') {
    closeMenu();
  }
};

const handleResize = () => {
  if (isOpen.value) {
    updatePosition();
  }
};

const handleScroll = () => {
  if (isOpen.value) {
    updatePosition();
  }
};

const handleMouseToggleEvents = (type) => {
  if (props.triggerType === 'hover') {
    switch (type) {
      case 'enter':
        handleMouseEnter();
        break;
      case 'leave':
        handleMouseLeave();
        break;
    }
  }
};

const getMenuTriggerId = () => {
  if (props.menuId) {
    return props.menuId + 'Trigger';
  }
};

const getMenuContentId = () => {
  if (props.menuId) {
    return props.menuId + 'Content';
  }
};

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleOutsideClick, true);
  document.addEventListener('keydown', handleKeyDown);
  window.addEventListener('resize', handleResize);
  window.addEventListener('scroll', handleScroll, true);
});

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick, true);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('scroll', handleScroll, true);
  clearHoverTimeout();
});

// Watch for placement changes
watch(
  () => props.placement,
  () => {
    if (isOpen.value) {
      updatePosition();
    }
  }
);

watch(
  () => props.width,
  () => {
    menuPosition.value.width = props.width;
  }
);

// Expose methods
defineExpose({
  isOpen,
  openMenu,
  closeMenu,
  toggleMenu,
  actualPlacement,
});
</script>

<template>
  <div class="custom-menu-container" ref="menuContainer">
    <!-- Trigger element using a slot -->
    <div
      ref="triggerEl"
      class="menu-trigger-element"
      :id="getMenuTriggerId()"
      @click="handleTriggerClick"
      @mouseenter="handleMouseToggleEvents('enter')"
      @mouseleave="handleMouseToggleEvents('leave')"
    >
      <slot name="trigger" :isOpen="isOpen"></slot>
    </div>

    <!-- Menu content using teleport to move it to body for better positioning -->
    <Teleport to="body">
      <Transition name="menu-fade">
        <div
          v-show="isOpen"
          ref="menuEl"
          class="menu-content"
          :id="getMenuContentId()"
          :style="menuStyle"
          :class="menuContentClass"
          @mouseenter="triggerType === 'hover' ? clearHoverTimeout() : null"
          @mouseleave="triggerType === 'hover' ? handleMenuMouseLeave() : null"
          @click.stop
        >
          <slot name="content"></slot>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style lang="scss" scoped>
.custom-menu-container {
  position: relative;
  display: inline-block;

  .menu-content {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid #e5e7eb;
    box-shadow:
      0 10px 15px -3px rgba(0, 0, 0, 0.1),
      0 4px 6px -2px rgba(0, 0, 0, 0.05);
    min-width: 7.5rem;
    max-height: 18.75rem;
    overflow-y: auto;
  }
}

.menu-fade-enter-active {
  transition:
    opacity 0.2s ease-out,
    transform 0.2s ease-out;
}

.menu-fade-leave-active {
  transition:
    opacity 0.15s ease-in,
    transform 0.15s ease-in;
}

.menu-fade-enter-from {
  opacity: 0;
  transform: translateY(-0.25rem);
}

.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-0.25rem);
}
</style>
