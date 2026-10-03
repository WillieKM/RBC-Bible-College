import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const forceDownload = req.nextUrl.searchParams.get("dl") === "1";
  const supabase = await createClient();

  // Must be authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  // Load profile: role + program_id for audience check
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, program_id")
    .eq("id", user.id)
    .single();
  const isProfessorOrAdmin = profile?.role === "professor" || profile?.role === "admin";

  const { id } = await params;
  const admin = createAdminClient();

  // Professors/admins see all modules; students only see released ones
  let query = admin.from("module_files").select("file_url, file_name, sent_at, send_audience").eq("id", id);
  if (!isProfessorOrAdmin) query = query.not("sent_at", "is", null);
  const { data: module } = await query.single();

  if (!module?.file_url) return new NextResponse("Not found", { status: 404 });

  // For students, verify the module's audience matches their program level
  if (!isProfessorOrAdmin && module.send_audience && module.send_audience !== "all") {
    let programLevel: string | null = null;
    if (profile?.program_id) {
      const { data: prog } = await admin
        .from("programs")
        .select("program_level")
        .eq("id", profile.program_id)
        .single();
      programLevel = prog?.program_level ?? null;
    }
    if (module.send_audience !== programLevel) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  // Proxy the PDF via the admin storage client (service-role key, bypasses RLS on
  // the module-files bucket regardless of whether it is public or private).
  const BUCKET_PREFIX = "/storage/v1/object/public/module-files/";
  const prefixIdx = (module.file_url as string).indexOf(BUCKET_PREFIX);

  let buffer: ArrayBuffer;
  if (prefixIdx !== -1) {
    const storagePath = decodeURIComponent((module.file_url as string).slice(prefixIdx + BUCKET_PREFIX.length));
    const { data: fileBlob, error: dlError } = await admin.storage.from("module-files").download(storagePath);
    if (dlError || !fileBlob) return new NextResponse("File unavailable", { status: 502 });
    buffer = await fileBlob.arrayBuffer();
  } else {
    // Fallback for non-standard storage URLs
    let res: Response;
    try {
      res = await fetch(module.file_url as string);
    } catch {
      return new NextResponse("File unavailable", { status: 502 });
    }
    if (!res.ok) return new NextResponse("File unavailable", { status: 502 });
    buffer = await res.arrayBuffer();
  }

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      // inline = display in browser; attachment = download prompt
      "Content-Disposition": `${forceDownload ? "attachment" : "inline"}; filename="${module.file_name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
