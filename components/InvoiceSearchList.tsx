"use client";

import { useState } from "react";
import Link from "next/link";

function statusBadge(total: number, paid: number) {
  const balance = total - paid;
  if (balance <= 0) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Paid</span>;
  if (paid > 0) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Partial</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Unpaid</span>;
}

export type InvoiceListItem = {
  id: string;
  title: string;
  invoice_number: string | null;
  total_amount: number;
  paid: number;
  balance: number;
  currency: string;
  profileName: string | null;
  programName: string | null;
};

export function InvoiceSearchList({ invoices }: { invoices: InvoiceListItem[] }) {
  const [query, setQuery] = useState("");
  const [programFilter, setProgramFilter] = useState("all");

  // Unique program names for the filter dropdown
  const programs = Array.from(
    new Set(invoices.map((inv) => inv.programName ?? "No Program"))
  ).sort();

  const filtered = invoices.filter((inv) => {
    const matchesProgram =
      programFilter === "all" || (inv.programName ?? "No Program") === programFilter;

    if (!matchesProgram) return false;
    if (!query.trim()) return true;

    const q = query.toLowerCase();
    const statusStr = inv.balance <= 0 ? "paid" : inv.paid > 0 ? "partial" : "unpaid";
    return (
      inv.title.toLowerCase().includes(q) ||
      (inv.profileName?.toLowerCase().includes(q) ?? false) ||
      (inv.invoice_number?.toLowerCase().includes(q) ?? false) ||
      statusStr.includes(q)
    );
  });

  // Group filtered invoices by program
  const grouped = new Map<string, InvoiceListItem[]>();
  for (const inv of filtered) {
    const key = inv.programName ?? "No Program";
    const list = grouped.get(key) ?? [];
    list.push(inv);
    grouped.set(key, list);
  }
  const groupEntries = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Search by name, title, invoice #, or status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        <select
          value={programFilter}
          onChange={(e) => setProgramFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold"
        >
          <option value="all">All Programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        {(query || programFilter !== "all") && (
          <button
            onClick={() => { setQuery(""); setProgramFilter("all"); }}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      <p className="mt-2 text-sm text-slate-500">
        {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
        {(query || programFilter !== "all") ? ` of ${invoices.length}` : ""}
      </p>

      {filtered.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">{query || programFilter !== "all" ? "No matching invoices." : "No invoices yet."}</p>
      )}

      {groupEntries.map(([programName, items]) => (
        <div key={programName} className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {programName} <span className="ml-1 font-normal normal-case text-slate-400">({items.length})</span>
          </h2>
          <div className="space-y-2">
            {items.map((inv) => (
              <Link
                key={inv.id}
                href={`/admin/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm hover:border-gold"
              >
                <div>
                  <p className="font-semibold text-slate-900">{inv.title}</p>
                  <p className="text-sm text-slate-500">
                    {inv.profileName ?? "—"}
                    {inv.invoice_number && (
                      <span className="ml-2 text-xs text-slate-400">{inv.invoice_number}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {inv.currency}{inv.total_amount.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Paid {inv.currency}{inv.paid.toFixed(2)} · Bal {inv.currency}{Math.max(0, inv.balance).toFixed(2)}
                    </p>
                  </div>
                  {statusBadge(inv.total_amount, inv.paid)}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
