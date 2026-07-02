import { createClient } from "@/lib/supabase/server";
import type { ModuleFile } from "@/lib/types";

export default async function StudentModulesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_files")
    .select("*")
    .order("created_at", { ascending: false });

  const modules = (data ?? []) as ModuleFile[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Module Files</h1>
      <p className="mt-1 text-sm text-slate-500">
        Download your weekly teaching modules here. New modules are added by your professor each week.
      </p>

      {modules.length === 0 ? (
        <p className="mt-8 text-sm text-slate-400">No modules have been uploaded yet. Check back after your next class.</p>
      ) : (
        <div className="mt-6 space-y-3">
          {modules.map((m) => (
            <div key={m.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{m.title}</p>
                {m.description && <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {m.file_name} · Added {new Date(m.created_at).toLocaleDateString()}
                </p>
              </div>
              <a
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="ml-4 shrink-0 rounded-lg bg-gold px-4 py-2 text-xs font-semibold text-ink hover:bg-gold-dark"
              >
                Download PDF →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
