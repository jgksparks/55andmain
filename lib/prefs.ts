"use client";

const KEY = "55andmain:prefs";

interface Prefs {
  hiddenSubcategories: string[];
  hiddenCategories: string[];
  hiddenItems: string[]; // individual listing IDs hidden via "not this event"
}

function getPrefs(): Prefs {
  if (typeof window === "undefined") return { hiddenSubcategories: [], hiddenCategories: [], hiddenItems: [] };
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return { hiddenSubcategories: [], hiddenCategories: [], hiddenItems: [] };
  }
}

function savePrefs(p: Prefs) {
  localStorage.setItem(KEY, JSON.stringify(p));
}

export function getHiddenSubcategories(): string[] {
  return getPrefs().hiddenSubcategories ?? [];
}

export function getHiddenCategories(): string[] {
  return getPrefs().hiddenCategories ?? [];
}

export function getHiddenItems(): string[] {
  return getPrefs().hiddenItems ?? [];
}

export function hideSubcategory(sub: string) {
  const p = getPrefs();
  if (!p.hiddenSubcategories) p.hiddenSubcategories = [];
  if (!p.hiddenSubcategories.includes(sub)) p.hiddenSubcategories.push(sub);
  savePrefs(p);
}

export function showSubcategory(sub: string) {
  const p = getPrefs();
  p.hiddenSubcategories = (p.hiddenSubcategories ?? []).filter((s) => s !== sub);
  savePrefs(p);
}

export function hideCategory(cat: string) {
  const p = getPrefs();
  if (!p.hiddenCategories) p.hiddenCategories = [];
  if (!p.hiddenCategories.includes(cat)) p.hiddenCategories.push(cat);
  savePrefs(p);
}

export function showCategory(cat: string) {
  const p = getPrefs();
  p.hiddenCategories = (p.hiddenCategories ?? []).filter((c) => c !== cat);
  savePrefs(p);
}

export function hideItem(id: string) {
  const p = getPrefs();
  if (!p.hiddenItems) p.hiddenItems = [];
  if (!p.hiddenItems.includes(id)) p.hiddenItems.push(id);
  savePrefs(p);
}

export function showItem(id: string) {
  const p = getPrefs();
  p.hiddenItems = (p.hiddenItems ?? []).filter((i) => i !== id);
  savePrefs(p);
}

export function clearAllPrefs() {
  localStorage.removeItem(KEY);
}

export function countHidden(): number {
  const p = getPrefs();
  return (p.hiddenSubcategories?.length ?? 0) + (p.hiddenCategories?.length ?? 0) + (p.hiddenItems?.length ?? 0);
}
