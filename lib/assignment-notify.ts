// Server-only: uses the service-role client. Never import from client components.
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNewAssignmentEmailBulk } from "@/lib/email";

// Tell every student enrolled in the course about a new assignment: an in-app
// (bell) notification always, plus an email when `email` is true. courseTitle
// may be "" to have it looked up.
export async function notifyEnrolledStudents(opts: {
  courseId: string;
  assignmentId: string;
  assignmentTitle: string;
  courseTitle: string;
  dueDate: string | null;
  baseUrl: string;
  email: boolean;
}) {
  const admin = createAdminClient();
  const { data: enrollments } = await admin
    .from("enrollments")
    .select("profiles:student_id(id, full_name, email)")
    .eq("course_id", opts.courseId);

  const students = (enrollments ?? [])
    .map((e) => e.profiles as unknown as { id: string; full_name: string; email: string } | null)
    .filter((s): s is { id: string; full_name: string; email: string } => !!s);
  if (students.length === 0) return;

  let courseTitle = opts.courseTitle;
  if (!courseTitle) {
    const { data: course } = await admin.from("courses").select("title").eq("id", opts.courseId).maybeSingle();
    courseTitle = course?.title ?? "";
  }

  const link = `/student/assignments/${opts.assignmentId}`;
  const due = opts.dueDate
    ? ` — due ${new Date(opts.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
    : "";

  const { error } = await admin.from("notifications").insert(
    students.map((s) => ({
      user_id: s.id,
      title: `New assignment: ${opts.assignmentTitle}`,
      body: `${courseTitle}${due}`,
      link,
    }))
  );
  if (error) console.error("[notifyEnrolledStudents] notifications insert failed:", error);

  if (opts.email) {
    const withEmail = students.filter((s) => s.email);
    if (withEmail.length > 0) {
      await sendNewAssignmentEmailBulk({
        to: withEmail.map((s) => s.email),
        studentNames: withEmail.map((s) => s.full_name),
        courseTitle,
        assignmentTitle: opts.assignmentTitle,
        dueDate: opts.dueDate,
        assignmentUrl: `${opts.baseUrl}${link}`,
      });
    }
  }
}
