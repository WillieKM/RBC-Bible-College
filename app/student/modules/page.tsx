import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import Link from "next/link";
import type { ModuleFile } from "@/lib/types";

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

export default async function StudentModulesPage() {
  await requireRole(["student"]);
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_files")
    .select("*")
    .order("sent_at", { ascending: false, nullsFirst: false });

  const modules = (data ?? []) as ModuleFile[];
  const now = Date.now();

  const current  = modules.filter((m) => m.sent_at && now - new Date(m.sent_at).getTime() <= TWO_WEEKS_MS);
  const past     = modules.filter((m) => m.sent_at && now - new Date(m.sent_at).getTime() >  TWO_WEEKS_MS);
  const locked   = modules.filter((m) => !m.sent_at);

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your full module history. Current modules are active; past modules are kept for review.
      </p>

      {modules.length === 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
          <p className="text-sm font-medium text-slate-500">No modules have been uploaded yet.</p>
          <p className="mt-1 text-xs text-slate-400">Check back after your next class.</p>
        </div>
      )}

      {/* ── Current modules (sent within 2 weeks) ── */}
      {current.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Current</h2>
          <div className="space-y-3">
            {current.map((m) => (
              <div key={m.id} className="rounded-xl border border-gold/40 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-slate-900">{m.title}</p>
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Active</span>
                    </div>
                    {m.description && <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>}
                    <p className="mt-1 text-xs text-slate-400">Released {formatDate(m.sent_at!)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/student/modules/${m.id}`}
                        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
                        View PDF →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Past modules (sent 2+ weeks ago) — greyed, still accessible ── */}
      {past.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
            Previously Studied ({past.length})
          </h2>
          <div className="space-y-2">
            {past.map((m) => (
              <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 opacity-75 transition-opacity hover:opacity-100">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-slate-600">{m.title}</p>
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">Studied</span>
                    </div>
                    {m.description && <p className="mt-0.5 text-xs text-slate-400">{m.description}</p>}
                    <p className="mt-1 text-xs text-slate-400">Released {formatDate(m.sent_at!)}</p>
                  </div>
                  <Link href={`/student/modules/${m.id}`}
                    className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100">
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Locked (not released yet) ── */}
      {locked.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Coming Soon</h2>
          <div className="space-y-2">
            {locked.map((m) => (
              <div key={m.id} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 opacity-60">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-500">{m.title}</p>
                  {m.description && <p className="mt-0.5 text-xs text-slate-400">{m.description}</p>}
                  <p className="mt-1 text-xs text-slate-400">Not yet released</p>
                </div>
                <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-500">Locked</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
