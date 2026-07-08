import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendModuleFileEmail } from "@/lib/email";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const admin = createAdminClient();

  // Find modules whose scheduled send time has passed and haven't been sent yet
  const { data: dueModules } = await admin
    .from("module_files")
    .select("*")
    .not("send_at", "is", null)
    .is("sent_at", null)
    .lte("send_at", new Date().toISOString());

  if (!dueModules || dueModules.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let totalSent = 0;

  for (const module of dueModules) {
    const audience = module.send_audience ?? "all";

    // Fetch matching students
    let studentQuery = admin
      .from("profiles")
      .select("full_name, email, program_id")
      .eq("role", "student");

    if (audience !== "all") {
      const { data: matchingPrograms } = await admin
        .from("programs")
        .select("id")
        .eq("program_level", audience);

      const programIds = (matchingPrograms ?? []).map((p: { id: string }) => p.id);
      // If no programs match this level, use a sentinel that matches nothing
      studentQuery = studentQuery.in("program_id", programIds.length > 0 ? programIds : ["00000000-0000-0000-0000-000000000000"]);
    }

    const [{ data: students }, { data: professors }] = await Promise.all([
      studentQuery,
      admin.from("profiles").select("full_name, email").eq("role", "professor"),
    ]);

    const recipients = [
      ...(students ?? []),
      ...(professors ?? []),
    ] as { full_name: string; email: string }[];

    if (recipients.length === 0) {
      await admin.from("module_files").update({ sent_at: new Date().toISOString() }).eq("id", module.id);
      continue;
    }

    await Promise.allSettled(
      recipients.map((r: { full_name: string; email: string }) =>
        sendModuleFileEmail({
          to: r.email,
          studentName: r.full_name,
          moduleTitle: module.title,
          description: module.description,
          fileUrl: module.file_url,
          fileName: module.file_name,
          senderName: "Revelation Bible College",
        })
      )
    );

    await admin
      .from("module_files")
      .update({ sent_at: new Date().toISOString() })
      .eq("id", module.id);

    totalSent += recipients.length;
  }

  return NextResponse.json({ ok: true, sent: totalSent, modules: dueModules.length });
}
