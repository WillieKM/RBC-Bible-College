"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
    >
      Print / Save as PDF
    </button>
  );
}
