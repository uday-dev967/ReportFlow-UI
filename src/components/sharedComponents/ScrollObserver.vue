<script setup>
import { ref, onMounted } from 'vue'

const emit = defineEmits(['scrolledToEnd'])

let observer = ref(null)
const root = ref(null)
// let page = ref(0)

onMounted(() => {
  observer.value = new IntersectionObserver(([entry]) => {
    if (entry && entry.isIntersecting) {
      emit('scrolledToEnd')
    }
  })
  observer.value.observe(root.value)
})
</script>

<template>
  <div ref="root" class="observer"></div>
</template>

<style>
.observer {
  height: 1px;
}
</style>
