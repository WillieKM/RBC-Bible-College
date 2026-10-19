// Server-only: uses the service-role client. Never import from client components.
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile, ProgramLevel } from "@/lib/types";
import { cache } from "react";

// Cached per request: the student layout and DashboardShell both need it.
export const getProgramLevel = cache(async function getProgramLevel(programId: string | null): Promise<ProgramLevel | null> {
  if (!programId) return null;
  const { data } = await createAdminClient()
    .from("programs")
    .select("program_level")
    .eq("id", programId)
    .maybeSingle();
  return (data?.program_level as ProgramLevel | undefined) ?? null;
});

// Student ids a professor may review: students enrolled in a course they teach,
// plus students in a program they lead (doctoral scholars may have no courses).
export async function reviewableStudentIds(professorId: string): Promise<string[]> {
  const admin = createAdminClient();
  const [{ data: courses }, { data: programs }] = await Promise.all([
    admin.from("courses").select("id").eq("professor_id", professorId),
    admin.from("programs").select("id").eq("professor_id", professorId),
  ]);
  const courseIds = (courses ?? []).map((c) => c.id);
  const programIds = (programs ?? []).map((p) => p.id);

  const [{ data: enrolled }, { data: inProgram }] = await Promise.all([
    courseIds.length
      ? admin.from("enrollments").select("student_id").in("course_id", courseIds)
      : Promise.resolve({ data: [] as { student_id: string }[] }),
    programIds.length
      ? admin.from("profiles").select("id").in("program_id", programIds)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  return [...new Set([...(enrolled ?? []).map((e) => e.student_id), ...(inProgram ?? []).map((p) => p.id)])];
}

export async function canReviewStudent(reviewer: Profile, studentId: string): Promise<boolean> {
  if (reviewer.role === "admin") return true;
  if (reviewer.role !== "professor" && reviewer.secondary_role !== "professor") return false;
  return (await reviewableStudentIds(reviewer.id)).includes(studentId);
}
