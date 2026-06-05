<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const pageTitle = computed(() => {
  const titles = {
    dashboard: 'Dashboard',
    scheduler: 'Scheduler',
    groups: 'Group Registration',
  };
  return titles[route.name] || 'ReportFlow';
});
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <h1 class="page-title">{{ pageTitle }}</h1>
    </div>

    <div class="header-right">
      <div class="user-avatar" title="User">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="7" r="3.5" stroke="currentColor" stroke-width="1.5" />
          <path
            d="M3 17c0-3.866 3.134-7 7-7s7 3.134 7 7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </div>
      <button class="logout-btn" type="button">
        <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M7 15H5a2 2 0 01-2-2V7a2 2 0 012-2h2"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
          <path
            d="M13 13l3-3m0 0l-3-3m3 3H7"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Logout
      </button>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.app-header {
  height: var(--rf-header-height, 3.75rem);
  background-color: var(--rf-header-bg, #ffffff);
  border-bottom: 1px solid var(--rf-header-border, #e2e8f0);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 1.5rem;
  flex-shrink: 0;
  z-index: 10;
}

.page-title {
  font-size: 1.0625rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--rf-page-bg, #f1f5f9);
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  color: var(--rf-text-secondary, #64748b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--rf-text-secondary, #64748b);
  background-color: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    border-color: var(--rf-error, #ef4444);
    color: var(--rf-error, #ef4444);
  }
}
</style>
