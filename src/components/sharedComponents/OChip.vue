<script setup>
defineProps({
  chip: { type: String, required: true },
  closable: { type: Boolean, default: false },
});

const emit = defineEmits(['on-delete-chip']);
</script>

<template>
  <span class="o-chip">
    <span class="o-chip__text">{{ chip }}</span>
    <button
      v-if="closable"
      type="button"
      class="o-chip__close"
      aria-label="Remove"
      @click.stop="emit('on-delete-chip')"
    >
      <svg viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3L3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </button>
  </span>
</template>

<style scoped lang="scss">
.o-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--rf-accent-light, #eff6ff);
  color: var(--rf-accent, #2563eb);
  font-size: 0.75rem;
  font-weight: 500;
  max-width: 10rem;
}

.o-chip__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.o-chip__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.875rem;
  height: 0.875rem;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  opacity: 0.7;
  flex-shrink: 0;

  svg {
    width: 0.625rem;
    height: 0.625rem;
  }

  &:hover {
    opacity: 1;
  }
}
</style>
