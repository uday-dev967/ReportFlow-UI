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

const { success, error: toastError } = useToast();

const props = defineProps({
  group: { type: Object, default: null },
  existingChatIds: { type: Array, default: () => [] },
});

const emit = defineEmits(['save', 'cancel']);

const isEdit = computed(() => !!props.group);
const step = ref(isEdit.value ? 2 : 1);

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

// Step 1 — WhatsApp groups
const waGroups = ref([]);
const waGroupsLoading = ref(false);
const waDisconnected = ref(false);
const groupSearch = ref('');
const showCreatePanel = ref(false);

// Manual fallback when WA offline
const useManualEntry = ref(false);

// Create new WA group
const newGroupName = ref('');
const contactSearch = ref('');
const contacts = ref([]);
const contactsLoading = ref(false);
const selectedContactIds = ref([]);
const creatingGroup = ref(false);
const createGroupError = ref('');

let contactSearchTimer = null;
let addMemberSearchTimer = null;

// Edit mode — WhatsApp group members
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
    if (isEdit.value && chatId) {
      loadMembers();
    }
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

/** WhatsApp can lag — poll until member ids match expected add/remove. */
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
  addMemberSearchTimer = setTimeout(() => {
    loadContacts(addMemberSearch.value);
  }, 350);
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

const loadWaGroups = async () => {
  if (isEdit.value) return;
  waGroupsLoading.value = true;
  waDisconnected.value = false;
  const res = await fetchAvailableGroups();
  waGroupsLoading.value = false;
  if (res.ok) {
    waGroups.value = res.data.groups || [];
    if (!waGroups.value.length && res.data.hint) {
      waGroupsHint.value = res.data.hint;
    }
    return;
  }
  if (res.message?.includes('not ready') || String(res.message).includes('503')) {
    waDisconnected.value = true;
    useManualEntry.value = true;
  }
};

const waGroupsHint = ref('');

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
  if (res.ok) {
    contacts.value = res.data.contacts || [];
  } else {
    contacts.value = [];
  }
};

const onContactSearchInput = () => {
  clearTimeout(contactSearchTimer);
  contactSearchTimer = setTimeout(() => {
    loadContacts(contactSearch.value);
  }, 350);
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
    showCreatePanel.value = false;
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
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal" :class="{ 'modal-wide': step === 1 && !isEdit, 'modal-edit': isEdit }">
      <div class="modal-header">
        <div class="header-titles">
          <h2>{{ isEdit ? 'Edit Group' : step === 1 ? 'Select WhatsApp Group' : 'Register Group' }}</h2>
          <p v-if="!isEdit" class="step-indicator">Step {{ step }} of 2</p>
        </div>
        <button type="button" class="close-btn" @click="emit('cancel')">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- STEP 1: Pick or create WA group -->
        <template v-if="step === 1 && !isEdit">
          <div v-if="waDisconnected" class="wa-banner warning">
            WhatsApp is not connected. Start <code>npm run wa:server</code> in the backend, or enter
            group details manually below.
          </div>

          <template v-if="!useManualEntry">
            <div class="field-group">
              <label class="field-label">Search groups on WhatsApp</label>
              <input
                v-model="groupSearch"
                type="text"
                class="field-input"
                placeholder="Filter by group name…"
              />
            </div>

            <div v-if="waGroupsLoading" class="list-loading">Loading WhatsApp groups…</div>

            <div v-else-if="filteredWaGroups.length" class="wa-group-list">
              <button
                v-for="g in filteredWaGroups"
                :key="g.chatId || g.id"
                type="button"
                class="wa-group-row"
                :class="{ disabled: registeredSet.has(String(g.chatId || g.id)) }"
                :disabled="registeredSet.has(String(g.chatId || g.id))"
                @click="selectWaGroup(g)"
              >
                <span class="wa-group-name">{{ g.name }}</span>
                <span v-if="g.participantCount != null" class="wa-group-meta">
                  {{ g.participantCount }} members
                </span>
                <span
                  v-if="registeredSet.has(String(g.chatId || g.id))"
                  class="badge-registered"
                >
                  Registered
                </span>
              </button>
            </div>

            <div v-else class="list-empty">
              <p>No WhatsApp groups found.</p>
              <p v-if="waGroupsHint" class="hint">{{ waGroupsHint }}</p>
            </div>
          </template>

          <!-- Manual fallback -->
          <div v-if="useManualEntry || waDisconnected" class="manual-section">
            <div class="manual-toggle" v-if="!waDisconnected">
              <button type="button" class="link-btn" @click="useManualEntry = !useManualEntry">
                {{ useManualEntry ? '← Back to group list' : 'Enter group ID manually' }}
              </button>
            </div>
            <div v-if="useManualEntry" class="manual-fields">
              <div class="field-group" :class="{ error: errors.name }">
                <label class="field-label">Group Name <span class="required">*</span></label>
                <input v-model="form.name" type="text" class="field-input" placeholder="Group name" />
                <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
              </div>
              <div class="field-group" :class="{ error: errors.chatId }">
                <label class="field-label">WhatsApp Group ID <span class="required">*</span></label>
                <input
                  v-model="form.chatId"
                  type="text"
                  class="field-input"
                  placeholder="e.g. 120363…@g.us"
                />
                <span v-if="errors.chatId" class="field-error">{{ errors.chatId }}</span>
              </div>
              <button type="button" class="btn-secondary" @click="goToStep2Manual">Continue →</button>
            </div>
          </div>

          <!-- Create new group panel -->
          <div v-if="!useManualEntry && !waDisconnected" class="create-panel">
            <button
              type="button"
              class="create-panel-toggle"
              @click="showCreatePanel = !showCreatePanel"
            >
              <span>{{ showCreatePanel ? '−' : '+' }}</span>
              Create new group on WhatsApp
            </button>

            <div v-if="showCreatePanel" class="create-panel-body">
              <div class="field-group">
                <label class="field-label">New group name <span class="required">*</span></label>
                <input
                  v-model="newGroupName"
                  type="text"
                  class="field-input"
                  placeholder="e.g. North Region Reports"
                />
              </div>

              <div class="field-group">
                <label class="field-label">Add members from contacts</label>
                <input
                  v-model="contactSearch"
                  type="text"
                  class="field-input"
                  placeholder="Search contacts…"
                  @input="onContactSearchInput"
                />
              </div>

              <div v-if="contactsLoading" class="list-loading">Loading contacts…</div>
              <div v-else-if="contacts.length" class="contact-list">
                <label
                  v-for="c in contacts"
                  :key="c.id"
                  class="contact-row"
                  :class="{ checked: selectedContactIds.includes(c.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="selectedContactIds.includes(c.id)"
                    @change="toggleContact(c.id)"
                  />
                  <span class="contact-name">{{ c.name }}</span>
                  <span v-if="c.phone" class="contact-phone">{{ c.phone }}</span>
                </label>
              </div>
              <div v-else class="list-empty small">No contacts found. Try a different search.</div>

              <p v-if="createGroupError" class="field-error block">{{ createGroupError }}</p>

              <button
                type="button"
                class="btn-create-wa"
                :disabled="creatingGroup"
                @click="handleCreateWaGroup"
              >
                {{ creatingGroup ? 'Creating…' : 'Create Group on WhatsApp' }}
              </button>
            </div>
          </div>
        </template>

        <!-- STEP 2: Registration metadata -->
        <template v-else>
          <div v-if="selectedGroupSummary && !isEdit" class="selected-summary">
            <span class="summary-label">WhatsApp group</span>
            <strong>{{ selectedGroupSummary.name }}</strong>
          </div>

          <div v-if="isEdit && form.chatId" class="members-section">
            <div class="members-header">
              <h3 class="section-subtitle">WhatsApp members</h3>
              <span v-if="!membersLoading" class="members-count">{{ members.length }} total</span>
            </div>

            <div v-if="membersLoading" class="list-loading">Loading members…</div>
            <div v-else-if="members.length" class="member-list">
              <div v-for="m in members" :key="m.id" class="member-row">
                <div class="member-info">
                  <span class="member-name">{{ m.name }}</span>
                  <span v-if="m.phone" class="member-phone">{{ m.phone }}</span>
                </div>
                <button
                  type="button"
                  class="btn-remove-member"
                  :disabled="removingMemberId === m.id || members.length <= 1"
                  :title="members.length <= 1 ? 'Cannot remove the last member' : 'Remove from group'"
                  @click="handleRemoveMember(m)"
                >
                  {{ removingMemberId === m.id ? '…' : 'Remove' }}
                </button>
              </div>
            </div>
            <div v-else class="list-empty small">No members returned for this group.</div>

            <div class="add-members-block">
              <label class="field-label">Add members from contacts</label>
              <input
                v-model="addMemberSearch"
                type="text"
                class="field-input"
                placeholder="Search contacts to add…"
                @input="onAddMemberSearchInput"
              />
              <div v-if="contactsLoading" class="list-loading small-pad">Loading contacts…</div>
              <div v-else-if="addableContacts.length" class="contact-list">
                <label
                  v-for="c in addableContacts"
                  :key="c.id"
                  class="contact-row"
                  :class="{ checked: addMemberContactIds.includes(c.id) }"
                >
                  <input
                    type="checkbox"
                    :checked="addMemberContactIds.includes(c.id)"
                    @change="toggleAddMemberContact(c.id)"
                  />
                  <span class="contact-name">{{ c.name }}</span>
                  <span v-if="c.phone" class="contact-phone">{{ c.phone }}</span>
                </label>
              </div>
              <div v-else class="list-empty small">No contacts to add (or all are already members).</div>
              <button
                type="button"
                class="btn-add-members"
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

          <div class="fields-row">
            <div class="field-group" :class="{ error: errors.state }">
              <label class="field-label">State <span class="required">*</span></label>
              <select v-model="form.state" class="field-input">
                <option value="">Select state</option>
                <option v-for="s in filterOptions.states" :key="s" :value="s">{{ s }}</option>
              </select>
              <span v-if="errors.state" class="field-error">{{ errors.state }}</span>
            </div>

            <div class="field-group">
              <label class="field-label">Region <span class="auto-label">(auto)</span></label>
              <input :value="autoRegion || '—'" type="text" class="field-input" disabled />
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">Assigned Manager</label>
            <select v-model="form.manager" class="field-input">
              <option value="">Select manager</option>
              <option v-for="m in filterOptions.managers" :key="m" :value="m">{{ m }}</option>
            </select>
          </div>

          <div class="field-group" :class="{ error: errors.reportTypes }">
            <label class="field-label">Report Types <span class="required">*</span></label>
            <div class="checkbox-group">
              <label
                v-for="rt in filterOptions.reportTypes"
                :key="rt"
                class="checkbox-option"
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

          <div class="field-group">
            <label class="field-label">Status</label>
            <div class="status-row">
              <button
                type="button"
                class="toggle-switch"
                :class="{ active: form.isActive }"
                @click="form.isActive = !form.isActive"
              >
                <span class="toggle-thumb"></span>
              </button>
              <span class="status-label">{{ form.isActive ? 'Active' : 'Inactive' }}</span>
            </div>
          </div>

          <p v-if="errors.chatId" class="field-error block">{{ errors.chatId }}</p>
        </template>
      </div>

      <div class="modal-footer">
        <button
          v-if="!isEdit && step === 2"
          type="button"
          class="btn-back"
          @click="goBack"
        >
          ← Back
        </button>
        <div class="footer-spacer"></div>
        <button type="button" class="btn-cancel" @click="emit('cancel')">Cancel</button>
        <button
          v-if="step === 2 || isEdit"
          type="button"
          class="btn-save"
          @click="handleSave"
        >
          {{ isEdit ? 'Save Changes' : 'Register Group' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(3px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal {
  background: #fff;
  border-radius: 0.75rem;
  width: 100%;
  max-width: 34rem;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);

  &.modal-wide {
    max-width: 28rem;
  }

  &.modal-edit {
    max-width: 36rem;
  }
}

.section-subtitle {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--rf-text-primary);
}

.members-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 0.25rem;
  border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.members-count {
  font-size: 0.75rem;
  color: var(--rf-text-muted);
  font-weight: 500;
}

.member-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 11rem;
  overflow-y: auto;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  padding: 0.375rem;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.5rem;
  border-radius: 0.25rem;

  &:hover {
    background: var(--rf-page-bg, #f1f5f9);
  }
}

.member-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.0625rem;
}

.member-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.member-phone {
  font-size: 0.6875rem;
  color: var(--rf-text-muted);
}

.btn-remove-member {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  border: 1px solid #fecaca;
  border-radius: 0.25rem;
  background: #fff;
  color: var(--rf-error, #ef4444);
  font-size: 0.6875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rf-error-light, #fef2f2);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.add-members-block {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.btn-add-members {
  align-self: flex-start;
  padding: 0.4375rem 0.875rem;
  border: none;
  border-radius: 0.375rem;
  background: var(--rf-accent);
  color: #fff;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rf-accent-hover);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
}

.list-loading.small-pad {
  padding: 0.5rem;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--rf-surface-border, #e2e8f0);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 1.0625rem;
    font-weight: 700;
    color: var(--rf-text-primary);
  }

  .step-indicator {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: var(--rf-text-muted);
  }
}

.close-btn {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--rf-text-secondary);
  flex-shrink: 0;

  svg {
    width: 0.9375rem;
    height: 0.9375rem;
  }

  &:hover {
    background: var(--rf-page-bg);
  }
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.wa-banner {
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.8125rem;
  line-height: 1.45;

  &.warning {
    background: var(--rf-warning-light, #fffbeb);
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

.field-group {
  display: flex;
  flex-direction: column;
  gap: 0.3125rem;

  &.error .field-input {
    border-color: var(--rf-error, #ef4444);
  }
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);

  .required {
    color: var(--rf-error);
  }

  .auto-label {
    font-weight: 400;
    color: var(--rf-text-muted);
    font-size: 0.75rem;
  }
}

.field-input {
  height: 2.25rem;
  padding: 0 0.75rem;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--rf-text-primary, #1e293b);
  background: #fff;
  outline: none;
  user-select: text;

  &:focus {
    border-color: var(--rf-accent);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.12);
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

.list-loading,
.list-empty {
  font-size: 0.875rem;
  color: var(--rf-text-muted);
  text-align: center;
  padding: 1.5rem 0.5rem;

  &.small {
    padding: 0.75rem;
  }

  .hint {
    font-size: 0.75rem;
    margin-top: 0.5rem;
  }
}

.wa-group-list {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  max-height: 14rem;
  overflow-y: auto;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  padding: 0.375rem;
}

.wa-group-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid transparent;
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: var(--rf-accent-light, #eff6ff);
    border-color: var(--rf-accent-light);
  }

  &.disabled,
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .wa-group-name {
    flex: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--rf-text-primary);
  }

  .wa-group-meta {
    font-size: 0.6875rem;
    color: var(--rf-text-muted);
  }

  .badge-registered {
    font-size: 0.625rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    padding: 0.125rem 0.375rem;
    border-radius: 9999px;
    background: var(--rf-page-bg);
    color: var(--rf-text-secondary);
  }
}

.contact-list {
  max-height: 10rem;
  overflow-y: auto;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.5rem;
  padding: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.contact-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4375rem 0.625rem;
  border-radius: 0.25rem;
  cursor: pointer;
  user-select: none;

  input {
    accent-color: var(--rf-accent);
    cursor: pointer;
  }

  .contact-name {
    flex: 1;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--rf-text-primary);
  }

  .contact-phone {
    font-size: 0.6875rem;
    color: var(--rf-text-muted);
  }

  &.checked,
  &:hover {
    background: var(--rf-accent-light);
  }
}

.create-panel {
  border-top: 1px solid var(--rf-surface-border);
  padding-top: 0.75rem;
}

.create-panel-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0;
  background: none;
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--rf-accent);
  cursor: pointer;
  text-align: left;

  span {
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid var(--rf-accent);
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    line-height: 1;
  }
}

.create-panel-body {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  padding-top: 0.5rem;
}

.btn-create-wa {
  padding: 0.5rem 1rem;
  background: var(--rf-accent);
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--rf-accent-hover);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.manual-section {
  margin-top: 0.5rem;
}

.link-btn {
  background: none;
  border: none;
  color: var(--rf-accent);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
}

.manual-fields {
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  margin-top: 0.75rem;
}

.btn-secondary {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  border: 1px solid var(--rf-accent);
  border-radius: 0.375rem;
  background: var(--rf-accent-light);
  color: var(--rf-accent);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--rf-accent);
    color: #fff;
  }
}

.selected-summary {
  padding: 0.75rem 1rem;
  background: var(--rf-accent-light, #eff6ff);
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;

  .summary-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--rf-text-secondary);
  }

  strong {
    font-size: 0.9375rem;
    color: var(--rf-text-primary);
  }
}

.fields-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.checkbox-option {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  cursor: pointer;
  padding: 0.4375rem 0.75rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;

  input {
    accent-color: var(--rf-accent);
  }

  &.checked {
    border-color: var(--rf-accent);
    background: var(--rf-accent-light);
    color: var(--rf-accent);
  }
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.status-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
}

.toggle-switch {
  width: 2.5rem;
  height: 1.375rem;
  border-radius: 9999px;
  background: var(--rf-surface-border, #e2e8f0);
  border: none;
  cursor: pointer;
  position: relative;
  padding: 0;
  transition: background 0.2s ease;

  &.active {
    background: var(--rf-success, #10b981);
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
  flex-shrink: 0;
}

.footer-spacer {
  flex: 1;
}

.btn-back {
  padding: 0.5rem 0.75rem;
  border: none;
  background: transparent;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--rf-text-primary);
  }
}

.btn-cancel {
  padding: 0.5rem 1rem;
  border: 1px solid var(--rf-surface-border);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--rf-text-secondary);
  background: transparent;
  cursor: pointer;

  &:hover {
    border-color: var(--rf-text-secondary);
    color: var(--rf-text-primary);
  }
}

.btn-save {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  background: var(--rf-accent);
  color: #fff;
  cursor: pointer;

  &:hover {
    background: var(--rf-accent-hover);
  }
}
</style>
