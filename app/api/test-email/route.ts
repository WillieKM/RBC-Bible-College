"use server";

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBaseUrl } from "@/lib/site-url";
import { sendApplicationDecisionEmail } from "@/lib/email";

export async function GET(req: Request) {
  // Only admins can use this
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role, email, full_name").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Not an admin" }, { status: 403 });

  // Allow ?to=otheremail@example.com to test delivery to a specific address
  const { searchParams } = new URL(req.url);
  const adminEmail = searchParams.get("to") || (profile.email as string);
  const results: Record<string, unknown> = {};

  // ── Step 1: check env vars ────────────────────────────────────────────────
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  results.env = {
    GMAIL_USER: gmailUser ? `set (${gmailUser})` : "MISSING",
    GMAIL_APP_PASSWORD: gmailPass ? "set (hidden)" : "MISSING",
  };

  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ step: "env_check", passed: false, results });
  }

  // ── Step 2: raw SMTP test ─────────────────────────────────────────────────
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });
    const info = await transporter.sendMail({
      from: `"RBC Test" <${gmailUser}>`,
      to: adminEmail,
      subject: "RBC — Step 1 SMTP test",
      text: `Basic SMTP test passed. Timestamp: ${new Date().toISOString()}`,
    });
    results.smtp = { passed: true, messageId: info.messageId, sentTo: adminEmail };
  } catch (err) {
    results.smtp = { passed: false, error: err instanceof Error ? err.message : String(err) };
    return NextResponse.json({ step: "smtp", passed: false, results });
  }

  // ── Step 3: invite_links table insert ────────────────────────────────────
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: inviteRow, error: inviteInsertErr } = await (admin.from("invite_links") as any)
    .insert({ email: adminEmail, full_name: "Test Admin", role: "admin" })
    .select("id")
    .single();

  if (!inviteRow?.id) {
    results.invite_links_insert = {
      passed: false,
      error: inviteInsertErr?.message ?? "No row returned — table may not exist or has wrong columns",
    };
    return NextResponse.json({ step: "invite_links_insert", passed: false, results });
  }

  results.invite_links_insert = { passed: true, id: inviteRow.id };

  // Clean up test row
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("invite_links") as any).delete().eq("id", inviteRow.id);

  // ── Step 4: full invite email (same as real approval flow) ────────────────
  try {
    const baseUrl = await getBaseUrl();
    const fakeInviteUrl = `${baseUrl}/auth/invite?t=test-diagnostic`;
    await sendApplicationDecisionEmail({
      to: adminEmail,
      fullName: profile.full_name ?? "Admin",
      approved: true,
      loginUrl: fakeInviteUrl,
      studentNumber: "TEST-001",
      enrollmentFee: 0,
      region: "usa",
    });
    results.invite_email = { passed: true, sentTo: adminEmail };
  } catch (err) {
    results.invite_email = { passed: false, error: err instanceof Error ? err.message : String(err) };
    return NextResponse.json({ step: "invite_email", passed: false, results });
  }

  return NextResponse.json({ step: "all_passed", passed: true, results });
}
