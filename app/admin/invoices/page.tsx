import { createClient } from "@/lib/supabase/server";
import { createInvoice } from "@/lib/actions/invoices";
import type { Invoice, Profile, Program } from "@/lib/types";
import Link from "next/link";

function statusBadge(total: number, paid: number) {
  const balance = total - paid;
  if (balance <= 0) return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Paid</span>;
  if (paid > 0) return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Partial</span>;
  return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">Unpaid</span>;
}

export default async function AdminInvoicesPage() {
  const supabase = await createClient();

  const [{ data: invoicesRaw }, { data: students }, { data: programs }] = await Promise.all([
    supabase.from("invoices").select("*, profiles(full_name, email), payments(amount)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, program_id").eq("role", "student").order("full_name"),
    supabase.from("programs").select("id, name"),
  ]);

  const programMap = new Map((programs ?? []).map((p: Pick<Program, "id" | "name">) => [p.id, p.name]));

  const invoices = (invoicesRaw ?? []).map((inv: Invoice & {
    profiles: { full_name: string; email: string } | null;
    payments: { amount: number }[];
  }) => {
    const paid = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
    return { ...inv, paid, balance: inv.total_amount - paid };
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Invoices</h1>
        <a href="/api/export/invoices" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
          Export CSV
        </a>
      </div>

      {/* Create invoice */}
      <form action={createInvoice} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-800">Create Invoice</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Student</label>
            <select name="student_id" required defaultValue="" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
              <option value="" disabled>Select student…</option>
              {(students ?? []).map((s: Pick<Profile, "id" | "full_name" | "email" | "program_id">) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.program_id ? ` — ${programMap.get(s.program_id) ?? ""}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-48">
            <label className="block text-sm font-medium text-slate-700">Invoice title</label>
            <input name="title" required placeholder="e.g. Term 1 Tuition 2026" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Total amount ($)</label>
            <input name="total_amount" type="number" step="0.01" min="0.01" required className="mt-1 w-32 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
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

      {/* Invoices list */}
      <h2 className="mt-8 text-lg font-semibold text-slate-800">All Invoices ({invoices.length})</h2>
      <div className="mt-3 space-y-2">
        {invoices.length === 0 && <p className="text-sm text-slate-500">No invoices yet.</p>}
        {invoices.map((inv) => (
          <Link
            key={inv.id}
            href={`/admin/invoices/${inv.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm hover:border-gold"
          >
            <div>
              <p className="font-semibold text-slate-900">{inv.title}</p>
              <p className="text-sm text-slate-500">
                {(inv as { profiles?: { full_name: string } | null }).profiles?.full_name ?? "—"}
              </p>
            </div>
            <div className="flex items-center gap-4 text-right">
              <div>
                <p className="text-sm font-semibold text-slate-800">K{inv.total_amount.toFixed(2)}</p>
                <p className="text-xs text-slate-500">
                  Paid K{inv.paid.toFixed(2)} · Bal K{Math.max(0, inv.balance).toFixed(2)}
                </p>
              </div>
              {statusBadge(inv.total_amount, inv.paid)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
