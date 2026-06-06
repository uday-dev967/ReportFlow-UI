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
  <div class="sidebar-shell" :class="{ collapsed }">
    <aside class="app-sidebar">
      <div class="sidebar-header">
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
    </aside>

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
  </div>
</template>

<style lang="scss" scoped>
.sidebar-shell {
  position: relative;
  flex-shrink: 0;
  width: var(--rf-sidebar-width, 14rem);
  height: 100vh;
  transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 20;

  &.collapsed {
    width: 3.75rem;
  }
}

.app-sidebar {
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #1e293b 0%, #1a2332 100%);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.sidebar-header {
  display: flex;
  align-items: center;
  padding: 1rem 0.875rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  min-height: 3.75rem;
  flex-shrink: 0;
}

.sidebar-brand {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  overflow: hidden;
  white-space: nowrap;
  min-width: 0;

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
    box-shadow: 0 2px 8px rgba(37, 99, 235, 0.35);
    flex-shrink: 0;

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
    transition: opacity 0.2s ease, width 0.2s ease;
  }
}

.collapsed .sidebar-header {
  justify-content: center;
  padding: 1rem 0.5rem;
}

.collapsed .sidebar-brand {
  justify-content: center;
}

.collapsed .sidebar-brand .brand-name {
  width: 0;
  opacity: 0;
  pointer-events: none;
}

.collapse-btn {
  position: absolute;
  top: 1.375rem;
  right: 0;
  transform: translateX(50%);
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.625rem;
  height: 1.625rem;
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 9999px;
  color: var(--rf-text-secondary, #64748b);
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.12);
  transition: all 0.15s ease;

  svg {
    width: 0.75rem;
    height: 0.75rem;
  }

  &:hover {
    background: var(--rf-accent-light, #eff6ff);
    color: var(--rf-accent, #2563eb);
    border-color: #bfdbfe;
  }
}

.sidebar-nav {
  flex: 1;
  padding: 0.75rem 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5625rem 0.625rem;
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

    .nav-icon {
      color: var(--rf-accent);
    }
  }

  .nav-icon {
    width: 1.25rem;
    height: 1.25rem;
    min-width: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

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
    transition: opacity 0.2s ease;
  }
}

.collapsed .sidebar-nav {
  padding: 0.75rem 0.5rem;
  align-items: center;
}

.collapsed .nav-item {
  justify-content: center;
  align-items: center;
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  gap: 0;

  .nav-label {
    display: none;
  }

  .nav-icon {
    margin: 0;
  }
}
</style>
