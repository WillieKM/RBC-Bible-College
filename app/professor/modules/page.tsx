import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { ModuleFile } from "@/lib/types";

export default async function ProfessorModulesPage() {
  await requireRole(["professor"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_files")
    .select("*")
    .order("created_at", { ascending: false });

  const modules = (data ?? []) as ModuleFile[];
  const unlocked = modules.filter((m) => m.sent_at);
  const locked = modules.filter((m) => !m.sent_at);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Modules</h1>
      <p className="mt-1 text-sm text-slate-500">
        All course modules uploaded by the college. Locked modules are not yet visible to students.
      </p>

      {modules.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No modules uploaded yet.</p>
        </div>
      )}

      {/* ── Unlocked modules ── */}
      {unlocked.length > 0 && (
        <div className="mt-6 space-y-3">
          {unlocked.map((m) => (
            <div key={m.id} className="rounded-xl border border-gold/30 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  {m.description && (
                    <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">
                    Released {new Date(m.sent_at!).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!m.restrict_download && (
                      <a
                        href={m.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark"
                      >
                        Download →
                      </a>
                    )}
                    <a
                      href={m.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                      {m.restrict_download ? "Open PDF →" : "Preview PDF →"}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Locked modules ── */}
      {locked.length > 0 && (
        <div className={unlocked.length > 0 ? "mt-8" : "mt-6"}>
          {unlocked.length > 0 && (
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Not Yet Released to Students
            </h2>
          )}
          <div className="space-y-3">
            {locked.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-600">{m.title}</p>
                  {m.description && (
                    <p className="mt-0.5 text-sm text-slate-400">{m.description}</p>
                  )}
                  <p className="mt-2 text-xs text-amber-600 font-medium">
                    Pending release — go to Admin → Modules to send
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Not released
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
