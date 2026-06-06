<script setup>
import { ref, reactive, watch, computed, onMounted } from 'vue';
import {
  fetchAvailableGroups,
  fetchContacts,
  createWhatsAppGroup,
  fetchGroupMembers,
  addGroupMembers,
  removeGroupMembers,
  fetchDashboardFilters,
} from '@/network/automation.service.js';
import { useToast } from '@/composables/useToastComposable.js';
import BasicPopup from '@/components/sharedComponents/BasicPopup.vue';
import OInput from '@/components/sharedComponents/OInput.vue';
import ODropdown from '@/components/sharedComponents/ODropdown.vue';

const { success, error: toastError } = useToast();

const props = defineProps({
  group: { type: Object, default: null },
  existingChatIds: { type: Array, default: () => [] },
});

const emit = defineEmits(['save', 'cancel']);

const isEdit = computed(() => !!props.group);
const step = ref(isEdit.value ? 2 : 1);
const step1Tab = ref('existing');

const errors = reactive({});
const form = reactive({
  name: '',
  chatId: '',
  state: '',
  region: '',
  manager: '',
  reportTypes: ['Productivity Report'],
  isActive: true,
});

const waGroups = ref([]);
const waGroupsLoading = ref(false);
const waDisconnected = ref(false);
const groupSearch = ref('');
const useManualEntry = ref(false);

const newGroupName = ref('');
const contactSearch = ref('');
const contacts = ref([]);
const contactsLoading = ref(false);
const selectedContactIds = ref([]);
const creatingGroup = ref(false);
const createGroupError = ref('');

let contactSearchTimer = null;
let addMemberSearchTimer = null;

const members = ref([]);
const membersLoading = ref(false);
const membersError = ref('');
const removingMemberId = ref(null);
const addingMembers = ref(false);
const addMemberSearch = ref('');
const addMemberContactIds = ref([]);

const registeredSet = computed(() => new Set(props.existingChatIds.map(String)));
const memberIdSet = computed(() => new Set(members.value.map((m) => m.id)));
const addableContacts = computed(() =>
  contacts.value.filter((c) => !memberIdSet.value.has(c.id)),
);

const filterOptions = ref({
  states: [],
  managers: [],
  reportTypes: ['Productivity Report'],
  stateRegionMap: {},
});

const filteredWaGroups = computed(() => {
  const q = groupSearch.value.trim().toLowerCase();
  if (!q) return waGroups.value;
  return waGroups.value.filter((g) => (g.name || '').toLowerCase().includes(q));
});

const autoRegion = computed(() =>
  form.state ? filterOptions.value.stateRegionMap[form.state] || '' : '',
);
watch(autoRegion, (r) => {
  form.region = r;
});

const selectedGroupSummary = computed(() => {
  if (!form.name && !form.chatId) return null;
  return { name: form.name, chatId: form.chatId };
});

const populate = (g) => {
  if (!g) {
    form.name = '';
    form.chatId = '';
    form.state = '';
    form.region = '';
    form.manager = '';
    form.reportTypes = ['Productivity Report'];
    form.isActive = true;
    step.value = 1;
    step1Tab.value = 'existing';
    return;
  }
  form.name = g.name || '';
  form.chatId = g.chatId || '';
  form.state = g.state || '';
  form.region = g.region || '';
  form.manager = g.manager || '';
  form.reportTypes = g.reportTypes?.length ? [...g.reportTypes] : ['Productivity Report'];
  form.isActive = g.isActive !== false;
  step.value = 2;
};

watch(() => props.group, populate, { immediate: true });

watch(
  () => props.group?.chatId,
  (chatId) => {
    if (isEdit.value && chatId) loadMembers();
  },
);

function dedupeMembers(list) {
  const byId = new Map();
  for (const m of list) {
    if (m?.id && !byId.has(m.id)) byId.set(m.id, m);
  }
  return [...byId.values()];
}

const loadMembers = async ({ silent = false } = {}) => {
  if (!form.chatId?.trim()) {
    members.value = [];
    return false;
  }
  if (!silent) membersLoading.value = true;
  if (!silent) membersError.value = '';
  try {
    const res = await fetchGroupMembers(form.chatId.trim());
    if (res.ok) {
      members.value = dedupeMembers(res.data.members || []);
      return true;
    }
    members.value = [];
    if (!silent) membersError.value = res.message || 'Could not load group members';
    return false;
  } finally {
    if (!silent) membersLoading.value = false;
  }
};

const refreshMembersAfterMutation = async ({ expectRemoved = [], expectAdded = [] } = {}) => {
  const delays = [0, 500, 1000, 1500, 2500, 3500];
  for (const delay of delays) {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    const ok = await loadMembers({ silent: true });
    if (!ok) continue;
    const ids = new Set(members.value.map((m) => m.id));
    const removedOk = expectRemoved.every((id) => !ids.has(id));
    const addedOk = expectAdded.every((id) => ids.has(id));
    if (removedOk && addedOk) return true;
  }
  return false;
};

const handleRemoveMember = async (member) => {
  if (!form.chatId || removingMemberId.value) return;
  removingMemberId.value = member.id;
  membersError.value = '';
  const res = await removeGroupMembers(form.chatId.trim(), [member.id]);
  removingMemberId.value = null;
  if (res.ok) {
    const removed = res.data?.removed ?? 0;
    if (removed > 0) {
      members.value = members.value.filter((m) => m.id !== member.id);
      success(`Removed ${member.name} from the group`);
      membersError.value = '';
      await refreshMembersAfterMutation({ expectRemoved: [member.id] });
    } else {
      const msg = 'Member could not be removed (you may need admin rights)';
      membersError.value = msg;
      toastError(msg);
    }
  } else {
    const msg = res.message || 'Failed to remove member';
    membersError.value = msg;
    toastError(msg);
  }
};

const toggleAddMemberContact = (id) => {
  const idx = addMemberContactIds.value.indexOf(id);
  if (idx === -1) addMemberContactIds.value.push(id);
  else addMemberContactIds.value.splice(idx, 1);
};

const onAddMemberSearchInput = () => {
  clearTimeout(addMemberSearchTimer);
  addMemberSearchTimer = setTimeout(() => loadContacts(addMemberSearch.value), 350);
};

const handleAddMembers = async () => {
  if (!form.chatId?.trim()) return;
  if (!addMemberContactIds.value.length) {
    const msg = 'Select at least one contact to add';
    membersError.value = msg;
    toastError(msg);
    return;
  }
  addingMembers.value = true;
  membersError.value = '';
  const idsToAdd = [...addMemberContactIds.value];
  const pendingCount = idsToAdd.length;
  const res = await addGroupMembers(form.chatId.trim(), idsToAdd);
  addingMembers.value = false;
  if (res.ok) {
    const added = res.data?.added ?? pendingCount;
    const addedContacts = contacts.value.filter((c) => idsToAdd.includes(c.id));
    members.value = dedupeMembers([...members.value, ...addedContacts]);
    addMemberContactIds.value = [];
    addMemberSearch.value = '';
    loadContacts('');
    success(`Added ${added} member(s) to the group`);
    membersError.value = '';
    await refreshMembersAfterMutation({ expectAdded: idsToAdd });
  } else {
    const msg = res.message || 'Failed to add members';
    membersError.value = msg;
    toastError(msg);
  }
};

const waGroupsHint = ref('');

const loadWaGroups = async () => {
  if (isEdit.value) return;
  waGroupsLoading.value = true;
  waDisconnected.value = false;
  const res = await fetchAvailableGroups();
  waGroupsLoading.value = false;
  if (res.ok) {
    waGroups.value = res.data.groups || [];
    if (!waGroups.value.length && res.data.hint) waGroupsHint.value = res.data.hint;
    return;
  }
  if (res.message?.includes('not ready') || String(res.message).includes('503')) {
    waDisconnected.value = true;
    useManualEntry.value = true;
    step1Tab.value = 'existing';
  }
};

const selectWaGroup = (g) => {
  if (registeredSet.value.has(String(g.chatId || g.id))) return;
  form.name = g.name || '';
  form.chatId = g.chatId || g.id || '';
  step.value = 2;
  Object.keys(errors).forEach((k) => delete errors[k]);
};

const goToStep2Manual = () => {
  if (!form.name.trim() || !form.chatId.trim()) {
    if (!form.name.trim()) errors.name = 'Group name is required';
    if (!form.chatId.trim()) errors.chatId = 'WhatsApp Group ID is required';
    return;
  }
  step.value = 2;
};

const loadContacts = async (q = '') => {
  contactsLoading.value = true;
  const res = await fetchContacts(q);
  contactsLoading.value = false;
  if (res.ok) contacts.value = res.data.contacts || [];
  else contacts.value = [];
};

const onContactSearchInput = () => {
  clearTimeout(contactSearchTimer);
  contactSearchTimer = setTimeout(() => loadContacts(contactSearch.value), 350);
};

const toggleContact = (id) => {
  const idx = selectedContactIds.value.indexOf(id);
  if (idx === -1) selectedContactIds.value.push(id);
  else selectedContactIds.value.splice(idx, 1);
};

const handleCreateWaGroup = async () => {
  createGroupError.value = '';
  if (!newGroupName.value.trim()) {
    createGroupError.value = 'Enter a name for the new group';
    return;
  }
  if (!selectedContactIds.value.length) {
    createGroupError.value = 'Select at least one contact to add';
    return;
  }
  creatingGroup.value = true;
  const res = await createWhatsAppGroup({
    name: newGroupName.value.trim(),
    participantIds: [...selectedContactIds.value],
  });
  creatingGroup.value = false;
  if (res.ok) {
    form.name = res.data.name || newGroupName.value.trim();
    form.chatId = res.data.chatId;
    step.value = 2;
    return;
  }
  createGroupError.value = res.message || 'Failed to create WhatsApp group';
};

const goBack = () => {
  step.value = 1;
};

const toggleReportType = (rt) => {
  const idx = form.reportTypes.indexOf(rt);
  if (idx === -1) form.reportTypes.push(rt);
  else if (form.reportTypes.length > 1) form.reportTypes.splice(idx, 1);
};

const validate = () => {
  Object.keys(errors).forEach((k) => delete errors[k]);
  if (!form.name.trim()) errors.name = 'Group name is required';
  if (!form.chatId.trim()) errors.chatId = 'WhatsApp group is required — go back and select one';
  else {
    const dup = props.existingChatIds.find(
      (id) => id === form.chatId.trim() && id !== props.group?.chatId,
    );
    if (dup) errors.chatId = 'This group is already registered';
  }
  if (!form.state) errors.state = 'State is required';
  if (!form.reportTypes.length) errors.reportTypes = 'Select at least one report type';
  return !Object.keys(errors).length;
};

const handleSave = () => {
  if (!validate()) return;
  emit('save', { ...form, chatId: form.chatId.trim(), name: form.name.trim() });
};

const modalTitle = computed(() => {
  if (isEdit.value) return 'Edit Group';
  if (step.value === 2) return 'Register Group';
  return 'Add WhatsApp Group';
});

const modalSubtitle = computed(() => {
  if (isEdit.value) return 'Update group settings and manage members';
  if (step.value === 2) return 'Step 2 of 2 — Configure report delivery settings';
  return 'Step 1 of 2 — Choose or create a WhatsApp group';
});

const managerItems = computed(() => [
  { text: 'None', value: '' },
  ...filterOptions.value.managers.map((m) => ({ text: m, value: m })),
]);

onMounted(async () => {
  const filtersRes = await fetchDashboardFilters();
  if (filtersRes.ok) {
    filterOptions.value = {
      states: filtersRes.data.states || [],
      managers: filtersRes.data.managers || [],
      reportTypes: filtersRes.data.reportTypes || ['Productivity Report'],
      stateRegionMap: filtersRes.data.stateRegionMap || {},
    };
  }

  if (!isEdit.value) {
    loadWaGroups();
    loadContacts('');
  } else {
    loadMembers();
    loadContacts('');
  }
});
</script>

<template>
  <BasicPopup :max-width="step === 1 && !isEdit ? '44rem' : '40rem'" @popup-outside-click="emit('cancel')">
    <div class="group-modal">
      <div class="modal-header">
        <div class="header-text">
          <h2>{{ modalTitle }}</h2>
          <p>{{ modalSubtitle }}</p>
        </div>
        <button type="button" class="close-btn" aria-label="Close" @click="emit('cancel')">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div v-if="!isEdit" class="step-progress">
        <div class="step-item" :class="{ active: step >= 1, done: step > 1 }">
          <span class="step-dot">1</span>
          <span class="step-label">Select Group</span>
        </div>
        <div class="step-line" :class="{ done: step > 1 }"></div>
        <div class="step-item" :class="{ active: step >= 2 }">
          <span class="step-dot">2</span>
          <span class="step-label">Configure</span>
        </div>
      </div>

      <div class="modal-body">
        <!-- STEP 1 -->
        <template v-if="step === 1 && !isEdit">
          <div v-if="waDisconnected" class="alert-banner warning">
            <svg viewBox="0 0 20 20" fill="none">
              <path d="M10 6v4M10 14h.01" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="1.5" />
            </svg>
            <span>
              WhatsApp is not connected. Start <code>npm run wa:server</code> in the backend, or enter
              group details manually.
            </span>
          </div>

          <div v-if="!waDisconnected" class="tab-bar">
            <button
              type="button"
              class="tab-btn"
              :class="{ active: step1Tab === 'existing' }"
              @click="step1Tab = 'existing'; useManualEntry = false"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5" />
                <path d="M2 16c0-2.761 2.239-5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <circle cx="14" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5" />
                <path d="M10 16c0-2.209 1.343-4 3-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              Register Existing Group
            </button>
            <button
              type="button"
              class="tab-btn"
              :class="{ active: step1Tab === 'create' }"
              @click="step1Tab = 'create'"
            >
              <svg viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
              Create New Group
            </button>
          </div>

          <!-- Existing group tab -->
          <div v-if="step1Tab === 'existing' || waDisconnected" class="tab-panel">
            <template v-if="!useManualEntry">
              <OInput
                v-model="groupSearch"
                label="Search WhatsApp groups"
                placeholder="Filter by group name…"
              />

              <div v-if="waGroupsLoading" class="list-state">Loading WhatsApp groups…</div>

              <div v-else-if="filteredWaGroups.length" class="scroll-list">
                <button
                  v-for="g in filteredWaGroups"
                  :key="g.chatId || g.id"
                  type="button"
                  class="list-item"
                  :class="{ disabled: registeredSet.has(String(g.chatId || g.id)) }"
                  :disabled="registeredSet.has(String(g.chatId || g.id))"
                  @click="selectWaGroup(g)"
                >
                  <div class="list-item-main">
                    <span class="list-item-name">{{ g.name }}</span>
                    <span v-if="g.participantCount != null" class="list-item-meta">
                      {{ g.participantCount }} members
                    </span>
                  </div>
                  <span v-if="registeredSet.has(String(g.chatId || g.id))" class="badge">Registered</span>
                  <svg v-else class="list-item-arrow" viewBox="0 0 16 16" fill="none">
                    <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </button>
              </div>

              <div v-else class="list-state">
                <p>No WhatsApp groups found.</p>
                <p v-if="waGroupsHint" class="hint">{{ waGroupsHint }}</p>
              </div>

              <button
                v-if="!waDisconnected"
                type="button"
                class="link-btn"
                @click="useManualEntry = true"
              >
                Can't find your group? Enter details manually
              </button>
            </template>

            <div v-else class="manual-form">
              <button type="button" class="link-btn back" @click="useManualEntry = false">
                ← Back to group list
              </button>
              <div class="field-group" :class="{ error: errors.name }">
                <OInput v-model="form.name" label="Group Name" placeholder="Group name" />
                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
              </div>
              <div class="field-group" :class="{ error: errors.chatId }">
                <OInput
                  v-model="form.chatId"
                  label="WhatsApp Group ID"
                  placeholder="e.g. 120363…@g.us"
                />
                <span v-if="errors.chatId" class="field-error">{{ errors.chatId }}</span>
              </div>
              <button type="button" class="btn-secondary" @click="goToStep2Manual">
                Continue to Configuration →
              </button>
            </div>
          </div>

          <!-- Create new group tab -->
          <div v-if="step1Tab === 'create' && !waDisconnected" class="tab-panel create-panel-full">
            <div class="create-section">
              <OInput
                v-model="newGroupName"
                label="New Group Name"
                placeholder="e.g. North Region Reports"
              />
              <p class="panel-hint">Give your group a descriptive name for easy identification.</p>
            </div>

            <div class="create-section">
              <label class="field-label">Add Members</label>
              <OInput
                v-model="contactSearch"
                placeholder="Search contacts…"
                @input="onContactSearchInput"
              />

              <div v-if="contactsLoading" class="list-state small">Loading contacts…</div>
              <div v-else-if="contacts.length" class="scroll-list contacts">
                <label
                  v-for="c in contacts"
                  :key="c.id"
                  class="contact-item"
                  :class="{ checked: selectedContactIds.includes(c.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedContactIds.includes(c.id)"
                    @change="toggleContact(c.id)"
                  />
                  <div class="contact-info">
                    <span class="contact-name">{{ c.name }}</span>
                    <span v-if="c.phone" class="contact-phone">{{ c.phone }}</span>
                  </div>
                </label>
              </div>
              <div v-else class="list-state small">No contacts found. Try a different search.</div>

              <div v-if="selectedContactIds.length" class="selection-count">
                {{ selectedContactIds.length }} contact{{ selectedContactIds.length === 1 ? '' : 's' }} selected
              </div>
            </div>

            <p v-if="createGroupError" class="field-error block">{{ createGroupError }}</p>

            <button
              type="button"
              class="btn-primary full-width"
              :disabled="creatingGroup"
              @click="handleCreateWaGroup"
            >
              {{ creatingGroup ? 'Creating on WhatsApp…' : 'Create Group & Continue' }}
            </button>
          </div>
        </template>

        <!-- STEP 2 -->
        <template v-else>
          <div v-if="selectedGroupSummary && !isEdit" class="selected-banner">
            <div class="banner-icon">
              <svg viewBox="0 0 20 20" fill="none">
                <circle cx="7" cy="7" r="3" stroke="currentColor" stroke-width="1.5" />
                <path d="M2 16c0-2.761 2.239-5 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div>
              <span class="banner-label">Selected WhatsApp Group</span>
              <strong>{{ selectedGroupSummary.name }}</strong>
            </div>
          </div>

          <div v-if="isEdit && form.chatId" class="members-card">
            <div class="card-header">
              <h3>WhatsApp Members</h3>
              <span v-if="!membersLoading" class="count-badge">{{ members.length }}</span>
            </div>

            <div v-if="membersLoading" class="list-state">Loading members…</div>
            <div v-else-if="members.length" class="scroll-list members">
              <div v-for="m in members" :key="m.id" class="member-item">
                <div class="member-info">
                  <span class="member-name">{{ m.name }}</span>
                  <span v-if="m.phone" class="member-phone">{{ m.phone }}</span>
                </div>
                <button
                  type="button"
                  class="btn-remove"
                  :disabled="removingMemberId === m.id || members.length <= 1"
                  @click="handleRemoveMember(m)"
                >
                  {{ removingMemberId === m.id ? '…' : 'Remove' }}
                </button>
              </div>
            </div>
            <div v-else class="list-state small">No members returned for this group.</div>

            <div class="add-members-section">
              <label class="field-label">Add members from contacts</label>
              <OInput
                v-model="addMemberSearch"
                placeholder="Search contacts to add…"
                @input="onAddMemberSearchInput"
              />
              <div v-if="contactsLoading" class="list-state small">Loading contacts…</div>
              <div v-else-if="addableContacts.length" class="scroll-list contacts">
                <label
                  v-for="c in addableContacts"
                  :key="c.id"
                  class="contact-item"
                  :class="{ checked: addMemberContactIds.includes(c.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="addMemberContactIds.includes(c.id)"
                    @change="toggleAddMemberContact(c.id)"
                  />
                  <div class="contact-info">
                    <span class="contact-name">{{ c.name }}</span>
                    <span v-if="c.phone" class="contact-phone">{{ c.phone }}</span>
                  </div>
                </label>
              </div>
              <div v-else class="list-state small">No contacts to add.</div>
              <button
                type="button"
                class="btn-secondary"
                :disabled="addingMembers || !addMemberContactIds.length"
                @click="handleAddMembers"
              >
                {{
                  addingMembers
                    ? 'Adding…'
                    : addMemberContactIds.length
                      ? `Add ${addMemberContactIds.length} member(s)`
                      : 'Add members'
                }}
              </button>
            </div>
            <p v-if="membersError" class="field-error block">{{ membersError }}</p>
          </div>

          <div class="config-grid">
            <div class="field-group" :class="{ error: errors.state }">
              <label class="field-label">State <span class="required">*</span></label>
              <ODropdown
                :items="filterOptions.states"
                :model-value="form.state"
                button-text="Select state"
                button-width="100%"
                @update:model-value="form.state = $event || ''"
              />
              <span v-if="errors.state" class="field-error">{{ errors.state }}</span>
            </div>

            <div class="field-group">
              <label class="field-label">Region <span class="auto-tag">auto</span></label>
              <input :value="autoRegion || '—'" type="text" class="rf-input" disabled />
            </div>

            <div class="field-group full-width">
              <label class="field-label">Assigned Manager</label>
              <ODropdown
                :items="managerItems"
                :model-value="form.manager"
                item-text="text"
                item-value="value"
                button-text="Select manager"
                button-width="100%"
                @update:model-value="form.manager = $event || ''"
              />
            </div>

            <div class="field-group full-width" :class="{ error: errors.reportTypes }">
              <label class="field-label">Report Types <span class="required">*</span></label>
              <div class="chip-options">
                <label
                  v-for="rt in filterOptions.reportTypes"
                  :key="rt"
                  class="chip-option"
                  :class="{ checked: form.reportTypes.includes(rt) }"
                >
                  <input
                    type="checkbox"
                    :checked="form.reportTypes.includes(rt)"
                    @change="toggleReportType(rt)"
                  />
                  {{ rt }}
                </label>
              </div>
              <span v-if="errors.reportTypes" class="field-error">{{ errors.reportTypes }}</span>
            </div>

            <div class="field-group full-width">
              <label class="field-label">Status</label>
              <div class="status-toggle">
                <button
                  type="button"
                  class="toggle-switch"
                  :class="{ active: form.isActive }"
                  @click="form.isActive = !form.isActive"
                >
                  <span class="toggle-thumb"></span>
                </button>
                <span :class="form.isActive ? 'status-on' : 'status-off'">
                  {{ form.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
            </div>
          </div>

          <p v-if="errors.chatId" class="field-error block">{{ errors.chatId }}</p>
        </template>
      </div>

      <div class="modal-footer">
        <button
          v-if="!isEdit && step === 2"
          type="button"
          class="btn-ghost"
          @click="goBack"
        >
          ← Back
        </button>
        <div class="footer-spacer"></div>
        <button type="button" class="btn-ghost" @click="emit('cancel')">Cancel</button>
        <button
          v-if="step === 2 || isEdit"
          type="button"
          class="btn-primary"
          @click="handleSave"
        >
          {{ isEdit ? 'Save Changes' : 'Register Group' }}
        </button>
      </div>
    </div>
  </BasicPopup>
</template>

<style lang="scss" scoped>
.group-modal {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.375rem 1.5rem;
  border-bottom: 1px solid var(--rf-surface-border);
  background: linear-gradient(180deg, #fff 0%, #f8fafc 100%);

  h2 {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--rf-text-primary);
  }

  p {
    margin: 0.25rem 0 0;
    font-size: 0.8125rem;
    color: var(--rf-text-secondary);
  }
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  background: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rf-text-secondary);
  flex-shrink: 0;
  transition: all 0.15s ease;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    background: var(--rf-page-bg);
    color: var(--rf-text-primary);
  }
}

.step-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: var(--rf-page-bg);
  border-bottom: 1px solid var(--rf-surface-border);
}

.step-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  opacity: 0.45;
  transition: opacity 0.2s ease;

  &.active {
    opacity: 1;
  }

  &.done .step-dot {
    background: var(--rf-success);
    color: #fff;
  }
}

.step-dot {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background: var(--rf-surface-border);
  color: var(--rf-text-secondary);
  font-size: 0.6875rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step-item.active .step-dot {
  background: var(--rf-accent);
  color: #fff;
}

.step-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rf-text-secondary);
}

.step-line {
  flex: 1;
  height: 2px;
  background: var(--rf-surface-border);
  max-width: 4rem;
  transition: background 0.2s ease;

  &.done {
    background: var(--rf-success);
  }
}

.modal-body {
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: calc(90vh - 12.5rem);
  -webkit-overflow-scrolling: touch;
}

.alert-banner {
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  padding: 0.75rem 1rem;
  border-radius: 0.625rem;
  font-size: 0.8125rem;
  line-height: 1.45;

  svg {
    width: 1.125rem;
    height: 1.125rem;
    flex-shrink: 0;
    margin-top: 0.0625rem;
  }

  &.warning {
    background: var(--rf-warning-light);
    color: #92400e;
    border: 1px solid #fde68a;
  }

  code {
    font-size: 0.75rem;
    background: rgba(0, 0, 0, 0.06);
    padding: 0.125rem 0.25rem;
    border-radius: 0.25rem;
  }
}

.tab-bar {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  padding: 0.25rem;
  background: var(--rf-page-bg);
  border-radius: 0.75rem;
  border: 1px solid var(--rf-surface-border);
}

.tab-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 0.75rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-secondary);
  background: transparent;
  cursor: pointer;
  transition: all 0.15s ease;

  svg {
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  &.active {
    background: #fff;
    color: var(--rf-accent);
    box-shadow: var(--rf-surface-shadow);
  }

  &:not(.active):hover {
    color: var(--rf-text-primary);
  }
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
}

.create-panel-full {
  width: 100%;
}

.create-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;

  & + .create-section {
    margin-top: 0.25rem;
    padding-top: 1rem;
    border-top: 1px solid var(--rf-surface-border);
  }
}

.panel-hint {
  margin: 0;
  font-size: 0.75rem;
  color: var(--rf-text-muted);
}

.scroll-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 14rem;
  overflow-y: auto;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.625rem;
  padding: 0.375rem;
  background: #fff;

  &.contacts {
    max-height: 16rem;
  }

  &.members {
    max-height: 11rem;
  }
}

.list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--rf-accent-light);
    border-color: #bfdbfe;
  }

  &.disabled,
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.list-item-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.list-item-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rf-text-primary);
}

.list-item-meta {
  font-size: 0.6875rem;
  color: var(--rf-text-muted);
}

.list-item-arrow {
  width: 1rem;
  height: 1rem;
  color: var(--rf-text-muted);
  flex-shrink: 0;
}

.badge {
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.1875rem 0.5rem;
  border-radius: 9999px;
  background: var(--rf-page-bg);
  color: var(--rf-text-secondary);
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.625rem;
  border-radius: 0.375rem;
  cursor: pointer;
  user-select: none;
  transition: background 0.1s ease;

  input {
    accent-color: var(--rf-accent);
    cursor: pointer;
  }

  &.checked,
  &:hover {
    background: var(--rf-accent-light);
  }
}

.contact-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
}

.contact-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary);
}

.contact-phone {
  font-size: 0.6875rem;
  color: var(--rf-text-muted);
}

.selection-count {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--rf-accent);
}

.list-state {
  text-align: center;
  padding: 1.5rem 0.5rem;
  font-size: 0.875rem;
  color: var(--rf-text-muted);

  &.small {
    padding: 0.75rem;
  }

  .hint {
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }

  p {
    margin: 0;
  }
}

.link-btn {
  background: none;
  border: none;
  color: var(--rf-accent);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-align: left;

  &:hover {
    text-decoration: underline;
  }

  &.back {
    margin-bottom: 0.25rem;
  }
}

.manual-form {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding: 1rem;
  border: 1px dashed var(--rf-surface-border);
  border-radius: 0.625rem;
  background: var(--rf-page-bg);
}

.selected-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background: var(--rf-accent-light);
  border: 1px solid #bfdbfe;
  border-radius: 0.625rem;
}

.banner-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  background: #fff;
  color: var(--rf-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }
}

.banner-label {
  display: block;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--rf-text-secondary);
}

.members-card {
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h3 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--rf-text-primary);
  }
}

.count-badge {
  font-size: 0.6875rem;
  font-weight: 700;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background: var(--rf-page-bg);
  color: var(--rf-text-secondary);
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.5rem;
  border-radius: 0.375rem;

  &:hover {
    background: var(--rf-page-bg);
  }
}

.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary);
}

.member-phone {
  font-size: 0.6875rem;
  color: var(--rf-text-muted);
}

.btn-remove {
  padding: 0.25rem 0.5rem;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  background: #fff;
  color: var(--rf-error);
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rf-error-light);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.add-members-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--rf-surface-border);
}

.config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.875rem;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;

  &.full-width {
    grid-column: 1 / -1;
  }

  &.error :deep(.input-wrapper) {
    border-color: var(--rf-error);
  }
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary);

  .required {
    color: var(--rf-error);
  }

  .auto-tag {
    font-weight: 400;
    font-size: 0.6875rem;
    color: var(--rf-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
}

.rf-input,
.rf-select {
  height: 2.5rem;
  padding: 0 0.75rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--rf-text-primary);
  background: #fff;
  outline: none;
  width: 100%;

  &:focus {
    border-color: var(--rf-accent);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &:disabled {
    background: var(--rf-page-bg);
    color: var(--rf-text-muted);
  }
}

.field-error {
  font-size: 0.75rem;
  color: var(--rf-error);
  font-weight: 500;

  &.block {
    margin-top: 0.25rem;
  }
}

.chip-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.chip-option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.8125rem;
  cursor: pointer;
  padding: 0.4375rem 0.75rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 9999px;
  transition: all 0.15s ease;

  input {
    accent-color: var(--rf-accent);
  }

  &.checked {
    border-color: var(--rf-accent);
    background: var(--rf-accent-light);
    color: var(--rf-accent);
    font-weight: 600;
  }
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.status-on {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rf-success);
}

.status-off {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-muted);
}

.toggle-switch {
  width: 2.5rem;
  height: 1.375rem;
  border-radius: 9999px;
  background: var(--rf-surface-border);
  border: none;
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: background 0.2s ease;

  &.active {
    background: var(--rf-success);
  }

  .toggle-thumb {
    position: absolute;
    top: 0.1875rem;
    left: 0.1875rem;
    width: 1rem;
    height: 1rem;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  }

  &.active .toggle-thumb {
    transform: translateX(1.125rem);
  }
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--rf-surface-border);
  display: flex;
  align-items: center;
  gap: 0.625rem;
  background: #f8fafc;
}

.footer-spacer {
  flex: 1;
}

.btn-ghost {
  padding: 0.5625rem 1.125rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
  background: #fff;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: var(--rf-text-secondary);
    color: var(--rf-text-primary);
  }
}

.btn-secondary {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border: 1px solid var(--rf-accent);
  border-radius: 0.5rem;
  background: var(--rf-accent-light);
  color: var(--rf-accent);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rf-accent);
    color: #fff;
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.btn-primary {
  padding: 0.5625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--rf-accent);
  color: #fff;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--rf-accent-hover);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  &.full-width {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .config-grid {
    grid-template-columns: 1fr;
  }

  .tab-bar {
    grid-template-columns: 1fr;
  }
}
</style>
