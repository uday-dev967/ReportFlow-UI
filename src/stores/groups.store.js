import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  fetchGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  activateGroupSchedules,
  deactivateGroupSchedules,
} from '@/network/automation.service.js';

export const useGroupsStore = defineStore('groups', () => {
  const groups = ref([]);
  const loading = ref(false);
  const error = ref(null);

  async function loadGroups() {
    loading.value = true;
    error.value = null;
    const res = await fetchGroups();
    loading.value = false;
    if (res.ok) {
      groups.value = res.data.groups || [];
    } else {
      error.value = res.message;
    }
    return res;
  }

  async function saveGroup(formData, editId = null) {
    const payload = {
      name: formData.name,
      chatId: formData.chatId,
      isActive: formData.isActive !== false,
      state: formData.state || '',
      region: formData.region || '',
      manager: formData.manager || '',
      reportTypes: formData.reportTypes?.length ? formData.reportTypes : ['Productivity Report'],
    };
    const res = editId
      ? await updateGroup(editId, payload)
      : await createGroup(payload);
    if (res.ok) await loadGroups();
    return res;
  }

  async function removeGroup(id) {
    const res = await deleteGroup(id);
    if (res.ok) {
      groups.value = groups.value.filter((g) => g._id !== id);
    }
    return res;
  }

  async function toggleGroupStatus(group) {
    const id = group._id;
    const wasActive = group.isActive;
    const idx = groups.value.findIndex((g) => g._id === id);

    // Optimistic update
    if (idx !== -1) groups.value[idx] = { ...groups.value[idx], isActive: !wasActive };

    const res = wasActive
      ? await deactivateGroupSchedules(id)
      : await activateGroupSchedules(id);

    if (!res.ok) {
      // Revert on failure
      if (idx !== -1) groups.value[idx] = { ...groups.value[idx], isActive: wasActive };
    } else {
      // Also update isActive via PATCH
      await updateGroup(id, { isActive: !wasActive }).catch(() => {});
    }

    return res;
  }

  return { groups, loading, error, loadGroups, saveGroup, removeGroup, toggleGroupStatus };
});
