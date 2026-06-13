"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sendGradedEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const dueDate = String(formData.get("due_date") || "") || null;
  const pointsPossible = formData.get("points_possible") ? Number(formData.get("points_possible")) : null;
  if (!title) return;

  // Confirm the course belongs to this professor
  const { data: course } = await supabase.from("courses").select("id, professor_id").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  await supabase.from("assignments").insert({
    course_id: courseId,
    title,
    description,
    due_date: dueDate,
    points_possible: pointsPossible,
  });

  revalidatePath(`/professor/courses/${courseId}`);
}

export async function gradeSubmission(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const submissionId = String(formData.get("submission_id"));
  const assignmentId = String(formData.get("assignment_id"));
  const grade = formData.get("grade") ? Number(formData.get("grade")) : null;
  const feedback = String(formData.get("feedback") || "").trim() || null;

  if (grade === null) return;

  await supabase
    .from("submissions")
    .update({ grade, feedback, graded_at: new Date().toISOString(), graded_by: profile.id })
    .eq("id", submissionId);

  const { data: submission } = await supabase
    .from("submissions")
    .select("*, profiles(*), assignments(*, courses(*))")
    .eq("id", submissionId)
    .single();

  if (submission?.profiles && submission?.assignments) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    await sendGradedEmail({
      to: submission.profiles.email,
      studentName: submission.profiles.full_name,
      assignmentTitle: submission.assignments.title,
      courseTitle: submission.assignments.courses?.title ?? "",
      grade,
      pointsPossible: submission.assignments.points_possible,
      feedback,
      reviewUrl: `${baseUrl}/student/assignments/${assignmentId}`,
    });
  }

  revalidatePath(`/professor/assignments/${assignmentId}`);
}
