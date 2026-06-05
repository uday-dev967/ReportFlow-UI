import { ref } from 'vue';

import { io } from 'socket.io-client';

import {

  fetchSchedules,

  dispatchScreenshot,

  fetchWhatsappStatus,

} from '@/network/automation.service.js';

import { captureElementToBase64, defaultReportCaption } from '@/composables/useDashboardCapture.js';

import { getNextRunDelayMs } from '@/utils/cronUtils.js';




const POLL_MS = 60_000;



let socket = null;

let pollIntervalId = null;

let captureInFlight = false;

let started = false;

const fallbackTimers = new Map();

let useFallbackOnly = false;



export const activeScheduleCount = ref(0);

export const socketConnected = ref(false);



function apiOrigin() {

  const base = import.meta.env.VITE_API_BASE_URL;

  return base.replace(/\/$/, '');

}



function socketOrigin() {

  const explicit = import.meta.env.VITE_SOCKET_URL;

  if (explicit) {

    return String(explicit).replace(/\/$/, '');

  }

  if (import.meta.env.DEV) {

    return window.location.origin;

  }

  return apiOrigin();

}



function clearFallbackTimer(scheduleId) {

  const id = fallbackTimers.get(scheduleId);

  if (id != null) {

    clearTimeout(id);

    fallbackTimers.delete(scheduleId);

  }

}



function clearAllFallbackTimers() {

  for (const scheduleId of [...fallbackTimers.keys()]) {

    clearFallbackTimer(scheduleId);

  }

}



async function syncActiveCount() {

  const res = await fetchSchedules({ running: true });

  if (res.ok) {

    const running = (res.data.schedules || []).filter(

      (s) => s.isRunning && s.isActive !== false,

    );

    activeScheduleCount.value = running.length;

    return running;

  }

  return [];

}



function scheduleFallbackTick(schedule) {

  if (!started || socketConnected.value && !useFallbackOnly) {

    return;

  }

  clearFallbackTimer(schedule._id);

  const delay = getNextRunDelayMs(schedule.cron, schedule.timezone || 'Asia/Kolkata');

  const timeoutId = setTimeout(() => runCaptureForSchedule(schedule), delay);

  fallbackTimers.set(schedule._id, timeoutId);

}



async function syncFallbackTimers() {

  if (!started || (socketConnected.value && !useFallbackOnly)) {

    clearAllFallbackTimers();

    return;

  }

  const running = await syncActiveCount();

  for (const scheduleId of [...fallbackTimers.keys()]) {

    if (!running.some((s) => s._id === scheduleId)) {

      clearFallbackTimer(scheduleId);

    }

  }

  for (const schedule of running) {

    if (!fallbackTimers.has(schedule._id)) {

      scheduleFallbackTick(schedule);

    }

  }

}



async function runCaptureForSchedule(scheduleOrPayload) {

  const payload =

    typeof scheduleOrPayload === 'object' && scheduleOrPayload?.scheduleId

      ? scheduleOrPayload

      : {

          scheduleId: String(scheduleOrPayload._id),

          scheduleName: scheduleOrPayload.name,

          caption: scheduleOrPayload.caption || '',

        };



  if (!started || captureInFlight || !payload?.scheduleId) return;



  const statusRes = await fetchWhatsappStatus();

  if (!statusRes.ok || !statusRes.data?.ready) {

    console.warn('[ScreenshotScheduler] WhatsApp not ready — run: npm run wa:server');

    if (scheduleOrPayload?._id) {

      scheduleFallbackTick(scheduleOrPayload);

    }

    return;

  }



  captureInFlight = true;

  try {

    const { imageBase64, mimeType, imageBlob } = await captureElementToBase64();
    const caption =
      (payload.caption && String(payload.caption).trim()) || defaultReportCaption();

    const result = await dispatchScreenshot({
      imageBlob,
      imageBase64,
      mimeType,
      scheduleId: payload.scheduleId,
      caption,
    });



    if (result.ok) {

      const sent = result.data?.result?.sent ?? 0;

      console.info(

        `[ScreenshotScheduler] Sent "${payload.scheduleName || payload.scheduleId}" to ${sent} group(s)`,

      );

      if (sent === 0) {

        console.warn('[ScreenshotScheduler] API ok but 0 groups — check group chatId and schedule is ON');

      }

      window.dispatchEvent(new CustomEvent('reportflow:screenshot-sent'));

    } else {

      console.warn(

        '[ScreenshotScheduler] Dispatch failed:',

        payload.scheduleName,

        result.message,

      );

    }

  } catch (err) {

    console.warn('[ScreenshotScheduler]', payload.scheduleName, err.message);

  } finally {

    captureInFlight = false;

    if (scheduleOrPayload?._id) {

      scheduleFallbackTick(scheduleOrPayload);

    } else if (payload.scheduleId) {

      const res = await fetchSchedules({ running: true });

      const schedule = res.data?.schedules?.find((s) => s._id === payload.scheduleId);

      if (schedule) scheduleFallbackTick(schedule);

    }

  }

}



function connectSocket() {

  if (socket?.connected) return;



  socket = io(socketOrigin(), {

    path: '/socket.io',

    transports: ['polling', 'websocket'],

    reconnection: true,

    reconnectionDelay: 2000,

    reconnectionAttempts: 20,

  });



  socket.on('connect', () => {

    socketConnected.value = true;

    useFallbackOnly = false;

    clearAllFallbackTimers();

    syncActiveCount();

  });



  socket.on('connect_error', (err) => {

    socketConnected.value = false;

    useFallbackOnly = true;

    console.warn(

      '[ScreenshotScheduler] Socket disconnected — using browser cron fallback.',

      err.message,

    );

    syncFallbackTimers();

  });



  socket.on('disconnect', () => {

    socketConnected.value = false;

    useFallbackOnly = true;

    syncFallbackTimers();

  });



  socket.on('screenshot:capture', (payload) => {

    runCaptureForSchedule(payload);

  });

}



function disconnectSocket() {

  if (socket) {

    socket.removeAllListeners();

    socket.disconnect();

    socket = null;

  }

  socketConnected.value = false;

  clearAllFallbackTimers();

}



export async function startScreenshotScheduler() {

  if (started) return;

  started = true;

  connectSocket();

  const running = await syncActiveCount();

  pollIntervalId = setInterval(async () => {

    await syncActiveCount();

    if (useFallbackOnly || !socketConnected.value) {

      await syncFallbackTimers();

    }

  }, POLL_MS);



  if (!socketConnected.value && running.length) {

    useFallbackOnly = true;

    for (const schedule of running) {

      scheduleFallbackTick(schedule);

    }

  }

}



export function stopScreenshotScheduler() {

  started = false;

  if (pollIntervalId != null) {

    clearInterval(pollIntervalId);

    pollIntervalId = null;

  }

  disconnectSocket();

  activeScheduleCount.value = 0;

}



export async function reloadScreenshotScheduler() {

  if (!started) return;

  const running = await syncActiveCount();

  if (useFallbackOnly || !socketConnected.value) {

    clearAllFallbackTimers();

    for (const schedule of running) {

      scheduleFallbackTick(schedule);

    }

  }

}



export function useScreenshotScheduler() {

  return {

    start: startScreenshotScheduler,

    stop: stopScreenshotScheduler,

    reload: reloadScreenshotScheduler,

    activeScheduleCount,

    socketConnected,

  };

}


