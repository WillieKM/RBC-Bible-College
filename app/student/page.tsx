import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import Link from "next/link";

export default async function StudentHomePage() {
  const profile = await requireRole(["student"]);
  const supabase = await createClient();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, courses(*, cohorts(name))")
    .eq("student_id", profile.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">My Courses</h1>
      <div className="mt-6 space-y-2">
        {(enrollments ?? []).map((e) => (
          <Link
            key={e.id}
            href={`/student/courses/${e.courses.id}`}
            className="block rounded-lg border border-slate-200 bg-white px-4 py-3 hover:border-gold"
          >
            <p className="font-semibold text-slate-900">
              {e.courses.title} {e.courses.code ? <span className="text-slate-400">({e.courses.code})</span> : null}
            </p>
            <p className="text-sm text-slate-500">{e.courses.cohorts?.name ?? "No cohort"}</p>
          </Link>
        ))}
        {(enrollments ?? []).length === 0 && <p className="text-sm text-slate-500">You're not enrolled in any courses yet.</p>}
      </div>
    </div>
  );
}
