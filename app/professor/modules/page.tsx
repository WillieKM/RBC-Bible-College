import { createClient } from "@/lib/supabase/server";
import { sendModulesToStudents } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/DeleteButton";
import { requireRole } from "@/lib/auth";
import type { ModuleFile } from "@/lib/types";

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All students" },
  { value: "diploma", label: "Diploma / Certificate students only" },
  { value: "bachelors", label: "Bachelor's students only" },
  { value: "masters", label: "Master's students only" },
  { value: "doctorate", label: "Doctorate students only" },
];

export default async function ProfessorModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  await requireRole(["professor"]);
  const { sent } = await searchParams;
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
        Select a module and send it as an email to your students. Modules are uploaded by the admin.
      </p>

      {sent !== undefined && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Sent to {sent} student{sent !== "1" ? "s" : ""} successfully.
        </div>
      )}

      {/* Send form */}
      <form
        action={sendModulesToStudents}
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-slate-800">Send a Module This Week</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Module</label>
            <select
              name="module_id"
              required
              defaultValue=""
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>Select a module…</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Send to</label>
            <select
              name="audience"
              defaultValue="all"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {AUDIENCE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
        {modules.length === 0 ? (
          <p className="text-sm text-slate-400">No modules available yet. Ask the admin to upload some.</p>
        ) : (
          <DeleteButton
            label="Send Module Email"
            pendingLabel="Sending…"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
          />
        )}
      </form>

      {/* Module list */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Available Modules ({modules.length})</h2>
      <div className="mt-3 space-y-2">
        {modules.length === 0 && (
          <p className="text-sm text-slate-500">No modules uploaded yet.</p>
        )}
        {modules.map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-slate-900">{m.title}</p>
                {m.description && <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>}
                <p className="mt-1 text-xs text-slate-400">{m.file_name} · Added {new Date(m.created_at).toLocaleDateString()}</p>
              </div>
              <a
                href={m.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Preview PDF →
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
