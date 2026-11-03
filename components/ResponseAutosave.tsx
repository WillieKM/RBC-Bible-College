"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { saveAssignmentDraft } from "@/lib/actions/student";

const IDLE_SAVE_MS = 3_000; // save 3s after typing stops
const MAX_UNSAVED_MS = 15_000; // and at least every 15s during continuous typing

type Status =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string };

function timeOf(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// The assignment "Response" textarea with autosave. Drafts go to Supabase (so
// they follow the scholar across devices) and to localStorage as an instant
// fallback if the connection drops between saves.
export function ResponseAutosave({
  assignmentId,
  initialValue,
  restoredAt,
}: {
  assignmentId: string;
  initialValue: string;
  restoredAt: string | null;
}) {
  const storageKey = `rbc-draft:${assignmentId}`;
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<Status>(restoredAt ? { kind: "saved", at: restoredAt } : { kind: "idle" });
  const lastSaved = useRef(initialValue);
  const latest = useRef(initialValue);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstUnsavedAt = useRef<number | null>(null);

  const save = useCallback(async () => {
    const content = latest.current;
    if (content === lastSaved.current) return;
    setStatus({ kind: "saving" });
    const result = await saveAssignmentDraft({ assignmentId, content }).catch(() => null);
    if (result?.ok) {
      lastSaved.current = content;
      firstUnsavedAt.current = null;
      setStatus({ kind: "saved", at: result.savedAt });
    } else {
      setStatus({ kind: "error", message: result && !result.ok ? result.error : "Not saved — check your connection. Your work is kept on this device." });
    }
  }, [assignmentId]);

  // A local copy newer than the server one wins (e.g. saved offline last time).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const local = JSON.parse(raw) as { content: string; at: string };
      const serverTime = restoredAt ? new Date(restoredAt).getTime() : 0;
      if (local.content !== initialValue && new Date(local.at).getTime() > serverTime) {
        setValue(local.content);
        latest.current = local.content;
        void save(); // push the recovered work to the server
      }
    } catch {
      /* storage unavailable: server draft is still used */
    }
  }, [storageKey, initialValue, restoredAt, save]);

  function handleChange(next: string) {
    setValue(next);
    latest.current = next;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ content: next, at: new Date().toISOString() }));
    } catch {
      /* ignore */
    }
    firstUnsavedAt.current ??= Date.now();
    if (idleTimer.current) clearTimeout(idleTimer.current);
    if (Date.now() - firstUnsavedAt.current >= MAX_UNSAVED_MS) {
      void save();
    } else {
      idleTimer.current = setTimeout(() => void save(), IDLE_SAVE_MS);
    }
  }

  // Save when the tab is hidden or closed (switching apps on a phone, logging out).
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === "hidden") void save();
    };
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [save]);

  // On final Submit the draft is cleared server-side; clear the local copy too.
  useEffect(() => {
    const form = document.getElementById(`submit-form-${assignmentId}`);
    const clear = () => {
      try {
        localStorage.removeItem(storageKey);
      } catch {
        /* ignore */
      }
    };
    form?.addEventListener("submit", clear);
    return () => form?.removeEventListener("submit", clear);
  }, [assignmentId, storageKey]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="response" className="block text-sm font-medium text-slate-700">Response</label>
        <span
          aria-live="polite"
          className={`text-xs ${status.kind === "error" ? "text-amber-700" : "text-slate-400"}`}
        >
          {status.kind === "saving" && "Saving…"}
          {status.kind === "saved" && `✓ Draft saved ${timeOf(status.at)}`}
          {status.kind === "error" && status.message}
          {status.kind === "idle" && "Your work saves automatically as you type"}
        </span>
      </div>
      <textarea
        id="response"
        name="content"
        rows={8}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
