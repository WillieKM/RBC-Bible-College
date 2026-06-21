import { createClient } from "@/lib/supabase/server";
import type { HandbookPage } from "@/lib/types";

const SECTION_ORDER = [
  "Welcome",
  "Academic Policies",
  "Student Conduct",
  "Financial Policies",
  "Programs & Graduation",
  "Student Life",
  "General",
];

const SECTION_ICONS: Record<string, string> = {
  "Welcome": "✦",
  "Academic Policies": "📖",
  "Student Conduct": "⚖",
  "Financial Policies": "💳",
  "Programs & Graduation": "🎓",
  "Student Life": "🌱",
  "General": "📄",
};

function slugify(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

/** Render body text: ALL-CAPS lines become sub-headings, others become paragraphs */
function renderBody(body: string) {
  const paragraphs = body.split(/\n{2,}/);
  return paragraphs.map((block, pi) => {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return null;
    const firstLine = lines[0];
    // If the block is a single ALL-CAPS line it's a sub-heading
    if (lines.length === 1 && firstLine === firstLine.toUpperCase() && firstLine.length > 2 && !/^\d/.test(firstLine)) {
      return (
        <p key={pi} className="mt-5 text-xs font-bold uppercase tracking-widest text-slate-500">
          {firstLine}
        </p>
      );
    }
    return (
      <p key={pi} className="mt-3 text-sm leading-7 text-slate-700">
        {lines.join(" ")}
      </p>
    );
  });
}

export default async function StudentHandbookPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("handbook_pages")
    .select("*")
    .order("section")
    .order("sort_order");

  const pages = (data ?? []) as HandbookPage[];

  // Group by section, preserving SECTION_ORDER
  const grouped = new Map<string, HandbookPage[]>();
  for (const page of pages) {
    const sec = page.section || "General";
    const list = grouped.get(sec) ?? [];
    list.push(page);
    grouped.set(sec, list);
  }
  const orderedSections = SECTION_ORDER.filter((s) => grouped.has(s));
  // Add any sections not in the predefined order
  for (const s of grouped.keys()) {
    if (!orderedSections.includes(s)) orderedSections.push(s);
  }

  if (pages.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Handbook</h1>
        <p className="mt-6 text-sm text-slate-400">
          The handbook is not yet available. Please check back soon.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold-dark">
          Revelation Bible College International
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-900">Student Handbook</h1>
        <p className="mt-2 text-sm text-slate-500">
          This handbook contains the policies, expectations, and information you need to thrive in your studies. Please read it carefully and refer to it throughout your time with us.
        </p>
      </div>

      <div className="mt-8 flex gap-8">
        {/* Sidebar — Table of Contents */}
        <aside className="hidden w-56 shrink-0 lg:block">
          <div className="sticky top-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Contents</p>
            <nav className="mt-3 space-y-4">
              {orderedSections.map((section) => {
                const sectionPages = grouped.get(section) ?? [];
                return (
                  <div key={section}>
                    <a
                      href={`#${slugify(section)}`}
                      className="text-xs font-bold uppercase tracking-wide text-slate-500 hover:text-gold-dark"
                    >
                      {section}
                    </a>
                    <ul className="mt-1 space-y-0.5">
                      {sectionPages.map((page) => (
                        <li key={page.id}>
                          <a
                            href={`#${slugify(page.title)}`}
                            className="block py-0.5 pl-2 text-xs text-slate-500 hover:text-gold-dark"
                          >
                            {page.title}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {orderedSections.map((section, si) => {
            const sectionPages = grouped.get(section) ?? [];
            const icon = SECTION_ICONS[section] ?? "📄";
            return (
              <div key={section} id={slugify(section)} className={si > 0 ? "mt-14" : undefined}>
                {/* Section header */}
                <div className="flex items-center gap-3 border-b-2 border-gold/30 pb-3">
                  <span className="text-xl" aria-hidden="true">{icon}</span>
                  <h2 className="text-xl font-bold text-slate-900">{section}</h2>
                </div>

                {/* Pages in this section */}
                <div className="mt-6 space-y-10">
                  {sectionPages.map((page) => (
                    <article key={page.id} id={slugify(page.title)}>
                      <h3 className="text-base font-bold text-slate-800">{page.title}</h3>
                      <div className="mt-1">
                        {renderBody(page.body)}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Footer */}
          <div className="mt-16 border-t border-slate-200 pt-6 text-center">
            <p className="text-xs text-slate-400">
              Revelation Bible College International — Student Handbook
            </p>
            <p className="mt-1 text-xs text-slate-400">
              This document is subject to revision. Please check the portal for the most current version.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
