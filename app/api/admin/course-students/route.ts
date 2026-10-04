import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["admin"]);
  } catch {
    return NextResponse.json({ students: [] }, { status: 401 });
  }

  const courseId = req.nextUrl.searchParams.get("course_id");
  if (!courseId) return NextResponse.json({ students: [] });

  const admin = createAdminClient();
  const { data } = await admin
    .from("enrollments")
    .select("profiles(id, full_name)")
    .eq("course_id", courseId);

  const students = (data ?? [])
    .map((e) => e.profiles as unknown as { id: string; full_name: string } | null)
    .filter(Boolean);

  return NextResponse.json({ students });
}
