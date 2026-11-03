// Server-only: uses the service-role client. Never import from client components.
import { createAdminClient } from "@/lib/supabase/admin";
import { isLecturer } from "@/lib/staff-room";
import type { Profile } from "@/lib/types";

export type QaPortal = "student" | "professor";
export const qaBase = (portal: QaPortal) => `/${portal}/qa`;

// Lecturers (and admins) can mark best answers and delete any post.
export function isQaModerator(p: Profile): boolean {
  return isLecturer(p) || p.role === "admin";
}

// Courses a user can tag a question with: enrolled courses for scholars,
// taught courses for lecturers, everything for admins.
export async function taggableCourses(p: Profile, portal: QaPortal): Promise<{ id: string; title: string; code: string | null }[]> {
  const admin = createAdminClient();
  if (portal === "professor") {
    const q = admin.from("courses").select("id, title, code").order("title");
    const { data } = p.role === "admin" && !isLecturer(p) ? await q : await q.eq("professor_id", p.id);
    return data ?? [];
  }
  const { data } = await admin
    .from("enrollments")
    .select("courses(id, title, code)")
    .eq("student_id", p.id);
  return (data ?? [])
    .map((e) => e.courses as unknown as { id: string; title: string; code: string | null } | null)
    .filter((c): c is { id: string; title: string; code: string | null } => !!c)
    .sort((a, b) => a.title.localeCompare(b.title));
}
