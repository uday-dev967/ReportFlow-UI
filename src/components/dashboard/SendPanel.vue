<script setup>
import { computed } from 'vue';

const props = defineProps({
  sending: { type: Boolean, default: false },
  sendResult: { type: Object, default: null },
  lastLog: { type: Object, default: null },
});

const emit = defineEmits(['send']);

const lastSentAt = computed(() => {
  if (!props.lastLog?.sentAt) return null;
  return new Date(props.lastLog.sentAt).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});
</script>

<template>
  <div class="send-panel">
    <div class="send-panel-inner">
      <div class="send-info">
        <div class="send-title">Send Report to WhatsApp Groups</div>
        <div class="send-desc">
          Takes a screenshot of this dashboard and sends it to all active registered WhatsApp
          groups (does not require a schedule to be ON).
        </div>
      </div>

      <div class="send-actions">
        <button
          type="button"
          class="btn-send"
          :disabled="sending"
          @click="emit('send')"
        >
          <span v-if="sending" class="spinner"></span>
          <svg v-else viewBox="0 0 20 20" fill="none">
            <path
              d="M3 10l14-7-7 14V10H3z"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linejoin="round"
              fill="none"
            />
          </svg>
          {{ sending ? 'Sending…' : 'Take Screenshot & Send Now' }}
        </button>
      </div>
    </div>

    <div v-if="sendResult" class="send-result" :class="sendResult.ok ? 'success' : 'error'">
      <template v-if="sendResult.ok">
        Sent successfully to {{ sendResult.data?.result?.sent ?? 0 }} group(s).
      </template>
      <template v-else>
        Failed: {{ sendResult.message }}
      </template>
    </div>

    <div v-if="lastSentAt" class="last-sent">
      Last sent: {{ lastSentAt }}
      <span v-if="lastLog?.groupCount"> &nbsp;·&nbsp; {{ lastLog.groupCount }} group(s)</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.send-panel {
  background: #fff;
  border: 1px solid var(--rf-surface-border, #e2e8f0);
  border-radius: 0.75rem;
  padding: 1.125rem 1.25rem;
  box-shadow: var(--rf-surface-shadow);
}

.send-panel-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.send-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--rf-text-primary, #1e293b);
  margin-bottom: 0.25rem;
}

.send-desc {
  font-size: 0.8125rem;
  color: var(--rf-text-secondary, #64748b);
  max-width: 36rem;
}

.btn-send {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: var(--rf-accent, #2563eb);
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.15s ease;
  flex-shrink: 0;

  svg {
    width: 1.125rem;
    height: 1.125rem;
  }

  &:hover:not(:disabled) {
    background: var(--rf-accent-hover, #1d4ed8);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
}

.spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.send-result {
  margin-top: 0.75rem;
  padding: 0.5rem 0.875rem;
  border-radius: 0.375rem;
  font-size: 0.8125rem;
  font-weight: 500;

  &.success {
    background: var(--rf-success-light, #ecfdf5);
    color: var(--rf-success, #10b981);
  }

  &.error {
    background: var(--rf-error-light, #fef2f2);
    color: var(--rf-error, #ef4444);
  }
}

.last-sent {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: var(--rf-text-muted, #94a3b8);
}
</style>
