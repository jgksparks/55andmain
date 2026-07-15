"use client";
import Link from "next/link";
import { useState } from "react";

// The 55andMain mark — circle with crossing paths
function BrandMark({ size = 36, color = "#556B3D" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="20" cy="20" r="15" stroke={color} strokeWidth="2.2" fill="none" opacity="0.9"/>
      <line x1="12" y1="12" x2="28" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      <line x1="28" y1="12" x2="12" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
      <circle cx="20" cy="3.5" r="2" fill="#D49A3A"/>
      <circle cx="36.5" cy="20" r="1.5" fill="#D49A3A" opacity="0.6"/>
    </svg>
  );
}

export default function Nav({ city }: { city?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-[#F6F2E8] border-b border-[#E8E2D6] shadow-sm">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo + mark */}
        <Link href="/" className="flex items-center gap-3 leading-none">
          <BrandMark size={36} color="#556B3D" />
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight leading-tight text-[#233249]" style={{ fontFamily: "Georgia, serif" }}>55andMain</span>
            <span className="text-xs font-semibold leading-tight text-[#D49A3A] tracking-widest uppercase" style={{ fontFamily: "Arial, sans-serif" }}>
              — The Front Porch —
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6 text-sm" style={{ fontFamily: "Arial, sans-serif" }}>
          {city && (
            <span className="text-[#556B3D] text-xs font-semibold">📍 {city}</span>
          )}
          <Link href="/calendar" className="text-[#556B3D] hover:text-[#D49A3A] transition-colors font-medium flex items-center gap-1">
            📅 My Calendar
          </Link>
          <Link href="/settings" className="text-[#556B3D] hover:text-[#D49A3A] transition-colors font-medium flex items-center gap-1">
            ⚙️ Preferences
          </Link>
          <Link href="/submit" className="text-[#556B3D] hover:text-[#D49A3A] transition-colors font-medium">
            Submit an Event
          </Link>
          <Link href="/admin" className="bg-[#556B3D] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#3d5229] transition-colors">
            Curator Login
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button className="sm:hidden text-[#556B3D]" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {menuOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </div>

      {menuOpen && (
        <div className="sm:hidden border-t border-[#E8E2D6] bg-[#F6F2E8] px-4 py-3 flex flex-col gap-3 text-sm text-[#556B3D] font-medium" style={{ fontFamily: "Arial, sans-serif" }}>
          <Link href="/calendar" onClick={() => setMenuOpen(false)}>📅 My Calendar</Link>
          <Link href="/settings" onClick={() => setMenuOpen(false)}>⚙️ Preferences</Link>
          <Link href="/submit" onClick={() => setMenuOpen(false)}>Submit an Event</Link>
          <Link href="/admin" onClick={() => setMenuOpen(false)} className="text-[#233249] font-bold">Curator Login</Link>
        </div>
      )}
    </nav>
  );
}
