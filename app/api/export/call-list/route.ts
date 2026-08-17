import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

function esc(v: string | number | null | undefined): string {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const [
    { data: students },
    { data: invoices },
    { data: payments },
  ] = await Promise.all([
    admin
      .from("profiles")
      .select("id, full_name, student_number, phone, region, program_id, programs(name)")
      .eq("role", "student")
      .order("full_name", { ascending: true }),
    admin.from("invoices").select("id, student_id, total_amount, currency"),
    admin.from("payments").select("invoice_id, amount"),
  ]);

  // Build payment totals per invoice
  const paidByInvoice = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + (p.amount ?? 0));
  }

  // Build balance per student (split by currency)
  type Balance = { usd: number; ksh: number };
  const balanceByStudent = new Map<string, Balance>();
  for (const inv of invoices ?? []) {
    const paid = paidByInvoice.get(inv.id) ?? 0;
    const outstanding = Math.max(0, (inv.total_amount ?? 0) - paid);
    const cur = balanceByStudent.get(inv.student_id) ?? { usd: 0, ksh: 0 };
    if (inv.currency === "usd" || inv.currency === "USD") cur.usd += outstanding;
    else cur.ksh += outstanding;
    balanceByStudent.set(inv.student_id, cur);
  }

  const headers = [
    "Full Name",
    "Student ID",
    "Phone",
    "Campus",
    "Program",
    "Outstanding (USD)",
    "Outstanding (KSh)",
  ];

  const rows = (students ?? []).map((s) => {
    const program = s.programs as unknown as { name: string } | null;
    const campus = s.region === "usa" ? "USA" : "Kenya / International";
    const bal = balanceByStudent.get(s.id) ?? { usd: 0, ksh: 0 };

    return [
      esc(s.full_name),
      esc(s.student_number),
      esc(s.phone),
      esc(campus),
      esc(program?.name),
      esc(bal.usd > 0 ? bal.usd.toFixed(2) : ""),
      esc(bal.ksh > 0 ? Math.round(bal.ksh) : ""),
    ].join(",");
  });

  const csv =
    // UTF-8 BOM so Excel opens with correct encoding
    "﻿" +
    [headers.map(esc).join(","), ...rows].join("\r\n");

  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="student-call-list-${date}.csv"`,
    },
  });
}
