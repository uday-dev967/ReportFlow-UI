<script setup>
import { inject } from 'vue';

const appImages = inject('appImages');
</script>

<template>
  <div
    class="loading-animation initial-loader trasnlucent-background"
    @mouseup.stop=""
  >
    <img :src="appImages['loader.gif']" alt="" />
  </div>
</template>

<style lang="scss" scoped>
.loading-animation {
  z-index: 20;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #3a393a54;
  pointer-events: all;

  img {
    // width: 8.125rem;
    width: 10%;
    pointer-events: none;
  }
}
</style>
