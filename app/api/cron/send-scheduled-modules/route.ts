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

    const noMatch = ["00000000-0000-0000-0000-000000000000"];
    let professorEmails: { full_name: string; email: string }[] = [];

    if (audience !== "all") {
      const { data: matchingPrograms } = await admin
        .from("programs")
        .select("id")
        .eq("program_level", audience);

      const programIds = (matchingPrograms ?? []).map((p: { id: string }) => p.id);
      studentQuery = studentQuery.in("program_id", programIds.length > 0 ? programIds : noMatch);

      // Only professors who teach courses in matching programs
      if (programIds.length > 0) {
        const { data: programCourses } = await admin
          .from("courses")
          .select("professor_id, profiles!professor_id(full_name, email)")
          .in("program_id", programIds)
          .not("professor_id", "is", null);

        const seen = new Set<string>();
        for (const course of (programCourses ?? []) as unknown as { professor_id: string; profiles: { full_name: string; email: string } | null }[]) {
          if (course.professor_id && !seen.has(course.professor_id) && course.profiles) {
            seen.add(course.professor_id);
            professorEmails.push(course.profiles);
          }
        }
      }
    } else {
      // "all" audience → all professors
      const { data: allProfessors } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("role", "professor");
      professorEmails = allProfessors ?? [];
    }

    const [{ data: students }] = await Promise.all([studentQuery]);

    const recipients = [
      ...(students ?? []),
      ...professorEmails,
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
