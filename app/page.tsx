"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Nav from "@/components/Nav";
import ListingCard from "@/components/ListingCard";
import { getListings, getCities, type Category } from "@/lib/data";
import { getHiddenSubcategories, getHiddenCategories, getHiddenItems, countHidden } from "@/lib/prefs";

function getNearDays(): { label: string; date: string }[] {
  const now = new Date();
  function fmtKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }
  const options: { label: string; date: string }[] = [];
  options.push({ label: "Today", date: fmtKey(now) });
  const tom = new Date(now); tom.setDate(tom.getDate()+1); options.push({ label: "Tomorrow", date: fmtKey(tom) });
  const dow = now.getDay();
  const daysToSat = dow === 6 ? 7 : (6 - dow);
  const daysToSun = dow === 0 ? 7 : (7 - dow);
  const sat = new Date(now); sat.setDate(sat.getDate()+daysToSat);
  const sun = new Date(now); sun.setDate(sun.getDate()+daysToSun);
  if (daysToSat >= 2) options.push({ label: "This Saturday", date: fmtKey(sat) });
  if (daysToSun >= 2) options.push({ label: "This Sunday", date: fmtKey(sun) });
  return options;
}

function TodayDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const days = useMemo(() => getNearDays(), []);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div className="relative w-fit" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-2 bg-[#D49A3A] text-black font-bold px-6 py-3 rounded-xl text-base hover:bg-[#b8832e] transition-colors shadow-md"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <span>☀️</span> What's happening
        <span className="text-sm ml-1">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 py-1 min-w-[200px] z-50">
          {days.map(({ label, date }) => (
            <a key={date} href={`/today?date=${date}`}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-stone-800 hover:bg-amber-50 hover:text-[#556B3D] transition-colors"
              style={{ fontFamily: "Arial, sans-serif" }}>
              <span>{label === "Today" ? "☀️" : label === "Tomorrow" ? "🌤️" : "📅"}</span>
              {label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function CityPicker({ cities, selected, onChange }: {
  cities: string[];
  selected: string[];
  onChange: (s: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  function toggle(c: string) {
    if (selected.includes(c)) {
      const next = selected.filter(x => x !== c);
      onChange(next.length === 0 ? cities : next); // if all deselected, show all
    } else {
      onChange([...selected, c]);
    }
  }

  const allSelected = selected.length === cities.length;
  const label = allSelected ? "All towns" : selected.length === 1 ? selected[0] : `${selected.length} towns`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="bg-white text-stone-800 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm flex items-center gap-2 min-w-[160px]"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        <span>📍</span>
        <span className="flex-1 text-left">{label}</span>
        <span className="text-stone-400">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 bg-white text-stone-800 rounded-xl shadow-2xl border border-stone-200 py-2 min-w-[180px] z-50">
          <button
            onClick={() => onChange(cities)}
            className={`w-full text-left px-4 py-2 text-sm font-semibold transition-colors ${allSelected ? "text-[#556B3D]" : "text-stone-500 hover:bg-stone-50"}`}
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            All towns
          </button>
          <div className="border-t border-stone-100 my-1" />
          {cities.map(c => (
            <button
              key={c}
              onClick={() => toggle(c)}
              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 hover:bg-stone-50 transition-colors"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${selected.includes(c) ? "bg-[#556B3D] border-[#556B3D]" : "border-stone-300"}`}>
                {selected.includes(c) && <span className="text-white text-xs leading-none">✓</span>}
              </span>
              {c}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

const CATEGORIES: { label: Category | "All"; icon: string }[] = [
  { label: "All",         icon: "✨" },
  { label: "Events",      icon: "📅" },
  { label: "Experiences", icon: "🧭" },
  { label: "Services",    icon: "🤝" },
  { label: "Groups",      icon: "👥" },
  { label: "Fundraisers", icon: "🎗️" },
  { label: "Volunteers",  icon: "🙌" },
];

export default function Home() {
  const cities = getCities();
  const [selectedCities, setSelectedCities] = useState<string[]>(cities);
  const [activeCategory, setActiveCategory] = useState<Category | "All">("All");
  const [search, setSearch] = useState("");
  const [seniorOnly, setSeniorOnly] = useState(false);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [hiddenSubs, setHiddenSubs] = useState<string[]>([]);
  const [hiddenCats, setHiddenCats] = useState<string[]>([]);
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);

  const loadPrefs = useCallback(() => {
    setHiddenCount(countHidden());
    setHiddenSubs(getHiddenSubcategories());
    setHiddenCats(getHiddenCategories());
    setHiddenItems(getHiddenItems());
  }, []);

  useEffect(() => { loadPrefs(); }, [loadPrefs]);

  const listings = useMemo(() => {
    let results = getListings({ status: "published" });
    // Multi-city filter
    results = results.filter(l => selectedCities.includes(l.city));
    if (activeCategory !== "All") results = results.filter(l => l.category === activeCategory);
    results = results.filter(l =>
      !hiddenSubs.includes(l.subcategory) &&
      !hiddenCats.includes(l.category) &&
      !hiddenItems.includes(l.id)
    );
    if (seniorOnly) results = results.filter(l => l.seniorDiscount === true);
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        l.tags.some(t => t.includes(q)) ||
        l.subcategory.toLowerCase().includes(q)
      );
    }
    return results;
  }, [selectedCities, activeCategory, search, hiddenSubs, hiddenCats, hiddenItems, seniorOnly]);

  const allSelected = selectedCities.length === cities.length;

  const cityLabel = allSelected ? "All towns" : selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} towns`;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      {/* Hero */}
      <div className="relative text-white" style={{ minHeight: "420px" }}>
        {/* Background photo */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/photos/hero-boathouse.jpg')" }}
        />
        {/* Gradient overlay — dark at bottom for text legibility, lighter at top */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />

        {/* Content */}
        <div className="relative max-w-5xl mx-auto px-4 py-14 sm:py-20 flex flex-col gap-5">
          <div>
            <p className="text-[#D49A3A] text-sm tracking-widest uppercase mb-3 font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>
              CT River Valley Shoreline
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight mb-2" style={{ fontFamily: "Georgia, serif" }}>
              Discover your community.
            </h1>
            <p className="text-white/80 text-lg" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
              What are you doing this afternoon?
            </p>
          </div>

          <div>
            <TodayDropdown />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <CityPicker cities={cities} selected={selectedCities} onChange={setSelectedCities} />
            <input
              type="search"
              placeholder="Search events, groups, services…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-white/95 text-stone-800 rounded-lg px-4 py-2.5 text-sm shadow-sm flex-1 placeholder-stone-400"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          <div>
            <button
              onClick={() => setSeniorOnly(v => !v)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                seniorOnly
                  ? "bg-[#D49A3A] text-[#233249] shadow-md"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/30"
              }`}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <span>🏷️</span>
              Senior discounts only
              {seniorOnly && <span className="ml-1 text-xs opacity-80">✓ on</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white border-b border-stone-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto py-2">
          {CATEGORIES.map(({ label, icon }) => (
            <button
              key={label}
              onClick={() => setActiveCategory(label)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === label ? "bg-[#556B3D] text-white" : "text-stone-600 hover:bg-stone-100"
              }`}
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </div>
      </div>

      {/* Hidden prefs reminder */}
      {hiddenCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <p className="text-xs text-amber-800" style={{ fontFamily: "Arial, sans-serif" }}>
              👁 <strong>{hiddenCount}</strong> item{hiddenCount !== 1 ? "s" : ""} hidden from your view
            </p>
            <a href="/settings" className="text-xs font-semibold text-amber-800 underline hover:text-amber-900 whitespace-nowrap" style={{ fontFamily: "Arial, sans-serif" }}>
              Manage →
            </a>
          </div>
        </div>
      )}

      {/* Listings */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        {listings.length === 0 ? (
          <div className="text-center py-20 text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>
            <p className="text-4xl mb-4">🌿</p>
            <p className="text-lg font-medium">Nothing here yet.</p>
            <p className="text-sm mt-1">
              Try a different category, town, or search term.
              {hiddenCount > 0 && <> Or <a href="/settings" className="text-[#556B3D] underline">restore hidden items</a>.</>}
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-[#AFA69A] mb-6" style={{ fontFamily: "Arial, sans-serif" }}>
              {listings.length} {listings.length === 1 ? "result" : "results"} in {cityLabel}
              {hiddenCount > 0 && <> · <a href="/settings" className="text-amber-600 hover:underline">{hiddenCount} hidden</a></>}
            </p>

            {activeCategory === "All" ? (
              /* Grouped by category */
              <div className="flex flex-col gap-12">
                {CATEGORIES.filter(c => c.label !== "All").map(({ label, icon }) => {
                  const items = listings.filter(l => l.category === label);
                  if (items.length === 0) return null;
                  return (
                    <div key={label}>
                      <div className="flex items-center gap-2 mb-5">
                        <span className="text-2xl">{icon}</span>
                        <h2 className="text-xl font-bold text-[#233249]">{label}</h2>
                        <span className="text-xs bg-[#E8E2D6] text-[#AFA69A] px-2 py-0.5 rounded-full font-semibold ml-1" style={{ fontFamily: "Arial, sans-serif" }}>
                          {items.length}
                        </span>
                      </div>
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {items.map(listing => (
                          <ListingCard key={listing.id} listing={listing} onHide={loadPrefs} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Single category flat grid */
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {listings.map(listing => (
                  <ListingCard key={listing.id} listing={listing} onHide={loadPrefs} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-[#556B3D] text-green-300 text-center text-xs py-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <p>55andMain · The front porch of the community</p>
        <p className="mt-1">
          <a href="/submit" className="hover:text-white underline">Submit an event</a>
          {" · "}
          <a href="/settings" className="hover:text-white underline">My preferences</a>
          {" · "}
          <a href="/admin" className="hover:text-white underline">Curator login</a>
        </p>
      </footer>
    </div>
  );
}
