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

      {/* Mobile fallback notice */}
      <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700 lg:hidden">
        If the PDF does not appear below,{" "}
        <a href={downloadSrc} target="_blank" rel="noopener noreferrer" className="font-semibold underline">
          tap here to open it
        </a>
        .
      </div>

      {/* Embedded PDF — never opens as a raw browser tab */}
      <iframe
        src={viewerSrc}
        className="flex-1 w-full border-0 bg-slate-100"
        title={module.title}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}
