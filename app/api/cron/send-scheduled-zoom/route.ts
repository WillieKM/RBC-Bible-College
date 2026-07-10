import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendZoomLinkEmail } from "@/lib/email";

const AUDIENCE_LABELS: Record<string, string> = {
  all: "All Students",
  doctorate: "Doctorate",
  bachelors: "Bachelor's",
  masters: "Master's",
  diploma: "Diploma",
  certificate: "Certificate",
};

async function getStudentsForAudience(admin: ReturnType<typeof createAdminClient>, audience: string) {
  let query = admin.from("profiles").select("full_name, email, program_id").eq("role", "student");

  if (audience === "all") {
    return query;
  }

  // Tier-based: doctorate, bachelors, masters — target by program_level
  if (["doctorate", "bachelors", "masters"].includes(audience)) {
    const { data: programs } = await admin.from("programs").select("id").eq("program_level", audience);
    const ids = (programs ?? []).map((p: { id: string }) => p.id);
    if (ids.length === 0) return { data: [] };
    return query.in("program_id", ids);
  }

  // diploma / certificate — target by program_level so all matching programs are included
  const { data: programs } = await admin.from("programs").select("id").eq("program_level", audience);
  const ids = (programs ?? []).map((p: { id: string }) => p.id);
  if (ids.length === 0) return { data: [] };
  return query.in("program_id", ids);
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
  const now = new Date();
  const todayDow = now.getDay();

  const { data: oneOff } = await admin
    .from("zoom_sessions").select("*").eq("recurrence", "none")
    .is("last_sent_at", null).eq("active", true)
    .not("send_at", "is", null).lte("send_at", now.toISOString());

  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekly } = await admin
    .from("zoom_sessions").select("*").eq("recurrence", "weekly")
    .eq("day_of_week", todayDow).eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${sixDaysAgo}`);

  const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000).toISOString();
  const { data: biweekly } = await admin
    .from("zoom_sessions").select("*").eq("recurrence", "biweekly")
    .eq("day_of_week", todayDow).eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${thirteenDaysAgo}`);

  const twentySevenDaysAgo = new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000).toISOString();
  const { data: allMonthly } = await admin
    .from("zoom_sessions").select("*").eq("recurrence", "monthly").eq("active", true)
    .or(`last_sent_at.is.null,last_sent_at.lte.${twentySevenDaysAgo}`);

  const monthly = (allMonthly ?? []).filter((s) =>
    s.send_at && new Date(s.send_at).getDate() === now.getDate()
  );

  const due = [...(oneOff ?? []), ...(weekly ?? []), ...(biweekly ?? []), ...monthly];
  if (due.length === 0) return NextResponse.json({ ok: true, sent: 0 });

  let totalSent = 0;

  for (const session of due) {
    const { data: students } = await getStudentsForAudience(admin, session.target_audience ?? "all");

    if (!students || students.length === 0) {
      await admin.from("zoom_sessions").update({ last_sent_at: now.toISOString() }).eq("id", session.id);
      continue;
    }

    const audienceLabel = AUDIENCE_LABELS[session.target_audience] ?? "your program";

    await Promise.allSettled(
      students.map((s: { full_name: string; email: string }) =>
        sendZoomLinkEmail({
          to: s.email,
          studentName: s.full_name,
          sessionTitle: session.title,
          description: session.description,
          zoomUrl: session.zoom_url,
          programName: audienceLabel,
        })
      )
    );

    await admin.from("zoom_sessions").update({ last_sent_at: now.toISOString() }).eq("id", session.id);
    totalSent += students.length;
  }

  return NextResponse.json({ ok: true, sent: totalSent, sessions: due.length });
}
