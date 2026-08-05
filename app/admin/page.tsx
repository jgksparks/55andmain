"use client";
import { useState, useEffect, useCallback } from "react";
import Nav from "@/components/Nav";
import { type Listing, type Category, type Status } from "@/lib/data";

const CATEGORIES: Category[] = ["Events", "Experiences", "Services", "Groups", "Fundraisers", "Volunteers"];
const AGE_RANGES = ["All Ages", "Adults 55+", "Adults 18+", "Families with Kids", "Teens", "Kids"];

const SUBCATEGORIES: Record<Category, string[]> = {
  Events: ["Classes", "Exercise & Fitness", "Lectures & Talks", "Live Music", "Music", "Arts & Crafts", "Theatre & Performance", "Recreation & Sport", "Community Gathering", "Senior Programs", "Town Tradition", "Volunteer", "Other"],
  Experiences: ["Adventure Days", "Field Quests", "Self-Guided", "Museums & History", "Art & Galleries", "Nature & Trails", "Local Shopping", "Seasonal Challenge", "Other"],
  Services: ["Local Business", "Senior Programs", "Home Services", "Health & Wellness", "Transportation", "Trusted Provider", "Other"],
  Groups: ["Walking Groups", "Sailing", "Kayaking & Paddling", "Pickleball", "Tennis", "Cycling", "Hiking Clubs", "Fishing", "Bird Watching", "Garden Clubs", "Book Clubs", "Art Groups", "Photography Clubs", "Yoga & Wellness", "Chess & Games", "Knitting & Crafts", "History & Heritage", "Volunteer Groups", "Other"],
  Fundraisers: ["Community Fund", "Emergency Services Fund", "Community Event Fund", "Land Conservation Fund", "Other"],
  Volunteers: ["River Stewardship", "Food Security", "Trail Maintenance", "Hospital Support", "Community Stewardship", "Town Stewardship", "Emergency Services", "Other"],
};

const CURATOR_PASSWORD = "frontporch";
const CITIES = ["Chester", "Deep River", "Essex", "Old Saybrook", "Old Lyme", "Westbrook", "Clinton"];
const TIMES: string[] = [
  "12:00 AM","12:30 AM","1:00 AM","1:30 AM","2:00 AM","2:30 AM","3:00 AM","3:30 AM",
  "4:00 AM","4:30 AM","5:00 AM","5:30 AM","6:00 AM","6:30 AM","7:00 AM","7:30 AM",
  "8:00 AM","8:30 AM","9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM","3:00 PM","3:30 PM",
  "4:00 PM","4:30 PM","5:00 PM","5:30 PM","6:00 PM","6:30 PM","7:00 PM","7:30 PM",
  "8:00 PM","8:30 PM","9:00 PM","9:30 PM","10:00 PM","10:30 PM","11:00 PM","11:30 PM",
];

type Tab = "published" | "pending" | "rejected" | "add" | "bulk";

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

function EditModal({ listing, onClose, onSave, organizers }: { listing: Listing; onClose: () => void; onSave: () => void; organizers: string[] }) {
  const [form, setForm] = useState({
    title: listing.title,
    category: listing.category as Category,
    subcategory: listing.subcategory,
    description: listing.description,
    date: listing.date ?? "",
    time: listing.time ?? "",
    timeEnd: listing.timeEnd ?? "",
    location: listing.location,
    city: listing.city,
    cost: listing.cost,
    organizer: listing.organizer ?? "",
    ageRange: listing.ageRange ?? "All Ages",
    contact: listing.contact ?? "",
    url: listing.url ?? "",
    tags: (listing.tags ?? []).join(", "),
    recurring: listing.recurring ?? "none",
    recurringDay: listing.recurringDay ?? "",
    recurringEnd: listing.recurringEnd ?? "",
  });
  const [seniorDiscount, setSeniorDiscount] = useState(listing.seniorDiscount ?? false);
  const [saving, setSaving] = useState(false);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/listings/${listing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
        seniorDiscount,
      }),
    });
    setSaving(false);
    onSave();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="text-lg font-bold text-[#233249]">Edit Listing</h2>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl font-bold">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Title *</label>
            <input required type="text" value={form.title} onChange={e => set("title", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Category</label>
              <select value={form.category} onChange={e => { set("category", e.target.value); set("subcategory", SUBCATEGORIES[e.target.value as Category][0]); }}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Type</label>
              <select value={form.subcategory} onChange={e => set("subcategory", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                {SUBCATEGORIES[form.category].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Town</label>
            <select value={form.city} onChange={e => set("city", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Description *</label>
            <textarea required value={form.description} onChange={e => set("description", e.target.value)}
              rows={3} className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm resize-y" style={{ fontFamily: "Arial, sans-serif" }} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Date</label>
              <input type="date" value={form.date} onChange={e => set("date", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Start Time</label>
              <select value={form.time} onChange={e => set("time", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                <option value="">—</option>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>End Time</label>
              <select value={form.timeEnd} onChange={e => set("timeEnd", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                <option value="">—</option>
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Location</label>
            <input type="text" value={form.location} onChange={e => set("location", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Cost</label>
              <input type="text" value={form.cost} onChange={e => set("cost", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Contact</label>
              <input type="text" value={form.contact} onChange={e => set("contact", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Age Range</label>
            <select value={form.ageRange} onChange={e => set("ageRange", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
              {AGE_RANGES.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Organizer</label>
            <input type="text" value={form.organizer} onChange={e => set("organizer", e.target.value)}
              list="edit-organizer-list" placeholder="e.g. Essex Library"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
            <datalist id="edit-organizer-list">
              {organizers.map(o => <option key={o} value={o} />)}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Website URL</label>
            <input type="text" value={form.url} onChange={e => set("url", e.target.value)} placeholder="https://"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Tags <span className="font-normal text-stone-400">(comma separated)</span></label>
            <input type="text" value={form.tags} onChange={e => set("tags", e.target.value)} placeholder="walking, free, outdoors"
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Repeats</label>
              <select value={form.recurring} onChange={e => set("recurring", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="annual">Annual</option>
              </select>
            </div>
            {form.recurring === "weekly" && (
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Day of Week</label>
                <select value={form.recurringDay} onChange={e => set("recurringDay", e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
                  <option value="">— select —</option>
                  {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}
          </div>
          {form.recurring !== "none" && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Repeats Until <span className="font-normal text-stone-400">(optional)</span></label>
              <input type="date" value={form.recurringEnd} onChange={e => set("recurringEnd", e.target.value)}
                className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
            </div>
          )}
          <label className="flex items-center gap-3 cursor-pointer select-none" style={{ fontFamily: "Arial, sans-serif" }}>
            <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${seniorDiscount ? "bg-[#233249] border-[#233249]" : "border-stone-300"}`}
              onClick={() => setSeniorDiscount(v => !v)}>
              {seniorDiscount && <span className="text-[#D49A3A] text-xs font-bold leading-none">✓</span>}
            </span>
            <input type="checkbox" checked={seniorDiscount} onChange={e => setSeniorDiscount(e.target.checked)} className="sr-only" />
            <span className="text-sm font-semibold">🏷️ Senior discount available</span>
          </label>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="bg-[#556B3D] text-white px-5 py-2 rounded-lg font-semibold text-sm hover:bg-[#3d5229] transition-colors disabled:opacity-50"
              style={{ fontFamily: "Arial, sans-serif" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
            <button type="button" onClick={onClose}
              className="text-stone-500 px-5 py-2 rounded-lg font-semibold text-sm hover:bg-stone-100 transition-colors"
              style={{ fontFamily: "Arial, sans-serif" }}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AdminRow({ listing, onRefresh, organizers }: { listing: Listing; onRefresh: () => void; organizers: string[] }) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

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

  async function duplicate() {
    setBusy(true);
    await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: listing.title + " (copy)",
        category: listing.category,
        subcategory: listing.subcategory,
        description: listing.description,
        date: listing.date,
        time: listing.time,
        timeEnd: listing.timeEnd,
        location: listing.location,
        city: listing.city,
        state: listing.state,
        cost: listing.cost,
        organizer: listing.organizer,
        ageRange: listing.ageRange,
        contact: listing.contact,
        url: listing.url,
        tags: listing.tags,
        recurring: listing.recurring,
        recurringDay: listing.recurringDay,
        recurringEnd: listing.recurringEnd,
        seniorDiscount: listing.seniorDiscount,
        status: "pending",
        submittedBy: "curator",
      }),
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
    <>
      {editing && <EditModal listing={listing} onClose={() => setEditing(false)} onSave={onRefresh} organizers={organizers} />}
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
          <button disabled={busy} onClick={() => setEditing(true)}
            className="text-xs bg-[#233249] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-[#1a2538] transition-colors"
            style={{ fontFamily: "Arial, sans-serif" }}>
            ✏️ Edit
          </button>
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
          <button disabled={busy} onClick={duplicate}
            className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-stone-200 transition-colors"
            style={{ fontFamily: "Arial, sans-serif" }}>
            📋 Duplicate
          </button>
          <button disabled={busy} onClick={remove}
            className="text-xs text-red-600 hover:text-red-800 px-1 py-1"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}

function AddForm({ onSuccess, organizers }: { onSuccess: () => void; organizers: string[] }) {
  const [category, setCategory] = useState<Category>("Events");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", subcategory: SUBCATEGORIES["Events"][0], description: "",
    date: "", time: "", timeEnd: "", location: "", city: "Chester", state: "CT",
    cost: "Free", contact: "", url: "", tags: "",
    recurring: "none", recurringDay: "", recurringEnd: "", organizer: "", ageRange: "All Ages",
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
        status: "pending",
        submittedBy: "curator",
      }),
    });
    setSaving(false);
    onSuccess();
    setSeniorDiscount(false);
    setForm({ title: "", subcategory: SUBCATEGORIES[category][0], description: "", date: "", time: "", timeEnd: "", location: "", city: "Chester", state: "CT", cost: "Free", contact: "", url: "", tags: "", recurring: "none", recurringDay: "", recurringEnd: "", organizer: "", ageRange: "All Ages" });
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

      <div>
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Age Range</label>
        <select value={form.ageRange} onChange={(e) => set("ageRange", e.target.value)}
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
          {AGE_RANGES.map(a => <option key={a}>{a}</option>)}
        </select>
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Date</label>
          <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Start Time</label>
          <select value={form.time} onChange={(e) => set("time", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
            <option value="">— select —</option>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>End Time</label>
          <select value={form.timeEnd} onChange={(e) => set("timeEnd", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
            <option value="">— select —</option>
            {TIMES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Repeats</label>
          <select value={form.recurring} onChange={(e) => set("recurring", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
          </select>
        </div>
        {form.recurring === "weekly" && (
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Day of Week</label>
            <select value={form.recurringDay} onChange={(e) => set("recurringDay", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white" style={{ fontFamily: "Arial, sans-serif" }}>
              <option value="">— select —</option>
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
        )}
      </div>
      {form.recurring !== "none" && (
        <div>
          <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Repeats Until <span className="font-normal text-stone-400">(optional)</span></label>
          <input type="date" value={form.recurringEnd} onChange={(e) => set("recurringEnd", e.target.value)}
            className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        </div>
      )}

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
        <label className="block text-xs font-semibold mb-1" style={{ fontFamily: "Arial, sans-serif" }}>Organizer</label>
        <input type="text" value={form.organizer} onChange={(e) => set("organizer", e.target.value)}
          list="organizer-list" placeholder="e.g. Essex Library, Chester Land Trust"
          className="w-full border border-stone-300 rounded-lg px-3 py-2 text-sm" style={{ fontFamily: "Arial, sans-serif" }} />
        <datalist id="organizer-list">
          {organizers.map(o => <option key={o} value={o} />)}
        </datalist>
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

function BulkEdit({ listings, organizers, onRefresh }: { listings: Listing[]; organizers: string[]; onRefresh: () => void }) {
  const [edits, setEdits] = useState<Record<string, { organizer: string; ageRange: string }>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOrganizer, setBulkOrganizer] = useState("");
  const [bulkAgeRange, setBulkAgeRange] = useState("");
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");

  function getVal(l: Listing, field: "organizer" | "ageRange") {
    return edits[l.id]?.[field] ?? (field === "organizer" ? (l.organizer ?? "") : (l.ageRange ?? ""));
  }

  function setVal(id: string, field: "organizer" | "ageRange", value: string) {
    setEdits(e => ({ ...e, [id]: { organizer: e[id]?.organizer ?? "", ageRange: e[id]?.ageRange ?? "", [field]: value } }));
    setSaved(s => ({ ...s, [id]: false }));
  }

  async function saveRow(l: Listing) {
    setSaving(s => ({ ...s, [l.id]: true }));
    await fetch(`/api/listings/${l.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizer: getVal(l, "organizer"), ageRange: getVal(l, "ageRange") }),
    });
    setSaving(s => ({ ...s, [l.id]: false }));
    setSaved(s => ({ ...s, [l.id]: true }));
    onRefresh();
  }

  const filtered = listings.filter(l => {
    if (filterCategory !== "All" && l.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || (l.organizer ?? "").toLowerCase().includes(q);
    }
    return true;
  });

  const allChecked = filtered.length > 0 && filtered.every(l => selected.has(l.id));

  function toggleAll() {
    if (allChecked) {
      setSelected(s => { const n = new Set(s); filtered.forEach(l => n.delete(l.id)); return n; });
    } else {
      setSelected(s => { const n = new Set(s); filtered.forEach(l => n.add(l.id)); return n; });
    }
  }

  async function applyBulk() {
    if (!bulkOrganizer && !bulkAgeRange) return;
    const ids = Array.from(selected);
    await Promise.all(ids.map(id =>
      fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(bulkOrganizer ? { organizer: bulkOrganizer } : {}),
          ...(bulkAgeRange ? { ageRange: bulkAgeRange } : {}),
        }),
      })
    ));
    setSelected(new Set());
    setBulkOrganizer("");
    setBulkAgeRange("");
    onRefresh();
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input type="search" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search title, town, organizer…"
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[180px]"
          style={{ fontFamily: "Arial, sans-serif" }} />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value as Category | "All")}
          className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
          style={{ fontFamily: "Arial, sans-serif" }}>
          <option value="All">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      {/* Bulk apply bar — shown when rows are selected */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 items-center bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <span className="text-xs font-semibold text-amber-800" style={{ fontFamily: "Arial, sans-serif" }}>
            {selected.size} selected — set for all:
          </span>
          <input type="text" value={bulkOrganizer} onChange={e => setBulkOrganizer(e.target.value)}
            list="bulk-org-list" placeholder="Organizer…"
            className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm flex-1 min-w-[160px]"
            style={{ fontFamily: "Arial, sans-serif" }} />
          <datalist id="bulk-org-list">{organizers.map(o => <option key={o} value={o} />)}</datalist>
          <select value={bulkAgeRange} onChange={e => setBulkAgeRange(e.target.value)}
            className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm bg-white"
            style={{ fontFamily: "Arial, sans-serif" }}>
            <option value="">Age range…</option>
            {AGE_RANGES.map(a => <option key={a}>{a}</option>)}
          </select>
          <button onClick={applyBulk}
            className="bg-[#556B3D] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-[#3d5229]"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Apply to all selected
          </button>
          <button onClick={() => setSelected(new Set())}
            className="text-xs text-stone-400 hover:text-stone-700"
            style={{ fontFamily: "Arial, sans-serif" }}>
            Deselect
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-stone-200">
        <table className="w-full text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
          <thead className="bg-stone-50 border-b border-stone-200">
            <tr>
              <th className="px-3 py-2.5 text-left w-8">
                <input type="checkbox" checked={allChecked} onChange={toggleAll}
                  className="rounded" />
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs">Title</th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs">Category</th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs">Town</th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs">Organizer</th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs">Age Range</th>
              <th className="px-3 py-2.5 text-left font-semibold text-stone-600 text-xs w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.map(l => (
              <tr key={l.id} className={selected.has(l.id) ? "bg-amber-50" : "bg-white hover:bg-stone-50"}>
                <td className="px-3 py-2">
                  <input type="checkbox" checked={selected.has(l.id)}
                    onChange={() => setSelected(s => { const n = new Set(s); n.has(l.id) ? n.delete(l.id) : n.add(l.id); return n; })}
                    className="rounded" />
                </td>
                <td className="px-3 py-2 max-w-[200px]">
                  <p className="font-semibold text-stone-800 text-xs leading-snug truncate">{l.title}</p>
                  <p className="text-stone-400 text-xs">{l.subcategory}</p>
                </td>
                <td className="px-3 py-2 text-xs text-stone-500">{l.category}</td>
                <td className="px-3 py-2 text-xs text-stone-500">{l.city}</td>
                <td className="px-3 py-2">
                  <input type="text" value={getVal(l, "organizer")} onChange={e => setVal(l.id, "organizer", e.target.value)}
                    list="row-org-list"
                    className="w-full border border-stone-200 rounded px-2 py-1 text-xs focus:border-[#556B3D] focus:outline-none min-w-[140px]" />
                </td>
                <td className="px-3 py-2">
                  <select value={getVal(l, "ageRange")} onChange={e => setVal(l.id, "ageRange", e.target.value)}
                    className="w-full border border-stone-200 rounded px-2 py-1 text-xs bg-white focus:border-[#556B3D] focus:outline-none min-w-[120px]">
                    <option value="">—</option>
                    {AGE_RANGES.map(a => <option key={a}>{a}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-right">
                  {saved[l.id]
                    ? <span className="text-green-600 text-xs font-semibold">✓ Saved</span>
                    : <button onClick={() => saveRow(l)} disabled={saving[l.id]}
                        className="text-xs bg-[#233249] text-white px-2.5 py-1 rounded font-semibold hover:bg-[#1a2538] disabled:opacity-50"
                        style={{ fontFamily: "Arial, sans-serif" }}>
                        {saving[l.id] ? "…" : "Save"}
                      </button>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <datalist id="row-org-list">{organizers.map(o => <option key={o} value={o} />)}</datalist>
      </div>
      <p className="text-xs text-stone-400 mt-3" style={{ fontFamily: "Arial, sans-serif" }}>
        {filtered.length} listings shown · Edit cells and click Save per row, or select rows and use Apply to all selected.
      </p>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("pending");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "All">("All");
  const [filterCity, setFilterCity] = useState("");
  const [filterOrganizer, setFilterOrganizer] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await fetch("/api/listings").then(r => r.json());
    setListings(data);
    setLoading(false);
  }, []);

  useEffect(() => { if (authed) refresh(); }, [authed, refresh]);

  function applyFilters(items: Listing[]) {
    let r = items;
    if (filterCategory !== "All") r = r.filter(l => l.category === filterCategory);
    if (filterCity) r = r.filter(l => l.city === filterCity);
    if (filterOrganizer) r = r.filter(l => l.organizer === filterOrganizer);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(l =>
        l.title.toLowerCase().includes(q) ||
        l.description.toLowerCase().includes(q) ||
        (l.organizer ?? "").toLowerCase().includes(q) ||
        l.subcategory.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q)
      );
    }
    return r;
  }

  const allPublished = listings.filter(l => l.status === "published");
  const allPending = listings.filter(l => l.status === "pending");
  const allRejected = listings.filter(l => l.status === "rejected");
  const published = applyFilters(allPublished);
  const pending = applyFilters(allPending);
  const rejected = applyFilters(allRejected);
  const organizers = Array.from(new Set(listings.map(l => l.organizer).filter(Boolean))) as string[];
  const cities = Array.from(new Set(listings.map(l => l.city).filter(Boolean))).sort() as string[];

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
              {allPublished.length} published · {allPending.length} pending · {allRejected.length} rejected
            </p>
          </div>
          <button onClick={() => setAuthed(false)}
            className="text-xs text-stone-400 hover:text-stone-700" style={{ fontFamily: "Arial, sans-serif" }}>
            Sign out
          </button>
        </div>

        <div className="flex gap-1 mb-6 border-b border-stone-200">
          {([
            { id: "pending", label: `Review (${allPending.length})` },
            { id: "published", label: `Published (${allPublished.length})` },
            { id: "rejected", label: `Rejected (${allRejected.length})` },
            { id: "bulk", label: "📋 Bulk Edit" },
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

        {tab !== "add" && (
          <div className="flex flex-wrap gap-2 mb-5 items-center">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search title, organizer, town…"
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value as Category | "All")}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <option value="All">All categories</option>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filterCity}
              onChange={e => setFilterCity(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <option value="">All towns</option>
              {cities.map(c => <option key={c}>{c}</option>)}
            </select>
            <select
              value={filterOrganizer}
              onChange={e => setFilterOrganizer(e.target.value)}
              className="border border-stone-300 rounded-lg px-3 py-2 text-sm bg-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              <option value="">All organizers</option>
              {organizers.map(o => <option key={o}>{o}</option>)}
            </select>
            {(search || filterCategory !== "All" || filterCity || filterOrganizer) && (
              <button
                onClick={() => { setSearch(""); setFilterCategory("All"); setFilterCity(""); setFilterOrganizer(""); }}
                className="text-xs text-stone-400 hover:text-stone-700 px-2 py-2"
                style={{ fontFamily: "Arial, sans-serif" }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {loading && <p className="text-sm text-stone-400" style={{ fontFamily: "Arial, sans-serif" }}>Loading…</p>}

        {!loading && tab === "pending" && (
          <div className="flex flex-col gap-3">
            {pending.length === 0
              ? <p className="text-stone-400 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>No pending submissions. You're all caught up.</p>
              : pending.map(l => <AdminRow key={l.id} listing={l} onRefresh={refresh} organizers={organizers} />)
            }
          </div>
        )}

        {!loading && tab === "published" && (
          <div className="flex flex-col gap-3">
            {published.map(l => <AdminRow key={l.id} listing={l} onRefresh={refresh} organizers={organizers} />)}
          </div>
        )}

        {!loading && tab === "rejected" && (
          <div className="flex flex-col gap-3">
            {rejected.length === 0
              ? <p className="text-stone-400 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>No rejected listings.</p>
              : rejected.map(l => <AdminRow key={l.id} listing={l} onRefresh={refresh} organizers={organizers} />)
            }
          </div>
        )}

        {tab === "bulk" && (
          <BulkEdit listings={listings} organizers={organizers} onRefresh={refresh} />
        )}

        {tab === "add" && (
          <AddForm onSuccess={() => { refresh(); setTab("published"); }} organizers={organizers} />
        )}
      </main>
    </div>
  );
}
