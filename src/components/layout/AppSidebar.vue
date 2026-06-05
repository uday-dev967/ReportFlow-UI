<script setup>
import { ref } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

const route = useRoute();

const collapsed = ref(localStorage.getItem('rf-sidebar-collapsed') === 'true');

const toggleCollapsed = () => {
  collapsed.value = !collapsed.value;
  localStorage.setItem('rf-sidebar-collapsed', String(collapsed.value));
};
</script>

<template>
  <aside class="app-sidebar" :class="{ collapsed }">
    <div class="sidebar-brand">
      <div class="brand-icon">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="14" width="4" height="7" rx="1" fill="currentColor" />
          <rect x="10" y="8" width="4" height="13" rx="1" fill="currentColor" />
          <rect x="17" y="3" width="4" height="18" rx="1" fill="currentColor" />
        </svg>
      </div>
      <span class="brand-name">ReportFlow</span>
    </div>

    <nav class="sidebar-nav">
      <RouterLink
        to="/dashboard"
        class="nav-item"
        :class="{ active: route.path === '/dashboard' }"
        :title="collapsed ? 'Dashboard' : undefined"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" />
          </svg>
        </span>
        <span class="nav-label">Dashboard</span>
      </RouterLink>

      <RouterLink
        to="/scheduler"
        class="nav-item"
        :class="{ active: route.path === '/scheduler' }"
        :title="collapsed ? 'Scheduler' : undefined"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M10 6V10L13 12"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="nav-label">Scheduler</span>
      </RouterLink>

      <RouterLink
        to="/groups"
        class="nav-item"
        :class="{ active: route.path === '/groups' }"
        :title="collapsed ? 'Groups' : undefined"
      >
        <span class="nav-icon">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6.5" r="2.5" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M2 16c0-2.761 2.239-5 5-5"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
            <circle cx="13.5" cy="7" r="2" stroke="currentColor" stroke-width="1.5" />
            <path
              d="M10.5 16c0-2.209 1.343-4 3-4s3 1.791 3 4"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
            />
          </svg>
        </span>
        <span class="nav-label">Groups</span>
      </RouterLink>
    </nav>

    <button
      type="button"
      class="collapse-btn"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="toggleCollapsed"
    >
      <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          v-if="!collapsed"
          d="M13 5l-5 5 5 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <path
          v-else
          d="M7 5l5 5-5 5"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>
  </aside>
</template>

<style lang="scss" scoped>
.app-sidebar {
  width: var(--rf-sidebar-width, 14rem);
  height: 100vh;
  background-color: var(--rf-sidebar-bg, #1a2332);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.collapsed {
    width: 3.75rem;
  }
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 1.125rem 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  overflow: hidden;
  white-space: nowrap;

  .brand-icon {
    width: 2rem;
    height: 2rem;
    min-width: 2rem;
    background: var(--rf-accent, #2563eb);
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    svg {
      width: 1rem;
      height: 1rem;
    }
  }

  .brand-name {
    font-size: 0.9375rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.01em;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.15s ease;
  }
}

.collapsed .sidebar-brand .brand-name {
  opacity: 0;
  pointer-events: none;
}

.sidebar-nav {
  flex: 1;
  padding: 0.625rem 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5625rem 0.5rem;
  border-radius: 0.5rem;
  text-decoration: none;
  color: var(--rf-sidebar-text, #94a3b8);
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
  overflow: hidden;
  white-space: nowrap;

  &:hover {
    background-color: var(--rf-sidebar-hover-bg, rgba(255, 255, 255, 0.06));
    color: var(--rf-sidebar-text-hover, #cbd5e1);
  }

  &.active {
    background-color: var(--rf-sidebar-active-bg, rgba(255, 255, 255, 0.12));
    color: var(--rf-sidebar-active-text, #ffffff);
  }

  .nav-icon {
    width: 1.25rem;
    height: 1.25rem;
    min-width: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
      width: 1.125rem;
      height: 1.125rem;
    }
  }

  .nav-label {
    font-size: 0.875rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    opacity: 1;
    transition: opacity 0.15s ease;
  }
}

.collapsed .nav-item {
  justify-content: center;
  padding: 0.5625rem;

  .nav-label {
    opacity: 0;
    width: 0;
    pointer-events: none;
  }
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0.5rem 0.375rem 0.75rem;
  padding: 0.5rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.375rem;
  color: var(--rf-sidebar-text, #94a3b8);
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  svg {
    width: 1rem;
    height: 1rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    border-color: rgba(255, 255, 255, 0.2);
  }
}
</style>
