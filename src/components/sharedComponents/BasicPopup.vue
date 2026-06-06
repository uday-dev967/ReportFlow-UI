<script setup>
import { computed } from 'vue';

const emit = defineEmits(['popupOutsideClick']);

const props = defineProps({
  height: {
    type: Number,
    required: false,
    default: null,
  },
  width: {
    type: Number,
    required: false,
    default: null,
  },
  maxWidth: {
    type: String,
    default: '42rem',
  },
  maxHeight: {
    type: String,
    default: '90vh',
  },
  zIndex: {
    type: Number,
    default: 300,
  },
});

const containerStyle = computed(() => {
  const style = {
    maxWidth: props.maxWidth,
    maxHeight: props.maxHeight,
  };
  if (props.width != null) style.width = `${props.width}rem`;
  if (props.height != null) style.height = `${props.height}rem`;
  return style;
});

const onPopupOutsideClick = () => {
  emit('popupOutsideClick');
};
</script>

<template>
  <div class="popup-component-wrapper" :style="{ zIndex }" @click="onPopupOutsideClick">
    <div class="popup-component-container" :style="containerStyle" @click.stop>
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.popup-component-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(6px);

  .popup-component-container {
    background-color: var(--rf-surface, #ffffff);
    position: relative;
    width: 100%;
    border-radius: 0.875rem;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(0, 0, 0, 0.04);
    overflow: hidden;
  }
}
</style>
