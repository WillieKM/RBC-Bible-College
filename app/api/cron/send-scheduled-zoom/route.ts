import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendZoomLinkEmail } from "@/lib/email";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const now = new Date();
  const todayDow = now.getDay(); // 0=Sunday … 6=Saturday

  // ── One-off: send_at has passed and never been sent ──────────────────────────
  const { data: oneOff } = await admin
    .from("zoom_sessions")
    .select("*")
    .eq("recurrence", "none")
    .is("last_sent_at", null)
    .eq("active", true)
    .not("send_at", "is", null)
    .lte("send_at", now.toISOString());

  // ── Weekly: matching day_of_week, not sent in last 6 days ───────────────────
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekly } = await admin
    .from("zoom_sessions")
    .select("*")
    .eq("recurrence", "weekly")
    .eq("day_of_week", todayDow)
    .eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${sixDaysAgo}`);

  // ── Biweekly: matching day_of_week, not sent in last 13 days ─────────────────
  const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();
  const { data: biweekly } = await admin
    .from("zoom_sessions")
    .select("*")
    .eq("recurrence", "biweekly")
    .eq("day_of_week", todayDow)
    .eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${thirteenDaysAgo}`);

  // ── Monthly: same day-of-month as send_at, not sent in last 27 days ──────────
  const twentySevenDaysAgo = new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allMonthly } = await admin
    .from("zoom_sessions")
    .select("*")
    .eq("recurrence", "monthly")
    .eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${twentySevenDaysAgo}`);

  const monthly = (allMonthly ?? []).filter((s) => {
    if (!s.send_at) return false;
    return new Date(s.send_at).getDate() === now.getDate();
  });

  const due = [...(oneOff ?? []), ...(weekly ?? []), ...(biweekly ?? []), ...monthly];

  if (due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let totalSent = 0;

  for (const session of due) {
    // Fetch students for this session's program (or all students)
    let query = admin
      .from("profiles")
      .select("full_name, email")
      .eq("role", "student");

    if (session.program_id) {
      query = query.eq("program_id", session.program_id);
    }

    const { data: students } = await query;
    if (!students || students.length === 0) {
      await admin.from("zoom_sessions").update({ last_sent_at: now.toISOString() }).eq("id", session.id);
      continue;
    }

    // Fetch program name for the email
    let programName = "your program";
    if (session.program_id) {
      const { data: prog } = await admin.from("programs").select("name").eq("id", session.program_id).single();
      if (prog) programName = prog.name;
    }

    await Promise.allSettled(
      students.map((s: { full_name: string; email: string }) =>
        sendZoomLinkEmail({
          to: s.email,
          studentName: s.full_name,
          sessionTitle: session.title,
          description: session.description,
          zoomUrl: session.zoom_url,
          programName,
        })
      )
    );

    await admin.from("zoom_sessions").update({ last_sent_at: now.toISOString() }).eq("id", session.id);
    totalSent += students.length;
  }

  return NextResponse.json({ ok: true, sent: totalSent, sessions: due.length });
}
