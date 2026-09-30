"use client";

import { useState, useRef, useEffect } from "react";
import { createInvoice } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/DeleteButton";
import Link from "next/link";

export type InvoiceStudentOption = {
  id: string;
  label: string;
  fee: number | null;
  currency: string;
  existingCount: number;
  existingTotal: number;
  existingInvoices: { id: string; title: string; total_amount: number; paid: number }[];
};

export function CreateInvoiceForm({ students }: { students: InvoiceStudentOption[] }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [confirmedAdditional, setConfirmedAdditional] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = students.find((s) => s.id === studentId) ?? null;
  const currency = selected?.currency ?? "$";
  const hasExisting = (selected?.existingCount ?? 0) > 0;
  const alreadyFullyInvoiced =
    selected != null && selected.fee != null && selected.existingTotal >= selected.fee;

  // Reset confirmation whenever the selected student changes
  useEffect(() => { setConfirmedAdditional(false); }, [studentId]);

  const filtered = search.trim()
    ? students.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : students;

  function pick(s: InvoiceStudentOption) {
    setStudentId(s.id);
    setSearch(s.label);
    setAmount(s.fee != null ? String(s.fee) : "");
    setOpen(false);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Create button is disabled when student has existing invoices and hasn't confirmed
  const createBlocked = hasExisting && !confirmedAdditional;

  return (
    <form action={createInvoice} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-800">Create Invoice</h2>

      <div className="flex flex-wrap gap-3">
        {/* Searchable student picker */}
        <div className="flex-1 min-w-48" ref={containerRef}>
          <label className="block text-sm font-medium text-slate-700">Student</label>
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
            <p className="mt-1 text-xs text-slate-400">Standard fee — edit if billing differently.</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Notes (optional)</label>
        <textarea name="notes" rows={2} placeholder="Payment instructions, due date, etc." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
      </div>

      {/* Existing invoice guard — shown when student already has invoices */}
      {selected && hasExisting && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${alreadyFullyInvoiced ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
          <p className={`font-semibold ${alreadyFullyInvoiced ? "text-red-800" : "text-amber-800"}`}>
            {alreadyFullyInvoiced ? "⚠ Already fully invoiced" : "⚠ Existing invoices found"}
          </p>
          <p className={`mt-1 text-xs ${alreadyFullyInvoiced ? "text-red-700" : "text-amber-700"}`}>
            {selected.label.split(" — ")[0]} already has {selected.existingCount} invoice{selected.existingCount !== 1 ? "s" : ""}:
          </p>
          <ul className="mt-2 space-y-1">
            {selected.existingInvoices.map((inv) => {
              const balance = inv.total_amount - inv.paid;
              const isPaid = balance <= 0;
              return (
                <li key={inv.id} className="flex items-center justify-between rounded-md bg-white px-3 py-1.5 text-xs border border-slate-100">
                  <span className="font-medium text-slate-700">{inv.title}</span>
                  <span className="flex items-center gap-2 text-slate-500">
                    {currency}{inv.total_amount.toLocaleString()}
                    <span className={`rounded-full px-1.5 py-0.5 font-semibold ${isPaid ? "bg-green-100 text-green-700" : inv.paid > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {isPaid ? "Paid" : inv.paid > 0 ? "Partial" : "Unpaid"}
                    </span>
                    <Link href={`/admin/invoices/${inv.id}`} target="_blank" className="text-gold-dark underline hover:no-underline">
                      Open →
                    </Link>
                  </span>
                </li>
              );
            })}
          </ul>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={confirmedAdditional}
              onChange={(e) => setConfirmedAdditional(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-gold"
            />
            <span className={`text-xs font-medium ${alreadyFullyInvoiced ? "text-red-800" : "text-amber-800"}`}>
              Yes, this is an <strong>additional</strong> charge — not a duplicate of the above.
            </span>
          </label>
        </div>
      )}

      <DeleteButton
        label="Create Invoice"
        pendingLabel="Creating…"
        disabled={createBlocked}
        className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-40 disabled:cursor-not-allowed"
      />
      {createBlocked && (
        <p className="text-xs text-slate-400">Tick the confirmation box above to enable.</p>
      )}
    </form>
  );
}
