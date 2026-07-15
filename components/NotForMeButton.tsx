"use client";
import { useState } from "react";
import { hideSubcategory, hideItem } from "@/lib/prefs";

export default function NotForMeButton({
  id,
  subcategory,
  onHide,
}: {
  id: string;
  subcategory: string;
  onHide?: () => void;
}) {
  const [step, setStep] = useState<"idle" | "choosing">("idle");

  if (step === "choosing") {
    return (
      <div className="flex flex-col gap-1.5 py-1" style={{ fontFamily: "Arial, sans-serif" }}>
        <p className="text-xs text-stone-400">What would you like to hide?</p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { hideItem(id); onHide?.(); }}
            className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            Just this event
          </button>
          <button
            onClick={() => { hideSubcategory(subcategory); onHide?.(); }}
            className="text-xs bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold px-3 py-1.5 rounded-lg transition-colors"
          >
            All {subcategory}
          </button>
          <button
            onClick={() => setStep("idle")}
            className="text-xs text-stone-300 hover:text-stone-500 px-2 py-1.5"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("choosing")}
      className="text-xs text-stone-300 hover:text-stone-500 transition-colors"
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      Not for me
    </button>
  );
}
