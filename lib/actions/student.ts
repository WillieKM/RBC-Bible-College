"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { sendNewSubmissionEmail, sendSubmissionConfirmationEmail, sendStudentInquiryEmail } from "@/lib/email";
import { createNotification } from "@/lib/actions/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function submitAssignment(formData: FormData) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const assignmentId = String(formData.get("assignment_id"));
  const content = String(formData.get("content") || "").trim() || null;
  const shareLink = String(formData.get("share_link") || "").trim() || null;
  const file = formData.get("file") as File | null;

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, courses(*, professor:professor_id(*))")
    .eq("id", assignmentId)
    .single();
  if (!assignment) return;

  // Share link takes priority; fall back to file upload if no link given
  let fileUrl: string | null = shareLink;
  if (!shareLink && file && file.size > 0) {
    const path = `${profile.id}/${assignmentId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (!uploadError) fileUrl = path;
  }

  await supabase.from("submissions").upsert(
    {
      assignment_id: assignmentId,
      student_id: profile.id,
      content,
      file_url: fileUrl,
      submitted_at: new Date().toISOString(),
    },
    { onConflict: "assignment_id,student_id" }
  );

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
