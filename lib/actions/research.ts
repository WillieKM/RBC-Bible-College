"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, requireRole } from "@/lib/auth";
import { createNotification } from "@/lib/actions/notifications";
import { canReviewStudent, getProgramLevel } from "@/lib/research-server";
import {
  RESEARCH_BUCKET,
  RESEARCH_KINDS,
  RESEARCH_MAX_BYTES,
  RESEARCH_MIME_TYPES,
  RESEARCH_STATUSES,
  isResearchLevel,
} from "@/lib/research";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

async function requireResearchScholar() {
  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "student" && profile.secondary_role !== "student")) return null;
  const level = await getProgramLevel(profile.program_id);
  return isResearchLevel(level) ? profile : null;
}

// Step 1 of an upload: hand the browser a one-time signed URL so the file goes
// straight to Supabase Storage. Dissertations are far larger than Vercel's
// 4.5MB request limit, so they can't pass through a server action.
export async function createResearchUpload(input: {
  fileName: string;
  contentType: string;
  size: number;
}): Promise<Result<{ path: string; token: string }>> {
  const profile = await requireResearchScholar();
  if (!profile) return { ok: false, error: "Research uploads are only available to Master's and Doctorate scholars." };
  if (!RESEARCH_MIME_TYPES.includes(input.contentType)) return { ok: false, error: "Please upload a PDF or Word document." };
  if (input.size > RESEARCH_MAX_BYTES) return { ok: false, error: "File is too large. The limit is 50MB." };

  const safeName = input.fileName.replace(/[^\w.\-]+/g, "_").slice(-120);
  const path = `research/${profile.id}/${Date.now()}-${safeName}`;
  const { data, error } = await createAdminClient().storage.from(RESEARCH_BUCKET).createSignedUploadUrl(path);
  if (error || !data) return { ok: false, error: "Could not start the upload. Please try again." };
  return { ok: true, path: data.path, token: data.token };
}

// Step 2: once the browser has uploaded the file, record the submission.
export async function recordResearchSubmission(input: {
  path: string;
  fileName: string;
  title: string;
  kind: string;
  note: string;
}): Promise<Result> {
  const profile = await requireResearchScholar();
  if (!profile) return { ok: false, error: "Research uploads are only available to Master's and Doctorate scholars." };
  if (!input.path.startsWith(`research/${profile.id}/`)) return { ok: false, error: "Invalid upload." };

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Please give the upload a title." };
  const kind = input.kind in RESEARCH_KINDS ? input.kind : "other";

  const admin = createAdminClient();
  const { error } = await admin.from("research_submissions").insert({
    student_id: profile.id,
    title,
    kind,
    note: input.note.trim() || null,
    file_path: input.path,
    file_name: input.fileName,
  });
  if (error) {
    console.error("[recordResearchSubmission] insert failed:", error);
    return { ok: false, error: "The file uploaded, but saving it failed. Please try again." };
  }

  // Let the program's lead professor know there's something to review.
  if (profile.program_id) {
    const { data: program } = await admin.from("programs").select("professor_id").eq("id", profile.program_id).maybeSingle();
    if (program?.professor_id) {
      await createNotification({
        userId: program.professor_id,
        title: "New research upload",
        body: `${profile.full_name} uploaded "${title}".`,
        link: "/professor/research",
      });
    }
  }

  revalidatePath("/student/research");
  return { ok: true };
}

export async function reviewResearchSubmission(formData: FormData) {
  const reviewer = await requireRole(["admin", "professor"]);
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "");
  const comment = String(formData.get("reviewer_comment") || "").trim() || null;
  const returnTo = reviewer.role === "admin" ? "/admin/research" : "/professor/research";
  if (!id || !(status in RESEARCH_STATUSES)) redirect(returnTo);

  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("research_submissions")
    .select("student_id, title")
    .eq("id", id)
    .maybeSingle();
  if (!submission || !(await canReviewStudent(reviewer, submission.student_id))) redirect(returnTo);

  await admin
    .from("research_submissions")
    .update({ status, reviewer_comment: comment, reviewed_by: reviewer.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  await createNotification({
    userId: submission.student_id,
    title: `Research update: ${RESEARCH_STATUSES[status as keyof typeof RESEARCH_STATUSES]}`,
    body: `"${submission.title}" was reviewed by ${reviewer.full_name}.`,
    link: "/student/research",
  });

  revalidatePath("/admin/research");
  revalidatePath("/professor/research");
  revalidatePath("/student/research");
  redirect(`${returnTo}?reviewed=1`);
}
