<script setup>
import { onMounted, computed } from 'vue';
import { ref } from 'vue';
import { useSchedulerStore } from '@/stores/scheduler.store.js';
import { useToast } from '@/composables/useToastComposable.js';
import ScheduleList from '@/components/scheduler/ScheduleList.vue';
import ScheduleFormDrawer from '@/components/scheduler/ScheduleFormDrawer.vue';
import SendLogPanel from '@/components/scheduler/SendLogPanel.vue';

const store = useSchedulerStore();
const { success, error: toastError } = useToast();

const drawerOpen = ref(false);
const editingSchedule = ref(null);

const activeScheduleCount = computed(
  () => store.schedules.filter((s) => s.isRunning).length,
);

const openCreate = () => {
  editingSchedule.value = null;
  drawerOpen.value = true;
};

const openEdit = (schedule) => {
  editingSchedule.value = schedule;
  drawerOpen.value = true;
};

const closeDrawer = () => {
  drawerOpen.value = false;
  editingSchedule.value = null;
};

const handleSave = async (formData) => {
  const editId = editingSchedule.value?._id || null;
  const res = await store.saveSchedule(formData, editId);
  if (res.ok) {
    success(editId ? 'Schedule updated' : 'Schedule created');
    closeDrawer();
  } else {
    toastError(res.message || 'Save failed');
  }
};

const handleDelete = async (id) => {
  const res = await store.removeSchedule(id);
  if (res.ok) success('Schedule deleted');
  else toastError(res.message || 'Delete failed');
};

const handleToggle = async (schedule) => {
  const res = await store.toggleSchedule(schedule);
  if (!res.ok) toastError(res.message || 'Toggle failed');
};

onMounted(() => {
  store.loadSchedules();
  store.loadSendLogs();
});
</script>

<template>
  <div class="scheduler-view">
    <div v-if="activeScheduleCount > 0" class="auto-send-banner">
      Auto-send active — {{ activeScheduleCount }} schedule{{
        activeScheduleCount === 1 ? '' : 's'
      }}
      — backend generates reports and sends to WhatsApp automatically
    </div>

    <ScheduleList
      :schedules="store.schedules"
      :loading="store.loading"
      @create="openCreate"
      @edit="openEdit"
      @delete="handleDelete"
      @toggle="handleToggle"
    />

    <SendLogPanel :logs="store.sendLogs" :loading="store.logsLoading" />

    <ScheduleFormDrawer
      v-if="drawerOpen"
      :schedule="editingSchedule"
      @save="handleSave"
      @cancel="closeDrawer"
    />
  </div>
</template>

<style lang="scss" scoped>
.scheduler-view {
  padding: 1.5rem;
  background: var(--rf-page-bg, #f1f5f9);
  min-height: 100%;
}

.auto-send-banner {
  margin-bottom: 1rem;
  padding: 0.625rem 1rem;
  background: var(--rf-success-light, #ecfdf5);
  border: 1px solid #a7f3d0;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #047857;
}
</style>
