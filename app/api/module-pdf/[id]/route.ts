import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Check role so professors/admins can access unreleased modules
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isProfessorOrAdmin = profile?.role === "professor" || profile?.role === "admin";

  const { id } = await params;
  const admin = createAdminClient();

  // Professors/admins see all modules; students only see released ones
  let query = admin.from("module_files").select("file_url, file_name, sent_at").eq("id", id);
  if (!isProfessorOrAdmin) query = query.not("sent_at", "is", null);
  const { data: module } = await query.single();

  if (!module?.file_url) return new NextResponse("Not found", { status: 404 });

  // Proxy the PDF from storage so the raw Supabase URL is never exposed
  let res: Response;
  try {
    res = await fetch(module.file_url);
  } catch {
    return new NextResponse("File unavailable", { status: 502 });
  }
  if (!res.ok) return new NextResponse("File unavailable", { status: 502 });

  const buffer = await res.arrayBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      // inline = display in browser; attachment = download prompt
      "Content-Disposition": `inline; filename="${module.file_name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
