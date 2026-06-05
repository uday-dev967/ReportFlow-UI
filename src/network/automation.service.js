import { automationAxios, DISPATCH_TIMEOUT_MS } from './base/automationAxios';
import { automationRoutes as r } from './base/apiRoutes';

const handle = async (promise) => {
  try {
    const response = await promise;
    return { ok: true, data: response.data };
  } catch (error) {
    const data = error.response?.data;
    const message =
      data?.message ||
      data?.result?.reason ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out — check API terminal for send progress or reduce active groups.'
        : null) ||
      error.message ||
      'Request failed';
    return { ok: false, message, data };
  }
};

// Groups
export const fetchGroups = () => handle(automationAxios.get(r.registeredGroups));
export const createGroup = (data) => handle(automationAxios.post(r.targetGroups, data));
export const updateGroup = (id, data) => handle(automationAxios.put(r.targetGroup(id), data));
export const deleteGroup = (id) => handle(automationAxios.delete(r.targetGroup(id)));
export const activateGroupSchedules = (id) => handle(automationAxios.post(r.activateGroupSchedules(id)));
export const deactivateGroupSchedules = (id) => handle(automationAxios.post(r.deactivateGroupSchedules(id)));

// Schedules
export const fetchSchedules = (params = {}) => handle(automationAxios.get(r.schedules, { params }));
export const createSchedule = (data) => handle(automationAxios.post(r.schedules, data));
export const updateSchedule = (id, data) => handle(automationAxios.put(r.schedule(id), data));
export const deleteSchedule = (id) =>
  handle(automationAxios.delete(r.schedules, { data: { scheduleIds: [id] } }));
export const activateSchedule = (id) => handle(automationAxios.post(r.activateSchedule(id)));
export const deactivateSchedule = (id) => handle(automationAxios.post(r.deactivateSchedule(id)));

// Dashboard
export const fetchDashboardSummary = (filters = {}) => {
  const params = {};
  if (filters.states?.length) params.states = filters.states.join(',');
  if (filters.regions?.length) params.regions = filters.regions.join(',');
  if (filters.managers?.length) params.managers = filters.managers.join(',');
  if (filters.reportType) params.reportType = filters.reportType;
  if (filters.dateRange) params.dateRange = filters.dateRange;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return handle(automationAxios.get(r.dashboardSummary, { params }));
};

export const fetchDashboardTrend = (filters = {}) => {
  const params = {};
  if (filters.dateRange) params.dateRange = filters.dateRange;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return handle(automationAxios.get(r.dashboardTrend, { params }));
};

export const fetchDashboardFilters = () => handle(automationAxios.get(r.dashboardFilters));

/**
 * POST /reports/send — backend generates report image and sends to WhatsApp.
 */
export const dispatchScreenshot = (data) => {
  const body = {
    filters: data.filters || {},
    caption: data.caption,
    scheduleId: data.scheduleId ? String(data.scheduleId) : undefined,
    groupId: data.groupId ? String(data.groupId) : undefined,
    manual: data.manual ? true : undefined,
  };

  return handle(
    automationAxios.post(r.reportsSend, body, {
      timeout: DISPATCH_TIMEOUT_MS,
    }),
  );
};

export const triggerScheduleDispatchNow = (id) =>
  handle(automationAxios.post(r.scheduleDispatchNow(id)));

// Send logs
export const fetchSendLogs = (limit = 10) =>
  handle(automationAxios.get(r.sendLogs, { params: { limit } }));

// WhatsApp
export const fetchWhatsappStatus = () => handle(automationAxios.get(r.whatsappStatus));
export const fetchAvailableGroups = () => handle(automationAxios.get(r.whatsappAvailableGroups));
export const fetchContacts = (q = '') =>
  handle(automationAxios.get(r.whatsappContacts, { params: q ? { q } : {} }));
export const createWhatsAppGroup = (data) => handle(automationAxios.post(r.whatsappCreateGroup, data));

export const fetchGroupMembers = (chatId) =>
  handle(
    automationAxios.get(r.whatsappGroupMembers, {
      params: { chatId },
    }),
  );

export const addGroupMembers = (chatId, participantIds) =>
  handle(
    automationAxios.post(r.whatsappGroupMembersAdd, {
      chatId,
      participantIds,
    }),
  );

export const removeGroupMembers = (chatId, participantIds) =>
  handle(
    automationAxios.post(r.whatsappGroupMembersRemove, {
      chatId,
      participantIds,
    }),
  );

