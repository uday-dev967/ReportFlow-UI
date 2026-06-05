import { CronExpressionParser } from 'cron-parser';

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const PRESET_CRONS = [
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every 10 minutes', value: '*/10 * * * *' },
  { label: 'Every 15 minutes', value: '*/15 * * * *' },
  { label: 'Every 30 minutes', value: '*/30 * * * *' },
  { label: 'Every 45 minutes', value: '*/45 * * * *' },
  { label: 'Every 1 hour', value: '0 * * * *' },
  { label: 'Every 2 hours', value: '0 */2 * * *' },
  { label: 'Every 4 hours', value: '0 */4 * * *' },
  { label: 'Every 6 hours', value: '0 */6 * * *' },
  { label: 'Every 12 hours', value: '0 */12 * * *' },
];

const PRESET_VALUES = new Set(PRESET_CRONS.map((p) => p.value));

function parseTime24(time) {
  const [hRaw, mRaw] = String(time || '09:00').split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return { h: 9, m: 0 };
  }
  return {
    h: Math.min(23, Math.max(0, Math.floor(h))),
    m: Math.min(59, Math.max(0, Math.floor(m))),
  };
}

function isIntervalCron(trimmed) {
  if (PRESET_VALUES.has(trimmed)) return true;
  if (/^\*\/\d+\s+\*\s+\*\s+\*\s+\*$/.test(trimmed)) return true;
  if (/^0\s+\*\/\d+\s+\*\s+\*\s+\*$/.test(trimmed)) return true;
  return false;
}

function cronTimeFromFields(min, hour) {
  if (!/^\d+$/.test(String(min)) || !/^\d+$/.test(String(hour))) {
    return null;
  }
  const h = Number(hour);
  const m = Number(min);
  if (!Number.isFinite(h) || !Number.isFinite(m) || h > 23 || m > 59) {
    return null;
  }
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function buildCron({ frequency, time, days, customCron, presetCron }) {
  if (frequency === 'preset') return presetCron || PRESET_CRONS[5].value;
  if (frequency === 'custom') return customCron || '0 9 * * *';
  const { h, m } = parseTime24(time);
  if (frequency === 'daily') return `${m} ${h} * * *`;
  if (frequency === 'weekly') {
    const daysStr = days?.length ? [...days].sort((a, b) => a - b).join(',') : '*';
    return `${m} ${h} * * ${daysStr}`;
  }
  return `${m} ${h} * * *`;
}

export function parseCron(cron) {
  const empty = { frequency: 'daily', time: '09:00', days: [1, 2, 3, 4, 5], customCron: '', presetCron: '' };
  if (!cron) return empty;

  const trimmed = cron.trim();

  if (isIntervalCron(trimmed)) {
    return { frequency: 'preset', presetCron: trimmed, time: '09:00', days: [], customCron: '' };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return { frequency: 'custom', customCron: cron, time: '09:00', days: [], presetCron: '' };
  }

  const [min, hour, dom, month, dow] = parts;
  if (dom === '*' && month === '*' && dow === '*') {
    const time = cronTimeFromFields(min, hour);
    if (time) {
      return { frequency: 'daily', time, days: [], customCron: '', presetCron: '' };
    }
  }
  if (dom === '*' && month === '*') {
    const time = cronTimeFromFields(min, hour);
    if (time) {
      const days = dow === '*' ? [] : dow.split(',').map(Number).filter(Number.isFinite);
      return { frequency: 'weekly', time, days, customCron: '', presetCron: '' };
    }
  }
  return { frequency: 'custom', customCron: cron, time: '09:00', days: [], presetCron: '' };
}

export function cronToHuman(cron) {
  if (!cron) return '—';
  const preset = PRESET_CRONS.find((p) => p.value === cron.trim());
  if (preset) return preset.label;
  const parsed = parseCron(cron);
  if (parsed.frequency === 'custom') return `Custom (${cron})`;
  if (parsed.frequency === 'preset') {
    const match = PRESET_CRONS.find((p) => p.value === parsed.presetCron);
    return match?.label || `Interval (${cron})`;
  }
  const timeStr = format12h(parsed.time);
  if (parsed.frequency === 'daily') return `Daily at ${timeStr}`;
  const dayNames = parsed.days.map((d) => DAY_LABELS[d]).join(', ');
  return `Weekly ${dayNames || '—'} at ${timeStr}`;
}

export function format12h(time24) {
  if (!time24) return '—';
  const [hRaw, mRaw] = time24.split(':');
  const h = Number(hRaw);
  const m = Number(mRaw);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return '—';
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Milliseconds until the next cron fire (minimum 1s).
 * @param {string} cronExpression
 * @param {string} timezone IANA timezone, e.g. Asia/Kolkata
 */
export function getNextRunDelayMs(cronExpression, timezone = 'Asia/Kolkata') {
  const expr = String(cronExpression || '').trim();
  if (!expr) return 60_000;

  try {
    const interval = CronExpressionParser.parse(expr, {
      currentDate: new Date(),
      tz: timezone,
    });
    const next = interval.next().toDate();
    const delay = next.getTime() - Date.now();
    return Math.max(delay, 1000);
  } catch {
    // Fallback: treat */N in minutes field as every N minutes
    const match = expr.match(/^\*\/(\d+)\s+\*\s+\*\s+\*\s+\*$/);
    if (match) {
      return Math.max(Number(match[1]) * 60_000, 1000);
    }
    return 60_000;
  }
}
