"use client";

import { useState } from "react";
import { unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createStaffPost, createStaffUpload, replyStaffPost } from "@/lib/actions/staff-room";
import {
  STAFF_FILES_BUCKET,
  STAFF_FILE_ACCEPT,
  STAFF_FILE_MAX_BYTES,
  STAFF_MAX_FILES,
  staffFileType,
} from "@/lib/staff-room";

const inputClass =
  "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold";

// New-topic or reply form for the Staff Room. Files upload straight to Storage
// first, then the post is saved with references to them.
export function StaffPostForm({ mode, parentId }: { mode: "topic" | "reply"; parentId?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    formData.delete("files");

    if (files.length > STAFF_MAX_FILES) return setError(`You can attach up to ${STAFF_MAX_FILES} files.`);
    for (const f of files) {
      if (!staffFileType(f.name)) return setError(`"${f.name}" isn't a supported file type.`);
      if (f.size > STAFF_FILE_MAX_BYTES) return setError(`"${f.name}" is larger than 50MB.`);
    }

    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      for (const file of files) {
        const start = await createStaffUpload({ fileName: file.name, size: file.size });
        if (!start.ok) throw new Error(start.error);
        const { error: uploadError } = await supabase.storage
          .from(STAFF_FILES_BUCKET)
          .uploadToSignedUrl(start.path, start.token, file, { contentType: start.contentType });
        if (uploadError) throw new Error(`"${file.name}" failed to upload. Please try again.`);
        formData.append("attachment_path", start.path);
        formData.append("attachment_name", file.name);
      }
      // These actions redirect back to the Staff Room on success.
      await (mode === "topic" ? createStaffPost(formData) : replyStaffPost(formData));
    } catch (err) {
      // The actions redirect() on success; let Next's navigation signal through.
      unstable_rethrow(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  const fileInput = (
    <label className="block text-xs text-slate-500">
      <span className="font-medium">📎 Attach files</span> (optional — up to {STAFF_MAX_FILES}, 50MB each; PDF, Word, Excel, PowerPoint, images)
      <input name="files" type="file" multiple accept={STAFF_FILE_ACCEPT} className="mt-1 block text-sm text-slate-600" />
    </label>
  );

  if (mode === "reply") {
    return (
      <form onSubmit={handleSubmit} className="mt-4 space-y-2">
        <input type="hidden" name="parent_id" value={parentId} />
        <div className="flex gap-2">
          <input name="body" required placeholder="Write a reply…" className={inputClass} />
          <button
            disabled={busy}
            className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Reply"}
          </button>
        </div>
        {fileInput}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-slate-800">Start a topic</h2>
      <input name="title" required placeholder="Topic, e.g. Exam timetable for next term" className={inputClass} />
      <textarea name="body" rows={3} required placeholder="Write your message…" className={inputClass} />
      {fileInput}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end">
        <button
          disabled={busy}
          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
