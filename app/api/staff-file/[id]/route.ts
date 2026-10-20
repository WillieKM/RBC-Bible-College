import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";
import { STAFF_FILES_BUCKET } from "@/lib/staff-room";
import { NextResponse } from "next/server";

// Staff Room attachments: staff only. Redirects to a short-lived signed URL
// rather than proxying, since files can exceed Vercel's response size limit.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  const isStaff =
    !!profile && (profile.role === "admin" || profile.role === "professor" || profile.secondary_role === "professor");
  if (!isStaff) return new NextResponse("Not found", { status: 404 });

  const { id } = await params;
  const admin = createAdminClient();
  const { data: file } = await admin
    .from("staff_room_attachments")
    .select("file_path, file_name")
    .eq("id", id)
    .maybeSingle();
  if (!file) return new NextResponse("Not found", { status: 404 });

  const { data } = await admin.storage
    .from(STAFF_FILES_BUCKET)
    .createSignedUrl(file.file_path, 60 * 10, { download: file.file_name });
  if (!data?.signedUrl) return new NextResponse("File unavailable", { status: 502 });

  return NextResponse.redirect(data.signedUrl);
}
