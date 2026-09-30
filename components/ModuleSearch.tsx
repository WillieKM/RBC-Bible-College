"use client";

import { useState, useEffect } from "react";

export function ModuleSearch() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const q = query.toLowerCase().trim();
    const cards = document.querySelectorAll<HTMLElement>("[data-module-title]");
    cards.forEach((card) => {
      const title = card.dataset.moduleTitle ?? "";
      const section = card.closest("div.mt-6, div.mt-8") as HTMLElement | null;
      card.style.display = !q || title.includes(q) ? "" : "none";
      // hide section heading if all children are hidden
      if (section) {
        const visible = [...section.querySelectorAll("[data-module-title]")].some(
          (c) => (c as HTMLElement).style.display !== "none"
        );
        const heading = section.querySelector("h2");
        if (heading) (heading as HTMLElement).style.display = visible ? "" : "none";
      }
    });
  }, [query]);

  return (
    <div className="mt-1 shrink-0">
      <input
        type="search"
        placeholder="Search modules…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-44 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
        aria-label="Search modules"
      />
    </div>
  );
}
