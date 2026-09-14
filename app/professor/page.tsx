import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import type { Course } from "@/lib/types";
import Link from "next/link";

export default async function ProfessorHomePage() {
  const profile = await requireRole(["professor"]);
  const supabase = await createClient();

  const { data: courses } = await supabase
    .from("courses")
    .select("*, programs(name)")
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

  const isNewProfessor = (courses ?? []).length === 0;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Modules</h1>

      {isNewProfessor && (
        <div className="mt-4 rounded-xl border-2 border-gold/50 bg-amber-50 px-6 py-5">
          <p className="text-lg font-bold text-slate-900">Welcome to RBC, {profile.full_name?.split(" ")[0]}! 👋</p>
          <p className="mt-1 text-sm text-slate-600">Your professor account is all set up. Your assigned courses will appear here once the admin links them to your profile.</p>
          <p className="mt-3 text-sm text-slate-600">In the meantime, take a few minutes to get familiar with the portal:</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a href="/professor/getting-started" className="inline-block rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-gold/80">
              Read the Getting Started Guide →
            </a>
            <a href="/settings" className="inline-block rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
              Set Up Your Profile
            </a>
          </div>
        </div>
      )}

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
      {(() => {
        type CourseWithRelations = Course & { programs?: { name: string } | null };
        const NO_PROGRAM = "No program assigned";
        const groups = new Map<string, CourseWithRelations[]>();
        for (const course of (courses ?? []) as CourseWithRelations[]) {
          const programName = course.programs?.name ?? NO_PROGRAM;
          const list = groups.get(programName) ?? [];
          list.push(course);
          groups.set(programName, list);
        }
        const sortedGroups = [...groups.entries()].sort(([a], [b]) => a.localeCompare(b));

        if (sortedGroups.length === 0) {
          return <p className="mt-3 text-sm text-slate-500">No modules assigned yet.</p>;
        }

        return sortedGroups.map(([programName, programCourses]) => (
          <div key={programName} className="mt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{programName}</h3>
            <div className="mt-2 space-y-2">
              {programCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/professor/courses/${course.id}`}
                  className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
                >
                  <p className="font-semibold text-slate-900">
                    {course.title} {course.code ? <span className="text-slate-400">({course.code})</span> : null}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ));
      })()}
    </div>
  );
}
