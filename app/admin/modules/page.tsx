import { createAdminClient } from "@/lib/supabase/admin";
import { uploadModule, updateModule, deleteModule, sendModuleNow } from "@/lib/actions/modules";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";
import type { ModuleFile } from "@/lib/types";

export default async function AdminModulesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; edit?: string; sent?: string }>;
}) {
  const { error, edit, sent } = await searchParams;
  const admin = createAdminClient();

  const [{ data }, { data: professors }] = await Promise.all([
    admin.from("module_files").select("*").order("created_at", { ascending: false }),
    admin.from("profiles").select("id, full_name").eq("role", "professor").order("full_name"),
  ]);

  const modules = (data ?? []) as ModuleFile[];
  const profList = (professors ?? []) as { id: string; full_name: string }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Module Files</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload PDF modules and schedule or send them to students and professors. Only the most recently sent module is visible in student and professor portals.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}
      {sent && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Module sent to {sent} recipients (students + professors).
        </div>
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
        <div className="flex items-center gap-2">
          <input type="checkbox" name="restrict_download" id="restrict_upload" value="1" className="rounded" />
          <label htmlFor="restrict_upload" className="text-sm text-slate-600">Restrict downloads (preview only)</label>
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
          <div key={m.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {edit === m.id ? (
              /* ── Inline edit form ── */
              <form action={updateModule} className="space-y-3 px-5 py-4">
                <input type="hidden" name="id" value={m.id} />
                <div className="flex flex-wrap gap-3">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Title *</label>
                    <input
                      name="title"
                      required
                      defaultValue={m.title}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea
                      name="description"
                      rows={2}
                      defaultValue={m.description ?? ""}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-3">
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">
                      Schedule send <span className="font-normal text-slate-400">(leave blank to send manually)</span>
                    </label>
                    <input
                      name="send_at"
                      type="datetime-local"
                      defaultValue={m.send_at ? new Date(m.send_at).toISOString().slice(0, 16) : ""}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                    {m.sent_at && (
                      <p className="mt-1 text-xs text-green-600">
                        ✓ Sent {new Date(m.sent_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 min-w-48">
                    <label className="block text-sm font-medium text-slate-700">Send to</label>
                    <select
                      name="send_audience"
                      defaultValue={m.send_audience ?? "all"}
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    >
                      <optgroup label="Students">
                        <option value="all">All students</option>
                        <option value="diploma">Diploma / Certificate only</option>
                        <option value="bachelors">Bachelor&apos;s only</option>
                        <option value="masters">Master&apos;s only</option>
                        <option value="doctorate">Doctorate only</option>
                      </optgroup>
                      {profList.length > 0 && (
                        <optgroup label="Specific Professor">
                          {profList.map((p) => (
                            <option key={p.id} value={`prof:${p.id}`}>{p.full_name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <DeleteButton
                    label="Save"
                    pendingLabel="Saving…"
                    className="rounded-lg bg-gold px-4 py-1.5 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
                  />
                  <Link href="/admin/modules" className="text-sm text-slate-500 hover:text-slate-700">
                    Cancel
                  </Link>
                  <label className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
                    <input type="checkbox" name="restrict_download" value="1" defaultChecked={m.restrict_download} className="rounded" />
                    Restrict downloads
                  </label>
                </div>
              </form>
            ) : (
              /* ── Read-only row ── */
              <div className="px-5 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900">{m.title}</p>
                    {m.description && <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>}
                    <div className="mt-1 flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-400">{m.file_name}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
                      {m.sent_at ? (
                        <span className="text-xs font-medium text-green-600">✓ Sent {new Date(m.sent_at).toLocaleDateString()}</span>
                      ) : m.send_at ? (
                        <span className="text-xs font-medium text-amber-600">⏱ Scheduled {new Date(m.send_at).toLocaleString()}</span>
                      ) : null}
                      {m.restrict_download && (
                        <span className="text-xs font-medium text-amber-600">⊘ Download restricted</span>
                      )}
                      <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-gold-dark hover:underline">
                        Preview →
                      </a>
                    </div>
                  </div>
                  <div className="ml-4 flex shrink-0 items-center gap-3">
                    <Link href={`?edit=${m.id}`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                      Edit
                    </Link>
                    <form action={deleteModule}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="file_url" value={m.file_url} />
                      <DeleteButton label="Delete" pendingLabel="Deleting…" className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50" />
                    </form>
                  </div>
                </div>

                {/* Send Now — admin sends directly to students + professors */}
                <form action={sendModuleNow} className="mt-3 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-3">
                  <input type="hidden" name="module_id" value={m.id} />
                  <div>
                    <label className="block text-xs font-medium text-slate-500">Send to</label>
                    <select
                      name="send_audience"
                      defaultValue={m.send_audience ?? "all"}
                      className="mt-1 rounded-lg border border-slate-300 px-2 py-1.5 text-xs"
                    >
                      <optgroup label="Students">
                        <option value="all">All students</option>
                        <option value="diploma">Diploma / Certificate students</option>
                        <option value="bachelors">Bachelor&apos;s students</option>
                        <option value="masters">Master&apos;s students</option>
                        <option value="doctorate">Doctorate students</option>
                      </optgroup>
                      {profList.length > 0 && (
                        <optgroup label="Specific Professor">
                          {profList.map((p) => (
                            <option key={p.id} value={`prof:${p.id}`}>{p.full_name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>
                  <DeleteButton
                    label={m.sent_at ? "Resend Now" : "Send Now"}
                    pendingLabel="Sending…"
                    className="rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
                  />
                </form>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
