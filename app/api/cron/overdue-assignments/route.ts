import { createAdminClient } from "@/lib/supabase/admin";
import { sendOverdueAssignmentEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// Runs daily at 9am. Emails students who missed a deadline (due yesterday, no submission).
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

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  // Fetch assignments that were due yesterday
  const { data: assignments } = await admin
    .from("assignments")
    .select("id, title, due_date, course_id, courses(title)")
    .eq("due_date", yesterdayStr);

  if (!assignments || assignments.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;

  for (const assignment of assignments) {
    const courseTitle = (assignment.courses as unknown as { title: string } | null)?.title ?? "";

    // Get enrolled students
    const { data: enrollments } = await admin
      .from("enrollments")
      .select("student_id, profiles(full_name, email)")
      .eq("course_id", assignment.course_id);

    if (!enrollments) continue;

    for (const enr of enrollments) {
      const student = enr.profiles as unknown as { full_name: string; email: string } | null;
      if (!student) continue;

      // Check if the student already submitted
      const { data: submission } = await admin
        .from("submissions")
        .select("id")
        .eq("assignment_id", assignment.id)
        .eq("student_id", enr.student_id)
        .maybeSingle();

      if (submission) continue; // submitted — no nudge needed

      try {
        await sendOverdueAssignmentEmail({
          to: student.email,
          studentName: student.full_name,
          assignments: [{ title: assignment.title, courseTitle, dueDate: assignment.due_date! }],
          portalUrl: `${baseUrl}/student/assignments/${assignment.id}`,
        });
        sent++;
      } catch {
        // continue on failure
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}
