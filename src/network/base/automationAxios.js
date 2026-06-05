import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5051';

export const automationAxios = axios.create({
  baseURL,
  timeout: 120_000,
  headers: { 'Content-Type': 'application/json' },
});

/** Long-running screenshot upload + WhatsApp send per group */
export const DISPATCH_TIMEOUT_MS = 300_000;
