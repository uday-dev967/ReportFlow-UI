<script setup>
import { computed, onMounted, ref } from 'vue';
import { useGroupsStore } from '@/stores/groups.store.js';
import { useToast } from '@/composables/useToastComposable.js';
import GroupList from '@/components/groups/GroupList.vue';
import GroupFormModal from '@/components/groups/GroupFormModal.vue';

const store = useGroupsStore();
const { success, error: toastError } = useToast();

const modalOpen = ref(false);
const editingGroup = ref(null);

const existingChatIds = computed(() => store.groups.map((g) => g.chatId));

const openRegister = () => {
  editingGroup.value = null;
  modalOpen.value = true;
};

const openEdit = (group) => {
  editingGroup.value = group;
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingGroup.value = null;
};

const handleSave = async (formData) => {
  const editId = editingGroup.value?._id || null;
  const res = await store.saveGroup(formData, editId);
  if (res.ok) {
    success(editId ? 'Group updated' : 'Group registered');
    closeModal();
  } else {
    toastError(res.message || 'Save failed');
  }
};

const handleDelete = async (id) => {
  const res = await store.removeGroup(id);
  if (res.ok) success('Group deleted');
  else toastError(res.message || 'Delete failed');
};

const handleToggle = async (group) => {
  const res = await store.toggleGroupStatus(group);
  if (!res.ok) toastError(res.message || 'Toggle failed');
};

onMounted(() => {
  store.loadGroups();
});
</script>

<template>
  <div class="groups-view">
    <GroupList
      :groups="store.groups"
      :loading="store.loading"
      @register="openRegister"
      @edit="openEdit"
      @delete="handleDelete"
      @toggle="handleToggle"
    />

    <GroupFormModal
      v-if="modalOpen"
      :group="editingGroup"
      :existing-chat-ids="existingChatIds"
      @save="handleSave"
      @cancel="closeModal"
    />
  </div>
</template>

<style lang="scss" scoped>
.groups-view {
  padding: 1.5rem;
  max-width: var(--rf-content-max-width);
  margin: 0 auto;
  min-height: 100%;
}
</style>
