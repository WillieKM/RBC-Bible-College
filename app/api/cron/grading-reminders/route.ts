import { createAdminClient } from "@/lib/supabase/admin";
import { sendGradingReminderEmail } from "@/lib/email";
import { NextResponse } from "next/server";

// Runs daily at 10am. Reminds professors about submissions ungraded for 3+ days.
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

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  // Ungraded submissions older than 3 days
  const { data: submissions } = await admin
    .from("submissions")
    .select("id, student_id, submitted_at, profiles(full_name), assignments(title, courses(title, professor_id, profiles(full_name, email)))")
    .is("graded_at", null)
    .lt("submitted_at", threeDaysAgo.toISOString());

  if (!submissions || submissions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  // Group by professor
  const byProfessor = new Map<string, {
    email: string;
    name: string;
    submissions: { studentName: string; assignmentTitle: string; courseTitle: string; submittedAt: string }[];
  }>();

  for (const sub of submissions) {
    const student = sub.profiles as unknown as { full_name: string } | null;
    const assignment = sub.assignments as unknown as {
      title: string;
      courses: { title: string; professor_id: string; profiles: { full_name: string; email: string } | null } | null;
    } | null;
    if (!student || !assignment?.courses?.profiles) continue;

    const profId = assignment.courses.professor_id;
    const profEmail = assignment.courses.profiles.email;
    const profName = assignment.courses.profiles.full_name;

    const existing = byProfessor.get(profId);
    const entry = {
      studentName: student.full_name,
      assignmentTitle: assignment.title,
      courseTitle: assignment.courses.title,
      submittedAt: sub.submitted_at,
    };

    if (existing) {
      existing.submissions.push(entry);
    } else {
      byProfessor.set(profId, { email: profEmail, name: profName, submissions: [entry] });
    }
  }

  let sent = 0;
  for (const { email, name, submissions: pending } of byProfessor.values()) {
    try {
      await sendGradingReminderEmail({
        to: email,
        professorName: name,
        submissions: pending,
        portalUrl: `${baseUrl}/professor/courses`,
      });
      sent++;
    } catch {
      // continue on failure
    }
  }

  return NextResponse.json({ ok: true, sent });
}
