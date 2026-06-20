import { createClient } from "@/lib/supabase/server";
import { addPayment, deletePayment, deleteInvoice, sendInvoice } from "@/lib/actions/invoices";
import { DeleteButton } from "@/components/DeleteButton";
import type { Payment } from "@/lib/types";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function AdminInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*, profiles(full_name, email, student_number, program_id, programs(name)), payments(*)")
    .eq("id", id)
    .single();

  if (!invoice) notFound();

  const payments = ((invoice.payments ?? []) as Payment[]).sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );
  const amountPaid = payments.reduce((s, p) => s + p.amount, 0);
  const balance = invoice.total_amount - amountPaid;
  const pct = Math.min(100, (amountPaid / invoice.total_amount) * 100);
  const isPaid = balance <= 0;
  const today = new Date().toISOString().slice(0, 10);

  const student = invoice.profiles as {
    full_name: string; email: string; student_number: string | null;
    programs?: { name: string } | null;
  } | null;

  return (
    <div className="max-w-2xl">
      <Link href="/admin/invoices" className="text-sm text-gold-dark hover:underline">← All Invoices</Link>

      {/* Invoice header */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{invoice.title}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {student?.full_name ?? "—"} · {student?.email ?? ""}
            </p>
            {student?.student_number && <p className="text-xs text-slate-400">ID: {student.student_number}</p>}
            {student?.programs?.name && <p className="text-xs text-slate-400">{student.programs.name}</p>}
            <p className="mt-1 text-xs text-slate-400">Created {new Date(invoice.created_at).toLocaleDateString()}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isPaid ? "bg-green-100 text-green-700" : amountPaid > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
            {isPaid ? "Paid" : amountPaid > 0 ? "Partial" : "Unpaid"}
          </span>
        </div>

        {/* Amount summary */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-slate-50 p-3 text-center">
            <p className="text-xs font-medium text-slate-500">Total</p>
            <p className="mt-1 text-lg font-bold text-slate-900">${invoice.total_amount.toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-xs font-medium text-green-600">Paid</p>
            <p className="mt-1 text-lg font-bold text-green-700">${amountPaid.toFixed(2)}</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${isPaid ? "bg-green-50" : "bg-red-50"}`}>
            <p className={`text-xs font-medium ${isPaid ? "text-green-600" : "text-red-500"}`}>Balance</p>
            <p className={`mt-1 text-lg font-bold ${isPaid ? "text-green-700" : "text-red-600"}`}>
              ${Math.max(0, balance).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-right text-xs text-slate-400">{Math.round(pct)}% paid</p>

        {invoice.notes && (
          <p className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-sm text-amber-800">
            {invoice.notes}
          </p>
        )}

        {/* Actions */}
        <div className="mt-5 flex gap-2">
          <form action={sendInvoice}>
            <input type="hidden" name="invoice_id" value={invoice.id} />
            <DeleteButton
              label="📧 Email Invoice to Student"
              pendingLabel="Sending…"
              className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark disabled:opacity-50"
            />
          </form>
          <form action={deleteInvoice}>
            <input type="hidden" name="id" value={invoice.id} />
            <DeleteButton
              label="Delete Invoice"
              pendingLabel="Deleting…"
              className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            />
          </form>
        </div>
      </div>

      {/* Payment history */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3">
          <h2 className="font-semibold text-slate-800">Payment History</h2>
        </div>
        {payments.length === 0 ? (
          <p className="px-5 py-4 text-sm text-slate-400">No payments recorded yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">${p.amount.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 capitalize">
                    {p.payment_date} · {p.method}{p.reference ? ` — ${p.reference}` : ""}
                  </p>
                  {p.notes && <p className="text-xs text-slate-400">{p.notes}</p>}
                </div>
                <form action={deletePayment}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="invoice_id" value={invoice.id} />
                  <DeleteButton label="Remove" pendingLabel="…" className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50" />
                </form>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record payment */}
      {!isPaid && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800">Record Payment</h2>
          <form action={addPayment} className="mt-3 flex flex-wrap gap-3">
            <input type="hidden" name="invoice_id" value={invoice.id} />
            <div>
              <label className="block text-sm font-medium text-slate-700">Amount ($)</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0.01"
                defaultValue={Math.max(0, balance).toFixed(2)}
                required
                className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Date</label>
              <input name="payment_date" type="date" defaultValue={today} required className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Method</label>
              <select name="method" defaultValue="cash" className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-sm">
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank">Bank transfer</option>
                <option value="card">Card</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-36">
              <label className="block text-sm font-medium text-slate-700">Reference / receipt #</label>
              <input name="reference" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Optional" />
            </div>
            <div className="flex items-end">
              <button className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
                Save Payment
              </button>
            </div>
          </form>
        </div>
      )}
      {isPaid && (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          ✓ This invoice is fully paid.
        </div>
      )}
    </div>
  );
}
