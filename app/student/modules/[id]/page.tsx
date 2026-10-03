import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function ModuleViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requireRole(["student"]);
  const { id } = await params;
  const supabase = await createClient();

  // Resolve program level to enforce audience access control
  let programLevel: string | null = null;
  if (profile.program_id) {
    const { data: prog } = await supabase
      .from("programs")
      .select("program_level")
      .eq("id", profile.program_id)
      .single();
    programLevel = prog?.program_level ?? null;
  }

  const { data: module } = await supabase
    .from("module_files")
    .select("id, title, description, sent_at, send_audience")
    .eq("id", id)
    .not("sent_at", "is", null)
    .single();

  if (!module) notFound();

  // Block access if this module targets a different program level
  const audience = module.send_audience as string | null;
  if (audience && audience !== "all" && audience !== programLevel) notFound();

  // #toolbar=0&navpanes=0 suppresses the browser PDF toolbar in Chrome/Edge/Safari
  const viewerSrc = `/api/module-pdf/${id}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`;
  const downloadSrc = `/api/module-pdf/${id}`;

  return (
    <div className="-m-6 flex h-[calc(100vh-64px)] flex-col">
      {/* Slim header bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-2.5 gap-3">
        <Link href="/student/modules" className="shrink-0 text-sm text-gold-dark hover:underline">
          ← Modules
        </Link>
        <div className="text-center min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{module.title}</p>
          {module.description && (
            <p className="text-xs text-slate-400 truncate">{module.description}</p>
          )}
        </div>
        <a
          href={downloadSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-gold hover:text-gold-dark"
          aria-label="Open PDF in new tab"
        >
          Open ↗
        </a>
      </div>

      {/* Mobile: skip the iframe entirely — Android doesn't render PDFs in iframes */}
      <div className="lg:hidden flex flex-1 flex-col items-center justify-center gap-4 bg-slate-100 px-6 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/10">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-slate-800">{module.title}</p>
          <p className="mt-1 text-sm text-slate-500">Tap below to open the PDF in your browser.</p>
        </div>
        <a
          href={downloadSrc}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl bg-gold px-6 py-3 text-sm font-bold text-ink hover:bg-gold-dark active:scale-95 transition-all"
        >
          Open PDF ↗
        </a>
        <a
          href={`${downloadSrc}?dl=1`}
          className="text-xs text-slate-500 underline"
        >
          Download instead
        </a>
      </div>

      {/* Desktop: embedded PDF viewer */}
      <iframe
        src={viewerSrc}
        className="hidden lg:flex flex-1 w-full border-0 bg-slate-100"
        title={module.title}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
