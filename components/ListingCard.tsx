"use client";
import { useState } from "react";
import { Listing } from "@/lib/data";
import PinButton from "@/components/PinButton";
import NotForMeButton from "@/components/NotForMeButton";

const categoryColors: Record<string, string> = {
  Events:      "bg-blue-100 text-blue-800",
  Experiences: "bg-amber-100 text-amber-800",
  Services:    "bg-purple-100 text-purple-800",
  Groups:      "bg-green-100 text-green-800",
  Fundraisers: "bg-rose-100 text-rose-800",
  Volunteers:  "bg-teal-100 text-teal-800",
};

const categoryIcons: Record<string, string> = {
  Events:      "📅",
  Experiences: "🧭",
  Services:    "🤝",
  Groups:      "👥",
  Fundraisers: "🎗️",
  Volunteers:  "🙌",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const TRUNCATE_AT = 140;

export default function ListingCard({
  listing,
  onHide,
}: {
  listing: Listing;
  onHide?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = listing.description.length > TRUNCATE_AT;
  const displayDesc = expanded || !isLong
    ? listing.description
    : listing.description.slice(0, TRUNCATE_AT) + "…";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2D6] p-6 flex flex-col gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between gap-2">
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[listing.category]}`}
          style={{ fontFamily: "Arial, sans-serif" }}
        >
          {categoryIcons[listing.category]} {listing.subcategory}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap justify-end">
          {listing.cost && (
            (() => {
              const isFree = listing.cost.toLowerCase().startsWith("free");
              const isDonate = listing.cost.toLowerCase().startsWith("donate");
              return (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${
                    isFree
                      ? "bg-emerald-50 text-emerald-700"
                      : isDonate
                      ? "bg-rose-50 text-rose-700"
                      : "bg-[#F6F2E8] text-[#AFA69A] border border-[#E8E2D6]"
                  }`}
                  style={{ fontFamily: "Arial, sans-serif" }}
                >
                  {isFree ? "Free" : isDonate ? "Donate" : listing.cost}
                </span>
              );
            })()
          )}
          {listing.seniorDiscount && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap bg-[#233249] text-[#D49A3A] border border-[#233249]"
              style={{ fontFamily: "Arial, sans-serif" }}
              title="Senior discount available"
            >
              🏷️ Senior discount
            </span>
          )}
          <PinButton id={listing.id} />
        </div>
      </div>

      <h3 className="text-lg font-bold leading-snug text-[#233249]">{listing.title}</h3>

      <div>
        <p className="text-sm text-stone-600 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
          {displayDesc}
        </p>
        {isLong && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-[#556B3D] font-semibold hover:underline mt-1"
            style={{ fontFamily: "Arial, sans-serif" }}
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-1 mt-auto pt-2 border-t border-stone-100" style={{ fontFamily: "Arial, sans-serif" }}>
        {(listing.date || listing.time) && (
          <div className="flex items-center gap-1.5 text-sm text-stone-700">
            <span>🕐</span>
            <span>
              {listing.date && formatDate(listing.date)}
              {listing.date && listing.time && " · "}
              {listing.time}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-sm text-stone-600">
          <span>📍</span>
          <span>{listing.location}</span>
        </div>
        {listing.cost && listing.cost !== "Free" && !listing.cost.toLowerCase().startsWith("free") && (
          <div className="flex items-center gap-1.5 text-sm text-stone-600">
            <span>💵</span>
            <span>{listing.cost}</span>
          </div>
        )}
        {listing.contact && (
          <div className="flex items-center gap-1.5 text-sm text-stone-600">
            <span>✉️</span>
            <a href={`mailto:${listing.contact}`} className="hover:underline text-green-800">
              {listing.contact}
            </a>
          </div>
        )}
        {listing.url && (
          <div className="flex items-center gap-1.5 text-sm text-stone-600">
            <span>🔗</span>
            <a href={listing.url} target="_blank" rel="noopener noreferrer" className="hover:underline text-green-800 truncate">
              More info
            </a>
          </div>
        )}

        <div className="pt-1">
          <NotForMeButton id={listing.id} subcategory={listing.subcategory} onHide={onHide} />
        </div>
      </div>
    </div>
  );
}
