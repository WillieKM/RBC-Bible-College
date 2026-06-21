"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendGradedEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/actions/notifications";
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
    const reviewUrl = `${baseUrl}/student/assignments/${assignmentId}`;
    void sendGradedEmail({
      to: submission.profiles.email,
      studentName: submission.profiles.full_name,
      assignmentTitle: submission.assignments.title,
      courseTitle: submission.assignments.courses?.title ?? "",
      grade,
      pointsPossible: submission.assignments.points_possible,
      feedback,
      reviewUrl,
    });
    void createNotification({
      userId: submission.student_id,
      title: `Grade posted: ${submission.assignments.title}`,
      body: `You received ${grade}${submission.assignments.points_possible ? `/${submission.assignments.points_possible}` : ""} pts${feedback ? ` — ${feedback}` : ""}`,
      link: `/student/assignments/${assignmentId}`,
    });
    void writeAuditLog({ actorId: profile.id, actorName: profile.full_name, action: "grade_submission", targetType: "submission", targetId: submissionId, details: { grade, assignmentId, student: submission.profiles.full_name } });
  }

  revalidatePath(`/professor/assignments/${assignmentId}`);
}

export async function addCourseMaterial(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();
  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") || "").trim();
  const type = String(formData.get("type") || "link") as "link" | "note" | "file";
  const url = String(formData.get("url") || "").trim() || null;
  const body = String(formData.get("body") || "").trim() || null;
  if (!title) return;

  const { data: course } = await supabase.from("courses").select("professor_id").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  let fileUrl: string | null = null;
  const file = formData.get("file");
  if (type === "file" && file instanceof File && file.size > 0) {
    const admin = createAdminClient();
    const ext = file.name.split(".").pop() || "bin";
    const path = `materials/${courseId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await admin.storage.from("application-photos").upload(path, file, { contentType: file.type });
    if (!error) {
      const { data: urlData } = admin.storage.from("application-photos").getPublicUrl(path);
      fileUrl = urlData.publicUrl;
    }
  }

  await supabase.from("course_materials").insert({ course_id: courseId, title, type, url, body, file_url: fileUrl });
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function deleteCourseMaterial(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();
  const id = String(formData.get("id"));
  const courseId = String(formData.get("course_id"));

  const { data: course } = await supabase.from("courses").select("professor_id").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  await supabase.from("course_materials").delete().eq("id", id);
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function saveAttendance(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();
  const courseId = String(formData.get("course_id"));
  const sessionDate = String(formData.get("session_date"));
  if (!sessionDate) return;

  const { data: course } = await supabase.from("courses").select("professor_id").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  const { data: enrollments } = await supabase.from("enrollments").select("student_id").eq("course_id", courseId);
  if (!enrollments) return;

  const rows = enrollments.map((e) => ({
    course_id: courseId,
    student_id: e.student_id,
    session_date: sessionDate,
    present: formData.get(`present_${e.student_id}`) === "on",
  }));

  await supabase.from("attendance").upsert(rows, { onConflict: "course_id,student_id,session_date" });
  revalidatePath(`/professor/courses/${courseId}`);
}
