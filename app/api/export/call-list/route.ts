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

  // Separate queries — no foreign key joins that can silently fail
  const [
    { data: students, error: studentsErr },
    { data: programs, error: programsErr },
    { data: invoices, error: invoicesErr },
    { data: payments, error: paymentsErr },
  ] = await Promise.all([
    admin.from("profiles").select("id, full_name, student_number, phone, region, program_id").eq("role", "student").order("full_name"),
    admin.from("programs").select("id, name"),
    admin.from("invoices").select("id, student_id, total_amount"),
    admin.from("payments").select("invoice_id, amount"),
  ]);

  // Surface any query errors for debugging
  if (studentsErr || programsErr || invoicesErr || paymentsErr) {
    return NextResponse.json({
      studentsErr, programsErr, invoicesErr, paymentsErr,
      studentCount: students?.length ?? 0,
    }, { status: 500 });
  }

  const programById = new Map((programs ?? []).map((p) => [p.id, p.name as string]));

  const paidByInvoice = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + (p.amount ?? 0));
  }

  const balanceByStudent = new Map<string, number>();
  for (const inv of invoices ?? []) {
    const outstanding = Math.max(0, (inv.total_amount ?? 0) - (paidByInvoice.get(inv.id) ?? 0));
    balanceByStudent.set(inv.student_id, (balanceByStudent.get(inv.student_id) ?? 0) + outstanding);
  }

  const headers = ["Full Name", "Student ID", "Phone", "Campus", "Program", "Currency", "Outstanding Balance"];

  const rows = (students ?? []).map((s) => {
    const isUsa    = s.region === "usa";
    const campus   = isUsa ? "USA" : "Kenya / International";
    const currency = isUsa ? "USD" : "KSh";
    const balance  = balanceByStudent.get(s.id) ?? 0;
    return [
      esc(s.full_name),
      esc(s.student_number),
      esc(s.phone),
      esc(campus),
      esc(s.program_id ? programById.get(s.program_id) ?? "" : ""),
      esc(currency),
      esc(balance > 0 ? (isUsa ? balance.toFixed(2) : Math.round(balance)) : 0),
    ].join(",");
  });

  const csv = "﻿" + [headers.map(esc).join(","), ...rows].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="student-call-list-${date}.csv"`,
    },
  });
}
