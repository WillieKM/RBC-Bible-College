import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Invoice, Payment } from "@/lib/types";

export default async function StudentInvoicesPage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: invoicesRaw } = await supabase
    .from("invoices")
    .select("*, payments(*)")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  const invoices = (invoicesRaw ?? []).map((inv: Invoice & { payments: Payment[] }) => {
    const paid = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
    const balance = inv.total_amount - paid;
    const payments = [...(inv.payments ?? [])].sort(
      (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
    );
    return { ...inv, paid, balance, payments };
  });

  const totalOwed = invoices.reduce((s, inv) => s + inv.total_amount, 0);
  const totalPaid = invoices.reduce((s, inv) => s + inv.paid, 0);
  const totalBalance = invoices.reduce((s, inv) => s + Math.max(0, inv.balance), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Invoices</h1>

      {invoices.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No invoices have been issued yet.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Fees</p>
              <p className="mt-1 text-xl font-bold text-slate-900">${totalOwed.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-medium text-green-600">Paid</p>
              <p className="mt-1 text-xl font-bold text-green-700">${totalPaid.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl border p-4 text-center shadow-sm ${totalBalance > 0 ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50"}`}>
              <p className={`text-xs font-medium ${totalBalance > 0 ? "text-red-500" : "text-green-600"}`}>Balance Due</p>
              <p className={`mt-1 text-xl font-bold ${totalBalance > 0 ? "text-red-600" : "text-green-700"}`}>${totalBalance.toFixed(2)}</p>
            </div>
          </div>

          {/* Invoice list */}
          <div className="mt-6 space-y-6">
            {invoices.map((inv) => {
              const pct = Math.min(100, (inv.paid / inv.total_amount) * 100);
              const isPaid = inv.balance <= 0;
              return (
                <div key={inv.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
                  {/* Header */}
                  <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <p className="font-semibold text-slate-900">{inv.title}</p>
                      <p className="text-xs text-slate-400">Issued {new Date(inv.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isPaid ? "bg-green-100 text-green-700" : inv.paid > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {isPaid ? "Paid" : inv.paid > 0 ? "Partial" : "Unpaid"}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                    <div className="px-4 py-3">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-bold text-slate-900">${inv.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-green-600">Paid</p>
                      <p className="font-bold text-green-700">${inv.paid.toFixed(2)}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className={`text-xs ${isPaid ? "text-green-600" : "text-red-500"}`}>Balance</p>
                      <p className={`font-bold ${isPaid ? "text-green-700" : "text-red-600"}`}>${Math.max(0, inv.balance).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-5 pb-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {inv.notes && (
                    <p className="mx-5 mb-3 rounded bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{inv.notes}</p>
                  )}

                  {/* Payment history */}
                  {inv.payments.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment History</p>
                      <div className="space-y-1">
                        {inv.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-sm">
                            <span className="text-slate-600 capitalize">{p.payment_date} · {p.method}{p.reference ? ` — ${p.reference}` : ""}</span>
                            <span className="font-semibold text-green-700">${p.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
