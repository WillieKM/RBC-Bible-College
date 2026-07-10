import { createClient } from "@/lib/supabase/server";
import type { ModuleFile } from "@/lib/types";

export default async function StudentModulesPage() {
  const supabase = await createClient();

  // Only the most recently sent module is shown — once the next one arrives this one disappears
  const { data } = await supabase
    .from("module_files")
    .select("*")
    .not("sent_at", "is", null)
    .order("sent_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const current = data as ModuleFile | null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">This Week&apos;s Module</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your module for this week is sent by the college and updated automatically each week.
      </p>

      <div className="mt-6">
        {current ? (
          <div className="rounded-xl border border-gold/30 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Current Module</p>
            <h2 className="mt-2 text-xl font-bold text-slate-900">{current.title}</h2>
            {current.description && (
              <p className="mt-2 text-sm text-slate-600">{current.description}</p>
            )}
            <p className="mt-3 text-xs text-slate-400">
              Sent {new Date(current.sent_at!).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {!current.restrict_download && (
                <a
                  href={current.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-block rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-ink hover:bg-gold-dark"
                >
                  Download {current.file_name} →
                </a>
              )}
              <a
                href={current.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-lg border border-slate-200 px-6 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                {current.restrict_download ? `Open ${current.file_name} →` : "Preview PDF →"}
              </a>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center">
            <p className="text-sm font-medium text-slate-500">No module has been sent yet this week.</p>
            <p className="mt-1 text-xs text-slate-400">Check back after your next class — your module will appear here once it&apos;s released.</p>
          </div>
        )}
      </div>
    </div>
  );
}
