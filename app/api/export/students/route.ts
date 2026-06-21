import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";

export async function GET() {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: students } = await admin
    .from("profiles")
    .select("full_name, email, student_number, role, payment_status, completed_at, created_at, programs(name)")
    .eq("role", "student")
    .order("created_at", { ascending: false });

  const rows = (students ?? []).map((s) => {
    const program = s.programs as unknown as { name: string } | null;
    return [
      s.student_number ?? "",
      s.full_name ?? "",
      s.email ?? "",
      program?.name ?? "",
      s.payment_status ?? "unpaid",
      s.completed_at ? "Yes" : "No",
      s.created_at ? new Date(s.created_at).toLocaleDateString() : "",
    ];
  });

  const headers = ["Student Number", "Full Name", "Email", "Program", "Payment Status", "Completed", "Enrolled Date"];
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
