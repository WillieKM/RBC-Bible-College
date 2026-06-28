"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { enrollStudentInProgramModules } from "@/lib/actions/admin";
import { sendAccountInviteEmail } from "@/lib/email";
import { feeForLevel } from "@/lib/fees";
import { nextSequenceNumber } from "@/lib/sequences";
import { redirect } from "next/navigation";

type ImportRow = {
  full_name: string;
  email: string;
  program: string;
  region: string;
  student_number: string;
};

type RowResult = { email: string; status: "added" | "skipped" | "failed"; reason?: string };

function parseCsv(text: string): ImportRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const rows: ImportRow[] = [];

  for (const line of lines) {
    // Skip header rows
    if (/^(full.?name|name)/i.test(line)) continue;

    // Simple CSV split — handles quoted fields with commas inside
    const cols: string[] = [];
    let cur = "";
    let inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { cols.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    cols.push(cur.trim());

    const [full_name = "", email = "", program = "", region = "", student_number = ""] = cols;
    if (!full_name || !email || !program) continue;

    rows.push({
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      program: program.trim(),
      region: region.trim().toLowerCase() === "usa" ? "usa" : "international",
      student_number: student_number.trim(),
    });
  }

  return rows;
}

export async function bulkImportStudents(formData: FormData) {
  await requireRole(["admin"]);
  const admin = createAdminClient();

  // Accept CSV text from textarea or file upload
  let csvText = String(formData.get("csv_text") || "").trim();
  const file = formData.get("csv_file");
  if (!csvText && file instanceof File && file.size > 0) {
    csvText = await file.text();
  }
  if (!csvText) {
    redirect("/admin/students/import?error=No+data+provided");
  }

  const rows = parseCsv(csvText);
  if (rows.length === 0) {
    redirect("/admin/students/import?error=No+valid+rows+found.+Check+the+format.");
  }

  const results: RowResult[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const year = new Date().getFullYear();

  // Pre-fetch all programs once
  const { data: allPrograms } = await admin.from("programs").select("id, name, program_level, fee_international, fee_usa");
  const programMap = new Map((allPrograms ?? []).map((p) => [p.name.toLowerCase(), p]));

  for (const row of rows) {
    try {
      // Skip if user already exists in auth
      const { data: existing } = await admin.auth.admin.listUsers();
      const alreadyExists = (existing?.users ?? []).some(
        (u) => u.email?.toLowerCase() === row.email
      );
      if (alreadyExists) {
        results.push({ email: row.email, status: "skipped", reason: "already has an account" });
        continue;
      }

      // generateLink creates the user and returns the link without sending Supabase's
      // own (heavily rate-limited) invite email — we deliver the link ourselves below,
      // which matters here since this loop can invite many students at once.
      const { data: invited, error: inviteError } = await admin.auth.admin.generateLink({
        type: "invite",
        email: row.email,
        options: { redirectTo: `${baseUrl}/login` },
      });
      if (inviteError || !invited?.user) {
        results.push({ email: row.email, status: "failed", reason: inviteError?.message ?? "invite failed" });
        continue;
      }

      // Resolve program
      const prog = programMap.get(row.program.toLowerCase());
      const programId = prog?.id ?? null;

      // Generate student number if not provided
      let studentNumber = row.student_number;
      if (!studentNumber) {
        const seq = await nextSequenceNumber(admin, `student_number_${year}`);
        studentNumber = `RBC-${year}-${String(seq).padStart(4, "0")}`;
      }

      // Create profile
      await admin.from("profiles").insert({
        id: invited.user.id,
        full_name: row.full_name,
        email: row.email,
        role: "student",
        program_id: programId,
        student_number: studentNumber,
        region: row.region,
      });

      // Enroll in program modules
      if (programId) {
        await enrollStudentInProgramModules(admin, invited.user.id, programId);
      }

      await sendAccountInviteEmail({
        to: row.email,
        fullName: row.full_name,
        role: "student",
        loginUrl: invited.properties.action_link,
      });

      // Auto-create invoice if program has a fee for this region — use the
      // program's manual override if set, otherwise the standard fee schedule.
      if (prog) {
        const fee = (row.region === "usa" ? prog.fee_usa : prog.fee_international) ?? feeForLevel(prog.program_level, row.region === "usa" ? "usa" : "international");
        if (fee && fee > 0) {
          const invSeq = await nextSequenceNumber(admin, `invoice_number_${year}`);
          const invoiceNumber = `INV-${year}-${String(invSeq).padStart(4, "0")}`;
          const currency = row.region === "usa" ? "$" : "KSh";
          await admin.from("invoices").insert({
            student_id: invited.user.id,
            title: `${prog.name} — Program Fees`,
            description: `Tuition fees for ${prog.name} (${row.region === "usa" ? "USA" : "International"} rate: ${currency}${fee.toLocaleString()})`,
            total_amount: fee,
            invoice_number: invoiceNumber,
          });
        }
      }

      results.push({ email: row.email, status: "added" });
    } catch (err) {
      results.push({ email: row.email, status: "failed", reason: String(err) });
    }
  }

  const added = results.filter((r) => r.status === "added").length;
  const skipped = results.filter((r) => r.status === "skipped").length;
  const failed = results.filter((r) => r.status === "failed").length;

  // Encode compact result summary in URL
  const encoded = encodeURIComponent(
    results.map((r) => `${r.status}|${r.email}${r.reason ? "|" + r.reason : ""}`).join("~")
  );

  redirect(
    `/admin/students/import?added=${added}&skipped=${skipped}&failed=${failed}&rows=${encoded}`
  );
}
