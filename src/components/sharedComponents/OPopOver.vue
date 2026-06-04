<script setup>
import { usePopup } from '../composables/usePopupComposable';

const { popup, closePopup, handleOverlayClick, handleFooterClick } = usePopup();

// Handle component updates (for dynamic components)
const handleComponentUpdate = (data) => {
  // You can emit this data or handle it as needed
  console.log('Component updated:', data);
};
</script>

<template>
  <div v-if="popup" class="default-pop-over-styles" @click.stop="handleOverlayClick($event, 'overlayClick')">
    <div class="popup-body" :class="popup.customClass" @click.stop>
      <slot name="header">
        <div class="popup-header">
          <div v-if="popup && popup.title" class="title">
            {{ popup.title }}
          </div>
          <div v-if="popup.showCloseIcon" class="icon-wrapper close-icon" @click="closePopup">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M5 15L15 5M5 5L15 15"
                stroke="#6B7280"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </div>
        </div>
      </slot>

      <div class="popup-content-container">
        <slot name="main">
          <!-- Content slot -->
          <div v-if="popup.content" class="popup-content">
            {{ popup.content }}
          </div>

          <!-- Dynamic component slot -->
          <component
            v-if="popup.component"
            :is="popup.component"
            v-bind="popup.componentProps"
            @update="handleComponentUpdate"
          />
        </slot>

        <slot name="footer">
          <div class="popup-actions" v-if="popup.buttonConfig && popup.buttonConfig.length" @click="handleFooterClick">
            <div v-if="popup.showMandatoryFieldsError" class="error-foot">
              <div class="error-icon-svg">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M12.5999 7.00039C12.5999 10.0932 10.0927 12.6004 6.9999 12.6004C3.90711 12.6004 1.3999 10.0932 1.3999 7.00039C1.3999 3.9076 3.90711 1.40039 6.9999 1.40039C10.0927 1.40039 12.5999 3.9076 12.5999 7.00039ZM7.6999 9.80039C7.6999 10.187 7.3865 10.5004 6.9999 10.5004C6.6133 10.5004 6.2999 10.187 6.2999 9.80039C6.2999 9.41379 6.6133 9.10039 6.9999 9.10039C7.3865 9.10039 7.6999 9.41379 7.6999 9.80039ZM6.9999 3.50039C6.6133 3.50039 6.2999 3.81379 6.2999 4.20039V7.00039C6.2999 7.38699 6.6133 7.70039 6.9999 7.70039C7.3865 7.70039 7.6999 7.38699 7.6999 7.00039V4.20039C7.6999 3.81379 7.3865 3.50039 6.9999 3.50039Z"
                    fill="#EF4444"
                  />
                </svg>
              </div>
              {{ popup.showMandatoryFieldsErrorMsg }}
            </div>
            <div
              v-for="(button, index) in popup.buttonConfig"
              :key="index"
              class="popup-button"
              :class="[...button.classNames, { disabled: button.isDisabled }]"
              @click="button.action(button)"
            >
              <div v-if="button.icon" class="icon-wrapper">
                <img :src="button.icon" />
              </div>
              <div v-if="button.buttonText" class="">
                {{ button.buttonText }}
              </div>
              <span v-if="button?.showSpinningLoader" class="spinning-loader"></span>
            </div>
          </div>
        </slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.close-icon {
  cursor: pointer;
}

.default-pop-over-styles {
  pointer-events: all;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(52, 52, 52, 0.4);
  backdrop-filter: blur(10px);
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  /* Prevent clicks from propagating to elements underneath */
  isolation: isolate;

  .popup-body {
    display: flex;
    padding-bottom: 1.5rem;
    flex-direction: column;
    align-items: flex-start;
    border-radius: 10px;
    background: #fff;
    box-shadow: 0px 1px 30px 0px rgba(0, 0, 0, 0.05);
    max-width: 90vw;
    max-height: 90vh;
    overflow-y: auto;

    .popup-header {
      display: flex;
      padding: 0.5rem 1.5rem;
      justify-content: space-between;
      align-items: center;
      align-self: stretch;
      border-radius: 10px 10px 0px 0px;

      .title {
        color: #000;
        font-size: 1.25rem;
        font-style: normal;
        font-weight: 700;
        line-height: normal;
      }
    }

    .popup-content-container {
      width: 100%;
      display: flex;
      padding: 0px 1.5rem;
      flex-direction: column;
      gap: 1rem;

      .popup-content {
        color: #374151;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      .popup-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 1rem;
        align-self: stretch;
        width: 100%;

        .popup-button {
          display: flex;
          padding: 0.65rem 1rem;
          justify-content: center;
          align-items: center;
          border-radius: 10px;
          border: 1px solid #6b7280;
          background: #fff;
          box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.05);
          color: #000;
          text-align: center;
          font-size: 0.875rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          gap: 0.5rem;

          &:hover:not(.disabled) {
            transform: translateY(-1px);
            box-shadow: 0px 2px 4px 0px rgba(0, 0, 0, 0.1);
          }
        }

        .primary-button {
          background: #ffc500;
          border-color: #ffc500;

          &:hover:not(.disabled) {
            background: #ffe41b;
          }
        }

        .primary-button-v2 {
          background: #ffc500;
          border: none;

          &:hover:not(.disabled) {
            background: #ffe41b;
          }
        }

        .secondary-button-v2 {
          border: 1px solid #e5e7eb;

          &:hover:not(.disabled) {
            color: #4b5563;
            background: #f9fafb;
          }
        }

        .secondary-button-v3 {
          color: #6b7280;
          border: none;
          padding-left: 0;
          padding-right: 0;
          box-shadow: none;
          background: transparent;

          &:hover:not(.disabled) {
            color: #374151;
          }
        }

        .disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  }
}

.error-foot {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  height: 2.25rem;
  gap: 0.25rem;

  .error-icon-svg {
    width: 0.875rem;
    height: 0.875rem;
    aspect-ratio: 1/1;
  }
}

.popup-body {
  animation: popupAnimation 0.15s ease-in;
}

@keyframes popupAnimation {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.spinning-loader {
  width: 0.625rem;
  aspect-ratio: 1;
  border-radius: 50%;
  background:
    radial-gradient(farthest-side, #3246d2 94%, #0000) top/3px 3px no-repeat,
    conic-gradient(#0000 30%, #3246d2);
  -webkit-mask: radial-gradient(farthest-side, #0000 calc(100% - 3px), #000 0);
  animation: l13 1s infinite linear;
}

@keyframes l13 {
  100% {
    transform: rotate(1turn);
  }
}
</style>
