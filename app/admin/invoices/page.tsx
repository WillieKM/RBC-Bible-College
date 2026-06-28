import { createClient } from "@/lib/supabase/server";
import { CreateInvoiceForm, type InvoiceStudentOption } from "@/components/CreateInvoiceForm";
import { feeForLevel } from "@/lib/fees";
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
    supabase.from("invoices").select("*, profiles(full_name, email, region), payments(amount)").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name, email, program_id, region").eq("role", "student").order("full_name"),
    supabase.from("programs").select("id, name, program_level, fee_international, fee_usa"),
  ]);

  const programMap = new Map(
    (programs ?? []).map((p: Pick<Program, "id" | "name" | "program_level" | "fee_international" | "fee_usa">) => [p.id, p])
  );

  const existingByStudent = new Map<string, { count: number; total: number }>();
  for (const inv of (invoicesRaw ?? []) as { student_id: string; total_amount: number }[]) {
    const entry = existingByStudent.get(inv.student_id) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += inv.total_amount;
    existingByStudent.set(inv.student_id, entry);
  }

  const studentOptions: InvoiceStudentOption[] = (students ?? []).map(
    (s: Pick<Profile, "id" | "full_name" | "email" | "program_id" | "region">) => {
      const program = s.program_id ? programMap.get(s.program_id) : null;
      const region = s.region === "usa" ? "usa" : "international";
      const currency = region === "usa" ? "$" : "KSh";
      const fee = program
        ? (region === "usa" ? program.fee_usa : program.fee_international) ?? feeForLevel(program.program_level, region)
        : null;
      const existing = existingByStudent.get(s.id);
      return {
        id: s.id,
        label: `${s.full_name}${program ? ` — ${program.name}` : ""}`,
        fee,
        currency,
        existingCount: existing?.count ?? 0,
        existingTotal: existing?.total ?? 0,
      };
    }
  );

  const invoices = (invoicesRaw ?? []).map((inv: Invoice & {
    profiles: { full_name: string; email: string; region: string | null } | null;
    payments: { amount: number }[];
  }) => {
    const paid = (inv.payments ?? []).reduce((s, p) => s + p.amount, 0);
    const currency = inv.profiles?.region === "usa" ? "$" : "KSh";
    return { ...inv, paid, balance: inv.total_amount - paid, currency };
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
      <CreateInvoiceForm students={studentOptions} />

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
                <p className="text-sm font-semibold text-slate-800">{inv.currency}{inv.total_amount.toFixed(2)}</p>
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
  );
}
