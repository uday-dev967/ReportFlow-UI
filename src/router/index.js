import { createRouter, createWebHashHistory } from 'vue-router';
import LoginWrapper from '../views/LoginWrapper.vue';
import DashboardView from '../views/DashboardView.vue';
import SchedulerView from '../views/SchedulerView.vue';
import GroupsView from '../views/GroupsView.vue';

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
    },
    {
      path: '/scheduler',
      name: 'scheduler',
      component: SchedulerView,
    },
    {
      path: '/groups',
      name: 'groups',
      component: GroupsView,
    },
    {
      path: '/login',
      name: 'login',
      component: LoginWrapper,
    },
  ],
});

export default router;
