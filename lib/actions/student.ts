"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendNewSubmissionEmail, sendSubmissionConfirmationEmail, sendStudentInquiryEmail } from "@/lib/email";
import { createNotification } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitAssignment(formData: FormData) {
  const profile = await requireRole(["student"]);
  // Live RLS doesn't reliably let students read assignments (see the student
  // pages), so the lookup found nothing and the action returned without saving.
  // Use the service role and check enrollment explicitly below.
  const supabase = createAdminClient();

  const assignmentId = String(formData.get("assignment_id"));
  const fail = (message: string): never =>
    redirect(`/student/assignments/${assignmentId}?submit_error=${encodeURIComponent(message)}`);
  const content = String(formData.get("content") || "").trim() || null;
  const shareLink = String(formData.get("share_link") || "").trim() || null;
  const file = formData.get("file") as File | null;

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, courses(*, professor:professor_id(*))")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) return fail("This assignment could not be found.");

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("course_id", assignment.course_id)
    .eq("student_id", profile.id)
    .maybeSingle();
  if (!enrollment) return fail("You are not enrolled in this assignment's course.");

  // Share link takes priority; fall back to file upload if no link given
  let fileUrl: string | null = shareLink;
  if (!shareLink && file && file.size > 0) {
    const path = `${profile.id}/${assignmentId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (uploadError) {
      console.error("[submitAssignment] upload failed:", uploadError);
      return fail("Your file could not be uploaded. Please try again, or submit a share link instead.");
    }
    fileUrl = path;
  }

  const { error: saveError } = await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: profile.id,
      content,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );
  if (saveError) {
    console.error("[submitAssignment] save failed:", saveError);
    return fail(`Your submission could not be saved: ${saveError.message}`);
  }

  const professor = assignment.courses?.professor;
  if (professor) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const reviewUrl = `${baseUrl}/professor/assignments/${assignmentId}`;
    await sendNewSubmissionEmail({
      to: professor.email,
      professorName: professor.full_name,
      studentName: profile.full_name,
      courseTitle: assignment.courses.title,
      assignmentTitle: assignment.title,
      reviewUrl,
    });
    void createNotification({
      userId: professor.id,
      title: `New submission: ${assignment.title}`,
      body: `${profile.full_name} submitted "${assignment.title}" in ${assignment.courses.title}.`,
      link: `/professor/assignments/${assignmentId}`,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  void sendSubmissionConfirmationEmail({
    to: profile.email,
    studentName: profile.full_name,
    assignmentTitle: assignment.title,
    courseTitle: assignment.courses?.title ?? "",
    reviewUrl: `${baseUrl}/student/assignments/${assignmentId}`,
  });

  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/assignments");
  revalidatePath(`/professor/assignments/${assignmentId}`);
  revalidatePath("/professor/assignments");
  redirect(`/student/assignments/${assignmentId}?submitted=1`);
}

export async function sendStudentInquiry(formData: FormData) {
  const profile = await requireRole(["student"]);
  const subject = String(formData.get("subject") || "").trim();
  const body = String(formData.get("body") || "").trim();
  if (!subject || !body) redirect("/student/contact?error=missing");

  const admin = createAdminClient();
  const { data: admins } = await admin.from("profiles").select("email").eq("role", "admin");
  const adminEmails = (admins ?? []).map((a) => a.email).filter(Boolean) as string[];

  if (adminEmails.length > 0) {
    await sendStudentInquiryEmail({
      adminEmails,
      studentName: profile.full_name,
      studentEmail: profile.email,
      subject,
      body,
    });
  }

  redirect("/student/contact?sent=1");
}
