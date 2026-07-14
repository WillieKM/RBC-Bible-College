import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { submitPaymentProof } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/DeleteButton";
import type { Invoice, Payment } from "@/lib/types";

export default async function StudentInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ proof_sent?: string; proof_error?: string }>;
}) {
  const { proof_sent, proof_error } = await searchParams;
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: invoicesRaw } = await supabase
    .from("invoices")
    .select("*, payments(*)")
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  // Currency symbol based on the student's region
  const currency = profile.region === "usa" ? "$" : "KSh";

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

      {proof_sent && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Payment proof submitted — the admin will verify and update your balance shortly.
        </div>
      )}
      {proof_error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {decodeURIComponent(proof_error)}
        </div>
      )}

      {invoices.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No invoices have been issued yet.</p>
      ) : (
        <>
          {/* Summary */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-medium text-slate-500">Total Fees</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{currency}{totalOwed.toFixed(2)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-xs font-medium text-green-600">Paid</p>
              <p className="mt-1 text-xl font-bold text-green-700">{currency}{totalPaid.toFixed(2)}</p>
            </div>
            <div className={`rounded-xl border p-4 text-center shadow-sm ${totalBalance > 0 ? "border-red-100 bg-red-50" : "border-green-100 bg-green-50"}`}>
              <p className={`text-xs font-medium ${totalBalance > 0 ? "text-red-500" : "text-green-600"}`}>Balance Due</p>
              <p className={`mt-1 text-xl font-bold ${totalBalance > 0 ? "text-red-600" : "text-green-700"}`}>{currency}{totalBalance.toFixed(2)}</p>
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
                      {inv.description && <p className="mt-0.5 text-xs text-slate-500">{inv.description}</p>}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${isPaid ? "bg-green-100 text-green-700" : inv.paid > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                      {isPaid ? "Paid" : inv.paid > 0 ? "Partial" : "Unpaid"}
                    </span>
                  </div>

                  {/* Amounts */}
                  <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
                    <div className="px-4 py-3">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="font-bold text-slate-900">{currency}{inv.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-xs text-green-600">Paid</p>
                      <p className="font-bold text-green-700">{currency}{inv.paid.toFixed(2)}</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className={`text-xs ${isPaid ? "text-green-600" : "text-red-500"}`}>Balance</p>
                      <p className={`font-bold ${isPaid ? "text-green-700" : "text-red-600"}`}>{currency}{Math.max(0, inv.balance).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-5 pb-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-right text-xs text-slate-400">{Math.round(pct)}% paid</p>
                  </div>

                  {inv.notes && (
                    <p className="mx-5 mb-3 rounded bg-amber-50 px-3 py-1.5 text-xs text-amber-700">{inv.notes}</p>
                  )}

                  {/* Submit payment proof */}
                  {!isPaid && (
                    <details className="border-t border-slate-100">
                      <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-gold-dark hover:text-gold list-none flex items-center gap-2">
                        <span>+</span> I&apos;ve paid — submit proof
                      </summary>
                      <form action={submitPaymentProof} encType="multipart/form-data" className="px-5 pb-5 pt-2 space-y-3">
                        <input type="hidden" name="invoice_id" value={inv.id} />
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Amount paid ({currency})</label>
                            <input
                              name="amount"
                              type="number"
                              step="0.01"
                              min="0.01"
                              required
                              defaultValue={Math.max(0, inv.balance).toFixed(2)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Date paid</label>
                            <input
                              name="payment_date"
                              type="date"
                              required
                              defaultValue={new Date().toISOString().slice(0, 10)}
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">M-Pesa transaction code</label>
                          <input
                            name="reference"
                            type="text"
                            required
                            placeholder="e.g. QHX2KXXXXX"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1">Screenshot (optional)</label>
                          <input
                            name="screenshot"
                            type="file"
                            accept="image/*,.pdf"
                            className="w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-gold/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-gold-dark"
                          />
                        </div>
                        <DeleteButton
                          label="Submit Proof"
                          pendingLabel="Submitting…"
                          className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
                        />
                      </form>
                    </details>
                  )}

                  {/* Payment history */}
                  {inv.payments.length > 0 && (
                    <div className="border-t border-slate-100 px-5 py-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Payment History</p>
                      <div className="space-y-1">
                        {inv.payments.map((p) => (
                          <div key={p.id} className="flex justify-between text-sm">
                            <span className="text-slate-600 capitalize">{p.payment_date} · {p.method}{p.reference ? ` — ${p.reference}` : ""}</span>
                            <span className="font-semibold text-green-700">{currency}{p.amount.toFixed(2)}</span>
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
