<script setup>
import { toRefs, defineEmits } from 'vue';

const emit = defineEmits();

const props = defineProps({
  height: {
    type: Number,
    required: false,
    default: 27.75, // In Rem
  },
  width: {
    type: Number,
    required: false,
    default: 27.75, // In Rem
  },
});

const { width, height } = toRefs(props);

const onPopupOutsideClick = () => {
  emit('popupOutsideClick');
};
</script>

<template>
  <div class="popup-component-wrapper" @click="onPopupOutsideClick">
    <div
      class="popup-component-container"
      :style="{
        height: `${height}rem`,
        width: `${width}rem`,
      }"
      @click.stop
    >
      <slot></slot>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.popup-component-wrapper {
  z-index: 5;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  display: grid;
  place-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);

  .popup-component-container {
    background-color: #ffffff;
    position: relative;
    border-radius: 0.5rem;
    box-shadow: 0px 0px 83px 0px rgba(16, 7, 36, 0.12);
  }
}
</style>
