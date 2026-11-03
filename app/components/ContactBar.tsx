"use client";

import { usePathname } from "next/navigation";

// Fixed contact strip on every customer page (not admin / staff / display).
// Sticky + in-flow; the floating nav is pushed below it via --contact-bar-h (globals.css).
export const CONTACT = { name: "Anil Ranade", mobile: "9822029235", studio: "Resonance Studio - Sinhgad Road" };

export default function ContactBar() {
  const pathname = usePathname() || "";
  if (["/admin", "/staff", "/display"].some((p) => pathname.startsWith(p))) return null;
  return (
    <div className="contact-bar sticky top-0 z-[60] flex h-[3.1rem] flex-col items-center justify-center bg-champagne px-3 text-center text-sm leading-tight text-navy sm:h-8 sm:flex-row sm:gap-3 sm:text-base">
      <span className="font-semibold">Contact - {CONTACT.name} &nbsp;|&nbsp; Mobile - {CONTACT.mobile}</span>
      <span className="font-bold">{CONTACT.studio}</span>
    </div>
  );
}
