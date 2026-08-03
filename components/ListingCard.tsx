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

const recurringLabels: Record<string, string> = {
  weekly:   "🔄 Weekly",
  biweekly: "🔄 Bi-weekly",
  monthly:  "🔄 Monthly",
  seasonal: "🔄 Seasonal",
};

const dayToRRule: Record<string, string> = {
  Monday: "MO", Tuesday: "TU", Wednesday: "WE", Thursday: "TH",
  Friday: "FR", Saturday: "SA", Sunday: "SU",
};

function formatDate(dateStr?: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function toICSDate(dateStr: string, timeStr?: string): string {
  const d = new Date(dateStr + "T00:00:00");
  if (timeStr) {
    const [timePart, meridiem] = timeStr.split(" ");
    let [hours, minutes] = timePart.split(":").map(Number);
    if (meridiem === "PM" && hours !== 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    d.setHours(hours, minutes);
  }
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildICS(listing: Listing): string {
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  let dtStart = "";
  let dtEnd = "";

  if (listing.date) {
    dtStart = toICSDate(listing.date, listing.time);
    dtEnd = listing.timeEnd
      ? toICSDate(listing.date, listing.timeEnd)
      : toICSDate(listing.date, listing.time); // same as start if no end
  } else {
    // Recurring with no specific start date — use next occurrence of the day
    const today = new Date();
    const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const targetDay = dayNames.indexOf(listing.recurringDay ?? "Monday");
    const daysAhead = (targetDay - today.getDay() + 7) % 7 || 7;
    const next = new Date(today);
    next.setDate(today.getDate() + daysAhead);
    const dateStr = next.toISOString().split("T")[0];
    dtStart = toICSDate(dateStr, listing.time);
    dtEnd = listing.timeEnd ? toICSDate(dateStr, listing.timeEnd) : dtStart;
  }

  let rrule = "";
  if (listing.recurring && listing.recurring !== "none") {
    if (listing.recurring === "weekly" && listing.recurringDay && dayToRRule[listing.recurringDay]) {
      rrule = `RRULE:FREQ=WEEKLY;BYDAY=${dayToRRule[listing.recurringDay]}`;
    } else if (listing.recurring === "biweekly" && listing.recurringDay && dayToRRule[listing.recurringDay]) {
      rrule = `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=${dayToRRule[listing.recurringDay]}`;
    } else if (listing.recurring === "monthly") {
      rrule = `RRULE:FREQ=MONTHLY`;
    } else if (listing.recurring === "seasonal") {
      rrule = `RRULE:FREQ=YEARLY`;
    }
  }

  const desc = listing.description.replace(/\n/g, "\\n").replace(/,/g, "\\,");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//55andMain//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `DTSTAMP:${now}`,
    `SUMMARY:${listing.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${listing.location}\\, ${listing.city}\\, CT`,
    listing.url ? `URL:${listing.url}` : "",
    rrule,
    `UID:${listing.id}@55andmain.com`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");
}

function AddToCalendarButton({ listing }: { listing: Listing }) {
  function download() {
    const ics = buildICS(listing);
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${listing.title.replace(/\s+/g, "-").toLowerCase()}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      onClick={download}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#556B3D] hover:text-[#3d5229] hover:underline transition-colors"
      style={{ fontFamily: "Arial, sans-serif" }}
      title="Add to Google, Apple, or Outlook calendar"
    >
      📅 Add to Calendar
    </button>
  );
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

  const isRecurring = listing.recurring && listing.recurring !== "none";
  const recurringLabel = isRecurring ? recurringLabels[listing.recurring!] : null;
  const showCalendar = listing.date || isRecurring;

  const timeDisplay = listing.time
    ? listing.timeEnd
      ? `${listing.time} – ${listing.timeEnd}`
      : listing.time
    : null;

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
          {isRecurring && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap bg-violet-50 text-violet-700 border border-violet-200"
              style={{ fontFamily: "Arial, sans-serif" }}
            >
              {recurringLabel}{listing.recurringDay ? ` · ${listing.recurringDay}` : ""}
            </span>
          )}
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
        {(listing.date || timeDisplay || isRecurring) && (
          <div className="flex items-center gap-1.5 text-sm text-stone-700">
            <span>🕐</span>
            <span>
              {listing.date && formatDate(listing.date)}
              {listing.date && (timeDisplay || isRecurring) && " · "}
              {timeDisplay}
              {!listing.date && isRecurring && listing.recurringDay && `Every ${listing.recurringDay}`}
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

        {showCalendar && (
          <div className="pt-1">
            <AddToCalendarButton listing={listing} />
          </div>
        )}

        <div className="pt-1">
          <NotForMeButton id={listing.id} subcategory={listing.subcategory} onHide={onHide} />
        </div>
      </div>
    </div>
  );
}
