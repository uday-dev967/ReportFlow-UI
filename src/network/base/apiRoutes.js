export const routes = {
  // Legacy auth routes
  getLoginURL: 'login/url',
  login: 'login',
};

const BASE = '/Automation/v1.0';

export const automationRoutes = {
  // Groups
  registeredGroups: `${BASE}/registered-groups`,
  targetGroups: `${BASE}/target-groups`,
  targetGroup: (id) => `${BASE}/target-groups/${id}`,
  activateGroupSchedules: (id) => `${BASE}/target-groups/${id}/activate-schedules`,
  deactivateGroupSchedules: (id) => `${BASE}/target-groups/${id}/deactivate-schedules`,

  // Schedules
  schedules: `${BASE}/screenshot-dispatch-schedules`,
  schedulesStatus: `${BASE}/screenshot-dispatch-schedules/status`,
  schedule: (id) => `${BASE}/screenshot-dispatch-schedules/${id}`,
  activateSchedule: (id) => `${BASE}/screenshot-dispatch-schedules/${id}/activate`,
  deactivateSchedule: (id) => `${BASE}/screenshot-dispatch-schedules/${id}/deactivate`,
  scheduleDispatchNow: (id) => `${BASE}/screenshot-dispatch-schedules/${id}/dispatch-now`,

  // Dashboard
  dashboardSummary: `${BASE}/dashboard/summary`,
  dashboardTrend: `${BASE}/dashboard/trend`,
  dashboardFilters: `${BASE}/dashboard/filters`,

  // Report dispatch
  reportsSend: `${BASE}/reports/send`,

  // Send logs
  sendLogs: `${BASE}/send-logs`,

  // WhatsApp
  whatsappStatus: `${BASE}/whatsapp/connection-status`,
  whatsappAvailableGroups: `${BASE}/whatsapp/available-groups`,
  whatsappContacts: `${BASE}/whatsapp/contacts`,
  whatsappCreateGroup: `${BASE}/whatsapp/groups`,
  whatsappGroupMembers: `${BASE}/whatsapp/group-members`,
  whatsappGroupMembersAdd: `${BASE}/whatsapp/group-members/add`,
  whatsappGroupMembersRemove: `${BASE}/whatsapp/group-members/remove`,
};
