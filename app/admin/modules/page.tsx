import { createAdminClient } from "@/lib/supabase/admin";
import { uploadModule, deleteModule } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/DeleteButton";
import type { ModuleFile } from "@/lib/types";

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const admin = createAdminClient();

  const { data } = await admin
    .from("module_files")
    .select("*")
    .order("created_at", { ascending: false });

  const modules = (data ?? []) as ModuleFile[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Module Files</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload PDF modules here. Professors can then select any of these and email them directly to students by program tier.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      {/* Upload form */}
      <form
        action={uploadModule}
        encType="multipart/form-data"
        className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      >
        <h2 className="font-semibold text-slate-800">Upload Modules</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            PDF files * — select one or many at once (max 50 MB each)
          </label>
          <input
            name="file"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            required
            className="mt-1 block text-sm"
          />
          <p className="mt-1 text-xs text-slate-400">
            Titles are auto-generated from filenames. Selecting a single file lets you set a custom title below.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">
              Title <span className="font-normal text-slate-400">(single file only — leave blank to use filename)</span>
            </label>
            <input
              name="title"
              placeholder="e.g. Week 3 — The Book of Acts"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Description (optional)</label>
            <textarea
              name="description"
              rows={2}
              placeholder="Brief summary — applies to all files in this upload"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        <DeleteButton
          label="Upload Module"
          pendingLabel="Uploading…"
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
        />
      </form>

      {/* Module list */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">Uploaded Modules ({modules.length})</h2>
      <div className="mt-3 space-y-2">
        {modules.length === 0 && (
          <p className="text-sm text-slate-500">No modules uploaded yet.</p>
        )}
        {modules.map((m) => (
          <div key={m.id} className="flex items-start justify-between rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex-1">
              <p className="font-semibold text-slate-900">{m.title}</p>
              {m.description && <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>}
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs text-slate-400">{m.file_name}</span>
                <span className="text-xs text-slate-300">·</span>
                <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                <a
                  href={m.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-gold-dark hover:underline"
                >
                  Preview →
                </a>
              </div>
            </div>
            <form action={deleteModule} className="ml-4 shrink-0">
              <input type="hidden" name="id" value={m.id} />
              <input type="hidden" name="file_url" value={m.file_url} />
              <DeleteButton
                label="Delete"
                pendingLabel="Deleting…"
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              />
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
