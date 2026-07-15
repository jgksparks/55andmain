"use client";
import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/Nav";
import { type Listing, type Category, type Status } from "@/lib/data";

const CATEGORIES: Category[] = ["Events", "Experiences", "Services", "Groups", "Fundraisers", "Volunteers"];
const SUBCATEGORIES: Record<Category, string[]> = {
  Events: ["Classes", "Lectures", "Music", "Recreation", "Volunteer", "Community Gathering", "Live Music", "Theatre", "Senior Programs", "Town Tradition", "Other"],
  Experiences: ["Adventure Days", "Field Quests", "Self-Guided", "Museums & History", "Art & Galleries", "Nature & Trails", "Local Shopping", "Seasonal Challenge", "Other"],
  Services: ["Local Business", "Senior Programs", "Home Services", "Health & Wellness", "Transportation", "Trusted Provider", "Other"],
  Groups: ["Walking Groups", "Pickleball", "Garden Clubs", "Book Clubs", "Volunteer Groups", "Gardening Circle", "Other"],
  Fundraisers: ["Community Fund", "Emergency Services Fund", "Community Event Fund", "Land Conservation Fund", "Other"],
  Volunteers: ["River Stewardship", "Food Security", "Trail Maintenance", "Hospital Support", "Community Stewardship", "Town Stewardship", "Emergency Services", "Other"],
};

const CURATOR_PASSWORD = "frontporch";
const CITIES = ["Chester", "Deep River", "Essex", "Old Saybrook", "Old Lyme", "Westbrook", "Clinton"];

type Tab = "published" | "pending" | "add";

function Badge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    published: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    rejected: "bg-red-100 text-red-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${styles[status]}`} style={{ fontFamily: "Arial, sans-serif" }}>
      {status}
    </span>
  );
}

function AdminRow({ listing, onRefresh }: { listing: Listing; onRefresh: () => void }) {
  const [busy, setBusy] = useState(false);

  async function act(updates: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    onRefresh();
    setBusy(false);
  }

  async function remove() {
    if (confirm(`Delete "${listing.title}"?`)) {
      setBusy(true);
      await fetch(`/api/listings/${listing.id}`, { method: "DELETE" });
      onRefresh();
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <Badge status={listing.status} />
          <span className="text-xs text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>
            {listing.category} · {listing.subcategory}
          </span>
          {listing.submittedBy === "community" && (
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full" style={{ fontFamily: "Arial, sans-serif" }}>
              community submission
            </span>
          )}
        </div>
        <h3 className="font-bold text-stone-900 text-sm leading-snug">{listing.title}</h3>
        <p className="text-xs text-stone-500 mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>
          📍 {listing.location}, {listing.city}, {listing.state}
          {listing.date && ` · 📅 ${listing.date}`}
          {listing.cost && ` · ${listing.cost}`}
        </p>
        <p className="text-xs text-stone-500 mt-1 line-clamp-2" style={{ fontFamily: "Arial, sans-serif" }}>
          {listing.description}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap sm:flex-col sm:items-end shrink-0">
        {listing.status !== "published" && (
          <button disabled={busy} onClick={() => act({ status: "published" })}
            className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Publish
          </button>
        )}
        {listing.status !== "pending" && (
          <button disabled={busy} onClick={() => act({ status: "pending" })}
            className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-amber-600 transition-colors"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Unpublish
          </button>
        )}
        {listing.status !== "rejected" && (
          <button disabled={busy} onClick={() => act({ status: "rejected" })}
            className="text-xs bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg font-semibold hover:bg-stone-300 transition-colors"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Reject
          </button>
        )}
        <button disabled={busy} onClick={remove}
          className="text-xs text-red-600 hover:text-red-800 px-1 py-1"
          style={{ fontFamily: "Arial, sans-serif" }}>
          Delete
        </button>
      </div>
    </div>
  );
}

function AddForm({ onSuccess }: { onSuccess: () => void }) {
  const [category, setCategory] = useState<Category>("Events");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", subcategory: SUBCATEGORIES["Events"][0], description: "",
    date: "", time: "", location: "", city: "Chester", state: "CT",
    cost: "Free", contact: "", url: "", tags: "",
  });
  const [seniorDiscount, setSeniorDiscount] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        category,
        seniorDiscount,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
        status: "published",
        submittedBy: "curator",
      }),
    });
    setSaving(false);
    onSuccess();
    setSeniorDiscount(false);
    setForm({ title: "", subcategory: SUBCATEGORIES[category][0], description: "", date: "", time: "", location: "", city: "Chester", state: "CT", cost: "Free", contact: "", url: "", tags: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-xl">
      <div>
        <label className="block text-sm font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Category *</label>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} type="button"
              onClick={() => { setCategory(cat); set("subcategory", SUBCATEGORIES[cat][0]); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${category === cat ? "bg-[#556B3D] text-white" : "bg-white border border-stone-300 text-stone-600"}`}
              style={{ fontFamily: "Arial, sans-serif" }}
            >{cat}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Type *</label>
          <select value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
            {SUBCATEGORIES[category].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Cost</label>
          <input type="text" value={form.cost} onChange={(e) => set("cost", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none" style={{ fontFamily: "Arial, sans-serif" }}>
        <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${seniorDiscount ? "bg-[#233249] border-[#233249]" : "border-stone-300"}`}
          onClick={() => setSeniorDiscount(v => !v)}>
          {seniorDiscount && <span className="text-[#D49A3A] text-xs font-bold leading-none">✓</span>}
        </span>
        <input type="checkbox" checked={seniorDiscount} onChange={e => setSeniorDiscount(e.target.checked)} className="sr-only" />
        <span className="text-sm font-semibold">🏷️ Senior discount available</span>
      </label>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Title *</label>
        <input required type="text" value={form.title} onChange={(e) => set("title", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Description *</label>
        <textarea required value={form.description} onChange={(e) => set("description", e.target.value)}
          rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm resize-y" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Date</label>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Time</label>
          <input type="text" value={form.time} onChange={(e) => set("time", e.target.value)} placeholder="2:00 PM"
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Location *</label>
        <input required type="text" value={form.location} onChange={(e) => set("location", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Town *</label>
          <select value={form.city} onChange={(e) => set("city", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
            {CITIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>State</label>
          <input type="text" value={form.state} onChange={(e) => set("state", e.target.value)} maxLength={2}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm uppercase" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Contact (email or phone)</label>
        <input type="text" value={form.contact} onChange={(e) => set("contact", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Website URL</label>
        <input type="text" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Tags (comma separated)</label>
        <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="walking, free, outdoors"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
      </div>

      <button type="submit" disabled={saving}
        className="bg-[#556B3D] text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3d5229] transition-colors w-fit disabled:opacity-50"
        style={{ fontFamily: "Arial, sans-serif" }}>
        {saving ? "Saving…" : "Add Listing"}
      </button>
    </form>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/listings").then(r => r.json());
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  const published = listings.filter(l => l.status === "published");
  const pending = listings.filter(l => l.status === "pending");

  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm">
            <h1 className="text-2xl font-bold mb-1">Curator Login</h1>
            <p className="text-sm text-stone-500 mb-6" style={{ fontFamily: "Arial, sans-serif" }}>
              Enter your curator password to manage listings.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); if (password === CURATOR_PASSWORD) setAuthed(true); else alert("Incorrect password."); }}>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" className="w-full border border-stone-300 rounded-lg px-4 py-2.5 text-sm mb-3"
                style={{ fontFamily: "Arial, sans-serif" }} autoFocus />
              <button type="submit"
                className="w-full bg-[#556B3D] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#3d5229] transition-colors"
                style={{ fontFamily: "Arial, sans-serif" }}>
                Sign In
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Curator Dashboard</h1>
            <p className="text-sm text-stone-500" style={{ fontFamily: "Arial, sans-serif" }}>
              {published.length} published · {pending.length} pending review
            </p>
          </div>
          <button onClick={() => setAuthed(false)}
            className="text-xs text-stone-400 hover:text-stone-700" style={{ fontFamily: "Arial, sans-serif" }}>
            Sign out
          </button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {([
            { id: "pending", label: `Review (${pending.length})` },
            { id: "published", label: `Published (${published.length})` },
            { id: "add", label: "➕ Add Listing" },
          ] as { id: Tab; label: string }[]).map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === id ? "border-[#556B3D] text-[#556B3D]" : "border-transparent text-stone-500 hover:text-stone-800"
              }`}
              style={{ fontFamily: "Arial, sans-serif" }}>
              {label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>Loading…</p>}

        {!loading && tab === "pending" && (
          <div className="flex flex-col gap-3">
            {pending.length === 0
              ? <p className="text-stone-400 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>No pending submissions. You're all caught up.</p>
              : pending.map(l => <AdminRow key={l.id} listing={l} onRefresh={refresh} />)
            }
          </div>
        )}

        {!loading && tab === "published" && (
          <div className="flex flex-col gap-3">
            {published.map(l => <AdminRow key={l.id} listing={l} onRefresh={refresh} />)}
          </div>
        )}

        {tab === "add" && (
          <AddForm onSuccess={() => { refresh(); setTab("published"); }} />
        )}
      </main>
    </div>
  );
}
