"use server";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { sendNewSubmissionEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function submitAssignment(formData: FormData) {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const assignmentId = String(formData.get("assignment_id"));
  const content = String(formData.get("content") || "").trim() || null;
  const file = formData.get("file") as File | null;

  const { data: assignment } = await supabase
    .from("assignments")
    .select("*, courses(*, professor:professor_id(*))")
    .eq("id", assignmentId)
    .single();
  if (!assignment) return;

  let fileUrl: string | null = null;
  if (file && file.size > 0) {
    const path = `${profile.id}/${assignmentId}/${file.name}`;
    const { error: uploadError } = await supabase.storage.from("submissions").upload(path, file, { upsert: true });
    if (!uploadError) {
      const { data: signed } = await supabase.storage.from("submissions").createSignedUrl(path, 60 * 60 * 24 * 365);
      fileUrl = signed?.signedUrl ?? null;
    }
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
    await sendNewSubmissionEmail({
      to: professor.email,
      professorName: professor.full_name,
      studentName: profile.full_name,
      courseTitle: assignment.courses.title,
      assignmentTitle: assignment.title,
      reviewUrl: `${baseUrl}/professor/assignments/${assignmentId}`,
    });
  }

  revalidatePath(`/student/assignments/${assignmentId}`);
}
