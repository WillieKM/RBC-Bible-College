"use client";

import { useState, useRef, useEffect } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/DeleteButton";

export type InvoiceStudentOption = {
  id: string;
  label: string;
  fee: number | null;
  currency: string;
  existingCount: number;
  existingTotal: number;
};

export function CreateInvoiceForm({ students }: { students: InvoiceStudentOption[] }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = students.find((s) => s.id === studentId) ?? null;
  const currency = selected?.currency ?? "$";

  const alreadyFullyInvoiced =
    selected != null &&
    selected.fee != null &&
    selected.existingTotal >= selected.fee;

  const filtered = search.trim()
    ? students.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : students;

  function pick(s: InvoiceStudentOption) {
    setStudentId(s.id);
    setSearch(s.label);
    setAmount(s.fee != null ? String(s.fee) : "");
    setOpen(false);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <form action={createInvoice} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-800">Create Invoice</h2>

      {selected && alreadyFullyInvoiced && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-3 py-2.5 text-sm text-red-800">
          <p className="font-semibold">⚠ Already fully invoiced</p>
          <p className="mt-0.5">
            {selected.label.split(" — ")[0]} has {selected.existingCount} invoice{selected.existingCount !== 1 ? "s" : ""} totaling{" "}
            <strong>{selected.currency}{selected.existingTotal.toFixed(2)}</strong>, which already covers the full tuition of{" "}
            <strong>{selected.currency}{selected.fee!.toFixed(2)}</strong>.
            Creating another invoice will over-bill this student.
          </p>
        </div>
      )}

      {selected && !alreadyFullyInvoiced && selected.existingCount > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {selected.label.split(" — ")[0]} already has {selected.existingCount} invoice{selected.existingCount !== 1 ? "s" : ""} totaling {selected.currency}{selected.existingTotal.toFixed(2)}. Double-check before adding another.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Searchable student picker */}
        <div className="flex-1 min-w-48" ref={containerRef}>
          <label className="block text-sm font-medium text-slate-700">Student</label>
          {/* Hidden real value sent with the form */}
          <input type="hidden" name="student_id" value={studentId} required />
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Search student…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setStudentId(""); setOpen(true); }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setStudentId(""); setOpen(false); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
            {open && (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
                {filtered.length === 0 && (
                  <li className="px-3 py-2 text-sm text-slate-400">No students found</li>
                )}
                {filtered.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => pick(s)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                    >
                      <span className="text-slate-800">{s.label}</span>
                      {s.existingCount > 0 && (
                        <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {s.existingCount} inv
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-slate-700">Invoice title</label>
          <input name="title" required placeholder="e.g. Term 1 Tuition 2026" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Total amount ({currency})</label>
          <input
            name="total_amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          {selected?.fee != null && (
            <p className="mt-1 text-xs text-slate-400">Standard program fee — edit if billing a different amount.</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea name="notes" rows={2} placeholder="Payment instructions, due date, etc." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>
      <DeleteButton
        label="Create Invoice"
        pendingLabel="Creating…"
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
      />
    </form>
  );
}
