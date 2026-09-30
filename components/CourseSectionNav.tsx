"use client";

const SECTIONS = [
  { id: "assignments", label: "Assignments" },
  { id: "materials", label: "Materials" },
  { id: "discussion", label: "Discussion" },
  { id: "message", label: "Message" },
  { id: "attendance", label: "Attendance" },
];

export function CourseSectionNav() {
  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <nav className="mt-4 -mx-1 flex flex-wrap gap-1 border-b border-slate-200 pb-3">
      {SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => scrollTo(s.id)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 hover:border-gold hover:text-gold transition-colors"
        >
          {s.label}
        </button>
      ))}
    </nav>
  );
}
