import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Course } from "@/lib/types";
import Link from "next/link";

export default async function ProfessorHomePage() {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, cohorts(name), programs(name)")
    .eq("professor_id", profile.id)
    .order("created_at", { ascending: false });

  const courseIds = (courses ?? []).map((c) => c.id);

  const { data: assignments } = courseIds.length > 0
    ? await supabase.from("assignments").select("id, course_id").in("course_id", courseIds)
    : { data: [] };

  const assignmentIds = (assignments ?? []).map((a) => a.id);

  const { data: ungraded } = assignmentIds.length > 0
    ? await supabase
        .from("submissions")
        .select("*, profiles(full_name, email), assignments(title, course_id, points_possible, courses(title, code))")
        .in("assignment_id", assignmentIds)
        .is("grade", null)
        .order("submitted_at", { ascending: true })
    : { data: [] };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>

      {(ungraded ?? []).length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">Ungraded Submissions ({(ungraded ?? []).length})</h2>
          <div className="mt-3 space-y-2">
            {(ungraded ?? []).map((s) => (
              <Link
                key={s.id}
                href={`/professor/assignments/${s.assignment_id}`}
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm hover:border-gold"
              >
                <span className="font-medium text-slate-800">
                  {s.profiles?.full_name} <span className="text-slate-400">— {s.assignments?.title}</span>
                </span>
                <span className="text-slate-500">
                  {s.assignments?.courses?.title}
                  {s.assignments?.courses?.code ? ` (${s.assignments.courses.code})` : ""}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <h2 className="mt-6 text-lg font-semibold text-slate-800">Modules</h2>
      <div className="mt-3 space-y-2">
        {(courses ?? []).map((course: Course & { cohorts?: { name: string } | null; programs?: { name: string } | null }) => (
          <Link
            key={course.id}
            href={`/professor/courses/${course.id}`}
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
          >
            <p className="font-semibold text-slate-900">
              {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
            </p>
            <p className="text-sm text-slate-500">
              {course.cohorts?.name ?? "No cohort"}
              {course.programs?.name ? ` · ${course.programs.name}` : ""}
            </p>
          </Link>
        ))}
        {(courses ?? []).length === 0 && <p className="text-sm text-slate-500">No modules assigned yet.</p>}
      </div>
    </div>
  );
}
