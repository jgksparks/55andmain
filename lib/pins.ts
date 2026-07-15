"use client";

const KEY = "55andmain:pins";

export function getPins(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isPinned(id: string): boolean {
  return getPins().includes(id);
}

export function togglePin(id: string): boolean {
  const pins = getPins();
  const idx = pins.indexOf(id);
  if (idx === -1) {
    pins.push(id);
    localStorage.setItem(KEY, JSON.stringify(pins));
    return true; // now pinned
  } else {
    pins.splice(idx, 1);
    localStorage.setItem(KEY, JSON.stringify(pins));
    return false; // now unpinned
  }
}
