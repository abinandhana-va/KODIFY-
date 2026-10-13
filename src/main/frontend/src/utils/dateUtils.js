/**
 * dateUtils.js
 * Robust Date & Time utilities for KODIFY.
 * Preserves wall-clock date and time entered by users without unwanted UTC offset shifts.
 */

/**
 * Parses a date-time string into a Date object matching the exact wall-clock year, month, day, hour, minute.
 * Prevents timezone offset shifts (e.g., IST +5:30 conversion issues with toISOString).
 *
 * @param {string|Date} val
 * @returns {Date|null}
 */
export function parseLocalDateTime(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;

    // Match YYYY-MM-DDTHH:mm:ss or YYYY-MM-DDTHH:mm or YYYY-MM-DD HH:mm:ss
    const isoLocalMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (isoLocalMatch) {
      const [, y, m, d, h, min, s] = isoLocalMatch;
      return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || 0));
    }

    // Match DD/MM/YYYY or YYYY-MM-DD
    const dateOnlyMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, y, m, d] = dateOnlyMatch;
      return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0);
    }
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date-time string for display as: "Sep 28, 2026, 10:00 AM" (or fallback if no time)
 *
 * @param {string|Date} val
 * @param {string} fallback
 * @returns {string}
 */
export function formatDateTime(val, fallback = 'No deadline') {
  if (!val) return fallback;
  const d = parseLocalDateTime(val);
  if (!d) return typeof val === 'string' ? val : fallback;

  try {
    const datePart = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timePart = d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
    return `${datePart}, ${timePart}`;
  } catch {
    return String(val);
  }
}

/**
 * Formats a date string for display as: "Sep 28, 2026"
 *
 * @param {string|Date} val
 * @param {string} fallback
 * @returns {string}
 */
export function formatDate(val, fallback = 'No deadline') {
  if (!val) return fallback;
  const d = parseLocalDateTime(val);
  if (!d) return typeof val === 'string' ? val : fallback;

  try {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(val);
  }
}

/**
 * Formats a Date object or string for HTML5 <input type="datetime-local"> ("YYYY-MM-DDTHH:mm")
 *
 * @param {string|Date} val
 * @returns {string}
 */
export function formatForDateTimeInput(val) {
  if (!val) return '';
  const d = parseLocalDateTime(val);
  if (!d) return '';

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Prepares a local date-time string for API JSON payloads without UTC shift.
 * Output: "YYYY-MM-DDTHH:mm:ss"
 *
 * @param {string|Date} val
 * @returns {string|null}
 */
export function toLocalIsoPayload(val) {
  if (!val) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    if (trimmed.length === 16 && trimmed.includes('T')) {
      return `${trimmed}:00`;
    }
    if (trimmed.length === 19 && trimmed.includes('T')) {
      return trimmed;
    }
  }
  const d = parseLocalDateTime(val);
  if (!d) return null;

  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}
