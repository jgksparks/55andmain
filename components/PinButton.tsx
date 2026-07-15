"use client";
import { useState, useEffect } from "react";
import { isPinned, togglePin } from "@/lib/pins";

export default function PinButton({ id }: { id: string }) {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    setPinned(isPinned(id));
  }, [id]);

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    const nowPinned = togglePin(id);
    setPinned(nowPinned);
  }

  return (
    <button
      onClick={handleClick}
      title={pinned ? "Remove from My Calendar" : "Add to My Calendar"}
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border transition-colors font-semibold ${
        pinned
          ? "bg-[#556B3D] text-white border-[#556B3D]"
          : "bg-white text-stone-500 border-stone-300 hover:border-[#556B3D] hover:text-[#556B3D]"
      }`}
      style={{ fontFamily: "Arial, sans-serif" }}
    >
      <span>{pinned ? "📌" : "📌"}</span>
      <span>{pinned ? "Saved" : "Save"}</span>
    </button>
  );
}
