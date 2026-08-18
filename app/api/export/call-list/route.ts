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
    { data: students, error: studentsErr },
    { data: programs, error: programsErr },
    { data: invoices, error: invoicesErr },
    { data: payments, error: paymentsErr },
    { data: applications },
  ] = await Promise.all([
    admin.from("profiles").select("id, full_name, student_number, phone, email, region, program_id").eq("role", "student").order("full_name"),
    admin.from("programs").select("id, name, fee_usa, fee_international"),
    admin.from("invoices").select("id, student_id, total_amount"),
    admin.from("payments").select("invoice_id, amount"),
    admin.from("applications").select("email, phone").eq("status", "approved").not("phone", "is", null),
  ]);

  if (studentsErr || programsErr || invoicesErr || paymentsErr) {
    return NextResponse.json({ studentsErr, programsErr, invoicesErr, paymentsErr }, { status: 500 });
  }

  // Fallback phone from applications table for pre-fix profiles
  const appPhoneByEmail = new Map<string, string>();
  for (const a of applications ?? []) {
    if (a.email && a.phone) appPhoneByEmail.set(a.email.toLowerCase(), a.phone);
  }

  const programById = new Map(
    (programs ?? []).map((p) => [p.id, p as { id: string; name: string; fee_usa: number | null; fee_international: number | null }])
  );

  // Total invoiced per student
  const invoicedByStudent = new Map<string, number>();
  const invoiceIds = new Map<string, string[]>();
  for (const inv of invoices ?? []) {
    invoicedByStudent.set(inv.student_id, (invoicedByStudent.get(inv.student_id) ?? 0) + (inv.total_amount ?? 0));
    const ids = invoiceIds.get(inv.student_id) ?? [];
    ids.push(inv.id);
    invoiceIds.set(inv.student_id, ids);
  }

  // Total paid per invoice → per student
  const paidByInvoice = new Map<string, number>();
  for (const p of payments ?? []) {
    paidByInvoice.set(p.invoice_id, (paidByInvoice.get(p.invoice_id) ?? 0) + (p.amount ?? 0));
  }

  const paidByStudent = new Map<string, number>();
  for (const [studentId, ids] of invoiceIds) {
    const total = ids.reduce((sum, id) => sum + (paidByInvoice.get(id) ?? 0), 0);
    paidByStudent.set(studentId, total);
  }

  const headers = [
    "Full Name",
    "Student ID",
    "Phone",
    "Campus",
    "Program",
    "Currency",
    "Program Fee",
    "Total Billed",
    "Total Paid",
    "Outstanding Balance",
  ];

  const rows = (students ?? []).map((s) => {
    const isUsa      = s.region === "usa";
    const campus     = isUsa ? "USA" : "Kenya / International";
    const currency   = isUsa ? "USD" : "KSh";
    const phone      = s.phone || appPhoneByEmail.get(s.email?.toLowerCase() ?? "") || "";
    const program    = s.program_id ? programById.get(s.program_id) : null;
    const programFee = program ? (isUsa ? program.fee_usa : program.fee_international) ?? 0 : 0;
    const billed     = invoicedByStudent.get(s.id) ?? 0;
    const paid       = paidByStudent.get(s.id) ?? 0;
    const outstanding = Math.max(0, billed - paid);

    const fmt = (n: number) => isUsa ? n.toFixed(2) : Math.round(n);

    return [
      esc(s.full_name),
      esc(s.student_number),
      esc(phone),
      esc(campus),
      esc(program?.name ?? ""),
      esc(currency),
      esc(programFee > 0 ? fmt(programFee) : ""),
      esc(billed > 0 ? fmt(billed) : 0),
      esc(paid > 0 ? fmt(paid) : 0),
      esc(outstanding > 0 ? fmt(outstanding) : 0),
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
