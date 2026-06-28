import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireFinanceAccess } from "@/lib/auth";

export async function GET() {
  try {
    await requireFinanceAccess();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: invoices }, { data: payments }] = await Promise.all([
    admin
      .from("invoices")
      .select("id, invoice_number, description, total_amount, due_date, status, created_at, profiles(full_name, email, student_number, region)")
      .order("created_at", { ascending: false }),
    admin.from("payments").select("invoice_id, amount"),
  ]);

  const paymentTotals = new Map<string, number>();
  for (const p of payments ?? []) {
    paymentTotals.set(p.invoice_id, (paymentTotals.get(p.invoice_id) ?? 0) + (p.amount ?? 0));
  }

  const rows = (invoices ?? []).map((inv) => {
    const student = inv.profiles as unknown as { full_name: string; email: string; student_number: string; region: string | null } | null;
    const paid = paymentTotals.get(inv.id) ?? 0;
    const outstanding = Math.max(0, (inv.total_amount ?? 0) - paid);
    const currency = student?.region === "usa" ? "USD" : "KES";
    return [
      inv.invoice_number ?? "",
      student?.student_number ?? "",
      student?.full_name ?? "",
      student?.email ?? "",
      inv.description ?? "",
      currency,
      inv.total_amount ?? 0,
      paid,
      outstanding,
      inv.status ?? "",
      inv.due_date ?? "",
      inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "",
    ];
  });

  const headers = ["Invoice #", "Student #", "Student Name", "Email", "Description", "Currency", "Total", "Paid", "Outstanding", "Status", "Due Date", "Created"];
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="invoices-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
