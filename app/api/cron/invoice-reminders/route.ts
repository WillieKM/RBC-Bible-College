import { createAdminClient } from "@/lib/supabase/admin";
import { sendInvoiceReminderEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// Runs weekly (Mondays). Emails every student who has an outstanding invoice balance.
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  let sent = 0;

  // Fetch all unpaid/partial invoices with payment totals
  const { data: invoices } = await admin
    .from("invoices")
    .select("id, title, total_amount, student_id, profiles(id, full_name, email, region), payments(amount)");

  if (!invoices) return NextResponse.json({ ok: true, sent: 0 });

  // Group by student
  const byStudent = new Map<string, {
    profile: { id: string; full_name: string; email: string; region: string | null };
    invoices: { title: string; balance: number; currency: string }[];
  }>();

  for (const inv of invoices) {
    const profile = inv.profiles as unknown as { id: string; full_name: string; email: string; region: string | null } | null;
    if (!profile) continue;

    const paid = ((inv.payments ?? []) as { amount: number }[]).reduce((s, p) => s + p.amount, 0);
    const balance = inv.total_amount - paid;
    if (balance <= 0) continue;

    const currency = profile.region === "usa" ? "$" : "KSh";
    const existing = byStudent.get(profile.id);
    if (existing) {
      existing.invoices.push({ title: inv.title, balance, currency });
    } else {
      byStudent.set(profile.id, {
        profile,
        invoices: [{ title: inv.title, balance, currency }],
      });
    }
  }

  for (const { profile, invoices: unpaidInvoices } of byStudent.values()) {
    const currency = profile.region === "usa" ? "$" : "KSh";
    const totalBalance = unpaidInvoices.reduce((s, i) => s + i.balance, 0);
    try {
      await sendInvoiceReminderEmail({
        to: profile.email,
        studentName: profile.full_name,
        invoices: unpaidInvoices,
        totalBalance,
        currency,
        portalUrl: `${baseUrl}/student/invoices`,
      });
      sent++;
    } catch {
      // log and continue — one failure shouldn't stop the rest
    }
  }

  return NextResponse.json({ ok: true, sent });
}
