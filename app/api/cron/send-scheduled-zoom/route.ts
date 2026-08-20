import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendZoomLinkEmail } from "@/lib/email";

function parseSpecificEmails(raw: string | null): { email: string; full_name: string }[] {
  if (!raw) return [];
  return raw
    .split(/[\n,]/)
    .map((e) => e.trim())
    .filter((e) => e.includes("@"))
    .map((email) => ({ email, full_name: email.split("@")[0] }));
}

function isDueToday(session: {
  recurrence: string;
  day_of_week: number | null;
  send_at: string | null;
  last_sent_at: string | null;
}): boolean {
  const now = new Date();
  const todayDow = now.getDay();

  if (session.recurrence === "none") {
    return (
      session.send_at != null &&
      new Date(session.send_at) <= now &&
      session.last_sent_at == null
    );
  }

  if (session.recurrence === "weekly") {
    if (session.day_of_week == null || session.day_of_week !== todayDow) return false;
    if (session.last_sent_at) {
      const lastSent = new Date(session.last_sent_at);
      if (lastSent.toDateString() === now.toDateString()) return false;
    }
    return true;
  }

  if (session.recurrence === "biweekly") {
    if (session.day_of_week == null || session.day_of_week !== todayDow) return false;
    if (session.last_sent_at) {
      const daysSinceLast = (now.getTime() - new Date(session.last_sent_at).getTime()) / 86_400_000;
      if (daysSinceLast < 13) return false;
    }
    return true;
  }

  if (session.recurrence === "monthly") {
    const targetDay = session.send_at ? new Date(session.send_at).getDate() : 1;
    if (now.getDate() !== targetDay) return false;
    if (session.last_sent_at) {
      const lastSent = new Date(session.last_sent_at);
      if (
        lastSent.getFullYear() === now.getFullYear() &&
        lastSent.getMonth() === now.getMonth()
      ) return false;
    }
    return true;
  }

  return false;
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  const { data: sessions } = await admin
    .from("zoom_sessions")
    .select("*")
    .eq("active", true);

  if (!sessions || sessions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, sessions: 0 });
  }

  const dueSessions = sessions.filter(isDueToday);

  if (dueSessions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, sessions: 0 });
  }

  const AUDIENCE_LABELS: Record<string, string> = {
    all: "All Students", doctorate: "Doctorate", bachelors: "Bachelor's",
    masters: "Master's", diploma: "Diploma", certificate: "Certificate",
  };

  let totalSent = 0;

  for (const session of dueSessions) {
    const specificRecipients = parseSpecificEmails(session.specific_emails ?? null);
    let allRecipients: { email: string; full_name: string }[] = [];

    if (session.target_audience === "specific") {
      allRecipients = specificRecipients;
    } else {
      let studentsQuery = admin
        .from("profiles")
        .select("full_name, email")
        .eq("role", "student");

      if (session.target_audience !== "all") {
        const { data: programs } = await admin
          .from("programs")
          .select("id")
          .eq("program_level", session.target_audience);
        const ids = (programs ?? []).map((p: { id: string }) => p.id);
        if (ids.length === 0) {
          await admin.from("zoom_sessions").update({ last_sent_at: new Date().toISOString() }).eq("id", session.id);
          continue;
        }
        studentsQuery = studentsQuery.in("program_id", ids);
      }

      const { data: students } = await studentsQuery;
      allRecipients = [
        ...(students ?? []).map((s: { full_name: string; email: string }) => ({ full_name: s.full_name, email: s.email })),
        ...specificRecipients,
      ];
    }

    const programName = AUDIENCE_LABELS[session.target_audience] ?? "your program";

    await Promise.allSettled(
      allRecipients.map((r) =>
        sendZoomLinkEmail({
          to: r.email,
          studentName: r.full_name,
          sessionTitle: session.title,
          description: session.description,
          zoomUrl: session.zoom_url,
          programName,
        })
      )
    );

    await admin
      .from("zoom_sessions")
      .update({ last_sent_at: new Date().toISOString() })
      .eq("id", session.id);

    totalSent += allRecipients.length;
  }

  return NextResponse.json({ ok: true, sent: totalSent, sessions: dueSessions.length });
}
