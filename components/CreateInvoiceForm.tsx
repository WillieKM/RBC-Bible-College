"use client";

import { useState } from "react";
import { createInvoice } from "@/lib/actions/invoices";

export type InvoiceStudentOption = {
  id: string;
  label: string;
  fee: number | null;
  currency: string;
};

export function CreateInvoiceForm({ students }: { students: InvoiceStudentOption[] }) {
  const [studentId, setStudentId] = useState("");
  const [amount, setAmount] = useState("");

  const selected = students.find((s) => s.id === studentId) ?? null;
  const currency = selected?.currency ?? "$";

  function handleStudentChange(id: string) {
    setStudentId(id);
    const student = students.find((s) => s.id === id);
    setAmount(student?.fee != null ? String(student.fee) : "");
  }

  return (
    <form action={createInvoice} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="font-semibold text-slate-800">Create Invoice</h2>
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-48">
          <label className="block text-sm font-medium text-slate-700">Student</label>
          <select
            name="student_id"
            required
            value={studentId}
            onChange={(e) => handleStudentChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>Select student…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
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
      <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
        Create Invoice
      </button>
    </form>
  );
}
