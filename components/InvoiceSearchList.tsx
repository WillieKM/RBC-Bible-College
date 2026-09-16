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
};

export function InvoiceSearchList({ invoices }: { invoices: InvoiceListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? invoices.filter((inv) => {
        const q = query.toLowerCase();
        const statusStr = inv.balance <= 0 ? "paid" : inv.paid > 0 ? "partial" : "unpaid";
        return (
          inv.title.toLowerCase().includes(q) ||
          (inv.profileName?.toLowerCase().includes(q) ?? false) ||
          (inv.invoice_number?.toLowerCase().includes(q) ?? false) ||
          statusStr.includes(q)
        );
      })
    : invoices;

  return (
    <>
      <div className="mt-6 flex items-center gap-2">
        <input
          type="search"
          placeholder="Search by name, title, invoice #, or status…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-gold"
        />
        {query && (
          <button onClick={() => setQuery("")} className="text-xs text-slate-400 hover:text-slate-600">
            Clear
          </button>
        )}
      </div>

      <h2 className="mt-4 text-lg font-semibold text-slate-800">
        All Invoices ({filtered.length}{query ? ` of ${invoices.length}` : ""})
      </h2>
      <div className="mt-3 space-y-2">
        {filtered.length === 0 && (
          <p className="text-sm text-slate-500">{query ? "No matching invoices." : "No invoices yet."}</p>
        )}
        {filtered.map((inv) => (
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
    </>
  );
}
