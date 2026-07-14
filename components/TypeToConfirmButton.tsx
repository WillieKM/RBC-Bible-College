"use client";

import { useRef, useState, useTransition } from "react";

export function TypeToConfirmButton({
  formAction,
  hiddenFields,
  userName,
}: {
  formAction: (formData: FormData) => Promise<void>;
  hiddenFields: Record<string, string>;
  userName: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleOpen() {
    setOpen(true);
    setTyped("");
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function handleCancel() {
    setOpen(false);
    setTyped("");
  }

  function handleConfirm() {
    if (typed !== "DELETE") return;
    const fd = new FormData();
    for (const [k, v] of Object.entries(hiddenFields)) fd.set(k, v);
    startTransition(() => formAction(fd));
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2">
      <span className="text-xs font-medium text-red-700 whitespace-nowrap">Type DELETE:</span>
      <input
        ref={inputRef}
        type="text"
        value={typed}
        onChange={(e) => setTyped(e.target.value.toUpperCase())}
        placeholder="DELETE"
        className="w-24 rounded border border-red-300 bg-white px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:ring-1 focus:ring-red-400"
      />
      <button
        type="button"
        onClick={handleConfirm}
        disabled={typed !== "DELETE" || pending}
        className="rounded bg-red-600 px-2 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40"
      >
        {pending ? "Deleting…" : "Confirm"}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
      >
        Cancel
      </button>
    </div>
  );
}
