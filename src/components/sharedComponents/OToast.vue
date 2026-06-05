<script setup>
import { computed, inject, watch } from 'vue';
import { useToast } from '@/composables/useToastComposable';

const convertRemToPixels = inject('convertRemToPixels', null);

const { notifications, removeNotification } = useToast();

const positions = new Set(['top-left', 'top', 'top-right', 'bottom-left', 'bottom', 'bottom-right']);

// Track which notifications are already scheduled for removal
const pendingRemovals = new Set();

// Watch for shouldRemove flag and remove notifications after animation
watch(
  () => notifications.value,
  (newNotifications) => {
    newNotifications.forEach((notification) => {
      if (notification.shouldRemove && !pendingRemovals.has(notification.id)) {
        pendingRemovals.add(notification.id);
        // Delay removal to allow exit animation
        setTimeout(() => {
          removeNotification(notification);
          pendingRemovals.delete(notification.id);
        }, 300);
      }
    });
  },
  { deep: true }
);

// Group notifications by position and sort by creation time
const notificationsByPosition = computed(() => {
  const grouped = {};
  notifications.value.forEach((notification) => {
    const position = notification.position || 'bottom-right';
    if (!grouped[position]) {
      grouped[position] = [];
    }
    grouped[position].push(notification);
  });

  // Sort notifications by creation time (newest first for proper stacking)
  Object.keys(grouped).forEach((position) => {
    grouped[position].sort((a, b) => b.createdAt - a.createdAt);
  });

  return grouped;
});

// Get container style for a specific position
const getContainerStyle = (position, offset = { x: 1, y: 1 }) => {
  let { x, y } = offset;

  // Convert rem to pixels
  x = convertRemToPixels ? convertRemToPixels(x) : x * parseInt(getComputedStyle(document.documentElement).fontSize);
  y = convertRemToPixels ? convertRemToPixels(y) : y * parseInt(getComputedStyle(document.documentElement).fontSize);

  const pos = positions.has(position) ? position : 'bottom-right';
  const styles = {};

  switch (pos) {
    case 'top-right':
      styles.top = `${y}px`;
      styles.right = `${x}px`;
      break;
    case 'top-left':
      styles.top = `${y}px`;
      styles.left = `${x}px`;
      break;
    case 'top':
      styles.top = `${y}px`;
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
      break;
    case 'bottom-left':
      styles.bottom = `${y}px`;
      styles.left = `${x}px`;
      break;
    case 'bottom':
      styles.bottom = `${y}px`;
      styles.left = '50%';
      styles.transform = 'translateX(-50%)';
      break;
    case 'bottom-right':
    default:
      styles.bottom = `${y}px`;
      styles.right = `${x}px`;
      break;
  }

  return styles;
};

// Check if position should have reverse order (for bottom positions)
const isReverseOrder = (position) => {
  return ['bottom-right', 'bottom-left', 'bottom'].includes(position);
};

// Handle close notification
const closeNotification = (notification) => {
  removeNotification(notification);
};
</script>

<template>
  <template v-for="(positionNotifications, position) in notificationsByPosition" :key="position">
    <div
      v-if="positionNotifications.length > 0"
      :class="['toast-container', `position-${position}`]"
      :style="getContainerStyle(position, positionNotifications[0]?.offset)"
    >
      <TransitionGroup
        name="toast"
        tag="div"
        class="toast-stack"
        :class="{ 'reverse-order': isReverseOrder(position) }"
      >
        <div
          v-for="notification in positionNotifications"
          :key="notification.id"
          :class="['toast-notification', `position-${position}`, ...notification.notificationClass]"
        >
          <div class="toast-content">
            <div v-if="notification.iconRef" class="toast-icon" v-html="notification.iconRef"></div>
            <div class="toast-messages">
              <div class="toast-primary-message">{{ notification.primaryMessage }}</div>
              <div v-if="notification.secondaryMessage" class="toast-secondary-message">
                {{ notification.secondaryMessage }}
              </div>
            </div>
            <button
              v-if="notification.showCloseButton"
              @click="closeNotification(notification)"
              class="toast-close-button"
              aria-label="Close notification"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </template>
</template>

<style scoped lang="scss">
.toast-container {
  position: fixed;
  z-index: 10060;
  background: transparent;
  pointer-events: none; // Allow clicks to pass through container

  // Enable pointer events on toast notifications
  .toast-notification {
    pointer-events: auto;
  }
}

.toast-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 80vh; // Prevent toasts from going off-screen
  overflow: hidden; // Hide any overflow instead of scrolling

  // For bottom positions, reverse the order so latest appears at bottom
  .position-bottom-right &,
  .position-bottom-left &,
  .position-bottom & {
    flex-direction: column-reverse;
  }
}

.toast-notification {
  min-width: 18.75rem;
  max-width: 25rem;
  background: #ffffff;
  border-radius: 0.5rem;
  border: 0.0625rem solid #e5e7eb;
  overflow: hidden;
  box-shadow:
    0 0.25rem 0.75rem rgba(0, 0, 0, 0.1),
    0 0.125rem 0.25rem rgba(0, 0, 0, 0.05);
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform, opacity;
  .toast-content {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    gap: 0.75rem;
  }

  .toast-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 0.125rem;
  }

  .toast-messages {
    flex: 1;
    min-width: 0;
  }

  .toast-primary-message {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin: 0;
    line-height: 1.4;
  }

  .toast-secondary-message {
    font-size: 0.8125rem;
    color: #6b7280;
    margin: 0.25rem 0 0 0;
    line-height: 1.4;
  }

  .toast-close-button {
    flex-shrink: 0;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    border-radius: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    svg {
      width: 0.875rem;
      height: 0.875rem;
    }

    &:hover {
      background-color: #f3f4f6;
    }
  }
  &.success {
    border-left: 4px solid #10b981;
    .toast-content {
      .toast-primary-message {
        color: #10b981;
      }
    }
  }

  &.error {
    border-left: 4px solid #ef4444;
    .toast-content {
      .toast-primary-message {
        color: #ef4444;
      }
    }
  }

  &.warning {
    border-left: 4px solid #f59e0b;
    .toast-content {
      .toast-primary-message {
        color: #f59e0b;
      }
    }
  }

  &.info {
    border-left: 4px solid #3b82f6;
    .toast-content {
      .toast-primary-message {
        color: #3b82f6;
      }
    }
  }
}

// =============================================================================
// ANIMATION STATES (using TransitionGroup)
// =============================================================================

// Enter animations
.toast-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// Base enter/leave states
.toast-enter-from {
  opacity: 0;
}

.toast-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave-to {
  opacity: 0;
}

// Position-specific animations for top positions (position class is on toast-notification)
.toast-notification.position-top-left.toast-enter-from,
.toast-notification.position-top.toast-enter-from,
.toast-notification.position-top-right.toast-enter-from {
  transform: translateY(-100%);
}

.toast-notification.position-top-left.toast-leave-to,
.toast-notification.position-top.toast-leave-to,
.toast-notification.position-top-right.toast-leave-to {
  transform: translateY(-100%);
}

// Position-specific animations for bottom positions
.toast-notification.position-bottom-left.toast-enter-from,
.toast-notification.position-bottom.toast-enter-from,
.toast-notification.position-bottom-right.toast-enter-from {
  transform: translateY(100%);
}

.toast-notification.position-bottom-left.toast-leave-to,
.toast-notification.position-bottom.toast-leave-to,
.toast-notification.position-bottom-right.toast-leave-to {
  transform: translateY(100%);
}

.toast-move {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// =============================================================================
// STACKING ANIMATIONS
// =============================================================================

// Stagger animation for multiple toasts appearing at once
.toast-stack {
  .toast-notification {
    &:nth-child(1) {
      transition-delay: 0ms;
    }
    &:nth-child(2) {
      transition-delay: 50ms;
    }
    &:nth-child(3) {
      transition-delay: 100ms;
    }
    &:nth-child(4) {
      transition-delay: 150ms;
    }
    &:nth-child(5) {
      transition-delay: 200ms;
    }
    &:nth-child(n + 6) {
      transition-delay: 250ms;
    }
  }
}
</style>
