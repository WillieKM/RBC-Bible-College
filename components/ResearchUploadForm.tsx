"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createResearchUpload, recordResearchSubmission } from "@/lib/actions/research";
import { RESEARCH_BUCKET, RESEARCH_KINDS, RESEARCH_MAX_BYTES, RESEARCH_MIME_TYPES } from "@/lib/research";

// Some browsers (notably on Windows) report an empty type for Word files.
const TYPE_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

const inputClass =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40";

export function ResearchUploadForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMessage({ kind: "error", text: "Please choose a file to upload." });
      return;
    }
    const contentType = file.type || TYPE_BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] || "";
    if (!RESEARCH_MIME_TYPES.includes(contentType)) {
      setMessage({ kind: "error", text: "Please upload a PDF or Word document." });
      return;
    }
    if (file.size > RESEARCH_MAX_BYTES) {
      setMessage({ kind: "error", text: "File is too large. The limit is 50MB." });
      return;
    }

    setBusy(true);
    setMessage(null);
    try {
      const start = await createResearchUpload({ fileName: file.name, contentType, size: file.size });
      if (!start.ok) throw new Error(start.error);

      const { error: uploadError } = await createClient()
        .storage.from(RESEARCH_BUCKET)
        .uploadToSignedUrl(start.path, start.token, file, { contentType });
      if (uploadError) throw new Error("Upload failed. Please check your connection and try again.");

      const saved = await recordResearchSubmission({
        path: start.path,
        fileName: file.name,
        title: String(data.get("title") || ""),
        kind: String(data.get("kind") || "draft"),
        note: String(data.get("note") || ""),
      });
      if (!saved.ok) throw new Error(saved.error);

      formRef.current?.reset();
      setMessage({ kind: "ok", text: "Submitted. Your professor has been notified." });
      router.refresh();
    } catch (err) {
      setMessage({ kind: "error", text: err instanceof Error ? err.message : "Upload failed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
    >
      <h2 className="font-semibold text-slate-800">Submit your thesis or research</h2>

      {message && (
        <div
          className={`rounded-lg border px-3 py-2 text-sm ${
            message.kind === "ok" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
          <input id="title" name="title" type="text" required placeholder="e.g. Chapter 2 — Literature Review" className={inputClass} />
        </div>
        <div>
          <label htmlFor="kind" className="block text-sm font-medium text-slate-700">Type</label>
          <select id="kind" name="kind" defaultValue="draft" className={inputClass}>
            {Object.entries(RESEARCH_KINDS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700">Note for your professor (optional)</label>
        <textarea id="note" name="note" rows={2} className={inputClass} />
      </div>

      <div>
        <label htmlFor="file" className="block text-sm font-medium text-slate-700">File</label>
        <input
          id="file"
          name="file"
          type="file"
          required
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="mt-1 block text-sm text-slate-600"
        />
        <p className="mt-0.5 text-xs text-slate-400">PDF or Word, up to 50MB.</p>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-60"
      >
        {busy ? "Submitting…" : "Submit"}
      </button>
    </form>
  );
}
