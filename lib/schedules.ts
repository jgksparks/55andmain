"use client";

const KEY = "55andmain:schedules";

// Each listing can be scheduled on multiple dates
type Schedules = Record<string, string[]>; // listingId -> ["YYYY-MM-DD", ...]

function load(): Schedules {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    // migrate old single-string format
    const out: Schedules = {};
    for (const [id, val] of Object.entries(raw)) {
      out[id] = Array.isArray(val) ? val : [val as string];
    }
    return out;
  } catch { return {}; }
}

function save(s: Schedules) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getSchedules(): Schedules { return load(); }

export function getScheduledDates(id: string): string[] {
  return load()[id] ?? [];
}

export function isScheduled(id: string): boolean {
  return getScheduledDates(id).length > 0;
}

export function addScheduleDate(id: string, date: string) {
  const s = load();
  if (!s[id]) s[id] = [];
  if (!s[id].includes(date)) s[id].push(date);
  save(s);
}

export function removeScheduleDate(id: string, date: string) {
  const s = load();
  if (!s[id]) return;
  s[id] = s[id].filter(d => d !== date);
  if (s[id].length === 0) delete s[id];
  save(s);
}

export function clearSchedule(id: string) {
  const s = load();
  delete s[id];
  save(s);
}
