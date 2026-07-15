"use client";

const KEY = "55andmain:mytimes";

export interface MyTime {
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM" 24h
}

type MyTimes = Record<string, MyTime>; // listingId -> MyTime

export function getMyTimes(): MyTimes {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); }
  catch { return {}; }
}

export function getMyTime(id: string): MyTime | null {
  return getMyTimes()[id] ?? null;
}

export function setMyTime(id: string, time: MyTime) {
  const t = getMyTimes();
  t[id] = time;
  localStorage.setItem(KEY, JSON.stringify(t));
}

export function clearMyTime(id: string) {
  const t = getMyTimes();
  delete t[id];
  localStorage.setItem(KEY, JSON.stringify(t));
}

export function parseHHMM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h + m / 60;
}

export function toHHMM(decimalHour: number): string {
  const h = Math.floor(decimalHour);
  const m = Math.round((decimalHour - h) * 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function formatHHMM(s: string): string {
  const [h, m] = s.split(":").map(Number);
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m === 0 ? `${h12} ${ampm}` : `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}
