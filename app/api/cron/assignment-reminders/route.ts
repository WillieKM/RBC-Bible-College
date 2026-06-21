import { createAdminClient } from "@/lib/supabase/admin";
import { sendAssignmentDueEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// Runs daily at 8am. Emails students about assignments due the following day.
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

  // Calculate tomorrow's date (YYYY-MM-DD)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  let sent = 0;

  // Get all assignments due tomorrow with their enrollments and student profiles
  const { data: assignments } = await admin
    .from("assignments")
    .select("id, title, due_date, courses(id, title, enrollments(student_id, profiles(id, full_name, email)))")
    .eq("due_date", tomorrowStr);

  if (!assignments) return NextResponse.json({ ok: true, sent: 0 });

  // Group due assignments per student
  const byStudent = new Map<string, {
    profile: { id: string; full_name: string; email: string };
    assignments: { title: string; courseTitle: string; dueDate: string }[];
  }>();

  for (const assignment of assignments) {
    const course = assignment.courses as unknown as {
      id: string; title: string;
      enrollments: { student_id: string; profiles: { id: string; full_name: string; email: string } | null }[];
    } | null;
    if (!course) continue;

    for (const enrollment of course.enrollments ?? []) {
      const profile = enrollment.profiles;
      if (!profile) continue;

      // Skip if student already submitted this assignment
      const { data: submission } = await admin
        .from("submissions")
        .select("id")
        .eq("assignment_id", assignment.id)
        .eq("student_id", profile.id)
        .maybeSingle();
      if (submission) continue;

      const existing = byStudent.get(profile.id);
      const entry = { title: assignment.title, courseTitle: course.title, dueDate: tomorrowStr };
      if (existing) {
        existing.assignments.push(entry);
      } else {
        byStudent.set(profile.id, { profile, assignments: [entry] });
      }
    }
  }

  for (const { profile, assignments: dueAssignments } of byStudent.values()) {
    try {
      await sendAssignmentDueEmail({
        to: profile.email,
        studentName: profile.full_name,
        assignments: dueAssignments,
        portalUrl: `${baseUrl}/student`,
      });
      sent++;
    } catch {
      // log and continue
    }
  }

  return NextResponse.json({ ok: true, sent });
}
