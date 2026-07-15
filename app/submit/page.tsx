"use client";
import { useState } from "react";
import Nav from "@/components/Nav";
import { addListing, type Category } from "@/lib/data";

const CATEGORIES: Category[] = ["Events", "Experiences", "Services", "Groups", "Fundraisers", "Volunteers"];

const SUBCATEGORIES: Record<Category, string[]> = {
  Events: ["Classes", "Lectures", "Music", "Recreation", "Volunteer", "Community Gathering", "Other"],
  Experiences: ["Adventure Days", "Field Quests", "Self-Guided", "Seasonal Challenge", "Other"],
  Services: ["Local Business", "Senior Services", "Home Services", "Wellness", "Trusted Provider", "Other"],
  Groups: ["Walking Groups", "Pickleball", "Garden Clubs", "Book Clubs", "Volunteer Groups", "Other"],
  Fundraisers: ["Community Fund", "Emergency Services Fund", "Community Event Fund", "Land Conservation Fund", "Other"],
  Volunteers: ["River Stewardship", "Food Security", "Trail Maintenance", "Hospital Support", "Community Stewardship", "Other"],
};

export default function SubmitPage() {
  const [submitted, setSubmitted] = useState(false);
  const [category, setCategory] = useState<Category>("Events");
  const [form, setForm] = useState({
    title: "",
    subcategory: SUBCATEGORIES["Events"][0],
    description: "",
    date: "",
    time: "",
    location: "",
    city: "",
    state: "",
    cost: "Free",
    contact: "",
    url: "",
    tags: "",
  });
  const [seniorDiscount, setSeniorDiscount] = useState(false);

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    addListing({
      ...form,
      category,
      seniorDiscount,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      status: "pending",
      submittedBy: "community",
    });
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-md">
            <p className="text-5xl mb-4">🌿</p>
            <h1 className="text-2xl font-bold mb-2">Thank you!</h1>
            <p className="text-stone-600 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
              Your submission has been received and will be reviewed by a curator. If approved, it will appear on the site within 24 hours.
            </p>
            <a
              href="/"
              className="mt-6 inline-block bg-[#556B3D] text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#3d5229] transition-colors"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              Back to the community
            </a>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-1">Submit to 55andMain</h1>
          <p className="text-stone-500 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
            Know something worth sharing? Submit it for curator review. We read everything.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Category *
            </label>
            <div className="flex gap-2 flex-wrap">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setCategory(cat);
                    set("subcategory", SUBCATEGORIES[cat][0]);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    category === cat
                      ? "bg-[#556B3D] text-white"
                      : "bg-white border border-stone-300 text-stone-600 hover:bg-stone-50"
                  }`}
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Subcategory */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Type *
            </label>
            <select
              value={form.subcategory}
              onChange={(e) => set("subcategory", e.target.value)}
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm bg-white"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {SUBCATEGORIES[category].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Title *
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Saturday Morning Birding Walk"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Description *
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              placeholder="Tell people what this is, who it's for, and why they should come."
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm resize-y"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          {/* Date & Time */}
          {(category === "Events") && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
                  Time
                </label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => set("time", e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
                  style={{ fontFamily: "Arial, sans-serif" }}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Location *
            </label>
            <input
              required
              type="text"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Mindowaskin Park, Main Entrance"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          {/* City & State */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
                City *
              </label>
              <input
                required
                type="text"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Westfield"
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
                style={{ fontFamily: "Arial, sans-serif" }}
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
                State *
              </label>
              <input
                required
                type="text"
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="NJ"
                maxLength={2}
                className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm uppercase"
                style={{ fontFamily: "Arial, sans-serif" }}
              />
            </div>
          </div>

          {/* Cost */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Cost
            </label>
            <input
              type="text"
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              placeholder="Free, $10, Varies by session…"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          {/* Senior discount */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer select-none" style={{ fontFamily: "Arial, sans-serif" }}>
              <span className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 ${seniorDiscount ? "bg-[#233249] border-[#233249]" : "border-stone-300"}`}
                onClick={() => setSeniorDiscount(v => !v)}>
                {seniorDiscount && <span className="text-[#D49A3A] text-xs font-bold leading-none">✓</span>}
              </span>
              <input type="checkbox" checked={seniorDiscount} onChange={e => setSeniorDiscount(e.target.checked)} className="sr-only" />
              <span className="text-sm font-semibold">🏷️ Senior discount available</span>
            </label>
            <p className="text-xs text-stone-400 mt-1 ml-8" style={{ fontFamily: "Arial, sans-serif" }}>
              Check this if the listing offers a reduced rate for seniors (55+)
            </p>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Contact email or phone
            </label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              placeholder="info@example.com"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ fontFamily: "Arial, sans-serif" }}>
              Tags <span className="font-normal text-stone-400">(comma separated)</span>
            </label>
            <input
              type="text"
              value={form.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="walking, outdoors, seniors, free"
              className="w-full border border-stone-300 rounded-lg px-3 py-2.5 text-sm"
              style={{ fontFamily: "Arial, sans-serif" }}
            />
          </div>

          <button
            type="submit"
            className="bg-[#556B3D] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#3d5229] transition-colors mt-2"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            Submit for Review
          </button>
        </form>
      </main>
    </div>
  );
}
