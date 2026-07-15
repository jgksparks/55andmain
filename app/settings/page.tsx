"use client";
import { useState, useEffect } from "react";
import Nav from "@/components/Nav";
import {
  getHiddenSubcategories, getHiddenCategories, getHiddenItems,
  showSubcategory, showCategory, showItem, clearAllPrefs,
} from "@/lib/prefs";
import { getListings, getListing } from "@/lib/data";

export default function SettingsPage() {
  const [hiddenSubs, setHiddenSubs] = useState<string[]>([]);
  const [hiddenCats, setHiddenCats] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [restored, setRestored] = useState<string | null>(null);

  function load() {
    setHiddenSubs(getHiddenSubcategories());
    setHiddenCats(getHiddenCategories());
    setHiddenItems(getHiddenItems());
  }

  useEffect(() => { load(); }, []);

  function toast(label: string) { setRestored(label); setTimeout(() => setRestored(null), 2500); }

  function restoreSub(sub: string) { showSubcategory(sub); load(); toast(sub); }
  function restoreCat(cat: string) { showCategory(cat); load(); toast(cat); }
  function restoreItem(id: string) { showItem(id); load(); const l = getListing(id); toast(l?.title ?? "item"); }
  function restoreAll() { clearAllPrefs(); load(); toast("everything"); }

  const allListings = getListings({ status: "published" });
  const subCounts: Record<string, number> = {};
  for (const l of allListings) { subCounts[l.subcategory] = (subCounts[l.subcategory] ?? 0) + 1; }

  const totalHidden = hiddenSubs.length + hiddenCats.length + hiddenItems.length;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <a href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-3 inline-block" style={{ fontFamily: "Arial, sans-serif" }}>← Back</a>
          <h1 className="text-3xl font-bold mb-1">My Preferences</h1>
          <p className="text-sm text-stone-500" style={{ fontFamily: "Arial, sans-serif" }}>
            Things you've hidden from your feed. Restore anything here, any time.
          </p>
        </div>

        {restored && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-800 font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
            ✓ <strong>{restored}</strong> is back in your feed.
          </div>
        )}

        {totalHidden === 0 ? (
          <div className="text-center py-16 text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>
            <p className="text-4xl mb-3">✨</p>
            <p className="font-medium text-stone-600">Nothing hidden.</p>
            <p className="text-sm mt-1">
              You're seeing everything. Hit "Not for me" on any card to hide items from your feed.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">

            {/* Hidden individual events */}
            {hiddenItems.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3" style={{ fontFamily: "Arial, sans-serif" }}>
                  Hidden Events
                </h2>
                <div className="flex flex-col gap-2">
                  {hiddenItems.map(id => {
                    const l = getListing(id);
                    return (
                      <div key={id} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{l?.title ?? id}</p>
                          {l && <p className="text-xs text-stone-400 mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>{l.subcategory} · {l.city}</p>}
                        </div>
                        <button onClick={() => restoreItem(id)} className="text-sm font-semibold text-[#556B3D] hover:text-[#3d5229] whitespace-nowrap" style={{ fontFamily: "Arial, sans-serif" }}>
                          Restore
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Hidden categories */}
            {hiddenCats.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3" style={{ fontFamily: "Arial, sans-serif" }}>
                  Hidden Categories
                </h2>
                <div className="flex flex-col gap-2">
                  {hiddenCats.map(cat => {
                    const count = allListings.filter(l => l.category === cat).length;
                    return (
                      <div key={cat} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{cat}</p>
                          <p className="text-xs text-stone-400 mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>{count} listing{count !== 1 ? "s" : ""} hidden across all towns</p>
                        </div>
                        <button onClick={() => restoreCat(cat)} className="text-sm font-semibold text-[#556B3D] hover:text-[#3d5229] whitespace-nowrap" style={{ fontFamily: "Arial, sans-serif" }}>Restore</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Hidden subcategories */}
            {hiddenSubs.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-3" style={{ fontFamily: "Arial, sans-serif" }}>
                  Hidden Types
                </h2>
                <div className="flex flex-col gap-2">
                  {hiddenSubs.map(sub => {
                    const count = subCounts[sub] ?? 0;
                    return (
                      <div key={sub} className="bg-white border border-stone-200 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{sub}</p>
                          <p className="text-xs text-stone-400 mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>{count} listing{count !== 1 ? "s" : ""} hidden across all towns</p>
                        </div>
                        <button onClick={() => restoreSub(sub)} className="text-sm font-semibold text-[#556B3D] hover:text-[#3d5229] whitespace-nowrap" style={{ fontFamily: "Arial, sans-serif" }}>Restore</button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="pt-2 border-t border-stone-200">
              <button onClick={restoreAll} className="text-sm text-stone-500 hover:text-stone-800 underline" style={{ fontFamily: "Arial, sans-serif" }}>
                Restore everything and start fresh
              </button>
            </div>
          </div>
        )}

        <div className="mt-12 pt-8 border-t border-stone-200">
          <h2 className="text-sm font-bold text-stone-500 uppercase tracking-wide mb-1" style={{ fontFamily: "Arial, sans-serif" }}>How this works</h2>
          <p className="text-sm text-stone-500 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
            "Not for me" gives you two choices: hide just that one event, or hide everything of that type across all towns. Your preferences are saved to this device only and never shared. You can restore anything here whenever you want.
          </p>
        </div>
      </main>
    </div>
  );
}
