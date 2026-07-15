"use client";
import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Nav from "@/components/Nav";
import ListingCard from "@/components/ListingCard";
import { getListings, getCities, type Listing } from "@/lib/data";

function fmtKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}
function formatLabel(dateKey: string) {
  const today = fmtKey(new Date());
  const tom = new Date(); tom.setDate(tom.getDate()+1);
  if (dateKey === today) return "today";
  if (dateKey === fmtKey(tom)) return "tomorrow";
  return new Date(dateKey+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
}
function formatFull(dateKey: string) {
  return new Date(dateKey+"T00:00:00").toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
}

function getSections(dateKey: string): { label: string; icon: string; filter: (l: Listing) => boolean }[] {
  return [
    { label: "Happening",       icon: "📅", filter: (l) => l.category === "Events" && l.date === dateKey },
    { label: "Groups Meeting",  icon: "👥", filter: (l) => l.category === "Groups" },
    { label: "Go Explore",      icon: "🧭", filter: (l) => l.category === "Experiences" },
    { label: "Helpful Right Now",icon: "🤝", filter: (l) => l.category === "Services" },
    { label: "Give Back",       icon: "🎗️", filter: (l) => l.category === "Fundraisers" },
    { label: "Volunteer",       icon: "🙌", filter: (l) => l.category === "Volunteers" },
  ];
}

function CityPicker({ cities, selected, onChange }: {
  cities: string[]; selected: string[]; onChange: (s: string[]) => void;
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
      onChange(next.length === 0 ? cities : next);
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
        className="bg-white text-stone-800 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm flex items-center gap-2 min-w-[160px]"
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
            <button key={c} onClick={() => toggle(c)}
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

function TodayContent() {
  const params = useSearchParams();
  const dateParam = params.get("date");
  const dateKey = dateParam ?? fmtKey(new Date());

  const cities = getCities();
  const [selectedCities, setSelectedCities] = useState<string[]>(cities);

  const published = useMemo(
    () => getListings({ status: "published" }).filter(l => selectedCities.includes(l.city)),
    [selectedCities]
  );

  const sections = getSections(dateKey).map(s => ({
    ...s,
    items: published.filter(s.filter),
  })).filter(s => s.items.length > 0);

  const totalCount = sections.reduce((n, s) => n + s.items.length, 0);
  const dayLabel = formatLabel(dateKey);
  const dayFull  = formatFull(dateKey);
  const allSelected = selectedCities.length === cities.length;
  const cityLabel = allSelected ? "All towns" : selectedCities.length === 1 ? selectedCities[0] : `${selectedCities.length} towns`;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />

      <div className="relative text-white overflow-hidden" style={{ minHeight: "280px" }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/photos/hero-marina-night.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/75" />
        <div className="relative px-4 py-12 text-center">
          <p className="text-[#D49A3A] text-xs tracking-widest uppercase mb-2 font-semibold" style={{ fontFamily: "Arial, sans-serif" }}>{dayFull}</p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-5" style={{ fontFamily: "Georgia, serif" }}>What's happening {dayLabel}</h1>
          <div className="flex justify-center">
            <CityPicker cities={cities} selected={selectedCities} onChange={setSelectedCities} />
          </div>
          {totalCount > 0 && (
            <p className="text-white/70 text-sm mt-4" style={{ fontFamily: "Arial, sans-serif" }}>
              {totalCount} things to do in {cityLabel} {dayLabel}
            </p>
          )}
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-10">
        {sections.length === 0 ? (
          <div className="text-center py-20 text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>
            <p className="text-4xl mb-4">🌿</p>
            <p className="text-lg font-medium">Nothing listed for {dayLabel} in {cityLabel}.</p>
            <p className="text-sm mt-1">
              <a href="/submit" className="text-[#556B3D] underline">Submit something</a> or try a different day.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {sections.map(section => (
              <div key={section.label}>
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-2xl">{section.icon}</span>
                  <h2 className="text-xl font-bold">{section.label}</h2>
                  <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-semibold ml-1" style={{ fontFamily: "Arial, sans-serif" }}>
                    {section.items.length}
                  </span>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {section.items.map(listing => <ListingCard key={listing.id} listing={listing} />)}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="bg-[#556B3D] text-green-300 text-center text-xs py-4" style={{ fontFamily: "Arial, sans-serif" }}>
        <p>55andMain · The front porch of the community</p>
        <p className="mt-1"><a href="/" className="hover:text-white underline">← Back to all listings</a></p>
      </footer>
    </div>
  );
}

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#556B3D]"/>}>
      <TodayContent />
    </Suspense>
  );
}
