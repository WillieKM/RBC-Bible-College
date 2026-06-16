import { createAdminClient } from "@/lib/supabase/admin";
import { sendModuleReleaseEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// Runs daily. For each enrollment, checks if any program modules have
// release_days set and sends the student a notification email once the
// release window opens, recording the send so it only fires once.
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
  const today = new Date();
  let sent = 0;

  // Fetch all enrollments with module + student + program info
  const { data: enrollments } = await admin
    .from("enrollments")
    .select("id, created_at, student_id, course_id, courses(id, title, code, release_days, program_id, programs(name)), profiles(id, full_name, email)");

  for (const enrollment of enrollments ?? []) {
    const course = enrollment.courses as unknown as {
      id: string; title: string; code: string | null;
      release_days: number | null; program_id: string | null;
      programs: { name: string } | null;
    } | null;
    const student = enrollment.profiles as unknown as { id: string; full_name: string; email: string } | null;

    if (!course?.release_days || !student) continue;

    // Check if release date has passed
    const enrolledAt = new Date(enrollment.created_at);
    const releaseDate = new Date(enrolledAt);
    releaseDate.setDate(releaseDate.getDate() + course.release_days);
    if (today < releaseDate) continue;

    // Check if already sent
    const { data: existing } = await admin
      .from("module_notifications")
      .select("id")
      .eq("course_id", course.id)
      .eq("student_id", student.id)
      .maybeSingle();
    if (existing) continue;

    // Send email
    await sendModuleReleaseEmail({
      to: student.email,
      studentName: student.full_name,
      moduleTitle: course.title,
      moduleCode: course.code,
      programName: course.programs?.name ?? "your program",
      portalUrl: `${baseUrl}/student`,
    });

    // Record notification
    await admin.from("module_notifications").insert({
      course_id: course.id,
      student_id: student.id,
    });

    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
