"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendGradedEmail, sendNewAssignmentEmail, sendDirectMessageEmail, sendProfessorInquiryEmail } from "@/lib/email";
import { writeAuditLog } from "@/lib/audit";
import { createNotification } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyEnrolledStudents } from "@/lib/assignment-notify";

export async function createAssignment(formData: FormData) {
  const profile = await requireRole(["professor"]);
  // The live RLS policies on courses/assignments don't cover professors (see
  // 6745ca7), so a user-scoped client silently finds no course and inserts
  // nothing. Use the service role and enforce ownership explicitly below.
  const supabase = createAdminClient();

  const courseId = String(formData.get("course_id"));
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;
  const dueDate = String(formData.get("due_date") || "") || null;
  const pointsPossible = formData.get("points_possible") ? Number(formData.get("points_possible")) : null;
  const returnTo = String(formData.get("return_to") || "") === `/professor/courses/${courseId}`
    ? `/professor/courses/${courseId}`
    : "/professor/assignments";
  const fail = (message: string): never => redirect(`${returnTo}?error=${encodeURIComponent(message)}`);
  if (!title) fail("Title is required.");

  // Confirm the course belongs to this professor
  const { data: course } = await supabase.from("courses").select("id, title, professor_id").eq("id", courseId).maybeSingle();
  if (!course || course.professor_id !== profile.id) return fail("You can only create assignments for your own courses.");

  const { data: newAssignment, error: insertError } = await supabase
    .from("assignments")
    .insert({ course_id: courseId, title, description, due_date: dueDate, points_possible: pointsPossible })
    .select("id")
    .single();
  if (insertError || !newAssignment) {
    console.error("[createAssignment] insert failed:", insertError);
    return fail(`Could not create the assignment: ${insertError?.message ?? "unknown error"}`);
  }

  // Notify enrolled students
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("profiles(full_name, email)")
    .eq("course_id", courseId);

  if (enrollments && newAssignment) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const portalUrl = `${baseUrl}/student/assignments/${newAssignment.id}`;
    await Promise.allSettled(
      enrollments.map((enr) => {
        const student = enr.profiles as unknown as { full_name: string; email: string } | null;
        if (!student) return Promise.resolve();
        return sendNewAssignmentEmail({
          to: student.email,
          studentName: student.full_name,
          assignmentTitle: title,
          courseTitle: course.title ?? "",
          dueDate,
          description,
          portalUrl,
        });
      })
    );
  }

  // Bell notification for every enrolled student (emails were sent above).
  await notifyEnrolledStudents({
    courseId,
    assignmentId: newAssignment.id,
    assignmentTitle: title,
    courseTitle: course.title ?? "",
    dueDate,
    baseUrl: "",
    email: false,
  });

  revalidatePath(`/professor/courses/${courseId}`);
  revalidatePath("/professor/assignments");
  redirect(returnTo); // also clears any earlier ?error from the URL
}

export async function gradeSubmission(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = createAdminClient(); // see createAssignment: live RLS doesn't cover professors

  const submissionId = String(formData.get("submission_id"));
  const assignmentId = String(formData.get("assignment_id"));
  const grade = formData.get("grade") ? Number(formData.get("grade")) : null;
  const feedback = String(formData.get("feedback") || "").trim() || null;
  const fail = (message: string): never =>
    redirect(`/professor/assignments/${assignmentId}?error=${encodeURIComponent(message)}`);

  if (grade === null) return;

  // Only the professor who teaches the submission's course may grade it.
  const { data: owner } = await supabase
    .from("submissions")
    .select("assignments(courses(professor_id))")
    .eq("id", submissionId)
    .maybeSingle();
  const ownerId = (owner?.assignments as unknown as { courses: { professor_id: string | null } | null } | null)?.courses?.professor_id;
  if (ownerId !== profile.id) return fail("You can only grade submissions for your own courses.");

  const { error: gradeError } = await supabase
    .from("submissions")
    .update({ grade, feedback, graded_at: new Date().toISOString(), graded_by: profile.id })
    .eq("id", submissionId);
  if (gradeError) {
    console.error("[gradeSubmission] update failed:", gradeError);
    return fail(`Could not save the grade: ${gradeError.message}`);
  }

  const { data: submission } = await supabase
    .from("submissions")
    .select("*, profiles:student_id(*), assignments(*, courses(*))")
    .eq("id", submissionId)
    .single();

  if (submission?.profiles && submission?.assignments) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const reviewUrl = `${baseUrl}/student/assignments/${assignmentId}`;
    await sendGradedEmail({
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
  revalidatePath("/professor/assignments");
  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/transcript");
  revalidatePath("/student");
}

export async function addCourseMaterial(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = createAdminClient(); // ownership enforced below
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

  const { error } = await supabase.from("course_materials").insert({ course_id: courseId, title, type, url, body, file_url: fileUrl });
  if (error) {
    console.error("[addCourseMaterial] insert failed:", error);
    redirect(`/professor/courses/${courseId}?error=${encodeURIComponent(`Could not add the material: ${error.message}`)}`);
  }
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function deleteCourseMaterial(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = createAdminClient(); // ownership enforced below
  const id = String(formData.get("id"));
  const courseId = String(formData.get("course_id"));

  const { data: course } = await supabase.from("courses").select("professor_id").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  // Scope to the course too, so a material id from another course can't be deleted.
  await supabase.from("course_materials").delete().eq("id", id).eq("course_id", courseId);
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function saveAttendance(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = createAdminClient(); // ownership enforced below
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

  const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "course_id,student_id,session_date" });
  if (error) {
    console.error("[saveAttendance] upsert failed:", error);
    redirect(`/professor/courses/${courseId}/attendance?error=${encodeURIComponent(`Could not save attendance: ${error.message}`)}`);
  }
  revalidatePath(`/professor/courses/${courseId}`);
}

export async function sendProfessorMessage(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const supabase = createAdminClient(); // ownership and enrollment enforced below

  const courseId = String(formData.get("course_id"));
  const studentId = String(formData.get("student_id") || "");
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) return;

  // Verify course belongs to this professor
  const { data: course } = await supabase.from("courses").select("professor_id, title").eq("id", courseId).single();
  if (!course || course.professor_id !== profile.id) return;

  if (studentId) {
    // Send to one student — verify they're enrolled
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("course_id", courseId)
      .eq("student_id", studentId)
      .single();
    if (!enrollment) return;

    const { data: student } = await supabase.from("profiles").select("full_name, email").eq("id", studentId).single();
    if (!student) return;

    await sendDirectMessageEmail({ to: student.email, studentName: student.full_name, subject, body });
    void createNotification({ userId: studentId, title: `Message from ${profile.full_name}`, body: subject, link: undefined});
  } else {
    // Broadcast to all enrolled students
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("profiles(id, full_name, email)")
      .eq("course_id", courseId);

    await Promise.allSettled(
      (enrollments ?? []).map((e) => {
        const student = e.profiles as unknown as { id: string; full_name: string; email: string } | null;
        if (!student) return Promise.resolve();
        void createNotification({ userId: student.id, title: `Message from ${profile.full_name}`, body: subject, link: undefined});
        return sendDirectMessageEmail({ to: student.email, studentName: student.full_name, subject, body });
      })
    );
  }

  revalidatePath(`/professor/courses/${courseId}`);
}

export async function sendProfessorInquiry(formData: FormData) {
  const profile = await requireRole(["professor"]);
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) { redirect("/professor/contact?error=missing"); }

  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
  const adminEmails = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];

  if (adminEmails.length > 0) {
    await sendProfessorInquiryEmail({
      adminEmails,
      professorName: profile.full_name,
      professorEmail: profile.email,
      subject,
      body,
    });
  }

  redirect("/professor/contact?sent=1");
}
