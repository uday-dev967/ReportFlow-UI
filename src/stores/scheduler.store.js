import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  activateSchedule,
  deactivateSchedule,
  fetchSendLogs,
} from '@/network/automation.service.js';

export const useSchedulerStore = defineStore('scheduler', () => {
  const schedules = ref([]);
  const sendLogs = ref([]);
  const loading = ref(false);
  const logsLoading = ref(false);
  const error = ref(null);

  async function loadSchedules() {
    loading.value = true;
    error.value = null;
    const res = await fetchSchedules();
    loading.value = false;
    if (res.ok) {
      schedules.value = res.data.schedules || [];
    } else {
      error.value = res.message;
    }
    return res;
  }

  async function saveSchedule(formData, editId = null) {
    const payload = {
      name: formData.name,
      groupIds: formData.groupIds,
      cron: formData.cron,
      timezone: formData.timezone || 'Asia/Kolkata',
      caption: formData.caption || '',
      isActive: formData.isActive !== false,
      filters: formData.filters || {
        states: [],
        regions: [],
        managers: [],
        reportType: 'Productivity Report',
        dateRange: 'last30days',
        startDate: '',
        endDate: '',
      },
    };
    const res = editId
      ? await updateSchedule(editId, payload)
      : await createSchedule(payload);
    if (res.ok) {
      await loadSchedules();
    }
    return res;
  }

  async function removeSchedule(id) {
    const res = await deleteSchedule(id);
    if (res.ok) {
      schedules.value = schedules.value.filter((s) => s._id !== id);
    }
    return res;
  }

  async function toggleSchedule(schedule) {
    const id = schedule._id;
    const wasRunning = schedule.isRunning;
    const idx = schedules.value.findIndex((s) => s._id === id);
    if (idx !== -1) schedules.value[idx] = { ...schedules.value[idx], isRunning: !wasRunning };

    const res = wasRunning ? await deactivateSchedule(id) : await activateSchedule(id);
    if (!res.ok) {
      if (idx !== -1) schedules.value[idx] = { ...schedules.value[idx], isRunning: wasRunning };
    }
    return res;
  }

  async function loadSendLogs() {
    logsLoading.value = true;
    const res = await fetchSendLogs(10);
    logsLoading.value = false;
    if (res.ok) {
      sendLogs.value = res.data.logs || [];
    }
    return res;
  }

  return {
    schedules,
    sendLogs,
    loading,
    logsLoading,
    error,
    loadSchedules,
    saveSchedule,
    removeSchedule,
    toggleSchedule,
    loadSendLogs,
  };
});
