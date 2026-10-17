import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { canReviewStudent } from "@/lib/research-server";
import { RESEARCH_BUCKET } from "@/lib/research";
import { NextResponse } from "next/server";

// Redirects to a short-lived signed URL rather than proxying the bytes, since
// dissertations can exceed Vercel's 4.5MB response limit.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: submission } = await admin
    .from("research_submissions")
    .select("student_id, file_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!submission) return new NextResponse("Not found", { status: 404 });

  const allowed = submission.student_id === profile.id || (await canReviewStudent(profile, submission.student_id));
  if (!allowed) return new NextResponse("Not found", { status: 404 });

  const { data } = await admin.storage
    .from(RESEARCH_BUCKET)
    .createSignedUrl(submission.file_path, 60 * 10, { download: submission.file_name });
  if (!data?.signedUrl) return new NextResponse("File unavailable", { status: 502 });

  return NextResponse.redirect(data.signedUrl);
}
